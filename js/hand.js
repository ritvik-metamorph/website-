// A hand: a single-line script for the Creative Corner, drawn in code, one pen path per letter.
// Words are written as one continuous line, the way a pen joins cursive letters, so the line can
// be the loop wire the artists ride. Dots and crosses (i, j, t, x) are lifted strokes, put on after.
//
// Letters are in units of the x-height: the baseline is 0, ascenders reach about 2.2, descenders
// about -1.15. Each starts low on the left and leaves low on the right, so the next joins it. The
// points are only the pen's main turns; a centripetal Catmull-Rom curve runs through them.
// If a real hand is ever written for these words, a single-line SVG path can replace writeWord().

const A = [[0, 0.05], [0.45, 0.6], [0.82, 0.95], [0.55, 1.02], [0.22, 0.85], [0.05, 0.45], [0.18, 0.05], [0.48, 0.02], [0.72, 0.35], [0.84, 0.98]];
const G = {
  a: [...A, [0.8, 0.45], [0.84, 0.08], [1.0, 0.0], [1.18, 0.12]],
  b: [[0, 0.05], [0.35, 0.9], [0.6, 1.85], [0.55, 2.22], [0.38, 2.1], [0.3, 1.4], [0.28, 0.6], [0.3, 0.05], [0.55, 0.02], [0.8, 0.35], [0.78, 0.82], [0.6, 0.95], [0.52, 0.8], [0.75, 0.72], [1.0, 0.74]],
  c: [[0, 0.05], [0.5, 0.68], [0.8, 0.9], [0.72, 1.0], [0.55, 0.98], [0.28, 0.88], [0.08, 0.55], [0.12, 0.12], [0.42, -0.02], [0.75, 0.1], [0.95, 0.22]],
  d: [...A, [0.88, 1.5], [0.96, 2.2], [0.9, 1.4], [0.86, 0.6], [0.88, 0.08], [1.04, 0.0], [1.22, 0.12]],
  e: [[0, 0.05], [0.35, 0.3], [0.66, 0.66], [0.7, 0.9], [0.55, 1.0], [0.36, 0.86], [0.22, 0.5], [0.25, 0.14], [0.45, 0.0], [0.72, 0.05], [0.95, 0.2]],
  f: [[0, 0.05], [0.3, 0.6], [0.55, 1.4], [0.65, 2.0], [0.55, 2.24], [0.38, 2.1], [0.32, 1.5], [0.3, 0.5], [0.28, -0.4], [0.25, -1.05], [0.15, -1.18], [0.08, -1.0], [0.2, -0.5], [0.45, -0.06], [0.65, 0.08], [0.9, 0.18]],
  g: [...A, [0.8, 0.2], [0.76, -0.6], [0.65, -1.1], [0.42, -1.18], [0.3, -0.95], [0.5, -0.5], [0.85, -0.05], [1.1, 0.15]],
  h: [[0, 0.05], [0.32, 0.8], [0.55, 1.7], [0.55, 2.2], [0.38, 2.15], [0.28, 1.6], [0.24, 0.8], [0.22, 0.05], [0.3, 0.55], [0.5, 0.92], [0.72, 0.92], [0.8, 0.6], [0.78, 0.15], [0.9, 0.0], [1.12, 0.12]],
  i: [[0, 0.05], [0.25, 0.55], [0.38, 0.95], [0.32, 0.5], [0.34, 0.1], [0.5, 0.0], [0.7, 0.12]],
  j: [[0, 0.05], [0.25, 0.55], [0.38, 0.95], [0.36, 0.2], [0.33, -0.6], [0.25, -1.1], [0.1, -1.15], [0.08, -0.9], [0.3, -0.45], [0.6, -0.05], [0.82, 0.12]],
  k: [[0, 0.05], [0.32, 0.8], [0.55, 1.7], [0.55, 2.2], [0.38, 2.15], [0.28, 1.6], [0.24, 0.8], [0.22, 0.05], [0.32, 0.5], [0.62, 0.92], [0.78, 0.78], [0.62, 0.55], [0.38, 0.5], [0.6, 0.42], [0.75, 0.1], [0.9, 0.0], [1.08, 0.12]],
  l: [[0, 0.05], [0.32, 0.8], [0.55, 1.7], [0.55, 2.2], [0.38, 2.15], [0.28, 1.6], [0.26, 0.6], [0.3, 0.08], [0.48, 0.0], [0.7, 0.12]],
  m: [[0, 0.05], [0.12, 0.55], [0.2, 0.9], [0.2, 0.4], [0.18, 0.02], [0.28, 0.6], [0.45, 0.92], [0.6, 0.85], [0.62, 0.4], [0.6, 0.02], [0.7, 0.6], [0.88, 0.92], [1.02, 0.85], [1.04, 0.4], [1.02, 0.1], [1.15, 0.0], [1.35, 0.12]],
  n: [[0, 0.05], [0.12, 0.55], [0.2, 0.9], [0.2, 0.4], [0.18, 0.02], [0.28, 0.6], [0.45, 0.92], [0.6, 0.85], [0.62, 0.4], [0.62, 0.1], [0.75, 0.0], [0.95, 0.12]],
  o: [[0, 0.05], [0.35, 0.55], [0.68, 0.95], [0.4, 1.0], [0.12, 0.75], [0.1, 0.25], [0.35, 0.0], [0.62, 0.2], [0.7, 0.7], [0.62, 0.98], [0.58, 0.8], [0.75, 0.72], [0.95, 0.75]],
  p: [[0, 0.05], [0.2, 0.6], [0.3, 1.0], [0.28, 0.3], [0.25, -0.5], [0.22, -1.15], [0.24, -0.4], [0.3, 0.4], [0.5, 0.88], [0.75, 0.88], [0.82, 0.45], [0.62, 0.05], [0.38, 0.12], [0.6, 0.08], [0.82, 0.05], [1.0, 0.15]],
  q: [...A, [0.8, 0.2], [0.76, -0.6], [0.74, -1.12], [0.72, -0.6], [0.85, -0.1], [1.05, 0.12]],
  r: [[0, 0.05], [0.25, 0.6], [0.38, 0.98], [0.5, 0.85], [0.62, 0.9], [0.6, 0.5], [0.62, 0.1], [0.78, 0.0], [0.95, 0.12]],
  s: [[0, 0.05], [0.3, 0.55], [0.42, 1.02], [0.5, 0.7], [0.62, 0.35], [0.48, 0.05], [0.25, 0.0], [0.15, 0.12], [0.4, 0.08], [0.7, 0.08], [0.9, 0.18]],
  t: [[0, 0.05], [0.25, 0.7], [0.38, 1.6], [0.35, 1.0], [0.32, 0.3], [0.38, 0.03], [0.58, 0.0], [0.78, 0.12]],
  u: [[0, 0.05], [0.12, 0.55], [0.18, 0.95], [0.15, 0.4], [0.2, 0.05], [0.4, 0.0], [0.6, 0.4], [0.68, 0.95], [0.65, 0.45], [0.66, 0.08], [0.82, 0.0], [1.0, 0.12]],
  v: [[0, 0.05], [0.12, 0.55], [0.2, 0.95], [0.32, 0.4], [0.45, 0.02], [0.6, 0.4], [0.72, 0.95], [0.68, 0.8], [0.82, 0.72], [1.0, 0.75]],
  w: [[0, 0.05], [0.12, 0.55], [0.18, 0.95], [0.18, 0.4], [0.25, 0.03], [0.42, 0.1], [0.55, 0.6], [0.58, 0.95], [0.6, 0.4], [0.68, 0.03], [0.85, 0.15], [0.98, 0.6], [1.02, 0.95], [0.98, 0.8], [1.12, 0.72], [1.3, 0.75]],
  x: [[0, 0.05], [0.25, 0.6], [0.45, 0.95], [0.55, 0.5], [0.65, 0.05], [0.85, 0.12]],
  y: [[0, 0.05], [0.12, 0.55], [0.18, 0.95], [0.15, 0.4], [0.2, 0.05], [0.4, 0.0], [0.6, 0.4], [0.68, 0.95], [0.66, 0.2], [0.62, -0.6], [0.5, -1.1], [0.3, -1.15], [0.25, -0.9], [0.45, -0.5], [0.8, -0.05], [1.05, 0.15]],
  z: [[0, 0.05], [0.3, 0.75], [0.45, 0.95], [0.75, 0.95], [0.4, 0.3], [0.15, 0.05], [0.5, 0.15], [0.7, -0.3], [0.55, -1.0], [0.35, -1.05], [0.45, -0.6], [0.8, -0.1], [1.0, 0.12]],
};
// the lifted strokes, put on once the word is written: [from, to] in the letter's own units
const LIFT = {
  i: [[[0.44, 1.38], [0.47, 1.44]]],
  j: [[[0.46, 1.38], [0.49, 1.44]]],
  t: [[[0.08, 1.06], [0.68, 1.12]]],
  x: [[[0.78, 0.92], [0.3, 0.06]]],
};
// between two words the line doesn't lift: it dips under the baseline, loops there like an
// underline's flourish (so it can never be read as a letter), and runs on into the next word
const SPACE = [[0.3, -0.02], [0.8, -0.3], [1.1, -0.62], [0.95, -0.86], [0.74, -0.7], [0.9, -0.36], [1.4, -0.1], [2.0, 0.0], [2.35, 0.05]];
const TRACK = 0.16; // a little air between letters, as a loose hand leaves (write() can tighten it)

