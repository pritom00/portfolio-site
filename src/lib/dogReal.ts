// @ts-nocheck
/**
 * Procedural 3D dog with physically-based locomotion (three.js).
 *
 * Why it should not look "fake":
 *  - the dog is a real moving agent: it steers toward the cursor with acceleration, turn-rate limits and a stand-off distance
 *  - the stride cycle advances with distance travelled (speed / stride length), so paws never skate
 *  - each paw follows a foot trajectory (stance = planted, swing = lifted arc) and every leg is solved with inverse kinematics
 *  - real footfall orders: walk (lateral sequence), trot (diagonal pairs), gallop (suspension phase, spine flexion)
 *  - secondary motion (ears, tail, head) comes from springs driven by the body, not looped sine waves
 *  - idle behaviour: head follows the cursor, blinks, breathes, ear flicks, sits after a while
 *
 * File is intentionally untyped (ts-nocheck): it is a self-contained simulation ported from a tested prototype.
 * Public API: createDogReal(canvas, { width, height, container }) -> { setTarget, clearTarget, bark, dispose }
 */
import * as THREE from 'three';

/* Original procedural 3D dog with physically-based locomotion. Needs three.js (global THREE).
 *
 * Why it should not look "fake":
 *  - the dog is a real moving agent: it steers toward the cursor with acceleration, turn-rate limits and a stand-off distance
 *  - stride cycle advances with distance travelled (speed / stride length), so paws never skate
 *  - each paw follows a foot trajectory (stance = planted and moving backwards at ground speed, swing = lifted arc)
 *    and every leg is solved with inverse kinematics, so contact with the ground is exact
 *  - real footfall orders: walk (lateral sequence), trot (diagonal pairs), gallop (suspension phase, spine flexion)
 *  - secondary motion (ears, tail, head) comes from springs driven by the body, not from looped sine waves
 *  - idle behaviour: head follows the cursor, blinks, breathes, ear flicks, sits after a while
 */
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function sstep(a, b, x) { var t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function frac(x) { return x - Math.floor(x); }
  function angDiff(a, b) {
    var d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }
  function nowMs() { return (typeof performance !== 'undefined' ? performance.now() : Date.now()); }
  function Sp(k, d) { this.x = 0; this.v = 0; this.k = k; this.d = d; }
  Sp.prototype.step = function (target, dt) {
    var n = 3, h = dt / n, i;
    for (i = 0; i < n; i++) {
      var a = this.k * (target - this.x) - this.d * this.v;
      this.v += a * h;
      this.x += this.v * h;
    }
    return this.x;
  };

  /* two-link IK in a vertical plane. angles measured from "straight down", positive = forward (+X). */
  function ik2(tx, ty, L1, L2, kneeBack) {
    var d = Math.sqrt(tx * tx + ty * ty);
    var dd = clamp(d, Math.abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3);
    var th = Math.atan2(tx, -ty);
    var A = Math.acos(clamp((L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), -1, 1));
    var B = Math.acos(clamp((L2 * L2 + dd * dd - L1 * L1) / (2 * L2 * dd), -1, 1));
    return kneeBack ? [th - A, th + B] : [th + A, th - B];
  }

export function createDogReal(canvas: HTMLCanvasElement, opts: any): any {
    opts = opts || {};
    var W = opts.width || 168, H = opts.height || 126;
    var container = opts.container || null;

    var renderer;
    try {
      renderer = opts.renderer || new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    } catch (e) { return null; }
    renderer.setPixelRatio(Math.min((typeof window.devicePixelRatio === 'number' ? window.devicePixelRatio : 1), 2));
    renderer.setSize(W, H, false);
    if (renderer.outputEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setClearColor(0x000000, 0);

    var scene = new THREE.Scene();
    var cam = new THREE.PerspectiveCamera(30, W / H, 0.1, 50);
    cam.position.set(0, 3.81, 5.71);
    cam.lookAt(0, 0.42, 0);
    cam.updateMatrixWorld(true);

    scene.add(new THREE.HemisphereLight(0xfff6ea, 0x8a7358, 1.3));
    var key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(2.2, 3.5, 3.2);
    key.intensity = 1.7;
    scene.add(key);
    var rim = new THREE.DirectionalLight(0x8dffc0, 1.5);
    rim.position.set(-3, 2.5, -3);
    scene.add(rim);

    /* screen <-> ground-plane mapping measured from the real camera */
    var pv = new THREE.Vector3();
    function proj(x, y, z) { pv.set(x, y, z).project(cam); return { x: (pv.x * 0.5 + 0.5) * W, y: (-pv.y * 0.5 + 0.5) * H }; }
    var o0 = proj(0, 0, 0), ox1 = proj(1, 0, 0), oz1 = proj(0, 0, 1);
    var PXU = Math.abs(ox1.x - o0.x) || 50;   /* screen px per world unit along X */
    var PZU = Math.abs(oz1.y - o0.y) || 28;   /* screen px per world unit along Z (foreshortened) */

    /* ---------- fur: layered shells with a noise alpha map ---------- */
    var furTex = null;
    try {
      var nc = document.createElement('canvas');
      nc.width = nc.height = 64;
      var ng = nc.getContext('2d');
      var img = ng.createImageData(64, 64);
      for (var q = 0; q < 64 * 64; q++) {
        var v = Math.floor(Math.random() * 255);
        img.data[q * 4] = v; img.data[q * 4 + 1] = v; img.data[q * 4 + 2] = v; img.data[q * 4 + 3] = 255;
      }
      ng.putImageData(img, 0, 0);
      furTex = new THREE.CanvasTexture(nc);
      furTex.wrapS = furTex.wrapT = THREE.RepeatWrapping;
      furTex.repeat.set(7, 5);
    } catch (e) { furTex = null; }

    var sph = new THREE.SphereGeometry(1, 20, 14);
    var matCache = {};
    function baseMat(hex, k, shells) {
      var id = hex + '_' + k + '_' + shells;
      if (matCache[id]) return matCache[id];
      var c = new THREE.Color(hex);
      if (k > 0) c.lerp(new THREE.Color(0xffffff), 0.03 * k);
      var m = new THREE.MeshStandardMaterial({ color: c, roughness: 1, metalness: 0 });
      if (k > 0 && furTex) { m.alphaMap = furTex; m.alphaTest = 0.2 + 0.55 * (k / shells); }
      matCache[id] = m;
      return m;
    }
    function fur(hex, sx, sy, sz, x, y, z, shells, thick) {
      var g = new THREE.Group();
      g.position.set(x || 0, y || 0, z || 0);
      var core = new THREE.Mesh(sph, baseMat(hex, 0, shells));
      core.scale.set(sx, sy, sz);
      g.add(core);
      if (furTex) {
        var n = shells === undefined ? 4 : shells, th = thick === undefined ? 0.05 : thick, k;
        for (k = 1; k <= n; k++) {
          var t = th * k / n;
          var sh = new THREE.Mesh(sph, baseMat(hex, k, n));
          sh.scale.set(sx + t, sy + t, sz + t);
          g.add(sh);
        }
      }
      return g;
    }
    function M(c, r, m) { return new THREE.MeshStandardMaterial({ color: c, roughness: r === undefined ? 0.5 : r, metalness: m || 0 }); }
    var dark = M(0x120d09, 0.25), eyeMat = M(0x1a0f08, 0.15), tongueMat = M(0xFF7A9A, 0.45);
    var collarMat = M(0x20BE35, 0.55), tagMat = M(0xFFCE06, 0.3, 0.6);
    var shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    function ell(mat, sx, sy, sz, x, y, z) {
      var m = new THREE.Mesh(sph, mat);
      m.scale.set(sx, sy, sz);
      m.position.set(x || 0, y || 0, z || 0);
      return m;
    }

    var CREAM = 0x4B2C1B, WHITE = 0xD6B088, APRICOT = 0x452818, APRICOT_D = 0x2D170C, MASK = 0xDDBB93;

    var root = new THREE.Group();
    scene.add(root);
    var rig = new THREE.Group();
    root.add(rig);

    /* soft ground shadow */
    var shadowMat;
    try {
      var sc = document.createElement('canvas');
      sc.width = sc.height = 64;
      var g2 = sc.getContext('2d');
      var gr = g2.createRadialGradient(32, 32, 2, 32, 32, 30);
      gr.addColorStop(0, 'rgba(0,0,0,0.5)');
      gr.addColorStop(1, 'rgba(0,0,0,0)');
      g2.fillStyle = gr;
      g2.fillRect(0, 0, 64, 64);
      shadowMat = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false });
    } catch (e) {
      shadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.25, depthWrite: false });
    }
    var shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.1), shadowMat);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.004;
    root.add(shadow);

    /* ---------- body: three segments joined by a flexible spine ---------- */
    var BODY_Y = 0.70;
    var midG = new THREE.Group(); midG.position.set(0, BODY_Y, 0); rig.add(midG);
    midG.add(fur(CREAM, 0.54, 0.42, 0.42, 0, 0, 0, 4, 0.06));
    var pelvisG = new THREE.Group(); pelvisG.position.set(-0.30, BODY_Y, 0); rig.add(pelvisG);
    pelvisG.add(fur(CREAM, 0.34, 0.38, 0.38, 0, 0, 0, 4, 0.06));
    var chestG = new THREE.Group(); chestG.position.set(0.30, BODY_Y, 0); rig.add(chestG);
    chestG.add(fur(CREAM, 0.34, 0.40, 0.40, 0, 0.02, 0, 4, 0.06));
    chestG.add(fur(WHITE, 0.20, 0.30, 0.33, 0.20, -0.06, 0, 4, 0.07));

    /* neck + head */
    var neckG = new THREE.Group(); neckG.position.set(0.20, 0.12, 0); chestG.add(neckG);
    neckG.add(fur(CREAM, 0.20, 0.22, 0.22, 0.08, 0.04, 0, 3, 0.05));
    var collarG = new THREE.Group(); collarG.position.set(0.06, 0.0, 0); collarG.rotation.z = 1.05; neckG.add(collarG);
    var collar = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.032, 10, 28), collarMat);
    collar.rotation.y = Math.PI / 2; collarG.add(collar);
    var tag = new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 10), tagMat);
    tag.position.set(0, -0.21, 0); collar.add(tag);

    var headG = new THREE.Group(); headG.position.set(0.19, 0.10, 0); neckG.add(headG);
    headG.add(fur(APRICOT, 0.34, 0.31, 0.33, 0, 0, 0, 5, 0.06));
    headG.add(fur(MASK, 0.26, 0.19, 0.27, 0.13, -0.08, 0, 4, 0.045));
    headG.add(fur(MASK, 0.15, 0.13, 0.13, 0.05, -0.12, 0.21, 4, 0.05));
    headG.add(fur(MASK, 0.15, 0.13, 0.13, 0.05, -0.12, -0.21, 4, 0.05));
    headG.add(fur(MASK, 0.15, 0.11, 0.13, 0.33, -0.06, 0, 3, 0.03));
    headG.add(ell(dark, 0.048, 0.036, 0.05, 0.47, -0.02, 0));
    var jaw = new THREE.Group(); jaw.position.set(0.22, -0.12, 0); headG.add(jaw);
    jaw.add(ell(M(0xDDBB93, 0.9), 0.12, 0.035, 0.085, 0.10, -0.005, 0));
    var tongue = ell(tongueMat, 0.05, 0.014, 0.04, 0.15, 0.0, 0);
    jaw.add(tongue);
    var eyes = [], sides = [-1, 1], i, s;
    for (i = 0; i < 2; i++) {
      s = sides[i];
      var eye = ell(eyeMat, 0.056, 0.064, 0.046, 0.26, 0.06, s * 0.15);
      headG.add(eye); eyes.push(eye);
      var sh = ell(shineMat, 0.017, 0.017, 0.012, 0.29, 0.085, s * 0.185);
      eye.userData.shine = sh; headG.add(sh);
    }
    var browMat = M(0xB98F63, 0.9);
    for (i = 0; i < 2; i++) headG.add(ell(browMat, 0.035, 0.022, 0.03, 0.24, 0.145, sides[i] * 0.15));
    var ears = [];
    for (i = 0; i < 2; i++) {
      s = sides[i];
      var p = new THREE.Group(); p.position.set(-0.02, 0.26, s * 0.17); headG.add(p);
      p.add(fur(APRICOT_D, 0.075, 0.12, 0.05, 0, 0.07, 0, 3, 0.03));
      ears.push({ p: p, s: s });
    }

    /* plume tail curled over the back */
    var tailG = new THREE.Group(); tailG.position.set(-0.20, 0.14, 0); pelvisG.add(tailG);
    var tailSegs = [], parent = tailG, ti;
    var tailBase = [-0.55, -0.7, -0.7, -0.55];
    for (ti = 0; ti < 4; ti++) {
      var seg = new THREE.Group();
      seg.position.set(ti === 0 ? 0 : -0.15, 0, 0);
      parent.add(seg);
      seg.add(fur(ti < 3 ? CREAM : WHITE, 0.15 + ti * 0.012, 0.13 + ti * 0.012, 0.13 + ti * 0.012, -0.08, 0, 0, 4, 0.08));
      tailSegs.push(seg); parent = seg;
    }

    /* ---------- legs: 3 segments each, solved by IK ---------- */
    var GP = 0.08;                     /* height of the paw pivot above the ground when planted */
    function makeLeg(par, x, y, z, far, L1, L2, L3, r1, r2) {
      var hex = far ? 0x3A2012 : CREAM;
      var hip = new THREE.Group(); hip.position.set(x, y, z); par.add(hip);
      hip.add(fur(hex, r1, L1 * 0.58, r1, 0, -L1 * 0.5, 0, 3, 0.04));
      var j2 = new THREE.Group(); j2.position.set(0, -L1, 0); hip.add(j2);
      j2.add(fur(hex, r2, L2 * 0.58, r2, 0, -L2 * 0.5, 0, 3, 0.04));
      var j3 = new THREE.Group(); j3.position.set(0, -L2, 0); j2.add(j3);
      j3.add(fur(hex, r2 * 0.8, L3 * 0.7 + 0.02, r2 * 0.8, 0, -L3 * 0.5, 0, 2, 0.03));
      var paw = new THREE.Group(); paw.position.set(0, -L3, 0); j3.add(paw);
      paw.add(fur(WHITE, 0.15, 0.06, 0.12, 0.035, -0.02, 0, 3, 0.04));
      return { hip: hip, j2: j2, j3: j3, paw: paw, L1: L1, L2: L2, L3: L3 };
    }
    var legs = {
      RF: makeLeg(chestG, 0.06, -0.12, 0.17, false, 0.23, 0.25, 0.06, 0.115, 0.10),
      LF: makeLeg(chestG, 0.06, -0.12, -0.17, true, 0.23, 0.25, 0.06, 0.115, 0.10),
      RH: makeLeg(pelvisG, 0.0, -0.12, 0.17, false, 0.24, 0.24, 0.14, 0.125, 0.10),
      LH: makeLeg(pelvisG, 0.0, -0.12, -0.17, true, 0.24, 0.24, 0.14, 0.125, 0.10)
    };
    var LEGS = ['RF', 'LF', 'RH', 'LH'];
    var FRONT = { RF: true, LF: true, RH: false, LH: false };
    var HIP_X = { RF: 0.36, LF: 0.36, RH: -0.30, LH: -0.30 };    /* hip x in root space at rest */
    var PARENT = { RF: chestG, LF: chestG, RH: pelvisG, LH: pelvisG };

    /* gait definitions: stride length S (world units), duty factor, foot lift, footfall phase offsets */
    var GAITS = {
      walk:   { S: 0.44, beta: 0.66, lift: 0.05,  off: { RF: 0.75, LF: 0.25, RH: 0.5, LH: 0.0 }, xcF: 0.0,  xcH: 0.0 },
      trot:   { S: 0.80, beta: 0.52, lift: 0.075, off: { RF: 0.5,  LF: 0.0,  RH: 0.0, LH: 0.5 }, xcF: 0.01, xcH: 0.0 },
      gallop: { S: 1.20, beta: 0.34, lift: 0.11,  off: { RF: 0.6,  LF: 0.5,  RH: 0.08, LH: 0.0 }, xcF: 0.04, xcH: 0.03 }
    };
    function foot(G, front, tt, sc) {
      var xs = G.S * (sc || 1) * G.beta / 2, xc = front ? G.xcF : G.xcH, x, y, phi, u, sw, e, fold;
      if (tt < G.beta) {
        u = tt / G.beta;
        x = xc + xs * (1 - 2 * u); y = GP;
        phi = front ? lerp(0.2, -0.2, u) : lerp(0.35, -0.15, u);
      } else {
        sw = (tt - G.beta) / (1 - G.beta);
        e = sw * sw * (3 - 2 * sw);
        fold = Math.sin(Math.PI * sw);
        x = xc - xs + 2 * xs * e;
        y = GP + G.lift * Math.pow(fold, 0.75);
        phi = front ? lerp(-0.2, 0.2, e) - 0.75 * fold : lerp(-0.15, 0.35, e) - 0.5 * fold;
      }
      return [x, y, phi];
    }

    /* ---------- snow puffs (kicked up at toe-off when running) ---------- */
    var puffGeo = new THREE.SphereGeometry(0.05, 8, 6);
    var puffs = [], pj;
    for (pj = 0; pj < 18; pj++) {
      var pm = new THREE.Mesh(puffGeo, new THREE.MeshBasicMaterial({ color: pj % 4 === 0 ? 0xB5FDCE : 0xffffff, transparent: true, opacity: 0 }));
      pm.visible = false; scene.add(pm);
      puffs.push({ m: pm, life: 0, vx: 0, vy: 0, vz: 0 });
    }
    var puffIdx = 0, tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();
    function rootLocal(obj, out) { obj.getWorldPosition(out); return root.worldToLocal(out); }
    function spawnPuff(leg, speed) {
      leg.paw.getWorldPosition(tmpV2);
      var pf = puffs[puffIdx++ % puffs.length];
      pf.m.position.set(tmpV2.x, 0.05, tmpV2.z);
      var fx = Math.cos(S.yaw), fz = -Math.sin(S.yaw);
      pf.vx = -fx * 0.8 + (Math.random() - 0.5) * 0.7;
      pf.vz = -fz * 0.8 + (Math.random() - 0.5) * 0.7;
      pf.vy = 0.6 + Math.random() * 0.9 + speed * 0.12;
      pf.life = 0.7; pf.m.visible = true; pf.m.scale.setScalar(0.5);
    }

    /* ---------- the agent ---------- */
    var S = {
      wx: 0, wz: 0, yaw: -0.8, speed: 0, phi: 0, turn: 0,
      has: false, tx: 0, tz: 0, placed: false, alpha: 0,
      idleT: 0, sit: 0, sitTarget: 0, lastDy: 0,
      barkAt: -1e9, blinkT: 2.5, blinkP: 0, earFlick: [0, 0], earT: 5, tAcc: 0,
      wag: 0, pant: 0, prevT: { RF: 0, LF: 0, RH: 0, LH: 0 }
    };
    var ctl = { visible: false };
    var earSp = [new Sp(120, 8), new Sp(120, 8)], tailSp = new Sp(60, 5), headYawSp = new Sp(55, 9), headPitchSp = new Sp(60, 9), bobSp = new Sp(90, 10);

    var VMAX = 6.0, STANDOFF = 1.35;

    function setTarget(px, py) {
      S.has = true;
      S.tx = px / PXU; S.tz = py / PZU;
      if (!S.placed || S.alpha < 0.05) {
        S.wx = S.tx - 2.2; S.wz = S.tz + 1.0;
        S.yaw = Math.atan2(-(S.tz - S.wz), S.tx - S.wx);
        S.speed = 0; S.sit = 0; S.sitTarget = 0; S.idleT = 0;
        S.placed = true;
      }
      ctl.visible = true;
    }
    function clearTarget() { S.has = false; ctl.visible = false; }
    function bark() { S.barkAt = nowMs(); }

    function tick(dt) {
      S.tAcc += dt;
      var t = S.tAcc;

      /* visibility fade */
      S.alpha += ((ctl.visible ? 1 : 0) - S.alpha) * Math.min(1, dt * 6);

      /* --- steering --- */
      var dx = S.tx - S.wx, dz = S.tz - S.wz;
      var dist = Math.sqrt(dx * dx + dz * dz);
      var psi = Math.atan2(-dz, dx);
      var err = angDiff(S.yaw, psi);
      var wantMove = S.has && dist > STANDOFF + 0.15;
      var vd = 0;
      if (S.has) {
        vd = clamp((dist - STANDOFF) * 1.9, 0, VMAX);
        if (wantMove) vd = Math.max(vd, 0.9);
        if (!wantMove) vd = 0;
        vd *= clamp(1 - Math.abs(err) / 1.7, 0.15, 1);
      }
      if (S.sit > 0.3) vd = 0;                                  /* stand up before moving off */
      var accel = 5.0, decel = 8.5;
      S.speed += clamp(vd - S.speed, -decel * dt, accel * dt);
      if (S.speed < 0.02 && vd === 0) S.speed = 0;

      var omega = lerp(7.0, 3.2, clamp(S.speed / 5, 0, 1));
      var dyaw = 0;
      if (S.has && (wantMove || Math.abs(err) > 1.2)) dyaw = clamp(err, -omega * dt, omega * dt);
      S.yaw += dyaw;
      if (S.yaw > Math.PI) S.yaw -= 2 * Math.PI; else if (S.yaw < -Math.PI) S.yaw += 2 * Math.PI;   /* keep the angle bounded in long sessions */
      S.turn += ((dt > 0 ? dyaw / dt : 0) - S.turn) * Math.min(1, dt * 8);

      var fx = Math.cos(S.yaw), fz = -Math.sin(S.yaw);
      var mvx = fx * S.speed * dt, mvz = fz * S.speed * dt;
      S.wx += mvx; S.wz += mvz;

      /* --- idle / sit behaviour --- */
      if (S.speed < 0.05 && S.has && dist <= STANDOFF + 0.8) S.idleT += dt; else S.idleT = 0;
      S.sitTarget = S.idleT > 2.8 ? 1 : 0;
      S.sit += (S.sitTarget - S.sit) * Math.min(1, dt * (S.sitTarget ? 2.6 : 6.0));
      var sw = S.sit;

      /* --- gait selection and stride phase --- */
      var v = S.speed;
      var wW = 1 - sstep(0.95, 1.2, v), wG = sstep(3.2, 3.6, v), wT = clamp(1 - wW - wG, 0, 1);
      var mixW = sstep(0.04, 0.45, v);
      var gScale = clamp(v / 4.8, 1, 1.25);
      var Seff = wW * GAITS.walk.S + wT * GAITS.trot.S + wG * GAITS.gallop.S * gScale;
      S.phi += v / Seff * dt;
      var phi = S.phi;

      /* --- body kinematics --- */
      var dyWalk = 0.010 * (0.5 - 0.5 * Math.cos(4 * Math.PI * (phi + 0.1)));
      var dyTrot = -0.03 + 0.035 * Math.abs(Math.sin(Math.PI * phi * 2));
      var dyGal = -0.05 + 0.075 * (0.5 - 0.5 * Math.cos(2 * Math.PI * (phi + 0.15)));
      var dy = mixW * (wW * dyWalk + wT * dyTrot + wG * dyGal);
      var bobDy = dy;
      var dyVel = dt > 0 ? (bobDy - S.lastDy) / dt : 0;
      S.lastDy = bobDy;
      var bark = Math.max(0, 1 - (nowMs() - S.barkAt) / 500);
      rig.position.y = bobDy + Math.sin(bark * Math.PI) * 0.09;

      var gSpine = Math.sin(2 * Math.PI * (phi + 0.15));
      var walkSway = Math.sin(2 * Math.PI * phi);
      var flex = wG * mixW;
      chestG.rotation.z = -0.14 * gSpine * flex + 0.30 * sw;
      pelvisG.rotation.z = 0.16 * gSpine * flex + 0.55 * sw;
      chestG.position.y = BODY_Y + 0.06 * sw;
      pelvisG.position.y = BODY_Y - 0.30 * sw;
      midG.rotation.z = 0.25 * sw;
      var bend = clamp(S.turn * 0.07, -0.35, 0.35);
      chestG.rotation.y = bend + 0.05 * walkSway * wW * mixW;
      pelvisG.rotation.y = -bend * 0.6 - 0.05 * walkSway * wW * mixW;
      rig.rotation.x = clamp(-S.turn * 0.025 * clamp(v / 3, 0, 1.4), -0.22, 0.22) + 0.015 * walkSway * mixW;
      rig.rotation.z = 0.03 * gSpine * flex;
      root.rotation.y = S.yaw;

      /* --- feet: trajectories + IK --- */
      var k, key2, leg, front, hipL, G, tt, f, fw, bx, by, bp, mxv, myv, mpv;
      var pitchF = rig.rotation.z + chestG.rotation.z, pitchH = rig.rotation.z + pelvisG.rotation.z;
      root.updateMatrixWorld(true);
      for (k = 0; k < 4; k++) {
        key2 = LEGS[k]; leg = legs[key2]; front = FRONT[key2];
        /* blended trajectory over the three gaits */
        bx = 0; by = 0; bp = 0;
        var gl = [[GAITS.walk, wW], [GAITS.trot, wT], [GAITS.gallop, wG]], gi, domT = 0, domB = 0.5, domW = -1;
        for (gi = 0; gi < 3; gi++) {
          G = gl[gi][0]; fw = gl[gi][1];
          if (fw <= 0.0001) continue;
          tt = frac(phi + G.off[key2]);
          f = foot(G, front, tt, G === GAITS.gallop ? gScale : 1);
          bx += f[0] * fw; by += f[1] * fw; bp += f[2] * fw;
          if (fw > domW) { domW = fw; domT = tt; domB = G.beta; }
        }
        var standPhi = front ? 0.0 : 0.15;
        var fx2 = lerp(0, bx, mixW), fy2 = lerp(GP, by, mixW), fp2 = lerp(standPhi, bp, mixW);
        /* toe-off puffs when running */
        if (v > 2.2 && S.prevT[key2] < domB && domT >= domB) spawnPuff(leg, v);
        S.prevT[key2] = domT;

        hipL = rootLocal(leg.hip, tmpV);
        var dxl = (HIP_X[key2] + fx2) - hipL.x, dyl = fy2 - hipL.y;
        var pitch = front ? pitchF : pitchH;
        var c = Math.cos(pitch), sn = Math.sin(pitch);
        var lx = dxl * c + dyl * sn, ly = -dxl * sn + dyl * c;
        var phiL = fp2 - pitch;
        var wx = lx - leg.L3 * Math.sin(phiL), wy = ly + leg.L3 * Math.cos(phiL);
        var a = ik2(wx, wy, leg.L1, leg.L2, front);
        var t1 = a[0], t2 = a[1] - a[0], t3 = phiL - a[1];
        if (!front && sw > 0.001) {                         /* hind legs fold into a sit */
          t1 = lerp(t1, 1.35, sw); t2 = lerp(t2, -2.3, sw); t3 = lerp(t3, 2.4, sw);
        }
        leg.hip.rotation.z = t1; leg.j2.rotation.z = t2; leg.j3.rotation.z = t3;
      }

      /* --- head: steadied against the body, looks at the cursor --- */
      var lookYawT = 0;
      if (S.has) {
        var relC = angDiff(S.yaw, psi);
        lookYawT = clamp(relC, -1.15, 1.15) * (1 - 0.65 * sstep(1.5, 3.5, v));
      }
      if (S.idleT > 1.5 && !S.has) lookYawT += 0.3 * Math.sin(t * 0.6);
      var hy = headYawSp.step(lookYawT, dt);
      var stab = -(rig.rotation.z + chestG.rotation.z) * 0.85;
      var ext = -0.12 * wG * mixW - 0.05 * wT * mixW;
      var lookPitch = 0.10 * sw + 0.06 * Math.sin(t * 0.7) * (1 - mixW);
      var hp = headPitchSp.step(0.22 + stab + ext + lookPitch + bark * 0.35, dt);
      neckG.rotation.z = hp;
      headG.rotation.y = hy * 0.8;
      neckG.rotation.y = hy * 0.2;
      headG.rotation.z = -0.1 * Math.sin(2 * Math.PI * phi * 2) * mixW * (wT + wG) + bobSp.step(-dyVel * 0.25, dt);

      /* breathing */
      var breathRate = lerp(0.55, 1.9, clamp(v / 4, 0, 1));
      chestG.scale.y = 1 + 0.018 * Math.sin(t * Math.PI * 2 * breathRate);

      /* jaw / tongue: pant harder when running, tiny smile when still */
      S.pant += dt * Math.PI * 2 * lerp(2.2, 8.0, clamp(v / 4.5, 0, 1));
      var pn = 0.5 + 0.5 * Math.sin(S.pant);
      var mouth = 0.04 + (0.10 + 0.10 * pn) * clamp(v / 3, 0, 1) + 0.55 * bark;
      jaw.rotation.z = -mouth;
      var tg = 0.55 + 0.45 * clamp(v / 2, 0, 1);
      tongue.scale.set(0.05 * (0.8 + 0.5 * tg), 0.014, 0.04);
      tongue.position.set(0.15 + 0.03 * tg, 0.0 - 0.015 * pn * clamp(v / 3, 0, 1), 0);

      /* ears: springs driven by vertical motion and speed; occasional flicks */
      S.earT -= dt;
      if (S.earT <= 0) { S.earFlick[Math.floor(Math.random() * 2)] = 1; S.earT = 3 + Math.random() * 6; }
      var dyAcc = dyVel;
      for (k = 0; k < 2; k++) {
        S.earFlick[k] = Math.max(0, S.earFlick[k] - dt * 5);
        var lag = earSp[k].step(-dyAcc * 0.05 - 0.18 * clamp(v / 4, 0, 1) + 0.25 * Math.sin(S.earFlick[k] * Math.PI), dt);
        ears[k].p.rotation.z = lag;
        ears[k].p.rotation.x = -ears[k].s * (0.26 + 0.05 * clamp(v / 4, 0, 1));
      }

      /* tail: wag rate follows excitement; spring adds follow-through */
      var happy = S.has ? 1 : 0.4;
      S.wag += dt * Math.PI * 2 * lerp(2.4, 3.6, clamp(v / 3, 0, 1)) * happy;
      tailG.rotation.y = (0.45 * (1 - mixW * 0.55) * happy) * Math.sin(S.wag);
      var fol = tailSp.step(-dyAcc * 0.04 + 0.28 * clamp(v / 4, 0, 1), dt);
      for (k = 0; k < 4; k++) tailSegs[k].rotation.z = tailBase[k] * (1 - 0.35 * sw) + fol * (0.6 + k * 0.25);
      tailG.rotation.z = 0.5 * sw;

      /* blink */
      S.blinkT -= dt;
      if (S.blinkT <= 0) { S.blinkP = 1; S.blinkT = 2 + Math.random() * 3.5; }
      S.blinkP = Math.max(0, S.blinkP - dt * 8);
      var lid = 1 - 0.92 * Math.sin(S.blinkP * Math.PI);
      for (k = 0; k < 2; k++) {
        eyes[k].scale.y = 0.064 * lid;
        eyes[k].userData.shine.visible = lid > 0.45;
      }

      /* puffs: stay on the ground while the scene origin moves with the dog */
      for (k = 0; k < puffs.length; k++) {
        var pf = puffs[k];
        if (pf.life > 0) {
          pf.life -= dt;
          pf.vy -= 2.0 * dt;
          pf.m.position.x += pf.vx * dt - mvx;
          pf.m.position.y = Math.max(0.03, pf.m.position.y + pf.vy * dt);
          pf.m.position.z += pf.vz * dt - mvz;
          var aa = Math.max(0, pf.life / 0.7);
          pf.m.material.opacity = 0.85 * aa;
          pf.m.scale.setScalar(0.5 + (1 - aa) * 1.4);
          if (pf.life <= 0) pf.m.visible = false;
        }
      }

      /* --- place the canvas on the page --- */
      if (container) {
        container.style.transform = 'translate(' + (S.wx * PXU - o0.x).toFixed(1) + 'px,' + (S.wz * PZU - o0.y).toFixed(1) + 'px)';
        container.style.opacity = S.alpha.toFixed(3);
      }
    }

    var raf = 0, alive = true, last = nowMs();
    function frame() {
      if (!alive) return;
      var n = nowMs();
      var dt = Math.min(0.05, (n - last) / 1000);
      last = n;
      if (S.placed && (ctl.visible || S.alpha > 0.01)) {
        tick(dt);
        renderer.render(scene, cam);
      }
      raf = requestAnimationFrame(frame);
    }
    if (!opts.manual && typeof requestAnimationFrame === 'function') raf = requestAnimationFrame(frame);

    return {
      ctl: ctl,
      setTarget: setTarget,
      clearTarget: clearTarget,
      bark: bark,
      tick: tick,
      dispose: function () {
        alive = false;
        if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(raf);
        if (renderer.dispose) renderer.dispose();
      },
      dbg: { S: S, legs: legs, root: root, PXU: PXU, PZU: PZU, proj: proj, GAITS: GAITS, GP: GP, LEGS: LEGS }
    };
}
