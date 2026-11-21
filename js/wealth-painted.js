// The Family Wealth Picture as a painting (19 Nov, the user's brief: the quality "as in these pics or pinterest
// links", "slightly animate… the tree swaying"). One walled plot of land seen from one high camera at blue hour,
// painted at five sizes of home (assets/investors/home/home-1.jpg to home-5.jpg, made by the user from
// refs/investors/image-prompts.md), and the pieces that come and go painted apart and set into it: the vehicles in
// the drive, the pets and the family on the lawn. The life is drawn here on the graphics card: tree crowns and grass
// sway, water ripples, the windows glow by what is spent and go dark with debt, the garden lamps by what is spent on
// joy; a car drives up into the drive. When the home changes size the light goes down and comes up again on the new
// one, as years passing, so two homes are never seen at once. Where a painting is not in yet, a plain stand-in drawn
// here takes its place, labelled (with ?home=painted; otherwise the page keeps the 3D home until the paintings come).
// Where things sway and light on each painting (MAPS) is marked by hand once the paintings are in.

const BASE = 'assets/investors/home/';
const W = 1536, H = 1024; // (the paintings' size; every place below is in these pixels)
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

// the paintings that are in assets/investors/home/ (add each name as it arrives: 'home-1' … 'home-5' for the JPEGs,
// 'hatchback', 'dog' … for the PNG pieces); anything not listed is drawn as a stand-in, and nothing missing is asked
// for
const PAINTED = [];

// is there a painting of a home in? (until there is, the page keeps the 3D home)
export async function hasPaintings() { return PAINTED.some((n) => n.startsWith('home-')); }

// ------------------------------------------------------------------ where things are on each painting
// The plot as the prompts set it: a lane across the foot, the front wall along the lower third with the gate left
// of centre, the drive up the right of the plot, the open lawn on its left, the river to the left. `spots` are where
// the pieces stand (x, y at their feet, and how tall they are there); `sway` the tree crowns (centre, radii, where
// the trunk meets the ground), `grass` and `water` areas, `windows` and `lamps` what lights.
const SPOTS = {
  drive: [1105, 792, 104], drive2: [1196, 822, 108],
  lawn: [[540, 812, 1], [612, 836, 1], [470, 842, 1], [690, 806, 1]],
  adults: [606, 800, 82],
};
// (the stand-ins' own geometry, one per size of home; the real paintings get theirs in MAPS when they arrive)
const STAND = [
  { w: 150, floors: 1, roof: 'flat', trees: [[600, 560, 52, 46, 640]], pool: null, fountain: false },
  { w: 230, floors: 1, roof: 'tile', trees: [[575, 545, 70, 60, 640]], pool: null, fountain: false },
  { w: 260, floors: 2, roof: 'tile', trees: [[560, 500, 92, 80, 650], [1175, 500, 60, 56, 600]], pool: null, fountain: false },
  { w: 380, floors: 2, roof: 'tile', trees: [[505, 480, 104, 90, 660], [1190, 470, 78, 70, 600]], pool: null, fountain: true },
  { w: 470, floors: 3, roof: 'flat', trees: [[470, 460, 112, 96, 660], [1205, 440, 92, 84, 600]], pool: [470, 690, 230, 52], fountain: false },
];
const MAPS = {}; // (home-1 … home-5: { sway, grass, water, windows, lamps, spots }, marked on the paintings themselves)

