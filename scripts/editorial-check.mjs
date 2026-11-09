import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const home = await read('dist/index.html');
assert.equal((home.match(/class="task-art"/g) || []).length, 4, 'Each task has its own authored illustration');
assert.equal((home.match(/class="task-art"[^>]*aria-hidden="true"/g) || []).length, 4, 'Decorative drawings stay out of accessible link names');
assert.ok(home.includes('class="catalog-note"'), 'Hero has a factual directory footnote');
assert.ok(home.includes('class="marquee-control"'), 'Moving agent strip exposes a pause control');
for (const slug of ['fix-bug', 'write-tests', 'review-code', 'secure-app']) {
  const page = await read(`dist/tasks/${slug}/index.html`);
  assert.ok(page.includes('aria-label="In this guide"'), `${slug} has native contents navigation`);
  for (const id of ['choose-title', 'prepare-title', 'results-title', 'verify-title']) {
    assert.ok(page.includes(`href="#${id}"`) && page.includes(`id="${id}"`), `${slug}: contents link resolves to ${id}`);
  }
}
const css = await read('assets/styles.css');
assert.ok(css.includes('scroll-padding-top: 112px'), 'Anchor targets account for the sticky header');
assert.ok(css.includes('.marquee[data-paused] .marquee-track'), 'Pause state stops the agent motion');
assert.ok(css.includes('.task-art') && css.includes('(prefers-reduced-motion: reduce)'), 'Illustrations use the existing reduced-motion contract');
console.log('Passed: authored decorative task art, factual hero note, native guide contents, sticky-header clearance and pausable compatibility motion.');
