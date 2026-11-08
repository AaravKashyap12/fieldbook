# Source revision verification

## Change and scope

Daily review resolves each upstream repository commit once, fetches `SKILL.md` at that commit, and records the commit beside the scan hash. Skill pages, directory copy buttons, kits and the JSON export use that revision. A source link opens the scanned file at the same commit.

Legacy records without a revision keep an unpinned warning. Failed refreshes retain only eligible prior evidence, including its original revision and date. Malformed or mismatched provenance pauses installation. Pins may advance after the next successful daily scan.

The scan still covers only `SKILL.md`. It does not execute a skill, scan referenced files, establish a new human-reading date, or prove usefulness. No new runtime evaluations or beginner usability results are claimed.

## Evidence

- The initial install-command regression failed because the old helper ignored the supplied revision. It passes after the change.
- `npm run build` and `npm run check` pass, including the original 52 security assertions and the new offline revision fixtures. The latter exercise immutable fetches, one resolution per repository, failed-resolution caching, token isolation, invalid pins, retained/legacy states, actual original/community page generation, kit commands and JSON exports.
- Explicit null provenance initially bypassed validation. Independent read-only review found it; property-presence validation and both-null/single-null regressions now cover it. The reviewer inspected the correction and reported no remaining must-fix findings.
- A full refresh on November 8, 2026 scanned 144 of 155 listings at immutable commits. Eleven fetches failed: seven retained eligible previous unpinned scans; four remained unavailable. Seven listings are paused in total, unchanged from the baseline. Four AWS skill hashes changed upstream and received new scans, without carrying old hashes forward.
- The published Skills CLI version was 1.7.6, with source commit `7a5e920bead4b1039a6d6df5d7e1163b7b09423a`. Its [tree-URL parser](https://github.com/vercel-labs/skills/blob/7a5e920bead4b1039a6d6df5d7e1163b7b09423a/src/source-parser.ts) accepts a full revision and its [Git implementation](https://github.com/vercel-labs/skills/blob/7a5e920bead4b1039a6d6df5d7e1163b7b09423a/src/git.ts) fetches commit SHAs. This is source inspection, not a completed installation. The newer `owner/repo@sha` shorthand is deliberately not used.
- Local Chromium checks passed against the built implementation commit `7f5090991110b6a4e939339d277ee0ef54214c4b`: original and community pages copied their exact pinned commands; Skills CLI/Prompt switching worked; the paused Systematic debugging page exposed no copy controls; retained Security review evidence stayed explicitly unpinned; Bug hunt copied three available commands and a starter prompt, excluding the paused skill. Back/forward navigation also worked.
- Desktop inspection used a 1176 by 757 viewport. A separate narrow native browser window, about 500 pixels wide at 125% zoom, kept Lean Engineering evidence, its full-commit command, and Bug hunt's three commands readable without clipping. Long commands wrapped and the original-page copy button showed copied feedback. This is responsive browser testing, not physical-device or beginner usability testing.

Independent review covered the fetch/cache boundary, failure retention, provenance validation, normalization, generated commands and links, original/community detail pages, directory controls, kits, exports, and regression coverage. The reviewer did not run scripts or installations.

## Limits and rollback

The built site was served locally for browser checks. The Vercel preview required authentication and was not browser-tested. No third-party skill was installed or run, and no production deployment has been verified.

This change adds no dependencies or credentials and changes no hosting configuration. Reverting its code and review-data commit restores the previous unpinned commands. Do not merge until the final-head CI checks pass and the merge is approved; main deploys through Vercel's Git integration.
