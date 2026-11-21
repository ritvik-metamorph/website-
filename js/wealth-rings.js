// The four parts of wealth as four rings of grain (17 Nov; the Investor Corner, both sites). The client's
// Notion: "We need to visually present these 4 components of Wealth. It could be in the form of moving
// circular ring with full of atoms as also in the hero section. Earn, Spend, Invest and Save." So: the
// heroes' material (tubes of dense grain), as four rings round one centre, seen a little from above.
// Earn is the outer ring, the whole of what comes in; inside it Spend, Invest and Save, each as thick as
// its share. Grains leave the Earn ring all the time and spiral inwards to the ring their rupee goes to,
// so the picture is the flow itself; the Invest ring carries a little gold, and turns fastest.
// Point at a ring (or its label) and it comes forward, and what it is shows beside the pointer (19 Nov, the
// user: "whenever we hover our cursor over there, it explains a part of it"); the rings are thicker and denser
// since the same day ("much more thicker"). Drawn on a 2D canvas so the simple site can
// carry it too; `skin` is 'light' (silver on the night) or 'ink' (ink on paper).

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5; // (roughly -1 to 1, most near 0)

export const RINGS = ['earn', 'spend', 'invest', 'save'];

// the rings with their key: pointing at a name, or at a ring, brings that ring forward; over a ring, its name and
// what it is (the key's data-say) sit beside the pointer
export function ringsWithKey(wrap, opts) {
  const canvas = wrap.querySelector('canvas'), names = [...wrap.querySelectorAll('[data-ring]')];
  const api = createRings(canvas, opts);
  const cap = document.createElement('p');
  cap.className = 'iv-ring-cap';
  cap.setAttribute('aria-hidden', 'true');
  canvas.parentElement.append(cap);
  let capK = null;
  const focus = (k) => { api.focus(k); wrap.classList.toggle('is-focus', !!k); names.forEach((n) => n.classList.toggle('is-on', n.dataset.ring === k)); };
  names.forEach((n) => { n.addEventListener('pointerenter', () => focus(n.dataset.ring)); n.addEventListener('pointerleave', () => focus(null)); });
  canvas.addEventListener('ring', (e) => {
    const { k, x, y } = e.detail;
    focus(k);
    if (k && k !== capK) { const n = names.find((m) => m.dataset.ring === k); cap.innerHTML = `<b>${n.querySelector('b').textContent}</b><span>${n.dataset.say || ''}</span>`; }
    capK = k;
    cap.classList.toggle('is-on', !!k);
    if (k) {
      // (beside the pointer, on whichever side has room)
      const W = canvas.clientWidth, left = x > W * 0.62;
      cap.style.transform = `translate(${Math.round(left ? x - 18 : x + 18)}px, ${Math.round(y - 10)}px) translateX(${left ? '-100%' : '0'})`;
    }
  });
  return api;
}

// (19 Nov) the grains are laid down by the graphics card in one draw, as square points, the same picture the 2D
// canvas drew grain by grain (which took about 9 ms a frame at the new thickness); the 2D way stays for where WebGL
// is not there
function grainGL(canvas) {
  const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: false });
  if (!gl) return null;
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
  const p = gl.createProgram();
  try {
    gl.attachShader(p, sh(gl.VERTEX_SHADER, `#version 300 es
in vec4 aP; in float aG; uniform vec2 uView; uniform float uDpr; out float vA; out float vG;
void main() { vec2 q = (aP.xy + aP.z * 0.5) / uView * 2.0 - 1.0; gl_Position = vec4(q.x, -q.y, 0.0, 1.0); gl_PointSize = max(1.0, aP.z * uDpr); vA = aP.w; vG = aG; }`));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, `#version 300 es
precision mediump float; in float vA; in float vG; uniform vec3 uBase, uGold; out vec4 o;
void main() { o = vec4(mix(uBase, uGold, vG) * vA, vA); }`));
  } catch (e) { console.warn(e); return null; }
  gl.bindAttribLocation(p, 0, 'aP'); gl.bindAttribLocation(p, 1, 'aG');
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  const u = (n) => gl.getUniformLocation(p, n);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 20, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 1, gl.FLOAT, false, 20, 16);
  gl.useProgram(p);
  gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  return {
    draw(data, n, w, h, dpr, base, gold) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u('uView'), w, h); gl.uniform1f(u('uDpr'), dpr);
      gl.uniform3f(u('uBase'), base[0] / 255, base[1] / 255, base[2] / 255); gl.uniform3f(u('uGold'), gold[0] / 255, gold[1] / 255, gold[2] / 255);
      gl.bufferData(gl.ARRAY_BUFFER, data.subarray(0, n * 5), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.POINTS, 0, n);
    },
  };
}

