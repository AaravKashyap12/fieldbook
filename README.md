# Fieldbook

A reviewed directory of agent skills for real engineering work, at [fieldbook.tech](https://fieldbook.tech). Listings are licence-checked, scanned and described from their source, then ranked by recorded installs. The separate Read in full mark records a human reading the instructions. Fieldbook originals by Aarav Kashyap sit alongside reviewed community skills; every listing keeps its own repository, licence and author.

Static site, no dependencies. Node.js 20 or later.

```sh
npm run build     # generate dist/
npm run check     # validate content and every generated page
npm start         # serve dist/ at http://127.0.0.1:4173
npm run sync      # take today's install and star snapshot
npm run review    # re-run the automated review on every listed SKILL.md
npm run daily     # sync + review + build + check (what CI runs)
```

## How the data flows

| File | What it holds | Who writes it |
| --- | --- | --- |
| `content/skills.json` | Fieldbook originals, with rich page content | By hand |
| `content/directory.json` | Community listings: id, path, name, stage, licence, access labels, summary, review note | By hand, after a review |
| `content/categories.json`, `content/kits.json`, `content/authors.json` | Stages of the work, kits, maintainer names (`official: true` marks vendor and organisation repositories) | By hand |
| `content/taxonomy.json` | The finder's vocabulary: tasks, and stacks in four groups | By hand |
| `content/agents.json` | The agents row on the home page: names and single-colour marks from Simple Icons (CC0), with versions | By hand |
| `content/review.json` | Automated check results per skill (lines, frontmatter, scanner findings, hash) | `npm run review` |
| `content/stats/YYYY-MM-DD.json` | Daily install counts (skills.sh) and repository stars and push dates (GitHub) | `npm run sync` |
| `content/skillmd/*.md` | Copies of originals' `SKILL.md`, shown on their pages | By hand |

Install counts come from the public search endpoint that the open-source Skills CLI uses (`skills.sh/api/search`). The sync waits between requests and backs off on HTTP 429. "Today" and "this week" are differences between snapshots, so they appear once two snapshots a day apart exist.

Missing or invalid reviews and uncleared scanner matches pause a listing and remove its install controls. A defensive `cleared` reason is valid only for the exact full SHA-256 in `clearedSha256`; never copy an exception onto changed source. For network/5xx failures, the reviewer can retain the last good result for the same source and label it as retained. It never substitutes old results for successfully fetched changed content or new findings. If more than 10% of fetches fail, review exits nonzero before writing its batch and the daily job cannot commit.

## Submissions and review

Submissions arrive as GitHub issues through `.github/ISSUE_TEMPLATE/submit-skill.yml`, prefilled from the form at `/submit/`. Review them with `REVIEWING.md`.

## Deployment (Vercel, DNS on Cloudflare)

The production target is Vercel, connected to this repository through its native Git integration:

1. Create the public repository `AaravKashyap12/fieldbook` and push this folder to `main` as a series of logical commits.
2. Import it into Vercel (Git integration). `vercel.json` sets everything: build `npm run build`, output `dist`, trailing slashes, security headers (the CSP allows the inline theme script by hash) and redirects from the old skill URLs. `npm run build` checks committed `vercel.json` before writing output. For an intentional hosting-config change, run `npm run build -- --update-vercel` locally, inspect and commit the generated file. `npm run check` verifies the CSP hash, required headers, redirect targets, security fixtures and generated pages.
3. Add `fieldbook.tech` (and `www`) in Vercel, then create the DNS records Vercel shows in Cloudflare, set to DNS only (grey cloud) so Vercel issues and renews the certificate.
4. The daily workflow commits a new snapshot each morning; Vercel redeploys every push to `main`. The deployment path uses the Git integration rather than a deployment token in Actions; verify the bot commit against the successful Vercel deployment when setting it up.

## Structure

- `scripts/build.mjs`: every page, plus `feed.xml`, `index.json`, `sitemap.xml`, `security.txt`, and the root `vercel.json`.
- `scripts/lib/`: data loading (`data.mjs`), page shell (`shell.mjs`), shared parts (`parts.mjs`), icons, row diagrams for originals, utilities.
- `scripts/sync-stats.mjs`, `scripts/review.mjs`, `scripts/check.mjs`: the daily data, the automated review, and validation.
- `assets/`: `styles.css`, `app.js` (progressive enhancement only), `sound.js` (Web Audio cues), fonts, social preview image.
- `DESIGN.md`: the design system.

Fonts: Geist and Geist Mono (SIL OFL, `assets/fonts/OFL.txt`); Instrument Serif (SIL OFL, `assets/fonts/InstrumentSerif-OFL.txt`).

## Security checks

See [SECURITY-VERIFICATION.md](SECURITY-VERIFICATION.md). The daily workflow is main-only, spaces skills.sh requests by at least 2.1 seconds, and stages only statistics, reviews and generated Vercel configuration. Its content-write token remains scoped to the scheduled/manual job; further CI job separation and dependency-update automation are deferred. Source and data changes require normal maintainer review.
