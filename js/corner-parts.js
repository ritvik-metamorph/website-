// Parts for the Creative Corner (js/corner.js).
//
// - portrait(): a placeholder portrait for each artist in js/artists.js, until real photos arrive.
// - ratioOf(), workArt(): each piece of work, drawn as what it is (a sleeve, a jacket, a still, a
//   pot), in the shape its kind has, until real stills arrive.
// - wire(): the loop wire, the user's own idea, from before the handwriting carried it. A prolate
//   trochoid, a line that keeps doubling back on itself as it goes. at() finds a point by arc
//   length, so things can ride it. Kept, unused.

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
export function rng(a) {
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}


// ------------------------------------------------------------------ placeholder pictures
// Flat portraits, drawn once and kept. A real photo in js/artists.js replaces them.

const SKIN = ['#6f4129', '#80502f', '#93603d', '#a46d47', '#b47c55', '#c48d66'];
const HAIR = ['#120d0a', '#1b130e', '#251912', '#2f1f15'];
const BACK = ['#ffd9b8', '#c9f0dc', '#fff0b3', '#e3d6ff', '#d4e9ff', '#ffd1df', '#d4f3f6', '#f3e2cf'];
const SHIRT = ['#14213d', '#f4f4ef', '#c2410c', '#0f766e', '#6d28d9', '#be185d', '#ca8a04', '#334155', '#1d4ed8'];
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16), f = (v) => Math.round(clamp(v * (1 + k), 0, 255));
  return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})`;
};
const pics = new Map();

export function portrait(a) {
  if (a.photo) return a.photo;
  if (pics.has(a.slug)) return pics.get(a.slug);
  const S = 240, c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d'), r = rng(hash(a.slug));
  const pick = (arr) => arr[Math.floor(r() * arr.length)];
  const bg = pick(BACK), skin = pick(SKIN), shirt = pick(SHIRT), hair = pick(HAIR), style = Math.floor(r() * 5);
  x.fillStyle = bg;
  x.fillRect(0, 0, S, S);
  const hx = S / 2 + (r() - 0.5) * 10, hy = S * 0.42, rx = S * 0.152, ry = S * 0.188;
  // long hair falls behind the shoulders
  x.fillStyle = hair;
  if (style === 1 || style === 4) {
    x.beginPath();
    x.ellipse(hx, hy + ry * (style === 1 ? 0.8 : 0.32), rx * 1.34, ry * (style === 1 ? 1.6 : 1.18), 0, 0, TAU);
    x.fill();
  }
  // shoulders
  const sw = S * (0.36 + r() * 0.07), top = S * 0.77;
  x.fillStyle = shirt;
  x.beginPath();
  x.moveTo(hx - sw, S + 4);
  x.bezierCurveTo(hx - sw, top + 8, hx - sw * 0.6, top - 14, hx - S * 0.075, top - 18);
  x.lineTo(hx + S * 0.075, top - 18);
  x.bezierCurveTo(hx + sw * 0.6, top - 14, hx + sw, top + 8, hx + sw, S + 4);
  x.closePath();
  x.fill();
  // neck, and the open collar
  x.fillStyle = shade(skin, -0.14);
  x.fillRect(hx - S * 0.056, hy + ry * 0.55, S * 0.112, top - hy - ry * 0.55);
  x.beginPath();
  x.moveTo(hx - S * 0.075, top - 19); x.lineTo(hx, top + S * 0.075); x.lineTo(hx + S * 0.075, top - 19);
  x.closePath();
  x.fill();
  // head, and ears where the hair leaves them
  x.fillStyle = skin;
  if (style !== 1 && style !== 4) {
    x.beginPath(); x.ellipse(hx - rx * 0.98, hy + ry * 0.08, rx * 0.17, ry * 0.2, 0, 0, TAU); x.fill();
    x.beginPath(); x.ellipse(hx + rx * 0.98, hy + ry * 0.08, rx * 0.17, ry * 0.2, 0, 0, TAU); x.fill();
  }
  x.beginPath(); x.ellipse(hx, hy, rx, ry, 0, 0, TAU); x.fill();
  // hair on top, with a side parting
  x.fillStyle = hair;
  x.save();
  x.beginPath(); x.ellipse(hx, hy - ry * 0.02, rx * 1.09, ry * 1.07, 0, 0, TAU); x.clip();
  const side = r() < 0.5 ? -1 : 1, low = style === 3 ? 0.1 : 0.32 + r() * 0.12;
  x.beginPath();
  x.moveTo(hx - rx * 1.3 * side, hy - ry * (low - 0.32));
  x.quadraticCurveTo(hx - rx * 0.15 * side, hy - ry * (low + 0.45), hx + rx * 1.3 * side, hy - ry * low);
  x.lineTo(hx + rx * 1.3 * side, hy - ry * 1.4);
  x.lineTo(hx - rx * 1.3 * side, hy - ry * 1.4);
  x.closePath();
  x.fill();
  x.restore();
  if (style === 2) { x.beginPath(); x.arc(hx + rx * 0.25 * side, hy - ry * 1.02, rx * 0.44, 0, TAU); x.fill(); }
  if (style === 3) {
    for (let k = 0; k <= 9; k++) {
      const t = Math.PI * (1.02 + (k / 9) * 0.96);
      x.beginPath(); x.arc(hx + Math.cos(t) * rx * 1.02, hy + Math.sin(t) * ry * 0.98, rx * 0.34, 0, TAU); x.fill();
    }
  }
  // one soft light from the upper left, as from a window
  const g = x.createRadialGradient(S * 0.28, S * 0.2, 0, S * 0.28, S * 0.2, S * 0.95);
  g.addColorStop(0, 'rgba(255,255,255,.2)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g;
  x.fillRect(0, 0, S, S);
  const url = c.toDataURL('image/png');
  pics.set(a.slug, url);
  return url;
}

// ------------------------------------------------------------------ placeholder work
// Each piece is drawn as what it is: a record sleeve, a book jacket, a poster, a film still, a
// photograph, a comic page, a pot, a length of cloth. Its shape comes from its kind, in the shapes
// work is actually posted in: 4:5 for most, 16:9 for what is watched or wide, 9:16 for an edit made
// for a phone. Everything is drawn in fractions of the canvas, so a piece
// drawn large for its own view is the same piece as on the wall. A real still in js/artists.js
// (image, and its ratio, width over height) replaces it.

const PAL = [ // ground, ink, accent, pale
  ['#d94f30', '#1c1a1f', '#f2c14e', '#f6e9dc'], ['#1f3d7a', '#f1e6d2', '#e3a33b', '#0f1d3d'],
  ['#0f5e52', '#f3dfc1', '#e86f4a', '#083a33'], ['#f0c6c3', '#2a2350', '#c9442f', '#fbe9e4'],
  ['#e6b23a', '#231f20', '#2f5fa7', '#f6e3a7'], ['#2b2730', '#ece4d6', '#d6623b', '#45404c'],
  ['#b9d4cf', '#1e3b3a', '#e07a5f', '#e7f0ed'], ['#5b3c8c', '#f4dcc9', '#f0b23e', '#2e1f4d'],
  ['#c2d3ea', '#14274e', '#e4572e', '#eef3fa'], ['#7a2e2a', '#f1dcc3', '#d9a441', '#4a1916'],
];
const SERIF = "'Cormorant', Georgia, serif";
const SANS = "'Open Sauce One', 'Helvetica Neue', Arial, sans-serif";
const MONO = "'Fragment Mono', ui-monospace, monospace";

// what a piece is drawn as, and its shape
function formOf(a, i) {
  const w = a.works[i], k = w.kind.toLowerCase(), h = hash(`${a.slug}:${i}`);
  switch (a.art) {
    case 'music': return ['sleeve', 4 / 5];
    case 'film': return ['still', 16 / 9];
    case 'editing': return ['still', 9 / 16];
    case 'animation': return /loop/.test(k) ? ['loop', 4 / 5] : ['frames', 16 / 9];
    case 'graphic':
      if (k === 'identity' || k === 'packaging') return ['mark', 4 / 5];
      if (/typeface|lettering|research/.test(k)) return ['specimen', 16 / 9];
      if (/book|covers/.test(k)) return ['book', 4 / 5];
      return ['poster', 4 / 5];
    case 'photography': return /book|zine/.test(k) ? ['book', 4 / 5] : ['photo', h % 3 ? 16 / 9 : 4 / 5];
    case 'illustration': return /comic|zine/.test(k) ? ['page', 4 / 5] : /book/.test(k) ? ['book', 4 / 5] : ['illus', 4 / 5];
    case 'writing': return ['book', 4 / 5];
    case 'craft':
      if (a.kind === 'Ceramics') return k === 'tableware' ? ['plates', 4 / 5] : ['pot', 4 / 5];
      if (a.kind === 'Textiles') return k === 'samples' ? ['swatches', 4 / 5] : ['cloth', 4 / 5];
      return k === 'exhibition' ? ['room', 16 / 9] : ['chair', 4 / 5];
  }
  return ['illus', 4 / 5];
}
export const ratioOf = (a, i) => a.works[i].ratio || (a.works[i].image ? 4 / 5 : formOf(a, i)[1]);

// type set on the canvas, wrapped to a width; answers the height it took
function words(x, s, maxW) {
  const out = [];
  let line = '';
  for (const w of s.split(' ')) {
    const t = line ? `${line} ${w}` : w;
    if (line && x.measureText(t).width > maxW) { out.push(line); line = w; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
function print(x, s, X, Y, { size, font = SANS, weight = 400, style = '', color, maxW = 1e9, lh = 1.08, align = 'left' }) {
  x.font = `${style} ${weight} ${size}px ${font}`;
  x.fillStyle = color;
  x.textAlign = align;
  x.textBaseline = 'alphabetic';
  const L = words(x, s, maxW);
  L.forEach((l, k) => x.fillText(l, X, Y + k * size * lh));
  return L.length * size * lh;
}
// the largest size at which a line fits a width
function fit(x, s, font, weight, maxW, max) {
  x.font = `${weight} 100px ${font}`;
  return Math.min(max, (100 * maxW) / x.measureText(s).width);
}
const disc = (x, cx, cy, rr, col) => { x.fillStyle = col; x.beginPath(); x.arc(cx, cy, rr, 0, TAU); x.fill(); };
const rect = (x, X, Y, w, h, col) => { x.fillStyle = col; x.fillRect(X, Y, w, h); };
// film grain, last of all, so it never changes what was drawn before it at another size
function grain(x, W, H, r, amount) {
  const n = Math.round((W * H) / 260), s = Math.max(1, W / 420);
  for (let k = 0; k < n; k++) {
    x.fillStyle = r() < 0.5 ? `rgba(0,0,0,${(amount * r()).toFixed(3)})` : `rgba(255,255,255,${(amount * r()).toFixed(3)})`;
    x.fillRect(r() * W, r() * H, s, s);
  }
}
// a figure seen against the light: a head and the line of the shoulders
function figure(x, cx, base, h, col) {
  x.fillStyle = col;
  x.beginPath(); x.arc(cx, base - h * 0.84, h * 0.13, 0, TAU); x.fill();
  x.beginPath();
  x.moveTo(cx - h * 0.2, base);
  x.bezierCurveTo(cx - h * 0.21, base - h * 0.5, cx - h * 0.14, base - h * 0.66, cx, base - h * 0.67);
  x.bezierCurveTo(cx + h * 0.14, base - h * 0.66, cx + h * 0.21, base - h * 0.5, cx + h * 0.2, base);
  x.closePath(); x.fill();
}

const DRAW = {
  // a record sleeve: one big shape, the title and the name in the corner
  sleeve(x, W, H, r, [g, ink, acc, pale], w, a, k) {
    const v = k % 4;
    rect(x, 0, 0, W, H, v === 1 ? pale : g);
    let tc = pale;
    if (v === 0) { disc(x, W * (0.5 + r() * 0.2), H * 0.42, W * 0.3, acc); rect(x, 0, H * 0.62, W, H * 0.004, ink); }
    else if (v === 1) {
      // a waveform
      const n = 46, p = r() * 9;
      for (let k = 0; k < n; k++) {
        const t = k / (n - 1), hh = H * (0.05 + 0.24 * Math.abs(Math.sin(t * 7 + p) * Math.sin(t * 2.3 + p * 0.5)));
        rect(x, W * (0.1 + t * 0.8), H * 0.47 - hh / 2, W * 0.008, hh, k % 9 === 4 ? acc : ink);
      }
      tc = ink;
    } else if (v === 2) {
      // a blind of light, thinner as it falls
      let y = H * 0.4;
      for (let k = 0; y < H; k++) { const t = H * (0.07 - k * 0.006); rect(x, 0, y, W, Math.max(H * 0.008, t * 0.6), k % 2 ? acc : ink); y += Math.max(H * 0.02, t); }
      tc = pale;
    } else {
      disc(x, W * 0.36, H * 0.44, W * 0.22, acc);
      x.save(); x.beginPath(); x.rect(W * 0.5, 0, W, H); x.clip(); disc(x, W * 0.5, H * 0.44, W * 0.22, pale); x.restore();
    }
    const top = v === 1 || v === 3;
    print(x, w.title, W * 0.07, top ? H * 0.13 : H * 0.84, { size: W * 0.06, weight: 600, color: tc, maxW: W * 0.8 });
    print(x, a.name, W * 0.07, top ? H * 0.13 + W * 0.07 * (w.title.length > 22 ? 2 : 1) : H * 0.92, { size: W * 0.035, color: tc });
  },
  // a book jacket, its spine's hinge down the left
  book(x, W, H, r, [g, ink, acc, pale], w, a, k) {
    const v = k % 3;
    rect(x, 0, 0, W, H, g);
    if (v === 0) {
      disc(x, W * 0.5, H * 0.68, W * 0.22, acc);
      rect(x, W * 0.2, H * 0.68, W * 0.6, H * 0.004, ink);
    } else if (v === 1) {
      rect(x, 0, H * 0.4, W, H * 0.26, acc);
    } else {
      // a row of arches, doorways in a wall
      for (let k = 0; k < 4; k++) {
        const ax = W * (0.14 + k * 0.2), aw = W * 0.12;
        x.fillStyle = k % 2 ? pale : acc;
        x.beginPath(); x.moveTo(ax, H * 0.9); x.lineTo(ax, H * 0.66); x.arc(ax + aw / 2, H * 0.66, aw / 2, Math.PI, 0); x.lineTo(ax + aw, H * 0.9); x.fill();
      }
    }
    const tc = v === 1 ? ink : pale;
    print(x, a.name, W * 0.12, H * 0.11, { size: W * 0.048, color: pale, weight: 500 });
    print(x, w.title, W * 0.12, v === 1 ? H * 0.5 : H * 0.24, { size: W * (w.title.length > 14 ? 0.11 : 0.135), font: SERIF, style: 'italic', color: tc, maxW: W * 0.78, lh: 1 });
    rect(x, 0, 0, W * 0.035, H, 'rgba(0,0,0,.18)');
    rect(x, W * 0.035, 0, W * 0.004, H, 'rgba(255,255,255,.18)');
  },
  // a poster: the words as big as they will go, a shape behind them
  poster(x, W, H, r, [g, ink, acc, pale], w, a, k) {
    const v = k % 2;
    rect(x, 0, 0, W, H, pale);
    if (v === 0) disc(x, W * 0.62, H * 0.38, W * 0.42, acc);
    else { x.save(); x.translate(W / 2, H / 2); x.rotate(-0.42); rect(x, -W, -H * 0.11, W * 2, H * 0.22, acc); x.restore(); }
    const parts = w.title.split(' ');
    let y = H * 0.16;
    parts.forEach((p) => {
      const s = fit(x, p, SANS, 700, W * 0.84, H * 0.3);
      y += s * 0.82;
      print(x, p, W * 0.08, y, { size: s, weight: 700, color: ink });
    });
    print(x, `${w.year}`, W * 0.08, H * 0.93, { size: W * 0.04, font: MONO, color: ink });
    print(x, w.kind, W * 0.92, H * 0.93, { size: W * 0.04, color: ink, align: 'right' });
  },
  // a still from a film, framed wide, with its bars
  still(x, W, H, r, [g, ink, acc, pale], w, a, k) {
    const v = w.kind === 'Grade' ? 4 : w.kind === 'Title sequence' ? 7 : k % 8, top = H * 0.128, bot = H - top;
    x.save(); x.beginPath(); x.rect(0, top, W, bot - top); x.clip();
    if (v === 0) {
      // a low sun over water, and a boat on the line
      rect(x, 0, 0, W, H * 0.58, pale);
      const sx = W * (0.3 + r() * 0.4);
      disc(x, sx, H * 0.54, H * 0.09, acc);
      rect(x, 0, H * 0.58, W, H, g);
      for (let q = 0; q < 6; q++) rect(x, sx - W * (0.06 - q * 0.006), H * (0.62 + q * 0.04), W * (0.12 - q * 0.012), H * 0.008, acc);
      const bx = W * (r() < 0.5 ? 0.2 : 0.68);
      rect(x, bx, H * 0.545, W * 0.12, H * 0.035, ink); rect(x, bx + W * 0.03, H * 0.515, W * 0.05, H * 0.032, ink);
    } else if (v === 1) {
      // a window, and someone in front of it
      rect(x, 0, 0, W, H, '#1b1c22');
      const wx = W * (0.38 + r() * 0.2);
      rect(x, wx, H * 0.26, W * 0.22, H * 0.46, pale);
      rect(x, wx + W * 0.106, H * 0.26, W * 0.008, H * 0.46, '#1b1c22'); rect(x, wx, H * 0.48, W * 0.22, H * 0.012, '#1b1c22');
      x.fillStyle = 'rgba(255,255,255,.07)';
      x.beginPath(); x.moveTo(wx, H * 0.72); x.lineTo(wx + W * 0.22, H * 0.72); x.lineTo(wx + W * 0.38, H); x.lineTo(wx - W * 0.1, H); x.fill();
      figure(x, wx + W * 0.04, H * 0.9, H * 0.62, '#0d0d10');
    } else if (v === 2) {
      // a street at night, its windows lit
      rect(x, 0, 0, W, H, '#0f1320');
      for (let b = 0; b < 6; b++) {
        const bx = W * (b / 6), bh = H * (0.35 + r() * 0.3);
        rect(x, bx, H - bh, W / 6 - 2, bh, b % 2 ? '#1a2033' : '#161b2b');
        for (let q = 0; q < 9; q++) if (r() < 0.55) rect(x, bx + W * (0.02 + (q % 3) * 0.045), H - bh + H * (0.05 + Math.floor(q / 3) * 0.09), W * 0.025, H * 0.045, r() < 0.7 ? acc : pale);
      }
      const lx = W * 0.8;
      rect(x, lx, H * 0.3, W * 0.006, H * 0.6, '#05070c');
      for (let q = 5; q > 0; q--) disc(x, lx, H * 0.3, H * 0.03 * q, `rgba(255,214,150,${(0.05 * (6 - q)).toFixed(2)})`);
    } else if (v === 3) {
      // washing lines across a sky
      rect(x, 0, 0, W, H, g);
      for (let l = 0; l < 3; l++) {
        const y0 = H * (0.25 + l * 0.2), sag = H * 0.06;
        x.strokeStyle = 'rgba(0,0,0,.5)'; x.lineWidth = Math.max(1, W * 0.002);
        x.beginPath(); x.moveTo(-10, y0); x.quadraticCurveTo(W / 2, y0 + sag * 2, W + 10, y0); x.stroke();
        for (let q = 0; q < 7; q++) {
          const t = (q + 0.5 + (r() - 0.5) * 0.4) / 7, cx = t * W, cy = y0 + sag * 4 * t * (1 - t);
          rect(x, cx - W * 0.025, cy, W * (0.04 + r() * 0.025), H * (0.08 + r() * 0.06), [pale, acc, ink, '#f4f4ef'][Math.floor(r() * 4)]);
        }
      }
    } else if (v === 4) {
      // a grade: the same shot before and after, split down the middle
      rect(x, 0, 0, W, H * 0.6, pale);
      disc(x, W * 0.66, H * 0.5, H * 0.12, acc);
      x.fillStyle = g; x.beginPath(); x.moveTo(0, H);
      for (let s = 0; s <= 12; s++) x.lineTo((W * s) / 12, H * 0.58 + Math.sin(s * 0.9 + r() * 2) * H * 0.04);
      x.lineTo(W, H); x.fill();
      figure(x, W * 0.3, H * 0.86, H * 0.4, ink);
      const sx = Math.round(W * 0.5), im = x.getImageData(0, 0, sx, H), d = im.data;
      for (let q = 0; q < d.length; q += 4) { const l = d[q] * 0.3 + d[q + 1] * 0.59 + d[q + 2] * 0.11; d[q] = d[q + 1] = d[q + 2] = l * 0.92 + 12; }
      x.putImageData(im, 0, 0);
      rect(x, sx - Math.max(1, W * 0.0015), 0, Math.max(2, W * 0.003), H, '#f6f2ea');
      disc(x, sx, H * 0.5, W * 0.014, '#f6f2ea');
    } else if (v === 5) {
      // a close-up in profile, a rim of light along it
      rect(x, 0, 0, W, H, g);
      const face = (dx, col) => {
        x.fillStyle = col; x.beginPath();
        const fx = W * 0.56 + dx, fy = H * 0.14;
        x.moveTo(fx - W * 0.2, H);
        x.lineTo(fx - W * 0.2, fy + H * 0.2);
        x.bezierCurveTo(fx - W * 0.2, fy - H * 0.06, fx + W * 0.02, fy - H * 0.08, fx + W * 0.05, fy + H * 0.16);
        x.lineTo(fx + W * 0.09, fy + H * 0.34);
        x.lineTo(fx + W * 0.055, fy + H * 0.37);
        x.lineTo(fx + W * 0.065, fy + H * 0.43);
        x.lineTo(fx + W * 0.05, fy + H * 0.47);
        x.quadraticCurveTo(fx + W * 0.06, fy + H * 0.58, fx + W * 0.0, fy + H * 0.6);
        x.lineTo(fx - W * 0.03, fy + H * 0.7);
        x.lineTo(fx - W * 0.03, H);
        x.fill();
      };
      face(W * 0.006, acc);
      face(0, '#0d0d10');
    } else if (v === 6) {
      // a road running away to the horizon
      rect(x, 0, 0, W, H * 0.56, pale);
      disc(x, W * 0.5, H * 0.56, H * 0.1, acc);
      rect(x, 0, H * 0.56, W, H, g);
      x.fillStyle = ink; x.beginPath(); x.moveTo(W * 0.49, H * 0.56); x.lineTo(W * 0.51, H * 0.56); x.lineTo(W * 0.85, H); x.lineTo(W * 0.15, H); x.fill();
      for (let q = 0; q < 6; q++) { const t = q / 6, t2 = (q + 0.45) / 6, y1 = H * (0.57 + 0.43 * t * t), y2 = H * (0.57 + 0.43 * t2 * t2); x.fillStyle = pale; x.fillRect(W * 0.5 - W * 0.002 * (1 + t * 4), y1, W * 0.004 * (1 + t * 4), y2 - y1); }
    } else {
      // a title card
      rect(x, 0, 0, W, H, '#0c0c0e');
      print(x, w.title, W / 2, H * 0.52, { size: H * 0.11, font: SERIF, style: 'italic', color: '#f1ece2', align: 'center', maxW: W * 0.7 });
      print(x, `a film by ${a.name}`, W / 2, H * 0.64, { size: H * 0.035, color: 'rgba(241,236,226,.6)', align: 'center' });
    }
    x.restore();
    rect(x, 0, 0, W, top, '#0b0b0c'); rect(x, 0, bot, W, top, '#0b0b0c');
    grain(x, W, H, r, 0.08);
  },
  // a photograph, in black and white
  photo(x, W, H, r, pal, w, a, k) {
    const t = r() < 0.5 ? [8, 6, 2] : [0, 2, 6]; // a little warm, or a little cool
    const grey = (v) => `rgb(${clamp(v + t[0], 0, 255)},${clamp(v + t[1], 0, 255)},${clamp(v + t[2], 0, 255)})`;
    const v = k % 6;
    if (v === 0) {
      // a doorway, someone inside it, the light on the floor
      rect(x, 0, 0, W, H, grey(120));
      const dx = W * (0.35 + r() * 0.15), dw = W * 0.22, dt = H * 0.3;
      x.fillStyle = grey(22); x.beginPath(); x.moveTo(dx, H * 0.78); x.lineTo(dx, dt); x.arc(dx + dw / 2, dt, dw / 2, Math.PI, 0); x.lineTo(dx + dw, H * 0.78); x.fill();
      rect(x, 0, H * 0.78, W, H, grey(70));
      x.fillStyle = grey(200); x.beginPath(); x.moveTo(dx, H * 0.78); x.lineTo(dx + dw, H * 0.78); x.lineTo(dx + dw * 1.9, H); x.lineTo(dx - dw * 0.5, H); x.fill();
      figure(x, dx + dw * 0.55, H * 0.78, H * 0.36, grey(8));
    } else if (v === 1) {
      // steps going down, light and shadow
      rect(x, 0, 0, W, H, grey(60));
      for (let k = 0; k < 14; k++) {
        const y = H * (0.08 + k * 0.064), inset = W * k * 0.022;
        rect(x, inset, y, W - inset * 2, H * 0.034, grey(210 - k * 8));
        rect(x, inset, y + H * 0.034, W - inset * 2, H * 0.03, grey(40 + k * 3));
      }
      figure(x, W * (0.3 + r() * 0.4), H * 0.62, H * 0.12, grey(10));
    } else if (v === 2) {
      // out of a train window
      rect(x, 0, 0, W, H, grey(30));
      x.fillStyle = grey(225); x.beginPath(); x.roundRect(W * 0.12, H * 0.16, W * 0.76, H * 0.56, W * 0.05); x.fill();
      x.save(); x.clip();
      rect(x, 0, H * 0.5, W, H, grey(150));
      for (let k = 0; k < 9; k++) rect(x, W * (0.1 + k * 0.1), H * (0.42 - r() * 0.08), W * 0.012, H * 0.2, grey(90));
      x.restore();
      figure(x, W * 0.2, H * 1.02, H * 0.56, grey(6));
    } else if (v === 3) {
      // a portrait against the light
      rect(x, 0, 0, W, H, grey(222));
      rect(x, 0, H * 0.7, W, H, grey(180));
      figure(x, W * (0.45 + r() * 0.1), H * 1.04, H * 0.82, grey(26));
    } else if (v === 4) {
      // a shopkeeper behind the counter, the shelves full behind them
      rect(x, 0, 0, W, H, grey(48));
      for (let s = 0; s < 4; s++) {
        rect(x, W * 0.06, H * (0.12 + s * 0.13), W * 0.88, H * 0.012, grey(150));
        for (let j = 0; j < 9; j++) if (r() < 0.8) rect(x, W * (0.08 + j * 0.097), H * (0.12 + s * 0.13) - H * (0.05 + r() * 0.04), W * 0.06, H * (0.05 + r() * 0.03), grey(90 + Math.floor(r() * 110)));
      }
      figure(x, W * (0.4 + r() * 0.2), H * 0.78, H * 0.42, grey(14));
      rect(x, 0, H * 0.7, W, H, grey(205));
      rect(x, 0, H * 0.7, W, H * 0.02, grey(240));
    } else {
      // a road climbing a hill in switchbacks, cloud lying below
      rect(x, 0, 0, W, H, grey(200));
      x.fillStyle = grey(70); x.beginPath(); x.moveTo(0, H); x.lineTo(0, H * 0.3); x.quadraticCurveTo(W * 0.5, H * 0.08, W, H * 0.34); x.lineTo(W, H); x.fill();
      x.strokeStyle = grey(225); x.lineWidth = Math.max(1.5, W * 0.012); x.lineJoin = 'round';
      x.beginPath(); x.moveTo(W * 0.3, H);
      for (let s = 0; s < 6; s++) x.lineTo(W * (s % 2 ? 0.28 : 0.72), H * (0.9 - s * 0.11));
      x.stroke();
      for (let s = 0; s < 3; s++) rect(x, 0, H * (0.72 + s * 0.08), W, H * 0.05, `rgba(235,235,232,${(0.55 - s * 0.12).toFixed(2)})`);
    }
    grain(x, W, H, r, 0.16);
  },
  // a comic page: panels, a speech bubble, the odd patch of dots
  page(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, '#f7f5ef');
    const m = W * 0.06, gut = W * 0.025, lw = Math.max(1.5, W * 0.008);
    const rows = [0.34, 0.3, 0.36].map((f) => f * (H - 2 * m - 2 * gut));
    let y = m;
    rows.forEach((rh, ri) => {
      const split = r() < 0.6 ? [0.42 + r() * 0.16] : [];
      const cols = split.length ? [split[0], 1 - split[0]] : [1];
      let px = m;
      cols.forEach((f, ci) => {
        const pw = f * (W - 2 * m - (cols.length - 1) * gut);
        const fill = [pale, g, '#ffffff', acc][(ri + ci + Math.floor(r() * 2)) % 4];
        rect(x, px, y, pw, rh, fill);
        x.save(); x.beginPath(); x.rect(px, y, pw, rh); x.clip();
        const what = Math.floor(r() * 3);
        if (what === 0) { disc(x, px + pw * 0.7, y + rh * 0.35, rh * 0.18, ink); rect(x, px, y + rh * 0.75, pw, rh, ink); }
        else if (what === 1) { for (let k = 0; k < 60; k++) disc(x, px + (k % 10 + 0.5) * pw / 10, y + (Math.floor(k / 10) + 0.5) * rh / 6, rh * 0.025, 'rgba(0,0,0,.22)'); figure(x, px + pw * 0.4, y + rh, rh * 0.8, ink); }
        else figure(x, px + pw * 0.3, y + rh, rh * 0.7, ink);
        x.restore();
        if (r() < 0.6) {
          // the bubble, and the lines of what they say
          const bx = px + pw * 0.62, by = y + rh * 0.26, bw = Math.min(pw * 0.32, W * 0.18), bh = rh * 0.24;
          x.fillStyle = '#fff'; x.strokeStyle = '#141414'; x.lineWidth = lw * 0.6;
          x.beginPath(); x.ellipse(bx, by, bw / 2, bh / 2, 0, 0, TAU); x.fill(); x.stroke();
          for (let k = 0; k < 2; k++) rect(x, bx - bw * 0.28, by - bh * 0.12 + k * bh * 0.22, bw * (0.56 - k * 0.16), lw * 0.7, '#555');
        }
        x.strokeStyle = '#141414'; x.lineWidth = lw; x.strokeRect(px, y, pw, rh);
        px += pw + gut;
      });
      y += rh + gut;
    });
  },
  // an illustration: flat shapes, a few colours
  illus(x, W, H, r, [g, ink, acc, pale], w, a, k) {
    const v = k % 3;
    rect(x, 0, 0, W, H, pale);
    if (v === 0) {
      // hills under a big sun
      disc(x, W * (0.3 + r() * 0.4), H * 0.32, W * 0.2, acc);
      [[0.58, g], [0.7, ink], [0.84, g]].forEach(([yy, col], k) => {
        x.fillStyle = col; x.beginPath(); x.moveTo(0, H);
        for (let s = 0; s <= 20; s++) x.lineTo((W * s) / 20, H * yy + Math.sin(s * 0.6 + k * 2 + r()) * H * 0.04);
        x.lineTo(W, H); x.fill();
      });
    } else if (v === 1) {
      // a row of shop shutters, some up
      rect(x, 0, 0, W, H * 0.16, g);
      for (let k = 0; k < 3; k++) {
        const sx = W * (0.06 + k * 0.31), sw = W * 0.27, up = r() * 0.6;
        rect(x, sx, H * 0.2, sw, H * 0.7, ink);
        rect(x, sx, H * 0.2, sw, H * 0.7 * (1 - up), [acc, g, '#c9c2b6'][k]);
        for (let l = 0; l < 18; l++) rect(x, sx, H * 0.2 + l * H * 0.7 * (1 - up) / 18, sw, Math.max(1, H * 0.003), 'rgba(0,0,0,.25)');
      }
      rect(x, 0, H * 0.9, W, H, g);
    } else {
      // a still life: a bowl, fruit, a cloth
      rect(x, 0, H * 0.62, W, H, g);
      x.fillStyle = ink; x.beginPath(); x.ellipse(W * 0.5, H * 0.62, W * 0.3, H * 0.13, 0, 0, Math.PI); x.fill();
      [[0.36, 0.53, acc], [0.5, 0.5, pale], [0.63, 0.54, acc]].forEach(([fx, fy, col]) => disc(x, W * fx, H * fy, W * 0.085, col));
      rect(x, W * 0.08, H * 0.8, W * 0.36, H * 0.12, acc);
    }
  },
  // a pot on a table, against a wall
  pot(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, pale);
    rect(x, 0, H * 0.74, W, H, g);
    x.fillStyle = 'rgba(0,0,0,.16)'; x.beginPath(); x.ellipse(W * 0.56, H * 0.75, W * 0.3, H * 0.025, 0, 0, TAU); x.fill();
    const cx = W * 0.5, base = H * 0.75, hgt = H * (0.44 + r() * 0.12), bw = W * (0.2 + r() * 0.08), nw = W * (0.07 + r() * 0.04);
    const body = () => {
      x.beginPath();
      x.moveTo(cx - nw, base - hgt);
      x.bezierCurveTo(cx - nw * 0.9, base - hgt * 0.72, cx - bw * 1.25, base - hgt * 0.62, cx - bw, base - hgt * 0.25);
      x.quadraticCurveTo(cx - bw * 0.7, base, cx - bw * 0.45, base);
      x.lineTo(cx + bw * 0.45, base);
      x.quadraticCurveTo(cx + bw * 0.7, base, cx + bw, base - hgt * 0.25);
      x.bezierCurveTo(cx + bw * 1.25, base - hgt * 0.62, cx + nw * 0.9, base - hgt * 0.72, cx + nw, base - hgt);
      x.closePath();
    };
    x.fillStyle = ink; body(); x.fill();
    x.save(); body(); x.clip();
    rect(x, 0, base - hgt * (0.62 + r() * 0.1), W, hgt * 0.07, acc);
    rect(x, cx + bw * 0.35, base - hgt, bw, hgt, 'rgba(0,0,0,.18)'); // its shadow side
    x.restore();
    rect(x, cx - nw * 1.15, base - hgt - H * 0.012, nw * 2.3, H * 0.02, ink);
  },
  // plates and bowls from above
  plates(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, g);
    [[0.36, 0.38, 0.27], [0.72, 0.66, 0.2], [0.3, 0.8, 0.13]].forEach(([px, py, pr], k) => {
      disc(x, W * px + W * 0.012, H * py + W * 0.016, W * pr, 'rgba(0,0,0,.2)');
      disc(x, W * px, H * py, W * pr, pale);
      disc(x, W * px, H * py, W * pr * 0.72, k === 1 ? acc : '#ffffff');
      x.strokeStyle = ink; x.lineWidth = Math.max(1, W * 0.006);
      x.beginPath(); x.arc(W * px, H * py, W * pr * 0.86, 0, TAU); x.stroke();
    });
  },
  // a length of woven cloth: bands, diamonds, a border
  cloth(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, g);
    let y = 0;
    while (y < H) {
      const bh = H * (0.04 + r() * 0.1), k = Math.floor(r() * 4), col = [acc, pale, ink, g][k];
      rect(x, 0, y, W, bh, col);
      if (bh > H * 0.07) {
        // a row of diamonds, their edges stepped as a loom steps them
        const n = 7, dw = W / n, on = col === pale ? ink : pale;
        for (let d = 0; d < n; d++) {
          x.fillStyle = on;
          x.beginPath(); x.moveTo(d * dw + dw / 2, y + bh * 0.15); x.lineTo(d * dw + dw * 0.85, y + bh / 2); x.lineTo(d * dw + dw / 2, y + bh * 0.85); x.lineTo(d * dw + dw * 0.15, y + bh / 2); x.fill();
        }
      }
      y += bh;
    }
    rect(x, 0, 0, W * 0.07, H, ink); rect(x, W * 0.93, 0, W * 0.07, H, ink);
    for (let k = 0; k < 40; k++) rect(x, W * 0.02, (k * H) / 40, W * 0.03, H / 80, acc);
  },
  // swatches pinned in a grid
  swatches(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, '#ecebe6');
    const s = W * 0.26, gap = W * 0.06;
    for (let k = 0; k < 9; k++) {
      const sx = gap + (k % 3) * (s + gap), sy = gap + Math.floor(k / 3) * (s + gap), col = [g, acc, ink, pale][k % 4];
      rect(x, sx + W * 0.008, sy + W * 0.01, s, s, 'rgba(0,0,0,.12)');
      rect(x, sx, sy, s, s, col);
      const on = col === pale ? ink : pale;
      if (k % 3 === 0) for (let l = 0; l < 6; l++) rect(x, sx, sy + l * s / 6, s, s / 24, on);
      else if (k % 3 === 1) for (let l = 0; l < 9; l++) disc(x, sx + (l % 3 + 0.5) * s / 3, sy + (Math.floor(l / 3) + 0.5) * s / 3, s * 0.06, on);
      else { x.fillStyle = on; x.beginPath(); x.moveTo(sx + s / 2, sy + s * 0.18); x.lineTo(sx + s * 0.82, sy + s / 2); x.lineTo(sx + s / 2, sy + s * 0.82); x.lineTo(sx + s * 0.18, sy + s / 2); x.fill(); }
    }
  },
  // a chair, drawn as a joiner draws it: straight lines
  chair(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, pale);
    rect(x, 0, H * 0.78, W, H, g);
    const cx = W * 0.5, wood = acc, t = W * 0.035;
    x.fillStyle = 'rgba(0,0,0,.15)'; x.beginPath(); x.ellipse(cx + W * 0.06, H * 0.8, W * 0.28, H * 0.02, 0, 0, TAU); x.fill();
    rect(x, cx - W * 0.2, H * 0.24, t, H * 0.56, wood); // back legs, rising into the back
    rect(x, cx + W * 0.13, H * 0.24, t, H * 0.56, wood);
    for (let k = 0; k < 4; k++) rect(x, cx - W * 0.2, H * (0.26 + k * 0.07), W * 0.365, H * 0.022, wood);
    rect(x, cx - W * 0.25, H * 0.53, W * 0.47, H * 0.045, ink); // the seat
    rect(x, cx - W * 0.25, H * 0.575, t, H * 0.23, wood);
    rect(x, cx + W * 0.19, H * 0.575, t, H * 0.23, wood);
    rect(x, cx - W * 0.2, H * 0.7, W * 0.4, H * 0.014, wood);
  },
  // a room with work in it
  room(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, '#e9e7e1');
    rect(x, 0, H * 0.72, W, H, '#b9b2a6');
    for (let k = 0; k < 3; k++) {
      const px = W * (0.18 + k * 0.3);
      rect(x, px - W * 0.07, H * 0.48, W * 0.14, H * 0.24, '#f7f6f2');
      rect(x, px - W * 0.07, H * 0.48, W * 0.14, H * 0.012, 'rgba(0,0,0,.08)');
      rect(x, px - W * 0.045, H * 0.3, W * 0.012, H * 0.18, acc); rect(x, px + W * 0.033, H * 0.3, W * 0.012, H * 0.18, acc);
      rect(x, px - W * 0.05, H * 0.38, W * 0.1, H * 0.02, ink);
    }
    rect(x, W * 0.08, H * 0.12, W * 0.18, H * 0.12, g);
  },
  // an animation loop: one ball, every frame of its bounce at once
  loop(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, g);
    const floor = H * 0.76;
    rect(x, W * 0.08, floor, W * 0.84, Math.max(1, H * 0.006), pale);
    const n = 12;
    for (let k = 0; k < n; k++) {
      const t = k / (n - 1), px = W * (0.14 + t * 0.72), bounce = Math.abs(Math.cos(t * Math.PI * 1.5));
      const py = floor - W * 0.06 - bounce * H * 0.48, sq = bounce < 0.12 ? 1.35 : 1;
      x.fillStyle = k === n - 1 ? acc : `rgba(255,255,255,${(0.1 + t * 0.3).toFixed(2)})`;
      x.beginPath(); x.ellipse(px, py + (sq > 1 ? W * 0.015 : 0), W * 0.06 * sq, W * 0.06 / sq, 0, 0, TAU); x.fill();
    }
    print(x, '12 fps', W * 0.08, H * 0.92, { size: W * 0.035, font: MONO, color: pale });
  },
  // a frame from an animated short, the character drawn with its last few frames behind it
  frames(x, W, H, r, [g, ink, acc, pale]) {
    rect(x, 0, 0, W, H, pale);
    x.fillStyle = g; x.beginPath(); x.moveTo(0, H);
    for (let s = 0; s <= 16; s++) x.lineTo((W * s) / 16, H * 0.66 + Math.sin(s * 0.7 + r() * 2) * H * 0.03);
    x.lineTo(W, H); x.fill();
    disc(x, W * 0.82, H * 0.22, H * 0.09, acc);
    for (let k = 0; k < 4; k++) {
      const px = W * (0.24 + k * 0.1), a = k === 3 ? 1 : 0.15 + k * 0.12;
      x.globalAlpha = a;
      x.fillStyle = ink; x.beginPath(); x.roundRect(px - W * 0.03, H * 0.42, W * 0.06, H * 0.22, W * 0.03); x.fill();
      disc(x, px, H * 0.36, W * 0.032, ink);
      x.globalAlpha = 1;
    }
  },
  // a type specimen: the face large, its alphabet small
  specimen(x, W, H, r, [g, ink, acc, pale], w) {
    const dark = r() < 0.5, bg = dark ? '#141416' : pale;
    const fg = dark ? '#f6f2ea' : '#141416';
    rect(x, 0, 0, W, H, bg);
    const serif = r() < 0.5, face = serif ? SERIF : SANS, weight = serif ? 400 : 600;
    print(x, w.kind === 'Research' ? 'Ka' : 'Aa', W * 0.06, H * 0.72, { size: H * 0.6, font: face, weight, color: fg });
    print(x, w.title, W * 0.56, H * 0.2, { size: W * 0.04, weight: 500, color: fg, maxW: W * 0.38 });
    ['abcdefghijklm', 'nopqrstuvwxyz', '0123456789'].forEach((l, k) => print(x, l, W * 0.56, H * (0.42 + k * 0.1), { size: W * 0.036, font: face, weight, color: fg }));
    rect(x, W * 0.56, H * 0.78, W * 0.06, W * 0.06, acc);
  },
  // an identity: the mark, and a card with it
  mark(x, W, H, r, [g, ink, acc, pale], w, a, k) {
    rect(x, 0, 0, W, H, g);
    const cx = W * 0.5, cy = H * 0.42, R = W * 0.17, v = k % 3;
    if (v === 0) { disc(x, cx, cy, R, pale); x.save(); x.beginPath(); x.rect(cx, cy - R, R, R * 2); x.clip(); disc(x, cx, cy, R, acc); x.restore(); }
    else if (v === 1) { rect(x, cx - R, cy - R, R * 2, R * 2, pale); disc(x, cx, cy, R * 0.6, g); }
    else { disc(x, cx, cy, R, pale); print(x, w.title[0], cx, cy + R * 0.42, { size: R * 1.25, font: SERIF, color: g, align: 'center' }); }
    print(x, w.title, cx, H * 0.75, { size: W * 0.05, weight: 600, color: pale, align: 'center' });
    x.save(); x.translate(W * 0.78, H * 0.9); x.rotate(-0.12);
    rect(x, -W * 0.15, -W * 0.09, W * 0.3, W * 0.18, pale);
    disc(x, -W * 0.09, -W * 0.03, W * 0.025, g);
    x.restore();
  },
};

// the piece, drawn at a width, as a picture's address; a real still is used as it is
const drawn = new Map();
export function workArt(a, i, width = 540) {
  const w = a.works[i];
  if (w.image) return Promise.resolve(w.image);
  const key = `${a.slug}:${i}:${width}`;
  if (drawn.has(key)) return drawn.get(key);
  const job = (document.fonts?.ready || Promise.resolve()).then(() => new Promise((done) => {
    const [form, ratio] = formOf(a, i), c = document.createElement('canvas');
    c.width = width; c.height = Math.round(width / ratio);
    const x = c.getContext('2d'), r = rng(hash(`${a.slug}:${i}`));
    // one artist's pieces in turn take the next scene and the next palette, so none are alike
    const k = hash(a.slug) + i, pal = PAL[(hash(a.slug) * 7 + i * 3) % PAL.length];
    DRAW[form](x, c.width, c.height, r, pal, w, a, k);
    c.toBlob((b) => done(b ? URL.createObjectURL(b) : c.toDataURL('image/jpeg', 0.86)), 'image/jpeg', 0.86);
  }));
  drawn.set(key, job);
  return job;
}

// ------------------------------------------------------------------ the wire
// A prolate trochoid: a line that keeps looping back on itself as it goes, with loops that grow
// and shrink along the way. Each seed gives its own.

export function wire(seed, W, H, narrow, { k, b, rise = 0.3 } = {}) {
  const r = rng(hash(seed));
  const loops = k ?? (narrow ? 1.9 + r() * 0.6 : 3 + r() * 0.8);
  const A = narrow ? [-0.3 * W, H * (0.6 + r() * 0.06)] : [-0.1 * W, H * (0.72 + r() * 0.05)];
  const B = narrow ? [1.3 * W, H * (0.62 - rise * 0.5 + r() * 0.06)] : [1.1 * W, H * (0.74 - rise - r() * 0.08)];
  const dx = B[0] - A[0], dy = B[1] - A[1], L = Math.hypot(dx, dy);
  const u = [dx / L, dy / L], n = [u[1], -u[0]];
  const b0 = b ?? (narrow ? H * 0.12 : H * 0.19);
  const p1 = r() * TAU, p2 = r() * TAU, p3 = r() * TAU;
  const bMin = (L / (TAU * loops)) * 1.4; // below this a loop pinches into a cusp
  const N = 900, pts = new Float32Array((N + 1) * 2), len = new Float32Array(N + 1);
  for (let i = 0; i <= N; i++) {
    const t = i / N, th = TAU * loops * t + p1;
    // the loops grow and shrink, but stay loops: a path that keeps doubling back
    const bb = Math.max(bMin, b0 * (0.62 + 0.52 * (0.5 + 0.5 * Math.sin(TAU * 0.85 * t + p2))));
    const along = L * t - bb * Math.sin(th);
    const across = bb * Math.cos(th) + H * 0.035 * Math.sin(TAU * 0.7 * t + p3);
    pts[i * 2] = A[0] + u[0] * along + n[0] * across;
    pts[i * 2 + 1] = A[1] + u[1] * along + n[1] * across;
    if (i) len[i] = len[i - 1] + Math.hypot(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]);
  }
  let d = '';
  for (let i = 0; i <= N; i++) d += (i ? 'L' : 'M') + pts[i * 2].toFixed(1) + ' ' + pts[i * 2 + 1].toFixed(1);
  return { pts, len, total: len[N], d, N };
}
export function at(g, s) {
  let lo = 0, hi = g.N;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (g.len[m] < s) lo = m; else hi = m; }
  const f = (s - g.len[lo]) / (g.len[hi] - g.len[lo] || 1);
  return [g.pts[lo * 2] + (g.pts[hi * 2] - g.pts[lo * 2]) * f, g.pts[lo * 2 + 1] + (g.pts[hi * 2 + 1] - g.pts[lo * 2 + 1]) * f];
}
