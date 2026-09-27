// Automated part of a Fieldbook review.
//
//   npm run review                       re-check every listed skill, write content/review.json
//   npm run review -- owner/repo/skill   check one skill (for a submission); prints a report only
//   npm run review -- owner/repo/skill path/to/SKILL.md
//
// It reads the published SKILL.md (and nothing else), checks the frontmatter,
// and looks for the risky patterns in the published taxonomies of skill
// threats: remote code piped to a shell, destructive commands, safety bypasses,
// secret handling, hidden instructions and obfuscated payloads. It reports the
// rule and line only. A clean result is not an audit: a person still reads
// the skill before it is listed. See REVIEWING.md.
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadContent } from './lib/data.mjs';
import { reviewState } from './lib/security.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RULES = {
  'remote-code': /\b(curl|wget|iwr|Invoke-WebRequest)\b[^\n|]*\|\s*(ba|z)?sh\b|\biex\b\s*\(|bash\s+<\(\s*curl/i,
  'destructive': /\brm\s+-[a-z]*r[a-z]*f?\s+(\/|~|\$HOME|\*)(\s|$)|\bmkfs\b|\bdd\s+if=|:\(\)\s*\{\s*:\|:&\s*\};:/i,
  'privilege': /\bsudo\b|\bchmod\s+(-R\s+)?777\b/i,
  'git-force': /\bgit\s+push\b[^\n]*(--force\b|\s-f\b)|--no-verify\b/i,
  'safety-bypass': /dangerously[-_ ]?skip|--yolo\b|bypass ?permissions|--dangerously/i,
  'secret-handling': /\b(cat|type|Get-Content)\s+[^\n]*\.env\b|\bprintenv\b|echo\s+\$\{?[A-Z_]*(KEY|TOKEN|SECRET|PASSWORD)/i,
  'hardcoded-secret': /\b(sk-(?:ant-|proj-)?[A-Za-z0-9_-]{20,}|ghp_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[abp]-[A-Za-z0-9-]{10,})/,
  'hidden-instruction': /ignore (all |any )?(previous|prior) instructions|<!--[\s\S]{0,400}?(instruction|you must|system)/i,
  'obfuscation': /base64\s+(-d|--decode)\s*\|\s*(ba)?sh|eval\s*\(\s*atob\(|\\x[0-9a-f]{2}(\\x[0-9a-f]{2}){20,}/i
};

export class FetchFailure extends Error {
  constructor(kind, retryable = false) { super(kind); this.kind = kind; this.retryable = retryable; }
}
export const sourceUrl = e => `https://raw.githubusercontent.com/${e.repo}/HEAD/${e.path}`;
export async function fetchSkill(repo, file, { fetchImpl = fetch } = {}) {
  let res;
  try { res = await fetchImpl(sourceUrl({ repo, path: file }), { headers: { 'User-Agent': 'fieldbook-review' }, signal: AbortSignal.timeout(20000) }); }
  catch { throw new FetchFailure('network', true); }
  if (!res.ok) throw new FetchFailure(`http-${res.status}`, res.status >= 500 && res.status <= 599);
  if (Number(res.headers.get('content-length')) > 1_000_000) throw new FetchFailure('response-too-large');
  const chunks = []; let size = 0;
  try {
    for await (const chunk of res.body) {
      size += chunk.length;
      if (size > 1_000_000) throw new FetchFailure('response-too-large');
      chunks.push(chunk);
    }
  } catch (error) { if (error instanceof FetchFailure) throw error; throw new FetchFailure('network', true); }
  return Buffer.concat(chunks).toString('utf8');
}

// A top-level YAML scalar: plain, quoted, or a block scalar (`>`, `|`, with
// chomping or indentation indicators) spread over indented lines.
export function scalar(frontmatter, key) {
  const lines = frontmatter.split(/\r?\n/);
  const at = lines.findIndex(line => line.startsWith(`${key}:`));
  if (at < 0) return null;
  const first = lines[at].slice(key.length + 1).trim();
  const more = [];
  for (let i = at + 1; i < lines.length && (/^\s/.test(lines[i]) || lines[i].trim() === ''); i++) more.push(lines[i].trim());
  while (more.length && more.at(-1) === '') more.pop();
  let value;
  if (/^[>|][+-]?\d*$/.test(first)) value = first[0] === '|' ? more.join('\n') : more.join(' ').replace(/\s+/g, ' ');
  else value = [first, ...more].join(' ').replace(/\s+/g, ' ');
  value = value.trim();
  if (/^".*"$/s.test(value)) value = value.slice(1, -1).replace(/\\"/g, '"');
  else if (/^'.*'$/s.test(value)) value = value.slice(1, -1).replace(/''/g, "'");
  return value || null;
}

export function check(text, skill) {
  const lines = text.split('\n');
  const fm = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  const field = key => fm && scalar(fm[1], key);
  const name = field('name');
  const description = field('description');
  const findings = [];
  lines.forEach((line, i) => { for (const [rule, rx] of Object.entries(RULES)) if (rx.test(line)) findings.push({ rule, line: i + 1 }); });
  const problems = [];
  if (!fm) problems.push('No YAML frontmatter.');
  if (!name) problems.push('Frontmatter has no name.');
  else if (skill && name !== skill) problems.push('Frontmatter name differs from the requested skill folder.');
  if (!description) problems.push('Frontmatter has no description.');
  else if (description.length < 40) problems.push('Description is too short to trigger reliably.');
  return { lines: lines.length, name, descriptionLength: description?.length || 0, findings, problems, sha256: createHash('sha256').update(text).digest('hex') };
}

export async function reviewEntries(entries, previous, { fetchText = e => fetchSkill(e.repo, e.path), checkedAt = new Date().toISOString().slice(0, 10) } = {}) {
  if (!entries.length) throw new Error('Refusing an empty review batch.');
  const out = {}; let failed = 0; let retained = 0;
  for (const e of entries) {
    const id = e.id.toLowerCase();
    try {
      const text = await fetchText(e);
      // A successful response always replaces the prior result, including changed
      // content, findings and invalid frontmatter. It never falls back to cache.
      const r = check(text, e.skill);
      out[id] = { checkedAt, lastAttemptAt: checkedAt, source: sourceUrl(e), status: 'current', ...r };
    } catch (error) {
      if (!(error instanceof FetchFailure)) throw error;
      failed += 1;
      const prior = previous[id];
      if (error.retryable && prior?.source === sourceUrl(e) && !reviewState(prior, e).paused) {
        out[id] = { ...prior, retained: true, lastAttemptAt: checkedAt, fetchError: error.kind };
        retained += 1;
      } else {
        out[id] = { status: 'unavailable', source: sourceUrl(e), checkedAt: null, lastAttemptAt: checkedAt,
          sha256: null, lines: 0, findings: [], problems: ['Review unavailable.'], fetchError: error.kind };
      }
    }
  }
  // Abort before replacing review.json. The daily step fails and its subsequent
  // commit step cannot run; stats already written in the runner are not pushed.
  if (failed * 10 > entries.length) throw new Error(`Review outage: ${failed}/${entries.length} fetches failed (>10%); review.json not written, no daily commit.`);
  return { reviews: out, failed, retained };
}

async function main() {
const [target, explicitPath] = process.argv.slice(2);
if (target) {
  const [owner, repoName, skill] = target.split('/');
  if (!owner || !repoName || !skill) throw new Error('Use owner/repo/skill');
  const repo = `${owner}/${repoName}`;
  const candidates = explicitPath ? [explicitPath] : [`skills/${skill}/SKILL.md`, `${skill}/SKILL.md`, `.agents/skills/${skill}/SKILL.md`, `.claude/skills/${skill}/SKILL.md`, 'SKILL.md'];
  let text = null, used = null;
  for (const p of candidates) { try { text = await fetchSkill(repo, p); used = p; break; } catch {} }
  if (!text) throw new Error(`No SKILL.md found. Pass the path: npm run review -- ${target} path/to/SKILL.md`);
  const r = check(text, skill);
  console.log(`${target}  (${used})`);
  console.log(`  ${r.lines} lines, description ${r.descriptionLength} characters, sha256 ${r.sha256}`);
  console.log(r.problems.length ? r.problems.map(p => `  problem: ${p}`).join('\n') : '  frontmatter: ok');
  console.log(r.findings.length ? r.findings.map(f => `  flag: ${f.rule} at line ${f.line}`).join('\n') : '  risky patterns: none found');
  console.log('  Next: read the whole skill and apply REVIEWING.md before listing it.');
} else {
  const { entries } = await loadContent(root);
  const previous = Object.fromEntries(entries.map(e => [e.id.toLowerCase(), e.review]));
  const result = await reviewEntries(entries, previous);
  await writeFile(path.join(root, 'content/review.json'), JSON.stringify(result.reviews, null, 1) + '\n');
  for (const e of entries) {
    const r = result.reviews[e.id.toLowerCase()];
    const state = reviewState(r, e);
    console.log(`${e.id}: ${r.retained ? 'last good retained' : r.status}; ${state.paused ? 'PAUSED' : 'review available'}`);
  }
  console.log(`Reviewed ${entries.length} skills: ${result.failed} fetch failures, ${result.retained} last-good results retained.`);
}
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
