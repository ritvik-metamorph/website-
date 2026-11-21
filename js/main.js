// The home page: the hero, the services (the note) and the team. What every page shares (smooth
// scroll, the nav, Ink and Light) is in js/site.js; the Creative Corner has its own page
// (creative.html, js/creative-page.js).

import { boot } from './site.js';
import { setupEmerge } from './emerge.js';
// (20 Nov: heroes 1 to 6 left the page, the user kept 7 and 8; their scripts are kept, unloaded, and backed up at
// heroes-before-keeping-7-and-8-2026-11-20. The metrics panel hero 1 held is js/orbit-panel.js now.)
import { setupPanel } from './orbit-panel.js';
import { setupRise } from './hero-rise.js';
import { setupAscent } from './hero-ascent.js';
import { setupOrbits } from './hero-orbits.js';
import { setupTeam } from './team.js';
import { setupServices } from './services.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const { lenis, register, setMode, savedMode, reduced, isTouch, local } = boot();
// ?hero=n: that hero alone, straight after the way in (19 Nov; to show one as it will be once the client has chosen)
{ const only = new URLSearchParams(location.search).get('hero'); if (/^[789]$/.test(only || '')) document.documentElement.dataset.hero = only; }
// the way in first, so the cocoon is being spun while the rest is set up
const gated = document.documentElement.classList.contains('gate');
setupEmerge({ lenis, setMode, reduced, isTouch, local });

// (the services and the team are in the pill's links and in the menu)
$$('[data-services]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo('#services', { duration: 1.6 }); }));
$('[data-top]').addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo(0, { duration: 1.4 }); });
$$('[data-team]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); lenis.scrollTo('#team', { duration: 1.8 }); }));
// arriving from another page with a section's address: go there once the page has its height
const arrive = /^#(services|team)$/.test(location.hash) && $(location.hash);
if (arrive) addEventListener('load', () => setTimeout(() => { lenis.resize?.(); lenis.scrollTo(arrive, { immediate: true, force: true }); }, 120), { once: true });

// the services: a list on paper in Ink, the note in Light (js/services.js)
setupServices({ lenis, register, reduced, isTouch, local });

// the metrics panel every hero opens (an orbit, a discipline or a sector)
const panel = setupPanel({ lenis, reduced });
// the heroes, for the client to choose from: 9, the ascent in grain (the user's combination of the other two), 7, the
// ascent, then 8, the orbits in grain, which hands over to the paper
setupRise({ lenis, reduced, isTouch, local });
setupAscent({ lenis, reduced, isTouch, local });
setupOrbits({ lenis, reduced, isTouch, local });
if (local) window.__panel = panel;
register({
  name: 'heroes', commit() {}, revert() {},
  under: (y) => ($$('.hv').some((h) => { const r = h.getBoundingClientRect(); return r.top <= y && r.bottom >= y && h.dataset.paper !== 'true'; }) ? { tone: 'light' } : null),
});
setupTeam({ lenis, register, reduced, isTouch, local });
// later in the visit, the version chosen on the way in
// (the simple version has its own pages since 16 Nov, so this page is always the creative one)
if (!gated) setMode(true, { save: false });
