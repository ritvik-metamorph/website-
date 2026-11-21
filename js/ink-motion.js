// The simple site's motion (16 Nov). The user: "good animations, good hover effect, and they can be a
// better effect than the current one, which extends the letter in boldness… overall look of the
// website and the experience can be way better in the simpler version." After IndigoEdge and the
// award sites: type that rises line by line out of a mask, pictures that open like a curtain and
// drift inside their frames, numbers that turn over like a counter on a note-counting machine, labels
// that roll, lists that dim to the one you are on. Everything quiet, quick and once: nothing bounces.
//
// What a page asks for, by attribute:
//   data-lines    a heading whose lines rise out of a mask as it comes up the screen (its italic word
//                 still turns after, js/turn.js); data-lines="hero" waits for the page to open
//   .ik-pic       a picture that opens like a curtain; data-drift moves it inside its frame with the
//                 scroll; data-arc="cx cy d" draws the engraver's compass arc over it (in % of its
//                 width and height, d in % of its width) with a registration mark in the corner
//   data-count    a number that turns over to its value
//   .btn, .ik-link  labels that roll over on hover; data-magnet leans a button towards the pointer
//   data-dim      a list that dims to the row under the pointer (in css/ink.css)
//   .ik-marq      a line of words that runs sideways, faster with the scroll, back when it reverses
//
// The type pass (16 Nov, later; the user: "make the text animations way better… it feels like every
// other professional website… that X factor in every section"). Each section's type does one thing,
// for a reason:
//   data-chars    letter by letter, each letter rising and righting itself (data-chars="hero" on open);
//                 in the hero its letters drift apart as the page leaves it
//   data-engrave  the words first printed faint, a pale proof, then the ink runs into them left to
//                 right (never an outline: the user wants no bordered text, 17 Nov); data-engrave="state"
//                 inks only when the page says so
//   data-read     reading light: the words come up from faint to full ink as you scroll through them,
//                 and footnotes light with the clause they belong to
//   data-gather   the words scattered, finding their places as you scroll (a line in the middle of
//                 becoming)
//   data-anagram  the word rearranges its own letters into another (Metamorph into Mother map)
//   data-scramble small figures decode into place

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const NS = 'http://www.w3.org/2000/svg';

