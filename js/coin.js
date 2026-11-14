// The team's coins: every person struck in silver (the advisory board in bronze).
//
// - Front: their portrait, engraved in line the way a banknote portrait is, inside an oval that
//   dissolves into the field. Their name round the top, the year they joined where a coin would
//   carry its value, a beaded border. Between the portrait and the name, seven rings of microtext:
//   their seven answers, the most public outermost, the most private closest to the face.
// - Back: who they were before, cut into a plain cartouche on a guilloche rosette.
// - Edge: reeded.
//
// Each face is baked once into a relief map (height, finish, microtext); the coin shades that live
// as metal, a mirror field and a frosted portrait. Ink: lit like a proof coin, and the microtext is
// too shallow to catch the light. Light: the room goes dark and the cursor is a lamp held low over
// the coin, raking across the relief.
//
// This file holds the parts every coin shares (the baker, the metal, the shape) and createCoin(),
// the one coin held up close. The team section (js/team.js) draws many from the same parts.
import * as THREE from '../assets/vendor/three.module.min.js';

const { gsap } = window;
const TAU = Math.PI * 2;
const SERIF = "'Ibarra Real Nova', Georgia, serif";
const MONO = "'Fragment Mono', ui-monospace, monospace";
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

// the coin's profile, in coin radii: the field, the bevel up to the rim, the rim, the edge
const RF = 0.905, RB = 0.93, RT = 0.985, HT = 0.08, FZ = 0.066;
// the seven rings of microtext, outermost first
export const MICRO = { out: 0.765, in: 0.6, rings: 7 };
// the portrait's oval: centre and semi-axes
const OVAL = new THREE.Vector4(0, 0.0, 0.46, 0.585);
const LAMP_Z = 0.34; // how high the lamp is held over the coin, up close
export const METAL = {
  silver: new THREE.Vector3(0.93, 0.93, 0.915),
  bronze: new THREE.Vector3(0.86, 0.6, 0.43),
};

const QUAD_VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

// ---------------------------------------------------------------- the placeholder sitter

