// The Creative Corner's works (14 Nov; the wall since 18 Nov; creative.html, js/corner.js, css/main.css
// "the works"). Everything, on the night, where colour shows best:
// - The heading (since 19 Nov; before it a stack of three pieces dealt behind huge words, a whole screen):
//   "Artists in the middle of becoming." in one line over the wall, and a quiet line under it.
// - Then the wall (18 Nov): every piece at once, each at its own shape and never cropped, in columns
//   like a board of pins. The user: "every artist art should get an equal opportunity in being
//   displayed", "the art should get the whole importance… not fancy things around it". So no domain
//   comes first: the order is shuffled once a day, the same for everyone that day, and the domains
//   above it are in alphabetical order.
// - Choose a domain and the wall zooms into it: that domain's pieces travel from where they hang on
//   the wall into one strip at one height (the chapter as it was before), the rest fade away; its
//   count and name rise under it. All (or the same domain again, or Escape) goes back to the wall.
//   Kept plain on purpose: the galleries above are the fancy part.
// - The Easter egg stays in the strip: rest on a piece (or press and hold it) and its maker's name
//   turns into their signature.
// Set in the new type: Inter Tight, tight, with Cormorant italic, semibold, for the word that turns.
// The chapters one after another and the wide view ("See all at once") are in the backup
// works-chapters-before-wall-2026-11-18.

