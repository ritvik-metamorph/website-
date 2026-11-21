// The services, the simple site's own page (ink-services.html; 18 Nov). The user: "I don't want that
// there is this just one pager with text all over… when we scroll, there is a card overlapping the first
// service… different sort of animations which can be interactive as well". So the four services are a
// pile: each chapter scrolls through, then holds while the next comes up over it like the next card on a
// pile, and the one beneath steps back. Each chapter moves in its own way, for a reason:
//   01 the deal's three hands run sideways, one after another, as the raise does; the eight services file
//      into place like a data room's index;
//   02 the family's wealth turns as the Investor Corner's four rings (js/wealth-rings.js);
//   03 the founder's journey by sector (the client's graph, 19 Nov) is cleared as you read it, its problems set along it; before, the working style
//      bent one road;
//   04 the statement draws its own small figures line by line, and the practice's stamp comes down on it.
// A dial at the side keeps your place among the four, and turns you to any of them. What every simple page
// shares comes first (js/ink.js).

import { inkPage } from './ink.js';
import { ringsWithKey } from './wealth-rings.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isNarrow = () => innerWidth <= innerHeight || (innerWidth < 900 && innerHeight > 520);

// the pictures the user is making (prompts in README): drop a file into assets/ink/services/ under its
// name and add the name here. Until then each frame is an empty white studio with its name.
const PICS = new Set([]);
const KEYS = { fundraising: 1, wealth: 2, strategy: 3, financial: 4 };

const ctx = inkPage();
const { lenis, reduced, local } = ctx;

// ---- the pictures, or their places
$$('img[data-pic]').forEach((img) => {
  const pic = img.closest('.ik-pic');
  if (PICS.has(img.dataset.pic)) img.src = `assets/ink/services/${img.dataset.pic}.jpg`;
  else { pic?.classList.add('is-ph'); img.remove(); }
});

// ---- the pile: each chapter holds once its end reaches the foot of the screen, and the next comes up
// over it; the one beneath steps back and dims as it is covered
const pile = $('.ikv-pile');
const chapters = $$('.ikv-ch');
let tops = [], heights = [], pileTop = 0;
function measure() {
  heights = chapters.map((c) => c.offsetHeight);
  chapters.forEach((c, i) => { c.style.top = `${Math.min(0, innerHeight - heights[i])}px`; c.style.zIndex = String(i + 1); });
  pileTop = pile.getBoundingClientRect().top + scrollY;
  let y = pileTop;
  tops = heights.map((h) => { const t = y; y += h; return t; });
}
const goTo = (n) => { measure(); lenis.scrollTo(tops[n - 1], { duration: 1.6 }); };

// ---- the dial: where you are among the four
const dial = $('.ikv-dial'), now = $('.ikv-dial-now');
let cur = 0;
$$('[data-go]', dial).forEach((b) => b.addEventListener('click', () => { endCue(); goTo(+b.dataset.go); }));
function setCur(i) {
  if (i === cur) return;
  cur = i;
  dial.style.setProperty('--cur', String(i - 1));
  $$('[data-go]', dial).forEach((b) => b.classList.toggle('is-on', +b.dataset.go === i));
  now.classList.remove('is-rolled'); void now.offsetWidth;
  now.innerHTML = `<b>0${i}</b><span>${chapters[i - 1].dataset.name}</span>`;
  now.classList.add('is-rolled');
}

// ---- (20 Nov) the dial pointed out once a visit (the user: a cue "that through this I can navigate between any of
// these four services"): as it first appears, a pen traces its circle from the top, the four numbers light one after
// another as it passes them, and a note beside it says what it is for; the note goes after a few seconds, or as soon
// as the dial is used. On a phone the dial is a row of the four at the foot, and the same happens there.
const tip = $('.ikv-tip');
let cued = false, cueSoon = false, tipTimer = 0;
try { cued = sessionStorage.getItem('mm-dial-cued') === '1'; } catch (e) {}
if (local && /[?&]cue\b/.test(location.search)) cued = false;
function endCue() { clearTimeout(tipTimer); tip?.classList.remove('is-on'); }
function cue() {
  cueSoon = false;
  if (cued || !dial.classList.contains('is-on')) return;
  cued = true;
  try { sessionStorage.setItem('mm-dial-cued', '1'); } catch (e) {}
  if (!reduced) { dial.classList.remove('is-cue'); void dial.offsetWidth; dial.classList.add('is-cue'); }
  setTimeout(() => tip?.classList.add('is-on'), reduced ? 0 : 650);
  tipTimer = setTimeout(endCue, reduced ? 5000 : 6200);
}

