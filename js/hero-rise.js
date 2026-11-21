// Hero 9, "the ascent, in grain" (20 Nov): the user's combination of heroes 7 and 8. Hero 7's idea and journey, hero
// 8's orbits:
// - The seven orbits are hero 7's rising spiral, a turn each from the ground of being at the foot to the return at the
//   top, but each turn is one of hero 8's bands of fine grain, as wide as the disciplines it holds, in hero 8's silver.
//   From the disciplines, streams of grain run up to the crown of forty-eight sectors above the top, and back down
//   from it again (the user: the particles leave the circle at the top and come back into it).
// - The journey (the user's): it opens at the very foot, the camera looking straight up the middle of the spiral, and
//   nothing else on the screen but a cue to scroll. The scroll climbs the middle, the turns passing all round, out
//   through the crown; there the camera flips over to look straight down, and while it draws back to hero 8's angle the
//   spiral spreads and settles into hero 8's orbits, flat, round one centre: the turns of a life become its orbits.
// - Only then the words: "Metamorph Capital", the firm's sentence under it, the four numbers of the atlas at the top
//   left, "What's Metamorph?" at the top right, to About.
// Drag turns it, at any point. Everything is drawn in code from the founder's atlas (js/atlas-data.js).
import * as THREE from '../assets/vendor/three.module.min.js';
import { ATLAS } from './atlas-data.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);

// ---------------------------------------------------------------- the spiral (hero 7's, kept in step with the shader)
const LOOPS = 7, PITCH = 1.3;
const helR = (u) => 3.4 + 0.5 * Math.sin(u * 1.27 + 0.4);
const helAt = (u, out) => out.set(Math.cos(u * TAU) * helR(u), (u - LOOPS / 2) * PITCH, Math.sin(u * TAU) * helR(u));
const TOP = (LOOPS / 2) * PITCH;
const CROWN_Y = TOP + 2.3, CROWN_R = 2.3;
// ---------------------------------------------------------------- hero 8's orbits, flat, in the same units
// (hero 8 sets them as shares of a half-width; here the half-width is five units)
const HALF = 5;
const R8 = (k) => (0.24 + k * 0.105) * HALF;
const BAND8 = (n) => (0.018 + 0.0078 * n) * HALF;
// (20 Nov, the user: on the flat orbits the sectors' circle read as one more orbit; it stands above them, a ring of its
// own the streams fly up to, a little inside the outermost orbit, as hero 7's crown is above its spiral)
const CROWN8 = 0.78 * HALF, CROWN8_Y = 2.8;
const SPEED8 = (k) => (k % 2 ? -1 : 1) * (0.035 + 0.035 * (6 - k) / 6);
// the end of the flip: hero 8's angle, the orbits seen a little from above (its tilt, .42)
const SETTLE_PITCH = Math.PI / 2 + Math.asin(0.42);

const GLSL = /* glsl */ `
const float TAU = 6.28318531;
const float PI = 3.14159265;
const float LOOPS = ${LOOPS}.0;
const float PITCH = ${PITCH};
const float CROWN8 = ${CROWN8.toFixed(3)};
const float CROWN8_Y = ${CROWN8_Y.toFixed(3)};
float helR(float u) { return 3.4 + 0.5 * sin(u * 1.27 + 0.4); }
vec3 helAt(float u) { return vec3(cos(u * TAU) * helR(u), (u - LOOPS * 0.5) * PITCH, sin(u * TAU) * helR(u)); }
// (each orbit settles a little after the one inside it)
float settleK(float k, float c) { return smoothstep(k * 0.05, k * 0.05 + 0.7, c); }
`;

