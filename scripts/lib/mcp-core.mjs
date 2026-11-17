// Read-only Model Context Protocol server core for the Fieldbook catalog.
// Transport-free: scripts/mcp.mjs feeds it parsed JSON-RPC messages over stdio.
// It reads one file, the built catalog export, and never runs install commands,
// opens other files, makes network requests or starts processes.
import { readFile, stat } from 'node:fs/promises';

export const SERVER_INFO = { name: 'fieldbook', title: 'Fieldbook catalog (read-only)', version: '1.0.0' };
// Legacy revisions use the initialize handshake; 2026-07-28 is stateless and
// carries its version in each request's _meta.
export const LEGACY_VERSIONS = ['2025-11-25', '2025-06-18'];
export const MODERN_VERSIONS = ['2026-07-28'];
export const SUPPORTED_VERSIONS = [...MODERN_VERSIONS, ...LEGACY_VERSIONS];
export const CATALOG_URI = 'fieldbook://catalog';
export const LIMITS = { query: 200, slug: 64, id: 200, results: 25, defaultResults: 10 };

const META = {
  version: 'io.modelcontextprotocol/protocolVersion',
  capabilities: 'io.modelcontextprotocol/clientCapabilities',
  serverInfo: 'io.modelcontextprotocol/serverInfo'
};
const ERR = { parse: -32700, request: -32600, method: -32601, params: -32602, internal: -32603, legacyResourceNotFound: -32002, unsupportedVersion: -32022 };
const SLUG = '^[a-z0-9]+(?:-[a-z0-9]+)*$';
const ID = '^[A-Za-z0-9-]+/[A-Za-z0-9._-]+/[a-z0-9-]+$';
const CACHE = { ttlMs: 3600000, cacheScope: 'public' };

export const INSTRUCTIONS = 'Search and read Fieldbook listings of agent skills. Results include review status and source evidence. Install commands are returned as text only; this server never runs them, and paused listings have no install command. A review is not a security audit or a guarantee: read the source before installing.';
export const NOTES = [
  'A review is not a security audit or a guarantee. Read the source and its referenced files before installing.',
  'Install commands are text. This server never runs them. Paused listings return install: null.',
  'Install counts come from skills.sh and are not a measure of quality or safety.'
];

const summaryProperties = {
  id: { type: 'string' }, name: { type: 'string' }, url: { type: 'string' }, author: { type: 'string' },
  category: { type: 'string' }, summary: { type: 'string' }, access: { type: 'array', items: { type: 'string' } },
  installs: { type: ['integer', 'null'] }, reviewStatus: { type: 'string' }, paused: { type: 'boolean' },
  install: { type: ['string', 'null'], description: 'Skills CLI command as text, or null while installation is paused.' }
};
const readOnly = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };

export const TOOLS = [
  {
    name: 'search_skills',
    title: 'Search Fieldbook skills',
    description: 'Search reviewed agent skills by words, task, stack or stage. Every word must match the name, author, summary, stage, tasks, stack or access labels. Results are ordered by name match, then install count. Paused listings are excluded unless includePaused is true, and never include an install command.',
    inputSchema: {
      type: 'object', additionalProperties: false,
      properties: {
        query: { type: 'string', maxLength: LIMITS.query, description: 'Words to match, for example "react testing".' },
        task: { type: 'string', maxLength: LIMITS.slug, pattern: SLUG, description: 'Task slug, for example fix-bug, write-tests, review-code or secure-app.' },
        stack: { type: 'string', maxLength: LIMITS.slug, pattern: SLUG, description: 'Stack slug, for example react or python. General skills that fit any stack are included.' },
        category: { type: 'string', maxLength: LIMITS.slug, description: 'Stage name or slug, for example review or "Test & debug".' },
        limit: { type: 'integer', minimum: 1, maximum: LIMITS.results, default: LIMITS.defaultResults },
        includePaused: { type: 'boolean', default: false }
      }
    },
    outputSchema: {
      type: 'object', required: ['total', 'returned', 'skills', 'notes'],
      properties: { total: { type: 'integer' }, returned: { type: 'integer' }, skills: { type: 'array', items: { type: 'object', properties: summaryProperties } }, notes: { type: 'array', items: { type: 'string' } } }
    },
    annotations: { title: 'Search Fieldbook skills', ...readOnly }
  },
  {
    name: 'get_skill',
    title: 'Get a Fieldbook skill',
    description: 'Return one listing by id (owner/repo/skill), with review status, source revision, access labels and the install command as text. Paused listings return install: null.',
    inputSchema: {
      type: 'object', additionalProperties: false, required: ['id'],
      properties: { id: { type: 'string', maxLength: LIMITS.id, pattern: ID, description: 'Listing id from search_skills, for example AaravKashyap12/secure-launch/secure-launch.' } }
    },
    outputSchema: {
      type: 'object', required: ['skill', 'notes'],
      properties: { skill: { type: 'object', properties: summaryProperties }, notes: { type: 'array', items: { type: 'string' } } }
    },
    annotations: { title: 'Get a Fieldbook skill', ...readOnly }
  }
];

