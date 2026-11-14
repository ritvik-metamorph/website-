// The team: everyone here struck on a coin (js/coin.js), the advisory board in bronze.
//
// - Ink: the coins float in the room, each turning a little toward you, their names beneath.
// - Light: the room goes dark and the cursor is a lamp. Threads come down from the disciplines each
//   person brings and catch their coin: what each of us hangs on. Follow a person, or a
//   discipline, and its threads light. On a phone each coin hangs from its own few words instead
//   of one row across the top.
// - Open any coin and it comes forward, held up on the left with the person beside it. The coin up
//   close is its own canvas (createCoin); the handover matches its place, its size and its turn.
//
// The coins are drawn on one canvas fixed to the viewport, each placed over its button in the page,
// so the layout is the stylesheet's and the scroll is the page's.
import * as THREE from '../assets/vendor/three.module.min.js';
import { PEOPLE, ADVISORS, PROMPTS } from './people.js';
import { createBaker, coinGeometry, coinMaterial, placeLamp, coinOf, createCoin, MICRO } from './coin.js';
import { holdControl } from './hold.js';

const { gsap } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));
const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const listJoin = (a) => (a.length < 2 ? a[0] || '' : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};
// Keep in step with the narrow media query in css/main.css.
const isNarrow = () => innerWidth <= innerHeight || (innerWidth < 900 && innerHeight > 520);

// Where each coin floats, as fractions of the stage, laid out the way a set is laid in its case:
// the two founders as a pair, level and high in the middle, and the team evenly spaced on one
// shallow arc that cradles them, lowest under the founders. The advisory board repeats the arc,
// gentler. (On a phone the stylesheet stacks them instead.)
const arc = (x, top, dip) => top + dip * (1 - ((x - 0.5) / 0.4) ** 2);
const CREW = ['kabir-malhotra', 'meher-kapoor', 'vihaan-arora', 'tara-sood', 'reyansh-gill', 'anaya-dhillon'];
const SPOT = {
  'aarav-khanna': [0.385, 0.33], 'naina-bedi': [0.615, 0.33],
  ...Object.fromEntries(CREW.map((slug, k) => { const x = 0.1 + k * 0.16; return [slug, [x, arc(x, 0.66, 0.1)]]; })),
};
const ADV_SPOT = [0.16, 0.39, 0.61, 0.84].map((x) => [x, arc(x, 0.47, 0.07)]);

const FOV = 20;
const LAMP_H = 200;   // how high the lamp is held over the coins, in px
const REACH = 560;    // the lamp's reach, in px (its falloff was tuned on a coin this size up close)
const GROUND = -170;  // the wall behind the coins, in px
const SEG = 40;       // segments per thread
const MAX_T = 48;

// ---------------------------------------------------------------- shaders: shadows and threads

