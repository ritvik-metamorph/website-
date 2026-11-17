// The hero's room: a dark desk under one lamp, and the note.
// The note is a single sheet that folds in the vertex shader: twelve accordion pleats along its
// length, then fanned from a pinched middle into two wings, then the wings lift. Every face is
// shaded from its own screen-space normal, so the pleats read as flat planes of paper, and light
// that comes from behind passes through the sheet: that is how the watermark appears.
import * as THREE from '../assets/vendor/three.module.min.js';

export const NOTE = { L: 2.4, H: 1.02, N: 12 };
export const LAMP = new THREE.Vector3(-1.35, 4.3, 0.55);
const LAMP_AIM = new THREE.Vector3(0.15, 0, 0.1);

const FOLD = /* glsl */ `
uniform float uFold[12];
uniform float uFan;
uniform float uWing;
uniform float uAlpha;
vec3 foldNote(vec3 p0) {
  const float L = ${NOTE.L.toFixed(3)};
  const float H = ${NOTE.H.toFixed(3)};
  const float h = H / 12.0;
  float x = p0.x, y = p0.y;
  // the pleats stay tight at the pinched middle and open towards the wing tips
  float ax = clamp(abs(x) / (L * 0.5), 0.0, 1.0);
  float fan = 1.0 - uFan * 0.44 * pow(ax, 0.85);
  float t = clamp((y + H * 0.5) / h, 0.0, 11.9999);
  float k = floor(t), f = t - k;
  vec2 acc = vec2(0.0), tot = vec2(0.0);
  float mean = 0.0;
  for (int j = 0; j < 12; j++) {
    float fj = float(j);
    float sgn = mod(fj, 2.0) < 0.5 ? 1.0 : -1.0;
    float a = sgn * uFold[j] * uAlpha * fan;
    vec2 d = vec2(cos(a), sin(a)) * h;
    if (fj < k) acc += d;
    else if (fj < k + 0.5) acc += d * f;
    tot += d;
    mean += uFold[j];
  }
  float Y = acc.x - tot.x * 0.5;
  float Zp = acc.y - 0.5 * h * sin(uAlpha * fan * mean / 12.0);
  // the two halves lift about the pinched middle; a soft sign keeps the middle whole
  float sx = clamp(x / 0.05, -1.0, 1.0);
  float X = abs(x) * cos(uWing) * sign(x) - sx * Zp * sin(uWing);
  float Z = abs(x) * sin(uWing) + Zp * cos(uWing);
  return vec3(X, Y, Z);
}
`;

const NOTE_VERT = /* glsl */ `
${FOLD}
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(foldNote(position), 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const LIGHT = /* glsl */ `
uniform vec3 uLampPos;
uniform vec3 uLampDir;
uniform vec3 uLampCol;
uniform float uLampI;
uniform float uAmbient;
float lampAt(vec3 p, out vec3 Ld) {
  Ld = uLampPos - p;
  float dist = length(Ld);
  Ld /= dist;
  float spot = smoothstep(0.76, 0.975, dot(-Ld, uLampDir));
  return uLampI * spot / (1.0 + 0.035 * dist * dist);
}
`;

const NOTE_FRAG = /* glsl */ `
${LIGHT}
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform sampler2D uMark;
uniform float uFade;
varying vec2 vUv;
varying vec3 vWorld;
void main() {
  vec3 N = normalize(cross(dFdx(vWorld), dFdy(vWorld)));
  vec3 V = normalize(cameraPosition - vWorld);
  if (dot(N, V) < 0.0) N = -N;
  vec2 back = vec2(1.0 - vUv.x, vUv.y); // the back's art, seen from behind
  vec3 front = texture2D(uFront, vUv).rgb;
  vec3 rear = texture2D(uBack, back).rgb;
  vec3 alb = gl_FrontFacing ? front : rear;
  vec4 mk = texture2D(uMark, vUv);
  vec3 Ld;
  float att = lampAt(vWorld, Ld);
  float diff = max(dot(N, Ld), 0.0) * att;
  float trans = max(dot(-N, Ld), 0.0) * att;
  vec3 col = alb * (uAmbient + diff * uLampCol * 1.15);
  // held against the light: it comes through the paper, dimmed by the ink on both sides,
  // brighter where the watermark thins the paper, darker along the thread
  float inkF = 1.0 - dot(front, vec3(0.3333)) / 0.9;
  float inkB = 1.0 - dot(rear, vec3(0.3333)) / 0.9;
  float through = (1.0 + (mk.r - 0.5) * 1.8) * (1.0 - clamp(inkF, 0.0, 1.0) * 0.55) * (1.0 - clamp(inkB, 0.0, 1.0) * 0.55) * (1.0 - mk.g * 0.82);
  col += vec3(0.93, 0.88, 0.76) * through * trans * uLampCol * 0.82;
  // the bulb itself, a blur behind the sheet (tight, so the print around it stays readable)
  col += uLampCol * pow(max(dot(-V, Ld), 0.0), 140.0) * trans * 1.1;
  gl_FragColor = vec4(col * uFade, 1.0);
}
`;

const SHADOW_VERT = /* glsl */ `
${FOLD}
uniform vec3 uLampPos;
void main() {
  vec3 w = (modelMatrix * vec4(foldNote(position), 1.0)).xyz;
  // project the sheet onto the desk from the bulb
  float k = uLampPos.y / max(uLampPos.y - w.y, 0.05);
  vec3 s = uLampPos + (w - uLampPos) * k;
  s.y = 0.0;
  gl_Position = projectionMatrix * viewMatrix * vec4(s, 1.0);
}
`;

const DESK_VERT = /* glsl */ `
varying vec3 vWorld;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const DESK_FRAG = /* glsl */ `
${LIGHT}
uniform sampler2D uBaize;
uniform sampler2D uShadow;
uniform float uShadowSoft;
uniform float uShadowAmt;
varying vec3 vWorld;
void main() {
  vec3 alb = texture2D(uBaize, vWorld.xz * 0.55).rgb;
  vec3 Ld;
  float att = lampAt(vWorld, Ld);
  float diff = max(Ld.y, 0.0) * att;
  vec2 suv = vec2(vWorld.x, -vWorld.z) / 6.0 + 0.5;
  float sh = 0.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) sh += texture2D(uShadow, suv + vec2(float(i), float(j)) * uShadowSoft).r;
  sh /= 9.0;
  vec3 col = alb * (uAmbient * 0.7 + diff * uLampCol * 2.6 * (1.0 - sh * uShadowAmt));
  // the room falls away into the dark
  col *= 1.0 - smoothstep(3.5, 8.5, length(vWorld.xz - vec2(0.2, -0.6)));
  gl_FragColor = vec4(col, 1.0);
}
`;

