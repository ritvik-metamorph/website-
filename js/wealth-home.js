// The Family Wealth Picture as a home at blue hour (17 Nov; the Investor Corner, both sites). The client's
// Notion asks for the result "through fulfillment of home", with "very high quality animation", and shows
// two painted scenes as the bar: a small house under a big tree, warm windows against a deep blue dusk,
// plants and lamps, a city across the water, seen from a little above. The user: "very colorful sort of
// like the pictures in the notion reference, not a 2d line structure". So the composition and the light
// of those scenes, and a house of our own whose every part answers the money (the same answers as the
// line drawing before it, js/wealth-house.js, kept behind ?house=line):
//   the stone it stands on rises out of the ground with the safe savings, and its steps with it;
//   floors are added as the wealth grows against what is earned (the new one rises, the roof lifts);
//   the tree beside it grows with the investments, over the roof, and bears gold fruit;
//   lit windows are everyday spending (and now and then someone moves from room to room);
//   the strings of lights and the lanterns in the garden are experiences;
//   the car that drives up, and the wing with a pool on its roof, are royal spending;
//   leaves blowing off the tree and away over the water are unplanned money;
//   cracks in the stone and the wall are debt.
// Everything eases to its new answer. The water moves, the far city's lights come and go, a boat crosses,
// a beacon blinks; drag to turn the house, and the camera draws back as the house grows. Drawn in
// three.js, finished in one pass (bloom on what is lit, a grade, tone mapping); nothing loaded from
// outside: every texture is drawn here on a canvas.

import * as THREE from '../assets/vendor/three.module.min.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const C = (hex) => new THREE.Color(hex);
// (a seeded random, so the house is the same house every visit)
const seeded = (s) => () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };

// ---- textures, drawn on a canvas ----
function canvasTex(w, h, draw, { srgb = true, repeat = true } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  return t;
}
const blotches = (g, w, h, n, rgb, a0, a1, r0, r1, rand) => {
  for (let i = 0; i < n; i++) {
    const x = rand() * w, y = rand() * h, r = lerp(r0, r1, rand());
    const gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, `rgba(${rgb},${lerp(a0, a1, rand())})`); gr.addColorStop(1, `rgba(${rgb},0)`);
    g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2);
  }
};
function makeTextures(rand) {
  // plaster: a warm cream, softly mottled, a little dirtier towards its foot
  const plaster = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#ece0ca'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 60, '214,196,166', 0.08, 0.22, 10, 46, rand);
    blotches(g, w, h, 40, '255,250,238', 0.06, 0.16, 8, 30, rand);
    const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(120,100,80,0)'); gr.addColorStop(1, 'rgba(120,100,80,0.10)');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  });
  // terracotta tiles: rows down the slope, each lit on top and shadowed under the next
  const tiles = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#b5563c'; g.fillRect(0, 0, w, h);
    const rows = 8, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      const y = r * rh;
      for (let x = (r % 2) * 16; x < w + 32; x += 32) {
        const tone = 0.85 + rand() * 0.3;
        g.fillStyle = `rgb(${Math.round(186 * tone)},${Math.round(90 * tone)},${Math.round(62 * tone)})`;
        g.fillRect(x - 15, y + 2, 30, rh - 3);
        g.fillStyle = 'rgba(255,214,170,0.18)'; g.fillRect(x - 15, y + 2, 30, 3);
        g.fillStyle = 'rgba(60,20,10,0.35)'; g.fillRect(x + 14, y + 2, 2, rh - 3);
      }
      g.fillStyle = 'rgba(50,18,8,0.55)'; g.fillRect(0, y + rh - 3, w, 3);
    }
  });
  // cut stone in courses (clean ashlar: rough natural stone comes out crude in code)
  const stone = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#5d584f'; g.fillRect(0, 0, w, h);
    const rows = 4, rh = h / rows;
    for (let r = 0; r < rows; r++) {
      let x = -rand() * 60;
      while (x < w) {
        const bw = 70 + rand() * 80, tone = 0.86 + rand() * 0.22;
        g.fillStyle = `rgb(${Math.round(160 * tone)},${Math.round(152 * tone)},${Math.round(138 * tone)})`;
        g.fillRect(x + 2, r * rh + 2, bw - 4, rh - 4);
        g.fillStyle = 'rgba(255,248,230,0.16)'; g.fillRect(x + 2, r * rh + 2, bw - 4, 3);
        g.fillStyle = 'rgba(30,26,20,0.22)'; g.fillRect(x + 2, r * rh + rh - 6, bw - 4, 4);
        x += bw;
      }
    }
    blotches(g, w, h, 30, '70,90,60', 0.05, 0.14, 8, 30, rand); // (a little moss and weather)
  });
  // lawn: painted strokes of green
  const lawn = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#4d7240'; g.fillRect(0, 0, w, h);
    const greens = ['#3f6537', '#5a8448', '#6d9752', '#46703c', '#7aa35a'];
    for (let i = 0; i < 1600; i++) {
      g.strokeStyle = greens[Math.floor(rand() * greens.length)]; g.globalAlpha = 0.5;
      const x = rand() * w, y = rand() * h; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rand() - 0.5) * 3, y - 3 - rand() * 4); g.stroke();
    }
    g.globalAlpha = 1;
  });
  // the street's ground: dusky green verges, pavement
  const ground = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#34483a'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 70, '60,86,58', 0.15, 0.35, 10, 40, rand);
    blotches(g, w, h, 40, '30,40,34', 0.15, 0.3, 10, 30, rand);
  });
  const paving = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#7f7a72'; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) for (let x = (y / 32) % 2 * 16; x < w + 32; x += 32) {
      const t = 0.9 + rand() * 0.2; g.fillStyle = `rgb(${Math.round(176 * t)},${Math.round(166 * t)},${Math.round(150 * t)})`; g.fillRect(x - 15, y + 1, 30, 30);
    }
  });
  const road = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#2b2f37'; g.fillRect(0, 0, w, h);
    blotches(g, w, h, 60, '60,64,74', 0.1, 0.25, 6, 24, rand);
    g.fillStyle = 'rgba(232,226,210,0.75)'; for (let x = 0; x < w; x += 64) g.fillRect(x, h / 2 - 2, 34, 4);
  });
  // a lit room behind the glass: three kinds (curtains, blinds, a lamp and a plant)
  const room = (kind) => canvasTex(64, 96, (g, w, h) => {
    const gr = g.createRadialGradient(w * 0.5, h * 0.35, 4, w * 0.5, h * 0.45, h * 0.7);
    gr.addColorStop(0, '#fff1cf'); gr.addColorStop(0.55, '#f5b867'); gr.addColorStop(1, '#a8582a');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    if (kind === 0) { g.fillStyle = 'rgba(190,80,50,0.75)'; g.fillRect(0, 0, 14, h); g.fillRect(w - 14, 0, 14, h); g.fillStyle = 'rgba(120,40,24,0.4)'; for (let x = 3; x < 14; x += 4) { g.fillRect(x, 0, 1, h); g.fillRect(w - x, 0, 1, h); } }
    if (kind === 1) { g.fillStyle = 'rgba(150,80,40,0.35)'; for (let y = 4; y < h * 0.55; y += 5) g.fillRect(0, y, w, 2); }
    if (kind === 2) { g.fillStyle = 'rgba(70,40,24,0.7)'; g.fillRect(40, 50, 3, 30); g.beginPath(); g.ellipse(41, 48, 9, 6, 0, 0, TAU); g.fill(); g.fillStyle = 'rgba(40,60,30,0.75)'; g.beginPath(); g.ellipse(14, 76, 10, 16, 0, 0, TAU); g.fill(); }
  }, { repeat: false });
  // a cluster of leaves, for the edges of the foliage and the leaves that blow away
  const leaves = canvasTex(128, 128, (g, w, h) => {
    for (let i = 0; i < 46; i++) {
      const x = 16 + rand() * 96, y = 16 + rand() * 96, a = rand() * TAU, s = 6 + rand() * 7;
      const t = 0.75 + rand() * 0.5;
      g.fillStyle = `rgb(${Math.round(255 * t)},${Math.round(255 * t)},${Math.round(255 * t)})`;
      g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.ellipse(0, 0, s, s * 0.45, 0, 0, TAU); g.fill();
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 1; g.beginPath(); g.moveTo(-s, 0); g.lineTo(s, 0); g.stroke(); g.restore();
    }
  }, { repeat: false });
  const leaf = canvasTex(32, 32, (g) => { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(16, 16, 14, 6, 0.3, 0, TAU); g.fill(); }, { repeat: false });
  // cracks: dark breaks with a chipped light edge
  // (drawn large and heavy: at the size the house is seen, a hairline crack disappears)
  const cracks = canvasTex(1024, 512, (g, w, h) => {
    const crack = (x, y, a, len, wdt, depth) => {
      const pts = [[x, y]];
      for (let i = 0; i < len; i++) { a += (rand() - 0.5) * 0.85; x += Math.cos(a) * 16; y += Math.sin(a) * 16; pts.push([x, y]); if (depth > 0 && rand() < 0.14) crack(x, y, a + (rand() < 0.5 ? 0.9 : -0.9), len * 0.5, wdt * 0.62, depth - 1); }
      const path = (ox, oy) => { g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px + ox, py + oy) : g.moveTo(px + ox, py + oy))); };
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.strokeStyle = 'rgba(64,42,30,0.26)'; g.lineWidth = wdt + 26; path(0, 0); g.stroke();          // (the damp stain round it)
      g.strokeStyle = 'rgba(246,236,218,0.8)'; g.lineWidth = wdt + 5; path(3, 3); g.stroke();         // (its chipped edge)
      g.strokeStyle = 'rgba(20,13,10,0.98)'; g.lineWidth = wdt; path(0, 0); g.stroke();
    };
    crack(70, h, -1.15, 22, 14, 2); crack(330, h, -1.75, 26, 16, 2); crack(560, h, -1.4, 18, 12, 2); crack(860, h, -2.0, 22, 14, 2);
    crack(250, 0, 1.3, 13, 10, 1); crack(720, 0, 1.9, 12, 10, 1);
  }, { repeat: false });
  return { plaster, tiles, stone, lawn, ground, paving, road, rooms: [room(0), room(1), room(2)], leaves, leaf, cracks };
}

