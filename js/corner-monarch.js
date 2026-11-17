// The monarch's life, walked (16 Nov). The user: "can we have one caterpillar which ultimately gets
// evoluted into a butterfly by the time you reach end of the 3rd piece"; then, the same day: the change
// into the chrysalis "is very fast", the fall from the branch "very non-smooth"; "it should feel like a
// proper storyline, that it starts from the first art piece and then ends at the last piece", with
// subtle details that half the people notice and say "wow man, this is too crazy".
//
// Gallery 4, the branch. One monarch lives its whole change across the three pieces, driven by the
// walk itself, so scrolling back runs it back. Egg to egg:
//   the day's piece: by the empty egg it hatched from, it eats a milkweed leaf, growing as it eats;
//   leaving it: it walks to where it will let go, stops and lifts its head to feel the air, lets go and
//     swings down under its thread (a real, damped swing), then lowers itself a little at a time while
//     the camera flies down the S beside it, light running down the silk;
//   the week's piece: it touches down tail first and lays itself along the wood like a rope, walks out
//     along the side bough and round to its underside, spins a pad, grips it by its tail and swings down,
//     curls into a J and hangs still, its filaments going limp; the skin splits behind its head and
//     climbs to the top while the soft green chrysalis wriggles out; the old skin drops away; the
//     chrysalis firms and shortens and its gold comes; it darkens until the wings show through;
//   leaving it: the monarch comes out and hangs from the husk, its wings filling and opening once or
//     twice to dry, then flies down with the camera, flapping and gliding as monarchs do;
//   the month's piece: it lands on a milkweed leaf, wings open, curls its abdomen and lays one egg
//     there: it begins again. Walking on, it lifts and flies off into the night.
// Everything is made in code. js/corner-branch.js places it and calls update() each frame.
//
// How it moves: the caterpillar's body always lies along one path, each segment where the head was a
// moment before, so it flows over wood and round twigs like a living thing (no pose blended into
// another); where it hangs, it swings on a hinge with the damping of a weight on a thread.

import * as THREE from '../assets/vendor/three.module.min.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const span = (r, x) => clamp((x - r[0]) / (r[1] - r[0]), 0, 1);
const UP = new THREE.Vector3(0, 1, 0), DOWN = new THREE.Vector3(0, -1, 0), FRONT = new THREE.Vector3(0, 0, 1);
// a weight let go on a thread: from 0 it swings past 1, back, and settles (no jolt at the start)
const swing = (u) => { const k = 4.2, w = 7.5, r = 1 - Math.exp(-k * u) * (Math.cos(w * u) + (k / w) * Math.sin(w * u)); return lerp(r, 1, smooth(0.82, 1, u)); };

// the life, in stops walked (0 the whole branch, 1 to 3 the pieces; the camera rests at a stop from
// about 0.22 before it to 0.22 after, and flies between)
const LIFE = {
  eat: [0.2, 1.1],     // eating by the day's piece, growing as it eats
  crawl: [1.1, 1.22],  // along the bough to where it will let go
  test: [1.22, 1.28],  // stops, lifts its head, feels the air
  swing: [1.28, 1.37], // lets go: swings down under its thread, and settles
  lower: [1.37, 1.72], // lowers itself on the silk, a little at a time
  lay: [1.72, 1.79],   // touches down tail first, lays itself along the wood
  walk: [1.79, 1.96],  // out along the side bough by the week's piece, round to its underside
  pad: [1.92, 1.97],   // spins a pad of silk there
  hang: [1.97, 2.03],  // grips it by its tail, lets go, swings down
  curl: [2.03, 2.07],  // curls into a J
  still: [2.07, 2.11], // hangs still; its filaments go limp, it straightens a little
  split: [2.11, 2.2],  // the skin splits behind its head and climbs; the chrysalis wriggles out
  shed: [2.2, 2.25],   // the old skin drops away
  set: [2.2, 2.27],    // the chrysalis firms and shortens; its gold comes
  ripe: [2.27, 2.33],  // it darkens and clears; the wings show through
  out: [2.33, 2.39],   // the butterfly comes out and hangs from the husk
  dry: [2.39, 2.52],   // its wings fill, and open once or twice to dry
  fly: [2.52, 2.88],   // down with the camera to the month's piece
  egg: [2.89, 2.96],   // on a milkweed leaf there, it lays one egg (and leaves, from 2.98)
};
const SAY = {
  eat: 'A monarch’s caterpillar, eating its way to its next form.',
  test: 'Feeling the air before it lets go.',
  drop: 'Letting itself down on a thread of silk.',
  walk: 'Looking for somewhere to hang.',
  pad: 'Spinning a pad of silk to hang from.',
  hang: 'Hanging in a J, about to change.',
  split: 'Its skin splits, and the chrysalis comes.',
  pupa: 'A chrysalis: jade, with a ring of gold.',
  ripe: 'Nearly ready: the wings show through.',
  out: 'Just out, waiting for its wings to fill.',
  fly: 'The caterpillar from the first piece, a monarch now.',
  lay: 'Laying an egg on the milkweed.',
  husk: 'What it left behind.',
  skin: 'Its old skin.',
  shell: 'The egg it hatched from.',
  egg: 'An egg, on the plant its caterpillar will eat. It begins again.',
  leaf: 'Someone has been eating here.',
};

// a line with its length measured, for something to walk along: where it is a distance s along it,
// which way the line runs there, and which way is up off the wood
class Path {
  constructor(pts, nrm) {
    this.p = pts; this.n = nrm; this.c = [0];
    for (let i = 1; i < pts.length; i++) this.c.push(this.c[i - 1] + pts[i].distanceTo(pts[i - 1]));
    this.L = this.c[this.c.length - 1];
    this.t = pts.map((p, i) => pts[Math.min(pts.length - 1, i + 1)].clone().sub(pts[Math.max(0, i - 1)]).normalize());
  }
  at(s, P, D, U) {
    s = clamp(s, 0, this.L);
    let lo = 0, hi = this.c.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.c[m] <= s) lo = m; else hi = m; }
    const k = (s - this.c[lo]) / Math.max(1e-9, this.c[hi] - this.c[lo]);
    P.lerpVectors(this.p[lo], this.p[hi], k);
    if (D) D.lerpVectors(this.t[lo], this.t[hi], k).normalize();
    if (U) U.lerpVectors(this.n[lo], this.n[hi], k).normalize();
    return P;
  }
  near(q) { let bi = 0, bd = 1e9; this.p.forEach((p, i) => { const d = p.distanceToSquared(q); if (d < bd) { bd = d; bi = i; } }); return this.c[bi]; }
}

