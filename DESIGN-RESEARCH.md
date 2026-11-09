# Paper-and-ink edition: research and application

9 November 2026. The goal is a more authored Fieldbook, not a new visual identity. Warm paper, Instrument Serif, Geist, one blue and the existing static architecture remain. No third-party component source, artwork, fonts or runtime dependencies were copied or installed.

## What changed

- **Cover:** blue italic display type, a calmer search control, a factual catalog footnote, and a small stack of bound paper leaves. The notebook keeps its keyboard-operated page turn, but replaces the solid promotional card with a ruled page, blue spine, category rule and folio.
- **Task discovery:** four original SVG field diagrams describe failure isolation, testing, code inspection and a security boundary. They sit in a single ruled editorial layout, not independent elevated cards. Titles, descriptions and links stay visible without hover or JavaScript. Drawings are decorative to assistive technology.
- **Guide reading:** the same drawings carry onto desktop guide covers. Ordinary contents links navigate directly to choosing, preparing, comparing and verifying. A blue margin rule identifies section headings. On phones, the illustration yields to readable text and contents links wrap.
- **Interaction:** directional guide arrows and a brief ink trace respond to deliberate hover/focus. Existing repeated finder interactions remain immediate. The compatibility strip now has a real Pause/Resume action for keyboard and touch users; without JavaScript it is static. Reduced motion removes the new tracing/press displacement and the existing moving strip.

## Sources actually opened and how they were used

### UI Skills and authors

[UI Skills](https://www.ui-skills.com/) was the directory intended by the request. Its listings lead to several distinct authors, including Emil Kowalski.

- [Emil Kowalski's design-engineering skill](https://emilkowal.ski/skill), its [source](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md), and [animation audit](https://github.com/emilkowalski/skills/blob/main/skills/improve-animations/AUDIT.md): frequency-first motion judgment, visible resting states, and small reversible state changes. Applied by keeping finder behavior untouched, limiting new drawing motion to focused task links, and adding a pause control. No paid course content used.
- [Better UI](https://www.ui-skills.com/skills/jakubkrehel/better-ui): borders for structure, shadows for genuine elevation, explicit transition properties and hover-capable devices. Applied to shared rules, the single elevated paper object, and restrained hover treatment.
- [Better Typography](https://www.ui-skills.com/skills/jakubkrehel/better-typography): role-based hierarchy, readable measure, real font styles and overflow care. Applied to the blue display line, serif guide titles, quiet utility type and bounded guide prose. Existing font files retained.
- [Better Accessibility](https://www.ui-skills.com/skills/jakubkrehel/better-accessibility): native semantics, generous hit areas and keyboard/focus verification. Applied to actual anchor contents, decorative SVGs, a labeled native pause button and sticky-header anchor clearance.
- [Impeccable](https://www.ui-skills.com/skills/pbakaus/impeccable) and its [craft floor](https://github.com/pbakaus/impeccable/blob/main/skill/reference/craft-floor.md): distinguish expressive cover, readable guide and efficient index. Applied as deliberate differences in density, not a universal card treatment. Fieldbook's approved fonts take precedence over generic font critiques.
- [Frontend UI Engineering](https://www.ui-skills.com/skills/addyosmani/frontend-ui-engineering): preserve product truth, define acceptance criteria, then implement in the existing architecture. Applied with small rendering functions, zero new dependencies, regression checks and independent review.

These were read as guidance, not installed or claimed as locally executed skill packages. Emil's repository MIT license was checked; other skill licenses were not individually verified, so their code and prose were not vendored.

### Component and art-direction references selected from AStack

- [Colorion Press](https://animatedbuttons.colorion.co/effects/press/) and [Arrow Push](https://animatedbuttons.colorion.co/effects/arrow-push/): actual CSS examples and the [MIT license](https://animatedbuttons.colorion.co/license.txt) were opened. The implementation is independently authored: a smaller 1px search press and a stable guide label with a 3px arrow movement, using Fieldbook's tokens. Focus and reduced-motion states remain separate.
- [HyperUI marketing cards](https://www.hyperui.dev/components/marketing/cards/): inspected title, description and metadata anatomy. Adapted the hierarchy into open editorial rows. Rejected hidden-on-hover essential text and remote sample photographs; no Tailwind or copied source.
- [Component Gallery tabs](https://component.gallery/components/tabs/) and [W3C tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/): confirmed that navigation between guide sections should remain links, not receive fake tab roles.
- [Component Gallery search](https://component.gallery/components/search-input/) and [Carbon search guidelines](https://www.carbondesignsystem.com/building-blocks/core/components/search/guidelines): search remains a labeled working control with a clear action and the existing URL behavior, not a decorative command overlay.
- [Studio Dumbar's DevDay25 case](https://studiodumbar.com/work/openai-devday-2025) and [PORTO ROCHA's MASP case](https://www.portorocha.com/masp/): informed deriving a visual vocabulary from the subject. Fieldbook's original engineering paths, ruled margins and bound pages use that method; no brand graphics, fonts or layouts were reproduced.
- [Ibelick backgrounds](https://bg.ibelick.com/) and its [repository](https://github.com/ibelick/background-snippets): considered CSS-first geometry; no snippet was used. Rules stay on illustrative paper rather than behind reading text.

[Transitions](https://transitions.dev/) and [Codrops Seam Transitions](https://tympanus.net/Demos/SeamTransitions/) were also opened, but their animation engines/installers were not adopted. Heavy image shaders do not help this directory. Two additional paper/fold references were inaccessible and are not claimed as inspected.

## Scope and rights

References supplied principles, not permission to transplant identity. All new drawings and CSS are original. Source revision evidence, paused/retained states, installation commands, finder ranking, catalog data and hosting settings are unchanged. Research observations are not measured usability or conversion improvements. Browser verification and its limits are recorded in `EDITORIAL-VERIFICATION.md`.
