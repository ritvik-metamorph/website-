// The simple About (ink-about.html; js/ink.js says what the simple site is): the same story, stages,
// practice, conditions and founders as the creative About, set in type at a reading pace. Since 21 Nov the one
// place for who Metamorph is on the simple site: it opens with the name's dictionary entry and its numbers, and the
// whole team on their coins follows the founders (both moved from the simple home, which is the hero alone now).

import { inkPage } from './ink.js';
import { createCoin } from './coin.js';
import { setupTeam } from './team.js';

const ctx = inkPage();
// (20 Nov) the four services are a short index now, each opening its place on the Services page (ink-about.html,
// ?from=about); the place on this page is kept for the way back (js/ink.js, data-keep-place)

// ---------------------------------------------------------------- who: the founders' coins
// (18 Nov, the user: "use real coins in simple website too which can be interacted with") The same
// struck silver coins as the creative About and the team (js/coin.js), in place of their pictures: the
// engraved portrait (a stand-in until their photographs come), the name round the top, "Co-founder"
// below; on the back "In his own words" (or hers) and "To come", since their words are theirs to give.
// Drag one to turn it, tap it to turn it over (Enter or Space from the keyboard). They arrive turning
// as the section comes up, and rest while it is off the screen. Without WebGL the pictures stay.
const FOUNDERS = [
  { name: 'Ritvik', legend: 'Co-founder', backTop: 'In his own words', before: 'To come', look: { hair: 0, tilt: -0.04, shoulders: 1.0, tone: 0.6, suit: 0.24 } },
  { name: 'Gurleen', legend: 'Co-founder', backTop: 'In her own words', before: 'To come', look: { hair: 2, tilt: 0.05, shoulders: 0.92, tone: 0.56, suit: 0.32 } },
];
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isTouch = matchMedia('(hover: none)').matches;
const coins = [];
document.querySelectorAll('.ika-coin').forEach((fig, k) => {
  const p = FOUNDERS[k];
  if (!p) return;
  const cv = document.createElement('canvas');
  cv.className = 'ika-coin-gl';
  cv.tabIndex = 0;
  cv.setAttribute('role', 'button');
  cv.setAttribute('aria-label', `${p.name}, founder, struck on a silver coin. Drag to turn it; press to turn it over`);
  fig.append(cv);
  let coin = null;
  try { coin = createCoin(cv, { person: p, reduced, size: isTouch ? 1024 : 2048 }); } catch (e) { coin = null; }
  if (!coin) { cv.remove(); return; }
  fig.classList.add('is-live');
  coin.pause();
  cv.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); coin.flip(); } });
  coins.push({ coin, fig, arrived: false });
});
const layout = () => coins.forEach(({ coin, fig }) => {
  const w = fig.clientWidth, h = fig.clientHeight;
  if (w > 1) coin.layout({ W: w, H: h, cx: w / 2, cy: h / 2, r: w * 0.38 });
});
layout();
addEventListener('resize', layout);
const who = document.getElementById('ika-who-h')?.closest('section');
if (coins.length && who && 'IntersectionObserver' in window) {
  new IntersectionObserver(([e]) => coins.forEach((c, k) => {
    if (!e.isIntersecting) { c.coin.pause(); return; }
    c.coin.resume();
    layout();
    if (!c.arrived) { c.arrived = true; setTimeout(() => c.coin.arrive(), reduced ? 0 : k * 250); }
  }), { rootMargin: '120px 0px' }).observe(who);
} else coins.forEach((c) => c.coin.resume());
// (localhost only: a handle for checking them)
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__inkCoins = coins;

// ---------------------------------------------------------------- the team: everyone struck on a coin (js/team.js), as the home had it
// (crew: without the two placeholder co-founders, the real founders being just above)
setupTeam({ lenis: ctx.lenis, register: ctx.register, reduced: ctx.reduced, isTouch: ctx.isTouch, local: ctx.local, crew: true });
