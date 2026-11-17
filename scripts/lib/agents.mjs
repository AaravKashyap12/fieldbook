// Agent-facing discovery: the /agents/ setup page, llms.txt, llms-full.txt and
// agents.json. Everything describes a local, read-only stdio MCP server; no
// hosted MCP endpoint exists, and nothing here claims one.
import { esc, rise } from './util.mjs';
import { icon } from './icons.mjs';
import { codeBlock, accessText } from './parts.mjs';
import { TOOLS, RESOURCES, LEGACY_VERSIONS, MODERN_VERSIONS, SERVER_INFO, LIMITS, NOTES } from './mcp-core.mjs';

const PLACEHOLDER = '/absolute/path/to/fieldbook';
const SCRIPT = `${PLACEHOLDER}/scripts/mcp.mjs`;
export const MCP_SETUP = {
  clone: 'git clone https://github.com/AaravKashyap12/fieldbook.git\ncd fieldbook\nnpm run build',
  claude: `claude mcp add fieldbook -- node ${SCRIPT}`,
  codex: `[mcp_servers.fieldbook]\ncommand = "node"\nargs = ["${SCRIPT}"]`,
  json: JSON.stringify({ mcpServers: { fieldbook: { command: 'node', args: [SCRIPT] } } }, null, 2)
};

const LIMITATIONS = [
  'Fieldbook does not host an MCP endpoint. The server runs on your machine over stdio.',
  'The server reads dist/index.json from your local build. Results are as fresh as your last npm run build after pulling.',
  'Read-only: it searches and reads listings. It never installs a skill, runs a command, writes a file or makes a network request.',
  'Paused listings return install: null and are excluded from search unless includePaused is true.',
  'A review is not a security audit or a guarantee. Scans cover SKILL.md, not referenced files or runtime behavior.'
];

const param = (name, rule, required) => `<li><code>${esc(name)}</code>${required ? ' <span class="agent-req">required</span>' : ''}: ${esc(rule.description || (rule.type === 'boolean' ? `true or false, default ${rule.default}` : rule.type === 'integer' ? `${rule.minimum} to ${rule.maximum}, default ${rule.default}` : rule.type))}</li>`;