// A sculpted, faceless head and shoulders, lit like a studio portrait from the upper left. Enough
// form for the engraving to show what it does with a face, and plainly a stand-in. Each placeholder
// person's look (js/people.js) turns the head, cuts the hair and sets the shoulders and tones, so
// no two coins carry the same sitter.
const SITTER_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform float uAspect;
uniform float uHair;      // 0 short, 1 long, 2 tied back
uniform float uTurn;
uniform float uRoll;
uniform float uShoulders;
uniform float uSkin;
uniform float uSuit;
float MAT;
float sdE(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / k1; }
float sdC(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - r; }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }
float smax(float a, float b, float k) { return -smin(-a, -b, k); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

float map(vec3 p) {
  MAT = 0.0;
  vec3 h = p - vec3(0.0, 0.62, 0.0);
  h.xy = rot(uRoll) * h.xy;
  h.xz = rot(uTurn) * h.xz;
  vec3 m = vec3(abs(h.x), h.yz);
  float d = smin(sdE(h - vec3(0.0, 0.05, -0.03), vec3(0.29, 0.34, 0.33)),
                 sdE(h - vec3(0.0, -0.12, 0.07), vec3(0.235, 0.27, 0.25)), 0.12);
  d = smin(d, sdE(h - vec3(0.0, -0.31, 0.12), vec3(0.12, 0.08, 0.10)), 0.09);          // chin
  d = smin(d, sdE(m - vec3(0.12, -0.13, 0.2), vec3(0.09, 0.06, 0.08)), 0.08);          // cheekbones
  d = smin(d, sdE(h - vec3(0.0, 0.03, 0.26), vec3(0.19, 0.05, 0.06)), 0.07);           // brow
  d = smax(d, -sdE(m - vec3(0.092, -0.04, 0.29), vec3(0.05, 0.024, 0.035)), 0.03);     // eyes
  d = smin(d, sdC(h, vec3(0.0, 0.0, 0.29), vec3(0.0, -0.14, 0.345), 0.032), 0.05);     // nose
  d = smax(d, -sdE(h - vec3(0.0, -0.225, 0.285), vec3(0.055, 0.007, 0.05)), 0.012);    // mouth
  d = smin(d, sdE(m - vec3(0.285, -0.06, -0.02), vec3(0.035, 0.075, 0.05)), 0.03);     // ears
  float hair = sdE(h - vec3(0.0, 0.12, -0.06), vec3(0.325, 0.335, 0.365));
  hair = smax(hair, 0.06 + 0.3 * h.z - h.y, 0.05);
  if (uHair > 0.5 && uHair < 1.5) {
    // long: it falls behind the neck to the shoulders, and frames the face at the sides
    float fall = smax(sdE(h - vec3(0.0, -0.2, -0.12), vec3(0.34, 0.5, 0.22)), h.z - 0.04, 0.06);
    float locks = sdE(m - vec3(0.25, -0.12, 0.0), vec3(0.075, 0.3, 0.13));
    hair = smin(hair, smin(fall, locks, 0.08), 0.06);
  } else if (uHair > 1.5) {
    hair = smin(hair, sdE(h - vec3(0.0, 0.2, -0.31), vec3(0.12, 0.11, 0.1)), 0.05);    // tied back
  }
  if (hair < d) MAT = 1.0;
  d = smin(d, hair, 0.015);
  d = smin(d, sdC(p, vec3(0.0, 0.0, -0.03), vec3(0.0, 0.42, 0.0), 0.12), 0.07);       // neck
  vec3 s = p - vec3(0.0, -0.36, -0.05);
  float torso = smin(sdE(s, vec3(0.74 * uShoulders, 0.34, 0.29)), sdE(s - vec3(0.0, -0.34, 0.0), vec3(0.82 * uShoulders, 0.4, 0.33)), 0.12);
  if (torso < d) MAT = (p.y < 0.03 && p.z > 0.0 && abs(p.x) < (0.03 - p.y) * 0.42) ? 3.0 : 2.0;
  return smin(d, torso, 0.1);
}

void main() {
  vec2 q = vec2((vUv.x - 0.5) * uAspect, vUv.y - 0.5);
  vec3 ro = vec3(0.0, 0.32, 3.6);
  vec3 rd = normalize(vec3(q, -2.5));
  float t = 2.4;
  bool hit = false;
  for (int i = 0; i < 120; i++) {
    float d = map(ro + rd * t);
    if (d < 0.0006) { hit = true; break; }
    t += d * 0.9;
    if (t > 5.0) break;
  }
  float lum;
  if (hit) {
    vec3 p = ro + rd * t;
    vec2 e = vec2(0.0015, -0.0015);
    vec3 n = normalize(e.xyy * map(p + e.xyy) + e.yyx * map(p + e.yyx) + e.yxy * map(p + e.yxy) + e.xxx * map(p + e.xxx));
    vec3 L = normalize(vec3(-0.62, 0.55, 0.6));
    float dif = max(dot(n, L), 0.0);
    float sh = 1.0, st = 0.02;
    for (int i = 0; i < 28; i++) {
      float hh = map(p + L * st);
      sh = min(sh, 10.0 * hh / st);
      st += clamp(hh, 0.01, 0.12);
      if (sh < 0.01 || st > 1.6) break;
    }
    sh = clamp(sh, 0.0, 1.0);
    float ao = 0.0, sc = 1.0;
    for (int i = 1; i <= 5; i++) { float hh = 0.03 * float(i); ao += (hh - map(p + n * hh)) * sc; sc *= 0.7; }
    ao = clamp(1.0 - 3.0 * ao, 0.0, 1.0);
    map(p);
    float mat = MAT;
    float fill = 0.5 + 0.5 * dot(n, normalize(vec3(0.75, 0.15, 0.6)));
    float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5) * smoothstep(0.0, 0.6, dot(n, normalize(vec3(0.9, 0.3, -0.3))));
    float alb = mat < 0.5 ? uSkin : mat < 1.5 ? 0.14 : mat < 2.5 ? uSuit : 0.93;
    lum = alb * (1.1 * dif * sh + 0.26 * fill * ao) + 0.3 * rim * alb + 0.05 * ao;
  } else {
    lum = mix(0.74, 0.9, vUv.y) + 0.06 * (1.0 - length(q - vec2(-0.25, 0.2)));
  }
  gl_FragColor = vec4(vec3(clamp(lum, 0.0, 1.0)), 1.0);
}`;

// ---------------------------------------------------------------- baking a face

// Writes one face's relief: r height (0.5 is the field), g finish (0 mirror, 1 frosted),
// b microtext. The portrait is engraved in up to three families of line, the way a banknote
// portrait is: one across the form, bowed over it and pushed by its light, then cross-hatching
// for the half tones and the shadows. In the highlights the lines thin and break into dashes.
const BAKE_FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform int uSide;
uniform sampler2D uPortrait;
uniform float uAspect;
uniform vec2 uLevels;
uniform vec2 uLod;
uniform vec4 uOval;
uniform vec3 uFit;
uniform sampler2D uType;

float hash(float n) { return fract(sin(n * 127.1) * 43758.5453); }
float lum(vec2 uv, float lod) { return dot(textureLod(uPortrait, uv, lod).rgb, vec3(0.299, 0.587, 0.114)); }
// one family of lines; s runs across them (a line at every whole number), h is the half width
float lineInk(float s, float h) {
  float d = abs(fract(s + 0.5) - 0.5) * 2.0;
  float aa = fwidth(s) * 1.4;
  return (1.0 - smoothstep(h - aa, h + aa, d)) * smoothstep(0.0, 0.04, h);
}
float engrave(vec2 p, float t, float Lb) {
  const float N = 84.0;
  vec2 q = (p - uOval.xy) / uOval.zw;
  float bow = 0.035 * (1.0 - q.x * q.x);
  float push = 0.065 * Lb;
  float s1 = (p.y + bow + push) * N;
  float h1 = t * 0.96;
  float i1 = lineInk(s1, h1);
  float along = p.x * N * 0.5 + hash(floor(s1 + 0.5)) * 17.0;
  float keep = smoothstep(0.03, 0.32, h1);
  float aa = fwidth(along) * 1.2;
  float on = 1.0 - smoothstep(keep - aa, keep + aa, fract(along));
  i1 *= mix(on, 1.0, smoothstep(0.3, 0.5, h1));
  float s2 = (dot(p, normalize(vec2(0.82, -0.57))) + push * 0.7) * N * 0.94;
  float i2 = lineInk(s2, clamp((t - 0.6) / 0.4, 0.0, 1.0) * 0.75);
  float s3 = (dot(p, normalize(vec2(0.57, 0.82))) + push * 0.5) * N * 0.88;
  float i3 = lineInk(s3, clamp((t - 0.82) / 0.18, 0.0, 1.0) * 0.65);
  return max(i1, max(i2, i3));
}
float guilloche(vec2 p) {
  float r = length(p), a = atan(p.y, p.x);
  float s1 = r * 70.0 + 2.2 * sin(a * 20.0 + r * 6.0);
  float s2 = r * 70.0 + 2.2 * sin(a * 20.0 - r * 6.0 + 3.14159);
  return max(lineInk(s1, 0.17), lineInk(s2, 0.17));
}

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = length(p);
  vec4 ty = texture2D(uType, vUv);
  float h = 0.5, frost = 0.0, micro = ty.g;
  if (uSide == 0) {
    float e = length((p - uOval.xy) / uOval.zw);
    vec2 iu = (p - uOval.xy) / (uOval.zw * 2.0);
    float boxA = uOval.z / uOval.w;
    if (uAspect > boxA) iu.x *= boxA / uAspect; else iu.y *= uAspect / boxA;
    iu = iu / uFit.x + 0.5 + uFit.yz;
    float L = lum(iu, uLod.x), Lb = lum(iu, uLod.y);
    float t = clamp((uLevels.y - L) / (uLevels.y - uLevels.x), 0.0, 1.0);
    // toward the oval's edge the lines grow heavier until they close up into the polished field,
    // so the portrait dissolves the way an engraved vignette does, instead of ending in a pale oval
    t = max(t, smoothstep(0.6, 1.0, e) * 0.97);
    // the frosted lands between the lines stand proud; the cut lines sit at the field's own level,
    // so at the edge of the oval everything settles into the field without a step
    float ink = engrave(p, t, Lb);
    float body = 1.0 - smoothstep(0.9, 1.0, e);
    h += body * (0.06 + 0.08 * Lb + (1.0 - ink) * 0.2);
    frost = body * (1.0 - ink);
  } else {
    float cart = 1.0 - smoothstep(0.425, 0.432, r);
    float ring = smoothstep(0.442, 0.447, r) * (1.0 - smoothstep(0.455, 0.46, r));
    float band = smoothstep(0.48, 0.5, r) * (1.0 - smoothstep(0.75, 0.77, r));
    float g = guilloche(p) * band;
    h += cart * 0.08 + ring * 0.14 + g * 0.12;
    frost = max(max(cart, ring), g);
    micro = 0.0;
  }
  h += ty.r * 0.26 - ty.b * 0.16;
  frost = max(frost, ty.r) * (1.0 - ty.b);
  gl_FragColor = vec4(h, frost, micro, 1.0);
}`;

