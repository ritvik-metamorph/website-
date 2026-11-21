// The walk's hands (21 Nov): one continuous surface on a skeleton, bent by its bones (js/walk-hand-worker.js makes
// the surface, off the main thread, from the bones' places at rest). A right hand: the wrist at 0, the fingers along
// +y, the palm facing -z, the thumb's side -x; the left is the same, mirrored. Bare skin by default (the user: the
// gloves need not stay, "it should look realistic… mainly, it shouldn't look like a robot"); ?hands=gloves dresses
// the same hands in the white cotton gloves.
import * as THREE from '../assets/vendor/three.module.min.js';

// [x and y of the knuckle, the three bones' lengths, radius, splay, how far it turns in as it curls]
export const FINGERS = [
  [-0.0262, 0.09, [0.044, 0.026, 0.021], 0.0087, 0.08, 0.05],    // index
  [-0.0088, 0.0935, [0.048, 0.03, 0.0225], 0.009, 0.015, 0],     // middle
  [0.009, 0.0905, [0.045, 0.028, 0.0215], 0.0085, -0.06, -0.09], // ring
  [0.0256, 0.0825, [0.036, 0.0215, 0.019], 0.0076, -0.15, -0.18], // little
];
// the thumb: its root bone (in the palm, from the wrist's side) and two more, each [r0, r1]
export const THUMB = { at: [-0.0195, 0.013, -0.005], lens: [0.036, 0.031, 0.026], r: [[0.0128, 0.0116], [0.0112, 0.0103], [0.0102, 0.0092]] };
// the pose the surface is made in: fingers a little bent, so neither a fist nor a flat hand bends it too far
const BIND = { f: [0.24, 0.3, 0.16], t: [0.12, 0.16], td: new THREE.Vector3(-0.52, 0.76, -0.4).normalize(), tb: new THREE.Vector3(-0.7, 0.05, 0.7).normalize() };

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _m = new THREE.Matrix4(), _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3();
// the turn that points a thing's +y along dir with its +z towards back
export function aim(dir, back, out) {
  _y.copy(dir).normalize();
  _z.copy(back).addScaledVector(_y, -_z.copy(back).dot(_y)).normalize();
  _x.crossVectors(_y, _z);
  _m.makeBasis(_x, _y, _z);
  return out.setFromRotationMatrix(_m);
}

// the skeleton: the palm (0), each finger's three bones (1 to 12), the thumb's three (13 to 15)
function makeRig() {
  const root = new THREE.Bone(), bones = [root], e = new THREE.Euler();
  FINGERS.forEach(([x, y, lens, , splay]) => {
    let parent = root;
    lens.forEach((L, j) => {
      const b = new THREE.Bone();
      if (j === 0) { b.position.set(x, y, 0.0005); b.quaternion.setFromEuler(e.set(-BIND.f[0], 0, splay, 'ZYX')); }
      else { b.position.set(0, lens[j - 1], 0); b.rotation.set(-BIND.f[j], 0, 0); }
      parent.add(b);
      bones.push(b);
      parent = b;
    });
  });
  const meta = new THREE.Bone();
  meta.position.set(...THUMB.at);
  aim(BIND.td, BIND.tb, meta.quaternion);
  root.add(meta);
  const t1 = new THREE.Bone();
  t1.position.set(0, THUMB.lens[0], 0);
  t1.rotation.set(-BIND.t[0], 0, 0);
  meta.add(t1);
  const t2 = new THREE.Bone();
  t2.position.set(0, THUMB.lens[1], 0);
  t2.rotation.set(-BIND.t[1], 0, 0);
  t1.add(t2);
  bones.push(meta, t1, t2);
  root.updateMatrixWorld(true);
  return { root, bones };
}
// the bones at rest, as the worker needs them: each one's two ends, radii, the back of the finger, its neighbours
function segsOf(rig) {
  const out = [], A = new THREE.Vector3(), B = new THREE.Vector3(), X = new THREE.Vector3(), q = new THREE.Quaternion();
  const push = (idx, L, r0, r1, flat, kind, group, parent, child, first, tip) => {
    const bone = rig.bones[idx];
    bone.getWorldPosition(A);
    B.set(0, L, 0);
    bone.localToWorld(B);
    bone.getWorldQuaternion(q);
    X.set(1, 0, 0).applyQuaternion(q);
    const d = B.clone().sub(A).normalize(), n = X.clone().cross(d).normalize();
    out.push({ a: A.toArray(), b: B.toArray(), r0, r1, flat, n: n.toArray(), B: X.toArray(), bone: idx, parent, child, kind, group, first, tip });
  };
  const K = [1, 0.94, 0.88, 0.8];
  FINGERS.forEach(([, , lens, r], i) => lens.forEach((L, j) => {
    const idx = 1 + i * 3 + j;
    push(idx, L, r * K[j], r * K[j + 1], 0.86, 'finger', `f${i}`, j === 0 ? 0 : idx - 1, j < 2 ? idx + 1 : -1, j === 0, j === 2);
  }));
  push(13, THUMB.lens[0], ...THUMB.r[0], 0.8, 'meta', 'm', 0, 14, false, false);
  push(14, THUMB.lens[1], ...THUMB.r[1], 0.88, 'thumb', 't', 13, 15, false, false);
  push(15, THUMB.lens[2], ...THUMB.r[2], 0.88, 'thumb', 't', 14, -1, false, true);
  return out;
}

