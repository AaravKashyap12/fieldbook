import assert from 'node:assert/strict';
import { cp, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { installCommand, loadContent } from './lib/data.mjs';
import { isRevision, reviewedRevision, sourceUrl } from './lib/revisions.mjs';
import { check, createReviewFetcher, FetchFailure, reviewEntries } from './review.mjs';
import { reviewState } from './lib/security.mjs';
import { installCaution, reviewEvidence } from './lib/parts.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const revision = 'a'.repeat(40);
const entry = { id: 'owner/repo/sample', repo: 'owner/repo', skill: 'sample', path: 'skills/sample/SKILL.md' };
const text = '---\nname: sample\ndescription: A sufficiently detailed engineering skill for a local regression fixture.\n---\nRead the project documentation.\n';
const checkedAt = '2026-01-01';
const record = { ...check(text, entry.skill), checkedAt, source: sourceUrl(entry), revision, pinnedSource: sourceUrl(entry, revision) };
assert.equal(installCommand(entry.repo, entry.skill, revision), `npx skills@latest add https://github.com/owner/repo/tree/${revision} --skill sample`, 'A scanned revision must determine the install checkout');
assert.equal(installCommand(entry.repo, entry.skill), 'npx skills@latest add owner/repo --skill sample');
for (const invalid of ['HEAD', 'main', 'a'.repeat(39), 'a'.repeat(41), `${revision};echo unsafe`, null, 42]) {
  assert.equal(isRevision(invalid), false);
  if (invalid !== null) assert.throws(() => installCommand(entry.repo, entry.skill, invalid), /full commit SHA/);
}
assert.equal(reviewedRevision(record, entry), revision);
for (const bad of [
  { ...record, revision: 'main' }, { ...record, source: sourceUrl({ ...entry, repo: 'other/repo' }) },
  { ...record, pinnedSource: sourceUrl(entry) }, { ...record, sha256: 'a'.repeat(16) },
  { ...record, revision: null }, { ...record, pinnedSource: null },
  { ...record, revision: null, pinnedSource: null }
]) {
  assert.equal(reviewedRevision(bad, entry), null);
  assert.equal(reviewState(bad, entry).paused, true, 'Malformed pin cannot retain install access');
}
const legacy = { ...record }; delete legacy.revision; delete legacy.pinnedSource;
assert.equal(reviewState(legacy, entry).paused, false, 'Legacy reviews remain usable but unpinned');
assert.equal(reviewState({ ...legacy, revision: null }, entry).paused, true);
assert.equal(reviewState({ ...legacy, pinnedSource: null }, entry).paused, true);

const calls = [];
const fetchSource = createReviewFetcher({ token: 'fixture-token', fetchImpl: async (url, options) => {
  calls.push({ url, options });
  return new Response(url.startsWith('https://api.github.com/') ? revision : text);
} });
const source = await fetchSource(entry);
await fetchSource({ ...entry, path: 'second/SKILL.md' });
assert.deepEqual(source, { text, revision });
assert.equal(calls.length, 3, 'One revision lookup per repository, even with multiple skills');
assert.equal(calls[1].url, sourceUrl(entry, revision), 'Fetches the immutable file, never HEAD');
assert.equal(calls[2].url, sourceUrl({ ...entry, path: 'second/SKILL.md' }, revision));
assert.equal(calls[0].options.headers.Authorization, 'Bearer fixture-token');
assert.equal(calls[1].options.headers.Authorization, undefined, 'Token is not forwarded to raw downloads');
assert.equal(calls[0].options.redirect, 'error', 'Authenticated resolver does not follow redirects');
for (const [body, status, kind] of [['main', 200, 'invalid-revision'], ['', 404, 'http-404'], ['', 429, 'http-429'], ['', 503, 'http-503'], ['x'.repeat(1_000_001), 200, 'response-too-large']]) {
  let requests = 0;
  const fail = createReviewFetcher({ token: null, fetchImpl: async () => { requests++; return new Response(body, { status }); } });
  await assert.rejects(() => fail(entry), error => error instanceof FetchFailure && error.kind === kind);
  await assert.rejects(() => fail(entry));
  assert.equal(requests, 1, 'Failed resolution is cached for this batch; no fallback to HEAD');
}
const batch = Array.from({ length: 10 }, (_, i) => ({ ...entry, id: `${entry.id}-${i}` }));
const previous = Object.fromEntries(batch.map(e => [e.id, record]));
const retained = await reviewEntries(batch, previous, { checkedAt: '2026-01-02', fetchSource: async e => {
  if (e.id.endsWith('-0')) throw new FetchFailure('network', true);
  return { text, revision: 'b'.repeat(40) };
} });
assert.equal(retained.reviews[batch[0].id].revision, revision);
assert.equal(retained.reviews[batch[0].id].checkedAt, checkedAt);
assert.equal(retained.reviews[batch[0].id].pinnedSource, record.pinnedSource);
assert.equal(retained.reviews[batch[1].id].revision, 'b'.repeat(40));
assert.equal(retained.reviews[batch[1].id].pinnedSource, sourceUrl(entry, 'b'.repeat(40)));
assert.equal(retained.reviews[batch[1].id].sha256, check(text, entry.skill).sha256);
const unavailable = await reviewEntries(batch, previous, { fetchSource: async e => ({ text, revision: e.id.endsWith('-0') ? 'main' : revision }) });
assert.equal(unavailable.reviews[batch[0].id].status, 'unavailable', 'Invalid revision cannot retain an old pin');

// Exercise the real loader and builder without replacing repository data.
const fixture = await mkdtemp(path.join(tmpdir(), 'fieldbook-revisions-'));
try {
  for (const name of ['assets', 'content', 'scripts', 'package.json', 'vercel.json']) await cp(path.join(root, name), path.join(fixture, name), { recursive: true });
  const { entries, kits } = await loadContent(root);
  const reviews = JSON.parse(await readFile(path.join(fixture, 'content/review.json'), 'utf8'));
  const original = entries.find(e => e.original && !e.paused);
  const community = entries.find(e => !e.original && !e.paused && kits.some(k => k.ids.includes(e.id)));
  for (const e of [original, community]) reviews[e.id.toLowerCase()] = { ...reviews[e.id.toLowerCase()], revision, pinnedSource: sourceUrl(e, revision) };
  await writeFile(path.join(fixture, 'content/review.json'), JSON.stringify(reviews));
  const normalized = (await loadContent(fixture)).entries;
  for (const e of [original, community]) {
    const pinned = normalized.find(x => x.id === e.id);
    assert.equal(pinned.revision, revision);
    assert.ok(pinned.install.includes(`/tree/${revision}`));
    assert.ok(pinned.sourceUrl.includes(`/blob/${revision}/`));
    assert.ok(reviewEvidence(pinned).includes('Only SKILL.md was scanned'));
    assert.ok(!installCaution(pinned).includes('not a pinned reviewed revision'));
  }
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture, stdio: 'pipe' });
  const exported = JSON.parse(await readFile(path.join(fixture, 'dist/index.json'), 'utf8'));
  for (const e of [original, community]) {
    const pinned = normalized.find(x => x.id === e.id);
    const html = await readFile(path.join(fixture, `dist${e.url}index.html`), 'utf8');
    assert.ok(html.includes(pinned.install), 'Original and community detail pages use the pinned command');
    assert.ok(html.includes(pinned.sourceUrl));
    assert.ok(!html.includes('not a pinned reviewed revision'));
    const item = exported.skills.find(x => x.id === e.id);
    assert.equal(item.install, pinned.install);
    assert.equal(item.sourceRevision, revision);
    assert.equal(item.scannedSource, sourceUrl(e, revision));
  }
  const kit = kits.find(k => k.ids.includes(community.id));
  const kitHtml = await readFile(path.join(fixture, `dist/kits/${kit.slug}/index.html`), 'utf8');
  assert.ok(kitHtml.includes(normalized.find(e => e.id === community.id).install));
  assert.ok(installCaution([{ revision }, {}]).includes('1 of 2 commands'));
  reviews[community.id.toLowerCase()].pinnedSource = 'https://example.com/wrong-source';
  await writeFile(path.join(fixture, 'content/review.json'), JSON.stringify(reviews));
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: fixture, stdio: 'pipe' });
  const paused = await readFile(path.join(fixture, `dist${community.url}index.html`), 'utf8');
  assert.ok(paused.includes('Installation paused'));
  assert.ok(!paused.includes('data-copy='));
  const pausedExport = JSON.parse(await readFile(path.join(fixture, 'dist/index.json'), 'utf8')).skills.find(e => e.id === community.id);
  assert.equal(pausedExport.install, null);
  assert.equal(pausedExport.sourceRevision, null);
} finally { await rm(fixture, { recursive: true, force: true }); }
console.log('Passed: immutable review fetches, commit-pinned installs, legacy/retained/invalid states, original and community pages, kits and exports (offline fixtures).');
