import { esc, pad, compact, exact, signed, humanDate, plural } from './util.mjs';
import { icon, categoryIcon } from './icons.mjs';
import { ACCESS } from './data.mjs';
import { count, deltaValue } from './security.mjs';

export const copyLabel = idle => `<span class="copy-icons" aria-hidden="true">${icon('copy', 'ic-copy')}${icon('check', 'ic-check')}</span><span class="copy-label" aria-hidden="true"><span>${idle}</span><span>Copied</span><span>Select</span></span>`;

export function codeBlock(text, label, id, { command = false } = {}) {
  return `<div class="code-block${command ? ' is-command' : ''}"><div class="code-head"><span>${esc(label)}</span><button type="button" class="copy-button" data-copy="${id}" aria-label="Copy ${esc(label)}">${copyLabel('Copy')}</button></div><pre id="${id}" tabindex="0"><code>${esc(text)}</code></pre></div>`;
}

export const catIcon = (slug, cls = '') => icon(categoryIcon[slug] || 'book', cls);
export const accessText = e => e.access.length ? e.access.map(a => ACCESS[a].label).join(' · ') : 'Guidance only';

export function installCaution(entries = []) {
  const list = Array.isArray(entries) ? entries : [entries];
  const pinned = list.filter(e => e.revision).length;
  const message = pinned && pinned === list.length
    ? 'Commands target the repository commits recorded with the automated scans. Scans cover only SKILL.md, not referenced files or runtime behavior.'
    : pinned ? `${pinned} of ${list.length} commands target recorded commits. The others install the current upstream version and may differ from the scan. Check each listing’s source revision.`
    : 'Installs the upstream repository’s current version, not a pinned reviewed revision. The source may have changed since the check.';
  return `<p class="install-help install-caution">${message} <a class="inline-link" href="/review/#versions">What the review covers</a>.</p>`;
}

// Keep scan, human reading and runtime evidence separate. None establishes
// that a moving upstream source still matches a previously checked file.
// compact: a one-line native disclosure that opens to the same evidence.
export function reviewEvidence(e, { compact = false } = {}) {
  const status = e.paused ? 'Installation paused' : e.retained ? 'Last good scan retained' : 'Automated scan recorded';
  const scan = e.paused ? esc(e.reviewReason)
    : e.retained ? `Latest fetch failed. Last successful scan: ${humanDate(e.review.checkedAt)}. Current upstream content is unverified.`
    : `Checked ${humanDate(e.review.checkedAt)}. Checks SKILL.md patterns and frontmatter; does not run the skill.`;
  const reading = e.readAt ? `Full reading recorded ${humanDate(e.readAt)}; not bound to the current source revision.` : 'No full human-reading date recorded.';
  const runtime = e.original && e.data?.evidence
    ? `<a class="inline-link" href="${esc(e.data.evidence)}" target="_blank" rel="noopener noreferrer">Published evaluation notes<span class="sr-only"> (opens in a new tab)</span></a>. Evaluation date not recorded here; see the notes for dates, scope and limitations. Not a test of every upstream revision.`
    : 'No runtime-test evidence recorded here.';
  const revision = e.revision ? `<a class="inline-link" href="${esc(e.sourceUrl)}" target="_blank" rel="noopener noreferrer" title="${e.revision}">${e.revision.slice(0, 12)}<span class="sr-only"> (opens in a new tab)</span></a>. ${e.paused ? 'Installation is paused for this revision.' : e.retained ? 'Last successful scan; newer upstream changes are unverified.' : 'The install command targets this commit.'} Only SKILL.md was scanned.` : 'No repository commit recorded. Install command is unpinned.';
  const content = `<ul class="evidence-list"><li><strong>Automated scan:</strong> ${scan}</li><li><strong>Source revision:</strong> ${revision}</li><li><strong>Human reading:</strong> ${esc(reading)}</li><li><strong>Runtime evidence:</strong> ${runtime}</li></ul><p class="install-help">A review is not a security audit or a guarantee.</p>`;
  return compact ? `<details class="review-evidence fold"><summary>${icon('check', 'fold-mark')}<span class="fold-label">${status}<span class="fold-more">evidence and limits</span></span></summary>${content}</details>`
    : `<div class="review-evidence"><p class="evidence-status">${status}</p>${content}</div>`;
}

// One footnote for a list of copy actions, instead of a paragraph per row.
export const listNote = (entries, extra = '') => `<details class="fold list-note-fold"><summary>Before you install<span class="fold-more">Source pins and review limits</span></summary>${installCaution(entries).replace('</p>', ` Copying a command does not run it. A review is not a security audit or a guarantee.${extra}</p>`).replace('install-help install-caution', 'install-help install-caution list-note')}</details>`;

