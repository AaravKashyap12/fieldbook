// Process-level checks for the read-only MCP server. Each session starts
// scripts/mcp.mjs as a child process from an unrelated working directory and
// speaks newline-delimited JSON-RPC over stdio. Requires a prior npm run build.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, writeFile, rm, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer, TOOLS, SUPPORTED_VERSIONS } from './lib/mcp-core.mjs';

const server = fileURLToPath(new URL('./mcp.mjs', import.meta.url));
const catalog = JSON.parse(await readFile(new URL('../dist/index.json', import.meta.url), 'utf8'));
const paused = catalog.skills.filter(s => s.paused);
const available = catalog.skills.filter(s => !s.paused);
assert.ok(available.length > 0, 'The built catalog needs available listings');
// Real paused listings are checked when the build has any; the in-process fixture below always covers suppression.
const sample = paused[0] || available[0];
let checks = 0;
const ok = (value, message) => { assert.ok(value, message); checks++; };
const eq = (actual, expected, message) => { assert.deepEqual(actual, expected, message); checks++; };

// Send raw lines, close stdin, and collect every response line.
async function session(lines, { cwd = tmpdir() } = {}) {
  const child = spawn(process.execPath, [server], { cwd, stdio: ['pipe', 'pipe', 'pipe'], env: { PATH: process.env.PATH } });
  let out = '', err = '';
  child.stdout.setEncoding('utf8').on('data', d => { out += d; });
  child.stderr.setEncoding('utf8').on('data', d => { err += d; });
  for (const line of lines) child.stdin.write((typeof line === 'string' ? line : JSON.stringify(line)) + '\n');
  child.stdin.end();
  const code = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('MCP server did not exit within 10s')); }, 10000);
    child.on('exit', c => { clearTimeout(timer); resolve(c); });
  });
  assert.equal(code, 0, `server exited ${code}: ${err}`);
  const responses = out.split('\n').filter(Boolean).map(l => JSON.parse(l));
  return { responses, byId: id => responses.find(r => r.id === id), err };
}
const init = (version = '2025-11-25', id = 'init') => ({ jsonrpc: '2.0', id, method: 'initialize', params: { protocolVersion: version, capabilities: {}, clientInfo: { name: 'fieldbook-check', version: '0' } } });
const initialized = { jsonrpc: '2.0', method: 'notifications/initialized' };
const call = (id, name, args) => ({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } });
const META = { 'io.modelcontextprotocol/protocolVersion': '2026-07-28', 'io.modelcontextprotocol/clientCapabilities': {}, 'io.modelcontextprotocol/clientInfo': { name: 'fieldbook-check', version: '0' } };
const modern = (id, method, params = {}, meta = META) => ({ jsonrpc: '2.0', id, method, params: { ...params, _meta: meta } });