// the surface, made once (both hands share it), off the main thread
export function makeHandGeometry({ cell = 0.0018, glove = false } = {}) {
  const segs = segsOf(makeRig());
  return new Promise((resolve, reject) => {
    let worker;
    try { worker = new Worker(new URL('./walk-hand-worker.js', import.meta.url)); } catch (e) { reject(e); return; }
    worker.onmessage = (ev) => {
      const d = ev.data;
      worker.terminate();
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(d.position, 3));
      g.setAttribute('normal', new THREE.BufferAttribute(d.normal, 3));
      g.setAttribute('color', new THREE.BufferAttribute(d.color, 3));
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(d.skinIndex, 4));
      g.setAttribute('skinWeight', new THREE.BufferAttribute(d.skinWeight, 4));
      g.setIndex(new THREE.BufferAttribute(d.index, 1));
      g.computeBoundingSphere();
      resolve(g);
    };
    worker.onerror = (e) => { worker.terminate(); reject(e); };
    worker.postMessage({ segs, cell, glove });
  });
}

// skin: a little sheen of warm light at the edges, where light passes through skin; the gloves' cotton otherwise
export function handMaterial(glove) {
  return glove
    ? new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.9, sheen: 1, sheenRoughness: 0.5, sheenColor: new THREE.Color('#f4f5f2') })
    : new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.52, sheen: 0.45, sheenRoughness: 0.72, sheenColor: new THREE.Color('#eda58e'), specularIntensity: 0.32 });
}

// one hand on its skeleton, bound to the shared surface
export function makeHand(geometry, material, left) {
  const rig = makeRig();
  const mesh = new THREE.SkinnedMesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.add(rig.root);
  const holder = new THREE.Group();
  if (left) holder.scale.x = -1;
  holder.add(mesh);
  holder.updateMatrixWorld(true);
  mesh.bind(new THREE.Skeleton(rig.bones));
  return { holder, mesh, bones: rig.bones };
}

// a pose on the bones: each finger's three bends and how far the fingers spread; the thumb's root pointing along td
// with its nail towards tb, its two joints bent; idle: a small drift for each finger
const _e = new THREE.Euler();
export function poseHand(h, P, idle) {
  FINGERS.forEach(([, , , , splay, turn], i) => {
    const w = idle ? idle[i] : 0;
    const c0 = P.curl[i][0] + w, c1 = P.curl[i][1] + w * 0.8, c2 = P.curl[i][2] + w * 0.6;
    const curled = clamp((c0 + c1) / 2.8, 0, 1);
    // (fingers draw together and turn in towards the thumb as they curl, as a hand's do)
    h.bones[1 + i * 3].quaternion.setFromEuler(_e.set(-c0, turn * curled, splay * P.spread * (1 - 0.45 * curled), 'ZYX'));
    h.bones[2 + i * 3].rotation.set(-c1, 0, 0);
    h.bones[3 + i * 3].rotation.set(-c2, 0, 0);
  });
  aim(P.td, P.tb, h.bones[13].quaternion);
  h.bones[14].rotation.set(-P.tc[1], 0, 0);
  h.bones[15].rotation.set(-P.tc[2], 0, 0);
}
