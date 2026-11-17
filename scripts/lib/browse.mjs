// Home directory preview: quiet stage tabs over an open two-column list of
// the most-installed skills, each with one copy action. Without JavaScript the
// tabs are links to the stage pages and only the overall top entries show;
// app.js turns the tabs into in-place filters.
import { esc, plural } from './util.mjs';
import { icon } from './icons.mjs';
import { entry, listNote } from './parts.mjs';

export const BROWSE = { all: 8, stage: 6 };

// ranked: available listings sorted by installs. stages: categories in use.
export function browseSection(ranked, stages) {
  const available = ranked.filter(e => !e.paused);
  const counts = Object.fromEntries(stages.map(c => [c.slug, available.filter(e => e.category === c.slug).length]));
  const tabs = stages.filter(c => counts[c.slug] > 0);
  const top = new Set(available.slice(0, BROWSE.all));
  const shown = new Set(top);
  for (const c of tabs) available.filter(e => e.category === c.slug).slice(0, BROWSE.stage).forEach(e => shown.add(e));
  // Entries stay in overall install order, so any stage subset is already ranked.
  const rows = available.filter(e => shown.has(e));
  let rank = 0;
  const shownRows = rows.map((e, i) => entry(e, { cls: 'browse-row', attrs: ` data-stage="${esc(e.category)}"${top.has(e) ? ` data-top="${++rank}"` : ' hidden'}`, copyId: `browse-install-${i}`, stage: false }));
  const tab = (slug, href, label, n, current) => `<a href="${href}" data-browse-tab="${slug}" data-count="${n}" data-label="${esc(label)}"${current ? ' aria-current="true"' : ''}>${esc(label)}<span class="cat-count">${n}</span></a>`;
  return `<section class="wrap browse" id="browse" aria-labelledby="browse-title">
<div class="browse-head"><h2 id="browse-title" class="section-title">Most installed</h2><nav class="browse-tabs" aria-label="Browse by stage" data-browse-tabs>${tab('all', '/skills/', 'All', available.length, true)}${tabs.map(c => tab(c.slug, `/c/${c.slug}/`, c.short, counts[c.slug], false)).join('')}</nav></div>
<ol class="browse-list" data-browse-list data-per-stage="${BROWSE.stage}">${shownRows.join('')}</ol>
<div class="browse-foot"><p class="browse-status" data-browse-status role="status">Top ${Math.min(BROWSE.all, available.length)} of ${plural(available.length, 'available skill')}</p><a class="link" href="/skills/" data-browse-more>Open the full directory ${icon('chevron')}</a></div>
${listNote(rows, ' Counts come from skills.sh and measure use, not quality.')}
</section>`;
}
