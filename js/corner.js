// The Creative Corner. From the brief: "where all the upcoming cool artists get a page to just
// showcase their creative across different categories at a single place." The people who come
// here are founders and investors, so the work comes first, and hiring its maker is one step away.
// It has a page of its own (creative.html), under one sky: a gradient from the top of the page to its
// foot, near night, then the corner's colour, a soft haze where the opening ends, and a pale
// morning under it for the wall (after Antimetal's composition).
//
// Since 7 Nov it is laid out the way a professional shop lays out its things (the user, after the
// Unscene ticket site's shop: "a proper layout like a professional site", with no unnecessary
// shadows or rounded corners). The creative part is the sky, the line of makers, and one Easter
// egg. Before this it was a pile of prints dealt into a fan of 3D cards over a halftone sky
// (backed up in ~/Desktop/metamorph_backups/before-shop-corner-2026-11-06/).
//
// - The opening: "creative corner" is written across the sky as the masthead, the makers riding
//   the line (the user's own idea). Under it, the art of the day, the week and the month: the
//   words for the one up on the left, the one up in the middle, the three listed on the right,
//   and the six days before along the foot. Until the client chooses them (PICKS in
//   js/artists.js), each day, week and month takes a piece in turn by the date.
// - Every piece is shown as itself, in its own shape (4:5, 9:16, 16:9, whatever it came in), with
//   nothing round it: no ground, no mat, no border, no shadow, no rounded corner, never cropped.
// - The wall: justified rows (each row one height, flush to both edges, every piece at its own
//   shape), about four 4:5 pieces across (two on a phone), each with its title and maker under it. A page more at a time, never an
//   endless feed. Or the same work as an index, a line each, its print following the cursor.
// - The domains: a row of tabs, "All" first, each with how many pieces it has. Choosing one
//   bleeds its colour across the page and the sky takes it, while the wall rehangs to it.
// - The Easter egg: the makers' signatures (one hand, js/hand.js) are never shown on the page.
//   Rest on a piece, or press and hold it on a phone, and its maker signs it in the ground's
//   corner; leave and it fades.
// - A piece, opened: it comes forward into a room of the sheet's colour, on its own ground and
//   signed, with its maker beside it and the two ways on: hire them, or see all their work.
//   Their page signs their name in the same hand.
// - The signature band that ran under the wall is hidden (its code is kept and does nothing).
//
// The artists and their work are placeholders (js/artists.js, js/corner-parts.js).

import { ARTS, ARTISTS, ONE, PICKS, FOR_SALE } from './artists.js';
import { portrait, workArt, ratioOf } from './corner-parts.js';
import { write, unitsOf, at, inkOutline } from './hand.js';
import { createMuseum } from './corner-museum.js';
import { createWorks } from './corner-works.js';
// (gallery 3 was the pedestal, then the stone cocoon, the hewn stone (js/corner-block.js), the glass
// plinth (js/corner-glass.js) and the three orders (js/corner-orders.js), all kept, unloaded and
// backed up; on 14 Nov the user asked for the first pedestal back, so it is the pedestal again)
import { createPedestal } from './corner-pedestal.js';
// (14 Nov: the split marble, js/corner-marble.js, was tried in the pedestal's place and set aside,
// the user: "it looks so AI". The file is kept, unloaded.)
// (14 Nov: the stone on a pin, js/corner-stone.js, was tried the same way and set aside, the user:
// "I generally don't like this". Kept, unloaded.)
// (14 Nov, a test: the colossal hand, js/corner-hand.js, in the pedestal's place with ?hand)
import { createHand } from './corner-hand.js';
const COLOSSUS = /[?&]hand\b/.test(location.search);
const GALLERY3 = COLOSSUS ? [createHand, 'the hand'] : [createPedestal, 'the pedestal'];
// (16 Nov) gallery 4, the branch, js/corner-branch.js: on the page since 16 Nov (a test behind
// ?branch until then)
import { createBranch } from './corner-branch.js';
// (the silk banner, js/corner-silk.js, was a third gallery from 11 Nov; taken off on 12 Nov, the
// user did not like it. The file is kept, unloaded; backup the-silk-banner-corner-2026-11-12.)

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);
const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const pad2 = (n) => String(n).padStart(2, '0');
const f1 = (v) => v.toFixed(1);

// the sheet: the first draft's cobalt for everything, and each domain's own colour when its book
// is pulled out. One solid colour each, deep enough for warm white ink.
// the colour of everything: since 11 Nov the site's own before-dawn blue (js/silk.js), not cobalt, so
// the corner's sky runs night, blue, a white haze and the pale, as the rest of the site does
const ALL = '#26375a';
const COLOR = {
  film: '#6b2a6f', editing: '#cf4a2b', graphic: '#1e6c4d', photography: '#25272d', illustration: '#5a3fc0',
  animation: '#0c7385', music: '#b8346b', writing: '#1c2c66', craft: '#9e621b',
};
// what the signature writes: the domain's name, or, for everything, its makers. On a phone a long
// name is written on two lines, broken where a hand might break it.
const LINES = { film: ['film', 'making'], editing: ['video', 'editing'], graphic: ['graphic', 'design'], photography: ['photo', 'graphy'], illustration: ['illus', 'tration'], animation: ['anim', 'ation'] };
const writtenAs = (a, narrow) => (!a ? ['the makers'] : (narrow && LINES[a.id]) || [a.name.toLowerCase()]);
const GAP = 4.1; // between written lines, in x-heights: room for one line's tails and the next one's loops
// the hand: a practised signature, not a scrawl. Close letters, short loops, a light slant, a flick.
const HAND = { slant: 0.24, track: 0.07, loops: 0.85, flick: true };
// the ruled lines of handwriting paper, in x-heights from the baseline (up is positive)
const RULES = [[2.2, 'ascender'], [1, 'x-height'], [0, 'baseline'], [-1.15, 'descender']];
// how much of everything goes up at a time
const PAGE = (narrow) => (narrow ? 12 : 16); // whole rows: four by four, or two (or three) across
// the pictures: as drawn for the wall, and large for a piece opened
const ART_W = 560;
const BIG_W = (r) => (r >= 1 ? 1500 : 1100);

const rng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
// the ink as it bleeds through the sheet: a blot a unit across, its edge never round, with the
// spatter a wet edge throws
function blot(seed) {
  const r = rng(seed * 53 + 1), ph = [r() * 6.3, r() * 6.3, r() * 6.3], N = 96;
  const p = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const k = 1 + 0.07 * Math.sin(3 * a + ph[0]) + 0.045 * Math.sin(5 * a + ph[1]) + 0.025 * Math.sin(11 * a + ph[2]);
    p.push([Math.cos(a) * k, Math.sin(a) * k]);
  }
  const mid = (i) => [(p[i][0] + p[(i + 1) % N][0]) / 2, (p[i][1] + p[(i + 1) % N][1]) / 2];
  let d = `M${mid(N - 1).map((v) => v.toFixed(4)).join(' ')}`;
  for (let i = 0; i < N; i++) d += `Q${p[i][0].toFixed(4)} ${p[i][1].toFixed(4)} ${mid(i).map((v) => v.toFixed(4)).join(' ')}`;
  for (let k = 0; k < 6; k++) {
    const a = r() * Math.PI * 2, R = 1.08 + r() * 0.12, s = 0.012 + r() * 0.025, x = Math.cos(a) * R, y = Math.sin(a) * R;
    d += `M${(x - s).toFixed(4)} ${y.toFixed(4)}A${s.toFixed(4)} ${s.toFixed(4)} 0 1 0 ${(x + s).toFixed(4)} ${y.toFixed(4)}A${s.toFixed(4)} ${s.toFixed(4)} 0 1 0 ${(x - s).toFixed(4)} ${y.toFixed(4)}Z`;
  }
  return `${d}Z`;
}

// ---------------------------------------------------------------- the work

// one object per piece, shared by every view of the wall, so a piece on two walls is one tile
const PIECES = new Map();
const piece = (p, i) => {
  const key = `${p.slug}/${i + 1}`;
  if (!PIECES.has(key)) PIECES.set(key, { key, p, i, w: p.works[i], ratio: ratioOf(p, i) });
  return PIECES.get(key);
};
// everything: each artist's newest piece, the domains dealt in turn, so the wall is mixed from
// its first row. Dealt in an order that keeps work of one shape from hanging beside its like
// (two film stills, two sleeves).
const DEAL = ['music', 'film', 'writing', 'illustration', 'photography', 'graphic', 'craft', 'animation', 'editing'];
const EVERY = (() => {
  const by = DEAL.map((id) => ARTISTS.filter((p) => p.art === id)), out = [];
  for (let k = 0; out.length < ARTISTS.length; k++) by.forEach((list) => { if (list[k]) out.push(piece(list[k], 0)); });
  return out;
})();
// a domain: all its artists' work, newest first, each artist's in turn
function ofDomain(a) {
  const mine = ARTISTS.filter((p) => p.art === a.id), out = [];
  const n = Math.max(...mine.map((p) => p.works.length));
  for (let i = 0; i < n; i++) mine.forEach((p) => { if (p.works[i]) out.push(piece(p, i)); });
  return out;
}
const theirWork = (p) => p.works.map((w, i) => piece(p, i));
const first = (p) => p.name.split(' ')[0];
const domainOf = (p) => ARTS.find((a) => a.id === p.art);

// ---------------------------------------------------------------- the picks, by the date

const ALL_WORK = ARTISTS.flatMap(theirWork);
const DAY_MS = 864e5;
const midnight = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d, n) => { const m = midnight(d); m.setDate(m.getDate() + n); return m; };
const mondayOf = (d) => addDays(d, -((d.getDay() + 6) % 7));
const dayN = (d) => Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / DAY_MS);
const isoDay = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmt = (d, o) => d.toLocaleDateString('en-GB', o);
// a pick: the piece the client chose for that day, week or month (PICKS), or else the next in
// turn by the date, never from a domain already picked for the same days. Each depends only on
// its own date, so yesterday's pick is still yesterday's tomorrow.
function pickOf(kind, key, n, step, avoid) {
  const m = PICKS[kind]?.[key]?.match(/^([a-z0-9-]+)\/(\d+)$/);
  const p = m && ARTISTS.find((q) => q.slug === m[1]);
  if (p?.works[+m[2] - 1]) return piece(p, +m[2] - 1);
  const N = ALL_WORK.length;
  let k = (((n * step) % N) + N) % N;
  while (avoid.some((q) => q.art === ALL_WORK[k].p.art)) k = (k + 1) % N;
  return ALL_WORK[k];
}
const monthPick = (d) => pickOf('month', isoDay(d).slice(0, 7), d.getFullYear() * 12 + d.getMonth() + 5, 29, []);
const weekPick = (d) => { const m = mondayOf(d); return pickOf('week', isoDay(m), Math.round(dayN(m) / 7) + 11, 53, [monthPick(m).p]); };
const dayPick = (d) => pickOf('day', isoDay(d), dayN(d), 37, [monthPick(d).p, weekPick(d).p]);
const HONOUR = { day: 'Art of the day', week: 'Art of the week', month: 'Art of the month' };

