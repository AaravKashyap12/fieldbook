// Server-rendered metadata. No ratings, runtime claims or artificial update dates.
export function structuredData(site, { title, description, route, breadcrumbs = [], items, skill }) {
  const url = site.origin + route;
  const graph = [];
  if (route === '/') graph.push({
    '@type': 'WebSite', '@id': `${site.origin}/#website`, name: site.name,
    alternateName: 'fieldbook.tech', url: `${site.origin}/`, description: site.description,
    sameAs: [`https://github.com/${site.repo}`]
  });
  const page = {
    '@type': items ? 'CollectionPage' : 'WebPage', '@id': `${url}#webpage`,
    url, name: title, description, inLanguage: 'en',
    isPartOf: { '@id': `${site.origin}/#website` }
  };
  if (breadcrumbs.length) {
    page.breadcrumb = { '@id': `${url}#breadcrumbs` };
    graph.push({ '@type': 'BreadcrumbList', '@id': `${url}#breadcrumbs`,
      itemListElement: breadcrumbs.map(([name, path], i) => ({
        '@type': 'ListItem', position: i + 1, name, item: site.origin + path
      })) });
  }
  if (items) page.mainEntity = {
    '@type': 'ItemList', numberOfItems: items.length,
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem', position: i + 1, name: item.name, url: site.origin + item.url
    }))
  };
  if (skill) page.about = {
    '@type': 'CreativeWork', name: skill.name, description: skill.summary,
    url: skill.sourceUrl, sameAs: `https://github.com/${skill.repo}`
  };
  graph.push(page);
  return { '@context': 'https://schema.org', '@graph': graph };
}

export function jsonLd(value) {
  // A source description must never terminate the JSON data block.
  return JSON.stringify(value).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
}
