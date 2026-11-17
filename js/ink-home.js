// The simple home (ink.html; js/ink.js says what the simple site is). The film hero (a reel stands in
// until the film exists), the services beside the note in four forms, the conditions, the team on
// their coins (in Ink; the room's light is the creative site's), the founder's grid running past and
// drawn, the Creative Corner's work going by, and the end.

import { inkPage } from './ink.js';
import { setupTeam } from './team.js';
import { ATLAS } from './atlas-data.js';
import { drawLoom } from './ink-loom.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// (the forty-eight are written in before the motion sets the line running: js/ink-motion.js doubles them)
const marq = $('.ik-marq-t');
if (marq) marq.innerHTML = ATLAS.sectors.map((s) => `<a href="sectors.html#${s.id}" tabindex="-1"><span class="mq-a">${esc(s.name)}</span><span class="mq-b">${esc(s.name)}</span></a><i aria-hidden="true"></i>`).join('');

const ctx = inkPage();
const { lenis, register, reduced, isTouch, local, onEnter } = ctx;
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

// ---------------------------------------------------------------- the services, beside the note
// the note takes the form of whichever service is in the middle of the screen (or under the pointer),
// the new form drawn up over the last like a blind
const stage = $('.ik-svc-pics'), shots = $$('.ik-svc-pic'), items = $$('.ik-svc li'), cap = $('.ik-svc-cap');
let current = 0, z = 1;
function form(i) {
  if (i === current || !shots[i]) return;
  current = i;
  shots[i].style.zIndex = ++z;
  shots.forEach((s, k) => s.classList.toggle('is-on', k === i));
  items.forEach((li, k) => li.classList.toggle('is-on', k === i));
  if (cap) cap.innerHTML = `<b>${String(i + 1).padStart(2, '0')}</b><span>${esc(items[i].dataset.form)}</span>`;
}
items[0]?.classList.add('is-on');
if (ScrollTrigger) items.forEach((li, i) => ScrollTrigger.create({ trigger: li, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => { if (st.isActive) form(i); } }));
if (!isTouch) items.forEach((li, i) => li.addEventListener('pointerenter', () => form(i)));

// ---------------------------------------------------------------- the founder's grid
// the forty-eight running past (written in above; each leans into the italic under the pointer, the
// word that turns), the nine families with how many of the forty-eight are in each, and the grid
const fams = $('.ik-on-fams');
if (fams) {
  const n = (k) => ATLAS.sectors.filter((s) => s.fam === k).length;
  fams.innerHTML = Object.entries(ATLAS.families).map(([k, name]) => `<span>${name}<i>${n(k)}</i></span>`).join('');
}
drawLoom($('[data-loom]'), { reduced, onEnter });

// ---------------------------------------------------------------- the corner's work, going by
const strip = $('.ik-cc-strip'), track = $('.ik-cc-track');
if (strip && ScrollTrigger && !reduced) {
  gsap.fromTo(track, { x: () => innerWidth * (narrow() ? 0.04 : 0.18) }, {
    x: () => -(track.scrollWidth - innerWidth * 0.82), ease: 'none',
    scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: 0.8, invalidateOnRefresh: true },
  });
}

setupTeam({ lenis, register, reduced, isTouch, local });
if (local) window.__inkHome = { form, get current() { return current; } };