// ---- (20 Nov; the user: "put a back option… he'll come back to About where he clicked") a visitor who came from
// About's four (?from=about) is offered the way back: the browser's own Back when About is the page before this one
// (About then opens where they left it), its address otherwise
const FROM = { about: { page: 'ink-about.html', href: 'ink-about.html#stages', label: 'Back to About' } };
const from = FROM[new URLSearchParams(location.search).get('from')];
const back = $('.ikv-back');
if (from && back) {
  back.href = from.href;
  back.textContent = from.label;
  back.hidden = false;
  requestAnimationFrame(() => requestAnimationFrame(() => back.classList.add('is-on')));
  back.addEventListener('click', (e) => {
    let ref = null;
    try { ref = new URL(document.referrer); } catch (err) { ref = null; }
    if (ref && ref.origin === location.origin && ref.pathname.endsWith(`/${from.page}`) && history.length > 1) { e.preventDefault(); history.back(); }
  });
}

// ---- the opening: the index, and the picture that follows the pointer over it
const peek = $('.ikv-peek'), peekIn = $('.ikv-peek-in');
let px = 0, py = 0, qx = 0, qy = 0;
$$('.ikv-index a').forEach((a) => {
  a.addEventListener('click', (e) => { e.preventDefault(); goTo(KEYS[a.dataset.pic]); });
  a.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse') return;
    const name = a.dataset.pic, label = a.querySelector('.ikv-ix-name').textContent;
    peekIn.innerHTML = PICS.has(name) ? `<img src="assets/ink/services/${name}.jpg" alt="">` : `<span>${label}</span>`;
    peekIn.classList.toggle('is-ph', !PICS.has(name));
    if (!peek.classList.contains('is-on')) { const r = $('.ikv-open').getBoundingClientRect(); px = qx = e.clientX - r.left; py = qy = e.clientY - r.top; }
    peek.classList.add('is-on');
    ask();
  });
  a.addEventListener('pointerleave', () => peek.classList.remove('is-on'));
});
$('.ikv-open').addEventListener('pointermove', (e) => { const r = $('.ikv-open').getBoundingClientRect(); px = e.clientX - r.left; py = e.clientY - r.top; });

// ---- 01: the deal's three hands, run sideways as you scroll down
const deal = $('[data-deal]'), track = deal && $('.ikv-deal-track', deal), rail = deal && $('.ikv-deal-rail', deal);
let dealDist = 0;
function sizeDeal() {
  if (!deal) return;
  if (isNarrow() || reduced) { deal.style.height = ''; track.style.transform = ''; dealDist = 0; return; }
  dealDist = Math.max(0, track.scrollWidth - innerWidth);
  deal.style.height = `${innerHeight + dealDist * 1.1}px`;
}
function runDeal() {
  if (!deal || !dealDist) return;
  const r = deal.getBoundingClientRect(), p = clamp(-r.top / (r.height - innerHeight), 0, 1);
  track.style.transform = `translate3d(${-p * dealDist}px, 0, 0)`;
  rail.style.setProperty('--p', p.toFixed(4));
  const step = Math.min(2, Math.floor(p * 3 + 0.15));
  $$('[data-step]', rail).forEach((s) => s.classList.toggle('is-on', +s.dataset.step <= step));
  $$('.ikv-hand', track).forEach((h, i) => h.classList.toggle('is-on', i === step));
}

// ---- 01: the eight services, filed in as they are reached
$$('.ikv-files li').forEach((li, i) => { li.style.setProperty('--k', String(i % 4)); ctx.onEnter(li, () => li.classList.add('is-in'), 'top 92%'); });

// ---- 02: the family's wealth, as four rings
const ringsWrap = $('.ikv-rings-wrap');
const rings = ringsWrap ? ringsWithKey(ringsWrap, { skin: 'light', reduced, density: 1.1 }) : null;

