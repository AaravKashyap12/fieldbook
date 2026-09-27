// Progressive interaction layer. Every page is complete without this file:
// copy buttons degrade to selectable text, all install methods show, the
// notebook is a still stack and SKILL.md is fully open.
import { play, isEnabled, setEnabled } from './sound.js';

const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
const liveRegion = document.getElementById('copy-status');
const store = {
  get: (key, legacy) => { try { return localStorage.getItem(key) ?? (legacy ? localStorage.getItem(legacy) : null); } catch { return null; } },
  set: (key, value) => { try { localStorage.setItem(key, value); } catch {} }
};
const KEYS = { theme: 'fieldbook:theme', agent: 'fieldbook:agent' };

// ---------------------------------------------------------------------------
// Theme. Transitions are suppressed for one frame so colours snap.
const themeToggle = document.querySelector('[data-theme-toggle]');
function renderTheme() {
  const dark = root.dataset.theme === 'dark';
  themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111214' : '#f7f7f2');
}
if (themeToggle) {
  renderTheme();
  themeToggle.addEventListener('click', () => {
    root.classList.add('theming');
    root.dataset.theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
    void root.offsetHeight;
    store.set(KEYS.theme, root.dataset.theme);
    renderTheme();
    play('toggle');
    requestAnimationFrame(() => root.classList.remove('theming'));
  });
}

// ---------------------------------------------------------------------------
// Sound toggle.
const soundToggle = document.querySelector('[data-sound-toggle]');
function renderSound() {
  const on = isEnabled();
  soundToggle.setAttribute('aria-pressed', String(on));
  soundToggle.setAttribute('aria-label', on ? 'Turn interface sounds off' : 'Turn interface sounds on');
}
if (soundToggle) {
  renderSound();
  soundToggle.addEventListener('click', () => {
    const next = !isEnabled();
    setEnabled(next);
    play(next ? 'on' : 'off', { force: true });
    renderSound();
  });
}

// A dry tick when pressing navigation, played on press so it finishes
// before the browser leaves the page.
const tickTargets = '.nav-links a, .gh-pill, .skill h3 a, .skill-actions .link, .related-list a, .button, .link, .task-list a, .quick-tasks a, .kit, .cat-nav a, .dir-row h3 a, .crumbs a, .chip, .clear-all';
document.addEventListener('pointerdown', event => {
  if (event.button === 0 && event.target.closest(tickTargets)) play('tick');
});
document.addEventListener('keydown', event => {
  if (event.key === 'Enter' && event.target.closest?.(tickTargets)) play('tick');
});

// ---------------------------------------------------------------------------
// Header: the island gains depth once the page scrolls under it.
const siteHeader = document.querySelector('[data-header]');
if (siteHeader) {
  const onScroll = () => siteHeader.toggleAttribute('data-scrolled', window.scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Nav: a soft pill follows the pointer between links.
const navLinks = document.querySelector('[data-nav-links]');
if (navLinks && finePointer.matches) {
  const pill = navLinks.querySelector('.nav-hover');
  // The pill spans the row and is clipped to the hovered link, so it slides
  // with clip-path rather than animating width.
  const moveTo = link => {
    const right = navLinks.offsetWidth - link.offsetLeft - link.offsetWidth;
    pill.style.clipPath = `inset(0 ${right}px 0 ${link.offsetLeft}px round 10px)`;
  };
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('pointerenter', () => {
      if (!navLinks.hasAttribute('data-hovering')) {
        // Arriving from outside: place the pill without sliding, then show it.
        navLinks.classList.add('no-slide');
        moveTo(link);
        void pill.offsetWidth;
        navLinks.classList.remove('no-slide');
      } else moveTo(link);
      navLinks.setAttribute('data-hovering', '');
    });
  });
  navLinks.addEventListener('pointerleave', () => navLinks.removeAttribute('data-hovering'));
}