// centripetal Catmull-Rom: smooth through every point, without the overshoot that makes loops kink
function curve(P, per = 10) {
  const out = [];
  const d = (a, b) => Math.max(1e-4, Math.sqrt(Math.hypot(b[0] - a[0], b[1] - a[1])));
  for (let i = 0; i < P.length - 1; i++) {
    const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
    const t1 = d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    for (let s = 0; s < per; s++) {
      const t = t1 + ((t2 - t1) * s) / per;
      const lerp = (a, b, ta, tb) => [((tb - t) * a[0] + (t - ta) * b[0]) / (tb - ta), ((tb - t) * a[1] + (t - ta) * b[1]) / (tb - ta)];
      const A1 = lerp(p0, p1, 0, t1), A2 = lerp(p1, p2, t1, t2), A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, 0, t2), B2 = lerp(A2, A3, t1, t3);
      out.push(lerp(B1, B2, t1, t2));
    }
  }
  out.push(P[P.length - 1]);
  return out;
}

// the pen's points for a run of text, in units, from x = 0; with the lifted strokes alongside.
// loops < 1 shortens the ascenders and descenders, for a more practised, compact hand.
function pen(text, track = TRACK, loops = 1) {
  const pts = [], lifts = [];
  const tall = (v) => (v > 1 ? 1 + (v - 1) * loops : v < 0 ? v * loops : v);
  let x = 0;
  for (const ch of text.toLowerCase()) {
    const g = G[ch];
    const src = g || (ch === ' ' ? SPACE : null);
    if (!src) continue;
    // a joined letter takes its stroke straight from the last one's exit, without its own entry
    src.forEach(([u, v], i) => { if (!(pts.length && i === 0)) pts.push([x + u, g ? tall(v) : v]); });
    (LIFT[ch] || []).forEach(([a, b]) => lifts.push([[x + a[0], tall(a[1])], [x + b[0], tall(b[1])]]));
    x += src[src.length - 1][0] + (g ? track : 0);
  }
  return { pts, lifts, width: x };
}

