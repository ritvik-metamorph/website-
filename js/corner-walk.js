// The Creative Corner's opening (21 Nov): the walk.
//
// The user (voice): "a game sort of experience… someone who is entering into a museum… in FPP mode, so my hands
// are visible working", the art on the walls, "an option that enter the detailed gallery", kept simple, "just an
// entrance experience". White cotton gloves (an art handler's: in a museum only the handlers touch the art, so
// wearing them you are let in past the rope; cloth is clean forms, which come out well in code).
// Then, on seeing the test: the hands looked robotic ("the shape… they look like a robot's hands"), the light
// inside dull; at each artist's piece, ways to react underneath (a thumbs up, Hire) and a clear sign that a click
// opens it in detail; at the door, a proper smooth fade to black, then the upcoming artists' title, then the whole
// gallery; and made to run on medium laptops too (shadows and anything heavy that the look does not need can go),
// a simpler version on a phone.
//
// What the visitor sees: a dark lobby, "Creative corner" lettered over a tall doorway, a lit hall beyond it.
// Scrolling walks you in, in your own body: the head rises and falls a little with each step and your gloved hands
// swing low at the foot of the screen. The art of the day on the left wall, the week's on the right, the month's
// alone on the end wall; at each the walk slows and you turn to face it, a museum label beside it and, under it,
// a thumbs up (your hand gives one), Hire and See in detail. Point at a piece and your right hand points at it;
// click to open it; hold to lean in close; drag to look round. Last, a door with a push plate: your hand pushes
// it open, the room fades to black, and the gallery's title rises, then the wall of every piece.
//
// How it stays light: the room has no lights at all. Its walls, floor and ceiling are painted by one small shader
// each, with the gallery's light worked out on them (a lamp's pool on each piece, wall-washers' scallops between,
// a polished floor that reflects the light slots, the walls' light and each piece's colour); only the hands are lit,
// in a pass of their own. The art is never re-lit or altered: each piece is its own picture, drawn unlit.
import * as THREE from '../assets/vendor/three.module.min.js';
import { makeHandGeometry, handMaterial, makeHand, poseHand, aim } from './walk-hand.js';
import { person, PERSON_TOP, PERSON_H } from './walk-visitors.js';
import { roomLight } from './walk-light.js';

// the light (21 Nov, later): two directions to choose from, behind ?wklight= (js/walk-light.js): real (the white cube,
// made real) and dark (framed in the dark); without it, the light as it was
// (a walk may also be given its light, so the client's review can hang the two one under the other)
const LIGHT_Q = (/[?&]wklight=(real|dark)\b/.exec(location.search) || [])[1] || 'before';

const { gsap } = window;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (k, dt) => 1 - Math.exp(-k * dt);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const INK = '#141c2e';
const FONT = { sans: '"Open Sauce One", system-ui, sans-serif', disp: '"Cormorant", Georgia, serif' };

// the hall, in metres: x across it (left is -), y up, z along it (you walk towards -z). The lobby is z 2 to 6.6.
const HX = 3.6, H = 4.4, Z_IN = 2.0, Z_END = -15, Z_LOBBY = 6.6, EYE = 1.63;
const GATE = { w: 2.0, h: 2.75 };                 // the doorway from the lobby into the hall
const DOOR = { z: -12.4, w: 1.4, h: 2.75 };       // the way on, in the left wall near the end
const SLOT = HX - 1.45;                           // the two light slots in the ceiling, either side
const WALK = 0.84;                                // the scroll's share for the walk to the door; the rest is the door
// the three, hung: the day's on the left wall, the week's on the right, the month's alone on the end wall
const HANGS = {
  day: { wall: 'left', at: -3.4, y: 1.6, long: 1.45 },
  week: { wall: 'right', at: -7.4, y: 1.6, long: 1.45 },
  month: { wall: 'end', at: 0, y: 1.72, long: 2.2 },
};
const WALLS = { left: { n: [1, 0, 0], ry: Math.PI / 2 }, right: { n: [-1, 0, 0], ry: -Math.PI / 2 }, end: { n: [0, 0, 1], ry: 0 } };

// ================================================================== the hands' poses
// (the hands themselves are js/walk-hand.js since 21 Nov: one continuous surface on a skeleton. The palm and five tubes
// before them read as a robot's, "made by joining parts"; backup corner-walk-before-real-hands-2026-11-21)
const v3 = (x, y, z) => new THREE.Vector3(x, y, z).normalize();
// the hands' poses: each finger's three bends (radians, towards the palm), the thumb's three bends, which way the
// thumb points and where its nail faces (in the hand's frame), how far the fingers spread
const POSES = {
  rest: { spread: 0.45, f: [[0.24, 0.34, 0.2], [0.32, 0.42, 0.24], [0.4, 0.5, 0.28], [0.5, 0.56, 0.3]], t: [0.1, 0.18, 0.14], td: v3(-0.3, 0.86, -0.4), tb: v3(-0.82, 0.1, 0.56) },
  // (the left hand rests a little more open: two hands are never each other's mirror)
  restL: { spread: 0.6, f: [[0.18, 0.28, 0.16], [0.3, 0.38, 0.22], [0.4, 0.48, 0.26], [0.52, 0.56, 0.3]], t: [0.06, 0.14, 0.12], td: v3(-0.36, 0.84, -0.4), tb: v3(-0.78, 0.06, 0.62) },
  point: { spread: 1, f: [[0.04, 0.06, 0.04], [1.3, 1.5, 0.9], [1.4, 1.58, 0.9], [1.46, 1.6, 0.92]], t: [0.35, 0.55, 0.45], td: v3(-0.12, 0.74, -0.66), tb: v3(-0.9, 0.2, 0.32) },
  flat: { spread: 0.35, f: [[0.05, 0.05, 0.03], [0.04, 0.05, 0.03], [0.06, 0.06, 0.04], [0.09, 0.08, 0.05]], t: [0.04, 0.08, 0.05], td: v3(-0.5, 0.8, -0.3), tb: v3(-0.7, 0.05, 0.7) },
  // a thumbs up: a loose fist, the thumb straight up along the hand's thumb side
  thumb: { spread: 0.4, f: [[1.32, 1.5, 0.95], [1.42, 1.6, 0.98], [1.48, 1.62, 1.0], [1.52, 1.64, 1.0]], t: [0.02, 0.06, 0.04], td: v3(-0.97, 0.22, -0.12), tb: v3(0.05, 0.1, 1) },
};

// ================================================================== the room's paint and light

const NP = 16; // the pools of light: three pieces, nine wall-washers, two on the end wall, the door, the lobby's name
const PAINT = `
  vec3 hallPaint(float y) {
    float t = clamp(y / ${H.toFixed(2)}, 0.0, 1.0);
    vec3 c = mix(vec3(0.925, 0.93, 0.914), vec3(0.895, 0.902, 0.904), smoothstep(0.0, 0.4, t));
    c = mix(c, vec3(0.46, 0.51, 0.6), smoothstep(0.44, 0.74, t));
    c = mix(c, vec3(0.149, 0.216, 0.353), smoothstep(0.7, 0.9, t));
    return mix(c, vec3(0.07, 0.1, 0.17), smoothstep(0.88, 1.0, t));
  }
  vec3 lobbyPaint(float y) { return mix(vec3(0.07, 0.09, 0.135), vec3(0.045, 0.06, 0.1), clamp(y / ${H.toFixed(2)}, 0.0, 1.0)); }
  uniform vec4 uPool[${NP}];
  uniform vec4 uPoolN[${NP}];
  // the light on a wall at p (its normal n): the hall's general light, brighter low down, and every pool on that wall
  float wallLight(vec3 p, vec3 n, float amb) {
    float L = amb * (0.86 + 0.14 * smoothstep(0.0, 1.3, p.y)) * (1.0 - 0.3 * smoothstep(2.4, 4.4, p.y));
    for (int i = 0; i < ${NP}; i++) {
      vec4 P = uPool[i], Q = uPoolN[i];
      if (P.w <= 0.0 || dot(Q.xyz, n) < 0.7) continue;
      vec3 d = p - P.xyz;
      float dn = dot(d, Q.xyz);
      vec3 tg = normalize(cross(vec3(0.0, 1.0, 0.0), Q.xyz));
      float a = dot(d, tg), v = d.y;
      // (a lamp's beam widens as it falls, its top edge sharper than its foot, a brighter core)
      float w = Q.w * (0.55 + 0.45 * clamp((4.3 - p.y) / 2.6, 0.0, 1.5));
      float vt = v > 0.0 ? exp(-v * v / 0.8) : exp(-v * v / 2.6);
      L += P.w * (exp(-a * a / (w * w)) * vt + 0.22 * exp(-a * a / (w * w * 0.25) - v * v / 0.6)) * exp(-dn * dn * 2.0);
    }
    return L;
  }
  float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
`;
const VERT = 'varying vec3 vW; varying vec3 vN; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }';

// ================================================================== the walk