// ---------------------------------------------------------------------------
// The notebook: click or press to turn to the next skill's page.
const deck = document.querySelector('[data-deck]');
if (deck) {
  const sheets = [...deck.querySelectorAll('.sheet')];
  if (sheets.length > 1) {
    deck.removeAttribute('aria-hidden');
    deck.setAttribute('role', 'button');
    deck.tabIndex = 0;
    sheets.forEach(sheet => sheet.setAttribute('aria-hidden', 'true'));
    deck.querySelector('.deck-hint')?.setAttribute('aria-hidden', 'true');
    const label = () => {
      const front = sheets.find(sheet => sheet.dataset.pos === '0');
      deck.setAttribute('aria-label', `Notebook showing ${front.dataset.name}. Turn to the next page.`);
    };
    // Each turn is a FLIP: read where every page is, move them in the DOM,
    // then animate from the old spot. The last keyframe is left implicit, so
    // each page settles on its live CSS position, hover spread included.
    // Clicks during a turn queue up and speed the current turn along, so
    // nothing snaps and no click is lost.
    const reduce = matchMedia('(prefers-reduced-motion: reduce)');
    const TURN = 720;
    const RETURN_EASE = 'cubic-bezier(.45, 0, .2, 1)';
    const SETTLE_EASE = 'cubic-bezier(.2, 0, 0, 1)';
    let running = [];
    let queued = 0;
    let rate = 1;
    const turn = () => {
      if (running.length) {
        queued = Math.min(queued + 1, sheets.length - 1);
        rate = 1.6;
        running.forEach(animation => animation.updatePlaybackRate?.(rate));
        return;
      }
      const n = sheets.length;
      const animate = !reduce.matches && typeof deck.animate === 'function';
      const from = animate ? sheets.map(sheet => getComputedStyle(sheet).transform) : [];
      const rest = animate ? getComputedStyle(sheets[0]).boxShadow : '';
      const lift = animate ? getComputedStyle(deck).getPropertyValue('--shadow-lift').trim() : '';
      if (animate) deck.classList.add('is-turning');
      sheets.forEach(sheet => { sheet.dataset.pos = String((Number(sheet.dataset.pos) + n - 1) % n); });
      const leaving = sheets.find(sheet => sheet.dataset.pos === String(n - 1));
      play('page');
      label();
      if (!animate) return;
      leaving.classList.add('is-leaving');
      running = sheets.map((sheet, i) => {
        const options = { duration: TURN, easing: 'linear' };
        if (sheet === leaving) return sheet.animate([
          // Lift and swing out to the left, above the pile...
          { offset: 0, transform: from[i], zIndex: 9, boxShadow: rest, easing: SETTLE_EASE },
          { offset: .38, transform: 'translate(-78px, -24px) rotate(-16deg) scale(1.03)', zIndex: 9, boxShadow: lift, easing: RETURN_EASE },
          // ...then drop behind it and slide into the back position.
          { offset: .39, zIndex: 0 }
        ], options);
        // The rest of the pile steps forward, front first, in a short ripple.
        const step = Number(sheet.dataset.pos);
        return sheet.animate([{ offset: 0, transform: from[i] }], { duration: 560, delay: 90 + step * 45, easing: SETTLE_EASE, fill: 'backwards' });
      });
      if (rate !== 1) running.forEach(animation => animation.updatePlaybackRate?.(rate));
      Promise.all(running.map(animation => animation.finished)).catch(() => {}).then(() => {
        running = [];
        leaving.classList.remove('is-leaving');
        if (queued) { queued -= 1; turn(); return; }
        rate = 1;
        deck.classList.remove('is-turning');
      });
    };
    deck.addEventListener('click', turn);
    deck.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); turn(); }
    });
    label();
  }
}

// ---------------------------------------------------------------------------
// Copy buttons: the label rolls to "Copied", the icon becomes a check, the
// change is announced and a two-note cue plays. If the clipboard is blocked,
// the text is revealed and selected so it can be copied by hand.
for (const button of document.querySelectorAll('[data-copy]')) {
  let reset;
  button.addEventListener('click', async () => {
    const target = document.getElementById(button.dataset.copy);
    if (!target) return;
    const name = button.getAttribute('aria-label').replace(/^Copy /, '');
    clearTimeout(reset);
    try {
      await navigator.clipboard.writeText(target.textContent);
      button.dataset.state = 'copied';
      liveRegion.textContent = `${name} copied to clipboard.`;
      play('success');
      reset = setTimeout(() => { delete button.dataset.state; liveRegion.textContent = ''; }, 2000);
    } catch {
      if (target.classList.contains('sr-only')) {
        target.classList.remove('sr-only');
        target.classList.add('copy-fallback');
      }
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(target);
      selection.removeAllRanges();
      selection.addRange(range);
      target.focus();
      button.dataset.state = 'select';
      liveRegion.textContent = 'Automatic copy is unavailable. The text is selected; use your device’s copy command.';
    }
  });
}

