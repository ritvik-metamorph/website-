// The Family Wealth Picture as a house (17 Nov; the Investor Corner, both sites). The client's Notion:
// "a visual representation of all these factors through fulfillment of home", and of the calculator
// they linked, "animation sucks in this, but we need very high quality animation to reflect the result".
// So a home drawn like the vignette on a banknote (Ink is engraving on paper): hatched walls, a hatched
// roof, stone courses, a garden tree, and everything in it answers the money, moving smoothly to each
// new answer rather than jumping:
//   the foundations are the safe savings (the more saved, the deeper the stone courses);
//   the tree in the garden is the investments (it grows, and carries a little gold);
//   lit rooms are everyday spending, the garden lamps experiences, the car at the door and the wing
//     royal spending;
//   floors are added as the wealth grows against what is earned;
//   leaves blowing off the tree are unplanned money, drifting away;
//   cracks in the stone are debt.
// A chimney breathes; the leaves sway; the lamps glow. `skin` is 'light' (silver lines on the night,
// warm windows) or 'ink' (ink on paper).

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const rnd = (k) => (((Math.sin(k * 12.9898 + 78.233) * 43758.5453) % 1) + 1) % 1;

export function createHouse(canvas, { skin = 'light', reduced = false } = {}) {
  const g = canvas.getContext('2d');
  const ink = skin === 'ink';
  const LINE = ink ? '22, 32, 27' : '226, 231, 238', WARM = ink ? '205, 150, 62' : '246, 204, 128', GOLD = ink ? '150, 104, 40' : '240, 196, 138';
  // what it shows, and what it is moving towards
  const T = { found: 0.3, floors: 1, wing: 0, car: 0, lit: 0.5, lamps: 0.3, tree: 0.3, idle: 0.2, debt: 0 };
  const S = { ...T };
  let w = 1, h = 1, dpr = 1, alive = true, last = performance.now(), time = 0;
  const size = () => { const r = canvas.getBoundingClientRect(); dpr = Math.min(2, devicePixelRatio || 1); w = Math.max(1, r.width); h = Math.max(1, r.height); canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr); };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  const line = (a, lw = 1) => { g.strokeStyle = `rgba(${LINE}, ${a})`; g.lineWidth = lw; };
  const seg = (x0, y0, x1, y1) => { g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  // hatching inside a shape: parallel lines at an angle, clipped to the path the caller made
  const hatch = (clipPath, gap, ang, a) => {
    g.save(); clipPath(); g.clip();
    line(a, 0.8);
    const c = Math.cos(ang), s = Math.sin(ang), L = Math.hypot(w, h);
    for (let d = -L; d < L; d += gap) { g.beginPath(); g.moveTo(w / 2 + c * -L - s * d, h / 2 + s * -L + c * d); g.lineTo(w / 2 + c * L - s * d, h / 2 + s * L + c * d); g.stroke(); }
    g.restore();
  };
  const rectPath = (x, y, ww, hh) => () => { g.beginPath(); g.rect(x, y, ww, hh); };

  function draw() {
    const U = Math.min(w / 100, h / 78);
    const ground = h * 0.86, cx = w * 0.42;
    const BW = U * 34, FLH = U * 12.5, RH = U * 11.5, FH = U * (2.2 + 7 * S.found);
    const x0 = cx - BW / 2, base = ground - FH;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, w, h);
    g.lineCap = 'round'; g.lineJoin = 'round';

    // the ground: one engraved line, short strokes under it
    line(0.55);
    seg(w * 0.04, ground, w * 0.96, ground);
    line(0.22, 0.8);
    for (let x = w * 0.05; x < w * 0.95; x += U * 2.2) seg(x, ground + U * 0.9, x - U * 1.4, ground + U * 2.4 + rnd(x) * U);

    // ---- the wing (royal spending, once there is the wealth for it), to the left, one floor, flat-roofed
    const WW = U * 20 * S.wing;
    if (S.wing > 0.12) {
      g.globalAlpha = smooth(0.12, 0.3, S.wing);
      const wx = x0 - WW, wy = base - FLH;
      hatch(rectPath(wx, wy, WW, FLH + FH), U * 0.9, 0, 0.16);
      line(0.8); g.strokeRect(wx, wy, WW, FLH + FH);
      seg(wx - U * 0.8, wy, x0, wy); seg(wx - U * 0.8, wy - U * 1.2, wx - U * 0.8, wy); seg(wx - U * 0.8, wy - U * 1.2, x0, wy - U * 1.2); // (the parapet)
      const n = Math.max(1, Math.floor(WW / (U * 8)));
      for (let i = 0; i < n; i++) win(wx + (WW / n) * (i + 0.5) - U * 2.6, wy + FLH * 0.28, U * 5.2, FLH * 0.46, 100 + i, smooth(0.12, 0.3, S.wing));
      g.globalAlpha = 1;
    }

    // ---- the foundations: stone courses as deep as the safe savings; cracked by debt
    const rows = Math.max(1, Math.round(FH / (U * 2.2)));
    hatch(rectPath(x0 - U, base, BW + U * 2, FH), U * 1.3, 0.785, 0.12);
    line(0.75);
    g.strokeRect(x0 - U, base, BW + U * 2, FH);
    line(0.5, 0.9);
    for (let r = 0; r < rows; r++) {
      const y = base + (FH / rows) * r;
      if (r) seg(x0 - U, y, x0 + BW + U, y);
      for (let x = x0 - U + ((r % 2) ? U * 3 : U * 6); x < x0 + BW + U; x += U * 6) seg(x, y, x, y + FH / rows);
    }
    if (S.debt > 0.02) {
      // (debt: cracks running up from the ground through the stone and into the wall, more and longer
      // the deeper the debt)
      line(Math.min(1, 0.6 + S.debt), 1.4);
      const n = 1 + Math.ceil(S.debt * 4), reach = FH + FLH * (0.25 + 0.6 * S.debt);
      for (let c = 0; c < n; c++) {
        let x = x0 + BW * (0.12 + 0.76 * rnd(c + 3)), y = ground;
        g.beginPath(); g.moveTo(x, y);
        const steps = 5 + Math.floor(S.debt * 4);
        for (let k = 1; k <= steps; k++) { x += (rnd(c * 7 + k) - 0.5) * U * 2.6; y = ground - reach * (k / steps) * (0.85 + 0.3 * rnd(c + k)); g.lineTo(x, y); }
        g.stroke();
      }
    }

    // ---- the floors, drawn as they are cut: whole floors, and the next one rising as the wealth grows
    const floors = Math.max(1, S.floors);
    const bodyH = FLH * floors, top = base - bodyH;
    hatch(rectPath(x0, top, BW, bodyH), U * 0.85, 0, 0.17);
    line(0.85); g.strokeRect(x0, top, BW, bodyH);
    for (let f = 0; f < Math.ceil(floors); f++) {
      const fy = base - FLH * (f + 1), part = clamp(floors - f, 0, 1);
      if (f) { line(0.5); seg(x0, base - FLH * f, x0 + BW, base - FLH * f); }
      for (let i = 0; i < 3; i++) {
        const wx = x0 + BW * (0.18 + i * 0.32) - U * 2.7;
        if (f === 0 && i === 1) continue; // (the door's place)
        // (a window of a floor still rising appears as that floor reaches it)
        if (part < 0.55) continue;
        win(wx, fy + FLH * 0.25, U * 5.4, FLH * 0.48, f * 3 + i, smooth(0.55, 0.85, part));
      }
    }
    // the door, lit when there are evenings out to come home from
    const dw = U * 5.6, dh = FLH * 0.72, dx = cx - dw / 2, dy = base - dh;
    g.beginPath(); g.moveTo(dx, base); g.lineTo(dx, dy + dw / 2); g.arc(cx, dy + dw / 2, dw / 2, Math.PI, 0); g.lineTo(dx + dw, base);
    g.fillStyle = `rgba(${WARM}, ${0.15 + 0.55 * S.lamps})`; g.fill();
    line(0.9); g.stroke();
    // the roof: hatched, sitting on whatever floors there are; its chimney breathing
    const ov = U * 2.2;
    const roof = () => { g.beginPath(); g.moveTo(x0 - ov, top); g.lineTo(cx, top - RH); g.lineTo(x0 + BW + ov, top); g.closePath(); };
    hatch(roof, U * 0.95, -0.62, 0.32);
    line(0.9); roof(); g.stroke();
    const chx = x0 + BW * 0.72, chy = top - RH * 0.55;
    hatch(rectPath(chx, chy - U * 4, U * 3.2, U * 6), U * 0.8, 0, 0.3);
    line(0.85); g.strokeRect(chx, chy - U * 4, U * 3.2, U * 6);
    if (!reduced) {
      line(0.22, 1);
      for (let k = 0; k < 3; k++) {
        const p = ((time * 0.12 + k / 3) % 1), sx = chx + U * 1.6, sy = chy - U * 4 - p * U * 16;
        g.globalAlpha = Math.sin(Math.PI * p) * 0.8;
        g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + U * 2, sy - U * 2, sx - U * 2, sy - U * 4, sx + U * 1.5 * Math.sin(time + k), sy - U * 6); g.stroke();
      }
      g.globalAlpha = 1;
    }

    // ---- the garden: the tree (investments), its leaves drifting off (unplanned money), the lamps
    const tx = x0 + BW + U * 20, tH = U * (7 + 40 * S.tree);
    let leafN = 0;
    const branch = (x, y, len, ang, depth, id) => {
      const sway = reduced ? 0 : Math.sin(time * 0.9 + id * 0.7) * 0.03 * (6 - depth);
      const x2 = x + Math.cos(ang + sway) * len, y2 = y + Math.sin(ang + sway) * len;
      line(0.75, Math.max(0.7, depth * 0.55 * (0.6 + S.tree)));
      seg(x, y, x2, y2);
      if (depth <= 0 || len < U * 0.9) {
        // leaves: a few grains at each tip, some of them gold
        for (let k = 0; k < 5; k++) {
          const lx = x2 + (rnd(id * 11 + k) - 0.5) * U * 3.2, ly = y2 + (rnd(id * 13 + k) - 0.5) * U * 2.6;
          const goldLeaf = rnd(id * 17 + k) < 0.22;
          g.fillStyle = goldLeaf ? `rgba(${GOLD}, .95)` : `rgba(${LINE}, .7)`;
          const s = U * (0.45 + 0.35 * rnd(id + k));
          g.fillRect(lx, ly, s, s);
          leafN++;
        }
        return;
      }
      const spread = 0.42 + 0.18 * rnd(id);
      branch(x2, y2, len * (0.7 + 0.08 * rnd(id + 1)), ang - spread, depth - 1, id * 2 + 1);
      branch(x2, y2, len * (0.7 + 0.08 * rnd(id + 2)), ang + spread * 0.9, depth - 1, id * 2 + 2);
      if (depth > 3 && rnd(id + 5) > 0.55) branch(x2, y2, len * 0.55, ang + (rnd(id + 6) - 0.5) * 0.4, depth - 2, id * 2 + 3);
    };
    const depth = 3 + Math.round(4 * S.tree);
    // (the trunk: a few lines side by side)
    line(0.8, 1);
    for (let k = -1; k <= 1; k++) seg(tx + k * U * 0.5 * (0.5 + S.tree), ground, tx + k * U * 0.3, ground - tH * 0.38);
    branch(tx, ground - tH * 0.36, tH * 0.3, -Math.PI / 2, depth, 1);
    // unplanned money: leaves let go, blowing away to the right
    if (!reduced) {
      const n = Math.round(S.idle * 14);
      for (let k = 0; k < n; k++) {
        const p = (time * 0.07 + rnd(k + 40)) % 1;
        const lx = tx + (rnd(k + 9) - 0.3) * U * 10 + p * w * 0.32, ly = ground - tH * (0.75 - 0.35 * rnd(k)) + p * tH * 0.5 + Math.sin(time * 2 + k) * U;
        g.save(); g.translate(lx, ly); g.rotate(time * 1.5 + k);
        g.fillStyle = `rgba(${rnd(k) < 0.3 ? GOLD : LINE}, ${(Math.sin(Math.PI * p) * 0.8).toFixed(3)})`;
        g.beginPath(); g.ellipse(0, 0, U * 0.9, U * 0.45, 0, 0, TAU); g.fill();
        g.restore();
      }
    }
    // the lamps along the path: one lit for each share of experiences
    const lampN = 6, lit = Math.round(S.lamps * lampN);
    for (let k = 0; k < lampN; k++) {
      const lx = cx + BW * 0.6 + k * U * 6.2 - U * 2, top2 = ground - U * 5.5;
      line(0.55, 0.9); seg(lx, ground, lx, top2);
      const on = k < lit;
      g.beginPath(); g.arc(lx, top2 - U * 0.8, U * 0.8, 0, TAU);
      if (on) {
        const flick = reduced ? 1 : 0.85 + 0.15 * Math.sin(time * 3 + k * 1.7);
        if (!ink) { g.shadowColor = `rgba(${WARM}, .9)`; g.shadowBlur = U * 3; }
        g.fillStyle = `rgba(${WARM}, ${(0.95 * flick).toFixed(3)})`; g.fill();
        g.shadowBlur = 0;
      }
      line(0.7, 0.8); g.stroke();
    }
    // the car at the door (royal spending)
    if (S.car > 0.02) {
      g.globalAlpha = S.car;
      const kx = x0 - U * 4 - U * 16, ky = ground;
      const body = () => { g.beginPath(); g.moveTo(kx, ky - U * 2); g.lineTo(kx, ky - U * 4.6); g.lineTo(kx + U * 3.5, ky - U * 5); g.lineTo(kx + U * 6, ky - U * 7.4); g.lineTo(kx + U * 12, ky - U * 7.4); g.lineTo(kx + U * 14.5, ky - U * 5); g.lineTo(kx + U * 17, ky - U * 4.6); g.lineTo(kx + U * 17, ky - U * 2); g.closePath(); };
      hatch(body, U * 0.7, 0, 0.3);
      line(0.9); body(); g.stroke();
      seg(kx + U * 6.6, ky - U * 7, kx + U * 6.6, ky - U * 5.1); seg(kx + U * 6.6, ky - U * 5.1, kx + U * 13.8, ky - U * 5.1);
      for (const wx of [kx + U * 4, kx + U * 13]) { g.beginPath(); g.arc(wx, ky - U * 1.6, U * 1.6, 0, TAU); g.fillStyle = ink ? '#f2f3ef' : '#0a101c'; g.fill(); line(0.9); g.stroke(); }
      g.globalAlpha = 1;
    }
    void leafN;
  }
  // a window: framed and barred; lit, it glows warm (its share of the everyday spending)
  function win(x, y, ww, hh, id, show = 1) {
    if (show <= 0.01) return;
    g.globalAlpha = show;
    const on = rnd(id + 0.5) < S.lit;
    g.fillStyle = on ? `rgba(${WARM}, ${ink ? 0.55 : 0.88})` : (ink ? 'rgba(242, 243, 239, .9)' : 'rgba(5, 7, 9, .85)');
    if (on && !ink) { g.shadowColor = `rgba(${WARM}, .7)`; g.shadowBlur = ww * 0.6; }
    g.fillRect(x, y, ww, hh);
    g.shadowBlur = 0;
    line(0.9); g.strokeRect(x, y, ww, hh);
    line(0.7, 0.8); g.beginPath(); g.moveTo(x + ww / 2, y); g.lineTo(x + ww / 2, y + hh); g.moveTo(x, y + hh * 0.45); g.lineTo(x + ww, y + hh * 0.45); g.stroke();
    g.globalAlpha = 1;
  }

  function frame(now) {
    if (!alive) return;
    requestAnimationFrame(frame);
    const r = canvas.getBoundingClientRect();
    if (r.bottom < 0 || r.top > innerHeight) { last = now; return; }
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!reduced) time += dt;
    // (every part eases to its new answer; nothing jumps)
    const k = reduced ? 1 : Math.min(1, dt * 2.6);
    for (const key in T) S[key] += (T[key] - S[key]) * k;
    draw();
  }
  requestAnimationFrame(frame);

  return {
    // from a picture of the money (js/wealth-model.js picture()) and how the spending divides
    show(p, mix, earn) {
      const per = (v) => v / Math.max(1, earn);
      const wealthX = per(p.wealth);
      T.found = clamp(per(p.safe) / 6, 0.05, 1);
      T.floors = 1 + smooth(2, 4.5, wealthX) + smooth(6.5, 10, wealthX);
      T.wing = smooth(0.14, 0.32, mix.royal) * smooth(3, 7, wealthX);
      T.car = smooth(0.08, 0.16, mix.royal);
      T.lit = clamp(0.25 + mix.utility * 0.9, 0.2, 1);
      T.lamps = clamp(mix.experience * 2.4, 0, 1);
      T.tree = clamp(Math.sqrt(Math.max(0, per(p.invested))) / 3.2, 0.06, 1);
      T.idle = clamp(per(p.idle) / 4, 0, 1);
      T.debt = clamp(per(p.debt) / 3, 0, 1);
    },
    destroy() { alive = false; ro.disconnect(); },
  };
}
