// The Creative Corner's opening, a test for gallery 3 (14 Nov): the colossal hand. After the
// pedestal's own logic (a statue would stand there, so a poster standing there says it is precious),
// one step on: the statue itself holds the piece. A giant marble forearm rises from below the frame
// (where the pedestal's column ran), the wrist bent back, the left hand open, palm up, fingers a
// little curled and turned towards you on the right; the day's piece stands in its palm. Pale marble
// against a deep blue plaster wall, one warm narrow light, the arm falling away into the dark below,
// as the pedestal is pale stone against deep red velvet: the support is carved work, worth half the
// attention. Scrolling lifts the piece off and sets the week's, then the month's, down in the palm.
//
// The hand is sculpted in code from smooth rounded forms (the palm and its hollow, the mounds at its
// foot, three tapering segments and a pad to a finger, the thumb, the wrist into a flattened
// forearm), made into a mesh once on load (surface nets, each point drawn back onto the form, its
// normal from the form itself, its hollows darkened by how enclosed they are; about 1.2s), then
// shaded as statuary marble. A plain tapered column carries the forearm on below the frame.
//
// Not on the page: creative.html shows it in the pedestal's place with ?hand (COLOSSUS in corner.js).
import * as THREE from '../assets/vendor/three.module.min.js';
import { BARS } from './corner-museum.js';

const { gsap } = window;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------------------------------------------------------------- noise (for the break)
const PERM = (() => {
  const r = rnd(41), p = [...Array(256).keys()];
  for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  return Uint8Array.from([...p, ...p]);
})();
const fade = (t) => t * t * t * (t * (t * 6 - 15) + 10);
const grad = (h, x, y, z) => { h &= 15; const u = h < 8 ? x : y, v = h < 4 ? y : h === 12 || h === 14 ? x : z; return ((h & 1) ? -u : u) + ((h & 2) ? -v : v); };
function noise(x, y, z) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z), P = PERM;
  const A = P[X] + Y, AA = P[A] + Z, AB = P[A + 1] + Z, B = P[X + 1] + Y, BA = P[B] + Z, BB = P[B + 1] + Z;
  return lerp(
    lerp(lerp(grad(P[AA], x, y, z), grad(P[BA], x - 1, y, z), u), lerp(grad(P[AB], x, y - 1, z), grad(P[BB], x - 1, y - 1, z), u), v),
    lerp(lerp(grad(P[AA + 1], x, y, z - 1), grad(P[BA + 1], x - 1, y, z - 1), u), lerp(grad(P[AB + 1], x, y - 1, z - 1), grad(P[BB + 1], x - 1, y - 1, z - 1), u), v), w);
}
const fbm = (x, y, z, o = 3) => { let s = 0, a = 0.5; for (let i = 0; i < o; i++) { s += a * noise(x, y, z); x = x * 2.03 + 1.7; y = y * 2.03 + 9.2; z = z * 2.03 + 3.4; a *= 0.5; } return s; };

// ---------------------------------------------------------------- the forms
// in the hand's own space, metres: x runs from the wrist to the fingertips, y up out of the palm
// (the back of the hand lies at y 0), z across it; the thumb is on the far side (z < 0)
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const smax = (a, b, k) => -smin(-a, -b, k);
// a capsule that tapers from r1 at a to r2 at b (Inigo Quilez's round cone), set up once
function cone(a, b, r1, r2) {
  const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], l2 = bx * bx + by * by + bz * bz, rr = r1 - r2;
  return { ax: a[0], ay: a[1], az: a[2], bx, by, bz, l2, rr, a2: l2 - rr * rr, il2: 1 / l2, r1, r2 };
}
function rc(px, py, pz, s) {
  const pax = px - s.ax, pay = py - s.ay, paz = pz - s.az;
  const y = pax * s.bx + pay * s.by + paz * s.bz, z = y - s.l2;
  const xx = pax * s.l2 - s.bx * y, xy = pay * s.l2 - s.by * y, xz = paz * s.l2 - s.bz * y;
  const x2 = xx * xx + xy * xy + xz * xz, y2 = y * y * s.l2, z2 = z * z * s.l2;
  const k = Math.sign(s.rr) * s.rr * s.rr * x2;
  if (Math.sign(z) * s.a2 * z2 > k) return Math.sqrt(x2 + z2) * s.il2 - s.r2;
  if (Math.sign(y) * s.a2 * y2 < k) return Math.sqrt(x2 + y2) * s.il2 - s.r1;
  return (Math.sqrt(x2 * s.a2 * s.il2) + y * s.rr) * s.il2 - s.r1;
}
function ell(px, py, pz, cx, cy, cz, rx, ry, rz) {
  const x = px - cx, y = py - cy, z = pz - cz;
  const k0 = Math.hypot(x / rx, y / ry, z / rz), k1 = Math.hypot(x / (rx * rx), y / (ry * ry), z / (rz * rz));
  return k1 ? (k0 * (k0 - 1)) / k1 : -Math.min(rx, ry, rz);
}
function rbox(px, py, pz, cx, cy, cz, hx, hy, hz, r) {
  const qx = Math.abs(px - cx) - hx + r, qy = Math.abs(py - cy) - hy + r, qz = Math.abs(pz - cz) - hz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
}

