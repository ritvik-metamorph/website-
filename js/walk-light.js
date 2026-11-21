// The walk's light, made real (21 Nov, later; two samples for the user to choose from, behind ?wklight=):
//   ?wklight=real  the white cube, made real: the general light lowered so the art is the brightest thing; each piece in
//                  a spot from the track (its pool sharp at the top, falling off down the wall, its canvas's shadow under
//                  it from its own lamp); washers between the pieces; the slots and the butterfly as lit glass; your eyes
//                  adjusting from the dark lobby into the bright hall
//   ?wklight=dark  framed in the dark: the walls down to the site's night, each piece in a framing projector cut exactly
//                  to its edges (so the art seems lit from inside), its label in a small light of its own, the butterfly
//                  a dim glow overhead, the door's crack the brightest thing in the room
// Still no lights in the room: every lamp is a few numbers, worked out on the walls, floor and ceiling by their shaders
// in linear light and shown through a film's shoulder (three's neutral curve, without its toe). The art is never lit.
import * as THREE from '../assets/vendor/three.module.min.js';

export const NL = 20; // the lamps: pieces, washers, the door, the laylight, the lobby's lettering, each piece's light thrown back

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lin = (c) => Math.pow(c, 2.2);
const D2R = Math.PI / 180;

export function roomLight(mode, K) {
  const { HX, H, Z_IN, Z_END, Z_LOBBY, GATE, DOOR, SLOT, BF, PC, bflyTex } = K;
  const dark = mode === 'dark';
  const F = (v) => Number(v).toFixed(4);
  const GW = GATE.w / 2, GH = GATE.h, zA = DOOR.z + DOOR.w / 2, zB = DOOR.z - DOOR.w / 2;
  // how each direction is set: the general light, the paints (sRGB), the floor's polish, the glass, the eyes' adjusting
  const S = dark ? {
    amb: [0.07, 0.078, 0.096], lobbyAmb: 0.7, floor: [0.075, 0.078, 0.088], F0: 0.05, gloss: 1.0,
    ceil: [0.07, 0.075, 0.09], ceilK: [0.05, 0.0, 0.35], slot: [0.0, 0.0, 0.0], glass: [0.17, 0.21, 0.31],
    gate: 0.12, vest: 2.6, blade: 70, under: 0.9, expoLobby: 1.1, art: 1.0,
  } : {
    amb: [0.25, 0.26, 0.28], lobbyAmb: 0.22, floor: [0.2, 0.207, 0.222], F0: 0.04, gloss: 0.85,
    ceil: [0.12, 0.13, 0.16], ceilK: [0.45, 0.7, 0.25], slot: [4.0, 4.0, 4.1], glass: [1.05, 1.09, 1.18],
    gate: 0.55, vest: 2.6, blade: 46, under: 0.6, expoLobby: 1.45, art: 1.0,
  };
  const v4 = (w = 0) => Array.from({ length: NL }, () => new THREE.Vector4(0, 0, 0, w));
  const LT = { p: { value: v4() }, d: { value: v4() }, c: { value: v4() }, r: { value: v4() }, n: { value: v4(-1) } };
  const expo = { value: 1 };
  const common = () => ({
    uLp: LT.p, uLd: LT.d, uLc: LT.c, uLr: LT.r, uLn: LT.n, uPc: PC.c, uPcN: PC.n, uPcCol: PC.col, uExpo: expo,
    uAmb: { value: new THREE.Vector3(...S.amb) },
  });

  const GLSL = `
    #define NL ${NL}
    uniform vec4 uLp[NL]; uniform vec4 uLd[NL]; uniform vec4 uLc[NL]; uniform vec4 uLr[NL]; uniform vec4 uLn[NL];
    uniform vec4 uPc[3]; uniform vec4 uPcN[3]; uniform vec3 uPcCol[3];
    uniform vec3 uAmb; uniform float uExpo;
    varying vec3 vW; varying vec3 vN;
    float hash(vec2 q) { return fract(sin(dot(q, vec2(12.9898, 78.233))) * 43758.5453); }
    vec3 lin(vec3 c) { return pow(c, vec3(2.2)); }
    // the film: straight up to a point, then a soft shoulder, so a bright wall rolls off rather than clips
    vec3 display(vec3 c) {
      c *= uExpo;
      float peak = max(c.r, max(c.g, c.b));
      if (peak > 0.76) {
        float np = 1.0 - 0.0576 / (peak - 0.52);
        c *= np / peak;
        c = mix(c, vec3(np), 1.0 - 1.0 / (0.15 * (peak - np) + 1.0));
      }
      return pow(max(c, 0.0), vec3(1.0 / 2.2)) + (hash(gl_FragCoord.xy) - 0.5) / 255.0;
    }
    // the paint: ${dark ? 'the night, a little lighter low down' : 'paper up past the art, then into the dawn blue and the night under the ceiling'}
    vec3 paint(float y) {
      float t = clamp(y / ${F(H)}, 0.0, 1.0);
      ${dark
        ? 'return lin(mix(vec3(0.165, 0.18, 0.215), vec3(0.105, 0.12, 0.155), smoothstep(0.25, 1.0, t)));'
        : `vec3 c = mix(vec3(0.93, 0.936, 0.925), vec3(0.905, 0.912, 0.916), smoothstep(0.0, 0.5, t));
      c = mix(c, vec3(0.56, 0.61, 0.7), smoothstep(0.6, 0.82, t));
      c = mix(c, vec3(0.149, 0.216, 0.353), smoothstep(0.78, 0.94, t));
      return lin(mix(c, vec3(0.07, 0.1, 0.17), smoothstep(0.92, 1.0, t)));`}
    }
    vec3 lobbyPaint(float y) { return lin(${dark ? 'vec3(0.062, 0.07, 0.094)' : 'vec3(0.105, 0.125, 0.18)'}); }
    // the general light: a little more low down (the floor gives some back), less under the dark ceiling
    float ambShape(vec3 p) { return (0.82 + 0.18 * smoothstep(0.0, 1.4, p.y)) * (1.0 - 0.45 * smoothstep(2.8, ${F(H)}, p.y)); }
    // where two surfaces meet, less of it reaches
    float cornerAO(vec3 p, vec3 n) {
      float a = (1.0 - 0.45 * exp(-p.y / 0.09)) * (1.0 - 0.35 * exp(-(${F(H)} - p.y) / 0.12));
      float e = abs(n.x) > 0.5 ? p.z - ${F(Z_END)} : abs(n.z) > 0.5 ? ${F(HX)} - abs(p.x) : 9.0;
      return a * (1.0 - 0.35 * exp(-max(e, 0.0) / 0.2));
    }
    vec3 tanOf(vec3 n) { return normalize(cross(vec3(0.0, 1.0, 0.0), n)); }
    // the distance from p, on a wall, to a rectangle on it (negative inside)
    float rectD(vec3 p, vec3 c, vec3 n, float hw, float hh) {
      vec2 q = vec2(abs(dot(p - c, tanOf(n))) - hw, abs(p.y - c.y) - hh);
      return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
    }
    // a canvas's shadow on its wall, from its own lamp: where the ray to the lamp passes through the canvas's face
    float canvasShadow(vec3 p, vec3 n, vec3 L, int j) {
      for (int k = 0; k < 3; k++) {
        if (k != j) continue;
        vec4 C = uPc[k], N = uPcN[k];
        float dc = dot(C.xyz - p, N.xyz);
        if (C.w <= 0.0 || dot(n, N.xyz) < 0.9 || dc <= 0.0 || dc > 0.2) return 1.0;
        float dl = dot(L - p, N.xyz);
        if (dl <= dc) return 1.0;
        return smoothstep(-0.004, 0.004, rectD(p + (L - p) * (dc / dl), C.xyz, N.xyz, C.w, N.w));
      }
      return 1.0;
    }
    // the canvas close against its wall: a little dark all round it
    float canvasAO(vec3 p, vec3 n) {
      float o = 1.0;
      for (int k = 0; k < 3; k++) {
        vec4 C = uPc[k], N = uPcN[k];
        float dc = dot(C.xyz - p, N.xyz);
        if (C.w <= 0.0 || dot(n, N.xyz) < 0.9 || dc <= 0.0 || dc > 0.2) continue;
        o *= 1.0 - 0.5 * exp(-max(rectD(p, C.xyz, N.xyz, C.w, N.w), 0.0) / 0.022);
      }
      return o;
    }
    // the light at p (its normal n): the general light (times amb), and every lamp
    vec3 lightAt(vec3 p, vec3 n, float amb) {
      vec3 E = uAmb * amb;
      for (int i = 0; i < NL; i++) {
        vec4 P = uLp[i];
        if (P.w <= 0.0) continue;
        vec3 d = P.xyz - p;
        float r2 = max(dot(d, d), 0.04);
        vec3 l = d * inversesqrt(r2);
        float ndl = dot(n, l);
        if (ndl <= 0.0) continue;
        vec4 D = uLd[i], C = uLc[i], Rn = uLn[i];
        float k;
        if (D.w < -2.5) {
          // a framing projector: its beam cut to a rectangle, a little stray light round the cut
          vec4 R = uLr[i];
          if (dot(n, Rn.xyz) < 0.9 || abs(dot(p - R.xyz, Rn.xyz)) > 0.3) continue;
          float dd = rectD(p, R.xyz, Rn.xyz, R.w, Rn.w), o = max(dd, 0.0);
          float e = max(D.x, 0.0025);
          k = 1.0 - smoothstep(-e, e, dd) + C.w * (0.5 * exp(-o / 0.045) + 0.1 * exp(-o / 0.5));
        } else if (D.w < -1.5) {
          // a glowing surface: the laylight, a piece's light thrown back
          k = max(dot(-l, D.xyz), 0.0);
        } else {
          // a spot: its cone, and the canvas it is aimed at casting its shadow
          k = smoothstep(D.w, C.w, dot(-l, D.xyz));
          k *= k;
          if (k > 0.0 && Rn.w >= 0.0) k *= canvasShadow(p, n, P.xyz, int(Rn.w + 0.5));
        }
        E += C.rgb * (P.w * k * ndl / r2);
      }
      return E;
    }
    // the hall's light through the doorway, on the lobby (the doorway as a glowing rectangle)
    float edgeF(vec3 a, vec3 b, vec3 n) { vec3 x = cross(a, b); float s = length(x); return s < 1e-5 ? 0.0 : acos(clamp(dot(a, b), -1.0, 1.0)) * dot(x, n) / s; }
    float gateLight(vec3 p, vec3 n) {
      if (p.z > ${F(Z_IN + 0.16)}) {
        vec3 a = normalize(vec3(-${F(GW)}, 0.0, ${F(Z_IN)}) - p), b = normalize(vec3(${F(GW)}, 0.0, ${F(Z_IN)}) - p);
        vec3 c = normalize(vec3(${F(GW)}, ${F(GH)}, ${F(Z_IN)}) - p), e = normalize(vec3(-${F(GW)}, ${F(GH)}, ${F(Z_IN)}) - p);
        return abs(edgeF(a, b, n) + edgeF(b, c, n) + edgeF(c, e, n) + edgeF(e, a, n)) / 6.2832;
      }
      // (inside the doorway's own depth: its sides catch the hall's light, more on the hall's side)
      if (p.z > ${F(Z_IN - 0.16)} && abs(p.x) < ${F(GW + 0.02)} && p.y < ${F(GH + 0.02)}) return 0.3 * smoothstep(${F(Z_IN + 0.16)}, ${F(Z_IN - 0.16)}, p.z);
      return 0.0;
    }
  `;
  const VERT = 'varying vec3 vW; varying vec3 vN; varying vec2 vUv; void main() { vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }';
  const mat = (uniforms, body, extra = {}) => new THREE.ShaderMaterial({ uniforms: { ...common(), ...uniforms }, vertexShader: VERT, fragmentShader: `${GLSL}\nvarying vec2 vUv;\n${body}`, ...extra });

  // ---- the walls (the hall's, and the lobby's night)
  const wallMat = (lobby) => mat({ uGate: { value: S.gate }, uK: { value: lobby ? S.lobbyAmb : 1 } }, `
    uniform float uGate, uK;
    void main() {
      vec3 n = normalize(vN), p = vW;
      float cao = canvasAO(p, n);
      vec3 E = lightAt(p, n, ambShape(p) * cornerAO(p, n) * cao * uK) * (0.6 + 0.4 * cao);
      E += uGate * gateLight(p, n);
      gl_FragColor = vec4(display(${lobby ? 'lobbyPaint' : 'paint'}(p.y) * E), 1.0);
    }`);
  const wall = wallMat(false), lobby = wallMat(true);

  // ---- the floor: polished, sawn into bays; the lamps' spill, the doorway's light, the door's light, and what it reflects
  const floor = mat({
    uGate: { value: S.gate }, uVest: { value: S.vest }, uBlade: { value: S.blade }, uUnder: { value: S.under }, uDoor: { value: 0 }, uGlow: { value: 0 },
    uFloor: { value: new THREE.Vector3(...S.floor.map(lin)) }, uFl: { value: new THREE.Vector4(S.F0, S.gloss, S.art, 0) },
    uSlotL: { value: new THREE.Vector3(...S.slot) }, uGlassL: { value: new THREE.Vector3(...S.glass) }, uBfly: { value: bflyTex },
    uLobbyK: { value: S.lobbyAmb }, uArt0: { value: null }, uArt1: { value: null }, uArt2: { value: null }, uArtOn: { value: new THREE.Vector3() },
  }, `
    uniform float uGate, uVest, uBlade, uUnder, uDoor, uGlow, uLobbyK; uniform vec3 uFloor, uSlotL, uGlassL, uArtOn; uniform vec4 uFl; uniform sampler2D uBfly, uArt0, uArt1, uArt2;
    // a piece's own picture, read softly (the floor is polished, not a mirror): its level of detail set by hand, so it
    // holds wherever it is read
    vec3 artAt(int i, vec2 uv, float lod) {
      if (i == 0) return textureLod(uArt0, uv, lod).rgb;
      if (i == 1) return textureLod(uArt1, uv, lod).rgb;
      return textureLod(uArt2, uv, lod).rgb;
    }
    float floorAO(vec3 p) {
      float d = 9.0, ax = ${F(HX)} - abs(p.x);
      if (p.z < ${F(Z_IN - 0.15)}) { d = min(ax, p.z - ${F(Z_END)}); if (abs(p.x) > ${F(GW)}) d = min(d, ${F(Z_IN - 0.15)} - p.z); }
      else if (p.z > ${F(Z_IN + 0.15)}) { d = min(ax, ${F(Z_LOBBY)} - p.z); if (abs(p.x) > ${F(GW)}) d = min(d, p.z - ${F(Z_IN + 0.15)}); }
      else d = ${F(GW)} - abs(p.x);
      return 1.0 - 0.5 * exp(-max(d, 0.0) / 0.1);
    }
    // the light from beyond the door: a line under it; once it opens, a blade across the floor
    vec3 doorLight(vec3 p) {
      float zin = smoothstep(${F(zB - 0.02)}, ${F(zB + 0.02)}, p.z) * (1.0 - smoothstep(${F(zA - 0.02)}, ${F(zA + 0.02)}, p.z));
      float E = uVest * uUnder * exp(-max(p.x + ${F(HX)}, 0.0) / 0.035) * zin;
      if (uDoor > 0.001 && p.x > -${F(HX)}) {
        vec2 S = vec2(-${F(HX + 2.0)}, ${F(DOOR.z - 0.25)}), r = p.xz - S;
        float hx = -${F(HX + 0.02)};
        float zc = S.y + r.y * (hx - S.x) / r.x;
        float hole = smoothstep(${F(zB - 0.004)}, ${F(zB + 0.004)}, zc) * (1.0 - smoothstep(${F(zA - 0.004)}, ${F(zA + 0.004)}, zc));
        vec2 s = vec2(-sin(uDoor), -cos(uDoor)) * ${F(DOOR.w)}, hs = vec2(hx, ${F(zA)}) - S;
        float v = (hs.x * r.y - hs.y * r.x) / (r.x * s.y - r.y * s.x);
        vec3 L = vec3(S.x, 1.7, S.y) - p;
        float r2 = dot(L, L);
        E += uVest * uBlade * hole * smoothstep(1.0, 1.012, v) * (L.y * inversesqrt(r2)) / r2;
      }
      return vec3(1.0, 0.99, 0.97) * E;
    }
    // what the polished floor shows: the walls and their light, each piece (its own picture, softened, once it has come;
    // its colour till then), the slots, the laylight
    vec3 reflOf(vec3 p, vec3 R) {
      float see = 1.0;
      if (p.z > ${F(Z_IN + 0.15)}) {
        if (R.z > -1e-3) return vec3(0.0);
        float tg = (${F(Z_IN + 0.15)} - p.z) / R.z, e = 0.01 + 0.02 * tg;
        vec3 g = p + R * tg;
        see = (1.0 - smoothstep(${F(GW)} - e, ${F(GW)} + e, abs(g.x))) * (1.0 - smoothstep(${F(GH)} - e, ${F(GH)} + e, g.y));
        if (see <= 0.0) return vec3(0.0);
      }
      vec3 refl = vec3(0.0);
      float tx = abs(R.x) > 1e-4 ? ((R.x > 0.0 ? ${F(HX)} : -${F(HX)}) - p.x) / R.x : 1e5;
      float tz = R.z < -1e-4 ? (${F(Z_END)} - p.z) / R.z : 1e5;
      float t = min(tx, tz);
      vec3 q = p + R * t;
      if (t > 0.0 && t < 60.0 && q.y < ${F(H)} && q.z < ${F(Z_IN)}) {
        vec3 nq = tx < tz ? vec3(-sign(R.x), 0.0, 0.0) : vec3(0.0, 0.0, 1.0);
        refl = paint(q.y) * lightAt(q, nq, ambShape(q) * cornerAO(q, nq)) * exp(-t * 0.045);
      }
      for (int i = 0; i < 3; i++) {
        vec3 n = uPcN[i].xyz;
        float dr = dot(R, n);
        if (dr >= -1e-3 || uPc[i].w <= 0.0) continue;
        float tt = dot(uPc[i].xyz - p, n) / dr;
        if (tt <= 0.0) continue;
        vec3 h = p + R * tt;
        float a = dot(h - uPc[i].xyz, tanOf(n)), b = h.y - uPc[i].y, s = 0.02 + 0.03 * tt * (1.1 - uFl.y);
        float m = (1.0 - smoothstep(uPc[i].w - s, uPc[i].w + s, abs(a))) * (1.0 - smoothstep(uPcN[i].w - s, uPcN[i].w + s, abs(b)));
        if (m <= 0.001) continue;
        vec3 art = lin(uPcCol[i]);
        float on = i == 0 ? uArtOn.x : i == 1 ? uArtOn.y : uArtOn.z;
        if (on > 0.5) art = artAt(i, clamp(vec2(0.5 + 0.5 * a / uPc[i].w, 0.5 + 0.5 * b / uPcN[i].w), 0.0, 1.0), 2.2 + 1.3 * log2(1.0 + tt) + 3.0 * (1.0 - uFl.y));
        refl = mix(refl, art * uFl.z / max(uExpo, 0.1), m);
      }
      float tc = (${F(H)} - p.y) / max(R.y, 1e-3);
      vec3 cp = p + R * tc;
      float so = 0.02 + 0.025 * tc * (1.1 - uFl.y);
      float slot = (1.0 - smoothstep(0.038 - so, 0.038 + so, abs(abs(cp.x) - ${F(SLOT)}))) * step(${F(Z_END + 0.3)}, cp.z) * step(cp.z, ${F(Z_IN - 0.3)});
      refl += uSlotL * slot * 0.5 / (1.0 + so * 10.0);
      vec2 bu = vec2(0.5 - (cp.x - ${F(BF.x)}) / ${F(BF.w)}, 0.5 - (cp.z - ${F(BF.z)}) / ${F(BF.d)});
      // (faded towards the edges of its picture, so a softened reflection never shows the square it is drawn in)
      vec2 be = min(bu, 1.0 - bu);
      if (be.x > 0.0 && be.y > 0.0) refl += uGlassL * texture2D(uBfly, bu, min(so * 30.0, 6.0)).a * smoothstep(0.0, 0.07, be.x) * smoothstep(0.0, 0.1, be.y) / (1.0 + so * 6.0);
      return refl * see;
    }
    void main() {
      vec3 p = vW, n = vec3(0.0, 1.0, 0.0);
      // (beyond the door: only light)
      if (p.x < -${F(HX + 0.015)}) { gl_FragColor = vec4(display(vec3(uVest * 0.4)), 1.0); return; }
      float ao = floorAO(p);
      vec3 E = lightAt(p, n, 0.9 * ao * (p.z > ${F(Z_IN + 0.15)} ? uLobbyK : 1.0)) * (0.7 + 0.3 * ao);
      E += uGate * gateLight(p, n) + doorLight(p);
      // the saw cuts between the bays (faded out where they are finer than a pixel)
      vec2 g = abs(fract(vec2(p.x, p.z - ${F(Z_IN)}) / 1.8 + 0.5) - 0.5) * 1.8, fw = fwidth(p.xz) + 1e-5;
      vec2 jl = 1.0 - smoothstep(vec2(0.0015), vec2(0.0015) + fw * 1.5, g);
      float joint = max(jl.x, jl.y) * (1.0 - smoothstep(0.004, 0.02, max(fw.x, fw.y)));
      vec3 c = uFloor * E * (1.0 - 0.3 * joint);
      vec3 V = normalize(p - cameraPosition), R = reflect(V, n);
      float fres = uFl.x + (1.0 - uFl.x) * pow(1.0 - clamp(R.y, 0.0, 1.0), 5.0);
      c += reflOf(p, R) * fres * uFl.y * (1.0 - 0.6 * joint) * ao;
      gl_FragColor = vec4(display(c), 1.0);
    }`);

  // ---- the ceiling: dark; the walls' light gathered at their tops, a little round the slots and the laylight
  const ceil = mat({ uCeil: { value: new THREE.Vector3(...S.ceil.map(lin)) }, uCeilK: { value: new THREE.Vector3(...S.ceilK) } }, `
    uniform vec3 uCeil, uCeilK;
    void main() {
      vec3 p = vW;
      float hall = step(p.z, ${F(Z_IN - 0.15)}), ds = abs(abs(p.x) - ${F(SLOT)});
      float zin = smoothstep(${F(Z_END + 0.2)}, ${F(Z_END + 0.5)}, p.z) * (1.0 - smoothstep(${F(Z_IN - 0.5)}, ${F(Z_IN - 0.2)}, p.z));
      vec2 bq = vec2((p.x - ${F(BF.x)}) / ${F(BF.w * 0.6)}, (p.z - ${F(BF.z)}) / ${F(BF.d * 0.6)});
      vec3 E = uAmb * (hall > 0.5 ? 0.4 : 0.12)
        + vec3(uCeilK.x * exp(-(${F(HX)} - abs(p.x)) / 0.5) * hall + uCeilK.y * exp(-ds * ds / 0.025) * zin + uCeilK.z * exp(-dot(bq, bq) * 1.4));
      gl_FragColor = vec4(display(uCeil * E), 1.0);
    }`);

  // ---- the light slots' lenses: brightest down their middle
  const slot = mat({ uSlotL: { value: new THREE.Vector3(...S.slot) } }, `
    uniform vec3 uSlotL;
    void main() { gl_FragColor = vec4(display(uSlotL * (0.55 + 0.45 * sin(3.1416 * vUv.x)) + ${dark ? 'vec3(0.0006)' : 'vec3(0.0)'}), 1.0); }`);

  // ---- the butterfly laylight: frosted glass in its net, lit from above (brighter under the lamps over each wing)
  const glass = mat({ uMap: { value: bflyTex }, uGlassL: { value: new THREE.Vector3(...S.glass) } }, `
    uniform sampler2D uMap; uniform vec3 uGlassL;
    void main() {
      float a = texture2D(uMap, vUv).a;
      if (a < 0.02) discard;
      vec2 q = (vUv - 0.5) * vec2(${F(BF.w)}, ${F(BF.d)});
      vec2 q1 = q - vec2(0.62, 0.12), q2 = q + vec2(0.62, -0.12), q3 = q - vec2(0.0, -0.05);
      float b = 0.42 + 0.62 * exp(-dot(q1, q1) / 0.2) + 0.62 * exp(-dot(q2, q2) / 0.2) + 0.2 * exp(-dot(q3, q3) / 0.35);
      // (each pane brightest in its middle, darker towards the leading that holds it)
      b *= mix(0.45, 1.0, smoothstep(0.5, 0.97, texture2D(uMap, vUv, 3.0).a));
      gl_FragColor = vec4(display(uGlassL * b), a);
    }`, { transparent: true, depthWrite: false });

  // ================================================================ the lamps
  let n = 0;
  const WARM = [1.0, 0.962, 0.915], COOL = [0.9, 0.95, 1.0];
  const add = (pos, I, dir, w, col, cw, r, rn) => {
    const i = n++;
    if (i >= NL) return -1;
    LT.p.value[i].set(pos.x, pos.y, pos.z, I);
    LT.d.value[i].set(dir.x, dir.y, dir.z, w);
    LT.c.value[i].set(col[0], col[1], col[2], cw);
    if (r) LT.r.value[i].copy(r);
    if (rn) LT.n.value[i].copy(rn);
    return i;
  };
  // a spot from pos aimed at a point on a surface (its normal nAt), giving E there; its beam's outer and inner half angles
  const spot = (pos, at, nAt, outer, inner, E, col = WARM, shadow = -1) => {
    const d = at.clone().sub(pos), r2 = d.lengthSq();
    d.normalize();
    return add(pos, (E * r2) / Math.max(0.05, -d.dot(nAt)), d, Math.cos(outer), col, Math.cos(inner), null, new THREE.Vector4(0, 0, 0, shadow));
  };
  const glow = (pos, dir, I, col) => add(pos, I, dir, -2, col, 0, null, null);
  // a framing projector from pos onto a rectangle (centre c, normal nr, half sizes), giving E there, with a halo; soft:
  // how soft its cut is (a piece's is cut to the millimetre; a label's is a small soft light)
  const frame = (pos, c, nr, hw, hh, E, halo, col = WARM, soft = 0) => {
    const d = c.clone().sub(pos), r2 = d.lengthSq();
    d.normalize();
    return add(pos, (E * r2) / Math.max(0.05, -d.dot(nr)), V(soft, 0, 0), -3, col, halo, new THREE.Vector4(c.x, c.y, c.z, hw), new THREE.Vector4(nr.x, nr.y, nr.z, hh));
  };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);

  // the room's own lamps (not the pieces'): washers between the pieces, the end wall's, the door's, the laylight, the
  // lobby's lettering; and, in the white cube, their heads hanging in the slots (one instanced draw each)
  function roomLamps(scene, fixMat, lensMat) {
    const heads = [];
    if (!dark) {
      const wash = (x, z, nAt, at) => { const pos = V(x, H - 0.13, z); spot(pos, at, nAt, 30 * D2R, 8 * D2R, 0.36); heads.push([pos, at]); };
      [0.8, -1.8, -6.4, -9.6].forEach((z) => wash(-SLOT, z, V(1, 0, 0), V(-HX, 2.3, z)));
      [0.8, -2.0, -4.6, -10.4].forEach((z) => wash(SLOT, z, V(-1, 0, 0), V(HX, 2.3, z)));
      [-1, 1].forEach((s) => wash(s * SLOT, Z_END + 1.3, V(0, 0, 1), V(s * 2.55, 2.3, Z_END)));
      const dp = V(-SLOT, H - 0.13, DOOR.z + 0.3);
      spot(dp, V(-HX, 1.5, DOOR.z), V(1, 0, 0), 26 * D2R, 8 * D2R, 0.32);
      heads.push([dp, V(-HX, 1.5, DOOR.z)]);
      glow(V(BF.x, H - 0.06, BF.z), V(0, -1, 0), 9, COOL);
    } else {
      glow(V(BF.x, H - 0.06, BF.z), V(0, -1, 0), 1.6, [0.62, 0.72, 1.0]);
      spot(V(-SLOT, H - 0.13, DOOR.z + 0.3), V(-HX, 1.4, DOOR.z), V(1, 0, 0), 22 * D2R, 10 * D2R, 0.12, WARM);
    }
    // the lettering over the doorway, washed from a slot in the lobby's ceiling
    [-1, 1].forEach((s) => spot(V(s * 0.85, H - 0.06, Z_IN + 0.75), V(s * 0.7, 3.1, Z_IN + 0.15), V(0, 0, 1), 30 * D2R, 6 * D2R, dark ? 1.1 : 1.5, WARM));
    if (heads.length) {
      const can = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.036, 0.046, 0.13, 12), fixMat, heads.length);
      const lens = new THREE.InstancedMesh(new THREE.CircleGeometry(0.032, 14), lensMat, heads.length);
      const o = new THREE.Object3D(), q = new THREE.Quaternion(), down = V(0, -1, 0), m = new THREE.Matrix4(), lm = new THREE.Matrix4().makeRotationX(Math.PI / 2).setPosition(0, -0.066, 0);
      heads.forEach(([pos, at], i) => {
        q.setFromUnitVectors(down, at.clone().sub(pos).normalize());
        o.position.copy(pos); o.quaternion.copy(q); o.updateMatrix();
        can.setMatrixAt(i, o.matrix);
        lens.setMatrixAt(i, m.multiplyMatrices(o.matrix, lm));
      });
      scene.add(can, lens);
    }
  }

  // a piece's lamps: its spot (or framing projector), its label's light (in the dark), its own light thrown back
  const P = [];
  function pieceLamp(ix, fp, c, nr, w, h) {
    const at = c.clone().add(V(0, 0.05, 0)), r = fp.distanceTo(at);
    const L = { li: -1, I: 0, lab: -1, back: -1, w, h };
    if (dark) {
      L.li = frame(fp, c, nr, w / 2 + 0.005, h / 2 + 0.005, 3.6, 0.16);
      L.lab = frame(fp, c, nr, 0.01, 0.01, 0.55, 0.0, WARM, 0.09);
    } else {
      // (the end wall's lamp is met nearly square on, so its pool is given more room round the piece)
      const outer = Math.atan((Math.max(w, h) / 2 + (Math.abs(nr.z) > 0.5 ? 0.62 : 0.26)) / r);
      L.li = spot(fp, at, nr, outer, outer * 0.3, 1.05, WARM, ix);
    }
    L.I = LT.p.value[L.li].w;
    L.back = glow(c.clone().addScaledVector(nr, 0.12), nr, 0, [0, 0, 0]);
    P[ix] = L;
    return L;
  }
  // a label moved (beside the piece on a laptop, under it on a phone): its light follows
  const lp = new THREE.Vector3(), ln = new THREE.Vector3(), lq = new THREE.Quaternion();
  function labelMoved(ix, mesh, lw, lh) {
    const L = P[ix];
    if (!L || L.lab < 0) return;
    mesh.updateWorldMatrix(true, false);
    mesh.getWorldPosition(lp);
    mesh.getWorldQuaternion(lq);
    ln.set(0, 0, 1).applyQuaternion(lq);
    LT.r.value[L.lab].set(lp.x, lp.y, lp.z, lw / 2 + 0.035);
    LT.n.value[L.lab].set(ln.x, ln.y, ln.z, lh / 2 + 0.03);
  }
  // a piece's picture arrived: the light it throws back takes its colour
  function pieceColour(ix, avg) {
    const L = P[ix];
    if (!L || L.back < 0) return;
    LT.c.value[L.back].set(lin(avg[0]), lin(avg[1]), lin(avg[2]), 0);
    // (in the dark the art is what lights the floor in front of it, in its own colours)
    LT.p.value[L.back].w = L.w * L.h * (dark ? 2.4 : 0.5);
  }
  // a piece's picture arrived: the polished floor shows it
  function pieceArt(ix, tex) {
    if (ix > 2) return;
    floor.uniforms[`uArt${ix}`].value = tex;
    floor.uniforms.uArtOn.value.setComponent(ix, 1);
  }
  function heat(ix, v) { const L = P[ix]; if (L) LT.p.value[L.li].w = L.I * (0.92 + 0.16 * v); }
  // the door's angle, for the blade of light
  function doorAngle(a) { floor.uniforms.uDoor.value = a; }
  // the eyes adjusting: wider open in the dark lobby (the hall through the doorway looks brighter), settling in the hall
  function adapt(z, dt, reduced) {
    const target = 1 + (S.expoLobby - 1) * smooth(Z_IN - 1.0, Z_IN + 1.6, z);
    const k = reduced ? 1 : 1 - Math.exp(-1.3 * dt);
    expo.value += (target - expo.value) * k;
    return Math.abs(target - expo.value) > 0.003;
  }
  // the hands under the room's light: dim in the lobby, the lamp you stand under on them in the hall
  const white = new THREE.Color(1, 1, 1), tint = new THREE.Color();
  function handLight({ hemi, key, rim }, s, z) {
    const inHall = smooth(Z_IN + 1.2, Z_IN - 0.8, z);
    const k = Math.round(clamp(s, 1, 3)), near = Math.max(0, 1 - Math.abs(s - k) / 0.5);
    if (dark) {
      hemi.intensity = 0.08 + 0.08 * inHall;
      key.intensity = 0.1 + 0.22 * inHall;
      const col = PC.col.value[k - 1];
      tint.setRGB(col.x, col.y, col.z);
      rim.color.copy(white).lerp(tint, 0.55);
      rim.intensity = (0.35 + 1.9 * near) * inHall + 0.25;
    } else {
      hemi.color.set('#e2e7ee'); hemi.groundColor.set('#24282f');
      hemi.intensity = 0.3 + 0.38 * inHall;
      key.color.set('#fff7ef');
      key.intensity = 0.32 + 0.6 * inHall + 0.22 * near * inHall;
      rim.intensity = 0.22 + 0.34 * inHall;
    }
  }
  return { mode, S, LT, expo, wall, lobby, floor, ceil, slot, glass, roomLamps, pieceLamp, labelMoved, pieceColour, pieceArt, heat, doorAngle, adapt, handLight, dark };
}
