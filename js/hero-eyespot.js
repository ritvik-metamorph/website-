// Hero 3 of 3, "the eyespot" (10 Nov). Our own idea for the brief, kept to its seven orbits: they are
// the eyespot on a butterfly's wing, the concentric rings of colour many wings carry. Close up, a
// wing is thousands of scales laid like tiles, each one a single colour, and the rings are made of
// them. So the hero opens so close that every scale can be seen, sharp, with its ridges, catching
// the light where the pointer is: the core, then the seven orbits as seven bands of scales, the
// founder's twenty-seven disciplines among them as gilded scales. The scroll draws back until the
// eyespot is one marking on a wing, and the wing one of a pair: what a life becomes. Last, the
// butterfly lifts away into the dark hero 4 opens in.
// - Everything is drawn in code, in one full-screen pass: no images (the user prefers nothing
//   sourced from outside). The scales are worked out per pixel at full resolution, so they stay
//   cut clean at any distance; once they are too small to see, the pass draws their colour instead.
// - Hover a band to read its orbit (and see its disciplines named on their scales); click to open
//   its metrics (the light orb's panel, js/orb.js, through an 'mm:open' event).
import * as THREE from '../assets/vendor/three.module.min.js';
import { ATLAS } from './atlas-data.js';
import { FIELD_COL } from './orb-scene.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);
const rgb = (c, k = 1) => `rgb(${c.map((v) => Math.round(Math.min(1, v * k) * 255)).join(',')})`;

// the wing, in units of one scale's width; the body runs up x = 0 and the left side is the right,
// mirrored. Each outline is a few points, smoothed into a closed curve.
const FORE = [[6, 6], [20, 60], [70, 140], [150, 205], [235, 238], [285, 228], [305, 185], [296, 120], [272, 60], [240, 18], [170, -2], [90, -8], [30, -4]];
const HIND = [[8, -4], [60, -6], [140, -20], [210, -55], [245, -110], [248, -170], [228, -225], [185, -262], [130, -278], [80, -262], [40, -215], [18, -150], [8, -70]];
const NV = 28;
function closedCurve(pts, n) {
  const out = [];
  const m = pts.length;
  for (let i = 0; i < n; i++) {
    const f = (i / n) * m, j = Math.floor(f), t = f - j;
    const p0 = pts[(j - 1 + m) % m], p1 = pts[j % m], p2 = pts[(j + 1) % m], p3 = pts[(j + 2) % m];
    const t2 = t * t, t3 = t2 * t;
    const c = (a, b, cc, d) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
    out.push(new THREE.Vector2(c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])));
  }
  return out;
}
// the eyespot: on the forewing, its seven bands outside a core
const EYE = [190, 115], ER = 46, CORE = 0.13, BAND = (1 - CORE) / 7;
const BASE = [4, 20]; // the wing's root: every row of scales is an arc round it, every scale points away
// the butterfly, whole: its span and height, and the middle of it
const SPAN = 620, TALL = 560, MID = [0, -6];