// Write text as one line. lines: an array of runs, each on its own line, joined by a return stroke
// that swoops back under the line before. Returns the path in px (y down, baseline of the first
// line at y = 0, the first letter starting at x = 0), its arc lengths for riding, and the lifts.
// The ends, each optional:
// - flourish, an entry loop that sweeps in from below and circles high before the first letter;
// - swash, an underline that runs back under the whole name, loops, and sweeps off to the right;
// - flick, the short, sure stroke a practised signature ends on: down from the last letter and
//   back under the end of the name, where the pen lifts.
// track and loops tighten the hand (see pen()).
export function write(lines, { xh = 60, slant = 0.3, leadIn = 2.4, leadOut = 3.2, gap = 3.6, flourish = false, swash = false, flick = false, track = TRACK, loops = 1 } = {}) {
  const runs = (Array.isArray(lines) ? lines : [lines]).map((t) => pen(t, track, loops));
  const P = [], lifts = [];
  if (flourish) P.push([-leadIn - 0.8, -0.85], [-leadIn * 0.6, -0.35], [-1.15, 0.85], [-1.05, 1.75], [-1.6, 1.95], [-1.85, 1.35], [-1.1, 0.5], [-0.35, 0.03]);
  // or a plain lead-in stroke from the left, rising into the first letter
  else P.push([-leadIn, -0.4], [-leadIn * 0.5, -0.24], [-0.3, -0.04]);
  runs.forEach((r, n) => {
    // each point is [u, v, line]: v is measured from its own line's baseline, so the slant leans
    // each line on its own and never shifts a lower line to the left
    const y0 = -n * gap; // in units, y up: each line sits lower
    if (n > 0) {
      // the return: down from the end of the line before, back under it, and up into this one
      const prev = runs[n - 1].width, yp = y0 + gap;
      P.push([prev + 0.5, -0.15, yp], [prev * 0.6, -1.6 * loops, yp], [prev * 0.2, -2.1 * loops, yp], [-0.5, 0.4, y0], [-0.15, -0.02, y0]);
    }
    r.pts.forEach(([u, v]) => P.push([u, v, y0]));
    r.lifts.forEach(([a, b]) => lifts.push([[a[0], a[1], y0], [b[0], b[1], y0]]));
  });
  const last = runs[runs.length - 1].width, yl = -(runs.length - 1) * gap;
  if (flick) {
    P.push([last + 0.32, -0.22, yl], [last + 0.2, -0.92, yl], [last * 0.8, -1.32, yl], [last * 0.52, -1.38, yl], [last * 0.3, -1.3, yl]);
  } else if (swash) {
    // down past the tails, back under the whole line, a loop at its start, then away to the right
    P.push([last + 0.55, -0.3, yl], [last + 0.95, -1.05, yl], [last * 0.62, -1.72, yl], [0.6, -1.86, yl], [-0.5, -1.58, yl],
      [-0.42, -1.08, yl], [0.05, -1.2, yl], [last * 0.45, -2.02, yl], [last + 1.4, -1.92, yl], [last + leadOut + 1.2, -1.5, yl]);
  } else {
    // a lead-out tail, running on past the last letter
    P.push([last + 0.6, 0.32, yl], [last + leadOut * 0.5, 0.42, yl], [last + leadOut, -0.1, yl]);
  }
  // into px: slanted within the line, scaled, y down
  const toPx = ([u, v, line = 0]) => [(u + v * slant) * xh, -(v + line) * xh];
  const sm = curve(P.map(toPx), 12);
  const N = sm.length - 1, pts = new Float32Array((N + 1) * 2), len = new Float32Array(N + 1);
  let d = '';
  sm.forEach(([x, y], i) => {
    pts[i * 2] = x; pts[i * 2 + 1] = y;
    if (i) len[i] = len[i - 1] + Math.hypot(x - sm[i - 1][0], y - sm[i - 1][1]);
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
  });
  const liftD = lifts.map(([a, b]) => { const [ax, ay] = toPx(a), [bx, by] = toPx(b); return `M${ax.toFixed(1)} ${ay.toFixed(1)}L${bx.toFixed(1)} ${by.toFixed(1)}`; });
  const widest = Math.max(...runs.map((r) => r.width));
  return { pts, len, total: len[N], N, d, lifts: liftD, width: widest * xh, lines: runs.length };
}

