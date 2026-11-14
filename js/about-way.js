// The About page's moving parts (about.html; the words and their lengths are js/about.js).
//
// - The butterfly: the way in's own object (js/emerge-scene.js), drawn on one canvas over the page
//   and placed in whichever of its three places is on screen: met small by the name, held beside
//   the four stages, and taking off at the end. It leans towards the cursor; tap it by the name and
//   it beats its wings. Out of sight it rests.
// - Our story: each word is pale until the reading line reaches it, then inked.
// - The four stages: the section holds still while the scroll takes the butterfly through its own
//   stages, the net spun from a thread, the cocoon, the split, the wings, and the words show the
//   practice each stage stands for. Point at a stage's name and the butterfly goes to it; click it
//   and the page does.
// - The thread of life (js/about-life.js): one silver line down the page that is an egg by the name,
//   the caterpillar beside the story, the line into the net, the cocoon wound a turn a year to
//   thirty in the practice, and a pair of wings at the end.
// - How we decide: one sentence strung down the page on that thread, a pearl per clause, each clause
//   arriving as the thread reaches it. Point at a clause and its pearl catches the light.
// - Who we are: the founders' coins, struck as the team's coins are (js/coin.js), turn over.
import { createEmergeScene } from './emerge-scene.js';
import { setupSilk } from './about-silk.js';
import { createCoin } from './coin.js';
import { setupLife } from './about-life.js';

const { gsap } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const narrow = () => matchMedia('(max-aspect-ratio: 1/1), (max-width: 899px) and (min-height: 521px)').matches;

// the four stages as the way in's states: how far the net is spun, and how far it is a butterfly
const STAGES = [{ weave: 0.5, morph: 0 }, { weave: 1, morph: 0 }, { weave: 1, morph: 0.42 }, { weave: 1, morph: 1 }];
// s runs 0 to 4 through the section: the net is spun from its thread, held as a cocoon, split, opened
function stageAt(s) {
  if (s < 1) return { weave: lerp(0.1, 1, smooth(0.05, 0.95, s)), morph: 0 };
  if (s < 2) return { weave: 1, morph: 0 };
  if (s < 3) return { weave: 1, morph: lerp(0, 0.48, smooth(2.05, 2.95, s)) };
  return { weave: 1, morph: lerp(0.48, 1, smooth(3.05, 3.8, s)) };
}