// the stand-in's windows, lamps, crowns and water, worked out from its geometry so the life lands on it
function standMap(i) {
  const s = STAND[i], cx = 790, gy = 640, fh = 64, x0 = cx - s.w / 2;
  const windows = [];
  for (let f = 0; f < s.floors; f++) {
    const n = Math.max(2, Math.round(s.w / 62));
    for (let k = 0; k < n; k++) windows.push([x0 + 18 + k * ((s.w - 36) / n) + 6, gy - (f + 1) * fh + 18, Math.min(30, (s.w - 36) / n - 12), 26]);
  }
  const lamps = [[470, 870], [700, 870], [1000, 700], [1000, 780], [880, 655], [700, 655]].slice(0, 2 + i);
  const water = [[[0, 760], [120, 600], [300, 420], [420, 300], [470, 262], [455, 262], [380, 300], [250, 420], [80, 600], [0, 700]]];
  if (s.pool) water.push([[s.pool[0], s.pool[1]], [s.pool[0] + s.pool[2], s.pool[1]], [s.pool[0] + s.pool[2], s.pool[1] + s.pool[3]], [s.pool[0], s.pool[1] + s.pool[3]]]);
  return {
    sway: s.trees.map(([x, y, rx, ry, base]) => ({ c: [x, y], r: [rx, ry], base })),
    grass: [[[480, 660], [1000, 660], [1100, 860], [380, 860]]],
    water, windows, lamps, spots: SPOTS,
  };
}

// a stand-in painting: the place in a few flat shapes, plainly not the painting, with its name
function standPlate(i) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'), s = STAND[i], cx = 790, gy = 640, fh = 64, x0 = cx - s.w / 2;
  let gr = g.createLinearGradient(0, 0, 0, 280);
  gr.addColorStop(0, '#0a1222'); gr.addColorStop(0.62, '#22355c'); gr.addColorStop(1, '#b98a7c');
  g.fillStyle = gr; g.fillRect(0, 0, W, 280);
  g.fillStyle = '#141d33'; for (let x = 0; x < W; x += 34) { const h = 10 + ((x * 7919) % 37); g.fillRect(x, 262 - h, 26, h + 4); }
  g.fillStyle = 'rgba(255, 205, 140, .55)'; for (let x = 4; x < W; x += 13) if ((x * 31) % 7 < 2) g.fillRect(x, 250 - ((x * 13) % 22), 2, 2);
  g.fillStyle = '#1a2a2c'; g.fillRect(0, 262, W, 640);
  g.strokeStyle = 'rgba(255,255,255,.04)'; for (let y = 280; y < 440; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y + 30); g.stroke(); }
  g.fillStyle = '#2c4b78'; g.beginPath(); [[0, 760], [120, 600], [300, 420], [420, 300], [470, 262], [455, 262], [380, 300], [250, 420], [80, 600], [0, 700]].forEach(([x, y], k) => (k ? g.lineTo(x, y) : g.moveTo(x, y))); g.fill();
  // the plot, its lawn, the wall and the gate, the drive, the lane
  g.fillStyle = '#20392b'; g.beginPath(); g.moveTo(360, 880); g.lineTo(1240, 880); g.lineTo(1130, 430); g.lineTo(470, 430); g.fill();
  g.fillStyle = '#2b4634'; g.beginPath(); g.moveTo(480, 660); g.lineTo(1000, 660); g.lineTo(1100, 860); g.lineTo(380, 860); g.fill();
  g.fillStyle = i === 0 ? '#4a3d33' : '#3b3d45'; g.beginPath(); g.moveTo(1050, 880); g.lineTo(1250, 880); g.lineTo(1140, 600); g.lineTo(1040, 600); g.fill();
  g.fillStyle = '#c7bca9'; g.fillRect(360, 862, 180, 20); g.fillRect(650, 862, 400, 20);
  g.fillStyle = '#262b36'; g.fillRect(0, 900, W, 124);
  // the home: floors, roof, windows
  for (let f = 0; f < s.floors; f++) { g.fillStyle = f % 2 ? '#a99a8a' : '#b8a993'; g.fillRect(x0, gy - (f + 1) * fh, s.w, fh); }
  g.fillStyle = s.roof === 'tile' ? '#7c3e2e' : '#8f8678';
  if (s.roof === 'tile') { g.beginPath(); g.moveTo(x0 - 16, gy - s.floors * fh); g.lineTo(cx, gy - s.floors * fh - 54); g.lineTo(x0 + s.w + 16, gy - s.floors * fh); g.fill(); }
  else g.fillRect(x0 - 6, gy - s.floors * fh - 10, s.w + 12, 10);
  g.fillStyle = '#ffcf7a'; standMap(i).windows.forEach(([x, y, w, h]) => g.fillRect(x, y, w, h));
  if (s.pool) { g.fillStyle = '#3aa3c6'; g.fillRect(...s.pool); }
  if (s.fountain) { g.fillStyle = '#8fb6c9'; g.beginPath(); g.ellipse(600, 760, 34, 14, 0, 0, Math.PI * 2); g.fill(); }
  s.trees.forEach(([x, y, rx, ry, base]) => { g.fillStyle = '#3a2a22'; g.fillRect(x - 6, y, 12, base - y); g.fillStyle = '#2f5a3b'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = '#3d6e47'; g.beginPath(); g.ellipse(x - rx * 0.25, y - ry * 0.3, rx * 0.6, ry * 0.5, 0, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = 'rgba(255, 214, 150, .9)'; standMap(i).lamps.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill(); });
  g.fillStyle = 'rgba(242, 243, 241, .7)'; g.font = '500 22px "Open Sauce One", sans-serif'; g.fillText(`Painting to come: home-${i + 1}`, 28, H - 30);
  return c;
}