// ---------------------------------------------------------------- legacy handshake and tools
const legacy = await session([
  { jsonrpc: '2.0', id: 'early', method: 'tools/list' },
  { jsonrpc: '2.0', id: 'early-ping', method: 'ping' },
  init(),
  initialized,
  { jsonrpc: '2.0', id: 'again', method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {} } },
  { jsonrpc: '2.0', id: 1, method: 'ping' },
  { jsonrpc: '2.0', id: 2, method: 'tools/list' },
  call(3, 'search_skills', { query: 'review', limit: 3 }),
  call(4, 'search_skills', { includePaused: true, limit: 25, query: '' }),
  call(5, 'get_skill', { id: sample.id }),
  call(6, 'get_skill', { id: available[0].id }),
  call(7, 'get_skill', { id: '../../etc/passwd' }),
  call(8, 'get_skill', { id: 'nobody/nothing/missing' }),
  call(9, 'search_skills', { limit: 1000 }),
  call(10, 'search_skills', { query: 'x'.repeat(201) }),
  call(11, 'search_skills', { path: '/etc/passwd' }),
  call(12, 'run_install', {}),
  { jsonrpc: '2.0', id: 13, method: 'tools/call', params: { name: 'search_skills', arguments: 'oops' } },
  { jsonrpc: '2.0', id: 14, method: 'resources/list' },
  { jsonrpc: '2.0', id: 15, method: 'resources/read', params: { uri: 'fieldbook://catalog' } },
  { jsonrpc: '2.0', id: 16, method: 'resources/read', params: { uri: 'file:///etc/passwd' } },
  { jsonrpc: '2.0', id: 17, method: 'prompts/list' },
  { jsonrpc: '2.0', id: 'str-id', method: 'ping' },
  call(18, 'search_skills', { task: 'fix-bug', limit: 25 }),
  call(19, 'search_skills', { category: 'review', limit: 25 }),
  call(20, 'search_skills', { task: 'Not A Slug' }),
  { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 'already-finished' } }
]);
const r = legacy.byId;
eq(r('early').error.code, -32600, 'Requests before initialize are rejected');
ok(/initialize/.test(r('early').error.message), 'Pre-initialize error says what to do');
eq(r('early-ping').result, {}, 'Ping is allowed before initialize');
eq(r('init').result.protocolVersion, '2025-11-25');
eq(r('init').result.capabilities, { tools: {}, resources: {} });
eq(r('init').result.serverInfo.name, 'fieldbook');
ok(/never runs them/.test(r('init').result.instructions), 'Instructions state the read-only boundary');
eq(r('again').error.code, -32600, 'Second initialize is rejected');
eq(r(1).result, {});
eq(r(2).result.tools.map(t => t.name), ['search_skills', 'get_skill']);
for (const tool of r(2).result.tools) {
  eq(tool.annotations.readOnlyHint, true, `${tool.name}: readOnlyHint`);
  eq(tool.annotations.destructiveHint, false, `${tool.name}: not destructive`);
  eq(tool.inputSchema.type, 'object', `${tool.name}: object schema`);
  eq(tool.inputSchema.additionalProperties, false, `${tool.name}: closed schema`);
  ok(/^[A-Za-z0-9_.-]{1,128}$/.test(tool.name), `${tool.name}: valid tool name`);
}
const search = r(3).result;
eq(search.isError, false);
ok(search.structuredContent.returned <= 3 && search.structuredContent.returned > 0, 'Search respects limit');
eq(JSON.parse(search.content[0].text), search.structuredContent, 'Text content mirrors structured content');
ok(search.structuredContent.skills.every(s => !s.paused), 'Search excludes paused listings by default');
ok(search.structuredContent.notes.some(n => n.includes('not a security audit or a guarantee')), 'Results carry the review disclaimer');
const everything = r(4).result.structuredContent;
eq(everything.total, catalog.skills.length, 'includePaused searches every listing');
if (paused.length) {
  const pausedHits = (await session([init(), call(1, 'search_skills', { includePaused: true, limit: 25, query: paused[0].name })])).byId(1).result.structuredContent.skills.filter(s => s.paused);
  ok(pausedHits.length > 0, 'Paused listings can be found when asked for');
  ok(pausedHits.every(s => s.install === null && s.reviewStatus === 'paused'), 'Paused search results never carry an install command');
  eq(r(5).result.structuredContent.skill.install, null, 'Paused get_skill suppresses install');
  eq(r(5).result.structuredContent.skill.paused, true);
  eq(everything.skills.length <= 25, true);
}
eq(r(6).result.structuredContent.skill.install, available[0].install, 'Available listing returns the exported command as text');
eq(r(6).result.structuredContent.skill.sourceRevision, available[0].sourceRevision, 'Source pin is preserved');
for (const id of [7, 9, 10, 11, 20]) { eq(r(id).result.isError, true, `${id}: invalid arguments are a tool error`); ok(r(id).result.content[0].text.length > 10, `${id}: error explains itself`); }
eq(r(8).result.isError, true);
ok(r(8).result.content[0].text.includes('search_skills'), 'Unknown id points to search');
eq(r(12).error.code, -32602, 'Unknown tool is a protocol error');
eq(r(13).error.code, -32602, 'Non-object arguments are a protocol error');
eq(r(14).result.resources.map(x => x.uri), ['fieldbook://catalog']);
const resource = JSON.parse(r(15).result.contents[0].text);
eq(resource.skills.length, catalog.skills.length, 'Catalog resource lists every skill');
ok(resource.skills.filter(s => s.paused).every(s => s.install === null), 'Catalog resource suppresses paused installs');
eq(r(16).error.code, -32002, 'Unknown resource uses the 2025-11-25 not-found code');
eq(r(17).error.code, -32601, 'Unknown method');
eq(r('str-id').result, {}, 'String ids are echoed');
ok(r(18).result.structuredContent.skills.every(s => catalog.skills.find(x => x.id === s.id).tasks.includes('fix-bug')), 'Task filter');
ok(r(19).result.structuredContent.skills.every(s => s.category === 'Review'), 'Stage filter by slug');
eq(legacy.responses.length, 25, 'One response per request; notifications get none');
eq(legacy.err, '', 'Nothing written to stderr');

