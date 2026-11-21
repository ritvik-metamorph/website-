// Hero 8's grain, drawn on the graphics card (18 Nov): every grain of the seven orbits and of the hundred and
// fifty-one streams in one draw, its place worked out in the vertex shader from where it is on its orbit and the
// moment, the same picture js/hero-orbits.js first drew grain by grain on a 2D canvas (about 11 ms a frame; this is a
// small part of that). The orbits' places (centre, half-width, tip, the layers' gap) come in each frame from the
// hero, so the picture and the 2D marks drawn over it (the crown, the disciplines, the names) always agree.
import * as THREE from '../assets/vendor/three.module.min.js';

const VERT = /* glsl */`
// (packed four to an input; a graphics card takes sixteen inputs a point at most)
attribute vec4 aP0;      // its kind (0 a grain of an orbit, 1 of a stream), its orbit, the orbit's radius, its width
attribute vec4 aP1;      // the orbit's turn (radians a second), its angle (a stream: its discipline's), across the band, its height
attribute vec4 aP2;      // its size, its own small difference in speed, a stream's sector angle, where in its run it starts
attribute vec4 aP3;      // a stream: how long a run takes, how far behind the head (its trail), how bright, its discipline
attribute float aSec;    // a stream: its sector
  uniform float uTime, uRot, uTilt, uHalf, uGap, uBorn, uFlows, uFade, uDpr, uAny, uFocusK, uFocusD, uFocusS, uCrown, uCrownSpin;
  uniform vec2 uC, uView;
  uniform float uLit[7];
  uniform float uShow[7]; // (19 Nov: each orbit drawn in on its own, one after another, as a pen goes round it)
  varying float vA;
  varying float vGold;
  const float PI = 3.14159265, TAU = 6.2831853;
  float ringY(float k) { return uC.y - (k - 3.0) * uGap; }
  void main() {
    float aKind = aP0.x, aRing = aP0.y, aRad = aP0.z, aBand = aP0.w, aSpeed = aP1.x, aA = aP1.y, aR = aP1.z, aH = aP1.w;
    float aS = aP2.x, aJit = aP2.y, aA1 = aP2.z, aT0 = aP2.w, aDur = aP3.x, aBack = aP3.y, aTrail = aP3.z, aDisc = aP3.w;
    int ki = int(aRing + 0.5);
    vec2 p; float alpha; float size; vGold = 0.0;
    if (aKind < 0.5) {
      float a = aA + aSpeed * uTime * aJit + uRot;
      float rr = (aRad + aR * aBand * 0.5) * uHalf;
      float depth = sin(a);
      p = vec2(uC.x + cos(a) * rr, ringY(aRing) + depth * rr * uTilt - aH * aBand * uHalf * 0.2);
      float light = (1.0 - uAny * 0.66 * (1.0 - uLit[ki])) * uFade * (0.2 + 0.8 * smoothstep(aRing / 9.0, aRing / 9.0 + 0.35, uBorn));
      float drawn = smoothstep(0.0, 0.06, uShow[ki] * 1.07 - fract(aA / TAU));
      alpha = clamp((0.3 + 0.52 * (depth * 0.5 + 0.5)) * light, 0.0, 1.0) * drawn;
      size = aS * (0.8 + 0.35 * (depth * 0.5 + 0.5));
    } else {
      float t = fract(aT0 + uTime / aDur) - aBack;
      float e = clamp(t, 0.0, 1.0); e = e * e * (3.0 - 2.0 * e);
      float a0 = aA + aSpeed * uTime + uRot, a1 = aA1 + uCrownSpin;
      float da = mod(a1 - a0 + PI * 3.0, TAU) - PI;
      float a = a0 + da * e + 0.5 * sin(PI * e);
      float rr = mix(aRad, uCrown, e) * uHalf;
      float y0 = ringY(aRing), y1 = uC.y - 4.1 * uGap;
      p = vec2(uC.x + cos(a) * rr, mix(y0, y1, e) + sin(a) * rr * uTilt);
      float on = (abs(aDisc - uFocusD) < 0.5 || abs(aSec - uFocusS) < 0.5 || abs(aRing - uFocusK) < 0.5) ? 1.0 : 0.0;
      float any = max(uAny, uFocusD >= 0.0 ? 1.0 : 0.0);
      alpha = t > 0.0 ? uShow[ki] * sin(PI * clamp(t, 0.0, 1.0)) * uFlows * uFade * uBorn * mix(0.75, mix(0.22, 1.0, on), any) * aTrail : 0.0;
      size = aS * (on > 0.5 ? 1.5 : 1.3) * mix(1.0, 0.85, step(0.001, aBack));
      vGold = on;
    }
    vA = alpha;
    gl_PointSize = max(1.0, size * uDpr);
    gl_Position = vec4(p.x / uView.x * 2.0 - 1.0, 1.0 - p.y / uView.y * 2.0, 0.0, 1.0);
  }
`;
const FRAG = /* glsl */`
  uniform vec3 uBase, uGoldC;
  varying float vA;
  varying float vGold;
  void main() {
    if (vA < 0.004) discard;
    gl_FragColor = vec4(mix(uBase, uGoldC, vGold), vA);
  }
`;

