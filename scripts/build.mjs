// Fieldbook static build. No dependencies: node scripts/build.mjs
// Content lives in content/*.json; statistics in content/stats/ (npm run sync);
// review evidence in content/review.json (npm run review).
import { readFile, writeFile, mkdir, copyFile, cp, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadContent, ACCESS } from './lib/data.mjs';
import { esc, pad, rise, plural, humanDate, compact, exact } from './lib/util.mjs';
import { icon, favicon } from './lib/icons.mjs';
import { SITE, page, external, inlineLink, headScript } from './lib/shell.mjs';
import { codeBlock, copyLabel, catIcon, accessText, installs, delta, dirList, categoryNav, reviewedBadge } from './lib/parts.mjs';
import { diagram } from './lib/diagrams.mjs';
import { installFor } from './lib/security.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'dist');
const { entries, originals, categories, kits: kitDefs, snapshots, taxonomy } = await loadContent(root);
const agents = JSON.parse(await readFile(path.join(root, 'content/agents.json'), 'utf8'));

// SKILL.md copies are shown only for Fieldbook originals; community skills link to their source.
const skillmd = {};
for (const e of originals) if (e.data.skillmd) skillmd[e.id] = await readFile(path.join(root, 'content/skillmd', e.data.skillmd), 'utf8');

// Review state is validated centrally by loadContent.
const listed = entries.filter(e => !e.paused);
const byId = Object.fromEntries(entries.map(e => [e.id, e]));
const byInstalls = (a, b) => (b.stats.installs ?? -1) - (a.stats.installs ?? -1) || a.name.localeCompare(b.name);
const ranked = [...listed].sort(byInstalls);
const counts = Object.fromEntries(categories.map(c => [c.slug, entries.filter(e => e.category === c.slug).length]));
// Stages appear once they have at least one skill.
const stages = categories.filter(c => counts[c.slug] > 0);
const maintainers = new Set(entries.map(e => e.owner)).size;
const kits = kitDefs.map(k => ({ ...k, entries: k.ids.map(id => { const e = byId[id]; if (!e) throw new Error(`Kit ${k.slug}: unknown skill ${id}`); return e; }) }));

// One per author keeps the notebook and board openers varied.
function varied(list, n) {
  const seen = new Set(), picked = [];
  for (const e of list) { if (!seen.has(e.owner)) { seen.add(e.owner); picked.push(e); } if (picked.length === n) break; }
  return picked;
}

// ---------------------------------------------------------------- updates
const updateLog = [
  { date: '2026-09-27', kind: 'New edition', title: 'The directory opens.', text: `Fieldbook becomes a reviewed directory of engineering skills. ${entries.length - originals.length} skills from ${maintainers - 1} maintainers join the Fieldbook originals, each licence-checked, scanned and labelled, with a note on what it is good for and what it can touch. Install counts come from skills.sh and refresh daily, and anyone can now submit a skill.`, link: ['/skills/', 'Browse the directory'] },
  { date: '2026-09-27', kind: 'New skill', title: 'Ready for launch day.', text: 'Secure Launch joins the collection. It checks what a project exposes before it goes live, applies the fixes you approve, and verifies each one locally. It ships as 0.1.3 with recorded Codex trials and plainly stated limits.', ids: ['AaravKashyap12/secure-launch/secure-launch'] },
  { date: '2026-09-25', kind: 'First edition', title: 'Three workflows. One home.', text: 'The collection opens with three engineering skills: project planning with evidence, focused one-owner engineering, and routing agent effort to where it counts. Lean Engineering and Efficiency Skill ship as 0.2.0 with recorded Codex trials.', ids: ['AaravKashyap12/advise-project-approach/advise-project-approach', 'AaravKashyap12/lean-engineering/lean-engineering', 'AaravKashyap12/efficiency-skill/efficiency-skill'] }
];

// ---------------------------------------------------------------- home
// The notebook shows today's pages: the skills rising fastest, or the most
// installed until two days of snapshots exist.
const deckMode = snapshots.hasDay ? 'today' : 'all';
const deckPicks = varied(deckMode === 'today' ? [...listed].filter(e => e.stats.today > 0).sort((a, b) => b.stats.today - a.stats.today) : ranked, 4);
const sheetStat = e => deckMode === 'today' ? `+${compact(e.stats.today)} today` : `${compact(e.stats.installs)} installs`;
const deck = `<div class="deck" data-deck aria-hidden="true" ${rise(3)}><span class="deck-caption">${deckMode === 'today' ? 'Rising today' : 'Most installed'}</span>${deckPicks.map((e, i) => `<div class="sheet" data-pos="${i}" data-name="${esc(`${e.name} by ${e.author.name}`)}"><span class="sheet-cat">${esc(e.categoryInfo.name)}${catIcon(e.category)}</span><strong>${esc(e.name)}</strong><span class="sheet-by">${esc(e.author.name)}</span><span class="sheet-lines"><i></i><i></i><i></i></span><code>${esc(sheetStat(e))}</code><span class="sheet-rules"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></div>`).join('')}<span class="deck-hint">Turn the page ${icon('chevron')}</span></div>`;

function originalRow(e, i) {
  const s = e.data;
  return `<li class="skill"><span class="skill-num" aria-hidden="true">${pad(i + 1)}</span><div class="skill-body"><p class="skill-meta"><span class="cat">${esc(e.categoryInfo.name)}</span>${s.version ? `<span>v${esc(s.version)}</span>` : ''}<span>${esc(s.license)}</span></p><h3><a href="${e.url}">${esc(e.name)}</a></h3><p class="skill-summary">${esc(e.summary)}</p><div class="skill-actions"><a class="link" href="${e.url}" aria-label="Explore ${esc(e.name)}">Explore skill ${icon('chevron')}</a><button type="button" class="copy-button" data-copy="orig-install-${i}" aria-label="Copy ${esc(e.name)} install command">${copyLabel('Copy install')}</button><code id="orig-install-${i}" tabindex="-1" class="sr-only">${esc(e.install)}</code></div></div>${diagram(s)}</li>`;
}