// ---------------------------------------------------------------- the coin, shaded as metal

const COIN_VERT = /* glsl */ `
varying vec3 vLocal;
varying vec3 vWorld;
void main() {
  vLocal = position;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xyz;
  gl_Position = projectionMatrix * viewMatrix * w;
}`;

const COIN_FRAG = /* glsl */ `
precision highp float;
varying vec3 vLocal;
varying vec3 vWorld;
uniform sampler2D uFront;
uniform sampler2D uBack;
uniform mat3 uRot;        // the coin's turn (rotation only)
uniform float uMode;      // 0 Ink, 1 Light
uniform float uAmbient;   // how much of the studio is left in Light
uniform float uLampOn;
uniform vec3 uLampL;      // the lamp, in the coin's own radii
uniform float uScaleK;    // the coin's size against the one the lamp was tuned on
uniform float uTexel;
uniform vec3 uMetal;
uniform float uDim;       // stepped back, while another is looked at in Light
const float RF = ${RF}, RB = ${RB}, RT = ${RT}, HT = ${HT}, FZ = ${FZ};

// a softbox in the room: a rectangle of light round direction c, softened by the roughness
float box(vec3 d, vec3 c, vec3 u, vec2 size, float soft) {
  float z = dot(d, c);
  if (z <= 0.0) return 0.0;
  vec3 v = cross(c, u);
  vec2 q = abs(vec2(dot(d, u), dot(d, v)) / z);
  vec2 e = 1.0 - smoothstep(size - soft, size + soft, q);
  return e.x * e.y * (size.x * size.y) / ((size.x + soft) * (size.y + soft));
}
// The studio, lit the way proof coins are photographed: the camera sits in a dark card, so the
// mirror field reflects near black, and the lights stand off to the sides and above, where only
// the rim, the bevels and the frosted relief can see them. Frosted metal sees the lights blurred
// into a broad glow, so the portrait and the type come up white on a dark field.
const vec3 TOP = vec3(0.0, 0.75, 0.66), LEFT = vec3(-0.85, 0.25, 0.46), RIGHT = vec3(0.86, 0.05, 0.5);
vec3 env(vec3 d, vec3 n, float rough) {
  float s = 0.015 + rough * 0.9;
  vec3 col = vec3(mix(0.03, 0.1, smoothstep(-0.6, 0.8, d.y)));
  // the card round the lens: a soft grey, lighter toward its top, so the field reads as silver
  col += (0.14 + 0.28 * smoothstep(-0.35, 0.45, d.y)) * box(d, vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), vec2(0.55, 0.55), 0.35);
  col += 1.6 * box(d, normalize(TOP), vec3(1.0, 0.0, 0.0), vec2(0.9, 0.35), s);
  col += 2.0 * box(d, normalize(LEFT), normalize(vec3(0.47, 0.0, 0.88)), vec2(0.08, 0.7), s);
  col += 0.9 * box(d, normalize(RIGHT), normalize(vec3(-0.5, 0.0, 0.87)), vec2(0.07, 0.6), s);
  vec3 glow = vec3(0.08 + 0.7 * max(dot(n, normalize(TOP)), 0.0) + 0.5 * max(dot(n, normalize(LEFT)), 0.0) + 0.25 * max(dot(n, normalize(RIGHT)), 0.0));
  return mix(col, glow, smoothstep(0.12, 0.42, rough));
}
float relief(vec4 t, float mw) { return t.r - t.b * mw; }

void main() {
  vec3 lp = vLocal;
  float r = length(lp.xy);
  float sz = lp.z >= 0.0 ? 1.0 : -1.0;
  bool front = lp.z >= 0.0;
  vec2 radial = r > 1e-5 ? lp.xy / r : vec2(1.0, 0.0);

  // the face maps, sampled in uniform control flow so their filtering stays defined
  vec2 uvF = lp.xy * 0.5 + 0.5;
  vec2 uvB = vec2(0.5 - lp.x * 0.5, 0.5 + lp.y * 0.5);
  vec2 uv = front ? uvF : uvB;
  float du = max(uTexel, max(length(dFdx(uv)), length(dFdy(uv))) * 0.75);
  vec4 cF = texture2D(uFront, uvF), cB = texture2D(uBack, uvB);
  vec4 c = front ? cF : cB;
  vec2 ox = vec2(du, 0.0), oy = vec2(0.0, du);
  vec4 l = front ? texture2D(uFront, uvF - ox) : texture2D(uBack, uvB - ox);
  vec4 rr = front ? texture2D(uFront, uvF + ox) : texture2D(uBack, uvB + ox);
  vec4 d = front ? texture2D(uFront, uvF - oy) : texture2D(uBack, uvB - oy);
  vec4 u = front ? texture2D(uFront, uvF + oy) : texture2D(uBack, uvB + oy);
  vec4 blur = front ? textureLod(uFront, uvF, 4.5) : textureLod(uBack, uvB, 4.5);

  vec3 n;
  float rough = 0.08, ao = 1.0, frost = 0.0;
  if (r < RF && abs(lp.z) < FZ + 0.004) {
    // the microtext is cut so shallow that only a raking light finds it
    float mw = 0.1 * mix(0.15, 1.0, uMode);
    float sx = front ? 0.5 : -0.5;
    float hx = (relief(rr, mw) - relief(l, mw)) / (2.0 * du) * sx;
    float hy = (relief(u, mw) - relief(d, mw)) / (2.0 * du) * 0.5;
    const float K = 0.016;
    // the field is struck very slightly dished, so its reflections drift as the coin turns
    n = normalize(vec3(vec2(-hx, -hy) * K - radial * r * 0.05, sz));
    frost = clamp(c.g + c.b * uMode * 0.9, 0.0, 1.0);
    rough = mix(0.05, 0.45, frost);
    float cav = clamp((relief(blur, mw) - relief(c, mw)) * 5.0, 0.0, 1.0);
    ao = 1.0 - cav * 0.6;
  } else if (r < RB && abs(lp.z) < HT + 0.002) {
    n = normalize(vec3(-radial * 0.014, sz * 0.025));
    rough = 0.07;
  } else if (r < RT) {
    n = normalize(vec3(radial * 0.01 * sin(r * 2400.0), sz));
    rough = 0.09;
  } else if (abs(lp.z) > HT - 0.012) {
    float a = clamp((r - RT) / (1.0 - RT), 0.0, 1.0);
    n = normalize(vec3(radial * a, sz * (1.0 - a) + 1e-4));
    rough = 0.1;
  } else {
    float w = sin(atan(lp.y, lp.x) * 150.0);
    vec2 tang = vec2(-radial.y, radial.x);
    n = normalize(vec3(radial + tang * 0.45 * sign(w) * sqrt(abs(w)), 0.0));
    rough = 0.2;
  }

  vec3 N = normalize(uRot * n);
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 F0 = uMetal;
  float NoV = max(dot(N, V), 1e-3);
  vec3 Fv = F0 + (1.0 - F0) * pow(1.0 - NoV, 5.0);
  float envI = mix(1.0, uAmbient, uMode);
  vec3 col = Fv * env(reflect(-V, N), N, rough) * envI * ao;

  // the lamp: a small warm light held low, shaded with GGX, measured in the coin's own radii
  vec3 Lloc = uLampL - lp;
  float dist = length(Lloc) * uScaleK;
  vec3 L = normalize(uRot * Lloc);
  vec3 H = normalize(L + V);
  float NoL = max(dot(N, L), 0.0), NoH = max(dot(N, H), 0.0), VoH = max(dot(V, H), 0.0);
  float a2 = pow(rough * rough, 2.0);
  float D = a2 / (3.14159 * pow(NoH * NoH * (a2 - 1.0) + 1.0, 2.0));
  float k = (rough + 1.0) * (rough + 1.0) / 8.0;
  float G = (NoL / (NoL * (1.0 - k) + k)) * (NoV / (NoV * (1.0 - k) + k));
  vec3 FL = F0 + (1.0 - F0) * pow(1.0 - VoH, 5.0);
  vec3 spec = D * G * FL / (4.0 * NoV * max(NoL, 1e-3) + 1e-4);
  float atten = uLampOn * uMode * 4.5 / (1.0 + dist * dist * 14.0);
  // frosted silver scatters a near light almost as paper does; that scatter is what shows the
  // relief, line by line, as the lamp passes
  vec3 scatter = F0 * 0.97 * frost * NoL;
  col += (spec * NoL + scatter) * atten * vec3(1.0, 0.86, 0.68) * ao;
  col *= 1.0 - uDim * uMode * 0.6;

  col = 1.0 - exp(-col * 1.15);
  gl_FragColor = vec4(pow(col, vec3(1.0 / 2.2)), 1.0);
}`;

