// Daily statistics snapshot.
//
// Install counts come from skills.sh, through the same public search endpoint
// its open-source CLI uses (github.com/vercel-labs/skills, src/find.ts). Stars
// and last-push dates come from the GitHub API. The script is deliberately
// slow: skills.sh rate-limits bursts, so it waits between requests and backs
// off on HTTP 429. Run it once a day (CI) or by hand: npm run sync.
//
// Output: content/stats/YYYY-MM-DD.json. The build compares the newest
// snapshot with older ones to produce "today" and "this week" movement.
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadContent } from './lib/data.mjs';
import { count, day } from './lib/security.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'content/stats');
const KEEP_DAYS = 60;
const GAP_MS = Math.max(2100, Number(process.env.SYNC_GAP_MS) || 2100);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = { 'User-Agent': 'fieldbook-sync (+https://fieldbook.tech)' };

async function getJson(url, headers = {}, tries = 4) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    const res = await fetch(url, { headers: { ...UA, ...headers } });
    if (res.ok) return res.json();
    if (res.status === 429 || res.status >= 500) {
      const wait = Number(res.headers.get('retry-after')) * 1000 || 15000 * attempt;
      console.warn(`  ${res.status} on ${new URL(url).pathname}; waiting ${Math.round(wait / 1000)}s`);
      await sleep(wait);
      continue;
    }
    throw new Error(`${res.status} ${url}`);
  }
  throw new Error(`Gave up after ${tries} attempts: ${url}`);
}

const { entries } = await loadContent(root);
const installs = {};
const missing = [];
for (const e of entries) {
  const params = new URLSearchParams({ q: e.skill, owner: e.owner, limit: '20' });
  try {
    const data = await getJson(`https://skills.sh/api/search?${params}`);
    const hit = (data.skills || []).find(s => String(s.id).toLowerCase() === e.id.toLowerCase());
    if (hit && count(hit.installs) != null) installs[e.id.toLowerCase()] = count(hit.installs);
    else missing.push(e.id);
  } catch (err) {
    missing.push(e.id);
    console.warn(`  ${e.id}: ${err.message}`);
  }
  await sleep(GAP_MS);
}

const gh = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};
const stars = {};
const pushed = {};
for (const repo of [...new Set(entries.map(e => e.repo))]) {
  try {
    const r = await getJson(`https://api.github.com/repos/${repo}`, { ...gh, Accept: 'application/vnd.github+json' }, 2);
    stars[repo] = count(r.stargazers_count);
    pushed[repo] = day(typeof r.pushed_at === 'string' ? r.pushed_at.slice(0, 10) : null);
  } catch (err) {
    console.warn(`  ${repo}: ${err.message}`);
  }
}

const now = new Date();
const date = now.toISOString().slice(0, 10);
await mkdir(dir, { recursive: true });
await writeFile(path.join(dir, `${date}.json`), JSON.stringify({ date, fetchedAt: now.toISOString(), source: 'skills.sh/api/search; api.github.com', installs, stars, pushed, missing }, null, 1) + '\n');

// Keep a rolling window so the repository does not grow forever.
const cutoff = new Date(now.getTime() - KEEP_DAYS * 864e5).toISOString().slice(0, 10);
for (const f of await readdir(dir)) if (/^\d{4}-\d{2}-\d{2}\.json$/.test(f) && f.slice(0, 10) < cutoff) await rm(path.join(dir, f));

console.log(`Snapshot ${date}: ${Object.keys(installs).length} install counts, ${Object.keys(stars).length} repositories${missing.length ? `, ${missing.length} not found on skills.sh (${missing.join(', ')})` : ''}.`);
