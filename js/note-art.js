// The Metamorph note: a fictional banknote, drawn in code. It is ours, not an imitation of any
// real currency: no portrait, no state emblem, no real denomination. Front, back, the watermark
// that only light shows, and the baize the note lies on.
//
// The art is drawn at 2048 x 870 (the note is 2.4 x 1.02 in the scene). It can be printed for a
// filmed version later: export the two canvases at this size.
import { pattern } from './cocoon.js';

export const ART_W = 2048, ART_H = 870;
const TAU = Math.PI * 2;
const PAPER = '#e7e8e0'; // (cool security paper, as the site's; the lamp warms it)
const INK = '#1c392f';
const INK2 = '#45594f';
const RUST = '#8a2e1f';
const SERIF = '"Ibarra Real Nova", Georgia, serif';
const SANS = '"Open Sauce One", system-ui, sans-serif';
const MONO = '"Fragment Mono", ui-monospace, monospace';

const rng = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const canvas = (w = ART_W, h = ART_H) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

// The serial number is the visit: today's date, then how many times this browser has come.
export function visitSerial() {
  let n = 1;
  try {
    n = Number(localStorage.getItem('mc-visits') || 0) + 1;
    localStorage.setItem('mc-visits', String(n));
  } catch (e) { /* private window: every visit is the first */ }
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, '0'), mm = String(d.getMonth() + 1).padStart(2, '0'), yy = String(d.getFullYear()).slice(2);
  return `MC ${dd}${mm}${yy} ${String(n).padStart(6, '0')}`;
}

function paper(x, seed, tint) {
  x.fillStyle = PAPER;
  x.fillRect(0, 0, ART_W, ART_H);
  const g = x.createRadialGradient(ART_W * 0.5, ART_H * 0.45, 60, ART_W * 0.5, ART_H * 0.5, ART_W * 0.62);
  g.addColorStop(0, 'rgba(252, 253, 250, 0.35)');
  g.addColorStop(1, tint);
  x.fillStyle = g;
  x.fillRect(0, 0, ART_W, ART_H);
  // security fibres: mostly grey-green, a few blue and red
  const r = rng(seed);
  for (let i = 0; i < 700; i++) {
    const kind = i % 23 === 0 ? 'rgba(60, 90, 160, 0.5)' : i % 31 === 0 ? 'rgba(160, 60, 50, 0.45)' : `rgba(100, 112, 102, ${0.08 + r() * 0.16})`;
    x.strokeStyle = kind;
    x.lineWidth = 0.8 + r() * 0.8;
    const px = r() * ART_W, py = r() * ART_H, len = 6 + r() * 16, a = r() * TAU;
    x.beginPath();
    x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(a + 0.6) * len * 0.5, py + Math.sin(a + 0.6) * len * 0.5, px + Math.cos(a) * len, py + Math.sin(a) * len);
    x.stroke();
  }
}

// fine horizontal guilloche waves, the under-print of every note
function waves(x, col, lines, amp, wl, y0, y1, phase = 0) {
  x.strokeStyle = col;
  x.lineWidth = 1.1;
  for (let k = 0; k < lines; k++) {
    const yb = y0 + ((y1 - y0) * k) / (lines - 1);
    x.beginPath();
    for (let px = 0; px <= ART_W; px += 5) {
      const y = yb + amp * Math.sin(px / wl + k * 0.35 + phase) + amp * 0.45 * Math.sin(px / (wl * 0.43) + k * 0.9);
      if (px === 0) x.moveTo(px, y); else x.lineTo(px, y);
    }
    x.stroke();
  }
}