// the orbits: each grain goes round its orbit; spiralled, its orbit is a turn of the spiral, flat, a ring round the centre
const RING_VERT = /* glsl */ `
${GLSL}
attribute vec4 aR; // orbit, its angle, across the band (-1..1), its height in the band
attribute vec4 aS; // size, seed, its own small difference in speed, the band's width
uniform float uTime, uC, uReveal, uPx, uFogNear, uFogFar;
uniform float uSpeed[7];
uniform float uRad[7];
uniform float uLit[7];
uniform vec3 uBase;
varying vec3 vC;
void main() {
  int k = int(aR.x + 0.5);
  float a = aR.y + uSpeed[k] * uTime * aS.z;
  float u = aR.x + fract(a / TAU);
  vec3 c = helAt(u);
  vec3 nh = normalize(vec3(c.x, 0.0, c.z));
  vec3 ps = c + nh * (aR.z * aS.w * 0.5) + vec3(0.0, aR.w * aS.w * 0.18, 0.0);
  float rr = uRad[k] + aR.z * aS.w * 0.5;
  vec3 pf = vec3(cos(a) * rr, aR.w * aS.w * 0.18, sin(a) * rr);
  vec3 p = mix(ps, pf, settleK(aR.x, uC));
  // the turns come in from the foot up as the hero opens
  float rv = smoothstep(u / LOOPS * 0.8, u / LOOPS * 0.8 + 0.2, uReveal);
  p += nh * (1.0 - rv) * (1.5 + 2.0 * aS.y) + vec3(0.0, (1.0 - rv) * -0.8, 0.0);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = max(1.0, uPx * aS.x * clamp(6.5 / -mv.z, 0.8, 1.8));
  float fog = (1.0 - smoothstep(uFogNear, uFogFar, -mv.z)) * smoothstep(0.25, 0.9, -mv.z);
  float far = 1.0 + 0.5 * smoothstep(6.0, 14.0, -mv.z);
  vC = uBase * (0.3 + 0.62 * fract(aS.y * 13.71)) * 0.62 * rv * fog * far * uLit[k];
}`;
// the disciplines: brighter points riding their orbits
const DISC_VERT = /* glsl */ `
${GLSL}
attribute vec3 aSp; // spiralled
attribute vec4 aFl; // flat: x, z, orbit, -
attribute float aLit;
uniform float uC, uReveal, uPx;
varying vec3 vC;
void main() {
  vec3 p = mix(aSp, vec3(aFl.x, 0.0, aFl.y), settleK(aFl.z, uC));
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (2.6 + 1.6 * aLit) * clamp(8.0 / -mv.z, 0.8, 1.6) * uReveal;
  vC = vec3(1.0, 0.95, 0.86) * (0.35 + 0.65 * aLit) * uReveal * smoothstep(0.4, 1.2, -mv.z);
}`;
// the streams: grain running from a discipline up to a sector it moves, and back down again; spiralled, a curve up
// to the crown over the top, flat, hero 8's spiral out from the orbit to the crown round it
const STREAM_VERT = /* glsl */ `
${GLSL}
attribute vec3 aA;
attribute vec3 aM;
attribute vec3 aB;
attribute vec4 aF; // flat: the discipline's angle, its orbit's radius, the sector's angle, its orbit
attribute vec4 aI; // its discipline, its sector, its orbit, a seed
uniform float uTime, uShow, uC, uPx, uFogNear, uFogFar;
uniform vec4 uFocus; // what is pointed at: kind (0 nothing, 1 an orbit, 2 a discipline, 3 a sector), which
uniform vec3 uBase;
varying vec3 vC;
void main() {
  float t = fract(aI.w * 9.13 + uTime * (0.045 + 0.04 * fract(aI.w * 3.7)));
  // (half of it comes back down: out of the circle at the top and back into it)
  float e = mix(t, 1.0 - t, step(0.5, fract(aI.w * 7.31)));
  float it = 1.0 - e;
  vec3 ps = it * it * aA + 2.0 * it * e * aM + e * e * aB;
  float ee = e * e * (3.0 - 2.0 * e);
  float da = mod(aF.z - aF.x + PI * 3.0, TAU) - PI;
  float a = aF.x + da * ee + 0.5 * sin(PI * ee);
  float rr = mix(aF.y, CROWN8, ee) + 0.6 * sin(PI * ee);
  // (they leave their orbit and fly up to the sectors' ring, high over the rest)
  vec3 pf = vec3(cos(a) * rr, CROWN8_Y * (1.0 - (1.0 - ee) * (1.0 - ee)), sin(a) * rr);
  vec3 p = mix(ps, pf, settleK(aF.w, uC));
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  // (what is pointed at: its streams stand out, the rest sink back, as in hero 7)
  float on = 1.0;
  if (uFocus.x > 0.5) {
    float idx = uFocus.x < 1.5 ? aI.z : uFocus.x < 2.5 ? aI.x : aI.y;
    on = abs(idx - uFocus.y) < 0.5 ? 2.2 : 0.08;
  }
  gl_PointSize = max(1.0, uPx * (0.8 + 0.7 * fract(aI.w * 5.3)) * clamp(4.5 / -mv.z, 0.6, 1.4) * (on > 1.5 ? 1.25 : 1.0));
  float fog = (1.0 - smoothstep(uFogNear, uFogFar, -mv.z)) * smoothstep(0.8, 2.6, -mv.z);
  float ends = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.9, t);
  float shown = smoothstep(e - 0.1, e, uShow * 1.1);
  vC = uBase * 0.5 * on * ends * shown * fog;
}`;
// the crown: the forty-eight sectors round a fine ring of grain, over the top; flat, round all the orbits
const CROWN_VERT = /* glsl */ `
${GLSL}
attribute vec4 aK; // its angle, size, height off the ring, is it a sector (1) or the ring's grain (0)
attribute float aLt; // how lit a sector is (what is pointed at)
uniform float uC, uShow, uPx;
varying float vL;
varying float vS;
void main() {
  float c = smoothstep(0.1, 0.95, uC);
  float r = mix(${CROWN_R.toFixed(3)}, CROWN8, c) + aK.z;
  vec3 p = vec3(cos(aK.x) * r, mix(${CROWN_Y.toFixed(3)}, CROWN8_Y, c) + aK.z * 0.4, sin(aK.x) * r);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = aK.w > 0.5 ? uPx * aK.y * clamp(9.0 / -mv.z, 0.6, 1.6) * uShow : max(1.0, uPx * clamp(6.0 / -mv.z, 0.7, 1.4));
  vL = uShow * (aK.w > 0.5 ? aLt : 1.0);
  vS = aK.w;
}`;
const CROWN_FRAG = /* glsl */ `
precision highp float;
uniform float uFade;
varying float vL;
varying float vS;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  if (vS < 0.5) { gl_FragColor = vec4(vec3(1.0, 0.9, 0.74) * 0.5 * vL * uFade, 1.0); return; }
  float d = length(q);
  if (d > 0.5) discard;
  float core = 1.0 - smoothstep(0.16, 0.22, d);
  float ring = 1.0 - smoothstep(0.03, 0.07, abs(d - 0.4));
  gl_FragColor = vec4(vec3(1.0, 0.96, 0.88) * (core * 1.1 + ring * 0.5) * vL * uFade, 1.0);
}`;
// the room's own dust, far apart, so the climb is felt as you pass it
const DUST_VERT = /* glsl */ `
attribute float aSeed;
uniform float uPx, uTime, uShow;
varying vec3 vC;
void main() {
  vec3 p = position + vec3(sin(uTime * 0.05 + aSeed * 40.0), sin(uTime * 0.04 + aSeed * 23.0), cos(uTime * 0.05 + aSeed * 31.0)) * 0.15;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (0.6 + 0.5 * fract(aSeed * 17.0)) * clamp(3.5 / -mv.z, 0.4, 1.0);
  vC = vec3(0.75, 0.78, 0.85) * (0.04 + 0.08 * fract(aSeed * 7.0)) * uShow * (1.0 - smoothstep(10.0, 28.0, -mv.z)) * smoothstep(1.0, 3.0, -mv.z);
}`;
const PT_FRAG = /* glsl */ `
precision highp float;
uniform float uFade;
varying vec3 vC;
void main() {
  vec2 q = abs(gl_PointCoord - 0.5);
  if (max(q.x, q.y) > 0.5) discard;
  gl_FragColor = vec4(vC * uFade, 1.0);
}`;

