// The Creative Corner's opening: the picks in a gallery (creative.html; js/corner.js starts it).
//
// The user (7 Nov): the opening was cluttered, "too much subtext everywhere", and the art should
// come first, with "a proper museum feel": the picks hung on a museum wall that you can roam and
// explore, then the whole collection listed in the normal way. A laptop can take the experience;
// a phone should stay light; both must be explorable. Then five references (a dark gallery with
// one portrait lit and blurred visitors in front, a frame carousel on a dark wall, a lit hall, a
// floating card carousel, a studio-lit object): taken for their composition only. Warm light in a
// dark room; one piece centred and large with its neighbours glimpsed at the edges; real frames;
// depth from visitors out of focus in front of you.
//
// - On a laptop: one long gallery wall, drawn in 3D, that you walk along. The art of the day is
//   first, large, in a gilt frame under its light, with "creative corner" lettered on the wall
//   above it; then the week's and the month's, gilt too (the gilt is the honour); then the six days
//   before, close together in plain dark frames on white mats, as works on paper are hung.
//   Scrolling (or the arrows at the sides, or the arrow keys) walks you from one to the next, its
//   neighbours glimpsed at the edges; moving the mouse turns your head a little. Other visitors,
//   out of focus, stand between you and the wall and pass as you walk. The only words are the
//   museum labels on the wall. Rest on a piece and its light comes up and its maker signs the wall
//   under its label (the corner's Easter egg). Click it and you walk to it, and it opens. At the
//   end of the wall the room gives way to the sky.
// - On a phone, and wherever 3D cannot run: the same wall, kept simple and light, swiped along:
//   the same paint, the same pieces in the same frames under a warm pool of light each, with their
//   labels, and nothing else (no floor, no visitors); hold one and its maker signs it.
//
// The art is never re-lit or altered: in the room each piece is its own picture drawn unlit and
// outside the tone mapping, in its own shape; on the phone's wall it is the picture itself.
import * as THREE from '../assets/vendor/three.module.min.js';

const { gsap } = window;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const NS = 'http://www.w3.org/2000/svg';
const PAPER = '#f1ece3'; // the lettering and labels on the wall
const rgb = (s) => { const m = String(s).trim().match(/^#?([0-9a-f]{6})$/i); const n = m ? parseInt(m[1], 16) : 0x2456e0; return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = (c) => `rgb(${c.join(' ')})`;

// "creative corner", written in the corner's hand (js/hand.js), as one filled outline and its
// lifts (the dots and crosses), with its bounds
export function titleShape({ write, inkOutline, HAND, GAP }) {
  const xh = 100;
  const g = write(['creative corner'], { xh, ...HAND, leadIn: 0.8, gap: GAP });
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (let i = 0; i <= g.N; i++) {
    const x = g.pts[i * 2], y = g.pts[i * 2 + 1];
    x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
  }
  const pad = 14, w = 6.5;
  return { fill: inkOutline(g, { width: w }), lifts: g.lifts, lift: w * 0.85, box: { x: x0 - pad, y: y0 - pad, w: x1 - x0 + 2 * pad, h: y1 - y0 + 2 * pad } };
}

// a picture made soft without the canvas's own blur (which Safari before 18 does not have): halved a
// step at a time, then doubled back a step at a time, so the softness has no steps in it
function soften(src, k) {
  const steps = Math.max(1, Math.round(Math.log2(k)));
  const draw = (from, w, h) => {
    const c = document.createElement('canvas');
    c.width = Math.max(2, Math.round(w)); c.height = Math.max(2, Math.round(h));
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high';
    x.drawImage(from, 0, 0, c.width, c.height);
    return c;
  };
  let cur = src;
  for (let i = 1; i <= steps; i++) cur = draw(cur, src.width / 2 ** i, src.height / 2 ** i);
  for (let i = steps - 1; i >= 0; i--) cur = draw(cur, src.width / 2 ** i, src.height / 2 ** i);
  return cur;
}

// People in the gallery, seen from behind and out of focus. Each is a whole figure (head, neck,
// sloping shoulders, arms, a coat, a jacket or a dress, legs and shoes) in clothes of its own, lit
// the way the room lights them: a warm rim where the light off the wall catches hair and shoulders,
// a little light on the tops of head and shoulders from the fittings above, the rest in shadow.
// Each half is drawn as points from the neck down (x out from the middle, y down from the top of
// the head, both in heights); the other half is its mirror.
const PEOPLE_KINDS = {
  // a man in a long coat, his hands at his sides
  coat: {
    cloth: [27, 25, 29], hair: [16, 12, 10],
    half: [[0.022, 0.118], [0.03, 0.15], [0.08, 0.165], [0.118, 0.185], [0.136, 0.215], [0.142, 0.33], [0.14, 0.45], [0.132, 0.53], [0.118, 0.55], [0.112, 0.6], [0.119, 0.7], [0.072, 0.706], [0.064, 0.95], [0.08, 0.99], [0.022, 0.995], [0.022, 0.72], [0, 0.712]],
  },
  // someone in a short jacket, hands in pockets, elbows out
  pockets: {
    cloth: [46, 33, 24], legs: [16, 16, 19], hair: [22, 16, 12],
    half: [[0.022, 0.118], [0.03, 0.15], [0.075, 0.163], [0.113, 0.183], [0.134, 0.214], [0.15, 0.31], [0.153, 0.37], [0.128, 0.43], [0.108, 0.46], [0.106, 0.53], [0.1, 0.57], [0.09, 0.6], [0.072, 0.95], [0.088, 0.99], [0.02, 0.995], [0.02, 0.63], [0, 0.615]],
  },
  // a woman in a dress, her hair long down her back
  long: {
    cloth: [20, 28, 25], hair: [30, 20, 15],
    half: [[0.02, 0.12], [0.026, 0.152], [0.065, 0.168], [0.103, 0.186], [0.12, 0.212], [0.124, 0.32], [0.118, 0.44], [0.108, 0.5], [0.097, 0.515], [0.1, 0.58], [0.112, 0.68], [0.054, 0.69], [0.047, 0.95], [0.06, 0.99], [0.013, 0.995], [0.013, 0.71], [0, 0.7]],
    locks: [[0, -0.004], [0.04, 0.004], [0.058, 0.04], [0.063, 0.1], [0.068, 0.18], [0.064, 0.25], [0.035, 0.268], [0, 0.27]],
  },
  // a woman with her hair up, in a jacket and trousers
  bun: {
    cloth: [34, 30, 38], legs: [14, 14, 17], hair: [13, 10, 9],
    half: [[0.02, 0.12], [0.026, 0.152], [0.065, 0.168], [0.105, 0.186], [0.122, 0.213], [0.127, 0.32], [0.121, 0.44], [0.111, 0.51], [0.1, 0.525], [0.099, 0.58], [0.084, 0.62], [0.064, 0.95], [0.078, 0.99], [0.016, 0.995], [0.016, 0.65], [0, 0.635]],
    bun: [0, -0.012, 0.03],
  },
};
const PERSON_TOP = 0.08, PERSON_H = 0.9; // the figure's share of its picture, with room above for its blur
function person(kind = 'coat', blur = 22, W = 360, Hc = 800, tint = LOOKS.warm) {
  const K = PEOPLE_KINDS[kind] || PEOPLE_KINDS.coat;
  const c = document.createElement('canvas');
  c.width = W; c.height = Hc;
  const x = c.getContext('2d');
  const Hf = Hc * PERSON_H, top = Hc * PERSON_TOP, cx = W / 2;
  // a point, scaled by k about the feet and lifted, for the rim
  const at = ([u, v], k = 1, lift = 0) => [cx + u * Hf * k, top + (1 - k) * Hf + (v - lift) * Hf * k];
  // a closed outline through the points, smoothed (each corner a curve through the midpoints)
  const outline = (pts) => {
    x.beginPath();
    const n = pts.length;
    x.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let i = 0; i < n; i++) {
      const p = pts[i], q = pts[(i + 1) % n];
      x.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2);
    }
    x.closePath();
  };
  const bodyPts = (k, lift) => {
    const right = K.half.map((p) => at(p, k, lift));
    const left = K.half.slice().reverse().map(([u, v]) => at([-u, v], k, lift));
    return [...right, ...left];
  };
  const head = (k, lift) => {
    const [hx, hy] = at([0, 0.062], k, lift);
    x.beginPath();
    x.ellipse(hx, hy, 0.047 * Hf * k, 0.06 * Hf * k, 0, 0, Math.PI * 2);
    if (K.bun) { const [bx, by] = at([K.bun[0], K.bun[1]], k, lift); x.moveTo(bx + K.bun[2] * Hf * k, by); x.ellipse(bx, by, K.bun[2] * Hf * k, K.bun[2] * Hf * k * 0.9, 0, 0, Math.PI * 2); }
  };
  const locks = (k, lift) => {
    if (!K.locks) return false;
    const right = K.locks.map((p) => at(p, k, lift)), left = K.locks.slice().reverse().map(([u, v]) => at([-u, v], k, lift));
    outline([...right, ...left]);
    return true;
  };
  const rgba = (c3, a = 1) => `rgba(${c3.map((v) => Math.round(v)).join(',')},${a})`;
  const tone = (c3, k) => c3.map((v) => v * k);

  // the rim: the whole figure a touch larger and higher, in the warm light off the wall
  x.fillStyle = `rgba(${tint.rim}, 0.5)`;
  outline(bodyPts(1.016, 0.005)); x.fill();
  head(1.016, 0.006); x.fill();
  if (locks(1.016, 0.006)) x.fill();
  // the figure: its clothes in shadow, lighter at the shoulders where the light reaches
  const g = x.createLinearGradient(0, top + 0.12 * Hf, 0, top + Hf);
  g.addColorStop(0, rgba(tone(K.cloth, 1.15)));
  g.addColorStop(0.45, rgba(tone(K.cloth, 0.62)));
  g.addColorStop(0.62, rgba(tone(K.legs || K.cloth, 0.42)));
  g.addColorStop(1, rgba(tone(K.legs || K.cloth, 0.2)));
  x.fillStyle = g;
  outline(bodyPts(1, 0)); x.fill();
  x.fillStyle = rgba(K.hair);
  head(1, 0); x.fill();
  if (locks(1, 0)) { x.fillStyle = rgba(tone(K.hair, 0.9)); x.fill(); }
  // the light from above, on the tops of the head and shoulders
  x.globalCompositeOperation = 'source-atop';
  const l = x.createRadialGradient(cx, top - 0.02 * Hf, 0, cx, top - 0.02 * Hf, 0.3 * Hf);
  l.addColorStop(0, `rgba(${tint.top}, 0.14)`);
  l.addColorStop(0.55, `rgba(${tint.top}, 0.04)`);
  l.addColorStop(1, `rgba(${tint.top}, 0)`);
  x.fillStyle = l;
  x.fillRect(0, 0, W, Hc);
  x.globalCompositeOperation = 'source-over';
  return soften(c, blur / 2.2);
}

