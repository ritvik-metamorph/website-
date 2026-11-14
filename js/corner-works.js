// The Creative Corner's works (14 Nov; creative.html, js/corner.js, css/main.css "the works").
// Everything, laid out after a photographer's portfolio the user sent ("this looks so premium in
// itself"): its composition, not its parts. On the night, where colour shows best:
// - The opening: three pieces fanned in a stack, the words set large and tight across them. Every
//   few seconds the front piece slides away and is dealt again at the back as the next, so the
//   stack deals through everyone's newest work. The front one opens.
// - Then each domain as a chapter: its work in one strip at one height, every piece at its own
//   shape and never cropped, its title and maker under it; the arrows, a swipe, the trackpad or a
//   drag walk the strip. Under it a hairline, and the chapter's number and name, large.
// - The Easter egg stays: rest on a piece (or press and hold it) and its maker's name turns into
//   their signature.
// Set in the new type: Inter Tight, tight, with Cormorant italic, semibold, for the word that turns.

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const pad2 = (n) => String(n).padStart(2, '0');
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);
// a domain's colour, lifted towards the paper so a signature in it reads on the night
const lift = (hex, k = 0.5) => {
  const n = parseInt(hex.slice(1), 16), p = [242, 243, 239];
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v + (p[i] - v) * k));
  return `rgb(${c.join(',')})`;
};
const ARROW = '<svg viewBox="0 0 64 16" aria-hidden="true"><path d="M2 8h58M52 2l8 6-8 6"/></svg>';