const ROSETTE = [
  { s0: 0.10, s1: 0.24, kind: 'rose', n: 10, m: 5 },
  { s0: 0.27, s1: 0.43, kind: 'loop', n: 22, m: 2 },
  { s0: 0.46, s1: 0.64, kind: 'rose', n: 22, m: 6 },
  { s0: 0.67, s1: 0.82, kind: 'beat', n: 30, m: 4 },
  { s0: 0.85, s1: 1.0, kind: 'rose', n: 40, m: 5 },
];
function rosette(x, cx, cy, R, col, bands = ROSETTE, lw = 1.05) {
  x.strokeStyle = col;
  x.lineWidth = lw;
  bands.forEach((B) => {
    const N = Math.round(B.n * B.m * 16);
    x.beginPath();
    for (let i = 0; i <= N; i++) {
      const phi = (i / N) * B.m * TAU;
      const [s, d] = pattern(B, phi);
      const th = phi + d;
      const px = cx + Math.cos(th) * s * R, py = cy - Math.sin(th) * s * R;
      if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
    }
    x.stroke();
  });
}

// the watermark window is left unprinted, so light can come through it cleanly
function windowClear(x, cx, cy, rx, ry) {
  x.save();
  x.translate(cx, cy);
  x.scale(1, ry / rx);
  const g = x.createRadialGradient(0, 0, rx * 0.7, 0, 0, rx);
  g.addColorStop(0, PAPER);
  g.addColorStop(1, 'rgba(235, 229, 210, 0)');
  x.fillStyle = g;
  x.beginPath(); x.arc(0, 0, rx, 0, TAU); x.fill();
  x.restore();
}

function frame(x) {
  x.strokeStyle = INK2;
  x.lineWidth = 1.6;
  x.strokeRect(28, 28, ART_W - 56, ART_H - 56);
  x.lineWidth = 0.8;
  x.strokeRect(40, 40, ART_W - 80, ART_H - 80);
}

// serial numbers grow digit by digit, as on Indian notes
function serial(x, str, px, py, align = 'left') {
  const chars = [...str];
  const sizes = chars.map((_, i) => 24 + (i / (chars.length - 1)) * 16);
  let total = 0;
  chars.forEach((c, i) => { x.font = `${sizes[i]}px ${MONO}`; total += x.measureText(c).width; });
  let cx = align === 'right' ? px - total : px;
  x.fillStyle = RUST;
  x.textBaseline = 'alphabetic';
  chars.forEach((c, i) => { x.font = `${sizes[i]}px ${MONO}`; x.fillText(c, cx, py); cx += x.measureText(c).width; });
}

function microprint(x, text, px, py, w) {
  x.save();
  x.font = `12px ${MONO}`;
  x.fillStyle = INK2;
  const unit = text + ' · ';
  const uw = x.measureText(unit).width;
  for (let cx = px; cx < px + w - uw; cx += uw) x.fillText(unit, cx, py);
  x.restore();
}

function signature(x, sx, sy, w, seed) {
  const r = rng(seed);
  x.save();
  x.strokeStyle = INK;
  x.lineWidth = 2.4;
  x.lineCap = 'round';
  x.beginPath();
  let px = sx, py = sy;
  x.moveTo(px, py);
  const n = 7;
  for (let i = 0; i < n; i++) {
    const nx = sx + (w * (i + 1)) / n, ny = sy + (r() - 0.5) * 34;
    x.bezierCurveTo(px + (r() * 0.9 * w) / n, py - 28 - r() * 40, nx - (r() * 0.6 * w) / n, ny + 22 + r() * 30, nx, ny);
    px = nx; py = ny;
  }
  x.stroke();
  x.beginPath();
  x.moveTo(sx - 12, sy + 36);
  x.quadraticCurveTo(sx + w * 0.5, sy + 52 + r() * 10, sx + w + 18, sy + 24);
  x.stroke();
  x.restore();
}

