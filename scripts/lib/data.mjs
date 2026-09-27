// Loads every content source and returns one normalised list of entries,
// Fieldbook originals and reviewed community skills alike, with their
// review evidence and install statistics attached.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { count, deltaValue, day as validDay, reviewState } from './security.mjs';

const json = async file => JSON.parse(await readFile(file, 'utf8'));
const optional = async (file, fallback) => { try { return await json(file); } catch { return fallback; } };

export const ACCESS = {
  edits: { label: 'Edits code', hint: 'Changes files in your project.' },
  docs: { label: 'Writes docs', hint: 'Creates or updates documents such as specs, plans or ADRs.' },
  commands: { label: 'Runs commands', hint: 'Runs shell commands such as tests, builds or installs.' },
  git: { label: 'Uses git', hint: 'Reads history or makes commits, branches or worktrees.' },
  subagents: { label: 'Subagents', hint: 'Starts other agents to work in parallel.' },
  browser: { label: 'Browser', hint: 'Drives a real browser.' },
  mcp: { label: 'Needs MCP', hint: 'Requires an MCP server to be configured.' },
  network: { label: 'Network', hint: 'Reaches external services or the web.' }
};

export const installCommand = (repo, skill) => `npx skills@latest add ${repo} --skill ${skill}`;
export const entryUrl = (owner, skill) => `/skills/${owner.toLowerCase()}/${skill}/`;

// Snapshots are dated JSON files written by scripts/sync-stats.mjs.
async function loadSnapshots(dir) {
  let files = [];
  try { files = (await readdir(dir)).filter(f => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort(); } catch { return []; }
  return Promise.all(files.map(f => json(path.join(dir, f))));
}

// The newest snapshot taken at least `hours` before the latest one.
function baseline(snapshots, hours) {
  const latest = snapshots.at(-1);
  if (!latest) return null;
  const limit = Date.parse(latest.fetchedAt) - hours * 3600e3;
  for (let i = snapshots.length - 2; i >= 0; i--) if (Date.parse(snapshots[i].fetchedAt) <= limit) return snapshots[i];
  return null;
}

export async function loadContent(root) {
  const c = p => path.join(root, 'content', p);
  const [originals, community, categories, authors, review, kits, snapshots] = await Promise.all([
    json(c('skills.json')), json(c('directory.json')), json(c('categories.json')), json(c('authors.json')),
    optional(c('review.json'), {}), optional(c('kits.json'), []), loadSnapshots(c('stats'))
  ]);
  const latest = snapshots.at(-1) || null;
  const day = baseline(snapshots, 20);
  const week = baseline(snapshots, 6 * 24);
  const catBy = Object.fromEntries(categories.map(x => [x.slug, x]));

  const stat = (id, repo) => {
    const key = id.toLowerCase();
    const installs = count(latest?.installs?.[key]);
    const diff = base => { const previous = count(base?.installs?.[key]); return installs != null && previous != null ? deltaValue(installs - previous) : null; };
    return { installs, today: diff(day), week: diff(week), stars: count(latest?.stars?.[repo]), pushed: validDay(latest?.pushed?.[repo]) };
  };

  const fromOriginal = s => {
    const [owner, repoName] = s.repo.replace('https://github.com/', '').split('/');
    const repo = `${owner}/${repoName}`;
    const skillPath = s.source.split('/blob/')[1].split('/').slice(1).join('/');
    const id = `${repo}/${s.slug}`;
    return {
      id, owner, repo, skill: s.slug, path: skillPath, name: s.name, category: s.group, summary: s.summary,
      note: s.note, access: s.access || [], cleared: s.cleared || {}, clearedSha256: s.clearedSha256, license: s.license, addedAt: s.addedAt, readAt: s.readAt || null, original: true, data: s,
      install: s.install?.[0]?.command || installCommand(repo, s.slug)
    };
  };
  const fromCommunity = e => {
    const [owner, repoName, skill] = e.id.split('/');
    const repo = `${owner}/${repoName}`;
    return { ...e, owner, repo, skill, original: false, install: installCommand(repo, skill) };
  };

  const entries = [...originals.map(fromOriginal), ...community.map(fromCommunity)].map(e => {
    const author = authors[e.owner] || { name: e.owner, url: `https://github.com/${e.owner}` };
    const category = catBy[e.category];
    if (!category) throw new Error(`${e.id}: unknown category "${e.category}"`);
    return {
      ...e, author, categoryInfo: category, url: entryUrl(e.owner, e.skill),
      repoUrl: `https://github.com/${e.repo}`, source: `https://github.com/${e.repo}/blob/HEAD/${e.path}`,
      stats: stat(e.id, e.repo), review: review[e.id.toLowerCase()] || null,
      ...reviewState(review[e.id.toLowerCase()], e)
    };
  });

  const ids = new Set();
  for (const e of entries) {
    if (ids.has(e.url)) throw new Error(`Duplicate listing URL ${e.url}`);
    ids.add(e.url);
    for (const a of e.access) if (!ACCESS[a]) throw new Error(`${e.id}: unknown access "${a}"`);
  }

  return {
    entries, originals: entries.filter(e => e.original), categories, authors, kits,
    snapshots: { count: snapshots.length, latest, hasDay: Boolean(day), hasWeek: Boolean(week) }
  };
}