// ---- 03: the founder's journey by sector (19 Nov: the client's own graph, "Founder's Journey by Sector", in place
// of the working style that bent one road). The road is the founder's momentum, from nothing to full, across the
// journey and through the sector's five stages; the same ten challenges sit where they bite in that sector. The
// curves and the points are the client's, as they drew them ("illustrative, drawn from typical sector patterns").
// Choosing a sector reshapes the road and carries the challenges along it to their new places.
const SECTORS = {
  ai: {
    shape: 'Fast spike, sharp fall, volatile recovery',
    y: [15, 58, 84, 66, 40, 28, 40, 56, 50, 66, 86],
    stages: [['Demo', 0, 14], ['Hype', 14, 30], ['Retention', 30, 55], ['Moat', 55, 80], ['Scale', 80, 100]],
    at: { style: 5, focus: 13, pmf: 22, cap: 32, cred: 42, team: 52, sales: 62, reg: 72, fin: 82, risk: 93 },
  },
  consumer: {
    shape: 'Launch bump, long working-capital dip, steady climb',
    y: [20, 30, 44, 50, 40, 30, 34, 44, 55, 64, 70],
    stages: [['Idea', 0, 12], ['Launch', 12, 30], ['Channels', 30, 60], ['Repeat', 60, 82], ['Scale', 82, 100]],
    at: { style: 5, pmf: 14, cred: 23, sales: 33, cap: 45, fin: 55, team: 65, focus: 75, reg: 85, risk: 94 },
  },
  deep: {
    shape: 'Long flat valley, late steep rise',
    y: [24, 20, 15, 18, 13, 17, 14, 22, 38, 62, 90],
    stages: [['Lab', 0, 25], ['Prototype', 25, 50], ['Pilot', 50, 72], ['First order', 72, 88], ['Scale', 88, 100]],
    at: { cred: 5, style: 14, cap: 25, team: 36, reg: 47, focus: 57, risk: 67, pmf: 77, fin: 84, sales: 93 },
  },
};
const journey = $('[data-journey]');
const road = journey && $('.ikv-road', journey), area = journey && $('.ikv-road-shadow', journey);
const steps = journey ? $$('.ikv-steps li', journey) : [];
const say = journey && $('.ikv-say', journey);
const stagesEl = journey && $('.ikv-stages', journey), shapeEl = journey && $('[data-shape]', journey);
const snap = (s) => ({ y: s.y.slice(), at: { ...s.at } });
let sector = 'ai', J = snap(SECTORS.ai), drawn = reduced ? 1 : 0, chosen = null;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// (the client's curve: one smooth line through eleven heights, at 0, 10 … 100 along the journey)
function yAt(ys, x) {
  const i = clamp(Math.floor(x / 10), 0, 9), t = (x - i * 10) / 10, t2 = t * t, t3 = t2 * t;
  const m = (k) => (k === 0 ? ys[1] - ys[0] : k === 10 ? ys[10] - ys[9] : (ys[k + 1] - ys[k - 1]) / 2);
  return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * m(i) + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * m(i + 1);
}
const val = (x) => clamp(yAt(J.y, x * 100) / 100, 0, 1);
const xOf = (li) => (J.at[li.dataset.id] ?? 50) / 100;
const inOrder = () => steps.slice().sort((a, b) => xOf(a) - xOf(b));
// (drawn in the graph's own pixels, so the road's line keeps one width and can be drawn along its length)
let GW = 1000, GH = 440;
const BASE = () => GH - 40;
const Y = (x) => BASE() - val(x) * (BASE() - 96);
function drawRoad(labels = true) {
  if (!journey) return;
  const graph = $('.ikv-graph', journey), svg = $('svg', graph), axis = $('.ikv-axis', svg);
  GW = Math.max(1, graph.clientWidth); GH = Math.max(1, graph.clientHeight);
  svg.setAttribute('viewBox', `0 0 ${GW} ${GH}`);
  axis.setAttribute('x2', GW); axis.setAttribute('y1', BASE()); axis.setAttribute('y2', BASE());
  let d = '';
  for (let i = 0; i <= 180; i++) { const x = i / 180; d += `${i ? 'L' : 'M'}${(x * GW).toFixed(1)} ${Y(x).toFixed(1)}`; }
  road.setAttribute('d', d);
  area.setAttribute('d', `${d}L${GW} ${BASE()}L0 ${BASE()}Z`);
  steps.forEach((li) => { const x = xOf(li); li.dataset.x = x.toFixed(4); li.style.left = `${(x * GW).toFixed(1)}px`; li.style.top = `${Y(x).toFixed(1)}px`; });
  if (labels) placeLabels();
  if (typeof frost === 'function') frost(null);
}
// the sector's five stages along the foot, its numbers in the order the challenges come, its shape in words
function setSector() {
  const s = SECTORS[sector];
  if (stagesEl) stagesEl.innerHTML = s.stages.map(([n, a, b]) => `<span class="ikv-stage" style="left:${a}%;width:${b - a}%">${n}</span>`).join('');
  if (shapeEl) shapeEl.textContent = s.shape;
  const list = inOrder();
  list.forEach((li, i) => {
    li.querySelector('b').textContent = String(i + 1).padStart(2, '0');
    li.classList.toggle('is-first', i === 0);
    li.classList.toggle('is-last', i === list.length - 1);
  });
}
// each name goes as low above its point as it can without touching the road or a name already placed
function placeLabels() {
  const placed = [], narrow = isNarrow(), list = inOrder();
  list.forEach((li, i) => {
    const fx = xOf(li), x = fx * GW, y = Y(fx);
    const lab = li.querySelector(narrow ? 'b' : 'span');
    const w = (lab.offsetWidth || 60) + 12, h = narrow ? 14 : 34;
    const x0 = i === 0 ? x - 8 : i === list.length - 1 ? x - w + 8 : x - w / 2, x1 = x0 + w;
    let top = Infinity;
    for (let k = 0; k <= 14; k++) top = Math.min(top, Y(clamp(x0 + ((x1 - x0) * k) / 14, 0, GW) / GW));
    let lift = 24;
    for (const L of [24, 58, 92, 126, 160, 194]) {
      lift = L;
      const bottom = y - L, upper = bottom - h;
      const hitsRoad = bottom > top - 8, hitsName = placed.some((p) => x0 < p.x1 && x1 > p.x0 && upper < p.b && bottom > p.t);
      if (!hitsRoad && !hitsName) break;
    }
    placed.push({ x0, x1, b: y - lift, t: y - lift - h });
    li.style.setProperty('--lift', `${lift}px`);
  });
}
// the frost over the road ahead: its edge just past the step you are on; the steps beyond it under the glass
const glass = journey && $('.ikv-glass', journey);
let here = null;
function frost(li) {
  if (!glass) return;
  if (li) here = li;
  const hx = here ? xOf(here) : -1, x = hx < 0 ? 0 : hx * GW + 16;
  glass.style.left = `${Math.min(GW, x).toFixed(1)}px`;
  glass.classList.toggle("is-thin", GW - x < 150); // (its words only where there is room for them)
  steps.forEach((s) => s.classList.toggle('is-ahead', xOf(s) > hx + 1e-6));
}
function show(li) {
  steps.forEach((s) => s.classList.toggle('is-hot', s === li));
  frost(li);
  const b = li.querySelector('b').textContent, n = li.querySelector('span').textContent, t = li.querySelector('p').textContent;
  say.innerHTML = `<b>${b}</b><span>${n}</span><span class="ikv-say-d">${t}</span>`;
}
steps.forEach((li) => {
  const btn = li.querySelector('button');
  ['pointerenter', 'focus', 'click'].forEach((ev) => btn.addEventListener(ev, () => { chosen = li; show(li); }));
});
// another sector: the road reshapes and the challenges travel along it; names, stages and shape wait till it lands
let tween = null;
function goSector(next) {
  if (!SECTORS[next] || next === sector || !journey) return;
  sector = next;
  $$('[data-sector]', journey).forEach((o) => o.setAttribute('aria-pressed', String(o.dataset.sector === next)));
  const from = snap(J), to = snap(SECTORS[next]), t0 = performance.now(), dur = reduced ? 1 : 750;
  const moving = [$('.ikv-steps', journey), stagesEl, shapeEl?.parentElement].filter(Boolean);
  moving.forEach((e) => e.classList.add('is-moving'));
  cancelAnimationFrame(tween);
  const stepT = (now) => {
    const k = clamp((now - t0) / dur, 0, 1), e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
    J.y = from.y.map((v, i) => v + (to.y[i] - v) * e);
    for (const id in to.at) J.at[id] = from.at[id] + (to.at[id] - from.at[id]) * e;
    if (k < 1) { drawRoad(false); tween = requestAnimationFrame(stepT); return; }
    J = to;
    setSector();
    drawRoad(true);
    moving.forEach((el) => el.classList.remove('is-moving'));
    if (here) show(here);
  };
  tween = requestAnimationFrame(stepT);
}
$$('[data-sector]', journey || document).forEach((b) => b.addEventListener('click', () => goSector(b.dataset.sector)));
if (journey) setSector();
function runJourney() {
  if (!journey) return;
  if (!reduced) {
    const r = $('.ikv-graph', journey).getBoundingClientRect();
    drawn = Math.max(drawn, clamp((innerHeight * 0.92 - r.top) / (r.height + innerHeight * 0.35), 0, 1));
  }
  // (since the frost, 18 Nov: the whole road is always there; reading on clears it, step by step, rather
  // than drawing it. At first the whole journey is under the glass)
  road.style.strokeDashoffset = '0';
  area.style.clipPath = '';
  let last = null;
  steps.forEach((li) => { li.classList.add('is-on'); if (+li.dataset.x <= drawn + 0.015) last = li; });
  if (!chosen && last && !last.classList.contains('is-hot')) show(last);
  if (!chosen && !last && here) { here = null; steps.forEach((x) => x.classList.remove('is-hot')); frost(null); }
}

