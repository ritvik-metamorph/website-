// About's pictures (about.html; js/about.js runs them). Each tells its part of the story to
// whoever only looks, in the site's own lines: engraving, and the hand from the Creative Corner.
//
// - The name: it first reads Mother map, then its nine letters travel to spell Metamorph. Rest
//   the cursor on it, or tap it on a phone, and they go back.
// - The path: a founder's road through the four practices, inked as you scroll, with a mark for
//   where you have got to. Each practice is a stop on it.
// - The rosette: a ring engraved for each of the practice's thirty years, oldest at the centre,
//   counted as they go, over the blank plate's faint lines; Metamorph's name runs round the
//   outside when the thirtieth is done. The page goes dark while it is engraved, and the lines
//   are drawn in light.
// - The loupe: over a pitch deck, it shows the books underneath, ticked in red pencil and
//   magnified. It follows the cursor, or moves across with the scroll.
// - The signatures: the founders tick their two questions as each arrives, then sign, one after
//   the other.
import { write, inkOutline } from './hand.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const isNarrow = () => innerWidth <= innerHeight || (innerWidth < 900 && innerHeight > 520);
export const START = 1996; // the practice's first year: 2026 less thirty, to confirm with the client

// ---------------------------------------------------------------- the name

export function setupName({ reduced, isTouch }) {
  const word = $('.ab-word'), note = $('.ab-word-note');
  const FROM = 'Metamorph';
  const TO = [0, 4, 2, 7, 6, 1, 5, 8, 3]; // where each letter of Metamorph sits in "Mother map"
  const letters = [...FROM].map((ch) => {
    const s = document.createElement('span');
    s.className = 'ab-l';
    s.setAttribute('aria-hidden', 'true');
    s.textContent = ch;
    word.append(s);
    return s;
  });
  // where each letter of "Mother map" would sit, in the same type
  const ghost = document.createElement('span');
  ghost.className = 'ab-word-ghost';
  ghost.setAttribute('aria-hidden', 'true');
  [...'Mother map'].forEach((ch) => { const s = document.createElement('span'); s.textContent = ch; ghost.append(s); });
  word.append(ghost);
  const away = () => {
    const slots = [...ghost.children].filter((s) => s.textContent !== ' ').map((s) => s.offsetLeft);
    return letters.map((l, i) => slots[TO[i]] - l.offsetLeft);
  };
  // the letters travel, rising and dipping by turns so they pass instead of colliding
  let home = reduced, sorted = reduced;
  function go(to, { delay = 0, dur = 1.5 } = {}) {
    home = to;
    const dx = away(), lift = parseFloat(getComputedStyle(word).fontSize) * 0.16;
    letters.forEach((l, i) => {
      gsap.to(l, { x: to ? 0 : dx[i], duration: dur, ease: 'expo.inOut', delay: delay + i * 0.045, overwrite: 'auto' });
      gsap.to(l, { keyframes: { y: [0, (i % 2 ? -1 : 1) * lift * (0.6 + (i % 3) * 0.3), 0] }, duration: dur, ease: 'sine.inOut', delay: delay + i * 0.045 });
    });
  }
  if (!reduced) {
    // it arrives as Mother map
    gsap.set(letters, { x: (i) => away()[i] });
    gsap.from(word, { opacity: 0, y: 24, duration: 1.1, ease: 'expo.out', delay: 0.1 });
  }
  function play() {
    if (reduced) { note.classList.add('is-on'); return; }
    // held long enough to be read as Mother map, then rearranged
    go(true, { delay: 1.4 });
    gsap.delayedCall(2.8, () => { sorted = true; note.classList.add('is-on'); });
  }
  if (!reduced && isTouch) {
    // on a phone a tap sends them back, and another brings them home
    word.addEventListener('click', () => { if (sorted) go(!home, { dur: 1.1 }); });
  } else if (!reduced) {
    let t;
    word.addEventListener('pointerenter', () => { if (!sorted) return; t = setTimeout(() => go(false, { dur: 1.1 }), 250); });
    word.addEventListener('pointerleave', () => { clearTimeout(t); if (sorted) go(true, { dur: 1.1 }); });
  }
  addEventListener('resize', () => { if (!home) gsap.set(letters, { x: (i) => away()[i] }); });
  return { play };
}

// ---------------------------------------------------------------- the path