// The ground behind the coin held up close. In Ink it is the page, with only the coin's soft
// shadow from a softbox above and to the left. In Light it is a dark room: the lamp's pool, and
// the coin's shadow thrown from the lamp.
const GROUND_VERT = /* glsl */ `
varying vec3 vWorld;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const GROUND_FRAG = /* glsl */ `
precision highp float;
varying vec3 vWorld;
uniform float uMode;
uniform float uLampOn;
uniform float uFade;
uniform vec3 uLamp;
uniform vec3 uCoinC;
uniform vec3 uCoinN;
uniform vec3 uKey;
float coinShadow(vec3 S, float size) {
  vec3 dir = vWorld - S;
  float den = dot(dir, uCoinN);
  if (abs(den) < 1e-5) return 0.0;
  float t = dot(uCoinC - S, uCoinN) / den;
  if (t <= 0.0 || t >= 1.0) return 0.0;
  float dd = length(S + dir * t - uCoinC);
  float w = clamp(size * (1.0 - t) / t, 0.015, 0.9);
  return 1.0 - smoothstep(1.0 - w, 1.0 + w, dd);
}
void main() {
  float inkShadow = coinShadow(uCoinC + uKey, 2.4) * 0.13;
  float dl = length(vWorld - uLamp);
  float pool = uLampOn * 0.5 / (1.0 + dl * dl * 1.1);
  float lampShadow = coinShadow(uLamp, 0.1) * uLampOn;
  vec3 room = vec3(0.043, 0.055, 0.082) + vec3(1.0, 0.8, 0.58) * pool * (1.0 - lampShadow * 0.9);
  gl_FragColor = vec4(room * uMode, mix(inkShadow, 1.0, uMode)) * uFade;
}`;

// ---------------------------------------------------------------- type, set on a canvas

// r: raised (frosted) type and beads; g: the microtext; b: type cut into the metal
function arcText(x, text, { r, font, where, fill, spacing = 0 }) {
  x.save();
  x.font = font;
  x.fillStyle = fill;
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  const chars = [...text];
  const ws = chars.map((ch) => x.measureText(ch).width);
  const total = ws.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  const C = x.canvas.width / 2;
  let s = -total / 2;
  chars.forEach((ch, i) => {
    const mid = s + ws[i] / 2;
    const ang = where === 'top' ? -Math.PI / 2 + mid / r : Math.PI / 2 - mid / r;
    x.save();
    x.translate(C + r * Math.cos(ang), C + r * Math.sin(ang));
    x.rotate(where === 'top' ? ang + Math.PI / 2 : ang - Math.PI / 2);
    x.fillText(ch, 0, 0);
    x.restore();
    s += ws[i] + spacing;
  });
  x.restore();
}

// a whole ring of text, repeated until it closes on itself
function ringText(x, text, r, font, fill) {
  x.save();
  x.font = font;
  x.fillStyle = fill;
  x.textAlign = 'center';
  x.textBaseline = 'alphabetic';
  const circ = TAU * r;
  const reps = Math.max(1, Math.floor(circ / x.measureText(text).width));
  const chars = [...text.repeat(reps)];
  const ws = chars.map((ch) => x.measureText(ch).width);
  const extra = (circ - ws.reduce((a, b) => a + b, 0)) / chars.length;
  const C = x.canvas.width / 2;
  let s = 0;
  chars.forEach((ch, i) => {
    const ang = -Math.PI / 2 + (s + ws[i] / 2) / r;
    x.save();
    x.translate(C + r * Math.cos(ang), C + r * Math.sin(ang));
    x.rotate(ang + Math.PI / 2);
    x.fillText(ch, 0, 0);
    x.restore();
    s += ws[i] + extra;
  });
  x.restore();
}

function wrap(x, text, max) {
  const lines = [];
  let line = '';
  text.split(/\s+/).forEach((w) => {
    const next = line ? `${line} ${w}` : w;
    if (line && x.measureText(next).width > max) { lines.push(line); line = w; } else line = next;
  });
  if (line) lines.push(line);
  return lines;
}

function faceType(side, data, { size, micro }) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const x = c.getContext('2d');
  x.fillStyle = '#000';
  x.fillRect(0, 0, size, size);
  x.globalCompositeOperation = 'lighter';
  const C = size / 2, U = size / 2;
  const RAISED = 'rgb(255,0,0)', MICROC = 'rgb(0,255,0)', CUT = 'rgb(0,0,255)';

  // the beaded border, just inside the rim
  x.fillStyle = RAISED;
  const nb = 168;
  for (let i = 0; i < nb; i++) {
    const a = (i / nb) * TAU;
    x.beginPath();
    x.arc(C + 0.877 * U * Math.cos(a), C + 0.877 * U * Math.sin(a), 0.0062 * U, 0, TAU);
    x.fill();
  }

  const legend = (text, where) => arcText(x, text, {
    r: (where === 'top' ? 0.79 : 0.85) * U,
    font: `600 ${Math.round((where === 'top' ? 0.084 : 0.078) * U)}px ${SERIF}`,
    where, fill: RAISED, spacing: 0.004 * U,
  });
  if (side === 'front') {
    legend(data.name, 'top');
    if (data.since) legend(`·  ${data.since}  ·`, 'bottom');
    else if (data.legend) legend(data.legend, 'bottom'); // no year to strike: a word in its place
    // the seven answers, one ring each, the first (the most public) outermost
    if (micro) {
      const w = (MICRO.out - MICRO.in) / MICRO.rings;
      (data.answers || []).slice(0, MICRO.rings).forEach((a, k) => {
        if (!a) return;
        const r = (MICRO.out - (k + 1) * w + w * 0.2) * U;
        ringText(x, `${ROMAN[k]}  ${a}  ·  `, r, `${Math.round(w * U * 0.78)}px ${MONO}`, MICROC);
      });
    }
  } else {
    legend(data.backTop || 'Before', 'top');
    legend(data.backBottom || 'Metamorph', 'bottom');
    // who they were, cut into the cartouche
    const fs = Math.round(0.088 * U);
    x.font = `italic 500 ${fs}px ${SERIF}`;
    const lines = wrap(x, data.before || '', 0.7 * U);
    const lh = fs * 1.12;
    x.fillStyle = CUT;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    lines.forEach((ln, i) => x.fillText(ln, C, C + (i - (lines.length - 1) / 2) * lh));
  }

  // round the edges of everything a touch, so the metal has a shoulder to catch light on
  const out = document.createElement('canvas');
  out.width = out.height = size;
  const o = out.getContext('2d');
  o.filter = `blur(${Math.max(0.3, (0.8 * size) / 2048)}px)`;
  o.drawImage(c, 0, 0);
  const t = new THREE.CanvasTexture(out);
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

// the darkest and lightest tones worth engraving in a photograph
function levelsOf(img) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
  const w = 64, h = Math.max(1, Math.round((64 * ih) / iw));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, w, h);
  const d = x.getImageData(0, 0, w, h).data;
  const L = [];
  for (let i = 0; i < d.length; i += 4) L.push((0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255);
  L.sort((a, b) => a - b);
  return new THREE.Vector2(L[Math.floor(L.length * 0.02)], L[Math.floor(L.length * 0.985)]);
}

// ---------------------------------------------------------------- shared parts

// What a coin needs to know about a person. Advisors have no answers, and their "before" is what
// they did previously.
export function coinOf(p, answers = p.answers) {
  return {
    name: p.name,
    since: p.since,
    before: p.before || p.previously || '',
    answers: answers || [],
    look: p.look || {},
    photo: p.photo || null,
    metal: p.metal || 'silver',
    // a coin struck for a page of its own (the About page's founders) can say other words
    legend: p.legend || '',
    backTop: p.backTop || '',
    backBottom: p.backBottom || '',
  };
}

let GEO = null;
export function coinGeometry() {
  if (GEO) return GEO;
  const profile = [[0, FZ], [RF, FZ], [RB, HT], [RT, HT], [1, HT - 0.012], [1, -(HT - 0.012)], [RT, -HT], [RB, -HT], [RF, -FZ], [0, -FZ]]
    .map(([a, b]) => new THREE.Vector2(a, b));
  GEO = new THREE.LatheGeometry(profile, 256);
  GEO.rotateX(Math.PI / 2);
  return GEO;
}

// Many coins can share one Ink and Light, one lamp switch and one room: pass those uniforms in.
export function coinMaterial({ front, back, metal = 'silver', size = 2048, shared = {} }) {
  return new THREE.ShaderMaterial({
    vertexShader: COIN_VERT,
    fragmentShader: COIN_FRAG,
    side: THREE.DoubleSide,
    uniforms: {
      uFront: { value: front },
      uBack: { value: back },
      uRot: { value: new THREE.Matrix3() },
      uMode: shared.uMode || { value: 0 },
      uAmbient: shared.uAmbient || { value: 0.012 },
      uLampOn: shared.uLampOn || { value: 0 },
      uLampL: { value: new THREE.Vector3(0, 0, LAMP_Z) },
      uScaleK: { value: 1 },
      uTexel: { value: 1 / size },
      uMetal: { value: METAL[metal] || METAL.silver },
      uDim: { value: 0 },
    },
  });
}

// each frame, after the coin has moved: its turn, and where the lamp is from the coin's own point
// of view, in its own radii. scaleK is the coin's radius against the one the lamp was tuned on.
const _m4 = new THREE.Matrix4(), _sc = new THREE.Vector3();
export function placeLamp(mesh, lampWorld, scaleK = 1) {
  const U = mesh.material.uniforms;
  _sc.setFromMatrixScale(mesh.matrixWorld);
  U.uRot.value.setFromMatrix4(mesh.matrixWorld).multiplyScalar(1 / _sc.x);
  _m4.copy(mesh.matrixWorld).invert();
  U.uLampL.value.copy(lampWorld).applyMatrix4(_m4);
  U.uScaleK.value = scaleK;
}

// Bakes faces for one renderer. The portrait is a photograph if the person has one, otherwise
// their placeholder sitter.
export function createBaker(renderer) {
  const quadScene = new THREE.Scene();
  const quadCam = new THREE.Camera();
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2));
  quad.frustumCulled = false;
  quadScene.add(quad);
  const pass = (material, target) => {
    const prev = renderer.getRenderTarget();
    const scissor = renderer.getScissorTest();
    renderer.setScissorTest(false);
    quad.material = material;
    renderer.setRenderTarget(target);
    renderer.render(quadScene, quadCam);
    renderer.setRenderTarget(prev);
    renderer.setScissorTest(scissor);
  };
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const mipTarget = (w, h) => {
    const t = new THREE.WebGLRenderTarget(w, h, { generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false });
    t.texture.anisotropy = aniso;
    return t;
  };

  const sitterMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: SITTER_FRAG,
    uniforms: {
      uAspect: { value: 0.8 },
      uHair: { value: 0 }, uTurn: { value: 0.28 }, uRoll: { value: 0 },
      uShoulders: { value: 1 }, uSkin: { value: 0.74 }, uSuit: { value: 0.26 },
    },
  });
  const bakeMat = new THREE.ShaderMaterial({
    vertexShader: QUAD_VERT,
    fragmentShader: BAKE_FRAG,
    uniforms: {
      uSide: { value: 0 },
      uPortrait: { value: null },
      uAspect: { value: 0.8 },
      uLevels: { value: new THREE.Vector2(0.06, 0.93) },
      uLod: { value: new THREE.Vector2(1, 4.3) },
      uOval: { value: OVAL },
      uFit: { value: new THREE.Vector3(1, 0, 0) },
      uType: { value: null },
    },
  });

  function sitter(look = {}, w = 640, h = 800) {
    const U = sitterMat.uniforms;
    const tilt = look.tilt ?? 0;
    U.uHair.value = look.hair ?? 0;
    U.uTurn.value = tilt < 0 ? -0.24 : 0.3;
    U.uRoll.value = tilt * 2.5;
    U.uShoulders.value = look.shoulders ?? 1;
    U.uSkin.value = Math.min(0.86, Math.max(0.5, (look.tone ?? 0.62) + 0.12));
    U.uSuit.value = look.suit ?? 0.26;
    const rt = mipTarget(w, h);
    pass(sitterMat, rt);
    return rt;
  }

  const photos = new Map();
  const loadPhoto = (src) => {
    if (!photos.has(src)) {
      photos.set(src, new Promise((res, rej) => { const img = new Image(); img.onload = () => res(img); img.onerror = rej; img.src = src; }));
    }
    return photos.get(src);
  };

  // targets can be passed in to bake over an old coin's faces
  async function bake(data, { size = 2048, micro = true, front, back, sides = [0, 1] } = {}) {
    const U = bakeMat.uniforms;
    let img = data.photoImage || null;
    if (!img && data.photo) { try { img = await loadPhoto(data.photo); } catch (e) { img = null; } }
    let portrait, sitterRT = null;
    if (img) {
      portrait = new THREE.Texture(img);
      portrait.needsUpdate = true;
      portrait.anisotropy = 4;
      const ih = img.naturalHeight || img.height;
      U.uAspect.value = (img.naturalWidth || img.width) / ih;
      U.uLevels.value.copy(levelsOf(img));
      U.uLod.value.set(Math.max(0, Math.log2(ih / (size >= 1024 ? 420 : 210))), Math.max(0, Math.log2(ih / 40)));
    } else {
      const w = size >= 1024 ? 640 : 320, h = w * 1.25;
      sitterRT = sitter(data.look, w, h);
      portrait = sitterRT.texture;
      U.uAspect.value = 0.8;
      U.uLevels.value.set(0.06, 0.93);
      U.uLod.value.set(Math.max(0, Math.log2(h / 400)), Math.log2(h / 40));
    }
    U.uPortrait.value = portrait;
    front = front || mipTarget(size, size);
    back = back || mipTarget(size, size);
    sides.forEach((side) => {
      const t = faceType(side === 0 ? 'front' : 'back', data, { size, micro });
      U.uSide.value = side;
      U.uType.value = t;
      pass(bakeMat, side === 0 ? front : back);
      t.dispose();
    });
    sitterRT?.dispose();
    if (img) portrait.dispose();
    return { front, back };
  }

  return { bake, sitter, mipTarget, pass };
}

// ---------------------------------------------------------------- one coin, held up close

export function createCoin(canvas, { person, answers, reduced = false, size = 2048, onRing = () => {}, onSide = () => {}, onReady = () => {} } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  const baker = createBaker(renderer);
  const SIZE = size; // a phone can take its faces at half the size
  const maps = { front: baker.mipTarget(SIZE, SIZE), back: baker.mipTarget(SIZE, SIZE) };

  // the scene
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(16, 1, 0.1, 100);
  const mat = coinMaterial({ front: maps.front.texture, back: maps.back.texture, size: SIZE });
  const U = mat.uniforms;
  const coin = new THREE.Mesh(coinGeometry(), mat);
  const hold = new THREE.Group(); // the hand: tilt, lift, float
  hold.add(coin);
  scene.add(hold);
  const lamp = new THREE.Vector3(0, 0, LAMP_Z);

  const G = {
    uMode: U.uMode,
    uLampOn: U.uLampOn,
    uFade: { value: 1 },
    uLamp: { value: lamp },
    uCoinC: { value: new THREE.Vector3() },
    uCoinN: { value: new THREE.Vector3(0, 0, 1) },
    uKey: { value: new THREE.Vector3(-1.6, 3.2, 10) },
  };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), new THREE.ShaderMaterial({ vertexShader: GROUND_VERT, fragmentShader: GROUND_FRAG, uniforms: G, transparent: true, depthWrite: false }));
  ground.position.z = -0.9;
  ground.renderOrder = -1;
  scene.add(ground);

  // ---------------------------------------------------------------- layout

  const view = { W: 1, H: 1, cx: 0, cy: 0, r: 100 };
  function layout({ W, H, cx, cy, r }) {
    if (W !== view.W || H !== view.H) renderer.setSize(W, H, false);
    Object.assign(view, { W, H, cx, cy, r });
    camera.aspect = W / H;
    const D = H / 2 / (r * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    camera.position.set(0, 0, D);
    camera.lookAt(0, 0, 0);
    camera.near = Math.max(0.1, D - 6);
    camera.far = D + 8;
    camera.setViewOffset(W, H, W / 2 - cx, H / 2 - cy, W, H);
    camera.updateProjectionMatrix();
  }

  // ---------------------------------------------------------------- state

  const state = { rot: 0, lift: 0, enter: 1 };
  const tilt = { x: 0, y: 0 }, tiltT = { x: 0, y: 0 };
  let mode = 'ink';
  let side = 0, ring = -1;
  let pointerIn = false;
  let running = true;

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function aim(e) {
    const rect = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return rect;
  }
  // where on the coin the pointer is: which face, and how far out
  function probe(e) {
    aim(e);
    const hit = ray.intersectObject(coin, false)[0];
    if (!hit) return null;
    const p = coin.worldToLocal(hit.point.clone());
    return { face: p.z >= 0 ? 0 : 1, r: Math.hypot(p.x, p.y), onFace: Math.abs(p.z) > FZ - 0.012 };
  }

  function setRing(k) {
    if (k === ring) return;
    ring = k;
    onRing(k);
  }

  function onMove(e) {
    if (!running || view.W < 2) return;
    pointerIn = true;
    const rect = aim(e);
    // the lamp sits under the pointer, held a little above the coin
    const o = ray.ray.origin, dir = ray.ray.direction;
    const t = (LAMP_Z - o.z) / dir.z;
    lamp.set(o.x + dir.x * t, o.y + dir.y * t, LAMP_Z);
    // the coin turns a little toward you
    const k = mode === 'light' ? 0.25 : 1;
    tiltT.y = ((e.clientX - rect.left - view.cx) / view.W) * 0.55 * k;
    tiltT.x = ((e.clientY - rect.top - view.cy) / view.H) * 0.45 * k;
    // which ring of answers the lamp is over
    const p = probe(e);
    if (mode === 'light' && p && p.onFace && p.face === 0 && p.r <= MICRO.out && p.r >= MICRO.in) {
      setRing(Math.min(MICRO.rings - 1, Math.floor((MICRO.out - p.r) / ((MICRO.out - MICRO.in) / MICRO.rings))));
    } else setRing(-1);
    if (!drag) canvas.style.cursor = p ? 'grab' : '';
  }
  addEventListener('pointermove', onMove, { passive: true });
  const onLeave = () => { pointerIn = false; tiltT.x = tiltT.y = 0; setRing(-1); };
  document.addEventListener('pointerleave', onLeave);

  // ---------------------------------------------------------------- turning it over

  function flip(dir = 1) {
    gsap.killTweensOf(state);
    const to = (Math.round(state.rot / Math.PI) + dir) * Math.PI;
    const d = reduced ? 0.01 : 0.95;
    gsap.to(state, { rot: to, duration: d, ease: 'power2.inOut' });
    gsap.fromTo(state, { lift: 0 }, { lift: 1, duration: d / 2, ease: 'sine.out', yoyo: true, repeat: 1 });
  }

  let drag = null;
  canvas.addEventListener('pointerdown', (e) => {
    if (!running) return;
    if (mode === 'light' && e.pointerType === 'touch') return; // on a phone, a finger in Light is the lamp
    if (!probe(e)) return;
    gsap.killTweensOf(state);
    state.lift = 0;
    drag = { id: e.pointerId, x0: e.clientX, rot0: state.rot, moved: false, lx: e.clientX, lt: performance.now(), v: 0 };
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    if (Math.abs(dx) > 5) drag.moved = true;
    state.rot = drag.rot0 + (dx / (view.r * 2)) * Math.PI;
    const now = performance.now();
    drag.v = (e.clientX - drag.lx) / Math.max(1, now - drag.lt);
    drag.lx = e.clientX; drag.lt = now;
  });
  const release = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    canvas.style.cursor = 'grab';
    if (!d.moved) { flip(); return; }
    // carry the throw a little, then settle on whichever face is up
    const thrown = state.rot + ((d.v * 260) / (view.r * 2)) * Math.PI;
    gsap.to(state, { rot: Math.round(thrown / Math.PI) * Math.PI, duration: reduced ? 0.01 : 0.7, ease: 'power3.out' });
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);

  // ---------------------------------------------------------------- Ink and Light

  function setMode(m, { instant = false } = {}) {
    mode = m;
    gsap.to(U.uMode, { value: m === 'light' ? 1 : 0, duration: reduced || instant ? 0.01 : 1.2, ease: 'power2.inOut' });
    canvas.style.touchAction = m === 'light' ? 'none' : 'pan-y';
    if (m !== 'light') setRing(-1);
  }

  // ---------------------------------------------------------------- who is on it

  let data = null;
  async function setPerson(p, ans) {
    data = coinOf(p, ans);
    U.uMetal.value = METAL[data.metal] || METAL.silver;
    await baker.bake(data, { size: SIZE, micro: true, front: maps.front, back: maps.back });
    side = 0;
    onReady();
  }
  // a photograph instead of the placeholder (the test page's drop)
  function setPortrait(img) {
    if (!data) return;
    baker.bake({ ...data, photoImage: img }, { size: SIZE, micro: true, front: maps.front, back: maps.back, sides: [0] });
  }

  // ---------------------------------------------------------------- the frame

  let last = performance.now();
  const t0 = last;
  let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;
    const k = 1 - Math.exp(-dt * 3.2);
    tilt.x += (tiltT.x - tilt.x) * k;
    tilt.y += (tiltT.y - tilt.y) * k;
    const floatK = reduced ? 0 : 1 - U.uMode.value * 0.7;
    hold.rotation.set(tilt.x + Math.sin(t * 0.53) * 0.02 * floatK, tilt.y + Math.sin(t * 0.37) * 0.03 * floatK, 0);
    hold.position.set(0, Math.sin(t * 0.8) * 0.012 * floatK, state.lift * 0.45 - (1 - state.enter) * 0.7);
    coin.rotation.y = state.rot;
    scene.updateMatrixWorld();
    placeLamp(coin, lamp, 1);
    G.uCoinC.value.setFromMatrixPosition(coin.matrixWorld);
    G.uCoinN.value.set(0, 0, 1).applyMatrix3(U.uRot.value).normalize();
    // the lamp only burns while there is a pointer to hold it
    U.uLampOn.value += ((pointerIn ? 1 : 0) - U.uLampOn.value) * (1 - Math.exp(-dt * 6));

    const s = ((Math.round(state.rot / Math.PI) % 2) + 2) % 2;
    if (s !== side) { side = s; onSide(s === 0 ? 'front' : 'back'); }

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  // it arrives turning, from the depth, and settles facing you
  function arrive() {
    if (reduced) return;
    gsap.fromTo(state, { enter: 0, rot: -TAU }, { enter: 1, rot: 0, duration: 1.9, ease: 'power3.out' });
  }

  if (person) setPerson(person, answers);

  return {
    layout, flip, setMode, setPerson, setPortrait, arrive,
    // the team section hands a coin over mid-turn, and takes it back
    setRot(r) { gsap.killTweensOf(state); Object.assign(state, { rot: r, lift: 0, enter: 1 }); side = ((Math.round(r / Math.PI) % 2) + 2) % 2; },
    setGround(a) { G.uFade.value = a; },
    // where the pointer already is, so the lamp is lit the moment the coin is handed over
    point(x, y) { onMove({ clientX: x, clientY: y }); },
    pause() { running = false; onLeave(); },
    resume() { running = true; last = performance.now(); },
    get side() { return side; },
    get mode() { return mode; },
    get rot() { return state.rot; },
    U, G, state, renderer, scene, camera,
    destroy() { cancelAnimationFrame(raf); removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); renderer.dispose(); },
  };
}
