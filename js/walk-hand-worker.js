// The walk's hands, made as one surface (21 Nov; js/walk-hand.js starts this off the main thread).
//
// The user, on the hands made of a palm and five tubes: "robotic… hands are continuous; these look like a robot's,
// made by joining parts". So the hand is one shape: a field of distance to the palm, the wrist, the thumb's root
// and the fingers' bones, each finger blended smoothly into the palm (the knuckles and the webbing come out of the
// blend), its joints a little fuller, its tip a little flatter; the surface found in that field (surface nets),
// its normals from the field itself, so it shades as one continuous thing. Each point is then tied to the bones it
// moves with, half and half across each joint, so a bending finger bends inside its own skin. The colour is worked
// out here too: the back of the hand and the palm, the nails, the creases darker where the field says they are
// enclosed.
//
// In: { segs, cell, glove }. segs: the bones in the bind pose (a, b ends; r0, r1 radii; n the back of the finger;
// flat; bone index, parent, child; kind). Out: position, normal, color, skinIndex, skinWeight, index.

const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
function roundBox(px, py, pz, bx, by, bz, r) {
  const qx = Math.abs(px) - bx + r, qy = Math.abs(py) - by + r, qz = Math.abs(pz) - bz + r;
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0), Math.max(qz, 0)) + Math.min(Math.max(qx, Math.max(qy, qz)), 0) - r;
}
function ellip(px, py, pz, rx, ry, rz) {
  const k0 = Math.hypot(px / rx, py / ry, pz / rz), k1 = Math.hypot(px / (rx * rx), py / (ry * ry), pz / (rz * rz));
  return k1 > 0 ? (k0 * (k0 - 1)) / k1 : -Math.min(rx, ry, rz);
}

let SEGS = [];
// a bone's flesh: a capsule from a to b, tapering from r0 to r1, flatter back to front (n)
function segD(px, py, pz, S) {
  const ax = px - S.a[0], ay = py - S.a[1], az = pz - S.a[2];
  const t = clamp((ax * S.d[0] + ay * S.d[1] + az * S.d[2]) / S.len, 0, 1);
  let ox = ax - S.d[0] * S.len * t, oy = ay - S.d[1] * S.len * t, oz = az - S.d[2] * S.len * t;
  const k = (1 / S.flat - 1) * (ox * S.n[0] + oy * S.n[1] + oz * S.n[2]);
  ox += S.n[0] * k; oy += S.n[1] * k; oz += S.n[2] * k;
  return Math.hypot(ox, oy, oz) - (S.r0 + (S.r1 - S.r0) * t);
}
// the palm: a rounded block narrower at the wrist, the back domed, full at the thumb's root and along the little
// finger's edge; the wrist under it, an oval running down into the cuff
function palmD(x, y, z) {
  const t = clamp(y / 0.094, 0, 1), hw = 0.0335 + 0.0075 * smooth(0, 0.8, t);
  const u = clamp(x / hw, -1, 1);
  const zz = z > 0 ? z / (1 + 0.22 * (1 - u * u) * (0.5 + 0.5 * t)) : z / (1 + 0.06 * (1 - u * u));
  let d = roundBox(x + 0.0005, y - 0.047, zz, hw, 0.046, 0.0122, 0.0108);
  d = smin(d, ellip(x + 0.02, y - 0.03, z + 0.0085, 0.0165, 0.027, 0.0108), 0.012);
  d = smin(d, ellip(x - 0.0265, y - 0.038, z + 0.0055, 0.0098, 0.029, 0.0088), 0.01);
  // the wrist
  const rx = 0.0282, rz = 0.0192, e = (Math.hypot(x / rx, (z - 0.001) / rz) - 1) * rz;
  d = smin(d, Math.max(e, y - 0.012, -0.042 - y), 0.016);
  return d;
}
const BOX = [];
function field(x, y, z) {
  let dp = palmD(x, y, z);
  for (const S of SEGS) if (S.kind === 'meta') dp = smin(dp, segD(x, y, z, S), 0.012);
  let d = dp;
  for (const G of BOX) {
    // (a finger far from here cannot change the answer: skipped)
    const bx = Math.max(G.min[0] - x, 0, x - G.max[0]), by = Math.max(G.min[1] - y, 0, y - G.max[1]), bz = Math.max(G.min[2] - z, 0, z - G.max[2]);
    if (Math.hypot(bx, by, bz) > dp + G.k) continue;
    let df = Infinity;
    for (const S of G.segs) df = df === Infinity ? segD(x, y, z, S) : smin(df, segD(x, y, z, S), 0.0032);
    d = Math.min(d, smin(dp, df, G.k));
  }
  return d;
}
const grad = (x, y, z, e = 0.0004) => {
  const gx = field(x + e, y, z) - field(x - e, y, z), gy = field(x, y + e, z) - field(x, y - e, z), gz = field(x, y, z + e) - field(x, y, z - e);
  const l = Math.hypot(gx, gy, gz) || 1;
  return [gx / l, gy / l, gz / l];
};