export function setupCorner({ lenis, register, reduced, isTouch, local, say }) {
  const section = $('.corner');
  if (!section) return;
  const root = document.documentElement;
  const sheet = $('.cc-sheet', section);
  const wallEl = $('.cc-wall', sheet);
  const tilesEl = $('.cc-tiles', wallEl);
  const pileEl = $('.cc-pile', section);
  const index = $('.cc-index ol', pileEl);
  const label = $('.cc-label', pileEl);
  const allBtn = $('.cc-all', label);
  const moreRow = $('.cc-more-row', sheet);
  const moreBtn = $('.cc-more', moreRow);
  const shownEl = $('.cc-shown', moreRow);
  const band = $('.cc-band', sheet);
  const svg = $('.cc-sign', band);
  const rules = $('.cc-rules', svg);
  const field = $('.cc-field', svg);
  const inkG = $('.cc-ink-g', svg);
  const ink = $('.cc-ink', svg);
  const penPath = $('.cc-pen', svg); // the mask the ink is revealed through, following the pen
  const liftG = $('.cc-lifts', svg);
  const cross = $('.cc-x', svg);
  const under = $('.cc-under', band);
  const ridersEl = $('.cc-riders', band);
  const room = $('.cc-room', section);
  const roomBg = $('.cc-room-bg', room);
  const roomScroll = $('.cc-room-scroll', room);
  const backBtn = $('.cc-back', room);
  const closeBtn = $('.cc-close', room);
  const pieceEl = $('.cc-piece', room);
  const pcFig = $('.cc-pc-fig', pieceEl);
  const pcMat = $('.cc-pc-mat', pieceEl);
  const pcImg = $('.cc-pc-img', pieceEl);
  const pcSig = $('.cc-pc-sig', pieceEl);
  const makerPic = $('.cc-maker-pic', pieceEl);
  const personEl = $('.cc-person', room);
  const pPhoto = $('.cc-p-photo img', personEl);
  const pSign = $('.cc-p-sign', personEl);
  const flyer = $('.cc-flyer', room);
  const pcFrame = $('.cc-pc-frame', pieceEl);
  const shareMenu = $('.cc-share', pieceEl);
  const actBtn = (a) => $(`[data-act="${a}"]`, pieceEl);
  const toolBtn = (t) => $(`[data-tool="${t}"]`, pieceEl);
  const savedEl = $('.cc-saved', room);
  const savedBtn = $('.cc-saved-btn', room);
  const chip = $('.cc-saved-chip', section);

  let ai = -1;               // the domain on the wall, or -1 for everything
  let limit = 0;             // how much of everything is up
  let shown = [];            // the pieces on the wall, in order
  let narrow = isNarrow(innerWidth, innerHeight);
  const tiles = new Map();   // a piece's key: its tile
  let riders = [], geo = null, W = 0, H = 0;
  let off = 0, speed = 0, hover = null, inside = false, active = false;
  const drawn = { v: reduced ? 1 : 0 }, lifted = { v: reduced ? 1 : 0 };
  let roomOn = false, mode = null, cur = null, seq = [], cameFrom = null, cameSeq = null, pushed = false, returnTo = null;

  // ---------------------------------------------------------------- the sky
  // One gradient down the whole page (css/main.css): its haze where the opening ends (--hz), the
  // pale under it. The nav is cut from the same sky where it is, so nothing passes under an edge;
  // it reads light on the colour and dark on the pale, and the browser takes the colour it is on.
  const skyEl = $('.cc-sky', section), navEl = $('.nav');
  let hz = innerHeight;
  function layoutSky() {
    // (the haze comes where the last gallery on the page ends)
    const opens = [...section.querySelectorAll('.cp-open')].filter((q) => !q.classList.contains('is-off'));
    const open = opens[opens.length - 1], o = open.getBoundingClientRect();
    // (the phone's sky wall ends white at its foot: the haze comes up to meet it there, so the
    // sky under it is already white rather than dipping back into blue)
    const meet = open.classList.contains('is-sky') && open.classList.contains('is-wall') ? -o.height * 0.22 : innerHeight * 0.04;
    hz = Math.round(o.bottom + scrollY + meet);
    root.style.setProperty('--hz', `${hz}px`);
    navEl?.style.setProperty('--sky-h', `${skyEl.offsetHeight}px`);
  }
  if ('ResizeObserver' in window) new ResizeObserver(() => navEl?.style.setProperty('--sky-h', `${skyEl.offsetHeight}px`)).observe(skyEl);
  let skyY = -1;
  gsap.ticker.add(() => { if (scrollY !== skyY) { skyY = scrollY; navEl?.style.setProperty('--sy', `${skyY}px`); } });
  const sheetColour = () => (ai < 0 ? ALL : COLOR[ARTS[ai].id]);
  // (with the pale gallery, js/corner-museum.js, the whole page is pale)
  // (with the works, 14 Nov, the page goes back into the night under the galleries: nothing is pale)
  const onPale = (y) => !root.classList.contains('cc-works-on') && (root.classList.contains('cc-pale-room') || scrollY + y > hz - innerHeight * 0.02);
  register({
    name: 'creative', commit() {}, revert() {},
    under: (y) => (onPale(y) ? { lit: false, tone: 'ink', theme: getComputedStyle(root).getPropertyValue('--cc-pale').trim() || '#f4f6f9' } : { lit: false, tone: 'light', theme: sheetColour() }),
  });

  $('.cc-total', section).textContent = `${ARTISTS.length} artists across ${ARTS.length} domains`;

  // ---------------------------------------------------------------- the signatures, in one hand

  const sigs = new Map();
  const signedAs = (p) => p.name.toLowerCase().replace(/[^a-z ]/g, '');
  // a name signed small, as on a print: a word at a time, the pen lifted between them, the last
  // word ending on the flick
  const sigOf = (p, xh) => {
    const k = `${p.slug}:${xh}`;
    if (sigs.has(k)) return sigs.get(k);
    const words = signedAs(p).split(' ').filter(Boolean), runs = [];
    let x = 0;
    words.forEach((wd, j) => {
      const lead = j ? 0.25 : 0.5, g = write(wd, { xh, ...HAND, flick: j === words.length - 1, leadIn: lead, leadOut: 0.4 });
      if (j) x += (0.55 + lead) * xh; // a word's space, and the next one's lead-in
      runs.push({ g, dx: x });
      x += g.width + 0.6 * xh; // its lead-out tail
    });
    const sig = { runs, width: x - 0.3 * xh };
    sigs.set(k, sig);
    return sig;
  };
  // a maker's signature, in their domain's colour, at a size of hand
  function sigInto(s, p, xh) {
    const g = sigOf(p, xh), x0 = -0.9 * xh, y0 = -2.3 * xh, w = g.width + 1.9 * xh, h = 3.75 * xh;
    s.setAttribute('viewBox', `${f1(x0)} ${f1(y0)} ${f1(w)} ${f1(h)}`);
    s.setAttribute('width', f1(w));
    s.setAttribute('height', f1(h));
    s.style.color = COLOR[p.art];
    s.innerHTML = g.runs.map(({ g: r, dx }) => `<g transform="translate(${f1(dx)} 0)"><path class="w" pathLength="1" data-len="${r.total.toFixed(0)}" d="${r.d}"/>`
      + r.lifts.map((d) => `<path class="l" pathLength="1" d="${d}"/>`).join('') + '</g>').join('');
    return s;
  }
  // signing: each word at a hand's pace, then back for the dots and crosses
  function signIt(s, { delay = 0, pace = 1 } = {}) {
    const ws = $$('.w', s), ls = $$('.l', s);
    gsap.killTweensOf([...ws, ...ls]);
    if (reduced) { gsap.set([...ws, ...ls], { strokeDashoffset: 0 }); return; }
    gsap.set([...ws, ...ls], { strokeDashoffset: 1 });
    const tl = gsap.timeline({ delay });
    ws.forEach((q, j) => tl.to(q, { strokeDashoffset: 0, duration: clamp((+q.dataset.len || 200) / 320, 0.35, 0.9) * pace, ease: 'power1.inOut' }, j ? '+=0.08' : 0));
    tl.to(ls, { strokeDashoffset: 0, duration: 0.12, stagger: 0.08, ease: 'none' });
  }
  const io = 'IntersectionObserver' in window;
  const unsign = (s) => $$('path', s).forEach((q) => { gsap.killTweensOf(q); q.style.strokeDashoffset = reduced || !io ? 0 : 1; });
  const signNow = (s) => $$('path', s).forEach((q) => { gsap.killTweensOf(q); q.style.strokeDashoffset = 0; });
  const SIG_XH = () => (narrow ? 6.5 : 8.5);

  // ---------------------------------------------------------------- the domains, as tabs

  // every domain by name, with how many pieces it has, and "All" first. The one chosen is the
  // wall's, and its colour takes the sky.
  const tab = (name, n) => {
    const li = el('li'), b = el('button', 'cc-item cc-tab');
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.append(el('span', 'ci-name', name), el('span', 'ci-n', String(n)));
    li.append(b);
    index.append(li);
    return b;
  };
  const allTab = tab('All', EVERY.length);
  allTab.style.setProperty('--book', ALL);
  allTab.addEventListener('click', () => choose(-1));
  const items = ARTS.map((a, i) => {
    const b = tab(a.name, ofDomain(a).length);
    b.style.setProperty('--book', COLOR[a.id]);
    // the chosen one again goes back to everything
    b.addEventListener('click', () => choose(i === ai ? -1 : i));
    return b;
  });
  allBtn.addEventListener('click', () => choose(-1));

  // the new colour bleeds out of its tab across the page (as far as you can see), then
  // the page is that colour
  const bleed = $('.cc-bleed', section), blotEl = $('path', bleed);
  const F = { s: 0, col: null };
  const settle = () => {
    if (!F.col) return;
    gsap.killTweensOf(F);
    root.classList.add('cc-still');
    root.style.setProperty('--cc', F.col);
    F.col = null;
    // the flat ink lifts off the new sky under it
    requestAnimationFrame(() => {
      root.classList.remove('cc-still');
      gsap.to(bleed, { opacity: 0, duration: reduced ? 0 : 0.7, ease: 'power2.out', onComplete: () => { bleed.style.visibility = 'hidden'; } });
    });
  };
  function flood(col, from) {
    settle(); // a bleed still running finishes at once, so the inks never jump
    const r = from.getBoundingClientRect(), vw = innerWidth, vh = innerHeight;
    const x = r.left + Math.min(18, r.width / 2), y = r.top + r.height * 0.5;
    const far = Math.max(Math.hypot(x, y), Math.hypot(vw - x, y), Math.hypot(x, vh - y), Math.hypot(vw - x, vh - y)) * 1.18;
    bleed.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    blotEl.setAttribute('d', blot(ai + 1));
    blotEl.style.fill = col;
    F.col = col;
    F.s = 4;
    const put = () => blotEl.setAttribute('transform', `translate(${f1(x)} ${f1(y)}) scale(${F.s.toFixed(2)})`);
    put();
    gsap.killTweensOf(bleed);
    bleed.style.opacity = 1;
    bleed.style.visibility = 'visible';
    // quick where it lands, slowing as it spreads, the way ink takes to wet paper; a tall sheet
    // takes a little longer to cover
    gsap.to(F, { s: far, duration: clamp(far / 1500, 1.1, 1.8), ease: 'power2.out', onUpdate: put, onComplete: settle });
  }
  function paintIndex(animate, from) {
    items.forEach((b, i) => {
      const on = i === ai;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('is-on', on);
    });
    allTab.setAttribute('aria-pressed', String(ai < 0));
    allTab.classList.toggle('is-on', ai < 0);
    const col = sheetColour();
    if (animate && !reduced && from && getComputedStyle(root).getPropertyValue('--cc').trim() !== col) flood(col, from);
    else if (!F.col) root.style.setProperty('--cc', col);
  }
  // under the pile, what is on the wall
  function fillLabel() {
    const a = ARTS[ai];
    $('.cc-no', label).textContent = a ? `${pad2(ai + 1)} / ${pad2(ARTS.length)}` : `${pad2(ARTS.length)} domains`;
    $('.cc-name', label).textContent = a ? a.name : 'Every domain';
    $('.cc-note', label).textContent = a ? a.note : 'Choose a domain to see only its work.';
    allBtn.hidden = !a;
  }

  // ---------------------------------------------------------------- the wall

  // The Easter egg: a maker's signature is never shown on the page until you rest on their piece
  // (or press and hold it on a phone). Then they sign it in the ground's corner, in their own hand;
  // leave and it fades.
  function egg(target, sig) {
    let held = false, timer = 0;
    const on = () => { gsap.killTweensOf(sig); gsap.set(sig, { opacity: 1 }); signIt(sig, { pace: 0.6 }); target.classList.add('is-signed'); };
    const off = () => { target.classList.remove('is-signed'); gsap.to(sig, { opacity: 0, duration: 0.5, ease: 'power2.out', onComplete: () => unsign(sig) }); };
    target.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') on(); });
    target.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') off(); });
    target.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      held = false;
      clearTimeout(timer);
      timer = setTimeout(() => { held = true; on(); }, 380);
    });
    target.addEventListener('pointerup', () => clearTimeout(timer));
    target.addEventListener('pointercancel', () => { clearTimeout(timer); if (held) { held = false; off(); } });
    // a hold that signed is not also a tap
    target.addEventListener('click', (e) => {
      if (!held) return;
      held = false;
      e.stopImmediatePropagation();
      e.preventDefault();
      setTimeout(off, 1800);
    }, true);
    target.addEventListener('contextmenu', (e) => { if (e.pointerType !== 'mouse') e.preventDefault(); });
  }

  // a piece on the wall: the picture itself, in its own shape and with nothing round it, and nothing
  // printed under it (its title and maker are read out, and shown when it opens)
  function tileFor(pc) {
    if (tiles.has(pc.key)) return tiles.get(pc.key);
    const li = el('li', 'cc-tile');
    const b = el('button', 'cc-tile-btn');
    b.type = 'button';
    b.setAttribute('aria-label', `${pc.w.title}, ${pc.w.kind.toLowerCase()} by ${pc.p.name}`);
    const mat = el('span', 'cc-mat'), art = el('span', 'cc-art'), img = el('img');
    img.alt = '';
    img.decoding = 'async';
    art.append(img);
    const sig = document.createElementNS(NS, 'svg');
    sig.setAttribute('class', 'cc-sig');
    sig.setAttribute('aria-hidden', 'true');
    sigInto(sig, pc.p, SIG_XH());
    // rest on it (or hold it) and its maker signs in the gap under it
    mat.append(art, sig);
    b.append(mat);
    li.append(b);
    const t = { pc, li, b, mat, art, img, sig, on: false, painted: false, signed: false };
    li.cc = t;
    egg(b, sig);
    b.addEventListener('click', () => openPiece(pc, { from: { art, img, b } }));
    b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') lightRider(pc.p, true); });
    b.addEventListener('pointerleave', () => lightRider(pc.p, false));
    b.addEventListener('focus', () => lightRider(pc.p, true));
    b.addEventListener('blur', () => lightRider(pc.p, false));
    tiles.set(pc.key, t);
    return t;
  }
  function paint(t) {
    if (t.painted) return;
    t.painted = true;
    workArt(t.pc.p, t.pc.i, ART_W).then((url) => {
      t.img.src = url;
      const up = () => { t.art.classList.add('is-in'); trueShape(t.pc, t.img); };
      if (t.img.decode) t.img.decode().then(up, up); else t.img.onload = up;
    });
  }
  // the art is drawn a little before it comes into view (the signatures wait to be found)
  const near = io ? new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    near.unobserve(e.target);
    paint(e.target.cc);
  }), { rootMargin: '900px 0px' }) : null;
  const seen = null;
  // and the rest are drawn in the quiet moments, one at a time, so none is ever missing
  const idle = window.requestIdleCallback || ((f) => setTimeout(f, 80));
  let idling = false;
  function paintSoon() {
    if (idling) return;
    idling = true;
    const next = () => {
      const t = shown.map((pc) => tiles.get(pc.key)).find((q) => !q.painted);
      if (!t) { idling = false; return; }
      paint(t);
      idle(next, { timeout: 1500 });
    };
    idle(next, { timeout: 1500 });
  }

  // justified rows: every piece at its own shape (4:5, 9:16, 16:9, whatever it came in) and nothing
  // round it, each row one height and flush to both edges, as many to a row as fit at about the
  // height of four 4:5 pieces across (two on a phone); the last row as it falls
  let gap = 24;
  function arrange() {
    narrow = isNarrow(innerWidth, innerHeight);
    const Wd = wallEl.clientWidth;
    gap = narrow ? 10 : 24;
    const across = narrow ? (Wd >= 620 ? 3 : 2) : Wd >= 1100 ? 4 : 3;
    const target = ((Wd - gap * (across - 1)) / across) * 1.25;
    const list = shown.map((pc) => tiles.get(pc.key));
    const rows = [];
    let row = [], sum = 0;
    list.forEach((t) => {
      const r = t.pc.ratio || 0.8;
      // close the row when the next would make it shorter than the target by more than it is taller without it
      if (row.length && (sum + r) * target + gap * row.length > Wd) {
        const without = (Wd - gap * (row.length - 1)) / sum, withIt = (Wd - gap * row.length) / (sum + r);
        if (Math.abs(withIt - target) < Math.abs(without - target)) { row.push(t); sum += r; rows.push([row, sum, false]); row = []; sum = 0; return; }
        rows.push([row, sum, false]);
        row = []; sum = 0;
      }
      row.push(t);
      sum += r;
    });
    if (row.length) rows.push([row, sum, true]);
    // the rows stand a signature's height apart, room for the one being signed
    const rowGap = narrow ? 30 : 46, placed = [];
    let y = 0;
    rows.forEach(([items, total, last]) => {
      const fit = (Wd - gap * (items.length - 1)) / total, h = last ? Math.min(fit, target) : fit;
      let x = 0;
      items.forEach((t) => {
        const w = h * (t.pc.ratio || 0.8);
        t.li.style.width = `${f1(w)}px`;
        t.art.style.width = `${f1(w)}px`;
        t.art.style.height = `${f1(h)}px`;
        placed.push([t, x, y]);
        x += w + gap;
      });
      y += h + rowGap;
    });
    wallEl.style.height = `${f1(Math.max(0, y - rowGap))}px`;
    // the index takes the wall's place
    if (view === 'index') {
      listEl.style.width = `${f1(Wd)}px`;
      listEl.style.paddingTop = '0px';
      wallEl.style.height = `${f1(listEl.offsetTop + listEl.offsetHeight)}px`;
    }
    return placed;
  }
  function relayout() {
    arrange().forEach(([t, x, y]) => gsap.set(t.li, { x, y }));
    refreshSoon();
  }
  let rf;
  const refreshSoon = () => { clearTimeout(rf); rf = setTimeout(() => { lenis.resize?.(); ScrollTrigger.refresh(); }, 90); };

  // the wall rehung: what stays moves to its new place, what goes comes down, what is new goes up
  function hang(list, { animate = false } = {}) {
    const was = new Set(shown.map((pc) => pc.key)), next = new Set(list.map((pc) => pc.key));
    const going = shown.filter((pc) => !next.has(pc.key)).map((pc) => tiles.get(pc.key));
    shown = list;
    going.forEach((t) => { t.on = false; t.li.classList.remove('is-theirs'); });
    list.forEach((pc) => {
      const t = tileFor(pc);
      gsap.killTweensOf(t.li);
      t.on = true;
      tilesEl.append(t.li); // in the order it is hung, for the keyboard
      if (!was.has(pc.key)) {
        t.signed = false;
        unsign(t.sig);
        near?.observe(t.li);
        seen?.observe(t.li);
      }
    });
    const placed = arrange();
    if (!animate || reduced) {
      going.forEach((t) => t.li.remove());
      placed.forEach(([t, x, y]) => gsap.set(t.li, { x, y, opacity: 1, scale: 1 }));
    } else {
      going.forEach((t) => gsap.to(t.li, { opacity: 0, scale: 0.96, duration: 0.3, ease: 'power2.in', onComplete: () => { if (!t.on) t.li.remove(); } }));
      const fresh = placed.filter(([t]) => !was.has(t.pc.key)), top = Math.min(...fresh.map(([, , y]) => y));
      placed.forEach(([t, x, y]) => {
        if (was.has(t.pc.key)) gsap.to(t.li, { x, y, opacity: 1, scale: 1, duration: 0.85, ease: 'power3.inOut', delay: 0.12 });
        else gsap.fromTo(t.li, { x, y: y + 28, opacity: 0, scale: 1 }, { y, opacity: 1, duration: 0.8, ease: 'expo', delay: 0.32 + Math.min(0.6, ((y - top) / 1400) * 0.6) + x / 5000 });
      });
    }
    if (!io) list.forEach((pc) => { const t = tiles.get(pc.key); paint(t); t.signed = true; });
    if (view === 'index') { buildList(); arrange(); }
    tally();
    refreshSoon();
    paintSoon();
  }
  function tally() {
    moreRow.hidden = ai >= 0;
    moreBtn.hidden = shown.length >= EVERY.length;
    shownEl.textContent = shown.length >= EVERY.length ? `All ${EVERY.length} artists` : `${shown.length} of ${EVERY.length} artists`;
  }
  moreBtn.addEventListener('click', () => {
    limit = Math.min(EVERY.length, limit + PAGE(narrow));
    hang(EVERY.slice(0, limit), { animate: true });
    // more makers on the line; the writing stays as it is
    buildRiders();
    caption();
    place();
  });

  // ---- the same work as an index: a line each, its print following the cursor down the list
  // (on a phone, beside each line instead)

  const listEl = $('.cc-list', wallEl), peek = $('.cc-peek', sheet), peekMat = $('.cc-peek-mat', peek), peekImg = $('img', peek);
  const viewBtns = $$('.cc-view [data-view]', section);
  let view = 'wall';
  function buildList() {
    listEl.textContent = '';
    shown.forEach((pc, n) => {
      const t = tiles.get(pc.key), li = el('li', 'cc-row'), b = el('button', 'cc-row-btn'), th = el('img', 'cc-row-pic');
      b.type = 'button';
      th.alt = '';
      th.decoding = 'async';
      b.append(el('span', 'cc-row-n', pad2(n + 1)), th, el('span', 'cc-row-t', pc.w.title), el('span', 'cc-row-m', pc.p.name), el('span', 'cc-row-k', `${pc.w.kind} · ${domainOf(pc.p).name}`));
      b.style.setProperty('--dc', COLOR[pc.p.art]);
      li.append(b);
      listEl.append(li);
      paint(t);
      const pic = () => { if (t.img.src) th.src = t.img.src; else setTimeout(pic, 200); };
      pic();
      b.addEventListener('click', () => { hidePeek(); openPiece(pc, { from: { art: peekMat, img: peekImg, b } }); });
      b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showPeek(t, e); });
      b.addEventListener('focus', () => lightRider(pc.p, true));
      b.addEventListener('blur', () => lightRider(pc.p, false));
    });
  }
  const peekX = gsap.quickTo(peek, 'x', { duration: 0.55, ease: 'power3' });
  const peekY = gsap.quickTo(peek, 'y', { duration: 0.55, ease: 'power3' });
  const peekR = gsap.quickTo(peek, 'rotation', { duration: 0.8, ease: 'power3' });
  let lastX = 0, still;
  function showPeek(t, e) {
    const w = t.pc.ratio >= 1 ? 300 : 230;
    peekMat.style.width = `${w}px`;
    peekImg.style.aspectRatio = String(t.pc.ratio);
    if (t.img.src) peekImg.src = t.img.src;
    if (!peek.classList.contains('is-on')) { gsap.set(peek, { x: e.clientX, y: e.clientY }); lastX = e.clientX; }
    peek.classList.add('is-on');
    lightRider(t.pc.p, true);
    listEl.classList.add('is-peeking');
    $$('.cc-row', listEl).forEach((r) => r.classList.toggle('is-on', r.contains(e.target)));
  }
  function hidePeek() {
    peek.classList.remove('is-on');
    listEl.classList.remove('is-peeking');
    $$('.cc-row.is-on', listEl).forEach((r) => r.classList.remove('is-on'));
    shown.forEach((pc) => lightRider(pc.p, false));
  }
  listEl.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    peekX(e.clientX);
    peekY(e.clientY);
    // it swings a little with the way the cursor is going
    peekR(clamp((e.clientX - lastX) * 0.6, -9, 9));
    lastX = e.clientX;
    // and hangs straight again once the cursor rests
    clearTimeout(still);
    still = setTimeout(() => peekR(0), 120);
  });
  listEl.addEventListener('pointerleave', hidePeek);
  addEventListener('scroll', () => { if (peek.classList.contains('is-on')) hidePeek(); }, { passive: true });
  function setView(v) {
    if (v === view) return;
    view = v;
    viewBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === v)));
    wallEl.classList.toggle('is-index', v === 'index');
    listEl.hidden = v !== 'index';
    if (v === 'index') buildList();
    hidePeek();
    relayout();
    const items = v === 'index' ? $$('.cc-row', listEl) : shown.map((pc) => tiles.get(pc.key).b);
    if (!reduced) gsap.fromTo(items.slice(0, 16), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, ease: 'expo', stagger: 0.03, clearProps: 'opacity,transform' });
  }
  viewBtns.forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

  // a domain pulled out, or put back
  function choose(i) {
    if (roomOn) return;
    const from = i >= 0 ? items[i] : allTab;
    ai = i;
    paintIndex(true, from);
    fillLabel();
    hang(i < 0 ? EVERY.slice(0, limit) : ofDomain(ARTS[i]), { animate: true });
    rewrite(true);
  }

  // ---------------------------------------------------------------- the signature, under the wall

  // the ink's weight for a size of hand
  const inkW = (xh) => clamp(xh * 0.052, 2.4, 4.4);

  function layoutInk() {
    W = band.clientWidth; H = band.clientHeight;
    if (W < 160 || H < 160) return; // not laid out yet: the fonts, or a resize, will call again
    const a = ARTS[ai], runs = writtenAs(a, narrow), n = runs.length;
    const units = Math.max(...runs.map((t) => unitsOf(t, HAND.track))) + 0.5; // and the slant's reach
    // the signature field, inset from the sheet's edges
    const m = narrow ? 14 : 48;
    const fx = m, fy = narrow ? 10 : 18, fw = W - 2 * m, fh = H - fy - (narrow ? 14 : 24);
    // the name, sized to sit in it: about two thirds of its width, its loops clear of its edges
    const tall = 2.05 + (n - 1) * GAP + 1.55;
    const xh = narrow
      ? Math.min(46, (fw * 0.82) / units, (fh - 70) / tall)
      : Math.min(84, (fw * 0.64) / units, (fh - 90) / tall);
    const y0 = fy + (fh - tall * xh) / 2 + 2.05 * xh - (narrow ? 0 : 6);
    const x0 = fx + (fw - (units - 0.5) * xh) / 2;
    const cx = fx + (narrow ? 18 : 28); // the cross, where the pen starts
    geo = write(runs, { xh, ...HAND, leadIn: Math.max(0.4, (x0 - cx - 6) / xh), gap: GAP });
    for (let i = 0; i <= geo.N; i++) { geo.pts[i * 2] += x0; geo.pts[i * 2 + 1] += y0; }
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    field.setAttribute('x', fx); field.setAttribute('y', f1(fy));
    field.setAttribute('width', fw); field.setAttribute('height', f1(fh));
    inkG.setAttribute('transform', `translate(${f1(x0)} ${f1(y0)})`);
    // the outline is built in place, then moved back to the group's own frame
    const own = { ...geo, pts: geo.pts.map((v, i) => v - (i % 2 ? y0 : x0)) };
    ink.setAttribute('d', inkOutline(own, { width: inkW(xh) }));
    penPath.setAttribute('d', geo.d);
    penPath.style.strokeWidth = f1(inkW(xh) * 3);
    liftG.innerHTML = geo.lifts.map((d) => `<path pathLength="1" d="${d}"/>`).join('');
    liftG.style.strokeWidth = (inkW(xh) * 0.85).toFixed(2);
    // the ruled lines, inside the field; on a phone only the x-height and baseline
    const r0 = fx + 16, r1 = fx + fw - 16;
    let r = '';
    for (let k = 0; k < n; k++) {
      const yb = y0 + k * GAP * xh;
      RULES.forEach(([h, name]) => {
        if (narrow && (h === 2.2 || h === -1.15)) return;
        const yy = yb - h * (h > 1 || h < 0 ? HAND.loops : 1) * xh;
        r += `<path class="cc-rule cc-rule-${name}" d="M${r0} ${f1(yy)}H${r1}"/>`;
        if (!narrow && k === 0) r += `<text class="cc-rule-label" x="${r1 - 2}" y="${f1(yy - 6)}">${name}</text>`;
      });
    }
    rules.innerHTML = r;
    cross.setAttribute('x', cx - 6);
    cross.setAttribute('y', f1(y0 - 8));
    under.style.left = `${fx + 18}px`;
    under.style.width = `${fw - 36}px`; // it wraps within the field rather than run past it
    under.style.top = `${f1(fy + fh - (narrow ? 40 : 30))}px`;
  }
  // the makers of what is on the wall
  function makers() {
    if (ai >= 0) return ARTISTS.filter((p) => p.art === ARTS[ai].id);
    const had = new Set();
    return shown.map((pc) => pc.p).filter((p) => !had.has(p) && had.add(p));
  }
  function buildRiders() {
    const people = makers();
    ridersEl.textContent = '';
    hover = null;
    riders = people.map((p) => {
      const li = el('li', 'cc-rider');
      const b = el('button', 'cc-rider-btn');
      b.type = 'button';
      b.setAttribute('aria-label', `${p.name}, ${ONE[p.kind].toLowerCase()}, ${p.city}`);
      const img = el('img', 'cc-rider-pic');
      img.alt = '';
      img.decoding = 'async';
      img.src = portrait(p);
      b.append(img, el('span', 'cc-rider-name', p.name));
      b.addEventListener('click', () => openPerson(p, { from: img }));
      const reach = (on) => { hover = on ? p : hover === p ? null : hover; pick(p, on); };
      b.addEventListener('pointerenter', () => reach(true));
      b.addEventListener('pointerleave', () => reach(false));
      b.addEventListener('focus', () => reach(true));
      b.addEventListener('blur', () => reach(false));
      li.append(b);
      ridersEl.append(li);
      return { p, li, b, img, o: -1 };
    });
  }
  // a maker reached for on the line: their work on the wall lights up, the rest steps back
  function pick(p, on) {
    wallEl.classList.toggle('is-picking', on);
    shown.forEach((pc) => tiles.get(pc.key).li.classList.toggle('is-theirs', on && pc.p === p));
  }
  const lightRider = (p, on) => riders.find((r) => r.p === p)?.b.classList.toggle('is-lit', on);
  function caption() {
    const n = riders.length, a = ARTS[ai];
    under.textContent = a
      ? `${a.name}, in its artists’ own hand · ${pad2(n)} ${n === 1 ? 'artist' : 'artists'}`
      : `The makers of the work above, in their own hand · ${pad2(n)} artists`;
  }

  // the ride: evenly spaced, never closer than a few hands apart. With more makers than the line
  // holds at that spacing, they come onto it at the cross in turn and leave at the flick, so
  // everyone has their turn and nobody is ahead of anyone.
  const ride = () => Math.max(geo.total, riders.length * (narrow ? 300 : 420));
  function place() {
    if (!geo) return;
    const n = riders.length, T = geo.total, L = ride(), v = drawn.v * T;
    riders.forEach((r, i) => {
      const s = (off + (i / n) * L) % L;
      if (s > T) { // waiting their turn
        if (r.o !== 0) { r.o = 0; r.li.style.opacity = 0; r.li.style.visibility = 'hidden'; }
        return;
      }
      const [x, y] = at(geo, s);
      r.li.style.transform = `translate3d(${f1(x)}px, ${f1(y)}px, 0)`;
      // a rider shows once the pen has written as far as them, and eases in and out at the line's ends
      const o = clamp((v - s) / 140, 0, 1) * clamp(s / 90, 0, 1) * clamp((T - s) / 90, 0, 1);
      if (o !== r.o) { r.o = o; r.li.style.opacity = o.toFixed(3); r.li.style.visibility = o > 0 ? '' : 'hidden'; }
    });
  }
  const applyDraw = () => {
    penPath.style.strokeDashoffset = (1 - drawn.v).toFixed(4);
    const L = $$('path', liftG);
    L.forEach((p, i) => { p.style.strokeDashoffset = (1 - clamp(lifted.v * L.length - i, 0, 1)).toFixed(3); });
    place();
  };
  // the pen writes at a hand's pace, then goes back for the dots and crosses
  const penTime = () => (geo ? clamp(geo.total / 1000, 1.8, 3.6) : 2);

  // what is on the wall, written again: at once if the band is in view, otherwise as it comes in
  let penTl = null, armed = false;
  const bandInView = () => { const r = band.getBoundingClientRect(); return r.top < innerHeight * 0.85 && r.bottom > 0; };
  function begin(delay = 0) {
    if (!armed) return;
    armed = false;
    penTl = gsap.timeline({ delay })
      .to(drawn, { v: 1, duration: penTime(), ease: 'power1.inOut', onUpdate: applyDraw })
      .to(lifted, { v: 1, duration: 0.5, ease: 'none', onUpdate: applyDraw });
  }
  function rewrite(animate) {
    const go = () => {
      layoutInk();
      buildRiders();
      caption();
      penTl?.kill();
      if (!animate || reduced) { armed = false; drawn.v = 1; lifted.v = 1; applyDraw(); return; }
      drawn.v = 0; lifted.v = 0;
      applyDraw();
      armed = true;
      if (bandInView()) begin(0.15);
    };
    if (animate && !reduced && bandInView()) {
      gsap.to([svg, ridersEl, under], { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => { go(); gsap.to([svg, ridersEl, under], { opacity: 1, duration: 0.3 }); } });
    } else go();
  }
  ScrollTrigger.create({
    trigger: band, start: 'top 85%', end: 'bottom top',
    onEnter: () => begin(), onEnterBack: () => begin(), onUpdate: (s) => { if (s.isActive) begin(); }, onRefresh: (s) => { if (s.isActive) begin(); },
  });

  // ---------------------------------------------------------------- the motion

  band.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') inside = true; });
  band.addEventListener('pointerleave', () => { inside = false; });
  const base = () => (reduced ? 0 : narrow ? 15 : 22); // px a second, along the line: an unhurried ride
  gsap.ticker.add((t, dms) => {
    if (!active || !geo || roomOn) return;
    const dt = Math.min(0.05, dms / 1000);
    const target = hover ? 0 : inside ? base() * 0.3 : base();
    speed += (target - speed) * Math.min(1, dt * 3);
    if (Math.abs(speed) < 0.01 && !target) return;
    off = (off + speed * dt) % ride();
    place();
  });
  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (s) => { active = s.isActive; } });

  // ---------------------------------------------------------------- a piece, opened

  const onScreen = (e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };
  const D = () => (reduced ? 0.01 : 1);
  function enter(hash, push) {
    settle();
    if (push) { history.pushState({ cc: 1 }, '', hash); pushed = true; } else history.replaceState(history.state, '', hash);
    roomOn = true;
    room.hidden = false;
    gsap.set(room, { opacity: 1 });
    lenis.stop();
    root.classList.add('cc-open');
    roomScroll.scrollTop = 0;
    hover = null;
    pick(null, false);
    const d = D();
    gsap.fromTo(roomBg, { opacity: 0 }, { opacity: 1, duration: 0.5 * d, ease: 'power2.out' });
    gsap.fromTo($('.cc-room-bar', room), { opacity: 0 }, { opacity: 1, duration: 0.5 * d, delay: 0.4 * d });
  }
  const setHash = (h) => history.replaceState(history.state, '', h);

  // the picture flies from one place to another, the same size of thing all the way
  function fly(src, from, to, { round = false, onDone } = {}) {
    flyer.src = src;
    flyer.classList.toggle('is-round', round);
    Object.assign(flyer.style, { width: `${to.width}px`, height: `${to.height}px` });
    flyer.hidden = false;
    gsap.fromTo(flyer, { x: from.left, y: from.top, scale: from.width / to.width }, {
      x: to.left, y: to.top, scale: 1, duration: 0.9, ease: 'power3.inOut',
      onComplete: () => { onDone?.(); },
    });
  }

  // the room's picture, as large as the room allows, on its mat, with its tools under it (on the
  // whole screen, as large as the screen allows)
  const isFull = () => room.classList.contains('is-full');
  function fitPiece() {
    if (!cur) return;
    const r = cur.ratio, side = narrow ? 9 : 14, foot = narrow ? 38 : 48, tools = 58;
    const AW = pcFig.clientWidth, AH = narrow && !isFull() ? innerHeight * 0.56 : pcFig.clientHeight - tools;
    const iw = Math.max(80, Math.min(AW - 2 * side, (AH - side - foot) * r));
    pcImg.style.width = `${f1(iw)}px`;
    pcImg.style.height = `${f1(iw / r)}px`;
    $('.cc-tools', pieceEl).style.width = `${pcMat.offsetWidth}px`; // under the piece, to its right edge
    applyZoom(true);
  }
  // what a piece is: what kind of thing, in which domain, and whether it can be bought, for how much
  const rupees = (n) => `₹${Math.round(n).toLocaleString('en-IN')}`;
  function fillPiece(pc) {
    const { p, w } = pc;
    const sale = FOR_SALE[pc.key];
    $('.cc-pc-name', pieceEl).textContent = w.title;
    $('.cc-pc-year', pieceEl).textContent = w.year;
    const tags = $('.cc-pc-tags', pieceEl);
    tags.textContent = '';
    if (sale) tags.append(el('span', `cc-tag is-${sale.status}`, sale.status === 'sold' ? 'Sold' : 'Available'));
    tags.append(el('span', 'cc-tag', w.kind), el('span', 'cc-tag', domainOf(p).name));
    const price = $('.cc-pc-price', pieceEl), forSale = sale?.status === 'available';
    price.hidden = !forSale;
    price.textContent = '';
    if (forSale) {
      if (sale.price) price.append(el('span', 'cc-price-n', rupees(sale.price)), el('span', 'cc-price-note', '(excludes shipping and taxes)'));
      else price.append(el('span', 'cc-price-n is-ask', 'Price on request'));
    }
    $('.cc-enquire', pieceEl).hidden = !forSale;
    actBtn('save').setAttribute('aria-pressed', String(saved.has(pc.key)));
    actBtn('save').setAttribute('aria-label', saved.has(pc.key) ? 'Saved' : 'Save');
    actBtn('like').setAttribute('aria-pressed', String(liked.has(pc.key)));
    actBtn('like').setAttribute('aria-label', liked.has(pc.key) ? 'Liked' : 'Like');
    menu(false);
    resetZoom();
    makerPic.src = portrait(p);
    $('.cc-maker-name', pieceEl).textContent = p.name;
    $('.cc-maker-role', pieceEl).textContent = `${ONE[p.kind]}, ${p.city}`;
    $('.cc-maker', pieceEl).setAttribute('aria-label', `${p.name}, ${ONE[p.kind].toLowerCase()}: see all their work`);
    $('.cc-pc-line', pieceEl).textContent = p.line;
    $('.cc-hire', pieceEl).textContent = `Hire ${first(p)}`;
    $('.cc-their-work', pieceEl).textContent = `All of ${first(p)}’s work`;
    const k = seq.indexOf(pc);
    $('.cc-count', pieceEl).textContent = `${k + 1} of ${seq.length}`;
    $('.cc-steps', pieceEl).hidden = seq.length < 2;
    sigInto(pcSig, p, narrow ? 10 : 13);
    unsign(pcSig);
    // the picture already on the wall first, then the large one when it is drawn
    const t = homeOf(pc);
    pcImg.alt = '';
    if (t?.img.src) pcImg.src = t.img.src; else pcImg.removeAttribute('src');
    workArt(p, pc.i, BIG_W(pc.ratio)).then((url) => {
      if (cur !== pc) return;
      pcImg.src = url;
      pcImg.alt = `${w.title}, by ${p.name}`;
    });
  }
  // from: where on the page it was opened from (a pick, or its tile on the wall)
  function openPiece(pc, { push = true, seq: within, from } = {}) {
    const fresh = !roomOn;
    if (fresh) enter(`#work/${pc.p.slug}/${pc.i + 1}`, push); else setHash(`#work/${pc.p.slug}/${pc.i + 1}`);
    // what Previous and Next walk through: the picks, the wall, or the maker's own work
    seq = within || (shown.includes(pc) ? shown : theirWork(pc.p));
    const t = from || homeOf(pc);
    if (fresh) returnTo = t?.b || null;
    mode = 'piece';
    cur = pc;
    fillPiece(pc);
    personEl.hidden = true;
    pieceEl.hidden = false;
    savedEl.hidden = true;
    backBtn.hidden = true;
    counts();
    fitPiece();
    const d = D(), parts = $$('.cc-pc-text > *', pieceEl);
    gsap.killTweensOf([pcMat, ...parts]);
    if (fresh) {
      gsap.fromTo(parts, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 * d, ease: 'expo', stagger: 0.05 * d, delay: 0.4 * d });
      // it comes forward off the wall; its mat comes up round it as it lands
      if (t?.img.src && onScreen(t.art) && !reduced) {
        gsap.set(pcMat, { opacity: 0, y: 0 });
        fly(t.img.src, t.art.getBoundingClientRect(), pcImg.getBoundingClientRect(), {
          onDone: () => gsap.to(pcMat, { opacity: 1, duration: 0.3, onComplete: () => { flyer.hidden = true; } }),
        });
      } else gsap.fromTo(pcMat, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7 * d, ease: 'expo' });
      signIt(pcSig, { delay: 1 * d });
    } else {
      // from another piece, or from the maker's page: the room stays, what is in it changes
      flyer.hidden = true;
      gsap.fromTo([pcMat, ...parts], { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.55 * d, ease: 'expo', stagger: 0.03 * d });
      signIt(pcSig, { delay: 0.35 * d });
    }
    $('.cc-pc-title', pieceEl).focus({ preventScroll: true });
  }
  function step(dir) {
    if (mode !== 'piece' || seq.length < 2) return;
    const k = seq.indexOf(cur);
    openPiece(seq[(k + dir + seq.length) % seq.length], { seq });
  }

  // ---------------------------------------------------------------- a closer look
  // The buttons under the piece (and + and −) zoom it in and out; so does a pinch, or a double
  // click or tap on the point you want. Drag to look round it while it is close. The whole screen
  // gives the piece the room to itself (and the browser's own full screen, where there is one).
  // Close up, the piece is drawn again larger, so it stays sharp.

  const Z = { z: 1, x: 0, y: 0 };
  const ZMAX = 4;
  let sharp = null;
  function zoomState() {
    pieceEl.classList.toggle('is-close', Z.z > 1.01);
    toolBtn('out').disabled = Z.z <= 1.01;
    toolBtn('in').disabled = Z.z >= ZMAX - 0.01;
  }
  function applyZoom(now) {
    // no edge of the picture comes in past the edge of its frame
    const mx = (pcFrame.clientWidth * (Z.z - 1)) / 2, my = (pcFrame.clientHeight * (Z.z - 1)) / 2;
    Z.x = clamp(Z.x, -mx, mx);
    Z.y = clamp(Z.y, -my, my);
    gsap.to(pcImg, { x: Z.x, y: Z.y, scale: Z.z, duration: now || reduced ? 0 : 0.55, ease: 'expo.out', overwrite: true });
    zoomState();
    if (Z.z > 1.2 && cur && sharp !== cur) {
      const pc = (sharp = cur);
      workArt(pc.p, pc.i, Math.min(2600, BIG_W(pc.ratio) * 2.4)).then((u) => { if (cur === pc) pcImg.src = u; });
    }
  }
  // to zoom z, keeping the point (px, py) of the frame, from its centre, where it is
  function zoomTo(z, px = 0, py = 0, now) {
    z = clamp(z, 1, ZMAX);
    const k = z / Z.z;
    Z.x = px - (px - Z.x) * k;
    Z.y = py - (py - Z.y) * k;
    Z.z = z;
    if (z === 1) { Z.x = 0; Z.y = 0; }
    applyZoom(now);
  }
  function resetZoom() {
    Z.z = 1; Z.x = 0; Z.y = 0;
    sharp = null;
    gsap.killTweensOf(pcImg);
    gsap.set(pcImg, { clearProps: 'transform' });
    zoomState();
  }
  const fromCentre = (e) => { const r = pcFrame.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
  const touches = new Map();
  let pan = null, pinch = null, lastTap = 0, downAt = null;
  pcFrame.addEventListener('pointerdown', (e) => {
    touches.set(e.pointerId, fromCentre(e));
    pcFrame.setPointerCapture?.(e.pointerId);
    downAt = { x: e.clientX, y: e.clientY, t: performance.now() };
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1, z: Z.z, c: [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2] };
      pan = null;
    } else if (Z.z > 1.01) pan = { x: e.clientX, y: e.clientY, tx: Z.x, ty: Z.y };
  });
  pcFrame.addEventListener('pointermove', (e) => {
    if (!touches.has(e.pointerId)) return;
    touches.set(e.pointerId, fromCentre(e));
    if (pinch && touches.size === 2) {
      const [a, b] = [...touches.values()];
      zoomTo((pinch.z * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch.d, pinch.c[0], pinch.c[1], true);
    } else if (pan) {
      Z.x = pan.tx + e.clientX - pan.x;
      Z.y = pan.ty + e.clientY - pan.y;
      applyZoom(true);
    }
  });
  const lift = (e) => {
    touches.delete(e.pointerId);
    if (touches.size < 2) pinch = null;
    if (touches.size) return;
    pan = null;
    // a double tap (a double click is heard below) zooms in on the point, or back out
    if (e.pointerType === 'touch' && downAt && Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 8 && performance.now() - downAt.t < 300) {
      if (performance.now() - lastTap < 320) { const [x, y] = fromCentre(e); zoomTo(Z.z > 1.01 ? 1 : 2.5, x, y); lastTap = 0; } else lastTap = performance.now();
    }
  };
  pcFrame.addEventListener('pointerup', lift);
  pcFrame.addEventListener('pointercancel', lift);
  pcFrame.addEventListener('dblclick', (e) => { const [x, y] = fromCentre(e); zoomTo(Z.z > 1.01 ? 1 : 2.5, x, y); });
  // a trackpad's pinch zooms; while it is close, scrolling looks round it
  pcFrame.addEventListener('wheel', (e) => {
    if (!e.ctrlKey && Z.z <= 1.01) return;
    e.preventDefault();
    if (e.ctrlKey) { const [x, y] = fromCentre(e); zoomTo(Z.z * Math.exp(-e.deltaY * 0.012), x, y, true); } else { Z.x -= e.deltaX; Z.y -= e.deltaY; applyZoom(true); }
  }, { passive: false });
  function full(on) {
    if (on === isFull()) return;
    room.classList.toggle('is-full', on);
    toolBtn('full').setAttribute('aria-label', on ? 'Leave full screen' : 'See it full screen');
    if (on && room.requestFullscreen && !document.fullscreenElement) room.requestFullscreen().catch(() => {});
    if (!on && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    resetZoom();
    requestAnimationFrame(fitPiece);
  }
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement && isFull()) full(false); else requestAnimationFrame(fitPiece); });
  toolBtn('in').addEventListener('click', () => zoomTo(Z.z * 1.6));
  toolBtn('out').addEventListener('click', () => zoomTo(Z.z / 1.6));
  toolBtn('full').addEventListener('click', () => full(!isFull()));

  // ---------------------------------------------------------------- sharing it
  // On a phone, the phone's own way of sharing. Elsewhere a short menu: copy the link (its own
  // address, which opens straight to it), WhatsApp or email.

  const linkTo = (pc) => `${location.origin}${location.pathname}#work/${pc.p.slug}/${pc.i + 1}`;
  const nameOf = (pc) => `${pc.w.title}, by ${pc.p.name}`;
  async function copy(text) {
    try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
    const t = el('textarea');
    t.value = text;
    t.setAttribute('readonly', '');
    Object.assign(t.style, { position: 'fixed', opacity: '0' });
    document.body.append(t);
    t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) {}
    t.remove();
    return ok;
  }
  function menu(on) {
    shareMenu.hidden = !on;
    actBtn('share').setAttribute('aria-expanded', String(on));
    if (!on || !cur) return;
    const url = linkTo(cur), name = nameOf(cur);
    $('[data-share="whatsapp"]', shareMenu).href = `https://wa.me/?text=${encodeURIComponent(`${name}: ${url}`)}`;
    $('[data-share="email"]', shareMenu).href = `mailto:?subject=${encodeURIComponent(name)}&body=${encodeURIComponent(`${name}, in the Metamorph Creative Corner:\n${url}`)}`;
    $('[role="menuitem"]', shareMenu).focus();
  }
  actBtn('share').addEventListener('click', () => {
    if (isTouch && navigator.share) {
      navigator.share({ title: nameOf(cur), text: `${nameOf(cur)}, in the Metamorph Creative Corner`, url: linkTo(cur) }).catch(() => {});
    } else menu(shareMenu.hidden);
  });
  $('[data-share="copy"]', shareMenu).addEventListener('click', async () => {
    const ok = await copy(linkTo(cur));
    say(ok ? 'Link copied. It opens straight to this piece.' : 'The link couldn’t be copied.');
    menu(false);
    actBtn('share').focus();
  });
  $$('a[role="menuitem"]', shareMenu).forEach((a) => a.addEventListener('click', () => menu(false)));
  document.addEventListener('pointerdown', (e) => { if (!shareMenu.hidden && !e.target.closest('.cc-share, [data-act="share"]')) menu(false); });

  // ---------------------------------------------------------------- saved and liked
  // There is no account yet, so both are kept in this browser. Saved is a collection you come back
  // to (Saved, at the top of the room and at the foot of the page); a like is just yours for now.

  const byKey = (k) => {
    const m = /^([a-z0-9-]+)\/(\d+)$/.exec(k), p = m && ARTISTS.find((q) => q.slug === m[1]);
    return p?.works[+m[2] - 1] ? piece(p, +m[2] - 1) : null;
  };
  function kept(name) {
    let keys = [];
    try { keys = JSON.parse(localStorage.getItem(name) || '[]').filter(byKey); } catch (e) {}
    const set = new Set(keys);
    const store = () => { try { localStorage.setItem(name, JSON.stringify([...set])); } catch (e) {} };
    return {
      has: (k) => set.has(k),
      toggle(k) { if (set.has(k)) set.delete(k); else set.add(k); store(); return set.has(k); },
      remove(k) { set.delete(k); store(); },
      get list() { return [...set]; },
      get size() { return set.size; },
    };
  }
  const saved = kept('mm-saved'), liked = kept('mm-liked');
  function counts() {
    $$('.cc-saved-n', section).forEach((e) => { e.textContent = saved.size; });
    savedBtn.hidden = !saved.size || mode === 'saved';
    chip.hidden = !saved.size;
  }
  actBtn('save').addEventListener('click', () => {
    const on = saved.toggle(cur.key);
    actBtn('save').setAttribute('aria-pressed', String(on));
    actBtn('save').setAttribute('aria-label', on ? 'Saved' : 'Save');
    counts();
    say(on ? 'Saved. You’ll find it under Saved.' : 'Taken out of Saved.');
  });
  actBtn('like').addEventListener('click', () => {
    const on = liked.toggle(cur.key);
    actBtn('like').setAttribute('aria-pressed', String(on));
    actBtn('like').setAttribute('aria-label', on ? 'Liked' : 'Like');
    if (on && !reduced) gsap.fromTo($('svg', actBtn('like')), { scale: 0.8 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' });
  });

  // what you have saved, newest first: open one to walk through them, or take it out
  function fillSaved() {
    const list = $('.cc-s-list', savedEl), pcs = saved.list.map(byKey).filter(Boolean).reverse();
    list.textContent = '';
    $('.cc-s-empty', savedEl).hidden = pcs.length > 0;
    pcs.forEach((pc) => {
      const li = el('li', 'cc-work');
      li.style.setProperty('--r', pc.ratio.toFixed(3));
      const b = el('button', 'cc-work-btn');
      b.type = 'button';
      b.setAttribute('aria-label', `${pc.w.title}, by ${pc.p.name}`);
      const img = el('img');
      img.alt = '';
      img.decoding = 'async';
      img.style.aspectRatio = String(pc.ratio);
      workArt(pc.p, pc.i, ART_W).then((u) => { img.src = u; });
      b.append(img, el('span', 'cc-work-title', pc.w.title), el('span', 'cc-work-meta', `${pc.p.name} · ${pc.w.kind}`));
      b.addEventListener('click', () => openPiece(pc, { seq: pcs }));
      const x = el('button', 'cc-s-remove', 'Remove');
      x.type = 'button';
      x.setAttribute('aria-label', `Take ${pc.w.title} out of Saved`);
      x.addEventListener('click', () => { saved.remove(pc.key); counts(); fillSaved(); });
      li.append(b, x);
      list.append(li);
    });
  }
  function openSaved({ push = true } = {}) {
    const fresh = !roomOn;
    if (fresh) { returnTo = document.activeElement; enter('#saved', push); } else setHash('#saved');
    cameFrom = !fresh && mode === 'piece' ? cur : null;
    cameSeq = cameFrom ? seq : null;
    full(false);
    menu(false);
    mode = 'saved';
    fillSaved();
    pieceEl.hidden = true;
    personEl.hidden = true;
    savedEl.hidden = false;
    backBtn.hidden = !cameFrom;
    if (cameFrom) backBtn.textContent = `Back to ${cameFrom.w.title}`;
    flyer.hidden = true;
    roomScroll.scrollTop = 0;
    counts();
    const d = D();
    gsap.fromTo($$('.cc-s-text > *, .cc-s-list, .cc-s-empty', savedEl), { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 * d, ease: 'expo', stagger: 0.05 * d, delay: (fresh ? 0.35 : 0.1) * d });
    $('.cc-s-title', savedEl).focus({ preventScroll: true });
  }
  savedBtn.addEventListener('click', () => openSaved());
  chip.addEventListener('click', () => openSaved());
  counts();

  // ---------------------------------------------------------------- its maker, opened: signed in the same hand

  function signName(p, delay) {
    const xh = narrow ? 20 : 27;
    const g = write(signedAs(p), { xh, ...HAND, leadIn: 0.9 });
    const x0 = -1.2 * xh, y0 = -2.2 * xh, w = g.width + 2.6 * xh, h = 3.9 * xh;
    pSign.setAttribute('viewBox', `${f1(x0)} ${f1(y0)} ${f1(w)} ${f1(h)}`);
    pSign.style.width = `${w.toFixed(0)}px`;
    pSign.style.height = `${h.toFixed(0)}px`;
    const iw = inkW(xh) * 0.85;
    pSign.innerHTML = `<defs><mask id="cc-pen-p" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="12000" height="12000"><path class="cc-pen" pathLength="1" d="${g.d}" style="stroke-width:${f1(iw * 3)}"/></mask></defs>`
      + `<path class="cc-p-rule" d="M${f1(x0)} 0H${f1(x0 + w)}"/><path class="cc-p-ink" d="${inkOutline(g, { width: iw, land: 24, lift: 50 })}" mask="url(#cc-pen-p)"/>`
      + g.lifts.map((d) => `<path class="cc-p-lift" pathLength="1" d="${d}" style="stroke-width:${(iw * 0.85).toFixed(2)}"/>`).join('');
    const main = $('.cc-pen', pSign), lifts = $$('.cc-p-lift', pSign);
    if (reduced) { main.style.strokeDashoffset = 0; lifts.forEach((q) => { q.style.strokeDashoffset = 0; }); return; }
    gsap.timeline({ delay })
      .fromTo(main, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: clamp(g.total / 700, 1, 2.2), ease: 'power1.inOut' })
      .fromTo(lifts, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.18, stagger: 0.12, ease: 'none' });
  }
  function fillPerson(p) {
    $('.cc-p-meta', personEl).textContent = `${ONE[p.kind]} · ${p.city}`;
    $('.cc-p-name', personEl).textContent = p.name;
    $('.cc-p-line', personEl).textContent = p.line;
    $('.cc-hire', personEl).textContent = `Hire ${first(p)}`;
    pPhoto.src = portrait(p);
    const ul = $('.cc-works ul', personEl), theirs = theirWork(p);
    ul.textContent = '';
    theirs.forEach((pc) => {
      const li = el('li', 'cc-work');
      li.style.setProperty('--r', pc.ratio.toFixed(3));
      const b = el('button', 'cc-work-btn');
      b.type = 'button';
      b.setAttribute('aria-label', `${pc.w.title}, ${pc.w.kind.toLowerCase()}, ${pc.w.year}`);
      const img = el('img');
      img.alt = '';
      img.decoding = 'async';
      img.style.aspectRatio = String(pc.ratio);
      workArt(p, pc.i, ART_W).then((u) => { img.src = u; });
      b.append(img, el('span', 'cc-work-title', pc.w.title), el('span', 'cc-work-meta', `${pc.w.kind} · ${pc.w.year}`));
      b.addEventListener('click', () => openPiece(pc, { seq: theirs }));
      li.append(b);
      ul.append(li);
    });
  }
  // from: the picture they come forward from (their place on the line, or beside their piece)
  function openPerson(p, { push = true, from = null } = {}) {
    const fresh = !roomOn;
    const fromRect = from && onScreen(from) ? from.getBoundingClientRect() : null;
    if (fresh) { enter(`#artist/${p.slug}`, push); returnTo = from?.closest('button') || null; } else setHash(`#artist/${p.slug}`);
    cameFrom = !fresh && mode === 'piece' ? cur : null;
    cameSeq = cameFrom ? seq : null;
    mode = 'person';
    fillPerson(p);
    pieceEl.hidden = true;
    personEl.hidden = false;
    savedEl.hidden = true;
    full(false);
    menu(false);
    counts();
    backBtn.hidden = !cameFrom;
    if (cameFrom) backBtn.textContent = `Back to ${cameFrom.w.title}`;
    flyer.hidden = true;
    roomScroll.scrollTop = 0;
    const d = D(), parts = $$('.cc-p-text > *, .cc-works', personEl);
    gsap.fromTo(parts, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7 * d, ease: 'expo', stagger: 0.05 * d, delay: (fresh ? 0.4 : 0.15) * d });
    // their picture grows out of where it was into their own
    if (fromRect && !reduced) {
      gsap.set(pPhoto, { opacity: 0 });
      fly(pPhoto.src, fromRect, pPhoto.getBoundingClientRect(), { round: true, onDone: () => { gsap.set(pPhoto, { opacity: 1 }); flyer.hidden = true; } });
    } else gsap.fromTo(pPhoto, { opacity: 0 }, { opacity: 1, duration: 0.5 * d });
    signName(p, (fresh ? 0.75 : 0.45) * d);
    $('.cc-p-name', personEl).focus({ preventScroll: true });
  }

  // ---------------------------------------------------------------- leaving the room

  // the browser's Back leaves the room, wherever in it you are: it is one step in the history.
  // The page keeps its own place on the way back (the browser would put it back where it was
  // when the room opened, not where the piece you were last looking at hangs).
  // (ScrollTrigger keeps the browser's setting and puts it back after every refresh, so it is
  // told through ScrollTrigger)
  ScrollTrigger.clearScrollMemory('manual');
  const requestClose = () => { if (pushed) history.back(); else closeRoom(); };
  function closeRoom() {
    if (!roomOn) return;
    if (/^#(work\/|artist\/|saved$)/.test(location.hash)) history.replaceState(history.state, '', location.pathname + location.search);
    pushed = false;
    // the piece at its own size, in the room, before it goes
    menu(false);
    if (isFull()) { room.classList.remove('is-full'); if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); fitPiece(); }
    resetZoom();
    const d = D(), t = mode === 'piece' && cur ? homeOf(cur) : null;
    const done = () => {
      roomOn = false; mode = null; cur = null;
      room.hidden = true;
      flyer.hidden = true;
      gsap.set([pcMat, pPhoto], { clearProps: 'opacity,transform' });
      lenis.start();
      returnTo?.focus({ preventScroll: true });
    };
    root.classList.remove('cc-open');
    const parts = $$('.cc-room-bar, .cc-pc-text > *, .cc-person, .cc-saved', room);
    if (t && !reduced) {
      // back to where it hangs: brought into view if it is not, and flown home
      if (!onScreen(t.art)) lenis.scrollTo(scrollY + t.art.getBoundingClientRect().top - innerHeight * 0.3, { immediate: true, force: true });
      returnTo = t.b;
      const from = pcImg.getBoundingClientRect(), to = t.art.getBoundingClientRect();
      gsap.to(parts, { opacity: 0, duration: 0.25, ease: 'power2.in' });
      gsap.to(pcMat, { opacity: 0, duration: 0.2 });
      gsap.to(roomBg, { opacity: 0, duration: 0.55, delay: 0.2, ease: 'power2.out' });
      flyer.src = pcImg.src;
      flyer.classList.remove('is-round');
      Object.assign(flyer.style, { width: `${from.width}px`, height: `${from.height}px` });
      flyer.hidden = false;
      gsap.fromTo(flyer, { x: from.left, y: from.top, scale: 1 }, {
        x: to.left, y: to.top, scale: to.width / from.width, duration: 0.85, ease: 'power3.inOut',
        onComplete: () => { gsap.set(parts, { clearProps: 'opacity' }); done(); },
      });
    } else {
      gsap.to(room, { opacity: 0, duration: 0.35 * d, ease: 'power2.out', onComplete: () => { gsap.set(parts, { clearProps: 'opacity' }); done(); } });
    }
  }

  closeBtn.addEventListener('click', requestClose);
  backBtn.addEventListener('click', () => { if (cameFrom) openPiece(cameFrom, { seq: cameSeq }); });
  $('.cc-prev', pieceEl).addEventListener('click', () => step(-1));
  $('.cc-next', pieceEl).addEventListener('click', () => step(1));
  $('.cc-maker', pieceEl).addEventListener('click', () => openPerson(cur.p, { from: makerPic }));
  $('.cc-their-work', pieceEl).addEventListener('click', () => openPerson(cur.p, { from: makerPic }));
  // Escape steps back one thing at a time: the share menu, the whole screen, then the room. With a
  // piece open: arrows for the next one (not while it is close up), + and − to zoom, F for the
  // whole screen.
  addEventListener('keydown', (e) => {
    if (!roomOn || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'Escape') {
      if (!shareMenu.hidden) { menu(false); actBtn('share').focus(); } else if (isFull()) full(false); else requestClose();
    } else if (mode !== 'piece') return;
    else if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && Z.z <= 1.01) step(e.key === 'ArrowRight' ? 1 : -1);
    else if (e.key === '+' || e.key === '=') zoomTo(Z.z * 1.6);
    else if (e.key === '-' || e.key === '_') zoomTo(Z.z / 1.6);
    else if (e.key === 'f' || e.key === 'F') full(!isFull());
  });
  // a piece, an artist, or what you have saved, by address: #work/<slug>/<n>, #artist/<slug>, #saved
  const parse = () => {
    if (location.hash === '#saved') return { saved: true };
    let m = location.hash.match(/^#work\/([a-z0-9-]+)\/(\d+)$/);
    if (m) { const p = ARTISTS.find((q) => q.slug === m[1]), i = +m[2] - 1; if (p?.works[i]) return { pc: piece(p, i) }; }
    m = location.hash.match(/^#artist\/([a-z0-9-]+)$/);
    if (m) { const p = ARTISTS.find((q) => q.slug === m[1]); if (p) return { p }; }
    return null;
  };
  addEventListener('popstate', () => {
    const h = parse();
    if (!h && roomOn) { pushed = false; closeRoom(); } else if (h) openAt(h); // (an address typed while the room is open moves it there)
  });
  const openAt = (h) => { if (h.saved) openSaved({ push: false }); else if (h.pc) openPiece(h.pc, { push: false }); else openPerson(h.p, { push: false }); };

  // ---------------------------------------------------------------- the opening: the gallery
  // The picks hung in a gallery (js/corner-museum.js): on a laptop a room you walk round, on a
  // phone one long wall you swipe along. The art of the day, the week and the month, and the six
  // days before, each with a museum label beside it, and nothing else.

  const open = $('.cp-open', section);
  // (11 Nov) the gallery twice, one after the other, for the client to choose between: without
  // visitors, then with them standing before the work
  const open2 = $('.cp-open-2', section);
  // (14 Nov) and the pedestal: the piece on a carved Corinthian capital before a curtain, the
  // metamorphosis hidden in the stone (js/corner-pedestal.js)
  const open3 = $('.cp-open-3', section);
  // (16 Nov) and the branch: the picks resting in the boughs of one driftwood branch (js/corner-branch.js)
  const open4 = $('.cp-open-4', section);
  let picks = [], picked = [], museum = null, museum2 = null, museum3 = null, museum4 = null, wide = null, works = null;
  const hand = () => picks.slice(0, 3); // the day's, the week's, the month's

  // where a piece lives on the page, to fly from and back to: its place in the gallery, or its
  // tile on the wall, whichever is in view
  function homeOf(pc) {
    const t = tiles.get(pc.key);
    const all = [museum?.home(pc), museum2?.home(pc), museum3?.home(pc), museum4?.home(pc), works?.home(pc), t?.on && view === 'wall' && { art: t.art, img: t.img, b: t.b }].filter(Boolean);
    return all.find((h) => onScreen(h.art)) || all[0] || null;
  }
  // a picture whose shape was not given (or not quite), once it is in: fitted by its own shape,
  // never cropped to the one guessed for it
  function trueShape(pc, img) {
    const r = img.naturalWidth / img.naturalHeight;
    if (!r || Math.abs(r - pc.ratio) / pc.ratio < 0.01) return;
    pc.ratio = r;
    museum?.reshape(pc);
    if (tiles.get(pc.key)?.on) relayout();
  }

  // the picks: today's, this week's, this month's, then each of the six days before. Each one's
  // label is its honour (the three only), its title and its maker.
  function buildPicks() {
    const today = midnight(new Date()), monday = mondayOf(today), sunday = addDays(monday, 6);
    const longDay = (d) => fmt(d, { weekday: 'long', day: 'numeric', month: 'long' });
    const sameMonth = monday.getMonth() === sunday.getMonth();
    const weekText = `${fmt(monday, sameMonth ? { day: 'numeric' } : { day: 'numeric', month: 'long' })} to ${fmt(sunday, { day: 'numeric', month: 'long' })}`;
    picks = [
      { pc: dayPick(today), kind: 'day', d: today, when: longDay(today) },
      { pc: weekPick(today), kind: 'week', d: monday, when: weekText },
      { pc: monthPick(today), kind: 'month', d: today, when: fmt(today, { month: 'long', year: 'numeric' }) },
    ];
    for (let n = 1; n <= 6; n++) {
      const d = addDays(today, -n);
      picks.push({ pc: dayPick(d), kind: 'day', d, when: longDay(d) });
    }
    picks.forEach((k, i) => {
      k.title = k.pc.w.title;
      k.maker = k.pc.p.name;
      k.honour = i < 3 ? HONOUR[k.kind] : '';
      k.lines = [['small', k.honour], ['title', k.title], ['maker', k.maker]];
    });
    picked = [...new Set(picks.map((k) => k.pc))];
  }

  // the gallery: a room on a laptop, a wall on a phone (and wherever 3D cannot run)
  function build() {
    museum?.destroy();
    museum2?.destroy();
    museum3?.destroy();
    museum4?.destroy();
    wide = !narrow && !isTouch;
    const two = !!open2 && wide;
    open2?.classList.toggle('is-off', !two);
    const opts = (more) => ({
      picks, wide, reduced, local, lenis, ...more,
      art: (pc, w) => workArt(pc.p, pc.i, w),
      open: (pc, from) => openPiece(pc, { seq: picked, from }),
      sigOf, sigColour: (p) => COLOR[p.art],
      sigInto: (svg, pc, xh) => sigInto(svg, pc.p, xh), egg,
      hand: { write, inkOutline, HAND, GAP },
      colour: () => getComputedStyle(root).getPropertyValue('--cc').trim() || ALL,
    });
    // tagged for the client to choose between: four on a laptop, three on a phone (no visitors there)
    const total = (two ? 2 : 1) + (open3 ? 1 : 0) + (open4 ? 1 : 0), n3 = two ? 3 : 2, n4 = n3 + (open3 ? 1 : 0);
    museum = createMuseum(open, opts({ tag: `Gallery 1 of ${total} \u00b7 ${two ? 'without visitors' : 'the gallery'}` }));
    museum2 = two ? createMuseum(open2, opts({ visitors: true, tag: `Gallery 2 of ${total} \u00b7 with visitors` })) : null;
    museum3 = open3 ? GALLERY3[0](open3, opts({ tag: `Gallery ${n3} of ${total} \u00b7 ${GALLERY3[1]}` })) : null;
    open3?.classList.toggle('is-off', !museum3);
    museum4 = open4 ? createBranch(open4, opts({ tag: `Gallery ${n4} of ${total} \u00b7 the branch` })) : null;
    open4?.classList.toggle('is-off', !museum4);
    // (the pedestal and the branch end in the dark, so the night follows them straight on, with no
    // white haze)
    root.classList.toggle('cc-hz-night', !!(museum4 || museum3));
    layoutSky();
    refreshSoon();
  }
  function layoutOpen() {
    museum?.layout();
    museum2?.layout();
    museum3?.layout();
    museum4?.layout();
    layoutSky();
  }
  function opening() {
    build();
    root.classList.remove('cc-arriving');
    if (!reduced && !parse()) gsap.fromTo(open, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.out', clearProps: 'opacity' });
  }
  const settleOpen = () => root.classList.remove('cc-arriving');

  // ---------------------------------------------------------------- start

  limit = PAGE(narrow);
  fillLabel();
  paintIndex(false);
  hang(EVERY.slice(0, limit));
  buildPicks();
  // (14 Nov) everything as "the works" (js/corner-works.js): the stack under the words, then each
  // domain as a chapter, on the night. The shop wall before it stays for ?shop=rows.
  const worksEl = $('.cp-works', section);
  if (worksEl && !/[?&]shop=rows\b/.test(location.search)) {
    works = createWorks(worksEl, {
      ARTS, COLOR, every: EVERY, ofDomain, reduced, isTouch,
      total: `${ARTISTS.length} artists in ${ARTS.length === 9 ? 'nine' : ARTS.length} domains`,
      art: (pc, w) => workArt(pc.p, pc.i, w),
      open: (pc, from, seq) => openPiece(pc, { seq, from }),
      sigInto: (svg, p, xh) => sigInto(svg, p, xh), egg,
    });
    root.classList.add('cc-works-on');
    $('.cp-all', section).hidden = true;
  } else worksEl?.remove();
  rewrite(!reduced); // written as the band comes into view
  // the opening begins once the type is in, so nothing it measures moves under it
  Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => requestAnimationFrame(opening));
  let rt, wasNarrow = narrow;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      settle();
      if (isNarrow(innerWidth, innerHeight) !== wasNarrow) {
        wasNarrow = !wasNarrow;
        narrow = wasNarrow;
        tiles.forEach((t) => { sigInto(t.sig, t.pc.p, SIG_XH()); unsign(t.sig); });
      }
      // a window that crosses between a laptop's size and a phone's changes gallery
      if (museum && wide !== (!narrow && !isTouch)) build(); else layoutOpen();
      works?.layout();
      relayout();
      layoutInk();
      applyDraw();
      if (roomOn && mode === 'piece') fitPiece();
    }, 120);
  });
  document.fonts?.ready.then(() => { layoutOpen(); relayout(); layoutInk(); applyDraw(); });
  // a shared link to a piece or an artist opens it, once the page has its full height
  const linked = parse();
  if (linked) {
    const go = () => {
      lenis.resize?.();
      openAt(linked);
    };
    if (document.readyState === 'complete') setTimeout(go, 60);
    else addEventListener('load', () => setTimeout(go, 60), { once: true });
  }

  if (local) {
    // ?y=1200 scrolls there once the page is settled, for screenshots taken without a pointer
    const y = +new URLSearchParams(location.search).get('y');
    if (y) addEventListener('load', () => setTimeout(() => { lenis.scrollTo?.(y, { immediate: true, force: true }); scrollTo(0, y); }, 900), { once: true });
    window.__corner = {
      choose, relayout, drawn, lifted, applyDraw, tiles,
      more: () => moreBtn.click(),
      openPiece: (key) => openPiece(PIECES.get(key) || EVERY[0]),
      openPerson: (slug) => openPerson(ARTISTS.find((p) => p.slug === slug)),
      // the closer look, sharing, and what is kept in this browser
      openSaved, zoomTo, full, menu, saved, liked, get zoom() { return { ...Z }; },
      close: requestClose,
      // the pane stalls observers while it is hidden: these do their work at once
      paintAll: () => shown.forEach((pc) => paint(tiles.get(pc.key))),
      // the Easter egg, every signature shown at once
      signAll: () => shown.map((pc) => tiles.get(pc.key)).forEach((t) => { gsap.set(t.sig, { opacity: 1 }); signNow(t.sig); }),
      // the opening: the gallery (window.__museum has its own handles); build() makes it again
      settleOpen, layoutOpen, build, get museum() { return museum; }, get pedestal() { return museum3; }, get branch() { return museum4; },
      // the works (14 Nov): paintAll(), showAll(), deal(), deck, chapters
      get works() { return works; },
      // a pick's picture swapped for another (a file, or a data address), as an upload would be
      useArt: (i, url) => { picks[i].pc.w.image = url; build(); },
      get picks() { return picks; },
      get shown() { return shown; }, get riders() { return riders; }, get geo() { return geo; },
    };
  }
}
