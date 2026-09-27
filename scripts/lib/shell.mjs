import { structuredData, jsonLd } from './seo.mjs';
import { esc } from './util.mjs';
import { icon, githubMark, mark } from './icons.mjs';

export const SITE = {
  name: 'Fieldbook',
  tagline: 'Reviewed engineering skills for coding agents',
  author: 'Aarav Kashyap',
  description: 'Find reviewed agent skills for Claude Code, Codex and other coding agents. Browse by task and stack, compare access labels, and copy install commands.',
  origin: (process.env.SITE_URL || 'https://fieldbook.tech').replace(/\/$/, ''),
  github: 'https://github.com/AaravKashyap12',
  // Public repository that receives submissions as GitHub issues.
  repo: 'AaravKashyap12/fieldbook',
  skillsCli: 'https://github.com/vercel-labs/skills',
  skillsSh: 'https://skills.sh'
};

export const external = (url, label, cls = '') => `<a${cls ? ` class="${cls}"` : ''} href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}${icon('arrow')}<span class="sr-only"> (opens in a new tab)</span></a>`;

// Links inside running text carry no arrow icon, so punctuation never wraps away from them.
export const inlineLink = (url, label) => `<a class="inline-link" href="${esc(url)}" target="_blank" rel="noopener noreferrer">${label}<span class="sr-only"> (opens in a new tab)</span></a>`;

const NAV = [['directory', '/skills/', '<span class="nl-long">Directory</span><span class="nl-short">Skills</span>'], ['kits', '/kits/', 'Kits'], ['submit', '/submit/', 'Submit'], ['updates', '/updates/', 'Updates']];

const header = current => `<a class="skip" href="#main">Skip to content</a><header class="site-header" data-header><div class="wrap"><nav class="island" aria-label="Main"><a class="brand" href="/" aria-label="${SITE.name} home">${mark}<span class="brand-name">${SITE.name}</span></a><div class="nav-links" data-nav-links>${NAV.map(([key, href, label]) => `<a href="${href}" class="nav-${key}"${current === key ? ' aria-current="page"' : ''}>${label}</a>`).join('')}<span class="nav-hover" aria-hidden="true"></span></div><div class="nav-tools"><a class="gh-pill" href="https://github.com/${SITE.repo}" target="_blank" rel="noopener noreferrer">${githubMark}<span class="gh-label">GitHub</span>${icon('arrow', 'gh-arrow')}<span class="sr-only"> (opens in a new tab)</span></a><span class="nav-divider" aria-hidden="true"></span><button type="button" class="icon-button sound-toggle" data-sound-toggle aria-pressed="false" aria-label="Turn interface sounds on">${icon('sound')}</button><button type="button" class="icon-button theme-toggle" data-theme-toggle aria-label="Switch to dark theme">${icon('theme')}</button></div></nav></div></header>`;

const footer = `<footer class="site-footer"><div class="wrap footer-inner"><div class="footer-brand"><a class="brand" href="/" aria-label="${SITE.name} home">${mark}<span>${SITE.name}</span></a><p>${SITE.tagline}. Every listing keeps its own repository, licence and author.</p></div><nav class="footer-links" aria-label="Footer"><div><h2>Browse</h2><a href="/skills/">Directory</a><a href="/kits/">Kits</a><a href="/updates/">Updates</a></div><div><h2>Contribute</h2><a href="/submit/">Submit a skill</a><a href="/review/">How we review</a>${external(`https://github.com/${SITE.repo}`, 'Source on GitHub')}</div><div><h2>Data</h2><a href="/feed/">${icon('rss')}New skills feed</a><a href="/index.json">Directory as JSON</a>${external(SITE.skillsSh, 'Installs via skills.sh')}</div></nav><div class="footer-bottom"><span>Made by ${SITE.author}</span><span>Checked before it is listed.</span></div></div></footer>`;

// Theme: light by default; a remembered choice (including the pre-rename key) wins.
export const headScript = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('fieldbook:theme')||localStorage.getItem('aarav-skills:theme');if(t==='dark'||t==='light')d.dataset.theme=t}catch(e){}['pagereveal','pageswap'].forEach(function(n){addEventListener(n,function(e){if(!e.viewTransition)return;if(n==='pagereveal')d.classList.add('vt');['ready','finished','updateCallbackDone'].forEach(function(p){e.viewTransition[p]&&e.viewTransition[p].catch(function(){})})})})})()`;

export function page({ title, description, route, content, current = '', headExtra = '', breadcrumbs = [], items, skill, noindex = false }) {
  const url = SITE.origin + route;
  const metadata = noindex ? '' : `<script type="application/ld+json">${jsonLd(structuredData(SITE, { title, description, route, breadcrumbs, items, skill }))}</script>`;
  return `<!doctype html><html lang="en" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">${route === '/' ? '<meta name="google-site-verification" content="6SBSLkbaNCQ8AxKOoH-VQq7enckOAOxHDpVOsPpbqKA">' : ''}<meta name="theme-color" content="#f7f7f2"><link rel="canonical" href="${esc(url)}"><link rel="icon" href="/favicon.png" type="image/png" sizes="96x96"><link rel="icon" href="/favicon.svg" type="image/svg+xml"><link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180"><link rel="alternate" type="application/rss+xml" title="New skills on ${SITE.name}" href="/feed.xml"><link rel="preload" href="/fonts/geist-latin.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/instrument-serif-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin><link rel="preload" href="/fonts/instrument-serif-latin-400-italic.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="/styles.css"><meta property="og:type" content="website"><meta property="og:locale" content="en_US"><meta property="og:site_name" content="${SITE.name}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(url)}"><meta property="og:image" content="${SITE.origin}/social-preview.png"><meta property="og:image:type" content="image/png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="${SITE.name}: ${SITE.tagline.toLowerCase()}."><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${SITE.origin}/social-preview.png"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image:alt" content="${SITE.name}: ${SITE.tagline.toLowerCase()}.">${metadata}${headExtra}<script>${headScript}</script><script type="module" src="/app.js"></script></head><body>${header(current)}${content}${footer}<div id="copy-status" class="sr-only" role="status" aria-live="polite"></div></body></html>`;
}
