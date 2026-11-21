// The butterfly comes back (18 Nov, later): the way in's butterfly (js/emerge-scene.js), the one that came out of
// its cocoon while the site loaded, returns at the foot of every page and settles on the name. The user: "when u
// reach the footer, the butterfly that flied in the loading screen comes back and settle somehwere in the footer".
// - It perches on the h of the wordmark, standing on the stem's top.
// - The first time in a visit it flies in from above (its take-off at the end of the way in, run backwards) and
//   lands; after that it is already there when you arrive.
// - It is decoration: no focus, nothing to read, clicks pass through it. It goes still a few seconds after it
//   settles and moves again only when the visitor does something (the pointer near it). With reduced
//   motion it is simply there, still.
// - On the creative site it is the 3D object, drawn on one canvas over the foot, made only once the foot is near and
//   resting while the foot is away; on the simple site (light to load) a still picture of it made from the same
//   scene (assets/ink/butterfly-rest.webp) sits in the same place.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const narrow = () => matchMedia('(max-aspect-ratio: 1/1), (max-width: 899px) and (min-height: 521px)').matches;
const LANDED = 'mm-landed';
// the still: its box against the wingspan, and where the butterfly's middle sits in it (from the render)
const STILL = { w: 1 / 0.8, h: 1.0, cy: 0.5 };
// where its middle sits above the stem's top, as a share of its wingspan (so it stands on its letter)
const RISE = 0.3;
const AWAKE = 4000; // (ms it keeps breathing after anything happens, then it is still)

