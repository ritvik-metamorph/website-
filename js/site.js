// What every page of the site shares: smooth scroll, the word that turns in its headings (js/turn.js), the "coming next" message for links with
// nowhere to go yet, the nav that takes the tone of whatever is under it (and the Ink and Light
// registry behind it), and the wordmark's anagram. Each page's own script calls boot() first.

import { setupSignature } from './signature.js';
import { setupTurn } from './turn.js';
import { setupKinetic } from './kinetic.js';

const { gsap, ScrollTrigger, CustomEase, Lenis } = window;

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

export function boot() {
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  CustomEase.create('expo', '0.16, 1, 0.3, 1');
  ScrollTrigger.config({ ignoreMobileResize: true });

  const local = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  // (local testing only: ?motion=reduced stands in for the system's reduce-motion setting)
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || (local && /motion=reduced/.test(location.search));
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const nav = $('.nav');
  const toast = $('.toast');

  // ?accent=<name>: the word that turns in another face, to compare (14 Nov, refs/accent.html, two
  // rounds). Cormorant, semibold, was chosen and is the site's own now (css/main.css --accent,
  // --accent-weight); the others stay to compare, at their regular weight. Kept for the visit, so it
  // follows from page to page; ?accent=cormorant goes back. (A new key, so a face tried before the choice is not still remembered.) Each sets the italic for whole lines (--accent) and may set the
  // turning word in a heading apart from it (--accent-word, with its own style, size and spacing).
  const FS = (f) => `https://api.fontshare.com/v2/css?f[]=${f}&display=swap`;
  const GF = (f) => `https://fonts.googleapis.com/css2?family=${f}&display=swap`;
  const ACCENTS = {
    // the second round
    bespoke: { face: "'Bespoke Serif'", url: FS('bespoke-serif@400,401,500,501') },
    baskerville: { face: "'Baskervville'", url: GF('Baskervville:ital@1') },
    copperplate: { face: "'Baskervville'", url: GF('Baskervville:ital@1'), word: "'Pinyon Script', cursive", style: 'normal', wordAdjust: '.42', lh: '0', track: '0em' },
    brygada: { face: "'Brygada 1918'", url: GF('Brygada+1918:ital,wght@1,400..600') },
    zodiak: { face: "'Zodiak'", url: FS('zodiak@400,401') },
    besley: { face: "'Besley'", url: GF('Besley:ital,wght@1,400..600') },
    grotesk: { face: "'Inter Tight'", adjust: 'none', wordAdjust: 'none', track: 'inherit', weight: 'inherit' },
    // the first six
    instrument: { face: "'Instrument Serif'", url: GF('Instrument+Serif:ital@0;1') },
    boska: { face: "'Boska'", url: FS('boska@400,401,500,501') },
    gambetta: { face: "'Gambetta'", url: FS('gambetta@400,401,500,501') },
    newsreader: { face: "'Newsreader'", url: GF('Newsreader:ital,opsz,wght@1,6..72,300..500') },
    cormorant: { face: "'Cormorant'", url: GF('Cormorant:ital,wght@1,400..600') },
    garamond: { face: "'EB Garamond'", url: GF('EB+Garamond:ital,wght@1,400..500') },
    source: { face: "'Source Serif 4'", url: GF('Source+Serif+4:ital,opsz,wght@1,8..60,300..500') },
  };
  let accent = new URLSearchParams(location.search).get('accent');
  try {
    if (accent) sessionStorage.setItem('mm-accent-3', accent);
    else accent = sessionStorage.getItem('mm-accent-3');
  } catch (e) {}
  const A = ACCENTS[accent];
  if (A) {
    if (A.url) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = A.url;
      document.head.append(link);
    }
    const set = (k, v) => v != null && document.documentElement.style.setProperty(k, v);
    set('--accent', `${A.face}, Georgia, 'Times New Roman', serif`);
    set('--accent-adjust', A.adjust);
    set('--accent-word', A.word);
    set('--accent-style', A.style);
    set('--accent-word-adjust', A.wordAdjust);
    set('--accent-lh', A.lh);
    set('--accent-track', A.track);
    set('--accent-weight', A.weight ?? (accent === 'cormorant' ? '600' : '400'));
  }

  // ---------------------------------------------------------------- smooth scroll

  const lenis = new Lenis({ lerp: reduced ? 1 : 0.1, smoothWheel: !reduced });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // ---------------------------------------------------------------- links that have nowhere to go yet
  // (listened for on the page, so links drawn later by a section are covered too)

  let toastTimer;
  const say = (msg) => {
    toast.textContent = msg;
    toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('is-on'), 2200);
  };
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('[data-soon]')) return;
    e.preventDefault();
    say('This part of the site is coming next.');
  });

  // ---------------------------------------------------------------- Ink and Light, page-wide
  // Every section with a Light version registers here. The nav's switch lights or returns all of
  // them; the nav itself takes the tone of whatever is under it, and its switch shows that
  // section's state. under(y) answers { lit, tone } when the section is under that height; cover()
  // answers the same while the section covers the whole page. Either may add the browser's
  // colour for the page (theme). A section both versions share (the hero) leaves lit out, and the
  // switch shows the version chosen for the whole page.

  // The visitor's choice (made on the way in, js/emerge.js, or with the switch) is kept for the
  // next page: savedMode() answers 'ink', 'light' or null.
  const sections = [];
  const register = (s) => sections.push(s);
  // (16 Nov) the two versions are two sites: the simple one (Ink: its own pages, ink*.html, for a quick
  // read and a decision) and the creative one (Light: these pages, for the vision). A page says which
  // it is and its twin in the other (data-site, data-twin on <html>); choosing the other version
  // there goes to the twin, and is remembered. Sections that have both versions on one page (the
  // team's room, the services' note) still commit and revert as before.
  const site = document.documentElement.dataset.site || '', twin = document.documentElement.dataset.twin || '';
  let pageLit = site === 'light';
  const setMode = (light, { save = true } = {}) => {
    if (site && twin && (light ? 'light' : 'ink') !== site) {
      try { localStorage.setItem('mm-mode', light ? 'light' : 'ink'); } catch (e) {}
      const keep = /frames=timer/.test(location.search) ? '?frames=timer' : '';
      setTimeout(() => location.assign(twin + keep + location.hash), 260);
      return;
    }
    pageLit = light;
    sections.forEach((s) => (light ? s.commit() : s.revert()));
    if (save) try { localStorage.setItem('mm-mode', light ? 'light' : 'ink'); } catch (e) {}
  };
  const savedMode = () => { try { return localStorage.getItem('mm-mode'); } catch (e) { return null; } };
  $$('[data-set-mode]').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.setMode === 'light')));
  const themeMeta = $('meta[name="theme-color"]');
  let navTone = '', navLit = null, navTheme = '';
  gsap.ticker.add(() => {
    const y = nav.offsetHeight / 2;
    let state = { tone: 'ink' };
    // a section showing something over the whole page (a coin held up close) speaks for it
    const cover = sections.map((s) => s.cover?.()).find(Boolean);
    if (cover) state = cover;
    else for (const s of sections) { const t = s.under(y); if (t) { state = t; break; } }
    if (state.tone !== navTone) navTone = nav.dataset.tone = state.tone;
    const theme = state.theme || (state.tone === 'light' ? '#050706' : '#f2f3ef');
    if (theme !== navTheme) navTheme = themeMeta.content = theme;
    // (the switch shows which site this is; where a page has no twin, the section under the nav says)
    const lit = site ? site === 'light' : (state.lit ?? pageLit);
    if (lit !== navLit) {
      navLit = lit;
      $$('[data-set-mode]').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.setMode === 'light') === navLit)));
    }
  });

  // ---------------------------------------------------------------- the menu
  // (after the Unscene tickets site) On a phone, and wherever the links do not fit in the pill, the
  // menu button opens the site's pages as a plain list over the page, on the ground of the tone the
  // nav is in. Choosing one, the button again, or Escape closes it. While it is open the page
  // under it stands still.

  const menuBtn = $('.nav-menu'), menu = $('.menu');
  let menuOpen = false, wasStopped = false;
  const setMenu = (open) => {
    if (!menu || open === menuOpen) return;
    menuOpen = open;
    if (open) menu.dataset.tone = nav.dataset.tone || 'ink';
    document.documentElement.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.inert = !open;
    // (a page that had already stopped the scroll, for an open coin or piece, keeps it stopped)
    if (open) { wasStopped = lenis.isStopped; lenis.stop(); } else if (!wasStopped) lenis.start();
  };
  menuBtn?.addEventListener('click', () => setMenu(!menuOpen));
  // (it closes before the link does its work, so a link that scrolls the page finds it moving again)
  menu?.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); }, true);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && menuOpen) { setMenu(false); menuBtn.focus(); } });
  // grown wide enough for the links, the menu has nothing to do
  addEventListener('resize', () => { if (menuOpen && getComputedStyle(menuBtn).display === 'none') setMenu(false); });

  // ---------------------------------------------------------------- METAMORPH is MOTHER MAP
  // An Easter egg: rest the cursor on the wordmark and its letters sort themselves into the anagram.
  // (The wordmark is a placeholder; when the client's logo arrives this moves to a line of type.)

  const mark = $('.wordmark');
  if (mark && !isTouch && !reduced) {
    const FROM = 'Metamorph';
    const TO = [0, 4, 2, 7, 6, 1, 5, 8, 3]; // where each letter of Metamorph sits in "Mother map"
    mark.setAttribute('aria-label', 'Metamorph, home');
    mark.textContent = '';
    const letters = [...FROM].map((ch) => {
      const s = document.createElement('span');
      s.className = 'wm-l';
      s.setAttribute('aria-hidden', 'true');
      s.textContent = ch;
      mark.append(s);
      return s;
    });
    const note = document.createElement('span');
    note.className = 'wm-note';
    note.setAttribute('aria-hidden', 'true');
    note.textContent = 'Metamorph, rearranged.';
    mark.append(note);
    // measure where each letter of "Mother map" would sit, in the same type
    const ghost = document.createElement('span');
    ghost.className = 'wm-ghost';
    ghost.setAttribute('aria-hidden', 'true');
    [...'Mother map'].forEach((ch) => { const s = document.createElement('span'); s.textContent = ch; ghost.append(s); });
    mark.append(ghost);
    let timer, sorted = false;
    const sort = (on) => {
      sorted = on;
      const slots = [...ghost.children].filter((s) => s.textContent !== ' ').map((s) => s.offsetLeft);
      letters.forEach((l, i) => {
        gsap.to(l, {
          keyframes: { x: [0, (on ? slots[TO[i]] - l.offsetLeft : 0)], y: [0, on ? -9 - (i % 3) * 4 : 6, 0] },
          duration: 0.9, ease: 'power3.inOut', delay: i * 0.035, overwrite: true,
        });
      });
      mark.classList.toggle('is-sorted', on);
    };
    mark.addEventListener('pointerenter', () => { timer = setTimeout(() => sort(true), 900); });
    mark.addEventListener('pointerleave', () => { clearTimeout(timer); if (sorted) sort(false); });
  }

  // the signature at the foot of every page (js/signature.js); registered first, so the nav over it
  // follows it before any section of the page
  const signature = setupSignature({ register, reduced, isTouch });

  // for whoever opens the console: the name's own secret, set in the site's two faces
  console.log('%cMetamorph%c  rearranged  %cMother map', 'font: 600 26px/1.3 "Inter Tight", sans-serif; letter-spacing: -.05em', 'font: 11px ui-monospace, monospace; color: #8a93a6', 'font: italic 600 30px/1.3 Cormorant, Georgia, serif');

  // the word that turns, in the headings that ask for it (js/turn.js)
  setupTurn({ reduced, local });
  // (a page-to-page transition the browser decides to skip, on a reload say, is not an error to report)
  const quiet = (e) => { e.viewTransition?.ready?.catch(() => {}); e.viewTransition?.finished?.catch(() => {}); };
  addEventListener('pageswap', quiet);
  addEventListener('pagereveal', quiet);

  // living type: the big headings fill out as they arrive, gather weight under the pointer and lean
  // with the page's speed (js/kinetic.js); a page adds headings it builds later with kinetic.add().
  // (the simple site has its own motion instead: lines rising out of a mask, js/ink-motion.js)
  const kinetic = site === 'ink' ? { add() {} } : setupKinetic({ lenis, reduced, isTouch, local });

  if (local) { window.__lenis = lenis; window.__sig = signature; }
  return { lenis, register, setMode, savedMode, reduced, isTouch, local, say, kinetic };
}
