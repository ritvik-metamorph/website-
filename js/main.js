// The home page: the hero, the services (the note) and the team. What every page shares (smooth
// scroll, the nav, Ink and Light) is in js/site.js; the Creative Corner has its own page
// (creative.html, js/creative-page.js).

import { boot } from './site.js';
import { setupEmerge } from './emerge.js';
import { setupOrb } from './orb.js';
import { setupGather } from './hero-gather.js';
import { setupEye } from './hero-eyespot.js';
import { setupEmergence } from './hero-emergence.js';
import { setupEmergenceRings } from './hero-rings.js';
import { setupFlight } from './hero-flight.js';
import { setupAscent } from './hero-ascent.js';
import { setupTeam } from './team.js';
import { setupServices } from './services.js';

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const { lenis, register, setMode, savedMode, reduced, isTouch, local } = boot();
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

setupOrb({ lenis, register, reduced, isTouch, local });
// heroes 2, 3 and 4, stacked under the first for the client to choose from (10 Nov); all dark, the last hands over to paper
setupGather({ lenis, reduced, isTouch, local });
setupEye({ lenis, reduced, isTouch, local });
setupEmergence({ lenis, reduced, isTouch, local });
setupEmergenceRings({ lenis, reduced, isTouch, local });
setupFlight({ lenis, reduced, isTouch, local });
setupAscent({ lenis, reduced, isTouch, local });
register({
  name: 'heroes', commit() {}, revert() {},
  under: (y) => ($$('.hv').some((h) => { const r = h.getBoundingClientRect(); return r.top <= y && r.bottom >= y && h.dataset.paper !== 'true'; }) ? { tone: 'light' } : null),
});
setupTeam({ lenis, register, reduced, isTouch, local });
// later in the visit, the version chosen on the way in
// (the simple version has its own pages since 16 Nov, so this page is always the creative one)
if (!gated) setMode(true, { save: false });
