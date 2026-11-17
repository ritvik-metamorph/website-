// The simple Sectors (ink-sectors.html; js/ink.js says what the simple site is): the founder's grid as
// an index. Every sector by family, with its note and the disciplines that decide it, each with the
// ink of what it does (unlocks, reprices, de-risks, constrains, legitimises, restructures). A box finds
// a sector by its name, its family or a discipline. Each opens its own page, which both sites share.

import { inkPage } from './ink.js';
import { ATLAS } from './atlas-data.js';
import { NOTES } from './sectors-data.js';
import { drawLoom } from './ink-loom.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const FORCES = ['unlocks', 'reprices', 'derisks', 'constrains', 'legitimises', 'restructures'];
const label = (f) => (ATLAS.forces[f]?.label || f).replace('-', '‑');
const knot = (f) => `<i class="iks-knot" style="--fc:var(--f-${f})"></i>`;

const { reduced, onEnter } = inkPage();

// the grid itself, drawn, above the index
drawLoom(document.querySelector('[data-loom]'), { reduced, onEnter, ratio: matchMedia('(max-aspect-ratio: 1/1)').matches ? 0.9 : 0.38 });

// what a discipline can do to a sector
$('.iks-forces').innerHTML = FORCES.map((f) => `<span title="${esc(ATLAS.forces[f]?.note || '')}">${knot(f)}${esc(label(f))}</span>`).join('');

// every link of the grid, by sector
const by = {};
ATLAS.disciplines.forEach((d) => d.links.forEach((l) => { if (!by[l.s]) by[l.s] = []; by[l.s].push({ d, f: l.f }); }));

const host = $('.iks-fams');
host.innerHTML = Object.entries(ATLAS.families).map(([k, fam]) => {
  const ss = ATLAS.sectors.filter((s) => s.fam === k);
  const rows = ss.map((s) => {
    const ms = by[s.id] || [];
    const who = ms.map((m) => `<span>${knot(m.f)}${esc(m.d.name)} ${esc(label(m.f))} it</span>`).join('');
    const words = [s.name, fam, ...ms.map((m) => m.d.name)].join(' ').toLowerCase();
    return `<a class="iks-row" href="sectors.html#${s.id}" data-find="${esc(words)}"><span class="iks-row-name">${esc(s.name)}</span><span class="iks-row-note">${esc(NOTES[s.id]?.note || '')}</span><span class="iks-row-by">${who}</span></a>`;
  }).join('');
  return `<section class="iks-fam" aria-label="${esc(fam)}"><header class="iks-fam-h"><h2>${esc(fam)}</h2><span>${String(ss.length).padStart(2, '0')}</span></header>${rows}</section>`;
}).join('') + '<p class="iks-none" hidden>No sector by that name. Try a family, or a discipline such as law.</p>';

// finding one
const find = $('.iks-find'), none = $('.iks-none');
find.addEventListener('input', () => {
  const q = find.value.trim().toLowerCase();
  let any = false;
  $$('.iks-fam').forEach((f) => {
    let shown = 0;
    $$('.iks-row', f).forEach((r) => { const ok = !q || r.dataset.find.includes(q); r.hidden = !ok; if (ok) shown++; });
    f.hidden = !shown;
    if (shown) any = true;
  });
  none.hidden = any;
});
