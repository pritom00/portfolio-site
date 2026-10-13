import * as THREE from 'three';
(globalThis as any).window = globalThis;
(globalThis as any).document = { createElement: () => ({ width: 0, height: 0, getContext: () => ({ createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }), putImageData() {}, fillRect() {}, fillStyle: '', createRadialGradient: () => ({ addColorStop() {} }) }) }) };
import { createDogReal } from '../src/lib/dogReal';

let failed = 0;
const check = (name: string, ok: boolean, detail = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  (' + detail + ')' : ''}`); if (!ok) failed++; };

const stub = { setPixelRatio() {}, setSize() {}, setClearColor() {}, render() {}, dispose() {}, outputEncoding: 0 };
const container: any = { style: {} };
const dog = createDogReal({} as any, { renderer: stub, manual: true, container, width: 168, height: 126 });
check('engine creates', !!dog);
const { S, legs, root, PXU, PZU, GAITS, GP, LEGS, proj } = dog.dbg;
const dt = 1 / 60;
const frac = (x: number) => x - Math.floor(x);

// ---- 1. nothing happens until the cursor appears
check('hidden before first target', container.style.opacity === undefined);
dog.setTarget(500, 300);
for (let i = 0; i < 90; i++) dog.tick(dt);
check('fades in and places itself on the page', Number(container.style.opacity) > 0.95 && /translate\(/.test(container.style.transform));

// ---- 2. foot contact: stance paws must stay planted (no skating) at every gait
function skate(label: string, tx: number, minV: number, maxV: number, frames: number) {
  dog.setTarget(500, 300);
  for (let i = 0; i < 300; i++) dog.tick(dt);                    // settle
  dog.setTarget(tx, 300);
  let n = 0, sum = 0, max = 0, maxY = 0, vsum = 0, vn = 0; const prev: any = {};
  for (let i = 0; i < frames; i++) {
    dog.tick(dt);
    const v = S.speed;
    if (v < minV || v > maxV) { for (const k of LEGS) prev[k] = null; continue; }
    vsum += v; vn++;
    for (const k of LEGS) {
      const pw = new THREE.Vector3(); legs[k].paw.getWorldPosition(pw);
      const pl = root.worldToLocal(pw.clone());
      const G = v < 1.2 ? GAITS.walk : v < 3.4 ? GAITS.trot : GAITS.gallop;
      const tt = frac(S.phi + G.off[k]);
      const stance = tt > 0.05 && tt < G.beta - 0.05;
      if (prev[k] && prev[k].stance && stance) {
        const err = Math.abs((pl.x - prev[k].x) / dt + v);
        n++; sum += err; max = Math.max(max, err); maxY = Math.max(maxY, Math.abs(pl.y - GP));
      }
      prev[k] = { x: pl.x, stance };
    }
  }
  const mean = sum / Math.max(1, n), vAvg = vsum / Math.max(1, vn);
  check(`${label}: paws planted`, n > 10 && mean < 0.08 * Math.max(vAvg, 1), `speed~${vAvg.toFixed(2)} u/s, mean skate ${mean.toFixed(3)} u/s, max paw height error ${(maxY * 100).toFixed(1)} cm-units, ${n} samples`);
  check(`${label}: paw height on ground`, maxY < 0.03, `${maxY.toFixed(3)}`);
}
skate('walk  ', 500 + PXU * 3.4, 0.4, 0.95, 400);
skate('trot  ', 500 + PXU * 6.5, 1.4, 3.0, 400);
skate('gallop', 500 + PXU * 14, 4.0, 6.5, 600);

// ---- 3. speed limits and gait selection
dog.setTarget(500 + PXU * 30, 300);
let vmax = 0; for (let i = 0; i < 400; i++) { dog.tick(dt); vmax = Math.max(vmax, S.speed); }
check('top speed is capped (6 u/s)', vmax <= 6.01 && vmax > 5, `max ${vmax.toFixed(2)}`);

// ---- 4. acceleration is smooth (no teleporting speed changes)
dog.setTarget(500, 300); for (let i = 0; i < 400; i++) dog.tick(dt);
dog.setTarget(500 + PXU * 12, 300);
let maxAcc = 0, last = S.speed; for (let i = 0; i < 200; i++) { dog.tick(dt); maxAcc = Math.max(maxAcc, Math.abs(S.speed - last) / dt); last = S.speed; }
check('acceleration/braking is bounded', maxAcc <= 8.6, `${maxAcc.toFixed(2)} u/s^2`);

// ---- 5. turning: the dog faces where it goes, and turn rate is limited
dog.setTarget(400, 400); for (let i = 0; i < 400; i++) dog.tick(dt);
dog.setTarget(400 + PXU * 12, 400);                      // to the right
for (let i = 0; i < 240; i++) dog.tick(dt);
const yawRight = S.yaw;
let maxTurn = 0, ly = S.yaw;
dog.setTarget(400 - PXU * 12, 400);                      // swing to the left
for (let i = 0; i < 360; i++) { dog.tick(dt); const d = Math.abs(Math.atan2(Math.sin(S.yaw - ly), Math.cos(S.yaw - ly))) / dt; maxTurn = Math.max(maxTurn, d); ly = S.yaw; }
const yawLeft = S.yaw;
check('faces right when heading right', Math.abs(Math.atan2(Math.sin(yawRight), Math.cos(yawRight))) < 0.5, `yaw ${yawRight.toFixed(2)} rad`);
check('faces left after reversing', Math.abs(Math.abs(Math.atan2(Math.sin(yawLeft), Math.cos(yawLeft))) - Math.PI) < 0.6, `yaw ${yawLeft.toFixed(2)} rad`);
check('turn rate is limited (<= 7 rad/s)', maxTurn <= 7.05, `${maxTurn.toFixed(2)} rad/s`);

// ---- 6. stops near the cursor, then sits after being left alone
const px = S.wx * PXU, py = S.wz * PZU;
dog.setTarget(px + 100, py);
for (let i = 0; i < 60 * 8; i++) dog.tick(dt);
const dist = Math.hypot(S.tx - S.wx, S.tz - S.wz);
check('stops at a stand-off distance, not on the cursor', S.speed === 0 && dist > 0.9 && dist < 2.4, `${dist.toFixed(2)} u away`);
check('sits after a few seconds idle', S.sit > 0.95, `sit ${S.sit.toFixed(2)}`);
dog.setTarget(S.wx * PXU + PXU * 8, S.wz * PZU);
for (let i = 0; i < 60 * 2; i++) dog.tick(dt);
check('stands up and moves when the cursor leaves', S.sit < 0.05 && S.speed > 0.5, `sit ${S.sit.toFixed(2)}, speed ${S.speed.toFixed(2)}`);

// ---- 7. fits inside its canvas in every pose
function extents() {
  root.updateMatrixWorld(true);
  const rig = root.children[0]; const v = new THREE.Vector3(); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  rig.traverse((o: any) => { if (!o.isMesh) return; const p = o.geometry.attributes.position; const step = Math.max(1, Math.floor(p.count / 120));
    for (let i = 0; i < p.count; i += step) { v.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(o.matrixWorld); const q = proj(v.x, v.y, v.z); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); } });
  return { x0, x1, y0, y1 };
}
let worst = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 };
for (const yaw of [0, -Math.PI / 2, Math.PI / 2, Math.PI]) { S.yaw = yaw; dog.tick(0); const e = extents(); worst = { x0: Math.min(worst.x0, e.x0), x1: Math.max(worst.x1, e.x1), y0: Math.min(worst.y0, e.y0), y1: Math.max(worst.y1, e.y1) }; }
check('never clipped by its 168x126 canvas', worst.x0 >= 0 && worst.x1 <= 168 && worst.y0 >= 0 && worst.y1 <= 126, `x ${worst.x0.toFixed(0)}..${worst.x1.toFixed(0)}, y ${worst.y0.toFixed(0)}..${worst.y1.toFixed(0)}`);
check('dog is small (about 80 px long)', (worst.x1 - worst.x0) < 130, `${(worst.x1 - worst.x0).toFixed(0)} px incl. every turn angle`);

// ---- 8. bark, leave, dispose
dog.bark(); for (let i = 0; i < 40; i++) dog.tick(dt);
dog.clearTarget(); for (let i = 0; i < 90; i++) dog.tick(dt);
check('fades out when the cursor leaves', Number(container.style.opacity) < 0.02, container.style.opacity);
dog.dispose();
check('disposes cleanly', true);

console.log(failed ? `\n${failed} CHECK(S) FAILED` : '\nALL DOG ENGINE CHECKS PASSED');
process.exit(failed ? 1 : 0);
