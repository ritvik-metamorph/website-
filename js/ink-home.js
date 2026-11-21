// The simple home (ink.html; js/ink.js says what the simple site is): since 21 Nov the film hero alone, one screen
// (a reel stands in until the film exists). What was under it (the services, the conditions, the team on their coins,
// the founder's grid, the Creative Corner's work, the end) is on its own pages now; the team is on the simple About
// (js/ink-about.js). Backup simple-home-before-hero-only-2026-11-21.

import { inkPage } from './ink.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const ctx = inkPage();
const { lenis, reduced, local } = ctx;
const narrow = () => matchMedia('(max-aspect-ratio: 1/1), (max-width: 899px) and (min-height: 521px)').matches;

// ---------------------------------------------------------------- the film, and the reel before it
// the reel's later frames are fetched once the page has opened; when the film's address is set
// (data-src on the video) it plays over the reel, muted and looping
const film = $('.ik-film'), v = $('.ik-film-v');
addEventListener('load', () => setTimeout(() => $$('.ik-reel img[data-src]').forEach((im) => { im.src = im.dataset.src; im.removeAttribute('data-src'); }), 600), { once: true });
if (v && v.dataset.src) {
  if (v.dataset.poster) v.poster = v.dataset.poster;
  v.src = v.dataset.src;
  v.addEventListener('canplay', () => { film.classList.add('has-film'); if (!reduced) v.play().catch(() => {}); }, { once: true });
  v.load();
}

// (19 Nov, the user's sketches) the line on the paper under the film's frame, one line on a laptop, as wide as the room
// the words beside it leave; on a phone it wraps at its own size, the words under it
const heroLine = $('.ik-hero .title'), frame = $('.ik-frame');
const fitHero = () => {
  if (!heroLine || !frame) return;
  const row = heroLine.closest('.ik-hero-foot') || heroLine.parentElement;
  if (narrow()) { heroLine.style.fontSize = ''; row.style.removeProperty('--hfs'); return; }
  heroLine.style.fontSize = '100px';
  const side = row.querySelector('.ik-hero-in'), gap = parseFloat(getComputedStyle(row).columnGap) || 0;
  const lw = heroLine.offsetWidth, room = (row.clientWidth - (side ? side.offsetWidth + gap : 0)) * 0.995;
  if (lw > 50 && room > 50) heroLine.style.fontSize = `${(Math.floor((1000 * room * 0.995) / lw) / 10).toFixed(1)}px`;
  // (the headline's size, for the practice's line under it to stand clear of the italic f's tail)
  row.style.setProperty('--hfs', heroLine.style.fontSize);
};
fitHero();
document.fonts?.ready.then(fitHero);
addEventListener('mm:type', fitHero); // (another sans to compare, once it has loaded: js/site.js)
if (frame) new ResizeObserver(fitHero).observe(frame);

// (20 Nov; the user: too much empty paper under the hero, kept clear for the change-of-version button) the button is seated
// in the hero, in the slot beside Raise capital, the two ways on together; as the page is read (the first half screen of
// scroll) it glides down to its corner and stays there. With the menu open it is in its corner.
{
  const vx = $('.vx'), slot = $('.ik-vx-slot');
  if (vx && slot) {
    let base = null;
    const measure = () => {
      vx.style.translate = '';
      const r = vx.getBoundingClientRect();
      if (!r.width) return;
      base = { x: r.left, y: r.top };
      slot.style.width = `${Math.round(r.width)}px`;
      slot.style.height = `${Math.round(r.height)}px`;
    };
    const dock = () => {
      if (!base) return;
      const s = slot.getBoundingClientRect();
      const open = document.documentElement.classList.contains('menu-open');
      // (21 Nov: while the page is held to one screen, ik-one below, the button stays in its seat)
      const held = document.documentElement.classList.contains('ik-one');
      const p = open ? 1 : held ? 0 : Math.min(1, Math.max(0, (lenis?.scroll ?? scrollY) / (innerHeight * 0.45)));
      const e = p * p * (3 - 2 * p);
      const dx = (s.left - base.x) * (1 - e), dy = (s.top - base.y) * (1 - e);
      const t = Math.abs(dx) + Math.abs(dy) < 0.5 ? '' : `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      if (t !== vx.style.translate) vx.style.translate = t;
    };
    measure(); dock();
    addEventListener('resize', () => { measure(); dock(); });
    document.fonts?.ready.then(() => { measure(); dock(); });
    gsap.ticker.add(dock);
  }
}

// (21 Nov; the user: the simple hero was "still scrollable", with "a lot of elasticity") the page is one screen, so
// nothing scrolls. The smooth scroll had kept an older height (67px of room on a laptop), so a wheel or a swipe lifted
// the words and slid Enter Light out of its seat and back; while the hero fits the window it is stopped at the top and
// the page is held (ik-one, css/ink.css). A window too short for the hero still scrolls, so nothing is out of reach.
{
  const root = document.documentElement;
  const hold = () => {
    lenis.resize?.();
    const fits = root.scrollHeight <= innerHeight + 1;
    root.classList.toggle('ik-one', fits);
    if (fits) {
      if (lenis.scroll) lenis.scrollTo(0, { immediate: true, force: true });
      lenis.stop();
    } else if (!root.classList.contains('menu-open')) lenis.start();
  };
  hold();
  document.fonts?.ready.then(hold);
  addEventListener('load', hold, { once: true });
  addEventListener('resize', hold);
}

// (localhost only: a handle for checking the film)
if (local) window.__inkHome = { film, v };
