// The silk: the ground of the About page (js/about-silk.js) and of the way in (js/emerge.js).
//
// The site's common element is the thread, and this is what the thread is spun into: a sheet of
// silk, night and paper changing into each other along its own folds through a dawn blue, never
// through grey and never at a line. Its folds drift slowly and always, stir a little faster while
// the page moves, and catch the light from where the cursor is.
//
// How: one small WebGL program on a canvas drawn at a fraction of the screen's resolution (it is
// soft by nature). The page that uses it decides where the ground changes; the engine only draws.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const MAX = 6;

// the ground's lightness, 0 (night) to 1 (paper), as colour: through ink blue and a dawn blue,
// never through grey. Same stops in the shader.
const RAMP = [
  [0.0, [0.020, 0.027, 0.035]], // #050709, the page's night
  [0.14, [0.047, 0.078, 0.141]], // #0c1424, ink blue
  [0.36, [0.149, 0.216, 0.353]], // #26375a, before dawn
  [0.6, [0.490, 0.565, 0.698]], //  #7d90b2, dawn
  [0.82, [0.804, 0.839, 0.882]], // #cdd6e1, mist
  [1.0, [0.949, 0.953, 0.937]], //  #f2f3ef, the site's paper
];
export function ramp(g) {
  for (let i = 1; i < RAMP.length; i++) {
    const [b, cb] = RAMP[i], [a, ca] = RAMP[i - 1];
    if (g <= b) { let t = clamp((g - a) / (b - a), 0, 1); t = t * t * (3 - 2 * t); return ca.map((v, k) => v + (cb[k] - v) * t); }
  }
  return RAMP[RAMP.length - 1][1];
}
export const hex = (c) => '#' + c.map((v) => Math.round(clamp(v, 0, 1) * 255).toString(16).padStart(2, '0')).join('');

const VERT = `
attribute vec2 aP;
void main() { gl_Position = vec4(aP, 0.0, 1.0); }`;

