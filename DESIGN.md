# Fieldbook: reviewed engineering skills for coding agents

Updated 2026-09-27. Fieldbook is now a reviewed directory: Fieldbook originals by Aarav Kashyap plus community skills that pass the review in `REVIEWING.md`. Domain: fieldbook.tech (not yet deployed). Design OS stays private and unlisted.

Purpose: a list engineers save and come back to. It earns that with a strict scope (engineering only), visible review (a note, checks and access labels on every page), and a reason to return (a daily board from real installs, new listings, kits).

## World

A field notebook for coding agents. Warm paper canvas, ink type, one blue. Space carries structure; hairlines appear only where content needs a boundary (header island, code, guide contents). Filled surfaces are reserved for code, the notebook pages, the round stage glyphs and the hover wash. Light by default, dark available.

- Canvas `#f7f7f2`, surface `#ffffff`, ink `#202321`, secondary `#565d56`, tertiary `#636a62`, lines `#dcded5` / `#c2c7bb`, accent `#2758ce`. Dark tokens live beside them in `assets/styles.css`.
- Display: **Instrument Serif** (regular and italic) for page and section titles, skill names, kit names, guide titles, review notes and the install count on skill pages. The italic carries the second line of display headings ("reviewed.", "installing.", "stage of the work."). One weight only: never synthesise bold.
- Reading and interface: **Geist**. Code, paths, ranks and hashes: **Geist Mono**. Mono is never a label costume.
- Type floor: nothing under 12px. No eyebrow kickers. Numbers only where sequence or rank carries meaning (board rank, review steps, workflow steps).
- Layout: one centred column, **1080px** content, gutters `clamp(20px, 5vw, 48px)`. Home sections open with a one-line serif title (an italic second half where it reads well) and at most one short sentence beneath it. No ink rules between sections.
- `--wash` (paper white with a breath of the accent) marks hover and keyboard focus on entries, guides, kits and related links. It never shows at rest, so nothing reads as a boxed card.

## Components