function wrap(x, text, maxW) {
  const words = text.split(' '), lines = [];
  let line = '';
  words.forEach((w) => {
    const t = line ? `${line} ${w}` : w;
    if (x.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t;
  });
  if (line) lines.push(line);
  return lines;
}

const WM = { x: 330, y: 435, rx: 200, ry: 255 };  // watermark window, front coordinates
const THREAD_X = 1146;                             // the security thread, front coordinates
const MICRO = 'economics · history · psychology · law · sociology · geography · philosophy · mathematics · engineering · design · weather · metamorph · mother map';

export function drawFront(serialNo) {
  const c = canvas();
  const x = c.getContext('2d');
  paper(x, 7, 'rgba(120, 140, 120, 0.10)');
  waves(x, 'rgba(70, 120, 105, 0.16)', 36, 9, 38, 60, ART_H - 60);
  frame(x);
  windowClear(x, WM.x, WM.y, WM.rx, WM.ry);
  rosette(x, 800, 435, 300, 'rgba(28, 57, 47, 0.82)');
  rosette(x, ART_W - 150, 150, 74, 'rgba(28, 57, 47, 0.7)', ROSETTE.slice(0, 3), 0.9);
  // the windowed thread: it dips in and out of the paper on this side
  for (let y = 46; y < ART_H - 60; y += 72) {
    const g = x.createLinearGradient(THREAD_X - 8, 0, THREAD_X + 8, 0);
    g.addColorStop(0, '#2a3634'); g.addColorStop(0.5, '#6f7d78'); g.addColorStop(1, '#2a3634');
    x.fillStyle = g;
    x.fillRect(THREAD_X - 7, y, 14, 36);
  }
  x.fillStyle = INK;
  x.textBaseline = 'alphabetic';
  x.font = `500 84px ${SERIF}`;
  x.fillText('Metamorph Capital', 1214, 300);
  x.font = `italic 400 40px ${SERIF}`;
  x.fillStyle = INK2;
  x.fillText('We promise to help the bearer', 1216, 376);
  x.fillText('become something more.', 1216, 426);
  signature(x, 1232, 610, 250, 3);
  signature(x, 1600, 604, 250, 11);
  x.font = `22px ${SANS}`;
  x.fillStyle = INK2;
  x.fillText('Founder', 1232, 702);
  x.fillText('Founder', 1600, 702);
  serial(x, serialNo, 92, 112);
  serial(x, serialNo, ART_W - 92, 800, 'right');
  microprint(x, MICRO, 60, 822, ART_W - 120);
  return c;
}

export function drawBack(serialNo) {
  const c = canvas();
  const x = c.getContext('2d');
  paper(x, 19, 'rgba(150, 120, 70, 0.10)');
  waves(x, 'rgba(150, 118, 60, 0.15)', 36, 9, 44, 60, ART_H - 60, 1.3);
  frame(x);
  // the same window, seen from behind
  windowClear(x, ART_W - WM.x, WM.y, WM.rx, WM.ry);
  x.fillStyle = INK;
  x.textBaseline = 'alphabetic';
  x.font = `500 66px ${SERIF}`;
  x.fillText('What this note can become', 110, 168);
  const panels = [
    ['01', 'Fundraising and investor readiness', 'Narrative, pitch deck, model, data room.'],
    ['02', 'Strategic consulting', 'Product-market fit, runway, team, governance.'],
    ['03', 'Financial services', 'MIS, unit economics, cash flow, working capital.'],
    ['04', 'Wealth management', 'Private portfolios for family offices.'],
  ];
  panels.forEach(([n, name, line], i) => {
    const px = 110 + (i % 2) * 690, py = 220 + Math.floor(i / 2) * 290, pw = 650, ph = 262;
    x.strokeStyle = INK2;
    x.lineWidth = 1;
    x.strokeRect(px, py, pw, ph);
    rosette(x, px + pw - 70, py + 70, 46, 'rgba(28, 57, 47, 0.55)', ROSETTE.slice(0, 2), 0.8);
    x.fillStyle = RUST;
    x.font = `24px ${MONO}`;
    x.fillText(n, px + 30, py + 52);
    x.fillStyle = INK;
    x.font = `500 42px ${SERIF}`;
    wrap(x, name, pw - 150).forEach((l, k) => x.fillText(l, px + 30, py + 112 + k * 48));
    x.fillStyle = INK2;
    x.font = `24px ${SANS}`;
    x.fillText(line, px + 30, py + ph - 32);
  });
  serial(x, serialNo, ART_W - 92, 800, 'right');
  microprint(x, MICRO, 60, 822, ART_W - 120);
  return c;
}

// The watermark, in front coordinates. Red is the paper's thickness (0.5 is plain paper; lighter
// shows brighter against the light), green is the security thread running through it.
export function drawMark() {
  const W = 1024, H = 435, s = 0.5;
  const c = canvas(W, H);
  const x = c.getContext('2d');
  x.fillStyle = 'rgb(128, 0, 0)';
  x.fillRect(0, 0, W, H);
  const m = canvas(W, H);
  const y = m.getContext('2d');
  const R = (v) => `rgb(${v}, 0, 0)`;
  const cx = WM.x * s, cy = WM.y * s, k = 0.62;
  y.fillStyle = 'rgb(128, 0, 0)';
  y.fillRect(0, 0, W, H);
  // a moth: the one thing in the note that was always going to change form
  [-1, 1].forEach((side) => {
    y.fillStyle = R(196);
    y.beginPath(); y.ellipse(cx + side * 62 * k, cy - 30 * k, 80 * k, 54 * k, side * -0.45, 0, TAU); y.fill();
    y.fillStyle = R(182);
    y.beginPath(); y.ellipse(cx + side * 48 * k, cy + 42 * k, 52 * k, 42 * k, side * 0.55, 0, TAU); y.fill();
    y.strokeStyle = R(92);
    y.lineWidth = 5 * k;
    y.beginPath(); y.arc(cx + side * 72 * k, cy - 34 * k, 16 * k, 0, TAU); y.stroke();
    y.lineWidth = 2.6 * k;
    for (let v = 0; v < 5; v++) {
      const a = -1.1 + v * 0.42;
      y.beginPath();
      y.moveTo(cx, cy);
      y.quadraticCurveTo(cx + side * 60 * k, cy + Math.sin(a) * 40 * k, cx + side * Math.cos(a) * 130 * k, cy + Math.sin(a) * 78 * k);
      y.stroke();
    }
  });
  y.fillStyle = R(64);
  y.beginPath(); y.ellipse(cx, cy + 4 * k, 10 * k, 64 * k, 0, 0, TAU); y.fill();
  y.strokeStyle = R(76);
  y.lineWidth = 3 * k;
  [-1, 1].forEach((side) => { y.beginPath(); y.moveTo(cx, cy - 58 * k); y.quadraticCurveTo(cx + side * 18 * k, cy - 110 * k, cx + side * 44 * k, cy - 120 * k); y.stroke(); });
  x.filter = 'blur(5px)';
  x.drawImage(m, 0, 0);
  x.filter = 'none';
  x.globalCompositeOperation = 'lighter';
  x.fillStyle = 'rgb(0, 255, 0)';
  x.fillRect(THREAD_X * s - 4, 0, 8, H);
  x.globalCompositeOperation = 'source-over';
  return c;
}

// (the first desk was green baize; the services' desk is the site's night blue: `base` is the cloth,
// `fleck` and `hair` the rgb of its lighter fibres)
export function drawBaize(base = '#223529', fleck = '120, 160, 135', hair = '150, 180, 160') {
  const N = 512;
  const c = canvas(N, N);
  const x = c.getContext('2d');
  x.fillStyle = base;
  x.fillRect(0, 0, N, N);
  const r = rng(5);
  for (let i = 0; i < 14000; i++) {
    const light = r() > 0.5;
    x.fillStyle = light ? `rgba(${fleck}, ${0.03 + r() * 0.05})` : `rgba(0, 0, 0, ${0.06 + r() * 0.1})`;
    const px = r() * N, py = r() * N, sz = 0.6 + r() * 1.4;
    x.fillRect(px, py, sz, sz);
  }
  for (let i = 0; i < 260; i++) {
    x.strokeStyle = `rgba(${hair}, ${0.03 + r() * 0.05})`;
    x.lineWidth = 0.6;
    const px = r() * N, py = r() * N, a = r() * TAU, len = 3 + r() * 7;
    x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); x.stroke();
  }
  return c;
}
