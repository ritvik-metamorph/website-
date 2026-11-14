// About: one account of the firm, at three lengths (about.html holds the copy).
//
// - The length: "How long have you got?" is answered with the time each length takes to read, at
//   230 words a minute, counted from the copy itself. It sets the whole page; each part's own
//   "More on this" takes just that part longer. The length chosen is kept for the next visit.
// - Growing: a longer version is the shorter one with words added between its words, so nothing
//   is replaced. Every word already on the page glides to its new place and size, the new words
//   arrive between them in reading order, and the type settles smaller as there is more of it.
//   Going shorter, the added words fade where they stand and the rest close up.
// - Skimming the long one: the short version's words stay darkest at every length, the middle
//   length's a step lighter, the longest's lighter again.
// - The words you are reading stay where they are while the page changes round them.
// - The page's moving parts (the butterfly, the story inked as it is read, the four stages, the
//   thread, the sentence) are js/about-way.js; the name's letters are setupName in
//   js/about-scenes.js.
import { setupName } from './about-scenes.js';
import { setupWay } from './about-way.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const WPM = 230;
const KEY = 'mm-read';
let relayout = () => {};

// ---------------------------------------------------------------- the words
// A block's copy is cut into words, each knowing the length it belongs to (the deepest data-l
// round it) and whether a space comes before it. Each is an inline-block that can move. A length
// is set by putting back only its words, those with no space before them (a full stop, a comma
// only a longer version has) held in one unbreakable run with the word they follow, so a line
// never breaks between them.

function render(b) {
  const frag = document.createDocumentFragment();
  let run = null;
  b.words.forEach((x) => {
    if (x.l > b.d) return;
    if (!run || x.sp) {
      if (x.sp && frag.childNodes.length) frag.append(' '); // the space between runs, where a line may break
      run = document.createElement('span');
      run.className = 'ab-run';
      frag.append(run);
    }
    run.append(x.g);
  });
  b.el.textContent = '';
  b.el.append(frag);
  b.el.dataset.d = b.d;
}

function build(el) {
  const toks = [];
  let space = false;
  (function walk(node, level, em) {
    node.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        n.textContent.split(/(\s+)/).forEach((p) => {
          if (!p) return;
          if (/^\s+$/.test(p)) { space = true; return; }
          toks.push({ text: p, l: level, sp: space && toks.length > 0, em });
          space = false;
        });
      } else if (n.nodeType === 1) {
        walk(n, Math.max(level, +n.dataset.l || 1), em || n.tagName === 'EM');
      }
    });
  })(el, 1, false);
  const words = toks.map((t) => {
    const g = document.createElement('span');
    g.className = `g l${t.l}${t.em ? ' it' : ''}`;
    g.textContent = t.text;
    return { g, l: t.l, sp: t.sp, real: /[\p{L}\p{N}]/u.test(t.text) };
  });
  const counts = [0, 1, 2, 3].map((d) => words.filter((x) => x.real && x.l <= d).length);
  return { el, words, counts, d: 3 };
}

