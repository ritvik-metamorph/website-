// The services, in Light: the note. (15 Nov) The banknote from the first hero the user liked ("The
// Note", kept "for a later section"): a dark desk under one lamp and one note on it, Metamorph's own,
// promising "to help the bearer become something more". Its back already lists what it can become:
// the four services. Scrolling takes it through them, one change of form for each:
//   01 fundraising and investor readiness: the lamp clicks on; the note lies flat, the capital raised;
//   02 strategic consulting: it creases itself, twelve pleats, rising off the baize;
//   03 financial services: pinched in the middle, the pleats fan into wings;
//   04 wealth management: it lifts into the lamp's light and flies.
// The same four stages About tells (spun, the cocoon, the change, flight), here told with money:
// capital that changes form. Drag to turn it; the pointer leans the camera a little.
// In Ink the section is the plain list on paper. The words are the same elements in both versions:
// only where they stand changes (css/main.css, "services").
import * as THREE from '../assets/vendor/three.module.min.js';
import { createNoteScene } from './note-scene.js';
import { drawFront, drawBack, drawMark, drawBaize, visitSerial } from './note-art.js';

const { gsap, ScrollTrigger } = window;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Keep in step with the narrow media query in css/main.css.
const isNarrow = (W, H) => W <= H || (W < 900 && H > 520);

const AXIS = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0) };
const rot = (axis, a) => new THREE.Quaternion().setFromAxisAngle(AXIS[axis], a);
const FLAT = rot('x', -Math.PI / 2); // lying on the desk, face up

// where along the scroll each service's change of form begins and ends
const CREASE = [0.16, 0.45], FAN = [0.46, 0.68], LIFT = [0.7, 0.9], RISE = [0.9, 1];
const STAGES = [0, 0.2, 0.46, 0.7, 1]; // the four services' shares of the scroll
const AT = [0.08, 0.36, 0.6, 0.88];    // where a click on a service takes you

