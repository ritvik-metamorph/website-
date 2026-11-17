// Living type (15 Nov; the user: "make it more crazy… the typography in the about us section, hero
// section and all that"). The site's big headings are still becoming, like the founders they speak
// to. Three things, all in the two faces the site already has (both are variable in weight):
//   - a heading arrives thin, and its letters fill out to their weight in a wave from its first
//     letter to its last, a little past it and back: it grows into its form as you reach it;
//   - under the pointer the letters gather weight where your hand is and thin in a ring round it
//     (the ink goes where the attention is): something to do with your hands on every page;
//   - while the page is moving, every word leans the way it is going, towards its italic, and
//     stands straight again when the page rests.
// Which headings: SEL below, or data-kinetic; a page can add ones it builds later with add().
// Each word is one unbreakable box (.kw) of letters (.kl); the lines are fixed where they fell at
// the heading's own weight, so nothing re-wraps as letters swell. A phone gets the arrival and the
// lean, not the pointer's part. With reduced motion none of it: the headings are left as written.

const { gsap } = window;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const SEL = '.title, .next-title, .team-title, .ab-h, .ab-stage-name, .ab-end-line, .sx-title, .sx-h2, .sx-end-line, [data-kinetic]';
const THIN = 300, HEAVY = 700, LIGHT = 400; // (the weights the pages load: 300 to 700)

