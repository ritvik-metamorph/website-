// The way in: the loading screen's drawing (js/emerge.js runs it).
//
// One object, made like a jeweller's piece and lit like a studio render. A cocoon of silver net
// hangs on a thread with the pupa dark inside it. While the site loads, the net is spun round it,
// row by row. Then it splits down its front, its two halves unfurl, crumpled at first, and expand,
// and the same net is now the veins of a butterfly's wings, glazed with thin glass that takes the
// light like a soap film. Nothing is swapped: every wire of the wings is a wire of the cocoon.
//
// - The light: a studio built in the scene (an overhead softbox in warm white, a narrow strip each
//   side, the right one night blue, a rim high behind, a long strip below the lens for the glass)
//   and reflected in everything, tone-mapped the way film takes light. The wings' crossing veins
//   are the cocoon's diagonals, and fall into the spirals of an engraved rosette.
// - Turn it: drag it and it spins with the weight of a coin, then settles facing you. Spin it hard
//   and the butterfly closes its wings. Tap it and it beats them.
import * as THREE from '../assets/vendor/three.module.min.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
export const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);

// ---------------------------------------------------------------- the shapes

// the net: H columns across each half of the cocoon (its two halves become the two wings) and NV
// rows from the top to the tip, joined on the diagonals like a basket
const H = 8, NV = 24;

// the cocoon: a spindle hanging from its thread, fuller above the middle, drawn to a point below
const cocoonY = (t) => 1.15 - 2.3 * t;
const cocoonR = (t) => 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.7);

