// One icon set, 1.5px stroke, 24px grid, currentColor.
const shapes = {
  arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  chevron: '<path d="m9 6 6 6-6 6"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M13 15h4"/>',
  sliders: '<path d="M5 4v6m0 4v6M12 4v2m0 4v10M19 4v10m0 4v2"/><circle cx="5" cy="12" r="2"/><circle cx="12" cy="8" r="2"/><circle cx="19" cy="16" r="2"/>',
  shield: '<path d="M12 3 5 6v5.5c0 4.2 2.9 7.9 7 9.5 4.1-1.6 7-5.3 7-9.5V6l-7-3Z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  bug: '<rect x="7.5" y="7" width="9" height="13" rx="4.5"/><path d="M12 11v9M9.5 4.5 11 7M14.5 4.5 13 7M7.5 12H4M7.5 16H4.5M16.5 12H20M16.5 16h3"/>',
  review: '<circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M6 8v6a4 4 0 0 0 4 4h6M18 16v-6a4 4 0 0 0-4-4H8"/>',
  gauge: '<path d="M4.5 17a8 8 0 1 1 15 0"/><path d="m12 15 4-5"/><circle cx="12" cy="15.5" r="1"/>',
  ship: '<path d="M20.5 3.5 3.5 10.2l6.8 2.9 2.9 6.8 7.3-16.4Z"/><path d="m10.3 13.1 4.3-4.3"/>',
  nodes: '<circle cx="12" cy="5" r="2"/><circle cx="5" cy="19" r="2"/><circle cx="19" cy="19" r="2"/><path d="M12 7v5M12 12l-5.6 5.3M12 12l5.6 5.3"/>',
  layers: '<path d="m12 3.5 8.5 4.5-8.5 4.5L3.5 8 12 3.5Z"/><path d="m3.5 12.5 8.5 4.5 8.5-4.5"/><path d="m3.5 16.5 8.5 4.5 8.5-4.5"/>',
  cloud: '<path d="M7.5 18.5h9.5a4 4 0 0 0 .6-7.96A6 6 0 0 0 6.1 9.6 4.5 4.5 0 0 0 7.5 18.5Z"/>',
  database: '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8V6"/><path d="M5 12c0 1.55 3.13 2.8 7 2.8s7-1.25 7-2.8"/>',
  braces: '<path d="M8.5 4.5c-2 0-2.5 1-2.5 3v2c0 1.2-.7 2.5-2 2.5 1.3 0 2 1.3 2 2.5v2c0 2 .5 3 2.5 3M15.5 4.5c2 0 2.5 1 2.5 3v2c0 1.2.7 2.5 2 2.5-1.3 0-2 1.3-2 2.5v2c0 2-.5 3-2.5 3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
  book: '<path d="M12 6C9 4 5 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-2-1-6-1-9 1Zm0 0v14"/>',
  rss: '<path d="M5 5a14 14 0 0 1 14 14M5 11a8 8 0 0 1 8 8"/><circle cx="6" cy="18" r="1.2"/>',
  sound: '<path d="M4 10v4h3l4 4V6L7 10H4Z"/><path class="w1" d="M15 9.5a3.5 3.5 0 0 1 0 5"/><path class="w2" d="M17.5 7a7 7 0 0 1 0 10"/><path class="sl" d="m15.5 9.5 5 5m0-5-5 5"/>',
  theme: '<g class="sun"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4"/></g><path class="moon" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>'
};
export const icon = (name, cls = '') => `<svg class="icon${cls ? ` ${cls}` : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shapes[name] || shapes.book}</svg>`;

export const categoryIcon = { plan: 'compass', build: 'terminal', debug: 'bug', review: 'review', security: 'shield', performance: 'gauge', ship: 'ship', agents: 'nodes', cloud: 'cloud', data: 'database', languages: 'braces' };

export const githubMark = '<svg class="gh-mark" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';

// The mark: a field notebook with an elastic band. Cut-outs take the page colour.
export const mark = '<svg class="brand-mark" viewBox="0 0 20 20" aria-hidden="true"><rect x="3" y="1.5" width="14" height="17" rx="2.5" fill="currentColor"/><path d="M6.5 1.5v17" stroke="var(--bg)" stroke-width="1.1"/><path d="M9.25 6.5h4.5M9.25 9.25h3" stroke="var(--bg)" stroke-width="1.3" stroke-linecap="round"/><path d="M14.75 1.5v17" stroke="var(--bg)" stroke-width=".9" opacity=".55"/></svg>';

export const favicon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="9" fill="#2758ce"/><rect x="11" y="7" width="18" height="26" rx="3" fill="#fff"/><path d="M15.5 7v26" stroke="#2758ce" stroke-width="1.6"/><path d="M19 15h6M19 19h4" stroke="#2758ce" stroke-width="1.8" stroke-linecap="round"/></svg>';
