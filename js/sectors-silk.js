// The Sectors page's ground: the silk (js/silk.js draws it), as on the About page and the way in.
//
// The loom lies on the night, and the reading parts on the paper; where they meet, the light comes
// through the silk along one of its folds, through a dawn blue, so no part has an edge. The page
// says which of its parts are night (.sx-night); where each change sits, and how wide it is, is
// measured from the parts' own content, so it happens in the quiet room between two of them.
// The page is two pages in one (the loom, or a sector), so it is measured again whenever it
// changes (update()). If WebGL is missing or lost, the class comes off and the parts' own grounds
// return. The nav is glass over it, and only asks the ground under it for its tone (at()).
import { createSilk } from './silk.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const MAX = 6;
const INK = 'h1, h2, h3, p, li, a, button, figure, aside, dl';

export function setupSectorsSilk({ reduced, isTouch, local }) {
  if (/[?&]silk=off/.test(location.search)) return null;
  const canvas = document.createElement('canvas');
  canvas.className = 'sx-silk';
  canvas.setAttribute('aria-hidden', 'true');
  const root = document.documentElement;
  const silk = createSilk(canvas, { reduced, isTouch, onLost: () => root.classList.remove('has-silk') });
  if (!silk) return null;
  document.body.prepend(canvas);
  root.classList.add('has-silk');
  silk.size();

  // ---- where the grounds change, measured from the content (in page pixels)
  let g0 = 0, bounds = [], shown = [], docH = 1, vw = 0;
  function extent(s) {
    const top = s.getBoundingClientRect().top + scrollY, bottom = top + s.offsetHeight;
    let lo = Infinity, hi = -Infinity;
    s.querySelectorAll(INK).forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      lo = Math.min(lo, r.top + scrollY);
      hi = Math.max(hi, r.bottom + scrollY);
    });
    if (lo === Infinity) { lo = top; hi = bottom; }
    return { lo, hi, top, bottom };
  }
  function measure() {
    vw = innerWidth;
    const parts = [...document.querySelectorAll('.sx-index:not([hidden]) > .sx-part:not([hidden]), .sx-sector:not([hidden]) > .sx-part')];
    if (!parts.length) return;
    const list = parts.map((s) => ({ g: s.classList.contains('sx-night') ? 0 : 1, ...extent(s) }));
    g0 = list[0].g;
    bounds = [];
    for (let i = 1; i < list.length && bounds.length < MAX; i++) {
      if (list[i].g === list[i - 1].g) continue;
      // the quiet room between the last of one part and the first of the next
      const a = Math.min(list[i - 1].hi, list[i].top), b = Math.max(list[i].lo, list[i - 1].bottom);
      const room = Math.max(60, b - a), fold = Math.min(room * 0.08, 44);
      const half = clamp((room / 2 - fold) / 0.32, room * 0.42, innerHeight * 0.45);
      bounds.push({ y: (a + b) / 2, half, fold, g: list[i].g });
    }
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
    const V = silk.view;
    V.g0 = g0;
    for (let i = 0; i < bounds.length; i++) shown[i].y = bounds[i].y - sy;
    V.foot = docH - sy + innerHeight * 4; // no first light at this page's foot
    V.drift = sy * silk.k.drift;
    V.nav = 0; // the nav is glass over the silk, so the silk runs to the top
    silk.frame(moved, speed);
  }

  let rT;
  addEventListener('resize', () => { if (innerWidth !== vw) { clearTimeout(rT); rT = setTimeout(measure, 160); } });
  measure();
  window.gsap.ticker.add(tick);

  const api = {
    update: measure,
    // the ground at a height on the screen, for the nav's tone and the browser's colour
    at: (y) => silk.at(y),
    k: silk.k,
    get bounds() { return bounds; },
  };
  if (local) window.__sxsilk = api;
  return api;
}
