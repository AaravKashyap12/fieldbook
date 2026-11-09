# Search and sharing

Production: https://fieldbook.tech/

The shared page shell renders unique titles, descriptions, clean canonical URLs, Open Graph and Twitter cards. The home page identifies Fieldbook with `WebSite` structured data; collection pages describe their visible items; skill pages identify their source work and breadcrumb trail. These are descriptions, not ratings or promises of rich search results.

- `scripts/lib/seo.mjs`: JSON-LD generation and safe serialization.
- `scripts/lib/shell.mjs`: page metadata, public Google verification tag and preview references.
- `scripts/build.mjs`: page-specific titles, breadcrumbs and canonical sitemap.
- `scripts/seo-check.mjs`: checks every generated page as part of `npm run check`.
- `assets/social-preview.png`: existing 1200 × 630 sharing image.
- `assets/favicon.png`, `assets/apple-touch-icon.png`: raster companions to the existing notebook favicon.

Filtered finder URLs canonicalize to `/skills/`; filters are a browsing aid, not hundreds of duplicate landing pages. Paused skill pages remain reachable with their explanation but are marked `noindex, follow` and omitted from the sitemap. The 404 page is also `noindex`. The sitemap omits `lastmod` because the build does not track reliable per-page modification dates.

Four curated task destinations under `/tasks/` cover debugging, testing, code review and app security. Each has its own selection guidance, preparation steps, verification checklist and server-rendered list of available matching skills. The existing task links lead to these pages; other tasks still open the finder. Each guide links back to the finder with its task preselected so stack and access filters remain available. These pages have their own canonical URLs, breadcrumbs and sitemap entries. Add a new guide only when it has useful task-specific content, not to produce every combination of keywords and filters. `scripts/task-check.mjs` checks their listing coverage, links and paused states.

Google Search Console uses the URL-prefix property `https://fieldbook.tech/`. Keep the public `google-site-verification` meta tag: Google can recheck it. The sitemap is `https://fieldbook.tech/sitemap.xml`. Verification and submission do not guarantee indexing or rankings; consult Search Console for actual status. No analytics or tracking scripts were added.

## Maintenance

Run `npm run build` and `npm run check` before publishing. If the sharing image changes dimensions, update the image metadata and checker together. Do not add synthetic ratings, keyword lists, fake modification dates or review claims that exceed the evidence. Keep structured data consistent with visible content.

Official guidance used:

- [Site names](https://developers.google.com/search/docs/appearance/site-names)
- [Titles](https://developers.google.com/search/docs/appearance/title-link)
- [Snippets](https://developers.google.com/search/docs/appearance/snippet)
- [Favicons](https://developers.google.com/search/docs/appearance/favicon-in-search)
- [Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
