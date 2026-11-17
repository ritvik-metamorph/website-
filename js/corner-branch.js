// The Creative Corner's opening, a test for gallery 3 (14 Nov): the branch. After a reference the user
// sent (a gnarled branch curving up through the dark over a black mirror, things resting along it,
// each numbered and labelled), its composition only: one driftwood branch rising in an S out of still
// dark water that holds its reflection, rings spreading slowly from where it stands in it, a faint
// beam of light falling on it through the dark; and resting on it, each in the crook of a bough,
// leaning back on a twig as if set there by hand (since 15 Nov; at first they hung on silver threads),
// the three picks: the day's on the middle bough, the week's below, the month's near the water. Each
// has its number beside it. Scrolling comes in close to the day's, then down the branch to the week's
// and the month's, and the label grows its title and maker.
//
// The user's own reason: caterpillars live on branches. And then (the user: "put some flowers and
// something related to caterpillars… very aesthetic") a still life of milkweed grows along it, the one
// plant a monarch caterpillar eats: six umbels of small dusty-rose star flowers on fine stems with sage
// leaves, a closed pod, and a split one spilling its silk, its seeds drifting slowly up into the dark on
// that silk (the site's silver thread, alive). Rest on any of them and a line says what it is.
// Since 16 Nov (the user: "one caterpillar which ultimately gets evoluted into a butterfly by the time
// you reach end of the 3rd piece") a monarch lives its whole change along the walk: it eats beside the
// day's piece, lets itself down on silk, pupates beside the week's, and flies as a butterfly to the
// milkweed beside the month's (js/corner-monarch.js).
//
// The branch is made in code: a tube along a curve whose section is lumpy, cracked along its grain and
// twisted, thicker at its broken foot and thinning to a snapped tip, with two short broken boughs; its
// grain, silvering and the dark of its cracks are worked out per pixel.
//
// On the page since 16 Nov as gallery 4 (creative.html's .cp-open-4, built in js/corner.js); a
// test behind ?branch until then.
import * as THREE from '../assets/vendor/three.module.min.js';
import { createMonarch } from './corner-monarch.js';
import { BARS } from './corner-museum.js';

const { gsap } = window;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
const TAU = Math.PI * 2;

// ---------------------------------------------------------------- noise, for shaping the wood
const PERM = (() => {
  const r = rnd(53), p = [...Array(256).keys()];
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

// ---------------------------------------------------------------- a limb of the branch
// a tube along a curve through `pts`: r0 at its start, r1 at its end; its section lumpy, thick at its
// foot and swelling at knots; a broken end splintered, jagged.
// (15 Nov, the user: the tree's pixels flickered when the cursor or the page moved, the trunk's
// texture "seems off", and where a bough joins the trunk looked like a mistake.) Its fine surface, the
// grain, the cracks, the silvering, is no longer cut into its shape nor worked out pixel by pixel: it
// is one picture of wood, made once (woodTexture), wrapped round every limb, so it is sharp close to
// and calm far off. Each point carries where on that picture it is (aUv: round the limb, the grain
// twisting slowly; and along it, in the room's own units), how deep in a hollow it sits (aCav) and how
// bleached it is (aSilver: silver0 at its start to silver by its middle). `collar` is the radius of
// the thicker limb it grows out of: it flares there to meet it, as a bough does at its collar.
function limb(pts, { r0, r1, seed = 0, rings = 320, sides = 28, twist = 0.7, broken0 = false, broken1 = true, silver = 0, silver0 = silver, collar = 0, flareBy = 0.95, tip = false }) {
  // (the course itself wanders a little, so the branch is gnarled, never a smooth sweep)
  const smoothCurve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const L0 = smoothCurve.getLength(), wob = r0 * 0.55;
  const wandered = [];
  for (let i = 0; i <= 90; i++) {
    const t = i / 90, p = smoothCurve.getPointAt(t), s = t * L0;
    const k = Math.min(1, t * 8, (1 - t) * 8);
    p.x += k * wob * fbm(s * 2.2 + seed, 1.3, 0.2, 2); p.y += k * wob * fbm(s * 2.2, 4.1 + seed, 0.7, 2); p.z += k * wob * fbm(s * 2.2, 2.2, 5.3 + seed, 2);
    wandered.push(p);
  }
  const curve = new THREE.CatmullRomCurve3(wandered, false, 'centripetal');
  const L = curve.getLength();
  const F = curve.computeFrenetFrames(rings, false);
  // thick at its foot, thinning fast, swelling at knots along the way
  // (16 Nov: `tip` draws its end out to a fine natural point and closes it, in place of a splintered
  // break, whose hair-thin splinters broke up on screen)
  const tipLen = tip ? Math.min(0.3 * L, 0.03 + 4 * r1) : 0;
  const taper = (t) => (tip ? 1 - 0.5 * smooth(1 - tipLen / L, 1, t) : 1);
  const radiusAt = (t) => lerp(r0, r1, Math.pow(t, 0.55)) * (1 + 0.26 * fbm(t * L * 0.9 + seed, seed * 0.3, 0.5, 2) + 0.22 * Math.max(0, noise(t * L * 2.1 + 11, seed, 0.3)) ** 2 * 4) * taper(t);
  // (16 Nov: the collar swells only where the limb comes out of the one it grows from, about `collar`
  // along, and stays slim inside it. It used to be widest inside, as wide as the trunk itself, so the two
  // skins lay one on the other and fought over which showed: the join looked broken)
  const flare = (t) => {
    if (!collar) return 1;
    const d = t * L, sw = d < collar ? smooth(0.55 * collar, collar, d) : Math.exp(-(d - collar) / (collar * 0.8));
    return 1 + flareBy * sw;
  };
  const along0 = (seed - 1) * 1.37; // (each limb its own stretch of the picture; the trunk's starts at its foot)
  const pos = [], uv = [], cav = [], sil = [], idx = [];
  const c = new THREE.Vector3(), d = new THREE.Vector3();
  const S = sides, S1 = sides + 1; // (a ring ends on a second point where it began, so the picture closes round it without a seam)
  // (the trunk wears the picture once round. A thinner limb wears only a strip of its width, there
  // and back again, so its grain is the size of the trunk's, not the whole picture squeezed thin)
  const share = clamp((TAU * (r0 + r1) * 0.5) / 0.8, 0.14, 1), whole = share > 0.6;
  const uAt = (j, gz) => (whole ? j / S + (gz * twist) / TAU : share * (1 - Math.abs((2 * j) / S - 1) + (gz * twist) / TAU));
  const ring = (i) => {
    const t = i / rings;
    curve.getPointAt(t, c);
    const N = F.normals[i], B = F.binormals[i], r = radiusAt(t) * flare(t), gz = t * L, bleach = lerp(silver0, silver, smooth(0, 0.45, t));
    for (let j = 0; j <= S; j++) {
      const a = ((j % S) / S) * TAU, gx = Math.cos(a), gy = Math.sin(a);
      const lump = 0.2 * noise(gx * 0.9 + seed, gy * 0.9, gz * 1.3) + 0.08 * noise(gx * 2.2, gy * 2.2 + seed, gz * 3.2);
      const rr = r * (1 + lump);
      d.copy(N).multiplyScalar(gx).addScaledVector(B, gy);
      pos.push(c.x + d.x * rr, c.y + d.y * rr, c.z + d.z * rr);
      uv.push(uAt(j, gz), gz + along0);
      cav.push(clamp(Math.max(0, -lump) * 3, 0, 1));
      sil.push(bleach);
    }
  };
  for (let i = 0; i <= rings; i++) ring(i);
  for (let i = 0; i < rings; i++) for (let j = 0; j < S; j++) {
    const a = i * S1 + j, b = a + 1, c2 = (i + 1) * S1 + j, d2 = c2 + 1;
    idx.push(a, b, c2, b, d2, c2);
  }
  // a broken end: a ring of splinters of every length, closed a little way in
  const r2 = rnd(97 + seed * 13);
  const end = (i, dir) => {
    const t = i / rings;
    curve.getPointAt(t, c);
    const T = F.tangents[i], N = F.normals[i], B = F.binormals[i], r = radiusAt(t) * flare(t), gz = t * L, bleach = lerp(silver0, silver, smooth(0, 0.45, t));
    const base = pos.length / 3;
    for (let j = 0; j < S; j++) {
      const a = (j / S) * TAU, len = r * (0.15 + 2.4 * Math.pow(r2(), 2.6));
      const k = 0.55 + 0.35 * r2();
      d.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
      pos.push(c.x + d.x * r * k + T.x * len * dir, c.y + d.y * r * k + T.y * len * dir, c.z + d.z * r * k + T.z * len * dir);
      uv.push(uAt(j, gz), gz + len * dir + along0);
      cav.push(0.35); sil.push(bleach);
    }
    const mid = pos.length / 3;
    pos.push(c.x + T.x * r * 0.25 * dir, c.y + T.y * r * 0.25 * dir, c.z + T.z * r * 0.25 * dir);
    uv.push(uAt(S / 2, gz), gz + along0);
    cav.push(0.7); sil.push(bleach);
    const rim = i * S1;
    for (let j = 0; j < S; j++) {
      const a = rim + j, b = rim + j + 1, sa = base + j, sb = base + (j + 1) % S;
      if (dir > 0) { idx.push(a, b, sa, b, sb, sa); idx.push(sa, sb, mid); }
      else { idx.push(sa, sb, a, sb, b, a); idx.push(sb, sa, mid); }
    }
  };
  if (broken1) end(rings, 1);
  else if (tip) {
    // (the point it tapers to, a little past its last ring)
    const t = 1, i = rings;
    curve.getPointAt(t, c);
    const T = F.tangents[i], r = radiusAt(t) * flare(t), gz = t * L, at = pos.length / 3;
    pos.push(c.x + T.x * r * 1.2, c.y + T.y * r * 1.2, c.z + T.z * r * 1.2);
    uv.push(uAt(S / 2, gz), gz + r * 1.2 + along0);
    cav.push(0); sil.push(lerp(silver0, silver, smooth(0, 0.45, t)));
    const last = rings * S1;
    for (let j = 0; j < S; j++) idx.push(last + j, last + j + 1, at);
  }
  if (broken0) end(0, -1);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('aUv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('aCav', new THREE.Float32BufferAttribute(cav, 1));
  g.setAttribute('aSilver', new THREE.Float32BufferAttribute(sil, 1));
  g.setIndex(idx);
  g.computeVertexNormals();
  // (the two points a ring begins and ends on face the same way, so no crease runs down the limb)
  const nn = g.attributes.normal;
  for (let i = 0; i <= rings; i++) {
    const a = i * S1, b = a + S, x = nn.getX(a) + nn.getX(b), y = nn.getY(a) + nn.getY(b), z = nn.getZ(a) + nn.getZ(b), l = Math.hypot(x, y, z) || 1;
    nn.setXYZ(a, x / l, y / l, z / l); nn.setXYZ(b, x / l, y / l, z / l);
  }
  g.computeBoundingSphere();
  return { g, curve, radiusAt, F, L };
}

const GLSL_NOISE = /* glsl */`
vec3 br289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 br289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 brPerm(vec4 x) { return br289(((x * 34.0) + 10.0) * x); }
float brNoise(vec3 v) {
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
  i = br289(i);
  vec4 p = brPerm(brPerm(brPerm(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
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
`;

// the picture of driftwood every limb wears, made once (a fiftieth of a second on the graphics chip):
// across it, once round a limb (it closes on itself); up it, two of the room's units along the limb,
// then the same again mirrored. Four things in it: the height of its grain (which the light reads),
// how dark or pale its streaks are, where the weather has worn it silver, and its cracks: long ones
// along the grain and finer checks beside them. Kept at every size down to a dot (mipmaps), which is
// what keeps the bark still when the camera or the light moves.
const WOOD_BAKE = /* glsl */`
varying vec2 vUv;
void main() {
  float a = vUv.x * 6.2831853;
  vec3 g = vec3(cos(a), sin(a), vUv.y * 2.0);
  float streak = brNoise(vec3(g.xy * 1.6, g.z * 0.3));
  float fine = brNoise(vec3(g.xy * 4.5, g.z * 0.9));
  float wear = brNoise(vec3(g.xy * 0.8, g.z * 1.4) + 5.0);
  float tone = 0.78 + 0.34 * streak + 0.1 * fine;
  float worn = smoothstep(0.05, 0.7, wear + 0.35 * streak);
  float c1 = 1.0 - smoothstep(0.0, 0.05, abs(brNoise(vec3(g.xy * 2.2 + 7.0, g.z * 0.55))));
  float c2 = (1.0 - smoothstep(0.0, 0.035, abs(brNoise(vec3(g.xy * 5.5 + 3.0, g.z * 1.3))))) * smoothstep(0.0, 0.5, brNoise(vec3(g.xy * 1.1 + 9.0, g.z * 0.8)));
  float crack = max(c1, 0.6 * c2);
  float h = 0.0017 * brNoise(vec3(g.xy * 7.0, g.z * 1.2)) + 0.0006 * brNoise(vec3(g.xy * 16.0, g.z * 4.5)) + 0.0009 * brNoise(vec3(g.xy * 3.0, g.z * 6.0)) - 0.0034 * crack;
  gl_FragColor = vec4(h, tone, worn, crack);
}`;
// a picture drawn once by a shader into rt (with all its smaller sizes, for calm at any distance)
function bakeInto(renderer, rt, frag) {
  rt.texture.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const quad = new THREE.Mesh(tri, new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: frag, depthTest: false, depthWrite: false, toneMapped: false }));
  quad.frustumCulled = false;
  const sc = new THREE.Scene();
  sc.add(quad);
  const was = renderer.getRenderTarget();
  renderer.setRenderTarget(rt);
  renderer.render(sc, new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1));
  renderer.setRenderTarget(was);
  tri.dispose(); quad.material.dispose();
  return rt;
}
const woodTexture = (renderer) => bakeInto(renderer, new THREE.WebGLRenderTarget(1024, 2048, { type: THREE.HalfFloatType, depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter, wrapS: THREE.RepeatWrapping, wrapT: THREE.MirroredRepeatWrapping }), `${GLSL_NOISE}\n${WOOD_BAKE}`);
// (16 Nov) a leaf's veins, baked the same way: along the leaf across the picture, from one edge
// through the midrib to the other up it; red the midrib, green the side veins. Drawn per pixel they
// broke into dots far off and crawled when the light moved
const LEAF_BAKE = /* glsl */`
varying vec2 vUv;
void main() {
  float u = vUv.x, av = abs(vUv.y * 2.0 - 1.0);
  float mid = 1.0 - smoothstep(0.025, 0.07, av);
  float lat = abs(fract(u * 7.5 - av * 1.5) - 0.5);
  float side = (1.0 - smoothstep(0.02, 0.06, lat)) * smoothstep(0.06, 0.14, av) * (1.0 - smoothstep(0.8, 0.98, av)) * smoothstep(0.04, 0.12, u);
  gl_FragColor = vec4(mid, side, 0.0, 1.0);
}`;
const leafTexture = (renderer) => bakeInto(renderer, new THREE.WebGLRenderTarget(1024, 512, { depthBuffer: false, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter }), LEAF_BAKE);
// driftwood: grey-brown, silvered where the weather has worn it (and all over where a limb is
// bleached), its grain in long streaks, dark in its cracks and hollows; the grain is a height the
// light reads, taken from the picture at this pixel and the next (so it never moves in blocks)
// (16 Nov) and darker in a soft round wherever something grows out of it or rests on it: `joins` is a
// list of up to MAX_JOINS points (x, y, z, radius) with how dark each is, worked out per pixel, so the
// shadow in a join is smooth however coarse the wood's own points are there
const MAX_JOINS = 96;
function woodMat(tex, joins) {
  const m = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.84, metalness: 0, envMapIntensity: 0.4 });
  m.customProgramCacheKey = () => 'br-wood-3';
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tWood = { value: tex };
    sh.uniforms.uJoin = joins.at; sh.uniforms.uJoinK = joins.k; sh.uniforms.uJoins = joins.n;
    sh.vertexShader = `attribute vec2 aUv;\nattribute float aCav;\nattribute float aSilver;\nvarying vec2 vWuv;\nvarying float vCav;\nvarying float vSilver;\nvarying vec3 vWPos;\n${sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vWuv = aUv;\n  vCav = aCav;\n  vSilver = aSilver;\n  vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;')}`;
    sh.fragmentShader = `uniform sampler2D tWood;\nuniform vec4 uJoin[${MAX_JOINS}];\nuniform float uJoinK[${MAX_JOINS}];\nuniform int uJoins;\nvarying vec2 vWuv;\nvarying float vCav;\nvarying float vSilver;\nvarying vec3 vWPos;\nfloat brWorn = 0.0;\nfloat brHollow = 0.0;\nfloat brH0 = 0.0;\nvec2 brUv = vec2(0.0);
vec3 brBump(vec3 pos, vec3 N, float dhx, float dhy) {
  vec3 dpx = dFdx(pos), dpy = dFdy(pos);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx);
  float det = dot(dpx, r1);
  vec3 g = sign(det) * (dhx * r1 + dhy * r2);
  return normalize(abs(det) * N - g);
}
${sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    brUv = vec2(vWuv.x, vWuv.y * 0.5);
    vec4 w = texture2D(tWood, brUv);
    // (the same picture far larger says where whole stretches are worn, so no two stretches match)
    vec4 fw = texture2D(tWood, vec2(vWuv.x, vWuv.y * 0.137) + vec2(0.31, 0.53));
    brH0 = w.r;
    vec3 c = vec3(0.105, 0.078, 0.058) * w.g * (0.62 + 0.5 * fw.g);
    // silvered where the weather has worn it, in patches, not stripes
    brWorn = clamp(fw.b * 0.85 + (w.b - 0.5) * 0.5, 0.0, 1.0);
    c = mix(c, vec3(0.36, 0.345, 0.322), max(brWorn * 0.55, vSilver));
    // darker where it was wet longest, towards its foot
    c *= 0.82 + 0.18 * smoothstep(0.0, 1.6, vWuv.y);
    float join = 0.0;
    for (int i = 0; i < ${MAX_JOINS}; i++) {
      if (i >= uJoins) break;
      float q = clamp(1.0 - length(vWPos - uJoin[i].xyz) / uJoin[i].w, 0.0, 1.0);
      join = max(join, uJoinK[i] * q * q * (3.0 - 2.0 * q));
    }
    brHollow = max(max(vCav, w.a * 0.9), join);
    c *= 1.0 - 0.75 * brHollow;
    diffuseColor.rgb = c;
  }`)
      // (worn smooth where it is silvered, so it catches the light there; rough in its cracks)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n  roughnessFactor = clamp(mix(0.9, 0.5, brWorn) + 0.1 * brHollow, 0.45, 1.0);')
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = brBump(-vViewPosition, normal, texture2D(tWood, brUv + dFdx(brUv)).r - brH0, texture2D(tWood, brUv + dFdy(brUv)).r - brH0);')}`;
  };
  return m;
}

