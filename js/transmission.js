// The transmission (18 Nov): the foot of every page. After the user's reference, a cryptic poster (a
// title across the top, a line of binary, an emblem printed in vertical lines, a short message, fine
// print, a line across the foot), its composition and spirit, not its parts: a message left at the end
// of the site for whoever reads to the bottom.
// - "Metamorph" across the top, printed in vertical lines, as the whole foot is: the screen of a banknote
//   engraving, and the strips of a lenticular print.
// - Under it a line of binary. Rest on it (or focus it) and it decodes itself: "mother map", the same nine
//   letters as Metamorph. The site's own secret, left where the curious will find it.
// - In the middle, a lenticular card: the way in's silver cocoon from one side and its butterfly from the
//   other, interleaved strip by strip. Move across the card, or come down to the end of the page, and it
//   changes form strip by strip, as a lenticular print does when you tilt it. You reach the butterfly by
//   reaching the end.
// - Then the one thing to do, the fine print (the client's own facts and the site's true numbers), and
//   the client's line across the foot, "Capital that transforms", in the same lines as the title.
// The signature it replaced (js/signature.js) shows with ?foot=signature.

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rnd = (k) => (((Math.sin(k * 127.1 + 31.7) * 43758.5453) % 1) + 1) % 1;
const SECRET = 'mother map';

