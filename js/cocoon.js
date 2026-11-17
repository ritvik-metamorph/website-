// The cocoon: one continuous thread wound into seven guilloche bands, the way a banknote's
// rosettes are engraved. Every line is a screen-space quad, so the hairlines stay crisp at any
// size and Ink and Light are one shader with one value between them (uLight).
//
// Model space: the cocoon is 2 units tall (y from -1 to 1). Bands are written in polar form,
// (s, θ) on a unit circle, and mapped to the oval in the shader, so each band can drift on its
// own and the opening can split the halves without rebuilding anything.
import * as THREE from '../assets/vendor/three.module.min.js';

export const RX = 0.62;      // width of the oval as a share of its height
export const EGG = 0.07;     // a little narrower at the top, like a cocoon hanging from its thread
export const HANG_S = 1.064; // where the hanging thread meets the cocoon
const RING = [1.012, 1.052]; // the microprint ring, just outside the outer band
const TAU = Math.PI * 2;

// Seven bands, inner to outer. Each is one stretch of the same thread: n lobes per turn, m turns.
// n has 1/m added, so every turn lands a little further round than the last and the turns
// interleave into a woven band instead of retracing one line. The seven is the chakra structure
// from the brief, kept as structure only: no names, no colours.
// Lobe counts grow with the radius so every band's waves have about the same shape (a wavelength
// of two to three amplitudes); denser than that and a band reads as a dark coil, not engraving.
export const BANDS = [
  { s0: 0.150, s1: 0.240, kind: 'rose', n: 9, m: 6 },
  { s0: 0.253, s1: 0.348, kind: 'loop', n: 22, m: 2 },
  { s0: 0.361, s1: 0.480, kind: 'rose', n: 15, m: 7 },  // printed in colour-shifting ink
  { s0: 0.493, s1: 0.606, kind: 'beat', n: 19, m: 5 },
  { s0: 0.619, s1: 0.736, kind: 'loop', n: 40, m: 2 },
  { s0: 0.749, s1: 0.866, kind: 'rose', n: 28, m: 6 },
  { s0: 0.879, s1: 0.988, kind: 'beat', n: 34, m: 5 },
];
const OVI_BAND = 2;

// Kinds of line, shared with the shaders.
const K_THREAD = 0, K_HANG = 1, K_HIDDEN = 2, K_DISC = 3, K_SEAM = 4;

export function oval(s, th) {
  const y = s * Math.sin(th);
  return [s * Math.cos(th) * RX * (1 - EGG * y), y];
}

// One band's thread at turn-angle phi: [s, extra angle]. Also used for the team's rosettes.
export function pattern(B, phi) {
  const mid = (B.s0 + B.s1) / 2;
  const amp = ((B.s1 - B.s0) / 2) * 0.94;
  const k = B.n + 1 / B.m;
  // each turn swings a little wider than the last, then narrower again, so the turns nest inside
  // each other (the lens shapes of real guilloche) instead of all piling up on the band's edges
  const sw = Math.sin(phi / (2 * B.m));
  const a = amp * (0.38 + 0.62 * sw * sw);
  if (B.kind === 'rose') return [mid + a * Math.sin(k * phi), 0];
  if (B.kind === 'beat') return [mid + a * (0.62 * Math.sin(k * phi) + 0.38 * Math.sin(2 * k * phi + 1.1)), 0];
  // loop: a small circle rolling round the band (an epitrochoid), the classic banknote border
  const w = (k - 1) * phi;
  const rad = mid + amp * Math.cos(w);
  const tan = amp * Math.sin(w);
  return [Math.hypot(rad, tan), Math.atan2(tan, rad)];
}

const zOf = (band) => (band < 0 ? 0.14 : (6 - band) * 0.02);