// grains: [{ ring, rad, band, speed, a, r, h, s, jit }]; streams: [{ ring, rad, speed, a, a1, t0, dur, back, trail, disc, sec, s }]
export function createGrainLayer(canvas, { grains, streams, base, gold }) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  const n = grains.length + streams.length;
const P0 = new Float32Array(n * 4), P1 = new Float32Array(n * 4), P2 = new Float32Array(n * 4), P3 = new Float32Array(n * 4), SEC = new Float32Array(n);
const put = (i, p0, p1, p2, p3, sec) => { P0.set(p0, i * 4); P1.set(p1, i * 4); P2.set(p2, i * 4); P3.set(p3, i * 4); SEC[i] = sec; };
grains.forEach((q, i) => put(i, [0, q.ring, q.rad, q.band], [q.speed, q.a, q.r, q.h], [q.s, q.jit, 0, 0], [1, 0, 0, -9], -9));
streams.forEach((q, j) => put(grains.length + j, [1, q.ring, q.rad, 0], [q.speed, q.a, 0, 0], [q.s, 1, q.a1, q.t0], [q.dur, q.back, q.trail, q.disc], q.sec));
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
geo.setAttribute('aP0', new THREE.BufferAttribute(P0, 4));
geo.setAttribute('aP1', new THREE.BufferAttribute(P1, 4));
geo.setAttribute('aP2', new THREE.BufferAttribute(P2, 4));
geo.setAttribute('aP3', new THREE.BufferAttribute(P3, 4));
geo.setAttribute('aSec', new THREE.BufferAttribute(SEC, 1));
  const U = {
    uTime: { value: 0 }, uRot: { value: 0 }, uTilt: { value: 0.4 }, uHalf: { value: 1 }, uGap: { value: 0 }, uBorn: { value: 0 }, uFlows: { value: 0 }, uFade: { value: 1 },
    uDpr: { value: 1 }, uAny: { value: 0 }, uFocusK: { value: -9 }, uFocusD: { value: -9 }, uFocusS: { value: -9 }, uCrown: { value: 1 }, uCrownSpin: { value: 0 },
    uC: { value: new THREE.Vector2() }, uView: { value: new THREE.Vector2(1, 1) }, uLit: { value: new Array(7).fill(0) }, uShow: { value: new Array(7).fill(1) },
    // (written to the screen as they are: the same colours the 2D marks over them use)
    uBase: { value: new THREE.Vector3(base[0] / 255, base[1] / 255, base[2] / 255) },
    uGoldC: { value: new THREE.Vector3(gold[0] / 255, gold[1] / 255, gold[2] / 255) },
  };
  const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: U, transparent: true, depthTest: false, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  pts.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(pts);
  const cam = new THREE.Camera();
  const clear = new THREE.Color();
  return {
    U, renderer, pts,
    size(w, h, dpr) { renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); U.uView.value.set(w, h); U.uDpr.value = dpr; },
    render(rgb) { clear.setRGB(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255, THREE.SRGBColorSpace); renderer.setClearColor(clear, 1); renderer.render(scene, cam); },
  };
}