const WORLD_VERT = /* glsl */ `
varying vec3 vWorld;
void main() { vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

// each coin's shadow on the wall: soft from the softbox in Ink, thrown long from the lamp in Light
const SHADOW_FRAG = /* glsl */ `
precision highp float;
varying vec3 vWorld;
uniform vec3 uInk;
uniform vec3 uLit;
uniform float uMode;
uniform float uLampOn;
uniform float uFade;
float disc(vec3 c, float soft) { float d = length(vWorld.xy - c.xy) / c.z; return 1.0 - smoothstep(1.0 - soft, 1.0 + soft, d); }
void main() {
  float a = disc(uInk, 0.5) * 0.11 * (1.0 - uMode) + disc(uLit, 0.4) * 0.55 * uMode * uLampOn;
  gl_FragColor = vec4(0.0, 0.0, 0.0, a * uFade);
}`;

// the threads: ribbons a pixel or so wide, let down from the top, brighter where the lamp is
const THREAD_VERT = /* glsl */ `
attribute vec2 aN;
attribute float aS;
attribute float aV;
attribute float aT;
uniform float uDraw[${MAX_T}];
uniform float uHi[${MAX_T}];
uniform float uWidth;
varying float vS;
varying float vV;
varying float vDraw;
varying float vHi;
varying vec2 vXY;
void main() {
  int i = int(aT + 0.5);
  vHi = uHi[i];
  vDraw = uDraw[i];
  vS = aS;
  vV = aV;
  vec3 p = position + vec3(aN * aV * uWidth * (1.0 + vHi * 0.5), 0.0);
  vXY = p.xy;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;

const THREAD_FRAG = /* glsl */ `
precision highp float;
uniform float uThreads;
uniform float uFocus;
uniform vec3 uLamp;
uniform float uLampOn;
varying float vS;
varying float vV;
varying float vDraw;
varying float vHi;
varying vec2 vXY;
void main() {
  if (vS > vDraw) discard;
  float edge = 1.0 - smoothstep(0.3, 1.0, abs(vV));
  float b = mix(mix(0.3, 0.1, uFocus), 1.0, vHi);
  vec2 d = vXY - uLamp.xy;
  b += exp(-dot(d, d) / (2.0 * 230.0 * 230.0)) * 0.5 * uLampOn;
  // the end still being let down carries a little more light
  b += smoothstep(vDraw - 0.05, vDraw, vS) * step(vDraw, 0.995) * 0.7;
  float a = clamp(b, 0.0, 1.0) * edge * uThreads;
  gl_FragColor = vec4(vec3(0.95, 0.9, 0.82) * a, a);
}`;

// ---------------------------------------------------------------- the section

export function setupTeam({ lenis, register, reduced, isTouch, local }) {
  const section = $('#team');
  if (!section) return;
  const canvas = $('.team-gl', section);
  const room = $('.team-room', section);
  const stage = $('.coins-team', section);
  const advStage = $('.coins-adv', section);
  const band = $('.disc-band', section);
  const caption = $('.team-caption', section);
  const view = $('.coin-view');

  // ---------------------------------------------------------------- the people, and their buttons

  const people = [
    ...PEOPLE.map((p) => ({ p, kind: p.founder ? 'founder' : 'crew', discs: p.disciplines || [], answers: p.answers })),
    ...ADVISORS.map((p) => ({ p: { ...p, metal: 'bronze' }, kind: 'advisor', discs: [], answers: [] })),
  ];
  people.forEach((P, i) => {
    P.i = i;
    P.data = coinOf(P.p, P.answers);
    const b = el('button', `coin coin-${P.kind}`);
    b.type = 'button';
    b.dataset.i = i;
    const spot = P.kind === 'advisor' ? ADV_SPOT[i - PEOPLE.length] : SPOT[P.p.slug] || [0.5, 0.5];
    b.style.setProperty('--x', `${spot[0] * 100}%`);
    b.style.setProperty('--y', `${spot[1] * 100}%`);
    const what = P.kind === 'advisor' ? P.p.field : P.p.role;
    b.setAttribute('aria-label', `${P.p.name}, ${what}. Open their coin.`);
    P.disc = el('span', 'coin-disc');
    P.disc.setAttribute('aria-hidden', 'true');
    // the few words a coin hangs from on its own (a phone; the advisory board everywhere)
    P.tags = el('span', 'coin-tags');
    P.tags.setAttribute('aria-hidden', 'true');
    P.tagEls = {};
    (P.kind === 'advisor' ? [P.p.field] : P.discs).forEach((d) => {
      const t = el('span', 'coin-tag', P.kind === 'advisor' ? d : capital(d));
      P.tagEls[d] = t;
      P.tags.append(t);
    });
    const text = el('span', 'coin-text');
    text.setAttribute('aria-hidden', 'true');
    text.append(el('span', 'coin-name', P.p.name), el('span', 'coin-role', what));
    if (P.kind === 'advisor') text.append(el('span', 'coin-prev', `Previously ${P.p.previously.charAt(0).toLowerCase()}${P.p.previously.slice(1)}`));
    b.append(P.tags, P.disc, text);
    (P.kind === 'advisor' ? advStage : stage).append(b);
    P.btn = b;
  });
  const team = people.filter((P) => P.kind !== 'advisor');

  // the disciplines, one row across the top: ordered by where their people float, so the threads
  // mostly fall instead of crossing the room
  const discs = [...new Set(team.flatMap((P) => P.discs))];
  const meanX = (d) => {
    const xs = team.filter((P) => P.discs.includes(d)).map((P) => (SPOT[P.p.slug] || [0.5])[0]);
    return xs.reduce((a, b) => a + b, 0) / xs.length;
  };
  discs.sort((a, b) => meanX(a) - meanX(b));
  const discEls = {};
  discs.forEach((d, k) => {
    const s = el('span', 'wd', capital(d));
    s.style.setProperty('--x', `${6 + (k * 88) / Math.max(1, discs.length - 1)}%`);
    s.style.setProperty('--y', k % 2 ? '15%' : '7%');
    s.dataset.d = d;
    band.append(s);
    discEls[d] = s;
  });

  // the threads: one for every discipline a person brings, and one for each advisor's field
  const threads = [];
  team.forEach((P) => P.discs.forEach((d) => threads.push({ d, P, band: discEls[d], tag: P.tagEls[d] })));
  people.filter((P) => P.kind === 'advisor').forEach((P) => threads.push({ d: null, P, band: null, tag: P.tagEls[P.p.field] }));
  threads.length = Math.min(threads.length, MAX_T);

  // ---------------------------------------------------------------- the canvas

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    renderer = null;
  }
  if (!renderer) section.classList.add('no-gl');
  renderer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer?.setClearColor(0x000000, 0);
  if (renderer) renderer.autoClear = false;
  const baker = renderer && createBaker(renderer);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 1, 10000);
  const shared = { uMode: { value: 0 }, uAmbient: { value: 0.07 }, uLampOn: { value: 0 } };
  const lamp = new THREE.Vector3(0, 0, LAMP_H);
  const fade = { value: 1 };

  people.forEach((P) => {
    P.mat = coinMaterial({ front: null, back: null, metal: P.data.metal, size: 512, shared });
    P.mesh = new THREE.Mesh(coinGeometry(), P.mat);
    P.mesh.visible = false;
    P.hold = new THREE.Group();
    P.hold.add(P.mesh);
    scene.add(P.hold);
    P.shadowU = { uInk: { value: new THREE.Vector3() }, uLit: { value: new THREE.Vector3() }, uMode: shared.uMode, uLampOn: shared.uLampOn, uFade: fade };
    P.shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ vertexShader: WORLD_VERT, fragmentShader: SHADOW_FRAG, uniforms: P.shadowU, transparent: true, depthWrite: false }));
    P.shadow.visible = false;
    scene.add(P.shadow);
    // each turns at its own pace, so the room never moves in step
    P.phase = (P.i * 2.399) % (Math.PI * 2);
    P.st = { enter: reduced ? 1 : 0, hover: 0, over: false, dim: 0, hang: 0, lift: 0, bob: 0, yaw: 0, pitch: 0, hidden: false };
  });

  // threads, as one ribbon mesh
  const NV = threads.length * (SEG + 1) * 2;
  const tPos = new Float32Array(NV * 3), tN = new Float32Array(NV * 2), tS = new Float32Array(NV), tV = new Float32Array(NV), tT = new Float32Array(NV);
  const tIdx = [];
  threads.forEach((th, k) => {
    for (let s = 0; s <= SEG; s++) {
      const v = (k * (SEG + 1) + s) * 2;
      tS[v] = tS[v + 1] = s / SEG;
      tV[v] = -1; tV[v + 1] = 1;
      tT[v] = tT[v + 1] = k;
      if (s < SEG) tIdx.push(v, v + 1, v + 2, v + 1, v + 3, v + 2);
    }
  });
  const tGeo = new THREE.BufferGeometry();
  tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3).setUsage(THREE.DynamicDrawUsage));
  tGeo.setAttribute('aN', new THREE.BufferAttribute(tN, 2).setUsage(THREE.DynamicDrawUsage));
  tGeo.setAttribute('aS', new THREE.BufferAttribute(tS, 1));
  tGeo.setAttribute('aV', new THREE.BufferAttribute(tV, 1));
  tGeo.setAttribute('aT', new THREE.BufferAttribute(tT, 1));
  tGeo.setIndex(tIdx);
  const TU = {
    uDraw: { value: new Array(MAX_T).fill(0) },
    uHi: { value: new Array(MAX_T).fill(0) },
    uWidth: { value: 1.1 },
    uThreads: { value: 0 },
    uFocus: { value: 0 },
    uLamp: { value: lamp },
    uLampOn: shared.uLampOn,
  };
  const threadMesh = new THREE.Mesh(tGeo, new THREE.ShaderMaterial({
    vertexShader: THREAD_VERT, fragmentShader: THREAD_FRAG, uniforms: TU,
    transparent: true, depthWrite: false, premultipliedAlpha: true, side: THREE.DoubleSide,
  }));
  threadMesh.frustumCulled = false;
  threadMesh.renderOrder = 2;
  scene.add(threadMesh);

  // ---------------------------------------------------------------- measuring the page

  // Where everything sits, relative to the section, measured when the layout changes; each frame
  // then only needs the section's own top.
  let W = innerWidth, H = innerHeight;
  let useBand = true;
  function measure() {
    W = innerWidth; H = innerHeight;
    renderer?.setSize(W, H, false);
    camera.aspect = W / H;
    camera.position.set(0, 0, H / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    const top = section.getBoundingClientRect().top;
    people.forEach((P) => {
      const r = P.disc.getBoundingClientRect();
      P.rx = r.left + r.width / 2;
      P.ry = r.top + r.height / 2 - top;
      P.r = r.width / 2;
    });
    useBand = getComputedStyle(band).display !== 'none';
    threads.forEach((th) => {
      const from = useBand && th.band ? th.band : th.tag;
      const r = from.getBoundingClientRect();
      th.fx = r.left + r.width / 2;
      th.fy = r.bottom + 3 - top;
      th.on = r.width > 0;
    });
  }

  // ---------------------------------------------------------------- baking, before anyone arrives

  let bakeQueue = null;
  const fontsReady = Promise.all([
    document.fonts.load(`600 40px 'Ibarra Real Nova'`),
    document.fonts.load(`italic 500 40px 'Ibarra Real Nova'`),
    document.fonts.load(`20px 'Fragment Mono'`),
  ]).catch(() => {});
  function startBaking() {
    if (bakeQueue || !baker) return;
    bakeQueue = fontsReady.then(async () => {
      for (const P of people) {
        const { front, back } = await baker.bake(P.data, { size: 512, micro: false });
        P.mat.uniforms.uFront.value = front.texture;
        P.mat.uniforms.uBack.value = back.texture;
        P.mesh.visible = P.shadow.visible = true;
        // one coin a frame, so the page never stalls
        await new Promise((r) => requestAnimationFrame(r));
      }
    }).catch((e) => console.error('team: baking the coins failed', e));
  }
  new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) startBaking(); }, { rootMargin: '150% 0px' }).observe(section);
  // and in any case once the page has settled, so the coins are ready long before anyone arrives
  setTimeout(startBaking, 2500);

  // as you arrive, each coin turns from its edge to face you, the founders first
  const arrive = (group, first) => {
    if (reduced) return;
    group.forEach((P, k) => gsap.to(P.st, { enter: 1, duration: 1.6, ease: 'power3.out', delay: first ? (P.kind === 'founder' ? 0 : 0.25 + k * 0.08) : k * 0.1 }));
  };
  const seen = new WeakSet();
  const arrivals = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting || seen.has(e.target)) return;
    seen.add(e.target);
    arrive(people.filter((P) => P.btn.parentElement === e.target), e.target === stage);
  }), { threshold: 0.2 });
  arrivals.observe(stage);
  arrivals.observe(advStage);

  // ---------------------------------------------------------------- the pointer, and the lamp

  let mx = W / 2, my = H * 0.3, pointerIn = false, touching = false;
  addEventListener('pointermove', (e) => {
    if (e.pointerType === 'touch' && !touching) return;
    mx = e.clientX; my = e.clientY;
    pointerIn = true;
  }, { passive: true });
  addEventListener('pointerdown', (e) => { if (e.pointerType === 'touch') { touching = true; mx = e.clientX; my = e.clientY; } }, { passive: true });
  addEventListener('pointerup', () => { touching = false; }, { passive: true });
  document.addEventListener('pointerleave', () => { pointerIn = false; });

  // ---------------------------------------------------------------- following a person or a discipline

  let focus = null; // { P } or { d }
  const related = (th) => !!focus && (focus.P ? th.P === focus.P : th.d === focus.d);
  const holds = (P) => !focus || (focus.P ? focus.P === P : P.discs.includes(focus.d));
  function setFocus(f) {
    focus = f;
    people.forEach((P) => P.btn.classList.toggle('is-dim', lit && !!focus && !holds(P)));
    discs.forEach((d) => discEls[d].classList.toggle('is-on', !!focus && (focus.d === d || (focus.P && focus.P.discs.includes(d)))));
    people.forEach((P) => Object.entries(P.tagEls).forEach(([d, t]) => t.classList.toggle('is-on', !!focus && (focus.P === P || focus.d === d))));
    let line = '';
    if (focus?.P) {
      const P = focus.P;
      line = P.kind === 'advisor' ? `${P.p.name}, ${P.p.field.toLowerCase()}.` : `${P.p.name} brings ${listJoin(P.discs)}.`;
    } else if (focus?.d) {
      line = `${capital(focus.d)}: ${listJoin(team.filter((P) => P.discs.includes(focus.d)).map((P) => P.p.name))}.`;
    }
    caption.textContent = line || 'Follow a thread to see who it holds. Open any coin.';
  }
  people.forEach((P) => {
    P.btn.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'touch') { P.st.over = true; setFocus({ P }); prebake(P); } });
    P.btn.addEventListener('pointerleave', () => { P.st.over = false; if (focus?.P === P) setFocus(null); });
    P.btn.addEventListener('focus', () => { P.st.over = true; setFocus({ P }); });
    P.btn.addEventListener('blur', () => { P.st.over = false; if (focus?.P === P) setFocus(null); });
    P.btn.addEventListener('click', () => open(P.i));
  });
  discs.forEach((d) => {
    discEls[d].addEventListener('pointerenter', () => setFocus({ d }));
    discEls[d].addEventListener('pointerleave', () => { if (focus?.d === d) setFocus(null); });
  });

  // ---------------------------------------------------------------- Ink and Light

  let lit = false, modeTl = null;
  const hold = holdControl($('.hold', section), {
    duration: reduced ? 0.6 : 1.1,
    isLit: () => lit,
    onProgress: () => {},
    onCommit: () => commit(),
    onRevert: () => revert(),
  });

  function commit() {
    if (lit) return;
    lit = true;
    hold.sync();
    section.dataset.lit = 'true';
    viewCoin?.setMode('light');
    view.dataset.lit = 'true';
    modeTl?.kill();
    const d = reduced ? 0.25 : 1;
    // the room goes dark, then the threads are let down from the top, one discipline after
    // another, and each coin stops drifting the moment its threads catch it
    modeTl = gsap.timeline()
      .to(shared.uMode, { value: 1, duration: 1.2 * d, ease: 'power2.inOut' }, 0)
      .to(TU.uThreads, { value: 1, duration: 0.3 }, 0.6 * d);
    const order = useBand ? discs : null;
    threads.forEach((th, k) => {
      const at = 0.7 * d + (order && th.d ? order.indexOf(th.d) * 0.07 : (k % 6) * 0.05) * d + (th.d ? 0 : 0.5 * d);
      const o = { v: 0 };
      modeTl.to(o, { v: 1, duration: 1.5 * d, ease: 'power2.inOut', onUpdate: () => { TU.uDraw.value[k] = o.v; } }, at);
    });
    people.forEach((P) => {
      const mine = threads.map((th, k) => (th.P === P ? k : -1)).filter((k) => k >= 0);
      const at = Math.max(0, ...mine.map((k) => 0.7 * d + (order && threads[k].d ? order.indexOf(threads[k].d) * 0.07 : (k % 6) * 0.05) * d + (threads[k].d ? 0 : 0.5 * d))) + 1.4 * d;
      modeTl.to(P.st, { hang: 1, duration: 1.2 * d, ease: 'power2.out' }, at);
    });
    setFocus(focus);
  }

  function revert() {
    if (!lit) return;
    lit = false;
    hold.sync();
    viewCoin?.setMode('ink');
    view.dataset.lit = 'false';
    modeTl?.kill();
    const d = reduced ? 0.25 : 1;
    const o = { v: 1 };
    modeTl = gsap.timeline()
      .to(o, { v: 0, duration: 0.5 * d, ease: 'power1.in', onUpdate: () => { TU.uDraw.value = TU.uDraw.value.map((x) => Math.min(x, o.v)); } }, 0)
      .to(TU.uThreads, { value: 0, duration: 0.4 * d }, 0.3 * d)
      .to(people.map((P) => P.st), { hang: 0, duration: 1 * d, ease: 'power2.inOut' }, 0.2 * d)
      .to(shared.uMode, { value: 0, duration: 1.1 * d, ease: 'power2.inOut' }, 0.35 * d)
      .add(() => { section.dataset.lit = 'false'; }, 0.3 * d);
    setFocus(null);
  }

  register({
    name: 'team',
    commit,
    revert,
    // the coin up close covers the page: the nav takes its tone from it
    cover: () => (openI !== null ? { lit, tone: lit ? 'light' : 'ink' } : null),
    under: (y) => {
      const r = section.getBoundingClientRect();
      if (r.top > y || r.bottom < y) return null;
      const f = innerHeight * 0.12; // the dark fades out over the section's ends
      return { lit, tone: lit && shared.uMode.value > 0.5 && r.top + f < y && r.bottom - f > y ? 'light' : 'ink' };
    },
  });

  // ---------------------------------------------------------------- the coin up close

  let viewCoin = null, viewFor = -1, openI = null, from = null;
  const vs = { p: 0 };
  const panel = $('.cv-panel', view);
  const cvStage = $('.cv-stage', view);
  const cvHint = $('.cv-hint', view);
  const words = $('.cv-words', view);
  const coarse = matchMedia('(pointer: coarse)').matches;
  const HINT = coarse
    ? { ink: 'Swipe the coin, or tap it, to turn it over.', light: 'Move a finger across the coin to light it.' }
    : { ink: 'Drag the coin, or click it, to turn it over.', light: 'Move the lamp across the coin. Its rings hold the answers.' };

  function ensureView() {
    if (viewCoin || !renderer) return viewCoin;
    viewCoin = createCoin($('.cv-gl', view), {
      reduced,
      onRing(k) {
        $$('li', words).forEach((li, i) => li.classList.toggle('is-lit', i === k));
        const li = $$('li', words)[k];
        if (!li || isNarrow()) return;
        const r = li.getBoundingClientRect();
        if (r.top < 90 || r.bottom > innerHeight - 40) li.scrollIntoView({ block: 'nearest', behavior: reduced ? 'auto' : 'smooth' });
      },
      onSide(s) {
        $$('.cv-change > div', view).forEach((d) => d.classList.toggle('is-up', d.dataset.face === s));
        $('[data-flip]', view).textContent = s === 'front' ? 'Turn it over' : 'Turn it back';
      },
    });
    viewCoin?.pause();
    return viewCoin;
  }
  // get the next coin ready while the pointer rests on it, so opening it never waits
  let prebakeTimer;
  function prebake(P) {
    if (!renderer || isTouch) return;
    clearTimeout(prebakeTimer);
    prebakeTimer = setTimeout(() => {
      if (openI !== null || viewFor === P.i || !ensureView()) return;
      viewFor = P.i;
      viewCoin.setPerson(P.p, P.answers);
    }, 160);
  }

  function fill(P) {
    const adv = P.kind === 'advisor';
    $('.cv-name', view).textContent = P.p.name;
    $('.cv-role', view).textContent = adv ? `Advisory board, ${P.p.field.toLowerCase()}` : P.p.role;
    $('.cv-before', view).textContent = adv ? P.p.previously : P.p.before;
    $('.cv-now', view).textContent = adv ? `Advises on ${P.p.field.toLowerCase()}` : P.p.now;
    $('.cv-bio', view).textContent = P.p.bio || '';
    $('.cv-bio', view).hidden = !P.p.bio;
    $('.cv-brings', view).textContent = adv ? '' : `Brings ${listJoin(P.discs)}.`;
    $('.cv-brings', view).hidden = adv;
    $('.cv-count', view).textContent = `${P.i + 1} of ${people.length}`;
    const ans = (P.answers || []).map((a, k) => [k, a]).filter(([, a]) => a);
    $('.cv-words-wrap', view).hidden = !ans.length;
    words.replaceChildren(...ans.map(([k, a]) => {
      const li = el('li');
      li.append(el('span', 'n', ROMAN[k]));
      const d = el('div');
      d.append(el('p', 'q', PROMPTS[k]), el('p', 'a', a));
      li.append(d);
      return li;
    }));
    $$('.cv-change > div', view).forEach((d) => d.classList.toggle('is-up', d.dataset.face === 'front'));
    $('[data-flip]', view).textContent = 'Turn it over';
    cvHint.textContent = HINT[lit ? 'light' : 'ink'];
    panel.scrollTop = 0;
    view.scrollTop = 0;
  }

  // where the coin floats now, on screen
  const screenOf = (P) => {
    const top = section.getBoundingClientRect().top;
    return { cx: P.rx, cy: P.ry + top - P.st.bob, r: P.r * (1 + P.st.lift * 0.0008) };
  };
  // where it is held, up close
  const heldAt = () => {
    const r = cvStage.getBoundingClientRect();
    const k = isNarrow() ? 0.4 : 0.36;
    return { cx: r.left + r.width * 0.5, cy: r.top + r.height * 0.5, r: Math.min(r.width * k, r.height * (isNarrow() ? 0.4 : 0.34)) };
  };

  let returnTo = null;
  async function open(i, { push = true } = {}) {
    const P = people[i];
    if (openI !== null) { if (openI !== i) step(i - openI); return; }
    ensureView();
    openI = i;
    returnTo = P.btn;
    fill(P);
    view.hidden = false;
    view.dataset.lit = String(lit);
    from = screenOf(P);
    if (viewCoin) {
      if (viewFor !== i) { viewFor = i; await viewCoin.setPerson(P.p, P.answers); }
      viewCoin.setMode(lit ? 'light' : 'ink', { instant: true });
      viewCoin.layout({ W, H, ...from });
      viewCoin.setRot(P.st.yaw);
      gsap.to(viewCoin.state, { rot: 0, duration: reduced ? 0.01 : 1.1, ease: 'power3.inOut' });
      viewCoin.resume();
      if (!isTouch) viewCoin.point(mx, my);
    }
    P.st.hidden = true;
    P.btn.classList.add('is-away');
    lenis.stop();
    document.documentElement.classList.add('cv-open');
    requestAnimationFrame(() => view.classList.add('is-on'));
    gsap.killTweensOf(vs);
    gsap.to(vs, { p: 1, duration: reduced ? 0.01 : 1.05, ease: 'power3.inOut' });
    if (push) history.pushState({ coin: P.p.slug }, '', `#team/${P.p.slug}`);
    $('.cv-close', view).focus({ preventScroll: true });
  }

  function close({ fromHistory = false } = {}) {
    if (openI === null) return;
    const P = people[openI];
    from = screenOf(P);
    view.classList.remove('is-on');
    // back to its face, and back to where it floats
    if (viewCoin) {
      const rot = viewCoin.rot;
      gsap.to(viewCoin.state, { rot: Math.round(rot / (Math.PI * 2)) * Math.PI * 2 + P.st.yaw, duration: reduced ? 0.01 : 0.9, ease: 'power3.inOut' });
    }
    gsap.killTweensOf(vs);
    gsap.to(vs, {
      p: 0, duration: reduced ? 0.01 : 0.9, ease: 'power3.inOut',
      onComplete: () => {
        P.st.hidden = false;
        P.btn.classList.remove('is-away');
        view.hidden = true;
        viewCoin?.pause();
        openI = null;
        lenis.start();
        document.documentElement.classList.remove('cv-open');
        returnTo?.focus({ preventScroll: true });
      },
    });
    if (!fromHistory && location.hash.startsWith('#team/')) history.back();
  }

  // the next or the previous person, without going back to the room: the coin turns away on its
  // edge, and the next one turns in
  let stepping = false;
  async function step(dir) {
    if (openI === null || stepping) return;
    stepping = true;
    const nextI = (openI + dir + people.length) % people.length;
    const A = people[openI], B = people[nextI];
    const d = reduced ? 0.01 : 0.38;
    panel.classList.add('is-turning');
    if (viewCoin) await new Promise((r) => gsap.to(viewCoin.state, { rot: Math.round(viewCoin.rot / Math.PI) * Math.PI + (Math.PI / 2) * dir, duration: d, ease: 'power2.in', onComplete: r }));
    else await new Promise((r) => setTimeout(r, d * 1000));
    A.st.hidden = false; A.btn.classList.remove('is-away');
    B.st.hidden = true; B.btn.classList.add('is-away');
    openI = nextI;
    returnTo = B.btn;
    viewFor = nextI;
    if (viewCoin) await viewCoin.setPerson(B.p, B.answers);
    fill(B);
    panel.classList.remove('is-turning');
    if (viewCoin) {
      viewCoin.setRot(-(Math.PI / 2) * dir);
      gsap.to(viewCoin.state, { rot: 0, duration: reduced ? 0.01 : 0.6, ease: 'power3.out' });
    }
    history.replaceState({ coin: B.p.slug }, '', `#team/${B.p.slug}`);
    stepping = false;
  }

  $('.cv-close', view).addEventListener('click', () => close());
  $('[data-flip]', view).addEventListener('click', () => viewCoin?.flip());
  if (!renderer) $('[data-flip]', view).hidden = true;
  $$('[data-step]', view).forEach((b) => b.addEventListener('click', () => step(Number(b.dataset.step))));
  addEventListener('keydown', (e) => {
    if (openI === null) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight' && !e.target.closest('input')) step(1);
    if (e.key === 'ArrowLeft' && !e.target.closest('input')) step(-1);
  });
  addEventListener('popstate', () => {
    const m = location.hash.match(/^#team\/(.+)$/);
    if (!m && openI !== null) close({ fromHistory: true });
  });

  // ---------------------------------------------------------------- the frame

  const top3 = new THREE.Vector3();
  let shown = null;
  let last = performance.now();
  const t0 = last;
  function frame() {
    const now = performance.now();
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - t0) / 1000;
    const rect = section.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < H;

    // the coin up close follows its handover
    if (viewCoin && openI !== null || (viewCoin && vs.p > 0)) {
      const a = from, b = heldAt();
      const p = vs.p;
      viewCoin.layout({ W, H, cx: lerp(a.cx, b.cx, p), cy: lerp(a.cy, b.cy, p), r: lerp(a.r, b.r, p) });
      viewCoin.setGround(p);
    }
    if (!renderer) return;
    const show = inView && vs.p < 0.999;
    if (show !== shown) { shown = show; canvas.style.visibility = show ? 'visible' : 'hidden'; }
    if (!show) return;

    // the lamp: under the pointer; on a phone, where the finger last was
    const light = shared.uMode.value;
    lamp.set(mx - W / 2, H / 2 - my, LAMP_H);
    const inside = pointerIn && my > rect.top && my < rect.bottom;
    shared.uLampOn.value = damp(shared.uLampOn.value, isTouch || inside ? 1 : 0.35, 4, dt);
    room.style.setProperty('--lx', `${mx - rect.left}px`);
    room.style.setProperty('--ly', `${my - rect.top}px`);

    const narrow = isNarrow();
    people.forEach((P) => {
      const s = P.st;
      const hang = s.hang * light;
      const over = s.over && !isTouch ? 1 : 0;
      s.hover = damp(s.hover, over, 7, dt);
      s.dim = damp(s.dim, lit && focus && !holds(P) ? 1 : 0, 6, dt);
      const cx = P.rx, cy = P.ry + rect.top;
      // Ink: it floats, bobbing, turning a little toward you. Light: it hangs, twisting slowly on
      // its threads. Either way it faces you when you come to it.
      const drift = reduced ? 0 : 1;
      s.bob = Math.sin(t * 0.55 + P.phase) * 4 * (1 - hang) * drift * (1 - s.hover);
      const toward = clamp((mx - cx) / W, -0.6, 0.6) * (0.5 + s.hover * 0.6);
      const twist = Math.sin(t * 0.2 + P.phase) * 0.38 * hang;
      const idle = Math.sin(t * 0.27 + P.phase) * 0.14 * (1 - hang);
      s.yaw = lerp((idle + twist) * drift + toward * (1 - hang * 0.7), toward * 0.6, s.hover);
      s.pitch = clamp((my - cy) / H, -0.6, 0.6) * 0.35 * (1 - hang) * (0.6 + s.hover);
      s.lift = damp(s.lift, over * (narrow ? 0 : 26), 6, dt);
      const edge = (1 - s.enter) * -1.45;
      P.hold.position.set(cx - W / 2, H / 2 - cy + s.bob, s.lift - (1 - s.enter) * 60);
      P.hold.scale.setScalar(P.r);
      P.hold.rotation.set(s.pitch, 0, 0);
      P.mesh.rotation.set(0, s.yaw + edge, 0);
      P.hold.visible = !s.hidden;
      P.shadow.visible = !s.hidden && P.mesh.visible;
      P.mat.uniforms.uDim.value = s.dim;
    });
    scene.updateMatrixWorld();

    people.forEach((P) => {
      if (!P.mesh.visible) return;
      placeLamp(P.mesh, lamp, P.r / REACH);
      // shadows: offset down and to the right from the softbox; thrown away from the lamp
      const c = P.hold.position;
      const gd = c.z - GROUND;
      P.shadowU.uInk.value.set(c.x + gd * 0.16, c.y - gd * 0.32, P.r * 1.04);
      const tt = (GROUND - LAMP_H) / (c.z - LAMP_H);
      const lx = lamp.x + (c.x - lamp.x) * tt, ly = lamp.y + (c.y - lamp.y) * tt;
      P.shadowU.uLit.value.set(lx, ly, P.r * tt);
      const minX = Math.min(c.x + gd * 0.16, lx) - P.r * tt * 1.6, maxX = Math.max(c.x + gd * 0.16, lx) + P.r * tt * 1.6;
      const minY = Math.min(c.y - gd * 0.32, ly) - P.r * tt * 1.6, maxY = Math.max(c.y - gd * 0.32, ly) + P.r * tt * 1.6;
      P.shadow.position.set((minX + maxX) / 2, (minY + maxY) / 2, GROUND);
      P.shadow.scale.set(maxX - minX, maxY - minY, 1);
    });

    // the threads: from under each word to the top of its coin, falling straight at both ends
    TU.uFocus.value = damp(TU.uFocus.value, lit && focus ? 1 : 0, 6, dt);
    threads.forEach((th, k) => {
      TU.uHi.value[k] = damp(TU.uHi.value[k], related(th) ? 1 : 0, 7, dt);
      const P = th.P;
      top3.set(0, 1, 0).applyMatrix4(P.mesh.matrixWorld);
      const x0 = th.fx - W / 2, y0 = H / 2 - (th.fy + rect.top), z0 = -12;
      const x3 = top3.x, y3 = top3.y, z3 = top3.z - 3;
      const k1 = Math.max(30, (y0 - y3) * 0.48);
      const on = th.on && !P.st.hidden;
      for (let s = 0; s <= SEG; s++) {
        const u = s / SEG, iu = 1 - u;
        // a cubic from the word down to the coin, vertical at both ends
        const bx = iu * iu * iu * x0 + 3 * iu * iu * u * x0 + 3 * iu * u * u * x3 + u * u * u * x3;
        const by = iu * iu * iu * y0 + 3 * iu * iu * u * (y0 - k1) + 3 * iu * u * u * (y3 + k1) + u * u * u * y3;
        // it hangs well behind the room, and comes forward only to meet its own coin, so it never
        // crosses in front of another coin's face
        const bz = lerp(lerp(z0, -90, smoothstep(0, 0.15, u)), z3, smoothstep(0.72, 1, u));
        const dx = 3 * iu * iu * 0 + 6 * iu * u * (x3 - x0) + 3 * u * u * 0;
        const dy = 3 * iu * iu * (-k1) + 6 * iu * u * (y3 + k1 - (y0 - k1)) + 3 * u * u * (-k1);
        const len = Math.hypot(dx, dy) || 1;
        const v = (k * (SEG + 1) + s) * 2;
        for (let j = 0; j < 2; j++) {
          tPos[(v + j) * 3] = on ? bx : 0;
          tPos[(v + j) * 3 + 1] = on ? by : 0;
          tPos[(v + j) * 3 + 2] = bz;
          tN[(v + j) * 2] = -dy / len;
          tN[(v + j) * 2 + 1] = dx / len;
        }
      }
    });
    tGeo.attributes.position.needsUpdate = true;
    tGeo.attributes.aN.needsUpdate = true;
    threadMesh.visible = TU.uThreads.value > 0.001;

    // draw only inside the section, so nothing spills onto its neighbours
    const y0 = Math.max(0, rect.top), y1 = Math.min(H, rect.bottom);
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.setScissorTest(true);
    renderer.setScissor(0, H - y1, W, y1 - y0);
    renderer.render(scene, camera);
    renderer.setScissorTest(false);
  }

  measure();
  setFocus(null);
  gsap.ticker.add(frame);
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(measure, 120); });
  document.fonts?.ready.then(measure);
  new ResizeObserver(() => measure()).observe(stage);

  // opened from an address: #team/<slug>
  const m = location.hash.match(/^#team\/(.+)$/);
  if (m) {
    const P = people.find((q) => q.p.slug === m[1]);
    if (P) {
      lenis.scrollTo(section, { immediate: true });
      setTimeout(() => { measure(); open(P.i, { push: false }); }, 400);
    }
  }

  if (local) window.__team = { people, threads, commit, revert, open, close, step, measure, shared, TU, get viewCoin() { return viewCoin; }, vs, get bakeQueue() { return bakeQueue; }, arrive, setFocus };
}
