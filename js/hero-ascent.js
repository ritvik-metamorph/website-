// Hero 7 of 7, "the ascent" (10 Nov). The user, after hero 6: no books or papers; "the ultimate
// goal is aura rings", made of particles, with "a proper journey… a proper camera angle which goes
// from the bottom to top". The first video's composition and camera travel as inspiration only:
// - The seven orbits are one rising spiral of aura rings, a turn each, from the ground of being at
//   the foot to the return at the top: each a ribbon of fine particle strands (a bright core strand
//   and finer ones either side, the way hero 1's orbits carry their engraved lines), warm white at
//   the foot through to night blue at the top, drifting slowly round.
// - The twenty-seven disciplines are named on their rings; from each, streams of particles flow up
//   to the sectors it moves, the forty-eight a crown of light above the top. A hundred and fifty-one
//   streams.
// - The scroll is the journey: low among the first ring, following the rings round and up; then up
//   through the centre with the rings passing all round and the streams rising beside you; out above
//   the crown; then back for the whole spiral. Last, the room turns to the paper the services are
//   printed on.
// Everything is drawn in code from the founder's atlas (js/atlas-data.js). Hover a discipline's name,
// an orbit's or a sector of the crown to read it; click to open its metrics (the light orb's panel,
// js/orb.js, through an 'mm:open' event).
import * as THREE from '../assets/vendor/three.module.min.js';
import { ATLAS } from './atlas-data.js';
import { NOTES } from './sectors-data.js';
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
const firstSentence = (s) => (s.match(/^.*?[.!?](\s|$)/) || [s])[0].trim();
const pad2 = (n) => String(n).padStart(2, '0');

// ---------------------------------------------------------------- the spiral (kept in step with the shader)
const LOOPS = 7, PITCH = 1.3;
const helR = (u) => 3.4 + 0.5 * Math.sin(u * 1.27 + 0.4);
const helAt = (u, out) => out.set(Math.cos(u * TAU) * helR(u), (u - LOOPS / 2) * PITCH, Math.sin(u * TAU) * helR(u));
const TOP = (LOOPS / 2) * PITCH;
const CROWN_Y = TOP + 2.3, CROWN_R = 2.3;
// each ring is a tube of grain, the way hero 2's are (the user, 10 Nov: the thin aura lines "make it
// look AI"; hero 2's rings are the ones they like): most of the grain on its skin, some inside
const TUBE = 0.2;

const GLSL_HELIX = /* glsl */ `
const float TAU = 6.28318531;
const float LOOPS = ${LOOPS}.0;
const float PITCH = ${PITCH};
float helR(float u) { return 3.4 + 0.5 * sin(u * 1.27 + 0.4); }
vec3 helAt(float u) { return vec3(cos(u * TAU) * helR(u), (u - LOOPS * 0.5) * PITCH, sin(u * TAU) * helR(u)); }
`;