// ---- 04: the statement's figures, each drawn as its line is reached and again under the pointer
const G = {
  report: '<path class="gl" pathLength="1" d="M4 9H70"/><path class="gl" pathLength="1" d="M4 18H84"/><path class="gl" pathLength="1" d="M4 27H56"/><path class="gl" pathLength="1" d="M92 27H116"/><path class="gl" pathLength="1" d="M92 31H116"/>',
  unit: [0, 1, 2, 3, 4].map((i) => { const h = 10 + i * 4, m = 4 + i * 2.2; return `<rect class="gb" x="${8 + i * 22}" y="${34 - h}" width="12" height="${h - m}"/><rect class="gb gb-o" x="${8 + i * 22}" y="${34 - h - m}" width="12" height="${m}"/>`; }).join(''),
  cohort: [0, 1, 2, 3].map((r) => Array.from({ length: 7 - r }, (_, c) => `<rect class="gb" style="opacity:${(1 - c * 0.12).toFixed(2)}" x="${6 + c * 15}" y="${3 + r * 8.5}" width="12" height="6.5"/>`).join('')).join(''),
  margin: '<rect class="gb" x="6" y="4" width="14" height="30"/><rect class="gb gb-o" x="28" y="4" width="14" height="8"/><rect class="gb gb-o" x="50" y="12" width="14" height="6"/><rect class="gb gb-o" x="72" y="18" width="14" height="5"/><rect class="gb" x="96" y="23" width="14" height="11"/>',
  capital: '<path class="gl" pathLength="1" d="M60 5a13 13 0 1 1-12.4 9"/><path class="gl" pathLength="1" d="M44 10l3.6 4.4 5-2.6"/><path class="gl" pathLength="1" d="M8 18H30M90 18H112"/>',
  cash: '<path class="gl" pathLength="1" d="M4 28L22 22L38 25L56 16L70 18"/><path class="gl gl-f" pathLength="1" d="M70 18L88 11L104 12L116 5"/><path class="gl" pathLength="1" d="M70 4V33"/>',
  dash: [0, 1, 2].map((i) => `<path class="gl" pathLength="1" d="M${6 + i * 38} 4h32v28h-32z"/><path class="gl" pathLength="1" d="M${10 + i * 38} ${26 - i * 3}l8-${4 + i * 2} 7 3 9-${6 + i}"/>`).join(''),
  sku: '<path class="gl" pathLength="1" d="M4 4h112v28H4z"/><path class="gl" pathLength="1" d="M52 4v28M52 20h64M88 4v16M24 4v28M100 20v12"/>',
  budget: [0, 1, 2, 3, 4].map((i) => { const b = 14 + ((i * 7) % 12), a = b + (i % 2 ? -5 : 4); return `<path class="gl" pathLength="1" d="M${8 + i * 22} 34V${34 - b}h8V34"/><rect class="gb" x="${18 + i * 22}" y="${34 - a}" width="5" height="${a}"/>`; }).join(''),
};
const statement = $('[data-statement]');
$$('.ikv-st li').forEach((li, i) => {
  const svg = li.querySelector('svg');
  svg.innerHTML = G[li.dataset.g] || '';
  ctx.onEnter(li, () => setTimeout(() => li.classList.add('is-drawn'), reduced ? 0 : 90 * (i % 3)), 'top 90%');
  li.addEventListener('pointerenter', () => { if (!li.classList.contains('is-drawn')) return; li.classList.remove('is-drawn'); void li.offsetWidth; li.classList.add('is-drawn'); });
});
// the stamp comes down on the statement once its foot is reached
if (statement) ctx.onEnter($('.ikv-st-foot', statement), () => setTimeout(() => statement.classList.add('is-stamped'), reduced ? 0 : 450), 'top 82%');

