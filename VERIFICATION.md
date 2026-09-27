# Verification — 25 September 2026

- Static build and validation passed: catalog records, eight HTML pages, internal routes, anchors, copy target IDs, font/license assets, and social preview.
- Chromium: all six main routes checked at 320px width without horizontal page overflow.
- Desktop homepage and skill detail, 390px homepage and skill detail visually inspected.
- Installation panel switches to immediately after the introduction on mobile.
- Copy success feedback verified by an actual pointer click. Clipboard API reported success; independent clipboard read was unavailable due to browser permission.
- Clipboard failure simulated: command text selected and recovery guidance announced.
- Copy controls expose accessible names; mobile controls measure 44px high.
- Keyboard Tab reaches the skip link with a visible focus ring.
- Public GitHub source paths and Efficiency Skill package path verified through GitHub API.
- Social preview rendered at 1200 × 630 pixels.

Not verified: a full screen-reader walkthrough, installation inside each agent, or comparative skill effectiveness. Existing installation instructions are presented from their source repositories. Aarav Design OS remains unavailable until its portable public edition is prepared.

# Verification — 25 September 2026, interaction pass

- Static build and validation passed after the refinement: 4 records, 8 pages, internal routes, anchors, copy targets, font/license assets, social preview.
- Chromium (embedded): homepage and skill pages inspected at 1440 px and 390 px; `scrollWidth` equals `innerWidth` at both, no console errors from site code.
- Install-method segmented control: switching, thumb placement, `hidden` panels, arrow-key handling wired, choice persisted in `localStorage` and honored on the next skill page.
- Copy button: failure path exercised (clipboard blocked in the embedded pane): text selected, label rolled to "Select", live region announced. Success path shares the code and sets `data-state="copied"`.
- Sound toggle: `aria-pressed`, label and `localStorage` state verified for on and off. Audio output not observable from tooling.
- Mobile: install panel relocated into the slot after the introduction; tabs 40 px, copy controls 44 px.
- Cross-document view transitions: the embedded pane reports `document.visibilityState === 'hidden'`, so the browser skips them by design. Its `AbortError: Transition was skipped` entry also appears on `robots.txt`, a page with no scripts, so it is a pane artifact rather than site code. The head script still catches the transition promises. Verify the glyph and title travelling between pages in a normal Chrome or Edge window.

Not verified: audible output, view transition visuals, screen-reader walkthrough.

# Verification — 25 September 2026, redesign

- Build and validation passed after the redesign: 4 records, 8 pages, internal routes, anchors, copy targets, font/license assets, social preview.
- Fonts: document.fonts reports Geist and Geist Mono loaded; mono labels resolve to Geist Mono.
- Desktop 1440 px: homepage, Lean Engineering and Efficiency Skill pages (dark); Efficiency Skill (light). scrollWidth equals innerWidth.
- Mobile 390 px: homepage and Lean Engineering. No overflow; header 56 px; tabs 42 px; copy, icon and pager controls 44 px; facts one column; brand mark visible.
- Search filter, count and empty state verified by dispatching input events. The / shortcut is wired; Escape clears.
- Segmented control (Codex / Claude Code / Prompt): selection, thumb placement, persistence of the agent choice across pages.
- SKILL.md expander: aria-expanded and max-height verified (480 px to 3804 px on Lean Engineering).
- Prev/next links verified for Lean Engineering (Design OS on the left, Efficiency Skill on the right).
- Theme toggle: data-theme, stored preference, label and theme-color verified for light and back to dark.
- Terminal typewriter: cycles all four commands; output line hidden during typing.

Not verified: scrolled screenshots (embedded pane compositor), audible output, view-transition visuals, screen-reader walkthrough, the social preview image (still the light first-pass design; regenerate before launch).

# Verification — 25 September 2026, craft pass

- Build and validation passed after the craft pass; stale tokens (`ease-exit`, `*-exit` durations, stroke draw, `scale(.97/.98/.6)`) confirmed absent from the stylesheet.
- Homepage at 1440 px: grain and glow backgrounds resolve; only the terminal dot animates; rows transition background only; glyphs transition scale and colours; moon icon held at scale .25 / blur 4px in dark mode. No overflow.
- Lean Engineering page: equal-width tabs; thumb transitions transform only; switching to Prompt hides the other panels and fades the incoming one; expander toggles `data-open` and the CSS max-height (480px ↔ none) without a height transition; theme toggle crossfades sun/moon and restores.
- Reduced motion: colour feedback remains; movement, blur and deformation gated.

Not verified: audible output, view-transition visuals, scrolled screenshots (embedded pane), screen-reader walkthrough.

# Verification — 25 September 2026, engineering-only catalog

- Aarav Design OS removed from the catalog; stale `dist/skills/aarav-design-os/` deleted. Build produces 3 skill pages; validation passes for 3 records and 7 pages.
- `content/skillmd/` synced to the 0.2.0 SKILL.md files on `revise/pre-launch` (Lean `f47ef9b`, Efficiency `f877218`); `version: 0.2.0` recorded for both. GitHub links resolve to `main`, which still holds 0.1.0 until the branches are pushed.
- Homepage eyebrow reads `03 SKILLS`; no "Coming soon" badge remains.