// the rings: each grain rides the spiral within its turn, on the skin of its tube (hero 2's rings)
const RING_VERT = /* glsl */ `
${GLSL_HELIX}
attribute vec4 aR; // orbit, place along its turn (0..1), angle round the tube, distance from its centre
attribute vec4 aS; // brightness, seed, speed, -
uniform float uTime;
uniform float uLit[7];
uniform vec3 uCol[7];
uniform float uReveal;
uniform float uPx;
uniform vec4 uShade;
uniform float uShadeK;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vC;
void main() {
  int k = int(aR.x + 0.5);
  float dir = mod(aR.x, 2.0) < 0.5 ? 1.0 : -1.0;
  float f = fract(aR.y + uTime * aS.z * dir);
  float u = aR.x + f;
  vec3 c = helAt(u);
  vec3 nh = normalize(vec3(c.x, 0.0, c.z));
  vec3 n = nh * cos(aR.z) + vec3(0.0, sin(aR.z), 0.0);
  vec3 p = c + n * aR.w;
  // the rings come in from the foot up as the hero opens
  float rv = smoothstep(u / LOOPS * 0.8, u / LOOPS * 0.8 + 0.2, uReveal);
  p += nh * (1.0 - rv) * (1.5 + 2.0 * aS.y) + vec3(0.0, (1.0 - rv) * -0.8, 0.0);
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float s2 = fract(aS.y * 7.137);
  gl_PointSize = uPx * (0.8 + 1.3 * s2 * s2) * clamp(7.0 / -mv.z, 0.55, 2.0);
  vec2 sp = gl_Position.xy / gl_Position.w;
  vec2 sl = smoothstep(uShade.xy - 0.1, uShade.xy + 0.04, sp) * (1.0 - smoothstep(uShade.zw - 0.04, uShade.zw + 0.1, sp));
  float fog = (1.0 - smoothstep(uFogNear, uFogFar, -mv.z)) * smoothstep(0.25, 0.9, -mv.z);
  // the side of the tube that faces you is brighter than the far side
  float face = 0.5 + 0.5 * max(dot(n, normalize(cameraPosition - p)), -0.2);
  vec3 col = mix(vec3(1.0, 0.98, 0.95), uCol[k], 0.5 + 0.3 * fract(aS.y * 3.3));
  // (the far rings keep their light, so a tunnel of them reads all the way up)
  float far = 1.0 + 0.6 * smoothstep(6.0, 14.0, -mv.z);
  vC = col * aS.x * (0.24 + 0.76 * fract(aS.y * 13.71)) * face * uLit[k] * rv * fog * far * (1.0 - uShadeK * sl.x * sl.y);
}`;
// the streams: each grain flows from a discipline up to a sector it moves, over and over
const STREAM_VERT = /* glsl */ `
attribute vec3 aA;
attribute vec3 aC;
attribute vec3 aB;
attribute vec4 aI; // discipline, sector, orbit, seed
uniform float uTime;
uniform float uShow;
uniform vec4 uFocus; // kind (0 none, 1 orbit, 2 discipline, 3 sector), index
uniform vec3 uCol[7];
uniform float uPx;
uniform float uFogNear;
uniform float uFogFar;
varying vec3 vC;
void main() {
  float t = fract(aI.w * 9.13 + uTime * (0.045 + 0.04 * fract(aI.w * 3.7)));
  float it = 1.0 - t;
  vec3 p = it * it * aA + 2.0 * it * t * aC + t * t * aB;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float on = 1.0;
  if (uFocus.x > 0.5) {
    float idx = uFocus.x < 1.5 ? aI.z : uFocus.x < 2.5 ? aI.x : aI.y;
    on = abs(idx - uFocus.y) < 0.5 ? 2.2 : 0.08;
  }
  // each stream shows from its foot up as it lets out
  float shown = smoothstep(t - 0.1, t, uShow * 1.1);
  gl_PointSize = uPx * (0.8 + 0.7 * fract(aI.w * 5.3)) * clamp(4.5 / -mv.z, 0.4, 1.3);
  // (close by, the streams thin out, so passing through them never reads as snow)
  float fog = (1.0 - smoothstep(uFogNear, uFogFar, -mv.z)) * smoothstep(0.8, 2.6, -mv.z);
  float ends = smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.9, t);
  vC = mix(uCol[int(aI.z + 0.5)], vec3(1.0, 0.97, 0.92), 0.4) * 0.55 * on * shown * ends * fog;
}`;
// the room's own dust, far apart, so the journey is felt as you pass it
const DUST_VERT = /* glsl */ `
attribute float aSeed;
uniform float uPx;
uniform float uTime;
uniform float uShow;
varying vec3 vC;
void main() {
  vec3 p = position + vec3(sin(uTime * 0.05 + aSeed * 40.0), sin(uTime * 0.04 + aSeed * 23.0), cos(uTime * 0.05 + aSeed * 31.0)) * 0.15;
  vec4 mv = viewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * (0.6 + 0.6 * fract(aSeed * 17.0)) * clamp(3.5 / -mv.z, 0.4, 1.1);
  float halo = step(0.985, aSeed);
  vC = vec3(0.75, 0.78, 0.85) * mix(0.05 + 0.1 * fract(aSeed * 7.0), 0.5, halo) * uShow * (1.0 - smoothstep(10.0, 28.0, -mv.z)) * mix(smoothstep(1.0, 3.0, -mv.z), 1.0, halo);
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
// the rail and its ticks: fine lines, sinking into the dark with distance
const LN_VERT = /* glsl */ `
attribute vec4 aC;
uniform float uFogNear;
uniform float uFogFar;
varying vec4 vC;
varying float vF;
void main() {
  vC = aC;
  vec4 mv = viewMatrix * vec4(position, 1.0);
  vF = (1.0 - smoothstep(uFogNear, uFogFar, -mv.z)) * smoothstep(0.3, 1.0, -mv.z);
  gl_Position = projectionMatrix * mv;
}`;
const LN_FRAG = /* glsl */ `
precision highp float;
uniform float uFade;
uniform float uShow;
varying vec4 vC;
varying float vF;
void main() { gl_FragColor = vec4(vC.rgb * vC.a * vF * uFade * uShow, 1.0); }`;
// the crown: the forty-eight sectors, lights in a ring above the top
const CROWN_VERT = /* glsl */ `
attribute float aSize;
attribute float aLit;
uniform float uPx;
uniform float uShow;
varying float vL;
void main() {
  vec4 mv = viewMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uPx * aSize * clamp(9.0 / -mv.z, 0.6, 3.0) * uShow;
  vL = aLit * uShow;
}`;
const CROWN_FRAG = /* glsl */ `
precision highp float;
uniform float uFade;
varying float vL;
void main() {
  vec2 q = gl_PointCoord - 0.5;
  float d = length(q);
  if (d > 0.5) discard;
  float core = 1.0 - smoothstep(0.16, 0.22, d);
  float ring = 1.0 - smoothstep(0.03, 0.07, abs(d - 0.4));
  gl_FragColor = vec4(vec3(1.0, 0.96, 0.88) * (core * 1.2 + ring * 0.55) * vL * uFade, 1.0);
}`;

export function setupAscent({ lenis, reduced, isTouch, local }) {
  const stage = $('.stage-7');
  const hero = $('.hv-ascent');
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
  const PAPER = new THREE.Color(document.documentElement.dataset.theme === 'dark' ? 0x141414 : 0xf6f7f4);
  renderer.setClearColor(ROOM, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.03, 120);

  // ---------------------------------------------------------------- the founder's data

  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  const famOrder = Object.keys(ATLAS.families);
  const sectors = ATLAS.sectors.map((s, i) => ({ ...s, i, links: [] }));
  const secAt = Object.fromEntries(sectors.map((s) => [s.id, s.i]));
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) S.links.push({ d, f: l.f }); }));
  // each discipline at its place on its orbit's turn; each sector on the crown, by family
  byRing.forEach((list, k) => list.forEach((d, j) => { d.u = k + (j + 0.5) / list.length; d.pos = helAt(d.u, new THREE.Vector3()); }));
  [...sectors].sort((a, b) => famOrder.indexOf(a.fam) - famOrder.indexOf(b.fam) || a.i - b.i).forEach((S, n) => {
    const a = (n / sectors.length) * TAU;
    S.pos = new THREE.Vector3(Math.cos(a) * CROWN_R, CROWN_Y + 0.12 * Math.sin(n * 2.1), Math.sin(a) * CROWN_R);
  });

  // ---------------------------------------------------------------- the rings, as particles

  const nr0 = isNarrow(innerWidth, innerHeight);
  const PER = nr0 ? 16000 : 42000;
  const NR = PER * 7;
  const aR = new Float32Array(NR * 4), aS = new Float32Array(NR * 4);
  for (let k = 0, n = 0; k < 7; k++) {
    for (let i = 0; i < PER; i++, n++) {
      const rr = TUBE * (0.62 + 0.38 * Math.pow(Math.random(), 0.35)) * (0.85 + 0.3 * Math.sin(k * 1.3));
      aR.set([k, Math.random(), Math.random() * TAU, rr], n * 4);
      aS.set([1, Math.random(), 0.006 + 0.004 * Math.random(), 0], n * 4);
    }
  }
  const ringGeo = new THREE.BufferGeometry();
  ringGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NR * 3), 3));
  ringGeo.setAttribute('aR', new THREE.BufferAttribute(aR, 4));
  ringGeo.setAttribute('aS', new THREE.BufferAttribute(aS, 4));
  const FOG = { uFogNear: { value: 6 }, uFogFar: { value: 26 } };
  const PX = { value: dpr };
  const TIME = { value: 0 };
  const FADE = { value: 1 };
  const SH = { uShade: { value: new THREE.Vector4(9, 9, 9, 9) }, uShadeK: { value: 0 } };
  const RU = {
    uTime: TIME, uLit: { value: new Array(7).fill(1) }, uCol: { value: FIELD_COL.map((c) => new THREE.Vector3(...c)) },
    uReveal: { value: reduced ? 1 : 0 }, uPx: PX, uFade: FADE, ...SH, ...FOG,
  };
  const ptMat = (vert, U2) => new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: PT_FRAG, uniforms: U2, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
  const ringPts = new THREE.Points(ringGeo, ptMat(RING_VERT, RU));
  ringPts.frustumCulled = false;
  scene.add(ringPts);

  // ---------------------------------------------------------------- the rail beside the rings, and its ticks
  // (hero 2's): a fine line just outside the tubes all the way up, with forty-eight ticks to a turn, one
  // for each sector, longer and lit where that orbit's disciplines move that sector

  const colOrder = [...sectors].sort((a, b) => famOrder.indexOf(a.fam) - famOrder.indexOf(b.fam) || a.i - b.i);
  const tickLit = rings.map(() => new Array(sectors.length).fill(0));
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) tickLit[d.ring][colOrder.indexOf(S)]++; }));
  const railPos = [], railCol = [];
  const railAt = (u, out) => { helAt(u, out); const l = Math.hypot(out.x, out.z) || 1; return out.set(out.x + (out.x / l) * (TUBE + 0.15), out.y, out.z + (out.z / l) * (TUBE + 0.15)); };
  const ra = new THREE.Vector3(), rb = new THREE.Vector3();
  const RSEG = 1400;
  for (let i = 0; i < RSEG; i++) {
    railAt((i / RSEG) * LOOPS, ra); railAt(((i + 1) / RSEG) * LOOPS, rb);
    const c = FIELD_COL[Math.min(6, Math.floor((i / RSEG) * LOOPS))];
    railPos.push(ra.x, ra.y, ra.z, rb.x, rb.y, rb.z);
    railCol.push(...c, 0.32, ...c, 0.32);
  }
  for (let k = 0; k < 7; k++) for (let j = 0; j < sectors.length; j++) {
    railAt(k + (j + 0.5) / sectors.length, ra);
    const n2 = tickLit[k][j], len = n2 ? 0.07 + 0.035 * n2 : 0.035;
    railPos.push(ra.x, ra.y - len, ra.z, ra.x, ra.y + len, ra.z);
    const c = n2 ? [1, 0.97, 0.92] : FIELD_COL[k], a = n2 ? 0.9 : 0.3;
    railCol.push(...c, a, ...c, a);
  }
  const railGeo = new THREE.BufferGeometry();
  railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3));
  railGeo.setAttribute('aC', new THREE.Float32BufferAttribute(railCol, 4));
  const LU = { uFade: FADE, uShow: { value: 0 }, ...FOG };
  const rail = new THREE.LineSegments(railGeo, new THREE.ShaderMaterial({ vertexShader: LN_VERT, fragmentShader: LN_FRAG, uniforms: LU, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  rail.frustumCulled = false;
  scene.add(rail);

  // ---------------------------------------------------------------- the streams, discipline to sector

  const PER_STREAM = nr0 ? 50 : 110;
  const links = [];
  discs.forEach((d) => d.links.forEach((l) => { const j = secAt[l.s]; if (j != null) links.push({ d, S: sectors[j] }); }));
  const NS = links.length * PER_STREAM;
  const sA = new Float32Array(NS * 3), sC = new Float32Array(NS * 3), sB = new Float32Array(NS * 3), sI = new Float32Array(NS * 4);
  links.forEach(({ d, S }, m) => {
    const A = d.pos, B2 = S.pos;
    // up and in toward the axis, then up to the crown
    const C = [A.x * 0.28 + B2.x * 0.25, lerp(A.y, B2.y, 0.72), A.z * 0.28 + B2.z * 0.25];
    for (let i = 0; i < PER_STREAM; i++) {
      const n = m * PER_STREAM + i;
      const j = (Math.random() - 0.5) * 0.05;
      sA.set([A.x + j, A.y + j, A.z + j], n * 3);
      sC.set([C[0] + j * 4, C[1], C[2] + j * 4], n * 3);
      sB.set([B2.x, B2.y, B2.z], n * 3);
      sI.set([d.i, S.i, d.ring, Math.random()], n * 4);
    }
  });
  const sGeo = new THREE.BufferGeometry();
  sGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NS * 3), 3));
  sGeo.setAttribute('aA', new THREE.BufferAttribute(sA, 3));
  sGeo.setAttribute('aC', new THREE.BufferAttribute(sC, 3));
  sGeo.setAttribute('aB', new THREE.BufferAttribute(sB, 3));
  sGeo.setAttribute('aI', new THREE.BufferAttribute(sI, 4));
  const SU = { uTime: TIME, uShow: { value: 0 }, uFocus: { value: new THREE.Vector4() }, uCol: RU.uCol, uPx: PX, uFade: FADE, ...FOG };
  const streams = new THREE.Points(sGeo, ptMat(STREAM_VERT, SU));
  streams.frustumCulled = false;
  scene.add(streams);

  // ---------------------------------------------------------------- the crown, and the dust

  const cPos = new Float32Array(sectors.length * 3), cSize = new Float32Array(sectors.length), cLit = new Float32Array(sectors.length).fill(1);
  sectors.forEach((S, j) => { cPos.set([S.pos.x, S.pos.y, S.pos.z], j * 3); cSize[j] = 7 + 3 * Math.sqrt(S.links.length); });
  const cGeo = new THREE.BufferGeometry();
  cGeo.setAttribute('position', new THREE.BufferAttribute(cPos, 3));
  cGeo.setAttribute('aSize', new THREE.BufferAttribute(cSize, 1));
  const cLitAttr = new THREE.BufferAttribute(cLit, 1).setUsage(THREE.DynamicDrawUsage);
  cGeo.setAttribute('aLit', cLitAttr);
  const CRU = { uPx: PX, uShow: { value: 0 }, uFade: FADE };
  const crown = new THREE.Points(cGeo, new THREE.ShaderMaterial({ vertexShader: CROWN_VERT, fragmentShader: CROWN_FRAG, uniforms: CRU, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  crown.frustumCulled = false;
  scene.add(crown);
  // and a fine ring of grain round the crown, the one ring the sectors sit on
  const HALO = 2400;
  const hPos = new Float32Array(HALO * 3);
  for (let i = 0; i < HALO; i++) { const a = Math.random() * TAU, r = CROWN_R + (Math.random() - 0.5) * 0.03; hPos.set([Math.cos(a) * r, CROWN_Y + (Math.random() - 0.5) * 0.02, Math.sin(a) * r], i * 3); }
  const dustN = nr0 ? 1400 : 3200;
  const dPos = new Float32Array((dustN + HALO) * 3), dSeed = new Float32Array(dustN + HALO);
  for (let i = 0; i < dustN; i++) {
    const a = Math.random() * TAU, r = 1 + Math.random() * 9;
    dPos.set([Math.cos(a) * r, -TOP - 2 + Math.random() * (2 * TOP + 8), Math.sin(a) * r], i * 3);
    dSeed[i] = Math.random();
  }
  dPos.set(hPos, dustN * 3);
  for (let i = dustN; i < dustN + HALO; i++) dSeed[i] = 0.99;
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  dGeo.setAttribute('aSeed', new THREE.BufferAttribute(dSeed, 1));
  const DU = { uPx: PX, uTime: TIME, uShow: { value: 0 }, uFade: FADE };
  const dust = new THREE.Points(dGeo, ptMat(DUST_VERT, DU));
  dust.frustumCulled = false;
  scene.add(dust);

  // ---------------------------------------------------------------- the words in the world

  let focus = null;
  const orbitTags = rings.map((r, k) => {
    const t = el('div', 'hf-o');
    const nThreads = byRing[k].reduce((s, d) => s + d.links.length, 0);
    t.append(el('span', 'hf-o-n', ROMAN[k]), el('span', 'hf-o-name', r.name), el('span', 'hf-o-c', `${byRing[k].length} ${byRing[k].length === 1 ? 'discipline' : 'disciplines'}, ${nThreads} streams`));
    labels.append(t);
    t.addEventListener('pointerenter', () => setFocus({ kind: 'field', k }));
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'field' && focus.k === k) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'field', k } })));
    const p = helAt(k + 0.08, new THREE.Vector3());
    t.anchor = p.add(new THREE.Vector3(p.x, 0, p.z).normalize().multiplyScalar(0.7)).add(new THREE.Vector3(0, 0.55, 0));
    return t;
  });
  const discTags = discs.map((d) => {
    const t = el('span', 'hf-d');
    t.append(el('span', 'hg-tk-box'), el('span', 'hf-d-n', pad2(d.i + 1)), el('span', 'hf-d-name', d.name), el('span', 'hf-d-c', `${d.links.length} of 48`));
    labels.append(t);
    t.addEventListener('pointerenter', () => setFocus({ kind: 'disc', i: d.i }));
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'disc' && focus.i === d.i) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'disc', i: d.i } })));
    t.anchor = d.pos;
    return t;
  });
  const secTags = sectors.map((S) => {
    const t = el('span', 'ha-s', NOTES[S.id]?.short || S.name);
    labels.append(t);
    t.addEventListener('pointerenter', () => setFocus({ kind: 'sector', j: S.i }));
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'sector' && focus.j === S.i) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'sector', j: S.i } })));
    return t;
  });

  // ---------------------------------------------------------------- what is pointed at

  const same = (a, b) => (!a && !b) || (a && b && a.kind === b.kind && a.k === b.k && a.i === b.i && a.j === b.j);
  function fillCard(f) {
    card.textContent = '';
    const head = el('p', 'hc-k');
    const sw = (c) => { const s = el('span', 'hc-sw'); s.style.background = c; head.append(s); };
    if (f.kind === 'field') {
      const k = f.k; sw(rgb(FIELD_COL[k], 0.95));
      head.append(el('span', null, `Orbit ${ROMAN[k]}`));
      card.append(head, el('p', 'hc-name', rings[k].name), el('p', 'hc-note', rings[k].note), el('p', 'hc-list', byRing[k].map((d) => d.name).join(' · ')));
    } else if (f.kind === 'disc') {
      const d = discs[f.i]; sw(rgb(FIELD_COL[d.ring], 0.95));
      head.append(el('span', null, `Orbit ${ROMAN[d.ring]} · ${rings[d.ring].name}`));
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
    const v = SU.uFocus.value;
    if (!f) v.set(0, 0, 0, 0);
    else if (f.kind === 'field') v.set(1, f.k, 0, 0);
    else if (f.kind === 'disc') v.set(2, f.i, 0, 0);
    else v.set(3, f.j, 0, 0);
  }

  // ---------------------------------------------------------------- size, the opening, the scroll

  const view = { W: 1, H: 1, narrow: false };
  function layout() {
    const W = hero.clientWidth, H = hero.clientHeight;
    Object.assign(view, { W, H, narrow: isNarrow(W, H) });
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = view.narrow ? 56 : 44;
    camera.updateProjectionMatrix();
  }
  const O = { reveal: reduced ? 1 : 0, tags: reduced ? 1 : 0 };
  let opened = reduced;
  function openUp() {
    if (opened) return;
    opened = true;
    gsap.timeline()
      .to(O, { reveal: 1, duration: 3.4, ease: 'power2.inOut' }, 0)
      .to(O, { tags: 1, duration: 1.2, ease: 'power2.out' }, 1.8)
      .add(() => hero.classList.add('is-words'), 1.6);
  }
  if (reduced) hero.classList.add('is-words');
  let Pp = 0, Ps = 0;
  ScrollTrigger.create({ trigger: stage, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { Pp = self.progress; } });
  const html = document.documentElement;
  ScrollTrigger.create({
    trigger: stage, start: 'top 55%',
    onEnter: () => { if (html.classList.contains('gate')) addEventListener('mm:enter', openUp, { once: true }); else openUp(); },
  });
  $('.hv-go', hero)?.addEventListener('click', () => {
    openUp();
    lenis.scrollTo(stage.offsetTop + (stage.offsetHeight - innerHeight) * 0.86, { duration: 8, easing: (t) => t * t * (3 - 2 * t) });
  });

  const pointer = { nx: 0, ny: 0, in: false };
  addEventListener('pointermove', (e) => {
    const r = hero.getBoundingClientRect();
    pointer.in = e.clientY >= r.top && e.clientY <= r.bottom;
    pointer.nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
    pointer.ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
  }, { passive: true });
  hero.addEventListener('click', (e) => { if (!e.target.closest('a, button, .hf-o, .hf-d, .ha-s')) setFocus(null); });

  // ---------------------------------------------------------------- the journey

  const proj = new THREE.Vector3();
  const toScreen = (p) => { proj.copy(p).project(camera); return [(proj.x * 0.5 + 0.5) * view.W, (-proj.y * 0.5 + 0.5) * view.H, proj.z]; };
  const P = new THREE.Vector3(), Q = new THREE.Vector3(), nh = new THREE.Vector3(), tmp = new THREE.Vector3();
  const cA = new THREE.Vector3(), cB = new THREE.Vector3(), cC = new THREE.Vector3(), cD = new THREE.Vector3();
  const lA = new THREE.Vector3(), lB = new THREE.Vector3(), lC = new THREE.Vector3(), lD = new THREE.Vector3();
  const camPos = new THREE.Vector3(), camAim = new THREE.Vector3(), aimNow = new THREE.Vector3();
  const upV = new THREE.Vector3(0, 1, 0);
  const clear = new THREE.Color();
  const lit = { rings: new Array(7).fill(1), sectors: new Array(sectors.length).fill(1) };
  let last = performance.now();
  const t0 = last;
  function frame() {
    const tn = performance.now();
    const dt = Math.min(0.05, (tn - last) / 1000);
    last = tn;
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const t = (tn - t0) / 1000;
    // the journey keeps a little momentum of its own
    Ps = reduced ? Pp : damp(Ps, Pp, 3, dt);
    const p = Ps;
    const nr = view.narrow;

    // 1. from below the first ring, outside the spiral, the rings stacked above; then round and up
    //    the outside of it, swinging in close to the rings and out again, so they sweep past
    const along = smooth(0, 0.46, p);
    const a1 = -0.9 + along * TAU * 1.15;
    const swingIn = Math.sin(along * Math.PI * 2.2) * 0.9;
    const rad = (nr ? 8.2 : 6.4) - along * 1.2 - Math.max(0, swingIn) * (nr ? 1.4 : 1.6);
    // (it keeps low on the outside, so that inside every ring is still overhead)
    const y1 = lerp(-TOP - 0.9, -TOP + 0.3, along);
    cA.set(Math.cos(a1) * rad, y1, Math.sin(a1) * rad);
    // looking in and up at the turns above, a little ahead round the spiral
    lA.set(Math.cos(a1 + 0.5) * 1.2, y1 + lerp(2.4, 1.6, along), Math.sin(a1 + 0.5) * 1.2);
    // where the journey is round the spiral, for what follows
    const u = clamp((y1 / PITCH) + LOOPS / 2, 0, LOOPS);
    helAt(u, P);
    // 2. into the middle and straight up through it, the rings passing all round, looking up
    const rise = smooth(0.42, 0.78, p);
    const ry = lerp(-TOP - 0.7, TOP + 0.4, rise);
    const spinA = a1 + rise * 2.2;
    // (looking straight up the middle, the rings are a tunnel of orbits overhead)
    cB.set(Math.cos(spinA) * 0.35, ry, Math.sin(spinA) * 0.35);
    lB.set(Math.cos(spinA + 1.3) * 0.45, ry + 6, Math.sin(spinA + 1.3) * 0.45);
    // 3. out above the crown, looking down into the spiral
    const crownA = spinA + 0.6;
    cC.set(Math.cos(crownA) * 3.2, CROWN_Y + 2.6, Math.sin(crownA) * 3.2);
    lC.set(0, TOP - 1.5, 0);
    // 4. back for the whole of it
    const oa = crownA + 0.5 + 0.06 * Math.sin(t * 0.1);
    const od = nr ? 25 : 20;
    cD.set(Math.cos(oa) * od, TOP * 0.25 + (nr ? 2.8 : 3.4), Math.sin(oa) * od);
    lD.set(0, nr ? 2.2 : 1.8, 0);
    const wB = smooth(0.4, 0.5, p), wC = smooth(0.74, 0.82, p), wD = smooth(0.84, 0.93, p);
    camPos.copy(cA).lerp(cB, wB).lerp(cC, wC).lerp(cD, wD);
    camAim.copy(lA).lerp(lB, wB).lerp(lC, wC).lerp(lD, wD);
    const live = pointer.in && !isTouch;
    camAim.x += live ? pointer.nx * 0.45 * (1 - wD * 0.6) : 0;
    camAim.y += live ? -pointer.ny * 0.3 : 0;
    if (!frame.once) { camera.position.copy(camPos); aimNow.copy(camAim); frame.once = true; }
    camera.position.lerp(camPos, reduced ? 1 : 1 - Math.exp(-6 * dt));
    aimNow.lerp(camAim, reduced ? 1 : 1 - Math.exp(-5 * dt));
    const bank = 0.14 * (1 - wB);
    // looking up the middle, "up" on the screen turns with the journey, so the view never flips
    const upT = wB * (1 - wC);
    camera.up.set(lerp(0, Math.cos(spinA), upT), lerp(1, 0.12, upT), lerp(0, Math.sin(spinA), upT)).normalize();
    camera.up.applyAxisAngle(tmp.subVectors(aimNow, camera.position).normalize(), -bank);
    camera.lookAt(aimNow);
    // the lens opens wider on the climb up the middle
    const fov = (view.narrow ? 56 : 44) + (view.narrow ? 16 : 28) * wB * (1 - wC);
    if (Math.abs(camera.fov - fov) > 0.05) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();

    // depth: close, the far turns sink into the dark; drawn back, the whole shows
    FOG.uFogNear.value = lerp(lerp(lerp(4, 9, wB), 6, wC), 13, wD);
    FOG.uFogFar.value = lerp(lerp(lerp(17, 34, wB), 22, wC), 40, wD);
    const white = smooth(0.94, 0.995, p);
    FADE.value = 1 - white;
    clear.copy(ROOM).lerp(PAPER, white);
    renderer.setClearColor(clear, 1);
    TIME.value = t;
    PX.value = dpr * (nr ? 0.95 : 0.9);
    RU.uReveal.value = O.reveal;
    DU.uShow.value = O.tags;
    LU.uShow.value = O.tags;
    const fk = focus?.kind === 'field' ? focus.k : focus?.kind === 'disc' ? discs[focus.i].ring : -1;
    for (let k = 0; k < 7; k++) {
      const want = !focus ? 1 : fk === k ? 1.6 : focus.kind === 'sector' ? (byRing[k].some((d) => sectors[focus.j].links.some((l) => l.d === d)) ? 1.1 : 0.35) : 0.3;
      lit.rings[k] = damp(lit.rings[k], want, 7, dt);
      RU.uLit.value[k] = lit.rings[k];
    }
    // the streams let out as you go up; the crown kindles as you near it
    SU.uShow.value = Math.max(smooth(0.3, 0.72, p), focus ? 1 : 0);
    CRU.uShow.value = Math.max(smooth(0.5, 0.74, p), focus?.kind === 'sector' ? 1 : 0);
    sectors.forEach((S, j) => {
      const on = !focus || (focus.kind === 'sector' ? S.i === focus.j : focus.kind === 'disc' ? S.links.some((l) => l.d.i === focus.i) : S.links.some((l) => l.d.ring === focus.k));
      lit.sectors[j] = damp(lit.sectors[j], on ? 1 : 0.2, 8, dt);
      cLit[j] = lit.sectors[j];
    });
    cLitAttr.needsUpdate = true;

    // the words: the rings step back behind them
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    SH.uShade.value.set(((cr.left - hr.left - 20) / view.W) * 2 - 1, 1 - ((cr.bottom - hr.top + 10) / view.H) * 2, ((cr.right - hr.left + 20) / view.W) * 2 - 1, 1 - ((cr.top - hr.top - 20) / view.H) * 2);
    SH.uShadeK.value = 0.7 * Math.max(1 - smooth(0.03, 0.1, p), focus ? 1 : 0);
    hero.style.setProperty('--copy', String(1 - smooth(0.03, 0.1, p)));
    caps[0]?.style.setProperty('opacity', String(smooth(0.12, 0.18, p) * (1 - smooth(0.34, 0.4, p))));
    caps[1]?.style.setProperty('opacity', String(smooth(0.6, 0.66, p) * (1 - smooth(0.8, 0.85, p))));

    // the orbits named large as the journey passes them, the disciplines on their rings, the
    // sectors named on the crown as you come up to it
    orbitTags.forEach((tg, k) => {
      const d = tg.anchor.distanceTo(camera.position), s = toScreen(tg.anchor);
      const on = !focus || fk === k;
      // only the orbit level with the journey is named, once the words have stepped aside
      const level = smooth(1.5, 0.5, Math.abs(tg.anchor.y - camera.position.y));
      const a = O.tags * FADE.value * smooth(15, 7, d) * smooth(1.2, 2.8, d) * (s[2] < 1 ? 1 : 0) * (1 - wC) * (focus && fk === k ? 1 : level * smooth(0.06, 0.12, p)) * (on ? 1 : 0.3);
      tg.style.opacity = a.toFixed(3);
      tg.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      tg.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px)`;
    });
    discTags.forEach((tg, i) => {
      const d = tg.anchor.distanceTo(camera.position), s = toScreen(tg.anchor);
      const on = !focus || (focus.kind === 'disc' ? focus.i === i : focus.kind === 'field' ? discs[i].ring === focus.k : discs[i].links.some((l) => secAt[l.s] === focus.j));
      const near = smooth(nr ? 8 : 10, nr ? 3.5 : 4.5, d) * smooth(0.5, 1.2, d);
      const a = O.tags * FADE.value * Math.max(near * (1 - wC), focus && on ? 0.95 * (1 - wD * 0.3) : 0) * (s[2] < 1 ? 1 : 0) * (on ? 1 : 0.22);
      tg.style.opacity = a.toFixed(3);
      tg.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      tg.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px)`;
    });
    secTags.forEach((tg, j) => {
      const S = sectors[j], s = toScreen(S.pos), d = S.pos.distanceTo(camera.position);
      const on = lit.sectors[j] > 0.6;
      const a = O.tags * FADE.value * CRU.uShow.value * (nr ? (focus && on ? 1 : 0) : smooth(16, 6, d) * (focus ? (on ? 1 : 0.15) : 0.75)) * (s[2] < 1 ? 1 : 0);
      tg.style.opacity = a.toFixed(3);
      tg.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      tg.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px)`;
    });
    const paperNow = white > 0.5;
    if (paperNow !== frame.paper) { frame.paper = paperNow; hero.dataset.paper = paperNow ? 'true' : ''; }

    renderer.render(scene, camera);
  }

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  gsap.ticker.add(frame);

  if (local) window.__ascent = { scene, camera, renderer, O, RU, SU, sectors, discs, openUp, setFocus, tick: frame, get p() { return Ps; }, set p(v) { Pp = Ps = v; } };
}