// ---- every frame the page moves: the pile, the dial, the deal, the journey, the peek
let raf = 0;
function frame() {
  raf = 0;
  const y = scrollY, vh = innerHeight;
  // the pile: the chapter beneath steps back and dims as the next comes over it
  for (let i = 0; i < chapters.length - 1; i++) {
    const nTop = chapters[i + 1].getBoundingClientRect().top;
    const p = clamp(1 - nTop / vh, 0, 1);
    const inner = chapters[i].firstElementChild;
    inner.style.transformOrigin = `50% ${Math.max(vh / 2, heights[i] - vh / 2)}px`;
    inner.style.transform = p > 0.001 ? `scale(${(1 - 0.06 * p).toFixed(4)})` : '';
    inner.style.setProperty('--cover', (p * 0.6).toFixed(3));
  }
  // the dial: shown among the four; which one is under the middle of the screen
  const inPile = y + vh * 0.5 >= tops[0] && y + vh * 0.5 < tops[tops.length - 1] + heights[heights.length - 1];
  dial.classList.toggle('is-on', inPile);
  if (inPile && !cued && !cueSoon) { cueSoon = true; setTimeout(cue, 900); }
  let at = 1;
  tops.forEach((t, i) => { if (y + vh * 0.5 >= t) at = i + 1; });
  setCur(at);
  runDeal();
  runJourney();
  // the peek follows the pointer, a little behind
  if (peek.classList.contains('is-on')) {
    qx += (px - qx) * 0.16; qy += (py - qy) * 0.16;
    // (it sits just above the pointer, so the name being read stays clear)
    peek.style.transform = `translate3d(${qx.toFixed(1)}px, ${qy.toFixed(1)}px, 0) translate(-30%, calc(-100% - 28px)) rotate(${clamp((px - qx) * 0.04, -6, 6).toFixed(2)}deg)`;
    raf = requestAnimationFrame(frame);
  }
}
const ask = () => { if (!raf) raf = requestAnimationFrame(frame); };
lenis.on('scroll', ask);
addEventListener('scroll', ask, { passive: true });
$('.ikv-open').addEventListener('pointermove', ask);