// the four fingers: where each knuckle sits, its splay, its three lengths, its radii, how far each
// joint is bent towards the palm (a hand at rest curls more towards the little finger)
// (an open hand, offering: the fingers only a little curled)
const FINGERS = [
  { x: 0.74, z: -0.2, s: -0.08, L: [0.31, 0.2, 0.16], r: [0.07, 0.062, 0.055, 0.044], f: [0.06, 0.18, 0.14] },
  { x: 0.76, z: -0.066, s: -0.02, L: [0.34, 0.22, 0.17], r: [0.073, 0.065, 0.058, 0.046], f: [0.08, 0.22, 0.16] },
  { x: 0.73, z: 0.07, s: 0.05, L: [0.32, 0.21, 0.165], r: [0.07, 0.062, 0.055, 0.044], f: [0.11, 0.27, 0.19] },
  { x: 0.67, z: 0.195, s: 0.13, L: [0.25, 0.16, 0.14], r: [0.061, 0.054, 0.048, 0.039], f: [0.16, 0.34, 0.24] },
];
const KNUCKLE_Y = 0.125;
// each finger as three tapering segments, and under each a fleshy pad on the palm's side
const FINGER_SEGS = FINGERS.map((F) => {
  const dx = Math.cos(F.s), dz = Math.sin(F.s);
  let p = [F.x, KNUCKLE_Y, F.z], bend = 0;
  return F.L.map((L, i) => {
    bend += F.f[i];
    const ux = dx * Math.cos(bend), uy = Math.sin(bend), uz = dz * Math.cos(bend);
    const q = [p[0] + ux * L, p[1] + uy * L, p[2] + uz * L];
    const s = cone(p, q, F.r[i], F.r[i + 1]);
    // (the pad: a shorter, slimmer segment set towards the palm's side, from a little after the joint)
    const ny = Math.cos(bend), nx = -dx * Math.sin(bend), nz = -dz * Math.sin(bend);
    const o = F.r[i] * 0.32, a0 = 0.22, a1 = i === 2 ? 0.86 : 0.74;
    const pad = cone([p[0] + ux * L * a0 + nx * o, p[1] + uy * L * a0 + ny * o, p[2] + uz * L * a0 + nz * o],
      [p[0] + ux * L * a1 + nx * o, p[1] + uy * L * a1 + ny * o, p[2] + uz * L * a1 + nz * o], F.r[i] * 0.78, F.r[i + 1] * 0.74);
    p = q;
    return { s, pad };
  });
});
// the thumb, along the far side of the palm, rising
const THUMB = [
  cone([0.13, 0.1, -0.19], [0.35, 0.15, -0.39], 0.1, 0.086),
  cone([0.35, 0.15, -0.39], [0.54, 0.23, -0.46], 0.086, 0.074),
  cone([0.54, 0.23, -0.46], [0.7, 0.31, -0.45], 0.074, 0.064),
];
// the forearm, rising from below with the wrist bent back so the palm faces up; the form is made only
// down to ARM_Y, and a plain tapered column carries it on down out of the frame
// (slimmer at the wrist and filling out below it; flatter seen from the side than across, by ARM_K)
const ARM_TOP = [0.03, 0.06, 0], ARM_R = 0.14, ARM_TAPER = 0.13, ARM_K = 1.22; // the radius grows by ARM_TAPER a metre down
const ARM_Y = -0.8; // (below the foot of the frame, so the join never shows)
const ARM = cone(ARM_TOP, [0.03, -0.9, 0], ARM_R, ARM_R + 0.96 * ARM_TAPER);
const cutAt = () => -99; // (no break: the arm runs out of the frame)

