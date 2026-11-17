// The simple site (16 Nov): Ink. The user: "one is there for the conversions, for the sales… on a
// simpler side where we are not doing some heavy stuff, but that is still creative in itself… for the
// people who don't have too much time." Its own pages (ink.html, ink-about.html, ink-sectors.html),
// light to load: no 3D but the team's coins. After IndigoEdge and the award sites, in the site's own
// taste: tight Inter Tight, the word that turns, numbers in Fragment Mono, paper and night, hairlines;
// since the second pass (16 Nov) pictures drawn from the site's own scenes (assets/ink/) and its own
// motion (js/ink-motion.js) in place of the creative site's living type. What every simple page
// shares is here: what every page shares (js/site.js), the motion, the nav's tone over the dark
// parts, links within the page, and blocks that settle in as they are reached. The Creative Corner
// is one page for both sites.

import { boot } from './site.js';
import { inkMotion } from './ink-motion.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

export function inkPage() {
  const ctx = boot();
  const { lenis, register, reduced, local } = ctx;
  // the motion: lines out of a mask, pictures like a curtain, numbers turning over (js/ink-motion.js)
  ctx.motion = inkMotion(ctx);
  // something done once, when a part first comes up the screen
  ctx.onEnter = (el, fn, start = 'top 88%') => (window.ScrollTrigger ? window.ScrollTrigger.create({ trigger: el, start, once: true, onEnter: fn }) : fn());

  // the nav takes the light tone over the dark parts (data-tone="light"): over whatever is under its
  // wordmark, where a part is only half the width
  const dark = $$('[data-tone="light"]:not(.nav)');
  const mark = $('.nav .wordmark');
  register({
    name: 'ink-dark', commit() {}, revert() {},
    under: (y) => {
      const x = mark ? mark.getBoundingClientRect().left + 20 : 80;
      return dark.some((d) => { const r = d.getBoundingClientRect(); return r.top <= y && r.bottom >= y && r.left <= x && r.right >= x; }) ? { tone: 'light', theme: '#0a101c' } : null;
    },
  });

  // links to a part of this page glide there; arriving with an address, the page goes there
  $$('a[href^="#"]:not([data-soon])').forEach((a) => {
    const id = a.getAttribute('href');
    if (id.length < 2 || !$(id)) return;
    a.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(id, { duration: 1.4, offset: -10 }); });
  });
  const arrive = location.hash.length > 1 && $(location.hash);
  if (arrive) addEventListener('load', () => setTimeout(() => { lenis.resize?.(); lenis.scrollTo(arrive, { immediate: true, force: true }); }, 120), { once: true });

  // blocks settle in once, as they come up the screen: a short rise, nothing more
  const blocks = $$('[data-settle]');
  if (!reduced && 'IntersectionObserver' in window) {
    document.documentElement.classList.add('ik-settling');
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      io.unobserve(e.target);
    }), { rootMargin: '0px 0px -10% 0px' });
    blocks.forEach((b) => io.observe(b));
    // (never left hidden: anything not reached in a few seconds after load shows anyway)
    addEventListener('load', () => setTimeout(() => blocks.forEach((b) => { if (b.getBoundingClientRect().top < innerHeight) b.classList.add('is-in'); }), 400), { once: true });
  }
  if (local) window.__ink = { blocks, show: () => blocks.forEach((b) => b.classList.add('is-in')) };
  return ctx;
}
