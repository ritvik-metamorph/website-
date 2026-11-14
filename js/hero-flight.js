// Hero 6 of 6, "the flight" (10 Nov). The user loved the composition of the first video the client
// sent (a sculpture of rings made of thousands of small book covers, flown through) and asked for a
// variant like it, "use camera movement and travel and make it look crazy good". Its composition,
// built from our own data and nothing of its elements:
// - One long helix of tubes climbs through the dark, a turn for each of the seven orbits, from the
//   ground of being at the foot to the return at the top. Each turn is cut into its orbit's
//   disciplines, and each discipline's stretch of tube is the founder's grid for it: 48 columns, one
//   for each sector, and round each column twelve small printed cards, two for each of the six
//   forces. About fifteen thousand cards. A card is printed in its force's ink where the discipline
//   moves that sector that way (the Sectors page's inks); the rest are pale, tinted by their sector's
//   family, so each stretch carries the same nine bands of hue along it.
// - A fine rail runs beside the tube with its ticks, the orbits are named large and the disciplines
//   small along it, and above the top hangs a cluster of the forty-eight sectors as printed cards,
//   each sized by how many disciplines move it, with a thread from every inked card up to its
//   sector: a hundred and fifty-one.
// - The scroll is a flight: close along the tube from the foot, the cards going past, the other
//   turns across the middle; up through the centre into the threads; then back and over the top for
//   the whole of it. Last, the room turns to the paper the services are printed on.
// - The cards open as it comes into view, a wave of them turning over along the helix. Hover an
//   inked card, a discipline's name, an orbit's or a sector to read it; click to open its metrics
//   (the light orb's panel, js/orb.js, through an 'mm:open' event).
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
const hex = (h) => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

// the six forces, in the Sectors page's inks for the night (css/sectors.css)
const FORCES = ['unlocks', 'reprices', 'derisks', 'constrains', 'legitimises', 'restructures'];
const FORCE_INK = { unlocks: '#5cc48e', reprices: '#e6b24f', derisks: '#6ea2ef', constrains: '#ef7457', legitimises: '#b791e6', restructures: '#e9e3d6' };
// the sectors' families, each a hue for the pale cards of its columns (hero 2's)
const FAM_COL = { land: '#7f9257', energy: '#c8752e', move: '#4d7ca6', make: '#948a80', body: '#b65858', money: '#c6a02a', signal: '#4f8f88', want: '#9c5f8c', mean: '#6a6db4' };

// ---------------------------------------------------------------- the helix
const LOOPS = 7, PITCH = 1.25, TUBE = 0.24, AROUND = 12;
const helR = (u) => 3.4 + 0.55 * Math.sin(u * 1.27 + 0.4);
const helX = (u) => Math.cos(u * TAU) * helR(u), helZ = (u) => Math.sin(u * TAU) * helR(u), helY = (u) => (u - LOOPS / 2) * PITCH;
const TOP = helY(LOOPS);
function frameAt(u, P, T, Nh, B) {
  P.set(helX(u), helY(u), helZ(u));
  const e = 0.0005;
  T.set(helX(u + e) - helX(u - e), helY(u + e) - helY(u - e), helZ(u + e) - helZ(u - e)).normalize();
  // the horizontal normal, pointing out from the axis, and the one at right angles to both
  Nh.set(T.z, 0, -T.x).normalize();
  if (Nh.x * P.x + Nh.z * P.z < 0) Nh.negate();
  B.crossVectors(T, Nh).normalize();
  if (B.y < 0) B.negate();
}