function handSDF(x, y, z) {
  // the palm, narrowing towards the wrist
  const taper = 0.86 + 0.16 * clamp((x - 0.08) / 0.7, 0, 1);
  let d = rbox(x, y, z / taper, 0.43, 0.12, 0, 0.35, 0.12, 0.27, 0.085) * Math.min(1, taper);
  // the mounds at its foot: the thumb's (far side) and the little finger's
  d = smin(d, ell(x, y, z, 0.24, 0.16, -0.17, 0.21, 0.1, 0.14), 0.06);
  d = smin(d, ell(x, y, z, 0.3, 0.15, 0.19, 0.23, 0.085, 0.095), 0.05);
  // its hollow
  d = smax(d, -ell(x, y, z, 0.47, 0.43, 0.01, 0.34, 0.22, 0.22), 0.07);
  // the wrist, and the forearm going down from it
  d = smin(d, rc(ARM_TOP[0] + (x - ARM_TOP[0]) * ARM_K, y, z, ARM) / ARM_K, 0.11);
  // the thumb
  let t = rc(x, y, z, THUMB[0]);
  t = smin(t, rc(x, y, z, THUMB[1]), 0.02);
  t = smin(t, rc(x, y, z, THUMB[2]), 0.015);
  d = smin(d, t, 0.05);
  // the fingers
  for (const segs of FINGER_SEGS) {
    let f = rc(x, y, z, segs[0].s);
    f = smin(f, rc(x, y, z, segs[1].s), 0.012);
    f = smin(f, rc(x, y, z, segs[2].s), 0.01);
    for (const g of segs) f = smin(f, rc(x, y, z, g.pad), 0.018);
    d = smin(d, f, 0.04);
  }
  return d;
}