// ---------------------------------------------------------------- version negotiation
eq((await session([init('2025-06-18')])).byId('init').result.protocolVersion, '2025-06-18', 'Older supported revision is echoed');
const fallback = (await session([init('1999-01-01')])).byId('init').result;
eq(fallback.protocolVersion, '2025-11-25', 'Unsupported revision is offered the latest legacy revision');

// ---------------------------------------------------------------- malformed JSON-RPC
const bad = await session([
  'not json',
  '[{"jsonrpc":"2.0","id":1,"method":"ping"}]',
  '{"jsonrpc":"2.0","id":null,"method":"ping"}',
  '{"jsonrpc":"2.0","id":{"x":1},"method":"ping"}',
  '{"jsonrpc":"2.0","id":1.5,"method":"ping"}',
  '{"jsonrpc":"1.0","id":"v","method":"ping"}',
  '{"jsonrpc":"2.0","id":"m","method":5}',
  '{"jsonrpc":"2.0","id":"p","method":"ping","params":[1]}',
  '"just a string"',
  '{"jsonrpc":"2.0","id":"resp","result":{}}',
  '',
  '{"jsonrpc":"2.0","method":"unknown/notification"}',
  '{"jsonrpc":"2.0","id":"after","method":"ping"}'
]);
const errs = bad.responses;
eq(errs[0].error.code, -32700, 'Parse error'); eq(errs[0].id, null);
eq(errs[1].error.code, -32600, 'Batches are rejected'); eq(errs[1].id, null);
for (const i of [2, 3, 4]) { eq(errs[i].error.code, -32600, `Invalid id ${i}`); eq(errs[i].id, null); }
eq(bad.byId('v').error.code, -32600, 'Wrong jsonrpc version');
eq(bad.byId('m').error.code, -32600, 'Non-string method');
eq(bad.byId('p').error.code, -32602, 'Array params');
eq(errs[8].error.code, -32600, 'Non-object message');
ok(!bad.byId('resp'), 'Client responses are ignored');
eq(bad.byId('after').result, {}, 'Server keeps serving after malformed input');
eq(errs.length, 10, 'Client responses, notifications and blank lines get no response');

// ---------------------------------------------------------------- 2026-07-28 stateless requests
const stateless = await session([
  modern('d', 'server/discover'),
  modern('t', 'tools/list'),
  modern('c', 'tools/call', { name: 'get_skill', arguments: { id: sample.id } }),
  modern('s', 'tools/call', { name: 'search_skills', arguments: { query: 'security', limit: 2 } }),
  modern('rl', 'resources/list'),
  modern('rr', 'resources/read', { uri: 'fieldbook://nope' }),
  modern('v', 'tools/list', {}, { ...META, 'io.modelcontextprotocol/protocolVersion': '1900-01-01' }),
  modern('caps', 'tools/list', {}, { 'io.modelcontextprotocol/protocolVersion': '2026-07-28' }),
  modern('ping', 'ping'),
  { jsonrpc: '2.0', id: 'nometa', method: 'server/discover' }
]);
const m = stateless.byId;
eq(m('d').result.resultType, 'complete');
eq(m('d').result.supportedVersions, SUPPORTED_VERSIONS);
eq(m('d').result.capabilities, { tools: {}, resources: {} });
eq(m('d').result._meta['io.modelcontextprotocol/serverInfo'].name, 'fieldbook');
ok(Number.isInteger(m('d').result.ttlMs) && ['public', 'private'].includes(m('d').result.cacheScope), 'Discover has cache hints');
eq(m('t').result.tools.length, TOOLS.length, 'Stateless tools/list works without initialize');
ok(Number.isInteger(m('t').result.ttlMs) && m('t').result.cacheScope === 'public', 'tools/list is cacheable');
eq(m('t').result.resultType, 'complete');
eq(m('c').result.structuredContent.skill.install, sample.paused ? null : sample.install, 'Stateless get_skill suppresses paused install');
eq(m('c').result.resultType, 'complete');
ok(m('s').result.structuredContent.returned <= 2);
eq(m('rl').result.resources.length, 1);
eq(m('rr').error.code, -32602, '2026-07-28 resource not found uses invalid params');
eq(m('v').error.code, -32022, 'Unsupported per-request version');
eq(m('v').error.data, { supported: SUPPORTED_VERSIONS, requested: '1900-01-01' });
eq(m('caps').error.code, -32602, 'Missing client capabilities is malformed');
eq(m('ping').error.code, -32601, 'ping is not part of 2026-07-28');
eq(m('nometa').error.code, -32602, 'server/discover without _meta is malformed');