export function inkMotion({ lenis, reduced, isTouch, local }) {
  const root = document.documentElement;
  if (reduced) root.classList.add('ik-still');
  const onEnter = (el, fn, start = 'top 88%') => {
    if (!ScrollTrigger) { fn(); return; }
    ScrollTrigger.create({ trigger: el, start, once: true, onEnter: fn });
  };

  // ---------------------------------------------------------------- lines, out of a mask
  // every word in its own small window (so nothing reflows), each line's words rising together, the
  // lines one after another; the window is a clip, not overflow, so the baseline stays where it was
  const heads = $$('[data-lines], [data-chars], [data-engrave]');
  const rnd = (k) => (((Math.sin(k * 12.9898 + 78.233) * 43758.5453) % 1) + 1) % 1; // (a fixed scatter, the same every visit)
  function split(el) {
    const words = [], letters = el.hasAttribute('data-letters'), chars = el.hasAttribute('data-chars');
    let ci = 0;
    const piece = (node) => { node.classList.add('ch'); node.style.setProperty('--ci', ci); node.style.setProperty('--r', rnd(ci++).toFixed(3)); return node; };
    const box = (inner) => {
      const m = document.createElement('span'), i = document.createElement('span');
      m.className = 'lm'; i.className = 'li';
      m.append(i);
      if (typeof inner === 'string') {
        if (chars) [...inner].forEach((c) => { const s = document.createElement('span'); s.textContent = c; i.append(piece(s)); });
        else i.textContent = inner;
      } else { inner.replaceWith(m); i.append(chars ? piece(inner) : inner); }
      words.push(m);
      return m;
    };
    const walk = (parent) => [...parent.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (!n.nodeValue.trim()) return;
        const frag = document.createDocumentFragment();
        n.nodeValue.split(/([ \t\n]+)/).forEach((p) => {
          if (!p) return;
          if (/^[ \t\n]+$/.test(p)) frag.append(' ');
          else if (letters) [...p].forEach((ch) => frag.append(box(ch))); // (a single word, letter by letter)
          else frag.append(box(p));
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        if (n.matches('.turn-w, .ik-chip, img')) box(n);
        else if (!n.matches('.sr-only, br')) walk(n);
      }
    });
    walk(el);
    // (engraved: the outline and its ink on each plain word; the word that turns is ink from the start,
    // it is the one that has already changed)
    if (el.hasAttribute('data-engrave')) words.forEach((m, wi) => {
      const li = m.firstChild;
      if (li.querySelector('.turn-w')) return;
      (chars ? [...li.querySelectorAll('.ch')] : [li]).forEach((t) => { t.classList.add('eg'); t.style.setProperty('--wi', wi); });
    });
    const index = () => {
      let top = -1e9, li = -1;
      if (letters) { words.forEach((w, k) => w.style.setProperty('--li', (k * 0.45).toFixed(2))); return; }
      words.forEach((w) => { const t = w.getBoundingClientRect().top; if (t > top + 6) { li++; top = t; } w.style.setProperty('--li', li); });
    };
    index();
    return { el, words, index };
  }
  let split$ = [];
  const show = (el) => el.classList.add('is-shown');
  const ready = document.fonts?.ready || Promise.resolve();
  if (!reduced) {
    root.classList.add('ik-lining');
    ready.then(() => {
      split$ = heads.map(split);
      heads.forEach((h) => {
        const ink = () => { if (h.hasAttribute('data-engrave') && h.dataset.engrave !== 'state') setTimeout(() => h.classList.add('is-inked'), 650); };
        if (h.dataset.lines === 'hero' || h.dataset.chars === 'hero') setTimeout(() => { show(h); ink(); }, 250);
        else onEnter(h, () => { show(h); ink(); });
      });
      let t = 0;
      addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => split$.forEach((s) => s.index()), 200); });
    });
  }

  // ---------------------------------------------------------------- words, wrapped one by one
  // (for the reading light and the gathering: each word its own span, nothing else moved)
  const wordsIn = (el, cls) => {
    const ws = [];
    const wrap = (n) => { const s = document.createElement('span'); s.className = cls; n.replaceWith(s); s.append(n); ws.push(s); return s; };
    const walk = (parent) => [...parent.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        if (!n.nodeValue.trim()) return;
        const frag = document.createDocumentFragment();
        n.nodeValue.split(/([ \t\n]+)/).forEach((p) => { if (!p) return; if (/^[ \t\n]+$/.test(p)) frag.append(' '); else { const s = document.createElement('span'); s.className = cls; s.textContent = p; frag.append(s); ws.push(s); } });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) {
        if (n.matches('.turn-w, .ik-chip, img')) wrap(n);
        else if (!n.matches('.sr-only, br')) walk(n);
      }
    });
    walk(el);
    return ws;
  };

  // ---------------------------------------------------------------- reading light
  // the words come up from faint to full ink as you scroll through them, a few ahead of the reader;
  // a clause marked with data-n lights its footnote (data-notes on the paragraph) once it is read
  const reads = reduced ? [] : $$('[data-read]').map((el) => {
    const ws = wordsIn(el, 'rw');
    ws.forEach((w) => { w.style.opacity = '0.26'; }); // (20 Nov: a legible pale proof, not missing words)
    const notes = el.dataset.notes ? $(el.dataset.notes) : null;
    const clauses = $$('[data-n]', el).map((c) => ({ last: ws.indexOf([...c.querySelectorAll('.rw')].pop()), note: notes && $(`[data-n="${c.dataset.n}"]`, notes), c }));
    clauses.forEach((c) => {
      const hot = (on) => { c.c.classList.toggle('is-hot', on); if (c.note) c.note.classList.toggle('is-hot', on); };
      c.c.addEventListener('pointerenter', () => hot(true)); c.c.addEventListener('pointerleave', () => hot(false));
      if (c.note) { c.note.addEventListener('pointerenter', () => hot(true)); c.note.addEventListener('pointerleave', () => hot(false)); }
    });
    return { el, ws, clauses, lit: -99 };
  });

  // ---------------------------------------------------------------- the line that gathers itself
  const gathers = $$('[data-gather]').map((el) => {
    const ws = wordsIn(el, 'gw');
    ws.forEach((w, k) => { w.style.setProperty('--dx', ((rnd(k + 3) - 0.5) * 180).toFixed(1)); w.style.setProperty('--dy', ((rnd(k + 41) - 0.5) * 130).toFixed(1)); w.style.setProperty('--dr', ((rnd(k + 77) - 0.5) * 18).toFixed(1)); });
    if (reduced) el.style.setProperty('--g', 1);
    return { el, g: -1 };
  });

  // ---------------------------------------------------------------- the anagram
  // its letters (each its own piece, data-letters) glide to where they stand in the other word and
  // back: once, a while after it is shown, and whenever the pointer comes to it or it is tapped
  $$('[data-anagram]').forEach((el) => {
    const to = el.dataset.anagram;
    let turned = false, busy = false;
    const run = () => {
      const ps = $$('.lm', el);
      if (busy || !ps.length || reduced) return;
      busy = true;
      const box = el.getBoundingClientRect();
      // where each letter of the other word would stand, set in the same face
      const probe = document.createElement('span');
      probe.setAttribute('aria-hidden', 'true');
      probe.style.cssText = 'position:absolute;left:0;top:0;visibility:hidden;white-space:pre';
      probe.innerHTML = [...to].map((c) => `<span>${c === ' ' ? '&nbsp;' : c}</span>`).join('');
      el.append(probe);
      const spots = [...probe.children].map((s, i) => ({ c: to[i], x: s.getBoundingClientRect().left - box.left, used: false }));
      probe.remove();
      ps.forEach((m, i) => {
        const c = m.textContent;
        const spot = spots.find((s) => !s.used && s.c === c) || spots.find((s) => !s.used && s.c.toLowerCase() === c.toLowerCase());
        if (!spot) return;
        spot.used = true;
        const was = Number(m.dataset.dx || 0);
        const home = m.getBoundingClientRect().left - box.left - was; // (where it stands in its own word)
        const dx = turned ? 0 : spot.x - home, hop = (i % 2 ? -1 : 1) * 0.08 * parseFloat(getComputedStyle(el).fontSize);
        m.dataset.dx = dx;
        m.animate([{ transform: `translate(${was}px, 0)` }, { transform: `translate(${(was + dx) / 2}px, ${hop}px)` }, { transform: `translate(${dx}px, 0)` }], { duration: 1200, delay: i * 45, easing: 'cubic-bezier(.77, 0, .175, 1)', fill: 'forwards' });
      });
      turned = !turned;
      el.classList.toggle('is-anagram', turned);
      setTimeout(() => { busy = false; }, 1700);
    };
    el.addEventListener('pointerenter', run);
    el.addEventListener('click', run);
    onEnter(el, () => setTimeout(() => { run(); setTimeout(() => { if (turned) run(); }, 3200); }, 2600));
  });

  // ---------------------------------------------------------------- figures that decode
  const glyphs = { d: '0123456789', u: 'ABCDEFGHJKLMNPQRSTUVWXYZ', l: 'abcdefghijkmnpqrstuvwxyz' };
  $$('[data-scramble]').forEach((el) => {
    const final = el.textContent;
    if (reduced) return;
    onEnter(el, () => {
      const t0 = performance.now(), dur = 650 + final.length * 30;
      const step = () => {
        const k = (performance.now() - t0) / dur;
        el.textContent = [...final].map((c, i) => {
          if (k * (final.length + 2) > i + 2 || !/[0-9A-Za-z]/.test(c)) return c;
          const set = /\d/.test(c) ? glyphs.d : /[A-Z]/.test(c) ? glyphs.u : glyphs.l;
          return set[Math.floor(Math.random() * set.length)];
        }).join('');
        if (k < 1) requestAnimationFrame(step); else el.textContent = final;
      };
      step();
    }, 'top 92%');
  });

  // ---------------------------------------------------------------- pictures: a curtain, then drift
  const pics = $$('.ik-pic');
  pics.forEach((f) => {
    // the engraver's compass arc and a registration mark: the printer's marks for lining up plates
    if (f.dataset.arc) {
      const [cx, cy, d] = f.dataset.arc.split(/\s+/).map(Number);
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'ik-arc');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.cssText = `left:${cx - d / 2}%;top:calc(${cy}% - ${d / 2}cqw);width:${d}%`;
      svg.innerHTML = '<circle cx="50" cy="50" r="49.6" pathLength="1"/><path d="M50 44v12M44 50h12" pathLength="1"/>';
      f.append(svg);
      const reg = document.createElementNS(NS, 'svg');
      reg.setAttribute('class', 'ik-reg');
      reg.setAttribute('viewBox', '0 0 24 24');
      reg.setAttribute('aria-hidden', 'true');
      reg.innerHTML = '<circle cx="12" cy="12" r="6.5"/><path d="M12 1v22M1 12h22"/>';
      f.append(reg);
    }
    if (reduced) { f.classList.add('is-shown'); return; }
    onEnter(f, () => f.classList.add('is-shown'), 'top 92%');
  });
  const drifting = pics.filter((f) => f.hasAttribute('data-drift'));

  // ---------------------------------------------------------------- numbers that turn over
  // each digit a strip of two turns of 0 to 9; it runs one full turn and stops on its value
  $$('[data-count]').forEach((el) => {
    const v = el.textContent.trim();
    el.setAttribute('aria-label', v);
    el.textContent = '';
    [...v].forEach((ch, k) => {
      if (!/\d/.test(ch)) { const s = document.createElement('span'); s.textContent = ch; s.setAttribute('aria-hidden', 'true'); el.append(s); return; }
      const od = document.createElement('span'), strip = document.createElement('span');
      od.className = 'od'; strip.className = 'od-s';
      od.setAttribute('aria-hidden', 'true');
      strip.textContent = '01234567890123456789';
      strip.style.setProperty('--to', 10 + Number(ch));
      strip.style.setProperty('--k', k);
      od.append(strip);
      el.append(od);
    });
    if (reduced) { el.classList.add('is-shown'); return; }
    onEnter(el, () => el.classList.add('is-shown'));
  });

  // ---------------------------------------------------------------- labels that roll over
  // the label slides up out of its window and the same word comes up from under it
  $$('.btn, .ik-link, .ik-roll').forEach((b) => {
    if (b.querySelector('.rl')) return;
    const text = [...b.childNodes].filter((n) => n.nodeType === 3 && n.nodeValue.trim());
    text.forEach((n) => {
      const rl = document.createElement('span'), a = document.createElement('span'), c = document.createElement('span');
      rl.className = 'rl'; a.className = 'rl-a'; c.className = 'rl-b';
      a.textContent = c.textContent = n.nodeValue.trim();
      c.setAttribute('aria-hidden', 'true');
      rl.append(a, c);
      n.replaceWith(rl);
    });
  });

  // ---------------------------------------------------------------- buttons that lean to the pointer
  if (!isTouch && !reduced) $$('[data-magnet]').forEach((b) => {
    const x = gsap.quickTo(b, 'x', { duration: 0.6, ease: 'power3.out' }), y = gsap.quickTo(b, 'y', { duration: 0.6, ease: 'power3.out' });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      x(clamp((e.clientX - r.left - r.width / 2) * 0.22, -9, 9));
      y(clamp((e.clientY - r.top - r.height / 2) * 0.3, -7, 7));
    });
    b.addEventListener('pointerleave', () => { x(0); y(0); });
  });

  // ---------------------------------------------------------------- the line of words that runs
  // the words twice over, run sideways; the scroll's speed adds to it and its direction turns it
  const marqs = $$('.ik-marq').map((m) => {
    const track = $('.ik-marq-t', m);
    track.append(...[...track.children].map((n) => n.cloneNode(true))); // (the line is hidden from screen readers in the page)
    const st = { m, track, x: 0, w: 0, dir: 1, hold: 0, holdT: 0 };
    const measure = () => { st.w = track.scrollWidth / 2; };
    measure();
    ready.then(measure);
    addEventListener('resize', measure);
    m.addEventListener('pointerenter', () => { st.holdT = 1; });
    m.addEventListener('pointerleave', () => { st.holdT = 0; });
    return st;
  });

  // ---------------------------------------------------------------- one loop for all that follows the scroll
  const hero = $('.ik-hero'), film = hero && ($('.ik-film-in', hero) || $('.ik-film', hero)), heroIn = hero && $('.ik-hero-in', hero), heroTitle = hero && $('.title', hero);
  const smooth01 = (t) => t * t * (3 - 2 * t);
  let last = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const vh = innerHeight, vel = lenis?.velocity || 0;
    // the hero draws back as the page leaves it: the film sinks a little, the words rise away
    if (hero && !reduced) {
      const p = clamp((lenis?.scroll ?? scrollY) / vh, 0, 1);
      if (p < 1) {
        film.style.transform = `translate3d(0, ${(p * 16).toFixed(2)}%, 0) scale(${(1 + p * 0.06).toFixed(4)})`;
        heroIn.style.transform = `translate3d(0, ${(-p * 12).toFixed(2)}vh, 0)`;
        heroIn.style.opacity = (1 - p * 1.25).toFixed(3);
      }
    }
    // the hero's letters drift apart as it leaves, each at its own pace
    if (heroTitle && !reduced) heroTitle.style.setProperty('--hp', clamp((lenis?.scroll ?? scrollY) / vh, 0, 1).toFixed(3));
    // reading light: lit up to a few words ahead of where the reader is
    reads.forEach((R) => {
      const r = R.el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) return;
      const p = clamp((vh * 0.86 - r.top) / (r.height + vh * 0.32), 0, 1);
      const lit = Math.round((p * (R.ws.length + 4) - 2) * 20) / 20;
      if (lit === R.lit) return;
      R.lit = lit;
      // (only the words whose light changed are touched)
      // (20 Nov: the light's front spread over three words, so the ink comes up across them like light, never a word at a time)
      R.ws.forEach((w, i) => { const o = 0.26 + 0.74 * clamp((lit - i + 1.5) / 3, 0, 1); if (Math.abs(o - (w._o ?? -1)) > 0.004) { w._o = o; w.style.opacity = o.toFixed(3); } });
      R.clauses.forEach((c) => { const on = lit - c.last >= 1; c.c.classList.toggle('is-read', on); if (c.note) c.note.classList.toggle('is-read', on); });
    });
    // gathering: scattered while it comes up the screen, in place by the time it is two fifths up
    gathers.forEach((G) => {
      const r = G.el.getBoundingClientRect();
      if (r.bottom < -40 || r.top > vh + 40) return;
      const g = Math.round(smooth01(clamp((vh * 0.98 - r.top) / (vh * 0.56), 0, 1)) * 500) / 500;
      if (g !== G.g) { G.g = g; G.el.style.setProperty('--g', g); }
    });
    // pictures drift inside their frames, against the scroll
    if (!reduced) drifting.forEach((f) => {
      const r = f.getBoundingClientRect();
      if (r.bottom < -50 || r.top > vh + 50) return;
      const p = (r.top + r.height) / (vh + r.height); // 1 entering below, 0 leaving above
      f.style.setProperty('--py', ((p - 0.5) * 10).toFixed(2) + '%');
    });
    marqs.forEach((st) => {
      if (!st.w) return;
      if (Math.abs(vel) > 0.5) st.dir = vel > 0 ? 1 : -1;
      st.hold += (st.holdT - st.hold) * Math.min(1, dt * 6);
      const speed = (reduced ? 0 : 38 + Math.min(900, Math.abs(vel) * 34)) * (1 - st.hold);
      st.x -= speed * dt * st.dir;
      if (st.x <= -st.w) st.x += st.w;
      if (st.x > 0) st.x -= st.w;
      st.track.style.transform = `translate3d(${st.x.toFixed(2)}px, 0, 0)`;
    });
  });

  const handle = {
    heads, pics, marqs,
    // (local testing: everything shown at once, as if each had been reached)
    reads, gathers,
    show() { heads.forEach((h) => { show(h); h.classList.add('is-inked'); }); pics.forEach((f) => f.classList.add('is-shown')); $$('[data-count]').forEach((e) => e.classList.add('is-shown')); },
  };
  if (local) window.__inkMotion = handle;
  return handle;
}
