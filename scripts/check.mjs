import { readFile, stat, readdir } from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { loadContent, ACCESS } from './lib/data.mjs';
import { headScript } from './lib/shell.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');

// ------------------------------------------------------------ content
const { entries, categories, kits } = await loadContent(root);
const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
for (const e of entries) {
  const where = e.id;
  assert.match(e.id, /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+\/[a-z0-9-]+$/, `${where}: id must be owner/repo/skill`);
  assert.match(e.skill, slug, `${where}: skill folder must be lowercase with hyphens`);
  assert.ok(e.path.endsWith('SKILL.md'), `${where}: path must point at SKILL.md`);
  assert.ok(e.name && e.summary, `${where}: name and summary are required`);
  assert.ok(e.original || e.note, `${where}: community listings need a review note`);
  assert.ok(e.license && e.license !== 'None', `${where}: a licence is required`);
  assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.addedAt), `${where}: addedAt must be YYYY-MM-DD`);
  for (const a of e.access) assert.ok(ACCESS[a], `${where}: unknown access label ${a}`);
  if (e.readAt != null) assert.ok(/^\d{4}-\d{2}-\d{2}$/.test(e.readAt), `${where}: readAt must be YYYY-MM-DD`);
  assert.ok(e.install.startsWith('npx skills@latest add '), `${where}: install must use the Skills CLI`);
  if (e.original) assert.ok(e.data.repo && e.data.source && e.data.install.length, `${where}: incomplete installation information`);
}
for (const c of categories) assert.match(c.slug, slug);
const ids = new Set(entries.map(e => e.id));
for (const k of kits) for (const id of k.ids) assert.ok(ids.has(id), `Kit ${k.slug} lists unknown skill ${id}`);

// ------------------------------------------------------------ output
async function files(dir) { const result = []; for (const item of await readdir(dir, { withFileTypes: true })) { const f = path.join(dir, item.name); if (item.isDirectory()) result.push(...await files(f)); else result.push(f); } return result; }
const all = await files(dist);
const htmlFiles = all.filter(f => f.endsWith('.html'));
for (const file of htmlFiles) {
  const html = await readFile(file, 'utf8');
  const rel = path.relative(dist, file);
  assert.equal((html.match(/<h1[ >]/g) || []).length, 1, `${rel}: one h1 required`);
  assert.ok(!/C:\\Users\\|TODO|undefined|NaN|\[object Object\]/.test(html), `${rel}: local or placeholder content`);
  const idList = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(idList).size, idList.length, `${rel}: duplicate IDs`);
  for (const match of html.matchAll(/\b(?:href|src|action)="(\/(?!\/)[^"]*)"/g)) {
    const [url, hash] = match[1].split('#');
    let target = path.join(dist, decodeURIComponent(url.split('?')[0]));
    const info = await stat(target).catch(() => null);
    assert.ok(info, `${rel}: missing internal target ${url}`);
    if (info.isDirectory()) target = path.join(target, 'index.html');
    await stat(target);
    if (hash) { const targetHtml = await readFile(target, 'utf8'); assert.ok(targetHtml.includes(`id="${hash}"`), `${rel}: missing anchor ${match[1]}`); }
  }
  for (const match of html.matchAll(/data-copy="([^"]+)"/g)) assert.ok(idList.includes(match[1]), `${rel}: missing copy target ${match[1]}`);
  for (const match of html.matchAll(/aria-(?:labelledby|controls|describedby)="([^"]+)"/g)) for (const ref of match[1].split(' ')) assert.ok(idList.includes(ref), `${rel}: missing ARIA reference ${ref}`);
}
for (const f of ['fonts/geist-latin.woff2', 'fonts/OFL.txt', 'social-preview.png', 'feed.xml', 'index.json', 'sitemap.xml', '.well-known/security.txt']) await stat(path.join(dist, f));
const data = JSON.parse(await readFile(path.join(dist, 'index.json'), 'utf8'));
assert.equal(data.skills.length, entries.length, 'index.json must list every skill');
const feed = await readFile(path.join(dist, 'feed.xml'), 'utf8');
assert.equal((feed.match(/<item>/g) || []).length, entries.filter(e => !e.paused).length, 'feed.xml must list every skill');
const vercel = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
const csp = vercel.headers.flatMap(h => h.headers).find(h => h.key === 'Content-Security-Policy')?.value || '';
const hash = createHash('sha256').update(headScript).digest('base64');
assert.ok(csp.includes(`'sha256-${hash}'`), 'vercel.json CSP must allow the current theme script by hash; run npm run build');
assert.equal(vercel.outputDirectory, 'dist', 'vercel.json must serve dist');
console.log(`Passed: ${entries.length} skills in ${categories.length} categories and ${kits.length} kits; ${htmlFiles.length} pages with valid links, anchors, ARIA references and copy targets; feed, data export and Vercel headers present.`);

const requiredHeaders = {
  'Strict-Transport-Security': 'max-age=63072000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY',
  'Cross-Origin-Opener-Policy': 'same-origin'
};
const globalHeaders = Object.fromEntries(vercel.headers.find(h => h.source === '/(.*)').headers.map(h => [h.key, h.value]));
for (const [name, value] of Object.entries(requiredHeaders)) assert.equal(globalHeaders[name], value, name);
for (const directive of ["default-src 'self'", "object-src 'none'", "base-uri 'self'", "frame-ancestors 'none'", "form-action 'self' https://github.com"]) assert.ok(csp.split('; ').includes(directive), directive);
assert.equal(vercel.buildCommand, 'npm run build');
for (const redirect of vercel.redirects || []) {
  assert.ok(redirect.destination.startsWith('/') && !redirect.destination.startsWith('//'), 'Redirect stays local');
  await stat(path.join(dist, redirect.destination, 'index.html'));
}
for (const e of entries.filter(e => e.paused)) {
  const exported = data.skills.find(s => s.id === e.id);
  assert.equal(exported.install, null, e.id + ': paused install export');
  const html = await readFile(path.join(dist, e.url, 'index.html'), 'utf8');
  assert.ok(!html.includes('data-copy='), e.id + ': paused detail exposes copy controls');
}
console.log('Passed: required Vercel headers, local redirects, CSP restrictions and paused-entry exports.');