export const RESOURCES = [{ uri: CATALOG_URI, name: 'catalog', title: 'Fieldbook catalog', description: 'Every listing as JSON, the same shape as /index.json. Paused listings have install: null.', mimeType: 'application/json' }];

class RpcError extends Error { constructor(code, message, data) { super(message); this.code = code; this.data = data; } }
class ToolInputError extends Error {}

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);
const validId = id => typeof id === 'string' || Number.isSafeInteger(id);
// Paused listings never carry an install command, whatever the file says.
const installOf = s => (s.paused === true || s.reviewStatus === 'paused' || typeof s.install !== 'string') ? null : s.install;
const safe = s => ({ ...s, install: installOf(s) });
const summary = s => ({ id: s.id, name: s.name, url: s.url, author: s.author, category: s.category, summary: s.summary, access: Array.isArray(s.access) ? s.access : [], installs: Number.isSafeInteger(s.installs) ? s.installs : null, reviewStatus: String(s.reviewStatus || (s.paused ? 'paused' : 'unknown')), paused: s.paused === true, install: installOf(s) });

function checkArgs(args, schema) {
  for (const key of Object.keys(args)) if (!Object.hasOwn(schema.properties, key)) throw new ToolInputError(`Unknown argument "${key}". Allowed: ${Object.keys(schema.properties).join(', ')}.`);
  for (const key of schema.required || []) if (!(key in args)) throw new ToolInputError(`Missing required argument "${key}".`);
  for (const [key, value] of Object.entries(args)) {
    const rule = schema.properties[key];
    if (rule.type === 'string') {
      if (typeof value !== 'string') throw new ToolInputError(`"${key}" must be a string.`);
      if (value.length > rule.maxLength) throw new ToolInputError(`"${key}" must be at most ${rule.maxLength} characters.`);
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) throw new ToolInputError(`"${key}" has an invalid format.`);
    } else if (rule.type === 'integer') {
      if (!Number.isSafeInteger(value) || value < rule.minimum || value > rule.maximum) throw new ToolInputError(`"${key}" must be an integer from ${rule.minimum} to ${rule.maximum}.`);
    } else if (rule.type === 'boolean' && typeof value !== 'boolean') throw new ToolInputError(`"${key}" must be true or false.`);
  }
}