// the black floor's reflection: the room drawn again from a camera mirrored in it (as in the split
// marble, with the near plane tilted onto the floor), shown by its Fresnel and fading out with distance
const MIRROR = /* glsl */`
uniform sampler2D tMirror;
uniform mat4 uMirrorMatrix;
uniform vec2 uMirrorTexel;
uniform float uMirrorK;
varying vec3 vMirrorW;
`;
function mirrorOf() {
  const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
  const U = { tMirror: { value: rt.texture }, uMirrorMatrix: { value: new THREE.Matrix4() }, uMirrorTexel: { value: new THREE.Vector2(0.5, 0.5) }, uMirrorK: { value: 0 } };
  const cam = new THREE.PerspectiveCamera();
  cam.layers.enableAll(); // (the floor reflects the art too)
  const plane = new THREE.Plane(), clip = new THREE.Vector4(), q = new THREE.Vector4();
  const n = new THREE.Vector3(0, 1, 0), at = new THREE.Vector3(), eye = new THREE.Vector3(), view = new THREE.Vector3();
  const look = new THREE.Vector3(), target = new THREE.Vector3(), rot = new THREE.Matrix4();
  return {
    U, rt,
    size(w, h) { rt.setSize(w, h); U.uMirrorTexel.value.set(1 / w, 1 / h); },
    render(renderer, scene, camera, hide) {
      eye.setFromMatrixPosition(camera.matrixWorld);
      view.subVectors(at, eye);
      if (view.dot(n) > 0) { U.uMirrorK.value = 0; return; }
      U.uMirrorK.value = 1;
      view.reflect(n).negate().add(at);
      rot.extractRotation(camera.matrixWorld);
      look.set(0, 0, -1).applyMatrix4(rot).add(eye);
      target.subVectors(at, look).reflect(n).negate().add(at);
      cam.position.copy(view);
      cam.up.set(0, 1, 0).applyMatrix4(rot).reflect(n);
      cam.lookAt(target);
      cam.near = camera.near; cam.far = camera.far;
      cam.updateMatrixWorld();
      cam.projectionMatrix.copy(camera.projectionMatrix);
      U.uMirrorMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(cam.projectionMatrix).multiply(cam.matrixWorldInverse);
      plane.setFromNormalAndCoplanarPoint(n, at).applyMatrix4(cam.matrixWorldInverse);
      clip.set(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
      const e = cam.projectionMatrix.elements;
      q.set((Math.sign(clip.x) + e[8]) / e[0], (Math.sign(clip.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
      clip.multiplyScalar(2 / clip.dot(q));
      e[2] = clip.x; e[6] = clip.y; e[10] = clip.z + 1 - 0.003; e[14] = clip.w;
      cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
      hide.forEach((o) => { o.visible = false; });
      renderer.setRenderTarget(rt);
      renderer.clear();
      renderer.render(scene, cam);
      renderer.setRenderTarget(null);
      hide.forEach((o) => { o.visible = true; });
    },
  };
}

// ---------------------------------------------------------------- the look of a photograph
// (15 Nov, the user: "it can be way better in terms of the graphics… highlights, shadows, lighting,
// texture", with a jungle poster and a glass flower as references) On a laptop the room is drawn first
// into a picture of its own, then given what a lens and film give: depth of field (the piece in focus
// sharp, what is nearer or farther soft), a glow round the brightest points, the grade, a little
// vignette and a fine grain. The art is not in that picture: it is laid on afterwards, exactly as it
// is, in front of whatever stands before it (never blurred, graded or grained).
const FS_VERT = /* glsl */`varying vec2 vUv;\nvoid main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const POST_BRIGHT = /* glsl */`
uniform sampler2D tColor; uniform float uThresh; uniform vec2 uPx; varying vec2 vUv;
// (16 Nov) four taps between texels cover the sixteen pixels under this one, each weighed down by its
// own brightness, so one small bright petal moving by a pixel does not make the glow blink
vec3 tap(vec2 o) { vec3 c = texture2D(tColor, vUv + o * uPx).rgb; return c / (1.0 + max(c.r, max(c.g, c.b))); }
void main() {
  vec3 c = (tap(vec2(-1.0, -1.0)) + tap(vec2(1.0, -1.0)) + tap(vec2(-1.0, 1.0)) + tap(vec2(1.0, 1.0))) * 0.25;
  c = c / max(1.0 - max(c.r, max(c.g, c.b)), 0.05);
  float l = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(uThresh, uThresh * 1.8, l), 1.0);
}`;
const POST_BLUR = /* glsl */`
uniform sampler2D tMap; uniform vec2 uDir; varying vec2 vUv;
void main() {
  vec3 c = texture2D(tMap, vUv).rgb * 0.227027;
  vec2 a = uDir * 1.3846153846, b = uDir * 3.2307692308;
  c += (texture2D(tMap, vUv + a).rgb + texture2D(tMap, vUv - a).rgb) * 0.3162162162;
  c += (texture2D(tMap, vUv + b).rgb + texture2D(tMap, vUv - b).rgb) * 0.0702702703;
  gl_FragColor = vec4(c, 1.0);
}`;
const POST_LENS = /* glsl */`
#include <packing>
uniform sampler2D tDepth; uniform float uNear, uFar, uFocus, uScale, uMaxBlur;
float distAt(vec2 uv) { return -perspectiveDepthToViewZ(texture2D(tDepth, uv).r, uNear, uFar); }
float blurAt(float d) { return abs(clamp((1.0 / uFocus - 1.0 / d) * uScale, -1.0, 1.0)) * uMaxBlur; }
`;
// (the blur gathered over a golden-angle spiral, after Dennis Gustafsson's single-pass bokeh)
const POST_DOF = /* glsl */`${POST_LENS}
uniform sampler2D tColor; uniform vec2 uPx; varying vec2 vUv;
void main() {
  float cd = distAt(vUv), cs = blurAt(cd);
  vec3 col = texture2D(tColor, vUv).rgb; float tot = 1.0, radius = 0.6;
  for (int i = 0; i < 110; i++) {
    if (radius >= uMaxBlur) break;
    float ang = float(i) * 2.39996323;
    vec2 tc = vUv + vec2(cos(ang), sin(ang)) * uPx * radius;
    vec3 sc = texture2D(tColor, tc).rgb;
    float sd = distAt(tc), ss = blurAt(sd);
    if (sd > cd) ss = clamp(ss, 0.0, cs * 2.0);
    float m = smoothstep(radius - 0.5, radius + 0.5, ss);
    col += mix(col / tot, sc, m); tot += 1.0;
    radius += 0.6 / radius;
  }
  gl_FragColor = vec4(col / tot, 1.0);
}`;
// (16 Nov, the user: "the highlights, shadows… of the tree, branches, flowers") the shadow that
// gathers where things meet: for each point, how much of the space just above its surface is taken
// by something else (screen-space ambient occlusion, from the depth alone), at half size
const POST_AO = /* glsl */`
uniform sampler2D tDepth; uniform mat4 uProj, uProjInv; uniform float uRadius; varying vec2 vUv;
vec3 viewAt(vec2 uv) { float d = texture2D(tDepth, uv).r; vec4 v = uProjInv * vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); return v.xyz / v.w; }
// (16 Nov) the turn of each sample ring from a fine fixed pattern (interleaved gradient noise) the
// blur after takes out completely, so no grain is left to swim as the camera moves
float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
uniform vec2 uTexel;
void main() {
  float d0 = texture2D(tDepth, vUv).r;
  if (d0 >= 0.99999) { gl_FragColor = vec4(1.0); return; }
  vec3 p = viewAt(vUv);
  // (the surface's facing from the neighbour on each side nearer in depth, not from blocks of four,
  // so thin stems and leaf edges do not get a broken halo)
  vec3 pl = viewAt(vUv - vec2(uTexel.x, 0.0)), pr = viewAt(vUv + vec2(uTexel.x, 0.0)), pd = viewAt(vUv - vec2(0.0, uTexel.y)), pu = viewAt(vUv + vec2(0.0, uTexel.y));
  vec3 dx = abs(pr.z - p.z) < abs(p.z - pl.z) ? pr - p : p - pl, dy = abs(pu.z - p.z) < abs(p.z - pd.z) ? pu - p : p - pd;
  vec3 n = normalize(cross(dx, dy));
  vec3 t = normalize(abs(n.y) < 0.9 ? cross(n, vec3(0.0, 1.0, 0.0)) : cross(n, vec3(1.0, 0.0, 0.0))), b = cross(n, t);
  float occ = 0.0, rot = ign(gl_FragCoord.xy) * 6.2832;
  for (int i = 0; i < 16; i++) {
    float fi = float(i) + 0.5, r = sqrt(fi / 16.0) * uRadius, a = fi * 2.39996 + rot;
    vec3 s = p + (t * cos(a) + b * sin(a)) * r + n * r * 0.6;
    vec4 c = uProj * vec4(s, 1.0);
    vec2 su = c.xy / c.w * 0.5 + 0.5;
    float sz = viewAt(su).z;
    float near = smoothstep(0.0, 1.0, uRadius / max(abs(p.z - sz), 1e-4));
    occ += step(s.z + 0.006, sz) * near;
  }
  gl_FragColor = vec4(vec3(1.0 - occ / 16.0), 1.0);
}`;
const POST_FINAL = /* glsl */`${POST_LENS}
uniform sampler2D tColor, tDof, tGlow1, tGlow2, tAO; uniform float uExposure, uGlow, uTime, uAO, uDof, uFxaa; uniform vec2 uRes, uPxS; varying vec2 vUv;
// (16 Nov) on the lighter steps, whose picture has fewer samples or is enlarged, its edges smoothed
// along their own direction (after Timothy Lottes' FXAA), so leaves and stems never show steps
float lu(vec3 c) { return dot(min(c, vec3(1.0)), vec3(0.299, 0.587, 0.114)); }
vec3 smoothEdges(vec2 uv) {
  vec3 m = texture2D(tColor, uv).rgb;
  float lNW = lu(texture2D(tColor, uv + vec2(-1.0, -1.0) * uPxS).rgb), lNE = lu(texture2D(tColor, uv + vec2(1.0, -1.0) * uPxS).rgb);
  float lSW = lu(texture2D(tColor, uv + vec2(-1.0, 1.0) * uPxS).rgb), lSE = lu(texture2D(tColor, uv + vec2(1.0, 1.0) * uPxS).rgb), lM = lu(m);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  if (lMax - lMin < max(0.03, lMax * 0.12)) return m;
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), (lNW + lSW) - (lNE + lSE));
  float red = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
  dir = clamp(dir / (min(abs(dir.x), abs(dir.y)) + red), -8.0, 8.0) * uPxS;
  vec3 a = 0.5 * (texture2D(tColor, uv - dir / 6.0).rgb + texture2D(tColor, uv + dir / 6.0).rgb);
  vec3 b = a * 0.5 + 0.25 * (texture2D(tColor, uv - dir * 0.5).rgb + texture2D(tColor, uv + dir * 0.5).rgb);
  float lb = lu(b);
  return (lb < lMin || lb > lMax) ? a : b;
}
vec3 rrt(vec3 v) { vec3 a = v * (v + 0.0245786) - 0.000090537; vec3 b = v * (0.983729 * v + 0.4329510) + 0.238081; return a / b; }
vec3 aces(vec3 c) {
  const mat3 I = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
  const mat3 O = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
  c *= uExposure / 0.6; return clamp(O * rrt(I * c), 0.0, 1.0);
}
vec3 srgb(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main() {
  vec3 sharp = uFxaa > 0.5 ? smoothEdges(vUv) : texture2D(tColor, vUv).rgb;
  float cs = blurAt(distAt(vUv));
  vec3 c = mix(sharp, texture2D(tDof, vUv).rgb, smoothstep(0.5, 1.8, cs) * uDof);
  c *= mix(1.0, texture2D(tAO, vUv).r, uAO);
  c += (texture2D(tGlow1, vUv).rgb * 0.6 + texture2D(tGlow2, vUv).rgb * 0.5) * uGlow;
  c = aces(c);
  vec2 q = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  c *= 1.0 - 0.32 * smoothstep(0.35, 1.05, length(q));
  c = srgb(c);
  // (the grain: half as strong as it was, and new twenty-four times a second, as film's is, not every
  // frame, so it reads as the picture's texture, never as pixels flickering)
  float g = fract(sin(dot(floor(vUv * uRes) + fract(floor(uTime * 24.0) * 0.1713) * 91.7, vec2(12.9898, 78.233))) * 43758.5453) - 0.5;
  gl_FragColor = vec4(c + g * 0.013, 1.0);
}`;
function makePost(renderer) {
  const fs = new THREE.Scene(), fcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tri = new THREE.BufferGeometry();
  tri.setAttribute('position', new THREE.Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  tri.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  const quad = new THREE.Mesh(tri);
  quad.frustumCulled = false;
  fs.add(quad);
  const mat = (frag, uniforms) => new THREE.ShaderMaterial({ vertexShader: FS_VERT, fragmentShader: frag, uniforms, depthTest: false, depthWrite: false, toneMapped: false });
  const T = (w = 2, h = 2) => { const t = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false }); t.texture.generateMipmaps = false; return t; };
  const sceneRT = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, samples: 4, depthTexture: new THREE.DepthTexture(2, 2) });
  const a1 = T(), b1 = T(), a2 = T(), b2 = T(), dofRT = T(), aoRT = T(), aoTmp = T();
  const lens = { tDepth: { value: sceneRT.depthTexture }, uNear: { value: 0.05 }, uFar: { value: 80 }, uFocus: { value: 5 }, uScale: { value: 11 }, uMaxBlur: { value: 10 } };
  const bright = mat(POST_BRIGHT, { tColor: { value: sceneRT.texture }, uThresh: { value: 1.15 }, uPx: { value: new THREE.Vector2() } });
  const blur = mat(POST_BLUR, { tMap: { value: null }, uDir: { value: new THREE.Vector2() } });
  const dof = mat(POST_DOF, { ...lens, tColor: { value: sceneRT.texture }, uPx: { value: new THREE.Vector2() } });
  const ao = mat(POST_AO, { tDepth: { value: sceneRT.depthTexture }, uProj: { value: new THREE.Matrix4() }, uProjInv: { value: new THREE.Matrix4() }, uRadius: { value: 0.11 }, uTexel: { value: new THREE.Vector2() } });
  const fin = mat(POST_FINAL, { ...lens, tColor: { value: sceneRT.texture }, tDof: { value: dofRT.texture }, tGlow1: { value: a1.texture }, tGlow2: { value: a2.texture }, tAO: { value: aoRT.texture }, uAO: { value: 0.9 }, uDof: { value: 1 }, uFxaa: { value: 0 }, uPxS: { value: new THREE.Vector2() }, uExposure: { value: 1.05 }, uGlow: { value: 0.42 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2() } });
  const depthOnly = new THREE.MeshBasicMaterial({ colorWrite: false });
  let W = 2, H = 2;
  const on = { dof: true, ao: true };
  const pass = (m, target) => { quad.material = m; renderer.setRenderTarget(target); renderer.render(fs, fcam); };
  const blurInto = (src, tmp, dst, w, h) => {
    blur.uniforms.tMap.value = src.texture; blur.uniforms.uDir.value.set(1 / w, 0); pass(blur, tmp);
    blur.uniforms.tMap.value = tmp.texture; blur.uniforms.uDir.value.set(0, 1 / h); pass(blur, dst);
  };
  return {
    lens, ao, fin,
    // (sw by sh is the screen; the room's own picture is drawn within `px` pixels and enlarged to it:
    // most of it is soft with the lens anyway, and the art is laid on after at the screen's own size)
    setSize(sw, sh, px = Infinity) {
      const k = Math.min(1, Math.sqrt(px / (sw * sh)));
      const w = Math.max(2, Math.round(sw * k)), h = Math.max(2, Math.round(sh * k));
      W = w; H = h;
      lens.uMaxBlur.value = 10 * k; // (the same blur on the screen; fewer steps to gather it)
      sceneRT.setSize(w, h);
      const w2 = Math.max(2, w >> 1), h2 = Math.max(2, h >> 1), w4 = Math.max(2, w >> 2), h4 = Math.max(2, h >> 2), w8 = Math.max(2, w >> 3), h8 = Math.max(2, h >> 3);
      dofRT.setSize(w2, h2); a1.setSize(w4, h4); b1.setSize(w4, h4); a2.setSize(w8, h8); b2.setSize(w8, h8);
      aoRT.setSize(w2, h2); aoTmp.setSize(w2, h2);
      this.w2 = w2; this.h2 = h2;
      dof.uniforms.uPx.value.set(1 / w2, 1 / h2);
      fin.uniforms.uRes.value.set(sw, sh);
      fin.uniforms.uPxS.value.set(1 / w, 1 / h);
      bright.uniforms.uPx.value.set(1 / w, 1 / h);
      ao.uniforms.uTexel.value.set(1 / w, 1 / h);
      this.w4 = w4; this.h4 = h4; this.w8 = w8; this.h8 = h8;
    },
    // which parts of the finish are drawn: the lens, the contact shadow, and how finely edges are smoothed
    quality({ msaa, dof: d, ao: a, fxaa }) {
      on.dof = !!d; on.ao = !!a;
      fin.uniforms.uDof.value = d ? 1 : 0; fin.uniforms.uAO.value = a ? 0.75 : 0;
      fin.uniforms.uFxaa.value = fxaa ? 1 : 0;
      if (sceneRT.samples !== msaa) { sceneRT.samples = msaa; sceneRT.dispose(); }
    },
    render(scene, camera, { focus, time, artLayer, airLayer }) {
      lens.uNear.value = camera.near; lens.uFar.value = camera.far; lens.uFocus.value = focus;
      fin.uniforms.uTime.value = time;
      // the room, without the art (with the air: light in it that has no surface)
      camera.layers.set(0); camera.layers.enable(airLayer);
      renderer.setRenderTarget(sceneRT);
      renderer.clear();
      renderer.render(scene, camera);
      // the glow round its brightest points, at a quarter and an eighth of the size
      pass(bright, a1);
      blurInto(a1, b1, a1, this.w4, this.h4);
      blurInto(a1, b2, a2, this.w8, this.h8);
      // the lens, at half size
      if (on.dof) pass(dof, dofRT);
      // the shadow where things meet, softened
      ao.uniforms.uProj.value.copy(camera.projectionMatrix); ao.uniforms.uProjInv.value.copy(camera.projectionMatrixInverse);
      if (on.ao) { pass(ao, aoRT); blurInto(aoRT, aoTmp, aoRT, this.w2, this.h2); }
      // all of it, graded, to the screen
      renderer.setRenderTarget(null);
      renderer.clear();
      quad.material = fin;
      renderer.render(fs, fcam);
      // and the art laid on, exactly, behind whatever stands in front of it
      const bg = scene.background, ac = renderer.autoClear;
      renderer.autoClear = false;
      scene.background = null;
      // (only what has a surface stands in front of the art: not the air)
      camera.layers.set(0);
      scene.overrideMaterial = depthOnly;
      renderer.render(scene, camera);
      scene.overrideMaterial = null;
      camera.layers.set(artLayer);
      renderer.render(scene, camera);
      camera.layers.set(0); camera.layers.enable(artLayer); camera.layers.enable(airLayer);
      scene.background = bg;
      renderer.autoClear = ac;
      void W; void H;
    },
    dispose() { [sceneRT, a1, b1, a2, b2, dofRT, aoRT, aoTmp].forEach((t) => t.dispose()); },
  };
}

// the light through leaves that are not there: a gobo for the key light, soft leaf shadows on light
function goboTexture() {
  const S = 512, c = document.createElement('canvas');
  c.width = c.height = S;
  const x = c.getContext('2d'), r = rnd(19);
  x.fillStyle = '#fff'; x.fillRect(0, 0, S, S);
  for (let i = 0; i < 95; i++) {
    const px = r() * S, py = r() * S, len = 18 + r() * 60, wid = len * (0.32 + r() * 0.2), a = r() * Math.PI;
    x.save(); x.translate(px, py); x.rotate(a); x.scale(1, wid / len);
    const g = x.createRadialGradient(0, 0, 0, 0, 0, len);
    const k = 0.5 + r() * 0.4;
    g.addColorStop(0, `rgba(10, 12, 10, ${k})`); g.addColorStop(0.6, `rgba(10, 12, 10, ${k * 0.75})`); g.addColorStop(1, 'rgba(10, 12, 10, 0)');
    x.fillStyle = g; x.beginPath(); x.arc(0, 0, len, 0, TAU); x.fill(); x.restore();
  }
  // (and the light's own falloff to its edge, so its circle never shows)
  const v = x.createRadialGradient(S / 2, S / 2, S * 0.22, S / 2, S / 2, S * 0.5);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.85)');
  x.fillStyle = v; x.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

// light passing through a thin leaf or petal from behind: the rim light's direction, in the view's
// space, set each frame; a material given it glows where that light is behind it
const BACK_DIR = { value: new THREE.Vector3(0, 0, -1) };
function glowThrough(m, k, tint) {
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey?.call(m) || '';
  m.customProgramCacheKey = () => `br-glow-${k}-${tint}-${prevKey}`;
  m.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(m, sh, r); // (after whatever the material already does)
    sh.uniforms.uBackDir = BACK_DIR;
    sh.fragmentShader = `uniform vec3 uBackDir;\n${sh.fragmentShader.replace('#include <opaque_fragment>', `outgoingLight += diffuseColor.rgb * vec3(${tint}) * ${k.toFixed(3)} * pow(clamp(dot(-normal, uBackDir), 0.0, 1.0), 1.4);\n  #include <opaque_fragment>`)}`;
  };
  return m;
}

// ---------------------------------------------------------------- the branch, and what hangs from it

// the branch's course: from its broken foot on the floor at the left, an S rising to a hook at the top
const COURSE = [
  [-1.2, 0.03, 0.2], [-0.55, 0.3, 0.05], [0.35, 0.45, -0.05], [0.95, 0.85, 0], [0.85, 1.45, 0.05],
  [0.2, 1.72, 0], [-0.55, 1.9, -0.05], [-0.95, 2.4, 0], [-0.7, 2.95, 0.05], [0.1, 3.1, 0],
  [0.8, 3.35, -0.05], [1.05, 3.85, 0], [0.8, 4.28, 0.05], [0.25, 4.38, 0], [-0.15, 4.3, -0.03],
];
// (15 Nov, the user: "the design which is currently hanging with a thread… see if you can do
// something else, or better placements… have the liberty") Each piece now rests on the branch, in
// the crook of a bough, leaning back on a small twig, as if set there by hand: the branch is its
// support, as the capital was the pedestal's. Where each stands (x along its bough), how far it leans
// and turns, and the side its label is on.
// (16 Nov, the user's own concept, at last: "these art pieces will be stuck on… the tree, like in
// real life how a paper or a poster would get stuck… between the branches, between the flowers…
// they flew by the wind and got stuck") So each piece is now a sheet of paper the wind brought and
// the tree caught: bowed a little, tilted at its own angle, its lowest corner snagged on a bough, a
// twig across that corner, flowers at its others, its free edge stirring. Where each is caught, how
// it leans, turns and tilts, how much it bows, and the side its label is on.
const PLACES = [
  { x: -0.2, y: 3.05, lean: 0.24, yaw: 0.2, roll: 0.36, bow: 0.034, curl: 0.075, side: -1 },   // the day's, on the bough across the middle
  { x: 0.17, y: 1.75, lean: 0.2, yaw: -0.24, roll: -0.4, bow: 0.03, curl: 0.07, side: 1 }, // the week's, on the bough below it
  { x: -0.1, y: 0.4, lean: 0.28, yaw: 0.12, roll: 0.3, bow: 0.036, curl: 0.08, side: -1 },  // the month's, on the lowest, near the water
];
const HONOUR = ['Art of the day', 'Art of the week', 'Art of the month'];
const ROOM = '#000000'; // (the floor falls away to black, so the room is black too: no horizon)

// ---------------------------------------------------------------- the milkweed, and who lives on it
// (14 Nov, the user: "put some flowers and something related to caterpillars… very aesthetic") The
// plant is milkweed, the one plant a monarch caterpillar eats: umbels of small dusty-rose star flowers
// on fine stems, sage leaves (one bitten along its edge), pods, one split and spilling its silk, its
// seeds drifting up into the dark on that silk. (The monarch that lives on it: js/corner-monarch.js.)

const Y_UP = new THREE.Vector3(0, 1, 0);
const along = (d) => new THREE.Quaternion().setFromUnitVectors(Y_UP, d.clone().normalize());
// several small shapes made into one, each with its own colour (for vertex colours)
function merge(parts) {
  let n = 0;
  const qs = parts.map(({ g, m, color }) => { const q = (g.index ? g.toNonIndexed() : g.clone()).applyMatrix4(m); n += q.attributes.position.count; return { q, color }; });
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3);
  let o = 0;
  for (const { q, color } of qs) {
    const c = q.attributes.position.count;
    P.set(q.attributes.position.array, o * 3); N.set(q.attributes.normal.array, o * 3);
    if (q.attributes.color) C.set(q.attributes.color.array, o * 3);
    else for (let i = 0; i < c; i++) C.set(color, (o + i) * 3);
    o += c;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(N, 3));
  g.setAttribute('color', new THREE.BufferAttribute(C, 3));
  return g;
}
const lin = (hex) => new THREE.Color(hex).toArray();
// an ellipsoid of these sizes, its long axis along d, its middle at p
const blob = (g, p, d, w, l, t, color) => ({ g, m: new THREE.Matrix4().compose(p, along(d), new THREE.Vector3(w / 2, l / 2, t / 2)), color });

// one milkweed flower, its stalk along +y: five rose petals turned back, a crown of five paler hoods
function floretGeometry() {
  // (15 Nov: 148 triangles, not 880: a flower is a few pixels across from the whole branch, and there
  // are over two thousand of them)
  const s = new THREE.SphereGeometry(1, 5, 3), s2 = new THREE.SphereGeometry(1, 4, 2), parts = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU, d = new THREE.Vector3(Math.cos(a), -0.55, Math.sin(a)).normalize();
    parts.push(blob(s, d.clone().multiplyScalar(0.0046).add(new THREE.Vector3(0, 0.0012, 0)), d, 0.0048, 0.0095, 0.0016, lin('#cf93a3')));
    const b = a + Math.PI / 5, h = new THREE.Vector3(Math.cos(b) * 0.55, 1, Math.sin(b) * 0.55).normalize();
    parts.push(blob(s2, h.clone().multiplyScalar(0.0028).add(new THREE.Vector3(0, 0.0018, 0)), h, 0.0026, 0.0052, 0.0022, lin('#f4e0e3')));
  }
  parts.push(blob(s2, new THREE.Vector3(0, 0.0034, 0), Y_UP, 0.0026, 0.0024, 0.0026, lin('#e0c2a8')));
  const g = merge(parts);
  // (each petal deeper towards the flower's heart and paler at its tip)
  const p = g.attributes.position, c = g.attributes.color;
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) > 0.0013) continue;
    const k = 0.6 + 0.6 * clamp(Math.hypot(p.getX(i), p.getZ(i)) / 0.0095, 0, 1);
    c.setXYZ(i, c.getX(i) * k, c.getY(i) * k * 0.97, c.getZ(i) * k);
  }
  return g;
}

// a leaf: long along +x, its face up +y, folded a little along its midrib, curling down to its tip;
// `bites` takes half-moons out of its right edge, as a caterpillar leaves them
function leafGeometry({ L = 0.15, W = 0.075, fold = 0.18, curl = 0.025, bites = [] }) {
  const U = 40, V = 12, pos = [], col = [], idx = [], lv = [];
  const wAt = (u, side) => {
    let w = W * 0.5 * Math.pow(Math.sin(Math.PI * Math.min(1, u * 1.04)), 0.75) * (1 - 0.18 * u);
    if (side > 0) for (const [c, r] of bites) { const d = (u - c) * L; if (Math.abs(d) < r) w = Math.max(0.0015, w - Math.sqrt(r * r - d * d)); }
    return w;
  };
  for (let i = 0; i <= U; i++) for (let j = 0; j <= V; j++) {
    const u = i / U, v = (j / V) * 2 - 1, side = v < 0 ? -1 : 1, w = wAt(u, side);
    const x = u * L, z = v * w, y = fold * Math.abs(z) - curl * u * u;
    pos.push(x, y, z);
    lv.push(u, v); // (where on the leaf: along it, and across from the midrib, for its veins)
    // (its colour across, paler midrib to darker edge, is worked out per pixel in leafSkin: kept here
    // per point it zigzagged along the long thin triangles of the edge; 16 Nov)
    col.push(1, 1, 1);
  }
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
    const a = i * (V + 1) + j, b = a + 1, c = a + V + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('aLeaf', new THREE.Float32BufferAttribute(lv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// a sheet of paper, w by h, centred, facing +z: bowed back a little across its width and twisted a
// touch, as a sheet caught in a branch is, its free top corner (across from the snagged one, on the
// side -lowX) lifting towards you in the wind; every part of the art still shows. Its rest shape is
// kept so its free edge can stir
function paperGeometry(w, h, bow, curl = 0, lowX = 1) {
  const g = new THREE.PlaneGeometry(w, h, 20, 20), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = (2 * p.getX(i)) / w, v = (2 * p.getY(i)) / h;
    const k = Math.max(0, ((-lowX * u + v) / 2 - 0.3) / 0.7);
    p.setZ(i, -bow * (1 - u * u) + bow * 0.35 * u * v + curl * k * k);
  }
  g.userData.rest = Float32Array.from(p.array);
  g.computeVertexNormals();
  return g;
}

// a leaf's skin: a paler raised midrib, side veins running out from it towards the tip, each a fine
// groove the light finds, and a waxy sheen
function leafSkin(tex) {
  const m = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.35, side: THREE.DoubleSide, envMapIntensity: 0.6 });
  m.customProgramCacheKey = () => 'br-leaf-3';
  m.onBeforeCompile = (sh) => {
    sh.uniforms.tLeaf = { value: tex };
    sh.vertexShader = `attribute vec2 aLeaf;\nvarying vec2 vLeaf;\n${sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vLeaf = aLeaf;')}`;
    sh.fragmentShader = `uniform sampler2D tLeaf;\nvarying vec2 vLeaf;\nvec2 lfUv = vec2(0.0);\nfloat lf0 = 0.0;
float lfH(vec2 uv) { vec2 v = texture2D(tLeaf, uv).rg; return max(v.r, v.g * 0.7); }
vec3 lfBump(vec3 pos, vec3 N, float dhx, float dhy) {
  vec3 dpx = dFdx(pos), dpy = dFdy(pos);
  vec3 r1 = cross(dpy, N), r2 = cross(N, dpx); float det = dot(dpx, r1);
  return normalize(abs(det) * N - sign(det) * (dhx * r1 + dhy * r2));
}
${sh.fragmentShader
      .replace('#include <color_fragment>', `#include <color_fragment>
  {
    lfUv = vec2(vLeaf.x, vLeaf.y * 0.5 + 0.5);
    vec2 vn = texture2D(tLeaf, lfUv).rg;
    lf0 = max(vn.r, vn.g * 0.7);
    // (the midrib a little paler, the face shading softly darker to the edge, no outline)
    float av = abs(vLeaf.y);
    vec3 lc = mix(vec3(0.1144, 0.1779, 0.0844), vec3(0.2623, 0.3278, 0.1878), 1.0 - smoothstep(0.06, 0.13, av));
    lc = mix(lc, vec3(0.0931, 0.1470, 0.0704), smoothstep(0.15, 1.0, av) * 0.6);
    diffuseColor.rgb *= lc;
    diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 1.45 + vec3(0.015, 0.02, 0.0), vn.r * 0.75 + vn.g * 0.4);
    diffuseColor.rgb *= 0.86 + 0.14 * smoothstep(0.0, 0.5, vLeaf.x) * (1.0 - abs(vLeaf.y) * 0.3);
  }`)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n  normal = lfBump(-vViewPosition, normal, 0.0007 * (lfH(lfUv + dFdx(lfUv)) - lf0), 0.0007 * (lfH(lfUv + dFdy(lfUv)) - lf0));')}`;
  };
  return m;
}