export function setupAbout({ lenis, register, reduced, isTouch, local }) {
  const html = document.documentElement;
  const blocks = $$('.about .ab-text').map(build);
  const lead = blocks.find((b) => b.el.classList.contains('ab-lead'));
  const parts = $$('.ab-sec').map((sec) => ({ sec, more: $('.ab-more', sec), blocks: blocks.filter((b) => sec.contains(b.el)) }));
  const total = (d) => blocks.reduce((n, b) => n + b.counts[d], 0);
  const shown = () => blocks.reduce((n, b) => n + b.counts[b.d], 0);

  let depth = 1;
  try { depth = Math.min(3, Math.max(1, +localStorage.getItem(KEY) || 1)); } catch (e) {}
  blocks.forEach((b) => { b.d = depth; render(b); });

  // ---------------------------------------------------------------- the lengths, in time
  const timeOf = (n) => {
    const s = (n / WPM) * 60;
    if (s < 50) return `${Math.max(10, Math.round(s / 10) * 10)} seconds`;
    const m = Math.max(1, Math.round(s / 30) / 2);
    return m === 1 ? '1 minute' : `${Math.floor(m)}${m % 1 ? '½' : ''} minutes`;
  };
  $$('[data-depth]').forEach((b) => { b.textContent = timeOf(total(+b.dataset.depth)); });

  // ---------------------------------------------------------------- changing length

  const ghosts = document.createElement('div');
  ghosts.className = 'ab-ghosts';
  ghosts.setAttribute('aria-hidden', 'true');
  document.body.append(ghosts);
  const near = (r) => r.bottom > -160 && r.top < innerHeight + 160;

  // the word being read: the short version's word nearest a third of the way down the screen
  function anchorIn(list) {
    const line = innerHeight * 0.32;
    let best = null, bd = Infinity;
    list.forEach((b) => {
      const r = b.el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      b.words.forEach((x) => {
        if (x.l !== 1) return;
        const dd = Math.abs(x.g.getBoundingClientRect().top - line);
        if (dd < bd) { bd = dd; best = x.g; }
      });
    });
    return best;
  }

  // a part taken longer on its own keeps its head where it is, if its head is on screen
  function change(list, d, part) {
    const moving = list.filter((b) => b.d !== d);
    if (!moving.length) return;
    // everything as it is seen now, mid-flight included
    const was = new Map(), going = [], fs0 = new Map();
    moving.forEach((b) => {
      fs0.set(b, parseFloat(getComputedStyle(b.el).fontSize));
      b.words.forEach((x) => {
        if (x.l > b.d) return;
        const r = x.g.getBoundingClientRect();
        was.set(x, r);
        if (x.l > d && near(r)) {
          const cs = getComputedStyle(x.g);
          going.push({ text: x.g.textContent, r, color: cs.color, style: cs.fontStyle, size: cs.fontSize });
        }
      });
    });
    const gs = moving.flatMap((b) => b.words.map((x) => x.g));
    gsap.killTweensOf(gs);
    gsap.set(gs, { clearProps: 'transform,opacity' });

    // the new length, with the word being read kept where it was
    const top = part?.getBoundingClientRect().top;
    const anchor = part && top > 0 && top < innerHeight * 0.6 ? part : anchorIn(moving);
    const a0 = anchor?.getBoundingClientRect().top;
    moving.forEach((b) => { b.d = d; render(b); });
    relayout(); // the scroll's scenes, measured again for the new length
    if (anchor) {
      const dy = anchor.getBoundingClientRect().top - a0;
      if (Math.abs(dy) > 0.5) lenis.scrollTo(window.scrollY + dy, { immediate: true, force: true });
    }
    if (reduced) return;

    // the words that are going fade where they stood
    going.forEach((o) => {
      const e = document.createElement('span');
      e.className = 'ab-ghost';
      e.textContent = o.text;
      Object.assign(e.style, { left: `${o.r.left}px`, top: `${o.r.top}px`, height: `${o.r.height}px`, lineHeight: `${o.r.height}px`, fontSize: o.size, fontStyle: o.style, color: o.color });
      ghosts.append(e);
      gsap.to(e, { opacity: 0, y: -0.15 * o.r.height, duration: 0.4, ease: 'power1.out', onComplete: () => e.remove() });
    });
    // the rest glide to their new places and sizes, and the new ones arrive between them
    moving.forEach((b) => {
      const s = fs0.get(b) / parseFloat(getComputedStyle(b.el).fontSize);
      let n = 0;
      b.words.forEach((x) => {
        if (x.l > d) return;
        const r0 = was.get(x), r = x.g.getBoundingClientRect();
        if (!near(r) && !(r0 && near(r0))) return;
        if (r0) {
          gsap.fromTo(x.g,
            { x: r0.left - r.left, y: r0.top + r0.height / 2 - (r.top + r.height / 2), scale: s, transformOrigin: '0% 50%' },
            { x: 0, y: 0, scale: 1, duration: 1.1, ease: 'expo.out' });
        } else {
          gsap.fromTo(x.g, { opacity: 0, y: '0.5em' }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', delay: 0.18 + Math.min(n++ * 0.006, 0.9) });
        }
      });
    });
  }

  // ---------------------------------------------------------------- the controls

  const dialOpts = $('.ab-dial-opts');
  const mark = $('.ab-dial-mark');
  const count = $('.ab-words');
  const counter = { n: shown() };
  count.textContent = counter.n;
  function labels(now) {
    $$('[data-depth]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.depth === depth)));
    const on = $(`[data-depth="${depth}"]`, dialOpts);
    gsap.to(mark, { x: on.offsetLeft, width: on.offsetWidth, duration: now || reduced ? 0 : 0.8, ease: 'expo.out' });
    gsap.to(counter, { n: shown(), duration: now || reduced ? 0 : 1, ease: 'power2.out', snap: { n: 1 }, onUpdate: () => { count.textContent = counter.n; } });
    parts.forEach(({ more, blocks: bs }) => {
      const d = bs[0].d;
      const add = bs.reduce((n, b) => n + (d < 3 ? b.counts[d + 1] - b.counts[d] : b.counts[3] - b.counts[1]), 0);
      $('.ab-more-t', more).textContent = d < 3 ? 'More on this' : 'Back to the short version';
      $('.ab-more-n', more).textContent = d < 3 ? `+${add} words` : `−${add} words`;
    });
  }
  $$('[data-depth]').forEach((b) => b.addEventListener('click', () => {
    depth = +b.dataset.depth;
    try { localStorage.setItem(KEY, String(depth)); } catch (e) {}
    change(blocks, depth);
    labels();
  }));
  parts.forEach(({ sec, more, blocks: bs }) => more.addEventListener('click', () => {
    const d = bs[0].d;
    change(bs, d < 3 ? d + 1 : 1, sec);
    labels();
  }));
  addEventListener('resize', () => labels(true));

  // the length kept to hand at the foot of the screen, once the page's own question has gone by
  const dial = $('.ab-dial'), bar = $('.ab-bar'), end = $('.ab-end');
  const bars = () => {
    const past = dial.getBoundingClientRect().bottom < 0;
    const done = end.getBoundingClientRect().top < innerHeight * 0.8;
    bar.classList.toggle('is-on', past && !done);
  };
  lenis.on('scroll', bars);

  // ---------------------------------------------------------------- the name, and the note
  // Set up once the type is in, since the name is measured from it and the note is printed in it.

  const ready = Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 1500))]);
  let story = null;
  relayout = () => { ScrollTrigger.refresh(); story?.update(); };
  // (each on its own, so one that fails leaves the other)
  const safe = (f) => { try { return f(); } catch (e) { console.error(e); return null; } };
  ready.then(() => {
    const name = safe(() => setupName({ reduced, isTouch }));
    story = safe(() => setupWay({ lenis, register, reduced, isTouch, local }));
    name?.play();
    ScrollTrigger.refresh();
  });

  // ---------------------------------------------------------------- arriving

  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('is-in');
    io.unobserve(e.target);
  }), { rootMargin: '0px 0px -12% 0px' });
  $$('.ab-sec, .ab-end, .ab-q').forEach((s) => io.observe(s));

  labels(true);
  html.classList.remove('ab-arriving');
  if (!reduced) {
    // after the name has found its letters, the opening line rises in a word at a time, then the
    // question
    const first = lead.words.filter((x) => x.l <= lead.d).map((x) => x.g);
    gsap.from(first, { opacity: 0, y: '0.5em', duration: 1.1, ease: 'expo.out', stagger: Math.min(0.04, 1 / first.length), delay: 2.1 });
  }
  setTimeout(() => dial.classList.add('is-in'), reduced ? 0 : 3200);

  if (local) window.__about = { blocks, parts, change, get depth() { return depth; }, labels };
}