export function setupPath({ reduced }) {
  const box = $('.ab-path'), svg = $('.ab-path-svg', box);
  const route = $('.ab-route', svg), trail = $('.ab-trail', svg), gapLine = $('.ab-trail-gap', svg);
  const stopsG = $('.ab-stops', svg), walker = $('.ab-walker', svg);
  const parts = $$('.ab-part', box);
  // each practice's stop, named at the head of its block
  parts.forEach((p) => {
    const s = document.createElement('span');
    s.className = 'ab-part-stop';
    s.textContent = p.dataset.stop;
    $('.ab-part-no', p).append(s);
  });
  const rings = parts.map(() => {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', 'ab-stop');
    g.innerHTML = '<circle class="ab-stop-o" r="10"/><circle class="ab-stop-i" r="4"/>';
    stopsG.append(g);
    return g;
  });
  const probe = document.createElementNS(NS, 'path'); // measures the road up to each stop
  probe.setAttribute('class', 'ab-probe');
  svg.append(probe);
  let L = 1, at = [], P = reduced ? 1 : 0;

  function layout() {
    const W = box.clientWidth, H = box.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.style.width = `${W}px`;
    svg.style.height = `${H}px`;
    const b = box.getBoundingClientRect(), narrow = isNarrow();
    // the stops: beside each block's head, in the lane between the two columns (down the left
    // edge on a phone)
    const lane = narrow ? 11 : (() => {
      const l = parts[0].getBoundingClientRect(), r = parts[1].getBoundingClientRect();
      return (l.right + r.left) / 2 - b.left;
    })();
    const sway = narrow ? 0 : Math.min(54, W * 0.05);
    const pts = parts.map((p, k) => {
      const r = $('.ab-part-no', p).getBoundingClientRect();
      return [lane + (narrow ? 0 : (k % 2 ? sway : -sway)), r.top + r.height / 2 - b.top];
    });
    const first = [lane, 0], last = [lane, H];
    const all = [first, ...pts, last];
    // vertical at every stop, so the road swings from one to the next
    let d = `M${first[0].toFixed(1)} ${first[1].toFixed(1)}`;
    const segs = [];
    for (let i = 1; i < all.length; i++) {
      const [x0, y0] = all[i - 1], [x1, y1] = all[i], dy = (y1 - y0) * 0.55;
      d += `C${x0.toFixed(1)} ${(y0 + dy).toFixed(1)} ${x1.toFixed(1)} ${(y1 - dy).toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
      segs.push(d);
    }
    [route, trail, gapLine].forEach((e) => e.setAttribute('d', d));
    L = trail.getTotalLength();
    // how far along the road each stop is
    at = pts.map((_, k) => { probe.setAttribute('d', segs[k]); return probe.getTotalLength(); });
    pts.forEach(([x, y], k) => rings[k].setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`));
    [trail, gapLine].forEach((e) => { e.style.strokeDasharray = `${L} ${L}`; });
    draw(P);
  }
  function draw(p) {
    P = p;
    if (!trail.getAttribute('d')) return; // not measured yet
    const s = L * p;
    [trail, gapLine].forEach((e) => { e.style.strokeDashoffset = `${L - s}`; });
    const q = trail.getPointAtLength(Math.max(0.01, s));
    walker.setAttribute('cx', q.x.toFixed(1));
    walker.setAttribute('cy', q.y.toFixed(1));
    walker.style.opacity = p > 0.002 && p < 0.998 ? 1 : 0;
    at.forEach((a, k) => {
      const on = s >= a - 2;
      rings[k].classList.toggle('is-on', on);
      parts[k].classList.toggle('is-reached', on);
    });
  }
  layout();
  // the road is inked from where the section comes up to where its last stop is passed
  ScrollTrigger.create({
    trigger: box, start: 'top 72%', end: 'bottom 62%', scrub: reduced ? true : 0.6,
    onUpdate: (self) => { if (!reduced) draw(self.progress); },
  });
  return { layout };
}

// ---------------------------------------------------------------- the rosette, and the lights