// a milkweed pod, hanging from its stalk at the origin, its tip curving down and out; warty
function podGeometry({ L = 0.13, R = 0.027, open = false }) {
  const prof = [];
  for (let k = 0; k <= 28; k++) {
    const t = k / 28;
    prof.push(new THREE.Vector2(Math.max(0.0004, R * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.02)), 0.72) * (1 - 0.35 * t)), -t * L));
  }
  const g = open ? new THREE.LatheGeometry(prof, 30, 0.9, TAU - 1.8) : new THREE.LatheGeometry(prof, 30);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), t = -y / L, r = Math.hypot(x, z) || 1;
    const wart = 0.0022 * Math.max(0, noise(x * 160, y * 160, z * 160)) * Math.sin(Math.PI * t);
    p.setXYZ(i, x + (x / r) * wart + 0.03 * t * t, y, z + (z / r) * wart);
  }
  g.computeVertexNormals();
  return g;
}

// a seed on its silk: a flat brown oval and a tuft of fine white floss above it
function seedOf(silkMat) {
  const g = new THREE.Group();
  const s = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: new THREE.Color('#6b4a2e'), roughness: 0.6 }));
  s.scale.set(0.0042, 0.0016, 0.003);
  g.add(s);
  const pts = [], r = rnd(Math.floor(Math.random() * 1e6) + 1);
  for (let k = 0; k < 34; k++) {
    const a = r() * TAU, sp = 0.35 + r() * 0.75, l = 0.022 + r() * 0.016;
    pts.push(0, 0.001, 0, Math.cos(a) * Math.sin(sp) * l, Math.cos(sp) * l, Math.sin(a) * Math.sin(sp) * l);
  }
  const lg = new THREE.BufferGeometry();
  lg.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  g.add(new THREE.LineSegments(lg, silkMat));
  return g;
}