export function setupKinetic({ lenis, reduced, isTouch, local }) {
  if (reduced) return { add() {} };
  const heads = [];
  const pointer = { x: -1e5, y: -1e5 };
  const now = () => performance.now() / 1000;
  let lean = 0;

  // ---------------------------------------------------------------- a heading, taken apart
  function split(el) {
    // (what a screen reader says stays the sentence, not its letters)
    const said = el.cloneNode(true);
    said.querySelectorAll('.turn-was, .sr-only').forEach((n) => n.remove());
    if (!el.hasAttribute('aria-label')) el.setAttribute('aria-label', said.textContent.replace(/\s+/g, ' ').trim());
    const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (tw.nextNode()) { const n = tw.currentNode; if (n.nodeValue.trim() && !n.parentElement.closest('.turn-was, .sr-only, .kl')) nodes.push(n); }
    const letters = [], words = [];
    nodes.forEach((n) => {
      const base = parseFloat(getComputedStyle(n.parentElement).fontWeight) || 500;
      const frag = document.createDocumentFragment();
      n.nodeValue.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.append(' '); return; }
        const w = document.createElement('span');
        w.className = 'kw';
        w.setAttribute('aria-hidden', 'true');
        for (const ch of part) {
          const l = document.createElement('span');
          l.className = 'kl';
          l.textContent = ch;
          w.append(l);
          letters.push({ el: l, base, cur: base, cx: 0, cy: 0, delay: 0 });
        }
        frag.append(w);
        words.push(w);
      });
      n.replaceWith(frag);
    });
    return { letters, words };
  }

  // the nearest box above a word that makes its own lines
  const blockOf = (node, top) => { let p = node.parentElement; while (p && p !== top && getComputedStyle(p).display.startsWith('inline')) p = p.parentElement; return p || top; };

  // its lines fixed where they fall at its own weight, and where each letter is
  function fit(h) {
    const { el, letters, words } = h;
    letters.forEach((L) => { L.el.style.fontWeight = ''; });
    el.querySelectorAll('.kbr').forEach((b) => b.remove());
    el.classList.remove('kin-locked');
    const r = el.getBoundingClientRect();
    h.fitted = r.width > 0;
    if (h.fitted) {
      const last = new Map(), breaks = [];
      words.forEach((w) => {
        const unit = w.closest('.turn-w') || w, block = blockOf(unit, el), top = unit.getBoundingClientRect().top;
        const prev = last.get(block);
        if (prev && prev.unit !== unit && top > prev.top + 2) breaks.push(unit);
        last.set(block, { unit, top });
      });
      breaks.forEach((u) => { const br = document.createElement('br'); br.className = 'kbr'; u.before(br); });
      el.classList.add('kin-locked');
      const r2 = el.getBoundingClientRect();
      h.w = r2.width || 1; h.hgt = r2.height || 1;
      h.R = (parseFloat(getComputedStyle(el).fontSize) || 60) * 2.1;
      letters.forEach((L) => {
        const b = L.el.getBoundingClientRect();
        L.cx = b.left + b.width / 2 - r2.left; L.cy = b.top + b.height / 2 - r2.top;
        L.delay = (L.cx / h.w) * 0.5 + (L.cy / h.hgt) * 0.3;
      });
    }
    letters.forEach((L) => { if (Math.round(L.cur) !== L.base) L.el.style.fontWeight = Math.round(L.cur); });
  }

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    const h = heads.find((x) => x.el === e.target);
    if (!h) return;
    h.inView = e.isIntersecting;
    if (e.isIntersecting) { if (!h.fitted) fit(h); arrive(h); }
  }), { rootMargin: '10% 0px 10% 0px' });
  // it has been reached: the wave starts
  function arrive(h) { if (h.seen) return; h.seen = true; h.t0 = now(); h.until = h.t0 + 1.8; h.dirty = true; }

  function add(target) {
    const els = typeof target === 'string' ? [...document.querySelectorAll(target)] : [target];
    els.forEach((el) => {
      if (!el || el.dataset.kin) return;
      el.dataset.kin = '1';
      const h = { el, ...split(el), seen: false, inView: false, t0: 0, until: 0, dirty: true, lean: 0, fitted: false };
      if (!h.letters.length) return;
      fit(h);
      // (not yet reached: thin, waiting)
      h.letters.forEach((L) => { L.cur = THIN; L.el.style.fontWeight = THIN; });
      heads.push(h);
      io.observe(el);
    });
  }
  add(SEL);
  document.fonts?.ready.then(() => heads.forEach(fit));
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => heads.forEach(fit), 200); });
  if (!isTouch) addEventListener('pointermove', (e) => { pointer.x = e.clientX; pointer.y = e.clientY; }, { passive: true });

  // ---------------------------------------------------------------- each frame
  function frame() {
    const t = now();
    // the page's speed, as a lean
    lean += (clamp(-(lenis?.velocity || 0) * 0.09, -7, 7) - lean) * 0.12;
    const lv = Math.abs(lean) < 0.03 ? 0 : Number(lean.toFixed(2));
    for (const h of heads) {
      if (!h.inView && !h.force) continue;
      if (lv !== h.lean) { h.lean = lv; h.el.style.setProperty('--lean', lv); }
      let near = false, px = 0, py = 0;
      if (!isTouch && h.seen) {
        const r = h.el.getBoundingClientRect();
        near = pointer.x > r.left - h.R && pointer.x < r.right + h.R && pointer.y > r.top - h.R && pointer.y < r.bottom + h.R;
        px = pointer.x - r.left; py = pointer.y - r.top;
      }
      if (!near && !h.dirty && t > h.until) continue;
      h.dirty = false;
      const tight = h.R * h.R * 0.2, wide = h.R * h.R * 0.75;
      for (const L of h.letters) {
        let target = THIN;
        if (h.seen) {
          const dt = t - h.t0 - L.delay;
          // (filling out: to its weight, a little past, and back)
          const s = clamp(dt / 0.8, 0, 1);
          target = dt < 0 ? THIN : THIN + (L.base - THIN) * (1 - (1 - s) ** 3) + (HEAVY - L.base) * 0.75 * Math.sin(s * Math.PI);
          if (near) {
            const d2 = (L.cx - px) ** 2 + (L.cy - py) ** 2, core = Math.exp(-d2 / tight), ring = Math.exp(-d2 / wide) - core;
            target += (HEAVY - L.base) * core - (L.base - LIGHT) * 0.8 * ring;
          }
        }
        target = clamp(target, THIN, HEAVY);
        const next = L.cur + (target - L.cur) * 0.22;
        if (Math.abs(target - L.cur) > 0.5) { L.cur = next; L.el.style.fontWeight = Math.round(next); h.dirty = true; }
      }
    }
  }
  gsap.ticker.add(frame);

  const handle = {
    heads, add, fit: () => heads.forEach(fit),
    // (local testing, where the pane holds observers back: reach every heading by hand)
    all() { heads.forEach((h) => { h.force = true; if (!h.fitted) fit(h); arrive(h); }); },
    tick(n = 1) { for (let i = 0; i < n; i++) frame(); },
  };
  if (local) window.__kinetic = handle;
  return handle;
}
