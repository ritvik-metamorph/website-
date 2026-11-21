// The Creative Corner, simply (21 Nov): "the viewer", behind ?corner=viewer.
//
// The user, after the walk: a version that is simple, "no environment… mainly the art pieces", a gallery the way one
// explores visuals, for both sections, a little motion, a little to touch, "it's more of a layout thing only"; of three
// sketches (refs/corner/sketch-simple-gallery.html) the first, made "a bit more creative in terms of text".
//
// What the visitor sees, both sections alike: one piece at a time, large, with printer's crop marks at its corners (the
// marks a print shop sets round a sheet: the bank's own craft, never a frame on the art). Its title in the italic, its
// maker signing their name under it, the ways on. The first section is the art of the day, the week and the month: the
// three honours a list at the left, the one in view large, its word turning; scrolling walks from one to the next
// (a ruler at the right edge tells how far), the number turning over. The second is every work: the nine domains a list
// with their counts, a strip of every piece of the one chosen along the foot; a click, the arrows, a swipe move on.
// Changing piece: the marks close in, the next opens out of them. The art itself is never touched: shown whole, at its
// own shape, exactly the picture.

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);
const pad = (n) => String(n).padStart(2, '0');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const mid = (u) => u.replace('/corner/insomniac/', '/corner/insomniac/mid/');
const thumb = (u) => u.replace('/corner/insomniac/', '/corner/insomniac/thumb/');
const firstOf = (p) => p.name.split(' ')[0];
// the daily order of every work (the same as the wall's: shuffled once a day, so nobody is always first)
const rng = (s) => () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const shuffle = (list, seed) => { const r = rng(seed), a = list.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const DAY = Math.floor(Date.now() / 864e5);
// a word set in the accent italic: "The day" → The <em>day</em>
const turnLast = (s) => { const i = s.lastIndexOf(' '); return i < 0 ? `<em>${esc(s)}</em>` : `${esc(s.slice(0, i))} <em>${esc(s.slice(i + 1))}</em>`; };

export function createViewer(host, o) {
  const { mode, ARTS = [], reduced, isTouch, lenis, open, art, sigInto, label } = o;
  const { gsap } = window;
  const picksMode = mode === 'picks';
  let narrow = isNarrow(innerWidth, innerHeight);
  host.classList.add('is-viewer', 'is-on');
  const stage = el('div', 'vw-stage');
  stage.dataset.mode = mode;
  host.append(stage);

  // ---- the lists: the three honours, or every work by domain
  const nameOfArt = (id) => ARTS.find((a) => a.id === id)?.name || '';
  let list, groups = [], group = 0;
  if (picksMode) {
    list = o.picks.map((k) => k.pc);
  } else {
    const all = shuffle(ARTS.flatMap((a) => o.ofDomain(a)), DAY);
    groups = [{ id: null, name: 'All', list: all }, ...ARTS.slice().sort((a, b) => a.name.localeCompare(b.name)).map((a) => ({ id: a.id, name: a.name, list: o.ofDomain(a) }))];
    list = groups[0].list;
  }
  let at = 0;

  // ---- what stays on the screen: the corners' words, the list, the piece, its caption, the counter
  const top = el('div', 'vw-top');
  if (picksMode) {
    top.innerHTML = `<p class="vw-name">Creative <em>corner</em></p><p class="vw-date vw-mono">${esc(o.picks[0].when)}</p>`;
  } else {
    const works = groups[0].list.length, people = new Set(groups[0].list.map((pc) => pc.p.slug)).size;
    top.innerHTML = `<h2 class="vw-head" id="${label ? 'vw-title' : 'cw-title'}">Artists in the middle of <em>becoming.</em></h2><p class="vw-sub vw-mono">${works} works · ${people} artists · ${ARTS.length === 9 ? 'nine' : ARTS.length} domains</p>`;
  }
  const nav = el(picksMode ? 'ol' : 'ul', 'vw-list');
  nav.setAttribute('aria-label', picksMode ? 'The art of the day, the week and the month' : 'Domains');
  const items = (picksMode ? o.picks : groups).map((g, i) => {
    const li = el('li'), b = el('button', 'vw-li');
    b.type = 'button';
    if (picksMode) b.innerHTML = `<span class="vw-li-t">${turnLast(g.honour.replace('Art of the ', 'The '))}</span><span class="vw-li-n vw-mono">${esc(g.when)}</span>`;
    else b.innerHTML = `<span class="vw-li-t">${esc(g.name)}</span><span class="vw-li-n vw-mono">${g.list.length}</span>`;
    b.addEventListener('click', () => (picksMode ? walkTo(i) : choose(i)));
    li.append(b);
    nav.append(li);
    return b;
  });
  const frame = el('div', 'vw-frame');
  const artB = el('button', 'vw-art');
  artB.type = 'button';
  const imgs = [el('img', 'vw-img'), el('img', 'vw-img')];
  imgs.forEach((im) => { im.alt = ''; im.decoding = 'async'; artB.append(im); });
  const marks = el('span', 'vw-marks', '<i></i><i></i><i></i><i></i>');
  marks.setAttribute('aria-hidden', 'true');
  frame.append(artB, marks);
  const cap = el('div', 'vw-cap');
  cap.setAttribute('aria-live', 'polite');
  cap.innerHTML = '<p class="vw-k vw-mono"></p><p class="vw-t"></p><p class="vw-by"><svg class="vw-sig" aria-hidden="true"></svg><span class="vw-who"></span></p>'
    + '<p class="vw-acts"><a class="vw-hire" href="#hire" data-soon></a><button class="vw-more" type="button"><span>See in detail</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5"/></svg></button></p>';
  const capK = cap.querySelector('.vw-k'), capT = cap.querySelector('.vw-t'), sig = cap.querySelector('.vw-sig'), who = cap.querySelector('.vw-who'), hire = cap.querySelector('.vw-hire'), more = cap.querySelector('.vw-more');
  const count = el('div', 'vw-count');
  count.innerHTML = '<span class="vw-now vw-mono"></span><span class="vw-of vw-mono"></span>'
    + (picksMode ? '' : '<span class="vw-step"><button type="button" class="vw-prev" aria-label="Previous piece"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M14 8H3M7.5 3.5 3 8l4.5 4.5"/></svg></button><button type="button" class="vw-next" aria-label="Next piece"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5"/></svg></button></span>');
  const now = count.querySelector('.vw-now'), of = count.querySelector('.vw-of');
  // the strip: small pictures of the list, the one in view ringed
  const strip = el('div', 'vw-strip');
  const track = el('div', 'vw-track');
  strip.append(track);
  // (the first section) a ruler at the right edge: how far down the three the scroll has come
  const ruler = picksMode ? el('div', 'vw-ruler', '<span class="vw-rule"></span><i class="vw-mark"></i>' + o.picks.map((k, i) => `<b style="top:${(i / Math.max(1, o.picks.length - 1)) * 100}%">${pad(i + 1)}</b>`).join('')) : null;
  stage.append(top, nav, frame, cap, count, strip);
  // (for the client's review, which version this is, at the top right: "Opening 3 of 3 · The viewer")
  if (label) { stage.classList.add('has-tag'); stage.append(el('p', 'vw-tag', esc(label))); }
  if (ruler) { ruler.setAttribute('aria-hidden', 'true'); stage.append(ruler); }

  // ---- the strip's pictures
  let thumbs = [];
  function fillStrip() {
    track.innerHTML = '';
    thumbs = list.map((pc, i) => {
      const b = el('button', 'vw-th');
      b.type = 'button';
      b.setAttribute('aria-label', `${pc.w.title} by ${pc.p.name}`);
      const im = el('img');
      im.alt = '';
      im.loading = 'lazy';
      im.decoding = 'async';
      art(pc, 360).then((u) => { im.src = thumb(u); });
      im.style.aspectRatio = String(pc.ratio || 1);
      b.append(im);
      b.addEventListener('click', () => (picksMode ? walkTo(i) : show(i)));
      track.append(b);
      return b;
    });
  }

  // ---- placing: the piece fitted to its area at its own shape; the caption beside it (under it on a phone)
  const R = { x: 0, y: 0, w: 1, h: 1 };
  function areaOf() {
    const W = stage.clientWidth, H = stage.clientHeight, G = clamp(W * 0.044, 16, 72), N = 64;
    if (narrow) {
      const y = picksMode ? N + 62 : N + 126, h = Math.max(200, H * (picksMode ? 0.5 : 0.42));
      return { x: G, y, w: W - 2 * G, h, G };
    }
    const y = picksMode ? N + 58 : N + 116, bottom = picksMode ? 112 : 150;
    return { x: W * 0.265, y, w: W * 0.41, h: H - y - bottom, G };
  }
  function fitTo(pc) {
    const A = areaOf(), r = pc.ratio || 1;
    let w = A.w, h = w / r;
    if (h > A.h) { h = A.h; w = h * r; }
    // (on a laptop the piece sits a little left of the area's middle, so its caption has room at its right)
    const x = narrow ? A.x + (A.w - w) / 2 : A.x + (A.w - w) * 0.42;
    return { x: Math.round(x), y: Math.round(A.y + (A.h - h) / 2), w: Math.round(w), h: Math.round(h), A };
  }
  function place(b) {
    Object.assign(R, b);
    Object.assign(frame.style, { transform: `translate(${b.x}px, ${b.y}px)`, width: `${b.w}px`, height: `${b.h}px` });
    if (narrow) cap.style.transform = `translate(${b.A.G}px, ${b.y + b.h + 26}px)`;
    else cap.style.transform = `translate(${b.x + b.w + 52}px, ${b.y + b.h}px) translateY(-100%)`;
  }

  // ---- the caption, and the maker signing it
  function caption(pc, i) {
    const k = picksMode ? o.picks[i] : null;
    capK.textContent = picksMode ? `${k.honour} · ${pad(i + 1)}` : `${groups[group].id ? groups[group].name : nameOfArt(pc.p.art)} · ${pad(i + 1)} of ${pad(list.length)}`;
    capT.innerHTML = [...pc.w.title].map((c) => (c === ' ' ? ' ' : `<span>${esc(c)}</span>`)).join('');
    who.innerHTML = `${esc(pc.p.name)}<span> · ${esc(pc.p.city)}, ${esc(pc.w.year)}</span>`;
    hire.textContent = `Hire ${firstOf(pc.p)}`;
    artB.setAttribute('aria-label', `Open ${pc.w.title} by ${pc.p.name}`);
    if (sigInto) {
      sigInto(sig, pc.p, narrow ? 6 : 7.4);
      sig.style.color = '';
      const ps = [...sig.querySelectorAll('path')];
      if (reduced || !gsap) ps.forEach((q) => { q.style.strokeDashoffset = 0; });
      else {
        gsap.set(ps, { strokeDashoffset: 1 });
        const tl = gsap.timeline({ delay: 0.35 });
        sig.querySelectorAll('.w').forEach((q, j) => tl.to(q, { strokeDashoffset: 0, duration: clamp((+q.dataset.len || 200) / 340, 0.3, 0.8), ease: 'power1.inOut' }, j ? '+=0.06' : 0));
        tl.to(sig.querySelectorAll('.l'), { strokeDashoffset: 0, duration: 0.1, stagger: 0.07, ease: 'none' });
      }
    }
    // the title's letters come up in turn (no mask round them: nothing of a letter is ever cut)
    if (!reduced && gsap) gsap.fromTo(capT.children, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.018, ease: 'expo.out', overwrite: true });
    // the number turns over
    const s = pad(i + 1);
    if (now.textContent !== s) {
      now.textContent = s;
      if (!reduced && gsap) gsap.fromTo(now, { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.5, ease: 'expo.out', overwrite: true });
    }
    of.textContent = `/ ${pad(list.length)}`;
    items.forEach((b, n) => b.classList.toggle('is-on', picksMode ? n === i : n === group));
    thumbs.forEach((b, n) => b.classList.toggle('is-on', n === i));
    const th = thumbs[i];
    if (th && !picksMode) {
      const sl = th.offsetLeft - (strip.clientWidth - th.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, sl), behavior: reduced ? 'auto' : 'smooth' });
    }
  }

  // ---- showing a piece: the marks close in, the next opens out of them
  let front = 0, shown = null, job = 0;
  function show(i, instant) {
    i = (i + list.length) % list.length;
    const pc = list[i];
    if (pc === shown && !instant) return;
    at = i;
    const id = ++job, first = !shown;
    shown = pc;
    caption(pc, i);
    art(pc, 1400).then((url) => {
      if (id !== job) return;
      const back = imgs[1 - front], cur = imgs[front];
      const go = () => {
        if (id !== job) return;
        const b = fitTo(pc);
        if (instant || first || reduced || !gsap) {
          place(b);
          back.style.opacity = 1; back.style.clipPath = ''; cur.style.opacity = 0;
          front = 1 - front;
          return;
        }
        gsap.killTweensOf([cur, back, marks]);
        const tl = gsap.timeline();
        tl.to(cur, { opacity: 0, duration: 0.24, ease: 'power2.in' }, 0)
          .to(marks, { scale: 0.94, opacity: 0.35, duration: 0.24, ease: 'power2.in' }, 0)
          .add(() => { place(b); front = 1 - front; })
          .fromTo(back, { opacity: 0, clipPath: 'inset(7% 7% 7% 7%)' }, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'expo.out', clearProps: 'clipPath' })
          .fromTo(marks, { scale: 0.94 }, { scale: 1, opacity: 1, duration: 0.75, ease: 'expo.out' }, '<');
      };
      back.onload = null;
      if (back.src.endsWith(url)) go();
      else { back.onload = () => { back.onload = null; (back.decode ? back.decode().catch(() => {}) : Promise.resolve()).then(go); }; back.src = url; }
    });
    // the next and the one before, fetched ahead
    [i + 1, i - 1].forEach((n) => { const q = list[(n + list.length) % list.length]; art(q, 1400).then((u) => { const im = new Image(); im.src = u; }); });
  }

  // ---- the first section: the scroll walks the three
  let span = 1, topY = 0, p = 0;
  function measure() { topY = host.getBoundingClientRect().top + scrollY; span = Math.max(1, host.offsetHeight - innerHeight); }
  function onScroll() {
    if (!picksMode) return;
    p = clamp((scrollY - topY) / span, 0, 1);
    const i = clamp(Math.round(p * (list.length - 1)), 0, list.length - 1);
    if (i !== at || !shown) show(i);
    if (ruler) ruler.style.setProperty('--p', p.toFixed(4));
  }
  function walkTo(i) {
    measure();
    const y = topY + (i / Math.max(1, list.length - 1)) * span;
    if (lenis?.scrollTo) lenis.scrollTo(y, { duration: reduced ? 0 : 1.1 });
    else scrollTo({ top: y, behavior: reduced ? 'auto' : 'smooth' });
  }

  // ---- the second section: a domain chosen, the strip refilled, its first piece shown
  function choose(g) {
    if (g === group && shown) return;
    group = g;
    list = groups[g].list;
    shown = null;
    fillStrip();
    if (!reduced && gsap) gsap.from(thumbs.slice(0, 18), { opacity: 0, y: 10, duration: 0.5, stagger: 0.02, ease: 'expo.out', clearProps: 'opacity,transform' });
    show(0);
  }

  // ---- touch: a swipe across the piece moves on; the keys, while the section holds the screen
  let down = null, swiped = false;
  artB.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY }; swiped = false; });
  artB.addEventListener('pointerup', (e) => {
    if (!down) return;
    const dx = e.clientX - down.x, dy = e.clientY - down.y;
    down = null;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.3) { swiped = true; step(dx < 0 ? 1 : -1); }
  });
  const step = (d) => (picksMode ? walkTo(clamp(at + d, 0, list.length - 1)) : show(at + d));
  artB.addEventListener('click', () => { if (swiped) { swiped = false; return; } open(shown, { art: artB, img: imgs[front], b: artB }, list); });
  more.addEventListener('click', () => open(shown, { art: artB, img: imgs[front], b: artB }, list));
  stage.querySelector('.vw-prev')?.addEventListener('click', () => show(at - 1));
  stage.querySelector('.vw-next')?.addEventListener('click', () => show(at + 1));
  const onKey = (e) => {
    if (picksMode || e.metaKey || e.ctrlKey || e.altKey || document.documentElement.classList.contains('cc-open') || /input|textarea|select/i.test(e.target?.tagName || '')) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const r = host.getBoundingClientRect();
    if (r.top > innerHeight * 0.4 || r.bottom < innerHeight * 0.6) return;
    e.preventDefault();
    show(at + (e.key === 'ArrowRight' ? 1 : -1));
  };
  addEventListener('keydown', onKey);

  // ---- start
  function layout() {
    narrow = isNarrow(innerWidth, innerHeight);
    stage.classList.toggle('is-narrow', narrow);
    measure();
    if (shown) place(fitTo(shown));
    if (picksMode) onScroll();
  }
  fillStrip();
  layout();
  if (picksMode) {
    if (lenis?.on) lenis.on('scroll', onScroll);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  } else show(0, true);
  document.fonts?.ready.then(layout);

  return {
    layout,
    // where a piece is on the page, to fly from and back to (the room's open and close)
    home(pc) {
      if (pc !== shown) return null;
      const r = artB.getBoundingClientRect();
      return r.bottom > 0 && r.top < innerHeight ? { art: artB, img: imgs[front], b: artB } : null;
    },
    show, choose, walkTo,
    get at() { return at; }, get list() { return list; }, get group() { return group; },
  };
}
