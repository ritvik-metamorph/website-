// The Creative Corner's opening, "the current" (20 Nov; the user chose it from five ideas, after the four galleries
// were taken off because they felt like a world of their own above the works). Every piece in the collection drifts
// upward in columns, a river of work on the night, each column at its own pace; the art of the day, the week and the
// month stand still in it, larger, like stones, and the heading with them. The stream parts round every stone: it
// narrows as it passes one, its pieces smaller beside the stone and full size again past it, the way water quickens
// round a rock. A hand in it slows the current where it rests, so a piece can be caught and opened; a drag pushes
// the current along. As the page goes on down, the current slows and stands still, and under it the wall, the same
// pieces in the same order of the day, is still water. So the opening is the collection itself, not a room above it.
// Never cropped, never filtered: each piece at its own shape, only made smaller or larger.

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);
// (the stand-in designs' lighter copies: 360px wide for the stream, 720px for the stones)
const thumb = (u) => u.replace('/corner/insomniac/', '/corner/insomniac/thumb/');
const mid = (u) => u.replace('/corner/insomniac/', '/corner/insomniac/mid/');
const hash = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

// where the stones lie, set by hand and off centre: the top left (as fractions of the stream) and the width
const SET_WIDE = { day: [0.075, 0.12, 0.225], week: [0.45, 0.1, 0.165], month: [0.735, 0.36, 0.16] };
const SET_NARROW = { day: [0.05, 0.075, 0.5], week: [0.57, 0.27, 0.38], month: [0.07, 0.46, 0.4] };