// the form made into a mesh: surface nets over a grid, each point drawn back onto the form
function handGeometry() {
  const H = 0.0125;
  const X0 = -0.26, Y0 = ARM_Y, Z0 = -0.64, X1 = 1.58, Y1 = 0.5, Z1 = 0.36;
  const nx = Math.ceil((X1 - X0) / H) + 1, ny = Math.ceil((Y1 - Y0) / H) + 1, nz = Math.ceil((Z1 - Z0) / H) + 1;
  const V = new Float32Array(nx * ny * nz);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) V[i + nx * (j + ny * k)] = handSDF(X0 + i * H, Y0 + j * H, Z0 + k * H);
  const cx = nx - 1, cy = ny - 1, cz = nz - 1;
  const cell = new Int32Array(cx * cy * cz).fill(-1);
  const pos = [];
  const C = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const E = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const val = new Float32Array(8);
  for (let k = 0; k < cz; k++) for (let j = 0; j < cy; j++) for (let i = 0; i < cx; i++) {
    let inside = 0;
    for (let c = 0; c < 8; c++) { val[c] = V[(i + C[c][0]) + nx * ((j + C[c][1]) + ny * (k + C[c][2]))]; if (val[c] < 0) inside++; }
    if (inside === 0 || inside === 8) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of E) {
      const va = val[a], vb = val[b];
      if ((va < 0) === (vb < 0)) continue;
      const t = va / (va - vb);
      sx += C[a][0] + (C[b][0] - C[a][0]) * t; sy += C[a][1] + (C[b][1] - C[a][1]) * t; sz += C[a][2] + (C[b][2] - C[a][2]) * t; n++;
    }
    cell[i + cx * (j + cy * k)] = pos.length / 3;
    pos.push(X0 + (i + sx / n) * H, Y0 + (j + sy / n) * H, Z0 + (k + sz / n) * H);
  }
  const ci = (i, j, k) => cell[i + cx * (j + cy * k)];
  const tri = [];
  const quad = (a, b, c, d, flip) => { if (a < 0 || b < 0 || c < 0 || d < 0) return; if (flip) tri.push(a, c, b, a, d, c); else tri.push(a, b, c, a, c, d); };
  for (let k = 1; k < cz; k++) for (let j = 1; j < cy; j++) for (let i = 1; i < cx; i++) {
    const v0 = V[i + nx * (j + ny * k)] < 0;
    if ((V[(i + 1) + nx * (j + ny * k)] < 0) !== v0) quad(ci(i, j - 1, k - 1), ci(i, j, k - 1), ci(i, j, k), ci(i, j - 1, k), v0);
    if ((V[i + nx * ((j + 1) + ny * k)] < 0) !== v0) quad(ci(i - 1, j, k - 1), ci(i - 1, j, k), ci(i, j, k), ci(i, j, k - 1), v0);
    if ((V[i + nx * (j + ny * (k + 1))] < 0) !== v0) quad(ci(i - 1, j - 1, k), ci(i, j - 1, k), ci(i, j, k), ci(i - 1, j, k), v0);
  }
  // drawn back onto the form, with its normal and how enclosed it is
  const P = new Float32Array(pos), N = new Float32Array(pos.length), AO = new Float32Array(pos.length / 3), BRK = new Float32Array(pos.length / 3);
  const e = H * 0.3;
  const gradAt = (x, y, z) => [handSDF(x + e, y, z) - handSDF(x - e, y, z), handSDF(x, y + e, z) - handSDF(x, y - e, z), handSDF(x, y, z + e) - handSDF(x, y, z - e)];
  for (let v = 0; v < AO.length; v++) {
    let x = P[v * 3], y = P[v * 3 + 1], z = P[v * 3 + 2];
    let g = gradAt(x, y, z);
    for (let it = 0; it < 2; it++) {
      const d = handSDF(x, y, z), g2 = g[0] * g[0] + g[1] * g[1] + g[2] * g[2];
      if (g2 < 1e-12) break;
      const s = clamp((d * 2 * e) / g2, -H, H);
      x -= g[0] * s; y -= g[1] * s; z -= g[2] * s;
      g = gradAt(x, y, z);
    }
    const gl = Math.hypot(g[0], g[1], g[2]) || 1, nx2 = g[0] / gl, ny2 = g[1] / gl, nz2 = g[2] / gl;
    P[v * 3] = x; P[v * 3 + 1] = y; P[v * 3 + 2] = z;
    N[v * 3] = nx2; N[v * 3 + 1] = ny2; N[v * 3 + 2] = nz2;
    let occ = 0;
    // (only real enclosure counts: the flattened forearm's distance runs short by up to a fifth)
    for (let s = 1; s <= 5; s++) { const dd = s * 0.028; occ += Math.max(0, dd * 0.8 - handSDF(x + nx2 * dd, y + ny2 * dd, z + nz2 * dd)) / (1 << s); }
    AO[v] = clamp(1 - 2.6 * occ / 0.028, 0, 1);
    BRK[v] = smooth(0.05, 0.0, x - cutAt(y, z)) * smooth(0.2, 0.7, -nx2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('aAO', new THREE.BufferAttribute(AO, 1));
  g.setAttribute('aBreak', new THREE.BufferAttribute(BRK, 1));
  const I = P.length / 3 > 65535 ? new Uint32Array(tri) : new Uint16Array(tri);
  g.setIndex(new THREE.BufferAttribute(I, 1));
  // (one winding for all: turn it over if the first face points into the form)
  if (tri.length >= 3) {
    const a = new THREE.Vector3().fromArray(P, tri[0] * 3), b = new THREE.Vector3().fromArray(P, tri[1] * 3), c = new THREE.Vector3().fromArray(P, tri[2] * 3);
    const fn = b.sub(a).cross(c.sub(a)), vn = new THREE.Vector3().fromArray(N, tri[0] * 3);
    if (fn.dot(vn) < 0) { for (let t = 0; t < I.length; t += 3) { const s = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = s; } }
  }
  g.computeBoundingSphere();
  return g;
}

const GLSL_NOISE = /* glsl */`
vec3 hd289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 hd289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 hdPerm(vec4 x) { return hd289(((x * 34.0) + 10.0) * x); }
float hdNoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - 0.5;
  i = hd289(i);
  vec4 p = hdPerm(hdPerm(hdPerm(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  vec3 ns = 0.142857142857 * vec3(2.0, 0.5, 1.0) - vec3(0.0, 1.0, 0.0);
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 nr = 1.79284291400159 - 0.85373472095314 * vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3));
  p0 *= nr.x; p1 *= nr.y; p2 *= nr.z; p3 *= nr.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
float hdFbm(vec3 p) { float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++) { s += a * hdNoise(p); p = p * 2.03 + vec3(1.7, 9.2, 3.4); a *= 0.5; } return s; }
vec3 hdBump(vec3 pos, vec3 N, float h) {
  vec3 dpx = dFdx(pos), dpy = dFdy(pos);
  float dhx = dFdx(h), dhy = dFdy(h);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 g = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * N - g);
}
`;

// statuary marble: a warm ivory, faint clouds and the odd grey vein, the grime of centuries in its
// hollows, a fine pitting the light finds; the break paler, rougher, fresh
function marbleMat() {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.46, metalness: 0, envMapIntensity: 0.55 });
  m.customProgramCacheKey = () => 'hd-marble';
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = `attribute float aAO;\nattribute float aBreak;\nvarying float vAO;\nvarying float vBreak;\nvarying vec3 vHand;\n${sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vHand = position;\n  vAO = aAO;\n  vBreak = aBreak;')}`;
    sh.fragmentShader = `varying float vAO;\nvarying float vBreak;\nvarying vec3 vHand;\n${GLSL_NOISE}\n${sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    vec3 p = vHand;
    vec3 c = vec3(0.86, 0.82, 0.75);
    c *= 0.94 + 0.08 * hdFbm(p * 2.6) + 0.03 * hdNoise(p * 11.0);
    // a faint grey vein or two
    float vn = abs(hdFbm(p * vec3(1.6, 2.4, 1.6) + 4.0) + 0.06);
    c = mix(c, c * vec3(0.78, 0.79, 0.8), (1.0 - smoothstep(0.0, 0.012, vn)) * 0.5);
    // the grime of its hollows, warm grey
    float dirt = 1.0 - vAO;
    c = mix(c, c * vec3(0.52, 0.47, 0.42), clamp(dirt * 1.15, 0.0, 1.0));
    // the break: paler, a little cooler
    c = mix(c, vec3(0.9, 0.89, 0.86) * (0.92 + 0.1 * hdNoise(p * 30.0)), vBreak * 0.8);
    // the arm going down out of the light
    c *= 0.3 + 0.7 * smoothstep(-1.5, 0.15, p.y);
    diffuseColor.rgb = c;
  }`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = mix(roughnessFactor + 0.06 * hdNoise(vHand * 6.0), 0.92, vBreak);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = hdBump(-vViewPosition, normal, 0.00035 * hdNoise(vHand * 24.0) + 0.00012 * hdNoise(vHand * 60.0) + vBreak * (0.004 * hdNoise(vHand * 28.0) + 0.0016 * hdNoise(vHand * 80.0)));')
      .replace('#include <aomap_fragment>', '#include <aomap_fragment>\n  reflectedLight.indirectDiffuse *= 0.35 + 0.65 * vAO;\n  reflectedLight.indirectSpecular *= 0.5 + 0.5 * vAO;')}`;
  };
  return m;
}

// the plaster of the sweep behind: a deep blue, faintly mottled, as limewash is
function plasterMat(colour) {
  const m = new THREE.MeshStandardMaterial({ color: new THREE.Color(colour), roughness: 0.96, metalness: 0, envMapIntensity: 0.15 });
  m.customProgramCacheKey = () => 'hd-plaster';
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = `varying vec3 vWall;\n${sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vWall = (modelMatrix * vec4(transformed, 1.0)).xyz;')}`;
    sh.fragmentShader = `varying vec3 vWall;\n${GLSL_NOISE}\n${sh.fragmentShader
      .replace('#include <color_fragment>', '#include <color_fragment>\n  diffuseColor.rgb *= (0.86 + 0.16 * hdFbm(vWall * 0.9) + 0.06 * hdNoise(vWall * 7.0)) * (0.45 + 0.55 * smoothstep(-1.4, 1.2, vWall.y));')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = hdBump(-vViewPosition, normal, 0.0012 * hdNoise(vWall * 18.0) + 0.0005 * hdNoise(vWall * 60.0));')}`;
  };
  return m;
}