function layout() { measure(); sizeDeal(); drawRoad(); measure(); ask(); }
layout();
addEventListener('resize', layout);
addEventListener('load', layout, { once: true });
document.fonts?.ready.then(layout);
if ('ResizeObserver' in window) { const ro = new ResizeObserver(() => { measure(); ask(); }); chapters.forEach((c) => ro.observe(c)); }

// arriving with a service's address (ink-services.html#wealth), go to it. (20 Nov) The page goes on settling for a
// moment after it loads (the type, the journey's graph), and on a phone the jump landed 700px past the service; so the
// jump is made again as it settles, until the visitor moves the page themselves.
const arrive = KEYS[location.hash.slice(1)];
if (arrive) {
  let mine = true;
  const stop = () => { mine = false; };
  ['wheel', 'touchstart', 'pointerdown', 'keydown'].forEach((t) => addEventListener(t, stop, { once: true, passive: true }));
  const jump = () => { if (!mine) return; measure(); if (Math.abs(scrollY - tops[arrive - 1]) > 2) lenis.scrollTo(tops[arrive - 1], { immediate: true, force: true }); ask(); };
  addEventListener('load', () => [150, 450, 900, 1600].forEach((t) => setTimeout(jump, t)), { once: true });
  document.fonts?.ready.then(() => setTimeout(jump, 60));
}

if (local) window.__inkServices = { goTo, measure, tops: () => tops, cue: () => { cued = false; cue(); }, endCue, rings, setSector: (k) => goSector(k), draw: (v) => { drawn = v; runJourney(); }, stamp: () => statement.classList.add('is-stamped') };