- **Navbar:** floating island. Links: Directory (reads "Skills" on phones), Kits, Agents, Submit, Updates. Below 880px Agents leaves the island; below 640px Kits, Updates and the GitHub pill leave too (all remain in the footer); below 400px Submit does too. Right cluster: GitHub pill (links to the Fieldbook repository), sound toggle, theme toggle.
- **Home:** cover (notebook), **Most installed**, Start with the task, agents strip, For agents, Fieldbook originals, then the review promise beside the submit call. The board, stage list, kits grid and field notes stay off the home page.
- **Hero:** "Engineering skills, reviewed.", a one-sentence lede, one search control (field, `/` hint and a Search button inside one surface: outer radius 14 = inner 8 + 6 padding), four task chips plus "All tasks", and a one-line catalog note. The notebook shows today's pages (rising, or most installed until two snapshots exist).
- **Skill entry** (shared by home, finder, stage, task and kit lists; `entry()` in `scripts/lib/parts.mjs`): a round stage glyph (accent on accent-soft; Fieldbook originals filled), the serif name, a summary clamped to two lines and one meta line: author, stage link (omitted where the page is already a stage), stack where it matters, what it can touch, installs and today's change. "Fieldbook original", "Read in full", "Unpinned source" and "Last good scan" appear in that line only when true. The copy action sits at the end; on phones and in the two-column home list it is the icon alone (the accessible name and title still say what it copies). No rules between entries: the whole entry is a link, hovering or focusing it shows the wash, inks the name blue and tips the glyph like a stamp. Full review evidence is on the skill page; each list carries one install note (pin status, scan scope, "Copying a command does not run it", "A review is not a security audit or a guarantee").
- **Most installed:** quiet stage tabs (text pills; only the current one is filled, counts in small mono) over two columns of entries. Tabs are links to `/skills/` and `/c/<stage>/`, so the section works without script; a plain click filters in place (up to six per stage, read from `data-per-stage`), updates the status line and the "See all" link, and plays the toggle cue. Modified clicks navigate. Only available listings appear.
- **Agents strip:** "Install once. Use it in 70+ agents." beside a slow edge-faded marquee of single-colour marks (Simple Icons, CC0; Codex uses the OpenAI mark pinned to Simple Icons 15.22.0, the last release that has it). Pauses on hover and with its Pause button; with reduced motion it becomes a static centred row.
- **For agents:** one line: serif title, the two MCP tool names, links to `llms.txt` and `index.json`, and "Set up" to `/agents/`.
- **Start with the task:** the four guide drawings in one open row (two by two below 1040px, a list on phones), each with its title, available count and "Guide". The drawings re-ink on hover or focus. A native disclosure keeps the other tasks one click away as direct finder links; "First skill?" links the guided Bug hunt. Hero task chips stay instant filters. The four guides keep their own static URLs, preparation and verification advice, skill lists and a link to refine in the finder.
- **Fieldbook originals:** a two-column spread, each led by its diagram, then stage and version, the serif name, one line, Explore and Copy install. One install note follows the grid.
- **Review promise:** "Checked before it is listed." with four short checked marks and "How we review", beside the submit call.
- **Finder (`/skills/`):** a light sticky rail beside the results: plain-text options with small drawn checkmarks (real checkboxes), no rules. Facets: Task (open), Stack (closed until used; grouped; a stack pick includes general skills and ranks stack-specific ones first), "Only skills that" (guidance only, no commands, no edits, no network, no MCP; all must hold), Stage, Source. OR within a group, AND across groups; each option shows how many skills it would leave, and empty ones dim. Active filters show as removable chips; the whole state lives in the URL, and a facet in the URL opens. Sort: best match (default while searching or filtering by task or stack), most installed, rising today, newest, A to Z. One install note sits above the list. "How to choose an agent skill" is a native disclosure below the results. On phones the rail collapses behind a "Filters" button.
- **Stage pages** keep the stage tabs, search and sort, a link to refine in the finder and the same entries.
- **Review marks:** every listing shows "Reviewed <date>" (licence, scan, labels, note). "Read in full <date>" appears only when `readAt` is set, which only Aarav does after reading every instruction file.
- **Detail pages:** breadcrumb; stage glyph and stage, version and "Fieldbook original" where relevant; serif title; one-sentence lede; "by author · owner/repo · licence". Originals show their diagram beside the title; it inks in once on load. **Install**: tabs (Skills CLI, Prompt), a one-line disclosure with the full scan, revision, reading and runtime evidence, the command, then the pin caution under it. **Fieldbook review**: the note set large with an inked quotation mark, the checks folded behind one line. **What it can touch** in two columns. Community skills end with **Read the source**; originals add when to reach for it, how it works, the SKILL.md viewer and good to know. A quiet aside lists installs (large serif), this week, stars, repository updated, good for, stack and source links, label above value with no rules. Related skills sit in a three-column grid with their glyphs.
- **Kits:** each kit is a small overlapping stack of its members' stage glyphs (paused members grey) that fans out on hover, then name, blurb and availability. Kit pages show the same stack in the header. The Bug hunt journey reads as one vertical inked thread with five steps; the launch-week guide keeps its lead and contents, with its four parts as native disclosures (the first open).
- **Submit:** a plain GET form to the repository's issue form, so it needs no backend; fields map to the issue template ids. "What we look for" and "What happens next" beside it.
- **Code blocks** are the only boxed surfaces besides the notebook and form fields. Disclosures (`.fold`) are one quiet line with a small chevron, never a panel.
- **Diagrams (originals):** on hover or keyboard focus of their card (`.dg-host`), every line draws in accent in reading order and each point lights as its line reaches it; the end dot pops last, within about 0.9s. Every base line needs a `trace()` overlay (dashed lines use `dashTrace()` with a unique mask id), and every point an `at(ms)` delay. A line without an overlay reads as broken.
- **Notebook turn:** WAAPI FLIP, about 0.7s. The front page lifts with a deeper shadow and swings out left, drops behind and slides to the back while the pile ripples forward; the new front changes colour and inks in only once uncovered. Clicks queue and speed up the current turn. Reduced motion swaps instantly.

## Motion and sound

Tokens: 140 / 200 / 280ms, `cubic-bezier(.2,0,0,1)` for enters, strong ease-in-out only for the tab thumb. Press scale `.96` on every control. Icon swaps use opacity, scale `.25`, blur `4px`, 300ms. One staged entrance per page. Colour feedback stays on under reduced motion; movement, blur and deformation do not.

Sound (`assets/sound.js`, Web Audio, no files, through one limiter so overlaps never distort): tick on pressing links, chips, rows and filters; click-clack on toggles (theme, sort, tabs, expanders, clearing filters); two-note chime on copy and on sending a submission; paper rustle on turning a notebook page; rising and falling notes when sound is switched on and off. Levels were raised about fourfold on 27 September 2026 after they proved inaudible on laptop speakers. Never on hover. On by default unless the visitor prefers reduced motion; the navbar toggle persists the choice.

## Scaling

Listings are data. A community skill is one entry in `content/directory.json` (see `REVIEWING.md`); an original is one entry in `content/skills.json` plus its `SKILL.md` copy. Board, directory, category pages, feed, JSON export and sitemap regenerate. Add a stage only when a group of good skills does not fit the nine; add its icon to `scripts/lib/icons.mjs` (`categoryIcon`). Kits stay at four skills so each fits one install block. Add a dated entry to `updateLog` in `scripts/build.mjs` for notable additions; the newest feeds the homepage field note.

## Known intentional exceptions