export function setupFootButterfly({ foot, word, h, reduced, live }) {
  const { gsap } = window;
  const metricsCtx = document.createElement('canvas').getContext('2d');

  // ---- the perch: the top of the h's stem, in the foot's own coordinates
  function perch() {
    const cs = getComputedStyle(word), fs = parseFloat(cs.fontSize) || 100;
    metricsCtx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const m = metricsCtx.measureText('h');
    const A = m.fontBoundingBoxAscent ?? fs * 0.97, D = m.fontBoundingBoxDescent ?? fs * 0.24;
    const fr = foot.getBoundingClientRect(), r = h.getBoundingClientRect();
    // (the letter's box is the line; its glyph sits centred on it by the font's own ascent and descent)
    const base = r.top + (r.height - (A + D)) / 2 + A;
    const x = r.left - (m.actualBoundingBoxLeft || 0) + fs * 0.05;
    const y = base - (m.actualBoundingBoxAscent || fs * 0.74);
    // its size: half the letters' height, but never so large it reaches the index above (measured under the
    // tallest column; it stands about 0.62 of its wingspan tall)
    const above = Math.max(...[...foot.querySelectorAll('.fm-col ul, .fm-lead > :last-child')].map((e) => e.getBoundingClientRect().bottom));
    const room = (y - above - 14) / 0.62;
    const w = clamp(Math.min(fs * (narrow() ? 0.75 : 0.5), room), narrow() ? 44 : 72, 168);
    return { x: x - fr.left, y: y - fr.top, w };
  }

  let landed = false;
  try { landed = sessionStorage.getItem(LANDED) === '1'; } catch (e) {}

  // ---------------------------------------------------------------- the simple site: a still of it
  if (!live) {
    const img = document.createElement('img');
    img.className = 'fm-fly-still';
    img.src = 'assets/ink/butterfly-rest.webp';
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    img.decoding = 'async';
    foot.append(img);
    const set = () => {
      const p = perch(), bw = p.w * STILL.w, bh = p.w * STILL.h;
      img.style.width = `${bw}px`;
      img.style.transform = `translate(${(p.x - bw / 2).toFixed(1)}px, ${(p.y - p.w * RISE - bh * STILL.cy).toFixed(1)}px)`;
    };
    let until = 0;
    gsap.ticker.add(() => { if (performance.now() < until) set(); });
    set();
    return { layout: set, moved: () => { until = performance.now() + 1700; } };
  }

  // ---------------------------------------------------------------- the creative site: the object itself
  const canvas = document.createElement('canvas');
  canvas.className = 'fm-fly';
  canvas.setAttribute('aria-hidden', 'true');
  foot.prepend(canvas);
  let scene = null, S = null, phase = 'away', wakeUntil = 0, near = false, flight = null, lift = null;
  let px = -1, py = -1;

  const wake = (ms = AWAKE) => { wakeUntil = Math.max(wakeUntil, performance.now() + ms); scene?.pause(false); };

  // where it is: the perch on the canvas (the canvas reaches above the foot, so it can fly in)
  function at() {
    const p = perch(), top = canvas.offsetTop;
    return { cx: p.x, cy: p.y - top - p.w * RISE, w: p.w };
  }

  function make() {
    if (scene || make.busy) return;
    make.busy = true;
    import('./emerge-scene.js').then(({ createEmergeScene }) => {
      scene = createEmergeScene(canvas, { transparent: true });
      make.busy = false;
      if (!scene) { canvas.remove(); return; }
      S = scene.state;
      Object.assign(S, { weave: 1, morph: 1, lean: 0, tone: 0, exit: 0, twitch: 0 });
      scene.place(at());
      if (landed || reduced) settle(); else { phase = 'waiting'; canvas.style.opacity = '0'; scene.pause(true); }
      tick();
    }).catch(() => { make.busy = false; canvas.remove(); });
  }

  function settle() {
    phase = 'rest';
    canvas.style.opacity = '1';
    S.exit = 0;
    wake(reduced ? 120 : AWAKE);
  }

  // the flight in: from above the page, down a curve onto the h, its wings beating until it lands
  function flyIn() {
    phase = 'flying';
    landed = true;
    try { sessionStorage.setItem(LANDED, '1'); } catch (e) {}
    canvas.style.opacity = '1';
    flight = { t: 0, dur: 2.9 };
    wake(1e9);
  }

  // if its letter moves: it lifts a little and rides it (kept for a wordmark that moves; nothing calls it now)
  function moved() {
    if (!scene || phase === 'away' || phase === 'waiting' || phase === 'flying') return;
    if (reduced) { wake(200); return; }
    lift = { t: 0, dur: 1.6 };
    wake();
  }

  let last = performance.now();
  function tick() {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!scene || !near) return;
    // (still: nothing to measure or draw until something wakes it)
    if (phase === 'rest' && !lift && now > wakeUntil) { scene.pause(true); return; }
    const p = at();
    if (phase === 'waiting') {
      // (it comes when the name itself comes into view)
      if (word.getBoundingClientRect().top < innerHeight * 0.9) flyIn();
      else return;
    }
    if (phase === 'flying') {
      if (!flight.hold) flight.t += dt;
      const u = clamp(flight.t / flight.dur, 0, 1), e = 1 - Math.pow(1 - u, 3);
      const W = canvas.clientWidth;
      // (a quadratic curve: in from the upper right, swinging out over the page, down onto its letter)
      const x0 = W * (narrow() ? 0.92 : 0.84), y0 = -p.w * 0.6, xc = W * 0.5, yc = p.cy * 0.25;
      const cx = lerp(lerp(x0, xc, e), lerp(xc, p.cx, e), e), cy = lerp(lerp(y0, yc, e), lerp(yc, p.cy, e), e);
      S.exit = 0.8 * Math.pow(1 - u, 1.6);
      scene.place({ cx, cy, w: p.w });
      if (u >= 1) { flight = null; settle(); }
      return;
    }
    let dy = 0;
    if (lift) {
      lift.t += dt;
      const u = clamp(lift.t / lift.dur, 0, 1), b = Math.sin(Math.PI * u);
      S.exit = 0.2 * b;
      dy = -p.w * 0.12 * b;
      if (u >= 1) { lift = null; S.exit = 0; }
    }
    scene.place({ cx: p.cx, cy: p.cy + dy, w: p.w });
    if (px >= 0) {
      const r = canvas.getBoundingClientRect();
      scene.point(clamp((px - (r.left + p.cx)) / (innerWidth * 0.45), -1, 1), clamp((py - (r.top + p.cy)) / (innerHeight * 0.6), -1, 1));
    }
    if (now > wakeUntil && !lift) scene.pause(true);
  }
  // made once the foot is a screen away; resting while it is out of sight (looked at every few frames)
  let n = 0;
  function watch() {
    if (++n % 10) return;
    const r = foot.getBoundingClientRect(), was = near;
    near = r.top < innerHeight * 2 && r.bottom > -innerHeight;
    if (near && !was) { make(); if (scene && phase !== 'waiting') wake(phase === 'rest' ? 600 : 1e9); }
    if (!near && was) scene?.pause(true);
  }
  gsap.ticker.add(() => { watch(); tick(); });

  // the pointer near it: it leans towards you
  foot.addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; if (phase === 'rest') wake(1500); }, { passive: true });
  foot.addEventListener('pointerleave', () => { px = py = -1; });

  const layout = () => { if (!scene) return; scene.resize(); if (phase === 'rest') wake(300); };
  // (for testing on localhost: the phase, the flight set to a moment, the perch)
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    window.__fly = {
      get scene() { return scene; }, get phase() { return phase; }, perch, at, flyIn, settle, moved,
      at_t(t, hold = true) { if (!flight) flyIn(); flight.t = t; flight.hold = hold; last = performance.now(); },
    };
  }
  return { layout, moved };
}
