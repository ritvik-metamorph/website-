// The practice's plate (about.html, "The practice behind us"; js/about-scenes.js drives it).
//
// One thing in front, lit like a studio shot, and the words beside it. A polished steel plate, the
// kind a banknote is printed from. It comes up edge-on, a line of light; it turns to face you as you
// scroll, and the light runs across it, silver where it catches the lamp and near black where it
// doesn't; and while it turns the practice's thirty years are cut into it, a ring a year, the count
// engraved at its centre.
//
// - The engraving: the rings, the count and the lettering are cut into two canvases, one for the
//   steel's colour and one for its relief, roughness and shine (red, green and blue). The grooves
//   are rougher and duller than the polish round them, so they read light on the dark and dark on
//   the light.
// - The light: a dark studio built in the scene, a tall softbox and a narrow strip the turning
//   plate sweeps past, a strip behind the lens that lights its edge, and a low lamp for the grooves.
import * as THREE from '../assets/vendor/three.module.min.js';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

const PW = 2, PH = 3, PD = 0.026; // the plate, in scene units
const TW = 1024, TH = 1536;      // its face, in pixels
const RC = [512, 610], RS = 4.35; // the rosette's centre on the face, and its units (the SVG's) in pixels

// ---------------------------------------------------------------- the studio

function studio(renderer) {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 20, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.003, 0.004, 0.005), side: THREE.BackSide })));
  // a softbox's glow: brightest at its heart, falling away to nothing at its edges, so the steel
  // shows it as a gradient from silver to black rather than a flat patch
  const glow = document.createElement('canvas');
  glow.width = glow.height = 256;
  const g = glow.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, '#fff');
  grad.addColorStop(0.35, '#bbb');
  grad.addColorStop(1, '#000');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const soft = new THREE.CanvasTexture(glow);
  soft.colorSpace = THREE.SRGBColorSpace;
  const panel = (w, h, k, pos, { rgb = [1, 0.97, 0.93], map = null } = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...rgb).multiplyScalar(k), map, side: THREE.DoubleSide }));
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    s.add(m);
  };
  panel(7, 11, 3.4, [-5.5, 1.5, 6.5], { map: soft });         // a big softbox, front left: the broad sweep
  panel(0.28, 12, 6, [5.5, 0.5, 6.5], { rgb: [0.86, 0.92, 1] }); // a narrow cool strip, front right: the sharp line
  panel(0.6, 4.5, 3.2, [0, 0.4, 13]);                          // behind the lens: the edge's line of light
  panel(10, 3, 0.9, [0, 8, 2], { map: soft });                 // faint, overhead
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(s, 0.01);
  pm.dispose();
  soft.dispose();
  s.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
  return rt;
}

// a plate with rounded corners and a fine bevel, the face's engraving running edge to edge
function plateGeometry() {
  const r = 0.08, x0 = -PW / 2, y0 = -PH / 2, x1 = PW / 2, y1 = PH / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x0 + r, y0);
  shape.lineTo(x1 - r, y0); shape.quadraticCurveTo(x1, y0, x1, y0 + r);
  shape.lineTo(x1, y1 - r); shape.quadraticCurveTo(x1, y1, x1 - r, y1);
  shape.lineTo(x0 + r, y1); shape.quadraticCurveTo(x0, y1, x0, y1 - r);
  shape.lineTo(x0, y0 + r); shape.quadraticCurveTo(x0, y0, x0 + r, y0);
  const g = new THREE.ExtrudeGeometry(shape, { depth: PD, bevelEnabled: true, bevelThickness: 0.005, bevelSize: 0.005, bevelSegments: 3, curveSegments: 8 });
  g.translate(0, 0, -PD / 2);
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - x0) / PW, (p.getY(i) - y0) / PH);
  return g;
}

// ---------------------------------------------------------------- the face