// UVs in metres, so a texture tiles at its true size whatever the box (k: metres per texture)
function worldUV(geo, ku = 1, kv = ku, flipU = false) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i));
    let u, v;
    if (ny > 0.5) { u = x; v = z; } else if (nx > 0.5) { u = z; v = y; } else { u = x; v = y; }
    uv.setXY(i, (flipU ? -u : u) / ku, v / kv);
  }
  uv.needsUpdate = true;
  return geo;
}

// ---- shaders ----
const NOISE = /* glsl */`
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * vn(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }`;

// the sky at blue hour: deep blue overhead, a peach glow low behind the city, painted clouds lit from under
const SKY_V = /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const SKY_F = /* glsl */`
uniform vec3 uCam, uTop, uMid, uLow, uHorizon, uGlow, uCloudLow, uCloudTop; uniform float uTime;
varying vec3 vW;
${NOISE}
void main(){
  vec3 d = normalize(vW - uCam); float y = d.y;
  vec3 c = mix(uHorizon, uLow, smoothstep(-0.03, 0.09, y));
  c = mix(c, uMid, smoothstep(0.07, 0.26, y));
  c = mix(c, uTop, smoothstep(0.24, 0.7, y));
  float side = pow(max(0.0, dot(normalize(vec3(d.x, 0.0, d.z)), normalize(vec3(-0.55, 0.0, -1.0)))), 2.5);
  c += uGlow * side * (1.0 - smoothstep(-0.02, 0.32, y)) * 0.75;
  vec2 cp = d.xz / max(0.05, y + 0.06) * 0.9 + vec2(uTime * 0.012, uTime * 0.004);
  float cl = fbm(cp * 0.55);
  float m = smoothstep(0.42, 0.64, cl) * smoothstep(0.015, 0.1, y) * (1.0 - smoothstep(0.5, 0.85, y));
  vec3 cc = mix(uCloudLow, uCloudTop, smoothstep(0.52, 0.8, cl + y * 0.6));
  cc = mix(cc, cc + uGlow * 0.6, side * (1.0 - smoothstep(0.05, 0.3, y)));
  c = mix(c, cc, m * 0.9);
  float st = step(0.9985, h21(floor(d.xz / max(0.2, y) * 160.0))) * smoothstep(0.3, 0.6, y);
  c += vec3(0.8, 0.85, 1.0) * st * 0.6;
  gl_FragColor = vec4(c, 1.0);
}`;

// the city: boxes whose windows come from where they are (so one shader serves every tower)
const CITY_V = /* glsl */`varying vec3 vW; varying vec3 vN; varying float vId;
void main(){ vec4 p = vec4(position, 1.0);
#ifdef USE_INSTANCING
  p = instanceMatrix * p; vId = float(gl_InstanceID);
#else
  vId = 0.0;
#endif
  vec4 w = modelMatrix * p; vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w; }`;
const CITY_F = /* glsl */`
uniform vec3 uBase, uTop, uFog, uCam, uHaze; uniform float uNear, uFar, uLit, uTime, uSeed, uCell, uHazeTop;
varying vec3 vW; varying vec3 vN; varying float vId;
${NOISE}
void main(){
  vec3 n = normalize(vN); float side = abs(n.y) < 0.5 ? 1.0 : 0.0;
  float along = abs(n.x) > 0.5 ? vW.z : vW.x;
  vec2 cell = vec2(along / (1.5 * uCell), (vW.y + 0.3) / (1.2 * uCell)); vec2 ci = floor(cell), cf = fract(cell);
  float win = step(0.26, cf.x) * step(cf.x, 0.74) * step(0.3, cf.y) * step(cf.y, 0.72) * side;
  float r = h21(ci + vec2(vId * 7.13 + uSeed, n.x * 3.1 + n.z * 1.7));
  float flick = step(0.985, h21(ci + floor(uTime * 0.15 + r * 9.0)));
  float lit = clamp(step(1.0 - uLit, r) + flick * 0.0, 0.0, 1.0);
  float k = h21(ci * 1.7 + vId);
  vec3 wc = mix(vec3(1.0, 0.62, 0.3), vec3(0.72, 0.84, 1.0), step(0.78, k)) * (0.7 + 1.3 * h21(ci + 3.0));
  float hg = clamp(vW.y / 42.0, 0.0, 1.0);
  float tv = h21(vec2(vId, 1.0 + uSeed));
  vec3 tint = mix(vec3(0.86, 1.02, 1.08), vec3(1.12, 0.94, 1.06), tv);
  vec3 body = mix(uBase, uTop, hg) * tint * (n.y > 0.5 ? 1.5 : (abs(n.x) > 0.5 ? 0.78 : 1.0));
  body *= 1.0 - 0.14 * step(0.9, cf.y) * side;                       // (the floors, as faint bands)
  vec3 glass = body * 0.75 + vec3(0.015, 0.025, 0.05);
  vec3 c = mix(body, mix(glass, wc, lit), win);
  float f = smoothstep(uNear, uFar, distance(vW, uCam));
  c = mix(c, uFog, f * (1.0 - 0.6 * win * lit));
  c = mix(c, uHaze, smoothstep(uHazeTop, 0.0, vW.y) * 0.55 * (1.0 - win * lit)); // (the evening's glow low down)
  gl_FragColor = vec4(c, 1.0);
}`;

