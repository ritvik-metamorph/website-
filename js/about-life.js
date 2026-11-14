// The About page's thread of life (about.html; js/about-way.js starts it and ticks it).
//
// The page's common element is the thread (the silk under the page is what it is spun into), and
// here it is drawn: one silver line down the page that becomes, at each part, the stage of a life
// that part stands for, as a silkworm's own thread does. Nothing here is a picture; every creature
// is the line itself.
// - The name: an egg, a few turns wound small between the butterfly and the words, the line
//   dropping from it as the page is scrolled.
// - Our story: the caterpillar. Its loops lead the line down beside the words at the reading line,
//   so it moves as the story is read, its loops turning as it goes, and it crawls off into the next
//   part once the story is done.
// - The four stages: the line runs into the butterfly's net while the net is spun from it, and lets
//   go once the net is a cocoon.
// - The practice: the cocoon itself, hanging from the line and wound a turn a year to thirty as you
//   scroll (the count beside it), letting the line go below. It replaces the flat spiral.
// - How we decide: the line carries the sentence's pearls (js/about-way.js draws that part, from
//   where the cocoon let the line go).
// - Who we are: it passes down between the two questions and the coins.
// - The end: it runs to the butterfly, and as the butterfly takes off it traces the wings it leaves
//   where it was, so the page ends on their outline beside "Talk to us".
// Each part is drawn by the scroll with a point of light at its tip. All of it is laid out from the
// page's own content (layout(), on build and on resize); per frame only the scroll is read. With
// reduced motion it is drawn whole, the caterpillar resting at the foot of the story.

const { gsap } = window;
const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const $ = (s, c = document) => c.querySelector(s);
const narrow = () => matchMedia('(max-aspect-ratio: 1/1), (max-width: 899px) and (min-height: 521px)').matches;
const f1 = (n) => n.toFixed(1);
const f2 = (n) => n.toFixed(2);

// a polyline: its points, the length along it at each point, and the point at a given length
function poly(pts) {
  const at = [0];
  for (let i = 1; i < pts.length; i++) at.push(at[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, at, len: at[at.length - 1] || 1 };
}
function pointAt(P, l) {
  const { pts, at } = P;
  if (l <= 0) return pts[0];
  if (l >= P.len) return pts[pts.length - 1];
  let lo = 0, hi = at.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (at[m] < l) lo = m; else hi = m; }
  const k = (l - at[lo]) / (at[hi] - at[lo] || 1);
  return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * k, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * k];
}
const dOf = (pts, f = f1) => 'M' + pts.map((p) => `${f(p[0])} ${f(p[1])}`).join('L');
function cubic(a, c1, c2, b, n = 48) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, u = 1 - t, A = u * u * u, B = 3 * u * u * t, C = 3 * u * t * t, D = t * t * t;
    out.push([A * a[0] + B * c1[0] + C * c2[0] + D * b[0], A * a[1] + B * c1[1] + C * c2[1] + D * b[1]]);
  }
  return out;
}
// from a to b, leaving a and arriving at b running straight down, as a hanging thread does
const drop = (a, b, n) => { const dy = b[1] - a[1]; return cubic(a, [a[0], a[1] + dy * 0.55], [b[0], b[1] - dy * 0.55], b, n); };

// one part's line: an svg laid over the part, the line, and the point of light at its tip
function piece(host, cls) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', `ab-life ${cls}`);
  svg.setAttribute('aria-hidden', 'true');
  const line = document.createElementNS(NS, 'path');
  line.setAttribute('class', 'ab-life-line');
  const tip = document.createElementNS(NS, 'circle');
  tip.setAttribute('class', 'ab-life-tip');
  tip.setAttribute('r', '2');
  svg.append(line, tip);
  host.prepend(svg);
  const o = {
    svg, line, tip, P: null, drawn: -1,
    box(W, H) { svg.setAttribute('viewBox', `0 0 ${f1(W)} ${f1(H)}`); },
    set(pts) {
      o.P = poly(pts);
      line.setAttribute('d', dOf(pts));
      line.style.strokeDasharray = `${f1(o.P.len)} ${f1(o.P.len + 40)}`;
      o.drawn = -1;
    },
    // draw it to this length along it
    to(l) {
      if (!o.P) return;
      l = clamp(l, 0, o.P.len);
      if (Math.abs(l - o.drawn) < 0.25) return;
      o.drawn = l;
      line.style.strokeDashoffset = f1(o.P.len - l);
      const p = pointAt(o.P, l);
      tip.setAttribute('cx', f1(p[0]));
      tip.setAttribute('cy', f1(p[1]));
      tip.style.opacity = l > 0.5 && l < o.P.len - 0.5 ? 1 : 0;
    },
  };
  return o;
}