// the right wing's edge, from where it leaves the thorax round to the abdomen: the forewing's
// leading edge rising to a pointed apex, its outer edge falling back to a small notch, then the
// round hindwing. Every vein runs from the root to a point on this edge.
const ROOT = [0.06, 0.15];
const SHAPE = [
  [0.09, 0.3], [0.35, 0.55], [0.75, 0.8], [1.15, 0.98], [1.42, 1.06], [1.56, 1.0], [1.58, 0.84],
  [1.48, 0.55], [1.32, 0.25], [1.06, 0.0], [1.13, -0.14], [1.12, -0.38], [1.01, -0.63],
  [0.82, -0.84], [0.56, -0.98], [0.32, -0.98], [0.16, -0.8], [0.09, -0.48], [0.06, -0.16],
];
const EDGE_N = 512;
const EDGE = (() => {
  // a Catmull-Rom curve through the points, walked at an even pace
  const cr = (a, b, c, d, u) => {
    const u2 = u * u, u3 = u2 * u;
    return [0, 1].map((k) => 0.5 * (2 * b[k] + (c[k] - a[k]) * u + (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u2 + (3 * b[k] - a[k] - 3 * c[k] + d[k]) * u3));
  };
  const line = [];
  for (let k = 0; k < SHAPE.length - 1; k++) {
    const a = SHAPE[Math.max(0, k - 1)], b = SHAPE[k], c = SHAPE[k + 1], d = SHAPE[Math.min(SHAPE.length - 1, k + 2)];
    for (let n = 0; n < 16; n++) line.push(cr(a, b, c, d, n / 16));
  }
  line.push(SHAPE[SHAPE.length - 1]);
  const len = [0];
  for (let k = 1; k < line.length; k++) len.push(len[k - 1] + Math.hypot(line[k][0] - line[k - 1][0], line[k][1] - line[k - 1][1]));
  const out = new Float32Array((EDGE_N + 1) * 2);
  let k = 1;
  for (let n = 0; n <= EDGE_N; n++) {
    const at = (len[len.length - 1] * n) / EDGE_N;
    while (k < line.length - 1 && len[k] < at) k++;
    const f = clamp((at - len[k - 1]) / (len[k] - len[k - 1] || 1), 0, 1);
    out[n * 2] = lerp(line[k - 1][0], line[k][0], f);
    out[n * 2 + 1] = lerp(line[k - 1][1], line[k][1], f);
  }
  return out;
})();

// one point of the net, on the right half, at (s across the half from the back seam to the front,
// t from the top to the tip), at morph u, with the wings at flap angle alpha
const C = { r: 0, a: 0, y: 0 };
function place(s, t, u, alpha, out) {
  // in the cocoon
  const th = -Math.PI / 2 + Math.PI * s;
  const rc = cocoonR(t), yc = cocoonY(t);
  // in the wing: crumpled and small as it comes out, then expanded flat
  const a = smooth(0, 0.75, u), e = smooth(0.4, 1, u);
  const k = lerp(0.55, 1, e);
  const crumple = (1 - e) * smooth(0.05, 0.45, u);
  const n = clamp(t, 0, 1) * EDGE_N, n0 = Math.floor(n), n1 = Math.min(EDGE_N, n0 + 1), g = n - n0;
  const ex = lerp(EDGE[n0 * 2], EDGE[n1 * 2], g), ey = lerp(EDGE[n0 * 2 + 1], EDGE[n1 * 2 + 1], g);
  const f = k * (0.08 + 0.92 * Math.pow(s, 0.85));
  const px = ROOT[0] + (ex - ROOT[0]) * f;
  const py = ROOT[1] + (ey - ROOT[1]) * f;
  const pz = 0.05 * Math.sin(Math.PI * s) * k + crumple * 0.11 * Math.sin(11 * s + 17 * t) * Math.sin(Math.PI * s);
  // the beat: the wing turns about the body's line, up towards you
  const wx = px * Math.cos(alpha) - pz * Math.sin(alpha);
  const wz = px * Math.sin(alpha) + pz * Math.cos(alpha);
  // from one to the other round the body's axis, so the halves unfurl rather than slide
  C.r = lerp(rc, Math.hypot(wx, wz), a);
  C.a = lerp(th, Math.atan2(wz, wx), a);
  C.y = lerp(yc, py, a);
  out.x = C.r * Math.cos(C.a);
  out.y = C.y;
  out.z = C.r * Math.sin(C.a);
  return e;
}
// each point's own share of the morph: the top first, and the front seam before the back
const local = (M, s, t) => clamp((M - (0.16 * t + 0.1 * (1 - s))) / 0.74, 0, 1);

// the body: the pupa curled inside the net, then the head, thorax and nine segments of the abdomen
const BODY = [
  { p: [0.8, 0.13, 0.12, 0.13], a: [0.4, 0.07, 0.065, 0.07] },
  { p: [0.52, 0.26, 0.26, 0.25], a: [0.22, 0.09, 0.15, 0.085] },
  ...Array.from({ length: 9 }, (_, i) => ({
    p: [0.22 - i * 0.115, 0.26 * Math.pow(1 - i / 10, 0.8), 0.09, 0.26 * Math.pow(1 - i / 10, 0.8)],
    a: [0.02 - i * 0.088, 0.075 * (1 - i / 11) + 0.02, 0.055, 0.075 * (1 - i / 11) + 0.02],
  })),
];
const ANT_SEG = 7;
const GLOW = 0.38, GLINT_EVERY = 6.5; // the name's own light, and how often a glint runs down it

// ---------------------------------------------------------------- the studio

function studio(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(22, 16, 22), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.006, 0.007, 0.009), side: THREE.BackSide })));
  const panel = (w, h, rgb, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(7, 3.2, [1, 0.96, 0.9], 6, [0.5, 6.5, 2.5]);   // overhead softbox, warm white
  panel(0.45, 9, [1, 0.98, 0.95], 10, [-7, 0.5, 2]);  // a narrow strip on the left
  panel(0.45, 9, [0.5, 0.66, 1], 8, [7, 0, -2.5]);    // a night-blue strip on the right, behind
  panel(6, 0.35, [1, 0.97, 0.92], 9, [0, 4.5, -6]);    // a thin rim light, high behind
  panel(4, 1.6, [1, 0.78, 0.52], 1.4, [3, -3, 6]);    // a warm card, low in front
  panel(11, 0.9, [0.88, 0.92, 1], 3, [-1, -4, 7.5]);  // a long strip below the lens: the band of light the glass takes
  panel(3, 3, [0.7, 0.8, 1], 0.5, [-2, 1, -7]);       // a faint fill behind
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.03);
  pm.dispose();
  s.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return rt;
}

// ---------------------------------------------------------------- the scene