// the water: the sky's colour far off, deep near, and the far shore's lights broken into streaks
const WATER_V = /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const WATER_F = /* glsl */`
uniform vec3 uNear, uFar, uFog, uCam, uWarm, uCool; uniform float uTime, uShore;
varying vec3 vW;
${NOISE}
void main(){
  float d = distance(vW.xz, uCam.xz);
  vec3 c = mix(uNear, uFar, smoothstep(8.0, 80.0, d));
  float rip = vn(vec2(vW.x * 1.6, vW.z * 0.55 - uTime * 0.5)) * 0.6 + vn(vec2(vW.x * 4.0 + uTime * 0.2, vW.z * 1.4)) * 0.4;
  float cols = smoothstep(0.58, 0.82, vn(vec2(vW.x * 0.32, 3.0)));
  float near = smoothstep(-8.0, uShore, vW.z);
  float streak = cols * smoothstep(0.42, 0.78, rip) * near;
  vec3 lc = mix(uWarm, uCool, step(0.6, vn(vec2(vW.x * 0.13, 7.0))));
  c += lc * streak * 1.6;
  c += vec3(0.5, 0.6, 0.85) * smoothstep(0.8, 0.95, rip) * 0.08;
  float f = smoothstep(30.0, 120.0, distance(vW, uCam));
  c = mix(c, uFog, f * 0.7);
  gl_FragColor = vec4(c, 1.0);
}`;

