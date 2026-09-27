import { esc } from './util.mjs';

// Each row carries a small diagram of how that skill works. Authored ones are
// keyed by slug; any other skill falls back to a step track built from the
// `steps` field in skills.json, so new entries never need layout changes.
// Base strokes are always visible. On hover every line draws in accent, in
// reading order (`--d` staggers it), and each point lights as its line reaches
// it. Dashed lines draw through a mask so they keep their dashes.
const label = (x, y, text, anchor = 'start', cls = '') => `<text x="${x}" y="${y}" text-anchor="${anchor}"${cls ? ` class="${cls}"` : ''}>${esc(text)}</text>`;
const at = ms => ms ? ` style="--d:${ms}ms"` : '';
const trace = (d, ms = 0) => `<path class="dg-flow" pathLength="1" d="${d}"${at(ms)}/>`;
// A mask region in user space: a bounding-box region would be zero height on a
// horizontal line and hide it completely.
const dashTrace = (id, d, ms = 0) => `<mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="228" height="128"><path class="dg-flow dg-mask" pathLength="1" d="${d}"${at(ms)}/></mask><path class="dg-flow-dash" d="${d}" mask="url(#${id})"/>`;
const diagrams = {
  // Several lines of evidence converge on one direction.
  'advise-project-approach': st => `<g class="dg-base"><path d="M12 18C60 18 76 50 118 50"/><path d="M12 50H118"/><path d="M12 82C60 82 76 50 118 50"/><path d="M118 50H182"/></g>${trace('M12 18C60 18 76 50 118 50H182')}${trace('M12 50H182', 70)}${trace('M12 82C60 82 76 50 118 50H182', 140)}<circle class="dg-node" cx="12" cy="18" r="3.5"/><circle class="dg-node" cx="12" cy="50" r="3.5"${at(70)}/><circle class="dg-node" cx="12" cy="82" r="3.5"${at(140)}/><circle class="dg-knot" cx="118" cy="50" r="2.5"${at(240)}/><circle class="dg-end" cx="191" cy="50" r="6"/>${label(4, 104, st[0])}${label(204, 104, st[1], 'end', 'dg-last')}`,
  // The TDD loop: red, then green, round again, then out to a verified change.
  'lean-engineering': st => `<g class="dg-base"><circle cx="48" cy="44" r="26"/><path d="M48 70H182"/></g>${trace('M48 18A26 26 0 0 1 48 70H182')}${trace('M48 70A26 26 0 0 1 48 18', 200)}<path class="dg-arrow" d="M70 39l4 5 4-5"${at(90)}/><path class="dg-arrow" d="M26 49l-4-5-4 5"${at(300)}/><circle class="dg-red" cx="48" cy="18" r="4.5"/><circle class="dg-green" cx="48" cy="70" r="4.5"${at(180)}/><circle class="dg-end" cx="191" cy="70" r="6"/><path class="dg-check" d="M188.2 70.2l2 2 3.6-4"/>${label(58, 13, st[0])}${label(48, 96, st[1], 'middle')}${label(204, 96, st[2], 'end', 'dg-last')}`,
  // A checklist sorted by urgency: the launch row is solid and ends verified;
  // later rows are dashed and shorter, and draw after it.
  'secure-launch': st => `<g class="dg-base"><path d="M26 24H182"/><path class="dg-dash" d="M26 52H134"/><path class="dg-dash" d="M26 80H92"/></g>${trace('M26 24H182')}${dashTrace('dgm-secure-launch-1', 'M26 52H134', 120)}${dashTrace('dgm-secure-launch-2', 'M26 80H92', 240)}<rect class="dg-node" x="8" y="18" width="12" height="12" rx="3"/><rect class="dg-node" x="8" y="46" width="12" height="12" rx="3"${at(120)}/><rect class="dg-node" x="8" y="74" width="12" height="12" rx="3"${at(240)}/><circle class="dg-node" cx="138" cy="52" r="3"${at(400)}/><circle class="dg-node" cx="96" cy="80" r="3"${at(440)}/><circle class="dg-end" cx="191" cy="24" r="6"/><path class="dg-check" d="M188.2 24.2l2 2 3.6-4"/>${label(4, 104, st[0])}${label(104, 104, st[1], 'middle')}${label(204, 104, st[2], 'end', 'dg-last')}`,
  // The owner routes work out to cheaper workers and gathers the result;
  // hard judgment stays on the dashed direct line.
  'efficiency-skill': st => `<g class="dg-base"><path d="M20 50C48 50 56 20 86 20H118C148 20 156 50 182 50"/><path d="M20 50C48 50 56 80 86 80H118C148 80 156 50 182 50"/><path class="dg-dash" d="M20 50H182"/></g>${trace('M20 50C48 50 56 20 86 20H118C148 20 156 50 182 50')}${trace('M20 50C48 50 56 80 86 80H118C148 80 156 50 182 50', 80)}${dashTrace('dgm-efficiency-skill-0', 'M20 50H182', 160)}<circle class="dg-owner" cx="14" cy="50" r="6"/><circle class="dg-node" cx="102" cy="20" r="3.5"${at(200)}/><circle class="dg-node" cx="102" cy="80" r="3.5"${at(280)}/><circle class="dg-end" cx="191" cy="50" r="6"/>${label(4, 104, st[0])}${label(102, 104, st[1], 'middle')}${label(204, 104, st[2], 'end', 'dg-last')}`
};
const genericDiagram = st => {
  const n = st.length;
  const x = i => n === 1 ? 104 : 14 + (i * 176) / (n - 1);
  return `<g class="dg-base"><path d="M${x(0)} 50H${x(n - 1)}"/></g>${trace(`M${x(0)} 50H${x(n - 1)}`)}${st.map((t, i) => `<circle class="${i === n - 1 ? 'dg-end' : 'dg-node'}" cx="${x(i)}" cy="50" r="${i === n - 1 ? 6 : 3.5}"${i && i < n - 1 ? at(Math.round((i / (n - 1)) * 360)) : ''}/>${label(x(i), 78, t, i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle', i === n - 1 ? 'dg-last' : '')}`).join('')}`;
};
export const diagram = s => {
  const st = s.steps || [];
  if (!st.length) return '';
  const body = (diagrams[s.slug] || genericDiagram)(st);
  return `<figure class="dg"><svg viewBox="0 0 208 108" role="img" aria-label="How ${esc(s.name)} works: ${esc(st.join(', then '))}">${body}</svg></figure>`;
};