const CARD_VERT = /* glsl */ `
attribute vec3 aCol;
attribute vec4 aMark; // the mark's colour, and which mark
attribute vec4 aInfo; // inked, orbit, discipline, sector
attribute float aDelay;
uniform float uReveal;
uniform vec4 uFocus; // kind (0 none, 1 orbit, 2 discipline, 3 sector), index
uniform vec4 uShade;
uniform float uShadeK;
varying vec2 vUv;
varying vec3 vCol;
varying vec4 vMark;
varying float vLit;
varying vec3 vN;
varying vec3 vV;
varying float vDepth;
varying float vInk;
void main() {
  vUv = uv;
  vCol = aCol; vMark = aMark; vInk = aInfo.x;
  // a wave of cards turns over along the helix as it opens
  float a = smoothstep(aDelay, aDelay + 0.14, uReveal);
  vec3 p = position * vec3(1.0, a, 1.0);
  float r = (1.0 - a) * 1.4;
  p.yz = mat2(cos(r), -sin(r), sin(r), cos(r)) * p.yz;
  vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
  vec4 mv = viewMatrix * w;
  gl_Position = projectionMatrix * mv;
  vN = normalize(mat3(modelMatrix * instanceMatrix) * vec3(0.0, 0.0, 1.0));
  vV = cameraPosition - w.xyz;
  vDepth = -mv.z;
  // what is looked at keeps its light; the rest steps back
  float on = 1.0;
  if (uFocus.x > 0.5) {
    float idx = uFocus.x < 1.5 ? aInfo.y : uFocus.x < 2.5 ? aInfo.z : aInfo.w;
    on = abs(idx - uFocus.y) < 0.5 ? 1.0 : 0.22;
  }
  vec2 sp = gl_Position.xy / gl_Position.w;
  vec2 sl = smoothstep(uShade.xy - 0.1, uShade.xy + 0.04, sp) * (1.0 - smoothstep(uShade.zw - 0.04, uShade.zw + 0.1, sp));
  vLit = on * a * (1.0 - uShadeK * sl.x * sl.y);
}`;
const CARD_FRAG = /* glsl */ `
precision highp float;
uniform float uFogNear;
uniform float uFogFar;
uniform float uFade;
uniform vec3 uRoom;
varying vec2 vUv;
varying vec3 vCol;
varying vec4 vMark;
varying float vLit;
varying vec3 vN;
varying vec3 vV;
varying float vDepth;
varying float vInk;
void main() {
  // a small printed card: its ground, a band across the top, a line of type, and a fine edge
  vec3 c = vCol;
  float m = vMark.w;
  float band = step(0.74, vUv.y) * step(vUv.y, 0.9);
  float line1 = step(0.2, vUv.x) * step(vUv.x, 0.8 - 0.25 * fract(m * 7.0)) * step(0.42, vUv.y) * step(vUv.y, 0.5);
  float line2 = step(0.2, vUv.x) * step(vUv.x, 0.6) * step(0.3, vUv.y) * step(vUv.y, 0.34) * step(0.5, fract(m * 3.0));
  float dot1 = step(length((vUv - vec2(0.5 + 0.2 * (fract(m * 5.0) - 0.5), 0.6)) * vec2(1.0, 1.4)), 0.08) * step(0.66, fract(m * 11.0));
  c = mix(c, vMark.rgb, max(max(band, line1), max(line2, dot1)));
  vec2 e = min(vUv, 1.0 - vUv);
  c *= 0.62 + 0.38 * smoothstep(0.0, 0.06, min(e.x, e.y));
  // lit from above and from where you are, with a glint as it turns past
  vec3 N = normalize(vN);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(vV);
  vec3 L = normalize(vec3(0.35, 0.85, 0.4));
  float dif = 0.36 + 0.4 * max(dot(N, L), 0.0) + 0.34 * max(dot(N, V), 0.0);
  float spec = pow(max(dot(reflect(-L, N), V), 0.0), 28.0) * (0.35 + 0.5 * vInk);
  c = c * dif + spec;
  c *= mix(0.5, 1.0, vLit) * vLit;
  // the far turns sink into the dark
  float f = smoothstep(uFogNear, uFogFar, vDepth);
  c = mix(c, uRoom, f);
  gl_FragColor = vec4(mix(uRoom, c, uFade), 1.0);
}`;
const LN_VERT = /* glsl */ `
attribute vec4 aC;
attribute float aS;
varying vec4 vC;
varying float vS;
varying float vDepth;
void main() {
  vC = aC; vS = aS;
  vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const LN_FRAG = /* glsl */ `
precision highp float;
uniform float uDraw;
uniform float uFade;
uniform float uFogNear;
uniform float uFogFar;
varying vec4 vC;
varying float vS;
varying float vDepth;
void main() {
  if (vS > uDraw) discard;
  float f = 1.0 - smoothstep(uFogNear, uFogFar, vDepth);
  gl_FragColor = vec4(vC.rgb * vC.a * uFade * f, 1.0);
}`;
const SEC_VERT = /* glsl */ `
attribute vec4 aUv;
attribute float aLit;
varying vec2 vUv;
varying float vLit;
varying float vDepth;
void main() {
  vUv = vec2(mix(aUv.x, aUv.z, uv.x), mix(aUv.y, aUv.w, uv.y));
  vLit = aLit;
  vec4 mv = viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
  vDepth = -mv.z;
  gl_Position = projectionMatrix * mv;
}`;
const SEC_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uFade;
uniform float uFogNear;
uniform float uFogFar;
uniform vec3 uRoom;
varying vec2 vUv;
varying float vLit;
varying float vDepth;
void main() {
  vec3 c = texture2D(uMap, vUv).rgb * vLit;
  c = mix(c, uRoom, smoothstep(uFogNear, uFogFar, vDepth));
  gl_FragColor = vec4(mix(uRoom, c, uFade), 1.0);
}`;