// Board tabs: the matching ranking is shown by CSS; this adds the cue.
document.querySelectorAll('[data-tabs] input[type="radio"]').forEach(input => {
  input.addEventListener('change', () => play('toggle'));
});

// ---------------------------------------------------------------------------
// Installation tabs on skill pages. The agent choice is remembered.
for (const list of document.querySelectorAll('.segmented')) {
  const tabs = [...list.querySelectorAll('[role="tab"]')];
  const panels = tabs.map(tab => document.getElementById(tab.getAttribute('aria-controls')));
  const thumb = list.querySelector('.segmented-thumb');
  const placeThumb = () => {
    const tab = tabs.find(t => t.getAttribute('aria-selected') === 'true');
    if (!tab) return;
    thumb.style.width = `${tab.offsetWidth}px`;
    thumb.style.transform = `translateX(${tab.offsetLeft}px)`;
  };
  const select = (index, { focus = false, silent = false } = {}) => {
    tabs.forEach((tab, i) => {
      const on = i === index;
      tab.setAttribute('aria-selected', String(on));
      tab.tabIndex = on ? 0 : -1;
      if (panels[i]) panels[i].hidden = !on;
    });
    placeThumb();
    if (focus) tabs[index].focus();
    if (!silent) play('toggle');
    if (tabs[index].dataset.agent !== 'prompt') store.set(KEYS.agent, tabs[index].dataset.agent);
  };
  tabs.forEach((tab, i) => {
    tab.addEventListener('click', () => { if (tab.getAttribute('aria-selected') !== 'true') select(i); });
    tab.addEventListener('keydown', event => {
      if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); select(event.key === 'Home' ? 0 : tabs.length - 1, { focus: true }); return; }
      const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      event.preventDefault();
      select((i + step + tabs.length) % tabs.length, { focus: true });
    });
  });
  const saved = store.get(KEYS.agent, 'aarav-skills:agent');
  select(Math.max(0, tabs.findIndex(tab => tab.dataset.agent === saved)), { silent: true });
  requestAnimationFrame(() => list.classList.add('ready'));
  new ResizeObserver(placeThumb).observe(list);
}

// ---------------------------------------------------------------------------
// "/" focuses the page's search from anywhere.
const slashTarget = document.querySelector('[data-slash]');
if (slashTarget) {
  document.addEventListener('keydown', event => {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const active = document.activeElement;
    if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA' || active?.tagName === 'SELECT' || active?.isContentEditable) return;
    event.preventDefault();
    slashTarget.focus();
    slashTarget.select();
  });
}

