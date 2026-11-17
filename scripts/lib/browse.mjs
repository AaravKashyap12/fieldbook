// Home directory preview: stage tabs over compact ranked rows with a copy
// action. Without JavaScript the tabs are links to the stage pages and only
// the overall top rows show; app.js turns the tabs into in-place filters.
import { esc, pad, plural } from './util.mjs';
import { icon } from './icons.mjs';
import { copyLabel, installs, accessText, installCaution } from './parts.mjs';

export const BROWSE = { all: 8, stage: 5 };

function row(e, i, { top, rank }) {
  const id = `browse-install-${i}`;
  const evidence = e.retained ? '<span class="browse-flag">Last good scan</span>' : !e.revision ? '<span class="browse-flag">Unpinned source</span>' : '';
  return `<li class="browse-row" data-stage="${esc(e.category)}"${top ? ` data-top="${rank}"` : ' hidden'}><span class="browse-rank" aria-hidden="true">${top ? pad(rank) : ''}</span><div class="browse-main"><h3><a href="${e.url}">${esc(e.name)}</a></h3><p class="browse-meta"><span>${esc(e.author.name)}</span><span>${esc(e.categoryInfo.short)}</span><span><span class="sr-only">What it can touch: </span>${esc(accessText(e))}</span>${e.readAt ? '<span class="tag-read">Read in full</span>' : ''}${evidence}</p><p class="browse-summary">${esc(e.summary)}</p></div><p class="browse-stat">${installs(e)}<small>${e.stats.installs == null ? 'not counted' : 'installs'}</small></p><div class="browse-action"><button type="button" class="copy-button" data-copy="${id}" aria-label="Copy the install command for ${esc(e.name)}">${copyLabel('Copy install')}</button><code id="${id}" tabindex="-1" class="sr-only">${esc(e.install)}</code></div></li>`;
}

// ranked: available listings sorted by installs. stages: categories in use.
export function browseSection(ranked, stages) {
  const available = ranked.filter(e => !e.paused);
  const counts = Object.fromEntries(stages.map(c => [c.slug, available.filter(e => e.category === c.slug).length]));
  const tabs = stages.filter(c => counts[c.slug] > 0);
  const top = new Set(available.slice(0, BROWSE.all));
  const shown = new Set(top);
  for (const c of tabs) available.filter(e => e.category === c.slug).slice(0, BROWSE.stage).forEach(e => shown.add(e));
  // Rows stay in overall install order, so any stage subset is already ranked.
  const rows = available.filter(e => shown.has(e));
  let rank = 0;
  const shownRows = rows.map((e, i) => row(e, i, { top: top.has(e), rank: top.has(e) ? ++rank : 0 }));
  const tab = (slug, href, label, n, current) => `<a href="${href}" data-browse-tab="${slug}" data-count="${n}" data-label="${esc(label)}"${current ? ' aria-current="true"' : ''}>${esc(label)}<span class="cat-count">${n}</span></a>`;
  return `<section class="wrap browse" id="browse" aria-labelledby="browse-title">
<div class="section-intro"><h2 id="browse-title" class="section-title">Browse the<br><em>directory.</em></h2><p>The most-installed available skills, by stage of the work. Counts come from skills.sh and measure use, not quality.</p></div>
<nav class="browse-tabs" aria-label="Browse by stage" data-browse-tabs>${tab('all', '/skills/', 'All', available.length, true)}${tabs.map(c => tab(c.slug, `/c/${c.slug}/`, c.short, counts[c.slug], false)).join('')}</nav>
<ol class="browse-list" data-browse-list>${shownRows.join('')}</ol>
<div class="browse-foot"><p class="browse-status" data-browse-status role="status">Top ${Math.min(BROWSE.all, available.length)} of ${plural(available.length, 'available skill')}</p><a class="link" href="/skills/" data-browse-more>Open the full directory ${icon('chevron')}</a></div>
${installCaution(rows).replace('</p>', ' Copying a command does not run it. A review is not a security audit or a guarantee.</p>')}
</section>`;
}
