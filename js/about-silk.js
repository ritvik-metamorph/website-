// The About page's ground: the silk (about.html; js/about-way.js starts it; js/silk.js draws it).
//
// The page's common element is the thread, and this is what the thread is spun into: one sheet of
// silk behind the whole page, from the name to the end. There are no section edges. Where a night
// part of the page meets a paper one, the light comes through the silk along one of its own folds,
// passing through a dawn blue on the way, so the change has no line. The folds drift slowly and
// always, stir a little faster while the page is being scrolled, and catch the light from where
// the cursor is (on a phone they sway on their own). At the very foot, under the butterfly's take-
// off, the night lifts towards first light.
//
// Where each change of ground sits, and how much room it has, is measured from the page's own
// content on build and on resize (update()), so the colour changes in the quiet room between two
// parts, reaching under the type only as far as it stays readable. Per frame only the scroll moves
// those numbers; nothing in the document is read or written (the nav's pills carry their own
// ground, and only take the tone under them). With reduced motion the silk stands still and only
// follows the scroll. If WebGL is missing or lost, the class comes off and the page's own grounds
// return.
import { createSilk } from './silk.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const MAX = 6;

export function setupSilk({ reduced, isTouch, local }) {
  if (/[?&]silk=off/.test(location.search)) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'ab-silk';
  canvas.setAttribute('aria-hidden', 'true');
  const root = document.documentElement;
  const nav = document.querySelector('.nav');
  const silk = createSilk(canvas, { reduced, isTouch, onLost: () => root.classList.remove('has-silk') });
  if (!silk) return null;
  document.body.prepend(canvas);
  root.classList.add('has-silk');
  silk.size();

  // ---- where the grounds change, measured from the content (in page pixels)
  const parts = [...document.querySelectorAll('main.about > header, main.about > section')];
  const INK = 'h1, h2, h3, p, li, a, button, figure, .ab-k, .ab-cue, .ab-slot, [class*="ab-slot-"]';
  let g0 = 0, bounds = [], shown = [], docH = 1, vw = 0;
  function extent(s) {
    const top = s.getBoundingClientRect().top + scrollY, bottom = top + s.offsetHeight;
    const pin = s.querySelector(':scope > .ab-stages-pin, :scope > .ab-thread-pin');
    const pr = pin?.getBoundingClientRect();
    let lo = Infinity, hi = -Infinity;
    s.querySelectorAll(INK).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (pin && pin.contains(el)) {
        // a held part: its first line arrives with the part's top, its last leaves with its foot
        lo = Math.min(lo, top + (r.top - pr.top));
        hi = Math.max(hi, bottom - pin.offsetHeight + (r.bottom - pr.top));
      } else {
        lo = Math.min(lo, r.top + scrollY);
        hi = Math.max(hi, r.bottom + scrollY);
      }
    });
    if (lo === Infinity) { lo = top; hi = bottom; }
    return { lo, hi, top, bottom };
  }
  function measure() {
    vw = innerWidth;
    const list = parts.map((s) => ({ g: s.classList.contains('ab-night') ? 0 : 1, ...extent(s) }));
    g0 = list[0].g;
    bounds = [];
    for (let i = 1; i < list.length && bounds.length < MAX; i++) {
      if (list[i].g === list[i - 1].g) continue;
      // the quiet room between the last of one part and the first of the next
      const a = Math.min(list[i - 1].hi, list[i].top), b = Math.max(list[i].lo, list[i - 1].bottom);
      // The change is wider than that room: it may run on under the type, as long as dark words
      // stay on the light side of dawn and light words on the dark side (at the first and last
      // line it is about three quarters done, or a quarter).
      const room = Math.max(60, b - a), fold = Math.min(room * 0.08, 44);
      const half = clamp((room / 2 - fold) / 0.32, room * 0.42, innerHeight * 0.45);
      bounds.push({ y: (a + b) / 2, half, fold, g: list[i].g });
    }
    // the same changes on the screen, moved by the scroll each frame
    shown = bounds.map((b) => ({ ...b }));
    silk.view.bounds = shown;
    docH = root.scrollHeight;
    silk.size();
  }

  let lastY = -1, last = performance.now();
  function tick() {
    if (!silk.alive) return;
    const now = performance.now(), dt = Math.max(1 / 120, (now - last) / 1000);
    last = now;
    const sy = scrollY, moved = sy !== lastY, speed = lastY < 0 ? 0 : Math.abs(sy - lastY) / dt;
    lastY = sy;
    const V = silk.view, navH = nav ? nav.offsetHeight : 64;
    V.g0 = g0;
    for (let i = 0; i < bounds.length; i++) shown[i].y = bounds[i].y - sy;
    V.foot = docH - sy;
    V.drift = sy * silk.k.drift;
    V.nav = navH;
    silk.frame(moved, speed);
  }

  let rT;
  addEventListener('resize', () => { if (innerWidth !== vw) { clearTimeout(rT); rT = setTimeout(measure, 160); } });
  measure();
  window.gsap.ticker.add(tick);

  const api = {
    update: measure,
    // the ground under the nav, for its tone and the browser's colour
    at: (y) => silk.at(y),
    k: silk.k,
    get bounds() { return bounds; },
  };
  if (local) window.__silk = api;
  return api;
}
