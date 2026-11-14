// The Creative Corner's opening, a third way: the pedestal (14 Nov; creative.html, js/corner.js
// starts it after the two galleries). After a poster the user sent: one piece standing on a carved
// stone capital in front of a dark velvet curtain, a single light from above. Its composition, not
// its parts. The piece of the day stands on it; scrolling turns you a little round the column, and
// the week's and the month's are set down on it in turn as the last is lifted off.
//
// The capital is a Corinthian one, carved in code, and the metamorphosis is hidden in its stone,
// for whoever looks closely (rest the pointer on a carving, or hold it on a phone, and a line says
// what it is):
// - the egg-and-dart round its neck is a row of eggs, and the nine at the front carry the letters
//   of Metamorph, faintly, as the way in's pearls do;
// - its corner scrolls (the volutes) are four caterpillars curled up, thirteen segments each, as a
//   caterpillar has, each with its head at the eye of the scroll;
// - under one leaf, where no one looks, a chrysalis hangs, with the gold dots a monarch's has;
// - the flower at the middle of each face of the top slab is a butterfly;
// - the column has twenty-seven flutes, one for each discipline in the founder's atlas.
// The light follows the pointer, so its raking light finds the carvings.
import * as THREE from '../assets/vendor/three.module.min.js';
import { BARS } from './corner-museum.js';