// ---------------------------------------------------------------- the chrysalis
// plump jade with a fine black band beaded in gold near its top and a few gold dots below, hanging
// from a short black stalk; inside it, the folded wings that show through as it clears
function chrysalis() {
  const g = new THREE.Group();
  const prof = [];
  for (let k = 0; k <= 22; k++) {
    const t = k / 22;
    const r = 0.021 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.06 + t * 0.96)), 0.8) * (1 - 0.22 * Math.pow(1 - t, 2)) * (t < 0.2 ? 0.75 + t * 1.25 : 1);
    prof.push(new THREE.Vector2(Math.max(0.0005, r), -0.006 - t * 0.062));
  }
  const lathe = new THREE.LatheGeometry(prof, 26);
  const jade = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#5fae86'), roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 0.9, transparent: true });
  const shell = new THREE.Mesh(lathe, jade);
  shell.castShadow = true;
  shell.renderOrder = 2;
  // the wings inside: orange cells, black veins and a dotted margin, folded round the body
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = '#c95a18'; c.fillRect(0, 0, 128, 128);
  c.strokeStyle = '#0d0b0a'; c.lineWidth = 4;
  for (let x = 6; x < 128; x += 16) { c.beginPath(); c.moveTo(x, 0); c.quadraticCurveTo(x + 10, 60, x - 4, 100); c.stroke(); }
  c.fillStyle = '#0d0b0a'; c.fillRect(0, 98, 128, 30);
  c.fillStyle = '#efe9dc'; for (let x = 4; x < 128; x += 10) { c.beginPath(); c.arc(x, 108, 2.2, 0, TAU); c.fill(); c.beginPath(); c.arc(x + 5, 118, 1.6, 0, TAU); c.fill(); }
  const coreTex = new THREE.CanvasTexture(cv); coreTex.colorSpace = THREE.SRGBColorSpace;
  const core = new THREE.Mesh(lathe, new THREE.MeshStandardMaterial({ map: coreTex, color: new THREE.Color('#7a6a60'), roughness: 0.7, envMapIntensity: 0.3 }));
  core.scale.setScalar(0.88); core.position.y = -0.004;
  core.visible = false;
  const black = new THREE.MeshStandardMaterial({ color: new THREE.Color('#111'), roughness: 0.5 });
  const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.0012, 0.0016, 0.008, 6), black);
  stalk.position.y = -0.003;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0172, 0.0009, 6, 40), black);
  ring.rotation.x = Math.PI / 2; ring.position.y = -0.021;
  const gold = new THREE.MeshStandardMaterial({ color: new THREE.Color('#e3b341'), metalness: 1, roughness: 0.32, envMapIntensity: 0.8 });
  const dot = new THREE.SphereGeometry(0.0013, 8, 6);
  g.add(core, shell, stalk, ring);
  const golds = [ring];
  for (let k = 0; k < 12; k++) { const a = (k / 12) * TAU, m = new THREE.Mesh(dot, gold); m.position.set(Math.cos(a) * 0.0176, -0.0222, Math.sin(a) * 0.0176); g.add(m); golds.push(m); }
  for (const [a, y, rr] of [[0.4, -0.05, 0.017], [2.3, -0.052, 0.016], [4.1, -0.049, 0.017], [1.3, -0.012, 0.012], [3.6, -0.013, 0.012]]) { const m = new THREE.Mesh(dot, gold); m.position.set(Math.cos(a) * rr, y, Math.sin(a) * rr); g.add(m); golds.push(m); }
  return { g, shell, core, jade, golds, length: 0.068 };
}

// ---------------------------------------------------------------- the wings, painted
// the right wing's outline (x out from the body, y towards the head), forewing and hindwing as one
const WING = [[0.03, 0.07], [0.2, 0.27], [0.42, 0.45], [0.66, 0.58], [0.86, 0.64], [0.97, 0.6], [1.0, 0.5], [0.95, 0.34], [0.84, 0.18], [0.7, 0.07],
  [0.69, -0.02], [0.71, -0.18], [0.66, -0.36], [0.52, -0.52], [0.33, -0.6], [0.17, -0.55], [0.07, -0.36], [0.02, -0.14], [0.01, 0.02]];