Impeccable's detector flags Geist and Instrument Serif as common faces. Geist is the incumbent reading face; Instrument Serif was chosen by Aarav for the italic display voice. Kept deliberately.

## Maintenance

Markup in `scripts/build.mjs` and `scripts/lib/`; styles, script and sound in `assets/`; data in `content/`. Run `npm run daily` (or `build` then `check`) from `site/`. Preview at 127.0.0.1:4173. The pre-directory source is backed up under `../.handoff-work/*.before-directory-2026-09-27`. No deployment, push or release has been performed.

## Paper-and-ink edition, 9 November 2026

The cover now uses blue italic display type and bound, ruled paper leaves with folios. The search action uses the existing blue; the catalog footnote keeps counts separate from the review guarantee. Four original task diagrams share an open editorial grid, with a short ink trace only on deliberate hover/focus. Guide pages reuse the diagrams and expose ordinary contents anchors, with 112px scroll padding for the sticky header. Mobile guides prioritize the text and wrap the contents.

The compatibility strip has an explicit Pause/Resume button. It stays static without JavaScript or with reduced motion; new task tracing and press displacement also respect reduced motion. No new library, font or image dependency. See `DESIGN-RESEARCH.md` for concrete sources and `EDITORIAL-VERIFICATION.md` for tested behavior and limitations.

## Directory-first home and agent entry, 17 November 2026

The home page now reaches the catalog in one scroll. A public fetch of skill-issue.in (short heading, category tabs, compact ranked rows, a copy action per row) informed the structure; nothing was copied from it, and its page was not visually inspected.

- **Order:** cover (notebook unchanged), **Browse the directory**, Start with the task, agents band, **For agents**, Fieldbook originals, review promise. The hero lede lost its opening sentence; the cover keeps its search, task chips and catalog note.
- **Browse the directory:** a `.section-intro` title, then stage tabs (All plus each stage, with available counts) in the existing pill shape. Tabs are links to `/skills/` and `/c/<stage>/`, so the section works without script; a plain click filters in place, renumbers ranks, updates the status line and the "See all" link, and plays the toggle cue. Modified clicks navigate. Rows: mono rank, serif name, author, stage, access labels, a one-line summary (two lines on phones), install count in serif, Copy install. Rows flag "Unpinned source" or "Last good scan" when those apply. Only available listings appear. Below the list, the existing install caution plus "Copying a command does not run it" and "A review is not a security audit or a guarantee."
- **Motion:** switching tabs fades rows up 6px with a 28ms stagger; reduced motion shows the change instantly. Tabs press to .96.
- **Responsive:** four columns on desktop; count under the summary from 880px; at 640px the copy action shares a line with the count and the tabs scroll sideways. Tabs wrap above 640px. Checked headless with Chrome device emulation at 1280, 760 and 390px (light, plus dark at 1280): no horizontal overflow. Not checked on real devices or with a screen reader.
- **For agents:** a ruled band under the compatibility strip links to `/agents/`, `llms.txt` and `index.json` and says no MCP endpoint is hosted. `/agents/` uses the narrow guide layout with contents links, numbered setup steps, copyable configurations (Claude Code, Codex, generic `mcpServers` JSON), tool parameters, protocol support and limits. The footer's Data column adds "For agents" and `llms.txt`; every page's head lists `index.json` and `llms.txt` as alternates.

## Lighter edition, 17 November 2026 (correction)

The user rejected the directory-first pass: "very tabular, very boxy, too much text". This edition changes the visible UI rather than adding to it. skill-issue.in was inspected this time as headless Chrome screenshots (home at 1280 and 390, one skill sheet). Qualities taken, not its components: short display headings, one line of description per item, small labels, a single primary action per skill and a glyph for every entry. Its framed cloud image, pixel sprites, card rows and wordmark footer were not used; the round stage glyphs reuse Fieldbook's own icon set.

- Removed from view: rank column, per-row evidence disclosures (one install note per list instead; full evidence on the skill page), stacked install counts, the finder's sort explanation (now in the guide disclosure), the task outcomes on the home page, the newcomer box, the separate review-promise paragraphs, kit member names on the kits index, hairline tables in the facts aside and review checks, section ink rules.
- Folded behind native disclosures: review evidence and checks on skill pages, "How to choose an agent skill", "Which part of code review do you need?", the four launch-week parts.
- Added: the shared skill entry, round stage glyphs with a stamp-tip hover, the hover wash, two-column Most installed, glyph stacks for kits, the vertical journey thread, detail diagrams that ink in once.
- Kept: notebook flip, task drawings and their re-ink, original diagrams, theme and sound toggles, marquee pause, press scale, copy roll and fallback, keyboard paths, reduced motion, URL state, paused-install suppression, MCP and agent files.

List-level install explanations sit in native “Before you install” disclosures; the full cautions stay visible on skill/kit install blocks. Task-guide and kit lists use the same shared disclosure.