export function createCurrent(stage, { picks, order, head, art, open, sayOf, reduced }) {
  stage.classList.add('is-current');
  const river = el('div', 'cr-river');
  river.setAttribute('aria-hidden', 'true');
  stage.append(river);
  const say = el('p', 'cw-say');
  say.setAttribute('aria-hidden', 'true');
  document.body.append(say);

  // ---------------------------------------------------------------- the stones: the three picks, and the heading

  const seqOfPicks = picks.map((k) => k.pc);
  const stones = picks.map((k) => {
    const fig = el('figure', 'cr-stone');
    fig.dataset.kind = k.kind;
    const b = el('button', 'cr-pic');
    b.type = 'button';
    b.setAttribute('aria-label', `${k.honour}: ${k.title}, by ${k.maker}`);
    b.style.setProperty('--r', (k.pc.ratio || 0.8).toFixed(4));
    const img = el('img');
    img.alt = '';
    img.decoding = 'async';
    img.addEventListener('load', () => fig.classList.add('is-loaded'), { once: true });
    b.append(img);
    const cap = el('figcaption', 'cr-label');
    // (the honour in the italic, then the title and the maker: a museum label, nothing more)
    cap.innerHTML = `<em>${esc(k.honour)}</em><b>${esc(k.title)}</b><span>${esc(k.maker)}</span>`;
    fig.append(b, cap);
    stage.append(fig);
    art(k.pc, 900).then((u) => { img.src = mid(u); });
    b.addEventListener('click', () => open(k.pc, { art: b, img, b }, seqOfPicks));
    return { k, fig, b, img, cap, box: null };
  });
  if (head) { head.classList.add('cr-head'); stage.append(head); }

  // ---------------------------------------------------------------- the stream: every other piece, in the day's order

  const picked = new Set(picks.map((k) => k.pc.key));
  const tiles = order.filter((pc) => !picked.has(pc.key)).map((pc) => {
    const b = el('button', 'cr-tile');
    b.type = 'button';
    b.tabIndex = -1; // (the wall under it is the way through by keyboard)
    const img = el('img');
    img.alt = '';
    img.decoding = 'async';
    img.addEventListener('load', () => b.classList.add('is-loaded'), { once: true });
    b.append(img);
    river.append(b);
    const t = { b, img, pc, c: 0, y0: 0, h: 0, asked: false, vis: false, last: '' };
    b.addEventListener('click', (e) => { if (dragged) { e.preventDefault(); return; } open(pc, { art: b, img, b }, order); });
    b.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse') return; say.textContent = sayOf(pc); say.classList.add('is-on'); });
    b.addEventListener('pointerleave', () => say.classList.remove('is-on'));
    return t;
  });

  // ---------------------------------------------------------------- layout

  let W = 1, H = 1, narrow = false, n = 1, cw = 100, gap = 10, pad = 14, soft = 80, E = 200;
  const cols = []; // { x, L, v, cur, p }
  let blocks = []; // the stones as the stream sees them: { L, R, t, b }
  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    if (W < 10 || H < 10) return;
    narrow = isNarrow(innerWidth, innerHeight);
    n = narrow ? 3 : W >= 1280 ? 8 : W >= 1000 ? 7 : 5;
    gap = narrow ? 8 : 14;
    cw = (W - gap * (n + 1)) / n;
    pad = gap * 1.6;
    soft = cw * 0.9;
    // the columns, each filled in the day's order (each piece to the shortest), each with its own pace
    const keep = cols.map((c) => c.p);
    cols.length = 0;
    for (let c = 0; c < n; c++) cols.push({ x: gap + c * (cw + gap), L: 0, v: (narrow ? 12 : 15) + 15 * hash(c + 3), cur: 0, p: keep[c] || 0 });
    tiles.forEach((t) => {
      let c = 0;
      for (let k = 1; k < n; k++) if (cols[k].L < cols[c].L - 0.5) c = k;
      t.c = c;
      t.h = cw / (t.pc.ratio || 0.8);
      t.y0 = cols[c].L;
      cols[c].L += t.h + gap;
      t.b.style.width = `${cw.toFixed(1)}px`;
      t.b.style.height = `${t.h.toFixed(1)}px`;
      t.last = '';
    });
    // (a piece leaves the top wholly before it comes round again at the foot)
    E = Math.max(...tiles.map((t) => t.h), cw) + gap;
    // the stones where they were set, each no taller than its share of the screen
    const SET = narrow ? SET_NARROW : SET_WIDE;
    const maxH = H * (narrow ? 0.3 : 0.5);
    stones.forEach((s) => {
      const [fx, fy, fw] = SET[s.k.kind] || SET.day;
      const r = s.k.pc.ratio || 0.8;
      let w = fw * W;
      if (w / r > maxH) w = maxH * r;
      s.fig.style.left = `${(fx * W).toFixed(1)}px`;
      s.fig.style.top = `${(fy * H).toFixed(1)}px`;
      s.fig.style.width = `${w.toFixed(1)}px`;
    });
    // (a stone moves the stream only partly aside, the rest of it runs on under the stone, so the pieces stay near
    // their size; the heading has the stream go wholly round it, so the words always stand on the night)
    blocks = stones.map((s) => [s.fig, 0.55]).concat(head ? [[head, 1]] : []).map(([e, k]) => {
      const L = e.offsetLeft, T = e.offsetTop;
      return { L: L - pad, R: L + e.offsetWidth + pad, t: T - pad * 0.6, b: T + e.offsetHeight + pad * 0.6, k };
    }).sort((a, b) => a.L - b.L);
  }

  // the stream at a height: how much of each stone it has to go round there (none above and below it, all of it beside
  // it, easing between), and where a piece's column lies across it there. The free width is shared out evenly, so
  // the columns keep their order and close up beside a stone; the pieces there are made smaller by the same share.
  const minShare = 0.6;
  const wts = [];
  function shareAt(y) {
    let gone = 0;
    for (let i = 0; i < blocks.length; i++) {
      const q = blocks[i];
      const w = q.k * smooth(q.t - soft, q.t, y) * (1 - smooth(q.b, q.b + soft, y));
      wts[i] = w;
      gone += w * (q.R - q.L);
    }
    // (never narrower than a share of the width: past that a stone covers the stream's edge a little)
    if (gone > W * (1 - minShare)) { const k = (W * (1 - minShare)) / gone; for (let i = 0; i < blocks.length; i++) wts[i] *= k; gone = W * (1 - minShare); }
    return (W - gone) / W;
  }
  function across(u, s) {
    const T = u * s; // (how far along the free width this column's middle is)
    let x = 0, acc = 0;
    for (let i = 0; i < blocks.length; i++) {
      const q = blocks[i], L = Math.max(q.L, x), R = Math.max(q.R, L);
      if (acc + (L - x) >= T) return x + (T - acc);
      acc += L - x;
      const open = 1 - wts[i], len = (R - L) * open;
      if (open > 0.001 && acc + len >= T) return L + (T - acc) / open;
      acc += len;
      x = R;
    }
    return x + (T - acc);
  }

  // ---------------------------------------------------------------- the hand in the water

  let px = -1e4, py = -1e4, dragging = false, dragged = false, lastY = 0, lastT = 0, push = 0, dragV = 0;
  const wide = matchMedia('(hover: hover)').matches;
  stage.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = stage.getBoundingClientRect();
    px = e.clientX - r.left; py = e.clientY - r.top;
    say.style.transform = `translate(${Math.round(Math.min(e.clientX + 16, innerWidth - say.offsetWidth - 12))}px, ${Math.round(e.clientY + 18)}px)`;
    if (dragging) {
      const dy = e.clientY - lastY, now = performance.now();
      if (!dragged && Math.abs(dy) > 5) { dragged = true; stage.classList.add('is-pushing'); say.classList.remove('is-on'); }
      if (dragged) {
        cols.forEach((c) => { c.p -= dy; });
        dragV = (-dy / Math.max(8, now - lastT)) * 1000;
      }
      lastY = e.clientY; lastT = now;
    }
  });
  stage.addEventListener('pointerleave', () => { px = py = -1e4; });
  river.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button) return;
    dragging = true; dragged = false; lastY = e.clientY; lastT = performance.now(); dragV = 0;
  });
  addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = false;
    stage.classList.remove('is-pushing');
    if (dragged) push = clamp(dragV, -1600, 1600);
    setTimeout(() => { dragged = false; }, 0);
  });

  // ---------------------------------------------------------------- every frame while it is in view

  const t0 = performance.now();
  let last = t0, raf = 0, inView = true;
  const mod = (a, m) => ((a % m) + m) % m;
  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const r = stage.getBoundingClientRect();
    // the current slows as the page goes down to the wall, and stands still before it
    const leave = clamp(-r.top / H, 0, 1);
    const flowing = reduced ? 0 : 1 - smooth(0.04, 0.7, leave);
    // (it arrives: the columns rise in from the foot, quick at first, then settle to their pace)
    const since = (now - t0) / 1000;
    push *= Math.exp(-2.4 * dt);
    const pS = shareAt(py);
    cols.forEach((c, i) => {
      // the hand: the column under it slows almost to a stop, its neighbours a little
      let held = 0;
      if (wide && !dragging && py > -40 && py < H + 40) {
        const X = across(c.x + cw / 2, pS);
        held = Math.exp(-(((px - X) / (cw * pS * 0.8 + 6)) ** 2));
      }
      const want = c.v * flowing * (1 - 0.92 * held);
      c.cur += (want - c.cur) * (1 - Math.exp(-3.2 * dt));
      if (!dragging) c.p += (c.cur + push * flowing) * dt;
      c.arrive = reduced ? 0 : H * 1.05 * (1 - smooth(0, 1, (since - i * 0.07) / 2.8)) ** 1.6;
    });
    for (let k = 0; k < tiles.length; k++) {
      const t = tiles[k], c = cols[t.c];
      if (!c || c.L < 1) continue;
      const y = mod(t.y0 - c.p + E, c.L) - E + c.arrive;
      const on = y < H + 2 && y + t.h > -2;
      // (its picture is asked for a screen before it comes up)
      if (!t.asked && y < H * 2) { t.asked = true; art(t.pc, 360).then((u) => { t.img.src = thumb(u); }); }
      if (!on) { if (t.vis) { t.vis = false; t.b.style.visibility = 'hidden'; } continue; }
      if (!t.vis) { t.vis = true; t.b.style.visibility = 'visible'; }
      const s = shareAt(y + t.h / 2);
      const X = across(c.x + cw / 2, s);
      const tr = `translate3d(${(X - cw / 2).toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${s.toFixed(3)})`;
      if (tr !== t.last) { t.last = tr; t.b.style.transform = tr; }
    }
    if (inView && !document.hidden) raf = requestAnimationFrame(frame);
  }
  const run = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { inView = e.isIntersecting; if (inView) run(); }, { rootMargin: '80px 0px' }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) run(); });
  addEventListener('scroll', () => say.classList.remove('is-on'), { passive: true });

  layout();
  document.fonts?.ready.then(() => { layout(); run(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => layout()).observe(stage);
  run();

  const onScreen = (b) => { const r = b.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };
  return {
    // where a piece is here, to fly from and back to: its stone, or its place in the stream while in view
    home(pc) {
      const s = stones.find((q) => q.k.pc === pc && onScreen(q.b));
      if (s) return { art: s.b, img: s.img, b: s.b };
      const t = tiles.find((q) => q.pc === pc && q.vis && onScreen(q.b));
      return t ? { art: t.b, img: t.img, b: t.b } : null;
    },
    layout,
    // (for testing: the frame by hand, and what the stream is doing)
    tick: (ms = 16) => frame(last + ms),
    get cols() { return cols; }, get blocks() { return blocks; }, stones, tiles,
  };
}