// the finish: bright parts bloom, then tone mapping, a grade (cool shadows, warm lights) and a vignette
const FS_V = /* glsl */`varying vec2 vUv; void main(){ vUv = position.xy * 0.5 + 0.5; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const BRIGHT_F = /* glsl */`uniform sampler2D t; uniform vec2 px; varying vec2 vUv;
void main(){ vec3 c = 0.25 * (texture2D(t, vUv + px * vec2(-1.0, -1.0)).rgb + texture2D(t, vUv + px * vec2(1.0, -1.0)).rgb + texture2D(t, vUv + px * vec2(-1.0, 1.0)).rgb + texture2D(t, vUv + px * vec2(1.0, 1.0)).rgb);
  float l = max(c.r, max(c.g, c.b)); gl_FragColor = vec4(c * smoothstep(1.0, 2.8, l), 1.0); }`;
const BLUR_F = /* glsl */`uniform sampler2D t; uniform vec2 dir; varying vec2 vUv;
void main(){ vec3 s = texture2D(t, vUv).rgb * 0.227;
  s += (texture2D(t, vUv + dir * 1.385).rgb + texture2D(t, vUv - dir * 1.385).rgb) * 0.316;
  s += (texture2D(t, vUv + dir * 3.231).rgb + texture2D(t, vUv - dir * 3.231).rgb) * 0.070;
  gl_FragColor = vec4(s, 1.0); }`;
const FINISH_F = /* glsl */`uniform sampler2D tScene, tBloom; uniform float uBloom, uExposure; varying vec2 vUv;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec3 c = texture2D(tScene, vUv).rgb + texture2D(tBloom, vUv).rgb * uBloom;
  c = aces(c * uExposure);
  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
  c = mix(c * vec3(0.93, 0.98, 1.08), c * vec3(1.05, 1.0, 0.93), smoothstep(0.2, 0.8, l));
  vec2 q = vUv - 0.5; c *= 1.0 - dot(q, q) * 0.6;
  gl_FragColor = vec4(srgb(c), 1.0);
}`;

export function createHome(canvas, { skin = 'light', reduced = false } = {}) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); } catch (e) { return null; }
  if (!renderer.capabilities.isWebGL2) { renderer.dispose(); return null; }
  const small = Math.min(innerWidth, innerHeight) < 600 || innerWidth <= innerHeight;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const rand = seeded(1729);
  const tex = makeTextures(rand);

  const scene = new THREE.Scene();
  const FOG = C('#4b6597');
  scene.fog = new THREE.Fog(FOG, 26, 120);
  const camera = new THREE.PerspectiveCamera(30, 1.3, 0.5, 900);

  // ---- light: the blue of the hour, a low glow behind, warm lamps near ----
  scene.add(new THREE.HemisphereLight(C('#8ea9e3'), C('#3b3a4a'), 1.5));
  const rim = new THREE.DirectionalLight(C('#c6c9f0'), 1.35);
  rim.position.set(-10, 15, -14);
  rim.castShadow = true;
  rim.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
  Object.assign(rim.shadow.camera, { left: -14, right: 14, top: 14, bottom: -10, near: 1, far: 60 });
  rim.shadow.bias = -0.0004; rim.shadow.normalBias = 0.02;
  scene.add(rim);
  const fill = new THREE.DirectionalLight(C('#7d92c9'), 0.45);
  fill.position.set(12, 8, 14); scene.add(fill);

  // materials
  const lam = (o) => new THREE.MeshLambertMaterial(o);
  const M = {
    wall: lam({ map: tex.plaster }), trim: lam({ color: '#f3ede2' }), roof: lam({ map: tex.tiles }), ridge: lam({ color: '#8f3d2a' }),
    stone: lam({ map: tex.stone }), step: lam({ color: '#a39b8d' }), lawn: lam({ map: tex.lawn }), ground: lam({ map: tex.ground }),
    paving: lam({ map: tex.paving }), road: lam({ map: tex.road }), wood: lam({ color: '#4a3324' }), door: lam({ color: '#7a3f26' }),
    glass: lam({ color: '#1f2c45' }), bark: lam({ color: '#4d3b2f' }), pot: lam({ color: '#b45f3e' }), metal: lam({ color: '#2b2f38' }),
    sill: lam({ color: '#e9e1d3' }), ac: lam({ color: '#d4d6d4' }), parapet: lam({ map: tex.plaster }),
  };
  const glow = (r, g, b) => new THREE.MeshBasicMaterial({ color: new THREE.Color(r, g, b) });
  const mesh = (geo, mat, cast = true, receive = true) => { const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; return m; };
  const box = (w, h, d, mat, k) => mesh(k ? worldUV(new THREE.BoxGeometry(w, h, d), k) : new THREE.BoxGeometry(w, h, d), mat);

  // ---- the sky, the water, the city across it ----
  const skyU = { uCam: { value: V() }, uTime: { value: 0 }, uTop: { value: C('#182552') }, uMid: { value: C('#3a56a0') }, uLow: { value: C('#8193d4') }, uHorizon: { value: C('#f5b08b') }, uGlow: { value: C('#ff9468') }, uCloudLow: { value: C('#f3a6a6') }, uCloudTop: { value: C('#8f95cf') } };
  const sky = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.ShaderMaterial({ vertexShader: SKY_V, fragmentShader: SKY_F, uniforms: skyU, side: THREE.BackSide, depthWrite: false, fog: false }));
  sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);

  const SHORE = -46;
  const waterU = { uCam: { value: V() }, uTime: { value: 0 }, uShore: { value: SHORE }, uNear: { value: C('#14223f') }, uFar: { value: C('#4c6aa0') }, uFog: { value: FOG }, uWarm: { value: C('#ffb064') }, uCool: { value: C('#a9c4ff') } };
  const water = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), new THREE.ShaderMaterial({ vertexShader: WATER_V, fragmentShader: WATER_F, uniforms: waterU }));
  water.rotation.x = -Math.PI / 2; water.position.set(0, -0.45, -6 - 100); scene.add(water);

  const cityMat = (base, top, lit, near, far, cell = 1, seed = 0, hazeTop = 0) => new THREE.ShaderMaterial({ vertexShader: CITY_V, fragmentShader: CITY_F, uniforms: { uBase: { value: C(base) }, uTop: { value: C(top) }, uFog: { value: FOG }, uHaze: { value: C('#c99aae') }, uHazeTop: { value: hazeTop }, uCam: { value: V() }, uNear: { value: near }, uFar: { value: far }, uLit: { value: lit }, uTime: { value: 0 }, uSeed: { value: seed }, uCell: { value: cell } } });
  const city = [];
  {
    const n = small ? 44 : 70, mat = cityMat('#222e55', '#4a5891', 0.13, 60, 230, 0.48, 1, 26);
    const unit = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const towers = new THREE.InstancedMesh(unit, mat, n), crowns = new THREE.InstancedMesh(unit, mat, n);
    const m4 = new THREE.Matrix4(), tops = [];
    let nc = 0;
    for (let i = 0; i < n; i++) {
      const x = -170 + (i / n) * 340 + (rand() - 0.5) * 4, z = SHORE - 34 - rand() * 60;
      const hh = 4 + Math.pow(rand(), 2.4) * 22 + (Math.abs(x + 25) < 35 && rand() < 0.5 ? 10 + rand() * 18 : 0), ww = 4 + rand() * 8, dd = 4 + rand() * 8;
      m4.compose(V(x, -0.4, z), new THREE.Quaternion(), V(ww, hh, dd)); towers.setMatrixAt(i, m4);
      // (a setback on some: a narrower block on top, so the skyline is not a row of boxes)
      let top = hh;
      if (hh > 12 && rand() < 0.6) { const ch = hh * (0.12 + rand() * 0.22); m4.compose(V(x + (rand() - 0.5) * ww * 0.2, hh - 0.4, z), new THREE.Quaternion(), V(ww * (0.45 + rand() * 0.25), ch, dd * (0.45 + rand() * 0.25))); crowns.setMatrixAt(nc++, m4); top = hh + ch; }
      tops.push({ x, z, hh: top });
    }
    crowns.count = nc;
    towers.frustumCulled = crowns.frustumCulled = false; scene.add(towers, crowns); city.push(mat);
    // a red beacon on the two tallest, blinking
    tops.sort((a, b) => b.hh - a.hh);
    var beacons = tops.slice(0, 2).map((t) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), glow(3, 0.3, 0.2)); b.position.set(t.x, t.hh - 0.2, t.z); scene.add(b); return b; });
    // the far shore's lamps, and the near embankment's
    const lampsFar = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 4), glow(2.6, 1.7, 0.9), 70);
    for (let i = 0; i < 70; i++) { m4.makeTranslation(-100 + i * 2.9, 0.5, SHORE + 0.5); lampsFar.setMatrixAt(i, m4); }
    scene.add(lampsFar);
    const shoreBank = box(260, 1.1, 3, lam({ color: '#2a3550' })); shoreBank.position.set(0, 0, SHORE + 1); scene.add(shoreBank);
    // two neighbours that frame the house, with their own windows
    const nb = cityMat('#353a52', '#5d6388', 0.2, 25, 120, 0.7, 4, 0);
    [[-21, -7, 7, 11, 7], [19, -11, 8, 9, 8], [-30, -16, 8, 17, 8]].forEach(([x, z, w, h, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), nb); b.position.set(x, 0, z); scene.add(b); });
    city.push(nb);
  }
  const boat = new THREE.Group();
  {
    boat.add(box(3.4, 0.6, 1.2, lam({ color: '#1d2433' })));
    const cab = box(1.4, 0.7, 0.9, lam({ color: '#d9d4c8' })); cab.position.set(-0.3, 0.65, 0); boat.add(cab);
    const w = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.3), glow(2.4, 1.6, 0.8)); w.position.set(-0.3, 0.7, 0.46); boat.add(w);
    const mast = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), glow(3, 3, 2.6)); mast.position.set(0.9, 1.1, 0); boat.add(mast);
    boat.position.set(0, -0.2, -26); scene.add(boat);
  }

  // ---- the near ground: the street, the embankment, the land ----
  {
    const land = box(160, 1, 46, M.ground, 6); land.position.set(0, -0.5, 17); land.castShadow = false; scene.add(land);
    const edge = box(160, 0.8, 0.7, M.step, 2); edge.position.set(0, -0.32, -6.0); scene.add(edge);
    const rd = box(160, 0.04, 4.2, M.road, 4); rd.position.set(0, 0.02, 9.2); rd.castShadow = false; scene.add(rd);
    const walk = box(160, 0.08, 2.4, M.paving, 2); walk.position.set(0, 0.04, 6.0); walk.castShadow = false; scene.add(walk);
    const kerb = box(160, 0.16, 0.18, M.step); kerb.position.set(0, 0.08, 7.2); scene.add(kerb);
    // the embankment's lamps
    for (let x = -30; x <= 30; x += 10) { const p = mesh(new THREE.CylinderGeometry(0.06, 0.07, 2.6, 6), M.metal); p.position.set(x + 4, 1.3, -5.7); scene.add(p); const hd = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), glow(3, 2, 1.1)); hd.position.set(x + 4, 2.7, -5.7); scene.add(hd); }
  }
  // the street lamp past the drive, and the wires that run from its pole across the evening
  {
    const LX = 10.5, LZ = 6.6;
    const pole = mesh(new THREE.CylinderGeometry(0.1, 0.13, 7.5, 8), M.metal); pole.position.set(LX, 3.75, LZ); scene.add(pole);
    const arm = box(1.6, 0.1, 0.1, M.metal); arm.position.set(LX - 0.7, 7.2, LZ); scene.add(arm);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.14, 0.32), glow(3.2, 2.1, 1.1)); head.position.set(LX - 1.4, 7.08, LZ); scene.add(head);
    const sodium = new THREE.PointLight(C('#ffb46e'), 50, 16, 1.6); sodium.position.set(LX - 1.4, 6.8, LZ); scene.add(sodium);
    const cross = box(2.2, 0.12, 0.12, M.metal); cross.position.set(LX, 6.6, LZ); scene.add(cross);
    const wire = (a, b, sag) => { const mid = a.clone().lerp(b, 0.5); mid.y -= sag; const c = new THREE.QuadraticBezierCurve3(a, mid, b); const t = new THREE.Mesh(new THREE.TubeGeometry(c, 40, 0.025, 4, false), lam({ color: '#141821' })); scene.add(t); };
    wire(V(LX - 1, 6.65, LZ), V(34, 9.5, -12), 1.4); wire(V(LX + 1, 6.65, LZ), V(36, 9.8, -10), 1.3); wire(V(LX, 7.4, LZ), V(35, 10.4, -11), 1.2);
  }

  // ---- the home: everything on the stone moves with it ----
  const W = 5.2, D = 4.2, FH = 2.6, HX = -0.7, HZ = -0.5;
  const PW = 10.6, PD = 7.4, PX = 0.6, PH = 2.6;
  const base = new THREE.Group(); scene.add(base);
  const plinth = mesh(worldUV(new THREE.BoxGeometry(PW, PH, PD), 4, 2), [M.stone, M.stone, M.lawn, M.stone, M.stone, M.stone]);
  plinth.position.set(PX, -PH / 2, 0); base.add(plinth);
  // the steps up to it: as the stone rises, more of them come out of the ground
  const stepCount = 11;
  const steps = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.24, 0.32), M.step, stepCount);
  { const m4 = new THREE.Matrix4(); for (let i = 0; i < stepCount; i++) { m4.makeTranslation(HX, -0.12 - i * 0.24, PD / 2 + 0.16 + i * 0.32); steps.setMatrixAt(i, m4); } }
  steps.castShadow = steps.receiveShadow = true; base.add(steps);
  // a low wall round the garden, open at the steps
  [[PX - PW / 2 + (HX - 0.9 - (PX - PW / 2)) / 2, HX - 0.9 - (PX - PW / 2)], [(HX + 0.9 + PX + PW / 2) / 2, PX + PW / 2 - (HX + 0.9)]].forEach(([cx, len]) => { const w = box(len, 0.55, 0.22, M.parapet); w.position.set(cx, 0.27, PD / 2 - 0.11); base.add(w); const cap = box(len, 0.06, 0.3, M.trim); cap.position.set(cx, 0.57, PD / 2 - 0.11); base.add(cap); });
  { const w = box(0.22, 0.55, PD, M.parapet); w.position.set(PX - PW / 2 + 0.11, 0.27, 0); base.add(w); }
  // the path to the door
  { const p = box(1.3, 0.04, PD / 2 - D / 2 - HZ - 0.1, M.paving, 1.2); p.position.set(HX, 0.02, (PD / 2 + D / 2 + HZ) / 2); p.castShadow = false; base.add(p); }

  const house = new THREE.Group(); house.position.set(HX, 0, HZ); base.add(house);
  const windows = [];
  const addWindow = (parent, x, y, z, rotY, floor, big = false) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = rotY; parent.add(g);
    const ww = big ? 1.3 : 0.92, wh = big ? 2.0 : 1.22;
    const fr = box(ww + 0.14, wh + 0.14, 0.1, M.wood); fr.position.z = 0.02; g.add(fr);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), M.glass); gl.position.z = 0.075; g.add(gl);
    const lm = new THREE.MeshBasicMaterial({ map: tex.rooms[windows.length % 3], color: new THREE.Color(2.4, 1.65, 0.9), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 });
    const lit = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), lm); lit.position.z = 0.08; g.add(lit);
    const bar = box(0.05, wh, 0.04, M.wood); bar.position.z = 0.09; g.add(bar);
    if (!big) { const sill = box(ww + 0.3, 0.07, 0.24, M.sill); sill.position.set(0, -wh / 2 - 0.08, 0.1); g.add(sill); }
    windows.push({ lit, lm, floor, k: 0, rank: rand() });
  };
  const floors = [0, 1, 2].map((i) => {
    const g = new THREE.Group(); house.add(g);
    const wall = box(W, FH, D, M.wall, 2.6); wall.position.y = FH / 2; g.add(wall);
    const band = box(W + 0.14, 0.14, D + 0.14, M.trim); band.position.y = FH - 0.07; g.add(band);
    (i === 0 ? [-1.7, 1.7] : [-1.7, 0, 1.7]).forEach((x) => addWindow(g, x, i === 0 ? 1.3 : 1.4, D / 2, 0, i));
    [-0.95, 0.95].forEach((z) => addWindow(g, W / 2, 1.4, z, Math.PI / 2, i));
    const ac = box(0.8, 0.52, 0.34, M.ac); ac.position.set(W / 2 + 0.17, 0.6 + i * 0.25, i % 2 ? -1.75 : 1.75); g.add(ac);
    if (i === 0) {
      const door = box(1.0, 2.05, 0.1, M.door); door.position.set(0, 1.03, D / 2 + 0.03); g.add(door);
      const df = box(1.22, 2.2, 0.08, M.trim); df.position.set(0, 1.1, D / 2 + 0.01); g.add(df);
      const canopy = box(1.7, 0.1, 0.8, M.trim); canopy.position.set(0, 2.35, D / 2 + 0.4); g.add(canopy);
      const porch = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), glow(2.4, 1.7, 0.95)); porch.position.set(0.72, 2.05, D / 2 + 0.14); g.add(porch);
      const pl = new THREE.PointLight(C('#ffc27a'), 3, 5, 1.8); pl.position.set(0.5, 2.0, D / 2 + 0.7); g.add(pl);
    } else {
      const slab = box(2.3, 0.12, 0.95, M.trim); slab.position.set(0, 0.06, D / 2 + 0.47); g.add(slab);
      const top = box(2.3, 0.05, 0.05, M.metal); top.position.set(0, 0.95, D / 2 + 0.92); g.add(top);
      const bal = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, 0.88, 0.03), M.metal, 18); const m4 = new THREE.Matrix4();
      for (let b = 0; b < 18; b++) { m4.makeTranslation(-1.13 + b * (2.26 / 17), 0.5, D / 2 + 0.92); bal.setMatrixAt(b, m4); } g.add(bal);
    }
    return g;
  });
  // the roof: terracotta on two slopes, gables in plaster, a chimney
  const roof = new THREE.Group(); house.add(roof);
  {
    const ov = 0.45, rh = 1.75, half = W / 2 + ov, len = Math.hypot(half, rh), ang = Math.atan2(rh, half);
    tex.tiles.rotation = Math.PI / 2;
    [-1, 1].forEach((s) => { const sl = mesh(worldUV(new THREE.BoxGeometry(len, 0.16, D + ov * 2), 1.4, 1.4, s > 0), M.roof); sl.position.set(s * half / 2, rh / 2 + 0.08, 0); sl.rotation.z = -s * ang; roof.add(sl); });
    const ridge = box(0.24, 0.18, D + ov * 2, M.ridge); ridge.position.set(0, rh + 0.12, 0); roof.add(ridge);
    const e = rh * ov / half;
    const sh = new THREE.Shape([new THREE.Vector2(-W / 2, 0), new THREE.Vector2(W / 2, 0), new THREE.Vector2(W / 2, e), new THREE.Vector2(0, rh), new THREE.Vector2(-W / 2, e)]);
    [1, -1].forEach((s) => { const gb = mesh(new THREE.ShapeGeometry(sh), M.wall); gb.position.z = s * D / 2; if (s < 0) gb.rotation.y = Math.PI; roof.add(gb); });
    const att = new THREE.Mesh(new THREE.CircleGeometry(0.26, 20), M.glass); att.position.set(0, 0.75, D / 2 + 0.01); roof.add(att);
    const attL = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.4, 1.6, 0.85), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 });
    const attLit = new THREE.Mesh(new THREE.CircleGeometry(0.24, 20), attL); attLit.position.set(0, 0.75, D / 2 + 0.02); roof.add(attLit);
    windows.push({ lit: attLit, lm: attL, floor: 9, k: 0, rank: rand() });
    const ch = box(0.6, 1.5, 0.6, M.wall); ch.position.set(-1.5, 1.45, -0.9); roof.add(ch);
    const cc = box(0.74, 0.1, 0.74, M.trim); cc.position.set(-1.5, 2.22, -0.9); roof.add(cc);
  }
  // the wing: a lower block with a pool on its roof terrace, grown out of the side of the house
  const wing = new THREE.Group(); wing.position.set(HX + W / 2, 0, HZ + 0.3); base.add(wing);
  {
    const WW = 3.9, WD = 3.6, WH = 2.5;
    const body = box(WW, WH, WD, M.wall, 2.6); body.position.set(WW / 2, WH / 2, 0); wing.add(body);
    const slab = box(WW + 0.2, 0.16, WD + 0.2, M.trim); slab.position.set(WW / 2, WH + 0.08, 0); wing.add(slab);
    [[WW / 2, WD / 2, WW + 0.2, 0.1], [WW + 0.05, 0, 0.1, WD + 0.2], [WW / 2, -WD / 2, WW + 0.2, 0.1]].forEach(([x, z, w, d]) => { const p = box(w, 0.42, d, M.parapet); p.position.set(x, WH + 0.37, z); wing.add(p); });
    const pool = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 1.6), glow(0.25, 1.35, 1.6)); pool.position.set(WW / 2 + 0.35, WH + 0.2, -0.2); wing.add(pool);
    const rimP = box(2.5, 0.1, 1.9, M.sill); rimP.position.set(WW / 2 + 0.35, WH + 0.15, -0.2); wing.add(rimP);
    const poolLight = new THREE.PointLight(C('#5fe0ff'), 5, 5, 2); poolLight.position.set(WW / 2 + 0.35, WH + 0.9, -0.2); wing.add(poolLight);
    const um = mesh(new THREE.ConeGeometry(0.95, 0.42, 10), lam({ color: '#f0e3c8' })); um.position.set(0.7, WH + 2.0, 1.1); wing.add(um);
    const up = mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 6), M.metal); up.position.set(0.7, WH + 1.05, 1.1); wing.add(up);
    [WW * 0.3, WW * 0.72].forEach((x) => addWindow(wing, x, 1.12, WD / 2, 0, 5, true));
    addWindow(wing, WW, 1.3, 0, Math.PI / 2, 5);
  }
  // the car that drives up when there is royal spending
  const car = new THREE.Group(); scene.add(car);
  let carLights;
  {
    const prof = new THREE.Shape();
    prof.moveTo(-2.0, 0.3); prof.lineTo(2.0, 0.3); prof.lineTo(2.05, 0.75); prof.quadraticCurveTo(1.9, 0.92, 1.2, 0.95);
    prof.lineTo(0.55, 1.42); prof.lineTo(-0.9, 1.45); prof.quadraticCurveTo(-1.5, 1.2, -1.95, 0.95); prof.lineTo(-2.05, 0.6); prof.closePath();
    const body = mesh(new THREE.ExtrudeGeometry(prof, { depth: 1.7, bevelEnabled: true, bevelThickness: 0.06, bevelSize: 0.06, bevelSegments: 3, curveSegments: 8 }).translate(0, 0, -0.85), new THREE.MeshPhongMaterial({ color: '#9b2a2e', shininess: 70, specular: '#664444' }));
    car.add(body);
    const wp = new THREE.Shape(); wp.moveTo(1.1, 1.0); wp.lineTo(0.5, 1.37); wp.lineTo(-0.85, 1.39); wp.quadraticCurveTo(-1.3, 1.2, -1.6, 1.0); wp.closePath();
    const win = new THREE.Mesh(new THREE.ExtrudeGeometry(wp, { depth: 1.82, bevelEnabled: false }).translate(0, 0, -0.91), lam({ color: '#1a2233' })); car.add(win);
    [[1.3, 0.85], [-1.35, 0.85], [1.3, -0.85], [-1.35, -0.85]].forEach(([x, z]) => { const wh = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.24, 18), lam({ color: '#15171c' })); wh.rotation.x = Math.PI / 2; wh.position.set(x, 0.34, z); car.add(wh); const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.26, 12), M.ac); hub.rotation.x = Math.PI / 2; hub.position.set(x, 0.34, z); car.add(hub); });
    const hl = glow(0.3, 0.3, 0.3); carLights = hl;
    [-0.55, 0.55].forEach((z) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.32), hl); h.position.set(-2.08, 0.78, z); car.add(h); const t = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.3), glow(1.4, 0.1, 0.08)); t.position.set(2.08, 0.8, z); car.add(t); });
    car.position.set(30, 0.08, 5.95); car.visible = false;
  }

  // ---- foliage: balls of leaves with leafy edges (one system per tree or bed) ----
  const ballGeo = (() => { const g = new THREE.IcosahedronGeometry(1, 2); const n = g.attributes.normal, p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const k = 0.5 + 0.5 * (n.getY(i) * 0.5 + 0.5) + 0.06 * Math.sin(p.getX(i) * 9) * Math.sin(p.getZ(i) * 7); col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = k; }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g; })();
  const leafMat = lam({ vertexColors: true });
  const cardMat = lam({ map: tex.leaves, alphaTest: 0.5, side: THREE.DoubleSide });
  const GREENS = ['#356a42', '#457f48', '#5a9550', '#6fa458', '#3f7344', '#82ad5c', '#2f5e3e'].map(C);
  function foliage(clumps, { balls = 5, cards = 22, greens = GREENS } = {}) {
    const nb = clumps.length * balls, nc = clumps.length * cards;
    const bm = new THREE.InstancedMesh(ballGeo, leafMat, nb), cm = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), cardMat, nc);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), surface = [];
    let bi = 0, ci = 0;
    clumps.forEach(({ p, r }) => {
      for (let i = 0; i < balls; i++) {
        const o = V(rand() - 0.5, (rand() - 0.3) * 0.8, rand() - 0.5).multiplyScalar(r * 0.8), s = r * (0.42 + rand() * 0.22);
        m4.compose(p.clone().add(o), q.identity(), V(s, s * 0.85, s)); bm.setMatrixAt(bi, m4);
        bm.setColorAt(bi++, greens[Math.floor(rand() * greens.length)].clone().multiplyScalar(0.85 + rand() * 0.3));
      }
      for (let i = 0; i < cards; i++) {
        const d = V(rand() - 0.5, rand() - 0.35, rand() - 0.5).normalize(), at = p.clone().addScaledVector(d, r * (0.55 + rand() * 0.45));
        e.set(rand() * TAU, rand() * TAU, rand() * TAU); const s = r * (0.5 + rand() * 0.35);
        m4.compose(at, q.setFromEuler(e), V(s, s, s)); cm.setMatrixAt(ci, m4);
        cm.setColorAt(ci++, greens[Math.floor(rand() * greens.length)].clone().multiplyScalar(0.8 + rand() * 0.45));
        if (d.y > -0.2) surface.push(at);
      }
    });
    bm.castShadow = cm.castShadow = true; bm.receiveShadow = cm.receiveShadow = true;
    return { bm, cm, surface };
  }

  // the tree: grown from a seed, leaning over the house; its size is the investments
  const tree = new THREE.Group(); tree.position.set(HX - W / 2 - 0.95, 0, HZ + D / 2 - 0.5); base.add(tree);
  const crown = new THREE.Group(); tree.add(crown);
  let fruit;
  {
    const clumps = [], up = V(0, 1, 0), lean = V(-0.26, 0, 0.04);
    const seg = (a, b, r0, r1) => { const d = b.clone().sub(a), L = d.length(); const m = mesh(new THREE.CylinderGeometry(r1, r0, L, 8), M.bark); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(up, d.normalize()); tree.add(m); };
    const grow = (p, dir, len, r, depth) => {
      const q = p.clone().addScaledVector(dir, len);
      seg(p, q, r, r * 0.66);
      if (depth === 0) { clumps.push({ p: q, r: 1.25 + rand() * 0.5 }); return; }
      if (depth === 1) clumps.push({ p: p.clone().lerp(q, 0.75), r: 1.0 + rand() * 0.4 });
      const n = depth === 3 ? 3 : 2 + (rand() < 0.45 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        const a = (k / n) * TAU + rand() * 1.2, sp = 0.5 + rand() * 0.38;
        const nd = dir.clone().multiplyScalar(Math.cos(sp)).add(V(Math.cos(a) * Math.sin(sp), 0, Math.sin(a) * Math.sin(sp))).add(lean.clone().multiplyScalar(0.6)).normalize();
        grow(q, nd, len * (0.68 + rand() * 0.12), r * 0.64, depth - 1);
      }
    };
    grow(V(0, -0.2, 0), V(0.12, 1, 0.04).normalize(), 2.7, 0.36, 3);
    const f = foliage(clumps, { balls: 4, cards: small ? 40 : 56 });
    crown.add(f.bm, f.cm);
    const N = Math.min(90, f.surface.length);
    fruit = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 8, 6), glow(2.6, 1.45, 0.35), N);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < N; i++) { const s = f.surface[Math.floor(rand() * f.surface.length)]; m4.makeTranslation(s.x, s.y - 0.05, s.z); fruit.setMatrixAt(i, m4); }
    fruit.count = 0; crown.add(fruit);
    var crownTop = clumps.reduce((m, c) => Math.max(m, c.p.y + c.r), 0);
  }
  // the garden: beds of shrubs and flowers along the low wall and by the door
  {
    const beds = [];
    for (let x = PX - PW / 2 + 0.8; x < PX + PW / 2 - 0.5; x += 0.9) if (Math.abs(x - HX) > 1.3) beds.push({ p: V(x, 0.38, PD / 2 - 0.65), r: 0.42 + rand() * 0.2 });
    for (let z = -PD / 2 + 0.9; z < PD / 2 - 1; z += 1.0) beds.push({ p: V(PX - PW / 2 + 0.6, 0.36, z), r: 0.4 + rand() * 0.2 });
    const f = foliage(beds, { balls: 3, cards: 10 }); base.add(f.bm, f.cm);
    const FL = ['#e2557a', '#f29ab6', '#fff4ec', '#f4c54f', '#d9475b', '#c77ad8'].map(C);
    const nfl = 240, fl = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075, 0), lam({}), nfl), m4 = new THREE.Matrix4();
    for (let i = 0; i < nfl; i++) { const s = f.surface[Math.floor(rand() * f.surface.length)]; m4.makeTranslation(s.x, s.y + 0.04, s.z); fl.setMatrixAt(i, m4); fl.setColorAt(i, FL[Math.floor(rand() * FL.length)]); }
    base.add(fl);
    // pots by the door
    const POTS = [[HX - 1.25, HZ + D / 2 + 0.55], [HX + 1.25, HZ + D / 2 + 0.55], [HX + 2.1, HZ + D / 2 + 0.45]];
    POTS.forEach(([x, z]) => { const p = mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.45, 12), M.pot); p.position.set(x, 0.22, z); base.add(p); });
    const pf = foliage(POTS.map(([x, z]) => ({ p: V(x, 0.75, z), r: 0.36 })), { balls: 3, cards: 8 });
    base.add(pf.bm, pf.cm);
    // a few street trees beyond, darker
    const st = foliage([[-11, -1.6], [10.5, -3.2], [-19, 1], [21, -1]].map(([x, z]) => ({ p: V(x, 3.4, z), r: 1.7 })), { balls: 6, cards: 20, greens: ['#253f33', '#2f4d3a', '#38563f'].map(C) });
    scene.add(st.bm, st.cm);
    [[-11, -1.6], [10.5, -3.2], [-19, 1], [21, -1]].forEach(([x, z]) => { const t = mesh(new THREE.CylinderGeometry(0.16, 0.24, 3.2, 7), M.bark); t.position.set(x, 1.6, z); scene.add(t); });
  }
  // experiences: strings of lights across the garden, lanterns by the path
  const bulbsMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
  const lanternMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0) });
  let bulbs, gardenLight;
  {
    const posts = [V(PX + PW / 2 - 0.3, 0, PD / 2 - 0.3), V(PX - PW / 2 + 0.3, 0, PD / 2 - 0.3)];
    posts.forEach((p) => { const m = mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.3, 6), M.wood); m.position.set(p.x, 1.15, p.z); base.add(m); });
    const corner = V(HX - W / 2, 2.25, HZ + D / 2), eaveR = V(HX + W / 2, 2.25, HZ + D / 2);
    const runs = [[corner, posts[1].clone().setY(2.25), 0.4], [eaveR, posts[0].clone().setY(2.25), 0.45], [posts[1].clone().setY(2.25), posts[0].clone().setY(2.25), 0.6]];
    const pts = [];
    runs.forEach(([a, b, sag]) => { const n = Math.round(a.distanceTo(b) * 2.4); for (let i = 0; i <= n; i++) { const t = i / n, p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * sag; pts.push(p); } const mid = a.clone().lerp(b, 0.5); mid.y -= sag * 2; base.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), 30, 0.012, 3), M.metal)); });
    bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 6, 4), bulbsMat, pts.length);
    const m4 = new THREE.Matrix4(); pts.forEach((p, i) => { m4.makeTranslation(p.x, p.y - 0.06, p.z); bulbs.setMatrixAt(i, m4); bulbs.setColorAt(i, new THREE.Color(1, 1, 1)); });
    base.add(bulbs);
    [-1, 1].forEach((s) => { const lp = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.8, 6), M.metal); lp.position.set(HX + s * 0.85, 0.4, PD / 2 - 0.45); base.add(lp); const lh = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.24, 0.18), lanternMat); lh.position.set(HX + s * 0.85, 0.9, PD / 2 - 0.45); base.add(lh); });
    gardenLight = new THREE.PointLight(C('#ffc078'), 0, 10, 1.7); gardenLight.position.set(PX, 2.2, PD / 2 - 0.8); base.add(gardenLight);
  }
  const spill = new THREE.PointLight(C('#ffb86b'), 0, 8, 1.8); spill.position.set(0, 1.5, D / 2 + 1.3); house.add(spill);
  // debt: cracks in the stone and in the wall
  const crackMat = new THREE.MeshLambertMaterial({ map: tex.cracks, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
  {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), crackMat); a.position.set(PX, -PH / 2, PD / 2 + 0.01); base.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(PD, PH), crackMat); b.position.set(PX + PW / 2 + 0.01, -PH / 2, 0); b.rotation.y = Math.PI / 2; base.add(b);
    const c = new THREE.Mesh(new THREE.PlaneGeometry(W, FH), crackMat); c.position.set(0, FH / 2, D / 2 + 0.012); floors[0].add(c);
    const d = new THREE.Mesh(new THREE.PlaneGeometry(D, FH), crackMat); d.position.set(W / 2 + 0.012, FH / 2, 0); d.rotation.y = Math.PI / 2; floors[0].add(d);
  }
  // unplanned money: leaves that let go of the tree and blow away over the water
  const LEAVES = 70;
  const blown = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.34, 0.34), lam({ map: tex.leaf, alphaTest: 0.5, side: THREE.DoubleSide }), LEAVES);
  const blow = Array.from({ length: LEAVES }, (_, i) => ({ t: rand(), d: 5 + rand() * 4, o: V(rand() - 0.5, rand() - 0.5, rand() - 0.5), s: rand(), spin: V(rand() * 3, rand() * 3, rand() * 3) }));
  const BLOWN = ['#e9c35a', '#b9cf63', '#8fbf5a', '#f0a64e'].map(C);
  blow.forEach((b, i) => blown.setColorAt(i, BLOWN[i % BLOWN.length].clone().multiplyScalar(1.4)));
  blown.frustumCulled = false; scene.add(blown);

  // ---- what it shows, and what it is moving towards ----
  const T = { found: 0.3, floors: 1, wing: 0, car: 0, lit: 0.5, lamps: 0.3, tree: 0.3, idle: 0.2, debt: 0 };
  const S = { ...T };
  let yaw = 0, yawT = 0, px = 0, py = 0, pxS = 0, pyS = 0, time = 0, alive = true, last = performance.now(), carX = 30, swapAt = 6;
  const target = V(), camPos = V();

  // drag to turn it (a little); the pointer leans it
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: yawT }; canvas.setPointerCapture?.(e.pointerId); canvas.classList.add('is-drag'); });
  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect(); px = ((e.clientX - r.left) / r.width - 0.5) * 2; py = ((e.clientY - r.top) / r.height - 0.5) * 2;
    if (drag) yawT = clamp(drag.y + (e.clientX - drag.x) * 0.006, -0.75, 0.75);
  });
  const end = () => { drag = null; canvas.classList.remove('is-drag'); };
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('pointerleave', () => { px = 0; py = 0; });

  // ---- the finish ----
  const samples = small ? 2 : 4;
  const rtScene = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples });
  const rtA = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: false });
  const rtB = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: false });
  const quadScene = new THREE.Scene(), quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tri = new THREE.BufferGeometry(); tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  const fsm = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: FS_V, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false });
  const bright = fsm(BRIGHT_F, { t: { value: rtScene.texture }, px: { value: new THREE.Vector2() } });
  const blurA = fsm(BLUR_F, { t: { value: rtA.texture }, dir: { value: new THREE.Vector2() } });
  const blurB = fsm(BLUR_F, { t: { value: rtB.texture }, dir: { value: new THREE.Vector2() } });
  const finish = fsm(FINISH_F, { tScene: { value: rtScene.texture }, tBloom: { value: rtA.texture }, uBloom: { value: 0.85 }, uExposure: { value: 1.05 } });
  const quad = new THREE.Mesh(tri, bright); quad.frustumCulled = false; quadScene.add(quad);
  const pass = (mat, rt) => { quad.material = mat; renderer.setRenderTarget(rt); renderer.render(quadScene, quadCam); };

  let w = 1, h = 1, pw = 2, ph = 2;
  const size = () => {
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(small ? 1.6 : 1.75, devicePixelRatio || 1);
    w = Math.max(1, r.width); h = Math.max(1, r.height); pw = Math.round(w * dpr); ph = Math.round(h * dpr);
    renderer.setPixelRatio(1); renderer.setSize(pw, ph, false);
    rtScene.setSize(pw, ph); rtA.setSize(pw >> 1, ph >> 1); rtB.setSize(pw >> 1, ph >> 1);
    camera.aspect = w / h;
    // (the lens shifted up, as an architect's camera does: more evening sky, verticals kept)
    camera.setViewOffset(w, h, 0, -h * 0.1, w, h);
    camera.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(size); ro.observe(canvas);

  function step(dt) {
    if (!reduced) time += dt;
    const k = reduced ? 1 : Math.min(1, dt * 1.6);
    for (const key in T) S[key] += (T[key] - S[key]) * k;
    // the stone rises with what is saved; the house and the garden ride on it
    const hb = lerp(0.18, 2.0, S.found);
    base.position.y = hb;
    // floors: the ground floor always; the next rise as the wealth grows
    const f1 = clamp(S.floors - 1, 0, 1), f2 = clamp(S.floors - 2, 0, 1), sc = [1, f1, f2];
    let y = 0;
    floors.forEach((g, i) => { g.position.y = y; g.scale.y = Math.max(0.001, sc[i]); g.visible = sc[i] > 0.01; y += FH * sc[i]; });
    roof.position.y = y;
    const H = hb + y + 2.0;
    // the tree: investments; the fruit comes with it
    const ts = lerp(0.42, 1.2, S.tree);
    tree.scale.setScalar(ts);
    fruit.count = Math.round(Math.pow(smooth(0.25, 1, S.tree), 1.3) * fruit.instanceMatrix.count);
    crown.rotation.z = Math.sin(time * 0.55) * 0.012; crown.rotation.x = Math.sin(time * 0.43 + 1) * 0.008;
    // the wing grows out of the side of the house; the car drives up
    wing.scale.x = Math.max(0.001, S.wing); wing.visible = S.wing > 0.01;
    const cx = lerp(30, PX + PW / 2 + 0.2, smooth(0, 1, S.car)), moving = Math.abs(cx - carX) > 0.002;
    carX = cx; car.position.x = cx; car.visible = S.car > 0.02;
    carLights.color.setRGB(moving ? 3 : 0.35, moving ? 2.8 : 0.33, moving ? 2.4 : 0.3);
    // lit windows: as many as the everyday spending asks; now and then someone moves room
    const shown = windows.filter((wd) => (wd.floor === 9 ? true : wd.floor === 5 ? S.wing > 0.5 : sc[wd.floor] > 0.5));
    const litN = Math.round(clamp(S.lit, 0, 1) * shown.length);
    if (!reduced && time > swapAt) { swapAt = time + 4 + Math.random() * 6; const a = shown[Math.floor(Math.random() * shown.length)], b = shown[Math.floor(Math.random() * shown.length)]; if (a && b) [a.rank, b.rank] = [b.rank, a.rank]; }
    const order = [...shown].sort((a, b) => a.rank - b.rank);
    windows.forEach((wd) => { const on = order.indexOf(wd) > -1 && order.indexOf(wd) < litN ? 1 : 0; wd.k += (on - wd.k) * (reduced ? 1 : Math.min(1, dt * 2.2)); wd.lm.opacity = wd.k; wd.lit.visible = wd.k > 0.01; });
    spill.intensity = 6 * S.lit;
    // experiences: the strings of lights and the lanterns
    const lampK = smooth(0.02, 0.6, S.lamps);
    bulbsMat.color.setRGB(3.2 * lampK, 2.2 * lampK, 1.1 * lampK);
    if (!reduced) for (let i = 0; i < bulbs.count; i++) { const tw = 0.75 + 0.25 * Math.sin(time * 2.1 + i * 1.7); bulbs.setColorAt(i, new THREE.Color(tw, tw, tw)); }
    if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
    lanternMat.color.setRGB(2.6 * lampK, 1.7 * lampK, 0.8 * lampK);
    gardenLight.intensity = 14 * lampK;
    // debt
    crackMat.opacity = smooth(0.02, 0.5, S.debt);
    // unplanned money: leaves blowing off the tree, towards the water
    const active = Math.round(S.idle * LEAVES), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
    const top = V(tree.position.x + 0.6 * ts, hb + crownTop * ts * 0.78, tree.position.z);
    blow.forEach((b, i) => {
      if (!reduced) b.t += dt / b.d;
      if (b.t > 1) b.t -= 1;
      const on = i < active, t = b.t;
      // (over the roof and away across the water, rising on the wind, then falling)
      const p = top.clone().addScaledVector(b.o, 3.2 * ts).add(V(t * 12 + Math.sin(t * 6 + b.s * 9) * 0.6, Math.sin(t * 5 + b.s * 7) * 0.8 + t * 3 - t * t * 5, -t * 14));
      e.set(b.spin.x * (time + b.s * 9), b.spin.y * (time + b.s * 5), b.spin.z * time);
      const s = on ? Math.sin(Math.PI * t) * 1.1 : 0;
      m4.compose(p, q.setFromEuler(e), V(s, s, s)); blown.setMatrixAt(i, m4);
    });
    blown.instanceMatrix.needsUpdate = true;
    // the world goes on: the water, the city, a boat, the beacons
    skyU.uTime.value = time; waterU.uTime.value = time; city.forEach((m) => { m.uniforms.uTime.value = time; });
    boat.position.x = ((time * 1.1) % 140) - 70;
    beacons.forEach((b, i) => { b.visible = Math.sin(time * 2.4 + i * 2) > 0.55; });
    // the camera: a little above, drawing back as the house grows; the pointer leans it, a drag turns it
    yaw += (yawT - yaw) * Math.min(1, dt * 4); pxS += (px - pxS) * Math.min(1, dt * 2.5); pyS += (py - pyS) * Math.min(1, dt * 2.5);
    const ty = Math.max(H, hb + crownTop * ts);
    target.set(PX - 0.4, 0.6 + ty * 0.36, -0.2);
    const dist = 21 + ty * 1.5;
    const a = 0.55 + yaw + pxS * 0.06 + (reduced ? 0 : Math.sin(time * 0.08) * 0.025), pitch = 0.15 + pyS * 0.02;
    camPos.set(target.x + Math.sin(a) * Math.cos(pitch) * dist, target.y + Math.sin(pitch) * dist, target.z + Math.cos(a) * Math.cos(pitch) * dist);
    camera.position.copy(camPos); camera.lookAt(target);
    sky.position.copy(camPos); skyU.uCam.value.copy(camPos); waterU.uCam.value.copy(camPos); city.forEach((m) => m.uniforms.uCam.value.copy(camPos));
  }

  function render() {
    renderer.setRenderTarget(rtScene); renderer.render(scene, camera);
    bright.uniforms.px.value.set(1 / pw, 1 / ph); pass(bright, rtA);
    const ax = 1 / (pw >> 1), ay = 1 / (ph >> 1);
    blurA.uniforms.dir.value.set(ax, 0); pass(blurA, rtB); blurB.uniforms.dir.value.set(0, ay); pass(blurB, rtA);
    blurA.uniforms.dir.value.set(ax * 2.5, 0); pass(blurA, rtB); blurB.uniforms.dir.value.set(0, ay * 2.5); pass(blurB, rtA);
    pass(finish, null);
  }

  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    const r = canvas.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    step(dt); render();
  }
  step(0.016); render();
  requestAnimationFrame(frame);

  return {
    S, T, scene, camera,
    // from a picture of the money (js/wealth-model.js picture()) and how the spending divides
    show(p, mix, earn) {
      const per = (v) => v / Math.max(1, earn);
      const wealthX = per(p.wealth);
      T.found = clamp(per(p.safe) / 6, 0.04, 1);
      // (a floor, the wing and the car are there or not: a half-risen floor would read as a broken house;
      // the easing still lets each one rise, grow out or drive up)
      T.floors = 1 + (wealthX > 3.2 ? 1 : 0) + (wealthX > 8 ? 1 : 0);
      T.wing = mix.royal >= 0.2 && wealthX > 4 ? 1 : 0;
      T.car = mix.royal >= 0.1 ? 1 : 0;
      T.lit = clamp(0.2 + mix.utility * 0.9, 0.15, 1);
      T.lamps = clamp(mix.experience * 2.4, 0, 1);
      T.tree = clamp(Math.sqrt(Math.max(0, per(p.invested))) / 3.2, 0.05, 1);
      T.idle = clamp(per(p.idle) / 3, 0, 1);
      T.debt = p.debt > 0.05 ? clamp(0.35 + per(p.debt) / 1.5, 0, 1) : 0;
    },
    // (for checking: run n steps at once, then draw)
    tick(n = 1, dt = 0.05) { for (let i = 0; i < n; i++) step(dt); render(); },
    destroy() { alive = false; ro.disconnect(); renderer.dispose(); },
  };
}