export function createWorks(host, opts) {
  const { ARTS, COLOR, every, ofDomain, art, open, sigInto, egg, reduced, isTouch, total } = opts;
  const { gsap } = window;
  const cards = new Map(); // a piece's key: where it hangs here (a piece can be in the stack and its chapter)
  const keep = (pc, c) => { if (!cards.has(pc.key)) cards.set(pc.key, []); cards.get(pc.key).push(c); };
  let narrow = isNarrow(innerWidth, innerHeight);
  const xh = () => (narrow ? 5.6 : 6.6);
  const io = 'IntersectionObserver' in window;
  host.classList.add('is-on');

  // ---------------------------------------------------------------- the opening: the stack

  const opening = el('div', 'cw-open');
  const stack = el('div', 'cw-stack');
  const title = el('h2', 'cw-title');
  title.id = 'cw-title';
  title.innerHTML = '<span class="cw-l1"><span>Artists in the</span></span><span class="cw-l2"><span>middle of</span></span><span class="cw-l3"><span><em>becoming.</em></span></span>';
  const corner = (cls, html) => { const p = el('p', `cw-corner ${cls}`); p.innerHTML = html; return p; };
  opening.append(
    corner('cw-tl', 'Creative corner'),
    corner('cw-tr', total),
    stack, title,
    corner('cw-bl', 'Everything'),
    corner('cw-bc', 'New work from artists in nine domains.<br>Open any piece to meet the person who made it.'),
    corner('cw-br', String(new Date().getFullYear())),
  );
  host.append(opening);

  // the three slots: the front straight, the two behind turned a little more each, up and to the right
  const SLOT = narrow
    ? [{ x: 0, y: 0, r: -3 }, { x: 8, y: -4, r: 4 }, { x: 15, y: -8, r: 10 }]
    : [{ x: 0, y: 0, r: -2.5 }, { x: 10, y: -5, r: 5 }, { x: 19, y: -10, r: 11 }];
  const deck = [];
  let dealt = 0;
  const STACK_W = () => (narrow ? 900 : 1100);
  function dress(c, pc) {
    c.pc = pc;
    c.b.setAttribute('aria-label', `${pc.w.title}, by ${pc.p.name}. Open it`);
    art(pc, STACK_W()).then((u) => { if (c.pc === pc) c.img.src = u; });
  }
  function place(c, s, dur = 0) {
    c.slot = s;
    c.b.style.zIndex = String(3 - s);
    c.b.tabIndex = s ? -1 : 0;
    c.b.toggleAttribute('inert', !!s);
    gsap.to(c.b, { xPercent: SLOT[s].x, yPercent: SLOT[s].y, rotation: SLOT[s].r, duration: dur, ease: 'expo', overwrite: 'auto' });
  }
  for (let s = 0; s < 3; s++) {
    const b = el('button', 'cw-card'), img = el('img');
    b.type = 'button';
    img.alt = '';
    img.decoding = 'async';
    b.append(img);
    stack.append(b);
    const c = { b, img, slot: s, pc: null };
    dress(c, every[dealt++ % every.length]);
    deck.push(c);
    b.addEventListener('click', () => open(c.pc, { art: b, img, b }, every));
  }
  deck.forEach((c, s) => place(c, s));
  // the front piece slides off and is dealt again at the back as the next one
  function deal() {
    const front = deck.find((c) => c.slot === 0);
    deck.forEach((c) => { if (c !== front) place(c, c.slot - 1, 1.1); });
    gsap.to(front.b, {
      xPercent: 80, yPercent: 8, rotation: 14, opacity: 0, duration: 0.75, ease: 'power2.in', overwrite: 'auto',
      onComplete: () => {
        dress(front, every[dealt++ % every.length]);
        place(front, 2);
        gsap.fromTo(front.b, { opacity: 0 }, { opacity: 1, duration: 0.9, ease: 'power2.out' });
      },
    });
  }
  let inView = false, resting = false, timer = 0;
  const loop = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (inView && !resting && !document.hidden) deal();
      loop();
    }, 3800);
  };
  stack.addEventListener('pointerenter', () => { resting = true; });
  stack.addEventListener('pointerleave', () => { resting = false; });
  stack.addEventListener('focusin', () => { resting = true; });
  stack.addEventListener('focusout', () => { resting = false; });
  // arriving: the stack fans out from a neat pile, and the words rise in
  let arrived = false;
  function arrive() {
    if (arrived) return;
    arrived = true;
    if (reduced) { opening.classList.add('is-in'); return; }
    deck.forEach((c) => gsap.set(c.b, { xPercent: 0, yPercent: 0, rotation: 0 }));
    deck.forEach((c) => place(c, c.slot, 1.6));
    opening.classList.add('is-in');
    loop();
  }
  if (io) {
    new IntersectionObserver(([e]) => {
      inView = e.isIntersecting;
      if (inView) arrive();
    }, { threshold: 0.25 }).observe(opening);
  } else { inView = true; arrive(); }

  // ---------------------------------------------------------------- the chapters

  const chapters = [];
  ARTS.forEach((a) => {
    const list = ofDomain(a);
    if (!list.length) return;
    const n = chapters.length + 1;
    const sec = el('section', 'cw-chapter is-waiting');
    sec.setAttribute('aria-labelledby', `cw-${a.id}`);
    sec.style.setProperty('--dom', COLOR[a.id]);
    const strip = el('ul', 'cw-strip');
    strip.setAttribute('aria-label', `${a.name}: the work`);
    list.forEach((pc, i) => {
      const li = el('li', 'cw-piece');
      li.style.setProperty('--r', pc.ratio.toFixed(4));
      li.style.setProperty('--i', String(Math.min(i, 8)));
      const b = el('button', 'cw-pic');
      b.type = 'button';
      b.setAttribute('aria-label', `${pc.w.title}, ${pc.w.kind.toLowerCase()} by ${pc.p.name}`);
      const img = el('img');
      img.alt = '';
      img.decoding = 'async';
      img.loading = 'lazy';
      b.append(img);
      const cap = el('p', 'cw-cap');
      const by = el('span', 'cw-by');
      const sig = document.createElementNS(NS, 'svg');
      sig.setAttribute('class', 'cc-sig cw-sig');
      sig.setAttribute('aria-hidden', 'true');
      sigInto(sig, pc.p, xh());
      sig.style.color = lift(COLOR[pc.p.art]);
      by.append(el('span', 'cw-maker', pc.p.name), sig);
      cap.append(el('span', 'cw-t', pc.w.title), by);
      li.append(b, cap);
      strip.append(li);
      egg(li, sig);
      b.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); return; } open(pc, { art: b, img, b }, list); });
      const c = { li, b, img, pc, sig, painted: false };
      keep(pc, c);
    });
    // the arrows walk the strip by most of a screen
    const steps = el('div', 'cw-steps');
    const prev = el('button', 'cw-step is-prev'), next = el('button', 'cw-step is-next');
    prev.type = next.type = 'button';
    prev.setAttribute('aria-label', `Back along ${a.name.toLowerCase()}`);
    next.setAttribute('aria-label', `On along ${a.name.toLowerCase()}`);
    prev.innerHTML = next.innerHTML = ARROW;
    steps.append(prev, next);
    const walk = (dir) => strip.scrollBy({ left: dir * strip.clientWidth * 0.78, behavior: reduced ? 'auto' : 'smooth' });
    prev.addEventListener('click', () => walk(-1));
    next.addEventListener('click', () => walk(1));
    const ends = () => {
      prev.disabled = strip.scrollLeft < 4;
      next.disabled = strip.scrollLeft > strip.scrollWidth - strip.clientWidth - 4;
    };
    strip.addEventListener('scroll', ends, { passive: true });
    // under it, the chapter's number and its name
    const foot = el('div', 'cw-foot');
    const num = el('span', 'cw-n'), name = el('h3', 'cw-dom');
    num.append(el('span', '', pad2(n)));
    name.append(el('span', '', a.name));
    name.id = `cw-${a.id}`;
    foot.append(num, name);
    sec.append(strip, steps, foot);
    host.append(sec);
    chapters.push({ a, sec, strip, ends });
    drag(strip);
  });

  // a drag with the mouse walks a strip too; a drag is not a click
  let dragged = false;
  function drag(strip) {
    let x0 = 0, s0 = 0, on = false;
    strip.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'mouse' || e.button) return;
      on = true; dragged = false; x0 = e.clientX; s0 = strip.scrollLeft;
    });
    addEventListener('pointermove', (e) => {
      if (!on) return;
      const dx = e.clientX - x0;
      if (!dragged && Math.abs(dx) > 6) { dragged = true; strip.classList.add('is-dragging'); }
      if (dragged) strip.scrollLeft = s0 - dx;
    });
    addEventListener('pointerup', () => {
      if (!on) return;
      on = false;
      strip.classList.remove('is-dragging');
      setTimeout(() => { dragged = false; }, 0);
    });
  }

  // the pictures, as they come near: a strip loads a screen ahead of where it is walked to
  const W_OF = (pc) => Math.round((narrow ? 520 : 760) * Math.max(1, pc.ratio));
  const paint = (c) => {
    if (c.painted) return;
    c.painted = true;
    art(c.pc, W_OF(c.pc)).then((u) => { c.img.src = u; });
    c.img.addEventListener('load', () => c.li.classList.add('is-loaded'), { once: true });
  };
  if (io) {
    chapters.forEach(({ strip }) => {
      const near = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        const c = [...cards.values()].flat().find((q) => q.li === e.target);
        if (c) paint(c);
        near.unobserve(e.target);
      }), { root: strip, rootMargin: '0px 100% 0px 100%' });
      strip.querySelectorAll('.cw-piece').forEach((li) => near.observe(li));
    });
    // a chapter's pieces rise in as it comes up, its number and name after them
    const seen = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.remove('is-waiting');
      seen.unobserve(e.target);
    }), { threshold: 0.12 });
    chapters.forEach(({ sec }) => seen.observe(sec));
  } else {
    chapters.forEach(({ sec }) => sec.classList.remove('is-waiting'));
    cards.forEach((list) => list.forEach(paint));
  }
  if (reduced) chapters.forEach(({ sec }) => sec.classList.remove('is-waiting'));
  requestAnimationFrame(() => chapters.forEach(({ ends }) => ends()));

  // ---------------------------------------------------------------- the wide view (14 Nov)
  // Everything at once: the user asked for "an option which zooms out all the designs and all are
  // visible at once". A button while the works are in view; it zooms out to every piece, domain by
  // domain in justified rows, sized so the whole lot fits the screen on a laptop (on a phone, as
  // small as still reads, and scrolled). Rest on one for its title and maker; click it to open it;
  // Close (or Escape) zooms back in to where you were.
  const all = chapters.flatMap(({ a }) => ofDomain(a));
  const wideBtn = el('button', 'cw-wide-btn');
  wideBtn.type = 'button';
  wideBtn.innerHTML = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 1h4v4H1zM6 1h4v4H6zM11 1h4v4h-4zM1 6h4v4H1zM6 6h4v4H6zM11 6h4v4h-4zM1 11h4v4H1zM6 11h4v4H6zM11 11h4v4h-4z"/></svg><span>See all at once</span>';
  document.body.append(wideBtn);
  const wide = el('div', 'cw-wide');
  wide.hidden = true;
  wide.setAttribute('role', 'dialog');
  wide.setAttribute('aria-modal', 'true');
  wide.setAttribute('aria-label', 'Every piece at once');
  wide.dataset.lenisPrevent = '';
  const wideBar = el('div', 'cw-wide-bar');
  const wideClose = el('button', 'cw-wide-close', 'Close');
  wideClose.type = 'button';
  // the domains along the top: rest on one (or tap it) and only its pieces stay lit
  const legend = el('div', 'cw-wide-legend');
  legend.append(el('span', 'cw-wide-count', `All ${all.length} pieces`));
  const keys = chapters.map(({ a }) => {
    const k = el('button', 'cw-wide-key');
    k.type = 'button';
    k.style.setProperty('--dom', lift(COLOR[a.id], 0.35));
    k.append(el('i', ''), el('span', '', a.name), el('em', '', String(ofDomain(a).length)));
    legend.append(k);
    return { a, k };
  });
  const light = (id) => {
    wide.classList.toggle('is-picking', !!id);
    wideTiles.forEach((t) => t.b.classList.toggle('is-lit', t.pc.p.art === id));
    keys.forEach(({ a, k }) => k.classList.toggle('is-on', a.id === id));
  };
  let picked = null;
  keys.forEach(({ a, k }) => {
    k.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') light(a.id); });
    k.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') light(picked); });
    k.addEventListener('click', () => { picked = picked === a.id ? null : a.id; light(picked); });
  });
  wideBar.append(legend, wideClose);
  const wideBody = el('div', 'cw-wide-body');
  const wideSay = el('p', 'cw-wide-say');
  wide.append(wideBar, wideBody, wideSay);
  document.body.append(wide);
  const wideTiles = [];
  let wideOpen = false, wideBuilt = false, returnTo = null;
  function buildWide() {
    wideBody.innerHTML = '';
    wideTiles.length = 0;
    // (measured from the open view itself: the gutter is a clamp(), not a number)
    const pad = parseFloat(getComputedStyle(wide).paddingLeft) || 24;
    const W = Math.min((wide.clientWidth || innerWidth) - 2 * pad, 1560);
    const GAPX = narrow ? 4 : 6;
    // every piece in one flow, domain after domain, so the rows use the whole width
    const groups = [{ list: all }];
    const LABEL = 0, GROUP = 0;
    // the rows at a height, and how tall they come to
    const rowsOf = (list, h) => {
      const rows = [];
      let row = [], sum = 0;
      list.forEach((pc) => {
        const r = pc.ratio || 0.8;
        if (row.length && (sum + r) * h + GAPX * row.length > W) { rows.push({ row, h: (W - GAPX * (row.length - 1)) / sum }); row = []; sum = 0; }
        row.push(pc); sum += r;
      });
      if (row.length) rows.push({ row, h: Math.min(h, (W - GAPX * (row.length - 1)) / sum) });
      return rows;
    };
    const heightAt = (h) => groups.reduce((t, g) => t + LABEL + rowsOf(g.list, h).reduce((s, r) => s + r.h + GAPX, 0) + GROUP, 0);
    // as large as lets the whole of it fit the screen, on a phone too (a contact sheet; a tap opens one)
    const room = innerHeight - (parseFloat(getComputedStyle(wide).paddingTop) || 82) - wideBar.offsetHeight - 40;
    const least = narrow ? 30 : 40;
    let lo = least, hi = 220;
    for (let k = 0; k < 18; k++) { const mid = (lo + hi) / 2; if (heightAt(mid) <= room) lo = mid; else hi = mid; }
    const h = Math.max(least, lo);
    groups.forEach(({ list }) => {
      const g = el('div', 'cw-wide-group');
      rowsOf(list, h).forEach(({ row, h: rh }) => {
        const r = el('div', 'cw-wide-row');
        r.style.gap = `${GAPX}px`;
        row.forEach((pc) => {
          const b = el('button', 'cw-wide-tile'), img = el('img');
          b.type = 'button';
          b.style.width = `${(rh * (pc.ratio || 0.8)).toFixed(1)}px`;
          b.style.height = `${rh.toFixed(1)}px`;
          b.setAttribute('aria-label', `${pc.w.title}, ${pc.w.kind.toLowerCase()} by ${pc.p.name}`);
          img.alt = ''; img.decoding = 'async';
          // (the stand-in designs have small copies for this, so a hundred of them load fast)
          art(pc, Math.round(rh * (pc.ratio || 0.8) * 2.2)).then((u) => { img.src = u.replace('/corner/insomniac/', '/corner/insomniac/thumb/'); });
          b.append(img);
          b.addEventListener('click', () => open(pc, { art: b, img, b }, all));
          b.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; wideSay.textContent = `${pc.w.title} · ${pc.p.name} · ${ARTS.find((q) => q.id === pc.p.art)?.name || ''}`; wideSay.classList.add('is-on'); });
          b.addEventListener('pointerleave', () => wideSay.classList.remove('is-on'));
          b.addEventListener('pointermove', (e) => { wideSay.style.transform = `translate(${Math.round(Math.min(e.clientX + 16, innerWidth - 280))}px, ${Math.round(e.clientY + 18)}px)`; });
          r.append(b);
          wideTiles.push({ b, img, pc });
        });
        g.append(r);
      });
      wideBody.append(g);
    });
    wideBody.style.maxWidth = `${W}px`;
    light(picked);
    wideBuilt = true;
  }
  function openWide() {
    if (wideOpen) return;
    wideOpen = true;
    returnTo = document.activeElement;
    wide.hidden = false;
    if (!wideBuilt) buildWide();
    wideBtn.classList.add('is-hidden');
    document.documentElement.classList.add('cw-wide-on');
    wide.scrollTop = 0;
    wideClose.focus({ preventScroll: true });
    if (reduced) return;
    // it zooms out: the room comes up and every piece settles in from a little larger, from the
    // middle of the screen outwards
    gsap.fromTo(wide, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: 'power2.out' });
    const cx = innerWidth / 2, cy = innerHeight / 2;
    wideTiles.forEach(({ b }) => {
      const r = b.getBoundingClientRect(), d = Math.hypot(r.left + r.width / 2 - cx, r.top + r.height / 2 - cy) / Math.hypot(cx, cy);
      gsap.fromTo(b, { opacity: 0, scale: 1.35 }, { opacity: 1, scale: 1, duration: 0.7, delay: 0.05 + d * 0.35, ease: 'expo', clearProps: 'transform,opacity' });
    });
  }
  function closeWide() {
    if (!wideOpen) return;
    wideOpen = false;
    wideSay.classList.remove('is-on');
    const done = () => { wide.hidden = true; document.documentElement.classList.remove('cw-wide-on'); wideBtn.classList.remove('is-hidden'); returnTo?.focus?.({ preventScroll: true }); };
    if (reduced) { done(); return; }
    gsap.to(wide, { opacity: 0, duration: 0.3, ease: 'power2.in', onComplete: () => { gsap.set(wide, { clearProps: 'opacity' }); done(); } });
  }
  wideBtn.addEventListener('click', openWide);
  wideClose.addEventListener('click', closeWide);
  addEventListener('keydown', (e) => {
    if (!wideOpen || e.key !== 'Escape') return;
    // (a piece opened from it closes first; the room handles that)
    if (document.querySelector('.cc-room:not([hidden])')) return;
    closeWide();
  });
  // the button shows while the works are on the screen
  const worksIn = () => { const r = host.getBoundingClientRect(); return r.top < innerHeight * 0.6 && r.bottom > innerHeight * 0.4; };
  const showBtn = () => wideBtn.classList.toggle('is-in', worksIn() && !wideOpen);
  window.gsap?.ticker.add(showBtn);

  // ---------------------------------------------------------------- for the room

  const onScreen = (e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; };
  return {
    // where a piece hangs here, to fly from and back to: in the wide view if it is open, its card in
    // view, or the stack's front
    home(pc) {
      if (wideOpen) { const t = wideTiles.find((q) => q.pc === pc); if (t) return { art: t.b, img: t.img, b: t.b }; }
      const all = [...(cards.get(pc.key) || []).map((c) => ({ art: c.b, img: c.img, b: c.b })),
        ...deck.filter((c) => c.pc === pc && c.slot === 0).map((c) => ({ art: c.b, img: c.img, b: c.b }))];
      return all.find((h) => onScreen(h.art)) || null;
    },
    layout() {
      const was = narrow;
      narrow = isNarrow(innerWidth, innerHeight);
      if (was !== narrow) cards.forEach((list) => list.forEach((c) => sigInto(c.sig, c.pc.p, xh())));
      chapters.forEach(({ ends }) => ends());
      // (rebuilt for the new size: now if it is open, else when it next opens)
      if (wideOpen) buildWide(); else wideBuilt = false;
    },
    openWide, closeWide,
    paintAll: () => cards.forEach((list) => list.forEach(paint)),
    showAll: () => chapters.forEach(({ sec }) => sec.classList.remove('is-waiting')),
    deal, arrive,
    get deck() { return deck; },
    chapters,
  };
}