export function setupLife({ reduced }) {
  const open = $('.ab-open'), story = $('.ab-story'), stages = $('.ab-stages'), pin = $('.ab-stages-pin');
  const thread = $('.ab-thread'), threadPin = $('.ab-thread-pin'), spool = $('.ab-spool');
  const decideIn = $('.ab-decide-in'), who = $('.ab-who'), end = $('.ab-end');
  if (!open || !story || !stages || !pin || !thread || !spool || !decideIn || !who || !end) return { layout() {}, tick() {} };

  const egg = piece(open, 'ab-life-egg');
  const cat = piece(story, 'ab-life-cat');
  const into = piece(pin, 'ab-life-into');
  const pass = piece(who, 'ab-life-pass');
  const wings = piece(end, 'ab-life-wings');
  // the cocoon is drawn in the practice's own figure (its svg runs -100 to 100 and shows overflow)
  const cLine = $('.ab-spool-line'), cGhost = $('.ab-spool-ghost'), cTip = $('.ab-spool-tip'), cN = $('.ab-spool-n');

  const top = (el) => el.getBoundingClientRect().top + scrollY;
  const L = {};   // the layout, in page pixels unless said
  const st = { egg: reduced ? 1 : 0 };

  // the egg is wound once the name has arrived
  if (!reduced) gsap.to(st, { egg: 1, duration: 1.8, delay: 1.7, ease: 'power2.inOut' });

  function layout() {
    const n = narrow(), gut = parseFloat(getComputedStyle(story).paddingLeft) || 20;
    const lane = (a, b, host) => (a.right + b.left) / 2 - host.left;

    // (the caterpillar's lane, between the length dial and the words, is where the egg's line goes)
    const sr0 = story.getBoundingClientRect();
    const storyX = n ? Math.max(9, gut * 0.62) : lane($('.ab-story-side').getBoundingClientRect(), $('.ab-story-main').getBoundingClientRect(), sr0);

    // ---- the name: the egg
    {
      const o = open.getBoundingClientRect(), W = open.offsetWidth, H = open.offsetHeight;
      const x = n ? sr0.left + storyX - o.left : lane($('.ab-slot-open').getBoundingClientRect(), $('.ab-open-words').getBoundingClientRect(), o);
      const y = H - clamp(H * 0.1, 52, 96), rx = n ? 4.4 : 5.8, ry = n ? 6.4 : 8.6, turns = 4.5;
      const pts = [];
      for (let i = 0; i <= 240; i++) {
        const t = (i / 240) * turns * TAU, k = 1 - 0.16 * Math.sin((i / 240) * Math.PI), rot = 0.3 * Math.sin(t * 0.21);
        const ex = rx * k * Math.sin(t), ey = -ry * k * Math.cos(t);
        pts.push([x + ex * Math.cos(rot) - ey * Math.sin(rot), y + ex * Math.sin(rot) + ey * Math.cos(rot)]);
      }
      const eggEnd = pts.length;
      pts.push(...drop(pts[pts.length - 1], [sr0.left + storyX - o.left, H + 2], 30));
      egg.box(W, H);
      egg.set(pts);
      L.egg = { H, eggLen: egg.P.at[eggEnd - 1] };
      L.openTop = top(open);
    }

    // ---- our story: the caterpillar, in its lane
    {
      L.story = {
        top: top(story), W: story.offsetWidth, H: story.offsetHeight, x: storyX,
        // (on a phone the lane is the margin, so the loops turn out towards the edge, clear of the words)
        side: -1, a: n ? 2.1 : 3.7, b: n ? 3.7 : 9.6, loops: 6, abs: sr0.left + storyX,
      };
      cat.box(L.story.W, L.story.H);
      cat.line.style.strokeDasharray = 'none';
      L.story.head = null;
    }

    // ---- the four stages: from the caterpillar's lane into the top of the butterfly's net
    {
      const p = pin.getBoundingClientRect(), slot = $('.ab-slot-stages').getBoundingClientRect();
      const w = Math.min(slot.width * 0.92, slot.height * 1.05);
      const a = [L.story.abs - p.left, 0], b = [slot.left + slot.width / 2 - p.left, slot.top - p.top + slot.height / 2 - w * 0.26];
      into.box(p.width, p.height);
      into.set([a, ...drop(a, b, 60)]);
      L.stages = { top: top(stages), H: stages.offsetHeight };
    }

    // ---- the practice: the cocoon, in the figure's own units (200 across)
    {
      const fr = spool.getBoundingClientRect(), pr = threadPin.getBoundingClientRect(), u = fr.height / 200;
      const extT = (fr.top - pr.top) / u + 6, extB = (pr.bottom - fr.bottom) / u + 6;
      const yA = -66, yB = 68, R = 25, TURNS = 30, PER = 150;
      const coc = [];
      for (let i = 0; i <= TURNS * PER; i++) {
        const v = i / (TURNS * PER), t = v * TURNS * TAU, turn = Math.floor(t / TAU);
        const w = R * Math.pow(Math.sin(Math.PI * v), 0.55);
        // each turn crosses the last at its own slant, as silk is laid, so the cocoon is a mesh
        const k = 0.2 + 0.12 * Math.sin(turn * 2.4 + 0.6);
        coc.push([w * Math.sin(t), yA + (yB - yA) * v + w * k * Math.cos(t + turn * 0.7)]);
      }
      const pts = [[0, -100 - extT], [0, yA], ...coc.slice(1), [0, 100 + extB]];
      L.cocoon = { P: poly(pts), top: top(thread), H: thread.offsetHeight, drawn: -1 };
      L.cocoon.hangL = L.cocoon.P.at[1];
      L.cocoon.cocL = L.cocoon.P.at[coc.length] - L.cocoon.hangL;
      cLine.setAttribute('d', dOf(pts, f2));
      cGhost.setAttribute('d', dOf(coc, f2));
      cLine.style.strokeDasharray = `${f2(L.cocoon.P.len)} ${f2(L.cocoon.P.len + 20)}`;
      L.cocoon.abs = fr.left + fr.width / 2;
    }

    // ---- who we are: from the last pearl down between the questions and the coins
    {
      const r = who.getBoundingClientRect(), W = who.offsetWidth, H = who.offsetHeight;
      const di = decideIn.getBoundingClientRect(), last = decideIn.querySelector('.ab-pearl:last-child');
      const x0 = (last ? di.left + parseFloat(last.getAttribute('cx')) : di.left + di.width / 2) - r.left;
      const x1 = n ? x0 : lane($('.ab-who-words').getBoundingClientRect(), $('.ab-coins').getBoundingClientRect(), r);
      const bend = Math.min(H * 0.32, 300);
      pass.box(W, H);
      pass.set([[x0, 0], ...drop([x0, 0], [x1, bend], 40), [x1, H + 2]]);
      L.who = { top: top(who), H, abs: r.left + x1 };
    }

    // ---- the end: to the butterfly, and, as it takes off, the wings it leaves traced where it was
    {
      const r = end.getBoundingClientRect(), W = end.offsetWidth, H = end.offsetHeight, slot = $('.ab-slot-end').getBoundingClientRect();
      const cx = slot.left + slot.width / 2 - r.left, cy = slot.top - r.top + slot.height / 2, s = slot.width * 0.96 * 0.15;
      const fay = [];
      for (let t = 0; t <= TAU + 1e-6; t += 0.008) {
        const q = Math.exp(Math.cos(t)) - 2 * Math.cos(4 * t) - Math.pow(Math.sin(t / 12), 5);
        fay.push([cx + s * Math.sin(t) * q, cy - s * Math.cos(t) * q]);
      }
      const head = fay[0], x0 = L.who.abs - r.left;
      const entry = [[x0, 0], ...drop([x0, 0], head, 70)];
      wings.box(W, H);
      wings.set([...entry, ...fay.slice(1)]);
      L.end = { top: top(end), H, entryL: wings.P.at[entry.length - 1] };
    }
  }

  // the caterpillar, with its head at y in the story: the line straight down to its tail, then its
  // loops, which turn over as it moves so it seems to inch along
  function caterpillar(head) {
    const S = L.story, len = S.a * TAU * S.loops, tail = head - len, phase = head / S.a;
    const pts = [[S.x, -4]];
    if (tail > -4) pts.push([S.x, tail]);
    for (let t = 0; t <= TAU * S.loops + 1e-6; t += 0.08) {
      const e = smooth(0, TAU * 0.9, t) * (1 - 0.35 * smooth(TAU * (S.loops - 0.8), TAU * S.loops, t));
      pts.push([S.x + S.side * S.b * e * (1 - Math.cos(t + phase)), tail + S.a * t - S.b * e * Math.sin(t + phase)]);
    }
    return pts;
  }

  function tick() {
    if (!L.story) return;
    const y = scrollY, vh = innerHeight;

    // the egg, wound on arrival; the line drops from it as the name scrolls away
    const q = reduced ? 1 : clamp(y / (L.egg.H * 0.5), 0, 1);
    egg.to(st.egg < 1 ? L.egg.eggLen * st.egg : L.egg.eggLen + (egg.P.len - L.egg.eggLen) * q);

    // the caterpillar keeps to the reading line
    const S = L.story;
    const head = reduced ? S.H - 40 : vh * 0.66 - (S.top - y);
    if (S.head === null || Math.abs(head - S.head) > 0.4) {
      S.head = head;
      if (head <= 0) { cat.line.setAttribute('d', ''); cat.tip.style.opacity = 0; }
      else {
        const pts = caterpillar(head), p = pts[pts.length - 1];
        cat.line.setAttribute('d', dOf(pts));
        cat.tip.setAttribute('cx', f1(p[0]));
        cat.tip.setAttribute('cy', f1(p[1]));
        cat.tip.style.opacity = p[1] < S.H ? 1 : 0;
      }
    }

    // into the net as the stages arrive; it lets go once the net is a cocoon
    const sTop = L.stages.top - y;
    into.to(into.P.len * (reduced ? 1 : clamp((vh - sTop) / vh, 0, 1)));
    const s = clamp(-sTop / Math.max(1, L.stages.H - vh), 0, 1) * 4;
    into.svg.style.opacity = (1 - smooth(1.2, 1.9, s)).toFixed(3);

    // the cocoon, a turn a year
    const C = L.cocoon, tTop = C.top - y;
    const tp = reduced ? 1 : clamp((-tTop + vh * 0.15) / Math.max(1, C.H - vh * 0.95), 0, 1);
    const l = C.P.len * tp;
    if (Math.abs(l - C.drawn) > 0.05) {
      C.drawn = l;
      cLine.style.strokeDashoffset = f2(C.P.len - l);
      const p = pointAt(C.P, l);
      cTip.setAttribute('cx', f2(p[0]));
      cTip.setAttribute('cy', f2(p[1]));
      cTip.style.opacity = tp > 0.002 && tp < 0.998 ? 1 : 0;
      cN.textContent = Math.min(30, Math.floor(clamp((l - C.hangL) / C.cocL, 0, 1) * 30 + 0.0001));
    }

    // down between the questions and the coins, as far as the reading line (as the pearls' is)
    const R = vh * 0.62;
    pass.to(pass.P.len * (reduced ? 1 : clamp((R - (L.who.top - y)) / L.who.H, 0, 1)));

    // the end: on from the same reading line to the butterfly; then, while it takes off (from half
    // way, js/about-way.js), its wings are traced where it was. (With reduced motion it stays, so the
    // line only reaches it.)
    const E = L.end, eTop = E.top - y, ep = clamp((vh - eTop) / vh, 0, 1);
    if (reduced) wings.to(E.entryL);
    else if (eTop > R) wings.to(0);
    else if (ep < 0.6) wings.to(E.entryL * clamp((R - eTop) / Math.max(1, R - vh * 0.4), 0, 1));
    else wings.to(E.entryL + (wings.P.len - E.entryL) * smooth(0.6, 0.98, ep));
  }

  return { layout, tick };
}
