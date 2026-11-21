// Hero 8 of 8, "the orbits, in grain" (18 Nov). The user, of the Investor Corner's four rings of grain: "that very
// much looks a bit branded… it looks premium… make something in the hero section as a variant of this." So the
// site's own seven orbits in that material, from the founder's atlas (js/atlas-data.js):
// - Seven rings of fine grain round one centre, seen a little from above, turning slowly, each its own way: the
//   ground of being innermost, the return outermost, each as wide as the disciplines it holds.
// - The twenty-seven disciplines brighter points riding their rings; round them all a rail with the forty-eight
//   sectors as ticks (hero 2's rail, which the user liked).
// - From each discipline its links leave as grains on a spiral out to the sectors they move: a hundred and
//   fifty-one streams, always running, as the rupees run from Earn in the Investor Corner.
// What the hands do: drag to turn the orbits, up or down to tip them; point at an orbit and it comes forward (the
// rest dim, its disciplines named), at a discipline or a sector to read it; click opens its metrics (the light
// orb's panel, js/orb.js, through 'mm:open'); hold to open the orbits into the seven layers they are, one above the
// next. The scroll: they gather out of the centre; the streams run out to the crown; the orbits open into their
// layers and close again; last, the room turns to the paper the services are printed on.
// The opening (19 Nov, the poster; the user chose it from three sketches, refs/hero-orbits/sketch-openings.html):
// the orbits first fill the screen from its middle, seen almost from above; then they sink back into a dimmer ground
// over the words, and the line rises out of the foot of the screen, edge to edge; the sentence, the numbers and the one
// link come up in the corners. Handled, or once the words have gone, the orbits are in their full light again.
// The storyline (19 Nov, later; the user: the orbits "feel like a video… people may skip this thing thinking that
// that is just for decoration", and the scroll was "a very long process"): the screen is black; the orbits are drawn
// in one at a time, the innermost first, each coming forward as it arrives with its numeral, its name and its
// disciplines, so they read as seven separate things to touch; then the crown of forty-eight sectors and the streams
// running out to it; then the line rises at the foot and the corners come up at once, the story in four lines (seven
// orbits of a life, twenty-seven disciplines, forty-eight sectors, a hundred and fifty-one streams) and how to handle
// it. It starts when the hero holds the screen and the way in has gone. The scroll is short: a hold, the orbits open
// into their layers as the words go, and the paper. The poster before it: backup hero-8-before-storyline-2026-11-19.
// The grain is drawn on the graphics card in one draw (js/hero-orbits-gl.js; on a 2D canvas, grain by grain, it
// cost about 11 ms a frame); the crown, the disciplines and the names are drawn over it on a 2D canvas. A phone
// draws half the grain.
import { ATLAS } from './atlas-data.js';
import { createGrainLayer } from './hero-orbits-gl.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const firstSentence = (s) => (String(s || '').match(/^.*?[.!?](\s|$)/) || [s || ''])[0].trim();

export function setupOrbits({ lenis, reduced, isTouch, local }) {
  const stage = $('.stage-8'), hero = $('.hv-orbits');
  if (!stage || !hero) return;
  const canvas = $('.hv-gl', hero), card = $('.hv-card', hero), copy = $('.hv-copy', hero), caps = $$('.hv-caption', hero), hint = $('.ho-hint', hero);

  // ---------------------------------------------------------------- the founder's atlas
  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  const famOrder = Object.keys(ATLAS.families);
  const sectors = ATLAS.sectors.map((s, i) => ({ ...s, i, links: [] }));
  const secAt = Object.fromEntries(sectors.map((s) => [s.id, s.i]));
  const links = [];
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) { S.links.push({ d, f: l.f }); links.push({ d, S, f: l.f }); } }));
  // the sectors round the crown, family by family
  [...sectors].sort((a, b) => famOrder.indexOf(a.fam) - famOrder.indexOf(b.fam) || a.i - b.i).forEach((S, n) => { S.a = ((n + 0.5) / sectors.length) * TAU; });
  byRing.forEach((list, k) => list.forEach((d, j) => { d.a = ((j + 0.5) / list.length) * TAU + k * 0.9; }));

  // ---------------------------------------------------------------- the orbits, as grain
  const small = isNarrow(innerWidth, innerHeight) || isTouch;
  const density = small ? 0.5 : 1;
  const R = rings.map((_, k) => 0.24 + k * 0.105);                     // (radii, as a share of the half-width)
  const CROWN = 1.0;
  const BAND = byRing.map((list) => 0.018 + 0.0078 * list.length);     // (each as wide as the disciplines it holds, with night between)
  const SPEED = rings.map((_, k) => (k % 2 ? -1 : 1) * (0.035 + 0.035 * (6 - k) / 6)); // (radians a second; the inner faster)
  const grains = byRing.map((list) => Array.from({ length: Math.round((850 + 230 * list.length) * density) }, () => ({ a: Math.random() * TAU, r: gauss(), h: gauss(), s: 0.65 + Math.random() * 1.15 })));
  const travellers = [];
  links.forEach((L) => { for (let m = 0; m < (small ? 2 : 3); m++) travellers.push({ L, t: Math.random(), d: 3.4 + Math.random() * 2.8, s: 0.8 + Math.random() * 0.8 }); });
  const base = [233, 236, 242], gold = [240, 196, 138], room = [3, 4, 5];
  const paper = getComputedStyle(document.documentElement).getPropertyValue('--hero-paper').trim() === '#141414' ? [20, 20, 20] : [246, 247, 244];

