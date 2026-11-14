// Hero 4 of 4, "the emergence" (10 Nov). The user liked the thinking of hero 3 (the butterfly in the
// brief) and the look of hero 2 (sharp grain in the round, trackers, threads), and asked for the two
// together, better than 2 and not the book video's cards. Their first look at it ("can be way
// better… the interaction as well as the way it is shown on screen and composition") reshaped it
// the same day as a natural history plate:
// - A cocoon hangs on one thread from above the frame, right of centre, as tall as the screen, the
//   words in clean dark to its left. It is wound from fine threads of grain: the seven orbits are
//   seven bands of winding, foot to top, each band's threads crossing the next like silk. The seven
//   are named in a column to its right, each joined to its band by a hairline, like a specimen's
//   labels.
// - It is handled: it swings on its thread when the pointer brushes past, it turns when dragged, and
//   held (on it, or with the "Hold to open it" button) it trembles and opens. Let go early and it
//   winds back. Scrolling plays the same story for anyone who does not touch it.
// - Opening, its winding comes loose from the top and every grain spirals out to a butterfly of the
//   same grain: the seven bands settle as the seven rings of the eyespots on its forewings (hero 3's
//   idea), the silk round it becomes its wings, the inside its body.
// - Then the founder's grid shows as the wing's veins: from each discipline, in its band, a vein to
//   every sector it moves, the forty-eight named round the edge of the wings like a dial (151 veins).
//   Open, the butterfly turns a little toward the pointer and beats its wings when it moves fast.
// - Last it lifts away, and the room turns to the paper the services are printed on.
// Everything is drawn in code from the founder's atlas (js/atlas-data.js); the wing's outline is
// hero 3's (js/hero-eyespot.js). Hover an orbit, a discipline or a sector to read it; click to open
// its metrics (the light orb's panel, js/orb.js, through an 'mm:open' event).
import * as THREE from '../assets/vendor/three.module.min.js';
import { ATLAS } from './atlas-data.js';
import { NOTES } from './sectors-data.js';
import { FIELD_COL } from './orb-scene.js';
import { WING } from './hero-eyespot.js';
import { holdControl } from './hold.js';

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

// ---------------------------------------------------------------- the cocoon
// A silk cocoon, in world units: an oval with rounded ends, a little waisted, about one and three
// quarters as long as it is wide (the user: "it need to be a cocoon"); v runs foot (0) to top (1)
const C_H = 4.3, C_R = 1.26;
const cocY = (v) => (v - 0.5) * C_H;
const cocRad = (v) => C_R * Math.pow(Math.max(0, 1 - (2 * v - 1) ** 2), 0.46) * (1 - 0.06 * Math.exp(-(((v - 0.5) / 0.13) ** 2)));
const bandV = (k) => [k / 7, (k + 1) / 7];
const PIVOT = 6.4; // the thread hangs from this far above its middle, out of the frame

