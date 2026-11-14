// Hero 2 of 3, "the gathering" (10 Nov). After the two videos the client sent: a sculpture of rings
// made of thousands of small covers, seen in the round with fine threads and small labels; and
// pictures turned into point clouds that scatter and gather, with trackers reading them. We take
// their composition and their sharpness, never their elements, and build it from the founder's
// own atlas (js/atlas-data.js):
// - The seven orbits are seven rings stacked in the round, from the ground of being at the foot to
//   the return at the top, wider in the middle, the shape of a cocoon. Each is made of grain,
//   thousands of fine points, that gathers out of the dark when the hero opens and flows round.
// - Each ring has a fine rail with forty-eight ticks, one for each sector, the same column on
//   every ring: the founder's grid, bent into hoops. A tick lights where one of that orbit's
//   disciplines moves that sector.
// - The twenty-seven disciplines sit on their rings in trackers, named, with how many of the
//   forty-eight sectors each moves.
// - Above the top ring hang the forty-eight sectors, small printed cards, each over its own column.
//   From every discipline, threads run up to the sectors it moves: a hundred and fifty-one.
// The scroll (the stage is pinned) flies the camera up past the seven rings, each named large as it
// passes, then draws back and over the top to take in the sectors and every thread. Last, it fades
// into the dark the next hero opens in. Hover a tracker, a card or a ring to read it; click to open
// its metrics (the light orb's panel, js/orb.js, through an 'mm:open' event).
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
const firstSentence = (s) => (s.match(/^.*?[.!?](\s|$)/) || [s])[0].trim();
const pad2 = (n) => String(n).padStart(2, '0');

// the sectors' families, each a colour for the edge of its cards
const FAM_COL = {
  land: '#7f9257', energy: '#c8752e', move: '#4d7ca6', make: '#948a80', body: '#b65858',
  money: '#c6a02a', signal: '#4f8f88', want: '#9c5f8c', mean: '#6a6db4',
};

// the tower: seven rings, foot to top, wider in the middle
const GAP = 1.12;
const ringY = (k) => (k - 3) * GAP;
const ringR = (k) => 2.35 + 1.15 * Math.sin((Math.PI * (k + 0.6)) / 7.2);
const TUBE = 0.15;
const RAIL = 0.17; // the rail runs this far outside the tube's centre line

const PT_VERT = /* glsl */ `
attribute float aRing;
attribute vec4 aP;       // angle round the ring, angle round the tube, distance from the tube's centre, seed
attribute vec3 aScatter; // where it waits in the dark before it gathers
uniform mat4 uM[7];
uniform float uRad[7];
uniform float uSpin[7];
uniform float uLit[7];
uniform vec3 uCol[7];
uniform float uTime;
uniform float uGather;
uniform float uPx;
uniform vec2 uMouse;
uniform float uAspect;
uniform vec4 uShade; // where the words are, in clip space: the grain steps back there
uniform float uShadeK;
varying vec3 vC;
varying float vB;
void main() {
  int k = int(aRing + 0.5);
  float th = aP.x + uTime * uSpin[k];
  vec3 n = vec3(cos(th), 0.0, sin(th));
  vec3 p = n * uRad[k] + (n * cos(aP.y) + vec3(0.0, sin(aP.y), 0.0)) * aP.z;
  vec4 w = uM[k] * vec4(p, 1.0);
  float g = smoothstep(aP.w * 0.55, aP.w * 0.55 + 0.45, uGather);
  w.xyz = mix(aScatter, w.xyz, g);
  vec4 mv = viewMatrix * w;
  gl_Position = projectionMatrix * mv;
  // the grain parts round the pointer, a little, and closes again behind it
  vec2 sp = gl_Position.xy / gl_Position.w;
  vec2 dm = (sp - uMouse) * vec2(uAspect, 1.0);
  float dd = length(dm);
  float push = 0.035 * smoothstep(0.16, 0.0, dd) * g;
  gl_Position.xy += normalize(dm + 1e-5) / vec2(uAspect, 1.0) * push * gl_Position.w;
  float seed2 = fract(aP.w * 7.137);
  gl_PointSize = uPx * (0.8 + 1.3 * seed2 * seed2) * clamp(7.0 / -mv.z, 0.55, 2.2);
  // the near side of each tube is brighter than the far
  float face = 0.55 + 0.45 * cos(aP.y);
  vec2 sl = smoothstep(uShade.xy - 0.12, uShade.xy + 0.04, sp) * (1.0 - smoothstep(uShade.zw - 0.04, uShade.zw + 0.12, sp));
  vB = (0.22 + 0.78 * fract(aP.w * 13.71)) * face * uLit[k] * mix(0.5, 1.0, g) * (1.0 - uShadeK * sl.x * sl.y);
  vC = mix(vec3(1.0, 0.98, 0.95), uCol[k], 0.5 + 0.3 * fract(aP.w * 3.3));
}`;
const PT_FRAG = /* glsl */ `
precision highp float;
uniform float uFade;
varying vec3 vC;
varying float vB;
void main() {
  // square grain, cut clean: no soft dots
  vec2 q = abs(gl_PointCoord - 0.5);
  if (max(q.x, q.y) > 0.5) discard;
  gl_FragColor = vec4(vC * vB * uFade, 1.0);
}`;

