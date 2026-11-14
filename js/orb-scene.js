// The light orb: the hero's drawing (js/orb.js runs it).
//
// Since 10 Nov, "the horizon": cut sharp. The client found the first light orb blurry and muddy, so
// every line is now drawn to the pixel at the screen's full resolution, and the lens's glow is kept
// for the core alone. Drawn in high dynamic range into a target, tone-mapped the way film takes
// light, with a fine grain on top.
// - The aura: seven orbits round a core too bright to look at. Each is a fine line that drifts a
//   little, with a band of finer engraved lines inside it, like the lines of a banknote's guilloche.
//   They run from the warm white of the core out to the blue of the night. Outside the last, a dial
//   of forty-eight ticks to the half turn, one for each sector.
// - The orbs: the twenty-seven disciplines as small sharp lights within their orbits, each in a
//   fine ring, and the forty-eight sectors as smaller ones round the outside.
// - The wires: light run along curves, from the core out to each discipline, and from each
//   discipline to the sectors it moves.
// The aura is one full-screen pass; the orbs and the wires are drawn over it in pixels.
import * as THREE from '../assets/vendor/three.module.min.js';

export const MAX_WIRES = 240;
export const WIRE_SEG = 24;
export const MAX_ORBS = 96;

// the seven fields, from the core out: a light's own temperatures, warm white to night blue
export const FIELD_COL = [
  [1.0, 0.86, 0.64],
  [1.0, 0.7, 0.48],
  [0.96, 0.58, 0.48],
  [0.82, 0.54, 0.62],
  [0.62, 0.54, 0.78],
  [0.46, 0.56, 0.84],
  [0.38, 0.6, 0.8],
];

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const AURA_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform vec2 uCenter;
uniform float uUnit;
uniform float uTime;
uniform float uR[7];
uniform vec3 uCol[7];
uniform float uGain[7];
uniform vec2 uPar[7];
uniform float uCore;
uniform float uCoreR;
uniform float uEnc;
uniform float uDpr;
uniform float uTicks;
uniform vec4 uShade;
uniform float uShadeK;
uniform sampler2D uNoise;
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
// only the broadest of the noise: for anything that moves a fine line, which must stay smooth
float soft(vec2 p) { return texture2D(uNoise, p).r * 0.7 + texture2D(uNoise, p * 1.9 + 0.31).r * 0.3; }
// a line of a given half width, cut clean at the pixel: s is the distance from it in target pixels
float cut(float s, float hw) { return 1.0 - smoothstep(hw - 0.65, hw + 0.65, abs(s)); }
void main() {
  vec2 px = vUv * uRes;
  vec2 q0 = (px - uCenter) / uUnit;
  float r0 = length(q0);
  float onePx = 1.0 / uUnit;
  // the room: near black, with the faintest cool haze where the light reaches
  vec3 col = vec3(0.003, 0.004, 0.008) + vec3(0.004, 0.006, 0.012) * exp(-r0 * r0 * 1.6) * uGain[6];
  // the lines are gathered apart from the room, so where the words are only they step back
  vec3 lit = vec3(0.0);
  float prev = uCoreR;
  for (int k = 0; k < 7; k++) {
    float fk = float(k);
    // each orbit sits a little off the others' centre, the way nested orbits do, and drifts
    float oa = fk * 2.3 + uTime * 0.02;
    vec2 q = q0 - uPar[k] - vec2(cos(oa), sin(oa)) * 0.009 * fk;
    float r = length(q);
    vec2 d = q / max(r, 1e-4);
    float dir = mod(fk, 2.0) * 2.0 - 1.0;
    vec2 dr = rot(uTime * (0.011 + 0.004 * fk) * dir) * d;
    // its edge drifts, a little: a line drawn by hand, never a compass circle
    float wob = soft(dr * (0.3 + 0.06 * fk) + vec2(fk * 0.37, uTime * 0.008));
    float edge = uR[k] * (1.0 + (wob - 0.5) * 0.009);
    float s = (r - edge) / onePx;
    float line = cut(s, 0.7 * uDpr);
    // inside it, a band of finer engraved lines at a fixed pitch, fading inward
    float pitch = 4.0 * uDpr;
    float g = -s / pitch;
    float groove = cut((fract(g + 0.5) - 0.5) * pitch, 0.32 * uDpr) * step(0.5, g) * exp(-max(g - 0.5, 0.0) * 0.62);
    float halo = exp(-abs(s) / (2.2 * uDpr));
    // a slow breath of brighter and dimmer along each, so no orbit is ever quite whole
    float swell = smoothstep(0.25, 0.8, soft(dr * 0.55 + vec2(uTime * 0.004, fk * 0.71)));
    float glow = (line * 1.3 + groove * 0.36 + halo * 0.05) * (0.3 + 0.95 * swell);
    lit += uCol[k] * glow * uGain[k] * (1.0 - 0.05 * fk);
    prev = edge;
  }
  // outside the last orbit, a dial: forty-eight ticks to the half turn, one for each sector
  {
    vec2 q = q0 - uPar[6];
    float r = length(q);
    float a = atan(q.y, q.x);
    float n = a / 3.14159265 * 48.0;
    float along = abs(fract(n) - 0.5) * (3.14159265 / 48.0) * r / onePx;
    float major = 1.0 - step(0.5, abs(mod(floor(n + 0.5), 4.0)));
    float len = (5.0 + 6.0 * major) * uDpr;
    float s = (r - prev) / onePx - 7.0 * uDpr;
    float tick = cut(along, 0.42 * uDpr) * step(0.0, s) * (1.0 - smoothstep(len - 0.65, len + 0.65, s));
    lit += uCol[6] * tick * 0.6 * uTicks * uGain[6];
  }
  // inside, the faintest warmth of the core filling the whole of it
  col += vec3(1.0, 0.82, 0.6) * uCore * 0.014 * exp(-r0 * r0 * 3.0);
  // the orb itself: a disc of light too bright to look at, its limb cut clean
  vec2 qc = q0 - uPar[0] * 0.4;
  float rl = length(qc);
  float rc = rl / max(uCoreR, 1e-3);
  float body = 1.0 - smoothstep(-0.65, 0.65, (rl - uCoreR) / onePx);
  float limb = cut((rl - uCoreR) / onePx, 0.8 * uDpr);
  col += vec3(1.0, 0.88, 0.7) * uCore * (body * (0.5 + 1.6 / (1.0 + rc * rc * 9.0)) + limb * 0.9 + 0.05 / (1.0 + rc * rc * 0.7));
  // and where the words are, the light steps back so they can be read
  vec2 lo = smoothstep(uShade.xy - 110.0 * uDpr, uShade.xy + 20.0 * uDpr, px);
  vec2 hi = 1.0 - smoothstep(uShade.zw - 20.0 * uDpr, uShade.zw + 110.0 * uDpr, px);
  col += lit * (1.0 - uShadeK * lo.x * lo.y * hi.x * hi.y);
  gl_FragColor = vec4(col * uEnc, 1.0);
}`;

// the disciplines and the sectors: small sharp lights, a hot point in a fine ring
const ORB_VERT = /* glsl */ `
attribute vec2 aPos;
attribute float aSize;
attribute vec3 aCol;
attribute float aI;
varying vec2 vQ;
varying vec3 vCol;
varying float vI;
varying float vSize;
void main() {
  vQ = position.xy * 2.0;
  vCol = aCol;
  vI = aI;
  vSize = aSize;
  gl_Position = projectionMatrix * viewMatrix * vec4(aPos + position.xy * aSize, 0.0, 1.0);
}`;
const ORB_FRAG = /* glsl */ `
precision highp float;
uniform float uEnc;
varying vec2 vQ;
varying vec3 vCol;
varying float vI;
varying float vSize;
void main() {
  float R = vSize * 0.5;
  float d = length(vQ) * R;
  if (d > R || vI <= 0.0) discard;
  float dotR = R * 0.26;
  float dotA = 1.0 - smoothstep(dotR - 0.65, dotR + 0.65, d);
  float ring = 1.0 - smoothstep(0.35, 1.2, abs(d - R * 0.8));
  float glow = exp(-d / max(R * 0.18, 1.0)) * 0.5;
  float l = dotA * 2.6 + ring * 0.75 + glow;
  gl_FragColor = vec4(mix(vCol, vec3(1.0), dotA * 0.55) * l * vI * uEnc, 1.0);
}`;

// the wires: ribbons of light along their curves, let out from where they start
const WIRE_VERT = /* glsl */ `
attribute float aS;
attribute float aV;
attribute vec3 aCol;
attribute float aI;
attribute float aDraw;
attribute float aPhase;
varying float vS;
varying float vV;
varying vec3 vCol;
varying float vI;
varying float vDraw;
varying float vPhase;
void main() {
  vS = aS; vV = aV; vCol = aCol; vI = aI; vDraw = aDraw; vPhase = aPhase;
  gl_Position = projectionMatrix * viewMatrix * vec4(position, 1.0);
}`;
const WIRE_FRAG = /* glsl */ `
precision highp float;
uniform float uEnc;
uniform float uTime;
varying float vS;
varying float vV;
varying vec3 vCol;
varying float vI;
varying float vDraw;
varying float vPhase;
void main() {
  if (vS > vDraw || vI <= 0.0) discard;
  float edge = 1.0 - smoothstep(0.45, 1.0, abs(vV));
  // light travels along it, outward, slowly
  float run = 0.62 + 0.38 * sin(vS * 14.0 - uTime * 1.1 + vPhase);
  float ends = smoothstep(0.0, 0.1, vS) * smoothstep(1.0, 0.9, vS) * 0.85 + 0.15;
  float tip = smoothstep(vDraw - 0.06, vDraw, vS) * step(vDraw, 0.995) * 2.0;
  gl_FragColor = vec4(vCol * vI * edge * (run * ends + tip) * uEnc, 1.0);
}`;

// a lens's glow: halve down six times, then add back up
const DOWN_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uTexel;
uniform float uFirst;
uniform float uEnc;
uniform float uThresh;
vec3 s(vec2 o) { return texture2D(uSrc, vUv + o * uTexel).rgb; }
void main() {
  vec3 c = s(vec2(0.0)) * 0.125
    + (s(vec2(-2.0, 2.0)) + s(vec2(2.0, 2.0)) + s(vec2(-2.0, -2.0)) + s(vec2(2.0, -2.0))) * 0.03125
    + (s(vec2(0.0, 2.0)) + s(vec2(-2.0, 0.0)) + s(vec2(2.0, 0.0)) + s(vec2(0.0, -2.0))) * 0.0625
    + (s(vec2(-1.0, 1.0)) + s(vec2(1.0, 1.0)) + s(vec2(-1.0, -1.0)) + s(vec2(1.0, -1.0))) * 0.125;
  if (uFirst > 0.5) {
    c /= uEnc;
    float b = max(c.r, max(c.g, c.b));
    c *= max(b - uThresh, 0.0) / max(b, 1e-4);
    c *= uEnc;
  }
  gl_FragColor = vec4(c, 1.0);
}`;
const UP_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uSrc;
uniform vec2 uTexel;
vec3 s(vec2 o) { return texture2D(uSrc, vUv + o * uTexel).rgb; }
void main() {
  vec3 c = s(vec2(0.0)) * 4.0
    + (s(vec2(-1.0, 0.0)) + s(vec2(1.0, 0.0)) + s(vec2(0.0, 1.0)) + s(vec2(0.0, -1.0))) * 2.0
    + (s(vec2(-1.0, 1.0)) + s(vec2(1.0, 1.0)) + s(vec2(-1.0, -1.0)) + s(vec2(1.0, -1.0)));
  gl_FragColor = vec4(c / 16.0, 1.0);
}`;

// film: exposure, the core's glow, tone mapping, a fine grain, and (once) the light filling the frame
// until it is the page
const COMP_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uEnc;
uniform float uExposure;
uniform float uBloomK;
uniform float uWhite;
uniform float uTime;
uniform vec3 uPaper;
uniform vec2 uRes;
uniform vec2 uCenterUv;
vec3 aces(vec3 x) { return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  // the glow, kept for the core alone now: no colour spread, nothing that softens a line
  vec3 bloom = texture2D(uBloom, vUv).rgb;
  vec3 hdr = texture2D(uScene, vUv).rgb / uEnc + bloom / uEnc * uBloomK;
  vec3 col = aces(hdr * uExposure);
  vec2 v = vUv - 0.5;
  col *= 1.0 - dot(v, v) * 0.3 * (1.0 - uWhite);
  col = pow(col, vec3(1.0 / 2.2));
  col += (hash(vUv * uRes + fract(uTime * 7.13) * 91.0) - 0.5) * 0.022 * (1.0 - uWhite);
  col = mix(col, uPaper, uWhite);
  gl_FragColor = vec4(col, 1.0);
}`;