// Everything cut into the plate, drawn in one colour on one ground (called once for the colour
// canvas and once for the relief): the frame, the rosette to e (0 to 1), the count, the lettering,
// and when it is done the microtext round the rosette.
function cutFace(ctx, ground, groove, { geo, e, years, start }) {
  ctx.fillStyle = ground;
  ctx.fillRect(0, 0, TW, TH);
  ctx.strokeStyle = groove;
  ctx.fillStyle = groove;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([]);
  // the frame, a heavy rule and a fine one inside it
  const frame = (inset, w, rr) => {
    ctx.lineWidth = w;
    ctx.beginPath();
    ctx.roundRect(inset, inset, TW - 2 * inset, TH - 2 * inset, rr);
    ctx.stroke();
  };
  frame(50, 3.2, 34);
  frame(64, 1.3, 24);
  // the rings, a line at a time, each drawn as far as its share of e
  const N = 30;
  geo.forEach((l) => {
    const t = clamp(e * N * 1.04 - l.k, 0, 1);
    if (t <= 0) return;
    ctx.lineWidth = l.rule ? 1.1 : l.b ? 1.2 : 1.6;
    ctx.globalAlpha = l.b ? 0.75 : 1;
    ctx.setLineDash(t < 1 ? [t * l.len * RS, l.len * RS + 10] : []);
    ctx.stroke(l.path);
  });
  ctx.globalAlpha = 1;
  ctx.setLineDash([]);
  // the count, at the rosette's centre
  const cx = RC[0], cy = RC[1];
  const face = (spec, stretch) => { ctx.font = spec; if ('fontStretch' in ctx) ctx.fontStretch = stretch || 'normal'; };
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  face('500 118px "Noto Serif Display", Georgia, serif', 'condensed');
  ctx.fillText(String(years), cx, cy + 12);
  face('18px "Instrument Sans", system-ui, sans-serif');
  ctx.fillText('years of signed', cx, cy + 44);
  ctx.fillText('accounts', cx, cy + 65);
  face('18px "Fragment Mono", ui-monospace, monospace');
  ctx.fillText(String(start + years), cx, cy + 93);
  // the lettering below
  face('500 86px "Noto Serif Display", Georgia, serif', 'condensed');
  ctx.fillText('Metamorph Capital', cx, 1205);
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(cx - 170, 1248);
  ctx.lineTo(cx + 170, 1248);
  ctx.stroke();
  face('italic 450 34px "Noto Serif Display", Georgia, serif', 'semi-condensed');
  ctx.fillText('Thirty years, engraved.', cx, 1302);
  face('20px "Fragment Mono", ui-monospace, monospace');
  ctx.textAlign = 'left';
  ctx.fillText(String(start), 104, TH - 104);
  ctx.textAlign = 'right';
  ctx.fillText(String(start + 30), TW - 104, TH - 104);
  // the microtext, once the thirtieth ring is cut
  if (e >= 0.995) {
    face('14px "Fragment Mono", ui-monospace, monospace');
    ctx.textAlign = 'center';
    const text = Array(5).fill('Metamorph Capital · thirty years of signed accounts · ').join('');
    const R = 95.5 * RS;
    let a = -Math.PI / 2;
    for (const ch of text) {
      const w = ctx.measureText(ch).width;
      a += w / 2 / R;
      if (a > (3 * Math.PI) / 2) break;
      ctx.save();
      ctx.translate(cx + R * Math.cos(a), cy + R * Math.sin(a));
      ctx.rotate(a + Math.PI / 2);
      ctx.fillText(ch, 0, 0);
      ctx.restore();
      a += w / 2 / R;
    }
  }
}

// ---------------------------------------------------------------- the scene