// (transparent: drawn over a page rather than on its own dark ground, as the About page does; the
// glass's added light then lies over whatever is behind the canvas)
export function createEmergeScene(canvas, { onTurn, transparent = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setClearColor(0x050709, transparent ? 0 : 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const env = studio(renderer);
  scene.environment = env.texture;
  const key = new THREE.DirectionalLight(0xfff1df, 1.6);
  key.position.set(-2, 4, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 60);
  const outer = new THREE.Group(); // tilts towards you, and carries it away at the end
  const inner = new THREE.Group(); // spins
  outer.add(inner);
  scene.add(outer);

  // what js/emerge.js drives
  const state = { weave: 0, morph: 0, twitch: 0, lean: 0, tone: 0, exit: 0 };

  // ---- materials
  const silver = new THREE.MeshPhysicalMaterial({ color: 0xe9ebef, metalness: 1, roughness: 0.1, envMapIntensity: 1.1 });
  const lacquer = new THREE.MeshPhysicalMaterial({ color: 0x07080a, metalness: 0.15, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.2 });
  // the glass: in a dark room clear glass shows only what it reflects, so it is drawn as just that,
  // a layer of reflection added over whatever is behind it (and no second pass to see through it)
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x000000, metalness: 0, roughness: 0.05, ior: 1.6,
    iridescence: 0.5, iridescenceIOR: 1.4, iridescenceThicknessRange: [360, 680],
    specularIntensity: 1, envMapIntensity: 3, side: THREE.DoubleSide, transparent: true,
    blending: THREE.AdditiveBlending, vertexColors: true, depthWrite: false,
  });

  // ---- the net: every point of the grid on both halves, the diamonds' nodes and their wires
  const grid = (i, j, side) => (side * (NV + 1) + j) * (H + 1) + i;
  const pts = Array.from({ length: 2 * (H + 1) * (NV + 1) }, () => new THREE.Vector3());
  const ptE = new Float32Array(pts.length); // each point's expansion, for the glaze
  const nodes = [];
  const wires = []; // [a, b, kind]: 0 diagonal, 1 the wing's edge, 2 the root line, 3 an end row
  for (let side = 0; side < 2; side++) {
    for (let j = 0; j <= NV; j++) {
      for (let i = 0; i <= H; i++) {
        if ((i + j) % 2) continue;
        const n = grid(i, j, side);
        nodes.push(n);
        if (j < NV && i < H) wires.push([n, grid(i + 1, j + 1, side), 0]);
        if (j < NV && i > 0) wires.push([n, grid(i - 1, j + 1, side), 0]);
        if ((j === 0 || j === NV) && i + 2 <= H) wires.push([n, grid(i + 2, j, side), 3]);
      }
    }
    // the seams, which become each wing's edge and its root, through every row so the edge is a curve
    for (let j = 0; j < NV; j++) {
      wires.push([grid(H, j, side), grid(H, j + 1, side), 1]);
      wires.push([grid(0, j, side), grid(0, j + 1, side), 2]);
    }
  }
  const sOf = (n) => (n % (H + 1)) / H;
  const tOf = (n) => Math.floor(n / (H + 1)) % (NV + 1) / NV;
  // the order the net is spun in: from the thread down, each row round the cocoon
  const wireKey = wires.map(([a, b]) => Math.min(tOf(a), tOf(b)) * 0.92 + sOf(a) * 0.06);
  const nodeKey = nodes.map((n) => tOf(n) * 0.92 + sOf(n) * 0.06);

  const WIRE_N = wires.length + 2 * ANT_SEG + 1; // and the antennae, and the thread
  const wireGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, true);
  const wireMesh = new THREE.InstancedMesh(wireGeo, silver, WIRE_N);
  const jointGeo = new THREE.IcosahedronGeometry(1, 2);
  const jointMesh = new THREE.InstancedMesh(jointGeo, silver, nodes.length + 2);
  const bodyGeo = new THREE.SphereGeometry(1, 40, 28);
  const bodyMesh = new THREE.InstancedMesh(bodyGeo, lacquer, BODY.length);
  [wireMesh, jointMesh, bodyMesh].forEach((m) => { m.frustumCulled = false; m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); inner.add(m); });

  // ---- an Easter egg: the abdomen's nine pearls spell the name, a letter inlaid in each in the
  // net's silver, read from the thorax down, M E T A M O R P H. They come only once the pupa has
  // become the butterfly. Each letter sits where its pearl faces you (a quarter of the way round
  // the sphere's map) and is drawn narrower by that pearl's own flattening, so it reads true on the
  // curve; a skin a hair outside the pearl carries it. The silver holds a little light of its own,
  // so the letters read against the lacquer at a second glance, and every few seconds (or when the
  // cursor comes to the body) a glint runs down the name, M to H, as a jeweller's lamp would.
  const NAME = 'METAMORPH';
  const inlay = [...NAME].map((ch, i) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 256;
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    const mat = new THREE.MeshPhysicalMaterial({
      color: 0xf2f4f7, metalness: 0.85, roughness: 0.3, envMapIntensity: 1.6, map: tex,
      emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: GLOW, transparent: true, opacity: 0, depthWrite: false,
    });
    const mesh = new THREE.Mesh(bodyGeo, mat);
    mesh.matrixAutoUpdate = false;
    mesh.frustumCulled = false;
    mesh.visible = false;
    mesh.renderOrder = 1;
    inner.add(mesh);
    return { ch, c, tex, mat, mesh, k: 2 + i };
  });
  function engrave() {
    inlay.forEach(({ ch, c, tex, k }) => {
      const x = c.getContext('2d'), [, sx, sy] = BODY[k].a;
      x.clearRect(0, 0, c.width, c.height);
      x.save();
      x.translate(c.width * 0.25, c.height * 0.5);
      x.scale(sy / sx, 1);
      x.fillStyle = '#fff';
      x.textAlign = 'center';
      x.textBaseline = 'alphabetic';
      // a sturdy serif, its capitals about two fifths of the pearl's height: large enough to read at
      // the size the pearls are on screen, small enough to leave the lacquer showing round them
      x.font = '700 98px "Ibarra Real Nova", Georgia, serif'; // engraved, as the coins are
      x.fillText(ch, 0, 35); // (its capitals' middle on the pearl's equator)
      x.restore();
      tex.needsUpdate = true;
    });
  }
  engrave();
  document.fonts?.load('700 98px "Ibarra Real Nova"').then(engrave, () => {});
  let namedAt = -1; // when the name was last lit

  // ---- the glaze: a finer grid over each wing, placed by the same rule as the net
  const SM = 22, TM = 54;
  const memGeo = new THREE.BufferGeometry();
  const memN = 2 * (SM + 1) * (TM + 1);
  const memPos = new Float32Array(memN * 3);
  const memCol = new Float32Array(memN * 4).fill(1);
  const memIdx = [];
  for (let side = 0; side < 2; side++) {
    const o = side * (SM + 1) * (TM + 1);
    for (let j = 0; j < TM; j++) {
      for (let i = 0; i < SM; i++) {
        const a = o + j * (SM + 1) + i, b = a + 1, c = a + SM + 1, d = c + 1;
        if (side) memIdx.push(a, b, c, b, d, c); else memIdx.push(a, c, b, b, c, d);
      }
    }
  }
  memGeo.setIndex(memIdx);
  memGeo.setAttribute('position', new THREE.BufferAttribute(memPos, 3).setUsage(THREE.DynamicDrawUsage));
  memGeo.setAttribute('color', new THREE.BufferAttribute(memCol, 4).setUsage(THREE.DynamicDrawUsage));
  const memMesh = new THREE.Mesh(memGeo, glass);
  memMesh.frustumCulled = false;
  memMesh.renderOrder = 2;
  inner.add(memMesh);

  // ---------------------------------------------------------------- framing

  let W = 1, Hh = 1, narrow = false, placed = null;
  function resize() {
    W = canvas.clientWidth || innerWidth;
    Hh = canvas.clientHeight || innerHeight;
    narrow = isNarrow(W, Hh);
    // sharp enough for fine wire, within about two and a half million pixels
    renderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.6e6 / (W * Hh)))));
    renderer.setSize(W, Hh, false);
    camera.aspect = W / Hh;
    frameIt();
  }
  // where it sits: by default as the way in frames it; or, when a page places it, its wings w px
  // across with its middle at (cx, cy) on the canvas
  function frameIt() {
    const tanH = Math.tan((camera.fov * Math.PI) / 360);
    if (placed) {
      const d = (3.3 * Hh) / (2 * placed.w * tanH);
      camera.position.set(0, 0, d);
      camera.lookAt(0, 0, 0);
      camera.setViewOffset(W, Hh, W / 2 - placed.cx, Hh / 2 - placed.cy, W, Hh);
      camera.updateProjectionMatrix();
      return;
    }
    // wide enough for the open wings, tall enough for the cocoon
    const fitW = narrow ? 0.96 : 0.44, fitH = narrow ? 0.5 : 0.64;
    const d = Math.max(3.3 / (fitW * 2 * tanH * camera.aspect), 2.6 / (fitH * 2 * tanH));
    camera.position.set(0, 0, d);
    camera.lookAt(0, 0, 0);
    const cy = narrow ? 0.38 : 0.47; // where it sits, from the top
    camera.setViewOffset(W, Hh, 0, (0.5 - cy) * Hh, W, Hh);
    camera.updateProjectionMatrix();
  }
  resize();

  // ---------------------------------------------------------------- turning it

  let yaw = 0, w = 0, pitch = 0, drag = null, hx = 0, hy = 0, leanS = 0, toneS = 0, fold = 0, beat = -1;
  canvas.addEventListener('pointerdown', (e) => {
    if (state.exit > 0) return;
    const now = performance.now();
    drag = { x0: e.clientX, y0: e.clientY, x: e.clientX, y: e.clientY, t0: now, t: now, moved: 0 };
    canvas.setPointerCapture?.(e.pointerId);
    canvas.classList.add('is-grabbing');
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drag) {
      hx = (e.clientX / W - 0.5) * 2;
      hy = (e.clientY / Hh - 0.5) * 2;
      return;
    }
    const now = performance.now();
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    const dt = Math.max(1 / 240, (now - drag.t) / 1000);
    const dYaw = dx * (narrow ? 0.014 : 0.0105);
    yaw += dYaw;
    w = lerp(w, dYaw / dt, 0.5);
    pitch = clamp(pitch + dy * 0.005, -0.6, 0.6);
    drag.moved += Math.abs(dx) + Math.abs(dy);
    drag.x = e.clientX; drag.y = e.clientY; drag.t = now;
    if (drag.moved > 8) onTurn?.();
  });
  const release = () => {
    if (!drag) return;
    const tap = drag.moved < 8 && performance.now() - drag.t0 < 350;
    if (performance.now() - drag.t > 80) w *= 0.2; // held still before letting go
    drag = null;
    canvas.classList.remove('is-grabbing');
    if (tap) flap();
  };
  canvas.addEventListener('pointerup', release);
  canvas.addEventListener('pointercancel', release);
  canvas.addEventListener('pointerleave', () => { if (!drag) { hx = 0; hy = 0; } });
  function flap() { if (state.morph > 0.85) beat = 0; }

  // ---------------------------------------------------------------- the frame

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3();
  const hide = new THREE.Matrix4().makeScale(0, 0, 0);
  const ant = Array.from({ length: 2 * (ANT_SEG + 1) }, () => new THREE.Vector3());
  let last = performance.now(), time = 0, alive = true;

  function setWire(k, a, b, r, g = 1) {
    dir.subVectors(b, a);
    const len = dir.length() * g;
    if (len < 1e-4 || r <= 0) { wireMesh.setMatrixAt(k, hide); return; }
    dir.normalize();
    q.setFromUnitVectors(UP, dir);
    v.copy(a).addScaledVector(dir, len / 2);
    wireMesh.setMatrixAt(k, m4.compose(v, q, sc.set(r, len, r)));
  }

  let paused = false;
  function frame() {
    if (!alive || paused) return;
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    time += dt;
    const M = state.morph, wv = state.weave, X = state.exit;

    // ---- the spin: the weight of a coin, settling face on, leaning to whichever way in you look at
    leanS = damp(leanS, state.lean, 3, dt);
    const sway = (1 - M) * 0.3 * Math.sin(time * 0.45); // a hanging cocoon turns on its thread
    const rest = leanS * 0.5 + hx * 0.14 + sway;
    if (!drag) {
      w *= Math.exp(-1.15 * dt);
      const target = rest + Math.round((yaw - rest) / TAU) * TAU;
      const pull = 1 - smooth(1.5, 4, Math.abs(w));
      w += ((target - yaw) * 10 - w * 4.4) * pull * dt;
      yaw += w * dt;
      pitch = damp(pitch, 0, 3.2, dt);
    }
    inner.rotation.y = yaw;
    outer.rotation.x = lerp(0.04, 0.3, M) + pitch + hy * 0.06 - X * 0.5;
    inner.rotation.z = state.twitch * 0.045 * Math.sin(time * 31);
    inner.position.y = M * 0.045 * Math.sin(time * 1.1) + state.twitch * 0.012 * Math.sin(time * 23);
    outer.position.set(X * 0.5, X * X * 3.6, X * 0.9);

    // ---- the wings: breathing slowly, closing when spun hard, a beat when tapped, flying at the end
    fold = damp(fold, clamp((Math.abs(w) - 2) * 0.09, 0, 1.15), 6, dt);
    let alpha = 0.16 + 0.07 * Math.sin(time * 1.6) + fold;
    if (beat >= 0) {
      beat += dt;
      alpha += 0.95 * Math.max(0, Math.sin(beat * TAU * 2.1)) * Math.exp(-beat * 2.2);
      if (beat > 1.6) beat = -1;
    }
    alpha = lerp(alpha, 0.25 + 0.85 * (0.5 + 0.5 * Math.sin(time * 21)), smooth(0, 0.15, X));
    alpha *= smooth(0.55, 1, M); // no beat until the wings are out

    // ---- the net
    for (let side = 0; side < 2; side++) {
      const sx = side ? -1 : 1;
      for (let j = 0; j <= NV; j++) {
        for (let i = 0; i <= H; i++) {
          const n = grid(i, j, side), s = i / H, t = j / NV;
          ptE[n] = place(s, t, local(M, s, t), alpha, pts[n]);
          pts[n].x *= sx;
        }
      }
    }
    wires.forEach(([a, b, kind], k) => {
      const g = smooth(wireKey[k], wireKey[k] + 0.12, wv * 1.14);
      const sA = sOf(a), e = (ptE[a] + ptE[b]) / 2;
      const vein = kind === 1 ? 0.019 : kind === 2 ? 0.014 : lerp(0.011, 0.0052, sA);
      setWire(k, pts[a], pts[b], lerp(kind === 1 ? 0.012 : 0.0095, vein, e), g);
    });
    nodes.forEach((n, k) => {
      const g = smooth(nodeKey[k], nodeKey[k] + 0.06, wv * 1.14);
      const r = lerp(0.016, lerp(0.015, 0.0075, sOf(n)), ptE[n]) * g;
      jointMesh.setMatrixAt(k, r > 0 ? m4.compose(pts[n], q.identity(), sc.set(r, r, r)) : hide);
    });

    // ---- the body
    const Bm = smooth(0.12, 0.8, M);
    const grow = smooth(0.15, 0.8, wv);
    BODY.forEach(({ p, a }, k) => {
      const y = lerp(p[0], a[0], Bm), g = grow * (1 + state.twitch * 0.04 * Math.sin(time * 40 + k));
      bodyMesh.setMatrixAt(k, m4.compose(v.set(0, y, 0), q.identity(), sc.set(lerp(p[1], a[1], Bm) * g, lerp(p[2], a[2], Bm) * g, lerp(p[3], a[3], Bm) * g)));
    });
    // the name on its pearls, once it is a butterfly
    const named = smooth(0.8, 0.97, M) * grow;
    // the glint: first as the butterfly finishes forming, then every few seconds, and again when the
    // cursor comes to the body
    if (named > 0.98 && namedAt < 0) namedAt = time;
    const since = namedAt < 0 ? -1 : (time - namedAt) % GLINT_EVERY;
    if (namedAt >= 0 && since > 1.6 && Math.abs(hx) < 0.07 && hy > -0.2 && hy < 0.5) namedAt = time;
    inlay.forEach(({ mesh, mat, k }, i) => {
      mat.opacity = named;
      mesh.visible = named > 0.002;
      if (!mesh.visible) return;
      const d = (since - (0.25 + i * 0.12)) / 0.11;
      mat.emissiveIntensity = GLOW + (since >= 0 ? 1.5 * Math.exp(-d * d) : 0);
      bodyMesh.getMatrixAt(k, mesh.matrix);
      mesh.matrix.scale(v.set(1.012, 1.012, 1.012));
    });

    // ---- the antennae, grown last, and the thread, drawn up as the cocoon opens
    const ag = smooth(0.62, 1, M);
    const head = lerp(BODY[0].p[0], BODY[0].a[0], Bm);
    for (let side = 0; side < 2; side++) {
      const sx = side ? -1 : 1;
      for (let k = 0; k <= ANT_SEG; k++) {
        const f = k / ANT_SEG;
        ant[side * (ANT_SEG + 1) + k].set(sx * (0.025 + ag * (0.2 * f + 0.09 * f * f)), head + 0.04 + ag * 0.5 * f, 0.02 + ag * 0.06 * f * f);
      }
      for (let k = 0; k < ANT_SEG; k++) setWire(wires.length + side * ANT_SEG + k, ant[side * (ANT_SEG + 1) + k], ant[side * (ANT_SEG + 1) + k + 1], 0.0055, ag > 0.01 ? 1 : 0);
      const tip = ant[side * (ANT_SEG + 1) + ANT_SEG], r = 0.024 * ag;
      jointMesh.setMatrixAt(nodes.length + side, r > 0.001 ? m4.compose(tip, q.identity(), sc.set(r, r * 1.5, r)) : hide);
    }
    const top = cocoonY(0);
    A.set(0, lerp(top, 7, smooth(0.04, 0.4, M)), 0);
    B.set(0, 7, 0);
    setWire(WIRE_N - 1, A, B, 0.0045, smooth(0, 0.08, wv));

    // ---- the glaze, over the wings as they expand
    for (let side = 0; side < 2; side++) {
      const sx = side ? -1 : 1, o = side * (SM + 1) * (TM + 1);
      for (let j = 0; j <= TM; j++) {
        for (let i = 0; i <= SM; i++) {
          const s = i / SM, t = j / TM, n = o + j * (SM + 1) + i;
          const e = place(s, t, local(M, s, t), alpha, v);
          memPos[n * 3] = v.x * sx; memPos[n * 3 + 1] = v.y; memPos[n * 3 + 2] = v.z;
          memCol[n * 4 + 3] = smooth(0.35, 1, e);
        }
      }
    }
    memMesh.visible = M > 0.2;
    if (memMesh.visible) {
      memGeo.attributes.position.needsUpdate = true;
      memGeo.attributes.color.needsUpdate = true;
      memGeo.computeVertexNormals();
    }

    // ---- Ink looks at it as metal and clear glass; Light lets the film colour
    const tone = (toneS = damp(toneS, state.tone, 3, dt));
    glass.iridescence = 0.5 + 0.4 * tone - 0.1 * Math.max(0, -tone);
    glass.envMapIntensity = 3 + 0.6 * tone;
    silver.envMapIntensity = 1.1 + 0.15 * tone;
    renderer.toneMappingExposure = 1 + 0.07 * tone;

    wireMesh.instanceMatrix.needsUpdate = true;
    jointMesh.instanceMatrix.needsUpdate = true;
    bodyMesh.instanceMatrix.needsUpdate = true;
    renderer.render(scene, camera);
  }

  const { gsap } = window;
  gsap.ticker.add(frame);
  addEventListener('resize', resize);

  function destroy() {
    alive = false;
    gsap.ticker.remove(frame);
    removeEventListener('resize', resize);
    [wireGeo, jointGeo, bodyGeo, memGeo, silver, lacquer, glass, ...inlay.flatMap((L) => [L.tex, L.mat])].forEach((x) => x.dispose());
    env.dispose();
    renderer.dispose();
    renderer.forceContextLoss?.();
  }

  // (for checking the render up close while testing: the canvas as it is now, as an image)
  const snap = () => { renderer.render(scene, camera); return canvas.toDataURL('image/png'); };
  return {
    state, resize, flap, destroy, snap, get narrow() { return narrow; },
    // for a page that holds it (js/about-way.js): where it sits, the cursor's lean (-1 to 1 across
    // and down), and resting while it is out of sight
    place(p) { placed = p; frameIt(); },
    point(x, y) { hx = x; hy = y; },
    pause(on) { if (paused && !on) last = performance.now(); paused = on; },
  };
}