// tileable value noise, a different size in each channel
function makeNoise(N = 256) {
  const data = new Uint8Array(N * N * 4);
  const cells = [8, 16, 32, 64];
  cells.forEach((F, c) => {
    const g = new Float32Array(F * F).map(() => Math.random());
    const at = (i, j) => g[((j + F) % F) * F + ((i + F) % F)];
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const fx = (x / N) * F, fy = (y / N) * F;
        const i = Math.floor(fx), j = Math.floor(fy);
        let tx = fx - i, ty = fy - j;
        tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        const v = (at(i, j) * (1 - tx) + at(i + 1, j) * tx) * (1 - ty) + (at(i, j + 1) * (1 - tx) + at(i + 1, j + 1) * tx) * ty;
        data[(y * N + x) * 4 + c] = Math.round(v * 255);
      }
    }
  });
  const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = t.minFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

export function createOrbScene(canvas, { scale = 1 } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(dpr);
  renderer.autoClear = false;
  // light needs room above white: half floats where the device can render to them, otherwise
  // bytes with everything stored at a quarter
  const ext = renderer.extensions;
  const hdr = ext.has('EXT_color_buffer_float') || ext.has('EXT_color_buffer_half_float');
  const ENC = hdr ? 1 : 0.25;
  const target = (w, h) => new THREE.WebGLRenderTarget(Math.max(1, w), Math.max(1, h), {
    type: hdr ? THREE.HalfFloatType : THREE.UnsignedByteType,
    minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false, generateMipmaps: false,
  });
  const noise = makeNoise();

  const quad = (frag, uniforms, extra = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: QUAD_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, ...extra }));
    m.frustumCulled = false;
    return m;
  };
  const camQ = new THREE.Camera();
  const passScene = new THREE.Scene();
  const run = (mesh, rt) => {
    passScene.children.length = 0;
    passScene.add(mesh);
    renderer.setRenderTarget(rt);
    renderer.render(passScene, camQ);
  };

  // ---------------------------------------------------------------- the aura
  const AU = {
    uRes: { value: new THREE.Vector2(1, 1) },
    uCenter: { value: new THREE.Vector2() },
    uUnit: { value: 300 },
    uTime: { value: 0 },
    uR: { value: new Array(7).fill(0.5) },
    uCol: { value: FIELD_COL.map((c) => new THREE.Vector3(...c)) },
    uGain: { value: new Array(7).fill(0) },
    uPar: { value: new Array(7).fill(0).map(() => new THREE.Vector2()) },
    uCore: { value: 0 },
    uCoreR: { value: 0.08 },
    uEnc: { value: ENC },
    uDpr: { value: 1 },
    uTicks: { value: 1 },
    uShade: { value: new THREE.Vector4(0, 0, 0, 0) },
    uShadeK: { value: 0 },
    uNoise: { value: noise },
  };
  const aura = quad(AURA_FRAG, AU);

  // ---------------------------------------------------------------- the orbs and the wires, in pixels
  const world = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);

  const orbGeo = new THREE.InstancedBufferGeometry();
  orbGeo.copy(new THREE.PlaneGeometry(1, 1));
  orbGeo.instanceCount = 0;
  const orbPos = new Float32Array(MAX_ORBS * 2), orbSize = new Float32Array(MAX_ORBS), orbCol = new Float32Array(MAX_ORBS * 3), orbI = new Float32Array(MAX_ORBS);
  const ia = (arr, n) => new THREE.InstancedBufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
  orbGeo.setAttribute('aPos', ia(orbPos, 2));
  orbGeo.setAttribute('aSize', ia(orbSize, 1));
  orbGeo.setAttribute('aCol', ia(orbCol, 3));
  orbGeo.setAttribute('aI', ia(orbI, 1));
  const OU = { uEnc: { value: ENC } };
  const orbs = new THREE.Mesh(orbGeo, new THREE.ShaderMaterial({ vertexShader: ORB_VERT, fragmentShader: ORB_FRAG, uniforms: OU, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  orbs.frustumCulled = false;
  orbs.renderOrder = 2;

  const NV = MAX_WIRES * (WIRE_SEG + 1) * 2;
  const wPos = new Float32Array(NV * 3), wS = new Float32Array(NV), wV = new Float32Array(NV), wCol = new Float32Array(NV * 3), wI = new Float32Array(NV), wDraw = new Float32Array(NV), wPhase = new Float32Array(NV);
  const wIdx = [];
  for (let k = 0; k < MAX_WIRES; k++) {
    for (let s = 0; s <= WIRE_SEG; s++) {
      const v = (k * (WIRE_SEG + 1) + s) * 2;
      wS[v] = wS[v + 1] = s / WIRE_SEG;
      wV[v] = -1; wV[v + 1] = 1;
      wPhase[v] = wPhase[v + 1] = (k * 2.399) % 6.283;
      if (s < WIRE_SEG) wIdx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
  }
  const wireGeo = new THREE.BufferGeometry();
  const da = (arr, n) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
  wireGeo.setAttribute('position', da(wPos, 3));
  wireGeo.setAttribute('aS', new THREE.BufferAttribute(wS, 1));
  wireGeo.setAttribute('aV', new THREE.BufferAttribute(wV, 1));
  wireGeo.setAttribute('aPhase', new THREE.BufferAttribute(wPhase, 1));
  wireGeo.setAttribute('aCol', da(wCol, 3));
  wireGeo.setAttribute('aI', da(wI, 1));
  wireGeo.setAttribute('aDraw', da(wDraw, 1));
  wireGeo.setIndex(wIdx);
  wireGeo.setDrawRange(0, 0);
  const WU = { uEnc: { value: ENC }, uTime: AU.uTime };
  const wires = new THREE.Mesh(wireGeo, new THREE.ShaderMaterial({ vertexShader: WIRE_VERT, fragmentShader: WIRE_FRAG, uniforms: WU, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, transparent: true }));
  wires.frustumCulled = false;
  wires.renderOrder = 1;
  world.add(wires, orbs);

  // ---------------------------------------------------------------- glow and film
  // (four sizes now, not six: the glow stays close round the core and never greys the room)
  const LEVELS = 4;
  let sceneRT = null, levels = [];
  const DU = { uSrc: { value: null }, uTexel: { value: new THREE.Vector2() }, uFirst: { value: 0 }, uEnc: { value: ENC }, uThresh: { value: 1.1 } };
  const down = quad(DOWN_FRAG, DU);
  const UU = { uSrc: { value: null }, uTexel: { value: new THREE.Vector2() } };
  const up = quad(UP_FRAG, UU, { blending: THREE.AdditiveBlending, transparent: true });
  const CU = {
    uScene: { value: null }, uBloom: { value: null }, uEnc: { value: ENC },
    uExposure: { value: 1 }, uBloomK: { value: 0.9 }, uWhite: { value: 0 }, uTime: AU.uTime,
    uPaper: { value: new THREE.Vector3(0.965, 0.969, 0.957) },
    uRes: { value: new THREE.Vector2(1, 1) }, uCenterUv: { value: new THREE.Vector2(0.5, 0.5) },
  };
  const comp = quad(COMP_FRAG, CU);

  // the size the light is drawn at, in pixels of the target, against the page's CSS pixels
  const size = { W: 1, H: 1, k: 1 };
  function setSize(W, H, s = scale) {
    renderer.setSize(W, H, false);
    size.W = W; size.H = H;
    size.k = dpr * s; // full resolution: the lines are cut to the pixel
    const w = Math.round(W * size.k), h = Math.round(H * size.k);
    sceneRT?.dispose();
    levels.forEach((l) => l.dispose());
    sceneRT = target(w, h);
    levels = [];
    for (let i = 1; i <= LEVELS; i++) levels.push(target(w >> i, h >> i));
    AU.uRes.value.set(w, h);
    AU.uDpr.value = size.k;
    CU.uRes.value.set(W * dpr, H * dpr);
    cam.left = 0; cam.right = w; cam.top = h; cam.bottom = 0;
    cam.updateProjectionMatrix();
  }

  // the orbs: CSS pixels in (x down), the target's pixels out (y up)
  let nOrbs = 0;
  function orb(x, y, r, col, i) {
    if (nOrbs >= MAX_ORBS) return;
    const k = size.k;
    orbPos[nOrbs * 2] = x * k;
    orbPos[nOrbs * 2 + 1] = (size.H - y) * k;
    orbSize[nOrbs] = r * 2 * k;
    orbCol.set(col, nOrbs * 3);
    orbI[nOrbs] = i;
    nOrbs++;
  }
  // a wire along a cubic, CSS pixels in; width in CSS pixels
  let nWires = 0;
  function wire(p0, p1, p2, p3, col, i, draw, width = 1.2) {
    if (nWires >= MAX_WIRES) return;
    const k = size.k, H = size.H;
    const base = nWires * (WIRE_SEG + 1) * 2;
    for (let s = 0; s <= WIRE_SEG; s++) {
      const u = s / WIRE_SEG, iu = 1 - u;
      const a = iu * iu * iu, b = 3 * iu * iu * u, c = 3 * iu * u * u, d = u * u * u;
      const x = a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0];
      const y = a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1];
      const dx = 3 * iu * iu * (p1[0] - p0[0]) + 6 * iu * u * (p2[0] - p1[0]) + 3 * u * u * (p3[0] - p2[0]);
      const dy = 3 * iu * iu * (p1[1] - p0[1]) + 6 * iu * u * (p2[1] - p1[1]) + 3 * u * u * (p3[1] - p2[1]);
      const len = Math.hypot(dx, dy) || 1;
      const nx = (-dy / len) * width, ny = (dx / len) * width;
      for (let j = 0; j < 2; j++) {
        const v = base + s * 2 + j, sg = j ? 1 : -1;
        wPos[v * 3] = (x + nx * sg) * k;
        wPos[v * 3 + 1] = (H - (y + ny * sg)) * k;
        wPos[v * 3 + 2] = 0;
        wCol.set(col, v * 3);
        wI[v] = i;
        wDraw[v] = draw;
      }
    }
    nWires++;
  }

  function begin() { nOrbs = 0; nWires = 0; }

  function render({ exposure = 1, white = 0, bloom = 0.9, centerUv }) {
    const k = size.k;
    // the scene, in light
    renderer.setRenderTarget(sceneRT);
    renderer.setClearColor(0x000000, 1);
    renderer.clear();
    passScene.children.length = 0;
    passScene.add(aura);
    renderer.render(passScene, camQ);
    orbGeo.instanceCount = nOrbs;
    ['aPos', 'aSize', 'aCol', 'aI'].forEach((n) => { orbGeo.attributes[n].needsUpdate = true; });
    wireGeo.setDrawRange(0, nWires * WIRE_SEG * 6);
    ['position', 'aCol', 'aI', 'aDraw'].forEach((n) => { wireGeo.attributes[n].needsUpdate = true; });
    renderer.render(world, cam);

    // the glow: down, then back up, each level added to the one above
    let src = sceneRT;
    levels.forEach((dst, i) => {
      DU.uSrc.value = src.texture;
      DU.uTexel.value.set(1 / src.width, 1 / src.height);
      DU.uFirst.value = i === 0 ? 1 : 0;
      run(down, dst);
      src = dst;
    });
    for (let i = LEVELS - 1; i > 0; i--) {
      UU.uSrc.value = levels[i].texture;
      UU.uTexel.value.set(1 / levels[i].width, 1 / levels[i].height);
      run(up, levels[i - 1]);
    }

    // film
    CU.uScene.value = sceneRT.texture;
    CU.uBloom.value = levels[0].texture;
    CU.uExposure.value = exposure;
    CU.uWhite.value = white;
    CU.uBloomK.value = bloom;
    if (centerUv) CU.uCenterUv.value.set(centerUv[0], centerUv[1]);
    run(comp, null);
    void k;
  }

  return { renderer, AU, CU, setSize, begin, orb, wire, render, size, hdr, dispose() { renderer.dispose(); } };
}
