// The founder's grid, drawn (16 Nov, for the simple site): the picture is the data. Twenty-seven
// threads of knowledge across, by ring; forty-eight threads of industry down, by family; a knot in one
// of six inks wherever a discipline decides a sector (151 of them), the ink saying how (unlocks,
// reprices, de-risks, constrains, legitimises, restructures). The threads are drawn in as it comes up
// the screen and the knots set down along them. Point at it and the two threads under the pointer
// lift, with what the one does to the other written beside; click and the sector's page opens.
// The creative Sectors page weaves the same grid as cloth (js/sectors.js); this is its plain drawing.

import { ATLAS } from './atlas-data.js';

const NS = 'http://www.w3.org/2000/svg';
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function drawLoom(fig, { reduced = false, ratio = 0.56, onEnter = (el, fn) => fn(), href = (s) => `sectors.html#${s.id}` } = {}) {
  if (!fig) return null;
  const discs = [...ATLAS.disciplines].sort((a, b) => a.ring - b.ring);
  const fams = Object.keys(ATLAS.families);
  const sects = fams.flatMap((k) => ATLAS.sectors.filter((s) => s.fam === k));
  const col = new Map(sects.map((s, i) => [s.id, i]));
  const R = discs.length, C = sects.length;
  const W = 1000, H = Math.round(W * ratio), pad = 6;
  const cw = (W - pad * 2) / (C - 1), rh = (H - pad * 2) / (R - 1);
  const X = (i) => pad + i * cw, Y = (j) => pad + j * rh;

  let s = '';
  // the threads of industry, down; a darker one where a family begins
  sects.forEach((sec, i) => {
    const first = i === 0 || sects[i - 1].fam !== sec.fam;
    s += `<line class="lw-d${first ? ' is-fam' : ''}" x1="${X(i)}" y1="0" x2="${X(i)}" y2="${H}" pathLength="1" style="--k:${i}"/>`;
  });
  // the threads of knowledge, across; a darker one where a ring begins
  discs.forEach((d, j) => {
    const first = j === 0 || discs[j - 1].ring !== d.ring;
    s += `<line class="lw-a${first ? ' is-ring' : ''}" x1="0" y1="${Y(j)}" x2="${W}" y2="${Y(j)}" pathLength="1" style="--k:${j}"/>`;
  });
  // the knots
  const knots = [];
  discs.forEach((d, j) => d.links.forEach((l) => {
    const i = col.get(l.s);
    if (i === undefined) return;
    knots.push({ d, s: sects[i], f: l.f, use: l.use, i, j });
    s += `<circle class="lk" cx="${X(i)}" cy="${Y(j)}" r="4.2" style="--fc:var(--f-${l.f});--k:${(i + j * 2)}"/>`;
  }));
  s += `<line class="lh lh-a" x1="0" x2="${W}" y1="-10" y2="-10"/><line class="lh lh-d" y1="0" y2="${H}" x1="-10" x2="-10"/>`;

  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.setAttribute('class', 'ik-loom-svg');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', `The founder's grid: ${R} disciplines across ${C} sectors, with ${knots.length} places where one decides the other.`);
  svg.innerHTML = s;
  const say = document.createElement('figcaption');
  say.className = 'ik-loom-say';
  say.innerHTML = `<span><b>${R}</b> disciplines</span><span><b>${C}</b> sectors</span><span><b>${knots.length}</b> knots</span>`;
  const rest = say.innerHTML;
  fig.append(svg, say);

  const ha = svg.querySelector('.lh-a'), hd = svg.querySelector('.lh-d');
  let on = null;
  const point = (e) => {
    const r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    const i = Math.round((x - pad) / cw), j = Math.round((y - pad) / rh);
    if (i < 0 || j < 0 || i >= C || j >= R) { leave(); return; }
    const k = knots.find((n) => n.i === i && n.j === j) || null;
    ha.setAttribute('y1', Y(j)); ha.setAttribute('y2', Y(j));
    hd.setAttribute('x1', X(i)); hd.setAttribute('x2', X(i));
    fig.classList.add('is-pointing');
    if (k === on && fig.dataset.at === `${i}.${j}`) return;
    on = k;
    fig.dataset.at = `${i}.${j}`;
    const d = discs[j], sec = sects[i];
    say.innerHTML = k
      ? `<span class="ik-loom-f" style="--fc:var(--f-${k.f})"><i></i><b>${esc(d.name)}</b> ${esc((ATLAS.forces[k.f]?.label || k.f).replace('-', '‑'))} <b>${esc(sec.name)}</b></span><span class="ik-loom-use">${esc(k.use || '')}</span>`
      : `<span><b>${esc(d.name)}</b> · <b>${esc(sec.name)}</b></span><span class="ik-loom-use">No knot: ${esc(d.name.toLowerCase())} does not decide this sector on the founder's grid.</span>`;
  };
  const leave = () => { on = null; delete fig.dataset.at; fig.classList.remove('is-pointing'); say.innerHTML = rest; };
  svg.addEventListener('pointermove', point);
  svg.addEventListener('pointerleave', leave);
  svg.addEventListener('click', (e) => {
    point(e);
    const [i] = (fig.dataset.at || '').split('.').map(Number);
    if (Number.isFinite(i) && sects[i]) location.assign(href(sects[i]));
  });
  svg.style.cursor = 'pointer';

  if (reduced) fig.classList.add('is-shown');
  else onEnter(fig, () => fig.classList.add('is-shown'));
  return { svg, knots, discs, sects };
}