const kitList = `<ul class="kit-list">${kits.map(k => `<li><a class="kit" href="/kits/${k.slug}/"><span class="kit-count">${plural(k.entries.length)}</span><h3>${esc(k.name)}</h3><p>${esc(k.blurb)}</p><span class="kit-names">${k.entries.map(e => esc(e.name)).join('<span aria-hidden="true"> · </span><span class="sr-only">, </span>')}</span><span class="flow-more">Open the kit ${icon('chevron')}</span></a></li>`).join('')}</ul>`;

// Tasks with at least one listed skill, in taxonomy order.
const taskCounts = Object.fromEntries(taxonomy.tasks.map(t => [t.slug, listed.filter(e => e.tasks.includes(t.slug)).length]));
const liveTasks = taxonomy.tasks.filter(t => taskCounts[t.slug] > 0);
const QUICK_TASKS = [['fix-bug', 'bug'], ['write-tests', 'flask'], ['review-code', 'review'], ['secure-app', 'shield']].filter(([slug]) => taskCounts[slug] > 0);
const taskName = slug => taxonomy.tasks.find(t => t.slug === slug).name;

// The agents row: monochrome marks from Simple Icons (CC0; see content/agents.json
// for versions). Two copies make a seamless loop.
const agentMark = a => `<li class="agent">${a.path ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${esc(a.path)}"/></svg>` : ''}<span>${esc(a.name)}</span></li>`;
const agentList = agents.agents;
const works = `<section class="wrap works" aria-label="Works with your agent"><div class="works-band"><p class="works-label">Install once.<br><span>Use it in 70+ agents.</span></p><div class="marquee" title="Skills install with the open Skills CLI"><ul class="marquee-track">${agentList.map(agentMark).join('')}</ul><ul class="marquee-track" aria-hidden="true">${agentList.map(agentMark).join('')}</ul></div></div></section>`;

const home = `<main id="main" class="home">
<section class="wrap hero" aria-labelledby="hero-title"><div class="hero-copy"><h1 id="hero-title" ${rise(0)}>Engineering skills,<br><em>reviewed.</em></h1><p class="lede" ${rise(1)}>A strict directory of agent skills for real engineering work. Find one for the task in front of you, see what it can touch, and install it in one line.</p><form class="hero-search" action="/skills/" method="get" role="search" ${rise(2)}>${icon('search')}<input type="search" name="q" placeholder="Search ${entries.length} reviewed skills" aria-label="Search the directory" autocomplete="off" spellcheck="false" data-slash><kbd aria-hidden="true">/</kbd><button class="search-go" type="submit">Search</button></form><p class="quick-tasks" ${rise(3)}>${QUICK_TASKS.map(([slug, ic]) => `<a href="/skills/?task=${slug}">${icon(ic)}${esc(taskName(slug))}</a>`).join('')}<a class="quick-more" href="/skills/">All tasks ${icon('chevron')}</a></p></div>${deck}</section>
${works}
<section class="wrap tasks-section" aria-labelledby="tasks-title"><div class="section-intro"><h2 id="tasks-title" class="section-title">Start with<br><em>the task.</em></h2><p>Pick what you are doing. The directory narrows it down by stack and by what a skill is allowed to touch.</p></div><ul class="task-list">${liveTasks.map(t => `<li><a href="/skills/?task=${t.slug}"><span class="task-name">${esc(t.name)}</span><span class="task-n">${taskCounts[t.slug]}</span>${icon('chevron', 'task-chevron')}</a></li>`).join('')}</ul><p class="section-more"><a class="link" href="/skills/">Browse all ${entries.length} skills ${icon('chevron')}</a></p></section>
<section class="wrap originals" aria-labelledby="orig-title"><div class="section-intro"><h2 id="orig-title" class="section-title">Made at<br><em>Fieldbook.</em></h2><p>Written here, held to the same review as everything else, and published with recorded evaluations.</p></div><ul class="skill-list">${originals.filter(e => !e.paused).map(originalRow).join('')}</ul></section>
<section class="wrap promise" aria-labelledby="promise-title"><div class="promise-copy"><h2 id="promise-title" class="section-title">Checked before<br><em>it is listed.</em></h2><ol class="promise-steps"><li><span>01</span><div><h3>Licence checked</h3><p>Only skills published under a licence you can use.</p></div></li><li><span>02</span><div><h3>Scanned daily</h3><p>Checked for remote code, destructive commands, secret handling and hidden instructions. A new flag pauses the listing.</p></div></li><li><span>03</span><div><h3>Labelled and noted</h3><p>Every page says what the skill can touch, with a Fieldbook note on what it is good for.</p></div></li><li><span>04</span><div><h3>Read in full</h3><p>Skills a person has read end to end carry the mark, with the date. The list grows every week.</p></div></li></ol><a class="link" href="/review/">How we review ${icon('chevron')}</a></div><div class="submit-cta"><h2 class="submit-title">Built a skill that makes agents <em>engineer better?</em></h2><p>Send it in, or send one you rely on. We read every submission and reply on GitHub either way.</p><a class="button" href="/submit/">Submit a skill ${icon('plus')}</a></div></section>
</main>`;

// ---------------------------------------------------------------- directory, categories
const dirTools = (label, n) => `<div class="dir-tools" data-dir-tools><label class="search">${icon('search')}<input type="search" name="q" placeholder="Search ${esc(label)}" aria-label="Search ${esc(label)}" autocomplete="off" spellcheck="false" data-dir-search data-slash><kbd aria-hidden="true">/</kbd></label><label class="sort"><span>Sort</span><select data-dir-sort aria-label="Sort skills"><option value="installs">Most installed</option><option value="today">Rising today</option><option value="added">Newest</option><option value="name">A to Z</option></select></label><span class="count" data-dir-count aria-live="polite">${plural(n)}</span></div>`;
const emptyState = `<p class="empty" data-dir-empty hidden>No skill matches these filters<span data-dir-query-wrap> and “<span data-dir-query></span>”</span>. Remove a filter, or <a class="inline-link" href="/submit/">submit a skill</a> that fits.</p>`;

// The finder. Facets combine as OR within a group and AND across groups;
// "Only skills that" limits all apply together. app.js does the filtering and
// keeps the state in the URL; without script the full list shows.
const facetOption = (name, value, label, extra = '') => `<label class="facet-option"><input type="checkbox" name="${name}" value="${esc(value)}"${extra}><span class="facet-label">${esc(label)}</span><span class="facet-n" data-n></span></label>`;
const facet = (key, legend, body, open = true) => `<details class="facet" data-facet="${key}"${open ? ' open' : ''}><summary>${legend}<span class="facet-picked" data-picked></span></summary><div class="facet-body">${body}</div></details>`;
const stackUsed = new Set(listed.flatMap(e => e.stack));
const LIMITS = [['guidance', 'Give guidance only'], ['no-commands', 'Don\u2019t run commands'], ['no-edits', 'Don\u2019t edit code'], ['no-network', 'Don\u2019t use the network'], ['no-mcp', 'Need no MCP server']];
const SOURCES = [['official', 'Official maintainer'], ['original', 'Fieldbook original'], ['read', 'Read in full']];
const filters = `<form class="filters" data-filters aria-label="Filter skills"><details class="filters-panel" data-filters-panel open><summary class="filters-toggle">Filters<span class="filters-count" data-filters-count></span></summary><div class="filters-body">
${facet('task', 'Task', liveTasks.map(t => facetOption('task', t.slug, t.name)).join(''))}
${facet('stack', 'Stack', `<p class="facet-hint">Includes general skills that work with any stack; skills made for your stack come first.</p>${facetOption('stack', 'any', 'General skills only')}` + taxonomy.stackGroups.map(g => { const opts = taxonomy.stacks.filter(x => x.group === g.slug && stackUsed.has(x.slug)); return opts.length ? `<p class="facet-group">${esc(g.name)}</p>${opts.map(x => facetOption('stack', x.slug, x.name)).join('')}` : ''; }).join(''))}
${facet('limit', 'Only skills that', LIMITS.map(([v, l]) => facetOption('limit', v, l)).join(''))}
${facet('stage', 'Stage', stages.map(c => facetOption('stage', c.slug, c.name)).join(''), false)}
${facet('source', 'Source', SOURCES.map(([v, l]) => facetOption('source', v, l)).join(''), false)}
<button type="button" class="clear-all" data-clear-all hidden>Clear all filters</button></div></details></form>`;
const finderTools = `<div class="dir-tools" data-dir-tools><label class="search">${icon('search')}<input type="search" name="q" placeholder="Search skills, authors, tools" aria-label="Search skills" autocomplete="off" spellcheck="false" data-dir-search data-slash><kbd aria-hidden="true">/</kbd></label><label class="sort"><span>Sort</span><select data-dir-sort aria-label="Sort skills"><option value="match">Best match</option><option value="installs" selected>Most installed</option><option value="today">Rising today</option><option value="added">Newest</option><option value="name">A to Z</option></select></label><span class="count" data-dir-count aria-live="polite">${plural(listed.length)}</span></div><div class="active-filters" data-active hidden></div>`;
const directory = `<main id="main" class="wrap directory finder" data-directory data-finder><header class="page-head compact"><h1 ${rise(0)}>Find the right <em>skill.</em></h1><p class="lede" ${rise(1)}>Filter by the task in front of you, your stack, and what you are comfortable letting an agent touch. ${entries.length} reviewed skills from ${maintainers} maintainers.</p></header><div class="finder-layout">${filters}<section class="results" aria-label="Results">${finderTools}${dirList([...listed].sort(byInstalls), 'dir')}${emptyState}</section></div></main>`;

const categoryPage = c => {
  const list = listed.filter(e => e.category === c.slug).sort(byInstalls);
  return `<main id="main" class="wrap directory is-stage" data-directory><nav class="crumbs" aria-label="Breadcrumb"><a href="/skills/">Directory</a>${icon('chevron')}<span aria-current="page">${esc(c.name)}</span></nav><header class="page-head compact"><h1 ${rise(0)}>${esc(c.name)}</h1><p class="lede" ${rise(1)}>${esc(c.blurb)}</p></header>${categoryNav(stages, counts, c.slug)}<p class="refine"><a class="link" href="/skills/?stage=${c.slug}">Refine ${esc(c.name.toLowerCase())} by task, stack and access ${icon('chevron')}</a></p>${dirTools(c.name.toLowerCase(), list.length)}${dirList(list, `cat-${c.slug}`)}${emptyState}</main>`;
};

// ---------------------------------------------------------------- kits
const kitsIndex = `<main id="main" class="wrap"><header class="page-head"><h1 ${rise(0)}>Kits worth<br><em>saving.</em></h1><p class="lede" ${rise(1)}>Small sets of reviewed skills that work well together on one kind of task. Each kit has one block of install commands you can paste into a terminal.</p></header>${kitList}</main>`;
const kitPage = k => `<main id="main" class="wrap" data-directory><nav class="crumbs" aria-label="Breadcrumb"><a href="/kits/">Kits</a>${icon('chevron')}<span aria-current="page">${esc(k.name)}</span></nav><header class="page-head compact"><h1 ${rise(0)}>${esc(k.name)}</h1><p class="lede" ${rise(1)}>${esc(k.blurb)}</p></header><section class="section kit-install" aria-labelledby="kit-install-title"><h2 id="kit-install-title">Install the kit</h2>${k.entries.some(e => !e.paused) ? codeBlock(k.entries.filter(e => !e.paused).map(e => e.install).join('\n'), `${k.entries.filter(e => !e.paused).length} available install commands`, 'kit-commands') : '<p class="notice">All skills in this kit are paused; no installation commands are available.</p>'}<p class="install-help">Each command asks which agents to install for; add <code>-g</code> to install globally.</p></section><section class="section" aria-labelledby="kit-skills-title"><h2 id="kit-skills-title">In this kit</h2>${dirList(k.entries, 'kit')}</section></main>`;

// ---------------------------------------------------------------- detail
function facts(e) {
  const st = e.stats;
  const items = [
    ['Installs', st.installs == null ? '<span>Not yet counted</span><small>Appears after its first installs</small>' : `<span title="${exact(st.installs)}">${compact(st.installs)}</span><small>on skills.sh${st.today != null ? ` · ${st.today >= 0 ? '+' : ''}${compact(st.today)} today` : ''}</small>`],
    st.week != null ? ['This week', `${st.week >= 0 ? '+' : ''}${compact(st.week)}`] : null,
    st.stars ? ['GitHub stars', `<span class="stars">${icon('star')}${compact(st.stars)}</span><small>${esc(e.repo)}</small>`] : null,
    st.pushed ? ['Repository updated', humanDate(st.pushed)] : null,
    e.original && e.data.version ? ['Version', `<code>${esc(e.data.version)}</code>`] : null,
    ['Good for', e.taskInfo.map(t => `<a class="inline-link" href="/skills/?task=${t.slug}">${esc(t.name)}</a>`).join('<br>')],
    ['Stack', e.stackInfo.length ? e.stackInfo.map(t => `<a class="inline-link" href="/skills/?stack=${t.slug}">${esc(t.name)}</a>`).join(', ') : 'Any stack'],
    ['Licence', esc(e.license)],
    ['Author', `<a class="inline-link" href="${esc(e.author.url)}" target="_blank" rel="noopener noreferrer">${esc(e.author.name)}<span class="sr-only"> (opens in a new tab)</span></a>`],
    ['Added', humanDate(e.addedAt)]
  ].filter(Boolean);
  const links = [
    external(e.sourceUrl, 'SKILL.md on GitHub', 'link'),
    external(e.repoUrl, 'Repository', 'link'),
    st.installs != null ? external(`${SITE.skillsSh}/${e.id.toLowerCase()}`, 'On skills.sh', 'link') : '',
    e.original && e.data.evidence ? external(e.data.evidence, 'Evaluation notes', 'link') : ''
  ].join('');
  return `<aside class="facts-aside" aria-label="Skill facts"><dl class="facts">${items.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl><div class="aside-links">${links}</div></aside>`;
}

function installation(e) {
  if (e.paused) return `<section class="section"><h2>Installation paused</h2><p class="notice">${esc(e.reviewReason)} Read the source and wait for a new review before installing.</p></section>`;
  const methods = e.original ? e.data.install.map(m => ({ label: m.label, agent: m.label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), command: m.command, note: m.note })) : [{ label: 'Skills CLI', agent: 'skills-cli', command: e.install, note: 'Requires Node.js and npm. Choose your agents in the installer; add -g for a global installation.' }];
  const prompt = e.original ? e.data.prompt : `Use the ${e.skill} skill for this task.`;
  const panels = [
    ...methods.map((m, i) => ({ id: `method-${i}`, tab: `tab-${i}`, label: m.label, agent: m.agent, body: `${codeBlock(m.command, `${m.label} command`, `install-${i}`, { command: true })}<p class="install-help">${esc(m.note)}</p>` })),
    { id: 'method-prompt', tab: 'tab-prompt', label: 'Prompt', agent: 'prompt', body: `${codeBlock(prompt, 'Example prompt', 'example-prompt')}<p class="install-help">Paste this into your agent once the skill is installed, then add your own context.</p>` }
  ];
  const tablist = `<div class="segmented" role="tablist" aria-label="Installation method">${panels.map((p, i) => `<button type="button" role="tab" id="${p.tab}" aria-selected="${i === 0}" aria-controls="${p.id}" tabindex="${i === 0 ? 0 : -1}" data-agent="${p.agent}">${esc(p.label)}</button>`).join('')}<span class="segmented-thumb" aria-hidden="true"></span></div>`;
  return `<section class="section" aria-labelledby="install-title"><div class="section-head"><h2 id="install-title">Installation</h2>${tablist}</div>${panels.map((p, i) => `<div class="install-method" id="${p.id}" role="tabpanel" aria-labelledby="${p.tab}" data-agent="${p.agent}"${i ? ' hidden' : ''}><h3 class="sr-only">${esc(p.label)}</h3>${p.body}</div>`).join('')}</section>`;
}

function reviewSection(e) {
  const r = e.review && Array.isArray(e.review.problems) && Array.isArray(e.review.findings) ? e.review : null;
  const checks = [
    ['ok', 'Licence', esc(e.license)],
    r ? [r.problems.length ? 'warn' : 'ok', 'Frontmatter', r.problems.length ? esc(r.problems.join(' ')) : 'Valid name and description'] : null,
    r?.sha256 ? (e.openFlags.length ? ['warn', 'Risky patterns', `${plural(e.openFlags.length, 'new flag')} under review: ${e.openFlags.map(f => esc(f.rule)).join(', ')}`]
      : e.clearedFlags.length ? ['ok', 'Risky patterns', `${plural(e.clearedFlags.length, 'match')} cleared on reading: ${e.clearedFlags.map(f => esc(f.reason)).join(' ')}`]
      : ['ok', 'Risky patterns', 'None found']) : null,
    r ? ['info', 'Size', `${r.lines} lines`] : null,
    r?.checkedAt ? ['info', 'Last checked', `${humanDate(r.checkedAt)} · <code title="SHA-256 ${esc(r.sha256)}">${esc(String(r.sha256).slice(0, 12))}</code>`] : null
  ].filter(Boolean);
  const touch = e.access.length
    ? `<ul class="touch">${e.access.map(a => `<li><span>${ACCESS[a].label}</span><p>${ACCESS[a].hint}</p></li>`).join('')}</ul>`
    : `<p class="prose">Guidance only. Its instructions shape how the agent thinks and writes; they do not ask it to change files or run commands.</p>`;
  return `<section class="section" aria-labelledby="review-title"><div class="section-head"><h2 id="review-title">Fieldbook review</h2>${reviewedBadge(e)}</div>${e.paused ? `<p class="notice">${esc(e.reviewReason)} Its source page stays available, but installation is paused.</p>` : ''}${e.retained ? `<p class="notice">${esc(e.reviewReason)} Last successful check: ${humanDate(e.review.checkedAt)}.</p>` : ''}${e.original ? '' : `<p class="prose review-note">${esc(e.note)}</p>`}<ul class="checks">${checks.map(([state, k, v]) => `<li class="is-${state}">${state === 'ok' ? icon('check') : `<span class="check-dot" aria-hidden="true"></span>`}<span class="check-k">${k}</span><span class="check-v">${v}</span></li>`).join('')}</ul></section><section class="section" aria-labelledby="touch-title"><h2 id="touch-title">What it can touch</h2>${touch}</section>`;
}

function skillSource(e) {
  if (e.paused) return '';
  const raw = skillmd[e.id];
  if (!raw) return '';
  const lines = raw.trimEnd().split('\n').length;
  return `<section class="section" aria-labelledby="source-title"><div class="section-head"><h2 id="source-title"><code>SKILL.md</code></h2><span class="section-note">${lines} lines, copied from the repository on ${esc(humanDate(e.data.skillmdCheckedAt))}</span></div><div class="skillmd"><div class="code-head"><span>${esc(e.skill)}/SKILL.md</span><button type="button" class="copy-button" data-copy="skillmd" aria-label="Copy SKILL.md">${copyLabel('Copy')}</button></div><pre id="skillmd" tabindex="0"><code>${esc(raw.trimEnd())}</code></pre><div class="skillmd-fade" aria-hidden="true"></div></div><button type="button" class="show-more" data-expand aria-expanded="false" aria-controls="skillmd"><span class="show-more-label" aria-hidden="true"><span>Show the whole file</span><span>Show less</span></span><span class="sr-only" data-expand-label>Show the whole file</span>${icon('chevron')}</button></section>`;
}

function detail(e) {
  const s = e.data;
  const related = listed.filter(x => x.category === e.category && x.id !== e.id).sort(byInstalls).slice(0, 5);
  const more = related.length ? related : ranked.filter(x => x.id !== e.id).slice(0, 5);
  const body = e.original
    ? `${installation(e)}<section class="section" aria-labelledby="when-title"><h2 id="when-title">When to reach for it</h2><ul class="bullets">${s.bestFor.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section><section class="section" aria-labelledby="how-title"><h2 id="how-title">How it approaches the work</h2><ol class="steps">${s.workflow.map((t, i) => `<li><span>${pad(i + 1)}</span><p>${esc(t)}</p></li>`).join('')}</ol></section>${reviewSection(e)}${skillSource(e)}<section class="section" aria-labelledby="know-title"><h2 id="know-title">Good to know</h2><p class="prose">${esc(s.note)}</p></section>`
    : `${installation(e)}${reviewSection(e)}<section class="section" aria-labelledby="source-title"><h2 id="source-title">Read the source</h2><p class="prose">Fieldbook links to the original instead of copying it, so you always read the version you install.</p>${external(e.sourceUrl, `${esc(e.path)} on GitHub`, 'link')}</section>`;
  return `<main id="main" class="wrap detail"><nav class="crumbs" aria-label="Breadcrumb"><a href="/skills/">Directory</a>${icon('chevron')}<a href="/c/${e.category}/">${esc(e.categoryInfo.name)}</a>${icon('chevron')}<span aria-current="page">${esc(e.name)}</span></nav><header class="detail-head"><p class="detail-meta" ${rise(0)}><span class="detail-glyph">${catIcon(e.category)}</span><a class="cat" href="/c/${e.category}/">${esc(e.categoryInfo.name)}</a>${e.original ? `${s.version ? `<span>v${esc(s.version)}</span>` : ''}<span class="tag-original">Fieldbook original</span>` : ''}<span>${esc(e.license)}</span></p><h1 ${rise(1)}>${esc(e.name)}</h1><p class="detail-by" ${rise(1)}>by <a class="inline-link" href="${esc(e.author.url)}" target="_blank" rel="noopener noreferrer">${esc(e.author.name)}<span class="sr-only"> (opens in a new tab)</span></a> <span aria-hidden="true">·</span> <code>${esc(e.repo)}</code></p><p class="lede" ${rise(2)}>${esc(e.original ? s.description : e.summary)}</p></header><div class="detail-layout"><article class="detail-article">${body}</article>${facts(e)}</div><section class="related" aria-labelledby="related-title"><h2 id="related-title">${related.length ? `More in ${esc(e.categoryInfo.name)}` : 'Elsewhere in Fieldbook'}</h2><ul class="related-list">${more.map(x => `<li><a href="${x.url}">${catIcon(x.category)}<span class="related-name">${esc(x.name)}</span><span class="related-cat">${esc(x.author.name)}</span>${icon('chevron', 'related-chevron')}</a></li>`).join('')}</ul></section></main>`;
}

// ---------------------------------------------------------------- submit, review
const pattern = '(https://github\\.com/)?[A-Za-z0-9](?:[A-Za-z0-9-]*)/[A-Za-z0-9._-]+/?';
const submit = `<main id="main" class="wrap"><header class="page-head"><h1 ${rise(0)}>Submit a<br><em>skill.</em></h1><p class="lede" ${rise(1)}>Fieldbook lists skills that make coding agents do better engineering. Send yours, or one you rely on. We read every submission and reply on GitHub either way.</p></header><div class="submit-layout"><form class="submit-form" data-submit-form action="https://github.com/${SITE.repo}/issues/new" method="get" target="_blank" rel="noopener"><input type="hidden" name="template" value="submit-skill.yml"><input type="hidden" name="title" value="Skill submission" data-submit-title><div class="field"><label for="f-repo">GitHub repository</label><input id="f-repo" name="repository" required placeholder="owner/repo" pattern="${pattern}" autocomplete="off" spellcheck="false" aria-describedby="f-repo-hint"><p class="hint" id="f-repo-hint">The public repository that holds the skill, as <code>owner/repo</code> or a GitHub link.</p></div><div class="field"><label for="f-skill">Skill folder</label><input id="f-skill" name="skill" required placeholder="my-skill" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" autocomplete="off" spellcheck="false" aria-describedby="f-skill-hint"><p class="hint" id="f-skill-hint">The folder containing <code>SKILL.md</code>, in lowercase with hyphens, as the Skills CLI's <code>--skill</code> flag expects.</p></div><div class="field"><label for="f-cat">Stage of the work</label><select id="f-cat" name="category">${categories.map(c => `<option value="${esc(c.name)}">${esc(c.name)}</option>`).join('')}</select></div><div class="field"><label for="f-why">Why it makes agents engineer better</label><textarea id="f-why" name="why" rows="5" required maxlength="1500" aria-describedby="f-why-hint"></textarea><p class="hint" id="f-why-hint">A task where it changed the result is the best evidence.</p></div><fieldset class="field"><legend>You are</legend><label class="choice"><input type="radio" name="relation" value="The author" checked><span>The author</span></label><label class="choice"><input type="radio" name="relation" value="A user of the skill"><span>A user of the skill</span></label></fieldset><div class="submit-actions"><button class="button" type="submit">Continue on GitHub ${icon('arrow')}</button><p class="hint">Opens a prefilled GitHub issue in a new tab. You need a GitHub account to send it.</p></div></form><aside class="submit-aside" aria-labelledby="look-title"><h2 id="look-title">What we look for</h2><ul class="bullets"><li>It changes how an agent does engineering work: planning, building, testing, reviewing, securing or shipping.</li><li>Its description says clearly when to use it.</li><li>It does one job and says what it touches.</li><li>It is public, under a licence others can use, and installs with the Skills CLI.</li><li>No remote code piped to a shell, no secret handling, no hidden instructions.</li></ul><h2>What happens next</h2><ol class="steps"><li><span>01</span><p>We run the automated checks on the published <code>SKILL.md</code>.</p></li><li><span>02</span><p>A person reads the whole skill and writes the note and labels. Listed submissions carry the Read in full mark.</p></li><li><span>03</span><p>We reply on the issue: listed, or why not yet.</p></li></ol><a class="link" href="/review/">The full review process ${icon('chevron')}</a></aside></div></main>`;

const reviewPage = `<main id="main" class="wrap narrow"><header class="page-head"><h1 ${rise(0)}>How we<br><em>review.</em></h1><p class="lede" ${rise(1)}>Fieldbook lists fewer skills on purpose. A skill appears here only after it passes the checks below, and it earns the Read in full mark once a person has read every instruction file.</p></header>
<section class="section" aria-labelledby="r1"><h2 id="r1">What we look for</h2><ul class="bullets"><li><strong>Engineering work.</strong> The skill changes how an agent plans, builds, tests, debugs, reviews, secures or ships software.</li><li><strong>A clear trigger.</strong> Its description says when to use it, so it fires on the right tasks and stays quiet on the rest.</li><li><strong>A scoped job.</strong> It does one thing well and is honest about what it touches.</li><li><strong>A usable licence.</strong> Published under a licence that lets you use it. Skills without a licence file wait until they have one.</li><li><strong>Installable.</strong> It installs with the open Skills CLI from a public repository.</li></ul></section>
<section class="section" aria-labelledby="r2"><h2 id="r2">The checks we run</h2><p class="prose">Every listed <code>SKILL.md</code> is fetched and checked each day for valid frontmatter and for patterns drawn from published research on malicious skills:</p><ul class="bullets"><li>Remote code piped into a shell, and obfuscated payloads.</li><li>Destructive commands and unnecessary privilege, such as <code>rm -rf</code> on a root path or <code>sudo</code>.</li><li>Force pushes and skipped git hooks.</li><li>Flags that bypass an agent's safety prompts.</li><li>Reading or printing secrets, and hardcoded credentials.</li><li>Hidden instructions aimed at the agent.</li></ul><p class="prose">A match is not a verdict. A person reads it: a defensive mention, such as a skill that lists the commands it blocks, is cleared with the reason shown on the page. A new, unread match pauses the listing until it is read.</p></section>
<section class="section" aria-labelledby="r3"><h2 id="r3">What the labels mean</h2><ul class="touch">${Object.values(ACCESS).map(a => `<li><span>${a.label}</span><p>${a.hint}</p></li>`).join('')}</ul><p class="prose">Labels come from reading the skill, not from running it. A skill with no labels is guidance only.</p></section>
<section class="section" aria-labelledby="r35"><h2 id="r35">Reviewed, and read in full</h2><p class="prose">Every listing is reviewed: licence confirmed, <code>SKILL.md</code> scanned, access labelled, and a Fieldbook note written from its instructions. <strong>Read in full</strong> is a stronger mark: a person has read the skill and every file it tells the agent to load, end to end, and the date is shown. Submissions are read in full before they are listed.</p></section>
<section class="section" aria-labelledby="r4"><h2 id="r4">Where the numbers come from</h2><p class="prose">Install counts are the public counts from ${inlineLink(SITE.skillsSh, 'skills.sh')}, collected from the open-source Skills CLI. Fieldbook takes a snapshot every day; "today" is the change since the previous snapshot. Some repositories install as a bundle, which counts every skill in the bundle. Stars and update dates come from GitHub. Fieldbook is independent of skills.sh and Vercel.</p></section>
<section class="section" aria-labelledby="r5"><h2 id="r5">What reviewed does not mean</h2><p class="prose">A review is not a security audit or a guarantee. We read skills but do not run every one, and a skill can change after it is reviewed; the daily checks exist to catch that. Always read what you install. If you find a problem with a listed skill, ${inlineLink(`https://github.com/${SITE.repo}/issues/new`, 'open an issue')}.</p></section>
</main>`;

// ---------------------------------------------------------------- updates / 404
const updates = `<main id="main" class="wrap narrow"><header class="page-head"><h1 ${rise(0)}>A collection,<br><em>always in progress.</em></h1><p class="lede" ${rise(1)}>New skills and changes to Fieldbook, recorded here. Subscribe to the ${`<a class="inline-link" href="/feed.xml">new skills feed</a>`} to hear about each addition.</p></header>${updateLog.map((u, n) => `<article class="update" aria-labelledby="update-${updateLog.length - n}"><p class="update-date"><time datetime="${u.date}">${humanDate(u.date)}</time></p><div class="update-body"><p class="update-kind">${esc(u.kind)}</p><h2 id="update-${updateLog.length - n}">${esc(u.title)}</h2><p>${esc(u.text)}</p>${u.ids?.some(id => byId[id]) ? `<ul class="update-list">${u.ids.map(id => byId[id]).filter(Boolean).map(e => `<li><a href="${e.url}">${catIcon(e.category)}${esc(e.name)}</a><span class="status"><i aria-hidden="true"></i>Available</span></li>`).join('')}</ul>` : ''}${u.link ? `<a class="link" href="${u.link[0]}">${u.link[1]} ${icon('chevron')}</a>` : ''}</div></article>`).join('')}<p class="update-footnote">Every listing keeps its original repository, documentation and releases.</p><p class="update-follow">${external(`https://github.com/${SITE.repo}`, 'Fieldbook on GitHub', 'link')}<span>More to come.</span></p></main>`;

const notFound = `<main id="main" class="wrap narrow not-found"><h1>This page has<br>wandered off.</h1><p class="lede">The directory is a good place to start again.</p><a class="button" href="/skills/">Browse the directory</a><p class="error-code"><code>404</code></p></main>`;

// ---------------------------------------------------------------- feeds and data
const xml = s => esc(s);
const rssDate = iso => new Date(iso.slice(0, 10) + 'T12:00:00Z').toUTCString();
const feed = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${SITE.name}: new reviewed skills</title><link>${SITE.origin}/</link><atom:link href="${SITE.origin}/feed.xml" rel="self" type="application/rss+xml"/><description>${xml(SITE.description)}</description><language>en</language>${[...listed].sort((a, b) => b.addedAt.localeCompare(a.addedAt) || a.name.localeCompare(b.name)).map(e => `<item><title>${xml(`${e.name}, by ${e.author.name}`)}</title><link>${SITE.origin}${e.url}</link><guid isPermaLink="true">${SITE.origin}${e.url}</guid><pubDate>${rssDate(e.addedAt)}</pubDate><category>${xml(e.categoryInfo.name)}</category><description>${xml(`${e.summary} ${e.note || ''}`.trim())}</description></item>`).join('')}</channel></rss>`;

const dataExport = {
  name: SITE.name, url: SITE.origin, description: SITE.description,
  generatedAt: new Date().toISOString(), statsFetchedAt: snapshots.latest?.fetchedAt || null,
  notes: 'Install counts from skills.sh (public counts from the Skills CLI); stars from GitHub. Reviews by Fieldbook; see /review/.',
  skills: entries.map(e => ({ id: e.id, name: e.name, url: SITE.origin + e.url, author: e.author.name, repository: e.repoUrl, path: e.path, tasks: e.tasks, stack: e.stack, source: e.source, category: e.categoryInfo.name, summary: e.summary, license: e.license, access: e.access.map(a => ACCESS[a].label), install: installFor(e), original: e.original, installs: e.stats.installs, today: e.stats.today, week: e.stats.week, stars: e.stats.stars, addedAt: e.addedAt, reviewedAt: e.review?.checkedAt || null, reviewRetained: e.retained, reviewStatus: e.paused ? 'paused' : e.retained ? 'last-good' : 'current', paused: e.paused }))
};

// Hosting config for Vercel. The inline theme script is allowed by hash; check.mjs
// fails if vercel.json and the script drift apart.
const scriptHash = createHash('sha256').update(headScript).digest('base64');
const csp = [`default-src 'self'`, `script-src 'self' 'sha256-${scriptHash}'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data:`, `font-src 'self'`, `connect-src 'self'`, `form-action 'self' https://github.com`, `frame-ancestors 'none'`, `base-uri 'self'`, `object-src 'none'`].join('; ');
const vercel = {
  $schema: 'https://openapi.vercel.sh/vercel.json',
  framework: null,
  buildCommand: 'npm run build',
  outputDirectory: 'dist',
  trailingSlash: true,
  headers: [
    { source: '/(.*)', headers: [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'Strict-Transport-Security', value: 'max-age=63072000' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' }
    ] },
    { source: '/fonts/(.*)', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] }
  ],
  // Earlier single-level skill URLs move to /skills/<owner>/<skill>/.
  redirects: originals.map(e => ({ source: `/skills/${e.skill}/`, destination: e.url, permanent: true }))
};
const expires = new Date(Date.now() + 365 * 864e5).toISOString().replace(/\.\d+Z$/, 'Z');
const securityTxt = `Contact: https://github.com/${SITE.repo}/security/advisories/new\nExpires: ${expires}\nPreferred-Languages: en\nCanonical: ${SITE.origin}/.well-known/security.txt\n`;

// Static hosting input must be committed before Vercel starts its build.
const committedHosting = JSON.parse(await readFile(path.join(root, 'vercel.json'), 'utf8'));
if (JSON.stringify(committedHosting) !== JSON.stringify(vercel) && !process.argv.includes('--update-vercel')) {
  throw new Error('vercel.json drift: run npm run build -- --update-vercel locally and commit the regenerated configuration.');
}

// ---------------------------------------------------------------- write
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
await cp(path.join(root, 'assets/fonts'), path.join(out, 'fonts'), { recursive: true });
for (const file of ['styles.css', 'app.js', 'sound.js', 'social-preview.png']) await copyFile(path.join(root, 'assets', file), path.join(out, file)).catch(err => { if (file !== 'social-preview.png') throw err; });
const write = async (route, html) => { const dir = path.join(out, route); await mkdir(dir, { recursive: true }); await writeFile(path.join(dir, 'index.html'), html); };

await write('/', page({ title: `${SITE.name}: ${SITE.tagline}`, description: SITE.description, route: '/', content: home, current: 'home' }));
await write('/skills/', page({ title: `Directory · ${SITE.name}`, description: `All ${entries.length} reviewed engineering skills for coding agents, with what each can touch and how often it is installed.`, route: '/skills/', content: directory, current: 'directory' }));
for (const c of stages) await write(`/c/${c.slug}/`, page({ title: `${c.name} skills · ${SITE.name}`, description: `${c.blurb} ${plural(counts[c.slug])}, each reviewed by Fieldbook.`, route: `/c/${c.slug}/`, content: categoryPage(c), current: 'directory' }));
await write('/kits/', page({ title: `Kits · ${SITE.name}`, description: 'Small sets of reviewed agent skills that work well together, with one block of install commands.', route: '/kits/', content: kitsIndex, current: 'kits' }));
for (const k of kits) await write(`/kits/${k.slug}/`, page({ title: `${k.name} kit · ${SITE.name}`, description: k.blurb, route: `/kits/${k.slug}/`, content: kitPage(k), current: 'kits' }));
for (const e of entries) await write(e.url, page({ title: `${e.name} by ${e.author.name} · ${SITE.name}`, description: `${e.summary} Reviewed by Fieldbook: what it is good for, what it can touch, and how to install it.`, route: e.url, content: detail(e), current: 'directory' }));
await write('/submit/', page({ title: `Submit a skill · ${SITE.name}`, description: 'Send an agent skill that makes coding agents engineer better. Every submission is read and answered on GitHub.', route: '/submit/', content: submit, current: 'submit' }));
await write('/review/', page({ title: `How we review · ${SITE.name}`, description: 'What Fieldbook looks for, the checks it runs on every skill, and what a review does and does not mean.', route: '/review/', content: reviewPage }));
await write('/updates/', page({ title: `Updates · ${SITE.name}`, description: `New skills and changes to ${SITE.name}.`, route: '/updates/', content: updates, current: 'updates' }));
await writeFile(path.join(out, '404.html'), page({ title: `Page not found · ${SITE.name}`, description: 'Find your way back to the directory.', route: '/404.html', content: notFound }));
await writeFile(path.join(out, 'favicon.svg'), favicon);
await writeFile(path.join(out, 'feed.xml'), feed);
await writeFile(path.join(out, 'index.json'), JSON.stringify(dataExport, null, 1));
await writeFile(path.join(root, 'vercel.json'), JSON.stringify(vercel, null, 2) + '\n');
await mkdir(path.join(out, '.well-known'), { recursive: true });
await writeFile(path.join(out, '.well-known/security.txt'), securityTxt);
const routes = ['/', '/skills/', '/kits/', '/submit/', '/review/', '/updates/', ...stages.map(c => `/c/${c.slug}/`), ...kits.map(k => `/kits/${k.slug}/`), ...entries.map(e => e.url)];
await writeFile(path.join(out, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(r => `<url><loc>${esc(SITE.origin + r)}</loc></url>`).join('')}</urlset>`);
await writeFile(path.join(out, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${SITE.origin}/sitemap.xml\n`);
console.log(`Built ${routes.length} pages: ${entries.length} skills (${originals.length} originals, ${entries.filter(e => e.paused).length} paused), ${stages.length} of ${categories.length} stages in use, ${kits.length} kits. Stats: ${snapshots.count} snapshot${snapshots.count === 1 ? '' : 's'}.`);