// The light the gallery is lit in. The sky (since 8 Nov, the user: a wall in the "white bluish …
// colors in creative corner normal art section", meaning the page's own blue-and-white sky): the
// wall painted as that sky is, deep blue at the top, through the corner's cobalt and a bright azure,
// down into a white haze at the foot of the wall, over a pale floor, lit evenly with soft pools under
// the spots. So the room is the sky the page goes on into. The lettering high on the wall is light
// on the blue; the labels low on it are in the art section's dark ink. Kept to compare: an all-pale
// gallery tried first the same day, ?light=pale (it took the whole page pale with it); the blue
// gallery before it (cobalt walls, a dark stone floor), ?light=blue; and the warm oxblood one,
// ?light=warm.
// Since 11 Nov the dawn gallery is the default: the client found the room (the sky wall, the gilt,
// the polished floor) overpowering the work, and its light sky blues far from the rest of the site.
// So: close on the wall, only the wall and the work, each piece a stretched canvas the size of the
// picture standing off the wall, its picture wrapped round its sides and a glass face over it, no
// frames; the wall in the site's own gradient (js/silk.js: night, ink blue, before dawn, dawn,
// mist, paper), night at the top into white at the foot. Visitors only when asked (the second of
// the two galleries on the page, opts.visitors, or ?visitors). ?light=sky brings back the sky gallery.
const LIGHT = (location.search.match(/[?&]light=(warm|blue|pale|sky)/) || [])[1] || 'dawn';
const LOOKS = {
  dawn: {
    bg: '#050709', envBox: [0.3, 0.34, 0.42], env: [1, 1, 1], envSide: [0.86, 0.9, 1], envFloor: [0.84, 0.88, 0.94],
    paint: 'dawn', light: 0xf2f5fb, hemi: [0xf1f4fa, 0x8d98ad, 2.2], floor: 'dark', exposure: 1, spot: 0.6,
    gilt: ['#d6dce6', '#8c95a6'], rim: '214, 228, 255', top: '236, 242, 255', sig: [16, 26, 58], sigMix: 0.38,
    ink: '#141c2e', letter: '#f2f3ef', trim: '#0c1424', trimH: 0.02, ceil: '#05070b', dawn: true,
  },
  sky: {
    bg: '#0a1430', envBox: [0.3, 0.38, 0.58], env: [1, 1, 1], envSide: [0.86, 0.9, 1], envFloor: [0.84, 0.88, 0.94],
    paint: 'sky', light: 0xf2f6ff, hemi: [0xf1f5ff, 0x95a3c0, 2.4], floor: 'polished', stone: '#76839d', mirror: 0.55, exposure: 1, spot: 0.55,
    gilt: ['#d6dce6', '#8c95a6'], rim: '214, 228, 255', top: '236, 242, 255', sig: [16, 26, 58], sigMix: 0.38,
    ink: '#141d3a', letter: PAPER, trim: '#1a2442', trimH: 0.045, ceil: '#0b1430', sky: true,
  },
  pale: {
    bg: '#e9eef6', envBox: [0.86, 0.89, 0.94], env: [1, 1, 1], envSide: [0.92, 0.95, 1], envFloor: [0.8, 0.84, 0.9],
    paint: 'pale', light: 0xf2f6ff, hemi: [0xf1f5ff, 0x9aa7c2, 2.5], floor: 'pale', exposure: 1, spot: 0.45,
    gilt: ['#d6dce6', '#8c95a6'], rim: '246, 249, 255', top: '255, 255, 255', sig: [16, 26, 58], sigMix: 0.38,
    ink: '#141d3a', trim: '#c3cad7', ceil: '#eef2f8', fall: 'rgba(44, 58, 92, .16)', pale: true,
  },
  blue: {
    bg: '#060a16', envBox: [0.06, 0.05, 0.045], env: [0.84, 0.9, 1], envSide: [0.8, 0.86, 1], envFloor: [0.42, 0.52, 0.8],
    paint: 'cobalt', light: 0xe2ebff, hemi: [0x4a64ad, 0x05070f, 1.7], floor: 'stone', exposure: 1.25,
    gilt: ['#d6dce6', '#8c95a6'], rim: '188, 212, 255', top: '205, 222, 255', sig: [236, 243, 255], sigMix: 0.72,
    ink: PAPER, trim: '#0f0d0c', ceil: '#0e0c0b',
  },
  warm: {
    bg: '#0d0b0a', envBox: [0.06, 0.05, 0.045], env: [1, 0.84, 0.62], envSide: [1, 0.9, 0.75], envFloor: [0.9, 0.7, 0.48],
    paint: 'oxblood', light: 0xffcf98, hemi: [0x46506c, 0x0c0908, 1.7], floor: 'wood', exposure: 1.2,
    gilt: ['#d2ac5c', '#8b6a33'], rim: '255, 180, 120', top: '255, 200, 150', sig: [255, 244, 230], sigMix: 0.72,
    ink: PAPER, trim: '#0f0d0c', ceil: '#0e0c0b',
  },
};
const LOOK = LOOKS[LIGHT];
// a film or an edit is drawn as a still with its bars (js/corner-parts.js, still: an eighth of its height
// above and below); on a canvas it is shown without them, so the picture fills the canvas
export const BARS = (pc) => (pc.p?.art === 'film' || pc.p?.art === 'editing') && !pc.p.works?.[pc.i]?.image ? 0.128 : 0;
const WARM_LIGHT = LIGHT === 'warm';

export function createMuseum(host, opts) {
  // the pale gallery takes the page with it: the sky behind it is the art section's pale, and the
  // words and the nav over it are in dark ink (css/main.css, .cc-pale-room)
  document.documentElement.classList.toggle('cc-pale-room', !!LOOK.pale);
  host.classList.toggle('is-pale', !!LOOK.pale);
  // (the dawn gallery wears the sky's words and arrows: dark ink on its white foot)
  host.classList.toggle('is-sky', !!(LOOK.sky || LOOK.dawn));
  host.classList.toggle('is-dawn', !!LOOK.dawn);
  const room = opts.wide && !/[?&]museum=wall/.test(location.search) ? makeRoom(host, opts) : null;
  return room || makeWall(host, opts);
}

