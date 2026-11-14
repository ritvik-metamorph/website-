// The Sectors page (sectors.html): the founder's grid, "Twenty-Seven into Forty-Eight", woven.
//
// - The loom (7 Nov): the grid as cloth on the night silk. Twenty-seven threads of knowledge run
//   across (the disciplines, in the six layers of life they furnish) and forty-eight threads of
//   industry run down (the sectors, in nine families), woven over and under. Wherever a
//   discipline decides how a sector behaves, the two threads are tied in a knot, in the ink of
//   the force it exerts; everywhere else they only pass, because most of the cloth is meant to be
//   plain ("a discipline that touches everything touches nothing"). It is woven as you arrive: the
//   threads across drawn in, the threads down passed through, then the knots tied. Left alone, it
//   reads itself: a sector's thread is drawn taut, its disciplines' threads pulled to their knots,
//   and its line written under it. Under the cursor the two threads at the point lift; on a knot,
//   what that discipline is used for there and what it changes. A force in the key shows only its
//   own knots. On a phone the cloth is turned: sectors across, disciplines down.
// - Below it: the forty-eight by family on the paper, each with its own thread, knotted where it
//   is decided; the founder's findings on the night; where Metamorph has worked, once the client
//   supplies it (WORKED); then the way to talk.
// - A sector (#banking): its name on the night; then on the paper its levers (what decides it),
//   its thread hanging beside the words, each knot swelling as you read that discipline, and the
//   rest of the Notion's Narrative Page and Narrative Dashboard as Metamorph supplies it
//   (NARRATIVE in js/sectors-data.js); what has not arrived is listed, never invented.
import { ATLAS } from './atlas-data.js';
import { NOTES, LAYERS, FINDINGS, NARRATIVE, WORKED } from './sectors-data.js';
import { setupSectorsSilk } from './sectors-silk.js';

const { gsap } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const narrow = () => matchMedia('(max-aspect-ratio: 1/1), (max-width: 899px) and (min-height: 521px)').matches;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const f1 = (v) => v.toFixed(1);

// ---------------------------------------------------------------- the grid, once

