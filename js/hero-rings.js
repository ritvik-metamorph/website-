// Hero 5 of 6, "the emergence, in rings" (10 Nov): hero 4 as it was first built, kept as a variant of its
// own at the user's ask when hero 4 was reworked as a specimen (js/hero-emergence.js). Unlike the
// first cut it ends in the dark, since hero 6 follows. As first written:
// The user liked the thinking of hero 3 (the butterfly in the
// brief) and the look of hero 2 (sharp grain in the round, trackers, threads), and asked for the two
// together, better than 2 and not the book video's cards. So:
// - It opens on the seven orbits as rings of grain wound round a life, a cocoon hanging on one
//   thread, a veil of finer grain round it, the twenty-seven disciplines in trackers on their rings.
// - The scroll opens it. Every grain leaves on its own time, the inner orbits first, and spirals out
//   to its place on a butterfly made of the same grain: the seven rings settle as the seven bands of
//   the eyespots on its forewings, the veil becomes its wings, the axis its body.
// - Then the founder's grid shows as the wing's own veins: from each discipline, in its band, a
//   vein runs out to every sector it moves, the forty-eight named round the edge of the wings, like a
//   dial. A hundred and fifty-one veins.
// - Last it lifts away, and the room turns to the paper the services are printed on.
// Everything is drawn in code from the founder's atlas (js/atlas-data.js); the wing's outline is
// hero 3's (js/hero-eyespot.js). Hover a tracker, a sector or an orbit to read it; click to open its
// metrics (the light orb's panel, js/orb.js, through an 'mm:open' event).
import * as THREE from '../assets/vendor/three.module.min.js';
import { ATLAS } from './atlas-data.js';
import { NOTES } from './sectors-data.js';
import { FIELD_COL } from './orb-scene.js';
import { WING } from './hero-eyespot.js';

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
const firstSentence = (s) => (s.match(/^.*?[.!?](\s|$)/) || [s])[0].trim();
const pad2 = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------- the two shapes
// The cocoon, in world units: seven rings round the vertical, wider in the middle.
const C_GAP = 0.5;
const cocY = (k) => (k - 3) * C_GAP;
const cocR = (k) => 0.95 + 0.72 * Math.sin((Math.PI * (k + 0.6)) / 7.2);
const C_TUBE = 0.085;
// The butterfly, in hero 3's wing units (one scale's width) divided by a hundred, centred on its
// middle. Its eyespots are larger than hero 3's, so the seven orbits read at this distance.
const U = 0.01;
const EYE = [1.9, 1.15 - WING.MID[1] * U];
const ER = 0.8, CORE = 0.13, BAND = (1 - CORE) / 7;
const BASEW = [WING.BASE[0] * U, (WING.BASE[1] - WING.MID[1]) * U];
const FORE = WING.closedCurve(WING.FORE, 40).map((v) => [v.x * U, (v.y - WING.MID[1]) * U]);
const HIND = WING.closedCurve(WING.HIND, 40).map((v) => [v.x * U, (v.y - WING.MID[1]) * U]);
function inPoly(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i], [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
const inWing = (x, y) => inPoly(x, y, FORE) || inPoly(x, y, HIND);
const eyeE = (x, y) => Math.hypot(x - EYE[0], (y - EYE[1]) * 1.05) / ER;

const PT_VERT = /* glsl */ `
attribute vec4 aK; // kind (0 an orbit's grain, 1 the eyespot's core, 2 the veil and wings, 3 the body), orbit, side, tone
attribute vec4 aP; // an orbit's grain: angle round the ring, angle round the tube, distance from its centre, seed
attribute vec3 aA; // where the other grain sits in the cocoon
attribute vec2 aB; // where it lands: on the wing (x from the body, y), or on the body
uniform mat4 uCoc;
uniform mat4 uFly;
uniform float uRad[7];
uniform float uY[7];
uniform float uSpin[7];
uniform float uLit[7];
uniform vec3 uCol[7];
uniform float uLitWing;
uniform float uTime;
uniform float uGather;
uniform float uMorph;
uniform float uFlap;
uniform float uPx;
uniform vec2 uMouse;
uniform float uAspect;
uniform vec4 uShade;
uniform float uShadeK;
varying vec3 vC;
varying float vB;
float h1(float n) { return fract(sin(n * 91.3458) * 47453.5453); }
void main() {
  float kind = aK.x;
  int k = int(max(aK.y, 0.0) + 0.5);
  float side = aK.z, tone = aK.w, seed = aP.w;
  // in the cocoon
  vec3 A = aA;
  if (kind < 0.5) {
    float th = aP.x + uTime * uSpin[k];
    vec3 n = vec3(cos(th), 0.0, sin(th));
    A = n * uRad[k] + (n * cos(aP.y) + vec3(0.0, sin(aP.y), 0.0)) * aP.z + vec3(0.0, uY[k], 0.0);
  }
  A = (uCoc * vec4(A, 1.0)).xyz;
  // on the butterfly: the wings hinge on the body
  vec3 B = kind > 2.5 ? vec3(aB, 0.0) : vec3(side * aB.x * cos(uFlap), aB.y, -aB.x * sin(uFlap));
  B = (uFly * vec4(B, 1.0)).xyz;
  // each grain leaves on its own time, the inner orbits first, and spirals out round the axis
  float st = seed * 0.34 + (kind < 0.5 ? float(k) * 0.035 : kind > 2.5 ? 0.06 : 0.24);
  float s = smoothstep(st, st + 0.42, uMorph);
  vec3 P = mix(A, B, s);
  float sw = s * (1.0 - s) * 4.0;
  float ang = sw * (1.1 + 0.9 * fract(seed * 5.3)) * (fract(seed * 2.1) > 0.5 ? 1.0 : -1.0);
  float ca = cos(ang), sa = sin(ang);
  P.xz = mat2(ca, -sa, sa, ca) * P.xz;
  P.y += sw * 0.3 * sin(seed * 31.0);
  // before it opens: waiting in the dark as a loose cloud
  vec3 sc = normalize(vec3(h1(seed * 3.1) - 0.5, h1(seed * 7.7) - 0.5, h1(seed * 1.9) - 0.5) + 1e-4) * (3.5 + 7.0 * h1(seed * 5.5));
  float g = smoothstep(seed * 0.55, seed * 0.55 + 0.45, uGather);
  P = mix(sc, P, g);
  vec4 mv = viewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mv;
  // the grain parts round the pointer, a little
  vec2 sp = gl_Position.xy / gl_Position.w;
  vec2 dm = (sp - uMouse) * vec2(uAspect, 1.0);
  float push = 0.03 * smoothstep(0.15, 0.0, length(dm)) * g;
  gl_Position.xy += normalize(dm + 1e-5) / vec2(uAspect, 1.0) * push * gl_Position.w;
  float s2 = fract(seed * 7.137);
  gl_PointSize = uPx * (0.75 + 1.2 * s2 * s2) * clamp(5.5 / -mv.z, 0.5, 2.0);
  // its colour: an orbit's, deepening as it settles in the eyespot; the core warm white; the veil
  // and the wings a quiet warm grey, brighter on the veins and the edge; the body grey
  vec3 c;
  float lit = 1.0;
  if (kind < 0.5) { c = mix(mix(vec3(1.0, 0.98, 0.95), uCol[k], 0.55), uCol[k] * 1.2, s); lit = uLit[k]; }
  else if (kind < 1.5) { c = vec3(1.0, 0.92, 0.8); lit = uLit[0] * mix(0.12, 1.0, s); }
  else if (kind < 2.5) { c = vec3(0.8, 0.76, 0.7); lit = uLitWing * mix(0.14, 1.0, s); }
  else { c = vec3(0.74, 0.74, 0.76); lit = uLitWing * mix(0.12, 1.0, s); }
  vec2 sl = smoothstep(uShade.xy - 0.12, uShade.xy + 0.04, sp) * (1.0 - smoothstep(uShade.zw - 0.04, uShade.zw + 0.12, sp));
  vB = (0.24 + 0.76 * fract(seed * 13.71)) * tone * lit * mix(0.5, 1.0, g) * (1.0 - uShadeK * sl.x * sl.y);
  vC = c;
}`;
const PT_FRAG = /* glsl */ `
precision highp float;
uniform float uFade;
varying vec3 vC;
varying float vB;
void main() {
  vec2 q = abs(gl_PointCoord - 0.5);
  if (max(q.x, q.y) > 0.5) discard;
  gl_FragColor = vec4(vC * vB * uFade, 1.0);
}`;
const LN_VERT = /* glsl */ `
attribute vec4 aC;
attribute float aS;
varying vec4 vC;
varying float vS;
void main() { vC = aC; vS = aS; gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0); }`;
const LN_FRAG = /* glsl */ `
precision highp float;
uniform float uDraw;
uniform float uFade;
varying vec4 vC;
varying float vS;
void main() {
  if (vS > uDraw) discard;
  gl_FragColor = vec4(vC.rgb * vC.a * uFade, 1.0);
}`;

export function setupEmergenceRings({ lenis, reduced, isTouch, local }) {
  const stage = $('.stage-5');
  const hero = $('.hv-rings');
  if (!stage || !hero) return;
  const canvas = $('.hv-gl', hero);
  const labels = $('.hv-labels', hero);
  const card = $('.hv-card', hero);
  const copy = $('.hv-copy', hero);
  const caps = $$('.hv-caption', hero);

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { hero.classList.add('no-gl', 'is-words'); return; }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  const ROOM = new THREE.Color(0x030405);
  const PAPER = ROOM.clone(); // (not the last hero now: it ends in the dark)
  renderer.setClearColor(ROOM, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.05, 200);

  // ---------------------------------------------------------------- the founder's data

  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  const secAt = Object.fromEntries(ATLAS.sectors.map((s, i) => [s.id, i]));
  const sectors = ATLAS.sectors.map((s, i) => ({ ...s, i, links: [] }));
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) S.links.push({ d, f: l.f }); }));
  const famOrder = Object.keys(ATLAS.families);

  // the sectors round the edge of the wings, by family, half down the right and half down the left:
  // each at the wing's outermost point along a ray from the root
  const sorted = [...sectors].sort((a, b) => famOrder.indexOf(a.fam) - famOrder.indexOf(b.fam) || a.i - b.i);
  const half = Math.ceil(sorted.length / 2);
  sorted.forEach((S, n) => {
    const right = n < half, m = right ? n : n - half, cnt = right ? half : sorted.length - half;
    const phi = lerp(1.02, -1.36, (m + 0.5) / cnt);
    const ux = Math.cos(phi), uy = Math.sin(phi);
    let r = 4.2;
    while (r > 0.2 && !inWing(BASEW[0] + ux * r, BASEW[1] + uy * r)) r -= 0.015;
    S.side = right ? 1 : -1;
    S.w = [BASEW[0] + ux * r, BASEW[1] + uy * r];
    S.out = [ux, uy];
  });
  // each discipline on the eyespot of the side most of its sectors are on, in its orbit's band,
  // turned toward them, so its veins run outward
  discs.forEach((d, n) => {
    let r = 0, l = 0, mx = 0, my = 0;
    d.links.forEach((lk) => { const S = sectors[secAt[lk.s]]; if (S) { if (S.side > 0) r++; else l++; } });
    d.side = r === l ? (n % 2 ? 1 : -1) : r > l ? 1 : -1;
    d.links.forEach((lk) => { const S = sectors[secAt[lk.s]]; if (S && S.side === d.side) { mx += S.w[0] - EYE[0]; my += S.w[1] - EYE[1]; } });
    d.a = mx || my ? Math.atan2(my, mx) : n * 2.4;
  });
  // within a band on one eyespot, give each discipline room
  rings.forEach((_, k) => [1, -1].forEach((sd) => {
    const list = byRing[k].filter((d) => d.side === sd).sort((a, b) => a.a - b.a);
    for (let it = 0; it < 4; it++) for (let i = 1; i < list.length; i++) if (list[i].a - list[i - 1].a < 0.55) list[i].a = list[i - 1].a + 0.55;
  }));
  discs.forEach((d) => {
    const rr = ER * (CORE + (d.ring + 0.5) * BAND);
    d.w = [EYE[0] + Math.cos(d.a) * rr, EYE[1] + (Math.sin(d.a) * rr) / 1.05];
  });
  byRing.forEach((list, k) => list.forEach((d, j) => { d.ca = (j / list.length) * TAU + k * 0.83 + 0.35; }));

  // ---------------------------------------------------------------- the grain

  const nr0 = isNarrow(innerWidth, innerHeight);
  const PER = nr0 ? 6000 : 16000, NCORE = nr0 ? 1600 : 4000, NWING = nr0 ? 42000 : 110000, NBODY = nr0 ? 4000 : 9000;
  const N = PER * 7 + NCORE + NWING + NBODY;
  const aK = new Float32Array(N * 4), aP = new Float32Array(N * 4), aA = new Float32Array(N * 3), aB = new Float32Array(N * 2);
  let n = 0;
  const put = (kind, k, side, tone, p, A, B) => {
    aK.set([kind, k, side, tone], n * 4);
    aP.set(p, n * 4);
    aA.set(A, n * 3);
    aB.set(B, n * 2);
    n++;
  };
  // a point in an eyespot band (or the core), on the wing
  const inBand = (e0, e1) => {
    const e = Math.sqrt(lerp(e0 * e0, e1 * e1, Math.random())), a = Math.random() * TAU;
    return [EYE[0] + Math.cos(a) * e * ER, EYE[1] + (Math.sin(a) * e * ER) / 1.05];
  };
  for (let k = 0; k < 7; k++) {
    for (let i = 0; i < PER; i++) {
      const side = Math.random() < 0.5 ? 1 : -1;
      const tube = C_TUBE * (0.62 + 0.38 * Math.pow(Math.random(), 0.35));
      put(0, k, side, 1, [Math.random() * TAU, Math.random() * TAU, tube, Math.random()], [0, 0, 0], inBand(CORE + k * BAND, CORE + (k + 1) * BAND));
    }
  }
  // (the core and the body wait inside the cocoon, a faint fill, until it opens)
  const inside = () => { const u = Math.random() * TAU, v = Math.acos(2 * Math.random() - 1), rr = Math.cbrt(Math.random()) * 0.8; return [Math.sin(v) * Math.cos(u) * rr, Math.cos(v) * rr * 1.7, Math.sin(v) * Math.sin(u) * rr]; };
  for (let i = 0; i < NCORE; i++) {
    put(1, 0, Math.random() < 0.5 ? 1 : -1, 1.25, [0, 0, 0, Math.random()], inside(), inBand(0, CORE));
  }
  // the veil becomes the wings: most of it across the wing, more along the veins and the edge, none
  // in the eyespot (its black frame is the gap)
  const veins = [];
  for (let i = 0; i < 8; i++) veins.push(0.06 + i * 0.15 + 0.002 * i * i);
  for (let i = 0; i < 7; i++) veins.push(-0.12 - i * 0.215);
  const veilAt = () => {
    // a point on an egg round the cocoon
    const u = Math.random() * TAU, v = Math.acos(2 * Math.random() - 1);
    const rr = 1.25 + 0.25 * Math.random();
    return [Math.sin(v) * Math.cos(u) * rr * 1.1, Math.cos(v) * rr * 1.45, Math.sin(v) * Math.sin(u) * rr * 1.1];
  };
  const outline = [...FORE, ...HIND];
  for (let i = 0; i < NWING; i++) {
    const side = Math.random() < 0.5 ? 1 : -1;
    const kindR = Math.random();
    let x, y, tone = 0.42;
    if (kindR < 0.55) {
      do { x = Math.random() * 3.1; y = -2.75 + Math.random() * 5.2; } while (!inWing(x, y) || eyeE(x, y) < 1.12);
    } else if (kindR < 0.83) {
      let ok = false;
      while (!ok) {
        const a = veins[Math.floor(Math.random() * veins.length)];
        const r = 0.3 + Math.random() * 3.8;
        x = BASEW[0] + Math.cos(a) * r + (Math.random() - 0.5) * 0.012;
        y = BASEW[1] + Math.sin(a) * r + (Math.random() - 0.5) * 0.012;
        ok = inWing(x, y) && eyeE(x, y) > 1.12;
      }
      tone = 0.85;
    } else {
      const j = Math.floor(Math.random() * outline.length), poly = j < FORE.length ? FORE : HIND;
      const jj = j < FORE.length ? j : j - FORE.length;
      const p0 = poly[jj], p1 = poly[(jj + 1) % poly.length], t = Math.random();
      x = lerp(p0[0], p1[0], t); y = lerp(p0[1], p1[1], t);
      // pulled a hair inward, toward the root
      const dx = BASEW[0] - x, dy = BASEW[1] - y, dl = Math.hypot(dx, dy) || 1;
      const inw = Math.random() * 0.03;
      x += (dx / dl) * inw; y += (dy / dl) * inw;
      tone = 1.05;
    }
    put(2, -1, side, tone, [0, 0, 0, Math.random()], veilAt(), [x, y]);
  }
  // the axis becomes the body, its head and its antennae
  for (let i = 0; i < NBODY; i++) {
    const f = Math.random();
    let bx, by;
    if (f < 0.32) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); bx = Math.cos(a) * r * 0.13; by = 0.56 + Math.sin(a) * r * 0.48; }
    else if (f < 0.78) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); bx = Math.cos(a) * r * 0.085; by = -0.72 + Math.sin(a) * r * 1.06; }
    else if (f < 0.86) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); bx = Math.cos(a) * r * 0.12; by = 1.14 + Math.sin(a) * r * 0.12; }
    else { const t = Math.random(), sd = Math.random() < 0.5 ? 1 : -1; bx = sd * lerp(0.04, 0.52, t); by = lerp(1.22, 2.56, t) + (t > 0.94 ? (Math.random() - 0.5) * 0.06 : 0); }
    put(3, -1, 0, 0.9, [0, 0, 0, Math.random()], inside(), [bx, by - WING.MID[1] * U]);
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  ptGeo.setAttribute('aK', new THREE.BufferAttribute(aK, 4));
  ptGeo.setAttribute('aP', new THREE.BufferAttribute(aP, 4));
  ptGeo.setAttribute('aA', new THREE.BufferAttribute(aA, 3));
  ptGeo.setAttribute('aB', new THREE.BufferAttribute(aB, 2));
  const coc = new THREE.Object3D(), fly = new THREE.Object3D();
  scene.add(coc, fly);
  const PU = {
    uCoc: { value: coc.matrixWorld }, uFly: { value: fly.matrixWorld },
    uRad: { value: rings.map((_, k) => cocR(k)) }, uY: { value: rings.map((_, k) => cocY(k)) },
    uSpin: { value: rings.map((_, k) => (k % 2 ? -1 : 1) * (0.05 + 0.012 * k)) },
    uLit: { value: new Array(7).fill(1) }, uCol: { value: FIELD_COL.map((c) => new THREE.Vector3(...c)) }, uLitWing: { value: 1 },
    uTime: { value: 0 }, uGather: { value: reduced ? 1 : 0 }, uMorph: { value: 0 }, uFlap: { value: 0 },
    uPx: { value: dpr * 0.85 }, uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: 1 },
    uShade: { value: new THREE.Vector4(9, 9, 9, 9) }, uShadeK: { value: 0 }, uFade: { value: 1 },
  };
  const points = new THREE.Points(ptGeo, new THREE.ShaderMaterial({ vertexShader: PT_VERT, fragmentShader: PT_FRAG, uniforms: PU, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  points.frustumCulled = false;
  scene.add(points);

  // ---------------------------------------------------------------- lines: the thread it hangs on, the rails, the veins

  const lineMat = (U2) => new THREE.ShaderMaterial({ vertexShader: LN_VERT, fragmentShader: LN_FRAG, uniforms: U2, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
  // the cocoon's rails, each with the forty-eight ticks of the grid, lit where its disciplines act
  const tickLit = rings.map(() => new Array(sectors.length).fill(0));
  discs.forEach((d) => d.links.forEach((l) => { const j = secAt[l.s]; if (j != null) tickLit[d.ring][j]++; }));
  const railPos = [], railCol = [], railS = [];
  rings.forEach((_, k) => {
    const R = cocR(k) + 0.12, y = cocY(k), c = FIELD_COL[k], SEG = 160;
    for (let i = 0; i < SEG; i++) {
      const a0 = (i / SEG) * TAU, a1 = ((i + 1) / SEG) * TAU;
      railPos.push(Math.cos(a0) * R, y, Math.sin(a0) * R, Math.cos(a1) * R, y, Math.sin(a1) * R);
      railCol.push(...c, 0.3, ...c, 0.3); railS.push(0, 0);
    }
    for (let j = 0; j < sectors.length; j++) {
      const a = (j / sectors.length) * TAU, lit = tickLit[k][j], len = lit ? 0.04 + 0.02 * lit : 0.018;
      const x = Math.cos(a) * R, z = Math.sin(a) * R;
      railPos.push(x, y - len, z, x, y + len, z);
      const cc = lit ? [1, 0.97, 0.92] : c, al = lit ? 0.9 : 0.28;
      railCol.push(...cc, al, ...cc, al); railS.push(0, 0);
    }
  });
  // and the thread it hangs from
  railPos.push(0, cocY(6) + 0.2, 0, 0, 14, 0);
  railCol.push(0.85, 0.87, 0.9, 0.6, 0.85, 0.87, 0.9, 0.6); railS.push(0, 0);
  const railGeo = new THREE.BufferGeometry();
  railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3));
  railGeo.setAttribute('aC', new THREE.Float32BufferAttribute(railCol, 4));
  railGeo.setAttribute('aS', new THREE.Float32BufferAttribute(railS, 1));
  const RU = { uDraw: { value: 1 }, uFade: { value: 0 } };
  const railLines = new THREE.LineSegments(railGeo, lineMat(RU));
  railLines.frustumCulled = false;
  scene.add(railLines);
  // (the line shader takes world positions: the rails are turned with the cocoon each frame, below)
  const railWorld = new Float32Array(railPos.length);
  const railWorldAttr = new THREE.BufferAttribute(railWorld, 3).setUsage(THREE.DynamicDrawUsage);
  railGeo.setAttribute('position', railWorldAttr);

  // the veins: from each discipline, in its band, to every sector it moves
  const veinList = [];
  discs.forEach((d) => d.links.forEach((l) => { const j = secAt[l.s]; if (j != null) veinList.push({ d, S: sectors[j], n: veinList.length }); }));
  const VSEG = 16;
  const vPos = new Float32Array(veinList.length * VSEG * 2 * 3), vCol = new Float32Array(veinList.length * VSEG * 2 * 4), vS = new Float32Array(veinList.length * VSEG * 2);
  const veinGeo = new THREE.BufferGeometry();
  veinGeo.setAttribute('position', new THREE.BufferAttribute(vPos, 3).setUsage(THREE.DynamicDrawUsage));
  veinGeo.setAttribute('aC', new THREE.BufferAttribute(vCol, 4).setUsage(THREE.DynamicDrawUsage));
  veinGeo.setAttribute('aS', new THREE.BufferAttribute(vS, 1));
  const VU = { uDraw: { value: 0 }, uFade: { value: 1 } };
  const veinLines = new THREE.LineSegments(veinGeo, lineMat(VU));
  veinLines.frustumCulled = false;
  scene.add(veinLines);

  // where a wing point (x from the body, y) is in the world this frame
  const wv = new THREE.Vector3();
  const onWing = (x, y, side, out = wv) => out.set(side * x * Math.cos(PU.uFlap.value), y, -x * Math.sin(PU.uFlap.value)).applyMatrix4(fly.matrixWorld);
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3();
  function layVeins() {
    veinList.forEach((v) => {
      const { d, S } = v;
      const same = d.side === S.side;
      // on the same wing the vein is a curve on the wing itself; to the other wing it runs through the body
      for (let s = 0; s < VSEG; s++) {
        for (let e = 0; e < 2; e++) {
          const u = (s + e) / VSEG, iu = 1 - u;
          const idx = (v.n * VSEG + s) * 2 + e;
          if (same) {
            const mx = lerp(d.w[0], S.w[0], 0.45) + (S.w[1] - d.w[1]) * 0.12, my = lerp(d.w[1], S.w[1], 0.45) - (S.w[0] - d.w[0]) * 0.12;
            const x = iu * iu * d.w[0] + 2 * iu * u * mx + u * u * S.w[0];
            const y = iu * iu * d.w[1] + 2 * iu * u * my + u * u * S.w[1];
            onWing(x, y, d.side, tC);
          } else {
            onWing(d.w[0], d.w[1], d.side, tA);
            onWing(S.w[0], S.w[1], S.side, tB);
            const cx = (tA.x + tB.x) * 0.1, cy = (tA.y + tB.y) * 0.5 - 0.2, cz = (tA.z + tB.z) * 0.5 + 0.35;
            tC.set(iu * iu * tA.x + 2 * iu * u * cx + u * u * tB.x, iu * iu * tA.y + 2 * iu * u * cy + u * u * tB.y, iu * iu * tA.z + 2 * iu * u * cz + u * u * tB.z);
          }
          vPos[idx * 3] = tC.x; vPos[idx * 3 + 1] = tC.y; vPos[idx * 3 + 2] = tC.z;
          vS[idx] = u;
        }
      }
    });
    veinGeo.attributes.position.needsUpdate = true;
    veinGeo.attributes.aS.needsUpdate = true;
  }

  // ---------------------------------------------------------------- the words in the world

  const trackers = discs.map((d) => {
    const t = el('span', 'hg-tk');
    t.append(el('span', 'hg-tk-box'), el('span', 'hg-tk-n', pad2(d.i + 1)), el('span', 'hg-tk-name', d.name));
    labels.append(t);
    return t;
  });
  const secTags = sectors.map((S) => {
    const t = el('span', `hx-sec ${S.side > 0 ? 'is-r' : 'is-l'}`);
    t.append(el('span', 'hx-sec-name', NOTES[S.id]?.short || S.name), el('span', 'hx-sec-n', String(S.links.length)));
    labels.append(t);
    return t;
  });

  // ---------------------------------------------------------------- what is pointed at

  let focus = null;
  const same = (a, b) => (!a && !b) || (a && b && a.kind === b.kind && a.k === b.k && a.i === b.i && a.j === b.j);
  function fillCard(f) {
    card.textContent = '';
    const k = f.kind === 'field' ? f.k : f.kind === 'disc' ? discs[f.i].ring : -1;
    const head = el('p', 'hc-k');
    if (k >= 0) { const sw = el('span', 'hc-sw'); sw.style.background = rgb(FIELD_COL[k], 0.95); head.append(sw); }
    if (f.kind === 'field') {
      head.append(el('span', null, `Orbit ${ROMAN[k]}`));
      card.append(head, el('p', 'hc-name', rings[k].name), el('p', 'hc-note', rings[k].note), el('p', 'hc-list', byRing[k].map((d) => d.name).join(' · ')));
    } else if (f.kind === 'disc') {
      const d = discs[f.i];
      head.append(el('span', null, `Orbit ${ROMAN[k]} · ${rings[k].name}`));
      card.append(head, el('p', 'hc-name', d.name), el('p', 'hc-note', firstSentence(d.gist)), el('p', 'hc-list', `Moves ${d.links.length} of 48: ${d.links.map((l) => sectors[secAt[l.s]]?.name).filter(Boolean).join(', ')}.`));
    } else {
      const S = sectors[f.j];
      head.append(el('span', null, `A sector · ${ATLAS.families[S.fam] || ''}`));
      card.append(head, el('p', 'hc-name', S.name), el('p', 'hc-note', S.links.length ? `Moved by ${S.links.length} ${S.links.length === 1 ? 'discipline' : 'disciplines'}.` : 'Not yet mapped in the atlas.'), el('p', 'hc-list', S.links.map((l) => `${l.d.name} ${ATLAS.forces[l.f]?.label || l.f} it`).join(' · ')));
    }
  }
  function setFocus(f) {
    if (same(f, focus)) return;
    focus = f;
    if (f) fillCard(f);
    card.classList.toggle('is-on', !!f);
    hero.classList.toggle('is-reading', !!f);
    canvas.style.cursor = f ? 'pointer' : '';
  }
  const discOn = (d) => !focus || (focus.kind === 'field' ? d.ring === focus.k : focus.kind === 'disc' ? d.i === focus.i : sectors[focus.j].links.some((l) => l.d === d));
  const sectorOn = (S) => !focus || (focus.kind === 'sector' ? S.i === focus.j : focus.kind === 'disc' ? S.links.some((l) => l.d.i === focus.i) : S.links.some((l) => l.d.ring === focus.k));
  const veinOn = (v) => (focus ? (focus.kind === 'sector' ? v.S.i === focus.j : focus.kind === 'disc' ? v.d.i === focus.i : v.d.ring === focus.k) : false);

  // ---------------------------------------------------------------- size, the opening, the scroll

  const view = { W: 1, H: 1, narrow: false };
  function layout() {
    const W = hero.clientWidth, H = hero.clientHeight;
    Object.assign(view, { W, H, narrow: isNarrow(W, H) });
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = view.narrow ? 46 : 36;
    camera.updateProjectionMatrix();
    PU.uAspect.value = W / H;
  }
  const O = { gather: reduced ? 1 : 0, rails: reduced ? 1 : 0, tags: reduced ? 1 : 0 };
  let opened = reduced;
  function openUp() {
    if (opened) return;
    opened = true;
    gsap.timeline()
      .to(O, { gather: 1, duration: 3.2, ease: 'power3.out' }, 0)
      .to(O, { rails: 1, duration: 1.6, ease: 'power2.out' }, 1.5)
      .to(O, { tags: 1, duration: 1.2, ease: 'power2.out' }, 2.2)
      .add(() => hero.classList.add('is-words'), 2.1);
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
    lenis.scrollTo(stage.offsetTop + (stage.offsetHeight - innerHeight) * 0.66, { duration: 2.8 });
  });

  // ---------------------------------------------------------------- the pointer

  const pointer = { x: -999, y: -999, nx: 0, ny: 0, in: false };
  const proj = new THREE.Vector3();
  const toScreen = (p) => { proj.copy(p).project(camera); return [(proj.x * 0.5 + 0.5) * view.W, (-proj.y * 0.5 + 0.5) * view.H, proj.z]; };
  const screen = { discs: [], sectors: [], rings: [] };
  function pick(x, y) {
    if (O.tags < 0.5 || Ps > 0.88) return null;
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    if (!focus && Ps < 0.1 && x > cr.left - hr.left && x < cr.right - hr.left && y > cr.top - hr.top && y < cr.bottom - hr.top) return null;
    const reach = isTouch ? 24 : 14;
    let best = null, bd = reach;
    screen.discs.forEach(([sx, sy, z], i) => { if (z < 1) { const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = { kind: 'disc', i }; } } });
    if (best) return best;
    bd = reach + 6;
    if (secA > 0.4) screen.sectors.forEach(([sx, sy, z], j) => { if (z < 1) { const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = { kind: 'sector', j }; } } });
    if (best) return best;
    bd = reach;
    screen.rings.forEach((pts, k) => pts.forEach(([sx, sy, z]) => { if (z < 1) { const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = { kind: 'field', k }; } } }));
    return best;
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
    const f = pick(x, y);
    if (!f) { setFocus(null); return; }
    if (isTouch && !same(f, focus)) { setFocus(f); return; }
    dispatchEvent(new CustomEvent('mm:open', { detail: f }));
  });

  // ---------------------------------------------------------------- the frame

  const camPos = new THREE.Vector3(), camAim = new THREE.Vector3();
  const lit = { rings: new Array(7).fill(1), discs: new Array(discs.length).fill(1), sectors: new Array(sectors.length).fill(1), wing: 1 };
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const clear = new THREE.Color();
  let secA = 0;
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
    const nr = view.narrow;

    // the story: the cocoon, opening as you scroll, its grain spiralling out to the butterfly; the
    // veins; then it lifts away and the room turns to paper
    const morph = smooth(0.08, 0.52, p);
    const formed = smooth(0.4, 0.56, p);
    secA = smooth(0.54, 0.7, p);
    const lift = smooth(0.86, 1, p);
    const white = smooth(0.92, 0.995, p);

    // the cocoon turns slowly on its thread; the butterfly breathes its wings, and beats them as it lifts
    coc.rotation.set(0.02 * Math.sin(t * 0.3), t * 0.06, 0.03 * Math.sin(t * 0.21));
    fly.position.set(0, 0.1 + lift * 7.5, 0);
    fly.rotation.set(-0.16 + 0.05 * Math.sin(t * 0.4) - lift * 0.3, 0.06 * Math.sin(t * 0.17), 0);
    const flap = formed * (0.16 + 0.1 * Math.sin(t * 1.05)) + lift * (0.35 + 0.45 * Math.abs(Math.sin(t * 7)));
    PU.uFlap.value = flap;
    scene.updateMatrixWorld();

    // the camera: close among the cocoon's rings, seen a little from above; drawing back to the
    // front of the butterfly as it opens; the pointer turns it a little
    const live = pointer.in && !isTouch;
    const pxn = live ? pointer.nx : 0, pyn = live ? pointer.ny : 0;
    const d0 = nr ? 7.6 : 5.6, d1 = nr ? 16.5 : 12;
    const dist = lerp(d0, d1, smooth(0.04, 0.5, p));
    const ang = lerp(0.65, 0, smooth(0.1, 0.5, p)) + pxn * 0.12;
    const camY = lerp(0.8, 0.15, smooth(0.08, 0.5, p)) - pyn * 0.3;
    camPos.set(Math.sin(ang) * dist, camY, Math.cos(ang) * dist);
    // (opened, it sits a little high, leaving the foot of the frame for the caption)
    camAim.set(0, lerp(0.1, nr ? -0.9 : -0.35, morph), 0);
    camera.position.lerp(camPos, reduced ? 1 : 1 - Math.exp(-6 * dt));
    if (!frame.once) { camera.position.copy(camPos); frame.once = true; }
    camera.lookAt(camAim);

    // light, and what is looked at
    const fk = focus?.kind === 'field' ? focus.k : focus?.kind === 'disc' ? discs[focus.i].ring : -1;
    for (let k = 0; k < 7; k++) {
      const want = !focus ? 1 : fk === k ? 1.7 : focus.kind === 'sector' ? (byRing[k].some((d) => sectors[focus.j].links.some((l) => l.d === d)) ? 1.2 : 0.4) : 0.35;
      lit.rings[k] = damp(lit.rings[k], want, 7, dt);
      PU.uLit.value[k] = lit.rings[k];
    }
    lit.wing = damp(lit.wing, focus ? 0.6 : 1, 6, dt);
    PU.uLitWing.value = lit.wing;
    const fade = 1 - white;
    PU.uTime.value = t;
    PU.uGather.value = O.gather;
    PU.uMorph.value = morph;
    PU.uFade.value = fade;
    PU.uPx.value = dpr * (nr ? 0.9 : 0.85);
    PU.uMouse.value.set(live ? pointer.nx : 9, live ? -pointer.ny : 9);
    clear.copy(ROOM).lerp(PAPER, white);
    renderer.setClearColor(clear, 1);

    // the rails and the thread go as the cocoon opens
    const railA = O.rails * (1 - smooth(0.08, 0.26, p));
    RU.uFade.value = railA;
    for (let i = 0; i < railPos.length; i += 3) {
      tmp.set(railPos[i], railPos[i + 1], railPos[i + 2]).applyMatrix4(coc.matrixWorld);
      railWorld[i] = tmp.x; railWorld[i + 1] = tmp.y; railWorld[i + 2] = tmp.z;
    }
    railWorldAttr.needsUpdate = true;

    // the veins let out once it has opened; a looked-at one in its orbit's colour
    VU.uDraw.value = focus && formed > 0.9 ? 1.02 : secA * 1.02;
    VU.uFade.value = fade * (1 - lift * 0.8);
    layVeins();
    veinList.forEach((v) => {
      const on = veinOn(v);
      const a = focus ? (on ? 0.95 : 0.04) : 0.26;
      const c = on ? FIELD_COL[v.d.ring] : [0.88, 0.86, 0.82];
      for (let i = v.n * VSEG * 2; i < (v.n + 1) * VSEG * 2; i++) { vCol[i * 4] = c[0]; vCol[i * 4 + 1] = c[1]; vCol[i * 4 + 2] = c[2]; vCol[i * 4 + 3] = a; }
    });
    veinGeo.attributes.aC.needsUpdate = true;

    // the words over it: the grain steps back behind them
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    PU.uShade.value.set(((cr.left - hr.left - 20) / view.W) * 2 - 1, 1 - ((cr.bottom - hr.top + 10) / view.H) * 2, ((cr.right - hr.left + 20) / view.W) * 2 - 1, 1 - ((cr.top - hr.top - 20) / view.H) * 2);
    PU.uShadeK.value = 0.7 * Math.max(1 - smooth(0.03, 0.12, p), focus ? 1 : 0);
    const copyOn = (1 - smooth(0.03, 0.12, p)) * (focus ? 0 : 1);
    const inCopy = (x, y) => copyOn * smooth(cr.left - hr.left - 30, cr.left - hr.left + 10, x) * (1 - smooth(cr.right - hr.left - 10, cr.right - hr.left + 30, x)) * smooth(cr.top - hr.top - 30, cr.top - hr.top + 10, y);

    // the trackers ride their disciplines: on the rings, then out to their bands on the eyespots
    screen.discs = discs.map((d, i) => {
      const st = 0.17 + d.ring * 0.035;
      const s = smooth(st, st + 0.42, morph);
      const R = cocR(d.ring) + 0.12;
      tmp.set(Math.cos(d.ca + t * PU.uSpin.value[d.ring]) * R, cocY(d.ring), Math.sin(d.ca + t * PU.uSpin.value[d.ring]) * R).applyMatrix4(coc.matrixWorld);
      onWing(d.w[0], d.w[1], d.side, tmp2);
      tmp.lerp(tmp2, s);
      const sp = toScreen(tmp);
      const on = discOn(d);
      lit.discs[i] = damp(lit.discs[i], on ? 1 : 0.16, 8, dt);
      // in the cocoon, the far side of the rings is dimmer; between the two shapes they rest
      const toAxis = Math.hypot(camera.position.x, camera.position.z);
      const far = (1 - s) * clamp((Math.hypot(tmp.x - camera.position.x, tmp.z - camera.position.z) - toAxis + 1) / 2, 0, 1);
      const travel = 1 - Math.sin(Math.PI * s) * 0.85;
      const op = O.tags * lit.discs[i] * (1 - 0.7 * far) * travel * fade * (1 - lift) * (1 - 0.9 * inCopy(sp[0], sp[1])) * (sp[2] < 1 ? 1 : 0);
      const tk = trackers[i];
      tk.style.opacity = op.toFixed(3);
      tk.style.transform = `translate(${sp[0].toFixed(1)}px, ${sp[1].toFixed(1)}px)`;
      // once on the wing, a discipline is named only while it, its orbit or a sector it moves is read
      tk.classList.toggle('is-on', !!focus && on);
      tk.classList.toggle('is-quiet', s > 0.5 && !(focus && on));
      return sp;
    });
    // the sectors round the wings' edge, named outward; behind a read card they step back
    const kr = focus ? card.getBoundingClientRect() : null;
    const underCard = (x, y) => (kr ? smooth(kr.left - hr.left - 40, kr.left - hr.left, x) * (1 - smooth(kr.right - hr.left, kr.right - hr.left + 40, x)) * smooth(kr.top - hr.top - 30, kr.top - hr.top, y) * (1 - smooth(kr.bottom - hr.top, kr.bottom - hr.top + 30, y)) : 0);
    screen.sectors = sectors.map((S, j) => {
      onWing(S.w[0], S.w[1], S.side, tmp);
      const sp = toScreen(tmp);
      onWing(S.w[0] + S.out[0] * 0.12, S.w[1] + S.out[1] * 0.12, S.side, tmp2);
      const lp = toScreen(tmp2);
      const on = sectorOn(S);
      lit.sectors[j] = damp(lit.sectors[j], on ? 1 : 0.22, 8, dt);
      const tg = secTags[j];
      const show = nr ? (focus && on ? 1 : 0) : 1;
      tg.style.opacity = (secA * lit.sectors[j] * show * fade * (1 - lift) * (1 - 0.92 * underCard(lp[0], lp[1]))).toFixed(3);
      tg.style.transform = `translate(${lp[0].toFixed(1)}px, ${lp[1].toFixed(1)}px)`;
      return sp;
    });
    // the orbits, to point at: the rings while it is a cocoon, the eyespots' bands once it has opened
    screen.rings = rings.map((_, k) => {
      const out = [];
      if (morph < 0.5) {
        const R = cocR(k) + 0.12;
        for (let j = 0; j < 24; j++) { const a = (j / 24) * TAU; tmp.set(Math.cos(a) * R, cocY(k), Math.sin(a) * R).applyMatrix4(coc.matrixWorld); out.push(toScreen(tmp)); }
      } else {
        const rr = ER * (CORE + (k + 0.5) * BAND);
        [1, -1].forEach((sd) => { for (let j = 0; j < 18; j++) { const a = (j / 18) * TAU; onWing(EYE[0] + Math.cos(a) * rr, EYE[1] + (Math.sin(a) * rr) / 1.05, sd, tmp); out.push(toScreen(tmp)); } });
      }
      return out;
    });

    hero.style.setProperty('--copy', String(1 - smooth(0.03, 0.12, p)));
    caps[0]?.style.setProperty('opacity', String(smooth(0.12, 0.2, p) * (1 - smooth(0.34, 0.4, p))));
    caps[1]?.style.setProperty('opacity', String(smooth(0.64, 0.72, p) * (1 - smooth(0.84, 0.88, p))));

    renderer.render(scene, camera);
  }

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  gsap.ticker.add(frame);

  if (local) window.__rings = { scene, camera, renderer, O, PU, sectors, discs, openUp, setFocus, pick, tick: frame, get screen() { return screen; }, get p() { return Ps; }, set p(v) { P = Ps = v; } };
}