export function agentsPage({ available, paused }) {
  const tools = TOOLS.map(t => `<li><h3><code>${esc(t.name)}</code></h3><p>${esc(t.description)}</p><ul class="agent-params">${Object.entries(t.inputSchema.properties).map(([k, r]) => param(k, r, t.inputSchema.required?.includes(k))).join('')}</ul></li>`).join('');
  const files = [
    ['/llms.txt', 'llms.txt', 'A short Markdown index of this site for language models, with limitations stated up front.'],
    ['/llms-full.txt', 'llms-full.txt', `Every available listing in Markdown, grouped by stage, with review status and install commands. Paused listings appear without commands.`],
    ['/index.json', 'index.json', 'The full catalog as JSON. Its fields are unchanged; install is null for paused listings.'],
    ['/agents.json', 'agents.json', 'A small JSON description of these files and the local MCP server.']
  ];
  return `<main id="main" class="wrap narrow agents-page"><header class="page-head"><h1 ${rise(0)}>Fieldbook for<br><em>agents.</em></h1><p class="lede" ${rise(1)}>Let your coding agent search the catalog and read review evidence. Everything here is read-only. Nothing on this page installs a skill for you.</p></header>
<nav class="guide-contents" aria-label="On this page"><span>On this page</span><a href="#agent-files-title">Files</a><a href="#agent-mcp-title">MCP server</a><a href="#agent-tools-title">Tools</a><a href="#agent-protocol-title">Protocol</a><a href="#agent-limits-title">Limits</a></nav>
<section class="section" aria-labelledby="agent-files-title"><h2 id="agent-files-title">Files agents can read</h2><p class="prose">Plain files served with the site. They list ${available} available skills and ${paused} paused ones as of the last build.</p><ul class="agent-files">${files.map(([href, label, text]) => `<li><a class="link" href="${href}"><code>${esc(label)}</code>${icon('chevron')}</a><p>${esc(text)}</p></li>`).join('')}</ul></section>
<section class="section" aria-labelledby="agent-mcp-title"><h2 id="agent-mcp-title">Run the MCP server locally</h2><p class="prose">Fieldbook does not host an MCP endpoint. The server is a dependency-free Node.js script that runs on your machine over stdio and reads the catalog from your local build. You need Node.js 20 or later.</p>
<ol class="steps agent-steps"><li><span>01</span><div><p>Clone the repository and build the catalog. Pull and build again when you want fresher data.</p>${codeBlock(MCP_SETUP.clone, 'Clone and build', 'agent-clone')}</div></li>
<li><span>02</span><div><p>Add the server to your agent. Replace <code>${PLACEHOLDER}</code> with the absolute path of your clone. The server finds its catalog from its own location, so the working directory does not matter.</p><h3 class="agent-client">Claude Code</h3>${codeBlock(MCP_SETUP.claude, 'Claude Code command', 'agent-claude')}<h3 class="agent-client">Codex <span>in ~/.codex/config.toml</span></h3>${codeBlock(MCP_SETUP.codex, 'Codex configuration', 'agent-codex')}<h3 class="agent-client">Other clients <span>that read an mcpServers JSON file</span></h3>${codeBlock(MCP_SETUP.json, 'MCP server JSON configuration', 'agent-json')}</div></li>
<li><span>03</span><div><p>Ask your agent something the catalog can answer, for example: “Find a Fieldbook skill for reviewing a pull request that does not run commands.” Read the listing and its source before installing anything it suggests.</p></div></li></ol></section>
<section class="section" aria-labelledby="agent-tools-title"><h2 id="agent-tools-title">Tools and resources</h2><p class="prose">Both tools are marked read-only. Arguments are validated and bounded: queries up to ${LIMITS.query} characters and at most ${LIMITS.results} results per search.</p><ul class="agent-tools">${tools}<li><h3><code>${esc(RESOURCES[0].uri)}</code></h3><p>${esc(RESOURCES[0].description)}</p></li></ul></section>
<section class="section" aria-labelledby="agent-protocol-title"><h2 id="agent-protocol-title">Protocol support</h2><ul class="bullets"><li><strong>${LEGACY_VERSIONS[0]}</strong>, and ${LEGACY_VERSIONS.slice(1).join(', ')}: the <code>initialize</code> handshake, <code>ping</code>, <code>tools/list</code>, <code>tools/call</code>, <code>resources/list</code> and <code>resources/read</code>. A client that asks for another version is offered ${LEGACY_VERSIONS[0]}.</li><li><strong>${MODERN_VERSIONS[0]}</strong>: stateless requests carrying their version and client capabilities in <code>_meta</code>, plus <code>server/discover</code>. Results include <code>resultType</code> and server identity; list and read results include cache hints.</li><li>Transport: stdio only, one JSON-RPC message per line. No HTTP transport, prompts, subscriptions, tasks or pagination.</li></ul><p class="prose">Server name <code>${esc(SERVER_INFO.name)}</code>, version ${esc(SERVER_INFO.version)}. The repository's checks start the server as a separate process and exercise these paths, including malformed input and paused listings.</p></section>
<section class="section" aria-labelledby="agent-limits-title"><h2 id="agent-limits-title">Limits</h2><ul class="bullets">${LIMITATIONS.map(l => `<li>${esc(l)}</li>`).join('')}</ul><p class="prose">For what a review checks, read <a class="inline-link" href="/review/">how we review</a>. Source: <a class="inline-link" href="https://github.com/AaravKashyap12/fieldbook/blob/main/scripts/mcp.mjs" target="_blank" rel="noopener noreferrer">scripts/mcp.mjs<span class="sr-only"> (opens in a new tab)</span></a>.</p></section>
</main>`;
}

const line = s => String(s ?? '').replace(/\s+/g, ' ').trim();