// the seven orbits as pigment: the light orb's own colours, deepened the way a scale holds colour
const PIG = [
  [0.96, 0.9, 0.78],
  [0.94, 0.78, 0.52],
  [0.9, 0.6, 0.36],
  [0.84, 0.44, 0.34],
  [0.68, 0.36, 0.46],
  [0.45, 0.34, 0.62],
  [0.28, 0.4, 0.7],
  [0.16, 0.3, 0.52],
];
// the wing's outlines and colours, shared with hero 4 (js/hero-emergence.js)
export const WING = { FORE, HIND, closedCurve, BASE, MID, PIG };

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform vec2 uFocus;
uniform vec2 uAnchor;
uniform float uS;
uniform float uTime;
uniform vec2 uLight;
uniform float uHover;
uniform float uReveal;
uniform float uFlapK;
uniform float uWhite;
uniform vec3 uPaper;
uniform vec3 uPig[8];
uniform vec2 uFW[${NV}];
uniform vec2 uHW[${NV}];
uniform vec2 uDisc[27];
uniform float uDiscOn[27];
uniform vec4 uShade;
uniform float uShadeK;
const vec2 EYE = vec2(${EYE[0]}.0, ${EYE[1]}.0);
const float ER = ${ER}.0;
const float CORE = ${CORE};
const float BAND = ${BAND};
const vec2 BASE = vec2(${BASE[0]}.0, ${BASE[1]}.0);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float sdF(vec2 p) {
  float d = dot(p - uFW[0], p - uFW[0]); float s = 1.0;
  for (int i = 0, j = ${NV - 1}; i < ${NV}; j = i, i++) {
    vec2 e = uFW[j] - uFW[i]; vec2 w = p - uFW[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= uFW[i].y, p.y < uFW[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}
float sdH(vec2 p) {
  float d = dot(p - uHW[0], p - uHW[0]); float s = 1.0;
  for (int i = 0, j = ${NV - 1}; i < ${NV}; j = i, i++) {
    vec2 e = uHW[j] - uHW[i]; vec2 w = p - uHW[i];
    vec2 b = w - e * clamp(dot(w, e) / dot(e, e), 0.0, 1.0);
    d = min(d, dot(b, b));
    bvec3 c = bvec3(p.y >= uHW[i].y, p.y < uHW[j].y, e.x * w.y > e.y * w.x);
    if (all(c) || all(not(c))) s *= -1.0;
  }
  return s * sqrt(d);
}

// the colour a scale at p (one side of the wing, x >= 0) is: its wing's ground, the veins, the
// marks near the edge, and on the forewing the eyespot. band: the orbit (0..6), 7 for the core,
// -1 outside the eyespot; e: how far out in the eyespot
vec3 pattern(vec2 p, out float inWing, out float band, out float e) {
  band = -1.0; e = 9.0;
  if (p.x < -4.0 || p.x > 320.0 || p.y < -290.0 || p.y > 250.0) { inWing = 0.0; return vec3(0.0); }
  float df = sdF(p), dh = sdH(p);
  float d = df < 0.0 ? df : dh;
  inWing = step(min(df, dh), 0.0);
  vec2 q = p - BASE;
  float r = length(q), th = atan(q.y, q.x);
  // the ground: a deep umber, each patch its own, darker toward the root
  float lo = 0.5 + 0.5 * sin(p.x * 0.031 + sin(p.y * 0.023) * 2.0) * cos(p.y * 0.027 - p.x * 0.011);
  vec3 col = mix(vec3(0.05, 0.04, 0.038), vec3(0.12, 0.085, 0.07), lo) * (0.75 + 0.25 * smoothstep(20.0, 140.0, r));
  // the veins, out from the root
  float vein = 9.0;
  if (df < 0.0) {
    for (int i = 0; i < 8; i++) { float a = 0.06 + float(i) * 0.15 + 0.02 * float(i * i) * 0.1; vein = min(vein, abs(th - a) * r); }
  } else {
    for (int i = 0; i < 7; i++) { float a = -0.12 - float(i) * 0.215; vein = min(vein, abs(th - a) * r); }
  }
  col = mix(col, vec3(0.025, 0.02, 0.02), (1.0 - smoothstep(0.9, 1.7, vein)) * smoothstep(30.0, 60.0, r));
  // a fine pale line near the edge, and the edge itself darker
  float sub = 1.0 - smoothstep(0.8, 1.8, abs(d + 13.0));
  col = mix(col, vec3(0.42, 0.4, 0.37), sub * 0.5);
  col = mix(col, vec3(0.03, 0.025, 0.022), 1.0 - smoothstep(2.0, 6.0, -d));
  // on the hindwing, a row of small blue marks inside the edge
  if (df >= 0.0) {
    float lun = (1.0 - smoothstep(2.0, 4.5, abs(d + 22.0))) * smoothstep(0.35, 0.8, 0.5 + 0.5 * cos(th * 26.0));
    col = mix(col, vec3(0.3, 0.42, 0.66), lun * 0.85);
  }
  // the eyespot: the core, then the seven orbits, each a band of scales, framed in black
  if (df < 0.0) {
    e = length((p - EYE) * vec2(1.0, 1.05)) / ER;
    if (e < CORE) { col = uPig[0]; band = 7.0; }
    else if (e < 1.0) { float k = min(floor((e - CORE) / BAND), 6.0); band = k; col = uPig[int(k) + 1]; }
    else if (e < 1.07) col = vec3(0.02, 0.018, 0.018);
  }
  return col;
}

void main() {
  vec2 px = vUv * uRes;
  vec2 w = uFocus + (px - uAnchor) / uS;
  vec3 room = vec3(0.012, 0.014, 0.019);
  vec3 col = room;
  // the wings, one side mirrored to the other, narrowing toward the body as they lift
  vec2 p = vec2(abs(w.x) / max(uFlapK, 0.12), w.y);
  float det = smoothstep(2.2, 6.0, uS * uFlapK);     // can a scale still be seen?
  vec2 q = p - BASE;
  float r = length(q), th = atan(q.y, q.x);
  float ri = floor(r);
  vec3 L = normalize(vec3(uLight * 0.9, 0.85));
  // what an eye takes in from far enough away: the wing's colour; and between scales, the membrane
  float inWf, bandF, eF;
  vec3 flatC = pattern(p, inWf, bandF, eF) * 0.86;
  float hit = 0.0;
  vec3 sc = mix(room, vec3(0.018, 0.015, 0.014), inWf);
  // two scales can reach this pixel: one rooted in this row, and over it the one rooted in the row
  // inside, whose tip lies on this row's roots, like tiles on a roof
  if (det > 0.001) {
    for (int c = 0; c < 2; c++) {
      float n = ri - float(c);
      if (n < 1.0) continue;
      float stag = mod(n, 2.0) * 0.5;
      float rm = n + 0.75;
      float sIdx = floor(th * rm + stag);
      float h1 = hash(vec2(n, sIdx)), h2 = hash(vec2(sIdx + 3.7, n));
      float thc = (sIdx + 0.5 - stag) / rm + (h1 - 0.5) * 0.12 / rm;
      float a = (th - thc) * r;           // across the scale, in scale widths
      float b = r - n;                     // along it, out from its root
      float len = 1.5 + 0.18 * h2;
      // the scale's own centre decides its colour: each scale is one colour
      vec2 pc = BASE + (n + 0.8) * vec2(cos(thc), sin(thc));
      float inW, band, e;
      vec3 base = pattern(pc, inW, band, e);
      if (inW < 0.5) continue;
      // it turns in from the core outward when the hero opens
      float t0 = clamp(length(pc - EYE) / 330.0, 0.0, 1.0) * 0.8 + h1 * 0.12;
      float vis = smoothstep(t0, t0 + 0.12, uReveal);
      if (vis <= 0.001) continue;
      float hw = (0.47 * smoothstep(0.0, 0.32, b) + 0.05) * vis;
      float tip = len - 0.075 * (1.0 - abs(cos(a * 9.4248)));
      float de = min(hw - abs(a), min(tip - b, b - 0.02));
      float cov = smoothstep(-0.6, 0.6, de * uS);
      if (cov <= 0.0) continue;
      float rim = 1.0 - smoothstep(0.5, 1.6, de * uS);
      base *= 0.84 + 0.3 * h1;
      // a discipline's scale: gilded
      float gild = 0.0;
      for (int i = 0; i < 27; i++) { vec2 dd = uDisc[i] - vec2(n, sIdx); if (abs(dd.x) < 0.5 && abs(dd.y) < 0.5) gild = max(gild, 0.55 + 0.45 * uDiscOn[i]); }
      base = mix(base, vec3(1.0, 0.86, 0.56), gild * 0.7);
      // the orbit under the pointer lifts and brightens
      float lift = (band == uHover && band >= 0.0) ? 1.0 : 0.0;
      // its ridges run along it; it curls a little, and is shaded at the root where the scale above lies
      float rid = 0.5 + 0.5 * cos(a * 6.2832 * 5.0);
      float curl = 1.0 - 0.9 * a * a;
      float ao = mix(0.5, 1.0, smoothstep(0.0, 0.75, b));
      vec2 tilt = (vec2(h2, hash(vec2(n * 1.3, sIdx * 0.7))) - 0.5) * 0.7;
      vec3 nrm = normalize(vec3(tilt.x + a * 0.9, tilt.y - 0.2 + b * 0.12, 1.0));
      float spec = pow(max(dot(reflect(-L, nrm), vec3(0.0, 0.0, 1.0)), 0.0), 16.0);
      vec3 sheen = mix(vec3(1.0, 0.97, 0.92), vec3(0.62, 0.74, 1.0), 0.45 + 0.4 * h2);
      // (a dark scale catches less: its sheen is kept to its colour)
      float lum = dot(base, vec3(0.3, 0.55, 0.15));
      vec3 s = base * curl * ao * (0.88 + 0.12 * rid) * (1.0 + 0.45 * lift) + sheen * spec * (0.18 + 0.42 * rid) * (0.12 + 0.88 * smoothstep(0.05, 0.45, lum)) * (1.0 + gild * 1.5 + lift * 0.6);
      s *= 1.0 - 0.62 * rim;
      sc = mix(sc, s, cov);
      hit = max(hit, cov);
    }
  }
  // too small to see one by one, the scales give way to their colour
  col = mix(mix(room, flatC, inWf), sc, det);
  // the body and its antennae, drawn over the wings' roots
  {
    float onePx = 1.0 / uS;
    vec2 b0 = w;
    float thor = length((b0 - vec2(0.0, 50.0)) / vec2(13.0, 48.0)) - 1.0;
    float abdo = length((b0 - vec2(0.0, -78.0)) / vec2(9.0, 108.0)) - 1.0;
    float head = length(b0 - vec2(0.0, 108.0)) / 12.0 - 1.0;
    float body = min(min(thor * 13.0, abdo * 9.0), head * 12.0);
    vec2 a0 = vec2(abs(b0.x), b0.y) - vec2(4.0, 116.0), a1 = vec2(52.0, 250.0) - vec2(4.0, 116.0);
    float ant = length(a0 - a1 * clamp(dot(a0, a1) / dot(a1, a1), 0.0, 1.0)) - max(0.9, 0.7 * onePx);
    float club = length(vec2(abs(b0.x), b0.y) - vec2(52.0, 250.0)) - 4.5;
    float bd = min(body, min(ant, club));
    float bc = 1.0 - smoothstep(-0.7 * onePx, 0.7 * onePx, bd);
    float sheen = 0.5 + 0.5 * cos(b0.y * 0.4) * smoothstep(-4.0, 0.0, -abs(b0.x));
    col = mix(col, vec3(0.03, 0.028, 0.027) + vec3(0.06, 0.055, 0.05) * sheen * (1.0 - smoothstep(-6.0, 0.0, body)), bc * smoothstep(0.0, 0.25, uReveal));
  }
  // where the words are, the wing steps back a little so they can be read
  vec2 sc0 = (uShade.xy + uShade.zw) * 0.5, sr = max((uShade.zw - uShade.xy) * 0.5, vec2(1.0)) * vec2(1.25, 1.2);
  float sf = length((px - sc0) / sr);
  col *= 1.0 - uShadeK * (1.0 - smoothstep(0.55, 1.2, sf));
  // a little darker at the frame's edge, a fine grain, and last the paper
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.35;
  col = pow(col, vec3(0.94));
  col += (hash(px + fract(uTime) * 61.0) - 0.5) * 0.012;
  col = mix(col, uPaper, uWhite);
  gl_FragColor = vec4(col, 1.0);
}`;

export function setupEye({ lenis, reduced, isTouch, local }) {
  const stage = $('.stage-3');
  const hero = $('.hv-eye');
  if (!stage || !hero) return;
  const canvas = $('.hv-gl', hero);
  const labels = $('.hv-labels', hero);
  const card = $('.hv-card', hero);
  const copy = $('.hv-copy', hero);
  const caps = $$('.hv-caption', hero);

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { hero.classList.add('no-gl', 'is-words'); return; }
  const narrow0 = isNarrow(innerWidth, innerHeight);
  // every scale is worked out per pixel: a phone draws at a little under its full sharpness
  const dpr = Math.min(window.devicePixelRatio || 1, narrow0 ? 1.6 : 2);
  renderer.setPixelRatio(dpr);

  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  // each discipline's scale: in its orbit's band, spread round the eyespot
  byRing.forEach((list, k) => list.forEach((d, j) => {
    const a = (j / list.length) * TAU + k * 0.9 + 0.5;
    const rr = ER * (CORE + (k + 0.5) * BAND);
    d.wp = [EYE[0] + Math.cos(a) * rr, EYE[1] + (Math.sin(a) * rr) / 1.05];
    const qx = d.wp[0] - BASE[0], qy = d.wp[1] - BASE[1];
    const r = Math.hypot(qx, qy), th = Math.atan2(qy, qx), n = Math.floor(r);
    const stag = (n % 2) * 0.5, rm = n + 0.75;
    d.cell = [n, Math.floor(th * rm + stag)];
  }));

  const U = {
    uRes: { value: new THREE.Vector2(1, 1) }, uFocus: { value: new THREE.Vector2(...EYE) }, uAnchor: { value: new THREE.Vector2() },
    uS: { value: 20 }, uTime: { value: 0 }, uLight: { value: new THREE.Vector2(-0.3, 0.4) }, uHover: { value: -1 },
    uReveal: { value: reduced ? 1 : 0 }, uFlapK: { value: 1 }, uWhite: { value: 0 },
    // (since hero 4 follows it, it ends in the room's dark, not the paper)
    uPaper: { value: new THREE.Vector3(0.012, 0.014, 0.019) },
    uPig: { value: PIG.map((c) => new THREE.Vector3(...c)) },
    uFW: { value: closedCurve(FORE, NV) }, uHW: { value: closedCurve(HIND, NV) },
    uDisc: { value: discs.map((d) => new THREE.Vector2(...d.cell)) }, uDiscOn: { value: discs.map(() => 0) },
    uShade: { value: new THREE.Vector4(-9, -9, -9, -9) }, uShadeK: { value: 0 },
  };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: U, depthTest: false, depthWrite: false }));
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const cam = new THREE.Camera();

  // ---------------------------------------------------------------- the words in the world

  // the disciplines of the orbit being read, named on their scales
  const discTags = discs.map((d) => { const t = el('span', 'he-d', d.name); labels.append(t); return t; });
  // the orbit under the pointer, named beside it
  const tag = el('span', 'he-tag');
  labels.append(tag);

  let focus = null; // { kind: 'field', k }
  function setFocus(f) {
    if ((f && focus && f.k === focus.k) || (!f && !focus)) return;
    focus = f;
    card.textContent = '';
    if (f) {
      const k = f.k, head = el('p', 'hc-k'), sw = el('span', 'hc-sw');
      sw.style.background = rgb(PIG[k + 1], 1);
      head.append(sw, el('span', null, `Orbit ${ROMAN[k]}`));
      card.append(head, el('p', 'hc-name', rings[k].name), el('p', 'hc-note', rings[k].note), el('p', 'hc-list', byRing[k].map((d) => d.name).join(' · ')));
      tag.textContent = `${ROMAN[k]}  ${rings[k].name}`;
    }
    card.classList.toggle('is-on', !!f);
    hero.classList.toggle('is-reading', !!f);
    tag.classList.toggle('is-on', !!f);
    canvas.style.cursor = f ? 'pointer' : '';
  }

  // ---------------------------------------------------------------- size and the view

  const view = { W: 1, H: 1, narrow: false, k: 1, S0: 12, S1: 1.4 };
  function layout() {
    const W = hero.clientWidth, H = hero.clientHeight;
    Object.assign(view, { W, H, narrow: isNarrow(W, H) });
    renderer.setSize(W, H, false);
    view.k = renderer.getPixelRatio();
    U.uRes.value.set(W * view.k, H * view.k);
    // close: the eyespot wider than the screen is tall; drawn back: the whole butterfly, with room
    view.S0 = ((view.narrow ? 0.66 : 0.4) * W) / ER;
    view.S1 = Math.min(((view.narrow ? 0.92 : 0.8) * W) / SPAN, ((view.narrow ? 0.62 : 0.82) * H) / TALL);
  }
  // where a wing point is on the screen this frame (CSS pixels, y down); the right side's
  const toScreen = (wx, wy) => {
    const S = U.uS.value / view.k;
    return [U.uAnchor.value.x / view.k + (wx * U.uFlapK.value - U.uFocus.value.x) * S, view.H - (U.uAnchor.value.y / view.k + (wy - U.uFocus.value.y) * S)];
  };
  const toWing = (x, y) => {
    const S = U.uS.value / view.k;
    const wx = U.uFocus.value.x + (x - U.uAnchor.value.x / view.k) / S;
    const wy = U.uFocus.value.y + (view.H - y - U.uAnchor.value.y / view.k) / S;
    return [Math.abs(wx) / Math.max(U.uFlapK.value, 0.12), wy];
  };

  // ---------------------------------------------------------------- the opening: the scales turn in

  const O = { reveal: reduced ? 1 : 0 };
  let opened = reduced;
  function openUp() {
    if (opened) return;
    opened = true;
    gsap.timeline()
      .to(O, { reveal: 1, duration: 3.4, ease: 'power2.inOut' }, 0)
      .add(() => hero.classList.add('is-words'), 1.9);
  }
  if (reduced) hero.classList.add('is-words');

  let P = 0, Ps = 0;
  ScrollTrigger.create({ trigger: stage, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { P = self.progress; } });
  const html = document.documentElement;
  ScrollTrigger.create({
    trigger: stage, start: 'top 55%',
    onEnter: () => { if (html.classList.contains('gate')) addEventListener('mm:enter', openUp, { once: true }); else openUp(); },
  });
  $('.hv-go', hero)?.addEventListener('click', () => {
    openUp();
    lenis.scrollTo(stage.offsetTop + (stage.offsetHeight - innerHeight) * 0.8, { duration: 2.6 });
  });

  // ---------------------------------------------------------------- the pointer

  const pointer = { x: 0, y: 0, nx: -0.3, ny: -0.4, in: false };
  const light = { x: -0.3, y: 0.4 };
  function pick(x, y) {
    if (O.reveal < 0.7 || Ps > 0.5) return null;
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    if (!focus && Ps < 0.1 && x > cr.left - hr.left && x < cr.right - hr.left && y > cr.top - hr.top && y < cr.bottom - hr.top) return null;
    const [wx, wy] = toWing(x, y);
    const e = Math.hypot(wx - EYE[0], (wy - EYE[1]) * 1.05) / ER;
    if (e < CORE || e >= 1) return null;
    return { kind: 'field', k: Math.min(6, Math.floor((e - CORE) / BAND)) };
  }
  const rel = (e) => { const r = hero.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
  addEventListener('pointermove', (e) => {
    const [x, y, r] = rel(e);
    pointer.x = x; pointer.y = y;
    pointer.in = y >= 0 && y <= r.height;
    pointer.nx = clamp((x / r.width) * 2 - 1, -1, 1);
    pointer.ny = clamp((y / r.height) * 2 - 1, -1, 1);
    if (e.pointerType !== 'mouse' || document.querySelector('.disc-panel.is-on')) return;
    if (e.target.closest('a, button, .nav')) return;
    setFocus(pointer.in ? pick(x, y) : null);
  }, { passive: true });
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button')) return;
    const [x, y] = rel(e);
    pointer.x = x; pointer.y = y;
    const f = pick(x, y);
    if (!f) { setFocus(null); return; }
    if (isTouch && !(focus && focus.k === f.k)) { setFocus(f); return; }
    dispatchEvent(new CustomEvent('mm:open', { detail: f }));
  });

  // ---------------------------------------------------------------- the frame

  let last = performance.now();
  const t0 = last;
  function frame() {
    const tn = performance.now();
    const dt = Math.min(0.05, (tn - last) / 1000);
    last = tn;
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const t = (tn - t0) / 1000;
    Ps = reduced ? P : damp(Ps, P, 5, dt);
    const p = Ps;
    const { W, H, k, narrow } = view;

    // the view: so close every scale shows, drawing back (evenly, as a lens does) to the whole
    // butterfly, which then lifts away as the room turns to paper
    const z = smooth(0.08, 0.78, p);
    const S = view.S0 * Math.pow(view.S1 / view.S0, z);
    const zf = Math.log(view.S0 / S) / Math.log(view.S0 / view.S1);
    // the eyespot glides steadily from where it opens to its place on the whole wing
    const ex = lerp((narrow ? 0.5 : 0.64) * W, W / 2 + (EYE[0] - MID[0]) * view.S1, zf);
    const ey = lerp((narrow ? 0.4 : 0.5) * H, H / 2 - (EYE[1] - MID[1]) * view.S1, zf);
    const fx = EYE[0] - (ex - W / 2) / S, fy = EYE[1] + (ey - H / 2) / S;
    const lift = smooth(0.86, 1, p);
    const ax = W / 2, ay = H / 2 - lift * H * 0.9;
    U.uS.value = S * k;
    U.uFocus.value.set(fx, fy);
    U.uAnchor.value.set(ax * k, (H - ay) * k);
    // the wings, at rest open; drawn back, they beat slowly, and faster as it lifts
    const beat = smooth(0.7, 0.8, p);
    const ang = beat * (0.28 + 0.22 * Math.sin(t * (1.4 + 3 * lift))) * (1 + lift) + lift * 0.25;
    U.uFlapK.value = Math.cos(clamp(ang, 0, 1.35));
    U.uWhite.value = smooth(0.92, 0.995, p);
    U.uTime.value = t;
    U.uReveal.value = O.reveal;

    // the light follows the pointer; on a phone it moves by itself, slowly
    const live = pointer.in && !isTouch;
    light.x = damp(light.x, live ? pointer.nx : Math.sin(t * 0.3) * 0.6, 2.5, dt);
    light.y = damp(light.y, live ? -pointer.ny : Math.cos(t * 0.23) * 0.5, 2.5, dt);
    U.uLight.value.set(light.x, light.y);
    U.uHover.value = focus ? focus.k : -1;

    // the words, and the wing stepping back behind them
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    U.uShade.value.set((cr.left - hr.left - 20) * k, (H - (cr.bottom - hr.top) - 10) * k, (cr.right - hr.left + 20) * k, (H - (cr.top - hr.top) + 20) * k);
    U.uShadeK.value = 0.6 * Math.max(1 - smooth(0.03, 0.12, p), focus ? 1 : 0);
    hero.style.setProperty('--copy', String(1 - smooth(0.03, 0.12, p)));
    caps[0]?.style.setProperty('opacity', String(smooth(0.14, 0.22, p) * (1 - smooth(0.4, 0.46, p))));
    caps[1]?.style.setProperty('opacity', String(smooth(0.68, 0.76, p) * (1 - smooth(0.86, 0.9, p))));

    // the orbit being read: its disciplines named on their gilded scales, its name by the pointer
    discs.forEach((d, i) => {
      const on = focus && d.ring === focus.k ? 1 : 0;
      U.uDiscOn.value[i] = damp(U.uDiscOn.value[i], on, 8, dt);
      const [sx, sy] = toScreen(d.wp[0], d.wp[1]);
      const tg = discTags[i];
      tg.style.opacity = (U.uDiscOn.value[i] * (1 - smooth(0.2, 0.3, p))).toFixed(3);
      tg.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px)`;
    });
    tag.style.transform = `translate(${(pointer.x + 18).toFixed(1)}px, ${(pointer.y - 26).toFixed(1)}px)`;

    renderer.setRenderTarget(null);
    renderer.render(scene, cam);
  }

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  gsap.ticker.add(frame);

  if (local) window.__eye = { U, O, openUp, setFocus, tick: frame, renderer, get p() { return Ps; }, set p(v) { P = Ps = v; } };
}