// ================================================================== the room (a laptop)

function makeRoom(host, { picks, art, open, sigOf, sigColour, hand, lenis, reduced, local, visitors, tag }) {
  const stage = el('div', 'cp-mu-stage');
  // which of the galleries on the page this is, said top right (the client chooses between them)
  if (tag) stage.append(el('p', 'cp-mu-tag', tag));
  const canvas = el('canvas', 'cp-mu-gl');
  canvas.setAttribute('aria-hidden', 'true');
  const hits = el('div', 'cp-mu-hits');
  const hint = el('p', 'cp-mu-hint', 'Scroll to walk along the wall');
  const arrow = (dir) => {
    const b = el('button', `cp-mu-step is-${dir}`);
    b.type = 'button';
    b.setAttribute('aria-label', dir === 'next' ? 'Walk on to the next piece' : 'Walk back to the last piece');
    b.innerHTML = '<svg viewBox="0 0 64 16" aria-hidden="true"><path d="M2 8h58M52 2l8 6-8 6"/></svg>';
    return b;
  };
  const prevB = arrow('prev'), nextB = arrow('next');
  stage.append(canvas, hits, prevB, nextB, hint);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { return null; }
  if (!renderer.getContext()) return null;
  host.classList.add('is-room');
  host.append(stage);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  // the room, the frames and the light; never the art (the sky and pale rooms in Neutral, which keeps
  // a white wall white and its blue blue, where ACES greys it)
  renderer.toneMapping = (LOOK.pale || LOOK.sky || LOOK.dawn) && THREE.NeutralToneMapping ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = LOOK.exposure;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;
  renderer.shadowMap.autoUpdate = false; // nothing that casts a shadow moves: they are drawn once
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // ---- the room, in metres: x along the wall, y up, z out from it towards you
  const H = 4.4, EYE = 1.72, HANG = 1.62, XL = -8, XR = 20;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(LOOK.bg);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 80);

  // what the gilt reflects: the room (dark, or the pale gallery's white) with the light fittings
  // above and the hall behind you, in the room's own light
  scene.environment = (() => {
    const s = new THREE.Scene();
    s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(...LOOK.envBox), side: THREE.BackSide })));
    const panel = (w, h, k, pos, col = LOOK.env) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(...col).multiplyScalar(k), side: THREE.DoubleSide }));
      m.position.set(...pos);
      m.lookAt(0, 0, 0);
      s.add(m);
    };
    for (let i = -3; i <= 3; i++) panel(0.32, 0.32, 26, [i * 2.2, 6.5, 1.5]);
    panel(18, 4, 0.32, [0, 1, 14]);
    panel(2, 9, 0.7, [-12, 2, 4], LOOK.envSide);
    panel(8, 1.4, 1.3, [0, -4.5, 9], LOOK.envFloor);
    const pm = new THREE.PMREMGenerator(renderer);
    const rt = pm.fromScene(s, 0.03);
    pm.dispose();
    s.traverse((o) => { o.geometry?.dispose(); o.material?.dispose(); });
    return rt.texture;
  })();

  // a wood floor, laid along the wall, waxed
  const floorTex = (() => {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 1024;
    const x = c.getContext('2d');
    const rows = 10, rh = c.height / rows;
    for (let r = 0; r < rows; r++) {
      let px = -((r * 377) % 600);
      while (px < c.width) {
        const len = 520 + ((r * 131 + px) % 380), t = 0.84 + 0.16 * Math.sin(r * 2.3 + px * 0.01);
        x.fillStyle = css(mix([50, 38, 30], [64, 49, 38], t - 0.84 > 0.08 ? 1 : 0.2).map((v) => Math.round(v * t)));
        x.fillRect(px, r * rh, len, rh);
        x.globalAlpha = 0.08;
        x.strokeStyle = '#000';
        for (let k = 0; k < 6; k++) { x.beginPath(); x.moveTo(px, r * rh + 8 + k * rh / 6.5); x.bezierCurveTo(px + len * 0.3, r * rh + 4 + k * rh / 6, px + len * 0.7, r * rh + 12 + k * rh / 7, px + len, r * rh + 8 + k * rh / 6.5); x.stroke(); }
        x.globalAlpha = 1;
        x.fillStyle = 'rgba(0,0,0,.55)';
        x.fillRect(px, r * rh, 2, rh);
        px += len;
      }
      x.fillStyle = 'rgba(0,0,0,.5)';
      x.fillRect(0, r * rh, c.width, 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set((XR - XL) / 3.2, 14 / 3.2);
    t.anisotropy = maxAniso;
    return t;
  })();

  // the paint, chosen for the gold and the art (?wall= to compare: pale, cobalt, umber, ink, oxblood,
  // green), with a plaster's slight unevenness drawn under it
  const PAINT = { pale: '#e3e9f5', cobalt: '#1f387c', umber: '#4a403a', ink: '#2e3a57', oxblood: '#5a2a26', green: '#2f4136' };
  const wallAsked = PAINT[new URLSearchParams(location.search).get('wall')];
  const paint = wallAsked || PAINT[LOOK.paint] || PAINT.cobalt;
  // (k, how strong the unevenness is: a pale wall shows it far more, so it takes half)
  const plasterOf = (k) => {
    const n = 512, c = document.createElement('canvas');
    c.width = c.height = n;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, n, n);
    let sd = 11;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) {
      const px = r() * n, py = r() * n, rad = 40 + r() * 140, g = x.createRadialGradient(px, py, 0, px, py, rad);
      const dark = r() < 0.5;
      g.addColorStop(0, dark ? `rgba(0,0,0,${0.05 * k})` : `rgba(255,255,255,${0.05 * k})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g;
      for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { x.save(); x.translate(ox, oy); x.fillRect(px - rad, py - rad, rad * 2, rad * 2); x.restore(); }
    }
    const img = x.getImageData(0, 0, n, n);
    for (let i = 0; i < img.data.length; i += 4) { const d = (r() - 0.5) * 14 * k; img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d; }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set((XR - XL) / 3.5, H / 3.5);
    return t;
  };
  const plaster = plasterOf(1);
  const wallPlaster = LOOK.pale ? plasterOf(0.45) : plaster;
  // the sky's wall: the page's own sky painted down it, its colours mixed from the corner's colour as
  // css/main.css mixes them (--cc-deep, --cc-dusk, --cc, --cc-lift, --cc-glow, --cc-haze,
  // --cc-mist): deep at the top, white at the foot; the plaster's unevenness is in the light on it
  const skyWall = () => {
    const cc = rgb(getComputedStyle(document.documentElement).getPropertyValue('--cc'));
    const cm = (a, p, b) => a.map((v, i) => Math.round(v * p + b[i] * (1 - p)));
    const deep = cm(cc, 0.3, rgb('#02040e'));
    const stops = [[0, deep], [0.18, cm(cc, 0.62, deep)], [0.36, cc], [0.55, cm(cc, 0.76, rgb('#7cc0ff'))], [0.72, cm(cc, 0.3, rgb('#d8ecff'))], [0.86, cm(cc, 0.05, rgb('#ffffff'))], [1, cm(cc, 0.09, rgb('#f2f6fc'))]];
    const c = document.createElement('canvas');
    c.width = 4; c.height = 512;
    const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, c.height);
    stops.forEach(([s, col]) => g.addColorStop(s, css(col)));
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  // the dawn gallery's wall: the site's own gradient (js/silk.js), night at the top, through ink
  // blue, before dawn and dawn, to mist and the site's paper white at the foot, laid so that from
  // where you stand the frame runs night to white; the plaster's unevenness is in the light on it
  const dawnWall = () => {
    const stops = [[0, '#050709'], [0.17, '#0c1424'], [0.35, '#26375a'], [0.54, '#7d90b2'], [0.71, '#cdd6e1'], [0.85, '#f2f3ef'], [1, '#eceeea']];
    const c = document.createElement('canvas');
    c.width = 4; c.height = 512;
    const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, c.height);
    stops.forEach(([s, col]) => g.addColorStop(s, col));
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const wallMat = LOOK.dawn && !wallAsked
    ? new THREE.MeshStandardMaterial({ map: dawnWall(), bumpMap: plaster, bumpScale: 1.4, roughness: 0.96, envMapIntensity: 0.04 })
    : LOOK.sky && !wallAsked
    ? new THREE.MeshStandardMaterial({ map: skyWall(), bumpMap: plaster, bumpScale: 1.2, roughness: 0.95, envMapIntensity: 0.05 })
    : new THREE.MeshStandardMaterial({ color: new THREE.Color(paint), map: wallPlaster, roughness: 0.95, envMapIntensity: 0.05 });
  // the floor: waxed wood in the warm room, a dark polished stone in the blue one, a pale honed
  // stone in the pale one. In the sky gallery, polished blue-grey stone in large slabs that holds a
  // soft reflection of the wall and the work on it, as a gallery's polished floor does: the room is
  // drawn again from a camera mirrored in the floor, and the floor shows that picture softened
  // (more so further from the wall), faint looking down and stronger at a glance along it.
  const slabs = (() => {
    const n = 512, c = document.createElement('canvas');
    c.width = c.height = n;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, n, n);
    let sd = 23;
    const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    // the stone's own clouding, a slab at a time
    for (let k = 0; k < 4; k++) {
      const ox = (k % 2) * n / 2, oy = Math.floor(k / 2) * n / 2, tone = (r() - 0.5) * 0.06;
      x.fillStyle = tone > 0 ? `rgba(255,255,255,${tone})` : `rgba(0,0,0,${-tone})`;
      x.fillRect(ox, oy, n / 2, n / 2);
      for (let i = 0; i < 14; i++) {
        const px = ox + r() * n / 2, py = oy + r() * n / 2, rad = 20 + r() * 70, g = x.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, r() < 0.5 ? 'rgba(0,0,0,.035)' : 'rgba(255,255,255,.035)');
        g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g;
        x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      }
    }
    // the joints between the slabs
    x.fillStyle = 'rgba(20, 30, 52, .11)';
    [0, n / 2].forEach((p) => { x.fillRect(p, 0, 2, n); x.fillRect(0, p, n, 2); });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set((XR - XL) / 3.2, 14 / 3.2); // slabs 1.6 m square
    t.anisotropy = maxAniso;
    return t;
  })();
  let mirror = null;
  function polished() {
    const rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType });
    const U = { tMirror: { value: rt.texture }, uMirrorMatrix: { value: new THREE.Matrix4() }, uMirrorTexel: { value: new THREE.Vector2(0.5, 0.5) }, uMirrorK: { value: LOOK.mirror } };
    const m = new THREE.MeshStandardMaterial({ map: slabs, color: new THREE.Color(LOOK.stone), roughness: 0.4, envMapIntensity: 0.3 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = `varying vec3 vMirrorW;\n${sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n  vMirrorW = (modelMatrix * vec4(transformed, 1.0)).xyz;')}`;
      sh.fragmentShader = `uniform sampler2D tMirror;\nuniform mat4 uMirrorMatrix;\nuniform vec2 uMirrorTexel;\nuniform float uMirrorK;\nvarying vec3 vMirrorW;\n${sh.fragmentShader.replace('#include <opaque_fragment>', `{
    vec4 mp = uMirrorMatrix * vec4(vMirrorW, 1.0);
    vec2 muv = mp.xy / mp.w;
    float spread = 0.8 + 1.6 * clamp(vMirrorW.z / 4.5, 0.0, 1.0);
    vec3 r = vec3(0.0);
    for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) r += texture2D(tMirror, muv + vec2(float(i) * 0.6, float(j) * 1.5) * uMirrorTexel * spread).rgb; // (stretched down the floor, as a gloss does)
    r /= 25.0;
    float fres = pow(1.0 - clamp(normalize(cameraPosition - vMirrorW).y, 0.0, 1.0), 3.0);
    outgoingLight = mix(outgoingLight, r * 0.92, uMirrorK * (0.3 + 0.7 * fres));
  }
  #include <opaque_fragment>`)}`;
    };
    mirror = { rt, U, cam: new THREE.PerspectiveCamera(), at: new THREE.Vector3() };
    return m;
  }
  const floorMat = LOOK.floor === 'dark' ? new THREE.MeshStandardMaterial({ color: new THREE.Color('#07090f'), roughness: 0.7, envMapIntensity: 0.15 })
    : LOOK.floor === 'wood'
    ? new THREE.MeshStandardMaterial({ map: floorTex, color: new THREE.Color(2.2, 2.2, 2.2), roughness: 0.4, envMapIntensity: 0.45 })
    : LOOK.floor === 'polished' ? polished()
      : new THREE.MeshStandardMaterial({ map: plaster, color: new THREE.Color(LOOK.floor === 'pale' ? '#c3cad7' : '#1c2438'), roughness: LOOK.floor === 'pale' ? 0.34 : 0.26, envMapIntensity: LOOK.floor === 'pale' ? 0.55 : 0.8 });
  const ceilMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(LOOK.ceil), roughness: 1, envMapIntensity: 0 });
  const darkMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0f0d0c'), roughness: 0.55, envMapIntensity: 0.3 });
  const trimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(LOOK.trim), roughness: 0.6, envMapIntensity: 0.2 }); // the skirting
  const plane = (w, h, mat) => new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  const box = (w, h, d, mat) => new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  const add = (m, x, y, z, ry = 0, rx = 0) => { m.position.set(x, y, z); m.rotation.set(rx, ry, 0); scene.add(m); return m; };
  const LEN = XR - XL, MID = (XL + XR) / 2;
  add(plane(LEN, H, wallMat), MID, H / 2, 0).receiveShadow = true;
  const floorMesh = add(plane(LEN, 14, floorMat), MID, 0, 7, 0, -Math.PI / 2);
  floorMesh.receiveShadow = true;
  add(plane(LEN, 14, ceilMat), MID, H, 7, 0, Math.PI / 2);
  add(plane(14, H, wallMat), XL, H / 2, 7, Math.PI / 2);
  add(plane(14, H, wallMat), XR, H / 2, 7, -Math.PI / 2);
  add(box(LEN, LOOK.trimH || 0.12, 0.02, trimMat), MID, (LOOK.trimH || 0.12) / 2, 0.01); // the skirting (in the sky gallery a slim dark shadow gap)
  add(box(LEN, 0.04, 0.04, darkMat), MID, H - 0.06, 1.3);
  // the room's own light, cool, so the shadows go cool and the lit pools warm
  scene.add(new THREE.HemisphereLight(...LOOK.hemi));

  // a soft shadow, the one a hung frame casts under a light from above
  const shadowTex = (() => {
    const n = 128, c = document.createElement('canvas');
    c.width = c.height = n;
    const x = c.getContext('2d'), img = x.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
      const dx = Math.max(0, Math.abs(xx + 0.5 - n / 2) - n * 0.3), dy = Math.max(0, Math.abs(y + 0.5 - n / 2) - n * 0.3);
      const a = 1 - smooth(0, n * 0.19, Math.hypot(dx, dy)), i = (y * n + xx) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = Math.round(a * 255); img.data[i + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    return new THREE.CanvasTexture(c);
  })();

  // ---- frames
  // a ring: a rectangle with a rectangular opening, its edges rounded over (a moulding)
  function ring(W, Hh, Iw, Ih, depth, bev, mat) {
    const s = new THREE.Shape();
    const ow = W / 2 - bev, oh = Hh / 2 - bev, iw = Iw / 2 + bev, ih = Ih / 2 + bev;
    s.moveTo(-ow, -oh); s.lineTo(ow, -oh); s.lineTo(ow, oh); s.lineTo(-ow, oh); s.closePath();
    const hole = new THREE.Path();
    hole.moveTo(-iw, -ih); hole.lineTo(-iw, ih); hole.lineTo(iw, ih); hole.lineTo(iw, -ih); hole.closePath();
    s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: Math.max(0.001, depth - 2 * bev), bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 1 });
    g.translate(0, 0, bev);
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    return m;
  }
  // gilt: warm gold with a carved, worn surface (a bumped finish drawn once)
  const carve = (() => {
    const n = 256, c = document.createElement('canvas');
    c.width = c.height = n;
    const x = c.getContext('2d'), h = new Float32Array(n * n);
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let k = 0; k < 900; k++) {
      const cx = r() * n, cy = r() * n, rad = 2 + r() * 7, a = (r() - 0.4) * 0.9;
      for (let y = -rad; y <= rad; y++) for (let xx = -rad; xx <= rad; xx++) {
        const d = Math.hypot(xx, y) / rad;
        if (d > 1) continue;
        const px = ((Math.round(cx + xx) % n) + n) % n, py = ((Math.round(cy + y) % n) + n) % n;
        h[py * n + px] += a * (1 - d * d);
      }
    }
    const img = x.createImageData(n, n);
    for (let y = 0; y < n; y++) for (let xx = 0; xx < n; xx++) {
      const i = y * n + xx, dx = h[y * n + ((xx + 1) % n)] - h[y * n + ((xx - 1 + n) % n)], dy = h[((y + 1) % n) * n + xx] - h[((y - 1 + n) % n) * n + xx];
      const v = new THREE.Vector3(-dx * 2.2, -dy * 2.2, 1).normalize();
      img.data[i * 4] = (v.x * 0.5 + 0.5) * 255; img.data[i * 4 + 1] = (v.y * 0.5 + 0.5) * 255; img.data[i * 4 + 2] = (v.z * 0.5 + 0.5) * 255; img.data[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(9, 9);
    return t;
  })();
  const gold = new THREE.MeshStandardMaterial({ color: new THREE.Color(LOOK.gilt[0]), metalness: 1, roughness: 0.24, normalMap: carve, normalScale: new THREE.Vector2(0.55, 0.55), envMapIntensity: 1.45 });
  const goldDeep = new THREE.MeshStandardMaterial({ color: new THREE.Color(LOOK.gilt[1]), metalness: 1, roughness: 0.48, normalMap: carve, normalScale: new THREE.Vector2(0.8, 0.8), envMapIntensity: 0.9 });
  const ebony = new THREE.MeshStandardMaterial({ color: new THREE.Color('#14110f'), roughness: 0.5, envMapIntensity: 0.6 });
  const matBoard = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ecebe6'), roughness: 0.92, envMapIntensity: 0.1 });

  // a gilt frame round a w × h opening: a deep back, a rolled outer moulding, a bead, a liner
  function gilt(g, w, h) {
    const W = (k) => w + 2 * k, Hh = (k) => h + 2 * k;
    g.add(ring(W(0.17), Hh(0.17), w, h, 0.035, 0.008, goldDeep));
    g.add(ring(W(0.17), Hh(0.17), W(0.115), Hh(0.115), 0.06, 0.024, gold));
    g.add(ring(W(0.1), Hh(0.1), W(0.075), Hh(0.075), 0.072, 0.0125, gold));
    g.add(ring(W(0.05), Hh(0.05), w, h, 0.045, 0.012, gold));
    return { depth: 0.022, edge: 0.17 };
  }
  // a plain dark frame on a white mat, as works on paper are hung
  function matted(g, w, h) {
    const m = 0.075, f = 0.028;
    const board = plane(w + 2 * m, h + 2 * m, matBoard);
    board.position.z = 0.012;
    g.add(board);
    g.add(ring(w + 2 * (m + f), h + 2 * (m + f), w + 2 * m, h + 2 * m, 0.038, 0.006, ebony));
    return { depth: 0.014, edge: m + f };
  }

  // a stretched canvas, no frame (the night gallery, 11 Nov: the client did not want the frames):
  // a shallow box standing off the wall, its picture on the face, and the picture's own edge
  // wrapped round its sides as a gallery-wrapped canvas is, so it reads as a real thing on the wall.
  // The face is the picture exactly (unlit); the sides take the room's light, so they shade.
  const canvasBack = new THREE.MeshStandardMaterial({ color: new THREE.Color('#0c0e12'), roughness: 0.9 });
  function stretched(g, w, h, d) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const uv = geo.attributes.uv, E = 0.018;
    // the faces, in order: right, left, top, bottom, front, back (four corners each)
    const remap = (face, fn) => { for (let i = face * 4; i < face * 4 + 4; i++) { const [u, v] = fn(uv.getX(i), uv.getY(i)); uv.setXY(i, u, v); } };
    remap(0, (u, v) => [1 - E + u * E, v]);
    remap(1, (u, v) => [u * E, v]);
    remap(2, (u, v) => [u, 1 - E + v * E]);
    remap(3, (u, v) => [u, v * E]);
    uv.needsUpdate = true;
    const face = new THREE.MeshBasicMaterial({ color: 0x1b1814, toneMapped: false });
    const side = new THREE.MeshStandardMaterial({ color: new THREE.Color(0.62, 0.62, 0.64), roughness: 0.92, envMapIntensity: 0.1 });
    const m = new THREE.Mesh(geo, [side, side, side, side, face, canvasBack]);
    m.position.z = d / 2 + 0.006; // a hair off the wall, on its hanging
    m.castShadow = true;
    g.add(m);
    // and a glass face over it, the size of the picture, as a face-mounted print has: its polished
    // edges catch the light, and a soft reflection of the room slides across it as you walk
    const gl = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.006), [glassEdge, glassEdge, glassEdge, glassEdge, glassFace, glassEdge]);
    gl.position.z = d / 2 + 0.0035;
    gl.renderOrder = 3;
    m.add(gl);
    return { mesh: m, face, side, depth: d / 2 + 0.006, edge: 0 };
  }
  // the glass: nothing of its own colour, only what it reflects, added over the picture
  const glassFace = new THREE.ShaderMaterial({
    vertexShader: 'varying vec2 vUv; varying vec3 vW; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: `varying vec2 vUv; varying vec3 vW;
      void main() {
        vec3 V = normalize(cameraPosition - vW);
        vec3 R = reflect(-V, vec3(0.0, 0.0, 1.0));
        // a broad soft streak and a fine one, across the glass, where the lights above are reflected
        float t = vUv.x * 0.62 + (1.0 - vUv.y) * 0.48 - R.x * 0.9;
        float streak = exp(-pow((t - 0.5) / 0.11, 2.0)) * 0.085 + exp(-pow((t - 0.74) / 0.018, 2.0)) * 0.05;
        // the top of the glass holds a little more of the light above it, and the glass brightens at a glance
        float top = smoothstep(0.55, 1.0, vUv.y) * 0.035;
        float fres = pow(1.0 - clamp(V.z, 0.0, 1.0), 3.0) * 0.22;
        gl_FragColor = vec4(vec3(0.88, 0.92, 1.0) * (streak + top + fres), 1.0);
      }`,
    blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, toneMapped: false,
  });
  const glassEdge = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.6, 0.68), transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });

  // ---- labels: words drawn on the wall, as vinyl lettering is
  const LH = 300; // a label's canvas height, on 1024 across
  const FONT = { sans: '"Inter Tight", system-ui, sans-serif', disp: '"Cormorant", Georgia, serif' };
  function fitText(x, text, w) {
    let s = 104;
    while (x.measureText(text).width > w && s > 40) { s -= 4; x.font = `italic 600 ${s}px ${FONT.disp}`; }
  }
  function labelTex(lines, tex) {
    const c = tex?.image || document.createElement('canvas');
    c.width = 1024; c.height = LH;
    const x = c.getContext('2d');
    x.clearRect(0, 0, c.width, c.height);
    x.fillStyle = LOOK.ink;
    let y = 58;
    lines.forEach(([kind, text]) => {
      if (!text) return;
      if (kind === 'small') { x.font = `600 52px ${FONT.sans}`; x.globalAlpha = 0.7; x.fillText(text, 0, y); y += 110; }
      else if (kind === 'title') { x.font = `italic 600 104px ${FONT.disp}`; x.globalAlpha = 1; fitText(x, text, 1010); x.fillText(text, 0, y); y += 78; }
      else { x.font = `400 56px ${FONT.sans}`; x.globalAlpha = 0.84; x.fillText(text, 0, y); y += 66; }
    });
    x.globalAlpha = 1;
    const t = tex || new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    t.needsUpdate = true;
    return t;
  }
  const flat = (t, opacity = 1) => new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity, toneMapped: false, depthWrite: false });

  // the maker's signature, revealed left to right as if written: the Easter egg
  function sigTex(p) {
    const s = sigOf(p, 40), c = document.createElement('canvas');
    const k = 2, w = Math.ceil((s.width + 60) * k), h = Math.ceil(40 * 3.6 * k);
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.scale(k, k);
    x.translate(24, 40 * 2.3);
    x.strokeStyle = css(mix(rgb(sigColour(p)), LOOK.sig, LOOK.sigMix));
    x.lineWidth = 3.4;
    x.lineCap = 'round';
    x.lineJoin = 'round';
    s.runs.forEach(({ g, dx }) => {
      x.save();
      x.translate(dx, 0);
      x.stroke(new Path2D(g.d));
      g.lifts.forEach((d) => x.stroke(new Path2D(d)));
      x.restore();
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.NoColorSpace;
    return { t, aspect: w / h };
  }
  const sigMat = (t) => new THREE.ShaderMaterial({
    uniforms: { map: { value: t }, uReveal: { value: 0 }, uAlpha: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform sampler2D map; uniform float uReveal, uAlpha; varying vec2 vUv; void main() { vec4 c = texture2D(map, vUv); float m = 1.0 - smoothstep(uReveal - 0.05, uReveal, vUv.x); gl_FragColor = vec4(c.rgb, c.a * m * uAlpha); }',
    transparent: true, depthWrite: false, toneMapped: false,
  });

  // a light on the track above, aimed at what it lights, with its fitting
  function spotAt(x, y, k, angle) {
    // (the night gallery's lights are narrower: a pool round the work, not the wall lit)
    const s = new THREE.SpotLight(LOOK.light, 0, 0, LOOK.dawn ? angle * 0.78 + 0.06 : angle + 0.12, LOOK.dawn ? 0.8 : 0.95, 1.2);
    s.position.set(x, H - 0.12, 1.3);
    s.target.position.set(x, y - 0.06, 0);
    s.castShadow = true;
    s.shadow.mapSize.set(1024, 1024);
    s.shadow.camera.near = 0.5;
    s.shadow.camera.far = 7;
    s.shadow.bias = -0.0005;
    s.shadow.radius = 7;
    s.shadow.blurSamples = 14;
    scene.add(s, s.target);
    const can = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.062, 0.18, 18), darkMat);
    can.position.set(x, H - 0.17, 1.3);
    can.lookAt(s.target.position);
    can.rotateX(Math.PI / 2);
    scene.add(can);
    s.userData.base = k * 1.5 * (LOOK.spot || 1); // (on a pale wall a pool needs far less to show)
    return s;
  }

  // ---- hanging the picks along the wall
  const loader = new THREE.TextureLoader();
  const pieces = [];
  function hang(k, x, y, long, { framed = 'gilt', light = true, label = true } = {}) {
    // (on a canvas a film still is shown without its bars: the picture fills the canvas)
    const bars = LOOK.dawn ? BARS(k.pc) : 0;
    const r = (k.pc.ratio || 1) / (1 - 2 * bars), w = r >= 1 ? long : long * r, h = r >= 1 ? long / r : long;
    const g = new THREE.Group();
    g.position.set(x, y, 0);
    scene.add(g);
    // in the night gallery a stretched canvas; before it, a frame
    const C = LOOK.dawn ? stretched(g, w, h, long > 1 ? 0.045 : 0.032) : null;
    const F = C || (framed === 'gilt' ? gilt(g, w, h) : matted(g, w, h));
    const shPad = C ? 0.26 : 0.42;
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(w + 2 * F.edge + shPad, h + 2 * F.edge + shPad), new THREE.MeshBasicMaterial({ color: LOOK.pale ? 0x1a2440 : 0x000000, alphaMap: shadowTex, transparent: true, opacity: C ? 0.6 : LOOK.pale ? 0.26 : 0.34, depthWrite: false }));
    sh.position.set(C ? 0.015 : 0, C ? -0.05 : -0.04, 0.002);
    g.add(sh);
    let artMat, artMesh;
    if (C) { artMat = C.face; artMesh = C.mesh; }
    else {
      artMat = new THREE.MeshBasicMaterial({ color: 0x1b1814, toneMapped: false });
      artMesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), artMat);
      artMesh.position.z = F.depth;
      g.add(artMesh);
    }
    const P = { k, x, y, w, h, edge: F.edge, g, artMesh, artMat, spot: light ? spotAt(x, y, 30 * (long / 1.6) ** 0.7, 0.3 + 0.07 * long) : null, hot: 0, heat: 0, sig: null, label: null };
    if (label) {
      const t = labelTex(k.lines);
      const lw = 0.8, lh = lw * (LH / 1024);
      const lab = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), flat(t));
      lab.position.set(w / 2 + F.edge + 0.3 + lw / 2, -h / 2 - F.edge + lh / 2, 0.003);
      g.add(lab);
      P.label = lab;
      P.labelT = t;
      const st = sigTex(k.pc.p), sw = 0.42;
      const sig = new THREE.Mesh(new THREE.PlaneGeometry(sw, sw / st.aspect), sigMat(st.t));
      sig.position.set(lab.position.x - lw / 2 + sw / 2 - 0.03, lab.position.y - lh / 2 - sw / st.aspect / 2 + 0.01, 0.003);
      g.add(sig);
      P.sig = sig;
    }
    // the picture, drawn large, unlit: exactly the picture
    art(k.pc, Math.round(clamp(long * 760, 600, 1700))).then((url) => {
      loader.load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = maxAniso;
        if (bars) { t.repeat.set(1, 1 - 2 * bars); t.offset.set(0, bars); }
        artMat.map = t;
        artMat.color.set(0xffffff);
        artMat.needsUpdate = true;
        // the canvas's sides: the picture's edge, wrapped round, in the room's light
        if (C) { C.side.map = t; C.side.color.setRGB(0.9, 0.9, 0.92); C.side.needsUpdate = true; renderer.shadowMap.needsUpdate = true; }
        if (P.img) P.img.src = url;
        dirty = true;
      });
    });
    // the button that stands for it on the page: hover, focus and the click
    const b = el('button', 'cp-mu-hit'), img = el('img');
    b.type = 'button';
    b.setAttribute('aria-label', `${k.honour ? `${k.honour}: ` : ''}${k.title} by ${k.maker}`);
    img.alt = '';
    b.append(img);
    hits.append(b);
    P.b = b;
    P.img = img;
    pieces.push(P);
    return P;
  }

  const [day, week, month, ...before] = picks;
  // (a little smaller in the night gallery, where you stand close)
  const P_day = hang(day, 0, HANG + 0.04, LOOK.dawn ? 1.72 : 2.15);
  const P_week = hang(week, 4.2, HANG, LOOK.dawn ? 1.42 : 1.6);
  const P_month = hang(month, 8.3, HANG, LOOK.dawn ? 1.42 : 1.6);
  // the six days before, close together, one light and one label for them all
  const GX = 12.7, cell = 0.6, gapC = 0.3;
  const group = before.map((k, i) => {
    const c = i % 3, r = Math.floor(i / 3);
    return hang(k, GX + (c - 1) * (cell + gapC), HANG + (0.5 - r) * (cell + gapC + 0.02), cell, { framed: 'mat', light: false, label: false });
  });
  const groupSpot = spotAt(GX, HANG, 26, 0.56);
  const groupLines = [['small', 'The days before'], ['title', ''], ['maker', '']];
  const groupLabelT = labelTex(groupLines);
  const glw = 0.8, glh = glw * (LH / 1024);
  add(new THREE.Mesh(new THREE.PlaneGeometry(glw, glh), flat(groupLabelT)), GX + 1.5 * cell + gapC + 0.42 + glw / 2, HANG - cell - gapC / 2 - 0.05 + glh / 2, 0.004);

  // the show's name, lettered on the wall above the art of the day
  const T = titleShape(hand);
  {
    const c = document.createElement('canvas'), k = 2048 / T.box.w;
    c.width = 2048; c.height = Math.ceil(T.box.h * k);
    const x = c.getContext('2d');
    x.scale(k, k);
    x.translate(-T.box.x, -T.box.y);
    x.fillStyle = LOOK.letter || LOOK.ink;
    x.fill(new Path2D(T.fill));
    x.strokeStyle = LOOK.letter || LOOK.ink; x.lineWidth = T.lift; x.lineCap = 'round';
    T.lifts.forEach((d) => x.stroke(new Path2D(d)));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = maxAniso;
    const tw = LOOK.dawn ? 2.0 : 3.0, th = tw * (c.height / c.width), top = P_day.y + P_day.h / 2 + P_day.edge;
    add(new THREE.Mesh(new THREE.PlaneGeometry(tw, th), flat(t, 0.92)), 0, Math.min(H - 0.3 - th / 2, top + (LOOK.dawn ? 0.16 : 0.3) + th / 2), 0.004);
  }


  // ---- the walk: where you stand at each piece, and what you look at
  // in the night gallery you stand close and look straight at the wall: no floor, no ceiling, only
  // the wall and the work
  const STOPS = LOOK.dawn ? [
    { x: 0.1, z: 4.5, ly: HANG + 0.34 },
    { x: P_week.x + 0.1, z: 3.6, ly: HANG + 0.04 },
    { x: P_month.x + 0.1, z: 3.6, ly: HANG + 0.04 },
    { x: GX + 0.3, z: 3.4, ly: HANG + 0.02 },
  ] : [
    { x: 0.32, z: 7.3, ly: HANG + 0.4 - (LOOK.sky ? 0.14 : 0) }, // (in the sky gallery the view leans down a little, to take in the floor)
    { x: P_week.x + 0.3, z: 5.4, ly: HANG + 0.08 - (LOOK.sky ? 0.16 : 0) },
    { x: P_month.x + 0.3, z: 5.4, ly: HANG + 0.08 - (LOOK.sky ? 0.16 : 0) },
    { x: GX + 0.42, z: 5.0, ly: HANG + 0.04 - (LOOK.sky ? 0.16 : 0) },
  ];
  // ---- people in the gallery, out of focus and close to you: at each piece one stands to your
  // left (away from its label), and between the pieces you pass others
  const PEOPLE = [
    { at: 0, side: -1, kind: 'coat', h: 1.7, d: 1.3 },
    { at: 0.5, side: 0.14, kind: 'long', h: 1.64, d: 1.8 },
    { at: 1, side: -1, kind: 'bun', h: 1.62, d: 1.2 },
    { at: 1.5, side: -0.2, kind: 'pockets', h: 1.74, d: 1.75 },
    { at: 2, side: -1, kind: 'long', h: 1.66, d: 1.25 },
    { at: 2.5, side: 0.22, kind: 'coat', h: 1.78, d: 1.85 },
    { at: 3, side: -1, kind: 'pockets', h: 1.72, d: 1.2 },
  ];
  const drawnPeople = new Map();
  // (not in the night gallery, where nothing stands between you and the work; ?visitors brings them)
  const withPeople = !LOOK.dawn || visitors || /[?&]visitors\b/.test(location.search);
  (withPeople ? PEOPLE : []).forEach((p, i) => {
    const n = STOPS.length - 1, a = Math.min(n - 1, Math.floor(p.at)), f = p.at - a, A = STOPS[a], B = STOPS[a + 1];
    const cx = A.x + (B.x - A.x) * f, cz = A.z + (B.z - A.z) * f;
    if (!drawnPeople.has(p.kind)) {
      const t = new THREE.CanvasTexture(person(p.kind, 30, 360, 800, LOOK));
      t.colorSpace = THREE.SRGBColorSpace;
      drawnPeople.set(p.kind, t);
    }
    // the picture has a little room above the head and below the feet
    const ph = p.h / PERSON_H, pw = ph * (360 / 800);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ map: drawnPeople.get(p.kind), transparent: true, depthWrite: false, toneMapped: false }));
    m.position.set(cx + p.side * 0.56 * p.d, ph / 2 - ph * (1 - PERSON_TOP - PERSON_H * 0.995), cz - p.d);
    if (i % 2) m.scale.x = -1;
    m.renderOrder = 2;
    scene.add(m);
  });
  const whereOf = new Map([[P_day, 0], [P_week, 1], [P_month, 2], ...group.map((P) => [P, 3])]);
  const WALK = 0.86; // the share of the scroll that is the walk; the rest is the way out
  const N = STOPS.length - 1;
  let top = 0, span = 1, vw = 1, vh = 1;
  function layout() {
    vw = stage.clientWidth || innerWidth;
    vh = stage.clientHeight || innerHeight;
    renderer.setSize(vw, vh, false);
    // the reflection is drawn at a quarter of the size: it is soft anyway, and the smaller picture
    // softens it without the steps a wide blur would leave
    if (mirror) {
      const pr = renderer.getPixelRatio(), w = Math.max(2, Math.round(vw * pr * 0.25)), h = Math.max(2, Math.round(vh * pr * 0.25));
      mirror.rt.setSize(w, h);
      mirror.U.uMirrorTexel.value.set(1 / w, 1 / h);
    }
    camera.aspect = vw / vh;
    camera.fov = vw / vh > 1.5 ? 40 : 48;
    camera.updateProjectionMatrix();
    top = host.getBoundingClientRect().top + scrollY;
    span = Math.max(1, host.offsetHeight - vh);
    dirty = true;
  }
  const progress = () => clamp((scrollY - top) / span, 0, 1);
  const stopY = (i) => top + (i / N) * WALK * span;
  const atStop = () => (clamp(progress() / WALK, 0, 1) * N);
  const walkTo = (i) => lenis.scrollTo(stopY(clamp(i, 0, N)), { duration: reduced ? 0 : 1.3 });
  prevB.addEventListener('click', () => walkTo(Math.ceil(atStop() - 0.02) - 1));
  nextB.addEventListener('click', () => walkTo(Math.floor(atStop() + 0.02) + 1));

  // ---- the head: it turns towards the cursor
  const look = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => { look.tx = (e.clientX / innerWidth - 0.5) * 2; look.ty = (e.clientY / innerHeight - 0.5) * 2; };
  if (!reduced) addEventListener('pointermove', onMove, { passive: true });

  // ---- reaching for a piece: its light comes up, its maker signs; click and you walk to it
  let groupHot = null, groupTimer = 0;
  function setGroupLabel(P) {
    labelTex(P ? [['small', P.k.when], ['title', P.k.title], ['maker', P.k.maker]] : groupLines, groupLabelT);
    dirty = true;
  }
  pieces.forEach((P) => {
    const inGroup = group.includes(P);
    const on = () => {
      P.hot = 1;
      if (inGroup) { clearTimeout(groupTimer); groupHot = P; setGroupLabel(P); }
      if (P.sig) { gsap.killTweensOf(P.sig.material.uniforms.uReveal); P.sig.material.uniforms.uAlpha.value = 1; gsap.fromTo(P.sig.material.uniforms.uReveal, { value: 0 }, { value: 1.05, duration: reduced ? 0 : 1.1, ease: 'power1.inOut', onUpdate: () => { dirty = true; } }); }
      dirty = true;
    };
    const off = () => {
      P.hot = 0;
      if (inGroup) groupTimer = setTimeout(() => { if (groupHot === P) { groupHot = null; setGroupLabel(null); } }, 700);
      if (P.sig) gsap.to(P.sig.material.uniforms.uAlpha, { value: 0, duration: 0.5, onUpdate: () => { dirty = true; } });
    };
    P.b.addEventListener('pointerenter', on);
    P.b.addEventListener('pointerleave', off);
    P.b.addEventListener('focus', () => { on(); const i = whereOf.get(P); if (Math.abs(atStop() - i) > 0.05) walkTo(i); });
    P.b.addEventListener('blur', off);
    P.b.addEventListener('click', () => {
      const i = whereOf.get(P), far = Math.abs(atStop() - i) > 0.08;
      const go = () => open(P.k.pc, { art: P.b, img: P.img, b: P.b });
      if (far && !reduced) lenis.scrollTo(stopY(i), { duration: 1.2, onComplete: () => setTimeout(go, 60) });
      else go();
    });
  });
  // the arrow keys walk on, or back, while the wall is on the screen
  const onKey = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    if (document.documentElement.classList.contains('cc-open')) return;
    const p = progress(), r = host.getBoundingClientRect();
    if (r.top > 1 || p >= WALK + 0.04) return;
    e.preventDefault();
    if (e.key === 'ArrowRight') nextB.click(); else prevB.click();
  };
  addEventListener('keydown', onKey);

  // ---- each frame
  const tmp = new THREE.Vector3(), corners = [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]];
  let dirty = true, lastP = -1, alive = true, hinted = false, lastOp = -1, wasInside = false, ends = '';
  function frame(_, dms) {
    if (!alive) return;
    const r = host.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) return;
    const dt = Math.min(0.05, (dms || 16) / 1000);
    const p = progress();
    if (p !== lastP) { dirty = true; if (!hinted && p > 0.01) { hinted = true; hint.classList.add('is-done'); } }
    lastP = p;
    if (Math.abs(look.tx - look.x) + Math.abs(look.ty - look.y) > 0.0005) {
      look.x += (look.tx - look.x) * Math.min(1, dt * 3.2);
      look.y += (look.ty - look.y) * Math.min(1, dt * 3.2);
      dirty = true;
    }
    pieces.forEach((P) => {
      const h = P.heat + (P.hot - P.heat) * Math.min(1, dt * 6);
      if (Math.abs(h - P.heat) > 0.001 || !P.lit) { P.heat = h; P.lit = true; dirty = true; }
      if (P.spot) P.spot.intensity = P.spot.userData.base * (1 + 0.45 * P.heat);
    });
    groupSpot.intensity = groupSpot.userData.base * (1 + 0.3 * group.reduce((m, P) => Math.max(m, P.heat), 0));
    // the way out: the room gives way to the sky
    const op = 1 - smooth(WALK + 0.02, 1, p);
    if (Math.abs(op - lastOp) > 0.002) { lastOp = op; stage.style.opacity = op.toFixed(3); stage.style.visibility = op < 0.01 ? 'hidden' : ''; }
    const inside = r.top <= 1 && op > 0.5;
    if (inside !== wasInside) { wasInside = inside; document.documentElement.classList.toggle('cc-in-room', inside); }
    // the arrows, at the ends of the wall
    const s = clamp(p / WALK, 0, 1) * N, e2 = `${s < 0.04 ? 'start' : ''}${s > N - 0.04 ? 'end' : ''}`;
    if (e2 !== ends) { ends = e2; prevB.classList.toggle('is-off', s < 0.04); nextB.classList.toggle('is-off', s > N - 0.04); }
    if (!dirty) return;
    dirty = false;
    // where you stand, and where you look: dwelling at each piece, leaning into the walk between
    const i = Math.min(N - 1, Math.floor(s)), f = smooth(0.14, 0.86, s - i), A = STOPS[i], B = STOPS[i + 1];
    const cx = A.x + (B.x - A.x) * f, cz = A.z + (B.z - A.z) * f, ly = A.ly + (B.ly - A.ly) * f;
    camera.position.set(cx, EYE, cz);
    tmp.set(cx, ly, 0);
    camera.lookAt(tmp);
    camera.rotateY(-look.x * 0.12 - Math.sin(Math.PI * f) * 0.06);
    camera.rotateX(-look.y * 0.05);
    camera.updateMatrixWorld();
    // the floor's reflection first: the room from the camera mirrored in the floor
    if (mirror) {
      const M = mirror, c = M.cam;
      M.at.set(0, 0, -1).applyQuaternion(camera.quaternion).add(camera.position);
      c.position.set(camera.position.x, -camera.position.y, camera.position.z);
      c.up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      c.up.y *= -1;
      c.lookAt(M.at.x, -M.at.y, M.at.z);
      c.projectionMatrix.copy(camera.projectionMatrix);
      c.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
      c.updateMatrixWorld();
      M.U.uMirrorMatrix.value.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1).multiply(c.projectionMatrix).multiply(c.matrixWorldInverse);
      floorMesh.visible = false;
      renderer.setRenderTarget(M.rt);
      renderer.render(scene, c);
      renderer.setRenderTarget(null);
      floorMesh.visible = true;
    }
    renderer.render(scene, camera);
    // the buttons over the pieces, where they now are on the screen
    pieces.forEach((P) => {
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity, behind = false;
      corners.forEach(([u, v]) => {
        tmp.set(u * P.w, v * P.h, 0).applyMatrix4(P.artMesh.matrixWorld).project(camera);
        if (tmp.z > 1) behind = true;
        const sx = (tmp.x * 0.5 + 0.5) * vw, sy = (-tmp.y * 0.5 + 0.5) * vh;
        x0 = Math.min(x0, sx); x1 = Math.max(x1, sx); y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
      });
      const show = !behind && x1 > 0 && x0 < vw && y1 > 0 && y0 < vh && x1 - x0 > 8;
      const key = show ? `${x0 | 0},${y0 | 0},${(x1 - x0) | 0},${(y1 - y0) | 0}` : 'off';
      if (key === P.at) return;
      P.at = key;
      if (!show) { P.b.style.visibility = 'hidden'; return; }
      Object.assign(P.b.style, { visibility: 'visible', transform: `translate(${x0.toFixed(1)}px, ${y0.toFixed(1)}px)`, width: `${(x1 - x0).toFixed(1)}px`, height: `${(y1 - y0).toFixed(1)}px` });
    });
  }
  // the type the labels are drawn in, once it is in
  document.fonts?.ready.then(() => {
    pieces.forEach((P) => { if (P.labelT) labelTex(P.k.lines, P.labelT); });
    setGroupLabel(groupHot);
  });
  renderer.shadowMap.needsUpdate = true;
  layout();
  gsap.ticker.add(frame);

  const api = {
    kind: 'room',
    layout,
    home(pc) { const P = pieces.find((q) => q.k.pc === pc); return P && P.b.style.visibility === 'visible' ? { art: P.b, img: P.img, b: P.b } : null; },
    reshape() {},
    destroy() {
      alive = false;
      document.documentElement.classList.remove('cc-in-room');
      gsap.ticker.remove(frame);
      removeEventListener('pointermove', onMove);
      removeEventListener('keydown', onKey);
      mirror?.rt.dispose();
      renderer.dispose();
      renderer.forceContextLoss?.();
      stage.remove();
      host.classList.remove('is-room');
    },
    // tuning by hand (localhost)
    scene, camera, renderer, pieces, STOPS, stopY, walkTo, wallMat, PAINT, get dirty() { return dirty; }, set dirty(v) { dirty = v; },
  };
  if (local) window[visitors ? '__museum2' : '__museum'] = api;
  return api;
}

// ================================================================== the wall (a phone)

function makeWall(host, { picks, art, open, sigInto, egg, hand, local, tag }) {
  host.classList.add('is-wall');
  host.classList.toggle('is-warm', WARM_LIGHT);
  const wrap = el('div', 'cp-mu-walls');
  const wall = el('div', 'cp-mu-wall');
  const hint = el('p', 'cp-mu-hint', 'Swipe along the wall');
  wrap.append(wall, hint);
  if (tag) wrap.append(el('p', 'cp-mu-tag', tag));
  host.append(wrap);

  // first, the show's name, lettered on the wall
  const T = titleShape(hand);
  const tp = el('div', 'cp-mu-panel cp-mu-name');
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'cp-mu-title');
  svg.setAttribute('viewBox', `${T.box.x} ${T.box.y} ${T.box.w} ${T.box.h}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Creative corner');
  svg.innerHTML = `<path class="cp-mu-ink" d="${T.fill}"/>` + T.lifts.map((d) => `<path class="cp-mu-lift" stroke-width="${T.lift}" d="${d}"/>`).join('');
  tp.append(svg);
  wall.append(tp);

  const homes = new Map();
  function piece(k, cls) {
    const fig = el('figure', `cp-mu-piece ${cls || ''}`);
    const b = el('button', 'cp-mu-frame'), img = el('img');
    b.type = 'button';
    b.setAttribute('aria-label', `${k.honour ? `${k.honour}: ` : ''}${k.title} by ${k.maker}`);
    img.alt = '';
    img.decoding = 'async';
    // (a film still is shown without its bars, as on the laptop's canvases)
    b.style.setProperty('--r', String((k.pc.ratio || 1) / (1 - 2 * (LOOK.dawn ? BARS(k.pc) : 0))));
    b.append(img);
    fig.append(b);
    art(k.pc, 900).then((url) => { img.src = url; });
    homes.set(k.pc, { art: b, img, b });
    b.addEventListener('click', () => open(k.pc, { art: b, img, b }));
    return { fig, b, img };
  }
  function label(fig, lines, k) {
    const cap = el('figcaption', 'cp-mu-label');
    lines.forEach(([kind, text]) => text && cap.append(el('span', `cp-mu-l-${kind}`, text)));
    fig.append(cap);
    if (!k) return null;
    const sig = document.createElementNS(NS, 'svg');
    sig.setAttribute('class', 'cc-sig cp-mu-sig');
    sig.setAttribute('aria-hidden', 'true');
    sigInto(sig, k.pc, 7.5);
    cap.append(sig);
    return sig;
  }
  const [day, week, month, ...before] = picks;
  [day, week, month].forEach((k) => {
    const panel = el('div', 'cp-mu-panel');
    const { fig, b } = piece(k, 'is-gilt');
    egg(b, label(fig, k.lines, k));
    panel.append(fig);
    wall.append(panel);
  });
  const gp = el('div', 'cp-mu-panel cp-mu-group');
  const grid = el('div', 'cp-mu-grid');
  before.forEach((k) => { const { fig } = piece(k, 'is-small'); grid.append(fig); });
  const gfig = el('figure', 'cp-mu-piece');
  gfig.append(grid);
  label(gfig, [['small', 'The days before']]);
  gp.append(gfig);
  wall.append(gp);

  const onScroll = () => { if (wall.scrollLeft > 20) { hint.classList.add('is-done'); wall.removeEventListener('scroll', onScroll); } };
  wall.addEventListener('scroll', onScroll, { passive: true });

  const api = {
    kind: 'wall',
    layout() {},
    home(pc) { return homes.get(pc) || null; },
    reshape(pc) { const h = homes.get(pc); if (h) h.b.style.setProperty('--r', String(pc.ratio / (1 - 2 * (LOOK.dawn ? BARS(pc) : 0)))); },
    destroy() { wrap.remove(); host.classList.remove('is-wall'); },
  };
  if (local) window.__museum = api;
  return api;
}