// The whole thread as points, in drawing order: the hang from above the screen, down the seam
// to the core, a small knot, then outward band by band. Then the hidden spokes, which are not
// part of the thread (they are the pattern printed only for the light).
function buildThread(q) {
  const S = [], T = [], Z = [], B = [], K = [], R = [];
  const add = (s, th, z, band, kind, run) => { S.push(s); T.push(th); Z.push(z); B.push(band); K.push(kind); R.push(run); };

  // the hang: s here is a parameter, 1 at the top of the screen, 0 at the cocoon
  const HN = 30;
  for (let i = 0; i <= HN; i++) add(1 - i / HN, 0, 0, -1, K_HANG, 0);
  // the seam: straight down the middle to the core, under the weave
  const SN = 90;
  for (let i = 0; i <= SN; i++) add(HANG_S * (1 - i / SN), Math.PI / 2, -0.01, -1, K_SEAM, 1);
  // the knot
  let th = Math.PI / 2;
  const turns = 9, KN = Math.round(turns * 90 * q);
  for (let i = 0; i <= KN; i++) {
    const u = i / KN, phi = u * turns * TAU;
    add(0.12 * Math.sqrt(u), th + phi, zOf(-1), -1, K_THREAD, 2);
  }
  th += turns * TAU;
  const knotEnd = S.length - 1;

  const bandStart = [];
  BANDS.forEach((band, b) => {
    const [s0, d0] = pattern(band, 0);
    const lastS = S[S.length - 1], lastTh = T[T.length - 1];
    const th0 = th + Math.PI * 0.55;
    // a short ramp carries the thread out to the next band
    const RN = 48;
    for (let i = 1; i <= RN; i++) {
      const u = i / RN, e = u * u * (3 - 2 * u);
      add(lastS + (s0 - lastS) * e, lastTh + (th0 + d0 - lastTh) * u, zOf(b - 1 + u), b - 1 + u, K_THREAD, 2);
    }
    bandStart[b] = S.length;
    const per = band.kind === 'rose' ? 18 : band.kind === 'beat' ? 26 : 26;
    const N = Math.round(band.n * band.m * per * q);
    for (let i = 1; i <= N; i++) {
      const phi = (i / N) * band.m * TAU;
      const [s, d] = pattern(band, phi);
      add(s, th0 + phi + d, zOf(b), b, K_THREAD, 2);
    }
    th = th0 + band.m * TAU;
  });

  // the hidden spokes: fine radial lines through every band, like the aura's rays
  const SP = 132, SPN = 22;
  for (let j = 0; j < SP; j++) {
    const a0 = (j / SP) * TAU + 0.013 * Math.sin(j * 7.3);
    for (let i = 0; i <= SPN; i++) {
      const s = 0.135 + (0.99 - 0.135) * (i / SPN);
      add(s, a0 + 0.42 * s - 0.18 * s * s, 0, -1, K_HIDDEN, 3 + j);
    }
  }

  // t: how far along the thread each point is, by length, 0 to 1. The hang's true length
  // depends on the layout, so it counts as a fixed 0.9.
  const n = S.length;
  const t = new Float32Array(n);
  let L = 0, px = 0, py = 0;
  for (let i = 0; i < n; i++) {
    if (R[i] > 2) { t[i] = -1; continue; }
    const [x, y] = K[i] === K_HANG ? [0, HANG_S + S[i] * 0.9] : oval(S[i], T[i]);
    if (i > 0) L += Math.hypot(x - px, y - py);
    t[i] = L; px = x; py = y;
  }
  for (let i = 0; i < n; i++) if (t[i] >= 0) t[i] /= L;

  // segments join neighbours in the same run; runs meet at shared points, so the thread is whole
  let count = 0;
  for (let i = 0; i < n - 1; i++) if (R[i] === R[i + 1]) count++;
  const aA = new Float32Array(count * 3), aB = new Float32Array(count * 3);
  const aM = new Float32Array(count * 4), aQ = new Float32Array(count * 2);
  let j = 0;
  for (let i = 0; i < n - 1; i++) {
    if (R[i] !== R[i + 1]) continue;
    aA.set([S[i], T[i], Z[i]], j * 3);
    aB.set([S[i + 1], T[i + 1], Z[i + 1]], j * 3);
    aM.set([t[i], t[i + 1], (B[i] + B[i + 1]) / 2, K[i]], j * 4);
    j++;
  }
  return {
    geometry: lineGeometry(count, aA, aB, aM, aQ),
    tKnot: t[knotEnd],
    bandT: bandStart.map((i) => t[i]),
  };
}