export function createBranch(host, { picks, art, open, reduced, local, wide, tag }) {
  const stage = el('div', 'cp-mu-stage cp-pd-stage');
  const canvas = el('canvas', 'cp-mu-gl');
  canvas.setAttribute('aria-hidden', 'true');
  const hits = el('div', 'cp-mu-hits');
  const hint = el('p', 'cp-mu-hint', 'Scroll to come closer');
  const br = el('div', 'cp-pd-c cp-pd-br');
  const say = el('p', 'cp-pd-say');
  stage.append(canvas, hits, br, say, hint);
  if (tag) stage.append(el('p', 'cp-mu-tag', tag));
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  if (!renderer.getContext()) return null;
  host.classList.add('is-room', 'is-branch');
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
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 80);
  // (on a laptop, the photograph's finish; the art lives on its own layer so it is laid on after)
  const ART = 1, AIR = 2;
  const post = wide ? makePost(renderer) : null;
  // ---- how much work the picture takes (15 Nov: it ran at 22 ms a frame on an M3, so it lagged).
  // Four steps, the same picture drawn with less (the user, 15 Nov: "we're not compromising on the
  // aesthetics… a proper balance"; so every step keeps the water's reflection, the glow and the grade,
  // and all but the last keep the lens): the pixels the room's own picture is drawn in (the art is
  // always at the screen's size), how finely its edges are smoothed, the lens, the contact shadow, how
  // often the shadows are redrawn (every n frames) and the size of the reflection (softened by the
  // water's ripples anyway). A machine starts on a step by its cores and memory; then the governor (in
  // frame) watches how long frames really take and steps down. Aimed at the office laptops most
  // people have, not only at an M3.
  const TIERS = [
    { post: true, px: 0.9e6, msaa: 0, fxaa: 1, dof: 0, ao: 0, every: 4, mirror: 0.3, shadow: 1024 },
    { post: true, px: 1.15e6, msaa: 2, fxaa: 1, dof: 1, ao: 0, every: 3, mirror: 0.35, shadow: 1024 },
    { post: true, px: 1.7e6, msaa: 2, fxaa: 1, dof: 1, ao: 1, every: 2, mirror: 0.42, shadow: 2048 },
    // (16 Nov: drawing this step at the screen's full size was tried and cost three times as much, the
    // lens gathering far more samples for a softness no one sees; the leaves' steps were the shadow's
    // offset, not the size. So it is drawn within 2.5 million pixels, as before)
    { post: true, px: 2.5e6, msaa: 4, fxaa: 0, dof: 1, ao: 1, every: 2, mirror: 0.5, shadow: 2048 },
  ];
  // (where to start: by the graphics chip's name where the browser gives it, so an office laptop does
  // not spend its first seconds being stepped down; else by cores and memory)
  const cores = navigator.hardwareConcurrency || 4, mem = navigator.deviceMemory || 8;
  let gpu = '';
  try { const g = renderer.getContext(), ext = g.getExtension('WEBGL_debug_renderer_info'); gpu = String(ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)); } catch (e) {}
  let q = !wide ? 0
    : /Apple|NVIDIA|GeForce|RTX|GTX|Radeon (RX|Pro)|\bArc\b/i.test(gpu) ? 3
      : /Iris|\bXe\b/i.test(gpu) ? 2
        : /Intel|UHD|HD Graphics|Mali|Adreno|SwiftShader|llvmpipe|Microsoft Basic/i.test(gpu) ? 1
          : cores >= 8 && mem >= 8 ? 3 : 2;
  try { const kept = sessionStorage.getItem('mm-branch-q'); if (wide && kept != null) q = clamp(Number(kept) || 0, 0, 3); } catch (e) {}
  let Q = TIERS[q];
  if (post) post.quality(Q);
  // (the pane's timer frames are not the screen's: no governing there, so tests see what they set)
  const governed = wide && !(local && /frames=timer/.test(location.search));
  let ema = 0, counted = 0, slow = 0, crawl = 0, quick = 0, calm = 0, warm = 0, wentUp = false, lastMs = 0, frameNo = 0;
  camera.layers.enable(ART); camera.layers.enable(AIR);

  // a dark studio for the little sheen the wood and the threads have
  const pm = new THREE.PMREMGenerator(renderer);
  const env = new THREE.Scene();
  env.background = new THREE.Color(0.004, 0.004, 0.005);
  const panel = (w, h, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(k, k * 0.97, k * 0.93), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 2, 0); env.add(m);
  };
  panel(3, 2, 4, [-4, 6, 5]);
  panel(0.6, 6, 1.6, [5, 3, -3]);
  scene.environment = pm.fromScene(env, 0.03).texture;
  pm.dispose();

  // ---- the floor: still dark water (15 Nov), holding the branch's reflection; rings spread slowly
  // from where the wood stands in it and a slow swell moves over it, bending the reflection; it falls
  // away into the dark
  const mirror = wide ? mirrorOf() : null;
  const WATER = { uTime: { value: 0 }, uFoot: { value: new THREE.Vector2(COURSE[0][0] + 0.04, COURSE[0][2]) } };
  const floorMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#010102'), roughness: mirror ? 0.2 : 0.42, envMapIntensity: 0.06 });
  floorMat.customProgramCacheKey = () => (mirror ? 'br-water' : 'br-floor');
  floorMat.onBeforeCompile = (sh) => {
    if (mirror) Object.assign(sh.uniforms, mirror.U, WATER);
    sh.vertexShader = `varying vec3 vMirrorW;\n${sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vMirrorW = (modelMatrix * vec4(transformed, 1.0)).xyz;')}`;
    sh.fragmentShader = `${mirror ? `${MIRROR}\nuniform float uTime;\nuniform vec2 uFoot;\nvec2 brRipple(vec2 p) {
  // rings from the foot of the branch: their slope, as a nudge to where the reflection is read
  vec2 d = p - uFoot; float r = length(d) + 1e-4;
  float k = 30.0, ph = r * k - uTime * 1.5;
  vec2 ring = (d / r) * cos(ph) * exp(-r * 0.9) * smoothstep(0.03, 0.2, r) * 0.0016;
  // and a slow swell over all of it
  vec2 swell = vec2(cos(p.x * 2.6 + p.y * 1.4 + uTime * 0.42), sin(p.y * 2.2 - p.x * 1.1 - uTime * 0.37)) * 0.0011
             + vec2(sin(p.x * 6.1 - uTime * 0.8 + p.y * 3.0), cos(p.y * 5.3 + uTime * 0.7)) * 0.0004;
  return ring + swell;
}` : 'varying vec3 vMirrorW;'}\n${sh.fragmentShader.replace('#include <opaque_fragment>', `${mirror ? `{
    vec4 mp = uMirrorMatrix * vec4(vMirrorW, 1.0);
    vec2 muv = mp.xy / mp.w + brRipple(vMirrorW.xz) * 9.0;
    vec3 rr = vec3(0.0);
    for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) rr += texture2D(tMirror, muv + vec2(float(i), float(j)) * uMirrorTexel * 1.1).rgb;
    rr /= 9.0;
    float fres = 0.3 + 0.7 * pow(1.0 - clamp(normalize(cameraPosition - vMirrorW).y, 0.0, 1.0), 4.0);
    outgoingLight += rr * fres * uMirrorK * 0.78;
  }` : ''}
  outgoingLight *= 1.0 - smoothstep(1.3, 3.9, length(vMirrorW.xz * vec2(0.72, 1.0)));
  #include <opaque_fragment>`)}`;
  };
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // ---- the branch and its two short broken boughs
  const woodRT = woodTexture(renderer);
  const joins = { at: { value: Array.from({ length: MAX_JOINS }, () => new THREE.Vector4(0, -99, 0, 0.001)) }, k: { value: new Array(MAX_JOINS).fill(0) }, n: { value: 0 } };
  const wood = woodMat(woodRT.texture, joins), twigWood = wood; // (one wood; how bleached a limb is, it carries itself)
  const main = limb(COURSE, { r0: 0.165, r1: 0.026, seed: 1, rings: 520, sides: 32, broken0: true, broken1: false, tip: true });
  const branch = new THREE.Group();
  const trunk = new THREE.Mesh(main.g, wood);
  trunk.castShadow = trunk.receiveShadow = true;
  branch.add(trunk);
  // (a bough flares where it leaves the trunk, and is the trunk's own colour there, whatever it is at its tip)
  // (16 Nov) where something meets the wood (a stem, a twig, a bough, a sheet's corner), the bark is
  // darkened softly round it once, at the start: the shadow that gathers in a join, baked in, so it
  // is there on every step and never swims as the camera moves
  const boughs = [], contact = [];
  const bough = (t, to, rk, seed, r1 = 0.012, silver = 0) => {
    const p = main.curve.getPointAt(t), r = main.radiusAt(t);
    const pts = [[p.x, p.y, p.z], ...to.map(([x, y, z]) => [p.x + x, p.y + y, p.z + z])];
    const b = limb(pts, { r0: r * rk, r1, seed, rings: 130, sides: 24, broken1: false, tip: true, collar: r, flareBy: 0.5, silver, silver0: 0 });
    const m = new THREE.Mesh(b.g, wood);
    m.castShadow = m.receiveShadow = true;
    branch.add(m);
    boughs.push(m);
    m.userData.limb = b; // (its course, for the monarch that pupates under the first)
    // (a soft shadow on the trunk all round where it leaves)
    contact.push({ p: p.clone().addScaledVector(new THREE.Vector3(...to[0]).normalize(), r), R: r * 1.1, k: 0.4 });
    return m;
  };
  bough(0.36, [[0.18, 0.12, 0.08], [0.42, 0.18, 0.12], [0.6, 0.32, 0.1]], 0.55, 4);
  // (the upper one dead and bleached, as the twigs are, so it never goes black against the night)
  bough(0.62, [[-0.12, 0.18, -0.06], [-0.28, 0.42, -0.04], [-0.32, 0.6, 0.02]], 0.5, 7, 0.02, 0.55);
  scene.add(branch);
  branch.userData.say = 'Driftwood: a branch the water turned to silver.';

  // where on the branch a point is nearest
  const nearestT = (x, y) => { let bt = 0, bd = 1e9; const v = new THREE.Vector3(); for (let i = 0; i <= 800; i++) { main.curve.getPointAt(i / 800, v); const dd = (v.x - x) ** 2 + (v.y - y) ** 2; if (dd < bd) { bd = dd; bt = i / 800; } } return bt; };
  const up = new THREE.Vector3(0, 1, 0);
  const onTop = (t, lift = 0) => {
    const c = main.curve.getPointAt(t), T = main.curve.getTangentAt(t), r = main.radiusAt(t);
    const u = up.clone().addScaledVector(T, -up.dot(T)).normalize();
    return c.addScaledVector(u, r + lift);
  };

  // ---- the milkweed and who lives on it (see the builders above)
  const eggs = [];
  const named = (o, text) => { if (!o) return; o.traverse((m) => { if (m.isMesh || m.isInstancedMesh) { m.userData.say = text; eggs.push(m); } }); };
  // the bark at a point of the branch, on the side facing `dir`: found by dropping onto it
  const barkAt = (t, dir) => {
    const c = main.curve.getPointAt(t), d = dir.clone().normalize();
    const hit = new THREE.Raycaster(c.clone().addScaledVector(d, 0.5), d.clone().negate(), 0, 0.8).intersectObject(trunk, false)[0];
    return hit ? { p: hit.point, n: hit.face.normal.clone() } : { p: c.addScaledVector(d, main.radiusAt(t)), n: d };
  };
  const stemMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#56653f'), roughness: 0.7, envMapIntensity: 0.4 });
  // (leaves and petals let the rim light through, as thin living things do)
  const leafRT = leafTexture(renderer);
  const leafMat = glowThrough(leafSkin(leafRT.texture), 1.1, '0.75, 1.0, 0.45');
  // (a stem's own colour, green, browning and swelling where it comes out of the bark)
  const stemRootMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, envMapIntensity: 0.4 });
  const silkMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#e8ebee'), transparent: true, opacity: 0.75 });
  const floret = floretGeometry();
  // (15 Nov, to draw it with far less work: it was 900 separate draws a frame) Every flower of every
  // umbel belongs to one of three sets drawn together, by height (one near each piece, so a close
  // view still leaves the other two out); their fine stalks and the plain leaves the same; all the
  // stems are one shape. They are gathered here as they are placed, and made at the end (plantOut).
  const bandOf = (y) => (y < 1.15 ? 0 : y < 2.5 ? 1 : 2);
  const sets = [0, 1, 2].map(() => ({ fm: [], fc: [], pm: [], lm: [] }));
  const stemGeos = [], pedicels = [];
  const leafAt = (base, dirOut, size, bites) => {
    // its length along dirOut, its face turned up and towards you
    const X = dirOut.clone().normalize(), n0 = new THREE.Vector3(0, 0.7, 0.7);
    const Y = n0.addScaledVector(X, -n0.dot(X)).normalize(), Z = new THREE.Vector3().crossVectors(X, Y);
    if (!bites || !bites.length) {
      // (a plain leaf is one of a set: only where it is, how it lies and its size are kept)
      sets[bandOf(base.y)].lm.push(...new THREE.Matrix4().makeBasis(X, Y, Z).scale(new THREE.Vector3(size, size, size)).setPosition(base).elements);
      return null;
    }
    const m = new THREE.Mesh(leafGeometry({ L: 0.15 * size, W: 0.072 * size, bites }), leafMat);
    m.matrix.makeBasis(X, Y, Z).setPosition(base);
    m.matrixAutoUpdate = false;
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  // an umbel of flowers on its stem from the bark, with a pair of leaves along the stem
  // (big enough to read from the whole branch: an umbel about a hand across, a flower 4 cm)
  const UMBELS = [
    { at: [-0.98, 0.12], dir: [-0.75, 1, 0.3], len: 0.42, n: 40, R: 0.1 }, // (clear of the month's label)
    { at: [0.95, 0.9], dir: [1, 0.55, 0.25], len: 0.34, n: 34, R: 0.085 },
    { at: [-0.93, 2.35], dir: [-1, 0.45, 0.3], len: 0.38, n: 38, R: 0.095 },
    { at: [1.04, 3.72], dir: [1, -0.05, 0.35], len: 0.3, n: 32, R: 0.085 },
    { at: [-0.12, 4.31], dir: [-0.25, 1, 0.25], len: 0.24, n: 26, R: 0.075 },
    { at: [0.66, 3.22], dir: [0.9, -0.4, 0.4], len: 0.24, n: 28, R: 0.08 }, // (drooping, beside the chrysalis)
  ];
  const FL = 2.5; // the flowers' size, against the floret's own
  UMBELS.forEach((u) => { u.R *= 1.2; u.n = Math.round(u.n * 1.2); });
  // (16 Nov, the user: "maybe you can use more") more of it along the branch, in thickets
  UMBELS.push(
    { at: [-0.6, 0.36], dir: [-0.2, 1, 0.55], len: 0.36, n: 36, R: 0.1, more: 2 },
    { at: [-0.78, 2.95], dir: [-0.7, 0.8, 0.4], len: 0.38, n: 40, R: 0.11, more: 2 },
    { at: [0.97, 3.55], dir: [1, 0.5, 0.2], len: 0.34, n: 36, R: 0.1, more: 1 },
    { at: [0.3, 4.38], dir: [0.15, 1, 0.35], len: 0.3, n: 34, R: 0.1, more: 1 },
    { at: [0.88, 1.2], dir: [1, 0.2, 0.45], len: 0.36, n: 36, R: 0.1, more: 2 },
    { at: [0.62, 2.45], dir: [0.8, 0.7, 0.4], len: 0.3, n: 34, R: 0.1, more: 1 },
    { at: [-0.35, 3.98], dir: [-0.6, 0.9, 0.3], len: 0.3, n: 34, R: 0.1, more: 1 },
  );
  const stems = [];
  // an umbel on its stem, from start to end, with a pair of leaves along the stem
  // (16 Nov) a point put on the bark: the nearest place on the wood's actual surface, found by a ray
  // from outside towards the heart of the bough nearest it (a point dropped straight down could miss
  // where the bough curves away, and leave a stem starting in the air beside it). `into` points into the
  // wood from there. Kept where it was if the wood is not close.
  const woods = [trunk, ...boughs], v3 = new THREE.Vector3();
  function toBark(p) {
    let bt = 0, bd = 1e9;
    for (let k = 0; k <= 800; k++) { main.curve.getPointAt(k / 800, v3); const d = v3.distanceToSquared(p); if (d < bd) { bd = d; bt = k / 800; } }
    const heart = main.curve.getPointAt(bt), out = p.clone().sub(heart);
    if (out.lengthSq() < 1e-8) out.set(0, 1, 0);
    out.normalize();
    const from = heart.clone().addScaledVector(out, main.radiusAt(bt) * 2 + 0.08);
    const hit = new THREE.Raycaster(from, out.clone().negate(), 0, 2).intersectObjects(woods, false)[0];
    if (!hit || hit.point.distanceTo(p) > 0.16) return { p: p.clone(), into: out.negate() };
    return { p: hit.point.clone(), into: out.negate() };
  }
  function umbel(start, end, { n = 40, R = 0.11, seed = 1, leaves = 1.6, bend = 0.02, leafTs = [0.42], root = true } = {}) {
    const dir = end.clone().sub(start).normalize(), len = start.distanceTo(end);
    const mid = start.clone().lerp(end, 0.5).addScaledVector(dir, bend).add(new THREE.Vector3(0, -len * 0.06, 0));
    // (a stem from the bark starts two centimetres inside it, sunk towards the bough's heart, so it
    // comes out of the bark square to its surface and its foot never shows; then it bends its own way)
    let pts = [start, mid, end];
    if (root) {
      const b = toBark(start);
      start = b.p.addScaledVector(b.into, 0.004);
      pts = [start.clone().addScaledVector(b.into, 0.024), start, mid, end];
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    stemGeos.push(stemTube(curve, root));
    if (root) contact.push({ p: start.clone(), R: 0.05, k: 0.45 });
    stems.push(curve);
    // the umbel: flowers on fine stalks, all from one point, over a dome facing out and up
    const C = end, D = curve.getTangentAt(1).add(new THREE.Vector3(0, 0.6, 0.35)).normalize();
    const N = n, r = rnd(31 + seed * 7);
    const set = sets[bandOf(C.y)];
    const tmpM = new THREE.Matrix4(), q0 = along(D);
    for (let k = 0; k < N; k++) {
      // (a golden spiral over a cap of the dome, each a little jittered)
      const h = (k + 0.5) / N, th = Math.acos(1 - h * (1 - Math.cos(1.25))), ph = k * 2.39996 + r() * 0.3;
      const local = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)).applyQuaternion(q0);
      const L = R * (0.88 + 0.24 * r());
      const pos = C.clone().addScaledVector(local, L), s = (0.85 + 0.3 * r()) * FL;
      set.fm.push(...tmpM.compose(pos, along(local), new THREE.Vector3(s, s, s)).elements);
      const tone = 0.86 + 0.18 * r();
      set.fc.push(tone, tone, tone);
      set.pm.push(...tmpM.compose(C, along(local), new THREE.Vector3(1, L, 1)).elements);
    }
    // its leaves, in pairs along the stem, each pair turned a little from the last
    if (leaves) leafTs.forEach((lt, li) => {
      const p = curve.getPointAt(lt), T = curve.getTangentAt(lt);
      const S = new THREE.Vector3().crossVectors(T, new THREE.Vector3(0, 0, 1)).normalize().applyAxisAngle(T, li * 0.9);
      const sz = leaves * (1 - 0.18 * li);
      for (const sd of [-1, 1]) named(leafAt(p, S.clone().multiplyScalar(sd).add(new THREE.Vector3(0, -0.25, 0.3)).addScaledVector(T, 0.35), sz, []), 'A milkweed leaf.');
    });
    return curve;
  }
  // everything gathered above, made: three sets of flowers, of their stalks and of leaves, and one
  // shape for every stem
  // (milkweed flowers are waxy: a clear coat that catches the light in small sharp highlights)
  const floretMat = glowThrough(new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.4, clearcoat: 0.7, clearcoatRoughness: 0.22, envMapIntensity: 0.8 }), 0.75, '1.0, 0.72, 0.78');
  function plantOut() {
    const pedGeo = new THREE.CylinderGeometry(0.0012, 0.0015, 1, 3).translate(0, 0.5, 0), leafBase = leafGeometry({ L: 0.15, W: 0.072 });
    const drawn = (geo, mat, arr, col) => {
      const n = arr.length / 16;
      if (!n) return null;
      const m = new THREE.InstancedMesh(geo, mat, n);
      m.instanceMatrix.array.set(arr);
      m.instanceMatrix.needsUpdate = true;
      if (col) m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(col), 3);
      m.computeBoundingSphere();
      scene.add(m);
      return m;
    };
    sets.forEach((st) => {
      const fl = drawn(floret, floretMat, st.fm, st.fc), pd = drawn(pedGeo, stemMat, st.pm), lf = drawn(leafBase, leafMat, st.lm);
      if (fl) { fl.castShadow = true; named(fl, 'Milkweed: the one plant a monarch caterpillar eats.'); }
      if (pd) pedicels.push(pd);
      if (lf) { lf.castShadow = lf.receiveShadow = true; named(lf, 'A milkweed leaf.'); }
    });
    if (stemGeos.length) {
      const I = new THREE.Matrix4(), all = new THREE.Mesh(merge(stemGeos.map((g) => ({ g, m: I, color: [1, 1, 1] }))), stemRootMat);
      all.castShadow = true;
      scene.add(all);
      named(all, 'Milkweed: the one plant a monarch caterpillar eats.');
    }
  }
  // (16 Nov, the user: the join of the green stems with the wood looked wrong: a thin tube pushed into
  // the bark.) A stem now grows out of it: it swells over its first two centimetres to two and a half
  // times its width, sinking into the bark, and browns there to the wood's own colour; the rings are
  // closer together near its foot, where it bends most. A stem that starts on another stem does not.
  function stemTube(curve, root) {
    const segs = 24, sides = 8, len = curve.getLength(), green = lin('#56653f'), base = lin('#6b5a43');
    const pos = [], nor = [], col = [], idx = [];
    const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), c = new THREE.Vector3(), d = new THREE.Vector3();
    curve.getTangentAt(0, T);
    N.set(0, 0, 1).addScaledVector(T, -T.z); if (N.lengthSq() < 1e-4) N.set(1, 0, 0).addScaledVector(T, -T.x); N.normalize();
    // (its rings closest where it leaves the bark, about 2.6 cm along, where it swells and browns)
    const near = root ? [0, 0.012, 0.02, 0.026, 0.03, 0.033, 0.036, 0.04, 0.045, 0.052, 0.062, 0.076].filter((a) => a < len * 0.5) : [0];
    const from = near[near.length - 1], rest = segs - near.length + 1;
    const rings = [...near, ...Array.from({ length: rest }, (_, i) => from + ((len - from) * (i + 1)) / rest)];
    for (let i = 0; i < rings.length; i++) {
      const at = rings[i], t = Math.min(1, at / len);
      curve.getPointAt(t, c); curve.getTangentAt(t, T);
      N.addScaledVector(T, -N.dot(T)).normalize(); B.crossVectors(T, N);
      const out = Math.max(0, at - 0.028); // (how far above the bark: it starts about 2.8 cm in)
      // (16 Nov: green right into the bark, its own width: a brown foot read as a black cut across the
      // stem, and any swell caught the light on its top as a pale lip. The soft shadow on the bark round
      // it is the join)
      const r = 0.0058, k = 0; void out;
      const cc = green.map((g, q) => g + (base[q] - g) * k);
      for (let j = 0; j <= sides; j++) {
        const a = (j / sides) * TAU;
        d.copy(N).multiplyScalar(Math.cos(a)).addScaledVector(B, Math.sin(a));
        pos.push(c.x + d.x * r, c.y + d.y * r, c.z + d.z * r); nor.push(d.x, d.y, d.z); col.push(...cc);
      }
    }
    for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < sides; j++) {
      const a = i * (sides + 1) + j, b = a + sides + 1;
      idx.push(a, b, a + 1, a + 1, b, b + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.setIndex(idx);
    return g;
  }
  // the joins gathered in `contact` handed to the wood, which darkens round each per pixel
  function darkenJoins() {
    contact.slice(0, MAX_JOINS).forEach((j, i) => { joins.at.value[i].set(j.p.x, j.p.y, j.p.z, j.R); joins.k.value[i] = j.k; });
    joins.n.value = Math.min(contact.length, MAX_JOINS);
  }
  // a whole plant: its stem with leaves in pairs up it, an umbel at its top and more on short
  // stalks from its upper leaves, leaning out towards `out`
  function plant(start, end, { n = 40, R = 0.11, seed = 1, leaves = 1.3, bend = 0.03, out = new THREE.Vector3(1, 0, 0), more = 1, leafTs = [0.3, 0.62] } = {}) {
    const curve = umbel(start, end, { n, R, seed, leaves, bend, leafTs: wide ? leafTs : leafTs.slice(0, 2) });
    if (!wide) more = Math.min(more, 1); // (a phone draws the same thicket a little lighter)
    for (let k = 0; k < more; k++) {
      const at = 0.58 + 0.16 * k, p = curve.getPointAt(at), T = curve.getTangentAt(at);
      const d = out.clone().normalize().multiplyScalar(k % 2 ? -0.7 : 1).add(T).add(new THREE.Vector3(0, 0.5, 0.25)).normalize();
      const L = start.distanceTo(end) * (0.36 - 0.06 * k);
      umbel(p, p.clone().addScaledVector(d, L), { n: Math.round(n * 0.7), R: R * 0.8, seed: seed + 40 + k, leaves: 0, bend: 0.01, root: false });
    }
    return curve;
  }
  for (const [ui, U] of UMBELS.entries()) {
    const t = nearestT(U.at[0], U.at[1]), dir = new THREE.Vector3(...U.dir).normalize();
    const b = barkAt(t, dir);
    const start = b.p.clone().addScaledVector(dir, -0.012);
    const end = start.clone().addScaledVector(dir, U.len).add(new THREE.Vector3(0, U.len * 0.25, 0));
    if (U.more && wide) plant(start, end, { n: U.n, R: U.R, seed: ui, leaves: 1.4, out: new THREE.Vector3(U.dir[0], 0, 0), more: U.more });
    else umbel(start, end, { n: U.n, R: U.R, seed: ui, leaves: 1.5 + 0.3 * (ui % 2) });
  }

  // (16 Nov) the monarch's caterpillar and its chrysalis are no longer still here: one monarch lives its
  // whole change across the three pieces (js/corner-monarch.js, made below once the pieces are placed)

  // the pods: one closed under the left bough, one split on the rising bough, spilling its silk
  const podMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#77806a'), roughness: 0.6, envMapIntensity: 0.4 });
  const podIn = new THREE.MeshStandardMaterial({ color: new THREE.Color('#d9cfb8'), roughness: 0.7, side: THREE.BackSide });
  {
    const t = nearestT(-0.5, 1.9), b = barkAt(t, new THREE.Vector3(0, -1, 0.2));
    const pod = new THREE.Mesh(podGeometry({ L: 0.13, R: 0.026 }), podMat);
    pod.position.copy(b.p); pod.rotation.set(0.15, 0.4, 0.12); pod.scale.setScalar(1.55);
    pod.castShadow = true;
    scene.add(pod);
    named(pod, 'A milkweed pod, still closed.');
  }
  let mouth = new THREE.Vector3();
  {
    const t = nearestT(-0.84, 2.78), b = barkAt(t, new THREE.Vector3(-1, -0.2, 0.35));
    const g = new THREE.Group();
    g.position.copy(b.p);
    g.rotation.set(-0.35, -0.5, -0.55);
    g.scale.setScalar(1.55);
    const geo = podGeometry({ L: 0.14, R: 0.028, open: true });
    const shell = new THREE.Mesh(geo, podMat), inner = new THREE.Mesh(geo, podIn);
    shell.castShadow = true;
    g.add(shell, inner);
    // its seeds inside, and the floss spilling from its mouth
    const seedMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#6b4a2e'), roughness: 0.6 });
    const sg = new THREE.SphereGeometry(1, 8, 6), r = rnd(77);
    for (let k = 0; k < 9; k++) {
      const s = new THREE.Mesh(sg, seedMat), y = -0.03 - k * 0.0095;
      s.position.set(0.006 + (k % 2) * 0.004, y, 0.006 + (k % 3) * 0.003);
      s.scale.set(0.0042, 0.0016, 0.003); s.rotation.set(0.4, r() * 2, 0.2);
      g.add(s);
    }
    const fl = [];
    for (let k = 0; k < 90; k++) {
      const y = -0.025 - r() * 0.08, a = 0.6 + r() * 0.9, l = 0.02 + r() * 0.05;
      const ox = 0.008, oz = 0.01;
      fl.push(ox, y, oz, ox + Math.cos(a) * l * 0.8, y + l * (0.3 + r() * 0.6), oz + Math.sin(a) * l);
    }
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(fl, 3));
    g.add(new THREE.LineSegments(lg, silkMat));
    scene.add(g);
    named(g, 'Its pods split, and the seeds leave on silk.');
    g.updateMatrixWorld(true);
    mouth = new THREE.Vector3(0.02, -0.06, 0.02).applyMatrix4(g.matrixWorld);
  }
  // the seeds leaving: each drifts up and away from the split pod on its silk, slowly, then fades
  const seeds = [];
  for (let k = 0; k < (wide ? 11 : 6); k++) {
    const mat = silkMat.clone();
    const s = seedOf(mat);
    s.userData.mat = mat;
    s.userData.ph = k / (wide ? 11 : 6);
    s.userData.dx = -0.25 - 0.5 * ((k * 0.37) % 1);
    s.userData.dz = 0.1 + 0.25 * ((k * 0.61) % 1);
    scene.add(s);
    seeds.push(s);
  }
  // the same wind that brought the papers, still blowing: a few loose leaves and petals carried slowly
  // across, in front and behind, turning over
  const blown = [];
  {
    const r = rnd(83), petal = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#d39aab'), roughness: 0.45, clearcoat: 0.5, side: THREE.DoubleSide });
    const petalGeo = new THREE.SphereGeometry(1, 10, 6).scale(0.014, 0.003, 0.024);
    for (let k = 0; k < (wide ? 9 : 5); k++) {
      const leaf = k % 3 !== 2;
      const m = leaf ? new THREE.Mesh(leafGeometry({ L: 0.09 + r() * 0.04, W: 0.045 + r() * 0.02, fold: 0.25, curl: 0.03 }), leafMat) : new THREE.Mesh(petalGeo, petal);
      m.castShadow = true;
      m.userData = { period: 34 + r() * 22, ph: r(), y: 0.8 + r() * 3.4, z: -0.9 + r() * 2.0, spin: (0.3 + r() * 0.5) * (r() < 0.5 ? -1 : 1) };
      scene.add(m);
      blown.push(m);
    }
  }
  // (fine strands of silk across the boughs were taken out on 16 Nov: close up they read as wires)

  // ---- the light: one warm key from above and to the left, through leaves that are not there (a
  // gobo, drifting a little as if in a breeze); a strong cool rim from behind that edges the wood and
  // shines through the leaves and petals; a breath of fill
  const key = new THREE.SpotLight(0xffe6c8, 0, 0, 0.44, 0.55, 0);
  key.position.set(-3.6, 6.4, 6.2);
  key.target.position.set(0, 2.0, 0);
  key.map = goboTexture();
  key.castShadow = true;
  // (15 Nov: 2048, not 4096, and redrawn every few frames, not every one: it was the largest single cost)
  key.shadow.mapSize.set(wide ? Q.shadow : 1024, wide ? Q.shadow : 1024);
  // (crisper: the soft part of a shadow is the occlusion's job now)
  // (16 Nov: a shadow's edge fell across the leaves in stair steps a shadow texel wide. Its picture is
  // now fitted to the tree, not to the whole cone of light (focus), so its texels are smaller, and
  // softened over three of them, so an edge is a soft fall, never steps)
  key.shadow.focus = 0.7;
  key.shadow.radius = !wide ? 2.5 : Q.shadow >= 2048 ? 3.2 : 2.2;
  key.shadow.blurSamples = 8;
  key.shadow.bias = -0.00015;
  // (16 Nov: 0.0005, not 0.008. Pushed eight millimetres along its surface, a thin leaf looked up its
  // shadow from beside itself and caught a false one, in steps along its facets: the "pixels on the
  // leaf". The softened shadow does not speckle without it)
  key.shadow.normalBias = 0.0005;
  key.shadow.camera.near = 5; key.shadow.camera.far = 15;
  key.shadow.camera.layers.enable(ART); // (the art casts its shadow, though it is laid on after)
  scene.add(key, key.target);
  const lean = new THREE.SpotLight(0xffe6c8, 0, 0, 0.5, 0.8, 0);
  lean.position.copy(key.position);
  lean.target.position.copy(key.target.position);
  scene.add(lean, lean.target);
  const rim = new THREE.DirectionalLight(0xbcd2ff, 0);
  rim.position.set(3.2, 4.2, -4.4);
  scene.add(rim);
  // (a second, fainter rim from the other side, low, so both edges of a bough are drawn in light)
  const rim2 = new THREE.DirectionalLight(0x9fb4d8, 0);
  rim2.position.set(-4, 1.2, -3.5);
  scene.add(rim2);
  // (a visible beam of light through the air was tried on 15 Nov and taken out on 16 Nov: the user
  // wanted the light and shadow on the things themselves, not a haze; the AIR layer is kept for
  // anything like it)
  const beam = null;
  // (far behind, a faint night blue where the light falls, so the dark has depth)
  {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    // (high behind the branch, falling to black well before the floor's far edge, so no horizon)
    const x = c.getContext('2d'), g = x.createRadialGradient(150, 70, 0, 140, 80, 150);
    g.addColorStop(0, '#0f192b'); g.addColorStop(0.3, '#060a13'); g.addColorStop(0.58, '#000'); g.addColorStop(1, '#000');
    x.fillStyle = g; x.fillRect(0, 0, 256, 256);
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    const back = new THREE.Mesh(new THREE.PlaneGeometry(26, 18), new THREE.MeshBasicMaterial({ map: tx }));
    back.position.set(0.3, 2.6, -7.5);
    scene.add(back);
  }
  const fill = new THREE.DirectionalLight(0xffeedd, 0);
  fill.position.set(4, 1.5, 4);
  scene.add(fill);
  const hemi = new THREE.HemisphereLight(0x8a8f99, 0x050506, 0);
  scene.add(hemi);

  // ---- the pieces: each a sheet of paper the wind brought, caught in the tree (see PLACES)
  // the top of the bark straight above a point: found by dropping onto the branch
  const barkTop = (x, z, yGuess) => {
    const hit = new THREE.Raycaster(new THREE.Vector3(x, yGuess + 0.6, z), new THREE.Vector3(0, -1, 0), 0, 1.2).intersectObject(trunk, false)[0];
    return hit ? hit.point.y : yGuess;
  };
  const paperBack = new THREE.MeshStandardMaterial({ color: new THREE.Color('#e7e3da'), roughness: 0.9, side: THREE.BackSide });
  const cards = picks.slice(0, 3).map((k, i) => {
    const H = PLACES[i];
    const ratio = (k.pc.ratio || 0.8) / (1 - 2 * BARS(k.pc));
    const h = Math.min(0.6, 0.52 / ratio), w = h * ratio;
    const lowX = H.roll > 0 ? -1 : 1; // (which bottom corner is lower: the one the tree caught)
    const geo = paperGeometry(w, h, H.bow, H.curl, lowX);
    const sheet = new THREE.Group();
    sheet.position.set(H.x, H.y + h * 0.5, 0.03);
    sheet.rotation.set(-H.lean, H.yaw, H.roll, 'YXZ');
    const face = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
    face.castShadow = true;
    if (post) face.layers.set(ART); // (laid on after the photograph's finish, exactly as it is)
    const back = new THREE.Mesh(geo, paperBack);
    back.position.z = -0.003; // (a hair behind, so it never stands in front of the art)
    back.castShadow = back.receiveShadow = true;
    sheet.add(face, back);
    scene.add(sheet);
    // (settled so its lowest corner is snagged just into the bark, the other held up)
    sheet.updateMatrixWorld(true);
    let dy = -1;
    for (const sx of [-1, 1]) {
      const c = new THREE.Vector3(sx * w / 2, -h / 2, 0).applyMatrix4(sheet.matrixWorld);
      dy = Math.max(dy, barkTop(c.x, 0, c.y) - c.y);
    }
    sheet.position.y += dy - 0.014;
    sheet.updateMatrixWorld(true);
    const at = (x, y, z) => new THREE.Vector3(x, y, z).applyMatrix4(sheet.matrixWorld);
    // the bark under a point given on the sheet: the point dropped onto the branch, a hair into it
    const foot = (x, y, z) => { const p = at(x, y, z); p.y = barkTop(p.x, p.z, p.y) - 0.008; return p; };
    const arr = (...ps) => ps.map((p) => [p.x, p.y, p.z]);
    // a dead twig, bleached, forked, that holds its snagged corner: its stem rises from the bark in
    // front of that corner and crosses it, then forks beside the sheet, one prong up and out into the
    // air, the other back behind the sheet's edge, so the corner is pinched between them
    {
      const lx = lowX;
      const s0b = toBark(foot(lx * (w / 2 - 0.1), -h / 2 - 0.02, 0.04)), s0 = s0b.p.addScaledVector(s0b.into, 0.008), s1 = at(lx * (w / 2 - 0.045), -h / 2 + 0.045, 0.036), s2 = at(lx * (w / 2 + 0.03), -h / 2 + 0.13, 0.03);
      const F = at(lx * (w / 2 + 0.07), -h / 2 + 0.2, 0.024), a1 = at(lx * (w / 2 + 0.13), -h / 2 + 0.33, 0.04), a2 = at(lx * (w / 2 + 0.15), -h / 2 + 0.45, 0.03);
      const tw = limb(arr(s0, s1, s2, F, a1, a2), { r0: 0.022, r1: 0.005, seed: 21 + i * 5, rings: 110, sides: 16, twist: 1.4, broken1: false, tip: true, silver: 0.55, silver0: 0.2, collar: 0.01, flareBy: 0.4 });
      const b0 = at(lx * (w / 2 + 0.05), -h / 2 + 0.165, 0.026), b1 = at(lx * (w / 2 + 0.07), -h / 2 + 0.3, -0.03), b2 = at(lx * (w / 2 + 0.02), -h / 2 + 0.47, -0.06);
      const pr = limb(arr(b0, b1, b2), { r0: 0.011, r1: 0.0045, seed: 24 + i * 5, rings: 60, sides: 12, twist: 1.6, broken1: false, tip: true, silver: 0.55 });
      for (const g of [tw.g, pr.g]) { const m = new THREE.Mesh(g, twigWood); m.castShadow = m.receiveShadow = true; branch.add(m); named(m, 'A dead twig, holding on.'); }
      contact.push({ p: s0.clone(), R: 0.05, k: 0.75 }, { p: toBark(at(lx * w / 2, -h / 2, 0)).p, R: 0.065, k: 0.55 });
    }
    // the milkweed it blew into: one plant in front of its lifted bottom corner, filling the gap under
    // it, leaves across that corner; a tall one behind its free side that its lifted corner leans on,
    // its umbels past the edge and over the top; a smaller one behind its snagged side
    {
      const hx = -lowX;
      const OUT = (sx) => new THREE.Vector3(1, 0, 0).applyQuaternion(sheet.quaternion).multiplyScalar(sx);
      plant(foot(hx * (w / 2 - 0.06), -h / 2 - 0.03, 0.07), at(hx * (w / 2 + 0.14), -h / 2 + 0.3, 0.09), { n: 40, R: 0.11, seed: 50 + i * 3, leaves: 1.25, bend: hx * 0.03, out: OUT(hx), more: 1, leafTs: [0.22, 0.55] });
      plant(foot(hx * (w / 2 - 0.04), -h / 2 - 0.02, -0.11), at(hx * (w / 2 + 0.05), h / 2 + 0.06, -0.09), { n: 46, R: 0.125, seed: 56 + i * 3, leaves: 1.35, bend: hx * 0.05, out: OUT(hx), more: 2, leafTs: [0.25, 0.5, 0.72] });
      plant(foot(lowX * (w / 2 + 0.06), -h / 2, -0.09), at(lowX * (w / 2 + 0.12), h * 0.18, -0.07), { n: 38, R: 0.105, seed: 62 + i * 3, leaves: 1.2, bend: lowX * 0.03, out: OUT(lowX), more: 1, leafTs: [0.3, 0.6] });
    }
    art(k.pc, 1200).then((url) => {
      new THREE.TextureLoader().load(url, (tx) => {
        tx.colorSpace = THREE.SRGBColorSpace;
        tx.anisotropy = 8;
        const bars = BARS(k.pc);
        if (bars) { tx.repeat.set(1, 1 - 2 * bars); tx.offset.set(0, bars); }
        face.material.map = tx; face.material.needsUpdate = true;
      });
    });
    // its label, and the button over it
    const lab = el('div', `cp-br-lab${H.side < 0 ? ' is-left' : ''}`);
    const more = el('div', 'cp-br-more');
    more.append(el('p', 'cp-br-t', k.title), el('p', 'cp-br-m', k.maker), el('p', 'cp-br-d', k.when || ''));
    lab.append(el('p', 'cp-br-n', String(i + 1).padStart(2, '0')), el('p', 'cp-br-h', HONOUR[i]), more);
    stage.append(lab);
    const hit = el('button', 'cp-mu-hit'), img = el('img');
    hit.type = 'button'; img.alt = '';
    hit.append(img);
    hit.setAttribute('aria-label', `${HONOUR[i]}: ${k.title} by ${k.maker}`);
    hit.addEventListener('click', () => open(k.pc, { art: hit, img, b: hit }));
    hits.append(hit);
    const centre = at(0, 0, 0);
    return { k, sheet, face, geo, w, h, lowX, side: H.side, centre, lab, more, hit, img, ph: i * 2.1 };
  });
  if (!cards.length) return null;
  plantOut();
  darkenJoins();
  // the monarch's life across the three pieces (16 Nov): egg to egg, eating by the day's, a chrysalis by the
  // week's, a butterfly laying its egg by the month's (js/corner-monarch.js, which places its own leaves)
  const monarch = cards.length === 3 ? createMonarch({ scene, main, trunk, bough: { mesh: boughs[0], limb: boughs[0].userData.limb }, barkAt, leafAt, eggs, reduced }) : null;


  // ---- where the camera stands: the whole branch, then close to each piece in turn
  const N = cards.length, WALK = 0.86;
  let top = 0, span = 1, vw = 1, vh = 1, narrow = false, baseFov = 30;
  // the flights between stops: a departure handle (from the stop left) and an arrival handle (onto
  // the stop reached), each an offset from that stop's eye. The whole branch to the day's: a crane
  // swinging in from high on the left. The day's to the week's: down the S on the right, the bough
  // sliding past close in front. The week's to the month's: a swing low on the left, past the flowers.
  const FLIGHT = [
    [[-1.6, 1.8, -3.2], [-1.3, 0.35, 1.2]],
    [[0.9, -0.1, 0.45], [0.95, 0.25, -0.45]],
    [[-0.35, -0.4, 0.5], [-1.25, -0.2, -0.45]],
  ];
  const h1 = new THREE.Vector3(), h2 = new THREE.Vector3();
  const bezier = (out, a, b, c, d, t) => { const u = 1 - t; return out.set(0, 0, 0).addScaledVector(a, u * u * u).addScaledVector(b, 3 * u * u * t).addScaledVector(c, 3 * u * t * t).addScaledVector(d, t * t * t); };
  function layout() {
    vw = stage.clientWidth || innerWidth;
    vh = stage.clientHeight || innerHeight;
    narrow = vw / vh < 1;
    // (never more than six million pixels on the screen itself, however large the display)
    renderer.setPixelRatio(Math.max(1, Math.min(devicePixelRatio || 1, wide ? 2 : 1.6, Math.sqrt(6e6 / (vw * vh)))));
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.fov = baseFov = narrow ? 46 : 30;
    camera.updateProjectionMatrix();
    if (mirror) { const pr = renderer.getPixelRatio(), k = Q.mirror || 0.25; mirror.size(Math.max(2, Math.round(vw * pr * k)), Math.max(2, Math.round(vh * pr * k))); }
    if (post) { const s = renderer.getDrawingBufferSize(new THREE.Vector2()); post.setSize(s.x, s.y, Q.px || 1e6); }
    top = host.getBoundingClientRect().top + scrollY;
    span = Math.max(1, host.offsetHeight - vh);
    dirty = true;
  }
  const progress = () => clamp((scrollY - top) / span, 0, 1);
  const stopY = (s) => top + (s / N) * WALK * span;
  // a stop's eye and aim: 0 is the whole branch, 1 to 3 the pieces
  const pose = (s) => {
    if (s === 0) return narrow
      ? { eye: new THREE.Vector3(0.1, 2.2, 7.6), aim: new THREE.Vector3(-0.02, 2.05, 0) }
      : { eye: new THREE.Vector3(0.25, 2.5, 11.2), aim: new THREE.Vector3(0.0, 2.12, 0) };
    const c = cards[s - 1], P = c.centre;
    if (narrow) return { eye: new THREE.Vector3(P.x + 0.08, P.y + 0.12, P.z + 2.5), aim: new THREE.Vector3(P.x, P.y - 0.2, P.z) };
    // (a little below the piece and looking slightly down, so the bough it rests on is in the frame)
    const lo = PLACES[s - 1].low || 0;
    return { eye: new THREE.Vector3(P.x + c.side * 0.3 + 0.14, P.y + 0.28 - lo * 0.7, P.z + 2.4), aim: new THREE.Vector3(P.x + c.side * 0.3, P.y - 0.06 - lo, P.z) };
  };

  // ---- the pointer: the key light leans with it; resting on the hidden ones says what they are
  const pointer = { x: 0.5, y: 0.5, on: false, px: 0, py: 0 };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  ray.layers.enableAll();
  let sayTimer = 0, saying = '';
  const tell = (text, x, y) => {
    if (text === saying) return;
    saying = text;
    clearTimeout(sayTimer);
    if (!text) { say.classList.remove('is-on'); return; }
    sayTimer = setTimeout(() => {
      say.textContent = text;
      say.style.transform = `translate(${Math.round(clamp(x + 18, 12, vw - 260))}px, ${Math.round(clamp(y - 10, 60, vh - 60))}px)`;
      say.classList.add('is-on');
    }, 420);
  };
  const look = (x, y) => {
    ndc.set((x / vw) * 2 - 1, -(y / vh) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hitAt = ray.intersectObjects([...eggs, ...branch.children, ...cards.map((c) => c.face)], false)[0];
    if (!hitAt || cards.some((c) => c.face === hitAt.object)) return '';
    return hitAt.object.userData.say || branch.userData.say;
  };
  const onMove = (e) => {
    const r = stage.getBoundingClientRect();
    pointer.px = e.clientX - r.left; pointer.py = e.clientY - r.top;
    pointer.on = r.top < 2 && r.bottom > innerHeight - 2 && pointer.py >= 0 && pointer.py <= r.height;
    if (!pointer.on) { tell(''); return; }
    pointer.x = pointer.px / vw; pointer.y = pointer.py / vh;
    if (e.pointerType === 'mouse') tell(look(pointer.px, pointer.py), pointer.px, pointer.py);
  };
  addEventListener('pointermove', onMove, { passive: true });
  let holdT = 0;
  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    const r = stage.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
    clearTimeout(holdT);
    holdT = setTimeout(() => { const t = look(x, y); if (t) { tell(t, x, y); setTimeout(() => tell(''), 2600); } }, 380);
  });
  stage.addEventListener('pointerup', () => clearTimeout(holdT));
  stage.addEventListener('pointercancel', () => clearTimeout(holdT));

  // ---- arriving: the light comes up on it
  let lit = reduced ? 1 : 0;
  const io = new IntersectionObserver((es) => {
    if (es.some((e) => e.isIntersecting) && lit < 1) gsap.to({ v: lit }, { v: 1, duration: 2.4, ease: 'power2.out', onUpdate() { lit = this.targets()[0].v; } });
  }, { threshold: 0.2 });
  io.observe(host);

  // ---- each frame while it is on the screen (the pieces turn on their threads, so it always draws)
  let dirty = true, alive = true, wasInside = false, lastOp = -1, hinted = false, shown = -1;
  const lk = { x: 0, y: 0 };
  const tmp = new THREE.Vector3(), eye = new THREE.Vector3(), aim = new THREE.Vector3();
  const screenOf = (v) => { tmp.copy(v).project(camera); return [(tmp.x * 0.5 + 0.5) * vw, (-tmp.y * 0.5 + 0.5) * vh]; };
  const t0 = performance.now();
  let tFrozen = null;
  // a step of work chosen (by the governor, or by hand): the finish's parts, the sizes, kept for the visit
  function setQuality(n) {
    q = clamp(Math.round(n), 0, TIERS.length - 1);
    Q = TIERS[q];
    if (post) post.quality(Q);
    // (the shadow's own picture, made anew at its size for this step; softened to the same width)
    if (wide && key.shadow.mapSize.x !== Q.shadow) {
      key.shadow.mapSize.set(Q.shadow, Q.shadow);
      key.shadow.radius = Q.shadow >= 2048 ? 3.2 : 2.2;
      key.shadow.map?.dispose(); key.shadow.map = null;
      key.shadow.mapPass?.dispose(); key.shadow.mapPass = null;
    }
    try { sessionStorage.setItem('mm-branch-q', String(q)); } catch (e) {}
    warm = 0; counted = slow = crawl = quick = 0;
    layout();
  }
  // is any of the water near the branch on screen?
  const floorPts = [[-1.6, 0, 1.2], [0, 0, 1.6], [1.6, 0, 1.2], [-1.2, 0, 0], [1.2, 0, 0], [0, 0, 0.4], [0, 0, -1.2], [0, 0, 3]].map((p) => new THREE.Vector3(...p));
  const fp = new THREE.Vector3();
  const floorSeen = () => floorPts.some((p) => { fp.copy(p).project(camera); return fp.z < 1 && Math.abs(fp.x) < 1.2 && Math.abs(fp.y) < 1.2; });
  const hidden = [floor, ...pedicels]; // (not drawn in the reflection: the floor itself, and the flowers' fine stalks)
  function frame() {
    if (!alive) return;
    const r = host.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = progress();
    const time = tFrozen ?? (performance.now() - t0) / 1000;
    const tx = pointer.on ? pointer.x - 0.5 : 0, ty = pointer.on ? pointer.y - 0.5 : 0;
    lk.x += (tx - lk.x) * (reduced ? 1 : 0.06); lk.y += (ty - lk.y) * (reduced ? 1 : 0.06);
    if (!hinted && p > 0.01) { hinted = true; hint.classList.add('is-done'); }
    // the walk: the whole branch, then each piece, dwelling at each. Between two, a flight on a curve
    // (16 Nov): it leaves along one handle and arrives along another, so it swings round the branch
    // rather than sliding straight; in flight the lens opens a breath wider and banks a touch; at
    // rest it drifts slowly round the piece
    const sw = clamp(p / WALK, 0, 1) * N, i = Math.min(N - 1, Math.floor(sw)), f = smooth(0.22, 0.78, sw - i);
    const A = pose(i), B = pose(i + 1), V = FLIGHT[i], hk = narrow ? 0.45 : 1;
    h1.fromArray(V[0]).multiplyScalar(hk).add(A.eye); h2.fromArray(V[1]).multiplyScalar(hk).add(B.eye);
    bezier(eye, A.eye, h1, h2, B.eye, f);
    aim.lerpVectors(A.aim, B.aim, Math.pow(f, 0.85));
    const fly = Math.sin(Math.PI * f), rest = reduced ? 0 : 1 - fly;
    eye.x += rest * 0.05 * Math.sin(time * 0.13 + i * 1.7);
    eye.y += rest * 0.025 * Math.sin(time * 0.17 + i * 2.3);
    camera.position.copy(eye).add(tmp.set(lk.x * 0.18, -lk.y * 0.1, 0));
    const roll = reduced ? 0 : fly * 0.02 * (i % 2 ? -1 : 1);
    camera.up.set(Math.sin(roll), Math.cos(roll), 0);
    camera.lookAt(aim);
    const fov = baseFov + fly * 4;
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    camera.updateMatrixWorld();
    // the monarch: where in its life it is, from how far the walk has come (after the camera, which it
    // keeps pace with in flight)
    if (monarch) monarch.update(clamp(p / WALK, 0, 1) * N, p, WALK, time, camera);
    // (16 Nov: the key, which casts the shadows and carries the dapples, stands still: when it leaned
    // with the pointer and drifted, every shadow edge crawled across its texels. The pointer leans a
    // second warm light that casts none, so the highlights still follow the hand)
    lean.position.set(-3.6 + lk.x * 3.2, 6.4 - lk.y * 1.8, 6.2);
    WATER.uTime.value = reduced ? 0 : time;
    if (beam) {
      beam.position.copy(key.position);
      beam.quaternion.setFromUnitVectors(tmp.set(0, -1, 0), key.target.position.clone().sub(key.position).normalize());
      beam.material.uniforms.uK.value = 0.028 * lit;
    }
    key.intensity = 8.0 * lit;
    lean.intensity = 2.4 * lit;
    rim.intensity = 2.6 * lit;
    rim2.intensity = 0.9 * lit;
    fill.intensity = 0.18 * lit;
    hemi.intensity = 0.16 * lit;
    // the sheets stirring in the breeze: pinned at the snagged corner, the rest lifting and settling,
    // most at the far corner
    if (!reduced) cards.forEach((c) => {
      const P = c.geo.attributes.position, R0 = c.geo.userData.rest, pinX = c.lowX * c.w / 2, pinY = -c.h / 2, diag = Math.hypot(c.w, c.h);
      for (let v = 0; v < P.count; v++) {
        const x = R0[v * 3], y = R0[v * 3 + 1], wgt = Math.pow(Math.hypot(x - pinX, y - pinY) / diag, 1.6);
        P.setZ(v, R0[v * 3 + 2] + wgt * (0.011 * Math.sin(time * 1.9 + c.ph + x * 3.1 + y * 2.2) + 0.006 * Math.sin(time * 3.7 + c.ph * 2 - x * 5)));
      }
      P.needsUpdate = true;
    });
    // the wind's own: leaves and petals blown slowly across, turning over as they go
    blown.forEach((b) => {
      const d = b.userData, u = ((time / d.period + d.ph) % 1 + 1) % 1;
      b.position.set(lerp(-3.2, 3.2, u), d.y + 0.25 * Math.sin(u * TAU * 1.5 + d.ph * 5) - 0.4 * u, d.z);
      b.rotation.set(time * d.spin + d.ph * 3, time * d.spin * 0.7, Math.sin(time * 0.9 + d.ph) * 0.8);
      b.visible = !reduced;
    });
    // the seeds leaving the split pod on their silk: up and away, swaying, fading as they go
    seeds.forEach((s) => {
      const d = s.userData, u = reduced ? 0.15 + d.ph * 0.6 : (time / 28 + d.ph) % 1;
      const sway = Math.sin(time * 0.55 + d.ph * 9) * 0.05 * u;
      s.position.copy(mouth).add(tmp.set(d.dx * u + sway, 1.05 * u + 0.03 * Math.sin(time * 0.8 + d.ph * 5) * u, d.dz * u));
      s.rotation.set(0.25 * Math.sin(time * 0.4 + d.ph * 3), time * 0.2 + d.ph * 6, 0.2 * Math.sin(time * 0.5 + d.ph * 2));
      const o = smooth(0.0, 0.08, u) * (1 - smooth(0.68, 1, u));
      d.mat.opacity = 0.8 * o;
      s.scale.setScalar((0.4 + 0.6 * o) * 1.45);
      s.visible = o > 0.02;
    });
    // which piece is near: its label grows its title and maker
    const near = (j) => (j + 1 === i ? 1 - f : 0) + (j + 1 === i + 1 ? f : 0); // how close piece j's stop (j + 1) is
    const now = f < 0.5 ? i : i + 1;
    if (now !== shown) { shown = now; br.innerHTML = ''; br.append(el('p', 'cp-pd-n', now ? `${String(now).padStart(2, '0')} / 03` : ''), el('p', 'cp-pd-small', `© ${new Date().getFullYear()}`)); }
    // the way out: into the night
    const op = 1 - smooth(WALK + 0.03, 1, p);
    if (Math.abs(op - lastOp) > 0.002) { lastOp = op; stage.style.opacity = op.toFixed(3); stage.style.visibility = op < 0.01 ? 'hidden' : ''; }
    const inside = r.top <= 1 && op > 0.5;
    if (inside !== wasInside) { wasInside = inside; document.documentElement.classList.toggle('cc-in-room', inside); }
    scene.updateMatrixWorld();
    // the governor: how long frames are really taking while this is on screen; when they run long
    // for a while, the picture is drawn with a step less work (and the step is kept for the visit)
    const nowMs = performance.now();
    if (governed && tFrozen == null && !document.hidden) {
      const dt = nowMs - lastMs;
      // (a gap is a tab left or a first drawing, not a slow machine; the first frames after coming
      // into view or changing step are warming up)
      if (dt > 250) warm = 0;
      else if (dt > 4 && ++warm > 30) {
        ema = ema ? ema + (dt - ema) * 0.08 : dt;
        counted++; if (dt > 22) slow++; if (dt > 42) crawl++; if (dt < 12.5) quick++;
        if (counted >= 50) {
          // most of the last fifty frames ran long: a step less work (two, if they crawled)
          if (slow > 30 && q > 0) { if (wentUp) wentUp = 'no more'; setQuality(q - (crawl > 30 ? 2 : 1)); calm = 0; }
          // four calm stretches in a row with room to spare: try a step more, once
          else if (quick > 46 && q < 3 && !wentUp && ++calm >= 4) { wentUp = true; setQuality(q + 1); calm = 0; }
          else if (quick <= 46) calm = 0;
          counted = slow = crawl = quick = 0;
        }
      }
    }
    lastMs = nowMs;
    // (the shadows move slowly, only with the sheets' edges and the blown leaves: redrawn every few
    // frames, and whenever the picture was set anew)
    if (frameNo++ % Q.every === 0 || dirty) renderer.shadowMap.needsUpdate = true;
    dirty = false;
    BACK_DIR.value.copy(rim.position).normalize().transformDirection(camera.matrixWorldInverse);
    // (the water is drawn again from below only while some of it is on screen)
    if (mirror && floorSeen()) mirror.render(renderer, scene, camera, hidden);
    if (post && Q.post) post.render(scene, camera, { focus: camera.position.distanceTo(aim), time, artLayer: ART, airLayer: AIR });
    else renderer.render(scene, camera);
    // labels and buttons where the pieces now are
    const overview = i === 0 ? 1 - f : 0;
    cards.forEach((c, j) => {
      const k = near(j);
      // (the sheet's own four corners, wherever its tilt has put them)
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const q = screenOf(tmp.set(sx * c.w / 2, sy * c.h / 2, 0).applyMatrix4(c.sheet.matrixWorld));
        x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
      }
      const onScreen = x1 > 0 && x0 < vw && y1 > 0 && y0 < vh;
      Object.assign(c.hit.style, { visibility: onScreen ? 'visible' : 'hidden', transform: `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`, width: `${(x1 - x0).toFixed(1)}px`, height: `${(y1 - y0).toFixed(1)}px` });
      // the label: beside the piece on its side (under it on a phone); all three numbers at the start,
      // only the near one's, grown, when close
      const vis = Math.max(overview, k);
      let lx, ly;
      // (on a phone above the piece, since the piece stands on its bough and the bark is under it)
      if (narrow) { lx = x0; ly = y0 - 12; }
      else { const gap = 22 + 18 * k; lx = c.side < 0 ? x0 - gap : x1 + gap; ly = y0 + 2; }
      c.lab.style.transform = `translate(${Math.round(lx)}px, ${Math.round(ly)}px)${narrow ? ' translateY(-100%)' : c.side < 0 ? ' translateX(-100%)' : ''}`;
      c.lab.style.opacity = (onScreen ? vis : 0).toFixed(3);
      c.lab.style.setProperty('--more', smooth(0.55, 0.95, k).toFixed(3));
    });
  }
  layout();
  gsap.ticker.add(frame);

  const api = {
    kind: 'branch',
    layout,
    home(pc) { const c = cards.find((cc) => cc.k.pc === pc); return c && c.hit.style.visibility === 'visible' ? { art: c.hit, img: c.img, b: c.hit } : null; },
    reshape() {},
    destroy() {
      alive = false;
      gsap.ticker.remove(frame);
      removeEventListener('pointermove', onMove);
      io.disconnect();
      document.documentElement.classList.remove('cc-in-room');
      mirror?.rt.dispose();
      woodRT.dispose(); leafRT.dispose();
      post?.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      stage.remove();
      host.classList.remove('is-room', 'is-branch');
    },
    scene, camera, renderer, post, cards, branch, main, key, rim, fill, hemi, eggs, seeds, stopY, monarch,
    set lit(v) { lit = v; }, get lit() { return lit; },
    freeze(t) { tFrozen = t; },
    // (the step of work: 3 is all of it, 0 none of the finish; set by hand for tests)
    quality: setQuality, get q() { return q; }, get ema() { return ema; }, gpu,
    tick: () => frame(),
  };
  if (local) window.__branch = api;
  return api;
}