export function createWalk(host, { picks, art, open, react, lenis, reduced, isTouch, local, light, label, gallery }) {
  const LIGHT = light || LIGHT_Q;
  const root = document.documentElement;
  const stage = el('div', 'wk-stage');
  const canvas = el('canvas', 'wk-gl');
  canvas.setAttribute('aria-hidden', 'true');
  const hits = el('div', 'wk-hits');
  // (the tag names the variant: ?wklight=dark is the walk in the dark, the user's pick of the two samples)
  const tag = el('p', 'wk-tag', label || (LIGHT === 'dark' ? 'Test · The walk, in the dark' : LIGHT === 'real' ? 'Test · The walk, lit' : 'Test · The walk'));
  const cue = el('p', 'wk-cue', 'Scroll to walk in · drag to look');
  const enter = el('button', 'wk-enter');
  enter.type = 'button';
  enter.innerHTML = '<span>Enter the gallery</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2v11M3.5 8.5 8 13l4.5-4.5"/></svg>';
  // under the piece you are at: a thumbs up, Hire, and the way into it in detail
  const bar = el('div', 'wk-react');
  bar.innerHTML = '<button class="wk-up" type="button" aria-pressed="false" aria-label="Thumbs up"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.5 20.5h-3v-10h3zM7.5 10.5l3.6-6.7a1.6 1.6 0 0 1 3 1l-.8 4.2h5.2a1.9 1.9 0 0 1 1.9 2.3l-1.5 7.4a2.3 2.3 0 0 1-2.2 1.8H7.5z"/></svg></button>'
    + '<a class="wk-hire" href="#hire" data-soon></a>'
    + '<button class="wk-more" type="button"><span>See in detail</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5"/></svg></button>';
  const upBtn = bar.querySelector('.wk-up'), hireA = bar.querySelector('.wk-hire'), moreBtn = bar.querySelector('.wk-more');
  // at the door, in the middle of the screen, the way in (the door's own handle, as a game shows one)
  const doorBtn = el('button', 'wk-door');
  doorBtn.type = 'button';
  doorBtn.innerHTML = '<span>Enter the gallery</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 8h11M8.5 3.5 13 8l-4.5 4.5"/></svg>';
  const fade = el('div', 'wk-fade');
  stage.append(canvas, hits, bar, doorBtn, tag, cue, enter, fade);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  host.classList.add('is-walk');
  host.append(stage);
  // (the sharpness steps down on its own if a machine cannot keep up: DPRS, the governor below)
  const DPRS = [1.5, 1.25, 1, 0.85].filter((d) => d <= Math.max(1, devicePixelRatio || 1) + 0.01);
  let dprI = 0;
  renderer.setPixelRatio(DPRS[0] || 1);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.autoClear = false;
  const maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050709');
  const camera = new THREE.PerspectiveCamera(55, 1, 0.05, 60);
  camera.rotation.order = 'YXZ';

  // ---- the paint and the light, worked out on the surfaces (no lights in the room)
  const U = {
    pool: { value: Array.from({ length: NP }, () => new THREE.Vector4()) },
    poolN: { value: Array.from({ length: NP }, () => new THREE.Vector4()) },
  };
  let poolN = 0;
  const pool = (c, n, strength, halfW) => { const i = poolN++; U.pool.value[i].set(c[0], c[1], c[2], strength); U.poolN.value[i].set(n[0], n[1], n[2], halfW); return i; };
  // a wall's paint lit: kind 0 the hall's (paper into dawn blue into night), 1 the lobby's night
  const litMat = (kind, amb) => new THREE.ShaderMaterial({
    uniforms: { uPool: U.pool, uPoolN: U.poolN, uAmb: { value: amb } },
    vertexShader: VERT,
    fragmentShader: `${PAINT}
      uniform float uAmb; varying vec3 vW; varying vec3 vN;
      void main() {
        vec3 n = normalize(vN);
        vec3 c = ${kind ? 'lobbyPaint' : 'hallPaint'}(vW.y) * wallLight(vW, n, uAmb);
        c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  // the Easter egg (21 Nov, the user: "on the ceiling, a butterfly made of the lighting: whoever looks up sees it,
  // whoever does not, does not"): over the middle of the hall a laylight in the shape of a butterfly, its glass held in a
  // net like the way in's butterfly; seen only by looking up, and faintly in the polished floor
  const BF = { x: 0, z: -8.7, w: 2.7, d: 1.75 };
  const bflyTex = (() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 664;
    const x = c.getContext('2d'), cx = 512, ry = 316;
    // a wing as a path, drawn about the wing's root at the scale k (k below 1: the line inside its border)
    const wing = (s2, k, pts) => {
      const P = (px, py) => [cx + s2 * (14 + (px - 14) * k), ry + (py - ry) * k];
      const path = new Path2D();
      path.moveTo(...P(...pts[0]));
      for (let i = 1; i < pts.length; i += 3) path.bezierCurveTo(...P(...pts[i]), ...P(...pts[i + 1]), ...P(...pts[i + 2]));
      path.closePath();
      return path;
    };
    // the forewing rising to a rounded tip, the hindwing fuller and lower (x out from the body, y down)
    const FORE = [[14, 300], [90, 150], [260, 40], [400, 30], [470, 26], [494, 72], [472, 132], [442, 222], [400, 300], [300, 330], [200, 350], [90, 332], [16, 318]];
    const HIND = [[14, 332], [140, 322], [330, 342], [382, 422], [422, 492], [362, 592], [252, 622], [162, 646], [72, 582], [32, 472], [18, 422], [12, 382], [12, 360]];
    x.fillStyle = '#fff';
    [1, -1].forEach((s2) => { x.fill(wing(s2, 1, FORE)); x.fill(wing(s2, 1, HIND)); });
    // the body: the thorax, the abdomen, the head, the antennae with their clubs
    x.beginPath(); x.ellipse(cx, 300, 16, 70, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(cx, 432, 11, 122, 0, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(cx, 222, 16, 0, Math.PI * 2); x.fill();
    x.lineCap = 'round';
    x.lineWidth = 9;
    x.strokeStyle = '#fff';
    [1, -1].forEach((s2) => { x.beginPath(); x.moveTo(cx + s2 * 6, 210); x.quadraticCurveTo(cx + s2 * 30, 120, cx + s2 * 74, 62); x.stroke(); x.beginPath(); x.arc(cx + s2 * 76, 58, 11, 0, Math.PI * 2); x.fill(); });
    // the net that holds the glass: veins from the root out to the edge, and a line inside each wing's border, cut out of
    // the light (the way in's butterfly is a net too)
    x.globalCompositeOperation = 'destination-out';
    x.lineWidth = 8;
    x.strokeStyle = '#000';
    [1, -1].forEach((s2) => {
      [[400, 30], [472, 132], [442, 222], [392, 300], [298, 332]].forEach(([ex, ey]) => { x.beginPath(); x.moveTo(cx + s2 * 24, 306); x.quadraticCurveTo(cx + s2 * (24 + ex) * 0.5, (306 + ey) / 2 - 24, cx + s2 * ex, ey); x.stroke(); });
      [[382, 422], [402, 506], [330, 602], [232, 628], [110, 600]].forEach(([ex, ey]) => { x.beginPath(); x.moveTo(cx + s2 * 24, 346); x.quadraticCurveTo(cx + s2 * (24 + ex) * 0.5, (346 + ey) / 2 + 12, cx + s2 * ex, ey); x.stroke(); });
      x.stroke(wing(s2, 0.8, FORE));
      x.stroke(wing(s2, 0.78, HIND));
    });
    x.globalCompositeOperation = 'source-over';
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  })();
  // the pieces, for the floor's reflection: their middles, normals, half sizes and colours
  const PC = { c: { value: [0, 1, 2].map(() => new THREE.Vector4()) }, n: { value: [0, 1, 2].map(() => new THREE.Vector4()) }, col: { value: [0, 1, 2].map(() => new THREE.Vector3(0.12, 0.12, 0.13)) } };
  // (with ?wklight=, the room's materials and lamps come from js/walk-light.js)
  const RL = LIGHT === 'before' ? null : roomLight(LIGHT, { HX, H, Z_IN, Z_END, Z_LOBBY, GATE, DOOR, SLOT, BF, PC, bflyTex });
  const hallMat = RL ? RL.wall : litMat(0, 0.72), lobbyMat = RL ? RL.lobby : litMat(1, 0.62);
  // the floor: dark and polished, the lamps' light spilling on it near the walls, the light slots, the walls' light
  // and each piece's colour reflected in it, softer the further away; the first light from the open door
  const floorMat = RL?.floor || new THREE.ShaderMaterial({
    uniforms: { uPool: U.pool, uPoolN: U.poolN, uPc: PC.c, uPcN: PC.n, uPcCol: PC.col, uGlow: { value: 0 }, uRefl: { value: 1 }, uBfly: { value: bflyTex }, uBflyR: { value: new THREE.Vector4(BF.x, BF.z, BF.w, BF.d) } },
    vertexShader: VERT,
    fragmentShader: `${PAINT}
      uniform vec4 uPc[3]; uniform vec4 uPcN[3]; uniform vec3 uPcCol[3]; uniform float uGlow, uRefl; uniform sampler2D uBfly; uniform vec4 uBflyR;
      varying vec3 vW; varying vec3 vN;
      void main() {
        float L = 0.78 + 0.32 * exp(-vW.x * vW.x / 5.0) + 0.16 * exp(-pow(vW.x - uBflyR.x, 2.0) / 1.4 - pow(vW.z - uBflyR.y, 2.0) / 0.9);
        for (int i = 0; i < ${NP}; i++) {
          vec4 P = uPool[i], Q = uPoolN[i];
          if (P.w <= 0.0) continue;
          vec3 d = vW - P.xyz;
          float dn = dot(d, Q.xyz), a = dot(d, normalize(cross(vec3(0.0, 1.0, 0.0), Q.xyz)));
          if (dn < 0.0) continue;
          L += P.w * 0.9 * exp(-a * a / (Q.w * Q.w * 1.8)) * exp(-dn * dn / 0.8);
        }
        vec3 c = vec3(0.05, 0.058, 0.076) * L;
        vec3 V = normalize(vW - cameraPosition), R = reflect(V, vec3(0.0, 1.0, 0.0));
        float fres = 0.03 + 0.62 * pow(1.0 - clamp(R.y, 0.0, 1.0), 5.0);
        vec3 refl = vec3(0.0);
        if (uRefl > 0.5) {
          // the walls: the nearest the ray meets (the side walls, or the end wall)
          float tx = abs(R.x) > 1e-4 ? ((R.x > 0.0 ? ${HX.toFixed(2)} : -${HX.toFixed(2)}) - vW.x) / R.x : 1e5;
          float tz = R.z < -1e-4 ? (${Z_END.toFixed(2)} - vW.z) / R.z : 1e5;
          float t = min(tx, tz);
          vec3 p = vW + R * t;
          if (t > 0.0 && t < 60.0 && p.y < ${H.toFixed(2)}) {
            vec3 n = tx < tz ? vec3(-sign(R.x), 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
            refl = hallPaint(p.y) * wallLight(p, n, 0.72) * exp(-t * 0.06);
          }
          // each piece, as a soft patch of its own colour
          for (int i = 0; i < 3; i++) {
            vec3 n = uPcN[i].xyz;
            float dr = dot(R, n);
            if (dr >= -1e-3) continue;
            float tt = dot(uPc[i].xyz - vW, n) / dr;
            if (tt <= 0.0) continue;
            vec3 q = vW + R * tt;
            float a = dot(q - uPc[i].xyz, normalize(cross(vec3(0.0, 1.0, 0.0), n))), b = q.y - uPc[i].y, s = 0.03 + 0.035 * tt;
            float m = (1.0 - smoothstep(uPc[i].w - s, uPc[i].w + s, abs(a))) * (1.0 - smoothstep(uPcN[i].w - s, uPcN[i].w + s, abs(b)));
            refl = mix(refl, uPcCol[i], m * 0.9);
          }
        }
        // the light slots in the ceiling
        float tc = (${H.toFixed(2)} - vW.y) / max(R.y, 1e-3);
        vec3 cp = vW + R * tc;
        float so = 0.025 + 0.03 * tc;
        float slot = (1.0 - smoothstep(0.045 - so, 0.045 + so, abs(abs(cp.x) - ${SLOT.toFixed(3)}))) * step(${(Z_END + 0.3).toFixed(2)}, cp.z) * step(cp.z, ${(Z_IN - 0.3).toFixed(2)});
        refl += vec3(1.0, 1.0, 1.02) * slot * 1.6 / (1.0 + so * 8.0);
        // (the butterfly, softly)
        vec2 bu = vec2(0.5 - (cp.x - uBflyR.x) / uBflyR.z, 0.5 - (cp.z - uBflyR.y) / uBflyR.w);
        if (bu.x > 0.0 && bu.x < 1.0 && bu.y > 0.0 && bu.y < 1.0) refl += vec3(0.95, 0.97, 1.0) * texture2D(uBfly, bu, so * 30.0).a * 1.1 / (1.0 + so * 8.0);
        c += refl * fres;
        // the first light from the door, once it is open
        c += uGlow * vec3(0.16, 0.22, 0.36) * exp(-pow(vW.z - ${DOOR.z.toFixed(2)}, 2.0) / 0.9) * (1.0 - smoothstep(-${HX.toFixed(2)}, -${(HX - 2.4).toFixed(2)}, vW.x));
        c += (hash(gl_FragCoord.xy) - 0.5) / 255.0;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  const flat = (c) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c), toneMapped: false });
  const ceilMat = RL?.ceil || flat('#07090e'), trimMat = flat('#0d1424'), fixMat = flat('#0b0d12');
  const box = (w, h, d, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); scene.add(m); return m; };
  const plane = (w, h, mat, x, y, z, ry = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };

  // ---- the floor, the ceiling and its two light slots
  {
    const fw = 2 * HX + 5, fl = Z_LOBBY - Z_END + 0.5, fz = (Z_LOBBY + Z_END) / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fl), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(-1.25, 0, fz);
    scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(fw, fl), ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.set(-1.25, H, fz);
    scene.add(ceil);
    const len = Z_IN - Z_END - 0.6, zc = (Z_IN + Z_END) / 2;
    const glowMat = RL?.slot || new THREE.MeshBasicMaterial({ color: new THREE.Color(0.97, 0.98, 1), toneMapped: false });
    [-SLOT, SLOT].forEach((x) => {
      box(0.17, 0.04, len, fixMat, x, H - 0.005, zc);
      const g = new THREE.Mesh(new THREE.PlaneGeometry(0.075, len), glowMat);
      g.rotation.x = Math.PI / 2;
      g.position.set(x, H - 0.026, zc);
      scene.add(g);
    });
  }
  {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(BF.w, BF.d), RL?.glass || new THREE.MeshBasicMaterial({ map: bflyTex, color: new THREE.Color(0.93, 0.95, 1), transparent: true, toneMapped: false, depthWrite: false }));
    m.rotation.set(Math.PI / 2, 0, Math.PI);
    m.position.set(BF.x, H - 0.008, BF.z);
    scene.add(m);
  }
  // ---- the hall: the right wall whole, the left wall round the door, the end wall
  const zA = DOOR.z + DOOR.w / 2, zB = DOOR.z - DOOR.w / 2;
  {
    const wall = (w, y0, y1, x, z, ry) => plane(w, y1 - y0, hallMat, x, (y0 + y1) / 2, z, ry);
    wall(Z_IN - Z_END, 0, H, HX, (Z_IN + Z_END) / 2, -Math.PI / 2);
    wall(Z_IN - zA, 0, H, -HX, (Z_IN + zA) / 2, Math.PI / 2);
    wall(zB - Z_END, 0, H, -HX, (zB + Z_END) / 2, Math.PI / 2);
    wall(DOOR.w, DOOR.h, H, -HX, DOOR.z, Math.PI / 2);
    wall(2 * HX, 0, H, 0, Z_END, 0);
    // the door's reveals, as deep as the wall is thick
    const T = 0.24;
    wall(T, 0, DOOR.h, -HX - T / 2, zA, Math.PI);
    wall(T, 0, DOOR.h, -HX - T / 2, zB, 0);
    const hd = new THREE.Mesh(new THREE.PlaneGeometry(T, DOOR.w), RL ? hallMat : flat('#c9cdd0'));
    hd.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    hd.position.set(-HX - T / 2, DOOR.h, DOOR.z);
    scene.add(hd);
    // skirting, a dark line at the foot of every wall
    const sk = 0.07;
    box(0.012, sk, Z_IN - Z_END, trimMat, HX - 0.006, sk / 2, (Z_IN + Z_END) / 2);
    box(0.012, sk, Z_IN - zA, trimMat, -HX + 0.006, sk / 2, (Z_IN + zA) / 2);
    box(0.012, sk, zB - Z_END, trimMat, -HX + 0.006, sk / 2, (zB + Z_END) / 2);
    box(2 * HX, sk, 0.012, trimMat, 0, sk / 2, Z_END + 0.006);
    // a dark frame round the door
    box(0.014, DOOR.h + 0.04, 0.04, trimMat, -HX + 0.007, (DOOR.h + 0.04) / 2, zA + 0.02);
    box(0.014, DOOR.h + 0.04, 0.04, trimMat, -HX + 0.007, (DOOR.h + 0.04) / 2, zB - 0.02);
    box(0.014, 0.04, DOOR.w + 0.08, trimMat, -HX + 0.007, DOOR.h + 0.02, DOOR.z);
  }
  // ---- the lobby: dark, its wall to the hall pierced by a tall doorway, the corner's name lettered over it
  {
    const T = 0.3, side = (HX - GATE.w / 2);
    box(side, H, T, lobbyMat, -(GATE.w / 2 + side / 2), H / 2, Z_IN);
    box(side, H, T, lobbyMat, GATE.w / 2 + side / 2, H / 2, Z_IN);
    box(GATE.w, H - GATE.h, T, lobbyMat, 0, (GATE.h + H) / 2, Z_IN);
    const ls = Z_LOBBY - Z_IN - T / 2;
    box(0.02, H, ls, lobbyMat, -HX, H / 2, Z_IN + T / 2 + ls / 2);
    box(0.02, H, ls, lobbyMat, HX, H / 2, Z_IN + T / 2 + ls / 2);
    box(2 * HX, H, 0.02, lobbyMat, 0, H / 2, Z_LOBBY);
  }
  // ---- beyond the door: only light (it is seen for a moment through the crack, as the room goes to black)
  {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const x = c.getContext('2d'), g = x.createRadialGradient(128, 150, 6, 128, 150, 190);
    // (with the light made real, beyond the door is only white light: the crack reads as a blade of it)
    if (RL) { g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#eef1f5'); }
    else { g.addColorStop(0, '#f6f8fc'); g.addColorStop(0.4, '#dbe3f1'); g.addColorStop(0.8, '#a9b8d3'); g.addColorStop(1, '#7f92b6'); }
    x.fillStyle = g;
    x.fillRect(0, 0, 256, 256);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    plane(3.2, H, new THREE.MeshBasicMaterial({ map: t, toneMapped: false }), -HX - 2.4, H / 2, DOOR.z, Math.PI / 2);
    const sm = flat(RL ? '#f3f5f8' : '#c3cee2');
    plane(2.4, H, sm, -HX - 1.2, H / 2, DOOR.z + 1.6, Math.PI);
    plane(2.4, H, sm, -HX - 1.2, H / 2, DOOR.z - 1.6, 0);
  }
  // ---- the door: painted as the wall is, hung at its near edge, a steel push plate where the hand goes
  const door = new THREE.Group();
  door.position.set(-HX - 0.02, 0, zA);
  scene.add(door);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.045, DOOR.h - 0.02, DOOR.w - 0.02), hallMat);
  leaf.position.set(0, (DOOR.h - 0.02) / 2 + (RL ? 0.008 : 0), -DOOR.w / 2);
  door.add(leaf);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.34, 0.11), flat(RL ? (RL.dark ? '#41464f' : '#a9afb8') : '#b9bfc8'));
  plate.position.set(0.026, 1.26, -DOOR.w * 0.64);
  door.add(plate);

  // ---- words on the walls, as vinyl lettering is
  function words(draw, W, Hc) {
    const c = document.createElement('canvas');
    c.width = W; c.height = Hc;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    const paint = () => { const x = c.getContext('2d'); x.clearRect(0, 0, W, Hc); draw(x); t.needsUpdate = true; };
    paint();
    return { t, paint };
  }
  const nameW = words((x) => {
    x.fillStyle = '#eef0ec';
    x.font = `600 190px ${FONT.sans}`;
    x.letterSpacing = '-7px';
    x.textAlign = 'center';
    x.fillText('Creative corner', 1024, 205);
    x.font = `400 58px ${FONT.sans}`;
    x.letterSpacing = '-1px';
    x.globalAlpha = 0.62;
    x.fillText('The art of the day, the week and the month', 1024, 318);
  }, 2048, 360);
  {
    const w = 2.7, m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 360 / 2048), new THREE.MeshBasicMaterial({ map: nameW.t, transparent: true, toneMapped: false, depthWrite: false, color: new THREE.Color(0.9, 0.91, 0.9) }));
    m.position.set(0, GATE.h + 0.5, Z_IN + 0.152);
    scene.add(m);
  }

  // ---- the pools of light (the pieces' are set as they are hung, below)
  const heats = [];
  if (!RL) {
    const washes = { left: [0.8, -1.8, -7.0, -9.6], right: [0.8, -1.8, -4.4, -9.6, -12.2] };
    washes.left.forEach((z) => pool([-HX, 2.5, z], [1, 0, 0], 0.2, 0.5));
    washes.right.forEach((z) => pool([HX, 2.5, z], [-1, 0, 0], 0.2, 0.5));
    [-2.6, 2.6].forEach((x) => pool([x, 2.5, Z_END], [0, 0, 1], 0.18, 0.5));
    pool([-HX, 2.0, DOOR.z], [1, 0, 0], 0.26, 0.9);
    pool([0, 3.25, Z_IN + 0.15], [0, 0, 1], 1.5, 1.7);
  }
  // the fittings: a small lamp in the slot over each piece
  const lensMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.98, 0.94), toneMapped: false });
  function fitting(pos, at) {
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.058, 0.16, 14), fixMat);
    can.position.copy(pos);
    can.lookAt(at);
    can.rotateX(Math.PI / 2);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.04, 18), lensMat);
    lens.position.y = -0.081;
    lens.rotation.x = Math.PI / 2;
    can.add(lens);
    scene.add(can);
  }
  RL?.roomLamps(scene, fixMat, lensMat);

  // ---- the pieces: stretched canvases with a glass face, as the dawn gallery hung them
  const glassFace = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; varying vec3 vW; varying vec3 vN; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * vec3(0.0, 0.0, 1.0)); gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vUv; varying vec3 vW; varying vec3 vN;
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        float side = dot(cross(vN, vec3(0.0, 1.0, 0.0)), V);
        float t = vUv.x * 0.62 + (1.0 - vUv.y) * 0.48 - side * 0.9;
        float streak = exp(-pow((t - 0.5) / 0.11, 2.0)) * 0.06 + exp(-pow((t - 0.74) / 0.018, 2.0)) * 0.04;
        float fres = pow(1.0 - clamp(dot(V, vN), 0.0, 1.0), 3.0) * 0.18;
        gl_FragColor = vec4(vec3(0.88, 0.92, 1.0) * (streak + fres), 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false,
  });
  const glassEdge = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.6, 0.68), transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const canvasBack = flat('#0c0e12');
  const shadowTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#000';
    x.fillRect(0, 0, 128, 128);
    x.shadowColor = '#fff';
    x.shadowBlur = 16;
    x.shadowOffsetX = 600;
    x.fillStyle = '#fff';
    x.fillRect(24 - 600, 24, 80, 80);
    return new THREE.CanvasTexture(c);
  })();
  const LH = 300;
  function labelDraw(lines) {
    return (x) => {
      x.fillStyle = RL?.dark ? '#e7e9e4' : INK;
      let y = 58;
      lines.forEach(([kind, text]) => {
        if (!text) return;
        if (kind === 'small') { x.font = `600 50px ${FONT.sans}`; x.globalAlpha = 0.7; x.fillText(text, 0, y); y += 108; }
        else if (kind === 'title') {
          let s = 100;
          x.font = `italic 600 ${s}px ${FONT.disp}`;
          while (x.measureText(text).width > 1010 && s > 40) { s -= 4; x.font = `italic 600 ${s}px ${FONT.disp}`; }
          x.globalAlpha = 1; x.fillText(text, 0, y); y += 76;
        } else { x.font = `400 54px ${FONT.sans}`; x.globalAlpha = 0.84; x.fillText(text, 0, y); y += 64; }
      });
      x.globalAlpha = 1;
    };
  }
  // a picture's average colour, for its reflection in the floor
  const avgOf = (img) => { try { const c = document.createElement('canvas'); c.width = c.height = 1; const x = c.getContext('2d'); x.drawImage(img, 0, 0, 1, 1); const d = x.getImageData(0, 0, 1, 1).data; return [d[0] / 255, d[1] / 255, d[2] / 255]; } catch (e) { return null; } };
  const loader = new THREE.TextureLoader();
  const pieces = [];
  const [day, week, month] = picks;
  [[day, HANGS.day], [week, HANGS.week], [month, HANGS.month]].forEach(([k, at]) => {
    if (!k) return;
    const r = k.pc.ratio || 1, long = at.long, w = r >= 1 ? long : long * r, h = r >= 1 ? long / r : long;
    const Wl = WALLS[at.wall], g = new THREE.Group();
    g.rotation.y = Wl.ry;
    if (at.wall === 'left') g.position.set(-HX, at.y, at.at);
    else if (at.wall === 'right') g.position.set(HX, at.y, at.at);
    else g.position.set(at.at, at.y, Z_END);
    scene.add(g);
    const d = 0.045;
    const geo = new THREE.BoxGeometry(w, h, d), uv = geo.attributes.uv, E = 0.018;
    const remap = (face, fn) => { for (let i = face * 4; i < face * 4 + 4; i++) { const [u, v] = fn(uv.getX(i), uv.getY(i)); uv.setXY(i, u, v); } };
    remap(0, (u, v) => [1 - E + u * E, v]); remap(1, (u, v) => [u * E, v]); remap(2, (u, v) => [u, 1 - E + v * E]); remap(3, (u, v) => [u, v * E]);
    uv.needsUpdate = true;
    const face = new THREE.MeshBasicMaterial({ color: 0x1b1814, toneMapped: false });
    const side = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.5, 0.5, 0.52), toneMapped: false });
    // (with the light made real, the canvas's edges take it: the top edge lit, the bottom in its own shade)
    const sideK = RL ? (RL.dark ? [0.42, 0.42, 0.92, 0.14] : [0.6, 0.6, 0.86, 0.3]) : [0.62, 0.62, 0.62, 0.62];
    const sides = RL ? sideK.map(() => side.clone()) : [side, side, side, side];
    const mesh = new THREE.Mesh(geo, [...sides, face, canvasBack]);
    mesh.position.z = d / 2 + 0.006;
    g.add(mesh);
    const gl = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.006), [glassEdge, glassEdge, glassEdge, glassEdge, glassFace, glassEdge]);
    gl.position.z = d / 2 + 0.0035;
    gl.renderOrder = 3;
    mesh.add(gl);
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.3, h + 0.3), new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: shadowTex, transparent: true, opacity: 0.42, depthWrite: false }));
    sh.position.set(0.02, -0.06, 0.003);
    // (with the light made real, the canvas's shadow is worked out on the wall from its own lamp instead)
    if (RL) sh.visible = false;
    g.add(sh);
    // its pool of light and its lamp in the slot above
    const n = new THREE.Vector3(...Wl.n), c = new THREE.Vector3();
    g.getWorldPosition(c);
    const end = at.wall === 'end', base = end ? 0.36 : 0.3;
    const pi = RL ? -1 : pool([c.x, c.y + 0.35, c.z], Wl.n, base, w * 0.55 + 0.45);
    const fp = end ? new THREE.Vector3(0, H - 0.1, Z_END + 2.3) : new THREE.Vector3(Math.sign(c.x) * SLOT, H - 0.1, c.z);
    fitting(fp, c);
    const ix = pieces.length;
    PC.c.value[ix].set(c.x + n.x * 0.05, c.y, c.z + n.z * 0.05, w / 2);
    PC.n.value[ix].set(n.x, n.y, n.z, h / 2);
    RL?.pieceLamp(ix, fp, c, n, w, h);
    // its label, right of it, level with its foot (under it on a phone: layout() moves it; in the dark, its light follows)
    const lw = at.wall === 'end' ? 0.92 : 0.78, lh = lw * LH / 1024, lab = words(labelDraw(k.lines), 1024, LH);
    const lm = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), new THREE.MeshBasicMaterial({ map: lab.t, transparent: true, toneMapped: false, depthWrite: false }));
    g.add(lm);
    const labelAt = (under) => {
      if (under) lm.position.set(-w / 2 + lw / 2, -h / 2 - 0.09 - lh / 2, 0.004);
      else lm.position.set(w / 2 + 0.28 + lw / 2, -h / 2 + lh / 2, 0.004);
      RL?.labelMoved(ix, lm, lw, lh);
    };
    labelAt(false);
    const P = { k, at, w, h, g, mesh, face, side, sides, sideK, n, c, lab, labelAt, pi, ix, base, heat: 0, b: null, img: null };
    const b = el('button', 'wk-hit'), img = el('img');
    b.type = 'button';
    b.setAttribute('aria-label', `${k.honour ? `${k.honour}: ` : ''}${k.title} by ${k.maker}`);
    img.alt = '';
    b.append(img);
    hits.append(b);
    P.b = b; P.img = img;
    art(k.pc, Math.round(clamp(long * 760, 700, 1700))).then((url) => {
      loader.load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAniso;
        face.map = t; face.color.set(0xffffff); face.needsUpdate = true;
        sides.forEach((s, i) => { s.map = t; s.color.setRGB(sideK[i], sideK[i], RL ? sideK[i] * 1.02 : 0.64); s.needsUpdate = true; });
        const a = avgOf(t.image);
        if (a) { PC.col.value[ix].set(...a); RL?.pieceColour(ix, a); }
        RL?.pieceArt(ix, t);
        img.src = url;
        dirty = 3;
      });
    });
    pieces.push(P);
    heats.push(P);
  });

  // ---- a few visitors already here (js/walk-visitors.js): from behind, a little out of focus, each turned to the art,
  // standing where they never come between you and a piece (they are passed on the way, never seen from a stop)
  // (21 Nov, later: the user, "remove extra people": the hall is empty again; ?visitors brings them back)
  const visitors = [];
  if (/[?&]visitors\b/.test(location.search)) {
    const shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.32, depthWrite: false, alphaMap: (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 2, 32, 32, 31); g.addColorStop(0, '#fff'); g.addColorStop(1, '#000'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })() });
    // (one looking at the day's piece from across the hall, seen through the doorway from the lobby; two farther on, one
    // each side, looking down the hall at the month's: you pass behind them, and none is in view from a stop)
    [['bun', 1.0, -2.6], ['coat', -2.0, -9.6], ['long', 2.3, -12.9]].forEach(([kind, x, z], i) => {
      const t = new THREE.CanvasTexture(person(kind, 12));
      t.colorSpace = THREE.SRGBColorSpace;
      const hp = 1.72 / PERSON_H, wp = hp * 360 / 800;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(wp, hp), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));
      m.position.set(x, hp / 2 - hp * (1 - PERSON_TOP - PERSON_H), z);
      m.renderOrder = 2;
      scene.add(m);
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), shadowMat);
      sh.rotation.x = -Math.PI / 2;
      sh.position.set(x, 0.004, z);
      scene.add(sh);
      visitors.push({ m, x, z, ph: i * 2.1 });
    });
  }

  // ================================================================ the hands
  const handScene = new THREE.Scene();
  const handCam = new THREE.PerspectiveCamera(52, 1, 0.01, 4);
  const hemi = new THREE.HemisphereLight(0xe6ecf5, 0x1a1f2a, 1.15);
  handScene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff7ee, 1.7);
  key.position.set(0.45, 0.85, 0.15);
  const rim = new THREE.DirectionalLight(0xe2eaff, 1.25);
  rim.position.set(-0.4, 0.45, -1);
  handScene.add(key, rim);
  // the hands: one continuous surface on a skeleton (js/walk-hand.js), bare skin unless ?hands=gloves, made off the main
  // thread so they arrive a moment after the room; each on the sleeve of a dark jacket over a white shirt's cuff
  const gloves = /[?&]hands=gloves\b/.test(location.search);
  const handMat = handMaterial(gloves);
  const sleeveMat = new THREE.MeshPhysicalMaterial({ color: '#141b29', roughness: 0.86, sheen: 0.7, sheenRoughness: 0.6, sheenColor: new THREE.Color('#56668a'), side: THREE.DoubleSide });
  const shirtMat = new THREE.MeshStandardMaterial({ color: '#e6e8e5', roughness: 0.82, side: THREE.DoubleSide });
  const sleeveGeo = new THREE.CylinderGeometry(0.041, 0.05, 1, 28, 1, true).translate(0, -0.5, 0);
  const hemGeo = new THREE.TorusGeometry(0.041, 0.004, 8, 40).rotateX(Math.PI / 2);
  const cuffGeo = new THREE.CylinderGeometry(0.035, 0.0365, 0.085, 28, 1, true).translate(0, -0.0425, 0);
  const hands = [false, true].map((left) => {
    const root = new THREE.Group();
    root.visible = false;
    handScene.add(root);
    const sleeve = new THREE.Group(), tube = new THREE.Mesh(sleeveGeo, sleeveMat), hem = new THREE.Mesh(hemGeo, sleeveMat);
    // (the shirt's cuff, a finger's width past the jacket's)
    const cuff = new THREE.Mesh(cuffGeo, shirtMat);
    cuff.position.y = 0.018;
    sleeve.add(tube, hem, cuff);
    sleeve.visible = false;
    handScene.add(sleeve);
    const rest = POSES[left ? 'restL' : 'rest'];
    return {
      left, root, sleeve, tube, s: left ? -1 : 1, rest, rig: null,
      pos: new THREE.Vector3(), q: new THREE.Quaternion(), curl: rest.f.map((r) => [...r]), tc: [...rest.t], td: rest.td.clone(), tb: rest.tb.clone(), spread: rest.spread,
      tp: new THREE.Vector3(), tq: new THREE.Quaternion(), born: false, wave: [0, 1, 2, 3].map((i) => [0.37 + 0.11 * i + (left ? 0.05 : 0), i * 1.7 + (left ? 2.3 : 0)]),
    };
  });
  makeHandGeometry({ cell: isTouch || innerWidth < 900 ? 0.0024 : 0.0018, glove: gloves }).then((geo) => {
    hands.forEach((h) => { h.rig = makeHand(geo, handMat, h.left); h.root.add(h.rig.holder); h.root.visible = true; h.sleeve.visible = true; });
    handsReady = true;
    dirty = 3;
  }).catch(() => {}); // (without a worker there are no hands; the walk goes on without them)
  let handsReady = false;
  const vA = new THREE.Vector3(), vB = new THREE.Vector3(), vC = new THREE.Vector3(), DOWN = new THREE.Vector3(0, -1, 0);
  const aimOf = (h, out) => (h === 'door' ? plate.getWorldPosition(out) : out.copy(h.c));
  // the bones set to the hand's pose (never quite still: each finger drifts a little on its own)
  const idleW = [0, 0, 0, 0];
  function bend(h, t) {
    if (!h.rig) return;
    const idle = reduced ? 0 : 0.045;
    for (let i = 0; i < 4; i++) idleW[i] = idle * Math.sin(t * h.wave[i][0] * 2 + h.wave[i][1]);
    poseHand(h.rig, h, idleW);
  }

  // ================================================================ the walk
  const pointer = { x: 0, y: 0, tx: 0, ty: 0, cx: 0, cy: 0, inside: false };
  const look = { yaw: 0, pitch: 0 };
  let vw = 1, vh = 1, top = 0, span = 1, narrow = false;
  let stops = [], near = null;
  let pv = 0, force = null, walked = 0, spd = 0, lean = 0, hold = false, hover = null, dragging = false, thumbT = -9, dirty = 3;
  const last = { x: 0, z: 0, yaw: 0, pitch: 0 }, inert = { x: 0, y: 0 };
  const halfW = (z) => z * Math.tan(handCam.fov * Math.PI / 360) * handCam.aspect;
  const halfH = (z) => z * Math.tan(handCam.fov * Math.PI / 360);

  function stopOf(P) {
    const tv = Math.tan(camera.fov * Math.PI / 360), th = tv * camera.aspect, end = P.at.wall === 'end';
    const fw = narrow ? 0.84 : end ? 0.42 : 0.36, fh = narrow ? 0.46 : end ? 0.52 : 0.5;
    const D = clamp(Math.max(P.w / (2 * th * fw), P.h / (2 * tv * fh)), end ? 2.4 : 1.6, end ? 7.5 : 3.3);
    const x = P.c.x + P.n.x * D, z = P.c.z + P.n.z * D;
    // (on a laptop the eye rests a little right of centre, so the label is in the picture too; a little high, so the
    // ways to react fit under the piece)
    const right = new THREE.Vector3(0, 1, 0).cross(P.n).negate(), sh = narrow ? 0 : (P.w / 2 + 0.6) * 0.32;
    const ax = P.c.x + right.x * sh, az = P.c.z + right.z * sh;
    return { x, z, yaw: Math.atan2(-(ax - x), -(az - z)), pitch: Math.atan2(P.c.y - (narrow ? 0.12 : 0.1) - EYE, D), P, D };
  }
  function layout() {
    vw = stage.clientWidth || innerWidth;
    vh = stage.clientHeight || innerHeight;
    renderer.setSize(vw, vh, false);
    const asp = vw / vh;
    narrow = asp < 1;
    camera.aspect = asp;
    camera.fov = narrow ? 70 : 55;
    camera.updateProjectionMatrix();
    handCam.aspect = asp;
    handCam.fov = camera.fov;
    handCam.updateProjectionMatrix();
    top = host.getBoundingClientRect().top + scrollY;
    span = Math.max(1, host.offsetHeight - vh);
    pieces.forEach((P) => P.labelAt(narrow));
    stops = [
      { x: 0, z: Z_IN + 3.0, yaw: 0, pitch: narrow ? 0.13 : 0.15 },
      ...pieces.map(stopOf),
      { x: -HX + 1.6, z: DOOR.z, yaw: Math.PI / 2, pitch: -0.05 },
    ];
    near = { x: -HX + 0.62, z: DOOR.z - 0.05, yaw: Math.PI / 2 - 0.32, pitch: -0.3 };
    dirty = 3;
  }
  const progress = () => clamp((scrollY - top) / span, 0, 1);
  const N = () => stops.length - 1;
  const stopY = (i) => top + (clamp(i, 0, N()) / N()) * WALK * span;
  const atStop = () => clamp(pv / WALK, 0, 1) * N();
  const walkTo = (i, then) => lenis.scrollTo(stopY(i), { duration: reduced ? 0 : 1.6, onComplete: then });

  // into the gallery: the room fades to black, the gallery's title rises out of it, then the wall of every piece
  let entering = false, entered = false;
  const doorState = { ajar: 0 }, drive = { q: 0 };
  function intoGallery(atDoor) {
    if (entering) return;
    entering = true;
    entered = true;
    // (through the door: the next section; "Enter the gallery" goes to the gallery itself, past any other opening)
    const works = (!atDoor && gallery) || host.nextElementSibling, head = works?.querySelector('.cw-head');
    const go = () => {
      const to = works ? works.getBoundingClientRect().top + scrollY : top + span + vh;
      works?.classList.add('is-cut', 'is-landing');
      head?.classList.remove('is-in');
      lenis.start?.();
      lenis.scrollTo(to, { immediate: true, force: true });
      requestAnimationFrame(() => {
        gsap?.set(fade, { opacity: 0 });
        works?.classList.remove('is-cut');
        setTimeout(() => head?.classList.add('is-in'), reduced ? 0 : 280);
        setTimeout(() => works?.classList.remove('is-landing'), reduced ? 0 : 1000);
        // (the door shut again behind you, for whoever walks back)
        doorState.ajar = 0;
        drive.q = 0;
        entering = false;
      });
    };
    if (reduced || !gsap) { go(); return; }
    lenis.stop?.();
    // (at the door: it opens a crack on the light and the room is black almost at once; nothing of the room beyond is seen)
    if (atDoor) gsap.to(doorState, { ajar: 0.2, duration: 0.5, ease: 'power2.in' });
    gsap.to(fade, { opacity: 1, duration: atDoor ? 0.42 : 0.8, ease: atDoor ? 'power2.in' : 'power2.inOut', onComplete: go });
  }
  // the door, pushed: you step up, the hand goes to the plate, and in
  function pushDoor() {
    if (entering || drive.q > 0) return;
    if (reduced || !gsap) { intoGallery(true); return; }
    gsap.to(drive, { q: 0.32, duration: 0.95, ease: 'power2.inOut', onComplete: () => intoGallery(true) });
  }
  enter.addEventListener('click', () => intoGallery(false));
  doorBtn.addEventListener('click', pushDoor);

  // where you are, for the walk so far: dwelling at each stop, walking and turning between them, then the door
  function poseAt(v) {
    const s = clamp(v / WALK, 0, 1) * N(), i = Math.min(N() - 1, Math.floor(s)), f = smooth(0.14, 0.86, s - i);
    const A = stops[i], B = stops[i + 1];
    const q = Math.max(clamp((v - WALK) / (1 - WALK), 0, 1), drive.q), up = smooth(0, 0.3, q);
    const to = (a) => lerp(lerp(A[a], B[a], f), near[a], up);
    return { x: to('x'), z: to('z'), yaw: to('yaw'), pitch: to('pitch'), s, q, f, i };
  }
  // the piece you are standing at, if you are
  const atPiece = (Q) => { const k = Math.round(Q.s); return Q.q < 0.01 && k >= 1 && k <= pieces.length && Math.abs(Q.s - k) < 0.16 ? pieces[k - 1] : null; };

  // ---- the hands, each frame
  function poseHands(dt, t, Q, at) {
    const k = ease(reduced ? 30 : 7, dt), kq = ease(reduced ? 30 : 8, dt);
    const z0 = narrow ? 0.4 : 0.42;
    const xr = Math.min(0.16, halfW(z0) * (narrow ? 0.8 : 0.6)), turn = narrow ? 0.04 : 0.2;
    // (on a phone they wait below the screen, rising only to give a thumbs up or push the door: the art keeps it)
    const yr = -halfH(z0) * (narrow ? 1.45 : 0.98);
    const phase = walked / 0.7 * Math.PI, sw = reduced ? 0 : spd;
    const down = 0.3 * smooth(0.5, 0.8, Q.q) + 0.07 * lean + 0.022 * (1 - sw) * (1 - smooth(0, 0.05, Q.q));
    const thumbing = t - thumbT < 1.5;
    hands.forEach((h) => {
      const s = h.s;
      let pose = 'rest';
      if (!h.left && Q.q > 0.03 && Q.q < 0.6) pose = 'push';
      else if (!h.left && thumbing) pose = 'thumb';
      else if (!h.left && hover && !hold && !dragging && Q.q < 0.02 && !narrow) pose = 'point';
      let dir, back;
      if (pose === 'push') {
        const k2 = smooth(0.06, 0.27, Q.q);
        aimOf('door', vC).applyMatrix4(camera.matrixWorldInverse);
        vC.y -= 0.05; vC.z += 0.03;
        if (vC.length() > 0.78) vC.setLength(0.78);
        const ry = -halfH(z0) * 0.98;
        h.tp.set(lerp(s * xr, vC.x, k2), lerp(ry, vC.y, k2), lerp(-z0, vC.z, k2));
        dir = vA.set(0.02, 1, -0.22 - 0.3 * (1 - k2)); back = vB.set(0.08, 0.3 * (1 - k2), 1);
      } else if (pose === 'thumb') {
        // a thumbs up, held up a moment beside the piece, then let down
        const u = (t - thumbT) / 1.5, rise = smooth(0, 0.18, u) * (1 - smooth(0.78, 1, u));
        h.tp.set(lerp(s * xr, narrow ? 0.075 : 0.175, rise), lerp(yr, narrow ? -0.17 : -0.135, rise) + 0.012 * Math.sin(Math.min(1, u / 0.3) * Math.PI), -z0 - 0.03 * rise);
        dir = vA.set(-0.12, 0.08, -1); back = vB.set(1, -0.05, 0.25);
      } else if (pose === 'point') {
        aimOf(hover, vC).applyMatrix4(camera.matrixWorldInverse);
        h.tp.set(s * xr * 0.82, yr + 0.075, -z0 - 0.02);
        dir = vA.copy(vC).sub(h.tp).normalize(); back = vB.set(0.1, 1, 0.15);
      } else {
        h.tp.set(s * xr * (h.left ? 1.04 : 1), yr - (h.left ? 0.008 : 0), -z0 - (h.left ? 0.015 : 0));
        // (the wrist turns a little with each step)
        const tw = Math.sin(phase + (h.left ? Math.PI : 0)) * 0.08 * sw;
        dir = vA.set(-s * turn + tw * 0.4, 0.3, -1); back = vB.set(s * 0.78, 0.6 + tw, 0.14);
      }
      // the swing of the walk, the breath when still, the lag behind the head when it turns, lowered when leaning in
      // or going through the door
      h.tp.y += Math.sin(phase + (h.left ? Math.PI : 0)) * 0.011 * sw + Math.sin(t * 1.15 + (h.left ? 1.7 : 0)) * 0.0028 - (pose === 'push' ? 0 : down);
      h.tp.z += Math.cos(phase + (h.left ? Math.PI : 0)) * 0.012 * sw;
      h.tp.x += s * 0.03 * lean + inert.x;
      h.tp.y += inert.y;
      aim(dir, back, h.tq);
      if (!h.born) { h.pos.copy(h.tp); h.q.copy(h.tq); h.born = true; }
      h.pos.lerp(h.tp, pose === 'push' ? ease(reduced ? 30 : 14, dt) : k); // (the push quicker: the hand is on the plate as the door gives)
      h.q.slerp(h.tq, kq);
      const P = pose === 'rest' ? h.rest : POSES[pose === 'push' ? 'flat' : pose];
      h.curl.forEach((c, i) => c.forEach((v, n) => { c[n] = lerp(v, P.f[i][n], k); }));
      h.tc.forEach((v, n) => { h.tc[n] = lerp(v, P.t[n], k); });
      h.td.lerp(P.td, k).normalize();
      h.tb.lerp(P.tb, k).normalize();
      h.spread = lerp(h.spread, P.spread, k);
      h.root.position.copy(h.pos);
      h.root.quaternion.copy(h.q);
      h.root.scale.setScalar(narrow ? 0.74 : 0.92);
      bend(h, t);
      // the sleeve, from the elbow (below the screen) to the wrist, the glove's cuff tucked into it
      const elbow = vC.set(s * (Math.abs(h.pos.x) + 0.1), h.pos.y - 0.34, h.pos.z + 0.32);
      const d = vB.copy(elbow).sub(h.pos), len = d.length();
      d.normalize().multiplyScalar(0.25).addScaledVector(vA.set(0, -1, 0).applyQuaternion(h.q), 0.75).normalize();
      h.sleeve.position.copy(h.pos).addScaledVector(d, 0.03 * h.root.scale.x);
      h.sleeve.quaternion.setFromUnitVectors(DOWN, d);
      h.sleeve.scale.set(1.1 * h.root.scale.x, h.root.scale.x, 0.92 * h.root.scale.x);
      h.tube.scale.y = (len + 0.25) / h.root.scale.x;
    });
    // the light on them: the room's, dimmer in the lobby, brighter by a piece
    if (RL) RL.handLight({ hemi, key, rim }, at, camera.position.z);
    else key.intensity = lerp(1.0, 1.8, smooth(0.1, 0.7, at));
    return hands.some((h) => h.pos.distanceToSquared(h.tp) > 1e-8);
  }

  // ---- the pointer: the head follows it a little; drag to look round; point at a piece; hold to lean in
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  const pickAt = (cx, cy) => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects([...pieces.map((P) => P.mesh), leaf], false)[0];
    if (!hit || hit.distance > 9) return null;
    return hit.object === leaf ? 'door' : pieces.find((P) => P.mesh === hit.object) || null;
  };
  let downAt = null, holdT = 0;
  const onMove = (e) => { pointer.tx = (e.clientX / innerWidth - 0.5) * 2; pointer.ty = (e.clientY / innerHeight - 0.5) * 2; };
  addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointermove', (e) => {
    if (downAt) {
      const dx = e.clientX - downAt.x, dy = e.clientY - downAt.y;
      if (!dragging && Math.hypot(dx, dy) > 6) { dragging = true; clearTimeout(holdT); canvas.classList.add('is-dragging'); }
      if (dragging) {
        look.yaw = clamp(downAt.yaw + dx * 0.0042, -1.4, 1.4);
        look.pitch = clamp(downAt.pitch + dy * 0.003, -0.4, 0.4);
      }
      return;
    }
    if (e.pointerType === 'mouse') { pointer.cx = e.clientX; pointer.cy = e.clientY; pointer.inside = true; setHover(pickAt(e.clientX, e.clientY)); }
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (e.button) return;
    downAt = { x: e.clientX, y: e.clientY, yaw: look.yaw, pitch: look.pitch, on: pickAt(e.clientX, e.clientY) };
    canvas.setPointerCapture?.(e.pointerId);
    clearTimeout(holdT);
    holdT = setTimeout(() => { if (downAt && !dragging) hold = true; }, 280);
  });
  const up = (e, cancel) => {
    clearTimeout(holdT);
    const was = downAt, dragged = dragging, held = hold;
    downAt = null; dragging = false; hold = false;
    canvas.classList.remove('is-dragging');
    if (cancel || !was || dragged || held) return;
    const on = pickAt(e.clientX, e.clientY) || was.on;
    if (on === 'door') pushDoor();
    else if (on) choose(on);
  };
  canvas.addEventListener('pointerup', (e) => up(e));
  canvas.addEventListener('pointercancel', (e) => up(e, true));
  canvas.addEventListener('pointerleave', () => { pointer.inside = false; if (!downAt) setHover(null); });
  function setHover(h) {
    if (h === hover) return;
    hover = h;
    canvas.style.cursor = h ? 'pointer' : '';
    // (pointing at the piece you stand at lights its "See in detail": a click opens it)
    bar.classList.toggle('is-hint', !!h && h === shown);
  }
  // a piece chosen: walked to first if it is far, then opened (it flies out of the wall into the room)
  function choose(P) {
    const i = stops.findIndex((s) => s.P === P);
    const go = () => open(P.k.pc, { art: P.b, img: P.img, b: P.b });
    if (Math.abs(atStop() - i) > 0.12 && !reduced) walkTo(i, () => setTimeout(go, 80));
    else go();
  }
  pieces.forEach((P) => {
    P.b.addEventListener('focus', () => { setHover(P); const i = stops.findIndex((s) => s.P === P); if (Math.abs(atStop() - i) > 0.1) walkTo(i); });
    P.b.addEventListener('blur', () => setHover(null));
    P.b.addEventListener('click', () => choose(P));
  });
  // ---- the ways to react, under the piece you are at
  let shown = null, barW = 320;
  function showBar(P) {
    if (P === shown) return;
    shown = P;
    bar.classList.toggle('is-on', !!P);
    bar.setAttribute('aria-hidden', String(!P));
    bar.querySelectorAll('button, a').forEach((x) => { x.tabIndex = P ? 0 : -1; });
    if (!P) return;
    const on = !!react?.has(P.k.pc);
    upBtn.setAttribute('aria-pressed', String(on));
    upBtn.setAttribute('aria-label', on ? 'Thumbs up given' : `Thumbs up for ${P.k.maker}`);
    hireA.textContent = react?.hireName ? `Hire ${react.hireName(P.k.pc)}` : 'Hire';
    barW = bar.offsetWidth || barW;
  }
  upBtn.addEventListener('click', () => {
    if (!shown) return;
    const on = react ? react.toggle(shown.k.pc) : upBtn.getAttribute('aria-pressed') !== 'true';
    upBtn.setAttribute('aria-pressed', String(on));
    upBtn.setAttribute('aria-label', on ? 'Thumbs up given' : `Thumbs up for ${shown.k.maker}`);
    // (and your own hand gives it)
    if (on) { thumbT = performance.now() / 1000; dirty = 3; }
  });
  moreBtn.addEventListener('click', () => { if (shown) choose(shown); });
  // W and S walk on and back while the room holds the screen
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey || root.classList.contains('cc-open') || /input|textarea|select/i.test(e.target?.tagName || '')) return;
    const k = e.key.toLowerCase();
    if (k !== 'w' && k !== 's') return;
    const r = host.getBoundingClientRect();
    if (r.top > 1 || r.bottom < innerHeight - 1) return;
    const s = atStop();
    if (k === 'w') { if (s > N() - 0.05) pushDoor(); else walkTo(Math.floor(s + 0.05) + 1); }
    else walkTo(Math.ceil(s - 0.05) - 1);
  };
  addEventListener('keydown', onKey);

  // ---- each frame
  const corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]], tmp = new THREE.Vector3();
  let alive = true, paused = false, cued = false, lastFade = -1, frames = 0, cost = 0, still = 0, skip = 0, lastTarget = 0;
  const gov = { n: 0, sum: 0, wait: 2 };
  function frame(time, dms) {
    if (!alive || paused) return;
    const r = host.getBoundingClientRect();
    if ((r.bottom < 0 || r.top > innerHeight) && force == null) return;
    if (root.classList.contains('cc-open')) return;
    const t0 = performance.now();
    const dt = Math.min(0.05, (dms || 16) / 1000), t = t0 / 1000;
    const target = force ?? progress();
    const forward = target > lastTarget + 1e-5;
    lastTarget = target;
    pv += (target - pv) * (reduced ? 1 : ease(4.2, dt));
    if (Math.abs(target - pv) < 1e-5) pv = target;
    if (!cued && pv > 0.012) { cued = true; cue.classList.add('is-done'); }
    const Q = poseAt(pv);
    // the step: how fast you are walking sets how much the head rises and falls
    const moved = Math.hypot(Q.x - last.x, Q.z - last.z);
    last.x = Q.x; last.z = Q.z;
    walked += moved;
    spd += (Math.min(1, moved / dt / 1.3) - spd) * ease(5, dt);
    if (moved / dt > 0.15) { const kk = ease(1.6, dt); look.yaw -= look.yaw * kk; look.pitch -= look.pitch * kk; }
    pointer.x += (pointer.tx - pointer.x) * ease(3, dt);
    pointer.y += (pointer.ty - pointer.y) * ease(3, dt);
    lean += ((hold ? 1 : 0) - lean) * ease(hold ? 2.4 : 4, dt);
    const ph = walked / 0.7 * Math.PI, bob = reduced ? 0 : spd;
    const yaw = Q.yaw + look.yaw - pointer.x * 0.1, pitch = Q.pitch - look.pitch - pointer.y * 0.05;
    // (the hands lag a little behind a turn of the head, and catch up)
    const yv = (yaw - last.yaw) / dt, pvv = (pitch - last.pitch) / dt;
    last.yaw = yaw; last.pitch = pitch;
    inert.x += (clamp(yv, -3, 3) * 0.016 - inert.x) * ease(6, dt);
    inert.y += (clamp(pvv, -3, 3) * 0.012 - inert.y) * ease(6, dt);
    const rx = Math.cos(Q.yaw), rz = -Math.sin(Q.yaw);
    camera.position.set(Q.x + rx * Math.sin(ph) * 0.012 * bob, EYE + Math.cos(2 * ph) * 0.016 * bob, Q.z + rz * Math.sin(ph) * 0.012 * bob);
    if (lean > 0.001) {
      const st = stops[Math.round(Q.s)], reach = st?.D ? Math.min(1.1, st.D * 0.42) : 0.8;
      camera.position.x += -Math.sin(yaw) * Math.cos(pitch) * reach * lean;
      camera.position.z += -Math.cos(yaw) * Math.cos(pitch) * reach * lean;
      camera.position.y += Math.sin(pitch) * reach * lean;
    }
    camera.rotation.set(pitch, yaw, Math.sin(ph) * 0.004 * bob);
    camera.updateMatrixWorld();
    // the door opens under the hand, the first light beyond it coming up; once it is open, into the gallery
    door.rotation.y = 1.45 * doorState.ajar;
    floorMat.uniforms.uGlow.value = doorState.ajar * 3;
    RL?.doorAngle(door.rotation.y);
    // (the eyes adjusting from the dark lobby to the lit hall)
    const adapting = RL ? RL.adapt(camera.position.z, dt, reduced) : false;
    if (RL) renderer.toneMappingExposure = RL.expo.value;
    // (the scroll at the door: once the hand is on the plate, in)
    if (Q.q >= 0.3 && forward && force == null && !entered) intoGallery(true);
    if (pv < WALK + 0.2 * (1 - WALK)) entered = false;
    const atDoor = Math.abs(Q.s - N()) < 0.22 && Q.q < 0.3 && !entering && drive.q === 0;
    if (atDoor !== doorBtn.classList.contains('is-on')) { doorBtn.classList.toggle('is-on', atDoor); doorBtn.tabIndex = atDoor ? 0 : -1; }
    // the lamps: the piece you are at, or pointing at, a little brighter
    pieces.forEach((P, i) => {
      const nr = 1 - smooth(0.15, 0.6, Math.abs(Q.s - (i + 1)));
      const h2 = P.heat + (((hover === P ? 1 : 0) * 0.5 + nr * 0.5) - P.heat) * ease(4, dt);
      if (Math.abs(h2 - P.heat) > 1e-4) { P.heat = h2; if (RL) RL.heat(P.ix, P.heat); else U.pool.value[P.pi].w = P.base * (0.82 + 0.4 * P.heat); }
    });
    if (pointer.inside && !downAt && frames % 6 === 0 && moved > 0.0005) setHover(pickAt(pointer.cx, pointer.cy));
    visitors.forEach((V) => { V.m.position.x = V.x + Math.sin(t * 0.5 + V.ph) * 0.012; V.m.rotation.y = Math.atan2(camera.position.x - V.m.position.x, camera.position.z - V.z); });
    const handsMoving = poseHands(dt, t, Q, Q.s);
    // the way out: the room goes to black as you go through (when the scroll, not the fade, takes you)
    const fo = 0;
    // when nothing moves, draw half as often (the hands still breathe)
    const moving = moved > 1e-5 || adapting || Math.abs(yv) > 1e-3 || Math.abs(pvv) > 1e-3 || handsMoving || lean > 0.001 && lean < 0.999 || dirty > 0;
    still = moving ? 0 : still + dt;
    if (dirty > 0) dirty--;
    if (still > 0.5 && (skip = (skip + 1) % 2)) { frames++; return; }
    // the governor: if this machine cannot keep up, a step less sharp (measured on the frames drawn)
    if (!reduced && force == null && gov.wait <= 0) {
      gov.sum += dms || 16; gov.n++;
      if (gov.n >= 50) {
        if (gov.sum / gov.n > 25 && dprI < DPRS.length - 1) { dprI++; renderer.setPixelRatio(DPRS[dprI]); renderer.setSize(vw, vh, false); gov.wait = 1.5; }
        gov.n = 0; gov.sum = 0;
      }
    } else gov.wait -= dt;
    renderer.setRenderTarget(null);
    renderer.clear();
    renderer.render(scene, camera);
    renderer.clearDepth();
    renderer.render(handScene, handCam);
    // the buttons over the pieces, where they now are on the screen; the ways to react under the one you are at
    const here = atPiece(Q);
    pieces.forEach((P) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, behind = false;
      P.mesh.updateMatrixWorld();
      corners.forEach(([u, v]) => {
        tmp.set(u * P.w, v * P.h, 0.03).applyMatrix4(P.mesh.matrixWorld).project(camera);
        if (tmp.z > 1) behind = true;
        const sx = (tmp.x * 0.5 + 0.5) * vw, sy = (-tmp.y * 0.5 + 0.5) * vh;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      });
      const show = !behind && x1 > 0 && x0 < vw && y1 > 0 && y0 < vh && x1 - x0 > 8 && fo < 0.5;
      if (P === here && show && !narrow) {
        const cx = clamp((x0 + x1) / 2 - barW / 2, 12, vw - barW - 12);
        bar.style.transform = `translate(${cx.toFixed(1)}px, ${Math.min(y1 + 18, vh - 150).toFixed(1)}px)`;
      }
      const key2 = show ? `${x0 | 0},${y0 | 0},${(x1 - x0) | 0},${(y1 - y0) | 0}` : 'off';
      if (key2 === P.at2) return;
      P.at2 = key2;
      if (!show) { P.b.style.visibility = 'hidden'; return; }
      Object.assign(P.b.style, { visibility: 'visible', transform: `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`, width: `${(x1 - x0).toFixed(1)}px`, height: `${(y1 - y0).toFixed(1)}px` });
    });
    showBar(here && here.at2 !== 'off' ? here : null);
    frames++;
    cost += performance.now() - t0;
  }
  document.fonts?.ready.then(() => { nameW.paint(); pieces.forEach((P) => P.lab.paint()); dirty = 3; });
  layout();
  showBar(null);
  gsap.ticker.add(frame);

  const api = {
    layout,
    home(pc) { const P = pieces.find((q) => q.k.pc === pc); return P && P.b.style.visibility === 'visible' ? { art: P.b, img: P.img, b: P.b } : null; },
    destroy() {
      alive = false;
      gsap.ticker.remove(frame);
      removeEventListener('pointermove', onMove);
      removeEventListener('keydown', onKey);
      renderer.dispose();
      stage.remove();
      host.classList.remove('is-walk');
    },
  };
  if (local) {
    // tuning by hand (localhost): p forces the walk to a point (null gives it back to the scroll); tick(n) draws n frames
    (window.__walks ||= []).push(api);
    window.__walk = Object.defineProperties(api, Object.getOwnPropertyDescriptors({
      scene, camera, renderer, handScene, handCam, hands, pieces, door, handMat, POSES, poseAt, U, PC, floorMat, hallMat, visitors, BF, pushDoor, drive, doorState, RL, LIGHT, hemi, key, rim,
      get handsReady() { return handsReady; },
      get stops() { return stops; },
      get p() { return pv; }, set p(v) { force = v; if (v != null) pv = v; },
      tick: (n = 1) => { const was = paused; paused = false; for (let i = 0; i < n; i++) { dirty = 2; frame(performance.now() / 1000, 16); } paused = was; },
      get paused() { return paused; }, set paused(v) { paused = !!v; },
      hover: (i) => setHover(i == null ? null : i === 'door' ? 'door' : pieces[i]),
      hold: (v) => { hold = !!v; },
      thumb: (u = 0) => { thumbT = performance.now() / 1000 - u * 1.5; },
      look: (yaw = 0, pitch = 0) => { look.yaw = yaw; look.pitch = pitch; },
      get dpr() { return DPRS[dprI]; }, get still() { return still; },
      get cost() { return frames ? cost / frames : 0; }, resetCost: () => { frames = 0; cost = 0; },
      into: intoGallery,
    }));
  }
  return api;
}
