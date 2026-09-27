// Pure validation and review-state rules shared by ingestion, rendering and checks.
export const count = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
export const deltaValue = value => Number.isSafeInteger(value) ? value : null;
export function day(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}
export function reviewState(review, entry = {}) {
  const result = { paused: true, retained: false, openFlags: [], clearedFlags: [], reviewReason: 'Review unavailable.' };
  if (!review || review.status === 'unavailable' || !Array.isArray(review.problems) || !Array.isArray(review.findings)
      || !/^(?:[a-f0-9]{16}|[a-f0-9]{64})$/.test(review.sha256 || '') || !day(review.checkedAt)
      || review.findings.some(f => !f || typeof f.rule !== 'string' || !Number.isSafeInteger(f.line) || f.line < 1)) return result;
  const bound = /^[a-f0-9]{64}$/.test(entry.clearedSha256 || '') && entry.clearedSha256 === review.sha256;
  const approved = f => bound && typeof entry.cleared?.[f.rule] === 'string' && entry.cleared[f.rule].trim().length > 0;
  result.openFlags = review.findings.filter(f => !approved(f));
  result.clearedFlags = review.findings.filter(approved).map(f => ({ ...f, reason: entry.cleared[f.rule] }));
  result.paused = review.problems.length > 0 || result.openFlags.length > 0;
  result.retained = review.retained === true;
  result.reviewReason = review.problems.length ? 'The source has review problems.'
    : result.openFlags.length ? 'Scanner findings require review for this source version.'
    : result.retained ? 'Latest fetch unavailable; showing the last good review.' : '';
  return result;
}
export const installFor = entry => entry.paused ? null : entry.install;
