# Fieldbook: reviewed engineering skills for coding agents

Updated 2026-09-27. Fieldbook is now a reviewed directory: Fieldbook originals by Aarav Kashyap plus community skills that pass the review in `REVIEWING.md`. Domain: fieldbook.tech (not yet deployed). Design OS stays private and unlisted.

Purpose: a list engineers save and come back to. It earns that with a strict scope (engineering only), visible review (a note, checks and access labels on every page), and a reason to return (a daily board from real installs, new listings, kits).

## World

A field notebook for coding agents. Warm paper canvas, ink type, one blue. Hairlines carry structure; filled surfaces are reserved for code and the notebook pages in the hero. Light by default, dark available.

- Canvas `#f7f7f2`, surface `#ffffff`, ink `#202321`, secondary `#565d56`, tertiary `#636a62`, lines `#dcded5` / `#c2c7bb`, accent `#2758ce`. Dark tokens live beside them in `assets/styles.css`.
- Display: **Instrument Serif** (regular and italic) for page and section titles, skill names, board names, kit names, review notes and install counts in the directory. The italic carries the second line of display headings ("reviewed.", "installing.", "stage of the work."). One weight only: never synthesise bold.
- Reading and interface: **Geist**. Code, paths, ranks and hashes: **Geist Mono**. Mono is never a label costume.
- Type floor: nothing under 12px. No eyebrow kickers. Numbers only where sequence or rank carries meaning (board rank, review steps, workflow steps).
- Layout: one centred column, **1080px** content (widened from 960 for the board and directory rows), gutters `clamp(20px, 5vw, 48px)`. Sections open with `.section-intro`: a two-line serif title left, one plain sentence right.

## Components

- **Navbar:** floating island. Links: Directory (reads "Skills" on phones), Kits, Submit, Updates. Below 640px Kits, Updates and the GitHub pill leave the island (all remain in the footer); below 400px Submit does too. Right cluster: GitHub pill (links to the Fieldbook repository), sound toggle, theme toggle.
- **Hero:** "Engineering skills, reviewed.", lede, a large search that lands on the directory (`/skills/?q=`), and a stats line. The notebook shows **today's pages**: the four fastest-rising skills (one per author), or the most installed until two days of snapshots exist; a caption says which. Turning is the WAAPI FLIP described below.
- **Board:** "What engineers are installing." Radio chips (Today, This week, All time, New) switch panels with generated `:has()` CSS, so it works without script. Rows: rank, serif name with author and stage, one-line summary (hidden below 880px), installs, change. Until the history exists, Today and This week say so plainly and show all-time installs. At most two skills per maintainer appear on the board (a footnote says so); the directory keeps the full ranking. The change column collapses on tabs that have none.
- **Categories:** eleven stages of the work (plan, build, debug, review, security, performance, ship, cloud, data, languages, agents); a stage appears only once it has a skill. Category pages have no glyph above the title and omit the stage label on each row in two hairline columns, each with its icon, blurb and count, linking to `/c/<stage>/`.
- **Kits:** small named sets (four skills) in a three-column grid with a top rule; each kit page has one copyable block of install commands.
- **Originals:** Fieldbook's own skills keep the catalog rows with animated hairline diagrams (authoring rules below).
- **Review promise and submit call:** four numbered review steps beside a serif call to submit.
- **Directory rows** (directory, category and kit pages): stage and author, serif name, summary, access labels in plain text, and on the right the install count in serif with today's change and a copy button. Category chips are links, so filtering works without script; search and sort are progressive and kept in the URL.
- **Review marks:** every listing shows "Reviewed <date>" (licence, scan, labels, note). "Read in full <date>" appears only when `readAt` is set, which only Aarav does after reading every instruction file; directory rows then carry a green "Read in full" tag.
- **Detail pages:** breadcrumb (Directory, stage, skill), stage icon and meta, serif title, "by author · owner/repo", lede; installation tabs (Skills CLI, Prompt); **Fieldbook review** (the note in serif, then checks: licence, frontmatter, risky patterns with cleared reasons, size, last checked with hash); **What it can touch**; source link (community) or the SKILL.md viewer (originals); facts sidebar (installs, week, stars, repository updated, licence, author, added; links to SKILL.md, repository, skills.sh); related rows from the same stage.
- **Submit:** a plain GET form to the repository's issue form, so it needs no backend; fields map to the issue template ids. "What we look for" and "What happens next" beside it.
- **Code blocks** are the only boxed surfaces besides the notebook and form fields.
- **Row diagrams (originals):** on hover or keyboard focus, every line draws in accent in reading order and each point lights as its line reaches it; the end dot pops last, within about 0.9s. Every base line needs a `trace()` overlay (dashed lines use `dashTrace()` with a unique mask id), and every point an `at(ms)` delay. A line without an overlay reads as broken.
- **Notebook turn:** WAAPI FLIP, about 0.7s. The front page lifts with a deeper shadow and swings out left, drops behind and slides to the back while the pile ripples forward; the new front changes colour and inks in only once uncovered. Clicks queue and speed up the current turn. Reduced motion swaps instantly.

## Motion and sound

Tokens: 140 / 200 / 280ms, `cubic-bezier(.2,0,0,1)` for enters, strong ease-in-out only for the tab thumb. Press scale `.96` on every control. Icon swaps use opacity, scale `.25`, blur `4px`, 300ms. One staged entrance per page. Colour feedback stays on under reduced motion; movement, blur and deformation do not.

Sound (`assets/sound.js`, Web Audio, no files): tick on pressing navigation, click-clack on toggles and the installer, two-note chime on copy, paper rustle on turning a notebook page. Never on hover. On by default unless the visitor prefers reduced motion; the navbar toggle persists the choice.

## Scaling

Listings are data. A community skill is one entry in `content/directory.json` (see `REVIEWING.md`); an original is one entry in `content/skills.json` plus its `SKILL.md` copy. Board, directory, category pages, feed, JSON export and sitemap regenerate. Add a stage only when a group of good skills does not fit the nine; add its icon to `scripts/lib/icons.mjs` (`categoryIcon`). Kits stay at four skills so each fits one install block. Add a dated entry to `updateLog` in `scripts/build.mjs` for notable additions; the newest feeds the homepage field note.

## Known intentional exceptions

Impeccable's detector flags Geist and Instrument Serif as common faces. Geist is the incumbent reading face; Instrument Serif was chosen by Aarav for the italic display voice. Kept deliberately.

## Maintenance

Markup in `scripts/build.mjs` and `scripts/lib/`; styles, script and sound in `assets/`; data in `content/`. Run `npm run daily` (or `build` then `check`) from `site/`. Preview at 127.0.0.1:4173. The pre-directory source is backed up under `../.handoff-work/*.before-directory-2026-09-27`. No deployment, push or release has been performed.