// ---------------------------------------------------------------- the butterfly
// In hero 3's wing units (one scale's width) divided by a hundred, centred on its middle. Its
// eyespots are larger than hero 3's, so the seven orbits read at this distance.
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
attribute vec4 aK; // kind (0 an orbit's winding, 1 the eyespot's core, 2 the silk and the wings, 3 the body), orbit, side, tone
attribute vec4 aP; // height on the cocoon (0 foot, 1 top), -, -, seed
attribute vec3 aA; // where it sits in the cocoon
attribute vec2 aB; // where it lands: on the wing (x from the body, y), or on the body
uniform mat4 uCoc;
uniform mat4 uFly;
uniform float uLit[7];
uniform vec3 uCol[7];
uniform float uLitWing;
uniform float uTime;
uniform float uGather;
uniform float uMorph;
uniform float uShake;
uniform float uFlap;
uniform float uPx;
uniform vec2 uMouse;
uniform float uAspect;
uniform vec4 uShade;
uniform float uShadeK;
varying vec3 vC;
varying float vB;
void main() {
  float kind = aK.x;
  int k = int(max(aK.y, 0.0) + 0.5);
  float side = aK.z, tone = aK.w, v = aP.x, seed = aP.w;
  // spun on, foot to top, when it opens: each grain comes in round the axis to its place
  float g = smoothstep(v * 0.6 + seed * 0.12, v * 0.6 + seed * 0.12 + 0.3, uGather);
  vec3 A = aA;
  float wa = (1.0 - g) * (2.4 + 1.5 * seed);
  A.xz = mat2(cos(wa), -sin(wa), sin(wa), cos(wa)) * A.xz * (1.0 + (1.0 - g) * 1.8);
  A.y += (1.0 - g) * 0.6;
  // held, it trembles
  A += vec3(sin(uTime * 41.0 + seed * 60.0), sin(uTime * 37.0 + seed * 23.0), sin(uTime * 43.0 + seed * 11.0)) * 0.012 * uShake;
  A = (uCoc * vec4(A, 1.0)).xyz;
  // on the butterfly: the wings hinge on the body
  vec3 B = kind > 2.5 ? vec3(aB, 0.0) : vec3(side * aB.x * cos(uFlap), aB.y, -aB.x * sin(uFlap));
  B = (uFly * vec4(B, 1.0)).xyz;
  // the winding comes loose from the top first, and each grain spirals out round the axis
  float st = (1.0 - v) * 0.3 + seed * 0.14 + (kind > 0.5 && kind < 2.5 ? 0.06 : 0.0);
  float s = smoothstep(st, st + 0.5, uMorph);
  vec3 P = mix(A, B, s);
  float sw = s * (1.0 - s) * 4.0;
  float ang = sw * (1.0 + 0.9 * fract(seed * 5.3)) * (fract(seed * 2.1) > 0.5 ? 1.0 : -1.0);
  P.xz = mat2(cos(ang), -sin(ang), sin(ang), cos(ang)) * P.xz;
  P.y += sw * 0.35 * sin(seed * 31.0);
  vec4 mv = viewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mv;
  // the grain parts round the pointer, a little
  vec2 sp = gl_Position.xy / gl_Position.w;
  vec2 dm = (sp - uMouse) * vec2(uAspect, 1.0);
  float push = 0.025 * smoothstep(0.13, 0.0, length(dm)) * g;
  gl_Position.xy += normalize(dm + 1e-5) / vec2(uAspect, 1.0) * push * gl_Position.w;
  float s2 = fract(seed * 7.137);
  gl_PointSize = uPx * (0.7 + 1.1 * s2 * s2) * clamp(6.5 / -mv.z, 0.5, 2.0);
  vec3 c;
  float lit = 1.0;
  if (kind < 0.5) { c = mix(mix(vec3(1.0, 0.98, 0.95), uCol[k], 0.62), uCol[k] * 1.2, s); lit = uLit[k]; }
  else if (kind < 1.5) { c = vec3(1.0, 0.92, 0.8); lit = uLit[0] * mix(0.08, 1.0, s); }
  else if (kind < 2.5) { c = vec3(0.8, 0.76, 0.7); lit = uLitWing * mix(0.16, 1.0, s); }
  else { c = vec3(0.74, 0.74, 0.76); lit = uLitWing * mix(0.06, 1.0, s); }
  vec2 sl = smoothstep(uShade.xy - 0.12, uShade.xy + 0.04, sp) * (1.0 - smoothstep(uShade.zw - 0.04, uShade.zw + 0.12, sp));
  vB = (0.3 + 0.7 * fract(seed * 13.71)) * tone * lit * g * (1.0 - uShadeK * sl.x * sl.y);
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
void main() { vC = aC; vS = aS; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`;
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

export function setupEmergence({ lenis, reduced, isTouch, local }) {
  const stage = $('.stage-4');
  const hero = $('.hv-emerge');
  if (!stage || !hero) return;
  const canvas = $('.hv-gl', hero);
  const labels = $('.hv-labels', hero);
  const card = $('.hv-card', hero);
  const copy = $('.hv-copy', hero);
  const caps = $$('.hv-caption', hero);
  const hint = $('.hx-hint', hero);
  const tagEl = $('.hv-tag', hero);

  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { hero.classList.add('no-gl', 'is-words'); return; }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  const ROOM = new THREE.Color(0x030405);
  const PAPER = ROOM.clone(); // (not the last hero: it ends in the dark, where hero 5 opens)
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
  rings.forEach((_, k) => [1, -1].forEach((sd) => {
    const list = byRing[k].filter((d) => d.side === sd).sort((a, b) => a.a - b.a);
    for (let it = 0; it < 4; it++) for (let i = 1; i < list.length; i++) if (list[i].a - list[i - 1].a < 0.55) list[i].a = list[i - 1].a + 0.55;
  }));
  discs.forEach((d) => {
    const rr = ER * (CORE + (d.ring + 0.5) * BAND);
    d.w = [EYE[0] + Math.cos(d.a) * rr, EYE[1] + (Math.sin(d.a) * rr) / 1.05];
  });

  // ---------------------------------------------------------------- the grain

  const nr0 = isNarrow(innerWidth, innerHeight);
  const PER = nr0 ? 6500 : 17000, NCORE = nr0 ? 1600 : 4000, NWING = nr0 ? 40000 : 105000, NBODY = nr0 ? 4000 : 9000;
  const N = PER * 7 + NCORE + NWING + NBODY;
  const aK = new Float32Array(N * 4), aP = new Float32Array(N * 4), aA = new Float32Array(N * 3), aB = new Float32Array(N * 2);
  let n = 0;
  const put = (kind, k, side, tone, v, A, B) => {
    aK.set([kind, k, side, tone], n * 4);
    aP.set([v, 0, 0, Math.random()], n * 4);
    aA.set(A, n * 3);
    aB.set(B, n * 2);
    n++;
  };
  const inBand = (e0, e1) => {
    const e = Math.sqrt(lerp(e0 * e0, e1 * e1, Math.random())), a = Math.random() * TAU;
    return [EYE[0] + Math.cos(a) * e * ER, EYE[1] + (Math.sin(a) * e * ER) / 1.05];
  };
  const onSpindle = (v, th, k = 1) => { const r = cocRad(v) * k; return [Math.cos(th) * r, cocY(v), Math.sin(th) * r]; };
  // the silk: each band is felted from fibres, short curved runs laid round and across the cocoon
  // the way a silkworm wraps it, mostly round it, some steeper; and a little loose floss outside
  const FIB = 40; // grains along a fibre
  for (let k = 0; k < 7; k++) {
    const [v0, v1] = bandV(k);
    let i = 0;
    while (i < PER) {
      if (Math.random() < 0.1) {
        // floss: loose, a little outside, faint
        const v = lerp(v0, v1, Math.random());
        put(0, k, Math.random() < 0.5 ? 1 : -1, 0.32, v, onSpindle(v, Math.random() * TAU, 1.04 + Math.random() * 0.12), inBand(CORE + k * BAND, CORE + (k + 1) * BAND));
        i++;
        continue;
      }
      const vs = lerp(v0, v1, Math.random()), th0 = Math.random() * TAU;
      const steep = Math.random() < 0.22;
      const a0 = (Math.random() < 0.5 ? 0 : Math.PI) + (Math.random() - 0.5) * (steep ? 2.2 : 1.0);
      const len = 0.28 + Math.random() * 0.62, curve = (Math.random() - 0.5) * 3.2;
      const tone = 0.7 + Math.random() * 0.45;
      for (let j = 0; j < FIB && i < PER; j++, i++) {
        const t = (j / (FIB - 1)) * len;
        const a = a0 + curve * t;
        const v = clamp(vs + (Math.sin(a) * t) / C_H, v0 - 0.01, v1 + 0.01);
        const th = th0 + (Math.cos(a) * t) / Math.max(0.25, cocRad(vs));
        const A = onSpindle(v, th, 1 + (Math.random() - 0.5) * 0.01);
        put(0, k, Math.random() < 0.5 ? 1 : -1, tone, v, A, inBand(CORE + k * BAND, CORE + (k + 1) * BAND));
      }
    }
  }
  // the inside: faint, until it opens
  const inside = () => { const v = Math.random(), th = Math.random() * TAU, r = Math.sqrt(Math.random()) * 0.7; return [v, onSpindle(v, th, r)]; };
  for (let i = 0; i < NCORE; i++) { const [v, A] = inside(); put(1, 0, Math.random() < 0.5 ? 1 : -1, 1.25, v, A, inBand(0, CORE)); }
  // the silk round it becomes the wings: most of it across the wing, more on the veins and the edge,
  // none in the eyespot (its black frame is the gap)
  const veins = [];
  for (let i = 0; i < 8; i++) veins.push(0.06 + i * 0.15 + 0.002 * i * i);
  for (let i = 0; i < 7; i++) veins.push(-0.12 - i * 0.215);
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
      const dx = BASEW[0] - x, dy = BASEW[1] - y, dl = Math.hypot(dx, dy) || 1, inw = Math.random() * 0.03;
      x += (dx / dl) * inw; y += (dy / dl) * inw;
      tone = 1.05;
    }
    const v = Math.random();
    put(2, -1, side, tone, v, onSpindle(v, Math.random() * TAU, 1.035 + Math.random() * 0.03), [x, y]);
  }
  // the inside becomes the body, its head and its antennae
  for (let i = 0; i < NBODY; i++) {
    const f = Math.random();
    let bx, by;
    if (f < 0.32) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); bx = Math.cos(a) * r * 0.13; by = 0.56 + Math.sin(a) * r * 0.48; }
    else if (f < 0.78) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); bx = Math.cos(a) * r * 0.085; by = -0.72 + Math.sin(a) * r * 1.06; }
    else if (f < 0.86) { const a = Math.random() * TAU, r = Math.sqrt(Math.random()); bx = Math.cos(a) * r * 0.12; by = 1.14 + Math.sin(a) * r * 0.12; }
    else { const t = Math.random(), sd = Math.random() < 0.5 ? 1 : -1; bx = sd * lerp(0.04, 0.52, t); by = lerp(1.22, 2.56, t) + (t > 0.94 ? (Math.random() - 0.5) * 0.06 : 0); }
    const [v, A] = inside();
    put(3, -1, 0, 0.9, v, A, [bx, by - WING.MID[1] * U]);
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  ptGeo.setAttribute('aK', new THREE.BufferAttribute(aK, 4));
  ptGeo.setAttribute('aP', new THREE.BufferAttribute(aP, 4));
  ptGeo.setAttribute('aA', new THREE.BufferAttribute(aA, 3));
  ptGeo.setAttribute('aB', new THREE.BufferAttribute(aB, 2));
  // the cocoon hangs from a pivot above the frame (it swings there) and turns on its thread
  const pivot = new THREE.Object3D(), coc = new THREE.Object3D(), fly = new THREE.Object3D();
  pivot.position.y = PIVOT;
  coc.position.y = -PIVOT;
  pivot.add(coc);
  scene.add(pivot, fly);
  const PU = {
    uCoc: { value: coc.matrixWorld }, uFly: { value: fly.matrixWorld },
    uLit: { value: new Array(7).fill(1) }, uCol: { value: FIELD_COL.map((c) => new THREE.Vector3(...c)) }, uLitWing: { value: 1 },
    uTime: { value: 0 }, uGather: { value: reduced ? 1 : 0 }, uMorph: { value: 0 }, uShake: { value: 0 }, uFlap: { value: 0 },
    uPx: { value: dpr * 0.85 }, uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: 1 },
    uShade: { value: new THREE.Vector4(9, 9, 9, 9) }, uShadeK: { value: 0 }, uFade: { value: 1 },
  };
  const points = new THREE.Points(ptGeo, new THREE.ShaderMaterial({ vertexShader: PT_VERT, fragmentShader: PT_FRAG, uniforms: PU, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  points.frustumCulled = false;
  scene.add(points);

  // ---------------------------------------------------------------- lines: the thread it hangs on, the veins

  const lineMat = (U2) => new THREE.ShaderMaterial({ vertexShader: LN_VERT, fragmentShader: LN_FRAG, uniforms: U2, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
  const thrGeo = new THREE.BufferGeometry();
  thrGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 4, 0, 0, -PIVOT + cocY(1) + 0.5, 0], 3));
  thrGeo.setAttribute('aC', new THREE.Float32BufferAttribute([0.85, 0.87, 0.9, 0.7, 0.85, 0.87, 0.9, 0.7], 4));
  thrGeo.setAttribute('aS', new THREE.Float32BufferAttribute([0, 0], 1));
  const TU = { uDraw: { value: 1 }, uFade: { value: 0 } };
  const thread = new THREE.LineSegments(thrGeo, lineMat(TU));
  thread.frustumCulled = false;
  pivot.add(thread);
  // and the fine strands that hold it: from the end of the thread down to the cocoon's top, turning with it
  const holdPos = [], holdCol = [], holdS = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * TAU + 0.3, vv = 0.86 + 0.06 * Math.sin(i * 2.3), rr = cocRad(vv);
    holdPos.push(0, cocY(1) + 0.5, 0, Math.cos(a) * rr, cocY(vv), Math.sin(a) * rr);
    holdCol.push(0.85, 0.87, 0.9, 0.5, 0.85, 0.87, 0.9, 0.35);
    holdS.push(0, 0);
  }
  const holdGeo = new THREE.BufferGeometry();
  holdGeo.setAttribute('position', new THREE.Float32BufferAttribute(holdPos, 3));
  holdGeo.setAttribute('aC', new THREE.Float32BufferAttribute(holdCol, 4));
  holdGeo.setAttribute('aS', new THREE.Float32BufferAttribute(holdS, 1));
  const holdLines = new THREE.LineSegments(holdGeo, thread.material);
  holdLines.frustumCulled = false;
  coc.add(holdLines);

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

  const wv = new THREE.Vector3();
  const onWing = (x, y, side, out = wv) => out.set(side * x * Math.cos(PU.uFlap.value), y, -x * Math.sin(PU.uFlap.value)).applyMatrix4(fly.matrixWorld);
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3();
  function layVeins() {
    veinList.forEach((vn) => {
      const { d, S } = vn;
      const same = d.side === S.side;
      // on the same wing the vein is a curve on the wing itself; to the other wing it runs through the body
      for (let s = 0; s < VSEG; s++) {
        for (let e = 0; e < 2; e++) {
          const u = (s + e) / VSEG, iu = 1 - u;
          const idx = (vn.n * VSEG + s) * 2 + e;
          if (same) {
            const mx = lerp(d.w[0], S.w[0], 0.45) + (S.w[1] - d.w[1]) * 0.12, my = lerp(d.w[1], S.w[1], 0.45) - (S.w[0] - d.w[0]) * 0.12;
            onWing(iu * iu * d.w[0] + 2 * iu * u * mx + u * u * S.w[0], iu * iu * d.w[1] + 2 * iu * u * my + u * u * S.w[1], d.side, tC);
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

  let focus = null, heldOpen = false, morphNow = 0;
  // the specimen's labels: the seven orbits in a column, each joined to its band by a hairline
  const leaders = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  leaders.setAttribute('class', 'hx-leaders');
  labels.append(leaders);
  const specimen = rings.map((r, k) => {
    const t = el('span', 'hx-lab');
    t.append(el('span', 'hx-lab-n', ROMAN[k]), el('span', 'hx-lab-name', r.name), el('span', 'hx-lab-c', `${byRing[k].length} ${byRing[k].length === 1 ? 'discipline' : 'disciplines'}`));
    labels.append(t);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    leaders.append(line);
    t.addEventListener('pointerenter', () => { if (!heldOpen && morphNow < 0.1) setFocus({ kind: 'field', k }); });
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'field' && focus.k === k) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'field', k } })));
    return { t, line };
  });
  // once open: the disciplines in trackers on the eyespots (named while read), the sectors round the wings
  const trackers = discs.map((d) => {
    const t = el('span', 'hg-tk is-quiet');
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
  const veinOn = (vn) => (focus ? (focus.kind === 'sector' ? vn.S.i === focus.j : focus.kind === 'disc' ? vn.d.i === focus.i : vn.d.ring === focus.k) : false);

  // ---------------------------------------------------------------- size, the opening, the scroll

  const view = { W: 1, H: 1, narrow: false };
  function layout() {
    const W = hero.clientWidth, H = hero.clientHeight;
    Object.assign(view, { W, H, narrow: isNarrow(W, H) });
    renderer.setSize(W, H, false);
    leaders.setAttribute('viewBox', `0 0 ${W} ${H}`);
    camera.aspect = W / H;
    camera.fov = view.narrow ? 46 : 36;
    camera.updateProjectionMatrix();
    PU.uAspect.value = W / H;
  }
  const O = { gather: reduced ? 1 : 0, tags: reduced ? 1 : 0 };
  let opened = reduced;
  function openUp() {
    if (opened) return;
    opened = true;
    gsap.timeline()
      .to(O, { gather: 1, duration: 3.4, ease: 'power2.inOut' }, 0)
      .to(O, { tags: 1, duration: 1.2, ease: 'power2.out' }, 2.4)
      .add(() => hero.classList.add('is-words'), 2.0);
  }
  if (reduced) hero.classList.add('is-words');
  let P = 0, Ps = 0;
  ScrollTrigger.create({ trigger: stage, start: 'top top', end: 'bottom bottom', onUpdate: (self) => { P = self.progress; } });
  const html = document.documentElement;
  ScrollTrigger.create({
    trigger: stage, start: 'top 55%',
    onEnter: () => { if (html.classList.contains('gate')) addEventListener('mm:enter', openUp, { once: true }); else openUp(); },
  });

  // ---------------------------------------------------------------- handling it: swing, turn, hold to open
  // The cocoon hangs from a pivot above the frame: the pointer brushing past pushes it, and it swings
  // back on its thread. Dragging turns it. Holding still on it (or holding the button) opens it; let
  // go early and it winds back. Once open it stays open; the button then winds it back.

  const swing = { x: 0, z: 0, vx: 0, vz: 0, spin: 0, vspin: 0 };
  const H = { v: 0 }; // how far a hold on the scene has opened it
  const open = { v: 0 }; // opened for good by a finished hold
  let holdTween = null, btnV = 0;
  const holdBtn = $('.hx-hold', hero);
  const hc = holdBtn && holdControl(holdBtn, {
    duration: reduced ? 0.4 : 2.0,
    isLit: () => heldOpen,
    onStart: () => openUp(),
    onProgress: (v) => { btnV = v; },
    onCommit: () => commitOpen(),
    onRevert: () => windBack(),
    words: { idle: 'Hold to open it', holding: 'Keep holding', short: 'Hold a little longer', lit: 'Wind it back' },
  });
  function commitOpen() {
    if (heldOpen) return;
    heldOpen = true;
    gsap.to(open, { v: 1, duration: reduced ? 0.2 : 1.4, ease: 'power2.out' });
    hc?.sync();
  }
  function windBack() {
    heldOpen = false;
    gsap.to(open, { v: 0, duration: reduced ? 0.2 : 2.4, ease: 'power2.inOut' });
    gsap.to(H, { v: 0, duration: reduced ? 0.2 : 1.2, ease: 'power2.out' });
    hc?.sync();
  }
  // on the scene itself: a press held still is a hold; a press that moves is a drag
  const press = { on: false, x: 0, y: 0, lx: 0, drag: false, holding: false, id: 0, wasDrag: false };
  const letGo = () => { press.holding = false; holdTween?.kill(); if (!heldOpen) holdTween = gsap.to(H, { v: 0, duration: 0.9, ease: 'power2.out' }); };
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    openUp();
    Object.assign(press, { on: true, x: e.clientX, y: e.clientY, lx: e.clientX, drag: false, holding: false, id: e.pointerId, wasDrag: false });
    try { canvas.setPointerCapture?.(e.pointerId); } catch (err) { /* (a pointer that cannot be captured still holds) */ }
    clearTimeout(press.timer);
    if (!heldOpen && morphNow < 0.95) press.timer = setTimeout(() => {
      if (!press.on || press.drag) return;
      press.holding = true;
      holdTween?.kill();
      holdTween = gsap.to(H, { v: 1, duration: reduced ? 0.4 : 2.0 * (1 - H.v), ease: 'sine.out', onComplete: () => { press.holding = false; commitOpen(); } });
    }, 160);
  });
  const endPress = () => {
    if (!press.on) return;
    press.on = false;
    clearTimeout(press.timer);
    if (press.holding) letGo();
    press.wasDrag = press.drag;
  };
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach((t) => canvas.addEventListener(t, endPress));

  // ---------------------------------------------------------------- the pointer

  const pointer = { x: -999, y: -999, nx: 0, ny: 0, in: false, vx: 0, vy: 0, lt: 0 };
  const proj = new THREE.Vector3();
  const toScreen = (p) => { proj.copy(p).project(camera); return [(proj.x * 0.5 + 0.5) * view.W, (-proj.y * 0.5 + 0.5) * view.H, proj.z]; };
  const screen = { discs: [], sectors: [], bands: [], coc: null };
  let secA = 0;
  function pick(x, y) {
    if (O.tags < 0.5 || Ps > 0.88) return null;
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    if (!focus && Ps < 0.1 && x > cr.left - hr.left && x < cr.right - hr.left && y > cr.top - hr.top && y < cr.bottom - hr.top) return null;
    const reach = isTouch ? 24 : 14;
    let best = null, bd = reach;
    if (morphNow > 0.6) {
      screen.discs.forEach(([sx, sy, z], i) => { if (z < 1) { const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = { kind: 'disc', i }; } } });
      if (best) return best;
      bd = reach + 6;
      if (secA > 0.4) screen.sectors.forEach(([sx, sy, z], j) => { if (z < 1) { const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = { kind: 'sector', j }; } } });
      if (best) return best;
      bd = reach;
      screen.bands.forEach((pts, k) => pts.forEach(([sx, sy, z]) => { if (z < 1) { const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = { kind: 'field', k }; } } }));
      return best;
    }
    // the cocoon: the band under the pointer, by its height, within its width
    const c = screen.coc;
    if (morphNow < 0.1 && c) {
      for (let k = 0; k < 7; k++) {
        const b = c[k];
        if (y >= b.top && y <= b.bot && Math.abs(x - b.cx) <= b.hw + 6) return { kind: 'field', k };
      }
    }
    return null;
  }
  const rel = (e) => { const r = hero.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, r]; };
  addEventListener('pointermove', (e) => {
    const [x, y, r] = rel(e);
    const now = performance.now(), dtp = Math.max(8, now - (pointer.lt || now - 16)) / 1000;
    if (pointer.in) { pointer.vx = damp(pointer.vx, (x - pointer.x) / dtp, 12, dtp); pointer.vy = damp(pointer.vy, (y - pointer.y) / dtp, 12, dtp); }
    pointer.lt = now;
    pointer.x = x; pointer.y = y;
    pointer.in = y >= 0 && y <= r.height;
    pointer.nx = clamp((x / r.width) * 2 - 1, -1, 1);
    pointer.ny = clamp((y / r.height) * 2 - 1, -1, 1);
    // a press that moves turns it
    if (press.on && e.pointerId === press.id) {
      if (!press.drag && Math.hypot(e.clientX - press.x, e.clientY - press.y) > 7) {
        press.drag = true;
        if (press.holding) letGo();
      }
      if (press.drag) { swing.vspin += ((e.clientX - press.lx) / view.W) * 9; press.lx = e.clientX; }
      return;
    }
    if (e.pointerType !== 'mouse' || document.querySelector('.disc-panel.is-on')) return;
    if (e.target.closest('a, button, .nav, .hx-lab')) return;
    setFocus(pointer.in ? pick(x, y) : null);
  }, { passive: true });
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button, .hx-lab')) return;
    if (press.wasDrag || H.v > 0.08) { press.wasDrag = false; return; }
    const [x, y] = rel(e);
    const f = pick(x, y);
    if (!f) { setFocus(null); return; }
    if (isTouch && !same(f, focus)) { setFocus(f); return; }
    dispatchEvent(new CustomEvent('mm:open', { detail: f }));
  });

  // ---------------------------------------------------------------- the frame

  const camPos = new THREE.Vector3(), camAim = new THREE.Vector3();
  const lit = { rings: new Array(7).fill(1), discs: new Array(discs.length).fill(1), sectors: new Array(sectors.length).fill(1), wing: 1 };
  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3(), fwd = new THREE.Vector3();
  const clear = new THREE.Color();
  const look = { y: 0, x: 0, beat: 0 };
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

    // how open it is: by the scroll, by a hold, or opened for good
    const scrollM = smooth(0.1, 0.52, p);
    const holdM = Math.max(H.v, btnV) * 0.82;
    const morph = Math.max(scrollM, holdM, open.v);
    morphNow = morph;
    const formed = smooth(0.62, 0.92, morph);
    secA = Math.max(smooth(0.54, 0.7, p), heldOpen ? smooth(0.85, 1, open.v) : 0);
    const lift = smooth(0.86, 1, p);
    const white = smooth(0.92, 0.995, p);
    const holding = press.holding || hc?.holding;
    PU.uShake.value = damp(PU.uShake.value, holding && morph < 0.95 ? 0.35 + Math.max(H.v, btnV) : 0, 10, dt);

    // the cocoon on its thread: pushed by the pointer brushing past, swinging back; turned by a drag
    const cocS = screen.coc;
    if (cocS && pointer.in && !isTouch && !press.on && morph < 0.2) {
      const mid = cocS[3];
      const near = smooth(mid.hw * 2.2, mid.hw * 0.6, Math.abs(pointer.x - mid.cx)) * smooth(cocS[6].top - 40, cocS[6].top + 20, pointer.y) * (1 - smooth(cocS[0].bot - 20, cocS[0].bot + 40, pointer.y));
      swing.vz -= clamp(pointer.vx, -1800, 1800) * 0.00001 * near * dt * 60;
      swing.vx += clamp(pointer.vy, -1800, 1800) * 0.000005 * near * dt * 60;
    }
    pointer.vx *= Math.exp(-6 * dt); pointer.vy *= Math.exp(-6 * dt);
    // (a gentle sway: a few degrees at most, a long thread)
    swing.vx += (-swing.x * 3.2 - swing.vx * 1.1) * dt; swing.x = clamp(swing.x + swing.vx * dt, -0.05, 0.05);
    swing.vz += (-swing.z * 3.2 - swing.vz * 1.1) * dt; swing.z = clamp(swing.z + swing.vz * dt, -0.08, 0.08);
    swing.vspin *= Math.exp(-1.8 * dt);
    swing.spin += (0.07 + swing.vspin) * dt;
    pivot.rotation.set(swing.x + 0.008 * Math.sin(t * 0.5), 0, swing.z + 0.012 * Math.sin(t * 0.37));
    coc.rotation.set(0, swing.spin, 0);

    // open, the butterfly turns a little toward the pointer and beats its wings when it moves fast
    const live = pointer.in && !isTouch;
    look.y = damp(look.y, live ? pointer.nx * 0.28 : 0.06 * Math.sin(t * 0.17), 2.5, dt);
    look.x = damp(look.x, live ? pointer.ny * 0.14 : 0, 2.5, dt);
    look.beat = Math.max(look.beat * Math.exp(-1.6 * dt), live && formed > 0.5 ? clamp(Math.hypot(pointer.vx, pointer.vy) / 2200, 0, 1) : 0);
    fly.position.set(0, 0.1 + lift * 7.5, 0);
    fly.rotation.set(-0.16 + look.x + 0.04 * Math.sin(t * 0.4) - lift * 0.3, look.y, 0);
    PU.uFlap.value = formed * (0.14 + 0.09 * Math.sin(t * 1.05) + look.beat * (0.3 + 0.3 * Math.sin(t * 9))) + lift * (0.35 + 0.45 * Math.abs(Math.sin(t * 7)));
    scene.updateMatrixWorld();

    // the camera: the cocoon right of centre and as tall as the frame, the words to its left (on a
    // phone it hangs above them); drawing to the front of the butterfly as it opens
    const cv = nr ? 8.4 : 6.0; // how much of the world shows top to bottom, round the cocoon
    const d0 = cv / (2 * Math.tan((camera.fov * Math.PI) / 360));
    const d1 = nr ? 16.5 : 12;
    const m2 = smooth(0, 0.9, morph);
    const dist = lerp(d0, d1, m2);
    const ax0 = nr ? 0 : -0.1 * cv * camera.aspect, ay0 = nr ? -0.1 * cv : 0.18;
    // (open on a laptop it sits a little right of centre too, leaving the left for the words)
    const ax1 = nr ? 0 : -0.11 * 2 * d1 * Math.tan((camera.fov * Math.PI) / 360) * camera.aspect;
    const ax = lerp(ax0, ax1, m2), ay = lerp(ay0, nr ? -0.9 : -0.35, m2);
    const camY = lerp(0.9, 0.15, m2) - (live ? pointer.ny * 0.2 : 0);
    camPos.set(ax + (live ? pointer.nx * 0.25 : 0), ay + camY, dist);
    camAim.set(ax, ay, 0);
    camera.position.lerp(camPos, reduced ? 1 : 1 - Math.exp(-5 * dt));
    if (!frame.once) { camera.position.copy(camPos); frame.once = true; }
    camera.lookAt(camAim);
    camera.updateMatrixWorld();

    // light, and what is looked at
    const fk = focus?.kind === 'field' ? focus.k : focus?.kind === 'disc' ? discs[focus.i].ring : -1;
    for (let k = 0; k < 7; k++) {
      const want = !focus ? 1 : fk === k ? 1.8 : focus.kind === 'sector' ? (byRing[k].some((d) => sectors[focus.j].links.some((l) => l.d === d)) ? 1.2 : 0.4) : 0.32;
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
    PU.uMouse.value.set(live && !press.on ? pointer.nx : 9, live && !press.on ? -pointer.ny : 9);
    clear.copy(ROOM).lerp(PAPER, white);
    renderer.setClearColor(clear, 1);
    TU.uFade.value = O.gather * (1 - smooth(0.05, 0.3, morph));

    // the veins let out once it has opened; a looked-at one in its orbit's colour
    VU.uDraw.value = focus && formed > 0.9 ? 1.02 : secA * 1.02;
    VU.uFade.value = fade * (1 - lift * 0.8) * formed;
    layVeins();
    veinList.forEach((vn) => {
      const on = veinOn(vn);
      const a = focus ? (on ? 0.95 : 0.04) : 0.26;
      const c = on ? FIELD_COL[vn.d.ring] : [0.88, 0.86, 0.82];
      for (let i = vn.n * VSEG * 2; i < (vn.n + 1) * VSEG * 2; i++) { vCol[i * 4] = c[0]; vCol[i * 4 + 1] = c[1]; vCol[i * 4 + 2] = c[2]; vCol[i * 4 + 3] = a; }
    });
    veinGeo.attributes.aC.needsUpdate = true;

    // the words: the grain steps back behind them and behind a read card; they step aside as it opens
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    PU.uShade.value.set(((cr.left - hr.left - 20) / view.W) * 2 - 1, 1 - ((cr.bottom - hr.top + 10) / view.H) * 2, ((cr.right - hr.left + 20) / view.W) * 2 - 1, 1 - ((cr.top - hr.top - 20) / view.H) * 2);
    PU.uShadeK.value = 0.7 * Math.max((1 - smooth(0.03, 0.12, p)) * (1 - holdM), focus ? 1 : 0);
    hero.style.setProperty('--copy', String(1 - smooth(0.03, 0.12, p)));
    // opened by hand, the words step aside but the buttons stay, so it can be wound back
    hero.style.setProperty('--hx-words', String(1 - smooth(0.05, 0.4, Math.max(holdM, open.v))));

    // the cocoon on screen: each band's height and width, for the labels and for pointing
    camera.matrixWorld.extractBasis(right, up, fwd);
    screen.coc = rings.map((_, k) => {
      const [v0, v1] = bandV(k), vm = (v0 + v1) / 2;
      tmp.set(0, cocY(vm), 0).applyMatrix4(coc.matrixWorld);
      const c = toScreen(tmp);
      tmp2.copy(tmp).addScaledVector(right, cocRad(vm) * 1.02);
      const e = toScreen(tmp2);
      tmp.set(0, cocY(v1), 0).applyMatrix4(coc.matrixWorld);
      const top = toScreen(tmp)[1];
      tmp.set(0, cocY(v0), 0).applyMatrix4(coc.matrixWorld);
      const bot = toScreen(tmp)[1];
      return { cx: c[0], cy: c[1], ex: e[0], ey: e[1], hw: Math.abs(e[0] - c[0]), top: Math.min(top, bot), bot: Math.max(top, bot) };
    });
    // the specimen's labels, in a column to its right, each joined to its band by a hairline; they go
    // as it opens (on a phone, only the one being read)
    const labA = O.tags * (1 - smooth(0.02, 0.14, morph)) * fade;
    const colX = Math.min(view.W - (nr ? 16 : 40) - (nr ? 150 : 230), Math.max(...screen.coc.map((b) => b.ex)) + (nr ? 40 : 90));
    if (!Number.isFinite(colX)) { renderer.render(scene, camera); return; } // (not laid out yet)
    specimen.forEach(({ t: lab, line }, k) => {
      const b = screen.coc[k];
      const on = !focus || fk === k;
      const a = labA * (on ? 1 : 0.3) * (nr ? (focus && fk === k ? 1 : 0) : 1);
      lab.style.opacity = a.toFixed(3);
      lab.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      lab.style.transform = `translate(${colX.toFixed(1)}px, ${b.cy.toFixed(1)}px)`;
      lab.classList.toggle('is-on', !!focus && fk === k);
      line.setAttribute('d', `M${(b.ex + 6).toFixed(1)} ${b.ey.toFixed(1)} L${(colX - 10).toFixed(1)} ${b.cy.toFixed(1)}`);
      line.style.opacity = (a * (focus && fk === k ? 1 : 0.55)).toFixed(3);
    });
    // (the hero's own tag steps back while the sectors are named round the wings, which reach it)
    if (tagEl) tagEl.style.opacity = (0.85 * (1 - secA * formed)).toFixed(3);
    if (hint) hint.style.opacity = (O.tags * (1 - smooth(0.02, 0.1, morph)) * (1 - smooth(0.03, 0.1, p))).toFixed(3);

    // the trackers on the eyespots, once open
    screen.discs = discs.map((d, i) => {
      onWing(d.w[0], d.w[1], d.side, tmp);
      const sp = toScreen(tmp);
      const on = discOn(d);
      lit.discs[i] = damp(lit.discs[i], on ? 1 : 0.16, 8, dt);
      const op = O.tags * formed * lit.discs[i] * fade * (1 - lift) * (sp[2] < 1 ? 1 : 0);
      const tk = trackers[i];
      tk.style.opacity = op.toFixed(3);
      tk.style.transform = `translate(${sp[0].toFixed(1)}px, ${sp[1].toFixed(1)}px)`;
      const named = !!focus && on && focus.kind !== 'sector';
      tk.classList.toggle('is-on', named);
      tk.classList.toggle('is-quiet', !named);
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
      tg.style.opacity = (secA * formed * lit.sectors[j] * show * fade * (1 - lift) * (1 - 0.92 * underCard(lp[0], lp[1]))).toFixed(3);
      tg.style.transform = `translate(${lp[0].toFixed(1)}px, ${lp[1].toFixed(1)}px)`;
      return sp;
    });
    // the eyespots' bands, to point at once open
    screen.bands = rings.map((_, k) => {
      const out = [];
      if (morph > 0.6) {
        const rr = ER * (CORE + (k + 0.5) * BAND);
        [1, -1].forEach((sd) => { for (let j = 0; j < 18; j++) { const a = (j / 18) * TAU; onWing(EYE[0] + Math.cos(a) * rr, EYE[1] + (Math.sin(a) * rr) / 1.05, sd, tmp); out.push(toScreen(tmp)); } });
      }
      return out;
    });

    caps[0]?.style.setProperty('opacity', String(smooth(0.12, 0.2, p) * (1 - smooth(0.34, 0.4, p)) * (1 - open.v)));
    caps[1]?.style.setProperty('opacity', String(smooth(0.64, 0.72, p) * (1 - smooth(0.84, 0.88, p))));

    renderer.render(scene, camera);
  }

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  gsap.ticker.add(frame);

  if (local) window.__emergence = { scene, camera, renderer, O, PU, H, open, swing, sectors, discs, openUp, setFocus, pick, commitOpen, windBack, tick: frame, get screen() { return screen; }, get p() { return Ps; }, set p(v) { P = Ps = v; } };
}