export function setupRise({ lenis, reduced, isTouch, local }) {
  const stage = $('.stage-9');
  const hero = $('.hv-rise');
  if (!stage || !hero) return;
  const canvas = $('.hv-gl', hero);
  const labels = $('.hv-labels', hero);
  const card = $('.hv-card', hero);

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { hero.classList.add('no-gl', 'is-words'); return; }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x030405, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(70, 1, 0.03, 140);
  const world = new THREE.Group();
  scene.add(world);

  // ---------------------------------------------------------------- the founder's atlas
  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  const famOrder = Object.keys(ATLAS.families);
  const sectors = ATLAS.sectors.map((s, i) => ({ ...s, i, links: [] }));
  const secAt = Object.fromEntries(sectors.map((s) => [s.id, s.i]));
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) S.links.push({ d, f: l.f }); }));
  byRing.forEach((list, k) => list.forEach((d, j) => { d.u = k + (j + 0.5) / list.length; d.a = ((j + 0.5) / list.length) * TAU; d.pos = helAt(d.u, new THREE.Vector3()); }));
  [...sectors].sort((a, b) => famOrder.indexOf(a.fam) - famOrder.indexOf(b.fam) || a.i - b.i).forEach((S, n) => {
    S.a = (n / sectors.length) * TAU;
    S.pos = new THREE.Vector3(Math.cos(S.a) * CROWN_R, CROWN_Y, Math.sin(S.a) * CROWN_R);
  });

  const U = { uFade: { value: 1 } };
  const PX = { value: dpr };
  const TIME = { value: 0 };
  const C = { value: 0 };
  const REV = { value: reduced ? 1 : 0 };
  const FOG = { uFogNear: { value: 5 }, uFogFar: { value: 26 } };
  const BASE = { value: new THREE.Vector3(233 / 255, 236 / 255, 242 / 255) };
  const LIT = { value: new Array(7).fill(1) };
  const FOCUS = { value: new THREE.Vector4() };
  const ptMat = (vert, uni, frag = PT_FRAG) => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: { ...uni, uFade: U.uFade }, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
  const points = (geo, mat) => { const p = new THREE.Points(geo, mat); p.frustumCulled = false; world.add(p); return p; };

  // ---------------------------------------------------------------- the orbits, as hero 8's grain
  const small = isNarrow(innerWidth, innerHeight) || isTouch;
  // (hero 8's count, four times over: here the orbits are seen close to, from inside the spiral)
  const per = (list) => Math.round((850 + 230 * list.length) * (small ? 1.6 : 3.6));
  const NRG = byRing.reduce((s, l) => s + per(l), 0);
  const aR = new Float32Array(NRG * 4), aS = new Float32Array(NRG * 4);
  let n = 0;
  byRing.forEach((list, k) => {
    const band = BAND8(list.length);
    for (let i = 0; i < per(list); i++, n++) {
      aR.set([k, Math.random() * TAU, clamp(gauss(), -1, 1), gauss()], n * 4);
      aS.set([0.65 + Math.random() * 1.15, Math.random(), 0.9 + 0.2 * Math.random(), band], n * 4);
    }
  });
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NRG * 3), 3));
  ringGeo.setAttribute('aR', new THREE.BufferAttribute(aR, 4));
  ringGeo.setAttribute('aS', new THREE.BufferAttribute(aS, 4));
  points(ringGeo, ptMat(RING_VERT, {
    uTime: TIME, uC: C, uReveal: REV, uPx: PX, uBase: BASE, uLit: LIT, ...FOG,
    uSpeed: { value: rings.map((_, k) => SPEED8(k)) }, uRad: { value: rings.map((_, k) => R8(k)) },
  }));

  // the disciplines
  const dSp = new Float32Array(discs.length * 3), dFl = new Float32Array(discs.length * 4);
  discs.forEach((d, i) => { dSp.set([d.pos.x, d.pos.y, d.pos.z], i * 3); const a = (d.u % 1) * TAU; dFl.set([Math.cos(a) * R8(d.ring), Math.sin(a) * R8(d.ring), d.ring, 0], i * 4); });
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(discs.length * 3), 3));
  dGeo.setAttribute('aSp', new THREE.BufferAttribute(dSp, 3));
  dGeo.setAttribute('aFl', new THREE.BufferAttribute(dFl, 4));
  const dLit = new Float32Array(discs.length).fill(1);
  const dLitAttr = new THREE.BufferAttribute(dLit, 1).setUsage(THREE.DynamicDrawUsage);
  dGeo.setAttribute('aLit', dLitAttr);
  points(dGeo, ptMat(DISC_VERT, { uC: C, uReveal: REV, uPx: PX }));

  // ---------------------------------------------------------------- the streams, a discipline to a sector and back
  const PER_STREAM = small ? 60 : 120;
  const links = [];
  discs.forEach((d) => d.links.forEach((l) => { const j = secAt[l.s]; if (j != null) links.push({ d, S: sectors[j] }); }));
  const NS = links.length * PER_STREAM;
  const sA = new Float32Array(NS * 3), sM = new Float32Array(NS * 3), sB = new Float32Array(NS * 3), sF = new Float32Array(NS * 4), sI = new Float32Array(NS * 4);
  links.forEach(({ d, S }, m) => {
    const A = d.pos, B = S.pos;
    // up and in toward the middle, then up to the crown (hero 7's curve)
    const M = [A.x * 0.28 + B.x * 0.25, lerp(A.y, B.y, 0.72), A.z * 0.28 + B.z * 0.25];
    const da = (d.u % 1) * TAU;
    for (let i = 0; i < PER_STREAM; i++) {
      const q = m * PER_STREAM + i, j = (Math.random() - 0.5) * 0.05;
      sA.set([A.x + j, A.y + j, A.z + j], q * 3);
      sM.set([M[0] + j * 4, M[1], M[2] + j * 4], q * 3);
      sB.set([B.x, B.y, B.z], q * 3);
      sF.set([da, R8(d.ring), S.a, d.ring], q * 4);
      sI.set([d.i, S.i, d.ring, Math.random()], q * 4);
    }
  });
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3));
  sGeo.setAttribute('aA', new THREE.BufferAttribute(sA, 3));
  sGeo.setAttribute('aM', new THREE.BufferAttribute(sM, 3));
  sGeo.setAttribute('aB', new THREE.BufferAttribute(sB, 3));
  sGeo.setAttribute('aF', new THREE.BufferAttribute(sF, 4));
  sGeo.setAttribute('aI', new THREE.BufferAttribute(sI, 4));
  const SHOW_S = { value: 0 };
  points(sGeo, ptMat(STREAM_VERT, { uTime: TIME, uShow: SHOW_S, uC: C, uPx: PX, uBase: BASE, uFocus: FOCUS, ...FOG }));

  // ---------------------------------------------------------------- the crown and its ring, and the dust
  const HALO = small ? 1600 : 3000;
  const aK = new Float32Array((sectors.length + HALO) * 4);
  sectors.forEach((S, j) => aK.set([S.a, 5 + 2.4 * Math.sqrt(S.links.length), 0, 1], j * 4));
  for (let i = 0; i < HALO; i++) aK.set([Math.random() * TAU, 1, (Math.random() - 0.5) * 0.04, 0], (sectors.length + i) * 4);
  const kGeo = new THREE.BufferGeometry();
  kGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((sectors.length + HALO) * 3), 3));
  kGeo.setAttribute('aK', new THREE.BufferAttribute(aK, 4));
  const kLit = new Float32Array(sectors.length + HALO).fill(1);
  const kLitAttr = new THREE.BufferAttribute(kLit, 1).setUsage(THREE.DynamicDrawUsage);
  kGeo.setAttribute('aLt', kLitAttr);
  const SHOW_K = { value: 0 };
  points(kGeo, ptMat(CROWN_VERT, { uC: C, uShow: SHOW_K, uPx: PX }, CROWN_FRAG));
  const dustN = small ? 900 : 2000;
  const dPos = new Float32Array(dustN * 3), dSeed = new Float32Array(dustN);
  for (let i = 0; i < dustN; i++) {
    const a = Math.random() * TAU, r = 1 + Math.random() * 10;
    dPos.set([Math.cos(a) * r, -TOP - 3 + Math.random() * (2 * TOP + 10), Math.sin(a) * r], i * 3);
    dSeed[i] = Math.random();
  }
  const uGeo = new THREE.BufferGeometry();
  uGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  uGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  const SHOW_D = { value: 0 };
  points(uGeo, ptMat(DUST_VERT, { uPx: PX, uTime: TIME, uShow: SHOW_D }));

  // ---------------------------------------------------------------- the names in the world (hero 7's), and what is pointed at
  // (the user, 20 Nov: hero 7's handling is the point of it: point at a discipline and its streams run up to the
  // sectors it moves on the crown; point at a sector and the streams come in from the few disciplines that move it.
  // So its names, its card and its highlighting are kept, here through the climb and on the flat orbits at the end.)
  const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const pad2 = (q) => String(q).padStart(2, '0');
  const firstSentence = (q) => (String(q || '').match(/^.*?[.!?](\s|$)/) || [q || ''])[0].trim();
  let focus = null, pickedFocus = false, focusP = 0;
  const orbitTags = rings.map((r, k) => {
    const t = el('div', 'hf-o');
    const nThreads = byRing[k].reduce((q, d) => q + d.links.length, 0);
    t.append(el('span', 'hf-o-n', ROMAN[k]), el('span', 'hf-o-name', r.name), el('span', 'hf-o-c', `${byRing[k].length} ${byRing[k].length === 1 ? 'discipline' : 'disciplines'}, ${nThreads} streams`));
    labels.append(t);
    t.addEventListener('pointerenter', () => { pickedFocus = false; setFocus({ kind: 'field', k }); });
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'field' && focus.k === k) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'field', k } })));
    const sp = helAt(k + 0.08, new THREE.Vector3());
    t.sp = sp.clone().add(new THREE.Vector3(sp.x, 0, sp.z).normalize().multiplyScalar(0.7)).add(new THREE.Vector3(0, 0.55, 0));
    const a = 0.08 * TAU, rr = R8(k) + BAND8(byRing[k].length) * 0.5 + 0.35;
    t.fl = new THREE.Vector3(Math.cos(a) * rr, 0.3, Math.sin(a) * rr);
    t.k = k;
    return t;
  });
  const discTags = discs.map((d) => {
    const t = el('span', 'hf-d');
    t.append(el('span', 'hg-tk-box'), el('span', 'hf-d-n', pad2(d.i + 1)), el('span', 'hf-d-name', d.name), el('span', 'hf-d-c', `${d.links.length} of 48`));
    labels.append(t);
    t.addEventListener('pointerenter', () => { pickedFocus = false; setFocus({ kind: 'disc', i: d.i }); });
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'disc' && focus.i === d.i) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'disc', i: d.i } })));
    const a = (d.u % 1) * TAU;
    d.fl = new THREE.Vector3(Math.cos(a) * R8(d.ring), 0, Math.sin(a) * R8(d.ring));
    d.now = new THREE.Vector3();
    return t;
  });
  const secTags = sectors.map((S) => {
    const t = el('span', 'ha-s', S.name);
    labels.append(t);
    t.addEventListener('pointerenter', () => { pickedFocus = false; setFocus({ kind: 'sector', j: S.i }); });
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'sector' && focus.j === S.i) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'sector', j: S.i } })));
    S.now = new THREE.Vector3();
    return t;
  });
  const same = (a, b) => (!a && !b) || (a && b && a.kind === b.kind && a.k === b.k && a.i === b.i && a.j === b.j);
  function fillCard(fc) {
    card.textContent = '';
    const head = el('p', 'hc-k');
    if (fc.kind === 'field') {
      const k = fc.k;
      head.append(el('span', null, `Orbit ${ROMAN[k]}`));
      card.append(head, el('p', 'hc-name', rings[k].name), el('p', 'hc-note', rings[k].note), el('p', 'hc-list', byRing[k].map((d) => d.name).join(' · ')));
    } else if (fc.kind === 'disc') {
      const d = discs[fc.i];
      head.append(el('span', null, `Orbit ${ROMAN[d.ring]} · ${rings[d.ring].name}`));
      card.append(head, el('p', 'hc-name', d.name), el('p', 'hc-note', firstSentence(d.gist)), el('p', 'hc-list', `Moves ${d.links.length} of 48: ${d.links.map((l) => sectors[secAt[l.s]]?.name).filter(Boolean).join(', ')}.`));
    } else {
      const S = sectors[fc.j];
      head.append(el('span', null, `A sector · ${ATLAS.families[S.fam] || ''}`));
      card.append(head, el('p', 'hc-name', S.name), el('p', 'hc-note', S.links.length ? `Moved by ${S.links.length} ${S.links.length === 1 ? 'discipline' : 'disciplines'}.` : 'Not yet mapped in the atlas.'), el('p', 'hc-list', S.links.map((l) => `${l.d.name} ${ATLAS.forces[l.f]?.label || l.f} it`).join(' · ')));
    }
  }
  function setFocus(fc) {
    if (same(fc, focus)) return;
    focus = fc;
    focusP = Ps;
    if (fc) fillCard(fc);
    card.classList.toggle('is-on', !!fc);
    hero.classList.toggle('is-reading', !!fc);
    const v = FOCUS.value;
    if (!fc) v.set(0, 0, 0, 0);
    else if (fc.kind === 'field') v.set(1, fc.k, 0, 0);
    else if (fc.kind === 'disc') v.set(2, fc.i, 0, 0);
    else v.set(3, fc.j, 0, 0);
  }
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && focus) setFocus(null); });
  // pointing at the points themselves, where no name is showing: the nearest discipline or sector under the pointer
  const proj = new THREE.Vector3();
  const toScreen = (q) => { proj.copy(q).project(camera); return [(proj.x * 0.5 + 0.5) * view.W, (-proj.y * 0.5 + 0.5) * view.H, proj.z]; };
  let canPick = false;
  function pickAt(x, y) {
    if (!canPick) return null;
    let best = null, bd = 16;
    discs.forEach((d) => { const q = toScreen(d.now); if (q[2] < 1) { const dd = Math.hypot(q[0] - x, q[1] - y); if (dd < bd) { bd = dd; best = { kind: 'disc', i: d.i }; } } });
    if (SHOW_K.value > 0.5) sectors.forEach((S) => { const q = toScreen(S.now); if (q[2] < 1) { const dd = Math.hypot(q[0] - x, q[1] - y); if (dd < bd) { bd = dd; best = { kind: 'sector', j: S.i }; } } });
    return best;
  }

  // ---------------------------------------------------------------- size, the opening, the scroll, the hands
  const view = { W: 1, H: 1, narrow: false };
  function layout() {
    const W = hero.clientWidth, H = hero.clientHeight;
    Object.assign(view, { W, H, narrow: isNarrow(W, H) });
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
  }
  const O = { reveal: reduced ? 1 : 0 };
  let opened = reduced;
  function openUp() {
    if (opened) return;
    opened = true;
    hero.classList.add('is-open');
    gsap.to(O, { reveal: 1, duration: 3.2, ease: 'power2.inOut' });
  }
  if (reduced) hero.classList.add('is-open');
  let Pp = 0, Ps = 0;
  ScrollTrigger.create({ trigger: stage, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { Pp = self.progress; } });
  const html = document.documentElement;
  ScrollTrigger.create({
    trigger: stage, start: 'top 55%',
    onEnter: () => { if (html.classList.contains('gate')) addEventListener('mm:enter', openUp, { once: true }); else openUp(); },
  });
  // the hands: a drag turns it, with a little momentum
  let turn = 0, turnV = 0, down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, id: e.pointerId, moved: false }; });
  addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    const dx = e.clientX - down.x;
    if (!down.moved && Math.abs(dx) > 4 && Math.abs(dx) > Math.abs(e.clientY - down.y)) { down.moved = true; hero.classList.add('is-turning'); }
    if (down.moved) { turn += dx * 0.005; turnV = dx * 0.005 * 60; down.x = e.clientX; }
  });
  addEventListener('pointerup', () => { down = null; hero.classList.remove('is-turning'); });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || down?.moved) return;
    const r = hero.getBoundingClientRect(), hit = pickAt(e.clientX - r.left, e.clientY - r.top);
    if (hit) { pickedFocus = true; setFocus(hit); canvas.style.cursor = 'pointer'; }
    else { if (pickedFocus) { pickedFocus = false; setFocus(null); } canvas.style.cursor = ''; }
  });
  canvas.addEventListener('pointerleave', () => { if (pickedFocus) { pickedFocus = false; setFocus(null); } });
  // a click (or a tap) on a point: once to show what it moves, again (or a click with the mouse) to open its metrics
  canvas.addEventListener('click', (e) => {
    if (down?.moved) return;
    const r = hero.getBoundingClientRect(), hit = pickAt(e.clientX - r.left, e.clientY - r.top);
    if (hit && (same(hit, focus) && (pickedFocus || isTouch))) dispatchEvent(new CustomEvent('mm:open', { detail: hit }));
    else if (hit) { pickedFocus = !isTouch; setFocus(hit); }
    else setFocus(null);
  });
  addEventListener('pointercancel', () => { down = null; hero.classList.remove('is-turning'); });

  // ---------------------------------------------------------------- the journey
  // the camera's own frame: f where it looks, up the top of the screen, both in its plane and turned with the spin
  const f = new THREE.Vector3(), upv = new THREE.Vector3(), pos = new THREE.Vector3(), aim = new THREE.Vector3();
  const frameOf = (pitch, spin) => {
    const cp = Math.cos(pitch), sp = Math.sin(pitch), cs = Math.cos(spin), ss = Math.sin(spin);
    f.set(-sp * ss, cp, -sp * cs);
    upv.set(cp * ss, sp, cp * cs);
  };
  let words = false;
  const tmpV = new THREE.Vector3();
  const lit = { rings: new Array(7).fill(1), discs: new Array(discs.length).fill(0.6), sectors: new Array(sectors.length).fill(1) };
  let last = performance.now();
  const t0 = last;
  function frame() {
    const tn = performance.now();
    const dt = Math.min(0.05, (tn - last) / 1000);
    last = tn;
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const t = (tn - t0) / 1000;
    // the journey keeps a little momentum of its own, so the camera never jumps with the wheel
    Ps = reduced ? Pp : damp(Ps, Pp, 2.6, dt);
    const p = Ps, nr = view.narrow;
    if (!down) { turn += turnV * dt; turnV *= Math.exp(-2.4 * dt); }

    // The camera always looks at a point on the middle line from a distance (the point above it in the climb), so
    // one path carries it the whole way, with nothing cut:
    // 1. the climb: from the foot, straight up the middle, the turns passing all round, to just under the crown
    const climb = smooth(0.02, 0.46, p);
    // 2. the flip: round the crown's centre and out through its circle, until it looks straight down into the spiral
    const flip = smooth(0.42, 0.62, p);
    // 3. the settle: from straight above it draws back to hero 8's angle, the orbits a little high in the frame
    const settle = smooth(0.62, 0.9, p);
    const R0 = 2.0; // (how far the camera is from the point it turns round: inside the crown's circle, so it passes through)
    const yc = lerp(-TOP - (nr ? 2.8 : 2.3), CROWN_Y - R0, climb);
    const spin = 0.5 + 2.2 * smooth(0, 0.66, p) + 0.02 * t + turn;
    frameOf(Math.PI * flip - (Math.PI - SETTLE_PITCH) * settle, spin);
    const tY = lerp(yc + R0, nr ? 0.6 : -1.05, settle), dist = lerp(R0, nr ? 25 : 16.2, settle);
    pos.set(-f.x * dist, tY - f.y * dist, -f.z * dist);
    camera.position.copy(pos);
    camera.up.copy(upv);
    camera.lookAt(aim.copy(pos).add(f));
    const fov = lerp(nr ? 80 : 70, nr ? 56 : 44, settle);
    if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();

    // 4. the spiral spreads into hero 8's orbits as the camera comes round
    C.value = smooth(0.6, 0.88, p);
    // depth: in the climb the far turns sink into the dark; drawn back, the whole shows
    FOG.uFogNear.value = lerp(5, 14, settle);
    FOG.uFogFar.value = lerp(28, 44, settle);
    TIME.value = t;
    PX.value = dpr * (nr ? 0.95 : 0.9);
    REV.value = O.reveal;
    SHOW_S.value = Math.max(smooth(0.1, 0.42, p), focus ? 1 : 0);
    SHOW_K.value = Math.max(smooth(0.28, 0.48, p), focus?.kind === 'sector' ? 1 : 0);
    SHOW_D.value = O.reveal * (1 - 0.6 * settle);

    // the cue to scroll, only at the start; the words, only once the orbits have settled
    hero.style.setProperty('--cue', String(O.reveal * (1 - smooth(0.01, 0.05, p))));
    if (!words && p > 0.86) { words = true; hero.classList.add('is-words'); }
    else if (words && p < 0.8) { words = false; hero.classList.remove('is-words'); }

    // (what was pointed at is let go once the journey has moved on from it, and the opening frame is always clean)
    if (focus && (Math.abs(p - focusP) > 0.04 || p < 0.03)) { pickedFocus = false; setFocus(null); }
    // what is lit: the orbit, discipline or sector pointed at, and what it moves (hero 7's rules)
    const fk = focus?.kind === 'field' ? focus.k : focus?.kind === 'disc' ? discs[focus.i].ring : -1;
    for (let k = 0; k < 7; k++) {
      const want = !focus ? 1 : fk === k ? 1.6 : focus.kind === 'sector' ? (byRing[k].some((d) => sectors[focus.j].links.some((l) => l.d === d)) ? 1.1 : 0.35) : 0.3;
      lit.rings[k] = damp(lit.rings[k], want, 7, dt);
      LIT.value[k] = lit.rings[k];
    }
    const discOn = (d) => !focus || (focus.kind === 'disc' ? focus.i === d.i : focus.kind === 'field' ? d.ring === focus.k : d.links.some((l) => secAt[l.s] === focus.j));
    const secOn = (S) => !focus || (focus.kind === 'sector' ? S.i === focus.j : focus.kind === 'disc' ? S.links.some((l) => l.d.i === focus.i) : S.links.some((l) => l.d.ring === focus.k));
    discs.forEach((d, i) => { lit.discs[i] = damp(lit.discs[i], !focus ? 0.6 : discOn(d) ? 1 : 0.15, 8, dt); dLit[i] = lit.discs[i]; });
    sectors.forEach((S, j) => { lit.sectors[j] = damp(lit.sectors[j], secOn(S) ? 1 : 0.2, 8, dt); kLit[j] = lit.sectors[j]; });
    dLitAttr.needsUpdate = true;
    kLitAttr.needsUpdate = true;

    // where each named thing is now, between the spiral and the flat orbits
    const cK = smooth(0.1, 0.95, C.value), crR = lerp(CROWN_R, CROWN8, cK), crY = lerp(CROWN_Y, CROWN8_Y, cK);
    discs.forEach((d) => d.now.copy(d.pos).lerp(d.fl, smooth(d.ring * 0.05, d.ring * 0.05 + 0.7, C.value)));
    sectors.forEach((S) => S.now.set(Math.cos(S.a) * crR, crY, Math.sin(S.a) * crR));
    // the names: none at the very start; in the climb, the ones near you (hero 7's); on the flat orbits, the
    // disciplines as small trackers to point at, and the names of what is pointed at and what it moves
    const named = O.reveal * smooth(0.03, 0.08, p);
    canPick = named > 0.5;
    const climbing = 1 - flip;
    orbitTags.forEach((tg) => {
      const k = tg.k, at = tmpV.copy(tg.sp).lerp(tg.fl, smooth(k * 0.05, k * 0.05 + 0.7, C.value));
      const d = at.distanceTo(camera.position), q = toScreen(at);
      const level = smooth(1.5, 0.5, Math.abs(at.y - camera.position.y));
      const mine = focus && fk === k;
      const a = named * (q[2] < 1 ? 1 : 0) * Math.max(smooth(15, 7, d) * smooth(1.2, 2.8, d) * climbing * level * (focus ? (mine ? 1 : 0.3) : 1), mine && focus.kind === 'field' && !nr ? settle : 0);
      tg.style.opacity = a.toFixed(3);
      tg.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      tg.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px)`;
    });
    discTags.forEach((tg, i) => {
      const dd = discs[i], d = dd.now.distanceTo(camera.position), q = toScreen(dd.now), on = discOn(dd);
      const near = smooth(nr ? 8 : 10, nr ? 3.5 : 4.5, d) * smooth(0.5, 1.2, d) * climbing;
      const a = named * (q[2] < 1 ? 1 : 0) * Math.max(near * (on ? 1 : 0.22), focus && on ? 0.95 : 0, settle * (focus ? (on ? 0.95 : 0.25) : 0.7));
      tg.style.opacity = a.toFixed(3);
      tg.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      tg.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px)`;
      // (on the flat orbits only what is pointed at, and what it moves, is named; the rest are trackers)
      tg.classList.toggle('is-named', settle < 0.5 || (focus && on));
    });
    secTags.forEach((tg, j) => {
      const S = sectors[j], q = toScreen(S.now), d = S.now.distanceTo(camera.position), on = lit.sectors[j] > 0.6;
      const a = named * SHOW_K.value * (q[2] < 1 ? 1 : 0) * Math.max((nr ? (focus && on ? 1 : 0) : smooth(16, 6, d) * (focus ? (on ? 1 : 0.15) : 0.75)) * (1 - smooth(0, 0.3, settle)), focus && on ? (nr && settle > 0.5 ? (focus.kind === 'sector' ? 1 : 0) : 1) : 0);
      // (on a phone's small flat orbits only the sector itself is named; the card names the rest)
      tg.style.opacity = a.toFixed(3);
      tg.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      tg.style.transform = `translate(${q[0].toFixed(1)}px, ${q[1].toFixed(1)}px)`;
    });

    renderer.render(scene, camera);
  }

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  gsap.ticker.add(frame);

  if (local) window.__rise = { scene, camera, renderer, O, C, openUp, setFocus, pickAt, discs, sectors, tick: frame, get p() { return Ps; }, set p(v) { Pp = Ps = v; } };
}