const { gsap } = window;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const TAU = Math.PI * 2;
const rnd = (seed) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------------------------------------------------------------- the stone
// a pale, warm marble: soft clouds in it, a few faint veins, fine pits; and its bump, for the light
// to catch
function marble() {
  const S = 1024, c = document.createElement('canvas'), b = document.createElement('canvas');
  c.width = c.height = b.width = b.height = S;
  const x = c.getContext('2d'), y = b.getContext('2d'), r = rnd(7);
  x.fillStyle = '#ddd6ca'; x.fillRect(0, 0, S, S);
  y.fillStyle = '#808080'; y.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const px = r() * S, py = r() * S, rad = 30 + r() * 180, lite = r() > 0.5;
    for (const [g, a] of [[x, 0.05], [y, 0.1]]) {
      const gr = g.createRadialGradient(px, py, 0, px, py, rad);
      const col = lite ? '255,252,246' : g === x ? '120,110,98' : '40,40,40';
      gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`);
      g.fillStyle = gr; g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
    }
  }
  // veins
  x.lineCap = 'round';
  for (let i = 0; i < 9; i++) {
    let px = r() * S, py = r() * S, a = r() * TAU;
    x.strokeStyle = `rgba(110, 100, 92, ${0.08 + r() * 0.1})`; x.lineWidth = 0.6 + r() * 1.4;
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 60; k++) { a += (r() - 0.5) * 0.6; px += Math.cos(a) * 14; py += Math.sin(a) * 14; x.lineTo(px, py); }
    x.stroke();
  }
  // pits and grain
  for (let i = 0; i < 9000; i++) {
    const px = r() * S, py = r() * S, s = r() * 1.6 + 0.3;
    x.fillStyle = `rgba(90, 80, 70, ${r() * 0.18})`; x.fillRect(px, py, s, s);
    y.fillStyle = `rgba(0, 0, 0, ${r() * 0.5})`; y.fillRect(px, py, s, s);
  }
  const map = new THREE.CanvasTexture(c), bump = new THREE.CanvasTexture(b);
  for (const t of [map, bump]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; }
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, bump };
}

// ---------------------------------------------------------------- the capital
// heights, from the top of the shaft (0) to the top of the slab (TOP)
const R0 = 0.4;       // the shaft's radius at its top
const TOP = 1.0;      // the top of the abacus, where the piece stands
const BELL = [[0.405, 0.06], [0.408, 0.2], [0.425, 0.4], [0.46, 0.6], [0.51, 0.76], [0.55, 0.83], [0.555, 0.855], [0.5, 0.86]];
const bellR = (y) => {
  if (y <= BELL[0][1]) return BELL[0][0];
  for (let i = 1; i < BELL.length; i++) if (y <= BELL[i][1]) { const [r0, y0] = BELL[i - 1], [r1, y1] = BELL[i]; return lerp(r0, r1, (y - y0) / (y1 - y0)); }
  return BELL[BELL.length - 1][0];
};

// a smooth tube along points, its radius changing along it (for the caterpillars)
function tube(points, radius, radial = 14) {
  const curve = new THREE.CatmullRomCurve3(points);
  const N = points.length * 4, frames = curve.computeFrenetFrames(N, false);
  const pos = [], nor = [], uv = [], idx = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, P = curve.getPointAt(t), Nn = frames.normals[i], B = frames.binormals[i], r = radius(t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU, cx = Math.cos(a), sy = Math.sin(a);
      const n = new THREE.Vector3().addScaledVector(Nn, cx).addScaledVector(B, sy).normalize();
      pos.push(P.x + n.x * r, P.y + n.y * r, P.z + n.z * r);
      nor.push(n.x, n.y, n.z);
      uv.push(t * 4, j / radial);
    }
  }
  for (let i = 0; i < N; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return { g, curve };
}

// an acanthus leaf, standing against the bell at an angle, its lobed edges, its rib, its tip curling
// out and over
function leaf({ angle, y0, h, w, curl }) {
  const NU = 22, NV = 40, pos = [], uv = [], idx = [];
  const s = Math.sin(angle), c = Math.cos(angle);
  for (let j = 0; j <= NV; j++) {
    const v = j / NV;
    const hw = w * Math.pow(Math.sin(Math.PI * Math.min(v * 0.92 + 0.04, 0.985)), 0.62) * (0.74 + 0.26 * Math.abs(Math.sin(v * Math.PI * 4.5))) * (1 - 0.3 * v);
    const out0 = curl * Math.pow(smooth(0.5, 1, v), 1.5);
    const droop = curl * 0.5 * Math.pow(smooth(0.78, 1, v), 2);
    const yy = y0 + v * h - droop;
    for (let i = 0; i <= NU; i++) {
      const u = (i / NU) * 2 - 1;
      const tx = u * hw;
      const rib = 0.012 * Math.exp(-Math.pow(u / 0.14, 2)) * (1 - 0.6 * v);
      const cup = -0.04 * u * u * (0.5 + v);
      const r = bellR(clamp(yy, 0.06, 0.85)) + 0.012 + out0 + rib + cup + 0.012;
      pos.push(s * r + c * tx, yy, c * r - s * tx);
      uv.push(i / NU, v);
    }
  }
  for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) {
    const a = j * (NU + 1) + i, b = a + NU + 1;
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  // where its tip is, for the chrysalis
  const tip = new THREE.Vector3().fromArray(pos, (NV * (NU + 1) + NU / 2) * 3);
  return { g, tip };
}

// a butterfly in relief: two wings a side and a body, flat against the stone
function butterfly(stone) {
  const g = new THREE.Group();
  const fore = new THREE.Shape();
  fore.moveTo(0, 0); fore.bezierCurveTo(0.03, 0.06, 0.09, 0.09, 0.125, 0.075); fore.bezierCurveTo(0.13, 0.04, 0.09, 0.01, 0, -0.005);
  const hind = new THREE.Shape();
  hind.moveTo(0, -0.005); hind.bezierCurveTo(0.07, -0.01, 0.1, -0.05, 0.075, -0.075); hind.bezierCurveTo(0.05, -0.09, 0.02, -0.05, 0, -0.02);
  const ex = { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 18 };
  for (const side of [1, -1]) {
    const wing = new THREE.Group();
    for (const sh of [fore, hind]) {
      const m = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, ex), stone);
      m.castShadow = m.receiveShadow = true;
      wing.add(m);
    }
    wing.scale.x = side;
    wing.rotation.y = side * 0.22;
    g.add(wing);
  }
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.009, 0.08, 4, 10), stone);
  body.position.set(0, -0.01, 0.012);
  body.castShadow = true;
  g.add(body);
  // its antennae, two fine curls
  for (const side of [1, -1]) {
    const pts = [new THREE.Vector3(0, 0.03, 0.014), new THREE.Vector3(side * 0.012, 0.06, 0.016), new THREE.Vector3(side * 0.03, 0.075, 0.016)];
    const t = tube(pts, () => 0.0028, 6);
    const a = new THREE.Mesh(t.g, stone);
    g.add(a);
  }
  return g;
}

function capital(stone, gold, letters) {
  const cap = new THREE.Group(), eggs = [];
  const tagOf = (m, say) => { m.userData.say = say; eggs.push(m); return m; };
  const add = (geo, mat = stone) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; cap.add(m); return m; };

  // the shaft, fluted: twenty-seven flutes, one for each discipline
  const FL = 27, shaft = new THREE.CylinderGeometry(R0, R0 * 1.08, 7, FL * 10, 8, true);
  const p = shaft.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i), y = p.getY(i);
    const a = Math.atan2(x, z), rr = Math.hypot(x, z);
    const u = ((a / TAU) * FL % 1 + 1) % 1 - 0.5;
    const d = Math.abs(u) < 0.4 ? 0.022 * Math.sqrt(1 - Math.pow(u / 0.4, 2)) : 0;
    const k = (rr - d) / rr;
    p.setXYZ(i, x * k, y, z * k);
  }
  shaft.computeVertexNormals();
  shaft.translate(0, -3.5 - 0.04, 0);
  tagOf(add(shaft), 'Twenty-seven flutes, one for each discipline.');

  // the neck: a round, then the egg-and-dart, a row of eggs, nine of them lettered
  add(new THREE.TorusGeometry(R0 + 0.012, 0.026, 12, 96).rotateX(Math.PI / 2).translate(0, -0.02, 0));
  add(new THREE.TorusGeometry(R0 + 0.005, 0.01, 8, 96).rotateX(Math.PI / 2).translate(0, 0.11, 0));
  const eggGeo = new THREE.SphereGeometry(1, 18, 14);
  const dartGeo = new THREE.ConeGeometry(0.009, 0.05, 8).rotateX(Math.PI);
  const NE = 30;
  for (let k = 0; k < NE; k++) {
    const a = (k / NE) * TAU, sx = Math.sin(a), cz = Math.cos(a);
    const egg = add(eggGeo);
    egg.scale.set(0.026, 0.038, 0.016);
    egg.position.set(sx * (R0 + 0.006), 0.05, cz * (R0 + 0.006));
    egg.rotation.y = a;
    const front = Math.round(((a + Math.PI) % TAU - Math.PI) / (TAU / NE));
    if (Math.abs(front) <= 4) {
      tagOf(egg, 'Nine eggs, a letter on each: Metamorph.');
      // its letter, faint, as if cut into it
      const L = new THREE.Mesh(new THREE.PlaneGeometry(0.03, 0.03), letters[front + 4]);
      L.position.set(sx * (R0 + 0.024), 0.05, cz * (R0 + 0.024));
      L.rotation.y = a;
      cap.add(L);
    } else tagOf(egg, 'An egg, where every change begins.');
    const dart = add(dartGeo);
    const b = a + Math.PI / NE;
    dart.position.set(Math.sin(b) * (R0 + 0.004), 0.05, Math.cos(b) * (R0 + 0.004));
  }

  // the bell
  add(new THREE.LatheGeometry(BELL.map(([r, y]) => new THREE.Vector2(r, y)), 96));

  // the leaves: a lower ring of eight and an upper ring of eight between them
  const tips = [];
  for (let k = 0; k < 8; k++) {
    const lo = leaf({ angle: (k / 8) * TAU, y0: 0.1, h: 0.4, w: 0.19, curl: 0.1 });
    add(lo.g);
    const up = leaf({ angle: ((k + 0.5) / 8) * TAU, y0: 0.26, h: 0.46, w: 0.17, curl: 0.12 });
    add(up.g);
    tips.push(up.tip);
  }

  // the corner scrolls: four caterpillars, each rising from between the leaves and curling under a
  // corner of the slab, thirteen segments, its head at the eye of the scroll
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU + Math.PI / 4, er = new THREE.Vector3(Math.sin(a), 0, Math.cos(a)), up = new THREE.Vector3(0, 1, 0);
    const at = (r, y) => er.clone().multiplyScalar(r).add(up.clone().multiplyScalar(y));
    const pts = [at(bellR(0.42) + 0.02, 0.42), at(bellR(0.56) + 0.05, 0.56), at(0.62, 0.68), at(0.72, 0.78)];
    const C = { r: 0.8, y: 0.74 };
    const TURNS = 2.2;
    for (let i = 0; i <= 60; i++) {
      const t = i / 60, th = Math.PI * 0.62 - t * TURNS * TAU, rho = 0.12 * Math.exp(-0.3 * t * TURNS * TAU / 2.2);
      pts.push(at(C.r + Math.cos(th) * rho, C.y + Math.sin(th) * rho));
    }
    const body = tube(pts, (t) => {
      const base = lerp(0.05, 0.016, Math.pow(t, 0.8));
      return base * (1 + 0.16 * Math.pow(Math.abs(Math.sin(t * 13 * Math.PI)), 0.7));
    }, 16);
    tagOf(add(body.g), 'A caterpillar, curled up: thirteen segments.');
    // its head
    const end = body.curve.getPointAt(1);
    const head = add(new THREE.SphereGeometry(0.021, 14, 10));
    head.position.copy(end);
    tagOf(head, 'A caterpillar, curled up: thirteen segments.');
  }

  // the slab: square, its sides drawn in, its corners cut
  const A = 0.72, IN = 0.1, CUT = 0.05;
  const sh = new THREE.Shape();
  sh.moveTo(-A + CUT, -A);
  sh.quadraticCurveTo(0, -A + IN * 2, A - CUT, -A);
  sh.lineTo(A, -A + CUT);
  sh.quadraticCurveTo(A - IN * 2, 0, A, A - CUT);
  sh.lineTo(A - CUT, A);
  sh.quadraticCurveTo(0, A - IN * 2, -A + CUT, A);
  sh.lineTo(-A, A - CUT);
  sh.quadraticCurveTo(-A + IN * 2, 0, -A, -A + CUT);
  sh.closePath();
  const slab = new THREE.ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 3, curveSegments: 40 });
  slab.rotateX(-Math.PI / 2);
  slab.translate(0, TOP - 0.132, 0);
  add(slab);
  // on the middle of each side, where a flower would be: a butterfly
  for (let k = 0; k < 4; k++) {
    const a = (k / 4) * TAU, b = butterfly(stone);
    const face = A - IN + 0.014;
    b.position.set(Math.sin(a) * face, TOP - 0.075, Math.cos(a) * face);
    b.rotation.y = a;
    b.scale.setScalar(1.25);
    b.traverse((m) => { if (m.isMesh) tagOf(m, 'Not a flower: a butterfly.'); });
    cap.add(b);
  }

  // under one leaf, round to the side, where no one looks: a chrysalis, gold-dotted
  const tip = tips[1];
  const chry = new THREE.Group();
  const prof = [];
  for (let i = 0; i <= 20; i++) { const t = i / 20; prof.push(new THREE.Vector2(0.022 * Math.pow(Math.sin(Math.PI * t), 0.8) * (1 - 0.25 * t), -t * 0.1)); }
  const pod = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), stone);
  pod.castShadow = true;
  chry.add(pod);
  const thread = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, 0.03, 6), stone);
  thread.position.y = 0.015;
  chry.add(thread);
  for (let i = 0; i < 6; i++) {
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0035, 8, 6), gold);
    const a = (i / 6) * TAU;
    dot.position.set(Math.sin(a) * 0.017, -0.03, Math.cos(a) * 0.017);
    chry.add(dot);
  }
  chry.position.copy(tip).add(new THREE.Vector3(0, -0.05, 0));
  chry.traverse((m) => { if (m.isMesh) tagOf(m, 'A chrysalis, hung where no one looks.'); });
  cap.add(chry);

  return { cap, eggs };
}

// ---------------------------------------------------------------- the curtain
function curtain() {
  const W = 26, H = 16, NX = 520, NY = 30;
  const g = new THREE.PlaneGeometry(W, H, NX, NY);
  const p = g.attributes.position, r = rnd(11);
  const ph = Array.from({ length: 6 }, () => r() * TAU);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i);
    const z = 0.16 * Math.sin(x * 2.3 + ph[0] + 0.25 * Math.sin(y * 0.4 + ph[1]))
      + 0.08 * Math.sin(x * 5.1 + ph[2]) + 0.05 * Math.sin(x * 9.7 + ph[3] + y * 0.15)
      + 0.03 * Math.sin(x * 17.0 + ph[4]);
    p.setZ(i, z);
  }
  g.computeVertexNormals();
  const m = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#2c0b0e'), roughness: 0.82, sheen: 1, sheenColor: new THREE.Color('#7a2228'), sheenRoughness: 0.42 });
  const mesh = new THREE.Mesh(g, m);
  mesh.receiveShadow = true;
  return mesh;
}

// ---------------------------------------------------------------- the pedestal

export function createPedestal(host, { picks, art, open, lenis, reduced, local, wide, tag }) {
  const stage = el('div', 'cp-mu-stage cp-pd-stage');
  const canvas = el('canvas', 'cp-mu-gl');
  canvas.setAttribute('aria-hidden', 'true');
  const hits = el('div', 'cp-mu-hits');
  const hint = el('p', 'cp-mu-hint', 'Scroll to walk round the pedestal');
  // the corners, small, as on a poster: the honour and the title; the maker; where you are
  const tl = el('div', 'cp-pd-c cp-pd-tl'), bl = el('div', 'cp-pd-c cp-pd-bl'), br = el('div', 'cp-pd-c cp-pd-br');
  const say = el('p', 'cp-pd-say');
  say.setAttribute('aria-live', 'polite');
  stage.append(canvas, hits, tl, bl, br, say, hint);
  if (tag) stage.append(el('p', 'cp-mu-tag', tag));
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  if (!renderer.getContext()) return null;
  host.classList.add('is-room', 'is-plinth');
  host.append(stage);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, wide ? 2 : 1.6));
  renderer.setClearColor(0x050304, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#050304');
  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);

  // ---- the stone, and what is cut into it
  const { map, bump } = marble();
  map.repeat.set(2, 2); bump.repeat.set(2, 2);
  // (both sides: the leaves are single sheets)
  const stone = new THREE.MeshStandardMaterial({ color: new THREE.Color('#f0eadf'), map, bumpMap: bump, bumpScale: 0.6, roughness: 0.66, metalness: 0, side: THREE.DoubleSide });
  const gold = new THREE.MeshStandardMaterial({ color: new THREE.Color('#d8b25a'), metalness: 1, roughness: 0.28 });
  // the nine letters, as faint cuts: one texture each
  const letters = [...'METAMORPH'].map((ch) => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const x = c.getContext('2d');
    x.font = '600 92px "Ibarra Real Nova", Georgia, serif';
    x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillStyle = 'rgba(70, 58, 46, 0.55)'; x.fillText(ch, 64, 70);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, transparent: true, depthWrite: false, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2 });
  });
  const { cap, eggs } = capital(stone, gold, letters);
  scene.add(cap);
  const back = curtain();
  back.position.set(0, 1.2, -3.2);
  scene.add(back);

  // ---- the light: one spot from above and to the left, as on the poster; a little fill; a cool rim
  const spot = new THREE.SpotLight(0xfff1de, 0, 0, 0.36, 0.75, 0);
  spot.intensity = 5.2;
  spot.position.set(-2.4, 4.6, 3.4);
  spot.target.position.set(0, 1.0, 0);
  spot.castShadow = true;
  spot.shadow.mapSize.set(wide ? 2048 : 1024, wide ? 2048 : 1024);
  spot.shadow.radius = 5;
  spot.shadow.blurSamples = 16;
  spot.shadow.bias = -0.0004;
  spot.shadow.normalBias = 0.02;
  spot.shadow.camera.near = 2; spot.shadow.camera.far = 14;
  scene.add(spot, spot.target);
  scene.add(new THREE.HemisphereLight(0x8a7c70, 0x120607, 0.42));
  // (and a soft fill from the front and right, so the carving in the slab's shadow still reads)
  const fill = new THREE.DirectionalLight(0xffe2cc, 0.55);
  fill.position.set(2.2, 1.4, 4);
  scene.add(fill);
  const rim = new THREE.DirectionalLight(0x9fb3d8, 0.55);
  rim.position.set(3, 3, -2);
  scene.add(rim);
  // a soft pool on the curtain behind, where the light falls past the stone
  const pool = new THREE.SpotLight(0xffd9c0, 0, 0, 0.5, 1, 0);
  pool.intensity = 1.1;
  pool.position.set(-1, 5, 2);
  pool.target.position.set(0.6, 1.6, -3.2);
  scene.add(pool, pool.target);

  // ---- the pieces: the day's, the week's and the month's, each a card standing on the slab
  const cards = picks.slice(0, 3).map((k, i) => {
    const r = (k.pc.ratio || 0.8) / (1 - 2 * BARS(k.pc));
    const h = Math.min(1.22, 1.32 / r), w = h * r;
    const g = new THREE.Group();
    const side = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ece9e2'), roughness: 0.9, transparent: true });
    const face = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true });
    const box = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.018), [side, side, side, side, face, side]);
    box.position.y = h / 2;
    box.castShadow = true;
    g.add(box);
    g.position.set(0, TOP + 0.001, -0.06);
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
    return { k, g, w, h, box, mats: [side, face] };
  });
  if (!cards.length) return null;

  // ---- the corners' words
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

  // ---- where you stand: in front, a little to one side, turning round as you scroll
  const N = cards.length - 1, WALK = 0.84;
  let top = 0, span = 1, vw = 1, vh = 1, narrow = false;
  function layout() {
    vw = stage.clientWidth || innerWidth;
    vh = stage.clientHeight || innerHeight;
    narrow = vw / vh < 1;
    renderer.setSize(vw, vh, false);
    camera.aspect = vw / vh;
    camera.fov = narrow ? 46 : 29;
    camera.updateProjectionMatrix();
    top = host.getBoundingClientRect().top + scrollY;
    span = Math.max(1, host.offsetHeight - vh);
    dirty = true;
  }
  const progress = () => clamp((scrollY - top) / span, 0, 1);
  const stopY = (i) => top + (N ? (i / N) * WALK * span : 0);

  // ---- the button that stands for the piece on the page: hover, focus, the click
  const hit = el('button', 'cp-mu-hit'), hitImg = el('img');
  hit.type = 'button';
  hitImg.alt = '';
  hit.append(hitImg);
  hits.append(hit);
  let cur = 0;
  const label = (i) => { const k = cards[i].k; hit.setAttribute('aria-label', `${k.honour ? `${k.honour}: ` : ''}${k.title} by ${k.maker}`); };
  hit.addEventListener('click', () => open(cards[cur].k.pc, { art: hit, img: hitImg, b: hit }));

  // ---- the pointer: the light follows it, and a carving it rests on says what it is
  const pointer = { x: 0.5, y: 0.5, on: false, px: 0, py: 0 };
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
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
  const look = (cx, cy) => {
    ndc.set((cx / vw) * 2 - 1, -(cy / vh) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hitAt = ray.intersectObjects([...eggs, ...cards.map((c) => c.box), back], false)[0];
    return hitAt && hitAt.object.userData.say ? hitAt.object.userData.say : '';
  };
  const onMove = (e) => {
    const r = stage.getBoundingClientRect();
    pointer.px = e.clientX - r.left; pointer.py = e.clientY - r.top;
    pointer.on = r.top < 2 && r.bottom > innerHeight - 2 && pointer.py >= 0 && pointer.py <= r.height;
    if (!pointer.on) { tell(''); return; }
    pointer.x = pointer.px / vw; pointer.y = pointer.py / vh;
    dirty = true;
    if (e.pointerType === 'mouse') tell(look(pointer.px, pointer.py), pointer.px, pointer.py);
  };
  addEventListener('pointermove', onMove, { passive: true });
  // on a phone, a press and hold on the stone says what is there
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
    if (es.some((e) => e.isIntersecting) && lit < 1) gsap.to({ v: lit }, { v: 1, duration: 2.2, ease: 'power2.out', onUpdate() { lit = this.targets()[0].v; dirty = true; } });
  }, { threshold: 0.2 });
  io.observe(host);

  // ---- each frame: only drawn when something has moved
  let dirty = true, alive = true, wasInside = false, lastOp = -1, hinted = false, lastP = -1, shownI = -1;
  const lk = { x: 0, y: 0 };
  const tmp = new THREE.Vector3();
  const screenOf = (v) => { tmp.copy(v).project(camera); return [(tmp.x * 0.5 + 0.5) * vw, (-tmp.y * 0.5 + 0.5) * vh]; };
  function frame() {
    if (!alive) return;
    const r = host.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const p = progress();
    if (p !== lastP) { lastP = p; dirty = true; }
    // the light following the pointer, eased
    const tx = pointer.on ? pointer.x - 0.5 : 0, ty = pointer.on ? pointer.y - 0.5 : 0;
    if (Math.abs(tx - lk.x) + Math.abs(ty - lk.y) > 0.0005) { lk.x += (tx - lk.x) * (reduced ? 1 : 0.08); lk.y += (ty - lk.y) * (reduced ? 1 : 0.08); dirty = true; }
    if (!dirty) return;
    dirty = false;
    if (!hinted && p > 0.01) { hinted = true; hint.classList.add('is-done'); }
    // the walk: dwelling at each piece, easing between
    const sw = clamp(p / WALK, 0, 1) * N, i = Math.min(Math.max(N - 1, 0), Math.floor(sw)), f = N ? smooth(0.2, 0.8, sw - i) : 0;
    const az = N ? lerp(-0.26, 0.26, (i + f) / N) : 0;
    // (the piece and the capital in the upper part of the frame, the column running out of it below)
    const dist = narrow ? 7.2 : 5.7;
    camera.position.set(Math.sin(az) * dist + lk.x * 0.18, 1.02 - lk.y * 0.08, Math.cos(az) * dist);
    camera.lookAt(0, narrow ? 1.0 : 0.92, 0);
    camera.updateMatrixWorld();
    spot.position.set(-2.4 + lk.x * 2.6, 4.6 - lk.y * 1.6, 3.4);
    spot.intensity = 5.2 * lit;
    pool.intensity = 1.1 * lit;
    // the pieces: the one before lifted off the stone and gone, as the next is set down in its place
    cards.forEach((c, k) => {
      let y = 0, o = 0;
      if (k === i) { y = smooth(0, 0.6, f) * 0.45; o = 1 - smooth(0.05, 0.5, f); }
      if (k === i + 1) { y = (1 - smooth(0.4, 1, f)) * 0.45; o = smooth(0.45, 0.9, f); }
      c.g.visible = o > 0.002;
      c.g.position.y = TOP + 0.001 + y;
      c.mats.forEach((m) => { m.opacity = o; m.depthWrite = o > 0.99; });
      c.box.castShadow = o > 0.5;
    });
    const now = f < 0.5 ? i : Math.min(i + 1, N);
    if (now !== shownI) { shownI = now; cur = now; words(now); label(now); }
    // the way out: the room gives way to the night
    const op = 1 - smooth(WALK + 0.03, 1, p);
    if (Math.abs(op - lastOp) > 0.002) { lastOp = op; stage.style.opacity = op.toFixed(3); stage.style.visibility = op < 0.01 ? 'hidden' : ''; }
    const inside = r.top <= 1 && op > 0.5;
    if (inside !== wasInside) { wasInside = inside; document.documentElement.classList.toggle('cc-in-room', inside); }
    renderer.render(scene, camera);
    // the button over the piece, where it is now
    const c = cards[cur];
    const a = screenOf(tmp.set(-c.w / 2, c.g.position.y + c.h, c.g.position.z)), b = screenOf(new THREE.Vector3(c.w / 2, c.g.position.y, c.g.position.z));
    const x0 = Math.min(a[0], b[0]), x1 = Math.max(a[0], b[0]), y0 = Math.min(a[1], b[1]), y1 = Math.max(a[1], b[1]);
    Object.assign(hit.style, { visibility: c.g.visible ? 'visible' : 'hidden', transform: `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`, width: `${(x1 - x0).toFixed(1)}px`, height: `${Math.max(0, Math.min(y1, b[1]) - y0).toFixed(1)}px` });
  }
  layout();
  words(0); label(0);
  gsap.ticker.add(frame);

  const api = {
    kind: 'pedestal',
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
    scene, camera, renderer, cards, stopY, eggs, spot,
    get dirty() { return dirty; }, set dirty(v) { dirty = v; }, tick: () => { dirty = true; frame(); },
  };
  if (local) window.__pedestal = api;
  return api;
}