// ---------------------------------------------------------------------------
// Directory and finder. Search matches every word across name, author, stage,
// tasks, stack and labels. On the finder, facets narrow the list: options in
// one group combine with OR, groups combine with AND, and every "Only skills
// that" limit must hold. Each option shows how many skills it would leave.
// The whole state lives in the URL, so a filtered view can be saved or shared.
const dir = document.querySelector('[data-directory]');
const dirList = dir?.querySelector('[data-dir-list]');
const dirSearch = dir?.querySelector('[data-dir-search]');
if (dir && dirList && dirSearch) {
  const rows = [...dirList.children];
  const sort = dir.querySelector('[data-dir-sort]');
  const count = dir.querySelector('[data-dir-count]');
  const empty = dir.querySelector('[data-dir-empty]');
  const queryEcho = dir.querySelector('[data-dir-query]');
  const queryWrap = dir.querySelector('[data-dir-query-wrap]');
  const form = dir.querySelector('[data-filters]');
  const active = dir.querySelector('[data-active]');
  const clearAll = dir.querySelector('[data-clear-all]');
  const panel = dir.querySelector('[data-filters-panel]');
  const panelCount = dir.querySelector('[data-filters-count]');
  const GROUPS = ['task', 'stack', 'limit', 'stage', 'source'];
  const label = n => `${n} ${n === 1 ? 'skill' : 'skills'}`;
  const words = () => dirSearch.value.trim().toLowerCase().split(/\s+/).filter(Boolean);

  // Precompute what each row offers, once.
  const facts = new Map(rows.map(row => [row, {
    task: new Set(row.dataset.tasks?.split(' ').filter(Boolean)),
    stack: new Set(row.dataset.stack?.split(' ').filter(Boolean)),
    access: new Set(row.dataset.access?.split(' ').filter(Boolean)),
    stage: row.dataset.cat,
    source: row.dataset.source,
    read: row.dataset.read === '1',
    name: row.querySelector('h3')?.textContent.toLowerCase() || ''
  }]));
  const LIMIT_TESTS = {
    guidance: f => f.access.size === 0,
    'no-commands': f => !f.access.has('commands'),
    'no-edits': f => !f.access.has('edits'),
    'no-network': f => !f.access.has('network'),
    'no-mcp': f => !f.access.has('mcp')
  };
  const matchesGroup = (f, group, values) => {
    if (!values.length) return true;
    if (group === 'task') return values.some(v => f.task.has(v));
    // A stack pick means "works with my stack": general skills qualify too, and
    // stack-specific ones are ranked first (see `how` below).
    if (group === 'stack') return values.some(v => (v === 'any' ? f.stack.size === 0 : f.stack.has(v) || f.stack.size === 0));
    if (group === 'limit') return values.every(v => LIMIT_TESTS[v]?.(f) ?? true);
    if (group === 'stage') return values.includes(f.stage);
    if (group === 'source') return values.some(v => (v === 'read' ? f.read : f.source === v));
    return true;
  };
  const selected = () => Object.fromEntries(GROUPS.map(g => [g, form ? [...form.querySelectorAll(`input[name="${g}"]:checked`)].map(i => i.value) : []]));
  const passes = (row, state, q, skip) => {
    const f = facts.get(row);
    if (q.length && !q.every(w => row.dataset.search.includes(w))) return false;
    return GROUPS.every(g => g === skip || matchesGroup(f, g, state[g]));
  };
  const score = (row, q) => {
    const f = facts.get(row);
    return q.reduce((sum, w) => sum + (f.name.includes(w) ? 3 : 0) + (row.dataset.search.includes(w) ? 1 : 0), 0);
  };
  const keys = {
    installs: (a, b) => b.dataset.installs - a.dataset.installs,
    today: (a, b) => b.dataset.today - a.dataset.today || b.dataset.installs - a.dataset.installs,
    added: (a, b) => b.dataset.added.localeCompare(a.dataset.added) || b.dataset.installs - a.dataset.installs,
    name: (a, b) => a.dataset.name.localeCompare(b.dataset.name)
  };

  // Restore state from the URL: ?q=&task=a,b&stack=&limit=&stage=&source=&sort=
  const params = new URLSearchParams(location.search);
  dirSearch.value = params.get('q') || '';
  if (form) for (const g of GROUPS) for (const v of (params.get(g) || '').split(',').filter(Boolean)) {
    const input = form.querySelector(`input[name="${g}"][value="${CSS.escape(v)}"]`);
    if (input) { input.checked = true; input.closest('details.facet')?.setAttribute('open', ''); }
  }
  const supportsSort = value => sort && [...sort.options].some(option => option.value === value);
  const defaultSort = () => dirSearch.value.trim() && supportsSort('match') ? 'match' : 'installs';
  if (sort) sort.value = supportsSort(params.get('sort')) ? params.get('sort') : defaultSort();
  let sortTouched = Boolean(params.get('sort'));
  if (panel && matchMedia('(max-width: 880px)').matches && !GROUPS.some(g => params.get(g))) panel.removeAttribute('open');

  const apply = ({ remember = true } = {}) => {
    const q = words();
    const state = selected();
    let shown = 0;
    for (const row of rows) { const hit = passes(row, state, q); row.hidden = !hit; if (hit) shown += 1; }
    const base = sort?.value === 'match' && q.length ? (a, b) => score(b, q) - score(a, q) || keys.installs(a, b) : keys[sort?.value] || keys.installs;
    const stacks = state.stack.filter(v => v !== 'any');
    const specific = row => (stacks.some(v => facts.get(row).stack.has(v)) ? 1 : 0);
    const how = stacks.length ? (a, b) => specific(b) - specific(a) || base(a, b) : base;
    dirList.append(...[...rows].sort(how));

    const picked = GROUPS.reduce((n, g) => n + state[g].length, 0);
    const filtered = q.length || picked;
    if (count) count.textContent = filtered ? `${shown} of ${label(rows.length)}` : label(rows.length);
    if (empty) { empty.hidden = shown > 0; if (queryEcho) queryEcho.textContent = dirSearch.value.trim(); if (queryWrap) queryWrap.hidden = !q.length; }

    if (form) {
      // Counts: how many skills each option would leave, given everything else.
      for (const input of form.querySelectorAll('input[type="checkbox"]')) {
        const g = input.name;
        const trial = { ...state, [g]: g === 'limit' ? [...new Set([...state.limit, input.value])] : [input.value] };
        const n = rows.reduce((sum, row) => sum + (passes(row, trial, q) ? 1 : 0), 0);
        const out = input.closest('.facet-option');
        out.querySelector('[data-n]').textContent = n;
        out.classList.toggle('is-empty', n === 0 && !input.checked);
      }
      for (const box of form.querySelectorAll('details.facet')) {
        const k = state[box.dataset.facet].length;
        box.querySelector('[data-picked]').textContent = k ? ` ${k}` : '';
      }
      if (panelCount) panelCount.textContent = picked ? ` ${picked}` : '';
      if (clearAll) clearAll.hidden = !picked;
      if (active) {
        active.hidden = !picked;
        active.replaceChildren(...GROUPS.flatMap(g => state[g].map(v => {
          const input = form.querySelector(`input[name="${g}"][value="${CSS.escape(v)}"]`);
          const chip = document.createElement('button');
          chip.type = 'button';
          chip.className = 'chip';
          chip.textContent = input.closest('.facet-option').querySelector('.facet-label').textContent;
          chip.setAttribute('aria-label', `Remove filter: ${chip.textContent}`);
          chip.addEventListener('click', () => { input.checked = false; apply(); play('toggle'); dirSearch.focus({ preventScroll: true }); });
          return chip;
        })));
      }
    }

    if (remember) {
      const next = new URLSearchParams();
      if (dirSearch.value.trim()) next.set('q', dirSearch.value.trim());
      for (const g of GROUPS) if (state[g].length) next.set(g, state[g].join(','));
      if (sort && sortTouched && !(sort.value === 'installs' && !q.length)) next.set('sort', sort.value);
      history.replaceState(null, '', `${location.pathname}${next.size ? `?${next}` : ''}`);
    }
  };

  dirSearch.addEventListener('input', () => {
    if (sort && !sortTouched) sort.value = defaultSort();
    apply();
  });
  dirSearch.addEventListener('keydown', event => { if (event.key === 'Escape') { dirSearch.value = ''; if (sort && !sortTouched) sort.value = 'installs'; apply(); } });
  sort?.addEventListener('change', () => { sortTouched = true; apply(); play('toggle'); });
  form?.addEventListener('change', () => { apply(); play('tick'); });
  form?.addEventListener('submit', event => event.preventDefault());
  clearAll?.addEventListener('click', () => { form.querySelectorAll('input:checked').forEach(i => { i.checked = false; }); apply(); play('toggle'); });
  apply({ remember: false });
}

// ---------------------------------------------------------------------------
// Submit: name the GitHub issue after the skill so submissions are easy to triage.
const submitForm = document.querySelector('[data-submit-form]');
if (submitForm) {
  submitForm.addEventListener('submit', () => {
    const repo = submitForm.elements.repository.value.trim().replace(/^https:\/\/github\.com\//, '').replace(/\/$/, '');
    const skill = submitForm.elements.skill.value.trim();
    submitForm.querySelector('[data-submit-title]').value = `Skill submission: ${repo}/${skill}`;
    play('success');
  });
}

// ---------------------------------------------------------------------------
// SKILL.md disclosure. Height is not animated; the fade and label carry it.
for (const button of document.querySelectorAll('[data-expand]')) {
  const box = document.getElementById(button.getAttribute('aria-controls'))?.closest('.skillmd');
  const srLabel = button.querySelector('[data-expand-label]');
  if (!box) continue;
  box.dataset.open = 'false';
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    box.dataset.open = String(open);
    if (srLabel) srLabel.textContent = open ? 'Show less' : 'Show the whole file';
    play('toggle');
    if (!open) box.scrollIntoView({ block: 'start', behavior: reduceMotion.matches ? 'auto' : 'smooth' });
  });
}