export function setupFlight({ lenis, reduced, isTouch, local }) {
  const stage = $('.stage-6');
  const hero = $('.hv-flight');
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
  const PAPER = ROOM.clone(); // (not the last hero now: it ends in the dark, where hero 7 opens)
  renderer.setClearColor(ROOM, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.03, 120);
  const roomV = new THREE.Vector3(ROOM.r, ROOM.g, ROOM.b);

  // ---------------------------------------------------------------- the founder's data

  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  const famOrder = Object.keys(ATLAS.families);
  // the columns: the sectors by family, so each stretch carries the same bands of hue
  const cols = [...ATLAS.sectors].map((s, i) => ({ ...s, i })).sort((a, b) => famOrder.indexOf(a.fam) - famOrder.indexOf(b.fam) || a.i - b.i);
  const sectors = ATLAS.sectors.map((s, i) => ({ ...s, i, links: [] }));
  const secAt = Object.fromEntries(sectors.map((s) => [s.id, s.i]));
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) S.links.push({ d, f: l.f }); }));
  // each discipline's stretch of its orbit's turn
  const GAP = 0.014;
  byRing.forEach((list, k) => list.forEach((d, j) => { d.u0 = k + j / list.length + GAP; d.u1 = k + (j + 1) / list.length - GAP; }));

  // ---------------------------------------------------------------- the cards

  const N = discs.length * cols.length * AROUND;
  const CW = 0.118, CH = 0.112; // a card's size along the tube, and round it (scaled to its stretch below)
  const geo = new THREE.PlaneGeometry(1, 1);
  const aCol = new Float32Array(N * 3), aMark = new Float32Array(N * 4), aInfo = new Float32Array(N * 4), aDelay = new Float32Array(N);
  const cards = new THREE.InstancedMesh(geo, null, N);
  const P = new THREE.Vector3(), T = new THREE.Vector3(), Nh = new THREE.Vector3(), B = new THREE.Vector3(), Nr = new THREE.Vector3(), Ar = new THREE.Vector3();
  const M = new THREE.Matrix4(), Q = new THREE.Matrix4();
  const paper = [0.9, 0.89, 0.86];
  const inked = []; // one card a link, the outer one: what is pointed at, and where its thread starts
  let n = 0;
  discs.forEach((d) => {
    const linkOf = {};
    d.links.forEach((l) => { linkOf[l.s] = l.f; });
    // the stretch's length decides the cards' size along it
    const segLen = (d.u1 - d.u0) * TAU * helR((d.u0 + d.u1) / 2);
    const along = Math.min(CW, (segLen / cols.length) * 0.86);
    cols.forEach((S, c) => {
      const u = lerp(d.u0, d.u1, (c + 0.5) / cols.length);
      frameAt(u, P, T, Nh, B);
      const f = linkOf[S.id];
      const fam = hex(FAM_COL[S.fam] || '#888888');
      for (let a = 0; a < AROUND; a++) {
        const ang = ((a + (c % 2) * 0.5) / AROUND) * TAU;
        Nr.copy(Nh).multiplyScalar(Math.cos(ang)).addScaledVector(B, Math.sin(ang)); // out from the tube
        Ar.crossVectors(Nr, T).normalize(); // round the tube
        const lit = f && FORCES[Math.floor(a / 2)] === f;
        const rnd = Math.random();
        // shingled a little, the way cards stand on a rod
        const lift = 0.006 + rnd * 0.018 + (lit ? 0.02 : 0);
        M.makeBasis(T, Ar, Nr);
        const tilt = (Math.random() - 0.5) * 0.5;
        Q.makeRotationX(tilt);
        M.multiply(Q);
        M.scale(new THREE.Vector3(along, CH * (lit ? 1.12 : 1), 1));
        M.setPosition(P.x + Nr.x * (TUBE + lift), P.y + Nr.y * (TUBE + lift), P.z + Nr.z * (TUBE + lift));
        cards.setMatrixAt(n, M);
        if (lit) {
          const ink = hex(FORCE_INK[f]);
          aCol.set(ink, n * 3);
          aMark.set([1, 1, 1, rnd], n * 4);
        } else {
          // pale, tinted by the sector's family, each a little its own
          const k = 0.16 + 0.12 * Math.random(), b = 0.62 + 0.38 * Math.random();
          aCol.set([lerp(paper[0], fam[0], k) * b, lerp(paper[1], fam[1], k) * b, lerp(paper[2], fam[2], k) * b], n * 3);
          aMark.set([fam[0] * 0.55, fam[1] * 0.55, fam[2] * 0.55, rnd], n * 4);
        }
        aInfo.set([lit ? 1 : 0, d.ring, d.i, secAt[S.id]], n * 4);
        aDelay[n] = (u / LOOPS) * 0.82 + Math.random() * 0.06;
        if (lit && a % 2 === 0) inked.push({ d, S: sectors[secAt[S.id]], f, n, pos: new THREE.Vector3(P.x + Nr.x * TUBE, P.y + Nr.y * TUBE, P.z + Nr.z * TUBE), out: Nr.clone() });
        n++;
      }
    });
  });
  geo.setAttribute('aCol', new THREE.InstancedBufferAttribute(aCol, 3));
  geo.setAttribute('aMark', new THREE.InstancedBufferAttribute(aMark, 4));
  geo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(aInfo, 4));
  geo.setAttribute('aDelay', new THREE.InstancedBufferAttribute(aDelay, 1));
  const FOG = { uFogNear: { value: 6 }, uFogFar: { value: 30 } };
  const CU = {
    uReveal: { value: reduced ? 1 : 0 }, uFocus: { value: new THREE.Vector4(0, 0, 0, 0) },
    uShade: { value: new THREE.Vector4(9, 9, 9, 9) }, uShadeK: { value: 0 }, uFade: { value: 1 }, uRoom: { value: roomV },
    uFogNear: FOG.uFogNear, uFogFar: FOG.uFogFar,
  };
  cards.material = new THREE.ShaderMaterial({ vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, uniforms: CU, side: THREE.DoubleSide });
  cards.frustumCulled = false;
  cards.instanceMatrix.needsUpdate = true;
  scene.add(cards);

  // ---------------------------------------------------------------- the rail beside the tube, and its ticks

  const railPos = [], railCol = [], railS = [];
  const RS = 1400;
  const railAt = (u, out) => { frameAt(u, P, T, Nh, B); return out.copy(P).addScaledVector(Nh, 0.62).addScaledVector(B, 0.16); };
  const ra = new THREE.Vector3(), rb = new THREE.Vector3();
  for (let i = 0; i < RS; i++) {
    railAt((i / RS) * LOOPS, ra); railAt(((i + 1) / RS) * LOOPS, rb);
    railPos.push(ra.x, ra.y, ra.z, rb.x, rb.y, rb.z);
    railCol.push(0.86, 0.85, 0.82, 0.32, 0.86, 0.85, 0.82, 0.32); railS.push(0, 0);
  }
  discs.forEach((d) => {
    for (let c = 0; c <= cols.length; c += 4) {
      const u = lerp(d.u0, d.u1, c / cols.length);
      railAt(u, ra);
      const len = c === 0 || c === cols.length ? 0.16 : 0.05;
      railPos.push(ra.x, ra.y - len, ra.z, ra.x, ra.y + len, ra.z);
      railCol.push(0.9, 0.88, 0.84, 0.55, 0.9, 0.88, 0.84, 0.55); railS.push(0, 0);
    }
  });
  const lineMat = (U2) => new THREE.ShaderMaterial({ vertexShader: LN_VERT, fragmentShader: LN_FRAG, uniforms: U2, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true });
  const railGeo = new THREE.BufferGeometry();
  railGeo.setAttribute('position', new THREE.Float32BufferAttribute(railPos, 3));
  railGeo.setAttribute('aC', new THREE.Float32BufferAttribute(railCol, 4));
  railGeo.setAttribute('aS', new THREE.Float32BufferAttribute(railS, 1));
  const RU = { uDraw: { value: 1 }, uFade: { value: 0 }, uFogNear: FOG.uFogNear, uFogFar: FOG.uFogFar };
  const rail = new THREE.LineSegments(railGeo, lineMat(RU));
  rail.frustumCulled = false;
  scene.add(rail);

  // ---------------------------------------------------------------- the sectors above, and the threads up to them

  sectors.forEach((S, j) => {
    const a = j * 2.399 + 0.3, rr = 0.35 + 1.9 * Math.sqrt(((j * 7) % 48) / 48);
    S.pos = new THREE.Vector3(Math.cos(a) * rr, TOP + 1.7 + ((j * 13) % 48) / 48 * 2.6, Math.sin(a) * rr);
    S.w = 0.34 + 0.11 * Math.sqrt(S.links.length);
  });
  const COLS = 8, ROWS = 6, TW = 240, TH = 320;
  const sheet = document.createElement('canvas');
  sheet.width = COLS * TW; sheet.height = ROWS * TH;
  const tex = new THREE.CanvasTexture(sheet);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  function printSheet() {
    const c = sheet.getContext('2d');
    sectors.forEach((S, j) => {
      const x = (j % COLS) * TW, y = Math.floor(j / COLS) * TH;
      c.fillStyle = '#ebe9e3'; c.fillRect(x, y, TW, TH);
      c.fillStyle = FAM_COL[S.fam] || '#888'; c.fillRect(x, y, TW, 14);
      c.fillStyle = '#141917';
      c.font = '500 36px "Noto Serif Display", "Noto Serif", Georgia, serif';
      const words = (NOTES[S.id]?.short || S.name).split(' ');
      const lines = []; let line = '';
      words.forEach((w) => { const t = line ? `${line} ${w}` : w; if (c.measureText(t).width > TW - 36 && line) { lines.push(line); line = w; } else line = t; });
      if (line) lines.push(line);
      lines.slice(0, 4).forEach((l, i) => c.fillText(l, x + 18, y + 64 + i * 40));
      c.fillStyle = '#5b625e';
      c.font = '400 18px "Instrument Sans", system-ui, sans-serif';
      c.fillText(ATLAS.families[S.fam] || '', x + 18, y + TH - 50);
      c.font = '400 17px "Fragment Mono", ui-monospace, monospace';
      c.fillText(`${S.links.length} ${S.links.length === 1 ? 'discipline' : 'disciplines'}`, x + 18, y + TH - 22);
      // its forces, a bead of each ink that moves it
      S.links.forEach((l, i) => { c.fillStyle = FORCE_INK[l.f] || '#888'; c.beginPath(); c.arc(x + TW - 24 - i * 16, y + TH - 28, 5, 0, TAU); c.fill(); });
    });
    tex.needsUpdate = true;
  }
  printSheet();
  document.fonts?.ready.then(printSheet);
  const secGeo = new THREE.PlaneGeometry(1, 1.33);
  const sUv = new Float32Array(sectors.length * 4), sLit = new Float32Array(sectors.length).fill(1);
  sectors.forEach((S, j) => { const u0 = (j % COLS) / COLS, v1 = 1 - Math.floor(j / COLS) / ROWS; sUv.set([u0, v1 - 1 / ROWS, u0 + 1 / COLS, v1], j * 4); });
  secGeo.setAttribute('aUv', new THREE.InstancedBufferAttribute(sUv, 4));
  const sLitAttr = new THREE.InstancedBufferAttribute(sLit, 1).setUsage(THREE.DynamicDrawUsage);
  secGeo.setAttribute('aLit', sLitAttr);
  const SU = { uMap: { value: tex }, uFade: { value: 1 }, uRoom: { value: roomV }, uFogNear: FOG.uFogNear, uFogFar: FOG.uFogFar };
  const secCards = new THREE.InstancedMesh(secGeo, new THREE.ShaderMaterial({ vertexShader: SEC_VERT, fragmentShader: SEC_FRAG, uniforms: SU, side: THREE.DoubleSide }), sectors.length);
  secCards.frustumCulled = false;
  scene.add(secCards);
  const tmpO = new THREE.Object3D();
  function faceSectors() {
    sectors.forEach((S, j) => {
      tmpO.position.copy(S.pos);
      tmpO.rotation.set(0, Math.atan2(camera.position.x - S.pos.x, camera.position.z - S.pos.z), 0);
      tmpO.scale.setScalar(S.w * (0.6 + 0.4 * secShow));
      tmpO.updateMatrix();
      secCards.setMatrixAt(j, tmpO.matrix);
    });
    secCards.instanceMatrix.needsUpdate = true;
  }
  // the threads: from each inked card up and in toward the axis, then up to its sector
  const TSEG = 22;
  const tPos = new Float32Array(inked.length * TSEG * 2 * 3), tCol = new Float32Array(inked.length * TSEG * 2 * 4), tS = new Float32Array(inked.length * TSEG * 2);
  inked.forEach((k, m) => {
    const A = k.pos, Bp = k.S.pos;
    const Cp = new THREE.Vector3(A.x * 0.35 + Bp.x * 0.3, lerp(A.y, Bp.y, 0.7), A.z * 0.35 + Bp.z * 0.3);
    for (let s = 0; s < TSEG; s++) for (let e = 0; e < 2; e++) {
      const u = (s + e) / TSEG, iu = 1 - u, v = (m * TSEG + s) * 2 + e;
      tPos[v * 3] = iu * iu * A.x + 2 * iu * u * Cp.x + u * u * Bp.x;
      tPos[v * 3 + 1] = iu * iu * A.y + 2 * iu * u * Cp.y + u * u * Bp.y;
      tPos[v * 3 + 2] = iu * iu * A.z + 2 * iu * u * Cp.z + u * u * Bp.z;
      tS[v] = u;
    }
  });
  const thrGeo = new THREE.BufferGeometry();
  thrGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
  thrGeo.setAttribute('aC', new THREE.BufferAttribute(tCol, 4).setUsage(THREE.DynamicDrawUsage));
  thrGeo.setAttribute('aS', new THREE.BufferAttribute(tS, 1));
  const TU = { uDraw: { value: 0 }, uFade: { value: 1 }, uFogNear: { value: 30 }, uFogFar: { value: 80 } };
  const threads = new THREE.LineSegments(thrGeo, lineMat(TU));
  threads.frustumCulled = false;
  scene.add(threads);

  // ---------------------------------------------------------------- the words in the world

  const orbitTags = rings.map((r, k) => {
    const t = el('div', 'hf-o');
    const nThreads = byRing[k].reduce((s, d) => s + d.links.length, 0);
    t.append(el('span', 'hf-o-n', ROMAN[k]), el('span', 'hf-o-name', r.name), el('span', 'hf-o-c', `${byRing[k].length} ${byRing[k].length === 1 ? 'discipline' : 'disciplines'}, ${nThreads} threads`));
    labels.append(t);
    t.addEventListener('pointerenter', () => setFocus({ kind: 'field', k }));
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'field' && focus.k === k) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'field', k } })));
    const u = k + 0.04;
    frameAt(u, P, T, Nh, B);
    t.anchor = P.clone().addScaledVector(Nh, 0.95).addScaledVector(B, 0.62);
    return t;
  });
  const discTags = discs.map((d) => {
    const t = el('span', 'hf-d');
    t.append(el('span', 'hf-d-n', pad2(d.i + 1)), el('span', 'hf-d-name', d.name), el('span', 'hf-d-c', `${d.links.length} of 48`));
    labels.append(t);
    t.addEventListener('pointerenter', () => setFocus({ kind: 'disc', i: d.i }));
    t.addEventListener('pointerleave', () => { if (focus?.kind === 'disc' && focus.i === d.i) setFocus(null); });
    t.addEventListener('click', () => dispatchEvent(new CustomEvent('mm:open', { detail: { kind: 'disc', i: d.i } })));
    frameAt(d.u0 + 0.004, P, T, Nh, B);
    t.anchor = P.clone().addScaledVector(Nh, 0.62).addScaledVector(B, 0.42);
    return t;
  });

  // ---------------------------------------------------------------- what is pointed at

  let focus = null;
  const same = (a, b) => (!a && !b) || (a && b && a.kind === b.kind && a.k === b.k && a.i === b.i && a.j === b.j && a.n === b.n);
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
    } else if (f.kind === 'sector') {
      const S = sectors[f.j]; sw(FAM_COL[S.fam] || '#888');
      head.append(el('span', null, `A sector · ${ATLAS.families[S.fam] || ''}`));
      card.append(head, el('p', 'hc-name', S.name), el('p', 'hc-note', S.links.length ? `Moved by ${S.links.length} ${S.links.length === 1 ? 'discipline' : 'disciplines'}.` : 'Not yet mapped in the atlas.'), el('p', 'hc-list', S.links.map((l) => `${l.d.name} ${ATLAS.forces[l.f]?.label || l.f} it`).join(' · ')));
    } else {
      const k = inked[f.n]; sw(FORCE_INK[k.f]);
      head.append(el('span', null, `A card · ${ATLAS.forces[k.f]?.label || k.f}`));
      card.append(head, el('p', 'hc-name', `${k.d.name} ${ATLAS.forces[k.f]?.label || k.f} ${k.S.name}`), el('p', 'hc-note', ATLAS.forces[k.f]?.note ? `${ATLAS.forces[k.f].label.charAt(0).toUpperCase()}${ATLAS.forces[k.f].label.slice(1)}: ${ATLAS.forces[k.f].note}.` : ''));
    }
  }
  function setFocus(f) {
    if (same(f, focus)) return;
    focus = f;
    if (f) fillCard(f);
    card.classList.toggle('is-on', !!f);
    hero.classList.toggle('is-reading', !!f);
    canvas.style.cursor = f ? 'pointer' : '';
    const v = CU.uFocus.value;
    if (!f) v.set(0, 0, 0, 0);
    else if (f.kind === 'field') v.set(1, f.k, 0, 0);
    else if (f.kind === 'disc') v.set(2, f.i, 0, 0);
    else if (f.kind === 'sector') v.set(3, f.j, 0, 0);
    else v.set(2, inked[f.n].d.i, 0, 0);
  }
  const threadOn = (k) => (focus ? (focus.kind === 'sector' ? k.S.i === focus.j : focus.kind === 'disc' ? k.d.i === focus.i : focus.kind === 'field' ? k.d.ring === focus.k : k.d.i === inked[focus.n].d.i) : false);

  // ---------------------------------------------------------------- size, the opening, the scroll

  const view = { W: 1, H: 1, narrow: false };
  function layout() {
    const W = hero.clientWidth, H = hero.clientHeight;
    Object.assign(view, { W, H, narrow: isNarrow(W, H) });
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = view.narrow ? 54 : 42;
    camera.updateProjectionMatrix();
  }
  const O = { reveal: reduced ? 1 : 0, tags: reduced ? 1 : 0 };
  let opened = reduced;
  function openUp() {
    if (opened) return;
    opened = true;
    gsap.timeline()
      .to(O, { reveal: 1, duration: 3.6, ease: 'power1.inOut' }, 0)
      .to(O, { tags: 1, duration: 1.2, ease: 'power2.out' }, 1.6)
      .add(() => hero.classList.add('is-words'), 1.4);
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
    lenis.scrollTo(stage.offsetTop + (stage.offsetHeight - innerHeight) * 0.88, { duration: 6, easing: (t) => t * t * (3 - 2 * t) });
  });

  // ---------------------------------------------------------------- the pointer

  const pointer = { x: -999, y: -999, nx: 0, ny: 0, in: false };
  const proj = new THREE.Vector3();
  const toScreen = (p) => { proj.copy(p).project(camera); return [(proj.x * 0.5 + 0.5) * view.W, (-proj.y * 0.5 + 0.5) * view.H, proj.z]; };
  let secShow = 0;
  function pick(x, y) {
    if (O.tags < 0.5 || Ps > 0.95) return null;
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    if (!focus && Ps < 0.06 && x > cr.left - hr.left && x < cr.right - hr.left && y > cr.top - hr.top && y < cr.bottom - hr.top) return null;
    let best = null, bd = isTouch ? 30 : 18;
    if (secShow > 0.4) sectors.forEach((S, j) => { const s = toScreen(S.pos); if (s[2] < 1) { const dd = Math.hypot(s[0] - x, s[1] - y); if (dd < bd) { bd = dd; best = { kind: 'sector', j }; } } });
    if (best) return best;
    bd = isTouch ? 22 : 12;
    inked.forEach((k, m) => {
      tmp.copy(k.pos).addScaledVector(k.out, 0.03);
      const s = toScreen(tmp);
      if (s[2] < 1 && tmp.distanceTo(camera.position) < 14) { const dd = Math.hypot(s[0] - x, s[1] - y); if (dd < bd) { bd = dd; best = { kind: 'link', n: m }; } }
    });
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
    if (e.target.closest('a, button, .nav, .hf-o, .hf-d')) return;
    setFocus(pointer.in ? pick(x, y) : null);
  }, { passive: true });
  hero.addEventListener('click', (e) => {
    if (e.target.closest('a, button, .hf-o, .hf-d')) return;
    const [x, y] = rel(e);
    const f = pick(x, y);
    if (!f) { setFocus(null); return; }
    if (isTouch && !same(f, focus)) { setFocus(f); return; }
    dispatchEvent(new CustomEvent('mm:open', { detail: f.kind === 'link' ? { kind: 'disc', i: inked[f.n].d.i } : f }));
  });

  // ---------------------------------------------------------------- the flight

  const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3();
  const cA = new THREE.Vector3(), cB = new THREE.Vector3(), cC = new THREE.Vector3();
  const lA = new THREE.Vector3(), lB = new THREE.Vector3(), lC = new THREE.Vector3();
  const camPos = new THREE.Vector3(), camAim = new THREE.Vector3(), aimNow = new THREE.Vector3();
  const upV = new THREE.Vector3(0, 1, 0);
  const clear = new THREE.Color();
  const lit = { sectors: new Array(sectors.length).fill(1) };
  let last = performance.now();
  const t0 = last;
  function frame() {
    const tn = performance.now();
    const dt = Math.min(0.05, (tn - last) / 1000);
    last = tn;
    const r = stage.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const t = (tn - t0) / 1000;
    // the flight keeps a little of its own momentum
    Ps = reduced ? Pp : damp(Ps, Pp, 3.2, dt);
    const p = Ps;
    const nr = view.narrow;

    // 1. along the tube, from the foot: inside the helix, a little above the tube, looking along it
    const travel = smooth(0, 0.56, p);
    const u = lerp(0.03, 2.72, travel) + 0.004 * Math.sin(t * 0.4);
    frameAt(u, P, T, Nh, B);
    const off = nr ? 1.25 : 0.95;
    cA.copy(P).addScaledVector(Nh, -off).addScaledVector(B, nr ? 0.55 : 0.4);
    frameAt(u + 0.075, tmp, T, Nh, B);
    lA.copy(tmp).addScaledVector(Nh, -0.15).addScaledVector(B, 0.08);
    // 2. in to the axis and up through the middle, looking up into the threads
    const rise = smooth(0.5, 0.82, p);
    cB.set(Math.cos(u * TAU) * 0.7, lerp(helY(u) + 0.3, TOP - 0.6, rise), Math.sin(u * TAU) * 0.7);
    lB.set(0, cB.y + 4, 0).addScaledVector(tmp2.set(Math.cos(u * TAU + 1.2), 0, Math.sin(u * TAU + 1.2)), 1.2);
    // 3. back and over the top, the whole of it
    const oa = u * TAU + 0.9 + 0.08 * Math.sin(t * 0.1);
    const od = nr ? 22 : 16.5;
    cC.set(Math.cos(oa) * od, TOP + (nr ? 3 : 3.8), Math.sin(oa) * od);
    lC.set(0, TOP - (nr ? 2.6 : 2.2), 0);
    const wB = smooth(0.5, 0.62, p), wC = smooth(0.78, 0.9, p);
    camPos.copy(cA).lerp(cB, wB).lerp(cC, wC);
    camAim.copy(lA).lerp(lB, wB).lerp(lC, wC);
    // the pointer looks about, a little
    const live = pointer.in && !isTouch;
    camAim.x += (live ? pointer.nx * 0.5 : 0) * (1 - wC);
    camAim.y += (live ? -pointer.ny * 0.35 : 0);
    if (!frame.once) { camera.position.copy(camPos); aimNow.copy(camAim); frame.once = true; }
    camera.position.lerp(camPos, reduced ? 1 : 1 - Math.exp(-7 * dt));
    aimNow.lerp(camAim, reduced ? 1 : 1 - Math.exp(-6 * dt));
    // a little bank along the curve while travelling
    const bank = 0.12 * (1 - wB);
    camera.up.copy(upV).applyAxisAngle(tmp2.subVectors(aimNow, camera.position).normalize(), -bank);
    camera.lookAt(aimNow);
    camera.updateMatrixWorld();

    // the depth: close, the far turns sink into the dark; drawn back, the whole shows
    FOG.uFogNear.value = lerp(lerp(3.5, 6, wB), 12, wC);
    FOG.uFogFar.value = lerp(lerp(16, 22, wB), 40, wC);
    const white = smooth(0.92, 0.995, p);
    const fade = 1 - white;
    clear.copy(ROOM).lerp(PAPER, white);
    renderer.setClearColor(clear, 1);
    CU.uReveal.value = O.reveal;
    CU.uFade.value = fade;
    RU.uFade.value = O.tags * fade;
    SU.uFade.value = fade;
    secShow = smooth(0.46, 0.66, p);
    faceSectors();
    sectors.forEach((S, j) => {
      const on = !focus || (focus.kind === 'sector' ? S.i === focus.j : focus.kind === 'disc' ? S.links.some((l) => l.d.i === focus.i) : focus.kind === 'field' ? S.links.some((l) => l.d.ring === focus.k) : S.i === inked[focus.n].S.i);
      lit.sectors[j] = damp(lit.sectors[j], on ? 1 : 0.25, 8, dt);
      sLit[j] = lit.sectors[j] * secShow;
    });
    sLitAttr.needsUpdate = true;
    // the threads let out on the way up; a looked-at one in its force's ink
    TU.uDraw.value = Math.max(smooth(0.48, 0.8, p), focus ? 1 : 0) * 1.02;
    TU.uFade.value = fade;
    inked.forEach((k, m) => {
      const on = threadOn(k);
      const a = focus ? (on ? 0.95 : 0.03) : 0.2;
      const c = on ? hex(FORCE_INK[k.f]) : [0.86, 0.86, 0.84];
      for (let v = m * TSEG * 2; v < (m + 1) * TSEG * 2; v++) { tCol[v * 4] = c[0]; tCol[v * 4 + 1] = c[1]; tCol[v * 4 + 2] = c[2]; tCol[v * 4 + 3] = a; }
    });
    thrGeo.attributes.aC.needsUpdate = true;

    // the words: the cards step back behind them
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    CU.uShade.value.set(((cr.left - hr.left - 20) / view.W) * 2 - 1, 1 - ((cr.bottom - hr.top + 10) / view.H) * 2, ((cr.right - hr.left + 20) / view.W) * 2 - 1, 1 - ((cr.top - hr.top - 20) / view.H) * 2);
    CU.uShadeK.value = 0.62 * Math.max(1 - smooth(0.03, 0.1, p), focus ? 1 : 0);
    hero.style.setProperty('--copy', String(1 - smooth(0.03, 0.1, p)));
    caps[0]?.style.setProperty('opacity', String(smooth(0.14, 0.2, p) * (1 - smooth(0.36, 0.42, p))));
    caps[1]?.style.setProperty('opacity', String(smooth(0.66, 0.72, p) * (1 - smooth(0.86, 0.9, p))));

    // the orbits named large as the flight passes them, the disciplines small along the tube
    orbitTags.forEach((tg, k) => {
      const d = tg.anchor.distanceTo(camera.position);
      const s = toScreen(tg.anchor);
      const on = !focus || (focus.kind === 'field' ? focus.k === k : focus.kind === 'disc' ? discs[focus.i].ring === k : false);
      const a = O.tags * fade * smooth(16, 7, d) * smooth(1.4, 3, d) * (s[2] < 1 ? 1 : 0) * (1 - wC * 0.85) * (on ? 1 : 0.3);
      tg.style.opacity = a.toFixed(3);
      tg.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      tg.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px)`;
    });
    discTags.forEach((tg, i) => {
      const d = tg.anchor.distanceTo(camera.position);
      const s = toScreen(tg.anchor);
      const on = !focus || (focus.kind === 'disc' ? focus.i === i : focus.kind === 'field' ? discs[i].ring === focus.k : focus.kind === 'link' ? inked[focus.n].d.i === i : discs[i].links.some((l) => secAt[l.s] === focus.j));
      const a = O.tags * fade * smooth(nr ? 8 : 10, nr ? 3.5 : 4.5, d) * smooth(0.6, 1.4, d) * (s[2] < 1 ? 1 : 0) * (1 - wB) * (on ? 1 : 0.25);
      tg.style.opacity = a.toFixed(3);
      tg.style.pointerEvents = a > 0.3 ? 'auto' : 'none';
      tg.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px)`;
    });

    renderer.render(scene, camera);
  }

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  gsap.ticker.add(frame);

  if (local) window.__flight = { scene, camera, renderer, O, CU, inked, sectors, discs, openUp, setFocus, pick, tick: frame, get p() { return Ps; }, set p(v) { Pp = Ps = v; } };
}
