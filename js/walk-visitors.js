// The walk's visitors (21 Nov): a few people already in the hall, seen from behind and a little out of focus, lit the
// way the room lights them (the dawn gallery's figures, js/corner-museum.js, which the user loved). Each is a picture
// drawn in code once, stood on the floor facing the art; they stand where they never come between you and a piece.
// The user: only if they do not make it heavy; they are three flat pictures.

export function soften(src, k) {
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

export const PERSON_TOP = 0.08, PERSON_H = 0.9; // the figure's share of its picture, with room above for its blur
export function person(kind = 'coat', blur = 22, W = 360, Hc = 800, tint = { rim: '214, 228, 255', top: '236, 242, 255' }) {
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
