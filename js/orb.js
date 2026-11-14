// Hero 1 of 3, "the horizon": the light orb, cut sharp and brought close (js/orb-scene.js draws it).
// The client found the first one blurry and muddy, and the whole orb in the frame left the sides
// of a laptop empty. So since 10 Nov its centre sits on the foot of the screen: only the upper half
// of the orbits shows, rising across the whole width like a sun at the horizon, every line cut to
// the pixel. The disciplines ride the visible arcs and are named at rest; the words sit above, top
// left, where the light steps back for them.
//
// The light orb is the client's own brief, nearly word for word: "the light orb with different
// layer of aura fields representing different disciplines. When scrolled down it keeps on
// expanding and the influencing factors come in as web or wires stretched from the orb. The
// interaction of different wires and orbs create sectors."
//
// - Opening: a point of light kindles on the horizon and swells into the orb, and its seven orbits
//   unfold out of it one after another: the founder's seven layers of a life. Their twenty-seven
//   disciplines come up as small lights on them. Only then does the light rise a little and the
//   words come in above it (sooner, if you scroll or click).
// - Hover an orbit and it brightens while the rest fall back, and the left column reads it. Click
//   it, or a discipline's light, to open its metrics. Each has an address.
// - Scroll (the stage is pinned): wires run out from the core to every discipline; then the view
//   draws back and the forty-eight sectors kindle on a dial round the outside, each wired to the
//   disciplines that move it. Last, the light sets, into the dark the next hero opens in.
import { createOrbScene, FIELD_COL } from './orb-scene.js';
import { ATLAS } from './atlas-data.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const firstSentence = (s) => (s.match(/^.*?[.!?](\s|$)/) || [s])[0].trim();
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);
const rgb = (c, k = 1) => `rgb(${c.map((v) => Math.round(Math.min(1, v * k) * 255)).join(',')})`;

// the orbits' radii, in units of the orb's reach: the core, then seven, the last at 0.8
const CORE_R = 0.05;
const R0 = 0.16, STEP = 0.1;
const fieldR = (k, spread) => R0 + STEP * k * spread;

