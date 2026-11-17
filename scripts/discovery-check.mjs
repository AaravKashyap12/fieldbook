import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadContent } from './lib/data.mjs';
import { fileURLToPath } from 'node:url';

const home = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
assert.ok(home.indexOf('id="tasks-title"') < home.indexOf('aria-label="Works with your agent"'), 'Task discovery must precede compatibility');
for (const slug of ['fix-bug', 'write-tests', 'review-code', 'secure-app']) {
  assert.ok(home.includes(`href="/skills/?task=${slug}"`), `${slug}: retain instant task filters`);
  assert.ok(home.includes(`href="/tasks/${slug}/"`), `${slug}: link useful guide`);
}
assert.ok(home.includes('href="/kits/bug-hunt/"'), 'Newcomer can reach the existing guided workflow');
const more = home.match(/<details class="more-tasks">([\s\S]*?)<\/details>/)?.[1];
assert.ok(more, 'Remaining taxonomy uses native disclosure');
const { entries, taxonomy, kits } = await loadContent(fileURLToPath(new URL('../', import.meta.url)));
const available = entries.filter(e => !e.paused);
const featured = new Set(['fix-bug', 'write-tests', 'review-code', 'secure-app']);
const remaining = taxonomy.tasks.filter(t => !featured.has(t.slug) && available.some(e => e.tasks.includes(t.slug)));
for (const task of remaining) assert.ok(more.includes(`href="/skills/?task=${task.slug}"`), `${task.slug}: remains discoverable without JavaScript`);
assert.ok(more.includes(`Browse ${remaining.length} more tasks`), 'Disclosure label reflects actual task count');
assert.ok(home.includes(`Search ${available.length} available skills`), 'Search count excludes paused skills');
assert.ok(home.includes('data-deck'), 'Keep notebook interaction');
assert.ok(home.includes('id="orig-title"'), 'Keep Fieldbook originals');
assert.ok(home.includes('id="promise-title"'), 'Keep review methodology');
// Lighter lists: evidence and pin cautions are stated once per list of copy
// actions (and in full on each skill page), not repeated inside every row.
const finder = await readFile(new URL('../dist/skills/index.html', import.meta.url), 'utf8');
for (const [name, html] of [['home', home], ['finder', finder]]) {
  assert.ok(!/<li class="(?:dir|browse)-row[^"]*"[^>]*>(?:(?!<\/li>)[\s\S])*review-evidence/.test(html), `${name}: rows carry no per-row evidence block`);
  assert.ok(html.includes('class="install-help install-caution list-note"') && html.includes('Copying a command does not run it') && html.includes('not a security audit or a guarantee'), `${name}: one install note covers the list`);
  assert.ok(/<details class="fold list-note-fold"><summary>Before you install[\s\S]*?class="install-help install-caution list-note"[\s\S]*?<\/details>/.test(html), `${name}: install limits remain available in a native disclosure`);
}
for (const e of available.filter(e => !e.revision || e.retained)) {
  const start = finder.lastIndexOf('<li class="dir-row', finder.indexOf(`<h3><a href="${e.url}">`));
  const row = finder.slice(start, finder.indexOf('</li>', start));
  assert.ok(row.includes(e.retained ? 'Last good scan' : 'Unpinned source'), `${e.id}: exception flag stays visible on its row`);
}
assert.ok(!home.includes('first-skill-mark') && !home.includes('task-guide-description'), 'Home keeps guides to title, drawing and count');
console.log('Passed: task-first homepage, distinct filter/guide routes, complete native task disclosure, accurate availability and newcomer route.');

// Every shared list with copy controls retains accessible source/review limits.
for (const route of [...featured].map(slug => `tasks/${slug}`).concat(kits.map(k => `kits/${k.slug}`))) {
  const html = await readFile(new URL(`../dist/${route}/index.html`, import.meta.url), 'utf8');
  if (!html.includes('class="dir-row')) continue;
  assert.ok(html.includes('Before you install') && html.includes('Copying a command does not run it') && html.includes('not a security audit or a guarantee'), `${route}: shared lists retain installation caveats`);
}