// a stand-in piece: a plain shape of the thing, to be replaced by its painting
function standPiece(kind) {
  const c = document.createElement('canvas'), g = c.getContext('2d');
  const car = { hatchback: '#e8e4dc', suv: '#4a4f58', luxury: '#15171c' }[kind];
  if (car || kind === 'scooter' || kind === 'bicycle') {
    c.width = 200; c.height = kind === 'bicycle' ? 120 : 180;
    if (car) { g.fillStyle = car; g.fillRect(30, 40, 140, 120); g.fillStyle = 'rgba(20,30,50,.85)'; g.fillRect(44, 52, 112, 40); g.fillStyle = '#ff5a4a'; g.fillRect(34, 130, 20, 8); g.fillRect(146, 130, 20, 8); }
    else if (kind === 'scooter') { g.fillStyle = '#9cc0d8'; g.fillRect(70, 40, 60, 120); g.fillStyle = '#222'; g.fillRect(84, 150, 32, 22); }
    else { g.strokeStyle = '#111'; g.lineWidth = 6; g.beginPath(); g.arc(50, 84, 30, 0, 7); g.moveTo(180, 84); g.arc(150, 84, 30, 0, 7); g.moveTo(50, 84); g.lineTo(100, 40); g.lineTo(150, 84); g.stroke(); }
    return c;
  }
  c.width = 120; c.height = 120;
  g.fillStyle = { dog: '#c79a5a', cat: '#8d7a68', adults: '#d8d2c6', 'child-1': '#e0b07a', 'child-2': '#9fb6d6' }[kind] || '#ccc';
  if (kind === 'dog') { g.beginPath(); g.ellipse(64, 86, 40, 18, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(26, 70, 14, 13, 0, 0, 7); g.fill(); }
  else if (kind === 'cat') { g.beginPath(); g.ellipse(60, 84, 18, 26, 0, 0, 7); g.fill(); g.beginPath(); g.arc(60, 50, 12, 0, 7); g.fill(); }
  else if (kind === 'adults') { g.fillRect(30, 30, 24, 88); g.fillRect(66, 36, 24, 82); }
  else { g.fillRect(48, 50, 24, 68); }
  return c;
}

// ------------------------------------------------------------------ the picture on the graphics card
const VS = `#version 300 es
in vec2 aPos; uniform vec4 uRect; out vec2 vUv;
void main() { vUv = aPos; gl_Position = vec4(uRect.xy + aPos * uRect.zw, 0.0, 1.0); }`;

// the painting, alive: crowns and grass sway (more the higher above the trunk), water ripples and glints, windows
// glow or go dark, lamps breathe; debt cools and greys the whole; years passing take the light down
const FS_PLATE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uPlate, uMap;
uniform float uTime, uDark, uLights, uLamps, uDebt, uStill;
void main() {
  vec4 m = texture(uMap, vUv);
  float t = uTime;
  float gust = 0.65 + 0.35 * sin(t * 0.37) * sin(t * 0.23 + 1.3);
  vec2 uv = vUv;
  uv.x += m.r * 0.0042 * gust * sin(t * 1.55 + vUv.y * 11.0 + vUv.x * 5.0) * (1.0 - uStill);
  uv.y += m.r * 0.0014 * gust * sin(t * 1.9 + vUv.x * 9.0) * (1.0 - uStill);
  uv.x += m.g * 0.0014 * sin(t * 1.3 + vUv.y * 210.0) * (1.0 - uStill);
  vec3 col = texture(uPlate, uv).rgb;
  float glint = m.g * pow(max(0.0, sin(t * 1.7 + vUv.x * 95.0 + vUv.y * 300.0)), 28.0) * 0.16 * (1.0 - uStill);
  col += glint * vec3(0.85, 0.9, 1.0) * (1.0 - uDark);
  float win = m.b, flick = 0.95 + 0.05 * sin(t * 2.7 + vUv.x * 61.0);
  col = mix(col, col * 0.22 + vec3(0.015, 0.022, 0.05), win * (1.0 - uLights) * 0.92);
  col += win * uLights * flick * vec3(1.0, 0.7, 0.36) * 0.13;
  col += m.a * uLamps * (0.86 + 0.14 * sin(t * 2.2 + vUv.x * 70.0)) * vec3(1.0, 0.74, 0.42) * 0.3;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(l) * vec3(0.78, 0.86, 1.0), uDebt * 0.38);
  col = mix(col, vec3(l) * vec3(0.5, 0.6, 0.85) * 0.1, uDark);
  float g = fract(sin(dot(gl_FragCoord.xy + floor(t * 24.0) * 37.0, vec2(12.9898, 78.233))) * 43758.5453);
  col += (g - 0.5) * 0.022;
  o = vec4(col, 1.0);
}`;

// a piece set into it (premultiplied), with the same grade; or the soft shadow at its feet
const FS_PIECE = `#version 300 es
precision highp float;
in vec2 vUv; out vec4 o;
uniform sampler2D uTex;
uniform float uAlpha, uFlip, uShadow, uDark, uDebt;
void main() {
  if (uShadow > 0.5) {
    vec2 d = vUv * 2.0 - 1.0;
    float a = (1.0 - smoothstep(0.15, 1.0, dot(d, d))) * 0.45 * uAlpha * (1.0 - uDark);
    o = vec4(0.0, 0.0, 0.0, a);
    return;
  }
  vec4 c = texture(uTex, vec2(uFlip > 0.5 ? 1.0 - vUv.x : vUv.x, vUv.y));
  vec3 col = c.rgb;
  float l = dot(col, vec3(0.299, 0.587, 0.114));
  col = mix(col, vec3(l) * vec3(0.78, 0.86, 1.0), uDebt * 0.38);
  col = mix(col, vec3(l) * vec3(0.5, 0.6, 0.85) * 0.1, uDark);
  o = vec4(col, c.a) * uAlpha;
}`;

function program(gl, fs) {
  const p = gl.createProgram();
  [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]].forEach(([type, src]) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    gl.attachShader(p, s);
  });
  gl.bindAttribLocation(p, 0, 'aPos');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {};
  for (let i = 0, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); }
  return { p, u };
}

// where the life is, as one small picture: red the sway, green the water, blue the windows, alpha the lamps
function mapTexture(m) {
  const w = 384, h = 256, k = w / W;
  const layer = (draw, blur) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.filter = blur ? `blur(${blur}px)` : 'none'; g.fillStyle = '#fff'; draw(g); return g.getImageData(0, 0, w, h).data; };
  const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.closePath(); g.fill(); };
  // (each layer is read by its coverage, the alpha, since a canvas keeps white white however faint)
  const R = layer((g) => {
    m.sway.forEach(({ c, r, base }) => {
      const gr = g.createLinearGradient(0, base * k, 0, (c[1] - r[1]) * k);
      gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, '#fff');
      g.fillStyle = gr; g.beginPath(); g.ellipse(c[0] * k, c[1] * k, r[0] * k * 1.08, r[1] * k * 1.08, 0, 0, Math.PI * 2); g.fill();
    });
    g.fillStyle = 'rgba(255,255,255,.18)'; (m.grass || []).forEach((p) => poly(g, p));
  }, 3);
  const G = layer((g) => (m.water || []).forEach((p) => poly(g, p)), 1.5);
  const B = layer((g) => (m.windows || []).forEach(([x, y, ww, hh]) => g.fillRect(x * k, y * k, ww * k, hh * k)), 0.6);
  const A = layer((g) => (m.lamps || []).forEach(([x, y]) => { const gr = g.createRadialGradient(x * k, y * k, 0, x * k, y * k, 16 * k); gr.addColorStop(0, '#fff'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect((x - 16) * k, (y - 16) * k, 32 * k, 32 * k); }), 0);
  const out = new Uint8ClampedArray(w * h * 4);
  for (let i = 0; i < w * h; i++) { out[i * 4] = R[i * 4 + 3]; out[i * 4 + 1] = G[i * 4 + 3]; out[i * 4 + 2] = B[i * 4 + 3]; out[i * 4 + 3] = A[i * 4 + 3]; }
  return new ImageData(out, w, h);
}

export function createPainted(canvas, { reduced = false } = {}) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, premultipliedAlpha: true });
  if (!gl) return null;
  let plateP, pieceP;
  try { plateP = program(gl, FS_PLATE); pieceP = program(gl, FS_PIECE); } catch (e) { console.warn(e); return null; }
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

  // (pictures are premultiplied for blending; the map of life is data, so its channels are left as they are)
  const texture = (src, mip, premul = true) => {
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, premul);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
    if (mip) gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return t;
  };
  const load = (name, ext) => new Promise((ok) => {
    if (!PAINTED.includes(name)) return ok(null);
    const im = new Image(); im.decoding = 'async'; im.onload = () => ok(im); im.onerror = () => ok(null); im.src = `${BASE}${name}.${ext}`;
  });

  // the five homes (each with its map of life) and the pieces, loaded as they are needed
  const plates = [];
  const plate = (i) => plates[i] || (plates[i] = load(`home-${i + 1}`, 'jpg').then((im) => {
    const real = !!im, m = real ? MAPS[`home-${i + 1}`] || { sway: [], water: [], windows: [], lamps: [], spots: SPOTS } : standMap(i);
    return { tex: texture(im || standPlate(i), true), map: texture(mapTexture(m), false, false), spots: m.spots || SPOTS, real };
  }));
  const pieceTex = {}, pieceLoading = {};
  const piece = (kind) => pieceLoading[kind] || (pieceLoading[kind] = load(kind, 'png').then((im) => {
    const src = im || standPiece(kind);
    return (pieceTex[kind] = { tex: texture(src, true), aspect: src.width / src.height, real: !!im });
  }));

  // how tall each piece stands at its spot (in the paintings' pixels)
  const TALL = { bicycle: 58, scooter: 74, hatchback: 92, suv: 104, luxury: 92, dog: 38, cat: 30, adults: 84, 'child-1': 50, 'child-2': 40 };

  let w = 1, h = 1, dpr = 1;
  const size = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, r.width < 600 ? 1.75 : 2);
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  // the painting covers the canvas; a place on it in the canvas's terms (clip space)
  const cover = () => { const s = Math.max(w / W, h / H); return { s, ox: (w - W * s) / 2, oy: (h - H * s) / 2 }; };
  const clip = (x, y) => { const { s, ox, oy } = cover(); return [((ox + x * s) / w) * 2 - 1, 1 - ((oy + y * s) / h) * 2]; };

  // what is shown, what is wanted, and the pieces on it
  const U = { dark: 1, lights: 0.8, lamps: 0.5, debt: 0 }; // (the light starts down and comes up on the first home)
  let want = null, cur = null, shown = null, phase = 'idle', phaseT = 0, stableAt = 0;
  let pieces = []; // { kind, slot, x, y, tall, flip, a, aT, d, dT }

  const spotsFor = (sc, spots) => {
    const list = [];
    sc.vehicles.forEach((k, i) => { const [x, y, t] = i ? spots.drive2 : spots.drive; list.push({ kind: k, slot: `v${i}`, x, y, tall: (TALL[k] / 100) * t, flip: false, drive: true }); });
    if (sc.adults) { const [x, y, t] = spots.adults; list.push({ kind: 'adults', slot: 'adults', x, y, tall: (TALL.adults / 82) * t, flip: false }); }
    const lawn = spots.lawn.slice();
    sc.pets.forEach((k, i) => { const [x, y] = lawn[(i + 2) % lawn.length]; list.push({ kind: k, slot: `p${i}`, x, y, tall: TALL[k], flip: i % 2 === 1 }); });
    for (let i = 0; i < Math.min(3, sc.kids); i++) { const [x, y] = lawn[i % 2 ? 0 : 1]; list.push({ kind: i === 1 ? 'child-2' : 'child-1', slot: `k${i}`, x: x + (i === 2 ? 90 : 0), y: y + (i === 2 ? 14 : 0), tall: TALL[i === 1 ? 'child-2' : 'child-1'], flip: i === 2 }); }
    return list;
  };
  // set the pieces to what is wanted: those that go fade (a vehicle backs down the drive), those that come arrive
  const arrange = (sc, spots, instant) => {
    const next = spotsFor(sc, spots);
    pieces.forEach((p) => { const n = next.find((q) => q.slot === p.slot); if (!n || n.kind !== p.kind) { p.aT = 0; if (p.drive) p.dT = 1; p.leaving = true; } });
    next.forEach((n) => {
      const have = pieces.find((p) => p.slot === n.slot && p.kind === n.kind && !p.leaving);
      if (have) { Object.assign(have, { x: n.x, y: n.y, tall: n.tall }); return; }
      piece(n.kind);
      // (a vehicle that comes waits for the one leaving its place, then drives up from the lane)
      const wait = pieces.some((p) => p.slot === n.slot && p.leaving) ? 0.9 : 0;
      pieces.push({ ...n, a: instant ? 1 : 0, aT: 1, d: instant || !n.drive ? 0 : 1, dT: 0, wait: instant ? 0 : wait });
    });
    if (instant) pieces = pieces.filter((p) => !p.leaving);
  };

  let time = 0, last = performance.now(), alive = true;
  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    const r = canvas.getBoundingClientRect();
    if (r.bottom < -50 || r.top > innerHeight + 50) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) time += dt;
    step(dt, now);
    draw();
  }
  requestAnimationFrame(frame);

  // the years passing: when the home is to change size (and the wish has held a moment), the light goes down, the
  // new home is set in the dark with its pieces, and the light comes up on it
  function step(dt, now) {
    const DOWN = reduced ? 0.25 : 0.9, UP = reduced ? 0.35 : 1.25;
    // (the first home needs no going down: the light only comes up on it)
    if (want && phase === 'idle' && (!cur || want.home !== cur.home) && (!cur || now - stableAt > 220)) { phase = 'down'; phaseT = cur ? 0 : 1; plate(want.home); }
    if (phase === 'down') {
      phaseT += dt / DOWN;
      U.dark = Math.max(U.dark, ease(clamp(phaseT, 0, 1)));
      if (phaseT >= 1) {
        phase = 'swap';
        const target = want;
        plate(target.home).then((pl) => { shown = pl; cur = target; arrange(target, pl.spots, true); phase = 'up'; phaseT = 0; });
      }
    } else if (phase === 'up') {
      phaseT += dt / UP;
      U.dark = 1 - ease(clamp(phaseT, 0, 1));
      if (phaseT >= 1) { phase = 'idle'; U.dark = 0; }
    } else if (phase === 'idle' && want && cur && want !== cur && want.home === cur.home) {
      cur = want;
      arrange(want, shown.spots, false);
    }
    // the light of the house eases to what is spent
    if (cur) {
      const k = Math.min(1, dt * 2.2);
      U.lights += (cur.lights - U.lights) * k; U.lamps += (cur.lamps - U.lamps) * k; U.debt += ((cur.debt ? 1 : 0) - U.debt) * k;
    }
    pieces.forEach((p) => {
      if (p.wait > 0) { p.wait -= dt; return; }
      const k = Math.min(1, dt * (p.drive ? 1.6 : 3));
      p.a += (p.aT - p.a) * k; p.d += (p.dT - p.d) * Math.min(1, dt * 1.5);
    });
    pieces = pieces.filter((p) => !(p.leaving && p.a < 0.01));
  }

  function draw() {
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0.04, 0.06, 0.11, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    if (!shown) return;
    const { s, ox, oy } = cover();
    gl.disable(gl.BLEND);
    gl.useProgram(plateP.p);
    gl.uniform4f(plateP.u.uRect, (ox / w) * 2 - 1, 1 - ((oy + H * s) / h) * 2, ((W * s) / w) * 2, ((H * s) / h) * 2);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shown.tex); gl.uniform1i(plateP.u.uPlate, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, shown.map); gl.uniform1i(plateP.u.uMap, 1);
    gl.uniform1f(plateP.u.uTime, time); gl.uniform1f(plateP.u.uDark, U.dark); gl.uniform1f(plateP.u.uLights, U.lights);
    gl.uniform1f(plateP.u.uLamps, U.lamps); gl.uniform1f(plateP.u.uDebt, U.debt); gl.uniform1f(plateP.u.uStill, reduced ? 1 : 0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    // the pieces, back to front (by where their feet are), each with its shadow first
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.useProgram(pieceP.p);
    gl.activeTexture(gl.TEXTURE0); gl.uniform1i(pieceP.u.uTex, 0);
    gl.uniform1f(pieceP.u.uDark, U.dark); gl.uniform1f(pieceP.u.uDebt, U.debt);
    pieces.slice().sort((a, b) => a.y - b.y).forEach((p) => {
      const t = pieceTex[p.kind];
      if (!t || p.a < 0.005) return;
      // (a vehicle on its way comes up the drive from the lane, growing nearer as it comes)
      const y = p.y + (1010 - p.y) * ease(p.d), tall = p.tall * (1 + 0.35 * p.d), bob = p.drive || reduced ? 0 : Math.sin(time * 1.3 + p.x) * 0.6;
      const wd = tall * t.aspect;
      const [x0, y0] = clip(p.x - wd / 2, y + bob), [x1, y1] = clip(p.x + wd / 2, y + bob - tall);
      const fa = p.a * (p.drive ? clamp(1.4 - p.d * 1.4, 0, 1) : 1);
      const [sx0, sy0] = clip(p.x - wd * 0.46, y + tall * 0.07), [sx1, sy1] = clip(p.x + wd * 0.46, y - tall * 0.07);
      gl.uniform1f(pieceP.u.uShadow, 1); gl.uniform1f(pieceP.u.uAlpha, fa);
      gl.uniform4f(pieceP.u.uRect, sx0, sy0, sx1 - sx0, sy1 - sy0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.uniform1f(pieceP.u.uShadow, 0); gl.uniform1f(pieceP.u.uFlip, p.flip ? 1 : 0);
      gl.bindTexture(gl.TEXTURE_2D, t.tex);
      gl.uniform4f(pieceP.u.uRect, x0, y0, x1 - x0, y1 - y0);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    });
  }
  return {
    show(p, mix, earn, sc) {
      if (!sc) return;
      if (!want || sc.home !== want.home) stableAt = performance.now();
      want = sc;
      plate(sc.home);
      spotsFor(sc, SPOTS).forEach((n) => piece(n.kind));
    },
    get state() { return { phase, U: { ...U }, cur, pieces: pieces.map((p) => ({ kind: p.kind, a: +p.a.toFixed(2), d: +p.d.toFixed(2) })), real: shown?.real }; },
    tick(n = 1, dt = 1 / 30) { for (let i = 0; i < n; i++) { time += reduced ? 0 : dt; step(dt, performance.now() + 1e6); } draw(); },
    destroy() { alive = false; ro.disconnect(); },
  };
}