// ---------------------------------------------------------------- oversized input
const closedArgs = await session([
  init(),
  call('constructor', 'search_skills', JSON.parse('{"constructor":1}')),
  call('prototype', 'search_skills', JSON.parse('{"__proto__":{}}'))
]);
for (const id of ['constructor', 'prototype']) eq(closedArgs.byId(id).result.isError, true, `${id}: inherited keys are not schema properties`);
const cancelled = await session([
  modern('cancel-me', 'tools/call', { name: 'search_skills', arguments: {} }),
  { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 'cancel-me' } },
  modern('keep-me', 'tools/list'),
  { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 'unknown' } }
]);
eq(cancelled.byId('cancel-me'), undefined, 'Canceled requests produce no further response');
eq(cancelled.byId('keep-me').result.tools.length, TOOLS.length, 'Cancellation does not affect unrelated requests');
const big = await session(['{"jsonrpc":"2.0","id":"big","method":"ping","params":{"pad":"' + 'x'.repeat(1100000) + '"}}', '{"jsonrpc":"2.0","id":"next","method":"ping"}']);
eq(big.responses[0].error.code, -32600, 'Oversized line is rejected');
eq(big.byId('next').result, {}, 'Server recovers after an oversized line');

// ---------------------------------------------------------------- defense in depth (in-process)
// A paused entry whose exported install is somehow present must still be suppressed.
const dir = await mkdtemp(path.join(tmpdir(), 'fieldbook-mcp-'));
try {
  const file = path.join(dir, 'index.json');
  const fixture = { skills: [{ id: 'o/r/paused-one', name: 'Paused one', paused: true, reviewStatus: 'paused', install: 'npx skills@latest add o/r --skill paused-one' }, { id: 'o/r/ok-one', name: 'Ok one', paused: false, reviewStatus: 'current', install: 'npx skills@latest add o/r --skill ok-one' }] };
  await writeFile(file, JSON.stringify(fixture));
  const core = createServer({ catalogPath: file });
  await core.handle(init());
  const got = await core.handle(call(1, 'get_skill', { id: 'o/r/paused-one' }));
  eq(got.result.structuredContent.skill.install, null, 'Paused flag wins over a stray install string');
  const all = await core.handle(call(2, 'search_skills', { includePaused: true }));
  ok(all.result.structuredContent.skills.find(s => s.id === 'o/r/paused-one').install === null);
  // Rebuilds are picked up without restarting the server.
  fixture.skills.push({ id: 'o/r/new-one', name: 'New one', paused: false, install: 'npx skills@latest add o/r --skill new-one' });
  await writeFile(file, JSON.stringify(fixture));
  await utimes(file, new Date(), new Date(Date.now() + 5000));
  eq((await core.handle(call(3, 'search_skills', {}))).result.structuredContent.total, 2, 'Fresh catalog is reread after a rebuild');
  await writeFile(file, '{"skills": "nope"}');
  await utimes(file, new Date(), new Date(Date.now() + 10000));
  const broken = await core.handle(call(4, 'search_skills', {}));
  eq(broken.result.isError, true, 'Malformed catalog is a tool error');
  const missing = createServer({ catalogPath: path.join(dir, 'missing.json') });
  await missing.handle(init());
  ok((await missing.handle(call(5, 'search_skills', {}))).result.content[0].text.includes('npm run build'), 'Missing build explains the fix');
  eq((await missing.handle({ jsonrpc: '2.0', id: 6, method: 'resources/read', params: { uri: 'fieldbook://catalog' } })).error.code, -32603);
} finally { await rm(dir, { recursive: true, force: true }); }

// The server never imports process-spawning or network modules.
const sources = (await readFile(server, 'utf8')) + (await readFile(new URL('./lib/mcp-core.mjs', import.meta.url), 'utf8'));
for (const banned of ['child_process', 'node:http', 'node:https', 'node:net', 'fetch(', 'eval(', 'writeFile', 'unlink']) ok(!sources.includes(banned), `MCP server does not use ${banned}`);
console.log(`Passed ${checks} MCP assertions: child-process stdio sessions from an unrelated cwd, 2025-11-25/2025-06-18 handshake, 2026-07-28 stateless requests, tools, resources, malformed input and paused install suppression.`);