// ---------------------------------------------------------------- the hand, holding the piece

const PALM_Y = 0.24;    // the palm's rim, in the hand's own space: where a piece stands, across the hollow
const HAND_Y = 1.0 - PALM_Y; // so the palm is a metre up, where the pedestal's top was
const HAND_YAW = -0.35; // the fingers turned a little towards you, to the right
const ROOM = '#0e1830';

export function createHand(host, { picks, art, open, reduced, local, wide, tag }) {
  const stage = el('div', 'cp-mu-stage cp-pd-stage');
  const canvas = el('canvas', 'cp-mu-gl');
  canvas.setAttribute('aria-hidden', 'true');
  const hits = el('div', 'cp-mu-hits');
  const hint = el('p', 'cp-mu-hint', 'Scroll, and the hand holds the next');
  const tl = el('div', 'cp-pd-c cp-pd-tl'), bl = el('div', 'cp-pd-c cp-pd-bl'), br = el('div', 'cp-pd-c cp-pd-br');
  stage.append(canvas, hits, tl, bl, br, hint);
  if (tag) stage.append(el('p', 'cp-mu-tag', tag));
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  if (!renderer.getContext()) return null;
  host.classList.add('is-room', 'is-plinth');
  host.append(stage);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, wide ? 2 : 1.6));
  renderer.setClearColor(ROOM, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.shadowMap.autoUpdate = false;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(ROOM);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);

  // a small studio for the marble's soft sheen
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color(0.02, 0.03, 0.05);
  const panel = (w, h, k, pos, tint) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k * tint[0], k * tint[1], k * tint[2]), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0.5, 0); env.add(m);
  };
  panel(3, 2, 4, [-3, 5, 3], [1, 0.94, 0.86]);
  panel(8, 4, 0.5, [0, 1, -5], [0.3, 0.42, 0.7]);
  panel(6, 2, 0.3, [0, 1, 6], [1, 0.95, 0.9]);
  scene.environment = pm.fromScene(env, 0.04).texture;
  pm.dispose();

  // ---- the wall behind: deep blue plaster, nothing else
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(22, 14), plasterMat('#2a4476'));
  wall.position.set(0, 1.4, -3.2);
  // (it takes the light's pool but no shadows: the piece's would lie on it as a dark block)
  wall.receiveShadow = false;
  scene.add(wall);
  // ---- the hand, and its forearm going on down out of the frame
  const t0 = performance.now();
  const marble = marbleMat();
  const hand = new THREE.Group();
  const palm = new THREE.Mesh(handGeometry(), marble);
  palm.castShadow = palm.receiveShadow = true;
  hand.add(palm);
  const built = Math.round(performance.now() - t0);
  {
    const yTop = ARM_Y + 0.03, yBot = -3.2;
    const rAt = (y) => ARM_R + ARM_TAPER * (ARM_TOP[1] - y) - 0.0015;
    const g = new THREE.CylinderGeometry(rAt(yTop), rAt(yBot), yTop - yBot, 72, 1, true);
    g.scale(1 / ARM_K, 1, 1);
    g.translate(ARM_TOP[0], (yTop + yBot) / 2, ARM_TOP[2]);
    const n = g.attributes.position.count;
    g.setAttribute('aAO', new THREE.BufferAttribute(new Float32Array(n).fill(1), 1));
    g.setAttribute('aBreak', new THREE.BufferAttribute(new Float32Array(n), 1));
    const arm = new THREE.Mesh(g, marble);
    arm.castShadow = arm.receiveShadow = true;
    hand.add(arm);
  }
  // raised so the palm is a metre up, turned a little so the fingers come towards you on the right,
  // the palm's middle over the middle of the frame
  hand.rotation.y = HAND_YAW;
  hand.position.set(-0.44 * Math.cos(HAND_YAW), HAND_Y, 0.44 * Math.sin(HAND_YAW) + 0.0);
  scene.add(hand);
  hand.updateMatrixWorld(true);

  // ---- the light: one warm spot from above and to the left (following the pointer); a soft pool of
  // it on the blue behind; a little fill; a cool rim on the far edges
  // (a narrow cone, softly edged: the light holds the palm and the piece, and the arm falls away into
  // the dark below, as the pedestal's column does)
  const spot = new THREE.SpotLight(0xfff0dc, 0, 0, 0.25, 0.85, 0);
  spot.position.set(-2.3, 4.9, 3.2);
  spot.target.position.set(0, 1.05, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(wide ? 2048 : 1024, wide ? 2048 : 1024);
  spot.shadow.radius = 5;
  spot.shadow.blurSamples = 16;
  spot.shadow.bias = -0.0003;
  spot.shadow.normalBias = 0.015;
  spot.shadow.camera.near = 2; spot.shadow.camera.far = 14;
  scene.add(spot, spot.target);
  const pool = new THREE.SpotLight(0xffe2c4, 0, 0, 0.5, 1, 0);
  pool.position.set(-0.8, 4.6, 2.2);
  pool.target.position.set(0.5, 1.5, -3.2);
  scene.add(pool, pool.target);
  const hemi = new THREE.HemisphereLight(0x9aa4b8, 0x0a0d14, 0);
  scene.add(hemi);
  const fill = new THREE.DirectionalLight(0xffe6d2, 0);
  fill.position.set(2.4, 1.3, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0xa9bddf, 0);
  rim.position.set(3, 3, -2.2);
  scene.add(rim);

  // ---- the pieces, standing in the palm
  const cards = picks.slice(0, 3).map((k, i) => {
    const r = (k.pc.ratio || 0.8) / (1 - 2 * BARS(k.pc));
    const h = Math.min(0.92, 0.7 / r), w = h * r;
    const g = new THREE.Group();
    const side = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ece9e2'), roughness: 0.9, transparent: true });
    const face = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true });
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.016), [side, side, side, side, face, side]);
    box.position.y = h / 2;
    box.castShadow = true;
    g.add(box);
    // (standing across the palm's hollow, facing you)
    const at = hand.localToWorld(new THREE.Vector3(0.45, PALM_Y, 0.0));
    g.position.copy(at);
    g.visible = i === 0;
    scene.add(g);
    art(k.pc, 1200).then((url) => {
      new THREE.TextureLoader().load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        const bars = BARS(k.pc);
        if (bars) { t.repeat.set(1, 1 - 2 * bars); t.offset.set(0, bars); }
        face.map = t; face.needsUpdate = true; dirty = true;
      });
    });
    return { k, g, w, h, box, mats: [side, face], y0: g.position.y };
  });
  if (!cards.length) return null;

  const year = String(new Date().getFullYear());
  function words(i) {
    const k = cards[i].k;
    tl.innerHTML = '';
    tl.append(el('p', 'cp-pd-small', k.honour || ''), el('p', 'cp-pd-title', k.title));
    bl.innerHTML = '';
    bl.append(el('p', 'cp-pd-maker', k.maker), el('p', 'cp-pd-small', k.when || ''));
    br.innerHTML = '';
    br.append(el('p', 'cp-pd-n', `${String(i + 1).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`), el('p', 'cp-pd-small', `© ${year}`));
  }

  const N = cards.length - 1, WALK = 0.84;
  let top = 0, span = 1, vw = 1, vh = 1, narrow = false;
  function layout() {
    vw = stage.clientWidth || innerWidth;
    vh = stage.clientHeight || innerHeight;
    narrow = vw / vh < 1;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.fov = narrow ? 46 : 30;
    camera.updateProjectionMatrix();
    top = host.getBoundingClientRect().top + scrollY;
    span = Math.max(1, host.offsetHeight - vh);
    dirty = true;
  }
  const progress = () => clamp((scrollY - top) / span, 0, 1);
  const stopY = (i) => top + (N ? (i / N) * WALK * span : 0);

  const hit = el('button', 'cp-mu-hit'), hitImg = el('img');
  hit.type = 'button';
  hitImg.alt = '';
  hit.append(hitImg);
  hits.append(hit);
  let cur = 0;
  const label = (i) => { const k = cards[i].k; hit.setAttribute('aria-label', `${k.honour ? `${k.honour}: ` : ''}${k.title} by ${k.maker}`); };
  hit.addEventListener('click', () => open(cards[cur].k.pc, { art: hit, img: hitImg, b: hit }));

  const pointer = { x: 0.5, y: 0.5, on: false };
  const onMove = (e) => {
    const r = stage.getBoundingClientRect();
    const py = e.clientY - r.top;
    pointer.on = r.top < 2 && r.bottom > innerHeight - 2 && py >= 0 && py <= r.height;
    if (!pointer.on) return;
    pointer.x = (e.clientX - r.left) / vw; pointer.y = py / vh;
    dirty = true;
  };
  addEventListener('pointermove', onMove, { passive: true });

  let lit = reduced ? 1 : 0;
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting) && lit < 1) gsap.to({ v: lit }, { v: 1, duration: 2.2, ease: 'power2.out', onUpdate() { lit = this.targets()[0].v; dirty = true; } });
  }, { threshold: 0.2 });
  io.observe(host);

  let dirty = true, alive = true, wasInside = false, lastOp = -1, hinted = false, lastP = -1, shownI = -1, lastLit = -1;
  const lk = { x: 0, y: 0 };
  const tmp = new THREE.Vector3();
  const screenOf = (v) => { tmp.copy(v).project(camera); return [(tmp.x * 0.5 + 0.5) * vw, (-tmp.y * 0.5 + 0.5) * vh]; };
  function frame() {
    if (!alive) return;
    const r = host.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = progress();
    if (p !== lastP) { lastP = p; dirty = true; }
    if (lit !== lastLit) { lastLit = lit; dirty = true; }
    const tx = pointer.on ? pointer.x - 0.5 : 0, ty = pointer.on ? pointer.y - 0.5 : 0;
    if (Math.abs(tx - lk.x) + Math.abs(ty - lk.y) > 0.0005) { lk.x += (tx - lk.x) * (reduced ? 1 : 0.08); lk.y += (ty - lk.y) * (reduced ? 1 : 0.08); dirty = true; }
    if (!dirty) return;
    dirty = false;
    if (!hinted && p > 0.01) { hinted = true; hint.classList.add('is-done'); }
    const sw = clamp(p / WALK, 0, 1) * N, i = Math.min(Math.max(N - 1, 0), Math.floor(sw)), f = N ? smooth(0.2, 0.8, sw - i) : 0;
    const az = N ? lerp(-0.16, 0.16, (i + f) / N) : 0;
    const dist = narrow ? 5.9 : 4.1;
    const cx = narrow ? 0.3 : 0.06; // (on a phone, centred on the whole hand so the fingers stay in)
    camera.position.set(Math.sin(az) * dist + cx + 0.14 + lk.x * 0.16, 1.42 - lk.y * 0.07, Math.cos(az) * dist);
    camera.lookAt(cx, narrow ? 1.3 : 1.2, 0);
    camera.updateMatrixWorld();
    spot.position.set(-2.3 + lk.x * 2.4, 4.7 - lk.y * 1.4, 3.2);
    spot.intensity = 6.2 * lit;
    pool.intensity = 1.6 * lit;
    hemi.intensity = 0.32 * lit;
    fill.intensity = 0.3 * lit;
    rim.intensity = 0.7 * lit;
    cards.forEach((c, k) => {
      let y = 0, o = 0;
      if (k === i) { y = smooth(0, 0.6, f) * 0.4; o = 1 - smooth(0.05, 0.5, f); }
      if (k === i + 1) { y = (1 - smooth(0.4, 1, f)) * 0.4; o = smooth(0.45, 0.9, f); }
      c.g.visible = o > 0.002;
      c.g.position.y = c.y0 + y;
      c.mats.forEach((m) => { m.opacity = o; m.depthWrite = o > 0.99; });
      c.box.castShadow = o > 0.5;
    });
    const now = f < 0.5 ? i : Math.min(i + 1, N);
    if (now !== shownI) { shownI = now; cur = now; words(now); label(now); }
    const op = 1 - smooth(WALK + 0.03, 1, p);
    if (Math.abs(op - lastOp) > 0.002) { lastOp = op; stage.style.opacity = op.toFixed(3); stage.style.visibility = op < 0.01 ? 'hidden' : ''; }
    const inside = r.top <= 1 && op > 0.5;
    if (inside !== wasInside) { wasInside = inside; document.documentElement.classList.toggle('cc-in-room', inside); }
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    const c = cards[cur];
    const a = screenOf(tmp.set(c.g.position.x - c.w / 2, c.g.position.y + c.h, c.g.position.z)), b = screenOf(new THREE.Vector3(c.g.position.x + c.w / 2, c.g.position.y, c.g.position.z));
    const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
    Object.assign(hit.style, { visibility: c.g.visible ? 'visible' : 'hidden', transform: `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`, width: `${(x1 - x0).toFixed(1)}px`, height: `${Math.max(0, y1 - y0).toFixed(1)}px` });
  }
  layout();
  words(0); label(0);
  gsap.ticker.add(frame);

  const api = {
    kind: 'hand',
    layout,
    home(pc) { return cards[cur]?.k.pc === pc && hit.style.visibility === 'visible' ? { art: hit, img: hitImg, b: hit } : null; },
    reshape() {},
    destroy() {
      alive = false;
      gsap.ticker.remove(frame);
      removeEventListener('pointermove', onMove);
      io.disconnect();
      document.documentElement.classList.remove('cc-in-room');
      renderer.dispose();
      renderer.forceContextLoss?.();
      stage.remove();
      host.classList.remove('is-room', 'is-plinth');
    },
    scene, camera, renderer, cards, hand, palm, wall, spot, pool, hemi, fill, rim, stopY, built,
    set lit(v) { lit = v; dirty = true; }, get lit() { return lit; },
    get dirty() { return dirty; }, set dirty(v) { dirty = v; }, tick: () => { dirty = true; frame(); },
  };
  if (local) window.__hand = api;
  return api;
}
