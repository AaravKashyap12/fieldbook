import assert from 'node:assert/strict';
import { compareMatches, defaultFinderSort } from '../assets/finder.js';

const state = { task: ['fix-bug'], stack: [] };
const skill = (name, task, installs, stack = []) => ({ name, task: new Set(task), stack: new Set(stack), installs });
const focused = skill('Systematic debugging', ['fix-bug'], 10);
const broad = skill('General engineering', ['fix-bug', 'plan-feature', 'write-tests'], 100000);
assert.ok(compareMatches(focused, broad, '', state) < 0, 'A focused debugging skill should outrank a more popular general skill');
assert.equal(defaultFinderSort('', state), 'match', 'Task-filtered results default to fit');
assert.equal(defaultFinderSort('', { task: [], stack: ['react'] }), 'match');
assert.equal(defaultFinderSort('debug', { task: [], stack: [] }), 'match');
assert.equal(defaultFinderSort('  ', { task: [], stack: [] }), 'installs');
assert.equal(defaultFinderSort('debug', state, false), 'installs', 'Category lists without match keep their supported default');
const exact = skill('Debug', ['fix-bug', 'write-tests'], 0);
assert.ok(compareMatches(exact, focused, 'debug', state) < 0, 'Exact name wins over partial matches');
const react = skill('React debugging', ['fix-bug', 'write-tests'], 0, ['react']);
assert.ok(compareMatches(react, focused, '', { ...state, stack: ['react'] }) < 0, 'Matching stack comes before general skills');
assert.ok(compareMatches(focused, react, '', { ...state, stack: ['any'] }) < 0, 'General-only is not a stack-specific boost');
const both = skill('Focused workflow', ['fix-bug', 'write-tests'], 0);
assert.ok(compareMatches(both, focused, '', { ...state, task: ['fix-bug', 'write-tests'] }) < 0, 'Covering both selected tasks comes before covering only one');
assert.ok(compareMatches(focused, { ...focused, installs: 20 }, '', state) > 0, 'Popularity only breaks equal-fit ties');
assert.ok(compareMatches(skill('Alpha', ['fix-bug'], 10), skill('Beta', ['fix-bug'], 10), '', state) < 0, 'Equal ranks have deterministic name ordering');
console.log('Passed: finder fit ranking and contextual defaults.');

// Exercise the actual browser wiring with small DOM boundary doubles. The
// filtering, event handlers and URL persistence below are production app code.
const { readFile } = await import('node:fs/promises');
const { runInNewContext } = await import('node:vm');
const app = await readFile(new URL('../assets/app.js', import.meta.url), 'utf8');
const directoryCode = app.slice(app.indexOf("const dir = document.querySelector('[data-directory]');"), app.indexOf('// Submit: name the GitHub issue'));
function browser(search = '') {
  const target = extra => ({ handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, ...extra });
  const input = target({ value: '', focus() {} });
  const sort = target({ value: 'installs', options: ['match', 'installs', 'today', 'added', 'name'].map(value => ({ value })) });
  const choices = ['fix-bug', 'react'].map((value, i) => ({ name: i ? 'stack' : 'task', value, checked: false, closest() { return null; } }));
  const form = target({
    querySelector(selector) { return choices.find(c => selector.includes(`name="${c.name}"`) && selector.includes(`value="${c.value}"`)); },
    querySelectorAll(selector) {
      if (selector === 'input:checked') return choices.filter(c => c.checked);
      if (selector.endsWith(':checked')) return choices.filter(c => c.checked && selector.includes(`name="${c.name}"`));
      return [];
    }
  });
  const clear = target({ hidden: true });
  const rows = [broad, focused].map(e => ({
    dataset: { name: e.name.toLowerCase(), tasks: [...e.task].join(' '), stack: [...e.stack].join(' '), access: '', search: `${e.name} debug`, installs: String(e.installs), today: '0', added: '2026-01-01' },
    querySelector() { return { textContent: e.name }; }
  }));
  const list = { children: rows, append(...ordered) { this.children = ordered; } };
  const dir = { querySelector(selector) { return ({ '[data-dir-list]': list, '[data-dir-search]': input, '[data-dir-sort]': sort, '[data-filters]': form, '[data-clear-all]': clear })[selector] || null; } };
  let url = '/skills/' + search;
  runInNewContext(directoryCode, {
    document: { querySelector() { return dir; } },
    location: { search, pathname: '/skills/' }, history: { replaceState(a, b, next) { url = next; } },
    URLSearchParams, CSS: { escape: value => value }, matchMedia: () => ({ matches: false }),
    compareMatches, defaultFinderSort, play() {}
  });
  return { input, sort, choices, form, clear, list, url: () => url };
}
const page = browser('?task=fix-bug');
assert.equal(page.sort.value, 'match');
assert.equal(page.list.children[0].dataset.name, 'systematic debugging');
page.sort.value = 'installs';
page.sort.handlers.change();
assert.equal(page.list.children[0].dataset.name, 'general engineering');
assert.ok(page.url().includes('sort=installs'));
const reloaded = browser(page.url().split('?')[1] ? '?' + page.url().split('?')[1] : '');
assert.equal(reloaded.sort.value, 'installs', 'Explicit popularity survives reload with task filters');
reloaded.clear.handlers.click();
assert.equal(reloaded.sort.value, 'installs');
assert.ok(reloaded.url().includes('sort=installs'), 'Explicit choice remains encoded even after clearing');
const automatic = browser();
assert.equal(automatic.sort.value, 'installs');
automatic.choices[0].checked = true;
automatic.form.handlers.change();
assert.equal(automatic.sort.value, 'match', 'Choosing a task switches to fit without a search term');
automatic.input.value = 'debug';
automatic.input.handlers.input();
automatic.input.handlers.keydown({ key: 'Escape' });
assert.equal(automatic.sort.value, 'match', 'Clearing query retains task-driven fit');
automatic.clear.handlers.click();
assert.equal(automatic.sort.value, 'installs', 'Clearing the final task restores the blank-directory default');
const invalid = browser('?sort=invalid');
invalid.choices[1].checked = true;
invalid.form.handlers.change();
assert.equal(invalid.sort.value, 'match', 'Unknown URL sort does not lock out contextual defaults');
console.log('Passed: finder task selection, query clearing, explicit sorts, URL reload and reset wiring.');
