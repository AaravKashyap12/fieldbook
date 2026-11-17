// Agent discovery files, the /agents/ page and the home directory preview.
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { loadContent } from './lib/data.mjs';
import { SITE } from './lib/shell.mjs';
import { TOOLS, SUPPORTED_VERSIONS } from './lib/mcp-core.mjs';
import { BROWSE } from './lib/browse.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const dist = path.join(root, 'dist');
const read = file => readFile(path.join(dist, file), 'utf8');
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
const { entries, categories } = await loadContent(root);
const available = entries.filter(e => !e.paused);
const paused = entries.filter(e => e.paused);
const exists = async url => { const p = new URL(url).pathname; const f = path.join(dist, decodeURIComponent(p)); const info = await stat(f).catch(() => null); return info && (info.isFile() || !!(await stat(path.join(f, 'index.html')).catch(() => null))); };

// ---------------------------------------------------------------- llms.txt
const llms = await read('llms.txt');
assert.ok(llms.startsWith(`# ${SITE.name}\n\n> `), 'llms.txt opens with an H1 and a summary blockquote');
for (const h of ['## Catalog', '## Guides', '## Agents', '## Optional']) assert.ok(llms.includes(`\n${h}\n`), `llms.txt has ${h}`);
assert.ok(llms.includes('not a security audit or a guarantee'), 'llms.txt states the review limit');
assert.ok(llms.includes('does not host an MCP endpoint'), 'llms.txt does not imply a hosted server');
assert.ok(llms.includes(`${available.length} available skills and ${paused.length} paused`), 'llms.txt counts are accurate');
const links = [...llms.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map(m => m[1]);
assert.ok(links.length >= 10);
for (const link of links) { assert.ok(link.startsWith(SITE.origin + '/'), `${link}: local link`); assert.ok(await exists(link), `${link}: generated target exists`); }

// ---------------------------------------------------------------- llms-full.txt
const full = await read('llms-full.txt');
for (const e of available) {
  assert.ok(full.includes(`- ID: ${e.id}\n`), `${e.id}: listed in llms-full.txt`);
  assert.ok(full.includes(`- Install: \`${e.install}\``), `${e.id}: exact install command`);
}
for (const e of paused) {
  assert.ok(full.includes(`(${e.id})`), `${e.id}: paused listing named`);
  assert.ok(!full.includes(e.install), `${e.id}: paused install command omitted`);
}
assert.equal((full.match(/^### /gm) || []).length, available.length, 'One entry per available listing');
assert.ok(full.includes('not a security audit or a guarantee'));

// ---------------------------------------------------------------- agents.json and index.json
const discovery = JSON.parse(await read('agents.json'));
assert.equal(discovery.mcp.hosted, false, 'No hosted MCP claim');
assert.equal(discovery.mcp.transport, 'stdio');
assert.equal(discovery.mcp.readOnly, true);
assert.deepEqual(discovery.mcp.protocolVersions, SUPPORTED_VERSIONS);
assert.deepEqual(discovery.mcp.tools.map(t => t.name), TOOLS.map(t => t.name));
assert.equal(discovery.catalog.availableCount, available.length);
assert.equal(discovery.catalog.pausedCount, paused.length);
for (const key of ['documentation', 'llms', 'llmsFull']) assert.ok(await exists(discovery[key]), `agents.json ${key} exists`);
assert.ok(await exists(discovery.catalog.url));
await stat(path.join(root, discovery.mcp.args[0]));
const index = JSON.parse(await read('index.json'));
const legacyKeys = ['id', 'name', 'url', 'author', 'repository', 'path', 'tasks', 'stack', 'source', 'category', 'summary', 'license', 'access', 'install', 'original', 'installs', 'today', 'week', 'stars', 'addedAt', 'reviewedAt', 'sourceRevision', 'scannedSource', 'reviewRetained', 'reviewStatus', 'paused'];
for (const s of index.skills) {
  for (const key of legacyKeys) assert.ok(Object.hasOwn(s, key), `${s.id}: index.json keeps ${key}`);
  assert.ok(categories.some(c => c.slug === s.categorySlug && c.name === s.category), `${s.id}: categorySlug matches category`);
}

// ---------------------------------------------------------------- /agents/ page
const agents = await read('agents/index.html');
assert.ok(agents.includes('Fieldbook does not host an MCP endpoint'), 'Agents page is explicit that nothing is hosted');
assert.ok(!/https?:\/\/[^"\s<]*\/(?:mcp|sse)(?:[/"?#\s<]|$)/.test(agents), 'No remote MCP URL is advertised');
for (const id of ['agent-clone', 'agent-claude', 'agent-codex', 'agent-json']) assert.ok(agents.includes(`data-copy="${id}"`) && agents.includes(`id="${id}"`), `${id}: copyable`);
const block = id => decode(agents.match(new RegExp(`<pre id="${id}"[^>]*><code>([\\s\\S]*?)</code></pre>`))[1]);
const config = JSON.parse(block('agent-json'));
assert.equal(config.mcpServers.fieldbook.command, 'node');
assert.ok(config.mcpServers.fieldbook.args[0].endsWith('/scripts/mcp.mjs'));
assert.ok(block('agent-claude').startsWith('claude mcp add fieldbook -- node /'), 'Claude Code command uses an absolute path');
assert.match(block('agent-codex'), /^\[mcp_servers\.fieldbook\]\ncommand = "node"\nargs = \["\/[^"]+\/scripts\/mcp\.mjs"\]$/);
for (const t of TOOLS) assert.ok(agents.includes(`<code>${t.name}</code>`), `${t.name}: documented`);
for (const v of SUPPORTED_VERSIONS) assert.ok(agents.includes(v), `${v}: documented`);

// ---------------------------------------------------------------- home: browse, agents entry, head and footer
const home = await read('index.html');
assert.ok(home.indexOf('id="browse-title"') < home.indexOf('id="tasks-title"'), 'Directory preview comes before the guides');
assert.ok(home.indexOf('data-deck') < home.indexOf('id="browse-title"'), 'Notebook stays in the cover');
assert.ok(home.includes('href="/agents/"') && home.includes('id="agents-band-title"'), 'Visible For agents entry');
assert.ok(home.includes('<link rel="alternate" type="application/json"') && home.includes('href="/llms.txt"'), 'Alternate discovery metadata');
const section = home.match(/<section class="wrap browse"[\s\S]*?<\/section>/)[0];
const rows = [...section.matchAll(/<li class="browse-row" data-stage="([^"]+)"( data-top="\d+"| hidden)>([\s\S]*?)<\/li>/g)];
const visible = rows.filter(m => m[2].startsWith(' data-top'));
assert.equal(visible.length, Math.min(BROWSE.all, available.length), 'No-script view shows the overall top rows');
const ranked = [...available].sort((a, b) => (b.stats.installs ?? -1) - (a.stats.installs ?? -1) || a.name.localeCompare(b.name));
assert.deepEqual(visible.map(m => m[3].match(/<h3><a href="([^"]+)"/)[1]), ranked.slice(0, BROWSE.all).map(e => e.url), 'Top rows follow install order');
for (const [, , , body] of rows) {
  const url = body.match(/<h3><a href="([^"]+)"/)[1];
  const entry = entries.find(e => e.url === url);
  assert.ok(entry && !entry.paused, `${url}: preview lists available skills only`);
  assert.equal(decode(body.match(/<code id="[^"]+" tabindex="-1" class="sr-only">([^<]*)<\/code>/)[1]), entry.install, `${url}: copy target is the listing's command`);
}
for (const c of categories) {
  const n = available.filter(e => e.category === c.slug).length;
  if (!n) continue;
  assert.ok(section.includes(`href="/c/${c.slug}/" data-browse-tab="${c.slug}" data-count="${n}"`), `${c.slug}: tab links to the stage page with an accurate count`);
  assert.equal(rows.filter(m => m[1] === c.slug).length >= Math.min(BROWSE.stage, n), true, `${c.slug}: enough rows for its tab`);
}
assert.ok(section.includes('not a security audit or a guarantee') && section.includes('Copying a command does not run it'), 'Preview keeps the install disclaimers');
assert.ok(section.includes(`data-browse-list data-per-stage="${BROWSE.stage}"`), 'Served per-stage limit matches the build');
assert.ok(!section.includes('browse-rank'), 'Preview entries carry no rank column');
for (const route of ['index.html', 'skills/index.html', `${available[0].url.slice(1)}index.html`]) assert.ok((await read(route)).includes('<a href="/agents/">For agents</a>'), `${route}: footer link`);
const serve = await readFile(path.join(root, 'scripts/serve.mjs'), 'utf8');
assert.ok(serve.includes("'.json':'application/json") && serve.includes("'.md':'text/markdown"), 'Local server sends JSON and Markdown types');

// ---------------------------------------------------------------- browse tabs: production app code with DOM doubles
const app = await readFile(path.join(root, 'assets/app.js'), 'utf8');
const code = app.slice(app.indexOf('// Home directory preview.'));
const makeRow = (stage, top) => {
  const attrs = top ? { 'data-top': '1' } : {};
  const order = { n: null };
  return { dataset: { stage }, hidden: !top, order, style: { setProperty(k, v) { if (k === '--n') order.n = v; } }, hasAttribute: k => k in attrs };
};
const fakeRows = [makeRow('review', true), makeRow('build', true), makeRow('review', false), makeRow('review', false), makeRow('review', false), makeRow('plan', false)];
const tab = (slug, count, label) => { const a = { dataset: { browseTab: slug, count: String(count), label }, attrs: {}, getAttribute(k) { return k === 'href' ? `/c/${slug}/` : this.attrs[k] ?? null; }, setAttribute(k, v) { this.attrs[k] = v; }, removeAttribute(k) { delete this.attrs[k]; }, closest() { return this; } }; return a; };
const tabs = [tab('all', 5, 'All'), tab('review', 3, 'Review')];
tabs[0].attrs['aria-current'] = 'true';
let onClick;
const status = { textContent: '' };
const more = { href: '/skills/', firstChild: { nodeValue: 'Open the full directory ' } };
const list = { children: fakeRows, dataset: { perStage: '3' }, classList: { add() {}, remove() {} }, offsetWidth: 0 };
let sound = 0;
runInNewContext(code, {
  document: { querySelector: s => ({ '[data-browse-tabs]': { querySelectorAll: () => tabs, addEventListener: (type, fn) => { onClick = fn; } }, '[data-browse-list]': list, '[data-browse-status]': status, '[data-browse-more]': more })[s] },
  reduceMotion: { matches: true }, play: () => { sound++; }
});
let prevented = false;
onClick({ target: tabs[1], button: 0, preventDefault: () => { prevented = true; } });
assert.ok(prevented, 'Plain click filters in place');
assert.deepEqual(fakeRows.map(r => r.hidden), [false, true, false, false, true, true], 'Stage tab shows only that stage, up to the per-stage limit');
assert.deepEqual(fakeRows.filter(r => !r.hidden).map(r => r.order.n), [1, 2, 3], 'Entrance stagger restarts within the stage');
assert.equal(status.textContent, 'Top 3 of 3 in Review');
assert.equal(more.href, '/c/review/');
assert.equal(tabs[1].attrs['aria-current'], 'true'); assert.equal(tabs[0].attrs['aria-current'], undefined);
assert.equal(sound, 1, 'Switching plays the toggle cue');
prevented = false;
onClick({ target: tabs[0], button: 0, metaKey: true, preventDefault: () => { prevented = true; } });
assert.ok(!prevented, 'Modified clicks keep normal link behaviour');
onClick({ target: tabs[0], button: 0, preventDefault() {} });
assert.deepEqual(fakeRows.map(r => r.hidden), [false, false, true, true, true, true], 'All returns to the overall top rows');
assert.equal(more.firstChild.nodeValue, 'Open the full directory ');
console.log(`Passed: llms.txt and llms-full.txt (${available.length} available, ${paused.length} paused without commands), agents.json, index.json compatibility, /agents/ setup, home directory preview and stage tab wiring.`);