function lineGeometry(count, aA, aB, aM, aQ) {
  const g = new THREE.InstancedBufferGeometry();
  // one quad per segment: x runs along it (0 to 1), y across it (-1 to 1)
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0, -1, 0, 0, 1, 0, 1, -1, 0, 1, 1, 0]), 3));
  g.setIndex([0, 2, 1, 1, 2, 3]);
  g.setAttribute('aA', new THREE.InstancedBufferAttribute(aA, 3));
  g.setAttribute('aB', new THREE.InstancedBufferAttribute(aB, 3));
  g.setAttribute('aM', new THREE.InstancedBufferAttribute(aM, 4));
  g.setAttribute('aQ', new THREE.InstancedBufferAttribute(aQ, 2));
  g.instanceCount = count;
  return g;
}

// The discipline threads (Light only): each binds into a band, runs out through the ring and
// curves to a name at the edge of the screen. Points are already in model x, y.
function discGeometry(list) {
  let count = 0;
  list.forEach((d) => (count += d.pts.length - 1));
  const aA = new Float32Array(count * 3), aB = new Float32Array(count * 3);
  const aM = new Float32Array(count * 4), aQ = new Float32Array(count * 2);
  let j = 0;
  list.forEach((d) => {
    const len = [0];
    for (let i = 1; i < d.pts.length; i++) len[i] = len[i - 1] + Math.hypot(d.pts[i][0] - d.pts[i - 1][0], d.pts[i][1] - d.pts[i - 1][1]);
    const L = len[len.length - 1];
    for (let i = 0; i < d.pts.length - 1; i++) {
      aA.set([d.pts[i][0], d.pts[i][1], 0.03], j * 3);
      aB.set([d.pts[i + 1][0], d.pts[i + 1][1], 0.03], j * 3);
      aM.set([len[i] / L, len[i + 1] / L, d.band, K_DISC], j * 4);
      aQ.set([d.index, d.delay], j * 2);
      j++;
    }
  });
  return lineGeometry(count, aA, aB, aM, aQ);
}