// the lamp's light, seen as a faint cone in the air
const SHAFT_FRAG = /* glsl */ `
uniform float uShaft;
uniform vec3 uLampCol;
varying vec3 vN;
varying vec3 vView;
varying float vH;
void main() {
  float face = abs(dot(normalize(vN), normalize(vView)));
  float a = uShaft * face * face * pow(1.0 - vH, 1.4);
  gl_FragColor = vec4(uLampCol * a, 0.0);
}
`;
const SHAFT_VERT = /* glsl */ `
uniform float uLen;
varying vec3 vN;
varying vec3 vView;
varying float vH;
void main() {
  vH = clamp(-position.y / uLen + 0.5, 0.0, 1.0);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vView = cameraPosition - w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;

const BULB_FRAG = /* glsl */ `
uniform float uLampI;
uniform vec3 uLampCol;
varying vec2 vUv;
void main() {
  float d = length(vUv - 0.5) * 2.0;
  float g = exp(-d * d * 7.0) + 0.35 * exp(-d * d * 1.6);
  gl_FragColor = vec4(uLampCol * g * uLampI * 1.2, 0.0);
}
`;

const rgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
};

export function createNoteScene(canvas, { front, back, mark, baize, quality = 1 }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  const dpr = Math.min(window.devicePixelRatio || 1, quality < 1 ? 1.75 : 2);
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x050706, 1);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const tex = (c, repeat) => {
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  };

  const shadowRT = new THREE.WebGLRenderTarget(512, 512);
  const shadowCam = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 20);
  shadowCam.position.set(0, 10, 0);
  shadowCam.up.set(0, 0, -1);
  shadowCam.lookAt(0, 0, 0);
  shadowCam.layers.set(1);

  const lampDir = LAMP_AIM.clone().sub(LAMP).normalize();
  const U = {
    uLampPos: { value: LAMP.clone() },
    uLampDir: { value: lampDir },
    uLampCol: { value: rgb('#ffd9a6') },
    uLampI: { value: 0 },
    uAmbient: { value: 0.035 },
    uFade: { value: 1 },
    uFold: { value: new Array(12).fill(0) },
    uFan: { value: 0 },
    uWing: { value: 0 },
    uAlpha: { value: THREE.MathUtils.degToRad(84) },
    uFront: { value: tex(front) },
    uBack: { value: tex(back) },
    uMark: { value: tex(mark) },
    uBaize: { value: tex(baize, true) },
    uShadow: { value: shadowRT.texture },
    uShadowSoft: { value: 0.006 },
    uShadowAmt: { value: 0.78 },
    uShaft: { value: 0 },
    uLen: { value: 5.2 },
  };

  // the desk
  const desk = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), new THREE.ShaderMaterial({ uniforms: U, vertexShader: DESK_VERT, fragmentShader: DESK_FRAG }));
  desk.rotation.x = -Math.PI / 2;
  scene.add(desk);

  // the note, and its shadow (drawn only into the shadow map)
  const group = new THREE.Group();
  scene.add(group);
  const sheet = new THREE.PlaneGeometry(NOTE.L, NOTE.H, Math.round(150 * quality), 72);
  const note = new THREE.Mesh(sheet, new THREE.ShaderMaterial({ uniforms: U, vertexShader: NOTE_VERT, fragmentShader: NOTE_FRAG, side: THREE.DoubleSide }));
  note.frustumCulled = false;
  group.add(note);
  const shadow = new THREE.Mesh(sheet, new THREE.ShaderMaterial({ uniforms: U, vertexShader: SHADOW_VERT, fragmentShader: 'void main() { gl_FragColor = vec4(1.0); }', side: THREE.DoubleSide }));
  shadow.frustumCulled = false;
  shadow.layers.set(1);
  group.add(shadow);

  // the lamp: a dark shade, the bulb's glow, and the cone of light in the air
  const aim = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), lampDir);
  const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.46, 0.46, 48, 1, true), new THREE.ShaderMaterial({
    uniforms: U,
    side: THREE.DoubleSide,
    vertexShader: 'varying vec3 vN; varying vec3 vW; void main() { vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: 'uniform vec3 uLampCol; uniform float uLampI; varying vec3 vN; varying vec3 vW; void main() { vec3 V = normalize(cameraPosition - vW); float rim = pow(1.0 - abs(dot(normalize(vN), V)), 3.0); vec3 c = vec3(0.025, 0.03, 0.028) + uLampCol * rim * 0.12 * uLampI; gl_FragColor = vec4(c, 1.0); }',
  }));
  shade.position.copy(LAMP).addScaledVector(lampDir, -0.1);
  shade.quaternion.copy(aim);
  scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.ShaderMaterial({
    uniforms: U, vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: BULB_FRAG,
    transparent: true, depthWrite: false, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, // pure light added; AdditiveBlending would scale it by alpha 0
  }));
  bulb.position.copy(LAMP).addScaledVector(lampDir, 0.12);
  scene.add(bulb);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 1.55, U.uLen.value, 48, 1, true), new THREE.ShaderMaterial({
    uniforms: U, vertexShader: SHAFT_VERT, fragmentShader: SHAFT_FRAG,
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, // pure light added; AdditiveBlending would scale it by alpha 0
  }));
  shaft.position.copy(LAMP).addScaledVector(lampDir, U.uLen.value / 2);
  shaft.quaternion.copy(aim);
  scene.add(shaft);

  const cam = { pos: new THREE.Vector3(0, 2.85, 4.4), target: new THREE.Vector3(0, 0.55, 0) };
  const view = { W: 1, H: 1, ox: 0, oy: 0 };
  const v3 = new THREE.Vector3();

  return {
    U, group, camera, cam, dpr,
    layout(W, H, ox, oy) {
      Object.assign(view, { W, H, ox, oy });
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      // shift the whole picture so the note sits beside the text, not under it
      camera.setViewOffset(W, H, -ox, -oy, W, H);
      camera.updateProjectionMatrix();
    },
    // world point to CSS px
    project(p) {
      v3.copy(p).project(camera);
      return [(v3.x * 0.5 + 0.5) * view.W, (-v3.y * 0.5 + 0.5) * view.H];
    },
    // a ray from the camera through a point on screen, for placing things under the cursor
    ray(x, y) {
      const ndc = new THREE.Vector2((x / view.W) * 2 - 1, -(y / view.H) * 2 + 1);
      const rc = new THREE.Raycaster();
      rc.setFromCamera(ndc, camera);
      return rc.ray;
    },
    render(time, creases, fold) {
      for (let i = 0; i < 12; i++) U.uFold.value[i] = creases[i].v;
      U.uFan.value = fold.fan;
      U.uWing.value = fold.wing;
      camera.position.copy(cam.pos);
      camera.lookAt(cam.target);
      camera.updateMatrixWorld();
      bulb.quaternion.copy(camera.quaternion);
      // soft shadows widen as the note rises off the desk
      U.uShadowSoft.value = 0.004 + Math.min(0.03, Math.max(0, group.position.y) * 0.012);
      U.uShadowAmt.value = 0.8 * (1 - Math.min(1, Math.max(0, group.position.y - 0.4) / 2.6));
      renderer.setRenderTarget(shadowRT);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.render(scene, shadowCam);
      renderer.setRenderTarget(null);
      renderer.setClearColor(0x050706, 1);
      renderer.render(scene, camera);
    },
  };
}
