// Fit is derived from catalog labels, not a quality or safety score.
export function defaultFinderSort(query, state, supportsMatch = true) {
  return supportsMatch && (query.trim() || state.task.length || state.stack.length) ? 'match' : 'installs';
}

export function compareMatches(a, b, query, state) {
  const terms = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const phrase = terms.join(' ');
  const fit = entry => {
    const name = entry.name.toLowerCase();
    const taskHits = state.task.filter(task => entry.task.has(task)).length;
    return [
      phrase && name === phrase ? 1 : 0,
      state.stack.some(stack => stack !== 'any' && entry.stack.has(stack)) ? 1 : 0,
      terms.filter(term => name.includes(term)).length,
      taskHits,
      // Fewer unrelated task labels makes the match more focused.
      state.task.length ? -(entry.task.size - taskHits) : 0
    ];
  };
  const left = fit(a), right = fit(b);
  for (let i = 0; i < left.length; i += 1) if (left[i] !== right[i]) return right[i] - left[i];
  return b.installs - a.installs || a.name.localeCompare(b.name);
}