const FORCES = ['unlocks', 'reprices', 'derisks', 'constrains', 'legitimises', 'restructures'];
const LAYER_KEYS = Object.keys(LAYERS);
const FAM_KEYS = Object.keys(ATLAS.families);
const DISCS = LAYER_KEYS.flatMap((L) => ATLAS.disciplines.filter((d) => d.layer === L));
const SECTS = FAM_KEYS.flatMap((f) => ATLAS.sectors.filter((s) => s.fam === f)).map((s) => ({ ...s, ...NOTES[s.id] }));
const BY_ID = Object.fromEntries(SECTS.map((s) => [s.id, s]));
const MARKS = [];
DISCS.forEach((d) => d.links.forEach((l) => { if (BY_ID[l.s]) MARKS.push({ d, s: BY_ID[l.s], f: l.f, use: l.use, eff: l.eff }); }));
const marksOf = (s) => MARKS.filter((m) => m.s === s).sort((a, b) => DISCS.indexOf(a.d) - DISCS.indexOf(b.d));
const reachOf = (d) => MARKS.filter((m) => m.d === d);
const fl = (f) => (ATLAS.forces[f]?.label || f).replace('-', '‑'); // (de-risks never breaks at its hyphen)
const fnote = (f) => ATLAS.forces[f]?.note || '';
const fvar = (f) => `var(--f-${f})`;
const list = (a) => (a.length < 2 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const lc = (name) => name.toLowerCase();
const cap = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const WORDS = ['No', 'One', 'Two', 'Three', 'Four', 'Five', 'Six'];
const layerOf = (d) => LAYERS[d.layer];
const worked = new Set(WORKED?.sectors || []);
// a knot, as it is drawn small in the type: a bead in its force's ink
const knot = (f) => `<i class="sx-knot" style="--fc:${fvar(f)}"></i>`;
// "Psychology legitimises it, economics restructures it and law de-risks it", each with its knot
const decidedBy = (ms) => list(ms.map((m, n) => `<span class="sx-by-k">${knot(m.f)}${esc(n ? lc(m.d.name) : m.d.name)} ${esc(fl(m.f))} it</span>`));
// a sector's own thread, small: the line it is, knotted at the heights of its disciplines
function threadOf(s, h = 72) {
  const y = (d) => 4 + (DISCS.indexOf(d) / (DISCS.length - 1)) * (h - 8);
  return `<svg class="sx-fp" viewBox="0 0 12 ${h}" width="12" height="${h}" aria-hidden="true"><line x1="6" y1="0" x2="6" y2="${h}"/>${marksOf(s).map((m) => `<circle cx="6" cy="${f1(y(m.d))}" r="3.2" style="fill:${fvar(m.f)}"/>`).join('')}</svg>`;
}

// ---------------------------------------------------------------- the page

export function setupSectors({ lenis, register, reduced, isTouch, local }) {
  const html = document.documentElement;
  const index = $('.sx-index'), article = $('.sx-sector');
  const plot = $('.sx-plot'), reading = $('.sx-reading'), card = $('.sx-card');
  const keyEl = $('.sx-key'), countEl = $('.sx-count');

  // the ground: the silk, night under the loom and paper under the reading
  const silk = setupSectorsSilk({ reduced, isTouch, local });
  const nights = () => $$('.sx-index:not([hidden]) > .sx-night, .sx-sector:not([hidden]) > .sx-night');
  register?.({
    name: 'sectors', commit() {}, revert() {},
    under: (y) => {
      if (silk) { const s = silk.at(y); return { lit: false, tone: s.g < 0.5 ? 'light' : 'ink', theme: s.hex }; }
      return nights().some((p) => { const r = p.getBoundingClientRect(); return r.top <= y && r.bottom > y; }) ? { lit: false, tone: 'light', theme: '#050709' } : { lit: false, tone: 'ink', theme: '#f2f3ef' };
    },
  });
  const remeasure = () => silk?.update();

  countEl.innerHTML = `<b>${MARKS.length}</b> knots in ${(DISCS.length * SECTS.length).toLocaleString('en-IN')} crossings`;

  // ---- the key: the six forces; one pressed shows only that force's knots
  let only = null;
  keyEl.innerHTML = FORCES.map((f) => `<button type="button" data-f="${f}" aria-pressed="false" style="--fc:${fvar(f)}"><i></i><span class="sx-key-l">${fl(f)}</span><span class="sx-key-n">${fnote(f)}</span></button>`).join('');
  $$('button', keyEl).forEach((b) => b.addEventListener('click', () => {
    only = only === b.dataset.f ? null : b.dataset.f;
    $$('button', keyEl).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.f === only)));
    plot.dataset.only = only || '';
    const n = only ? MARKS.filter((m) => m.f === only).length : MARKS.length;
    countEl.innerHTML = only ? `<b>${n}</b> knots ${esc(fl(only))}: ${esc(fnote(only))}` : `<b>${MARKS.length}</b> knots in ${(DISCS.length * SECTS.length).toLocaleString('en-IN')} crossings`;
  }));

  // ---------------------------------------------------------------- weaving the loom
  // (on a laptop the disciplines run across and the sectors down; on a phone the other way round)

  let G = null; // the current geometry
  function draw() {
    const flip = narrow();
    const rows = flip ? SECTS : DISCS, cols = flip ? DISCS : SECTS;
    const rowGroup = (r) => (flip ? r.fam : r.layer), colGroup = (c) => (flip ? c.layer : c.fam);
    const W = plot.clientWidth;
    const labelW = flip ? 104 : 200;
    const colGap = flip ? 5 : 10, bandH = flip ? 24 : 26;
    const colGroups = [...new Set(cols.map(colGroup))];
    const cw = clamp(Math.floor((W - labelW - colGap * (colGroups.length - 1)) / cols.length), flip ? 8 : 13, flip ? 14 : 26);
    const rh = flip ? 17 : cw, cell = Math.min(cw, rh);
    const headH = flip ? 30 : 34 + 112;
    const colX = [], rowY = [];
    let x = labelW, gPrev = null;
    cols.forEach((c, i) => { const g = colGroup(c); if (gPrev !== null && g !== gPrev) x += colGap; gPrev = g; colX[i] = x; x += cw; });
    let y = headH; gPrev = null;
    const bands = [];
    rows.forEach((r, j) => { const g = rowGroup(r); if (g !== gPrev) { bands.push({ g, y }); y += bandH; } gPrev = g; rowY[j] = y; y += rh; });
    const H = y + 6, gridW = x;
    // where the threads run: across from just past the names to the cloth's edge, down from under
    // the heads to its foot
    const tx = (i) => colX[i] + cw / 2, ty = (j) => rowY[j] + rh / 2;
    const x0 = labelW - 2, x1 = gridW + 4, y0 = headH - (flip ? 2 : 6), y1 = H;
    G = { flip, rows, cols, cell, cw, rh, colX, rowY, labelW, headH, W: gridW, H, bandH, tx, ty, x0, x1, y0, y1 };
    plot.style.height = `${H}px`;
    plot.style.setProperty('--cell', `${cell}px`);
    plot.classList.toggle('is-flip', flip);

    // the heads: across the top, the families (or the layers) over their threads, and on a laptop
    // each sector's short name, reading upward
    const heads = [];
    colGroups.forEach((g) => {
      const idx = cols.map((c, i) => (colGroup(c) === g ? i : -1)).filter((i) => i >= 0);
      const a = colX[idx[0]], b = colX[idx[idx.length - 1]] + cw;
      const label = flip ? `<span class="sx-g-n">${LAYERS[g].n}</span>` : esc(ATLAS.families[g]);
      heads.push(`<span class="sx-colg" style="left:${a}px;width:${b - a}px">${label}</span>`);
    });
    if (!flip) cols.forEach((c, i) => heads.push(`<a class="sx-colh${worked.has(c.id) ? ' is-worked' : ''}" href="#${c.id}" data-c="${i}" style="left:${colX[i]}px;width:${cw}px;height:${headH - 40}px"><span>${esc(c.short || c.name)}</span></a>`));
    // down the side: each group's name in its band, then the rows' names
    bands.forEach(({ g, y: by }) => {
      const label = flip ? esc(ATLAS.families[g]) : `<span class="sx-g-n">${LAYERS[g].n}</span> ${esc(LAYERS[g].name)}`;
      heads.push(`<span class="sx-rowg" style="top:${by}px;height:${bandH}px">${label}</span>`);
    });
    rows.forEach((r, j) => {
      const tag = flip ? 'a' : 'span';
      heads.push(`<${tag} class="sx-rowh${flip && worked.has(r.id) ? ' is-worked' : ''}" ${flip ? `href="#${r.id}"` : ''} data-r="${j}" style="top:${rowY[j]}px;height:${rh}px;width:${labelW - 12}px">${esc(flip ? r.short || r.name : r.name)}</${tag}>`);
    });

    // the threads, one line each, and the plain weave: at every crossing one of the two goes
    // over the other, by turns, with a breath of shadow where it lies on it
    const across = rows.map((r, j) => `<line class="sx-t sx-t-r" data-r="${j}" x1="${x0}" y1="${f1(ty(j))}" x2="${x1}" y2="${f1(ty(j))}" pathLength="1"/>`).join('');
    const down = cols.map((c, i) => `<line class="sx-t sx-t-c" data-c="${i}" x1="${f1(tx(i))}" y1="${y0}" x2="${f1(tx(i))}" y2="${y1}" pathLength="1"/>`).join('');
    const knotAt = new Set();
    const kr = cell * (flip ? 0.34 : 0.29);
    const knots = MARKS.map((m, k) => {
      const j = rows.indexOf(flip ? m.s : m.d), i = cols.indexOf(flip ? m.d : m.s);
      m.i = i; m.j = j;
      knotAt.add(`${i}:${j}`);
      return `<circle class="sx-m" data-k="${k}" data-f="${m.f}" cx="${f1(tx(i))}" cy="${f1(ty(j))}" r="${f1(kr)}" style="fill:url(#sx-k-${m.f})"/>`;
    }).join('');
    const half = cell * 0.36;
    let overR = '', overC = '';
    rows.forEach((r, j) => cols.forEach((c, i) => {
      if (knotAt.has(`${i}:${j}`)) return;
      if ((i + j) % 2) overR += `M${f1(tx(i) - half)} ${f1(ty(j))}h${f1(2 * half)}`;
      else overC += `M${f1(tx(i))} ${f1(ty(j) - half)}v${f1(2 * half)}`;
    }));
    // each force's knot: a bead of its ink, lit from the upper left
    const beads = FORCES.map((f) => `<radialGradient id="sx-k-${f}" cx="36%" cy="32%" r="72%"><stop offset="0" style="stop-color:color-mix(in srgb, var(--f-${f}) 50%, #fff)"/><stop offset=".55" style="stop-color:var(--f-${f})"/><stop offset="1" style="stop-color:color-mix(in srgb, var(--f-${f}) 62%, #000)"/></radialGradient>`).join('');
    plot.innerHTML = `<svg class="sx-svg" width="${gridW}" height="${H}" viewBox="0 0 ${gridW} ${H}" aria-hidden="true">
        <defs>${beads}</defs>
        <g class="sx-threads">${across}${down}</g>
        <g class="sx-over"><path class="sx-over-s" d="${overC}"/><path class="sx-over-t" d="${overC}"/><path class="sx-over-s" d="${overR}"/><path class="sx-over-t" d="${overR}"/></g>
        <line class="sx-lift sx-lift-c" x1="0" y1="${y0}" x2="0" y2="${y1}"/>
        <line class="sx-lift sx-lift-r" x1="${x0}" y1="0" x2="${x1}" y2="0"/>
        <g class="sx-pull"></g>
        <g class="sx-marks">${knots}</g>
      </svg>${heads.join('')}`;
    plot.style.width = `${gridW}px`;
    G.colEls = $$('.sx-colh', plot);
    G.rowEls = $$('.sx-rowh', plot);
    G.liftC = $('.sx-lift-c', plot);
    G.liftR = $('.sx-lift-r', plot);
    G.pull = $('.sx-pull', plot);
    G.markEls = $$('.sx-m', plot);
    if (lit) light(lit, true);
  }

  // which thread down and which across a point of the plot is on (-1 if none)
  function cellAt(px, py) {
    const at = (arr, v, s) => { for (let n = 0; n < arr.length; n++) if (v >= arr[n] && v < arr[n] + s) return n; return -1; };
    return [at(G.colX, px, G.cw), at(G.rowY, py, G.rh)];
  }

  // ---------------------------------------------------------------- reading a sector
  // its thread drawn taut, its disciplines' threads pulled to their knots, its line under the loom

  let lit = null;
  function sectorLine(s) {
    const ms = marksOf(s);
    return `<a class="sx-r-name" href="#${s.id}">${esc(s.name)}</a><span class="sx-r-fam">${esc(ATLAS.families[s.fam])}</span><span class="sx-r-note">${esc(s.note)}</span><span class="sx-r-by">${ms.map((m) => `<b style="color:${fvar(m.f)}">${esc(m.d.name)}</b> ${esc(fl(m.f))} it`).join(' · ')}</span>`;
  }
  function light(s, now) {
    lit = s;
    const k = SECTS.indexOf(s);
    G.markEls.forEach((e) => e.classList.toggle('is-lit', !!s && MARKS[+e.dataset.k].s === s));
    G.colEls.forEach((e) => e.classList.toggle('is-lit', !!s && +e.dataset.c === k));
    if (G.flip) G.rowEls.forEach((e) => e.classList.toggle('is-lit', !!s && +e.dataset.r === k));
    if (!s) { plot.classList.remove('has-lit'); G.pull.innerHTML = ''; return; }
    plot.classList.add('has-lit');
    const { tx, ty, x0, x1, y0, y1 } = G;
    let d = '';
    if (G.flip) {
      const yy = f1(ty(k));
      d = `M${x0} ${yy}H${x1}`;
      marksOf(s).forEach((m) => { d += `M${f1(tx(m.i))} ${y0}V${yy}`; });
    } else {
      const xx = f1(tx(k));
      d = `M${xx} ${y0}V${y1}`;
      marksOf(s).forEach((m) => { d += `M${x0} ${f1(ty(m.j))}H${xx}`; });
    }
    G.pull.innerHTML = `<path class="sx-pull-glow" d="${d}"/><path class="sx-pull-t" d="${d}" pathLength="1"/>`;
    if (!now && !reduced) gsap.fromTo($('.sx-pull-t', G.pull), { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.inOut' });
    reading.innerHTML = sectorLine(s);
  }

  // ---- left alone, it reads itself, a sector at a time
  const order = SECTS.map((s, i) => ({ s, r: Math.sin(i * 12.9898) * 43758.5453 % 1 })).sort((a, b) => a.r - b.r).map((o) => o.s);
  let auto = 0, autoT = null, hovering = false;
  function autoNext() {
    clearTimeout(autoT);
    if (hovering || reduced || article.hidden === false) return;
    light(order[auto++ % order.length]);
    autoT = setTimeout(autoNext, 4200);
  }
  const resume = () => { clearTimeout(autoT); autoT = setTimeout(autoNext, 3600); };
  // the line rides the foot of the screen while the loom runs on under it, and only then has the
  // night behind it (at rest under the loom it sits on the silk, where the dawn begins)
  function ride() {
    if (index.hidden) return;
    const r = reading.getBoundingClientRect(), f = reading.parentElement.getBoundingClientRect();
    reading.classList.toggle('is-riding', r.bottom >= innerHeight - 2 && f.bottom > innerHeight + 2);
  }
  lenis.on('scroll', ride);

  // ---- under the cursor: the two threads at the point lift, the sector's line, and a knot's card
  function showCard(m, e) {
    card.innerHTML = `<p class="sx-c-path">${esc(m.d.name)} <span>in</span> ${esc(m.s.name)}</p><p class="sx-c-f" style="--fc:${fvar(m.f)}"><i></i>${esc(cap(fl(m.f)))} it <span>${esc(fnote(m.f))}</span></p><p class="sx-c-k">What it is used for</p><p class="sx-c-t">${esc(m.use)}</p><p class="sx-c-k">What it changes</p><p class="sx-c-t">${esc(m.eff)}</p>`;
    card.classList.add('is-on');
    const w = card.offsetWidth, h = card.offsetHeight;
    let x = e.clientX + 22, y = e.clientY + 18;
    if (x + w > innerWidth - 16) x = e.clientX - w - 22;
    if (y + h > innerHeight - 16) y = innerHeight - h - 16;
    card.style.transform = `translate(${x}px, ${y}px)`;
  }
  const hideCard = () => card.classList.remove('is-on');
  if (!isTouch) {
    plot.addEventListener('pointermove', (e) => {
      const r = plot.getBoundingClientRect();
      const [i, j] = cellAt(e.clientX - r.left, e.clientY - r.top);
      hovering = true;
      clearTimeout(autoT);
      plot.classList.toggle('has-x', i >= 0 || j >= 0);
      if (i >= 0) { G.liftC.setAttribute('x1', f1(G.tx(i))); G.liftC.setAttribute('x2', f1(G.tx(i))); }
      if (j >= 0) { G.liftR.setAttribute('y1', f1(G.ty(j))); G.liftR.setAttribute('y2', f1(G.ty(j))); }
      G.liftC.classList.toggle('is-on', i >= 0);
      G.liftR.classList.toggle('is-on', j >= 0);
      G.rowEls.forEach((el, n) => el.classList.toggle('is-x', n === j));
      if (i >= 0 && !G.flip && G.cols[i] !== lit) light(G.cols[i], true);
      const m = i >= 0 && j >= 0 ? MARKS.find((q) => q.i === i && q.j === j) : null;
      if (m && (!only || m.f === only)) showCard(m, e); else hideCard();
      plot.style.cursor = i >= 0 ? 'pointer' : '';
    });
    plot.addEventListener('pointerleave', () => {
      hovering = false;
      plot.classList.remove('has-x');
      G.liftC.classList.remove('is-on');
      G.liftR.classList.remove('is-on');
      G.rowEls.forEach((el) => el.classList.remove('is-x'));
      hideCard();
      resume();
    });
  }
  // a click (or a tap) anywhere on a sector's thread, or on a phone its row, opens it
  plot.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const r = plot.getBoundingClientRect();
    const [i, jj] = cellAt(e.clientX - r.left, e.clientY - r.top);
    if (G.flip ? jj >= 0 : i >= 0) go(G.flip ? G.rows[jj].id : G.cols[i].id);
  });

  // ---- woven as you arrive: the threads across drawn in, the threads down passed through one
  // after another, the over and under settling, then the knots tied, thread by thread
  function weave() {
    if (reduced) return;
    const across = $$('.sx-t-r', plot), down = $$('.sx-t-c', plot), over = $('.sx-over', plot);
    const knots = $$('.sx-m', plot).sort((a, b) => MARKS[+a.dataset.k].i - MARKS[+b.dataset.k].i);
    gsap.timeline({ delay: 0.35, onComplete: () => gsap.set([...across, ...down], { clearProps: 'strokeDasharray,strokeDashoffset' }) })
      .fromTo(across, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', stagger: 0.028 }, 0)
      .fromTo(down, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.inOut', stagger: 0.017 }, 0.35)
      .fromTo(over, { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 1.1)
      .fromTo(knots, { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.45, ease: 'back.out(2.4)', stagger: 0.006, clearProps: 'transform' }, 1.25);
  }

  // ---------------------------------------------------------------- the families, the findings, where we have worked

  $('.sx-fam-list').innerHTML = FAM_KEYS.map((f) => {
    const ss = SECTS.filter((s) => s.fam === f);
    return `<section class="sx-fam"><h3 class="sx-fam-h">${esc(ATLAS.families[f])} <span>${ss.length}</span></h3><ul>${ss.map((s) => `<li><a href="#${s.id}">${threadOf(s)}<span class="sx-f-name">${esc(s.name)}${worked.has(s.id) ? '<b class="sx-worked-k" title="Metamorph has worked here"></b>' : ''}</span><span class="sx-f-by">${marksOf(s).map((m) => `<span style="color:${fvar(m.f)}">${esc(m.d.name)}</span>`).join(' · ')}</span><span class="sx-f-note">${esc(s.note)}</span></a></li>`).join('')}</ul></section>`;
  }).join('');

  const reach = DISCS.map((d) => ({ d, n: reachOf(d).length })).sort((a, b) => b.n - a.n);
  const top = reach.filter((r) => r.d.id !== 'law').slice(0, 3).map((r) => r.d.name);
  const narrowOnes = reach.filter((r) => r.n <= 1).map((r) => r.d.name);
  const counts = FORCES.map((f) => [f, MARKS.filter((m) => m.f === f).length]).sort((a, b) => b[1] - a[1]);
  const forcesLine = counts.map(([f, n]) => `<span style="color:${fvar(f)}">${esc(fl(f))} ${n}</span>`).join(' · ');
  $('.sx-find-list').innerHTML = FINDINGS.map((F, n) => `<article class="sx-find"><p class="sx-find-n">${String(n + 1).padStart(2, '0')}</p><h3 class="sx-find-h">${esc(F.h)}</h3>${F.p.map((p) => `<p>${esc(p).replace('{top}', esc(top.join(', '))).replace('{narrow}', esc(list(narrowOnes))).replace('{forces}', forcesLine)}</p>`).join('')}</article>`).join('');

  // where Metamorph has worked: shown only once the client has said (WORKED)
  const workedEl = $('.sx-worked');
  const companies = (WORKED?.companies || []).filter((c) => BY_ID[c.sector]);
  if (workedEl && (companies.length || worked.size)) {
    const bySector = SECTS.filter((s) => worked.has(s.id) || companies.some((c) => c.sector === s.id));
    $('.sx-worked-list', workedEl).innerHTML = bySector.map((s) => `<li><a class="sx-w-s" href="#${s.id}">${esc(s.name)}</a><ul>${companies.filter((c) => c.sector === s.id).map((c) => `<li>${c.url ? `<a href="${esc(c.url)}" target="_blank" rel="noopener">${esc(c.name)}</a>` : esc(c.name)}${c.what ? `<span>${esc(c.what)}</span>` : ''}</li>`).join('')}</ul></li>`).join('');
    workedEl.hidden = false;
  }

  // ---------------------------------------------------------------- a sector's page

  // what has not arrived yet, in the Notion's own words for each part
  const TODO = [
    ['blurb', 'The industry in brief'],
    ['numbers', 'Headline numbers: size, revenues, consumers, ratios, pricing'],
    ['highlights', 'Its key highlights'],
    ['trends', 'The key trends in it'],
    ['news', 'The latest news from the sector'],
    ['players', 'The strategy and thesis of its top players'],
    ['disruptors', 'Its upstarts and disruptors, and what they disrupt'],
    ['journey', 'The founder’s road in it, and where it gets hard'],
    ['futures', 'The futures it could have, with a poll'],
    ['books', 'Books and resources to read and listen to'],
  ];
  const has = (v) => Array.isArray(v) ? v.length > 0 : !!v;
  // the founder's road: a thread rising through the sector, a knot where each problem is met
  const ROAD = 'M24 250 C 210 252, 290 150, 460 170 S 700 92, 820 84 S 940 46, 976 34';
  function road(N) {
    return `<div class="sx-road" aria-hidden="true"><svg viewBox="0 0 1000 290" preserveAspectRatio="none"><path class="sx-road-t" d="${ROAD}" pathLength="1"/></svg>${N.journey.map((x, n) => `<p class="sx-road-p" data-n="${n}"><i></i><span class="sx-road-st">${esc(x.stage || '')}</span><span class="sx-road-pr">${esc(x.problem)}</span></p>`).join('')}</div>`
      + `<ol class="sx-road-list">${N.journey.map((x) => `<li><span class="sx-road-st">${esc(x.stage || '')}</span><span class="sx-road-pr">${esc(x.problem)}</span></li>`).join('')}</ol>`;
  }
  function placeRoad() {
    const box = $('.sx-road', article);
    if (!box) return;
    const path = $('.sx-road-t', box), L = path.getTotalLength(), ps = $$('.sx-road-p', box);
    ps.forEach((p, n) => {
      const pt = path.getPointAtLength(L * ((n + 0.5) / ps.length));
      p.style.left = `${f1(pt.x / 10)}%`;
      p.style.top = `${f1((pt.y / 290) * 100)}%`;
      p.classList.toggle('is-up', n % 2 === 1);
    });
  }
  function renderSector(s) {
    const ms = marksOf(s), N = NARRATIVE[s.id] || {};
    const k = SECTS.indexOf(s), fam = SECTS.filter((x) => x.fam === s.fam);
    const prev = SECTS[(k + SECTS.length - 1) % SECTS.length], next = SECTS[(k + 1) % SECTS.length];
    const part = (cls, h, body) => `<section class="sx-s-part ${cls}"><h2 class="sx-h3">${h}</h2>${body}</section>`;
    const parts = [];
    if (has(N.blurb)) parts.push(`<p class="sx-s-blurb">${esc(N.blurb)}</p>`);
    if (has(N.numbers)) parts.push(part('sx-s-nums', 'In <em>numbers</em>', `<dl class="sx-nums">${N.numbers.map((x) => `<div><dt>${esc(x.label)}</dt><dd>${esc(x.value)}</dd>${x.note || x.source ? `<p>${esc([x.note, x.source && `Source: ${x.source}`].filter(Boolean).join(' · '))}</p>` : ''}</div>`).join('')}</dl>`));
    if (has(N.highlights)) parts.push(part('sx-s-hl', 'Worth <em>knowing</em>', `<ul class="sx-hl">${N.highlights.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>`));
    if (has(N.trends)) parts.push(part('sx-s-trends', 'What is <em>moving</em>', `<ul class="sx-rows">${N.trends.map((x) => `<li><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p></li>`).join('')}</ul>`));
    parts.push(`<section class="sx-s-part sx-s-ds" aria-labelledby="sx-ds-h">
          <h2 class="sx-h3" id="sx-ds-h">The <em>levers</em></h2>
          <p class="sx-s-sub">${WORDS[ms.length] || ms.length} disciplines decide how ${esc(lc(s.name))} behaves.</p>
          ${ms.map((m, n) => `<div class="sx-d" data-d="${m.d.id}" style="--fc:${fvar(m.f)}">
              <p class="sx-d-no">${String(n + 1).padStart(2, '0')} · Layer ${layerOf(m.d).n}, ${esc(layerOf(m.d).name)}</p>
              <h3 class="sx-d-name">${esc(m.d.name)} <span class="sx-d-f">${knot(m.f)}${esc(fl(m.f))} it</span></h3>
              <p class="sx-d-fnote">${esc(cap(fnote(m.f)))}.</p>
              <dl class="sx-d-dl"><dt>What it is used for</dt><dd>${esc(m.use)}</dd><dt>What it changes</dt><dd>${esc(m.eff)}</dd></dl>
            </div>`).join('')}
        </section>`);
    if (has(N.news)) parts.push(part('sx-s-news', 'In the <em>news</em>', `<ul class="sx-news">${N.news.map((x) => `<li><time>${esc(x.date || '')}</time><a href="${esc(x.url || '#')}" target="_blank" rel="noopener">${esc(x.title)}</a><span>${esc(x.source || '')}</span></li>`).join('')}</ul>`));
    if (has(N.players)) parts.push(part('sx-s-players', 'How the <em>leaders</em> play it', `<ul class="sx-rows">${N.players.map((x) => `<li><h3>${esc(x.name)}</h3><p>${esc(x.thesis)}</p></li>`).join('')}</ul>`));
    if (has(N.disruptors)) parts.push(part('sx-s-dis', 'Who is <em>disrupting</em> it', `<ul class="sx-rows">${N.disruptors.map((x) => `<li><h3>${esc(x.name)}</h3><p>${esc(x.move)}</p></li>`).join('')}</ul>`));
    if (has(N.journey)) parts.push(part('sx-s-road', 'The founder’s <em>road</em>', road(N)));
    if (has(N.futures)) parts.push(part('sx-s-futures', 'Where it <em>could go</em>', `<ol class="sx-futures" data-s="${s.id}">${N.futures.map((x, n) => `<li><h3>${esc(x.title)}</h3><p>${esc(x.text)}</p><button type="button" class="sx-vote" data-n="${n}">This one</button></li>`).join('')}</ol><p class="sx-vote-note">Your vote is kept in this browser.</p>`));
    if (has(N.books)) parts.push(part('sx-s-books', 'To read and <em>listen to</em>', `<ul class="sx-books">${N.books.map((x) => `<li><a href="${esc(x.url || '#')}" target="_blank" rel="noopener">${esc(x.title)}</a><span>${esc([x.by, x.kind].filter(Boolean).join(' · '))}</span></li>`).join('')}</ul>`));
    const todo = TODO.filter(([key]) => !has(N[key]));
    const ours = (WORKED?.companies || []).filter((c) => c.sector === s.id);
    // its thread, hanging beside the words: every discipline it passes, knotted where it is decided
    let lay = null;
    const strip = DISCS.map((d) => {
      const m = ms.find((q) => q.d === d);
      const band = d.layer !== lay ? `<li class="sx-col-g"><span class="sx-col-n"><span class="sx-g-n">${LAYERS[d.layer].n}</span> ${esc(LAYERS[d.layer].name)}</span><i></i></li>` : '';
      lay = d.layer;
      return `${band}<li class="sx-col-r${m ? ' has-m' : ''}" ${m ? `data-d="${d.id}" style="--fc:${fvar(m.f)}"` : ''}><span class="sx-col-n">${esc(d.name)}</span><i></i>${m ? `<span class="sx-col-f">${esc(fl(m.f))}</span>` : ''}</li>`;
    }).join('');
    const mini = `<svg class="sx-mini" viewBox="0 0 ${SECTS.length * 4} ${DISCS.length * 4}" aria-hidden="true"><rect x="${k * 4}" y="0" width="4" height="${DISCS.length * 4}" class="sx-mini-c"/>${MARKS.map((m) => `<circle cx="${SECTS.indexOf(m.s) * 4 + 2}" cy="${DISCS.indexOf(m.d) * 4 + 2}" r="1.3" style="fill:${m.s === s ? fvar(m.f) : ''}" class="${m.s === s ? 'is-s' : ''}"/>`).join('')}</svg>`;
    article.innerHTML = `
      <header class="sx-part sx-night sx-s-top">
        <div class="sx-wrap">
          <nav class="sx-crumb" aria-label="Where you are"><a class="sx-back" href="sectors.html">The loom</a><span>${esc(ATLAS.families[s.fam])}</span></nav>
          <p class="sx-s-no">${String(k + 1).padStart(2, '0')} of ${SECTS.length}</p>
          <h1 class="sx-s-name" id="sx-s-name" style="--long:${Math.max(...s.name.split(/\s+/).map((w) => w.length))}">${esc(s.name)}</h1>
          <p class="sx-s-note">${esc(s.note)}</p>
          <p class="sx-s-by"><span class="sx-s-by-k">Decided by</span> ${decidedBy(ms)}.</p>
          ${worked.has(s.id) || ours.length ? `<p class="sx-s-worked"><b class="sx-worked-k"></b>We have worked in ${esc(lc(s.name))}${ours.length ? `: ${esc(list(ours.map((c) => c.name)))}` : ''}.</p>` : ''}
        </div>
      </header>
      <div class="sx-part sx-s-body">
        <div class="sx-wrap sx-s-grid">
          <div class="sx-s-words">
            ${parts.join('')}
            ${todo.length ? `<section class="sx-s-part sx-todo"><h2 class="sx-h3">Still to come on <em>this page</em></h2><ul>${todo.map(([, t]) => `<li>${esc(t)}</li>`).join('')}</ul></section>` : ''}
            <nav class="sx-s-more" aria-label="More sectors">
              <p class="sx-s-more-h">More in ${esc(ATLAS.families[s.fam])}</p>
              <ul>${fam.filter((x) => x !== s).map((x) => `<li><a href="#${x.id}">${esc(x.name)}</a></li>`).join('')}</ul>
              <p class="sx-s-step"><a href="#${prev.id}" class="sx-prev"><span>Previous</span>${esc(prev.name)}</a><a href="#${next.id}" class="sx-next"><span>Next</span>${esc(next.name)}</a></p>
            </nav>
          </div>
          <aside class="sx-s-col" aria-label="${esc(s.name)} in the loom">
            <div class="sx-s-col-in">
              <p class="sx-col-h"><span>${esc(s.short || s.name)}</span> its thread</p>
              ${mini}
              <ol class="sx-col">${strip}</ol>
            </div>
          </aside>
        </div>
      </div>
      <section class="sx-part sx-night sx-end">
        <div class="sx-wrap">
          <h2 class="sx-end-line">Building in ${esc(lc(s.name))}? <em>Talk to us.</em></h2>
          <p class="sx-end-ways"><a class="btn btn-solid" href="#contact" data-soon>Start a conversation</a><a class="btn btn-line" href="#deck" data-soon>Share your pitch deck</a></p>
        </div>
      </section>`;
    placeRoad();
    // a vote for a future, kept in this browser
    $$('.sx-vote', article).forEach((b) => {
      const key = `mm-future-${s.id}`;
      const mark = () => { let v = null; try { v = localStorage.getItem(key); } catch (e) {} $$('.sx-vote', article).forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.n === v))); };
      b.addEventListener('click', () => { try { localStorage.setItem(key, b.dataset.n); } catch (e) {} mark(); });
      mark();
    });
    // its thread answers the words: the discipline being read swells; a knot in it takes you there
    $$('.sx-col-r.has-m', article).forEach((r) => r.addEventListener('click', () => {
      const t = $(`.sx-d[data-d="${r.dataset.d}"]`, article);
      if (t) lenis.scrollTo(t, { offset: -(innerHeight * 0.22), duration: reduced ? 0 : 1.1 });
    }));
  }
  function followReading() {
    if (article.hidden) return;
    const line = innerHeight * 0.45;
    let on = null;
    $$('.sx-d', article).forEach((d) => { const r = d.getBoundingClientRect(); if (r.top < line && r.bottom > line * 0.4) on = d.dataset.d; });
    $$('.sx-col-r.has-m', article).forEach((r) => {
      r.classList.toggle('is-on', r.dataset.d === on);
      // on a short screen the thread scrolls itself to keep the swelling knot in view
      if (r.dataset.d === on) { const box = r.closest('.sx-s-col-in'), rr = r.getBoundingClientRect(), br = box.getBoundingClientRect(); if (rr.bottom > br.bottom - 8 || rr.top < br.top + 8) box.scrollTo({ top: box.scrollTop + rr.top - br.top - br.height / 2, behavior: reduced ? 'auto' : 'smooth' }); }
    });
    $$('.sx-d', article).forEach((d) => d.classList.toggle('is-on', d.dataset.d === on));
  }
  lenis.on('scroll', followReading);

  // ---------------------------------------------------------------- moving between the loom and a sector

  let indexY = 0, current = null;
  function route(first) {
    const id = location.hash.slice(1);
    const s = BY_ID[id];
    if (s && s !== current) {
      if (!current) indexY = window.scrollY;
      current = s;
      renderSector(s);
      clearTimeout(autoT);
      index.hidden = true;
      article.hidden = false;
      html.classList.add('sx-reading-one');
      document.title = `${s.name} · Sectors · Metamorph Capital`;
      lenis.scrollTo(0, { immediate: true, force: true });
      placeRoad();
      remeasure();
      if (!reduced && !first) {
        gsap.fromTo($$('.sx-s-top .sx-wrap > *', article), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: 'expo.out', stagger: 0.06 });
        gsap.fromTo($$('.sx-col > li', article), { opacity: 0, x: 10 }, { opacity: 1, x: 0, duration: 0.6, ease: 'expo.out', stagger: 0.012, delay: 0.1 });
      }
      followReading();
    } else if (!s && current) {
      current = null;
      article.hidden = true;
      article.innerHTML = '';
      index.hidden = false;
      html.classList.remove('sx-reading-one');
      document.title = 'Sectors · Metamorph Capital';
      draw();
      remeasure();
      lenis.scrollTo(indexY, { immediate: true, force: true });
      resume();
    }
  }
  const go = (id) => { location.hash = id; };
  addEventListener('hashchange', () => route(false));
  // "The loom" goes back without leaving a # behind
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('.sx-back');
    if (!a) return;
    e.preventDefault();
    history.pushState(null, '', location.pathname + location.search);
    route(false);
  });
  addEventListener('popstate', () => route(false));

  // ---------------------------------------------------------------- starting

  const ready = Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
  ready.then(() => {
    draw();
    route(true);
    remeasure();
    ride();
    html.classList.add('sx-in');
    if (!current) {
      weave();
      autoT = setTimeout(autoNext, reduced ? 0 : 2600);
    }
  });
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => { if (!current) draw(); else placeRoad(); remeasure(); }, 150); });

  if (local) window.__sectors = { SECTS, DISCS, MARKS, light, route, draw, renderSector, remeasure, silk, get G() { return G; } };
}