const FRAG = `
precision highp float;
uniform vec2 uRes;      // canvas pixels
uniform vec2 uView;     // the canvas in css pixels
uniform float uT;       // the silk's own time, seconds
uniform float uDrift;   // the scroll, slowed, css pixels (the silk lies deeper than the page)
uniform float uNav;     // the nav's height: under it the ground is flat, so the nav can match it
uniform float uG0;      // the ground above the first change
uniform vec4 uB[${MAX}];       // each change: its middle (screen y), half its width, its fold, the ground after
uniform int uN;
uniform float uFoot;    // the page's foot, screen y
uniform vec2 uLight;    // where the light comes from, leaning towards the cursor
uniform vec3 uK;        // strengths: sheen on night, folds on paper, the fold at a change

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// the silk's surface: long folds, slowly turning, warped so no two are alike
float silk(vec2 q) {
  vec2 w = vec2(vnoise(q * 1.3 + vec2(0.0, uT * 0.05)), vnoise(q * 1.3 + vec2(7.3, -uT * 0.04))) - 0.5;
  q += w * 0.26;
  float h = sin(q.x * 4.4 + 1.9 * sin(q.y * 1.25 + uT * 0.15));
  h += 0.42 * sin(q.x * 9.2 - q.y * 0.8 - uT * 0.11 + 1.2 * sin(q.y * 2.2 - uT * 0.08));
  h += 0.14 * sin(q.x * 19.0 + q.y * 1.6 + uT * 0.2);
  return h / 1.56;
}
vec3 ramp(float g) {
  vec3 c0 = vec3(0.020, 0.027, 0.035), c1 = vec3(0.047, 0.078, 0.141), c2 = vec3(0.149, 0.216, 0.353);
  vec3 c3 = vec3(0.490, 0.565, 0.698), c4 = vec3(0.804, 0.839, 0.882), c5 = vec3(0.949, 0.953, 0.937);
  if (g < 0.14) return mix(c0, c1, smoothstep(0.0, 0.14, g));
  if (g < 0.36) return mix(c1, c2, smoothstep(0.14, 0.36, g));
  if (g < 0.6) return mix(c2, c3, smoothstep(0.36, 0.6, g));
  if (g < 0.82) return mix(c3, c4, smoothstep(0.6, 0.82, g));
  return mix(c4, c5, smoothstep(0.82, 1.0, g));
}
void main() {
  vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) * (uView.x / uRes.x);   // css pixels, y down
  float sh = uView.y;
  // the silk, laid on the diagonal, lying deeper than the page
  vec2 q = vec2(p.x, p.y + uDrift) / sh;
  q = mat2(0.91, 0.41, -0.41, 0.91) * q;
  float e = 0.006;
  float h = silk(q), hx = silk(q + vec2(e, 0.0)), hy = silk(q + vec2(0.0, e));
  vec3 n = normalize(vec3(-(hx - h) / e * 0.075, -(hy - h) / e * 0.075, 1.0));
  vec3 L = normalize(vec3(uLight, 0.9));
  float dif = dot(n, L);
  float spec = pow(max(dot(n, normalize(L + vec3(0.0, 0.0, 1.0))), 0.0), 34.0);

  // the ground: night or paper, changing along a fold of the silk
  float calm = smoothstep(uNav, uNav + 140.0, p.y);
  float g = uG0, pass = 0.0;
  for (int i = 0; i < ${MAX}; i++) {
    if (i >= uN) break;
    vec4 b = uB[i];
    float w = b.z * calm * (0.65 * h + 0.35 * sin(p.x / uView.x * 4.4 + uT * 0.13 + float(i) * 1.9));
    float k = smoothstep(-b.y, b.y, p.y - b.x + w);
    g = mix(g, b.w, k);
    pass = max(pass, 1.0 - abs(2.0 * k - 1.0));
  }
  // first light at the foot, under the take-off
  float up = (uFoot - p.y) / sh;
  g += (1.0 - g) * 0.16 * exp(-up * up * 3.2) * (0.75 + 0.25 * cos((p.x / uView.x - 0.62) * 3.0));

  vec3 col = ramp(g);
  float night = 1.0 - smoothstep(0.12, 0.7, g);
  float k = calm * (1.0 + pass * uK.z);
  // on the night the folds catch a cold silver light; on the paper they are a breath of shadow
  col += night * k * (vec3(0.55, 0.62, 0.78) * spec * uK.x + vec3(0.025, 0.035, 0.06) * (0.5 + 0.5 * dif) * uK.x * 1.6);
  col = mix(col, col * (1.0 - uK.y * (0.55 - 0.45 * dif)) + spec * uK.y * 0.6, (1.0 - night) * k);
  col += (hash(gl_FragCoord.xy + fract(uT)) - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}`;