const NS = 'http://www.w3.org/2000/svg';
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);
// a domain's colour, lifted towards the paper so a signature in it reads on the night
const lift = (hex, k = 0.5) => {
  const n = parseInt(hex.slice(1), 16), p = [242, 243, 239];
  const c = [n >> 16, (n >> 8) & 255, n & 255].map((v, i) => Math.round(v + (p[i] - v) * k));
  return `rgb(${c.join(',')})`;
};
const ARROW = '<svg viewBox="0 0 64 16" aria-hidden="true"><path d="M2 8h58M52 2l8 6-8 6"/></svg>';
// the day's order: a shuffle seeded by the day, so it is fair over time and steady within a day
const rng = (s) => () => {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffle = (list, seed) => {
  const r = rng(seed), a = list.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
};
const DAY = Math.floor(Date.now() / 864e5);
// the stand-in designs have lighter copies for the wall (720px wide) and the wide view (360px)
const mid = (u) => u.replace('/corner/insomniac/', '/corner/insomniac/mid/');

export function createWorks(host, opts) {
  const { ARTS, COLOR, every, ofDomain, art, open, sigInto, egg, reduced, total, lenis, refresh } = opts;
  const { gsap } = window;
  let narrow = isNarrow(innerWidth, innerHeight);
  const xh = () => (narrow ? 5.6 : 6.6);
  const io = 'IntersectionObserver' in window;
  host.classList.add('is-on');

  // ---------------------------------------------------------------- the heading (19 Nov)

  // (the user: the opening, a stack of pieces dealt behind the words over a whole screen, cost a screen of scrolling
  // before the wall, here, near the end of the page, where visitors tire; "the emphasis and the effort should go
  // towards exploring art, not to reach that page where you can actually see the art". So the words are a short
  // heading over the wall, one line on a laptop, with the filter and the wall's first row in view under it; nothing
  // moves behind them. The stack: backup works-stack-before-header-2026-11-19)
  const head = el('header', 'cw-head');
  const title = el('h2', 'cw-title');
  title.id = 'cw-title';
  title.innerHTML = '<span class="cw-l1"><span>Artists in the middle of <em>becoming.</em></span></span>';
  const meta = el('p', 'cw-meta');
  meta.innerHTML = `<span>${total}</span><span>Open any piece to meet the person who made it.</span>`;
  head.append(title, meta);
  host.append(head);
  const deck = []; // (no stack now; the room's home() still asks)
  const deal = () => {};
  const arrive = () => head.classList.add('is-in');
  if (io && !reduced) new IntersectionObserver(([e], ob) => { if (e.isIntersecting) { arrive(); ob.disconnect(); } }, { threshold: 0.2 }).observe(head);
  else arrive();

  // ---------------------------------------------------------------- the wall and its filter (18 Nov)

  // every piece, in the day's order; a domain's pieces keep that order in its strip. (While the studio's
  // designs stand in, one design hangs on several pieces: the same picture is kept a dozen places from
  // itself, so it never sits beside or under its twin.)
  const spaced = (list, k = 12) => {
    const left = list.slice(), out = [], img = (pc) => pc.w.image || pc.key;
    while (left.length) {
      const near = new Set(out.slice(-k).map(img));
      let i = left.findIndex((pc) => !near.has(img(pc)));
      // (none far enough: the one whose twin hangs furthest back)
      if (i < 0) { const last = (pc) => out.map(img).lastIndexOf(img(pc)); i = left.reduce((b, pc, j) => (last(pc) < last(left[b]) ? j : b), 0); }
      out.push(left.splice(i, 1)[0]);
    }
    return out;
  };
  const order = spaced(shuffle(ARTS.flatMap((a) => ofDomain(a)), DAY));
  const doms = ARTS.filter((a) => order.some((pc) => pc.p.art === a.id)).sort((a, b) => a.name.localeCompare(b.name));
  const nameOf = (pc) => ARTS.find((a) => a.id === pc.p.art)?.name || '';

  const browse = el('div', 'cw-browse');
  // the filter: All, then the domains A to Z, each with its count; it stays at the top while the wall
  // is walked
  const bar = el('div', 'cw-filter');
  const chipsEl = el('div', 'cw-chips');
  chipsEl.setAttribute('role', 'group');
  chipsEl.setAttribute('aria-label', 'Show work from');
  const chip = (label, n, id) => {
    const b = el('button', 'cw-chip');
    b.type = 'button';
    b.setAttribute('aria-pressed', String(id === null));
    if (id) { const i = el('i'); i.style.background = lift(COLOR[id], 0.35); i.setAttribute('aria-hidden', 'true'); b.append(i); }
    b.append(el('span', 'cw-chip-t', label), el('span', 'cw-chip-n', String(n)));
    b.addEventListener('click', () => select(id !== null && view === id ? null : id));
    chipsEl.append(b);
    return { b, id };
  };
  const chips = [chip('All', order.length, null), ...doms.map((a) => chip(a.name, order.filter((pc) => pc.p.art === a.id).length, a.id))];
  bar.append(chipsEl);
  const live = el('p', 'sr-only');
  live.setAttribute('aria-live', 'polite');
  const stage = el('div', 'cw-stage');
  browse.append(bar, live, stage);
  host.append(browse);

  // the wall: one tile a piece, placed in columns (each into the shortest one, so the reading order is
  // across and down), every piece at its own shape
  const wall = el('ul', 'cw-wall');
  wall.setAttribute('aria-label', `Every piece, ${order.length} in all`);
  stage.append(wall);
  const say = el('p', 'cw-say');
  say.setAttribute('aria-hidden', 'true');
  document.body.append(say);
  const sayOf = (pc) => `${pc.w.title} · ${pc.p.name} · ${nameOf(pc)}`;
  const tiles = order.map((pc) => {
    const li = el('li', 'cw-tile');
    const b = el('button', 'cw-tile-b');
    b.type = 'button';
    b.setAttribute('aria-label', `${pc.w.title}, ${pc.w.kind.toLowerCase()} by ${pc.p.name}`);
    const img = el('img');
    img.alt = '';
    img.decoding = 'async';
    img.loading = 'lazy';
    img.addEventListener('load', () => li.classList.add('is-loaded'), { once: true });
    b.append(img);
    li.append(b);
    wall.append(li);
    const t = { li, b, img, pc, asked: 0 };
    b.addEventListener('click', () => open(pc, { art: b, img, b }, order));
    // its title, maker and domain beside the pointer, or under it when reached by the keyboard
    b.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; say.textContent = sayOf(pc); say.classList.add('is-on'); });
    b.addEventListener('pointermove', (e) => { say.style.transform = `translate(${Math.round(Math.min(e.clientX + 16, innerWidth - say.offsetWidth - 12))}px, ${Math.round(e.clientY + 18)}px)`; });
    b.addEventListener('pointerleave', () => say.classList.remove('is-on'));
    b.addEventListener('focus', () => {
      if (!b.matches(':focus-visible')) return;
      const r = b.getBoundingClientRect();
      say.textContent = sayOf(pc);
      say.style.transform = `translate(${Math.round(Math.min(r.left, innerWidth - say.offsetWidth - 12))}px, ${Math.round(Math.min(r.bottom + 8, innerHeight - 40))}px)`;
      say.classList.add('is-on');
    });
    b.addEventListener('blur', () => say.classList.remove('is-on'));
    return t;
  });
  addEventListener('scroll', () => say.classList.remove('is-on'), { passive: true });
  let eager = false;
  function layoutWall() {
    const W = wall.clientWidth;
    if (!W) return;
    const n = narrow ? 2 : W >= 1280 ? 6 : W >= 1000 ? 5 : W >= 760 ? 4 : 3;
    const gap = narrow ? 8 : Math.round(Math.min(18, Math.max(10, W * 0.011)));
    const cw = (W - gap * (n - 1)) / n;
    const colH = new Array(n).fill(0);
    tiles.forEach((t) => {
      let c = 0;
      for (let k = 1; k < n; k++) if (colH[k] < colH[c] - 0.5) c = k;
      const h = cw / (t.pc.ratio || 0.8);
      Object.assign(t.li.style, { left: `${(c * (cw + gap)).toFixed(1)}px`, top: `${colH[c].toFixed(1)}px`, width: `${cw.toFixed(1)}px`, height: `${h.toFixed(1)}px` });
      colH[c] += h + gap;
      // (the picture at about twice the tile's width; the stand-ins' lighter copies)
      const want = Math.round(cw * 2);
      if (t.asked < want * 0.8) {
        t.asked = want;
        if (eager) t.img.loading = 'eager';
        art(t.pc, want).then((u) => { t.img.src = mid(u); });
      }
    });
    wall.style.height = `${Math.round(Math.max(...colH) - gap)}px`;
  }

  // ---------------------------------------------------------------- a domain, zoomed in

  // each domain's strip, made once and kept hidden until it is chosen: its work at one height, each
  // piece's title and maker under it, the arrows, then a hairline and its count and name, large
  const chapters = doms.map((a) => {
    const list = order.filter((pc) => pc.p.art === a.id);
    const sec = el('section', 'cw-chapter is-waiting');
    sec.hidden = true;
    sec.setAttribute('aria-labelledby', `cw-${a.id}`);
    sec.style.setProperty('--dom', COLOR[a.id]);
    const strip = el('ul', 'cw-strip');
    strip.setAttribute('aria-label', `${a.name}: the work`);
    const cards = list.map((pc) => {
      const li = el('li', 'cw-piece');
      li.style.setProperty('--r', pc.ratio.toFixed(4));
      const b = el('button', 'cw-pic');
      b.type = 'button';
      b.setAttribute('aria-label', `${pc.w.title}, ${pc.w.kind.toLowerCase()} by ${pc.p.name}`);
      const img = el('img');
      img.alt = '';
      img.decoding = 'async';
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
      return { li, b, img, pc, sig, cap, painted: false };
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
    // under it, how many pieces and the domain's name
    const foot = el('div', 'cw-foot');
    const num = el('span', 'cw-n'), name = el('h3', 'cw-dom');
    num.append(el('span', '', String(list.length)));
    num.setAttribute('aria-hidden', 'true');
    name.append(el('span', '', a.name));
    name.id = `cw-${a.id}`;
    foot.append(num, name);
    sec.append(strip, steps, foot);
    stage.append(sec);
    drag(strip);
    // its pictures load a screen ahead of where the strip is walked to
    if (io) {
      const near = new IntersectionObserver((es) => es.forEach((e) => {
        if (!e.isIntersecting) return;
        const c = cards.find((q) => q.li === e.target);
        if (c) paint(c);
        near.unobserve(e.target);
      }), { root: strip, rootMargin: '0px 100% 0px 100%' });
      cards.forEach((c) => near.observe(c.li));
    }
    return { a, sec, strip, steps, foot, cards, list, ends };
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

  // a strip's picture: the wall's lighter copy first (already loaded, so it can travel at once), then the
  // full one in its place
  const W_OF = (pc) => Math.round((narrow ? 520 : 760) * Math.max(1, pc.ratio));
  const tileOf = new Map(tiles.map((t) => [t.pc.key, t]));
  function paint(c) {
    if (c.painted) return;
    c.painted = true;
    const t = tileOf.get(c.pc.key);
    if (t?.li.classList.contains('is-loaded') && t.img.currentSrc) { c.img.src = t.img.currentSrc; c.li.classList.add('is-loaded'); }
    else c.img.addEventListener('load', () => c.li.classList.add('is-loaded'), { once: true });
    art(c.pc, W_OF(c.pc)).then((u) => {
      if (c.img.src && c.img.src.endsWith(u)) return;
      const full = new Image();
      full.onload = () => { c.img.src = u; };
      full.src = u;
    });
  }

  // ---------------------------------------------------------------- choosing: the wall to a domain and back

  let view = null; // (null: the wall; else the domain's id)
  const onScreen = (r) => r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  const chapterOf = (id) => chapters.find((c) => c.a.id === id);
  const DUR = 0.8, EASE = 'power3.inOut';
  // the filter keeps its place: if the wall was walked far down, the page comes back to the top of it
  const keepTop = () => {
    const top = Math.round(browse.getBoundingClientRect().top + scrollY);
    if (scrollY > top + 1) { lenis?.scrollTo?.(top, { immediate: true, force: true }); scrollTo(0, top); }
  };
  const settled = () => { refresh?.(); };
  // (a choice made while another is moving finishes that one first)
  let moving = [];
  const finish = () => { moving.forEach((tw) => tw.progress(1)); moving = []; };
  const tw = (t) => { moving.push(t); return t; };
  // a piece travels from one place on the screen to its new one: it starts where it was and moves home
  const travel = (node, from, delay = 0) => {
    const to = node.getBoundingClientRect();
    if (!to.width) return;
    tw(gsap.fromTo(node,
      { x: from.left - to.left, y: from.top - to.top, scale: from.width / to.width, transformOrigin: '0 0', zIndex: 2 },
      { x: 0, y: 0, scale: 1, duration: DUR, delay, ease: EASE, clearProps: 'transform,zIndex' }));
  };
  const rise = (nodes, delay = 0.15) => nodes.forEach((n, i) => tw(gsap.fromTo(n, { opacity: 0, y: 26 },
    { opacity: 1, y: 0, duration: 0.7, delay: delay + Math.min(i, 8) * 0.05, ease: 'power3.out', clearProps: 'opacity,transform' })));

  function showChapter(ch, from) {
    ch.cards.slice(0, 10).forEach(paint);
    if (from) ch.cards.forEach((c) => { if (from.has(c.pc.key)) paint(c); });
    ch.strip.scrollLeft = 0;
    ch.sec.hidden = false;
    keepTop();
    settled();
    ch.ends();
    if (reduced) { ch.sec.classList.remove('is-waiting'); return; }
    const flown = [];
    ch.cards.forEach((c) => {
      const f = from?.get(c.pc.key);
      if (f && onScreen(c.b.getBoundingClientRect())) { travel(c.b, f); flown.push(c); }
    });
    // (the strip clips what lies outside it, so while its pieces travel in from the wall it does not)
    if (flown.length) {
      ch.strip.classList.add('is-flying');
      tw(gsap.delayedCall(DUR + 0.05, () => ch.strip.classList.remove('is-flying')));
    }
    rise(ch.cards.filter((c) => !flown.includes(c) && onScreen(c.li.getBoundingClientRect())).map((c) => c.b), flown.length ? 0.3 : 0.05);
    tw(gsap.fromTo([...ch.cards.map((c) => c.cap), ch.steps], { opacity: 0 }, { opacity: 1, duration: 0.5, delay: 0.5, ease: 'power2.out', clearProps: 'opacity' }));
    requestAnimationFrame(() => requestAnimationFrame(() => ch.sec.classList.remove('is-waiting')));
  }
  function hideChapter(ch) {
    ch.sec.hidden = true;
    ch.sec.classList.add('is-waiting');
  }

  function select(id) {
    if (id === view) return;
    finish();
    say.classList.remove('is-on');
    const was = view;
    view = id;
    chips.forEach((c) => c.b.setAttribute('aria-pressed', String(c.id === id)));
    const ch = id && chapterOf(id);
    live.textContent = ch ? `Showing ${ch.list.length} pieces of ${ch.a.name.toLowerCase()}` : `Showing all ${order.length} pieces`;

    if (was === null) {
      // the wall to a domain: the others fade, then its pieces travel into the strip
      const from = new Map(), others = [];
      tiles.forEach((t) => {
        const r = t.b.getBoundingClientRect();
        if (!onScreen(r)) return;
        if (t.pc.p.art === id) from.set(t.pc.key, r); else others.push(t.li);
      });
      const go = () => { wall.hidden = true; gsap.set(others, { clearProps: 'opacity' }); showChapter(ch, from); };
      if (reduced || !others.length) go();
      else tw(gsap.to(others, { opacity: 0, duration: 0.3, ease: 'power2.out', onComplete: go }));
    } else if (id === null) {
      // a domain to the wall: its words fade, its pieces travel back to their places, the rest come back
      const old = chapterOf(was), from = new Map();
      old.cards.forEach((c) => { const r = c.b.getBoundingClientRect(); if (onScreen(r)) from.set(c.pc.key, r); });
      const go = () => {
        gsap.set([...old.cards.map((c) => c.cap), old.steps, old.foot], { clearProps: 'opacity' });
        hideChapter(old);
        wall.hidden = false;
        layoutWall();
        keepTop();
        settled();
        if (reduced) return;
        tiles.forEach((t) => {
          const r = t.b.getBoundingClientRect();
          if (!onScreen(r)) return;
          const f = from.get(t.pc.key);
          if (f) travel(t.li, f);
          else tw(gsap.fromTo(t.li, { opacity: 0 }, { opacity: 1, duration: 0.55, delay: 0.3, ease: 'power2.out', clearProps: 'opacity' }));
        });
      };
      if (reduced) go();
      else tw(gsap.to([...old.cards.map((c) => c.cap), old.steps, old.foot], { opacity: 0, duration: 0.22, ease: 'power2.out', onComplete: go }));
    } else {
      // one domain to another: the strip fades and the next rises in its place
      const old = chapterOf(was);
      const go = () => { gsap.set(old.sec, { clearProps: 'opacity' }); hideChapter(old); showChapter(ch, null); };
      if (reduced) go();
      else tw(gsap.to(old.sec, { opacity: 0, duration: 0.25, ease: 'power2.out', onComplete: go }));
    }
  }
  // Escape goes back to the wall (a piece open over the page closes first; the room handles that)
  addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || view === null) return;
    if (document.querySelector('.cc-room:not([hidden])')) return;
    const r = browse.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    select(null);
  });

  // ---------------------------------------------------------------- for the room

  const homeIn = (list) => list.find((h) => onScreen(h.art.getBoundingClientRect())) || null;
  layoutWall();
  return {
    // where a piece hangs here, to fly from and back to: its tile on the wall or its place in the strip
    // when in view, or the stack's front
    home(pc) {
      const out = [];
      if (view === null) { const t = tileOf.get(pc.key); if (t) out.push({ art: t.b, img: t.img, b: t.b }); }
      else chapterOf(view)?.cards.filter((c) => c.pc === pc).forEach((c) => out.push({ art: c.b, img: c.img, b: c.b }));
      deck.filter((c) => c.pc === pc && c.slot === 0).forEach((c) => out.push({ art: c.b, img: c.img, b: c.b }));
      return homeIn(out);
    },
    layout() {
      const was = narrow;
      narrow = isNarrow(innerWidth, innerHeight);
      if (was !== narrow) chapters.forEach((ch) => ch.cards.forEach((c) => sigInto(c.sig, c.pc.p, xh())));
      chapters.forEach(({ ends }) => ends());
      layoutWall();
    },
    select,
    get view() { return view; },
    // (for testing: every picture now, and the strips' words shown)
    paintAll: () => { eager = true; tiles.forEach((t) => { t.img.loading = 'eager'; }); chapters.forEach((ch) => ch.cards.forEach(paint)); },
    showAll: () => chapters.forEach(({ sec }) => sec.classList.remove('is-waiting')),
    deal, arrive,
    get deck() { return deck; },
    chapters, tiles, order,
    // (20 Nov) the heading and the words beside the pointer, for the current above the wall (js/corner-current.js)
    head, sayOf,
  };
}
