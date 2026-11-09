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
const { entries, taxonomy } = await loadContent(fileURLToPath(new URL('../', import.meta.url)));
const available = entries.filter(e => !e.paused);
const featured = new Set(['fix-bug', 'write-tests', 'review-code', 'secure-app']);
const remaining = taxonomy.tasks.filter(t => !featured.has(t.slug) && available.some(e => e.tasks.includes(t.slug)));
for (const task of remaining) assert.ok(more.includes(`href="/skills/?task=${task.slug}"`), `${task.slug}: remains discoverable without JavaScript`);
assert.ok(more.includes(`Browse ${remaining.length} more tasks`), 'Disclosure label reflects actual task count');
assert.ok(home.includes(`Search ${available.length} available skills`), 'Search count excludes paused skills');
assert.ok(home.includes('data-deck'), 'Keep notebook interaction');
assert.ok(home.includes('id="orig-title"'), 'Keep Fieldbook originals');
assert.ok(home.includes('id="promise-title"'), 'Keep review methodology');
console.log('Passed: task-first homepage, distinct filter/guide routes, complete native task disclosure, accurate availability and newcomer route.');
