import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadContent } from './lib/data.mjs';
import { SITE } from './lib/shell.mjs';
import { fileURLToPath } from 'node:url';
import { taskGuides, taskUrl, skillsForTask, taskPage } from './lib/tasks.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const { entries, taxonomy } = await loadContent(root);
const read = route => readFile(new URL(`../dist${route}index.html`, import.meta.url), 'utf8');
const home = await read('/');
const sitemap = await readFile(new URL('../dist/sitemap.xml', import.meta.url), 'utf8');
for (const task of ['fix-bug', 'write-tests', 'review-code', 'secure-app']) {
  const route = `/tasks/${task}/`;
  const html = await read(route);
  assert.ok(home.includes(`href="${route}"`), `${task}: discoverable from home`);
  assert.ok(sitemap.includes(`<loc>${SITE.origin}${route}</loc>`), `${task}: sitemap destination`);
  assert.ok(html.includes(`rel="canonical" href="${SITE.origin}${route}"`));
  assert.ok(!html.includes('noindex'), `${task}: indexable`);
  assert.ok(html.includes(`href="/skills/?task=${task}"`), `${task}: refine in existing finder`);
  for (const heading of ['Choose a skill', 'Before you install', 'Check the result', 'Skills for this task']) {
    assert.ok(html.includes(`>${heading}</h2>`), `${task}: useful guidance in served HTML`);
  }
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/)[1]);
  const items = graph['@graph'].find(n => n['@type'] === 'CollectionPage').mainEntity.itemListElement;
  const expected = entries.filter(e => !e.paused && e.tasks.includes(task));
  assert.deepEqual(items.map(e => new URL(e.url).pathname).sort(), expected.map(e => e.url).sort());
  const rows = [...html.matchAll(/<li class="dir-row[^>]*data-name="([^"]+)"/g)];
  assert.equal(rows.length, expected.length, `${task}: only matching available skills`);
  for (const entry of expected) {
    assert.ok(html.includes(`href="${entry.url}"`), `${task}: skill visible without JavaScript`);
    assert.ok((await read(entry.url)).includes(`href="${route}"`), `${task}: detail links back to task`);
  }
}
assert.equal(new Set(taskGuides.map(t => t.slug)).size, taskGuides.length);
for (const task of taskGuides) assert.ok(taxonomy.tasks.some(t => t.slug === task.slug));
assert.equal(taskUrl('plan-feature'), '/skills/?task=plan-feature', 'Other tasks keep the finder route');
const task = taskGuides[0];
const matches = entries.filter(e => e.tasks.includes(task.slug));
const unavailable = matches.map(e => ({ ...e, paused: true }));
assert.deepEqual(skillsForTask(unavailable, task.slug), [], 'Paused skills never enter task collections');
const empty = taskPage(task, unavailable);
assert.ok(empty.includes('No skills for this task are currently available'));
assert.ok(!empty.includes('data-copy='), 'Empty task pages offer no installation commands');
const mixed = skillsForTask([...unavailable, ...entries.filter(e => !e.paused)], task.slug);
assert.equal(mixed.length, matches.filter(e => !e.paused).length);
const escaped = taskPage({ ...task, intro: '<script>probe</script>' }, []);
assert.ok(!escaped.includes('<script>probe'));
assert.ok(escaped.includes('&lt;script&gt;probe'));
console.log('Passed: four crawlable task guides, useful content, exact available listings, finder refinement and reciprocal links.');

const directoryHtml = await read('/skills/');
assert.ok(directoryHtml.includes('id="directory-guide-title"'), 'Directory serves selection guidance without JavaScript');
for (const slug of ['review-code', 'fix-bug', 'write-tests', 'secure-app']) {
  assert.ok(directoryHtml.includes(`href="/tasks/${slug}/"`), 'Directory links to each curated guide');
}
const reviewCategoryHtml = await read('/c/review/');
assert.ok(reviewCategoryHtml.includes('id="review-choice-title"'), 'Review category distinguishes review jobs');
assert.ok(reviewCategoryHtml.includes('href="/tasks/review-code/#review-brief-title"'), 'Review category links to concrete review brief');
const reviewTaskHtml = await read('/tasks/review-code/');
assert.ok(reviewTaskHtml.includes('id="review-brief-title"'), 'Review example is in generated HTML');
assert.ok(reviewTaskHtml.includes('not a report from a tested project'), 'Example does not imply first-hand evidence');
assert.ok(!(await read('/tasks/fix-bug/')).includes('id="review-brief-title"'), 'Review example is not duplicated across unrelated task pages');
console.log('Passed: directory decision guidance, contextual review category link, and clearly illustrative review brief.');