// every grain, for the graphics card: the orbits' and the streams' (each stream's grain with two more behind it, its trail)
const ringGrains = [], streamGrains = [];
grains.forEach((list, k) => list.forEach((q) => ringGrains.push({ ring: k, rad: R[k], band: BAND[k], speed: SPEED[k], a: q.a, r: q.r, h: q.h, s: q.s, jit: 0.9 + 0.2 * Math.random() })));
travellers.forEach((T) => { const d = T.L.d, sx = T.L.S; [[0, 1], [0.014, 0.55], [0.028, 0.28]].forEach(([back, trail]) => streamGrains.push({ ring: d.ring, rad: R[d.ring], speed: SPEED[d.ring], a: d.a, a1: sx.a, t0: T.t, dur: T.d, back, trail, disc: d.i, sec: sx.i, s: T.s })); });
const layer = createGrainLayer(canvas, { grains: ringGrains, streams: streamGrains, base, gold });
if (!layer) { hero.classList.add('no-gl', 'is-words'); return; }
const ink = document.createElement('canvas');
ink.className = 'ho-ink';
ink.setAttribute('aria-hidden', 'true');
canvas.after(ink);
const g = ink.getContext('2d');
let w = 1, h = 1, dpr = 1;
const size = () => {
  const r = canvas.getBoundingClientRect();
  dpr = Math.min(2, devicePixelRatio || 1);
  w = Math.max(1, r.width); h = Math.max(1, r.height);
  ink.width = Math.round(w * dpr); ink.height = Math.round(h * dpr);
  layer.size(w, h, dpr);
};
  size();
  new ResizeObserver(size).observe(canvas);

  // ---------------------------------------------------------------- the state: scroll, hands, focus
  const S = { born: reduced ? 1 : 0, rot: 0, vel: 0, tiltK: 0, open: 0, flows: 0, focusK: null, focusD: null, focusS: null };
  const lit = rings.map(() => 0);                                       // (how far forward each orbit is)
  let P = 0, holding = false, time = 0, last = performance.now();
  // the opening (I.v: 1, the orbits in their place over the words; the screen-filling start of the poster is gone);
  // wake, how much the orbits are being handled
  const I = { v: 1 };
  let wake = 0;
  ScrollTrigger.create({ trigger: stage, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { P = self.progress; } });
  // the storyline: SHOW[k].v how much of orbit k is drawn; A.crown the sectors' rail and the streams; A.words the
  // words and how far the orbits sink back behind them; roll the orbit called forward as it arrives
  const SHOW = rings.map(() => ({ v: reduced ? 1 : 0 }));
  const A = { crown: reduced ? 1 : 0, words: reduced ? 1 : 0 };
  let roll = null, begun = false;
  const words = () => { hero.classList.add('is-words'); gsap.to(A, { words: 1, duration: reduced ? 0 : 1.4, ease: 'power2.out' }); };
  if (reduced) words();
  if (hint) hint.textContent = isTouch ? 'Tap an orbit to see what it moves. Hold to open them.' : 'Point at an orbit to see what it moves. Drag to turn, hold to open.';
  function arrival() {
    S.born = 1;
    if (reduced) return;
    const tl = gsap.timeline({ delay: 0.45 });
    rings.forEach((_, k) => {
      const at = k * 0.36;
      tl.to(SHOW[k], { v: 1, duration: 0.95, ease: 'power2.inOut' }, at);
      tl.call(() => { roll = k; }, null, at + 0.15);
    });
    const end = 6 * 0.36 + 0.95;
    tl.call(() => { roll = null; }, null, end + 0.2);
    tl.to(A, { crown: 1, duration: 1.1, ease: 'power2.inOut' }, end - 0.2);
    tl.call(words, null, end + 0.35);
  }
  // (it begins once the hero holds the screen and the way in, if it is showing, has gone)
  const begin = () => {
    if (begun || document.documentElement.classList.contains('gate')) return;
    begun = true;
    arrival();
  };
  ScrollTrigger.create({ trigger: stage, start: 'top 35%', end: 'bottom top', onEnter: begin, onEnterBack: begin });
  addEventListener('mm:enter', () => { const r = stage.getBoundingClientRect(); if (r.top < innerHeight * 0.35 && r.bottom > 0) setTimeout(begin, 300); });

  // the line, as wide as the screen allows between the margins (in two lines on a phone)
  const line = $('.ho-line', hero);
  const fitLine = () => {
    if (!line) return;
    line.style.fontSize = '100px';
    const lw = line.offsetWidth, room = line.parentElement.clientWidth;
    if (lw > 50 && room > 50) line.style.fontSize = `${(Math.floor((1000 * room * 0.995) / lw) / 10).toFixed(1)}px`;
    // (its window takes the same size, so the room it leaves for the italic's head and tail grows with the line)
    line.parentElement.style.fontSize = line.style.fontSize;
  };
  fitLine();
  document.fonts?.ready.then(fitLine);
  addEventListener('mm:type', fitLine); // (another sans to compare, once it has loaded: js/site.js)
  new ResizeObserver(fitLine).observe(hero);

  // where everything is this frame
  const view = () => {
    const nar = isNarrow(w, h);
    // the journey's place (once the words have gone): on a laptop clear of its captions at the left, the orbits to
    // the right of the middle
    const tiltJ = clamp(lerp(0.4, 0.62, S.open) + S.tiltK, 0.2, 0.78);
    const halfJ = nar ? Math.min(w * 0.47, h * 0.36) : Math.min(w * 0.27, h / (2 * tiltJ * 1.18));
    const cxJ = nar ? w * 0.5 : w * 0.68, cyJ = nar ? h * 0.36 : h * 0.5;
    // the opening's two places: filling the screen (the crown just past its corners, seen almost from above), then
    // sunk back over the line, wide and flat, in the middle
    // (since the storyline the orbits stay where they are while the page is held: no move to a journey's place)
    const i = I.v, j = 0;
    const fullHalf = Math.hypot(w * 0.5, (h * 0.5) / 0.82) * 1.02;
    const sunkHalf = nar ? Math.min(w * 0.47, h * 0.3) : Math.min(w * 0.33, h * 0.7); // (clear of the corners' words; 19 Nov: smaller, for the longer story lines)
    const tiltI = clamp(lerp(0.82, nar ? 0.46 : 0.34, i) + 0.22 * S.open + S.tiltK, 0.2, 0.86);
    const halfI = lerp(fullHalf, sunkHalf, i), cyI = lerp(h * 0.5, h * (nar ? 0.46 : 0.41), i);
    const tilt = lerp(tiltI, tiltJ, j), half = lerp(halfI, halfJ, j), cx = lerp(w * 0.5, cxJ, j), cy = lerp(cyI, cyJ, j);
    const gap = half * 0.15 * S.open;                                   // (how far apart the layers stand when open)
    const scale = (0.55 + 0.45 * S.born) * (1 - 0.14 * S.open);
    // (in full light as they arrive; a little dimmer behind the words once they come, the orbits still the subject;
    // handled, or once the words have gone, in full light)
    const dim = lerp(lerp(1, 0.74, A.words * (1 - smooth(0.3, 0.5, P))), 1, wake);
    return { tilt, half: half * scale, cx, cy: cy + 0.3 * half * scale * S.open, gap: gap * (1 - 0.14 * S.open), dim };
  };
  const ringY = (k, V) => V.cy - (k - 3) * V.gap;
  const crownY = (V) => V.cy - 4.1 * V.gap;
  const spin = (k) => SPEED[k] * time + S.rot;
  const crownSpin = () => 0.012 * time + S.rot;
  const discAt = (d, V) => { const a = d.a + spin(d.ring); return { x: V.cx + Math.cos(a) * R[d.ring] * V.half, y: ringY(d.ring, V) + Math.sin(a) * R[d.ring] * V.half * V.tilt, z: Math.sin(a) }; };
  const secAtXY = (s, V) => { const a = s.a + crownSpin(); return { x: V.cx + Math.cos(a) * CROWN * V.half, y: crownY(V) + Math.sin(a) * CROWN * V.half * V.tilt, a }; };

  // what is under the pointer: a discipline, a sector of the crown, or an orbit
  const pick = (x, y) => {
    const V = view();
    let best = null, bd = 16 * 16;
    discs.forEach((d) => { const p = discAt(d, V), dd = (p.x - x) ** 2 + (p.y - y) ** 2; if (dd < bd) { bd = dd; best = { kind: 'disc', d }; } });
    if (best) return best;
    bd = 12 * 12;
    sectors.forEach((s) => { const p = secAtXY(s, V), dd = (p.x - x) ** 2 + (p.y - y) ** 2; if (dd < bd) { bd = dd; best = { kind: 'sector', s }; } });
    if (best) return best;
    let bk = null, be = 1e9;
    rings.forEach((_, k) => { const dn = Math.hypot((x - V.cx) / V.half, (y - ringY(k, V)) / (V.half * V.tilt)), e = Math.abs(dn - R[k]); if (e < BAND[k] * 0.6 + 0.025 && e < be) { be = e; bk = k; } });
    return bk == null ? null : { kind: 'ring', k: bk };
  };
  const show = (hit) => {
    S.focusK = hit?.kind === 'ring' ? hit.k : hit?.kind === 'disc' ? hit.d.ring : null;
    S.focusD = hit?.kind === 'disc' ? hit.d : null;
    S.focusS = hit?.kind === 'sector' ? hit.s : null;
    if (!hit) { card.classList.remove('is-on'); return; }
    let k = '', name = '', note = '', list = '';
    if (hit.kind === 'ring') { const r = rings[hit.k]; k = `Orbit ${ROMAN[hit.k]}`; name = r.name; note = r.note; list = byRing[hit.k].map((d) => d.name).join(' · '); }
    if (hit.kind === 'disc') { const d = hit.d; k = `Orbit ${ROMAN[d.ring]} · a discipline`; name = d.name; note = firstSentence(d.gist); list = `Moves ${d.links.length} of 48: ${d.links.map((l) => sectors[secAt[l.s]]?.name).filter(Boolean).join(', ')}.`; }
    if (hit.kind === 'sector') { const s = hit.s; k = 'A sector'; name = s.name; note = s.links.length ? `Moved by ${s.links.length} ${s.links.length === 1 ? 'discipline' : 'disciplines'}.` : 'Not yet mapped in the atlas.'; list = s.links.map((l) => l.d.name).join(' · '); }
    card.innerHTML = `<p class="hc-k">${esc(k)}</p><p class="hc-name">${esc(name)}</p><p class="hc-note">${esc(note)}</p><p class="hc-list">${esc(list)}</p>`;
    card.classList.add('is-on');
  };
  const openMetrics = (hit) => {
    if (!hit) return;
    const detail = hit.kind === 'disc' ? { kind: 'disc', i: hit.d.i } : hit.kind === 'sector' ? { kind: 'sector', j: hit.s.i } : { kind: 'field', k: hit.k };
    dispatchEvent(new CustomEvent('mm:open', { detail }));
  };

  // the hands: drag to turn and tip; hold to open; a tap or click to read and open
  let down = null, holdTimer = 0;
  canvas.addEventListener('pointerdown', (e) => {
    down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, id: e.pointerId };
    S.vel = 0;
    clearTimeout(holdTimer);
    holdTimer = setTimeout(() => { if (down && down.moved < 7) { holding = true; hero.classList.add('is-holding'); } }, 420);
  });
  addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left, y = e.clientY - r.top;
    if (down && e.pointerId === down.id) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      down.moved += Math.abs(dx) + Math.abs(dy);
      down.x = e.clientX; down.y = e.clientY;
      if (down.moved > 6) {
        S.rot += dx * 0.006; S.vel = dx * 0.006 * 60;
        if (!isTouch) S.tiltK = clamp(S.tiltK - dy * 0.0018, -0.22, 0.22);
        canvas.classList.add('is-turning');
      }
      return;
    }
    if (isTouch || e.pointerType !== 'mouse') return;
    if (e.clientY < r.top || e.clientY > r.bottom) return;
    const hit = pick(x, y);
    canvas.style.cursor = hit && hit.kind !== 'ring' ? 'pointer' : '';
    show(hit);
  }, { passive: true });
  const up = (e) => {
    if (!down || (e && e.pointerId !== down.id)) return;
    clearTimeout(holdTimer);
    const quick = down.moved < 7 && performance.now() - down.t < 380 && !holding;
    if (quick && e) {
      const r = canvas.getBoundingClientRect(), hit = pick(e.clientX - r.left, e.clientY - r.top);
      if (isTouch) { show(hit); if (hit && hit.kind !== 'ring') openMetrics(hit); } else openMetrics(hit);
    }
    holding = false; hero.classList.remove('is-holding');
    canvas.classList.remove('is-turning');
    down = null;
  };
  addEventListener('pointerup', up);
  addEventListener('pointercancel', up);
  canvas.addEventListener('pointerleave', () => { if (!down) { show(null); canvas.style.cursor = ''; } });

  // ---------------------------------------------------------------- each frame
  function frame(now) { requestAnimationFrame(frame); draw(now); }
  function draw(now) {
    const r = canvas.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) time += dt;
    // the scroll's journey, and the hands
    // (19 Nov, the storyline: a short scroll. A hold with the words up; the orbits open into their layers as the words
    // go; then the paper)
    const openScroll = smooth(0.32, 0.62, P) * (1 - smooth(0.8, 0.9, P));
    S.open = damp(S.open, Math.max(openScroll, holding ? 1 : 0), holding ? 3.2 : 2.4, dt);
    S.flows = damp(S.flows, 1, 3, dt);
    if (!down) { S.rot += S.vel * dt; S.vel *= Math.exp(-2.6 * dt); S.tiltK = damp(S.tiltK, 0, 0.6, dt); }
    // (an orbit comes forward when it is pointed at, or, as they arrive, when it is called)
    const callK = S.focusK != null || S.focusS ? S.focusK : roll;
    rings.forEach((_, k) => { lit[k] = damp(lit[k], callK === k ? 1 : 0, 7, dt); });
    const anyFocus = S.focusK != null || S.focusS ? 1 : roll != null ? 0.5 : 0;
    wake = damp(wake, down || holding || (S.focusK != null || S.focusS) ? 1 : 0, 3, dt);
    const white = smooth(0.86, 0.995, P);
    let fade = 1 - white;
    // the words: all at once when the orbits are in, gone as the orbits open; the card, when there is one, in their place
    const cardOn = card.classList.contains('is-on') ? 1 : 0;
    if (copy) copy.style.opacity = ((1 - smooth(0.3, 0.5, P)) * (1 - cardOn)).toFixed(3);
    caps.forEach((c) => { c.style.opacity = '0'; });
    if (hint) hint.style.opacity = (A.words * (1 - smooth(0.3, 0.5, P))).toFixed(3);
    const paperNow = white > 0.5;
    if (paperNow !== draw.paper) { draw.paper = paperNow; hero.dataset.paper = paperNow ? 'true' : ''; }