// The microprint ring, built as two halves so the opening can pull them apart cleanly.
// u runs clockwise from the top, so the text reads left to right across the top, as on a coin.
function ringGeometry(repeatOut) {
  const N = 720;
  const mid = (RING[0] + RING[1]) / 2;
  const th = (i) => Math.PI / 2 - (i / N) * TAU;
  const len = [0];
  for (let i = 1; i <= N; i++) {
    const [x0, y0] = oval(mid, th(i - 1)), [x1, y1] = oval(mid, th(i));
    len[i] = len[i - 1] + Math.hypot(x1 - x0, y1 - y0);
  }
  const total = len[N];
  // the text tile is 64 times as long as it is tall; fit a whole number of tiles round the ring
  const reps = Math.max(1, Math.round(total / ((RING[1] - RING[0]) * 64)));
  repeatOut.reps = reps;
  const pos = [], uv = [], side = [], idx = [];
  const half = (from, to, sd) => {
    const base = pos.length / 3;
    for (let i = from; i <= to; i++) {
      const [xi, yi] = oval(RING[0], th(i)), [xo, yo] = oval(RING[1], th(i));
      const u = len[i] / total;
      pos.push(xi, yi, 0.02, xo, yo, 0.02);
      uv.push(u, 0, u, 1);
      side.push(sd, sd);
    }
    for (let k = 0; k < to - from; k++) {
      const a = base + k * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  };
  half(0, N / 2, 1);
  half(N / 2, N, -1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aSide', new THREE.Float32BufferAttribute(side, 1));
  g.setIndex(idx);
  return g;
}

// Paper fibres, tileable: mostly grey-green, a few blue, the way security paper is made.
function fibreTexture() {
  const N = 512;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const x = c.getContext('2d');
  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 170; i++) {
    const blue = i % 13 === 0;
    const a = blue ? 0.6 : 0.12 + rnd() * rnd() * 0.5; // mostly faint, a few you'd notice
    x.strokeStyle = blue ? `rgba(70,98,160,${a})` : `rgba(92,108,100,${a})`;
    x.lineWidth = 0.45 + rnd() * 0.45;
    const x0 = rnd() * N, y0 = rnd() * N, len = 4 + rnd() * 11, ang = rnd() * TAU, bend = (rnd() - 0.5) * 0.9;
    const x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len;
    const mx = (x0 + x1) / 2 - Math.sin(ang) * len * bend * 0.5, my = (y0 + y1) / 2 + Math.cos(ang) * len * bend * 0.5;
    for (const ox of [-N, 0, N]) for (const oy of [-N, 0, N]) {
      x.beginPath();
      x.moveTo(x0 + ox, y0 + oy);
      x.quadraticCurveTo(mx + ox, my + oy, x1 + ox, y1 + oy);
      x.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function microprintTexture(words, maxAniso) {
  const W = 4096, H = 64;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  const cycle = words.join('  ·  ') + '  ·  ';
  x.font = '500 38px Inter, system-ui, sans-serif';
  const w = x.measureText(cycle).width;
  const reps = Math.max(1, Math.round(W / w));
  x.fillStyle = '#fff';
  x.textBaseline = 'middle';
  x.save();
  x.scale(W / (reps * w), 1); // exactly whole cycles, so the tile wraps without a seam
  for (let i = 0; i < reps; i++) x.fillText(cycle, i * w, H / 2 + 2);
  x.restore();
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = Math.min(8, maxAniso);
  return t;
}

// ---------------------------------------------------------------- shaders

const LINE_VERT = /* glsl */ `
attribute vec3 aA;
attribute vec3 aB;
attribute vec4 aM;   // t at A, t at B, band, kind
attribute vec2 aQ;   // discipline thread: index, start delay
uniform vec2 uRes;
uniform float uDpr;
uniform float uWidth;
uniform float uGlow;
uniform float uRX;
uniform float uEgg;
uniform float uTime;
uniform float uDrift;
uniform float uHangTop;
uniform vec2 uGap;      // how far the left and right halves have travelled, device px
uniform vec3 uMouse;
varying float vT;
varying float vKind;
varying float vBand;
varying float vS;
varying float vY;
varying float vDist;
varying float vHalf;
varying vec2 vQ;

const float PI = 3.14159265;
const float HANG_S = ${HANG_S.toFixed(3)};

vec3 toModel(vec3 a, float band, float kind) {
  if (kind > 2.5 && kind < 3.5) return a;
  if (kind > 0.5 && kind < 1.5) return vec3(0.0, mix(HANG_S, uHangTop, a.x), 0.0);
  // neighbouring bands sway in opposite directions, very slowly: the shimmer of a tilted note
  float th = a.y + uDrift * smoothstep(-1.0, 0.0, band) * sin(uTime * 0.11 + band * 1.7) * cos(band * PI);
  float y = a.x * sin(th);
  return vec3(a.x * cos(th) * uRX * (1.0 - uEgg * y), y, a.z);
}

vec2 screenOf(vec3 p) {
  vec4 c = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  return c.xy / c.w * 0.5 * uRes;
}

// threads near the cursor make way, like silk under a fingertip
vec2 part(vec2 p) {
  vec2 d = p - uMouse.xy;
  float l = length(d);
  float f = 1.0 - smoothstep(0.0, 120.0 * uDpr, l);
  return p + (l > 0.001 ? d / l : vec2(0.0)) * f * f * 11.0 * uDpr * uMouse.z;
}

void main() {
  float kind = aM.w;
  vec3 pa = toModel(aA, aM.z, kind);
  vec3 pb = toModel(aB, aM.z, kind);
  // each segment belongs to one half of the cocoon, so the opening never stretches a line
  float side = (pa.x + pb.x) >= 0.0 ? 1.0 : -1.0;
  vec2 sa = part(screenOf(pa));
  vec2 sb = part(screenOf(pb));
  float g = side > 0.0 ? uGap.y : uGap.x;
  sa.x += side * g;
  sb.x += side * g;
  float w = uWidth * uDpr;
  if (kind > 1.5 && kind < 2.5) w *= 0.7;
  if (uGlow > 0.5) w *= 10.0;
  float hw = w * 0.5 + 1.0; // one extra pixel to feather the edge
  vec2 d = sb - sa;
  float len = length(d);
  vec2 dir = len > 0.0001 ? d / len : vec2(1.0, 0.0);
  vec2 p = mix(sa, sb, position.x) + vec2(-dir.y, dir.x) * position.y * hw;
  gl_Position = vec4(p / (0.5 * uRes), 0.0, 1.0);
  vT = mix(aM.x, aM.y, position.x);
  vKind = kind;
  vBand = aM.z;
  vS = mix(aA.x, aB.x, position.x);
  vY = mix(pa.y, pb.y, position.x);
  vDist = position.y * hw;
  vHalf = w * 0.5;
  vQ = aQ;
}
`;

const LINE_FRAG = /* glsl */ `
uniform vec3 uInk;
uniform vec3 uOviA;
uniform vec3 uOviB;
uniform vec3 uLightCol;
uniform float uDraw;
uniform float uHold;
uniform float uLight;
uniform float uHidden;
uniform float uOvi;
uniform float uThreads;
uniform float uHi;
uniform float uHiBand;
uniform float uHiAmt;
uniform vec2 uGap;
uniform float uDpr;
uniform float uGlow;
uniform float uHangFade;
uniform float uFade;
uniform float uBandIn[7];
uniform float uBandOut[7];
uniform float uBandT[7];
varying float vT;
varying float vKind;
varying float vBand;
varying float vS;
varying float vY;
varying float vDist;
varying float vHalf;
varying vec2 vQ;

void main() {
  float kind = vKind;
  bool isHang = kind > 0.5 && kind < 1.5;
  bool isHidden = kind > 1.5 && kind < 2.5;
  bool isDisc = kind > 2.5 && kind < 3.5;
  bool isSeam = kind > 3.5;

  // how much of the thread exists yet
  float prog = isDisc ? clamp((uThreads - vQ.y) / 0.55, 0.0, 1.0) : uDraw;
  if (!isHidden && vT > prog) discard;

  float a;
  if (uGlow > 0.5) { float q = vDist / vHalf; a = exp(-q * q * 3.0) * 0.11; }
  else a = clamp(vHalf + 0.5 - abs(vDist), 0.0, 1.0) * 0.74;

  if (isSeam) {
    // the seam is the hanging thread passing under the weave: in ink it shows only in the
    // windows between bands; held to the light it shows whole, as a banknote's thread does
    float under = 0.0;
    for (int i = 0; i < 7; i++) {
      if (vS > uBandIn[i] - 0.006 && vS < uBandOut[i] + 0.006) under = max(under, smoothstep(uBandT[i], uBandT[i] + 0.02, uDraw));
    }
    float shown = max(uHold, uLight);
    a *= 1.0 - under * (1.0 - shown);
    a *= 1.0 + 0.5 * uHold * (1.0 - uLight); // darker against the light behind it
  }
  if (isHang) a *= 1.0 - smoothstep(uHangFade - 0.05, uHangFade + 0.08, vY); // comes out from under the nav
  if (isHang || isSeam) a *= 1.0 - smoothstep(0.0, 36.0 * uDpr, max(uGap.x, uGap.y));
  if (isHidden) a *= uHidden * 0.34;
  if (isDisc) a *= 0.82;
  a *= uFade;
  if (a <= 0.002) discard;

  // the light comes from the core and travels outward
  float lit = uLight;
  if (!isDisc && !isHang) {
    float F = uLight * 1.75 - 0.2;
    lit = 1.0 - smoothstep(F - 0.35, F, vS);
  }
  vec3 ink = uInk;
  if (kind < 0.5 && abs(vBand - ${OVI_BAND.toFixed(1)}) < 0.5) ink = mix(uInk, mix(uOviA, uOviB, uOvi), 0.85);
  vec3 glow = uLightCol * (1.15 - 0.45 * clamp(vS, 0.0, 1.1));
  if (isDisc || isHang) glow = uLightCol * 0.9;
  float hi = 1.0;
  if (uHiAmt > 0.001) {
    float on = 0.0;
    if (isDisc && abs(vQ.x - uHi) < 0.5) on = 1.0;
    if (kind < 0.5 && abs(vBand - uHiBand) < 0.5) on = 1.0;
    hi = mix(1.0, mix(0.45, 1.9, on), uHiAmt);
  }
  // premultiplied: ink lies on the paper (alpha a), light adds to what is behind (alpha 0)
  vec3 col = mix(ink * a, glow * hi * a, lit);
  float alpha = isHidden ? 0.0 : a * (1.0 - lit);
  if (uGlow > 0.5) { col = glow * hi * a * lit; alpha = 0.0; }
  gl_FragColor = vec4(col, alpha);
}
`;

const RING_VERT = /* glsl */ `
attribute vec2 aUv;
attribute float aSide;
uniform vec2 uRes;
uniform vec2 uGap;
uniform float uReps;
varying vec2 vUv;
varying float vU;
void main() {
  vec4 c = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  c.x += aSide * (aSide > 0.0 ? uGap.y : uGap.x) / (0.5 * uRes.x) * c.w;
  gl_Position = c;
  vUv = vec2(aUv.x * uReps, aUv.y);
  vU = aUv.x;
}
`;

const RING_FRAG = /* glsl */ `
uniform sampler2D uText;
uniform float uMicro;
uniform float uFade;
uniform float uLight;
uniform vec3 uInk;
uniform vec3 uLightCol;
varying vec2 vUv;
varying float vU;
void main() {
  if (vU > uMicro) discard;
  float a = texture2D(uText, vUv).a * 0.9;
  // two hairline rules either side of the text, as round a coin's border
  float px = fwidth(vUv.y);
  float rules = max(1.0 - smoothstep(0.0, px * 1.3, abs(vUv.y - 0.06)), 1.0 - smoothstep(0.0, px * 1.3, abs(vUv.y - 0.94)));
  a = max(a, rules * 0.7) * uFade;
  float F = uLight * 1.75 - 0.2;
  float lit = 1.0 - smoothstep(F - 0.35, F, 1.03);
  gl_FragColor = vec4(mix(uInk * a, uLightCol * 0.85 * a, lit), a * (1.0 - lit));
}
`;

const GROUND_FRAG = /* glsl */ `
uniform vec2 uC;
uniform vec2 uR;
uniform float uDpr;
uniform float uHold;
uniform float uLight;
uniform vec2 uGap;
uniform float uLens;
uniform vec3 uPaper;
uniform vec3 uNight;
uniform vec3 uWarm;
uniform sampler2D uFibres;
void main() {
  vec2 p = gl_FragCoord.xy;
  float dx = p.x - uC.x;
  // the opening: lens-shaped while narrow, like a chrysalis splitting along its seam
  float yy = (p.y - uC.y) / (uR.y * 1.25);
  float side = dx >= 0.0 ? 1.0 : -1.0;
  float g = side > 0.0 ? uGap.y : uGap.x; // each half travels as far as it needs to leave the screen
  float halfGap = g * (1.0 - uLens * clamp(yy * yy, 0.0, 1.0));
  float edge = abs(dx) - halfGap;
  float open = max(uGap.x, uGap.y);
  if (open > 0.5 && edge < 0.0) {
    float sh = (1.0 - smoothstep(0.0, 30.0 * uDpr, -edge)) * 0.14 * smoothstep(0.0, 24.0 * uDpr, open);
    gl_FragColor = vec4(0.0, 0.0, 0.0, sh);
    return;
  }
  vec2 q = p - vec2(side * g, 0.0); // each half of the paper travels with its half of the cocoon
  vec2 e = (q - uC) / uR;
  float d = length(e);
  vec4 fb = texture2D(uFibres, q / (512.0 * uDpr));
  float glow = exp(-d * d * 0.9);

  vec3 paper = mix(uPaper, fb.rgb, fb.a * 0.16);
  // held to the light: the paper warms from behind and its fibres show as shadows inside it
  float back = max(uHold, uLight);
  vec3 held = mix(uPaper * 0.86, uWarm * 1.04, glow);
  held = mix(held, fb.rgb * 0.55, fb.a * (0.3 + 0.6 * glow));
  vec3 inkSide = mix(paper, held, back);

  // in the light the room goes dark from the edges in, and the light stays behind the cocoon
  float g2 = exp(-d * d * 1.25);
  vec3 night = uNight + uWarm * g2 * 0.3 + uWarm * fb.a * g2 * 0.12;
  night *= 1.0 - 0.3 * smoothstep(1.4, 4.0, d);
  float R = mix(5.0, -1.6, uLight);
  float k = smoothstep(R, R + 1.4, d);
  vec3 col = mix(inkSide, night, k);
  // the cut edges of the halves catch a little shadow
  if (open > 0.5) col *= 1.0 - 0.05 * (1.0 - smoothstep(0.0, 60.0 * uDpr, edge));
  gl_FragColor = vec4(col, 1.0);
}
`;

// ---------------------------------------------------------------- the cocoon

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  // passed straight through: ShaderMaterial does no colour-space conversion
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export function createCocoon(canvas, { quality = 1, reduced = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 1, 10, 10000);
  const group = new THREE.Group();
  scene.add(group);

  const thread = buildThread(quality);
  const u = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uDpr: { value: dpr },
    uWidth: { value: dpr >= 2 ? 0.62 : 0.9 },
    uRX: { value: RX },
    uEgg: { value: EGG },
    uTime: { value: 0 },
    uDrift: { value: reduced ? 0 : 0.016 },
    uHangTop: { value: 3 },
    uHangFade: { value: 2 },
    uGap: { value: new THREE.Vector2(0, 0) },
    uLens: { value: 0.62 },
    uMouse: { value: new THREE.Vector3(0, 0, 0) },
    uDraw: { value: 1 },
    uFade: { value: 1 },
    uHold: { value: 0 },
    uLight: { value: 0 },
    uHidden: { value: 0 },
    uOvi: { value: 0.5 },
    uThreads: { value: 0 },
    uMicro: { value: 1 },
    uHi: { value: -1 },
    uHiBand: { value: -1 },
    uHiAmt: { value: 0 },
    uBandIn: { value: BANDS.map((b) => b.s0) },
    uBandOut: { value: BANDS.map((b) => b.s1) },
    uBandT: { value: thread.bandT },
    uInk: { value: rgb('#16201b') },
    uOviA: { value: rgb('#145a43') },  // colour-shifting ink: green to blue, as on the ₹500
    uOviB: { value: rgb('#1f478a') },
    uLightCol: { value: rgb('#ffe6bd') },
    uPaper: { value: rgb('#f2f3ef') },
    uNight: { value: rgb('#0a101c') },
    uWarm: { value: rgb('#fdecc8') },
    uFibres: { value: fibreTexture() },
    uC: { value: new THREE.Vector2() },
    uR: { value: new THREE.Vector2(1, 1) },
    uText: { value: null },
    uReps: { value: 2 },
  };

  const premult = (m) => {
    m.transparent = true;
    m.depthTest = false;
    m.depthWrite = false;
    m.blending = THREE.CustomBlending;
    m.blendEquation = THREE.AddEquation;
    m.blendSrc = THREE.OneFactor;
    m.blendDst = THREE.OneMinusSrcAlphaFactor;
    return m;
  };
  const lineMat = (glow) => premult(new THREE.ShaderMaterial({
    uniforms: { ...u, uGlow: { value: glow } },
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
  }));
  const lineMaterial = lineMat(0), glowMaterial = lineMat(1);
  const mesh = (geo, mat, order, parent = group) => {
    const m = new THREE.Mesh(geo, mat);
    m.frustumCulled = false;
    m.renderOrder = order;
    parent.add(m);
    return m;
  };

  const ground = mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: 'void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: GROUND_FRAG,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NoBlending,
  }), 0, scene);
  const threadGlow = mesh(thread.geometry, glowMaterial, 1);
  mesh(thread.geometry, lineMaterial, 2);
  let discGlow = null, discLine = null;

  const ringInfo = {};
  const ring = mesh(ringGeometry(ringInfo), premult(new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: RING_VERT,
    fragmentShader: RING_FRAG,
    side: THREE.DoubleSide, // it is built clockwise, so its triangles face away
  })), 3);
  u.uReps.value = ringInfo.reps;
  ring.visible = false;

  const L = { W: 1, H: 1, cx: 0, cy: 0, ry: 1 };
  const input = { x: 0, y: 0, on: false, sx: 0, sy: 0, strength: 0, tx: 0, ty: 0 };
  const api = {
    u,
    dpr,
    tKnot: thread.tKnot,
    push: 0,
    litScale: 1, // in the light the cocoon recedes a little, to make room for the threads
    breath: reduced ? 0 : 0.004,
    autoTilt: false,

    layout(next) {
      Object.assign(L, next);
      renderer.setSize(L.W, L.H, false);
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      u.uRes.value.copy(size);
      camera.aspect = L.W / L.H;
      const D = L.H / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      camera.position.set(0, 0, D);
      camera.near = D * 0.2;
      camera.far = D * 4;
      camera.updateProjectionMatrix();
      camera.updateMatrixWorld();
      group.position.set(L.cx - L.W / 2, L.H / 2 - L.cy, 0);
      u.uC.value.set(L.cx * dpr, (L.H - L.cy) * dpr);
      u.uR.value.set(L.ry * RX * 1.05 * dpr, L.ry * 1.05 * dpr);
      u.uHangTop.value = (L.cy + 60) / L.ry;
      u.uHangFade.value = (L.cy - L.navBottom) / L.ry;
    },

    setThreads(list) {
      for (const m of [discGlow, discLine]) if (m) { group.remove(m); }
      if (discLine) discLine.geometry.dispose();
      if (!list.length) { discGlow = discLine = null; return; }
      const g = discGeometry(list);
      discGlow = mesh(g, glowMaterial, 1);
      discLine = mesh(g, lineMaterial, 2);
    },

    setWords(words) {
      u.uText.value = microprintTexture(words, renderer.capabilities.getMaxAnisotropy());
      ring.visible = true;
    },

    pointer(x, y) {
      if (x == null) { input.on = false; return; }
      if (!input.on) { input.sx = x; input.sy = y; }
      input.on = true; input.x = x; input.y = y;
    },

    // model x, y to CSS px, through the live tilt and scale
    project(x, y) {
      const v = new THREE.Vector3(x, y, 0.03).applyMatrix4(group.matrixWorld).project(camera);
      return [(v.x * 0.5 + 0.5) * L.W, (-v.y * 0.5 + 0.5) * L.H];
    },

    render(time, dt) {
      const k = Math.min(1, dt * 5);
      input.sx += (input.x - input.sx) * k;
      input.sy += (input.y - input.sy) * k;
      input.strength += ((input.on ? 1 : 0) - input.strength) * Math.min(1, dt * 3);
      u.uMouse.value.set((input.sx - L.W / 2) * dpr, (L.H / 2 - input.sy) * dpr, input.strength);

      // the cocoon turns a few degrees toward the cursor; on a phone it drifts by itself
      let tx, ty;
      if (api.autoTilt) {
        ty = 0.032 * Math.sin(time * 0.23);
        tx = 0.022 * Math.sin(time * 0.17 + 1.3);
      } else {
        ty = input.on ? ((input.sx - L.cx) / L.W) * 0.12 : 0;
        tx = input.on ? ((input.sy - L.cy) / L.H) * 0.09 : 0;
      }
      if (reduced) tx = ty = 0;
      input.tx += (tx - input.tx) * Math.min(1, dt * 2.2);
      input.ty += (ty - input.ty) * Math.min(1, dt * 2.2);
      group.rotation.set(input.tx, input.ty, 0);
      // the tilt is what turns the colour-shifting band from green to blue
      u.uOvi.value = 0.5 + 0.5 * Math.sin(input.ty * 17 + input.tx * 12 + 0.3);

      const breathe = 1 + api.breath * Math.sin((time * TAU) / 7);
      const recede = 1 + (api.litScale - 1) * u.uLight.value;
      group.scale.setScalar(L.ry * breathe * recede * (1 + api.push));
      u.uTime.value = time;

      const lit = u.uLight.value > 0.001;
      threadGlow.visible = lit;
      if (discGlow) { discGlow.visible = lit && u.uThreads.value > 0; discLine.visible = u.uThreads.value > 0; }
      ground.visible = true;
      group.updateMatrixWorld();
      renderer.render(scene, camera);
    },
  };
  return api;
}
