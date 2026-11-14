// The way in: the home page's loading screen, and a choice (js/emerge-scene.js draws it).
//
// - While the site loads, a cocoon of silver net is spun round its pupa, as far as the page has
//   loaded. The moment it has, the pupa stirs, the net splits and a butterfly unfurls out of it.
//   Drag it to turn it.
// - Then two ways in: Ink, the simple version, for a quick look, and Light, the creative version,
//   to take it all in. Look at one and the butterfly turns to it.
// - Where to change your mind later: the word you choose flies up into the Ink · Light switch at
//   the top right as the page opens, and the switch says so for a moment.
// - The ground is the silk (js/silk.js), as on the About page: light above, falling through a
//   dawn blue into the night the butterfly hangs in, so its thread comes down out of the light.
//   The light comes in as the site loads. Look at Ink, the simple version (the paper one), and the
//   light comes further down; look at Light, the creative version (the dark room), and the night
//   takes it back. Choosing carries that on as the butterfly goes.
// Once a visit (sessionStorage); ?intro shows it again. The choice is kept for every page.
import { createEmergeScene } from './emerge-scene.js';
import { createSilk } from './silk.js';

const { gsap } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

export function setupEmerge({ lenis, setMode, reduced, isTouch, local }) {
  const html = document.documentElement;
  const root = $('.emerge');
  if (!root) return;
  if (!html.classList.contains('gate')) { root.remove(); return; }
  window.gateClaimed = true; // the page head lets the gate go by itself only if this never runs
  lenis.stop();
  root.focus({ preventScroll: true });

  // ---------------------------------------------------------------- the ground: the silk
  const silkCanvas = $('.em-silk', root);
  let silk = null;
  try { silk = silkCanvas ? createSilk(silkCanvas, { reduced, isTouch, onLost: () => root.classList.remove('has-silk') }) : null; } catch (e) { console.warn('silk', e); }
  if (silk) root.classList.add('has-silk'); else silkCanvas?.remove();
  // where the light ends, as a share of the screen's height from its top: above the screen before
  // the site has loaded, coming in as it loads, then resting; further down for Ink, back up for
  // Light, and on with the choice
  const HZ = { from: -0.26, rest: 0.22, ink: 0.31, light: 0.03, goInk: 0.44, goLight: -0.32 };
  const H = { hz: reduced ? HZ.rest : HZ.from };
  const band = { y: 0, half: 1, fold: 1, g: 0 };
  const markEl = $('.em-mark', root), markY = markEl.offsetTop + markEl.offsetHeight / 2;
  const isNarrow = () => matchMedia('(max-aspect-ratio: 1/1), (max-width: 899px) and (min-height: 521px)').matches;
  let lastHz = null, lastVh = 0, markLight = null;
  if (silk) { silk.view.g0 = 1; silk.view.bounds = [band]; }
  function ground() {
    if (!silk?.alive) return;
    const vh = innerHeight, moved = H.hz !== lastHz || vh !== lastVh;
    lastHz = H.hz;
    lastVh = vh;
    band.y = H.hz * vh;
    band.half = vh * (isNarrow() ? 0.17 : 0.21);
    band.fold = vh * 0.035;
    // the name at the top reads in ink on the light, and in light on the night
    const onLight = silk.at(markY).g > 0.5;
    if (onLight !== markLight) { markLight = onLight; markEl.classList.toggle('is-on-light', onLight); }
    silk.frame(moved);
  }
  gsap.ticker.add(ground);
  const lightTo = (hz, duration = 1.6, ease = 'power3.out') => gsap.to(H, { hz, duration: reduced ? 0 : duration, ease, overwrite: true });

  const hint = $('.em-drag', root);
  const scene = createEmergeScene($('.em-gl', root), {
    onTurn: () => hint.classList.add('is-done'),
    transparent: !!silk, // the butterfly over the silk; without it, on the room's own dark
  });
  if (!scene) root.classList.add('no-gl');
  const S = scene ? scene.state : {};

  // ---------------------------------------------------------------- loading
  // what the home page needs before it opens: its type, and everything it loads. The net is spun
  // as far as that has come, and never in less than MIN seconds, so the spinning is seen.

  const count = $('.em-load-n', root);
  const need = [
    document.fonts?.ready ?? Promise.resolve(),
    document.readyState === 'complete' ? Promise.resolve() : new Promise((r) => addEventListener('load', r, { once: true })),
  ];
  const total = need.length + 1;
  let done = 1;
  need.forEach((p) => p.then(() => { done++; }));
  const giveUp = setTimeout(() => { done = total; }, 9000);
  const MIN = reduced ? 0 : 1.9;
  const t0 = performance.now();
  let shown = 0, emerged = false;
  function loading() {
    const el = (performance.now() - t0) / 1000;
    const target = Math.min(done / total, MIN ? el / MIN : 1);
    shown += (target - shown) * (reduced ? 1 : 0.14);
    if (target >= 1 && shown > 0.996) shown = 1;
    count.textContent = Math.round(shown * 100);
    S.weave = shown;
    if (!reduced) H.hz = HZ.from + (HZ.rest - HZ.from) * (1 - (1 - shown) ** 2); // the light comes in as the site does
    if (shown === 1 && !emerged) emerge();
  }
  gsap.ticker.add(loading);

  // ---------------------------------------------------------------- the emergence

  function emerge() {
    emerged = true;
    gsap.ticker.remove(loading);
    clearTimeout(giveUp);
    root.classList.add('is-loaded');
    if (reduced || !scene) { S.morph = 1; ready(); return; }
    gsap.timeline()
      // the pupa stirs twice, then the net splits and the wings come
      .to(S, { twitch: 1, duration: 0.14, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 0)
      .to(S, { twitch: 1, duration: 0.12, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 0.75)
      .to(S, { morph: 1, duration: 3.1, ease: 'power1.inOut' }, 0.95)
      .add(ready, 2.1);
  }
  let isReady = false;
  function ready() {
    if (isReady) return;
    isReady = true;
    root.classList.add('is-ready');
  }

  // ---------------------------------------------------------------- two ways in

  let going = false;
  $$('.em-way', root).forEach((b) => {
    const light = b.dataset.way === 'light';
    const look = () => { if (!going) { S.lean = light ? 1 : -1; S.tone = light ? 1 : -1; lightTo(light ? HZ.light : HZ.ink); } };
    const away = () => { if (!going) { S.lean = 0; S.tone = 0; lightTo(HZ.rest); } };
    b.addEventListener('pointerenter', look);
    b.addEventListener('pointerleave', away);
    b.addEventListener('focus', look);
    b.addEventListener('blur', away);
    b.addEventListener('click', () => go(light, b));
  });

  function go(light, b) {
    if (going || !isReady) return;
    going = true;
    try { sessionStorage.setItem('mm-entered', '1'); } catch (e) {}
    setMode(light);
    root.classList.add('is-going');
    b.classList.add('is-chosen');
    const d = reduced ? 0.3 : 1;
    // the butterfly flies, and the page under it begins
    if (S.morph < 1) gsap.to(S, { morph: 1, duration: 0.5, overwrite: true });
    gsap.to(S, { exit: 1, duration: 1.7 * d, ease: 'power2.in' });
    lightTo(light ? HZ.goLight : HZ.goInk, 1.6 * d, 'power2.inOut');
    gsap.delayedCall(0.6 * d, () => {
      fly($('.em-word', b), $(`.nav [data-set-mode="${light ? 'light' : 'ink'}"]`));
      html.classList.remove('gate');
      lenis.start();
      dispatchEvent(new CustomEvent('mm:enter', { detail: { light } }));
    });
    gsap.to(root, {
      opacity: 0, duration: 1.1 * d, delay: 0.8 * d, ease: 'power2.inOut',
      onComplete: () => { scene?.destroy(); gsap.ticker.remove(ground); silk?.destroy(); root.remove(); },
    });
  }

  // the word you chose goes up into the switch, so you know where it lives
  function fly(word, target) {
    const mode = $('.nav .mode');
    if (!word || !target || reduced) { teach(mode, target); return; }
    const a = word.getBoundingClientRect(), z = target.getBoundingClientRect();
    const cs = getComputedStyle(word);
    const ghost = document.createElement('span');
    ghost.className = 'em-flyer';
    ghost.setAttribute('aria-hidden', 'true');
    ghost.textContent = word.textContent;
    Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, fontSize: cs.fontSize, lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing });
    document.body.append(ghost);
    word.style.visibility = 'hidden';
    const k = (z.height * 0.62) / a.height;
    gsap.timeline({ onComplete: () => ghost.remove() })
      .to(ghost, { x: z.left + z.width / 2 - (a.left + a.width / 2), y: z.top + z.height / 2 - (a.top + a.height / 2), scale: k, duration: 1.15, ease: 'expo.inOut' }, 0)
      .to(ghost, { opacity: 0, duration: 0.3, ease: 'power1.in' }, 0.95)
      .add(() => teach(mode, target), 0.95);
  }
  function teach(mode, target) {
    if (!mode) return;
    const tip = document.createElement('span');
    tip.className = 'mode-tip';
    tip.textContent = 'Change version here, any time.';
    mode.append(tip);
    target?.classList.add('is-new');
    requestAnimationFrame(() => mode.classList.add('is-taught'));
    setTimeout(() => {
      mode.classList.remove('is-taught');
      target?.classList.remove('is-new');
      setTimeout(() => tip.remove(), 900);
    }, 5200);
  }

  if (local) window.__emerge = { scene, silk, H, HZ, S, go: (light) => go(light, $(`.em-way[data-way="${light ? 'light' : 'ink'}"]`, root)), emerge };
}
