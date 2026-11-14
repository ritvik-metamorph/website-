// Hold to light: the press has to be held, the way you hold a note up to a window. Used by every
// section that has a Light version; the section supplies what holding, lighting and returning do.
const { gsap } = window;
const C = 50.27; // the ring's circumference (r = 8)

const WORDS = { idle: 'Hold to light', holding: 'Keep holding', short: 'Hold a little longer', lit: 'Back to ink' };

export function holdControl(btn, { duration = 1.1, isLit, onProgress, onCommit, onRevert, onStart, words = {} }) {
  const label = btn.querySelector('.hold-label');
  const fill = btn.querySelector('.hold-ring .fill');
  const w = { ...WORDS, ...words };
  const state = { v: 0 };
  let holding = false, start = 0, tween = null, hint;
  const ring = (v) => { fill.style.strokeDashoffset = (C * (1 - v)).toFixed(2); };
  const say = (t) => { label.textContent = w[t] ?? t; };
  const progress = () => { ring(state.v); onProgress(state.v); };

  btn.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (isLit()) { onRevert(); return; }
    btn.setPointerCapture?.(e.pointerId);
    holding = true;
    start = performance.now();
    clearTimeout(hint);
    onStart?.();
    say('holding');
    tween?.kill();
    tween = gsap.to(state, {
      v: 1,
      duration: duration * (1 - state.v),
      ease: 'sine.out', // the light answers the press at once, then builds
      onUpdate: progress,
      onComplete: () => { holding = false; onCommit(); },
    });
  });
  const release = () => {
    if (!holding) return;
    holding = false;
    tween?.kill();
    const short = performance.now() - start < 650;
    say(short ? 'short' : 'idle');
    if (short) hint = setTimeout(() => { if (!isLit() && !holding) say('idle'); }, 1700);
    // let go early and the light simply fades
    tween = gsap.to(state, { v: 0, duration: 0.6, ease: 'power2.out', onUpdate: progress });
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => btn.addEventListener(t, release));
  btn.addEventListener('contextmenu', (e) => e.preventDefault());
  // with a keyboard (or a screen reader) one press is enough
  btn.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (e.repeat) return;
    if (isLit()) onRevert(); else onCommit();
  });

  return {
    get holding() { return holding; },
    get active() { return holding || !!tween?.isActive(); },
    // call whenever the section is lit or returned to ink by anything (the nav, a key)
    sync() {
      tween?.kill();
      holding = false;
      state.v = 0;
      const lit = isLit();
      say(lit ? 'lit' : 'idle');
      ring(lit ? 1 : 0);
    },
  };
}