export function setupOrb({ lenis, register, reduced, isTouch, local }) {
  const hero = $('.hero');
  const stage = $('.stage');
  const canvas = $('.hero-gl', hero);
  const labels = $('.orb-labels', hero);
  const card = $('.orbit-card', hero);
  const key = $('.orb-key', hero);
  const hint = $('.orb-hint', hero);
  const caps = $$('.orb-caption', hero);
  const panel = $('.disc-panel');

  let exitP = 0;
  register({
    name: 'hero', commit() {}, revert() {},
    under: (y) => { const r = hero.getBoundingClientRect(); return r.top <= y && r.bottom >= y && exitP < 0.93 ? { tone: 'light' } : null; },
  });

  const scene = createOrbScene(canvas);
  if (!scene) { hero.classList.add('no-gl', 'is-words'); return; }
  const { AU } = scene;

  // ---------------------------------------------------------------- the founder's data

  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  // the horizon: everything sits on the upper half of the orbits, the half that shows. Each
  // discipline has its place along its orbit's visible arc (f, from the right foot to the left),
  // each orbit's set a little shifted from the one inside it so they never line up in spokes
  byRing.forEach((list, k) => list.forEach((d, j) => {
    d.f = clamp((j + 0.5 + 0.24 * Math.sin(k * 2.17 + 0.6)) / list.length, 0.05, 0.95);
    d.a0 = 0.12 + (Math.PI - 0.24) * d.f;
    d.sway = (k % 2 ? -1 : 1) * (0.5 + 0.13 * k);
  }));
  const secAt = Object.fromEntries(ATLAS.sectors.map((s, i) => [s.id, i]));
  const sectors = ATLAS.sectors.map((s, i) => ({ ...s, i, links: [] }));
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) S.links.push({ d, f: l.f, use: l.use, eff: l.eff }); }));
  // each sector on the dial over the top, near the disciplines that move it: ordered by where they
  // sit, then given room to be read
  sectors.forEach((S) => {
    let x = 0, y = 0;
    S.links.forEach((l) => { x += Math.cos(l.d.a0); y += Math.sin(l.d.a0); });
    S.mean = S.links.length ? Math.atan2(y, x) : Math.PI / 2;
  });
  [...sectors].sort((a, b) => a.mean - b.mean).forEach((S, n) => { S.a = 0.09 + (n / (sectors.length - 1)) * (Math.PI - 0.18); S.lane = n % 2; });
  const sectorName = Object.fromEntries(sectors.map((s) => [s.id, s.name]));

  // ---------------------------------------------------------------- the labels

  discs.forEach((d) => {
    d.label = el('span', 'ol ol-d', d.name);
    labels.append(d.label);
  });
  sectors.forEach((S) => {
    S.label = el('span', 'ol ol-s', S.name);
    labels.append(S.label);
  });
  // each orbit's numeral, at the foot of its arc on the left, the way a dial is numbered
  const ringLabels = rings.map((r, k) => { const s = el('span', 'ol ol-r', ROMAN[k]); labels.append(s); return s; });

  // ---------------------------------------------------------------- layout
  // The centre sits on the foot of the screen and the orbits are sized so the outer ones run off
  // both sides: the upper half, close up, the whole width. The words sit top left, and the light
  // steps back behind them (uShade).

  const base = { W: 1, H: 1, narrow: false, cx: 0, cy: 0, unit: 300, z1: 0.5 };
  const copyEl = $('.hero-copy', hero);
  function layout() {
    const W = hero.clientWidth, H = hero.clientHeight;
    const narrow = isNarrow(W, H);
    Object.assign(base, { W, H, narrow });
    base.cx = W * 0.5;
    base.cy = H;
    base.unit = narrow ? Math.min(W * 1.35, H * 0.62) : Math.min(W * 0.74, H * 1.2);
    // how far the view draws back for the sectors: their dial and its names just fit
    const dial = (fieldR(6, 1) + 0.3) * base.unit;
    base.z1 = narrow ? 0.72 : clamp(Math.min((H - 64 - 150) / dial, (W / 2 - 150) / dial), 0.36, 0.9);
    scene.setSize(W, H, 1);
    shade();
  }
  // the words' column, where the light steps back (in the target's pixels, y up)
  function shade() {
    const hr = hero.getBoundingClientRect(), r = copyEl.getBoundingClientRect(), k = scene.size.k;
    const x0 = r.left - hr.left - 24, x1 = r.right - hr.left + 24;
    const y0 = r.top - hr.top - 24, y1 = r.bottom - hr.top + 24;
    base.copy = [x0, y0, x1, y1];
    AU.uShade.value.set(x0 * k, (base.H - y1) * k, x1 * k, (base.H - y0) * k);
  }
  document.fonts?.ready.then(() => shade());

  // ---------------------------------------------------------------- the opening

  const I = { core: reduced ? 1 : 0, coreR: reduced ? CORE_R : 0.004, discs: reduced ? 1 : 0, gain: new Array(7).fill(reduced ? 1 : 0), open: new Array(7).fill(reduced ? 1 : 0.5) };
  // (behind the way in, js/emerge.js, it waits until a version is chosen and the page opens)
  const html = document.documentElement;
  const gated = html.classList.contains('gate');
  const intro = reduced ? null : gsap.timeline({ delay: 0.25, paused: gated })
    // a point of light kindles, and swells into the orb
    .to(I, { core: 1, duration: 1.4, ease: 'power2.out' }, 0)
    .to(I, { coreR: CORE_R, duration: 1.8, ease: 'expo.out' }, 0.25);
  // then the seven orbits unfold out of it, one after another
  if (intro) {
    for (let k = 0; k < 7; k++) {
      const o = { g: 0, r: 0.5 };
      intro.to(o, {
        g: 1, r: 1, duration: 1.6, ease: 'power3.out',
        onUpdate: () => { I.gain[k] = o.g; I.open[k] = o.r; },
      }, 0.9 + k * 0.22);
    }
    intro.to(I, { discs: 1, duration: 1.4, ease: 'power2.out' }, 2.4)
      .add(() => words(), 3.3);
  }
  if (intro && gated) addEventListener('mm:enter', () => intro.play(), { once: true });
  const hurry = () => { if (intro?.isActive()) intro.timeScale(5); };

  // ---------------------------------------------------------------- the entry: the orb alone, then the words
  // The orb holds the screen by itself until its orbits and disciplines are up. Then it rises a
  // little and the words come in above it (the CSS waits for .is-words). A scroll or a click brings
  // them at once, so nobody is kept waiting.

  const E = { v: reduced ? 0 : 1 };
  let worded = false;
  function words() {
    if (worded) return;
    worded = true;
    hero.classList.add('is-words');
    gsap.to(E, { v: 0, duration: reduced ? 0.01 : 1.6, ease: 'power3.inOut' });
    gsap.delayedCall(reduced ? 0 : 2.2, () => { if (!focus) hint.classList.add('is-on'); });
  }
  if (reduced) words();
  clearTimeout(window.wordsFallback); // the words are this script's to bring now, not the page head's

  // ---------------------------------------------------------------- the scroll

  let P = 0, Ps = 0;
  ScrollTrigger.create({
    trigger: stage, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { P = self.progress; if (P > 0.002) words(); if (P > 0.02) hurry(); },
  });

  // ---------------------------------------------------------------- what is looked at

  let focus = null; // { kind: 'field' | 'disc' | 'sector', k | i | j }
  let pinned = false;
  const ringOf = (f) => (f?.kind === 'field' ? f.k : f?.kind === 'disc' ? discs[f.i].ring : -1);
  const discRelated = (d) => {
    if (!focus) return false;
    if (focus.kind === 'field') return d.ring === focus.k;
    if (focus.kind === 'disc') return d.i === focus.i;
    return sectors[focus.j].links.some((l) => l.d === d);
  };
  const sectorRelated = (S) => {
    if (!focus) return false;
    if (focus.kind === 'sector') return S.i === focus.j;
    if (focus.kind === 'disc') return S.links.some((l) => l.d.i === focus.i);
    return S.links.some((l) => l.d.ring === focus.k);
  };

  function fillCard(f) {
    const k = ringOf(f);
    const sw = el('span', 'oc-sw');
    if (k >= 0) sw.style.background = rgb(FIELD_COL[k], 0.95);
    const ring = $('.oc-ring', card);
    ring.textContent = '';
    if (f.kind === 'sector') {
      const S = sectors[f.j];
      ring.append(el('span', null, `A sector · ${ATLAS.families[S.fam] || ''}`));
      $('.oc-name', card).textContent = S.name;
      $('.oc-note', card).textContent = `Moved by ${S.links.length} ${S.links.length === 1 ? 'discipline' : 'disciplines'}.`;
      $('.oc-discs', card).textContent = S.links.map((l) => `${l.d.name} ${ATLAS.forces[l.f]?.label || l.f} it`).join(' · ');
    } else if (f.kind === 'disc') {
      const d = discs[f.i];
      ring.append(sw, el('span', null, `Orbit ${ROMAN[k]} · ${rings[k].name}`));
      $('.oc-name', card).textContent = d.name;
      $('.oc-note', card).textContent = firstSentence(d.gist);
      $('.oc-discs', card).textContent = `Moves ${d.links.length} of ${sectors.length} sectors: ${d.links.map((l) => sectorName[l.s]).join(', ')}.`;
    } else {
      ring.append(sw, el('span', null, `Orbit ${ROMAN[k]}`));
      $('.oc-name', card).textContent = rings[k].name;
      $('.oc-note', card).textContent = rings[k].note;
      $('.oc-discs', card).textContent = byRing[k].map((d) => d.name).join(' · ');
    }
    $('.oc-hint', card).textContent = isTouch ? 'Tap again to open its metrics' : 'Click to open its metrics';
  }
  const sameFocus = (a, b) => (!a && !b) || (a && b && a.kind === b.kind && a.k === b.k && a.i === b.i && a.j === b.j);
  function setFocus(f) {
    if (sameFocus(f, focus)) return;
    focus = f;
    card.classList.toggle('is-on', !!f);
    hero.classList.toggle('is-reading', !!f);
    $$('button', key).forEach((b, i) => b.classList.toggle('is-on', ringOf(f) === i));
    if (f) { fillCard(f); hint.classList.remove('is-on'); }
    canvas.style.cursor = f ? 'pointer' : '';
  }

  // ---------------------------------------------------------------- the frame's own geometry

  // where everything is this frame, in CSS pixels of the hero
  const now = { t: 0, cx: 0, cy: 0, unit: 1, spread: 1, discA: 0, wiresA: 0, secA: 0, secLabels: 0, discLabels: 0 };
  const view = { open: 0 };
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, in: false };
  const par = { x: 0, y: 0 };
  // the part of an orbit that shows: from where it leaves the side of the screen (or the foot) on
  // the right, over the top, to the left, with room kept at the sides for the names
  const arc = (k) => {
    const R = Math.max(1, fieldR(k, now.spread) * I.open[k] * now.unit);
    const side = Math.min(now.cx, base.W - now.cx) - (base.narrow ? 22 : 118);
    const lo = Math.max(R > side ? Math.acos(clamp(side / R, -1, 1)) : 0, Math.asin(clamp((now.cy - base.H + 30) / R, -1, 1))) + 0.05;
    return [lo, Math.max(lo + 0.01, Math.PI - lo)];
  };
  const angleOf = (d, t) => {
    const [lo, hi] = arc(d.ring);
    return lo + (hi - lo) * d.f + 0.02 * Math.sin(t * 0.11 * d.sway + d.i * 1.7);
  };
  const discPos = (d, t) => {
    const k = d.ring;
    const a = angleOf(d, t);
    const R = fieldR(k, now.spread) * I.open[k] * (1 + 0.008 * Math.sin(t * 0.45 + k * 1.3));
    const pk = 0.012 + 0.012 * k;
    // the same small offset from the centre as its orbit (js/orb-scene.js)
    const oa = k * 2.3 + t * 0.02, ok = 0.009 * k;
    return [now.cx + (Math.cos(a) * R + par.x * pk + Math.cos(oa) * ok) * now.unit, now.cy - (Math.sin(a) * R + par.y * pk + Math.sin(oa) * ok) * now.unit];
  };
  const secR = () => fieldR(6, now.spread) + 0.24;
  const secPos = (S) => {
    const R = secR() + (S.lane ? 0.06 : 0);
    return [now.cx + (Math.cos(S.a) * R + par.x * 0.1) * now.unit, now.cy - (Math.sin(S.a) * R + par.y * 0.1) * now.unit];
  };

  // ---------------------------------------------------------------- the pointer

  function pick(x, y) {
    if (view.open > 0.01 || exitP > 0.86 || I.discs < 0.5 || E.v > 0.3) return null;
    // over the words, the words are being read, not the orbits behind them
    const cr = base.copy;
    if (cr && exitP < 0.1 && !focus && x > cr[0] && x < cr[2] && y > cr[1] && y < cr[3]) return null;
    const t = now.t;
    const reach = isTouch ? 24 : 15;
    if (now.secA > 0.5) {
      let best = null, bd = reach;
      sectors.forEach((S) => { const [sx, sy] = secPos(S); const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = S; } });
      if (best) return { kind: 'sector', j: best.i };
    }
    let bestD = null, bdd = reach + 3;
    discs.forEach((d) => { const [dx, dy] = discPos(d, t); const dd = Math.hypot(dx - x, dy - y); if (dd < bdd) { bdd = dd; bestD = d; } });
    if (bestD) return { kind: 'disc', i: bestD.i };
    // the orbits tile out from the core: whichever edge is nearest
    const r = Math.hypot((x - now.cx) / now.unit, (y - now.cy) / now.unit);
    if (r < CORE_R || r > fieldR(6, now.spread) + STEP * now.spread * 0.5) return null;
    const k = clamp(Math.round((r - R0) / (STEP * now.spread)), 0, 6);
    return { kind: 'field', k };
  }
  const rel = (e) => { const r = hero.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
  addEventListener('pointermove', (e) => {
    const [x, y, r] = rel(e);
    pointer.x = x; pointer.y = y;
    pointer.nx = clamp((x - r.width / 2) / (r.width / 2), -1, 1);
    pointer.ny = clamp((y - r.height / 2) / (r.height / 2), -1, 1);
    pointer.in = y >= 0 && y <= r.height;
    if (e.pointerType !== 'mouse' || pinned || view.open > 0) return;
    if (e.target.closest('a, button, .disc-panel, .nav')) return;
    setFocus(pointer.in ? pick(x, y) : null);
  }, { passive: true });
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button') || view.open > 0) return;
    hurry();
    words();
    const [x, y] = rel(e);
    const f = pick(x, y);
    if (!f) { pinned = false; setFocus(null); return; }
    // on a phone the first tap reads it, the second opens it
    if (isTouch && !sameFocus(f, focus)) { pinned = true; setFocus(f); return; }
    open(f);
  });
  $('.oc-open', card)?.addEventListener('click', (e) => { e.stopPropagation(); if (focus) open(focus); });

  // the seven orbits as buttons: the way in from a keyboard, and a key to the colours
  rings.forEach((r, k) => {
    const b = el('button');
    b.type = 'button';
    b.setAttribute('aria-label', `Orbit ${ROMAN[k]}, ${r.name}: ${byRing[k].length} disciplines. Open its metrics.`);
    const dot = el('span', 'ok-dot');
    dot.style.background = rgb(FIELD_COL[k], 0.95);
    b.append(dot, el('span', 'ok-num', ROMAN[k]));
    b.addEventListener('pointerenter', () => { if (!pinned) setFocus({ kind: 'field', k }); });
    b.addEventListener('pointerleave', () => { if (!pinned && view.open === 0) setFocus(null); });
    b.addEventListener('focus', () => setFocus({ kind: 'field', k }));
    b.addEventListener('blur', () => { if (view.open === 0) setFocus(null); });
    b.addEventListener('click', () => open({ kind: 'field', k }));
    key.append(b);
  });

  // "Explore the orbits": a ripple out through all seven, coming to rest on the first
  let wave;
  $('.orbits-btn', hero).addEventListener('click', (e) => {
    hurry();
    intro?.progress(1);
    if (e.detail === 0) { $('button', key).focus(); return; }
    clearTimeout(wave);
    let k = 0;
    const next = () => { setFocus({ kind: 'field', k }); if (k < 6) { k++; wave = setTimeout(next, 210); } else wave = setTimeout(() => setFocus({ kind: 'field', k: 0 }), 360); };
    next();
  });

  // ---------------------------------------------------------------- the metrics, opened
  // A stub for the narrative pages still to be designed: the founder's own words, and where each
  // discipline lands in their grid, by what it does there.

  let opened = null, pushed = false, returnTo = null;
  const addr = (f) => (f.kind === 'field' ? `#orbit/${f.k + 1}` : f.kind === 'disc' ? `#discipline/${discs[f.i].id}` : `#sector/${sectors[f.j].id}`);
  function forceList(links, name) {
    const ul = el('ul');
    Object.entries(ATLAS.forces).forEach(([f, info]) => {
      const ls = links.filter((l) => l.f === f);
      if (!ls.length) return;
      const li = el('li');
      li.append(el('span', 's', capital(info.label)), el('span', 'u', ls.map(name).join(', ')));
      ul.append(li);
    });
    return ul;
  }
  // a sector named in the panel opens its own page (sectors.html)
  const sectorLink = (id, text) => { const a = el('a', 'dp-go', text); a.href = `sectors.html#${id}`; return a; };
  function fillPanel(f) {
    const lands = $('.dp-lands', panel);
    lands.textContent = '';
    const note = $('.dp-note', panel);
    note.textContent = 'From the Metamorph atlas.';
    if (f.kind === 'field') {
      const k = f.k, list = byRing[k];
      const all = new Set(list.flatMap((d) => d.links.map((l) => l.s)));
      $('.dp-ring', panel).textContent = `Orbit ${ROMAN[k]}`;
      $('.dp-name', panel).textContent = rings[k].name;
      $('.dp-gist', panel).textContent = rings[k].note;
      $('.dp-count', panel).textContent = `${list.length} ${list.length === 1 ? 'discipline' : 'disciplines'}, landing in ${all.size} of ${sectors.length} sectors.`;
      list.forEach((d) => {
        const sec = el('section');
        sec.append(el('h3', null, d.name), el('p', 'dp-fnote', `${firstSentence(d.gist)} Lands in ${d.links.length} sectors.`), forceList(d.links, (l) => sectorName[l.s] || l.s));
        lands.append(sec);
      });
    } else if (f.kind === 'disc') {
      const d = discs[f.i];
      $('.dp-ring', panel).textContent = `Orbit ${ROMAN[d.ring]} · ${rings[d.ring].name}`;
      $('.dp-name', panel).textContent = d.name;
      $('.dp-gist', panel).textContent = d.gist;
      $('.dp-count', panel).textContent = `Lands in ${d.links.length} of ${sectors.length} sectors.`;
      d.links.forEach((l) => {
        const sec = el('section');
        const h = el('h3');
        h.append(sectorLink(l.s, sectorName[l.s]));
        sec.append(h, el('p', 'dp-force', capital(ATLAS.forces[l.f]?.label || l.f)), el('p', 'dp-fnote', l.use), el('p', 'dp-eff', l.eff));
        lands.append(sec);
      });
    } else {
      const S = sectors[f.j];
      $('.dp-ring', panel).textContent = `A sector · ${ATLAS.families[S.fam] || ''}`;
      $('.dp-name', panel).textContent = S.name;
      $('.dp-gist', panel).textContent = S.links.length ? `Moved by ${S.links.map((l) => l.d.name).join(', ')}.` : 'Not yet mapped in the atlas.';
      $('.dp-count', panel).textContent = `${S.links.length} ${S.links.length === 1 ? 'discipline' : 'disciplines'} act on it.`;
      note.textContent = '';
      note.append(sectorLink(S.id, `The whole of ${S.name}, on its page`));
      S.links.forEach((l) => {
        const sec = el('section');
        sec.append(el('h3', null, l.d.name), el('p', 'dp-force', `${capital(ATLAS.forces[l.f]?.label || l.f)} · orbit ${ROMAN[l.d.ring]}`), el('p', 'dp-fnote', l.use), el('p', 'dp-eff', l.eff));
        lands.append(sec);
      });
    }
    $('.dp-inner', panel).scrollTop = 0;
  }
  function open(f, { push = true } = {}) {
    if (!f || opened) return;
    hurry();
    intro?.progress(1);
    returnTo = document.activeElement;
    opened = f;
    pinned = true;
    setFocus(f);
    fillPanel(f);
    if (push) { history.pushState({ hero: addr(f) }, '', addr(f)); pushed = true; }
    hero.classList.add('is-open');
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('is-on'));
    lenis.stop();
    gsap.to(view, { open: 1, duration: reduced ? 0.2 : 1.2, ease: 'power3.inOut' });
    $('.close', panel).focus({ preventScroll: true });
  }
  function close({ fromHistory = false } = {}) {
    if (!opened) return;
    if (pushed && !fromHistory) { pushed = false; history.back(); return; } // popstate closes it
    pushed = false;
    panel.classList.remove('is-on');
    hero.classList.remove('is-open');
    pinned = false;
    setFocus(null);
    gsap.to(view, {
      open: 0, duration: reduced ? 0.2 : 1.0, ease: 'power3.inOut',
      onComplete: () => { opened = null; panel.hidden = true; lenis.start(); returnTo?.focus?.({ preventScroll: true }); },
    });
  }
  const fromHash = () => {
    const h = location.hash;
    let m = h.match(/^#orbit\/([1-7])$/);
    if (m) return { kind: 'field', k: Number(m[1]) - 1 };
    m = h.match(/^#discipline\/(.+)$/);
    if (m) { const d = discs.find((q) => q.id === m[1]); return d ? { kind: 'disc', i: d.i } : null; }
    m = h.match(/^#sector\/(.+)$/);
    if (m) { const S = sectors.find((q) => q.id === m[1]); return S ? { kind: 'sector', j: S.i } : null; }
    return null;
  };
  addEventListener('popstate', () => {
    const f = fromHash();
    if (f && !opened) open(f, { push: false });
    else if (!f) close({ fromHistory: true });
  });
  $('.close', panel).addEventListener('click', () => close());
  // the other heroes open the same panel: { kind: 'field', k } | { kind: 'disc', i } | { kind: 'sector', j }
  addEventListener('mm:open', (e) => { if (e.detail) open(e.detail); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { if (opened) close(); else { pinned = false; setFocus(null); } } });

  // ---------------------------------------------------------------- the frame

  const discCol = (d) => FIELD_COL[d.ring].map((v) => v * 0.55 + 0.45);
  const fieldK = new Array(7).fill(1); // each orbit's brightness against the rest, while one is looked at
  const secCol = [1.0, 0.93, 0.82];
  let last = performance.now(), drawnOnce = false;
  const t0 = last;
  function frame() {
    const tn = performance.now();
    const dt = Math.min(0.05, (tn - last) / 1000);
    last = tn;
    const t = (tn - t0) / 1000;
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    // under the way in, drawn once (so its first frame is ready) and then left until the page opens
    if (drawnOnce && html.classList.contains('gate')) return;
    drawnOnce = true;

    Ps = reduced ? P : damp(Ps, P, 6, dt);
    exitP = Ps;
    const p = Ps;
    now.t = t;
    // the scroll's story: the wires reach out to the disciplines, then the view draws back to take
    // in the sectors' dial over the top, and last the light sets
    const spread = 1 + 0.08 * smooth(0.06, 0.36, p) - 0.08 * smooth(0.42, 0.62, p);
    const zoom = 1 - (1 - base.z1) * smooth(0.4, 0.62, p);
    now.wiresA = smooth(0.14, 0.4, p);
    now.secA = smooth(0.48, 0.7, p);
    // the disciplines are named at rest, softly; fully while the wires reach them
    now.discLabels = ((base.narrow ? 0 : 0.56) + (base.narrow ? 0.8 : 0.44) * smooth(0.2, 0.32, p)) * (1 - smooth(0.52, 0.62, p)) * I.discs;
    now.secLabels = smooth(0.6, 0.7, p);
    const fadeOut = 1 - smooth(0.84, 0.9, p);
    const set = 1 - smooth(0.86, 0.995, p);
    hero.style.setProperty('--copy', String(1 - smooth(0.03, 0.12, p)));
    caps[0]?.style.setProperty('opacity', String(smooth(0.18, 0.26, p) * (1 - smooth(0.44, 0.5, p))));
    caps[1]?.style.setProperty('opacity', String(smooth(0.6, 0.68, p) * (1 - smooth(0.82, 0.87, p))));
    labels.style.opacity = String(fadeOut * (1 - view.open * 0.6));

    // the orb, where it sits: its centre on the foot of the screen, the upper half showing. On
    // entry it sits a little lower, and rises as the words come; aside when its metrics are open
    let cx = base.cx, cy = base.cy;
    let unit = base.unit * zoom;
    if (E.v > 0) { cy += base.unit * 0.08 * E.v; unit *= 1 - 0.04 * E.v; }
    const o = view.open;
    if (base.narrow) { unit *= 1 - 0.35 * o; }
    else { cx = lerp(cx, base.W * 0.3, o); }
    Object.assign(now, { cx, cy, unit, spread });

    // the light leans, a little, the way you look
    const live = pointer.in && !isTouch;
    par.x = damp(par.x, live ? pointer.nx : 0, 2.2, dt);
    par.y = damp(par.y, live ? -pointer.ny : 0, 2.2, dt);

    // the aura
    const k = scene.size.k;
    AU.uTime.value = t;
    AU.uCenter.value.set(cx * k, (base.H - cy) * k);
    AU.uUnit.value = unit * k;
    AU.uCore.value = I.core * (1 + 0.04 * Math.sin(t * 1.3)) * set;
    AU.uCoreR.value = I.coreR * (1 + 0.015 * Math.sin(t * 0.7));
    AU.uTicks.value = (0.7 + 0.7 * now.secA) * I.discs;
    AU.uShadeK.value = 0.6 * (1 - view.open);
    const fk = ringOf(focus);
    for (let j = 0; j < 7; j++) {
      AU.uR.value[j] = fieldR(j, spread) * I.open[j] * (1 + 0.008 * Math.sin(t * 0.45 + j * 1.3));
      const want = focus ? (fk === j ? 2.1 : focus.kind === 'sector' ? 0.6 : 0.32) : 1;
      fieldK[j] = damp(fieldK[j], want, 6, dt);
      AU.uGain.value[j] = I.gain[j] * fieldK[j] * set;
      AU.uPar.value[j].set(par.x * (0.012 + 0.012 * j), par.y * (0.012 + 0.012 * j));
    }

    // the disciplines, the wires and the sectors
    scene.begin();
    const secs = now.secA;
    const discPts = discs.map((d) => discPos(d, t));
    // where the words are, the lights and their names step back with the lines (uShade)
    // (the words, the captions and a read orbit all take the same column, top left)
    const wordsOn = 1 - view.open;
    const cr = base.copy;
    const clear = (x, y) => (cr ? 1 - 0.85 * wordsOn * smooth(cr[0] - 40, cr[0] + 10, x) * (1 - smooth(cr[2] - 10, cr[2] + 40, x)) * smooth(cr[1] - 40, cr[1] + 10, y) * (1 - smooth(cr[3] - 10, cr[3] + 40, y)) : 1);
    discs.forEach((d, n) => {
      const [x, y] = discPts[n];
      const relD = discRelated(d);
      const lit = (focus ? (relD ? 2.1 : 0.45) : 1) * I.discs * I.gain[d.ring] * set * clear(x, y);
      d.lit = damp(d.lit ?? 0, lit, 7, dt);
      scene.orb(x, y, 9 + (relD ? 3 : 0), discCol(d), d.lit * 1.15);
      // a wire from the core out to it, curling a little as it goes, like a field's own line
      if (now.wiresA > 0.001) {
        const a = angleOf(d, t);
        const c0 = [cx + Math.cos(a - 0.5) * CORE_R * unit, cy - Math.sin(a - 0.5) * CORE_R * unit];
        const R = fieldR(d.ring, spread);
        const c1 = [cx + Math.cos(a - 0.38) * R * 0.45 * unit, cy - Math.sin(a - 0.38) * R * 0.45 * unit];
        const c2 = [cx + Math.cos(a - 0.12) * R * 0.85 * unit, cy - Math.sin(a - 0.12) * R * 0.85 * unit];
        const wi = (focus ? (relD ? 1.6 : 0.12) : 0.42) * I.discs;
        scene.wire(c0, c1, c2, [x, y], discCol(d), wi, now.wiresA * 1.15 - (n % 5) * 0.03, 0.9);
      }
    });
    if (secs > 0.001) {
      sectors.forEach((S) => {
        const [x, y] = secPos(S);
        const relS = sectorRelated(S);
        const lit = (focus ? (relS ? 2.0 : 0.4) : 1) * secs * set;
        S.lit = damp(S.lit ?? 0, lit, 7, dt);
        scene.orb(x, y, 7 + (relS ? 2 : 0), secCol, S.lit * 0.9);
        const ux = Math.cos(S.a), uy = -Math.sin(S.a);
        S.links.forEach((l) => {
          const [dx, dy] = discPts[l.d.i];
          const on = focus ? (focus.kind === 'sector' ? S.i === focus.j : focus.kind === 'disc' ? l.d.i === focus.i : l.d.ring === focus.k) : false;
          const wi = (focus ? (on ? 1.3 : 0.04) : 0.11) * secs;
          const reach = 0.16 * unit;
          const dl = Math.hypot(dx - cx, dy - cy) || 1;
          scene.wire([dx, dy], [dx + ((dx - cx) / dl) * reach, dy + ((dy - cy) / dl) * reach], [x - ux * reach, y - uy * reach], [x, y], discCol(l.d), wi, secs * 1.2 - (S.i % 7) * 0.025, 0.7);
        });
      });
    }

    // the labels, set beside their lights, on the outward side
    discs.forEach((d, n) => {
      const [x, y] = discPts[n];
      const relD = discRelated(d);
      // named softly at rest and fully while the wires reach them; while one is looked at, its own
      const op = Math.max(now.discLabels * (focus ? (relD ? 1 : 0.18) : 1), focus && relD ? I.discs * (1 - now.secA * 0.4) : 0);
      const right = x >= cx;
      d.label.style.opacity = (op * clear(x + (right ? 50 : -50), y)).toFixed(3);
      d.label.style.transform = `translate(${(x + (right ? 11 : -11)).toFixed(1)}px, ${(y - 8).toFixed(1)}px) translateX(${right ? 0 : -100}%)`;
    });
    // each orbit's numeral at the left foot of its arc: on the horizon for the inner ones, where it
    // leaves the side of the screen for the outer ones
    ringLabels.forEach((s, j) => {
      const R = fieldR(j, spread) * I.open[j] * unit;
      const on = focus ? (fk === j ? 1 : 0.25) : 0.62;
      s.style.opacity = (on * I.gain[j] * fadeOut).toFixed(3);
      if (R < cx - 14) s.style.transform = `translate(${(cx - R - 7).toFixed(1)}px, ${(cy - 21).toFixed(1)}px) translateX(-100%)`;
      else s.style.transform = `translate(${(base.narrow ? 8 : 14)}px, ${(cy - Math.sqrt(Math.max(0, R * R - (cx - 14) ** 2)) - 19).toFixed(1)}px)`;
    });
    // the sectors' names run outward from their lights, like a dial's numerals, so they never meet;
    // on the left they turn over so they still read left to right
    sectors.forEach((S) => {
      if (secs < 0.01) { S.label.style.opacity = '0'; return; }
      const [x, y] = secPos(S);
      const relS = sectorRelated(S);
      // and the ones that would run under the nav step back
      const edge = smooth(70, 130, y);
      const op = now.secLabels * (focus ? (relS ? 1 : 0.15) : 0.78 * edge) * (base.narrow && !(focus && relS) ? 0 : 1);
      S.label.style.opacity = op.toFixed(3);
      const deg = (-S.a * 180) / Math.PI;
      const right = Math.cos(S.a) >= 0;
      S.label.style.transform = right
        ? `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${deg.toFixed(2)}deg) translate(10px, -50%)`
        : `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) rotate(${(deg + 180).toFixed(2)}deg) translate(calc(-100% - 10px), -50%)`;
    });

    scene.render({
      exposure: 0.95,
      white: 0,
      bloom: 0.07,
      centerUv: [cx / base.W, 1 - cy / base.H],
    });
  }

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  gsap.ticker.add(frame);
  canvas.classList.add('is-on');
  const f0 = fromHash();
  if (f0) setTimeout(() => open(f0, { push: false }), 300);

  if (local) {
    window.__orb = {
      scene, AU, I, intro, open, close, setFocus, sectors, discs, now, view, tick: frame,
      get p() { return Ps; }, set p(v) { P = Ps = v; },
    };
  }
}
