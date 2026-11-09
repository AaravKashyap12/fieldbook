# Editorial edition verification

9 November 2026. Design review base: `9d455c22aae8fe2af6f9442f21477cde7bca0d83` (merged task-discovery work). Publication base: `27b8a9b00597f735036dd9bd3af4b9be217c4971`, incorporating the subsequent daily data snapshot without conflicts. The complete build/check suite passed again on that baseline. The PR diff contains the tested source. No catalog, source pin, review state or hosting changes.

## Automated checks

The new `editorial-check.mjs` first failed because the four new task drawings were absent. It now checks generated decorative SVGs, the catalog note, native guide contents and targets, pause-control markup, and CSS hooks. These are structural assertions, not a substitute for browser testing.

Fresh commands completed successfully after implementation:

- `npm run build`: 178 generated content pages; 155 catalog skills, seven paused.
- `npm run check`: 52 security assertions; immutable revision and install-pin fixtures; finder ranking/state; guided journey and review disclosure; 186 HTML pages and links; 178 sitemap URLs; SEO; task/discovery/editorial checks.
- `git diff --check`: no whitespace errors.

No dependencies added. Public repository visibility was checked. A dependency vulnerability scan was not claimed: this static project has no package dependencies or lockfile. No protection, security or deployment settings changed.

## Independent review

A separate read-only reviewer inspected the actual diff and independently ran build, all checks and diff validation. No must-fix defects were found. Finder logic, review evidence and source pins were confirmed outside the change surface.

Independent cloud-browser checks:
- Tab reaches Skip to content with a visible blue focus outline.
- Enter pauses compatibility motion and Space resumes; computed animation state matches the action.
- Decorative task art is absent from accessible link names.
- Guide refinement opens the selected task in the finder with Best match; explicitly choosing Most installed survives reload in URL state.
- Dark theme works; desktop home and finder have no horizontal overflow.
- Native browser zoom at 200% reflows the homepage heading, lede, catalog note and task row without visible clipping. Normal zoom was restored.

## Visual pass

Cloud Chromium only, not the user's Mac browser. Desktop: approximately 1180px viewport. Home and task section inspected after entrance motion; final screenshots recorded. The new paper stack stays within the document width.

A temporary same-origin iframe harness rendered real app pages at CSS widths 320, 390 and 768px. It was removed before the final build and is not shipped. Phone home and guide layouts had equal body scroll/client widths, with no horizontal document overflow. Both themes were inspected at phone width. Task art, descriptions and actions remain visible; the guide cover drawing is intentionally omitted on phones. Contents links and headings remain in the accessibility tree. The native Prepare anchor was exercised. Tablet layout retains two open task columns.

Screenshots are visual evidence, not a claim of real-phone or screen-reader testing. The iframe uses a desktop scrollbar and does not emulate touch hardware or mobile browser chrome. No new image assets ship.

## Limits

- Reduced-motion/no-JavaScript rules were inspected in source, but not runtime-emulated. Chromium blocked DevTools by organization policy; no bypass was attempted. The actual Pause/Resume runtime was verified independently.
- Guide-at-200%-zoom and real touch-device behavior remain unverified. Home-at-200% was verified.
- No VoiceOver/NVDA session, automated full WCAG audit, performance benchmark or measured usability improvement is claimed.
- A browser log sample included extension metadata errors, not an identified site-code error.

## Acceptance

The authored paper-and-blue design, original task illustrations, readable guide contents and pause control are implemented. Existing discovery routes, source evidence and pinned installation behavior pass regression checks. Exact-head GitHub CI is required before merge; publication status belongs to the PR rather than this local test record.