export function createPlate(canvas, { geo, start, reduced }) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;

  const scene = new THREE.Scene();
  const env = studio(renderer);
  scene.environment = env.texture;
  const lamp = new THREE.DirectionalLight(0xfff3e4, 1.3); // low and to the left: what the grooves catch
  lamp.position.set(-3, -1.5, 4);
  scene.add(lamp);

  // the face: the rosette's lines as paths, measured once
  const lines = geo.map((l) => {
    const path = new Path2D();
    let len = 0;
    l.pts.forEach(([x, y], i) => {
      const X = RC[0] + x * RS, Y = RC[1] + y * RS;
      if (i) { const [px, py] = l.pts[i - 1]; len += Math.hypot(x - px, y - py); path.lineTo(X, Y); } else path.moveTo(X, Y);
    });
    return { ...l, path, len };
  });
  const colour = document.createElement('canvas'), relief = document.createElement('canvas');
  [colour, relief].forEach((c) => { c.width = TW; c.height = TH; });
  const cctx = colour.getContext('2d'), rctx = relief.getContext('2d');
  const aniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  const cmap = new THREE.CanvasTexture(colour);
  cmap.colorSpace = THREE.SRGBColorSpace;
  const rmap = new THREE.CanvasTexture(relief);
  [cmap, rmap].forEach((t) => { t.anisotropy = aniso; });
  // polished steel round grooves that are rougher, duller and a little lower
  const faceMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: cmap, metalness: 1, metalnessMap: rmap, roughness: 1, roughnessMap: rmap,
    bumpMap: rmap, bumpScale: -1.2, envMapIntensity: 1.15,
  });
  const sideMat = new THREE.MeshPhysicalMaterial({ color: 0xe6e9ec, metalness: 1, roughness: 0.12, envMapIntensity: 1.4 });
  const mesh = new THREE.Mesh(plateGeometry(), [faceMat, sideMat]);

  // it comes up from below as a line (rise), then turns (turn)
  const rise = new THREE.Group(), turn = new THREE.Group();
  rise.position.y = -PH / 2;
  turn.position.y = PH / 2;
  turn.add(mesh);
  rise.add(turn);
  scene.add(rise);

  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 60);

  // ---- what js/about-scenes.js sets, and where the plate is now
  const goal = { arrive: reduced ? 1 : 0, turn: reduced ? 1 : 0, hx: 0, hy: 0 };
  const now = { ...goal };
  let face = { e: -1, years: -1 }, dirty = true, raf = 0, last = 0, visible = true;

  function cut(e, years) {
    const q = Math.round(e * 360) / 360; // a few hundred steps is fine enough to look continuous
    if (q === face.e && years === face.years) return;
    face = { e: q, years };
    const args = { geo: lines, e: q, years, start };
    cutFace(cctx, '#e9ebee', '#7b8186', args);
    cutFace(rctx, 'rgb(18, 18, 255)', 'rgb(150, 150, 135)', args);
    cmap.needsUpdate = true;
    rmap.needsUpdate = true;
    kick();
  }

  // ---- framing
  let W = 1, H = 1;
  function resize() {
    W = canvas.clientWidth || 1;
    H = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.2e6 / (W * H)))));
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    const tanH = Math.tan((camera.fov * Math.PI) / 360);
    // the plate's height a little under the frame's, and its width inside it
    const d = Math.max((PH * 1.1) / (2 * tanH), (PW * 1.45) / (2 * tanH * camera.aspect));
    camera.position.set(0, 0, d);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    kick();
  }

  // ---- the pose: edge-on to begin with, turning past the softboxes to face you, a little off
  // square, then drifting a few degrees more so the light keeps moving as the last rings are cut
  function pose(dt) {
    const k = reduced ? 1e3 : 7;
    let moving = false;
    for (const key of Object.keys(goal)) {
      const v = damp(now[key], goal[key], key === 'hx' || key === 'hy' ? 4 : k, dt);
      if (Math.abs(v - goal[key]) > 1e-4) moving = true;
      now[key] = Math.abs(v - goal[key]) > 1e-4 ? v : goal[key];
    }
    const a = now.arrive, t = now.turn;
    rise.scale.y = Math.max(0.002, ease(smooth(0, 1, a)));
    const swing = ease(smooth(0, 0.62, t)), drift = smooth(0.55, 1, t);
    turn.rotation.order = 'YXZ';
    turn.rotation.y = lerp(Math.PI / 2 - 0.02, -0.26, swing) + 0.36 * drift + now.hx * 0.22;
    turn.rotation.x = lerp(0, -0.05, swing) + now.hy * 0.16;
    turn.rotation.z = lerp(0, -0.045, swing);
    return moving;
  }

  function frame(ts) {
    raf = 0;
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60;
    last = ts;
    const moving = pose(dt);
    renderer.render(scene, camera);
    dirty = false;
    if (moving && visible) raf = requestAnimationFrame(frame);
    else last = 0;
  }
  function kick() {
    dirty = true;
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }

  resize();
  cut(reduced ? 1 : 0, reduced ? 30 : 0);
  addEventListener('resize', resize);

  return {
    // arrive and turn are 0 to 1; e is the share of the rings cut; years the count
    set({ arrive, turn: tn, e, years }) {
      if (arrive != null) goal.arrive = arrive;
      if (tn != null) goal.turn = tn;
      if (e != null) cut(e, years);
      kick();
    },
    point(hx, hy) { if (reduced) return; goal.hx = hx; goal.hy = hy; kick(); },
    show(on) { visible = on; if (on && dirty) kick(); },
    resize,
    // (testing: the plate as it is now, as an image)
    snap() { pose(1); renderer.render(scene, camera); return canvas.toDataURL('image/jpeg', 0.92); },
  };
}