const V = view();
fade *= V.dim; // (the orbits' light: dimmer while they are the words' ground)
const born = S.born;
// the grain, on the graphics card
const U = layer.U;
U.uTime.value = time; U.uRot.value = S.rot; U.uTilt.value = V.tilt; U.uHalf.value = V.half; U.uGap.value = V.gap;
U.uBorn.value = born; U.uFlows.value = S.flows * A.crown; U.uFade.value = fade; U.uAny.value = anyFocus;
for (let k = 0; k < 7; k++) U.uShow.value[k] = SHOW[k].v;
U.uFocusK.value = S.focusK ?? -9; U.uFocusD.value = S.focusD ? S.focusD.i : -9; U.uFocusS.value = S.focusS ? S.focusS.i : -9;
U.uC.value.set(V.cx, V.cy); U.uCrown.value = CROWN; U.uCrownSpin.value = crownSpin();
for (let k = 0; k < 7; k++) U.uLit.value[k] = lit[k];
layer.render(room.map((c, i) => Math.round(lerp(c, paper[i], white))));
// over it, on the 2D layer: the crown, the twenty-seven and the names
g.setTransform(dpr, 0, 0, dpr, 0, 0);
g.clearRect(0, 0, w, h);
if (fade <= 0.01) return;
    // the crown: a hairline rail, and a tick for each of the forty-eight
    const cy7 = crownY(V);
    const crownK = A.crown;
    g.strokeStyle = `rgba(${base.join(',')},${(0.16 * fade * born * crownK).toFixed(3)})`;
    g.lineWidth = 1;
    g.beginPath(); g.ellipse(V.cx, cy7, CROWN * V.half, CROWN * V.half * V.tilt, 0, 0, TAU); g.stroke();
    sectors.forEach((s) => {
      const p = secAtXY(s, V), out = 1 + 0.035 + (s === S.focusS ? 0.03 : 0);
      const on = s === S.focusS || (S.focusD && S.focusD.links.some((l) => l.s === s.id)) || (S.focusK != null && s.links.some((l) => l.d.ring === S.focusK));
      const al = (on ? 0.95 : 0.34 + 0.26 * (Math.sin(p.a) * 0.5 + 0.5)) * fade * born * crownK;
      g.strokeStyle = on ? `rgba(${gold.join(',')},${al.toFixed(3)})` : `rgba(${base.join(',')},${al.toFixed(3)})`;
      g.beginPath();
      g.moveTo(p.x, p.y);
      g.lineTo(V.cx + Math.cos(p.a) * CROWN * out * V.half, cy7 + Math.sin(p.a) * CROWN * out * V.half * V.tilt - (on ? 4 : 2.5));
      g.stroke();
    });
    // the twenty-seven: brighter points on their orbits, named when their orbit is forward
    g.font = '500 12px "Open Sauce One", system-ui, sans-serif';
    g.textBaseline = 'middle';
    discs.forEach((d) => {
      const p = discAt(d, V), k = d.ring;
      const on = S.focusD === d || lit[k] > 0.5;
      const al = (on ? 1 : (0.5 + 0.35 * (p.z * 0.5 + 0.5)) * (1 - anyFocus * 0.6 * (1 - lit[k]))) * fade * smooth(0.3, 1, born) * smooth(0.55, 1, SHOW[k].v);
      const sz = (S.focusD === d ? 4.4 : 3.2) * (0.85 + 0.3 * (p.z * 0.5 + 0.5));
      g.fillStyle = S.focusD === d ? `rgba(${gold.join(',')},${al.toFixed(3)})` : `rgba(${base.join(',')},${al.toFixed(3)})`;
      g.fillRect(p.x - sz / 2, p.y - sz / 2, sz, sz);
      if (on && lit[k] > 0.05) {
        g.fillStyle = `rgba(${base.join(',')},${(al * Math.max(lit[k], S.focusD === d ? 1 : 0)).toFixed(3)})`;
        g.fillText(d.name, p.x + 8, p.y - 1);
      }
    });
    // each orbit's numeral at its right, small, in the mono; its name beside it while it is forward (as it arrives,
    // or when pointed at)
    rings.forEach((r, k) => {
      const show = SHOW[k].v;
      if (show <= 0.01) return;
      const a = -0.12, x = V.cx + Math.cos(a) * (R[k] + BAND[k] * 0.5 + 0.02) * V.half, y = ringY(k, V) + Math.sin(a) * R[k] * V.half * V.tilt;
      g.font = '400 10px "Fragment Mono", ui-monospace, monospace';
      g.fillStyle = `rgba(${base.join(',')},${((0.32 + 0.6 * lit[k]) * fade * born * show).toFixed(3)})`;
      g.fillText(ROMAN[k], x + 4, y);
      if (lit[k] > 0.04) {
        g.font = '500 13px "Open Sauce One", system-ui, sans-serif';
        g.fillStyle = `rgba(${base.join(',')},${(lit[k] * fade * show).toFixed(3)})`;
        // (where there is no room at its right, as on a phone, the name goes at its left end)
        const tw = g.measureText(r.name).width;
        if (x + 26 + tw < w - 12) g.fillText(r.name, x + 26, y);
        else { g.textAlign = 'right'; g.fillText(r.name, Math.max(tw + 12, 2 * V.cx - x - 6), y); g.textAlign = 'left'; }
      }
    });
  }
  requestAnimationFrame(frame);

  if (local) window.__orbits = { S, SHOW, A, rings, discs, sectors, links, travellers, get p() { return P; }, set p(v) { P = v; }, get roll() { return roll; }, tick: () => draw(performance.now()), show, pick, layer, I, words, begin, arrival, fitLine };
}