const FORE_EDGE = [[0.02, 0.04], [0.3, 0.06], [0.55, 0.075], [0.7, 0.07]];
const VEINS = [
  [[0.03, 0.05], [0.4, 0.41], [0.62, 0.55]], [[0.03, 0.05], [0.5, 0.36], [0.82, 0.55]], [[0.05, 0.05], [0.55, 0.26], [0.93, 0.42]],
  [[0.06, 0.05], [0.5, 0.16], [0.86, 0.22]], [[0.3, 0.06], [0.62, 0.12], [0.78, 0.13]],
  [[0.04, 0.0], [0.4, -0.08], [0.66, -0.12]], [[0.04, -0.02], [0.4, -0.22], [0.64, -0.32]], [[0.04, -0.04], [0.32, -0.34], [0.5, -0.5]],
  [[0.03, -0.05], [0.2, -0.36], [0.3, -0.56]], [[0.03, -0.06], [0.1, -0.3], [0.15, -0.52]],
];
function wingTexture() {
  const S = 512, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const g = cv.getContext('2d');
  g.setTransform(S, 0, 0, -S / 1.4, 0, (0.7 / 1.4) * S); // (wing units: x 0 to 1, y -0.7 to 0.7)
  const path = (pts, close = true) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); if (close) g.closePath(); };
  g.fillStyle = '#0d0b0a'; g.fillRect(0, -0.7, 1, 1.4);
  path(WING); g.fillStyle = '#d4641c'; g.fill();
  // (the hindwing a shade deeper, under the fore's edge)
  g.save(); path(WING); g.clip(); g.fillStyle = 'rgba(150, 50, 10, .22)'; g.fillRect(0, -0.7, 1, 0.75); g.restore();
  // the apex, black
  path([[0.55, 0.46], [0.66, 0.58], [0.86, 0.64], [0.97, 0.6], [1.0, 0.5], [0.95, 0.34], [0.86, 0.36], [0.72, 0.44]]); g.fillStyle = '#0d0b0a'; g.fill();
  // the veins, thick and black
  g.strokeStyle = '#0d0b0a'; g.lineCap = 'round'; g.lineJoin = 'round';
  g.lineWidth = 0.022;
  VEINS.forEach((v) => { g.beginPath(); g.moveTo(...v[0]); g.quadraticCurveTo(...v[1], ...v[2]); g.stroke(); });
  g.lineWidth = 0.03; path(FORE_EDGE, false); g.stroke();
  // the margin: a black band all round the outer edge, two rows of white dots in it
  g.lineWidth = 0.13; path(WING); g.stroke();
  const outer = WING.slice(1, 17);
  const dots = (inset, r, every) => {
    for (let i = 0; i < outer.length - 1; i++) {
      const [x0, y0] = outer[i], [x1, y1] = outer[i + 1], L = Math.hypot(x1 - x0, y1 - y0);
      const nx = (y1 - y0) / L, ny = -(x1 - x0) / L; // (inwards, for a clockwise outline)
      for (let s = every / 2; s < L; s += every) {
        const x = x0 + ((x1 - x0) * s) / L - nx * inset, y = y0 + ((y1 - y0) * s) / L - ny * inset;
        g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
      }
    }
  };
  g.fillStyle = '#efe9dc'; dots(0.022, 0.0085, 0.045); dots(0.05, 0.006, 0.06);
  // a few pale spots in the black apex
  g.fillStyle = '#f0c48a';
  for (const [x, y, r] of [[0.8, 0.55, 0.014], [0.86, 0.5, 0.012], [0.9, 0.44, 0.011], [0.76, 0.49, 0.01]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
  const tx = new THREE.CanvasTexture(cv);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 4;
  return tx;
}
function wingGeometry(span) {
  const shape = new THREE.Shape(WING.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ShapeGeometry(shape, 6);
  const P = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < P.count; i++) { uv.setXY(i, P.getX(i), (P.getY(i) + 0.7) / 1.4); }
  geo.scale(span, span, span);
  geo.rotateX(Math.PI / 2); // (into the body's plane: x out, z towards the head)
  geo.computeVertexNormals();
  return geo;
}


export function createMonarch({ scene, main, trunk, bough, barkAt, leafAt, eggs, reduced }) {
  const CS = 2.1, N = 13, SP = 0.0118 * CS * 0.95, LIFT = 0.0062 * CS; // (its size; the gap between segments; its body's height off the wood)
  const BODY = (N - 1) * SP;
  const m4 = new THREE.Matrix4(), v = new THREE.Vector3(), w3 = new THREE.Vector3(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qi = new THREE.Quaternion();
  const findT = (x, t0, t1) => { let bt = t0, bd = 1e9; for (let i = 0; i <= 400; i++) { const t = lerp(t0, t1, i / 400); const d = Math.abs(main.curve.getPointAt(t, v).x - x); if (d < bd) { bd = d; bt = t; } } return bt; };
  const across = (T, f, u) => { const a = UP.clone().addScaledVector(T, -UP.dot(T)).normalize(), b = FRONT.clone().addScaledVector(T, -FRONT.dot(T)).normalize(); return a.multiplyScalar(u).addScaledVector(b, f).normalize(); };
  const frontTop = (t) => across(main.curve.getTangentAt(t), 0.85, 0.55);
  const top = (t) => across(main.curve.getTangentAt(t), 0.3, 0.9);
  const bl = bough.limb;
  const said = new Map();
  const sayOn = (o, text) => { if (said.get(o) === text) return; said.set(o, text); o.traverse((m) => { if (m.isMesh) m.userData.say = text; }); };
  const register = (o) => o.traverse((m) => { if (m.isMesh) eggs.push(m); });
  const hide = (o) => { o.visible = false; o.scale.setScalar(1e-4); }; // (hidden, and out of the pointer's way)
  const show = (o, s = 1) => { o.visible = true; if (typeof s === 'number') o.scale.setScalar(s); };

  // ---------------------------------------------------------------- where it lives
  // by the day's piece: on the top front of the upper bough, to the piece's right, a milkweed leaf it
  // has been eating behind it, the empty egg it hatched from on the leaf
  const tEat = findT(0.4, 0.68, 0.82), tEdge = findT(0.6, 0.68, 0.82);
  const t0 = tEat - (BODY * 1.2) / main.L;
  const upP = [], upN = [];
  for (let i = 0; i <= 120; i++) { const t = lerp(t0, tEdge, i / 120), b = barkAt(t, frontTop(t)), n = b.n.clone().normalize(); upP.push(b.p.clone().addScaledVector(n, LIFT)); upN.push(n); }
  const up = new Path(upP, upN);
  const sEat = up.near(barkAt(tEat, frontTop(tEat)).p.addScaledVector(frontTop(tEat), LIFT)), sEdge = up.L;
  const leafFrame = (m, size) => { const e = m.matrix.elements; return { base: new THREE.Vector3(e[12], e[13], e[14]), X: new THREE.Vector3(e[0], e[1], e[2]).normalize(), Y: new THREE.Vector3(e[4], e[5], e[6]).normalize(), Z: new THREE.Vector3(e[8], e[9], e[10]).normalize(), L: 0.15 * size }; };
  const onLeaf = (F, u, lift = 0.004, side = 0) => F.base.clone().addScaledVector(F.X, u * F.L).addScaledVector(F.Y, lift - 0.025 * u * u).addScaledVector(F.Z, side);
  const lb = barkAt(tEat - 0.002, new THREE.Vector3(-0.1, 1, -0.7));
  const eatLeaf = leafAt(lb.p.clone().addScaledVector(lb.n, -0.004), main.curve.getTangentAt(tEat).clone().multiplyScalar(0.6).add(new THREE.Vector3(0, 1, -0.2)), 1.7, [[0.34, 0.026], [0.5, 0.02], [0.63, 0.025]]);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.0072, 14, 10, 0, TAU, 0.7, Math.PI - 0.7), new THREE.MeshStandardMaterial({ color: new THREE.Color('#e9e2c6'), roughness: 0.5, transparent: true, opacity: 0.82, side: THREE.DoubleSide }));
  if (eatLeaf) {
    const F = leafFrame(eatLeaf, 1.7);
    shell.position.copy(onLeaf(F, 0.2, 0.006, -0.008));
    shell.quaternion.setFromUnitVectors(UP, F.Y);
    shell.scale.set(1, 1.3, 1);
    scene.add(shell);
    register(eatLeaf); register(shell);
    sayOn(eatLeaf, SAY.leaf); sayOn(shell, SAY.shell);
  }
  // where it lets go: its head there, a thread from the bark to it
  const E = up.p[up.p.length - 1].clone().addScaledVector(FRONT, 0.004);
  const Ebark = E.clone().addScaledVector(up.n[up.n.length - 1], -LIFT);
  // by the week's piece: the lower bough where the thread meets it (straight down), along its top to
  // where the side bough leaves it, then out along the side bough, round to its underside by a turn of
  // the body round the twig, to a body's length past the pad it will hang from
  const woods = [trunk, bough.mesh];
  const hit = new THREE.Raycaster(E.clone().add(v.set(0, -0.06, 0)), DOWN, 0, 3).intersectObjects(woods, false)[0];
  const tTouch = findT(hit ? hit.point.x : E.x, 0.25, 0.45), tJoin = 0.364;
  const rv = new THREE.Vector3();
  const roundTwig = (u, th) => { const T = bl.curve.getTangentAt(u); return across(T, 1, 1e-6).multiplyScalar(Math.sin(th)).addScaledVector(across(T, 1e-6, 1), Math.cos(th)).normalize(); };
  const uA = 0.12, uH0 = 0.36, uH1 = 0.48, uPad = 0.55, uEnd = 0.975;
  const loP = [], loN = [];
  for (let t = tTouch - (BODY * 1.15) / main.L; t <= tJoin; t += 0.0015) { const b = barkAt(t, top(t)), n = b.n.clone().normalize(); loP.push(b.p.clone().addScaledVector(n, LIFT)); loN.push(n); }
  for (let u = uA; u <= uEnd + 1e-6; u += 0.005) { const n = roundTwig(u, Math.PI * smooth(uH0, uH1, u)); loP.push(bl.curve.getPointAt(u).clone().addScaledVector(n, bl.radiusAt(u) + LIFT)); loN.push(n); }
  const lo = new Path(loP, loN);
  const touch = barkAt(tTouch, top(tTouch)).p.addScaledVector(top(tTouch), LIFT);
  const sTouch = lo.near(touch);
  const padN = roundTwig(uPad, Math.PI), pad = bl.curve.getPointAt(uPad).clone().addScaledVector(padN, bl.radiusAt(uPad));
  const padT = pad.clone().addScaledVector(padN, LIFT * 0.6); // (where its tail grips)
  const sPad = lo.near(pad.clone().addScaledVector(padN, LIFT));
  const sWalkEnd = Math.min(lo.L, sPad + BODY);
  const curlDir = new THREE.Vector3(1, 0, 0.35).normalize(); // (the J curls sideways, so it reads in profile)
  // by the month's piece: a milkweed leaf on the driftwood to its right, where it lays its egg
  const tLeaf = findT(0.5, 0.1, 0.3), lb2 = barkAt(tLeaf, frontTop(tLeaf));
  const eggLeaf = leafAt(lb2.p.clone().addScaledVector(lb2.n, -0.004), new THREE.Vector3(0.2, 1, 0.55), 1.5, [[0.985, 0.0008]]);
  const LF = eggLeaf ? leafFrame(eggLeaf, 1.5) : { base: lb2.p.clone(), X: UP.clone(), Y: FRONT.clone(), Z: new THREE.Vector3(1, 0, 0), L: 0.22 };
  if (eggLeaf) register(eggLeaf);
  const land = onLeaf(LF, 0.5, 0.009);
  const egg = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#f1e9cf'), roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.25, envMapIntensity: 0.9 }));
  // (where its abdomen reaches as it curls: a body's length behind where it stands)
  egg.position.copy(onLeaf(LF, 0.5 - 0.064 / LF.L, 0.004, 0.004));
  egg.quaternion.setFromUnitVectors(UP, LF.Y);
  hide(egg);
  scene.add(egg); register(egg); sayOn(egg, SAY.egg);

  // ---------------------------------------------------------------- the caterpillar
  // banded segments, and a pair of fine black filaments at its head and its tail (they go limp before
  // it pupates)
  const cat = new THREE.Group();
  const band = ['#0d0d0d', '#c9c4b6', '#c29426', '#c9c4b6'].map((hex) => new THREE.MeshStandardMaterial({ color: new THREE.Color(hex), roughness: 0.6, envMapIntensity: 0.4 }));
  const segGeo = new THREE.SphereGeometry(1, 14, 10);
  const fil = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0d0d0d'), roughness: 0.5 });
  const segs = [];
  for (let k = 0; k < N; k++) {
    const r = 0.0082 * CS * (k === N - 1 ? 1.08 : 0.8 + 0.2 * Math.sin((k / (N - 1)) * Math.PI));
    const g = new THREE.Group(), m = new THREE.Mesh(segGeo, k === N - 1 ? band[0] : band[k % 4]);
    m.scale.set(r, r * 1.35, r * 0.95); // (long along the body, so the segments run together)
    m.castShadow = true;
    g.add(m); cat.add(g);
    segs.push({ g, m });
  }
  // (filaments in a segment's own frame: x its side, y along the body, z its back)
  const fils = [];
  for (const [k, sign] of [[N - 2, 1], [1, -1]]) {
    const fg = new THREE.Group();
    segs[k].g.add(fg); fils.push([fg, sign]);
    for (const sd of [-1, 1]) {
      const a = new THREE.Vector3(sd * 0.004, 0, 0.007).multiplyScalar(CS), b = a.clone().add(new THREE.Vector3(sd * 0.005, sign * 0.011, 0.012).multiplyScalar(CS));
      fg.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0, 0.003 * CS)), b]), 8, 0.0007 * CS, 4), fil));
    }
  }
  scene.add(cat); register(cat);
  const P = Array.from({ length: N }, () => new THREE.Vector3()), D = P.map(() => new THREE.Vector3()), U = P.map(() => new THREE.Vector3()), SC = new Array(N).fill(1);
  const X = new THREE.Vector3(), Y = new THREE.Vector3(), Z = new THREE.Vector3();
  const orient = (g, d, u) => { Y.copy(d).normalize(); Z.copy(u).addScaledVector(Y, -u.dot(Y)); if (Z.lengthSq() < 1e-8) Z.copy(FRONT).addScaledVector(Y, -FRONT.dot(Y)); Z.normalize(); X.crossVectors(Y, Z); m4.makeBasis(X, Y, Z); g.quaternion.setFromRotationMatrix(m4); };
  const putCat = (g = 1) => segs.forEach((s, k) => { s.g.position.copy(P[k]); orient(s.g, D[k], U[k]); s.g.scale.setScalar(SC[k] * g); });
  // (where the body bends sharply, the line between segments is eased, and the way it points follows)
  const ease = () => {
    for (let k = 1; k < N - 1; k++) w3.copy(P[k - 1]).add(P[k + 1]).addScaledVector(P[k], 2).multiplyScalar(0.25), D[k].copy(w3);
    for (let k = 1; k < N - 1; k++) P[k].copy(D[k]);
    for (let k = 0; k < N; k++) D[k].subVectors(P[Math.min(N - 1, k + 1)], P[Math.max(0, k - 1)]).normalize();
  };
  // along a path, its head s along it; walking, a wave runs along it by the distance walked
  const pp = new THREE.Vector3(), pd = new THREE.Vector3(), pu = new THREE.Vector3();
  function alongPath(path, sHead, gap, walked, time, eating) {
    const phase = (walked / (SP * 3.2)) * TAU, amp = smooth(0, SP, walked);
    for (let k = 0; k < N; k++) {
      path.at(sHead - (N - 1 - k) * gap, pp, pd, pu);
      const arch = Math.sin((k / (N - 1)) * Math.PI) * 0.004 * CS;
      const wave = amp * 0.007 * CS * Math.pow(Math.max(0, Math.sin(phase - k * 0.75)), 2);
      P[k].copy(pp).addScaledVector(pu, arch + wave); D[k].copy(pd); U[k].copy(pu);
    }
    if (eating && !reduced) {
      for (let k = N - 3; k < N; k++) {
        const e = (k - (N - 4)) / 3;
        w3.crossVectors(D[k], U[k]).normalize();
        P[k].addScaledVector(U[k], 0.003 * CS * e * (0.5 + 0.5 * Math.sin(time * 3.3))).addScaledVector(w3, 0.002 * CS * e * Math.sin(time * 1.9));
      }
    }
  }
  // let go, hanging from a hinge: each segment's way from the hinge turned from `from` (where it lay)
  // to straight down, by way of the front (so it swings out past the wood, not through it), with the
  // damped swing of a weight
  const fromDir = P.map(() => new THREE.Vector3());
  function hinge(at, order, a, mid) {
    for (let k = 0; k < N; k++) {
      const d = order(k) * SP;
      if (d < 1e-6) { P[k].copy(at); continue; }
      if (a <= 0.5) { qa.setFromUnitVectors(fromDir[k], mid); qi.identity().slerp(qa, a * 2); v.copy(fromDir[k]).applyQuaternion(qi); }
      else { qb.setFromUnitVectors(mid, DOWN); qi.identity().slerp(qb, (a - 0.5) * 2); v.copy(mid).applyQuaternion(qi); }
      P[k].copy(at).addScaledVector(v, d);
    }
  }
  // the J: from the pad straight down, then the head curling up and out, by `c` (0 straight, 1 a J)
  function inJ(c, time) {
    const Ls = BODY * 0.58, Rc = (0.034 * CS) / 1.7;
    for (let k = 0; k < N; k++) {
      const s = k * SP;
      if (s <= Ls) { P[k].copy(padT).addScaledVector(DOWN, s); D[k].copy(DOWN); U[k].copy(curlDir).negate(); continue; }
      const th = Math.min(Math.PI * 0.92, (c * (s - Ls)) / Rc), r = Rc / Math.max(c, 1e-3);
      P[k].copy(padT).addScaledVector(DOWN, Ls + r * Math.sin(th)).addScaledVector(curlDir, r * (1 - Math.cos(th)));
      D[k].copy(DOWN).multiplyScalar(Math.cos(th)).addScaledVector(curlDir, Math.sin(th));
      U[k].copy(curlDir).multiplyScalar(-Math.cos(th)).addScaledVector(DOWN, Math.sin(th));
    }
    if (!reduced) { const sw = 0.003 * Math.sin(time * 0.9); for (let k = 0; k < N; k++) P[k].x += sw * (k / N); }
  }

  // ---- its thread of silk, and the light that runs down it
  const silk = new THREE.Mesh(new THREE.CylinderGeometry(0.0007, 0.0007, 1, 5, 1, true), new THREE.MeshBasicMaterial({ color: new THREE.Color('#e9edf2'), transparent: true, opacity: 0.85, depthWrite: false }));
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.0018, 8, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff'), transparent: true, depthWrite: false }));
  hide(silk); hide(glint);
  scene.add(silk, glint);
  const strand = (a, b) => { v.subVectors(b, a); const L = v.length(); silk.position.addVectors(a, b).multiplyScalar(0.5); silk.quaternion.setFromUnitVectors(UP, v.normalize()); silk.scale.set(1, Math.max(1e-4, L), 1); };
  // ---- the pad it spins: a little tuft of white silk under the side bough
  const tuft = new THREE.Group();
  const tuftMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f1f1ec'), roughness: 0.9 });
  for (const [x, y, z, r] of [[0, 0, 0, 0.0035], [0.003, -0.001, 0.002, 0.0024], [-0.003, -0.001, -0.001, 0.0026], [0.001, -0.002, -0.003, 0.002]]) { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), tuftMat); m.position.set(x, y, z); tuft.add(m); }
  tuft.position.copy(pad);
  hide(tuft); scene.add(tuft); register(tuft); sayOn(tuft, SAY.pad);

  // ---- the chrysalis, hanging from the pad
  const ch = chrysalis();
  ch.g.position.copy(pad);
  ch.g.rotation.y = 0.6;
  const CHS = 1.7;
  hide(ch.g); scene.add(ch.g); register(ch.g);
  const SOFT = new THREE.Color('#8ccfa8'), JADE = new THREE.Color('#5fae86'), DARK = new THREE.Color('#15110e'), HUSK = new THREE.Color('#7d857c');
  // where the old skin gathers as it climbs, crumpled (each segment a little off the last)
  const clump = pad.clone().add(new THREE.Vector3(0, -0.013, 0));
  const crumple = segs.map((_, k) => new THREE.Vector3(Math.sin(k * 2.3) * 0.004, -0.004 * (k % 3), Math.cos(k * 1.7) * 0.004));

  // ---------------------------------------------------------------- the butterfly
  // a black body, clubbed antennae, an abdomen that can curl, two wings that open and close on it
  const fly = new THREE.Group(), body = new THREE.Group(), SPAN = 0.15;
  body.scale.setScalar(1.18);
  fly.add(body);
  const blk = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0b0a0a'), roughness: 0.55 });
  const abdPivot = new THREE.Group(); abdPivot.position.z = -0.006;
  const abd = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), blk); abd.scale.set(0.0075, 0.0075, 0.036); abd.position.z = -0.024;
  abdPivot.add(abd);
  const thx = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), blk); thx.scale.set(0.009, 0.009, 0.014); thx.position.z = 0.006;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.0065, 10, 8), blk); head.position.z = 0.024;
  body.add(abdPivot, thx, head);
  for (const sd of [-1, 1]) {
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(sd * 0.002, 0.003, 0.028), new THREE.Vector3(sd * 0.012, 0.016, 0.055), new THREE.Vector3(sd * 0.02, 0.022, 0.078)]);
    body.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, 0.0006, 4), blk));
    const club = new THREE.Mesh(new THREE.SphereGeometry(0.0017, 6, 5), blk); club.position.set(sd * 0.02, 0.022, 0.078); club.scale.set(1, 1, 1.8);
    body.add(club);
  }
  const wingMat = new THREE.MeshStandardMaterial({ map: wingTexture(), side: THREE.DoubleSide, roughness: 0.72, envMapIntensity: 0.35 });
  const wgeo = wingGeometry(SPAN);
  const wR = new THREE.Group(), wL = new THREE.Group();
  const mR = new THREE.Mesh(wgeo, wingMat), mL = new THREE.Mesh(wgeo, wingMat);
  mL.scale.x = -1;
  mR.castShadow = mL.castShadow = true;
  wR.add(mR); wL.add(mL);
  wR.position.set(0.004, 0.004, 0.006); wL.position.set(-0.004, 0.004, 0.006);
  body.add(wR, wL);
  hide(fly); scene.add(fly); register(fly);
  const flap = (a, s = 1, twist = 0) => { wR.rotation.z = a; wL.rotation.z = -a; wR.rotation.y = twist; wL.rotation.y = -twist; wR.scale.setScalar(s); wL.scale.setScalar(s); };
  // (a body frame from where its head points and where its back faces)
  const face = (hd, back) => { Z.copy(hd).normalize(); Y.copy(back).addScaledVector(Z, -back.dot(Z)); if (Y.lengthSq() < 1e-8) Y.copy(UP).addScaledVector(Z, -UP.dot(Z)); Y.normalize(); X.crossVectors(Y, Z); m4.makeBasis(X, Y, Z); fly.quaternion.setFromRotationMatrix(m4); };
  const husk = pad.clone().add(new THREE.Vector3(0, -0.006 - ch.length * CHS - 0.014, 0));
  const bez = (out, a, b, c, d, t) => { const u = 1 - t; return out.set(0, 0, 0).addScaledVector(a, u * u * u).addScaledVector(b, 3 * u * u * t).addScaledVector(c, 3 * u * t * t).addScaledVector(d, t * t * t); };
  const F1 = [husk, husk.clone().add(new THREE.Vector3(0.18, 0.02, 0.42)), land.clone().addScaledVector(LF.Y, 0.3).add(new THREE.Vector3(0.2, 0.25, 0.1)), land];
  const away = land.clone().add(new THREE.Vector3(0.9, 1.15, 1.5));
  const F2 = [land, land.clone().addScaledVector(LF.Y, 0.12).add(new THREE.Vector3(0, 0.15, 0)), away.clone().add(new THREE.Vector3(-0.4, -0.3, -0.5)), away];
  const hangBack = new THREE.Vector3(1, 0, 0.25).normalize();
  const pa = new THREE.Vector3(), pb = new THREE.Vector3(), hd = new THREE.Vector3(), bk = new THREE.Vector3();
  const along3 = (F, u, out) => { bez(out, F[0], F[1], F[2], F[3], u); bez(pa, F[0], F[1], F[2], F[3], Math.min(1, u + 0.02)); bez(pb, F[0], F[1], F[2], F[3], Math.max(0, u - 0.02)); return pa.sub(pb).normalize(); };
  // (its wings: a flight of flaps and glides, as a monarch flies)
  const beat = (t) => { const g = smooth(-0.35, 0.35, Math.sin(t * 1.9 + 0.5)); return lerp(0.32, 0.22 + 1.15 * (0.5 + 0.5 * Math.sin(t * TAU * 4.4)), g); };

  // ---------------------------------------------------------------- each frame: where in its life it is,
  // from how far the walk has come (sw, 0 to 3), and the walk on beyond the last piece (p past `walk`)
  const cf = new THREE.Vector3(), cr = new THREE.Vector3(), cu = new THREE.Vector3(), anchor = new THREE.Vector3();
  function update(sw, p, walk, time, camera) {
    const t = reduced ? 0 : time;
    const grow = lerp(0.8, 1, smooth(LIFE.eat[0], LIFE.eat[1], sw)); // (it grows as it eats)
    const gap = SP * grow;
    let silkTop = null, cText = SAY.eat, fall = 0;

    // ---- the caterpillar
    if (sw < LIFE.shed[1]) {
      show(cat);
      for (let k = 0; k < N; k++) SC[k] = 1;
      if (sw < LIFE.crawl[0]) {
        alongPath(up, sEat, gap, 0, t, true);
      } else if (sw < LIFE.test[1]) {
        // along the bough to where it will let go; there it rears its front and feels the air
        const sh = lerp(sEat, sEdge, smooth(0, 1, span(LIFE.crawl, sw)));
        alongPath(up, sh, gap, sh - sEat, t, false);
        if (sw >= LIFE.test[0]) {
          const a = Math.sin(Math.PI * span(LIFE.test, sw));
          for (let k = N - 5; k < N; k++) { const e = (k - (N - 6)) / 5; P[k].addScaledVector(U[k], 0.024 * CS * e * e * a).addScaledVector(FRONT, reduced ? 0 : 0.012 * e * a * Math.sin(t * 2.2)); }
          ease(); cText = SAY.test;
        }
      } else if (sw < LIFE.swing[1]) {
        // it lets go: its head held at the bark by the thread, its body swings down beneath it and settles
        alongPath(up, sEdge, gap, sEdge - sEat, t, false);
        for (let k = 0; k < N; k++) fromDir[k].subVectors(P[k], E).normalize();
        const mid = fromDir[0].clone().multiplyScalar(0.2).add(FRONT).addScaledVector(DOWN, 0.5).normalize();
        hinge(E, (k) => ((N - 1 - k) * gap) / SP, swing(span(LIFE.swing, sw)), mid);
        for (let k = 0; k < N; k++) U[k].copy(FRONT);
        ease(); silkTop = Ebark; cText = SAY.drop;
      } else if (sw < LIFE.lower[1]) {
        // it lowers itself, a little at a time as the silk lets out, swaying on the thread, turning slowly
        let u = smooth(0, 1, span(LIFE.lower, sw));
        u += 0.008 * Math.sin(u * TAU * 12) * u * (1 - u) * 4;
        const yH = lerp(E.y, touch.y + BODY, u);
        const xz = w3.lerpVectors(E, touch, smooth(0.55, 1, u));
        const sx = reduced ? 0 : 0.05 * Math.sin(t * 1.35) * smooth(0, 0.12, u) * (1 - smooth(0.85, 1, u)), sz = reduced ? 0 : 0.015 * Math.sin(t * 0.9 + 1) * (1 - smooth(0.85, 1, u));
        const tw = reduced ? 0 : 0.5 * Math.sin(t * 0.45);
        for (let k = 0; k < N; k++) {
          const y = yH - (N - 1 - k) * gap, dist = Ebark.y - y;
          P[k].set(xz.x + sx * dist, y, xz.z + sz * dist);
          D[k].copy(UP); U[k].set(Math.sin(tw), 0, Math.cos(tw));
        }
        silkTop = Ebark; cText = SAY.drop;
      } else if (sw < LIFE.lay[1]) {
        // tail first it touches the wood, and lays itself along it like a rope let down
        const L = (N - 1) * gap, sc = smooth(0, 1, span(LIFE.lay, sw)) * L;
        for (let k = 0; k < N; k++) {
          const s = k * gap;
          if (s <= sc) { lo.at(sTouch - (sc - s), pp, pd, pu); P[k].copy(pp); D[k].copy(pd); U[k].copy(pu); }
          else { P[k].copy(touch).addScaledVector(UP, s - sc); D[k].copy(UP); U[k].copy(FRONT); }
        }
        ease();
        if (sc < L * 0.98) silkTop = Ebark;
        cText = SAY.drop;
      } else if (sw < LIFE.walk[1]) {
        // out along the side bough, and round it to its underside
        const sh = lerp(sTouch, sWalkEnd, smooth(0, 1, span(LIFE.walk, sw)));
        alongPath(lo, sh, gap, sh - sTouch, t, false);
        cText = sw >= LIFE.pad[0] ? SAY.pad : SAY.walk;
      } else if (sw < LIFE.hang[1]) {
        // gripping the pad by its tail, it lets go and swings down head first, and settles
        alongPath(lo, sWalkEnd, gap, sWalkEnd - sTouch, t, false);
        for (let k = 0; k < N; k++) fromDir[k].subVectors(P[k], padT).normalize();
        const mid = fromDir[N - 1].clone().multiplyScalar(0.3).addScaledVector(FRONT, 0.6).add(DOWN).normalize();
        hinge(padT, (k) => k, swing(span(LIFE.hang, sw)), mid);
        for (let k = 0; k < N; k++) U[k].copy(curlDir).negate();
        ease(); cText = SAY.hang;
      } else if (sw < LIFE.still[1]) {
        // into a J, and still; it straightens a little as the time comes
        inJ(Math.max(1e-3, smooth(0, 1, span(LIFE.curl, sw)) * lerp(1, 0.86, smooth(0, 1, span(LIFE.still, sw)))), t);
        cText = SAY.hang;
      } else {
        // the skin splits behind the head and climbs, segment by segment, to a crumpled ring at the top;
        // then it drops away
        inJ(0.86, t);
        const w = span(LIFE.split, sw);
        fall = span(LIFE.shed, sw);
        for (let k = 0; k < N; k++) {
          const peel = smooth(0, 1, w * 1.6 - ((N - 1 - k) / (N - 1)) * 0.6);
          P[k].lerp(v.copy(clump).add(crumple[k]), peel);
          SC[k] = lerp(1, 0.42, peel);
          if (!reduced) P[k].x += 0.003 * Math.sin(t * 8 + k) * Math.sin(Math.PI * w);
          if (fall > 0) { P[k].y -= 2.6 * fall * fall + 0.02 * fall; P[k].x += 0.05 * fall; }
        }
        cText = fall > 0 ? SAY.skin : SAY.split;
      }
      putCat(grow);
      fils.forEach(([fg, sign]) => { fg.rotation.x = -sign * 0.9 * smooth(0, 1, span(LIFE.still, sw)); });
      if (fall >= 1) hide(cat);
    } else hide(cat);

    // ---- its thread, and the light that runs down it while it lowers
    if (silkTop) {
      show(silk, null);
      strand(silkTop, pa.copy(P[N - 1]).addScaledVector(UP, 0.006));
      if (sw >= LIFE.lower[0] && sw < LIFE.lower[1] && !reduced) {
        const f = (t * 0.55) % 1;
        show(glint);
        glint.position.lerpVectors(silkTop, pa, f);
        glint.material.opacity = 0.9 * Math.sin(Math.PI * f);
      } else hide(glint);
    } else { hide(silk); hide(glint); }
    // ---- the pad it spins (it stays, under the husk)
    if (sw >= LIFE.pad[0]) show(tuft, Math.max(1e-4, smooth(0, 1, span(LIFE.pad, sw)))); else hide(tuft);

    // ---- the chrysalis: soft and long as it comes, wriggling; it firms and shortens, its gold comes; it
    // darkens until the wings show; it is left an empty husk
    if (sw >= LIFE.split[0]) {
      const w = smooth(0, 1, span(LIFE.split, sw)), set = smooth(0, 1, span(LIFE.set, sw));
      show(ch.g, null);
      const sy = lerp(lerp(0.3, 1.3, w), 1, set), sxz = lerp(lerp(0.5, 0.9, w), 1, set);
      ch.g.scale.set(CHS * sxz, CHS * sy, CHS * sxz);
      ch.g.rotation.z = reduced ? 0 : 0.2 * Math.sin(t * 6.3) * Math.sin(Math.PI * w) * (1 - set);
      ch.golds.forEach((m) => m.scale.setScalar(Math.max(1e-4, set)));
      const ripe = span(LIFE.ripe, sw), out = span(LIFE.out, sw);
      const col = ch.jade.color.copy(SOFT).lerp(JADE, set).lerp(DARK, smooth(0, 1, ripe));
      if (out > 0) col.lerp(HUSK, smooth(0, 0.6, out));
      ch.jade.opacity = out > 0 ? lerp(0.74, 0.3, smooth(0, 0.6, out)) : lerp(1, 0.74, smooth(0.2, 1, ripe));
      ch.jade.envMapIntensity = lerp(0.9, 0.35, Math.max(smooth(0, 1, ripe), smooth(0, 0.5, out)));
      ch.jade.clearcoat = out > 0 ? lerp(0.6, 0.1, smooth(0, 0.5, out)) : 0.6;
      // (it keeps writing its depth even as it clears: without it the lens took it for the far dark
      // behind and blurred it into a halo)
      ch.core.visible = ripe > 0.05 && out < 0.15;
    } else hide(ch.g);

    // ---- the butterfly
    const outU = span(LIFE.out, sw), dryU = span(LIFE.dry, sw), flyU = span(LIFE.fly, sw), eggU = span(LIFE.egg, sw);
    // (it leaves just as the walk reaches the last piece, while the room is still lit, so the egg is seen)
    const leave = clamp((p - walk * (2.98 / 3)) / 0.06, 0, 1);
    abdPivot.rotation.x = 0;
    if (outU <= 0.02) hide(fly);
    else {
      show(fly);
      if (flyU <= 0) {
        // out, hanging from the husk by its legs, head up, its back to the side; its wings small and
        // crumpled, filling, then opened once or twice to dry
        fly.position.copy(husk).add(v.set(0, 0.035 * (1 - smooth(0, 0.6, outU)), 0));
        face(UP, hangBack);
        const fill = smooth(0, 0.85, dryU);
        const open = Math.sin(Math.PI * span([0.55, 0.72], dryU)) + Math.sin(Math.PI * span([0.82, 0.96], dryU));
        flap(1.42 - 0.95 * open + (reduced ? 0 : 0.03 * Math.sin(t * 2.3)), lerp(0.28, 1, fill) * smooth(0, 0.4, outU), (1 - fill) * 0.35 * (reduced ? 1 : Math.sin(t * 1.7 + 0.3)));
      } else if (leave <= 0) {
        // the flight down, flapping and gliding; landing on the milkweed leaf, wings open to the light;
        // laying, they lift a little and the abdomen curls to the leaf
        const u = smooth(0, 1, flyU);
        const dir = along3(F1, u, fly.position);
        // (through the middle of the flight it keeps pace with the camera, a little ahead and to the right,
        // wandering as it goes, so it is never lost from the picture)
        if (camera) {
          camera.getWorldDirection(cf); cr.crossVectors(cf, UP).normalize(); cu.crossVectors(cr, cf).normalize();
          anchor.copy(camera.position).addScaledVector(cf, 1.15).addScaledVector(cr, 0.3 + 0.06 * Math.sin(t * 0.7)).addScaledVector(cu, 0.08 + 0.05 * Math.sin(t * 1.1 + 1));
          fly.position.lerp(anchor, 0.85 * Math.pow(Math.sin(Math.PI * smooth(0.12, 0.9, flyU)), 0.8));
        }
        const toFly = smooth(0, 0.1, flyU), toLand = smooth(0.88, 1, flyU);
        hd.copy(UP).lerp(dir, toFly).lerp(LF.X, toLand);
        bk.copy(hangBack).lerp(UP, toFly).lerp(LF.Y, toLand);
        face(hd, bk);
        const lay = Math.sin(Math.PI * eggU);
        const bask = 0.2 + 0.6 * Math.pow(0.5 + 0.5 * Math.sin(t * 0.9), 3);
        const a = flyU < 1 ? lerp(lerp(1.42, beat(t), toFly), bask, toLand) : lerp(bask, 0.6, lay);
        flap(reduced ? lerp(0.6, 0.3, toLand) : a, 1);
        abdPivot.rotation.x = -0.7 * lay;
        if (!reduced && flyU < 0.97) fly.position.y += 0.01 * Math.sin(t * TAU * 4.4 + 1.2) * toFly * (1 - toLand);
      } else {
        // walking on beyond the last piece: it lifts off the leaf and flies away into the dark
        const u = smooth(0, 1, leave);
        const dir = along3(F2, u, fly.position);
        face(hd.copy(LF.X).lerp(dir, smooth(0, 0.15, leave)), bk.copy(LF.Y).lerp(UP, smooth(0, 0.15, leave)));
        flap(reduced ? 0.6 : beat(t + 0.3), 1);
        if (leave >= 1) hide(fly);
      }
    }
    // ---- the egg it lays: the same as the one it came from
    if (eggU > 0.55) { show(egg, null); const s = smooth(0.55, 0.75, eggU); egg.scale.set(0.0068 * s + 1e-4, 0.0094 * s + 1e-4, 0.0068 * s + 1e-4); } else hide(egg);

    // ---- what each part says when the pointer rests on it
    sayOn(cat, cText);
    sayOn(ch.g, sw < LIFE.set[0] ? SAY.split : sw < LIFE.ripe[0] ? SAY.pupa : sw < LIFE.out[0] ? SAY.ripe : SAY.husk);
    sayOn(fly, sw < LIFE.fly[0] ? SAY.out : eggU > 0 && eggU < 1 ? SAY.lay : SAY.fly);
  }

  update(0, 0, 1, 0);
  return { update, tEat, E, touch, pad, land, LIFE };
}
