// A file hash alone cannot identify the repository checkout an installer uses.
export const isRevision = value => typeof value === 'string' && /^[a-f0-9]{40}$/.test(value);
export const sourceUrl = (entry, revision = 'HEAD') => `https://raw.githubusercontent.com/${entry.repo}/${revision}/${entry.path}`;
export function reviewedRevision(review, entry) {
  return isRevision(review?.revision) && /^[a-f0-9]{64}$/.test(review.sha256 || '')
    && review.source === sourceUrl(entry) && review.pinnedSource === sourceUrl(entry, review.revision)
    ? review.revision : null;
}