export function createServer({ catalogPath }) {
  let cache = null;
  let initialized = null; // negotiated legacy version, once initialize succeeds

  async function catalog() {
    let info;
    try { info = await stat(catalogPath); } catch { throw new ToolInputError('The catalog has not been built. Run npm run build in the Fieldbook repository, then retry.'); }
    if (cache && cache.mtimeMs === info.mtimeMs && cache.size === info.size) return cache.data;
    let data;
    try { data = JSON.parse(await readFile(catalogPath, 'utf8')); } catch { throw new ToolInputError('The built catalog could not be read as JSON. Run npm run build again.'); }
    if (!isObject(data) || !Array.isArray(data.skills) || data.skills.some(s => !isObject(s) || typeof s.id !== 'string' || typeof s.name !== 'string')) throw new ToolInputError('The built catalog has an unexpected shape. Run npm run build again.');
    cache = { mtimeMs: info.mtimeMs, size: info.size, data };
    return data;
  }

  async function search(args) {
    const data = await catalog();
    const words = (args.query || '').toLowerCase().split(/\s+/).filter(Boolean);
    const phrase = words.join(' ');
    const stage = (args.category || '').trim().toLowerCase();
    const limit = args.limit ?? LIMITS.defaultResults;
    const hits = data.skills.filter(s => {
      if (s.paused === true && !args.includePaused) return false;
      if (args.task && !(Array.isArray(s.tasks) && s.tasks.includes(args.task))) return false;
      if (args.stack && Array.isArray(s.stack) && s.stack.length && !s.stack.includes(args.stack)) return false;
      if (stage && String(s.category || '').toLowerCase() !== stage && String(s.categorySlug || '') !== stage) return false;
      const hay = [s.name, s.id, s.author, s.summary, s.category, ...(s.tasks || []), ...(s.stack || []), ...(s.access || [])].join(' ').toLowerCase();
      return words.every(w => hay.includes(w));
    });
    const rank = s => { const n = String(s.name).toLowerCase(); return [phrase && n === phrase ? 1 : 0, words.filter(w => n.includes(w)).length, args.stack && s.stack?.includes(args.stack) ? 1 : 0]; };
    hits.sort((a, b) => { const x = rank(a), y = rank(b); for (let i = 0; i < x.length; i++) if (x[i] !== y[i]) return y[i] - x[i]; return (b.installs ?? -1) - (a.installs ?? -1) || String(a.name).localeCompare(String(b.name)); });
    const skills = hits.slice(0, limit).map(summary);
    return { total: hits.length, returned: skills.length, skills, notes: NOTES };
  }

  async function getSkill(args) {
    const data = await catalog();
    const s = data.skills.find(x => x.id === args.id);
    if (!s) throw new ToolInputError(`No listing has the id "${args.id}". Use search_skills to find ids.`);
    return { skill: safe(s), notes: NOTES };
  }

  async function callTool(params) {
    if (typeof params.name !== 'string') throw new RpcError(ERR.params, 'tools/call requires a string "name".');
    const tool = TOOLS.find(t => t.name === params.name);
    if (!tool) throw new RpcError(ERR.params, `Unknown tool: ${params.name.slice(0, 128)}`);
    if (params.arguments !== undefined && !isObject(params.arguments)) throw new RpcError(ERR.params, '"arguments" must be an object.');
    const args = params.arguments || {};
    try {
      checkArgs(args, tool.inputSchema);
      const result = tool.name === 'search_skills' ? await search(args) : await getSkill(args);
      return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result, isError: false };
    } catch (error) {
      if (!(error instanceof ToolInputError)) throw error;
      return { content: [{ type: 'text', text: error.message }], isError: true };
    }
  }

  async function readResource(params, modern) {
    if (params.uri !== CATALOG_URI) throw new RpcError(modern ? ERR.params : ERR.legacyResourceNotFound, 'Resource not found', { uri: typeof params.uri === 'string' ? params.uri.slice(0, 200) : null });
    let data;
    try { data = await catalog(); } catch (error) { throw new RpcError(ERR.internal, error.message); }
    return { contents: [{ uri: CATALOG_URI, mimeType: 'application/json', text: JSON.stringify({ ...data, skills: data.skills.map(safe) }) }] };
  }

  const capabilities = { tools: {}, resources: {} };

  async function operate(method, params, modern) {
    switch (method) {
      case 'tools/list': return { tools: TOOLS };
      case 'tools/call': return callTool(params);
      case 'resources/list': return { resources: RESOURCES };
      case 'resources/read': return readResource(params, modern);
      default: return undefined;
    }
  }

  async function legacy(method, params) {
    if (method === 'initialize') {
      if (initialized) throw new RpcError(ERR.request, 'The server is already initialized.');
      const requested = params.protocolVersion;
      if (typeof requested !== 'string') throw new RpcError(ERR.params, 'initialize requires a string protocolVersion.');
      initialized = LEGACY_VERSIONS.includes(requested) ? requested : LEGACY_VERSIONS[0];
      const serverInfo = initialized === '2025-11-25' ? { ...SERVER_INFO, description: 'Search and read reviewed agent skill listings from a local Fieldbook build.', websiteUrl: 'https://fieldbook.tech/agents/' } : SERVER_INFO;
      return { protocolVersion: initialized, capabilities, serverInfo, instructions: INSTRUCTIONS };
    }
    if (method === 'ping') return {};
    if (method === 'server/discover') throw new RpcError(ERR.params, `server/discover requires _meta["${META.version}"] and _meta["${META.capabilities}"].`);
    const known = ['tools/list', 'tools/call', 'resources/list', 'resources/read'].includes(method);
    if (!known) throw new RpcError(ERR.method, `Method not found: ${method.slice(0, 128)}`);
    if (!initialized) throw new RpcError(ERR.request, 'Server not initialized. Send initialize first, or use protocol 2026-07-28 with per-request _meta.');
    return operate(method, params, false);
  }

  async function modern(method, params) {
    const meta = params._meta;
    const version = meta[META.version];
    if (typeof version !== 'string') throw new RpcError(ERR.params, `_meta["${META.version}"] must be a string.`);
    if (!MODERN_VERSIONS.includes(version)) throw new RpcError(ERR.unsupportedVersion, 'Unsupported protocol version', { supported: SUPPORTED_VERSIONS, requested: version.slice(0, 64) });
    if (!isObject(meta[META.capabilities])) throw new RpcError(ERR.params, `_meta["${META.capabilities}"] is required.`);
    let result;
    if (method === 'server/discover') result = { supportedVersions: SUPPORTED_VERSIONS, capabilities, instructions: INSTRUCTIONS, ...CACHE };
    else {
      result = await operate(method, params, true);
      if (result === undefined) throw new RpcError(ERR.method, `Method not found: ${method.slice(0, 128)}`);
      if (method !== 'tools/call') Object.assign(result, CACHE);
    }
    return { resultType: 'complete', ...result, _meta: { [META.serverInfo]: { name: SERVER_INFO.name, version: SERVER_INFO.version } } };
  }

  // Returns a response object, or null when nothing should be sent.
  async function handle(message) {
    if (Array.isArray(message)) return error(null, ERR.request, 'Batch requests are not supported.');
    if (!isObject(message)) return error(null, ERR.request, 'Invalid Request');
    const hasId = Object.hasOwn(message, 'id');
    if (typeof message.method !== 'string') {
      // A response from the client (we never send requests), or garbage.
      if (hasId && ('result' in message || 'error' in message)) return null;
      return error(hasId && validId(message.id) ? message.id : null, ERR.request, 'Invalid Request: "method" must be a string.');
    }
    // Notifications (including notifications/initialized) never receive a response.
    if (!hasId) return null;
    if (!validId(message.id)) return error(null, ERR.request, 'Invalid Request: "id" must be a string or integer.');
    const id = message.id;
    if (message.jsonrpc !== '2.0') return error(id, ERR.request, 'Invalid Request: "jsonrpc" must be "2.0".');
    if (message.params !== undefined && !isObject(message.params)) return error(id, ERR.params, '"params" must be an object.');
    const params = message.params || {};
    try {
      const isModern = message.method !== 'initialize' && isObject(params._meta) && Object.hasOwn(params._meta, META.version);
      const result = isModern ? await modern(message.method, params) : await legacy(message.method, params);
      return { jsonrpc: '2.0', id, result };
    } catch (e) {
      if (e instanceof RpcError) return error(id, e.code, e.message, e.data);
      return error(id, ERR.internal, 'Internal error');
    }
  }

  return { handle };
}

export function error(id, code, message, data) {
  return { jsonrpc: '2.0', id, error: data === undefined ? { code, message } : { code, message, data } };
}
export const PARSE_ERROR = () => error(null, ERR.parse, 'Parse error');