// ---------------------------------------------------------------- the engine
// One sheet of silk on a canvas. Whoever uses it says what the ground is on the screen, in its
// view: the ground at the top (g0, 0 night to 1 paper), each change down the screen (bounds: its
// middle y in css pixels, half its width, how far its fold moves it, the ground after it), where
// first light lifts the foot (foot, a screen y; far below the screen for none), how far the silk
// has drifted (drift, css pixels) and how much flat room to leave at the top for a nav (nav). Then
// frame() each frame. The engine keeps the silk's own time, and its light, which leans towards the
// cursor (on a phone it sways on its own).
export function createSilk(canvas, { reduced = false, isTouch = false, scale, onLost } = {}) {
  const gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aP = gl.getAttribLocation(prog, 'aP');
  gl.enableVertexAttribArray(aP);
  gl.vertexAttribPointer(aP, 2, gl.FLOAT, false, 0, 0);
  const U = {};
  ['uRes', 'uView', 'uT', 'uDrift', 'uNav', 'uG0', 'uB', 'uN', 'uFoot', 'uLight', 'uK'].forEach((n) => (U[n] = gl.getUniformLocation(prog, n)));

  // dials: sheen on the night, folds on the paper, extra at a change, resolution, drift with scroll
  const k = { night: 0.12, paper: 0.035, pass: 0.7, scale: scale ?? (isTouch ? 0.34 : 0.5), drift: 0.22 };
  const view = { g0: 0, bounds: [], foot: 1e6, drift: 0, nav: 0 };
  let cssW = 1, cssH = 1;
  function size() {
    cssW = canvas.clientWidth || innerWidth;
    cssH = canvas.clientHeight || innerHeight;
    const w = Math.max(2, Math.round(cssW * k.scale)), h = Math.max(2, Math.round(cssH * k.scale));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, w, h);
    dirty = true;
  }

  // the ground at a height on the screen, without the fold
  function groundAt(y) {
    let g = view.g0;
    for (const b of view.bounds) {
      let t = clamp((y - b.y + b.half) / (2 * b.half), 0, 1);
      t = t * t * (3 - 2 * t);
      g += (b.g - g) * t;
    }
    return g;
  }

  const light = { x: -0.42, y: -0.5, tx: -0.42, ty: -0.5 };
  const onPointer = (e) => { light.tx = (e.clientX / innerWidth - 0.5) * 1.4; light.ty = (e.clientY / innerHeight - 0.5) * 1.1 - 0.15; };
  if (!isTouch) addEventListener('pointermove', onPointer, { passive: true });
  let t = 7.3, last = performance.now(), lastDraw = 0, dirty = true, alive = true;
  const B = new Float32Array(MAX * 4);

  function draw(now) {
    gl.uniform2f(U.uRes, canvas.width, canvas.height);
    gl.uniform2f(U.uView, cssW, cssH);
    gl.uniform1f(U.uT, t);
    gl.uniform1f(U.uDrift, view.drift);
    gl.uniform1f(U.uNav, view.nav);
    gl.uniform1f(U.uG0, view.g0);
    B.fill(0);
    const n = Math.min(MAX, view.bounds.length);
    for (let i = 0; i < n; i++) { const b = view.bounds[i]; B[i * 4] = b.y; B[i * 4 + 1] = b.half; B[i * 4 + 2] = b.fold; B[i * 4 + 3] = b.g; }
    gl.uniform4fv(U.uB, B);
    gl.uniform1i(U.uN, n);
    gl.uniform1f(U.uFoot, view.foot);
    gl.uniform2f(U.uLight, light.x, light.y);
    gl.uniform3f(U.uK, k.night, k.paper, k.pass);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    lastDraw = now;
    dirty = false;
  }
  // a frame: moved says the ground moved on the screen (a scroll, or a change on its way);
  // speed (css pixels a second) stirs the silk while the page moves under it
  function frame(moved = false, speed = 0) {
    if (!alive) return;
    const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    if (!reduced) {
      t += dt * (1 + Math.min(speed / 900, 2.2));
      if (isTouch) { light.tx = -0.42 + 0.35 * Math.sin(t * 0.21); light.ty = -0.5 + 0.18 * Math.sin(t * 0.13 + 1); }
      light.x += (light.tx - light.x) * Math.min(1, dt * 2.2);
      light.y += (light.ty - light.y) * Math.min(1, dt * 2.2);
    }
    // drawn whenever the ground moved; otherwise the slow drift needs no more than thirty a second
    if (moved || dirty || (!reduced && now - lastDraw > 32)) draw(now);
  }

  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); alive = false; onLost?.(); });
  addEventListener('resize', size);
  size();
  return {
    k, view, frame, size,
    at(y) { const g = groundAt(y); return { g, hex: hex(ramp(g)) }; },
    get alive() { return alive; },
    destroy() {
      alive = false;
      removeEventListener('resize', size);
      removeEventListener('pointermove', onPointer);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}
