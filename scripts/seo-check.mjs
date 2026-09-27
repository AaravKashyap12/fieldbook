import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { SITE } from './lib/shell.mjs';
import { jsonLd } from './lib/seo.mjs';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
async function files(dir) {
  const children = await readdir(dir, { withFileTypes: true });
  return (await Promise.all(children.map(f => f.isDirectory() ? files(path.join(dir, f.name)) : path.join(dir, f.name)))).flat();
}
const decode = s => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const sitemap = await readFile(path.join(dist, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => decode(m[1]));
assert.equal(new Set(urls).size, urls.length, 'Sitemap has no duplicates');
assert.ok(!sitemap.includes('<lastmod>'), 'Do not invent freshness dates');
const titles = new Set();
let pages = 0;
for (const file of (await files(dist)).filter(f => f.endsWith('.html'))) {
  const html = await readFile(file, 'utf8');
  const route = '/' + path.relative(dist, file).split(path.sep).join('/').replace(/index\.html$/, '');
  const expected = SITE.origin + route;
  const canonical = [...html.matchAll(/<link rel="canonical" href="([^"]+)"/g)];
  assert.equal(canonical.length, 1, `${route}: exactly one canonical`);
  assert.equal(decode(canonical[0][1]), expected, `${route}: canonical uses production origin and clean path`);
  const title = decode(html.match(/<title>(.*?)<\/title>/)?.[1] || '');
  assert.ok(title && !titles.has(title), `${route}: distinct title`);
  titles.add(title);
  for (const name of ['description', 'twitter:title', 'twitter:description', 'twitter:image', 'twitter:image:alt']) {
    assert.match(html, new RegExp(`<meta name="${name}" content="[^"]+"`), `${route}: ${name}`);
  }
  for (const name of ['og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height']) {
    assert.match(html, new RegExp(`<meta property="${name}" content="[^"]+"`), `${route}: ${name}`);
  }
  const noindex = html.includes('content="noindex, follow"');
  assert.equal(urls.includes(expected), !noindex, `${route}: sitemap includes indexable pages only`);
  if (!noindex) {
    const blocks = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)];
    assert.equal(blocks.length, 1, `${route}: structured data present`);
    const graph = JSON.parse(blocks[0][1]);
    assert.equal(graph['@context'], 'https://schema.org');
    const page = graph['@graph'].find(n => ['WebPage', 'CollectionPage'].includes(n['@type']));
    assert.equal(page.url, expected);
    assert.equal(page.name, title);
    if (route === '/') assert.equal(graph['@graph'].find(n => n['@type'] === 'WebSite').name, 'Fieldbook');
    for (const crumb of graph['@graph'].find(n => n['@type'] === 'BreadcrumbList')?.itemListElement || []) {
      assert.ok(urls.includes(crumb.item), `${route}: breadcrumb has a real canonical destination`);
    }
    if (page.mainEntity) {
      const list = page.mainEntity;
      assert.equal(list.numberOfItems, list.itemListElement.length);
      for (const item of list.itemListElement) assert.ok(html.includes(`href="${new URL(item.url).pathname}"`), `${route}: list item visible in HTML`);
    }
  }
  pages++;
}
const robots = await readFile(path.join(dist, 'robots.txt'), 'utf8');
assert.ok(robots.includes(`Sitemap: ${SITE.origin}/sitemap.xml`));
assert.ok(robots.includes('Allow: /'));
for (const [file, width, height] of [['social-preview.png', 1200, 630], ['favicon.png', 96, 96], ['apple-touch-icon.png', 180, 180]]) {
  const png = await readFile(path.join(dist, file));
  assert.equal(png.subarray(1, 4).toString(), 'PNG');
  assert.equal(png.readUInt32BE(16), width);
  assert.equal(png.readUInt32BE(20), height);
}
const payload = '</script><script>alert(1)</script>&';
assert.ok(!jsonLd({ payload }).includes('<'));
assert.equal(JSON.parse(jsonLd({ payload })).payload, payload);
console.log(`SEO passed: ${pages} pages; ${urls.length} sitemap URLs; unique titles, canonical URLs, social metadata, JSON-LD, robots and image dimensions.`);