export function setupServices({ lenis, register, reduced, isTouch, local }) {
  const sec = $('.next'), track = $('.sv-track', sec), room = $('.sv-room', sec), canvas = $('.sv-gl', sec);
  const items = $$('.services li', sec);
  const darkTheme = document.documentElement.dataset.theme === 'dark';
  let S = null, lit = false, building = null, noGL = false;

  // ---------------------------------------------------------------- state
  const creases = Array.from({ length: 12 }, () => ({ v: 0 }));
  const light = { i: 0, shaft: 0, ambient: 0.02 };
  const pointer = { x: 0, y: 0, cx: 0, cy: 0 };
  const drag = { on: false, x: 0, yaw: 0 };
  let poses = {}, camBase = {}, narrow = false, H = 1;
  let ps = 0, lampOn = false, active = -1, forced = null;
  const P = new THREE.Vector3(), Q = new THREE.Quaternion();

  // ---------------------------------------------------------------- Ink and Light
  // (the two versions differ in height, so what is under the visitor's eye is kept where it is)
  function setLit(on) {
    if (on && noGL) on = false;
    if (on === lit) return;
    const r0 = sec.getBoundingClientRect(), y0 = scrollY, top0 = r0.top + y0;
    lit = on;
    sec.dataset.lit = String(on);
    sec.classList.toggle('is-still', on && reduced); // (reduced motion: the butterfly, already made, and all four lit)
    if (on) build();
    const h1 = sec.getBoundingClientRect().height;
    let y1 = y0;
    if (r0.bottom < innerHeight * 0.5) y1 = y0 + (h1 - r0.height);          // below it: the page moves with it
    else if (r0.top < 0) y1 = Math.min(y0, top0 + Math.max(0, h1 - innerHeight)); // inside it: never past its new end
    lenis.resize?.();
    ScrollTrigger.refresh();
    // (always set, even when it has not changed: the browser's own scroll anchoring may have moved it)
    lenis.scrollTo(y1, { immediate: true, force: true });
    layout();
  }
  register({
    name: 'services', commit: () => setLit(true), revert: () => setLit(false),
    under: (y) => {
      const r = sec.getBoundingClientRect();
      if (r.top > y || r.bottom < y) return null;
      if (!lit) return { tone: darkTheme && y - r.top < innerHeight * 0.16 ? 'light' : 'ink', lit: false };
      // (paper at its two ends, where the room fades in and out)
      const paper = y - r.top < innerHeight * 0.2 || r.bottom - y < innerHeight * 0.14;
      return { tone: paper ? 'ink' : 'light', lit: true, theme: paper ? undefined : '#050706' };
    },
  });

  // ---------------------------------------------------------------- the room, built when first lit
  function build() {
    if (building) return building;
    building = (async () => {
      // the note is printed in the site's own type, so wait for it (but never for long)
      await Promise.race([
        Promise.all(['500 80px "Ibarra Real Nova"', 'italic 400 40px "Ibarra Real Nova"', '24px "Open Sauce One"', '24px "Fragment Mono"'].map((f) => document.fonts.load(f))),
        wait(2500),
      ]);
      const serial = visitSerial();
      S = createNoteScene(canvas, { front: drawFront(serial), back: drawBack(serial), mark: drawMark(), baize: drawBaize('#1c2942', '130, 150, 192', '150, 166, 204'), quality: isTouch ? 0.7 : 1 });
      if (!S) { noGL = true; setLit(false); return; }
      // (a cleaner lamp than the first hero's amber, so the paper stays the site's cool paper and the
      // cloth its night blue)
      S.U.uLampCol.value.set(1.0, 0.925, 0.82);
      $('.sv-sr', sec).textContent = `A banknote under a desk lamp. It reads: Metamorph Capital. We promise to help the bearer become something more. Serial ${serial}. As you read the four services it folds itself into a butterfly and flies.`;
      layout();
      if (reduced) { Object.assign(light, { i: 1, shaft: 0.06, ambient: 0.05 }); lampOn = true; }
      if (local) window.__services = handle;
    })();
    return building;
  }

  function layout() {
    if (!S) return;
    const W = innerWidth;
    H = room.clientHeight || innerHeight;
    narrow = isNarrow(W, H);
    // the picture stands beside the words on a wide screen, above them on a phone
    S.layout(W, H, narrow ? 0 : W * 0.19, narrow ? -H * 0.2 : 0);
    camBase = narrow
      ? { pos: new THREE.Vector3(0, 3.5, 5.9), target: new THREE.Vector3(0, 0.75, 0) }
      : { pos: new THREE.Vector3(0, 2.7, 4.3), target: new THREE.Vector3(0, 0.42, 0) };
    const k = narrow ? 0.62 : 1;
    poses = {
      desk: { pos: new THREE.Vector3(0.04, 0.006, 0.3), quat: rot('y', 0.12).multiply(FLAT), scale: 0.86 * k },
      // (creased, it tips up towards you, so the pleats are seen as they are made)
      tilt: { quat: rot('y', 0.2).multiply(rot('x', 0.55)).multiply(FLAT) },
      hover: { pos: new THREE.Vector3(0.05, narrow ? 0.78 : 1.05, 0.6), quat: rot('x', 0.95).multiply(FLAT), scale: 0.8 * k },
    };
  }
  addEventListener('resize', layout);

  // ---------------------------------------------------------------- hands: drag to turn it
  room.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1; pointer.y = (e.clientY / innerHeight) * 2 - 1;
    if (drag.on) { drag.yaw += (e.clientX - drag.x) * 0.008; drag.x = e.clientX; }
  });
  room.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return; // (a finger scrolls the page; the note turns under a mouse)
    drag.on = true; drag.x = e.clientX;
    gsap.killTweensOf(drag);
    room.setPointerCapture?.(e.pointerId);
    room.classList.add('is-held');
  });
  const letGo = () => {
    if (!drag.on) return;
    drag.on = false;
    room.classList.remove('is-held');
    // (it comes to rest facing you again, by the shorter way round)
    gsap.to(drag, { yaw: Math.round(drag.yaw / (Math.PI * 2)) * Math.PI * 2, duration: 1.4, ease: 'power3.out' });
  };
  room.addEventListener('pointerup', letGo);
  room.addEventListener('pointercancel', letGo);

  // a service chosen from the list: the page goes to its stage
  items.forEach((li, i) => li.addEventListener('click', () => {
    if (!lit || reduced) return;
    const r = track.getBoundingClientRect();
    lenis.scrollTo(r.top + scrollY + AT[i] * (r.height - H), { duration: 1.6 });
  }));

  // ---------------------------------------------------------------- each frame
  function progress() {
    const r = track.getBoundingClientRect();
    return { p: clamp(-r.top / Math.max(1, r.height - H), 0, 1), top: r.top, seen: r.bottom > -H * 0.2 && r.top < innerHeight };
  }
  function frame(time) {
    if (!lit || !S) return;
    const { p, top, seen } = progress();
    if (!seen && forced == null) return;
    const target = reduced ? 1 : forced ?? p;
    ps = reduced || forced != null ? target : ps + (target - ps) * 0.14;
    // the lamp clicks on as the room comes up the screen: catches, dips, steadies
    if (!lampOn && (top < innerHeight * 0.6 || forced != null)) {
      lampOn = true;
      gsap.timeline()
        .to(light, { i: 0.55, duration: 0.05 }, 0.15)
        .to(light, { i: 0.12, duration: 0.07 }, 0.21)
        .to(light, { i: 1, duration: 0.4, ease: 'power2.out' }, 0.3)
        .to(light, { shaft: 0.06, ambient: 0.05, duration: 0.9 }, 0.3);
    }
    const t = reduced ? 0 : time;
    const fold01 = smooth(CREASE[0], CREASE[1], ps), fan = smooth(FAN[0], FAN[1], ps), h = smooth(LIFT[0], LIFT[1], ps), up = smooth(RISE[0], RISE[1], ps);
    // crease by crease, each a little after the last
    const step = (CREASE[1] - CREASE[0] - 0.09) / 11;
    creases.forEach((c, k) => { c.v = smooth(CREASE[0] + k * step, CREASE[0] + k * step + 0.09, ps); });
    P.copy(poses.desk.pos); P.y += 0.42 * fold01;
    P.lerp(poses.hover.pos, h);
    P.y += h * 0.045 * Math.sin(t * 1.3) + up * (narrow ? 0.14 : 0.32);
    Q.copy(poses.desk.quat).slerp(poses.tilt.quat, fold01).slerp(poses.hover.quat, h).premultiply(rot('y', drag.yaw));
    S.group.position.copy(P);
    S.group.quaternion.copy(Q);
    S.group.scale.setScalar(lerp(poses.desk.scale, poses.hover.scale, h));
    // the camera comes in slowly through the four, and leans a little with the pointer
    pointer.cx += (pointer.x - pointer.cx) * 0.06; pointer.cy += (pointer.y - pointer.cy) * 0.06;
    S.cam.pos.copy(camBase.pos).add(new THREE.Vector3(pointer.cx * 0.28, -0.3 * ps - pointer.cy * 0.12, -0.55 * ps));
    S.cam.target.copy(camBase.target).add(new THREE.Vector3(pointer.cx * 0.05, 0.36 * h + 0.22 * up, 0));
    S.U.uLampI.value = light.i;
    S.U.uShaft.value = light.shaft * (1 + 0.8 * up);
    S.U.uAmbient.value = light.ambient;
    const flap = 0.17 * h * (0.62 * Math.sin(t * 2.1) + 0.38 * Math.sin(t * 4.7 + 1.3));
    S.render(t, creases, { fan, wing: 0.72 * fan + flap });
    // the words: the service whose change is happening, and how far through it
    const now = reduced ? -1 : ps >= STAGES[3] ? 3 : ps >= STAGES[2] ? 2 : ps >= STAGES[1] ? 1 : 0;
    if (now !== active) { active = now; items.forEach((li, i) => li.classList.toggle('is-on', i === now)); }
    items.forEach((li, i) => li.style.setProperty('--p', clamp((ps - STAGES[i]) / (STAGES[i + 1] - STAGES[i]), 0, 1).toFixed(3)));
  }
  gsap.ticker.add(frame);

  // (local testing: set where the scroll is, by hand)
  const handle = {
    get S() { return S; }, get lit() { return lit; }, get p() { return ps; },
    set p(v) { forced = v; }, setLit, light,
    tick(n = 1) { for (let i = 0; i < n; i++) frame(performance.now() / 1000); },
  };
  if (local) window.__services = handle;
  return handle;
}