self.onmessage = (ev) => {
  const { segs, cell, glove } = ev.data;
  SEGS = segs.map((S) => {
    const dx = S.b[0] - S.a[0], dy = S.b[1] - S.a[1], dz = S.b[2] - S.a[2], len = Math.hypot(dx, dy, dz);
    return { ...S, len, d: [dx / len, dy / len, dz / len] };
  });
  // the fingers and the thumb as groups, each with its bounds (for skipping)
  BOX.length = 0;
  const groups = {};
  SEGS.forEach((S) => { if (S.kind !== 'meta') (groups[S.group] = groups[S.group] || []).push(S); });
  Object.values(groups).forEach((segs2) => {
    const min = [Infinity, Infinity, Infinity], max = [-Infinity, -Infinity, -Infinity];
    segs2.forEach((S) => [S.a, S.b].forEach((p) => { for (let i = 0; i < 3; i++) { min[i] = Math.min(min[i], p[i] - S.r0 - 0.002); max[i] = Math.max(max[i], p[i] + S.r0 + 0.002); } }));
    BOX.push({ segs: segs2, min, max, k: segs2[0].kind === 'thumb' ? 0.0072 : 0.0078 });
  });

  // ---- the field on a grid round the hand
  const lo = [-0.078, -0.072, -0.06], hi = [0.056, 0.205, 0.04];
  const nx = Math.ceil((hi[0] - lo[0]) / cell) + 1, ny = Math.ceil((hi[1] - lo[1]) / cell) + 1, nz = Math.ceil((hi[2] - lo[2]) / cell) + 1;
  const F = new Float32Array(nx * ny * nz);
  const id = (i, j, k) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) F[id(i, j, k)] = field(lo[0] + i * cell, lo[1] + j * cell, lo[2] + k * cell);

  // ---- surface nets: a point in each cell the surface passes through, joined across each crossed edge
  const EDGES = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
  const CO = [[0, 0, 0], [1, 0, 0], [0, 1, 0], [1, 1, 0], [0, 0, 1], [1, 0, 1], [0, 1, 1], [1, 1, 1]];
  const cellV = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cid = (i, j, k) => i + (nx - 1) * (j + (ny - 1) * k);
  const P = [];
  const v = new Float32Array(8);
  for (let k = 0; k < nz - 1; k++) for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
    let mask = 0;
    for (let c = 0; c < 8; c++) { v[c] = F[id(i + CO[c][0], j + CO[c][1], k + CO[c][2])]; if (v[c] < 0) mask |= 1 << c; }
    if (mask === 0 || mask === 255) continue;
    let sx = 0, sy = 0, sz = 0, n = 0;
    for (const [a, b] of EDGES) {
      if ((v[a] < 0) === (v[b] < 0)) continue;
      const t = v[a] / (v[a] - v[b]);
      sx += CO[a][0] + (CO[b][0] - CO[a][0]) * t; sy += CO[a][1] + (CO[b][1] - CO[a][1]) * t; sz += CO[a][2] + (CO[b][2] - CO[a][2]) * t; n++;
    }
    cellV[cid(i, j, k)] = P.length / 3;
    P.push(lo[0] + (i + sx / n) * cell, lo[1] + (j + sy / n) * cell, lo[2] + (k + sz / n) * cell);
  }
  const nV = P.length / 3;
  // each point drawn onto the surface itself, its normal the field's own
  const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3);
  for (let q = 0; q < nV; q++) {
    let x = P[q * 3], y = P[q * 3 + 1], z = P[q * 3 + 2];
    for (let it = 0; it < 2; it++) { const d = field(x, y, z), g = grad(x, y, z); x -= g[0] * d; y -= g[1] * d; z -= g[2] * d; }
    const g = grad(x, y, z);
    pos[q * 3] = x; pos[q * 3 + 1] = y; pos[q * 3 + 2] = z;
    nor[q * 3] = g[0]; nor[q * 3 + 1] = g[1]; nor[q * 3 + 2] = g[2];
  }
  // the faces: across every grid edge the surface crosses, the four cells round it make a quad (turned to face out)
  const idx = [];
  const quad = (a, b, c, d, flip) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    // (split along the shorter diagonal)
    const dist = (p, q) => Math.hypot(pos[p * 3] - pos[q * 3], pos[p * 3 + 1] - pos[q * 3 + 1], pos[p * 3 + 2] - pos[q * 3 + 2]);
    const t = dist(a, c) <= dist(b, d) ? [a, b, c, a, c, d] : [a, b, d, b, c, d];
    if (flip) { [t[1], t[2]] = [t[2], t[1]]; [t[4], t[5]] = [t[5], t[4]]; }
    idx.push(...t);
  };
  for (let k = 1; k < nz - 1; k++) for (let j = 1; j < ny - 1; j++) for (let i = 1; i < nx - 1; i++) {
    const f0 = F[id(i, j, k)] < 0;
    if (i < nx - 1 && f0 !== (F[id(i + 1, j, k)] < 0)) quad(cellV[cid(i, j - 1, k - 1)], cellV[cid(i, j, k - 1)], cellV[cid(i, j, k)], cellV[cid(i, j - 1, k)], !f0);
    if (j < ny - 1 && f0 !== (F[id(i, j + 1, k)] < 0)) quad(cellV[cid(i - 1, j, k - 1)], cellV[cid(i - 1, j, k)], cellV[cid(i, j, k)], cellV[cid(i, j, k - 1)], !f0);
    if (k < nz - 1 && f0 !== (F[id(i, j, k + 1)] < 0)) quad(cellV[cid(i - 1, j - 1, k)], cellV[cid(i, j - 1, k)], cellV[cid(i, j, k)], cellV[cid(i - 1, j, k)], !f0);
  }
  // (make sure the faces look out: one face's turn checked against the field's normal, the rest follow it)
  {
    let agree = 0;
    for (let f = 0; f < Math.min(idx.length, 3000); f += 3) {
      const a = idx[f] * 3, b = idx[f + 1] * 3, c = idx[f + 2] * 3;
      const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
      const wx = pos[c] - pos[a], wy = pos[c + 1] - pos[a + 1], wz = pos[c + 2] - pos[a + 2];
      const cx = uy * wz - uz * wy, cy = uz * wx - ux * wz, cz = ux * wy - uy * wx;
      agree += Math.sign(cx * nor[a] + cy * nor[a + 1] + cz * nor[a + 2]);
    }
    if (agree < 0) for (let f = 0; f < idx.length; f += 3) { const t = idx[f + 1]; idx[f + 1] = idx[f + 2]; idx[f + 2] = t; }
  }

  // ---- which bones each point moves with, and its colour
  const si = new Uint16Array(nV * 4), sw = new Float32Array(nV * 4), col = new Float32Array(nV * 3);
  const lin = (c) => Math.pow(c, 2.2);
  const SKIN = { back: [0.69, 0.48, 0.37], palm: [0.8, 0.59, 0.49], knuckle: [0.62, 0.41, 0.32], nail: [0.86, 0.71, 0.65], tip: [0.94, 0.88, 0.84] };
  const TAU = 0.3;
  for (let q = 0; q < nV; q++) {
    const x = pos[q * 3], y = pos[q * 3 + 1], z = pos[q * 3 + 2];
    const nx2 = nor[q * 3], ny2 = nor[q * 3 + 1], nz2 = nor[q * 3 + 2];
    // the nearest flesh: the palm, or one of the bones
    let best = null, bestD = palmD(x, y, z), bestT = 0, bestO = null;
    let near = null, nearT = -9, nearD = Infinity; // (the nearest finger root, for the palm's side of a knuckle)
    let meta = null, metaD = Infinity;
    for (const S of SEGS) {
      const ax = x - S.a[0], ay = y - S.a[1], az = z - S.a[2];
      const tr = (ax * S.d[0] + ay * S.d[1] + az * S.d[2]) / S.len, t = clamp(tr, 0, 1);
      const ox = ax - S.d[0] * S.len * t, oy = ay - S.d[1] * S.len * t, oz = az - S.d[2] * S.len * t;
      const d = Math.hypot(ox, oy, oz) - (S.r0 + (S.r1 - S.r0) * t);
      if (d < bestD) { bestD = d; best = S; bestT = t; bestO = [ox, oy, oz]; }
      if (S.first && d < nearD) { nearD = d; near = S; nearT = tr; }
      if (S.kind === 'meta' && d < metaD) { metaD = d; meta = S; }
    }
    const w = new Map();
    const add = (b, v2) => w.set(b, (w.get(b) || 0) + v2);
    if (!best) {
      // the palm; near a knuckle it starts to go with the finger
      let fw = 0;
      if (near && nearT > -TAU && nearT <= 0 && nearD < 0.008) fw = 0.5 * (1 + nearT / TAU) * smooth(0.008, 0.002, nearD);
      // (and by the thumb's root it goes a little with the thumb)
      const mw = meta ? 0.5 * smooth(0.009, 0, metaD) : 0;
      add(0, 1 - fw - mw);
      if (fw > 0) add(near.bone, fw);
      if (mw > 0) add(meta.bone, mw);
    } else if (best.kind === 'meta') {
      // the thumb's root, in the palm: half with the palm at its heel, half with the thumb at its knuckle
      const wp = 0.5 * (1 - bestT), wc = best.child >= 0 && bestT > 1 - TAU ? 0.5 * (bestT - (1 - TAU)) / TAU : 0;
      add(0, wp);
      if (wc > 0) add(best.child, wc);
      add(best.bone, 1 - wp - wc);
    } else {
      const t = bestT;
      let wp = t < TAU ? 0.5 * (1 - t / TAU) : 0, wc = best.child >= 0 && t > 1 - TAU ? 0.5 * (t - (1 - TAU)) / TAU : 0;
      add(best.parent, wp);
      if (wc > 0) add(best.child, wc);
      add(best.bone, 1 - wp - wc);
    }
    const ws = [...w.entries()].filter(([, v2]) => v2 > 0.001).sort((a, b) => b[1] - a[1]).slice(0, 4);
    const tot = ws.reduce((s, [, v2]) => s + v2, 0) || 1;
    ws.forEach(([b, v2], k) => { si[q * 4 + k] = b; sw[q * 4 + k] = v2 / tot; });

    // the colour: the back of the hand, the palm lighter, the knuckles a touch darker, the nails, the creases
    const back = best ? best.n : [0, 0, 1];
    const dd = nx2 * back[0] + ny2 * back[1] + nz2 * back[2];
    let c = SKIN.back.map((b, k) => b + (SKIN.palm[k] - b) * smooth(0.15, -0.65, dd));
    if (best && best.kind !== 'meta' && bestT < 0.22 && dd > 0.3) c = c.map((b, k) => b + (SKIN.knuckle[k] - b) * 0.35 * (1 - bestT / 0.22) * smooth(0.3, 0.8, dd));
    if (best && best.tip && bestO) {
      const ol = Math.hypot(...bestO) || 1, on = (bestO[0] * back[0] + bestO[1] * back[1] + bestO[2] * back[2]) / ol;
      const side = Math.abs((bestO[0] * best.B[0] + bestO[1] * best.B[1] + bestO[2] * best.B[2]) / ol);
      const m = smooth(0.42, 0.56, bestT) * smooth(0.45, 0.7, on) * smooth(0.82, 0.62, side);
      const edge = smooth(0.86, 0.97, bestT);
      const nail = SKIN.nail.map((b, k) => b + (SKIN.tip[k] - b) * edge);
      c = c.map((b, k) => b + (nail[k] - b) * m);
    }
    if (glove) c = [0.86, 0.865, 0.85];
    // (enclosed places get less light: how far the field opens up along the normal)
    let ao = 0;
    for (let s = 1; s <= 4; s++) { const h = 0.0022 * s, dv = field(x + nx2 * h, y + ny2 * h, z + nz2 * h); ao += (h - Math.min(dv, h)) / (1 << s); }
    const a2 = clamp(1 - ao * 260, 0.45, 1);
    col[q * 3] = lin(c[0]) * a2; col[q * 3 + 1] = lin(c[1]) * a2; col[q * 3 + 2] = lin(c[2]) * a2;
  }
  const index = nV > 65535 ? new Uint32Array(idx) : new Uint16Array(idx);
  self.postMessage({ position: pos, normal: nor, color: col, skinIndex: si, skinWeight: sw, index }, [pos.buffer, nor.buffer, col.buffer, si.buffer, sw.buffer, index.buffer]);
};