export function createRings(canvas, { skin = 'light', shares = { spend: 0.55, invest: 0.2, save: 0.15 }, reduced = false, density = 1 } = {}) {
  const GL = grainGL(canvas);
  const g = GL ? null : canvas.getContext('2d');
  const R = { earn: 0.94, spend: 0.73, invest: 0.53, save: 0.33 };      // (radii, as a share of the half-width)
  const W0 = { earn: 0.1, spend: 0.2, invest: 0.2, save: 0.2 };         // (the widest a band gets)
  const SPEED = { earn: 0.05, spend: -0.09, invest: 0.14, save: 0.03 }; // (radians a second)
  const TILT = 0.42;
  const ink = skin === 'ink';
  const base = ink ? [22, 32, 27] : [233, 236, 242], gold = ink ? [150, 104, 40] : [240, 196, 138];
  const MAX = Math.round((ink ? 2300 : 4200) * density);
  // every ring's grains, made once; a ring shows as many as its share asks for
  const grains = {};
  RINGS.forEach((k) => {
    const n = k === 'earn' ? Math.round(MAX * 0.5) : MAX;
    grains[k] = Array.from({ length: n }, () => ({ a: Math.random() * TAU, r: gauss(), h: gauss(), s: 0.6 + Math.random() * 1.1, gold: k === 'invest' && Math.random() < 0.2 }));
  });
  const share = { earn: 1, spend: shares.spend, invest: shares.invest, save: shares.save };
  const shown = { ...share };
  // grains on their way in from the Earn ring
  const travellers = Array.from({ length: ink ? 26 : 44 }, () => ({ to: 'spend', t: Math.random(), d: 2.4 + Math.random() * 2, a: Math.random() * TAU, s: 0.8 + Math.random() }));
  const pick = () => { const x = Math.random() * (shown.spend + shown.invest + shown.save); return x < shown.spend ? 'spend' : x < shown.spend + shown.invest ? 'invest' : 'save'; };
  travellers.forEach((p) => { p.to = pick(); });

  let w = 1, h = 1, dpr = 1, focus = null, focusS = { earn: 0, spend: 0, invest: 0, save: 0 }, alive = true, last = performance.now(), time = 0;
  const size = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    w = Math.max(1, r.width); h = Math.max(1, r.height);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(canvas);
  const geom = () => { const half = Math.min(w / 2, h / (2 * TILT * 1.25)) * 0.96; return { cx: w / 2, cy: h / 2, half }; };

  // which ring the pointer is over
  const ringAt = (x, y) => {
    const { cx, cy, half } = geom();
    const d = Math.hypot((x - cx) / half, (y - cy) / (half * TILT));
    let best = null, bd = 1e9;
    RINGS.forEach((k) => { const e = Math.abs(d - R[k]); if (e < bd && e < 0.12) { bd = e; best = k; } });
    return best;
  };
  // (a touch or a pen sets the ring it lands on; leaving the canvas lets go)
  const point = (e) => { const r = canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; focus = ringAt(x, y); canvas.dispatchEvent(new CustomEvent('ring', { detail: { k: focus, x, y } })); };
  canvas.addEventListener('pointermove', point);
  canvas.addEventListener('pointerdown', point);
  canvas.addEventListener('pointerleave', () => { focus = null; canvas.dispatchEvent(new CustomEvent('ring', { detail: { k: null } })); });

  // (every grain of a frame: x, y, size, alpha, gold; on the 2D canvas drawn in a few steps of brightness)
  const data = new Float32Array((RINGS.reduce((a, k) => a + grains[k].length, 0) + travellers.length) * 5);
  let n = 0;
  const put = (x, y, s, al, gd) => { const o = n * 5; data[o] = x; data[o + 1] = y; data[o + 2] = s; data[o + 3] = al; data[o + 4] = gd ? 1 : 0; n++; };
  const buckets = Array.from({ length: 8 }, () => []);
  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    const r = canvas.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) time += dt;
    RINGS.forEach((k) => { shown[k] += (share[k] - shown[k]) * Math.min(1, dt * 3); focusS[k] += ((focus === k ? 1 : 0) - focusS[k]) * Math.min(1, dt * 6); });
    const anyFocus = focus ? 1 : 0;
    const { cx, cy, half } = geom();
    n = 0;
    RINGS.forEach((k) => {
      const list = grains[k], band = W0[k] * (k === 'earn' ? 1 : 0.35 + 0.65 * Math.sqrt(clamp(shown[k] / 0.6, 0, 1)));
      const count = k === 'earn' ? list.length : Math.round(list.length * clamp(shown[k] / 0.6, 0.04, 1));
      const lit = 1 - anyFocus * 0.62 * (1 - focusS[k]);
      const spin = SPEED[k] * time;
      for (let i = 0; i < count; i++) {
        const p = list[i], a = p.a + spin * (0.85 + 0.3 * ((i % 7) / 7));
        const rr = (R[k] + p.r * band * 0.5) * half;
        const x = cx + Math.cos(a) * rr, depth = Math.sin(a);
        const y = cy + Math.sin(a) * rr * TILT - p.h * band * half * 0.22;
        const al = clamp((0.34 + 0.5 * (depth * 0.5 + 0.5)) * lit * (i > count - 40 ? (count - i) / 40 : 1), 0, 1);
        const s = p.s * (0.8 + 0.35 * (depth * 0.5 + 0.5));
        put(x, y, s, al, p.gold);
      }
    });
    // the travellers: from the Earn ring inwards, on a spiral, to the ring their rupee goes to
    travellers.forEach((p) => {
      if (!reduced) p.t += dt / p.d;
      if (p.t >= 1) { p.t = 0; p.to = pick(); p.a = Math.random() * TAU; }
      const e = p.t * p.t * (3 - 2 * p.t), rr = (R.earn + (R[p.to] - R.earn) * e) * half, a = p.a + e * 1.4;
      const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * TILT;
      const al = Math.sin(Math.PI * p.t) * (1 - anyFocus * 0.5 * (1 - focusS[p.to]));
      put(x, y, p.s * 1.3, al, p.to === 'invest');
    });
    if (GL) { GL.draw(data, n, w, h, dpr, base, gold); return; }
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    buckets.forEach((b) => (b.length = 0));
    const gb = [];
    for (let i = 0; i < n; i++) {
      const o = i * 5;
      if (data[o + 4]) gb.push(data[o], data[o + 1], data[o + 2], data[o + 3]);
      else buckets[Math.min(7, Math.floor(data[o + 3] * 8))].push(data[o], data[o + 1], data[o + 2]);
    }
    buckets.forEach((b, i) => {
      if (!b.length) return;
      g.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},${((i + 0.5) / 8).toFixed(3)})`;
      for (let j = 0; j < b.length; j += 3) g.fillRect(b[j], b[j + 1], b[j + 2], b[j + 2]);
    });
    for (let j = 0; j < gb.length; j += 4) { g.fillStyle = `rgba(${gold[0]},${gold[1]},${gold[2]},${gb[j + 3].toFixed(3)})`; g.fillRect(gb[j], gb[j + 1], gb[j + 2], gb[j + 2]); }
  }
  requestAnimationFrame(frame);

  return {
    set(next) { share.spend = next.spend; share.invest = next.invest; share.save = next.save; },
    focus(k) { focus = k; },
    // where each ring's label belongs: on its right, a little above the middle (in CSS pixels)
    anchors() { const { cx, cy, half } = geom(); return Object.fromEntries(RINGS.map((k) => [k, { x: cx + Math.cos(-0.32) * R[k] * half, y: cy + Math.sin(-0.32) * R[k] * half * TILT }])); },
    destroy() { alive = false; ro.disconnect(); },
  };
}