// lines: the rails, their ticks and the threads. Each vertex carries its own colour and how far
// along its line it is, so a thread can be let out from where it starts
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

// the sectors' cards: printed on the front, plain on the back
const CARD_VERT = /* glsl */ `
attribute vec4 aUv; // where this card is in the sheet: u0, v0, u1, v1
attribute float aLit;
varying vec2 vUv;
varying float vLit;
void main() {
  vUv = vec2(mix(aUv.x, aUv.z, uv.x), mix(aUv.y, aUv.w, uv.y));
  vLit = aLit;
  gl_Position = projectionMatrix * viewMatrix * modelMatrix * instanceMatrix * vec4(position, 1.0);
}`;
const CARD_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uMap;
uniform float uFade;
varying vec2 vUv;
varying float vLit;
void main() {
  vec3 c = gl_FrontFacing ? texture2D(uMap, vUv).rgb : vec3(0.32, 0.33, 0.34);
  gl_FragColor = vec4(c * vLit * uFade, 1.0);
}`;

export function setupGather({ lenis, reduced, isTouch, local }) {
  const stage = $('.stage-2');
  const hero = $('.hv-gather');
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
  renderer.setClearColor(0x030405, 1);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 200);

  // ---------------------------------------------------------------- the founder's data

  const rings = ATLAS.rings;
  const discs = ATLAS.disciplines.map((d, i) => ({ ...d, i }));
  const byRing = rings.map((_, k) => discs.filter((d) => d.ring === k));
  const secAt = Object.fromEntries(ATLAS.sectors.map((s, i) => [s.id, i]));
  const sectors = ATLAS.sectors.map((s, i) => ({ ...s, i, links: [] }));
  discs.forEach((d) => d.links.forEach((l) => { const S = sectors[secAt[l.s]]; if (S) S.links.push({ d, f: l.f }); }));
  const nLinks = discs.reduce((n, d) => n + d.links.length, 0);
  // each sector's column: the same angle on every ring, and its card hangs over it
  const colA = (j) => (j / sectors.length) * TAU + 0.04;
  // each discipline's place round its ring, each ring's set turned from the one below
  byRing.forEach((list, k) => list.forEach((d, j) => { d.a = (j / list.length) * TAU + k * 0.83 + 0.35; }));

  // ---------------------------------------------------------------- the rings, as grain

  const groups = rings.map((_, k) => {
    const g = new THREE.Group();
    g.position.y = ringY(k);
    g.userData.tilt = [0.05 * Math.sin(k * 2.1 + 0.4), 0.06 * Math.cos(k * 1.7 + 0.9)];
    scene.add(g);
    return g;
  });
  const narrowAtStart = isNarrow(innerWidth, innerHeight);
  const PER = narrowAtStart ? 14000 : 38000;
  const N = PER * 7;
  const aRing = new Float32Array(N), aP = new Float32Array(N * 4), aScatter = new Float32Array(N * 3);
  for (let k = 0, n = 0; k < 7; k++) {
    for (let i = 0; i < PER; i++, n++) {
      aRing[n] = k;
      aP[n * 4] = Math.random() * TAU;
      aP[n * 4 + 1] = Math.random() * TAU;
      // most of the grain on the tube's skin, some inside it
      aP[n * 4 + 2] = TUBE * (0.62 + 0.38 * Math.pow(Math.random(), 0.35)) * (0.85 + 0.3 * Math.sin(k * 1.3));
      aP[n * 4 + 3] = Math.random();
      // waiting in the dark: a wide, loose cloud round where its ring will be
      const u = Math.random() * TAU, v = Math.acos(2 * Math.random() - 1), r = 5 + Math.random() * 9;
      aScatter[n * 3] = Math.sin(v) * Math.cos(u) * r;
      aScatter[n * 3 + 1] = ringY(k) * 0.4 + Math.cos(v) * r * 0.7;
      aScatter[n * 3 + 2] = Math.sin(v) * Math.sin(u) * r;
    }
  }
  const ptGeo = new THREE.BufferGeometry();
  ptGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
  ptGeo.setAttribute('aRing', new THREE.BufferAttribute(aRing, 1));
  ptGeo.setAttribute('aP', new THREE.BufferAttribute(aP, 4));
  ptGeo.setAttribute('aScatter', new THREE.BufferAttribute(aScatter, 3));
  const PU = {
    uM: { value: groups.map(() => new THREE.Matrix4()) },
    uRad: { value: rings.map((_, k) => ringR(k)) },
    uSpin: { value: rings.map((_, k) => (k % 2 ? -1 : 1) * (0.022 + 0.006 * k)) },
    uLit: { value: new Array(7).fill(1) },
    uCol: { value: FIELD_COL.map((c) => new THREE.Vector3(...c)) },
    uTime: { value: 0 }, uGather: { value: reduced ? 1 : 0 }, uPx: { value: dpr * 1.15 },
    uMouse: { value: new THREE.Vector2(9, 9) }, uAspect: { value: 1 }, uFade: { value: 1 },
    uShade: { value: new THREE.Vector4(9, 9, 9, 9) }, uShadeK: { value: 0 },
  };
  const points = new THREE.Points(ptGeo, new THREE.ShaderMaterial({
    vertexShader: PT_VERT, fragmentShader: PT_FRAG, uniforms: PU,
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
  }));
  points.frustumCulled = false;
  scene.add(points);

  // ---------------------------------------------------------------- the rails and their ticks: the grid

  // how many of each ring's disciplines move each sector: the lit ticks
  const tickLit = rings.map((_, k) => new Array(sectors.length).fill(0));
  discs.forEach((d) => d.links.forEach((l) => { const j = secAt[l.s]; if (j != null) tickLit[d.ring][j]++; }));
  const railMat = () => new THREE.ShaderMaterial({
    vertexShader: LN_VERT, fragmentShader: LN_FRAG, uniforms: { uDraw: { value: 1 }, uFade: { value: 0 } },
    blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true,
  });
  const rails = groups.map((g, k) => {
    const R = ringR(k) + RAIL, SEG = 220;
    const pos = [], col = [], s = [];
    const c = FIELD_COL[k];
    for (let i = 0; i < SEG; i++) {
      const a0 = (i / SEG) * TAU, a1 = ((i + 1) / SEG) * TAU;
      pos.push(Math.cos(a0) * R, 0, Math.sin(a0) * R, Math.cos(a1) * R, 0, Math.sin(a1) * R);
      col.push(...c, 0.34, ...c, 0.34);
      s.push(0, 0);
    }
    for (let j = 0; j < sectors.length; j++) {
      const a = colA(j), lit = tickLit[k][j];
      const len = lit ? 0.07 + 0.035 * lit : 0.035;
      const x = Math.cos(a) * R, z = Math.sin(a) * R;
      pos.push(x, -len, z, x, len, z);
      const al = lit ? 0.95 : 0.3;
      const cc = lit ? [1, 0.97, 0.92] : c;
      col.push(...cc, al, ...cc, al);
      s.push(0, 0);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('aC', new THREE.Float32BufferAttribute(col, 4));
    geo.setAttribute('aS', new THREE.Float32BufferAttribute(s, 1));
    const m = new THREE.LineSegments(geo, railMat());
    m.frustumCulled = false;
    g.add(m);
    return m;
  });

  // ---------------------------------------------------------------- the sectors: cards over their columns

  const top = ringY(6);
  sectors.forEach((S, j) => {
    const famI = Object.keys(ATLAS.families).indexOf(S.fam);
    const a = colA(j) + (Math.sin(j * 12.9898) * 0.5) * 0.06;
    const r = 0.55 + 1.15 * (0.5 + 0.5 * Math.sin(j * 4.13 + 1.1));
    S.pos = new THREE.Vector3(Math.cos(a) * r, top + 1.05 + famI * 0.2 + 0.25 * Math.sin(j * 2.7), Math.sin(a) * r);
    S.face = a;
  });
  const CW = 0.4, CH = 0.53;
  const COLS = 8, ROWS = 6, TW = 240, TH = 320;
  const sheet = document.createElement('canvas');
  sheet.width = COLS * TW; sheet.height = ROWS * TH;
  const cardTex = new THREE.CanvasTexture(sheet);
  cardTex.colorSpace = THREE.SRGBColorSpace;
  cardTex.anisotropy = 4;
  cardTex.generateMipmaps = true;
  cardTex.minFilter = THREE.LinearMipmapLinearFilter;
  function printCards() {
    const c = sheet.getContext('2d');
    sectors.forEach((S, j) => {
      const x = (j % COLS) * TW, y = Math.floor(j / COLS) * TH;
      c.fillStyle = '#e9ebe6';
      c.fillRect(x, y, TW, TH);
      c.fillStyle = FAM_COL[S.fam] || '#888';
      c.fillRect(x, y, TW, 18);
      c.fillStyle = '#151a17';
      c.font = '500 34px "Noto Serif Display", "Noto Serif", Georgia, serif';
      // the name, wrapped to the card
      const words = S.name.split(' ');
      const lines = [];
      let line = '';
      words.forEach((w) => { const t = line ? `${line} ${w}` : w; if (c.measureText(t).width > TW - 40 && line) { lines.push(line); line = w; } else line = t; });
      if (line) lines.push(line);
      lines.slice(0, 4).forEach((l, i) => c.fillText(l, x + 20, y + 70 + i * 38));
      c.fillStyle = '#5b625e';
      c.font = '400 19px "Instrument Sans", system-ui, sans-serif';
      c.fillText(ATLAS.families[S.fam] || '', x + 20, y + TH - 52);
      c.font = '400 18px "Fragment Mono", ui-monospace, monospace';
      c.fillText(`${S.links.length} ${S.links.length === 1 ? 'thread' : 'threads'}`, x + 20, y + TH - 24);
    });
    cardTex.needsUpdate = true;
  }
  printCards();
  document.fonts?.ready.then(printCards);
  const cardGeo = new THREE.PlaneGeometry(CW, CH);
  const cardUv = new Float32Array(sectors.length * 4), cardLit = new Float32Array(sectors.length).fill(1);
  sectors.forEach((S, j) => {
    const u0 = (j % COLS) / COLS, v1 = 1 - Math.floor(j / COLS) / ROWS;
    cardUv.set([u0, v1 - 1 / ROWS, u0 + 1 / COLS, v1], j * 4);
  });
  cardGeo.setAttribute('aUv', new THREE.InstancedBufferAttribute(cardUv, 4));
  const cardLitAttr = new THREE.InstancedBufferAttribute(cardLit, 1).setUsage(THREE.DynamicDrawUsage);
  cardGeo.setAttribute('aLit', cardLitAttr);
  const CU = { uMap: { value: cardTex }, uFade: { value: 0 } };
  const cards = new THREE.InstancedMesh(cardGeo, new THREE.ShaderMaterial({ vertexShader: CARD_VERT, fragmentShader: CARD_FRAG, uniforms: CU, side: THREE.DoubleSide, depthTest: true, depthWrite: true }), sectors.length);
  cards.frustumCulled = false;
  // each card turns to face the camera, upright, so it is always read from the front
  const tmpO = new THREE.Object3D();
  function faceCards() {
    sectors.forEach((S, j) => {
      tmpO.position.copy(S.pos);
      tmpO.rotation.set(0, Math.atan2(camera.position.x - S.pos.x, camera.position.z - S.pos.z), 0);
      tmpO.updateMatrix();
      cards.setMatrixAt(j, tmpO.matrix);
    });
    cards.instanceMatrix.needsUpdate = true;
  }
  scene.add(cards);

  // ---------------------------------------------------------------- the threads, discipline to sector

  const TSEG = 18;
  const thrPos = new Float32Array(nLinks * TSEG * 2 * 3);
  const thrCol = new Float32Array(nLinks * TSEG * 2 * 4);
  const thrS = new Float32Array(nLinks * TSEG * 2);
  const threads = [];
  discs.forEach((d) => d.links.forEach((l) => { const j = secAt[l.s]; if (j != null) threads.push({ d, j, n: threads.length }); }));
  const thrGeo = new THREE.BufferGeometry();
  thrGeo.setAttribute('position', new THREE.BufferAttribute(thrPos, 3).setUsage(THREE.DynamicDrawUsage));
  thrGeo.setAttribute('aC', new THREE.BufferAttribute(thrCol, 4).setUsage(THREE.DynamicDrawUsage));
  thrGeo.setAttribute('aS', new THREE.BufferAttribute(thrS, 1));
  const TU = { uDraw: { value: 0 }, uFade: { value: 1 } };
  const thrLines = new THREE.LineSegments(thrGeo, new THREE.ShaderMaterial({ vertexShader: LN_VERT, fragmentShader: LN_FRAG, uniforms: TU, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  thrLines.frustumCulled = false;
  scene.add(thrLines);
  // where a discipline sits, in the world, this frame
  const discWorld = (d, out) => {
    const R = ringR(d.ring) + RAIL;
    out.set(Math.cos(d.a) * R, 0, Math.sin(d.a) * R).applyMatrix4(groups[d.ring].matrixWorld);
    return out;
  };
  const tA = new THREE.Vector3(), tB = new THREE.Vector3(), tC = new THREE.Vector3();
  function layThreads() {
    threads.forEach((th) => {
      discWorld(th.d, tA);
      tB.copy(sectors[th.j].pos);
      // up from the ring and in towards the axis, then up to the card: a drawn curve, never a cage
      tC.set(tA.x * 0.5 + tB.x * 0.2, lerp(tA.y, tB.y, 0.72), tA.z * 0.5 + tB.z * 0.2);
      for (let s = 0; s < TSEG; s++) {
        for (let e = 0; e < 2; e++) {
          const u = (s + e) / TSEG, iu = 1 - u;
          const v = (th.n * TSEG + s) * 2 + e;
          thrPos[v * 3] = iu * iu * tA.x + 2 * iu * u * tC.x + u * u * tB.x;
          thrPos[v * 3 + 1] = iu * iu * tA.y + 2 * iu * u * tC.y + u * u * tB.y;
          thrPos[v * 3 + 2] = iu * iu * tA.z + 2 * iu * u * tC.z + u * u * tB.z;
          thrS[v] = u;
        }
      }
    });
    thrGeo.attributes.position.needsUpdate = true;
    thrGeo.attributes.aS.needsUpdate = true;
  }

  // ---------------------------------------------------------------- the words in the world

  const trackers = discs.map((d) => {
    const t = el('span', 'hg-tk');
    t.append(el('span', 'hg-tk-box'), el('span', 'hg-tk-n', pad2(d.i + 1)), el('span', 'hg-tk-name', d.name), el('span', 'hg-tk-m', `${d.links.length}/48`));
    labels.append(t);
    return t;
  });
  const ringTags = rings.map((r, k) => {
    const t = el('div', 'hg-ring');
    const nThreads = byRing[k].reduce((n, d) => n + d.links.length, 0);
    t.append(el('span', 'hg-ring-n', ROMAN[k]), el('span', 'hg-ring-name', r.name), el('span', 'hg-ring-c', `${byRing[k].length} ${byRing[k].length === 1 ? 'discipline' : 'disciplines'}, ${nThreads} threads`));
    labels.append(t);
    return t;
  });
  // the top rail's ticks, each named for its sector, small
  const tickTags = sectors.map((S) => { const t = el('span', 'hg-tick', S.name); labels.append(t); return t; });

  // ---------------------------------------------------------------- what is pointed at

  let focus = null; // { kind: 'field', k } | { kind: 'disc', i } | { kind: 'sector', j }
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
  const threadOn = (th) => (focus ? (focus.kind === 'sector' ? th.j === focus.j : focus.kind === 'disc' ? th.d.i === focus.i : th.d.ring === focus.k) : false);

  // ---------------------------------------------------------------- size

  const view = { W: 1, H: 1, narrow: false };
  function layout() {
    const W = hero.clientWidth, H = hero.clientHeight;
    Object.assign(view, { W, H, narrow: isNarrow(W, H) });
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = view.narrow ? 46 : 36;
    camera.updateProjectionMatrix();
    PU.uAspect.value = W / H;
    PU.uPx.value = dpr * (view.narrow ? 0.9 : 0.85);
  }

  // ---------------------------------------------------------------- the opening: the grain gathers

  const O = { gather: reduced ? 1 : 0, rails: reduced ? 1 : 0, tags: reduced ? 1 : 0 };
  let opened = reduced;
  function words() { hero.classList.add('is-words'); }
  function openUp() {
    if (opened) return;
    opened = true;
    gsap.timeline()
      .to(O, { gather: 1, duration: 3.2, ease: 'power3.out' }, 0)
      .to(O, { rails: 1, duration: 1.6, ease: 'power2.out' }, 1.6)
      .to(O, { tags: 1, duration: 1.2, ease: 'power2.out' }, 2.3)
      .add(words, 2.2);
  }
  if (reduced) words();

  // ---------------------------------------------------------------- the scroll

  let P = 0, Ps = 0;
  ScrollTrigger.create({
    trigger: stage, start: 'top top', end: 'bottom bottom',
    onUpdate: (self) => { P = self.progress; },
  });
  // it opens as it comes into view (and not while the way in is still up)
  const html = document.documentElement;
  ScrollTrigger.create({
    trigger: stage, start: 'top 55%',
    onEnter: () => { if (html.classList.contains('gate')) addEventListener('mm:enter', openUp, { once: true }); else openUp(); },
  });
  $('.hv-go', hero)?.addEventListener('click', () => {
    openUp();
    lenis.scrollTo(stage.offsetTop + (stage.offsetHeight - innerHeight) * 0.78, { duration: 2.4 });
  });

  // ---------------------------------------------------------------- the pointer

  const pointer = { x: -999, y: -999, nx: 0, ny: 0, in: false };
  const proj = new THREE.Vector3();
  const toScreen = (p) => { proj.copy(p).project(camera); return [(proj.x * 0.5 + 0.5) * view.W, (-proj.y * 0.5 + 0.5) * view.H, proj.z]; };
  let screen = { discs: [], sectors: [], rings: [] };
  function pick(x, y) {
    if (O.tags < 0.5 || Ps > 0.93) return null;
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    if (!focus && Ps < 0.1 && x > cr.left - hr.left && x < cr.right - hr.left && y > cr.top - hr.top && y < cr.bottom - hr.top) return null;
    const reach = isTouch ? 26 : 16;
    let best = null, bd = reach;
    screen.discs.forEach(([sx, sy, z], i) => { if (z < 1) { const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = { kind: 'disc', i }; } } });
    if (best) return best;
    bd = reach + 8;
    if (CU.uFade.value > 0.4) screen.sectors.forEach(([sx, sy, z], j) => { if (z < 1) { const dd = Math.hypot(sx - x, sy - y); if (dd < bd) { bd = dd; best = { kind: 'sector', j }; } } });
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
  const lit = { rings: new Array(7).fill(1), discs: new Array(discs.length).fill(1), sectors: new Array(sectors.length).fill(1) };
  const tmp = new THREE.Vector3();
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

    // the camera: close and low among the rings, rising past all seven as you scroll, then drawn
    // back and over the top to take in the sectors and every thread
    const rise = smooth(0.02, 0.62, p), back = smooth(0.6, 0.9, p);
    const nr = view.narrow;
    const dist = lerp(nr ? 11.5 : 8.2, nr ? 13.5 : 9.4, rise) + back * (nr ? 6 : 5.2);
    const ang = -0.55 + 1.9 * rise + 0.5 * back + 0.05 * Math.sin(t * 0.07);
    const camY = lerp(ringY(0) - 0.5, top + 0.4, rise) + back * 3.4;
    const aimY = lerp(ringY(1) + 0.4, top + 0.8, rise) + back * 0.5;
    const live = pointer.in && !isTouch;
    const px = live ? pointer.nx : 0, py = live ? pointer.ny : 0;
    camPos.set(Math.cos(ang + px * 0.06) * dist, camY - py * 0.25, Math.sin(ang + px * 0.06) * dist);
    camAim.set(0, aimY, 0);
    camera.position.lerp(camPos, reduced ? 1 : 1 - Math.exp(-6 * dt));
    if (!frame.once) { camera.position.copy(camPos); frame.once = true; }
    camera.lookAt(camAim);
    faceCards();

    // the rings, tilting a little, alive
    groups.forEach((g, k) => {
      const [tx, tz] = g.userData.tilt;
      g.rotation.set(tx + 0.012 * Math.sin(t * 0.21 + k), 0, tz + 0.012 * Math.cos(t * 0.17 + k * 1.3));
    });
    scene.updateMatrixWorld();
    groups.forEach((g, k) => PU.uM.value[k].copy(g.matrixWorld));

    const fade = 1 - smooth(0.9, 0.995, p);
    const fk = focus?.kind === 'field' ? focus.k : focus?.kind === 'disc' ? discs[focus.i].ring : -1;
    for (let k = 0; k < 7; k++) {
      const want = !focus ? 1 : fk === k ? 1.7 : focus.kind === 'sector' ? (byRing[k].some((d) => sectors[focus.j].links.some((l) => l.d === d)) ? 1.2 : 0.4) : 0.35;
      lit.rings[k] = damp(lit.rings[k], want, 7, dt);
      PU.uLit.value[k] = lit.rings[k];
      rails[k].material.uniforms.uFade.value = O.rails * fade * (0.6 + 0.4 * lit.rings[k]);
    }
    PU.uTime.value = t;
    PU.uGather.value = O.gather;
    PU.uFade.value = fade;
    PU.uMouse.value.set(live ? pointer.nx : 9, live ? -pointer.ny : 9);

    // the threads and the cards come as the camera nears the top
    const thrA = smooth(0.42, 0.78, p);
    TU.uDraw.value = thrA * 1.02;
    TU.uFade.value = fade;
    const cardA = Math.max(smooth(0.4, 0.66, p), O.tags * 0.55);
    CU.uFade.value = cardA * fade;
    layThreads();
    threads.forEach((th) => {
      const on = threadOn(th);
      const a = (focus ? (on ? 0.85 : 0.03) : 0.2) * (focus && on ? Math.max(thrA, 0.6) : 1);
      const c = on ? FIELD_COL[th.d.ring] : [0.86, 0.88, 0.9];
      for (let v = th.n * TSEG * 2; v < (th.n + 1) * TSEG * 2; v++) { thrCol[v * 4] = c[0]; thrCol[v * 4 + 1] = c[1]; thrCol[v * 4 + 2] = c[2]; thrCol[v * 4 + 3] = a; }
    });
    if (focus) TU.uDraw.value = Math.max(TU.uDraw.value, 1.02);
    thrGeo.attributes.aC.needsUpdate = true;
    sectors.forEach((S, j) => { lit.sectors[j] = damp(lit.sectors[j], sectorOn(S) ? 1 : 0.28, 8, dt); cardLit[j] = lit.sectors[j]; });
    cardLitAttr.needsUpdate = true;

    // the words in the world: trackers on the disciplines, each ring's name as the camera passes it,
    // and the top rail's ticks named
    const cr = copy.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const copyOn = (1 - smooth(0.03, 0.12, p)) * (focus ? 0 : 1);
    // the grain steps back behind the words (and behind a read card, which takes their place)
    PU.uShade.value.set(((cr.left - hr.left - 20) / view.W) * 2 - 1, 1 - ((cr.bottom - hr.top + 10) / view.H) * 2, ((cr.right - hr.left + 20) / view.W) * 2 - 1, 1 - ((cr.top - hr.top - 20) / view.H) * 2);
    PU.uShadeK.value = 0.7 * Math.max(1 - smooth(0.03, 0.12, p), focus ? 1 : 0);
    const inCopy = (x, y) => copyOn * smooth(cr.left - hr.left - 30, cr.left - hr.left + 10, x) * (1 - smooth(cr.right - hr.left - 10, cr.right - hr.left + 30, x)) * smooth(cr.top - hr.top - 30, cr.top - hr.top + 10, y);
    screen.discs = discs.map((d, i) => {
      discWorld(d, tmp);
      const s = toScreen(tmp);
      const on = discOn(d);
      lit.discs[i] = damp(lit.discs[i], on ? 1 : 0.18, 8, dt);
      // the far side of the tower is behind its rings: dimmer
      tmp.sub(camera.position);
      const toAxis = Math.hypot(camera.position.x, camera.position.z);
      const far = clamp((Math.hypot(tmp.x, tmp.z) - toAxis + 1.5) / 3, 0, 1);
      const op = O.tags * lit.discs[i] * (1 - 0.65 * far) * fade * (1 - 0.9 * inCopy(s[0], s[1])) * (s[2] < 1 ? 1 : 0);
      const tk = trackers[i];
      tk.style.opacity = op.toFixed(3);
      tk.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px)`;
      tk.classList.toggle('is-on', !!focus && on);
      return s;
    });
    screen.sectors = sectors.map((S) => toScreen(S.pos));
    screen.rings = rings.map((_, k) => {
      const R = ringR(k) + RAIL, out = [];
      for (let j = 0; j < 48; j += 2) { tmp.set(Math.cos(colA(j)) * R, 0, Math.sin(colA(j)) * R).applyMatrix4(groups[k].matrixWorld); out.push(toScreen(tmp)); }
      return out;
    });
    // each ring is named large inside its right edge as the camera passes its height, one at a time
    ringTags.forEach((tg, k) => {
      const near = 1 - smooth(0.25, 0.75, Math.abs(camera.position.y - ringY(k) - 0.45));
      const pts = screen.rings[k];
      let rx = -Infinity, ry = 0;
      pts.forEach(([sx, sy, z]) => { if (z < 1 && sx > rx) { rx = sx; ry = sy; } });
      const vis = focus ? (fk === k ? 1 : 0) : near * smooth(0.04, 0.12, p) * (1 - back);
      tg.style.opacity = (vis * O.tags * fade).toFixed(3);
      tg.style.transform = `translate(${Math.min(view.W - (nr ? 12 : 24), rx - 30).toFixed(1)}px, ${(ry - (nr ? 150 : 190)).toFixed(1)}px) translateX(-100%)`;
    });
    // the top rail's ticks, named on the near side once the camera is up among them
    const tickA = smooth(0.46, 0.6, p) * (1 - smooth(0.78, 0.86, p)) * (nr ? 0 : 1);
    sectors.forEach((S, j) => {
      const tg = tickTags[j];
      if (tickA < 0.01 && !(focus && focus.kind === 'sector' && focus.j === j)) { tg.style.opacity = '0'; return; }
      const R = ringR(6) + RAIL + 0.03, a = colA(j);
      tmp.set(Math.cos(a) * R, 0.1, Math.sin(a) * R).applyMatrix4(groups[6].matrixWorld);
      const near = tmp.clone().sub(camera.position).length() < Math.hypot(camera.position.x, camera.position.z) - 0.2;
      const s = toScreen(tmp);
      const on = sectorOn(S);
      tg.style.opacity = (near ? tickA * (focus ? (on ? 1 : 0.15) : 0.7) * fade : 0).toFixed(3);
      tg.style.transform = `translate(${s[0].toFixed(1)}px, ${s[1].toFixed(1)}px) rotate(-62deg)`;
    });

    hero.style.setProperty('--copy', String(1 - smooth(0.03, 0.12, p)));
    caps[0]?.style.setProperty('opacity', String(smooth(0.14, 0.22, p) * (1 - smooth(0.4, 0.46, p))));
    caps[1]?.style.setProperty('opacity', String(smooth(0.66, 0.74, p) * (1 - smooth(0.88, 0.93, p))));

    renderer.render(scene, camera);
  }

  layout();
  addEventListener('resize', () => { clearTimeout(layout.t); layout.t = setTimeout(layout, 120); });
  gsap.ticker.add(frame);

  if (local) window.__gather = { scene, camera, renderer, O, PU, sectors, discs, openUp, setFocus, pick, tick: frame, get screen() { return screen; }, get p() { return Ps; }, set p(v) { P = Ps = v; } };
}