export function setupRose({ reduced, isTouch, lenis, register }) {
  const sec = $('.ab-practice'), fig = $('.ab-rose', sec), ringsG = $('.ab-rings', fig);
  const micro = $('.ab-micro', fig), microPath = $('textPath', micro);
  const nEl = $('.ab-rose-n', fig), yEl = $('.ab-rose-y', fig);
  const N = 30;
  // thirty rings, the oldest at the centre, in six bands of five years. Within a band the rings
  // share one rhythm, so they lie in parallel like engraving; each ring is two lines half a wave
  // apart, crossing into the lens shapes of a banknote's rosette. A fine rule closes each band.
  // Under them, the blank plate: every line scored faintly, waiting to be cut. (The same lines are
  // cut into the steel plate, js/about-plate.js; this drawing is kept for where it can't be shown.)
  const blank = document.createElementNS(NS, 'g');
  blank.setAttribute('class', 'ab-plate');
  ringsG.before(blank);
  const lines = [], geo = [];
  const path = (pts, cls, k) => {
    const p = document.createElementNS(NS, 'path');
    p.setAttribute('d', `${pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`).join('')}Z`);
    blank.append(p.cloneNode());
    p.setAttribute('pathLength', '1');
    p.setAttribute('class', cls);
    ringsG.append(p);
    lines.push({ p, k });
    geo.push({ pts: [...pts, pts[0]], k, b: cls.includes('is-b'), rule: cls.includes('is-rule') });
  };
  const LOBES = [24, 32, 40, 48, 56, 64]; // each band's waves per turn, about one wavelength apart
  for (let k = 0; k < N; k++) {
    const band = Math.floor(k / 5), r0 = 27 + k * 2.2, amp = 0.82, n = LOBES[band];
    const steps = n * 10;
    [0, Math.PI].forEach((ph) => {
      const pts = [];
      for (let i = 0; i < steps; i++) {
        const th = (i / steps) * TAU, w = n * th + ph;
        // the bands take turns between a plain wave and one with a second, finer wave in it
        const r = band % 2 ? r0 + amp * (0.7 * Math.sin(w) + 0.3 * Math.sin(2 * w + 0.8)) : r0 + amp * Math.sin(w);
        pts.push([r * Math.sin(th), -r * Math.cos(th)]);
      }
      path(pts, ph ? 'ab-ring is-b' : 'ab-ring', k);
    });
    if (k % 5 === 4) {
      // the rule between five years and the next
      const rr = r0 + 1.1;
      path(Array.from({ length: 240 }, (_, i) => [rr * Math.sin((i / 240) * TAU), -rr * Math.cos((i / 240) * TAU)]), 'ab-ring is-rule', k);
    }
  }
  microPath.textContent = Array(5).fill('Metamorph Capital · thirty years of signed accounts · ').join('');

  let steel = null, P = reduced ? 1 : 0;
  function engrave(p) {
    P = p;
    // on the steel the cutting waits until the plate has begun to turn towards you
    const e = steel ? clamp((p - 0.12) / 0.84, 0, 1) : p;
    lines.forEach(({ p: l, k }) => {
      const t = clamp(e * N * 1.04 - k, 0, 1);
      l.style.strokeDashoffset = `${1 - t}`;
      l.style.visibility = t > 0 ? '' : 'hidden'; // a line not yet begun leaves no dot where it starts
    });
    const years = Math.min(30, Math.floor(e * 30.4));
    nEl.textContent = years;
    yEl.textContent = START + years;
    micro.style.opacity = smooth(0.95, 1, e);
    fig.classList.toggle('is-done', e > 0.99);
    steel?.set({ turn: p, e, years });
  }
  engrave(P);
  // on a laptop the part holds still while the rings are engraved; on a phone they are engraved
  // as the picture passes
  const pin = !isNarrow() && !reduced;
  ScrollTrigger.create({
    trigger: pin ? sec : fig,
    start: pin ? 'top top' : 'top 80%',
    end: pin ? '+=110%' : 'bottom 35%',
    pin,
    scrub: reduced ? true : 0.5,
    onUpdate: (self) => { if (!reduced) engrave(self.progress); },
  });

  // the lights go down while the part is on the screen, and come up as it leaves; the plate comes
  // up as a line of light while they do
  const html = document.documentElement;
  let dark = -1;
  const arrival = () => {
    if (reduced) return 1;
    const r = fig.getBoundingClientRect(), vh = innerHeight;
    return pin ? smooth(vh * 1.05, vh * 0.55, r.top + r.height / 2) : smooth(vh * 1.02, vh * 0.8, r.top);
  };
  function lights() {
    steel?.set({ arrive: arrival() });
    const r = sec.getBoundingClientRect(), vh = innerHeight;
    const v = Math.min(smooth(vh * 0.68, vh * 0.25, r.top), smooth(vh * 0.3, vh * 0.72, r.bottom));
    if (Math.abs(v - dark) < 0.002) return;
    dark = v;
    html.style.setProperty('--ab-dark', v.toFixed(3));
    html.classList.toggle('ab-dark', v > 0.5);
  }
  lenis.on('scroll', lights);
  ScrollTrigger.addEventListener('refresh', lights);
  lights();

  // the steel plate, where the browser can draw it; until then, and otherwise, the drawing above
  import('./about-plate.js').then(({ createPlate }) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'ab-steel';
    canvas.setAttribute('aria-hidden', 'true');
    fig.classList.add('is-steel');
    fig.prepend(canvas);
    steel = createPlate(canvas, { geo, start: START, reduced });
    if (!steel) { canvas.remove(); fig.classList.remove('is-steel'); return; }
    if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__steel = steel; // (local testing)
    ScrollTrigger.refresh();
    engrave(P);
    steel.set({ arrive: arrival() });
    // drawn only while it is near the screen
    new IntersectionObserver(([en]) => steel.show(en.isIntersecting), { rootMargin: '25% 0px' }).observe(fig);
    if (!isTouch && !reduced) {
      // it leans a little towards the cursor
      fig.addEventListener('pointermove', (ev) => {
        const r = fig.getBoundingClientRect();
        steel.point(clamp(((ev.clientX - r.left) / r.width - 0.5) * 2, -1, 1), clamp(((ev.clientY - r.top) / r.height - 0.5) * 2, -1, 1));
      });
      fig.addEventListener('pointerleave', () => steel.point(0, 0));
    }
  }).catch((err) => { console.error(err); fig.classList.remove('is-steel'); $('.ab-steel', fig)?.remove(); steel = null; });
  register({
    name: 'about', commit() {}, revert() {},
    under: () => ({ tone: dark > 0.5 ? 'light' : 'ink', theme: dark > 0.5 ? '#0c110f' : '#f2f3ef' }),
  });
}

// ---------------------------------------------------------------- the loupe

export function setupLens({ reduced, isTouch }) {
  const fig = $('.ab-lens'), deck = $('.ab-deck', fig), books = $('.ab-books', fig), loupe = $('.ab-loupe', fig);
  const at = { x: 0.3, y: 0.42 };
  let byHand = false, P = 0;
  function place() {
    const narrow = isNarrow();
    const W = books.clientWidth, H = books.clientHeight, R = Math.max(58, W * (narrow ? 0.22 : 0.19));
    const M = narrow ? 1.35 : 1.18; // the glass magnifies, more where the books are set small
    const x = at.x * W, y = at.y * H;
    // the books, enlarged about the loupe's centre and cut to its glass
    books.style.transformOrigin = `${x.toFixed(1)}px ${y.toFixed(1)}px`;
    books.style.transform = `scale(${M})`;
    books.style.clipPath = `circle(${(R / M).toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`;
    loupe.style.width = loupe.style.height = `${(2 * R).toFixed(1)}px`;
    loupe.style.transform = `translate(${(books.offsetLeft + x - R).toFixed(1)}px, ${(books.offsetTop + y - R).toFixed(1)}px)`;
  }
  // with the scroll: along the row the deck would rather you skipped, to its circled figure, down
  // to the next one, and on to the accountant's note, resting a moment on each circle
  let keys = [];
  function route() {
    const W = books.clientWidth, H = books.clientHeight;
    const mid = (e, fx = 0.5) => {
      let x = 0, y = 0;
      for (let n = e; n && n !== books; n = n.offsetParent) { x += n.offsetLeft; y += n.offsetTop; }
      return { x: clamp((x + e.offsetWidth * fx) / W, 0.18, 0.82), y: clamp((y + e.offsetHeight / 2) / H, 0.15, 0.85) };
    };
    const [a, b] = $$('.ab-ring', books), note = $('.ab-books-note', books);
    const from = mid(a.closest('tr').cells[0], 0.3), one = mid(a), two = mid(b), last = mid(note);
    keys = [[0, from], [0.3, one], [0.42, one], [0.66, two], [0.78, two], [1, last]];
  }
  const byScroll = (p) => {
    let k = 1;
    while (k < keys.length - 1 && p > keys[k][0]) k++;
    const [p0, a] = keys[k - 1], [p1, b] = keys[k], t = smooth(p0, p1, p);
    return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
  };
  route();
  ScrollTrigger.create({
    trigger: fig, start: 'top 85%', end: 'bottom 20%', scrub: reduced ? true : 0.5,
    onUpdate: (self) => { P = self.progress; if (!byHand) { Object.assign(at, byScroll(P)); place(); } },
  });
  // or in your hand
  if (!isTouch) {
    fig.addEventListener('pointermove', (e) => {
      const r = deck.getBoundingClientRect(); // (the books are scaled; the deck under them is not)
      byHand = true;
      gsap.to(at, { x: clamp((e.clientX - r.left) / r.width, 0, 1), y: clamp((e.clientY - r.top) / r.height, 0, 1), duration: reduced ? 0 : 0.35, ease: 'power3.out', overwrite: true, onUpdate: place });
    });
    fig.addEventListener('pointerleave', () => {
      byHand = false;
      gsap.to(at, { ...byScroll(P), duration: reduced ? 0 : 0.8, ease: 'power3.inOut', overwrite: true, onUpdate: place });
    });
  }
  addEventListener('resize', () => { route(); if (!byHand) Object.assign(at, byScroll(P)); place(); });
  Object.assign(at, byScroll(0));
  place();
  return { place };
}

// ---------------------------------------------------------------- the signatures

const HAND = { slant: 0.24, track: 0.07, loops: 0.85, flick: true, leadIn: 0.9 };
export function setupSigns({ reduced }) {
  const signs = $$('.ab-sign').map((box, k) => {
    const svg = $('.ab-sign-svg', box);
    const xh = isNarrow() ? 22 : 30;
    const g = write($('.ab-sign-name', box).textContent.toLowerCase(), { xh, ...HAND });
    const x0 = -1.2 * xh, y0 = -2.5 * xh, w = g.width + 2.8 * xh, h = 4.1 * xh;
    svg.setAttribute('viewBox', `${x0.toFixed(1)} ${y0.toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`);
    svg.style.width = `${w.toFixed(0)}px`;
    svg.style.height = `${h.toFixed(0)}px`;
    const iw = clamp(xh * 0.06, 1.8, 2.6);
    svg.innerHTML = `<defs><mask id="ab-pen-${k}" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="12000" height="12000"><path class="ab-pen" pathLength="1" d="${g.d}" style="stroke-width:${(iw * 3).toFixed(2)}"/></mask></defs>`
      + `<path class="ab-sign-ink" d="${inkOutline(g, { width: iw, land: 24, lift: 50 })}" mask="url(#ab-pen-${k})"/>`
      + g.lifts.map((d) => `<path class="ab-sign-lift" pathLength="1" d="${d}" style="stroke-width:${(iw * 0.85).toFixed(2)}"/>`).join('');
    return { box, pen: $('.ab-pen', svg), lifts: $$('.ab-sign-lift', svg), total: g.total };
  });
  // the two questions are ticked in the same ink, the last word and its tick kept on one line
  const ticks = $$('.ab-q-t').map((q) => {
    const last = q.lastChild, cut = last.textContent.lastIndexOf(' ');
    const end = document.createElement('span');
    end.className = 'ab-q-end';
    end.textContent = last.textContent.slice(cut + 1);
    last.textContent = last.textContent.slice(0, cut + 1);
    end.insertAdjacentHTML('beforeend', '<svg class="ab-q-tick" viewBox="0 0 24 24" aria-hidden="true"><path pathLength="1" d="M2.6 12.6C4.7 13.9 6.7 16.1 8.3 19.4C11.1 12.2 15.4 6.5 21.6 2.7"/></svg>');
    q.append(end);
    return $('path', end);
  });
  if (reduced) {
    [...ticks, ...signs.flatMap((s) => [s.pen, ...s.lifts])].forEach((e) => { e.style.strokeDashoffset = 0; });
    return;
  }
  // one hand, so each mark waits for the one before it: the questions are ticked as they arrive,
  // and only then do the founders sign
  let free = 0;
  const queue = (gap, dur, f) => {
    const now = gsap.ticker.time, at = Math.max(now + gap, free);
    free = at + dur;
    gsap.delayedCall(at - now, f);
  };
  ticks.forEach((t) => ScrollTrigger.create({
    trigger: t.closest('.ab-q'), start: 'top 72%', once: true,
    onEnter: () => queue(0.7, 0.55, () => gsap.fromTo(t, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.5, ease: 'power2.inOut' })),
  }));
  ScrollTrigger.create({
    trigger: $('.ab-signs'), start: 'top 82%', once: true,
    onEnter: () => signs.forEach((s) => {
      const pen = clamp(s.total / 650, 1, 2), lifts = 0.18 + 0.12 * Math.max(0, s.lifts.length - 1);
      queue(0.35, pen + lifts, () => gsap.timeline()
        .fromTo(s.pen, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: pen, ease: 'power1.inOut' })
        .fromTo(s.lifts, { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.18, stagger: 0.12, ease: 'none' }));
    }),
  });
}