export function setupWay({ lenis, register, reduced, isTouch, local }) {
  const open = $('.ab-open'), story = $('.ab-story'), stages = $('.ab-stages'), thread = $('.ab-thread');
  const decide = $('.ab-decide'), end = $('.ab-end');
  const slots = { open: $('.ab-slot-open'), stages: $('.ab-slot-stages'), end: $('.ab-slot-end') };
  const nights = $$('.ab-night');

  // the ground: one sheet of silk behind the whole page (js/about-silk.js); without it, the parts'
  // own grounds
  let silk = null;
  try { silk = setupSilk({ reduced, isTouch, local }); } catch (e) { console.warn('silk', e); }

  // the nav takes the tone of the ground under it (the silk's, or a night part's)
  register?.({
    under: (y) => {
      if (silk) { const s = silk.at(y); return { tone: s.g < 0.5 ? 'light' : 'ink', theme: s.hex }; }
      return nights.some((s) => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; }) ? { tone: 'light', theme: '#050709' } : null;
    },
    commit() {}, revert() {},
  });

  // ---------------------------------------------------------------- the butterfly
  const canvas = $('.ab-fly');
  const scene = createEmergeScene(canvas, { transparent: true });
  const S = scene ? scene.state : null;
  if (S) Object.assign(S, { weave: 1, morph: 1, lean: 0, tone: 0, exit: 0, twitch: 0 });
  const cur = { weave: 1, morph: 1 };
  let preview = -1;
  slots.open.addEventListener('click', () => scene?.flap());

  // how much of a section is on screen, 0 to 1
  const seen = (el) => {
    const r = el.getBoundingClientRect(), vh = innerHeight;
    return clamp((Math.min(r.bottom, vh) - Math.max(r.top, 0)) / Math.min(vh, r.height), 0, 1);
  };
  let px = -1, py = -1;
  if (!isTouch) addEventListener('pointermove', (e) => { px = e.clientX; py = e.clientY; }, { passive: true });

  // ---------------------------------------------------------------- our story, inked as it is read
  const storyText = $('.ab-story-text'), storyMain = $('.ab-story-main');
  let words = [];
  function measureStory() {
    words = $$('.g', storyText).map((g) => ({ g, y: g.offsetTop + g.offsetHeight * 0.5, read: g.classList.contains('is-read') }));
    // (with reduced motion it is all inked at once)
    if (reduced) words.forEach((w) => { w.read = true; w.g.classList.add('is-read'); });
  }

  // ---------------------------------------------------------------- the four stages
  const stageEls = $$('.ab-stage'), idx = $$('.ab-stage-idx button');
  let stageOn = -1;
  idx.forEach((b) => {
    const k = +b.dataset.go;
    b.addEventListener('pointerenter', () => { preview = k; });
    b.addEventListener('pointerleave', () => { preview = -1; });
    b.addEventListener('click', () => {
      const r = stages.getBoundingClientRect(), span = r.height - innerHeight;
      lenis.scrollTo(window.scrollY + r.top + ((k + 0.55) / 4) * span, { duration: reduced ? 0 : 1.4 });
    });
  });

  // ---------------------------------------------------------------- the thread of life, and the practice's cocoon
  const life = setupLife({ reduced });
  const spool = $('.ab-spool');

  // ---------------------------------------------------------------- how we decide: the sentence on the thread
  const decideIn = $('.ab-decide-in'), dsvg = $('.ab-decide-svg'), dLine = $('.ab-decide-line'), dGhost = $('.ab-decide-ghost'), pearlsG = $('.ab-pearls');
  const clauses = $$('.ab-clause');
  dsvg.insertAdjacentHTML('afterbegin', '<defs><radialGradient id="ab-pearl-g" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#ffffff"/><stop offset=".45" stop-color="#d6dbe0"/><stop offset="1" stop-color="#7d858d"/></radialGradient></defs>');
  let pearls = [], dLen = 1, dHeight = 1, dOff = 0;
  function layoutDecide() {
    const box = decideIn.getBoundingClientRect(), W = box.width;
    dHeight = box.height;
    dsvg.setAttribute('viewBox', `0 0 ${W.toFixed(1)} ${dHeight.toFixed(1)}`);
    const n = narrow(), cx = W / 2;
    const pts = clauses.map((c) => {
      const r = c.getBoundingClientRect(), b = $('b', c).getBoundingClientRect();
      const x = n ? 14 : c.dataset.side === 'l' ? cx - 30 : cx + 30;
      return [x, b.top - box.top + Math.min(b.height, 70) * 0.5];
    });
    // it comes down from where the cocoon above let the thread go, from the top of the part
    const sr = spool.getBoundingClientRect(), sx = clamp(sr.left + sr.width / 2 - box.left, 0, W);
    dOff = Math.max(0, box.top - decide.getBoundingClientRect().top);
    const yIn = -dOff * 0.4;
    let d = `M${sx.toFixed(1)} ${(-dOff).toFixed(1)} L${sx.toFixed(1)} ${yIn.toFixed(1)}`;
    let [x0, y0] = [sx, yIn];
    pts.forEach(([x, y]) => { const dy = y - y0; d += ` C${x0} ${(y0 + dy * 0.55).toFixed(1)} ${x} ${(y - dy * 0.55).toFixed(1)} ${x} ${y.toFixed(1)}`; x0 = x; y0 = y; });
    d += ` L${x0} ${dHeight.toFixed(1)}`;
    dLine.setAttribute('d', d);
    dGhost.setAttribute('d', d);
    dLen = dLine.getTotalLength();
    dLine.style.strokeDasharray = `${dLen} ${dLen + 10}`;
    pearlsG.innerHTML = pts.map(([x, y], i) => `<circle class="ab-pearl is-off" data-i="${i}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="9"/>`).join('');
    pearls = pts.map(([, y], i) => ({ y, el: pearlsG.children[i], on: false }));
  }
  // pointing at a clause lights its pearl
  clauses.forEach((c, i) => {
    const lit = (on) => {
      c.classList.toggle('is-lit', on);
      decideIn.classList.toggle('has-lit', on);
      pearls[i]?.el.classList.toggle('is-lit', on);
    };
    c.addEventListener('pointerenter', () => lit(true));
    c.addEventListener('pointerleave', () => lit(false));
    c.addEventListener('click', () => { if (isTouch) { clauses.forEach((o, j) => { if (j !== i) { o.classList.remove('is-lit'); pearls[j]?.el.classList.remove('is-lit'); } }); lit(!c.classList.contains('is-lit')); } });
  });

  // ---------------------------------------------------------------- who: the founders' coins
  // The team section's own coins (js/coin.js), struck for the two founders: the engraved portrait (a
  // stand-in until their photographs come), their name round the top and "Co-founder" where a year
  // would be; on the back, "In his own words" (or hers) and "To come", since their words are theirs
  // to give. Drag one to turn it, tap it to turn it over (Enter or Space from the keyboard). They
  // arrive turning as the section comes up, and rest while it is off the screen. Without WebGL the
  // drawn coins stay and turn over on a click.
  const FOUNDERS = [
    { name: 'Ritvik', legend: 'Co-founder', backTop: 'In his own words', before: 'To come', look: { hair: 0, tilt: -0.04, shoulders: 1.0, tone: 0.6, suit: 0.24 } },
    { name: 'Gurleen', legend: 'Co-founder', backTop: 'In her own words', before: 'To come', look: { hair: 2, tilt: 0.05, shoulders: 0.92, tone: 0.56, suit: 0.32 } },
  ];
  const coins = [];
  $$('.ab-coin').forEach((b, k) => {
    const host = document.createElement('div'), cv = document.createElement('canvas');
    host.className = 'ab-coin is-struck';
    cv.className = 'ab-coin-gl';
    cv.tabIndex = 0;
    cv.setAttribute('role', 'button');
    cv.setAttribute('aria-label', `${FOUNDERS[k].name}, co-founder. Turn the coin over`);
    // under it, as under the team's coins: the name, and the part they play
    const cap = document.createElement('p');
    cap.className = 'ab-coin-cap';
    cap.innerHTML = `<span class="ab-coin-name">${FOUNDERS[k].name}</span><span class="ab-coin-role">Co-founder</span>`;
    host.append(cv, cap);
    b.after(host);
    const coin = createCoin(cv, { person: FOUNDERS[k], reduced, size: isTouch ? 1024 : 2048 });
    if (!coin) {
      host.remove();
      b.addEventListener('click', () => b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')));
      return;
    }
    b.remove();
    coin.pause();
    cv.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); coin.flip(); } });
    coins.push({ coin, host, arrived: false });
  });
  function layoutCoins() {
    coins.forEach(({ coin, host }) => {
      const w = host.clientWidth, h = host.clientHeight;
      if (w > 1) coin.layout({ W: w, H: h, cx: w / 2, cy: h / 2, r: w * 0.4 });
    });
  }
  layoutCoins();
  const who = $('.ab-who');
  if (coins.length && who && 'IntersectionObserver' in window) {
    new IntersectionObserver(([e]) => coins.forEach((c, k) => {
      if (!e.isIntersecting) { c.coin.pause(); return; }
      c.coin.resume();
      if (!c.arrived) { c.arrived = true; gsap.delayedCall(k * 0.25, () => c.coin.arrive()); }
    }), { rootMargin: '120px 0px' }).observe(who);
  } else coins.forEach((c) => c.coin.resume());

  // ---------------------------------------------------------------- each frame
  let last = performance.now();
  function tick() {
    const now = performance.now(), dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const vh = innerHeight;

    // our story
    if (words.length) {
      const top = storyMain.getBoundingClientRect().top, line = vh * 0.66;
      if (top < vh && top > -storyMain.offsetHeight - vh) {
        words.forEach((w) => {
          const read = reduced || top + w.y < line;
          if (read !== w.read) { w.read = read; w.g.classList.toggle('is-read', read); }
        });
      }
    }

    // the stages: where the scroll is in them
    const sr = stages.getBoundingClientRect();
    const sp = clamp(-sr.top / Math.max(1, sr.height - vh), 0, 1), s = sp * 4;
    const k = preview >= 0 ? preview : Math.min(3, Math.floor(s));
    if (k !== stageOn) {
      stageOn = k;
      stageEls.forEach((el, i) => el.classList.toggle('is-on', i === k));
      idx.forEach((b, i) => b.classList.toggle('is-on', i === k));
    }
    idx.forEach((b, i) => b.style.setProperty('--p', clamp(s - i, 0, 1).toFixed(3)));

    // the thread of life: egg, caterpillar, the line into the net, the cocoon, the wings
    life.tick();

    // the sentence on the thread
    const dr = decideIn.getBoundingClientRect();
    const reach = reduced ? dHeight : clamp(vh * 0.62 - dr.top, -dOff, dHeight);
    dLine.style.strokeDashoffset = (dLen * (1 - (reach + dOff) / Math.max(1, dHeight + dOff))).toFixed(1);
    pearls.forEach((p, i) => {
      const on = p.y <= reach + 2;
      if (on !== p.on) { p.on = on; p.el.classList.toggle('is-off', !on); clauses[i].classList.toggle('is-on', on); }
    });

    // the butterfly: in whichever of its places is most on screen, and resting when none is
    if (!scene) return;
    const places = [['open', seen(open)], ['stages', seen(stages)], ['end', seen(end)]].sort((a, b) => b[1] - a[1]);
    const [where, amount] = places[0];
    const op = smooth(0.12, 0.55, amount);
    canvas.style.opacity = op.toFixed(3);
    scene.pause(op < 0.01);
    if (op < 0.01) return;
    const r = slots[where].getBoundingClientRect();
    const w = where === 'stages' ? Math.min(r.width * 0.92, r.height * 1.05) : r.width * 0.96;
    scene.place({ cx: r.left + r.width / 2, cy: r.top + r.height / 2, w });
    let target = { weave: 1, morph: 1 }, exit = 0;
    if (where === 'stages') target = preview >= 0 ? STAGES[preview] : stageAt(s);
    if (where === 'end') {
      const er = end.getBoundingClientRect();
      exit = reduced ? 0 : 0.85 * smooth(0.5, 1, (vh - er.top) / vh);
    }
    const kk = reduced ? 1 : 1 - Math.exp(-(preview >= 0 ? 5 : 14) * dt);
    cur.weave += (target.weave - cur.weave) * kk;
    cur.morph += (target.morph - cur.morph) * kk;
    S.weave = cur.weave;
    S.morph = cur.morph;
    S.exit = exit;
    if (px >= 0) scene.point(clamp((px - (r.left + r.width / 2)) / (innerWidth * 0.45), -1, 1), clamp((py - (r.top + r.height / 2)) / (vh * 0.6), -1, 1));
  }

  function update() {
    measureStory();
    layoutDecide();
    layoutCoins();
    life.layout();
    silk?.update();
    tick();
  }
  update();
  gsap.ticker.add(tick);
  let rT;
  addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(update, 150); });

  if (local) window.__way = { scene, silk, life, coins: coins.map((c) => c.coin), update, get stage() { return stageOn; } };
  return { update };
}