export const delta = (n, suffix = '') => deltaValue(n) == null ? '' : `<span class="delta${n > 0 ? ' is-up' : ''}" title="${esc(exact(n))}${esc(suffix)}">${esc(signed(n))}${suffix ? `<span class="sr-only">${suffix}</span>` : ''}</span>`;
// Installs, with the exact figure in a title for anyone who wants it.
const installText = e => count(e.stats.installs) == null ? '<span class="is-none">Not counted yet</span>' : `<span title="${esc(exact(e.stats.installs))} installs on skills.sh">${esc(compact(e.stats.installs))} installs</span>`;

// Exceptions worth seeing before copying; the full evidence lives on the skill page.
export const entryFlags = e => `${e.original ? '<span class="tag-original">Fieldbook original</span>' : e.readAt ? '<span class="tag-read">Read in full</span>' : ''}${e.paused ? '' : e.retained ? '<span class="entry-flag">Last good scan</span>' : !e.revision ? '<span class="entry-flag">Unpinned source</span>' : ''}`;

// The shared skill entry: a stage glyph, the name, one line of summary and one
// quiet meta line. The copy action sits at the end; paused entries have none.
export function entry(e, { cls, attrs = '', copyId, stage = true, stack = false, today = false }) {
  const stackText = stack && e.stackInfo.length ? e.stackInfo.slice(0, 2).map(t => t.name).join(', ') + (e.stackInfo.length > 2 ? ` +${e.stackInfo.length - 2}` : '') : '';
  const action = e.paused ? '<span class="status entry-paused">Review paused</span>'
    : `<button type="button" class="copy-button" data-copy="${copyId}" aria-label="Copy the install command for ${esc(e.name)}" title="Copy install command">${copyLabel('Copy install')}</button><code id="${copyId}" tabindex="-1" class="sr-only">${esc(e.install)}</code>`;
  return `<li class="${cls}"${attrs}><span class="entry-glyph" aria-hidden="true">${catIcon(e.category)}</span><div class="entry-main"><h3><a href="${e.url}">${esc(e.name)}</a></h3><p class="entry-summary">${esc(e.summary)}</p><p class="entry-meta"><span>${esc(e.author.name)}</span>${stage ? `<a class="cat" href="/c/${e.category}/">${esc(e.categoryInfo.short)}</a>` : ''}${stackText ? `<span>${esc(stackText)}</span>` : ''}<span><span class="sr-only">What it can touch: </span>${esc(accessText(e).replaceAll(' · ', ', '))}</span><span class="entry-count">${installText(e)}${today ? delta(e.stats.today, ' today') : ''}</span>${entryFlags(e)}</p></div><div class="entry-action">${action}</div></li>`;
}

// A full directory row. Data attributes drive filtering and sorting in app.js.
export function dirRow(e, idPrefix, i, { stage = true } = {}) {
  const search = [e.name, e.author.name, e.owner, e.repo, e.skill, e.summary, e.categoryInfo.name, accessText(e), ...e.taskInfo.map(t => t.name), ...e.stackInfo.map(t => t.name)].join(' ').toLowerCase();
  const attrs = ` data-cat="${e.category}" data-installs="${count(e.stats.installs) ?? -1}" data-today="${deltaValue(e.stats.today) ?? -1}" data-added="${esc(e.addedAt)}" data-name="${esc(e.name.toLowerCase())}" data-search="${esc(search)}" data-tasks="${esc(e.tasks.join(' '))}" data-stack="${esc(e.stack.join(' '))}" data-access="${esc(e.access.join(' '))}" data-source="${esc(e.source)}" data-read="${e.readAt ? '1' : ''}"`;
  return entry(e, { cls: `dir-row${e.original ? ' is-original' : ''}`, attrs, copyId: `${idPrefix}-${i}`, stage, stack: true, today: true });
}

export const dirList = (list, idPrefix, opts) => `<ul class="dir-list" data-dir-list>${list.map((e, i) => dirRow(e, idPrefix, i, opts)).join('')}</ul>`;

export function categoryNav(categories, counts, current = '') {
  return `<nav class="cat-nav" aria-label="Categories"><a href="/skills/"${current === '' ? ' aria-current="page"' : ''}>All</a>${categories.map(c => `<a href="/c/${c.slug}/"${current === c.slug ? ' aria-current="page"' : ''}>${esc(c.short)}<span class="cat-count">${counts[c.slug] || 0}</span></a>`).join('')}</nav>`;
}

// Every listing is reviewed (checks, labels, a note). "Read in full" is only set by a person who read every instruction file.
export const reviewedBadge = e => e.paused ? '<span class="reviewed">Review paused</span>'
  : e.retained ? `<span class="reviewed">Last good review ${humanDate(e.review.checkedAt)} · update unavailable</span>`
  : e.readAt
  ? `<span class="reviewed is-read">${icon('check')}Read in full ${humanDate(e.readAt)}</span>`
  : `<span class="reviewed">${icon('check')}Reviewed ${humanDate(e.review?.checkedAt || e.addedAt)}</span>`;
export const countLine = (n, word) => plural(n, word);
