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
  return compact ? `<details class="review-evidence"><summary>${status} · evidence and limits</summary>${content}${e.paused ? '' : installCaution(e)}</details>`
    : `<div class="review-evidence"><p class="evidence-status">${status}</p>${content}</div>`;
}

// Installs, with the exact figure in a title for anyone who wants it.
export const installs = e => count(e.stats.installs) == null ? '<span class="num is-none">—</span>' : `<span class="num" title="${esc(exact(e.stats.installs))} installs on skills.sh">${esc(compact(e.stats.installs))}</span>`;
export const delta = (n, suffix = '') => deltaValue(n) == null ? '' : `<span class="delta${n > 0 ? ' is-up' : ''}" title="${esc(exact(n))}${esc(suffix)}">${esc(signed(n))}${suffix ? `<span class="sr-only">${suffix}</span>` : ''}</span>`;

// A full directory row. Data attributes drive filtering and sorting in app.js.
export function dirRow(e, idPrefix, i) {
  const search = [e.name, e.author.name, e.owner, e.repo, e.skill, e.summary, e.categoryInfo.name, accessText(e), ...e.taskInfo.map(t => t.name), ...e.stackInfo.map(t => t.name)].join(' ').toLowerCase();
  const stackText = e.stackInfo.length ? e.stackInfo.slice(0, 2).map(t => t.name).join(', ') + (e.stackInfo.length > 2 ? ` +${e.stackInfo.length - 2}` : '') : '';
  const copyId = `${idPrefix}-${i}`;
  return `<li class="dir-row${e.original ? ' is-original' : ''}" data-cat="${e.category}" data-installs="${count(e.stats.installs) ?? -1}" data-today="${deltaValue(e.stats.today) ?? -1}" data-added="${esc(e.addedAt)}" data-name="${esc(e.name.toLowerCase())}" data-search="${esc(search)}" data-tasks="${esc(e.tasks.join(' '))}" data-stack="${esc(e.stack.join(' '))}" data-access="${esc(e.access.join(' '))}" data-source="${esc(e.source)}" data-read="${e.readAt ? '1' : ''}"><div class="dir-main"><p class="dir-meta"><a class="cat" href="/c/${e.category}/">${esc(e.categoryInfo.name)}</a><span>${esc(e.author.name)}</span>${stackText ? `<span class="dir-stack">${esc(stackText)}</span>` : ''}${e.original ? '<span class="tag-original">Fieldbook original</span>' : e.readAt ? '<span class="tag-read">Read in full</span>' : ''}</p><h3><a href="${e.url}">${esc(e.name)}</a></h3><p class="dir-summary">${esc(e.summary)}</p><p class="dir-access"><span class="sr-only">What it can touch: </span>${esc(accessText(e))}</p>${reviewEvidence(e, { compact: true })}</div><div class="dir-side"><p class="dir-stat">${installs(e)}<small>${e.stats.installs == null ? 'not counted yet' : 'installs'}</small>${delta(e.stats.today, ' today')}</p>${e.paused ? '<span class="status">Review paused</span>' : `<button type="button" class="copy-button" data-copy="${copyId}" aria-label="Copy the install command for ${esc(e.name)}">${copyLabel('Copy install')}</button><code id="${copyId}" tabindex="-1" class="sr-only">${esc(e.install)}</code>`}</div></li>`;
}

export const dirList = (list, idPrefix) => `<ul class="dir-list" data-dir-list>${list.map((e, i) => dirRow(e, idPrefix, i)).join('')}</ul>`;

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
