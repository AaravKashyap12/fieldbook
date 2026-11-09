// Original blue-ink field diagrams. Decorative: each neighboring title and
// description communicates the same job without relying on sight or motion.
const drawings = {
  'fix-bug': `<path class="art-muted" d="M12 45h28l18-24 24 48 20-24h46"/><path class="art-trace" pathLength="1" d="M12 45h28l18-24 24 48 20-24h46"/><circle class="art-ring" cx="82" cy="69" r="11"/><path d="m141 38 7 7-7 7"/><circle class="art-dot" cx="12" cy="45" r="3"/>`,
  'write-tests': `<path class="art-muted" d="M24 19h122M24 45h122M24 71h122"/><path d="m19 19 4 4 8-9m-12 31 4 4 8-9m-12 31 4 4 8-9"/><path class="art-trace" pathLength="1" d="M46 19h53m-53 26h85m-85 26h66"/><circle class="art-ring" cx="146" cy="71" r="10"/><path d="m142 71 3 3 5-6"/>`,
  'review-code': `<path class="art-muted" d="M21 19h81v59H21zM47 9h92v59h-27"/><path d="M36 36h40m-40 13h29m-29 13h43"/><path class="art-trace" pathLength="1" d="M113 29h32m-16-16v32"/><path d="m116 80 7 6 14-15"/>`,
  'secure-app': `<path class="art-muted" d="M84 8 134 28v21c0 20-29 33-50 39-21-6-50-19-50-39V28Z"/><path class="art-trace" pathLength="1" d="M84 19 123 35v14c0 13-22 25-39 30-17-5-39-17-39-30V35Z"/><circle class="art-ring" cx="84" cy="47" r="14"/><path d="m77 47 5 5 10-11M13 47h13m116 0h13"/>`,
};
export function taskArt(slug) {
  return `<svg class="task-art" aria-hidden="true" focusable="false" viewBox="0 0 168 96" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${drawings[slug] || ''}</svg>`;
}