export function setupTransmission({ register, reduced, isTouch }) {
  const main = document.querySelector('main');
  if (!main || document.querySelector('.tx, .sig')) return null;
  const root = document.documentElement;
  const here = location.pathname.split('/').pop() || 'index.html';
  const ink = root.dataset.site === 'ink';

  const foot = el('footer', 'tx');
  foot.setAttribute('aria-label', 'Metamorph Capital');
  const inner = el('div', 'tx-in');

  const title = el('p', 'tx-title', 'Metamorph');
  title.setAttribute('aria-hidden', 'true');

  // the line of binary, and what it says
  const code = el('p', 'tx-code');
  code.tabIndex = 0;
  code.setAttribute('aria-label', 'A line in binary. It reads mother map, the same nine letters as Metamorph.');
  const bits = [...SECRET].map((ch) => {
    const s = el('span', 'tx-bit', ch.charCodeAt(0).toString(2).padStart(8, '0'));
    s.setAttribute('aria-hidden', 'true');
    s.dataset.ch = ch === ' ' ? ' ' : ch;
    code.append(s);
    return s;
  });

  // the lenticular card
  const card = el('figure', 'tx-card');
  card.setAttribute('aria-hidden', 'true');
  const cv = el('canvas');
  card.append(cv);

  // the message, and the fine print
  const msg = el('div', 'tx-msg');
  const ask = el('p', 'tx-ask');
  ask.innerHTML = 'Still here? <a class="tx-talk" href="#contact" data-soon>Talk to us</a>';
  const fine = el('p', 'tx-fine', 'Metamorph Capital. Fundraising and investor readiness, wealth management through a multi-family office, strategic consulting and financial services, backed by a 30-year chartered accountancy practice. Seven orbits of a life, twenty-seven disciplines, forty-eight sectors, and one hundred and fifty-one links between them.');
  msg.append(ask, fine);

  const end = el('p', 'tx-end');
  end.innerHTML = 'Capital that <em>transforms.</em>';

  // the way round
  const bottom = el('div', 'tx-bottom');
  const links = el('nav', 'tx-links');
  links.setAttribute('aria-label', 'The site');
  (ink ? [['About', 'ink-about.html'], ['Services', 'ink-services.html'], ['Sectors', 'ink-sectors.html'], ['Team', 'ink-about.html#team'], ['Creative corner', 'creative.html'], ['Investor corner', 'ink-investors.html']]
    : [['About', 'about.html'], ['Services', 'index.html#services'], ['Sectors', 'sectors.html'], ['Team', 'index.html#team'], ['Creative corner', 'creative.html'], ['Investor corner', 'investors.html']])
    .forEach(([t, h]) => { const a = el('a', '', t); a.href = h; if (h === here) a.setAttribute('aria-current', 'page'); links.append(a); });
  bottom.append(el('p', 'tx-copy', `© ${new Date().getFullYear()} Metamorph Capital`), links, el('p', 'tx-proof', 'Backed by a 30-year chartered accountancy practice.'));

  inner.append(title, code, card, msg, end, bottom);
  foot.append(inner);
  main.after(foot);
  root.classList.add('has-sig');

  // ---- the binary decodes itself when you rest on it, and closes again when you leave
  let decoded = false, dt = 0;
  const flip = (open) => {
    if (open === decoded) return;
    decoded = open;
    clearTimeout(dt);
    bits.forEach((s, i) => {
      const to = open ? s.dataset.ch : s.dataset.bin || (s.dataset.bin = s.textContent);
      if (open && !s.dataset.bin) s.dataset.bin = s.textContent;
      if (reduced) { s.textContent = to; s.classList.toggle('is-read', open); return; }
      // (each byte runs through a few wrong guesses before it lands, one after another)
      let n = 0;
      const run = () => {
        if (n++ < 5) { s.textContent = open ? String.fromCharCode(97 + Math.floor(rnd(i * 7 + n + performance.now()) * 26)) : (rnd(i + n) > 0.5 ? '1' : '0').repeat(8); dt = setTimeout(run, 45); return; }
        s.textContent = to;
        s.classList.toggle('is-read', open);
      };
      setTimeout(run, i * 70);
    });
  };
  code.addEventListener('pointerenter', () => flip(true));
  code.addEventListener('pointerleave', () => setTimeout(() => flip(false), 1600));
  code.addEventListener('focus', () => flip(true));
  code.addEventListener('blur', () => flip(false));
  code.addEventListener('click', () => flip(!decoded));

  // ---- the lenticular card: two pictures, the cocoon and the butterfly (the way in's, drawn in code,
  // assets/ink/), cut into the same strips; each strip shows one or the other, and turns over on its
  // own moment as the card turns, so the change runs across it with no seam
  const g = cv.getContext('2d');
  const A = new Image(), B = new Image();
  A.src = 'assets/ink/film-2-cocoon.jpg';
  B.src = 'assets/ink/film-4-wings.jpg';
  const SRC = { x: 690, y: 150, w: 1180, h: 800 }; // (the part of both frames the object stands in)
  let ready = 0, p = reduced ? 1 : 0, pT = p, over = false, px = 0.5, raf = 0, W = 1, H = 1;
  [A, B].forEach((im) => { im.decoding = 'async'; im.onload = () => { ready++; draw(); }; });
  const size = () => {
    const r = cv.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    W = Math.max(2, Math.round(r.width * dpr)); H = Math.max(2, Math.round(r.height * dpr));
    cv.width = W; cv.height = H;
    draw();
  };
  function draw() {
    g.fillStyle = '#050709';
    g.fillRect(0, 0, W, H);
    if (ready < 2) return;
    const dpr = W / Math.max(1, cv.clientWidth), pitch = Math.max(3, Math.round(5 * dpr)), line = Math.max(2, Math.round(pitch * 0.62));
    const N = Math.ceil(W / pitch);
    for (let i = 0; i < N; i++) {
      const x = i * pitch, u = i / N;
      // (when this strip turns: a sweep across the card, each strip a little early or late)
      const thr = 0.1 + 0.74 * (u * 0.6 + rnd(i) * 0.4), f = clamp((p - thr) / 0.1, 0, 1);
      const wa = Math.round(line * (1 - f)), wb = line - wa;
      if (wa > 0) g.drawImage(A, SRC.x + (x / W) * SRC.w, SRC.y, (wa / W) * SRC.w, SRC.h, x, 0, wa, H);
      if (wb > 0) g.drawImage(B, SRC.x + ((x + wa) / W) * SRC.w, SRC.y, (wb / W) * SRC.w, SRC.h, x + wa, 0, wb, H);
    }
  }
  const step = () => {
    raf = 0;
    p += (pT - p) * (reduced ? 1 : 0.12);
    if (Math.abs(pT - p) < 0.0015) p = pT;
    draw();
    if (p !== pT) raf = requestAnimationFrame(step);
  };
  const aim = () => {
    if (reduced) return;
    // (as the card comes up the page, the change runs; moving across it, it follows the pointer)
    const r = card.getBoundingClientRect();
    const scrolled = clamp((innerHeight * 0.92 - r.top) / (innerHeight * 0.7), 0, 1);
    pT = over ? px : scrolled;
    if (!raf && Math.abs(pT - p) > 0.0015) raf = requestAnimationFrame(step);
  };
  if (!isTouch) {
    card.addEventListener('pointermove', (e) => { const r = card.getBoundingClientRect(); px = clamp((e.clientX - r.left) / r.width * 1.2 - 0.1, 0, 1); over = true; aim(); });
    card.addEventListener('pointerleave', () => { over = false; aim(); });
  }
  addEventListener('scroll', aim, { passive: true });
  window.lenis?.on?.('scroll', aim);
  if ('ResizeObserver' in window) new ResizeObserver(size).observe(cv);
  else addEventListener('resize', size);
  size();

  // its top falls from the ground of whatever ends the page into the night, so it meets no edge
  const groundAbove = (y) => {
    let e = document.elementFromPoint(innerWidth / 2, y);
    while (e && e !== document.documentElement && e !== foot) {
      const c = getComputedStyle(e).backgroundColor;
      if (c && c !== 'transparent' && !/rgba\(.*,\s*0\)$/.test(c)) return c;
      e = e.parentElement;
    }
    return 'transparent';
  };
  let n = 0, above = '';
  window.gsap?.ticker.add(() => {
    if (++n % 8) return;
    const t = foot.getBoundingClientRect().top;
    if (t > innerHeight) return;
    aim();
    if (t < 2) return;
    const c = main.lastElementChild?.dataset.lit === 'true' ? '#0b0e15' : groundAbove(t - 2);
    if (c !== above) { above = c; foot.style.setProperty('--tx-from', c); }
  });

  // the nav over it is light, as over any night
  register({
    name: 'transmission', commit() {}, revert() {},
    under: (y) => { const r = foot.getBoundingClientRect(); return r.top + innerHeight * 0.22 < y && r.bottom > y ? { lit: false, tone: 'light', theme: '#050709' } : null; },
  });
  return { foot, sign: () => {}, turn: (v) => { pT = p = clamp(v, 0, 1); draw(); }, decode: flip };
}