export function llmsTxt({ origin, site, available, paused, guides, stages }) {
  const u = path => origin + path;
  return `# ${site.name}

> ${line(site.description)} ${available} available skills and ${paused} paused listings, each with a source note, access labels and review status.

Fieldbook is a directory, not a package registry: each skill installs from its author's repository with the Skills CLI. Before recommending a skill, read its listing and source.

- A review is not a security audit or a guarantee. Automated scans cover SKILL.md only, not referenced files or runtime behavior.
- Paused listings have no install command (\`install\` is null in the JSON).
- Install counts come from skills.sh and measure use, not quality.
- Fieldbook does not host an MCP endpoint. A read-only stdio server ships in the repository for local use.

## Catalog

- [Directory as JSON](${u('/index.json')}): every listing with review status, source revision and install command (null when paused)
- [Full catalog in Markdown](${u('/llms-full.txt')}): available listings grouped by stage
- [Agent discovery](${u('/agents.json')}): machine-readable description of these files and the local MCP server
- [Skill finder](${u('/skills/')}): filter by task, stack and what a skill can touch

## Guides

${guides.map(g => `- [${g.name}](${u(`/tasks/${g.slug}/`)}): ${line(g.description)}`).join('\n')}
- [How Fieldbook reviews skills](${u('/review/')}): what is checked and what a review does not mean
- [Kits](${u('/kits/')}): small sets of skills for one kind of task

## Agents

- [Fieldbook for agents](${u('/agents/')}): local MCP server setup, tools, protocol support and limits

## Optional

${stages.map(c => `- [${c.name}](${u(`/c/${c.slug}/`)}): ${line(c.blurb)}`).join('\n')}
- [New skills feed](${u('/feed.xml')}): RSS
`;
}

export function llmsFull({ origin, site, entries, stages, generatedAt }) {
  const available = entries.filter(e => !e.paused);
  const paused = entries.filter(e => e.paused);
  const listing = e => {
    const review = e.retained ? `last good scan ${e.review.checkedAt} (latest fetch failed; current upstream content unverified)` : `scanned ${e.review.checkedAt}`;
    const revision = e.revision ? `pinned to commit ${e.revision}` : 'unpinned (installs the current upstream version)';
    return `### ${line(e.name)}

- ID: ${e.id}
- Page: ${origin}${e.url}
- Author: ${line(e.author.name)} · Licence: ${line(e.license)}
- Summary: ${line(e.summary)}
- Can touch: ${accessText(e)}
- Review: ${review}; ${revision}${e.readAt ? `; read in full ${e.readAt}` : ''}
- Install: \`${e.install}\`
`;
  };
  return `# ${site.name}: full catalog

> ${available.length} available listings and ${paused.length} paused, generated ${generatedAt.slice(0, 10)}. Source: ${origin}/index.json

A review is not a security audit or a guarantee. Automated scans cover SKILL.md only. Read each skill's source and referenced files before installing. Install commands are text: copying one does not run it. Access labels describe what the instructions ask for; they are not enforced permissions.

${stages.map(c => {
    const list = available.filter(e => e.category === c.slug).sort((a, b) => (b.stats.installs ?? -1) - (a.stats.installs ?? -1) || a.name.localeCompare(b.name));
    return list.length ? `## ${c.name}\n\n${line(c.blurb)}\n\n${list.map(listing).join('\n')}` : '';
  }).filter(Boolean).join('\n')}
## Paused listings

These listings have no install command until a new review clears them.

${paused.length ? paused.map(e => `- ${line(e.name)} (${e.id}): ${line(e.reviewReason)} ${origin}${e.url}`).join('\n') : '- None.'}
`;
}

export function agentsJson({ origin, site, available, paused, generatedAt }) {
  return {
    name: site.name, url: `${origin}/`, description: site.description, generatedAt,
    documentation: `${origin}/agents/`,
    llms: `${origin}/llms.txt`, llmsFull: `${origin}/llms-full.txt`,
    catalog: { url: `${origin}/index.json`, mediaType: 'application/json', availableCount: available, pausedCount: paused, pausedInstall: null },
    mcp: {
      hosted: false, transport: 'stdio', readOnly: true,
      command: 'node', args: ['scripts/mcp.mjs'],
      setup: 'Clone https://github.com/AaravKashyap12/fieldbook, run npm run build, then start node with the absolute path to scripts/mcp.mjs.',
      source: 'https://github.com/AaravKashyap12/fieldbook/blob/main/scripts/mcp.mjs',
      protocolVersions: [...MODERN_VERSIONS, ...LEGACY_VERSIONS],
      tools: TOOLS.map(t => ({ name: t.name, description: t.description, readOnly: true })),
      resources: RESOURCES.map(r => ({ uri: r.uri, mimeType: r.mimeType }))
    },
    limitations: [...LIMITATIONS, ...NOTES.slice(2)]
  };
}