// the width of a run in units, to size the writing to the room it has
export const unitsOf = (text, track = TRACK) => pen(text, track).width;

// a point on the written line, by arc length
export function at(g, s) {
  let lo = 0, hi = g.N;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (g.len[m] < s) lo = m; else hi = m; }
  const f = (s - g.len[lo]) / (g.len[hi] - g.len[lo] || 1);
  return [g.pts[lo * 2] + (g.pts[hi * 2] - g.pts[lo * 2]) * f, g.pts[lo * 2 + 1] + (g.pts[hi * 2 + 1] - g.pts[lo * 2 + 1]) * f];
}

// The ink, as a stylus lays it: the line as a filled shape whose width breathes along it. It is
// thin where the pen lands and lifts, and a little heavier on the down-strokes, where a hand slows.
// Returns a path to fill; its draw-on is done with a mask that follows the centre line.
export function inkOutline(g, { width = 3, land = 46, lift = 80 } = {}) {
  const { pts, len, N } = g, T = len[N];
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const a = Math.max(0, i - 1), b = Math.min(N, i + 1);
    let tx = pts[b * 2] - pts[a * 2], ty = pts[b * 2 + 1] - pts[a * 2 + 1];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl; ty /= tl;
    const s = len[i];
    let w = width * (0.9 + 0.22 * Math.max(0, ty)); // heavier going down the page
    w *= Math.min(1, 0.3 + 0.7 * (s / land)) * Math.min(1, 0.18 + 0.82 * ((T - s) / lift));
    const nx = -ty * w / 2, ny = tx * w / 2, x = pts[i * 2], y = pts[i * 2 + 1];
    L.push(`${(x + nx).toFixed(1)} ${(y + ny).toFixed(1)}`);
    R.push(`${(x - nx).toFixed(1)} ${(y - ny).toFixed(1)}`);
  }
  return `M${L.join('L')}L${R.reverse().join('L')}Z`;
}
