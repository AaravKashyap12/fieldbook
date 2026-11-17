#!/usr/bin/env node
// Fieldbook MCP server: read-only, local, stdio. Run `npm run build` first.
// Configure your client with an absolute path, for example:
//   node /absolute/path/to/fieldbook/scripts/mcp.mjs
// The catalog path is resolved from this file, not the working directory.
// Messages are newline-delimited JSON-RPC on stdin/stdout; nothing else is
// written to stdout. See /agents/ on the site for setup and protocol notes.
import { fileURLToPath } from 'node:url';
import { createServer, PARSE_ERROR } from './lib/mcp-core.mjs';

const MAX_LINE = 1024 * 1024;
const server = createServer({ catalogPath: fileURLToPath(new URL('../dist/index.json', import.meta.url)) });
const send = message => { if (message) process.stdout.write(JSON.stringify(message) + '\n'); };

let buffer = '';
let discarding = false; // inside an oversized line, skip to its newline
let queue = Promise.resolve();
const pending = new Map();
const tooLarge = () => send({ jsonrpc: '2.0', id: null, error: { code: -32600, message: `Message exceeds the ${MAX_LINE}-character line limit.` } });

function enqueueLine(line) {
  if (!line.trim()) return;
  let message;
  try { message = JSON.parse(line); } catch { queue = queue.then(() => send(PARSE_ERROR())); return; }
  // Observe cancellation at intake, before queued requests finish their reads.
  if (message?.jsonrpc === '2.0' && message.method === 'notifications/cancelled' && !Object.hasOwn(message, 'id')) {
    const request = pending.get(message.params?.requestId);
    if (request && request.method !== 'initialize') request.cancelled = true;
    return;
  }
  const request = { method: message?.method, cancelled: false };
  const hasId = message && !Array.isArray(message) && Object.hasOwn(message, 'id');
  if (hasId) pending.set(message.id, request);
  queue = queue.then(async () => {
    try {
      if (request.cancelled) return;
      const response = await server.handle(message);
      if (!request.cancelled) send(response);
    } finally {
      if (hasId && pending.get(message.id) === request) pending.delete(message.id);
    }
  });
}

process.stdin.setEncoding('utf8');
process.stdin.on('data', chunk => {
  buffer += chunk;
  let newline;
  while ((newline = buffer.indexOf('\n')) !== -1) {
    const line = buffer.slice(0, newline);
    buffer = buffer.slice(newline + 1);
    if (discarding) { discarding = false; continue; }
    if (line.length > MAX_LINE) { queue = queue.then(tooLarge); continue; }
    enqueueLine(line);
  }
  if (buffer.length > MAX_LINE) {
    buffer = '';
    if (!discarding) { discarding = true; queue = queue.then(tooLarge); }
  }
});
process.stdin.on('end', () => {
  const rest = discarding ? '' : buffer;
  enqueueLine(rest);
  // Let pending stdout writes drain; process.exit() here would truncate them.
  queue.catch(() => {}).finally(() => process.stdout.end());
});
process.stdout.on('error', () => process.exit(0));
