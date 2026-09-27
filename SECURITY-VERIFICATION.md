# Secure Launch verification

The launch pass used secure-launch 0.1.3 without installing it globally. This is bounded local verification, not a penetration test or a security certificate.

## Implemented

- Upstream counts and dates are type-checked, missing values remain unknown, and statistical rendering does not accept raw markup.
- Missing/invalid reviews pause listings. Defensive exceptions are bound to exact source hashes. Paused entries do not expose installation commands in pages, kits or JSON exports.
- A network or 5xx failure may retain only the latest good review for the same source, with the old check date and an explicit retained marker. Changed content and new findings always replace the old review. HTTP 4xx and oversized responses do not receive this fallback.
- More than 10% failed fetches aborts review before replacing its output. The chained daily step fails, so the subsequent commit step does not run. Exactly 10% may use eligible cached records.
- The daily job is main-only, spaces statistics requests by at least 2.1 seconds and stages only statistics, reviews and generated Vercel configuration.
- Local hosting state is ignored. Current CSP and security-header values are preserved; configuration drift fails the build unless intentional regeneration is requested and committed.

## Commands run

| Check | Result |
| --- | --- |
| Focused statistic regression | Confirmed raw-markup failure before the fix; passed after the fix |
| `node scripts/security-check.mjs` | 52 offline assertions passed, including cache eligibility, changed content, new findings, 4xx/5xx handling and the >10% boundary |
| `npm run build` | 180 pages; 155 skills, four originals, zero paused |
| `npm run check` | 52 security assertions; 181 HTML pages, links, ARIA, feed/export, CSP, required headers and redirect checks passed |
| Isolated missing-review fixture | Two unavailable reviews paused; 11 pages checked, no paused detail copy controls or install exports |

The fixture changes were outside the source site and made no provider calls. Builds do not run third-party skills. Runtime response headers, TLS, Git-triggered deployment and public issue prefill are separate live launch checks.

The fallback scanner reports generic assigned-secret matches in header/lookup code; inspected source is masked. These are not confirmed leaked credentials. Binary fonts/images are outside that scanner's coverage.

## Deferred

Further CI read/write-job separation, dependency-update automation and growth-stage application controls remain deferred. Private vulnerability reporting and public-submission notices are part of this launch instead.

## Git integration and daily proof

The public repository is https://github.com/AaravKashyap12/fieldbook. Private vulnerability reporting is enabled. Vercel is connected to main through its native Git integration, with fieldbook.tech as the canonical domain and www.fieldbook.tech redirecting to it. Both names use DNS-only records in Cloudflare.

The single manual Daily snapshot run [36314400152](https://github.com/AaravKashyap12/fieldbook/actions/runs/36314400152) completed successfully with zero review fetch failures and created commit `7191c20769d2175feefbc130bc8f5d24a3271b89`. Vercel automatically deployed that exact commit with source `git` and status `READY` (deployment `dpl_6Af7UeUxWnY917cp3aPRBcekxEqw`). The final daily command also invokes the full `npm run check`, including the focused security assertions, before committing; that command wiring is covered locally. No second manual daily run was used.
