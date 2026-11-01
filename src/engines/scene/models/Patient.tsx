import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { BED } from './HospitalBed';
import { loft, noiseNormal, type Section } from './geo';
import { MONITOR_VITALS } from '../../case/chestPainCase';

/**
 * 標準化病人：62 歲男性，半坐臥於病床（程式雕塑模型）
 * 姿勢：右手握拳置於胸前（Levine sign）、左手食指夾血氧探頭、蓋被至腰部；依呼吸速率起伏。
 * 待審核：外觀與姿勢需臨床教師確認；正式版建議替換為經授權之掃描人體模型。
 */

const b = (BED.backDeg * Math.PI) / 180;
const DIR = new THREE.Vector3(0, Math.sin(b), -Math.cos(b));   // 沿背板往床頭
const NRM = new THREE.Vector3(0, Math.cos(b), Math.sin(b));    // 背板法線
const HINGE = new THREE.Vector3(0, BED.deckY, BED.hingeZ);
const SURF = BED.mattT + 0.012;

/** 背板座標 → 床體座標 */
export const onBack = (d: number, x: number, n: number) => HINGE.clone().addScaledVector(DIR, d).addScaledVector(NRM, SURF + n).setX(x);
/** 平面床墊座標 → 床體座標 */
export const onFlat = (z: number, x: number, h: number) => new THREE.Vector3(x, BED.top + 0.012 + h, z);

/** 給纜線使用的錨點（床體座標） */
export const PATIENT_ANCHORS = {
  chestLeads: () => onBack(0.5, -0.02, 0.2),
  spo2Finger: () => onFlat(0.375, 0.104, 0.188),
};

// ───────────── 頭部雕塑 ─────────────
const g2 = (x: number, y: number, cx: number, cy: number, sx: number, sy: number) => Math.exp(-(((x - cx) / sx) ** 2 + ((y - cy) / sy) ** 2));
const sstep = (a: number, b: number, v: number) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

/** 單位球方向 → 徑向位移（臉部特徵） */
function headDisp(x: number, y: number, z: number) {
  const f = sstep(0.25, 0.75, z); // 正面遮罩
  const ax = Math.abs(x);
  let d = 0;
  d += f * (0.1 * Math.exp(-((x / 0.075) ** 2)) * g2(0, y, 0, -0.08, 1, 0.2));       // 鼻樑
  d += f * 0.075 * g2(x, y, 0, -0.27, 0.11, 0.09);                                      // 鼻頭
  d += f * 0.03 * (g2(x, y, 0.12, -0.3, 0.07, 0.06) + g2(x, y, -0.12, -0.3, 0.07, 0.06)); // 鼻翼
  d += f * 0.045 * g2(x, y, 0, 0.24, 0.5, 0.07);                                        // 眉弓
  d -= f * 0.07 * (g2(x, y, 0.32, 0.08, 0.15, 0.09) + g2(x, y, -0.32, 0.08, 0.15, 0.09)); // 眼窩
  d += f * 0.03 * (g2(x, y, 0.32, 0.06, 0.1, 0.05) + g2(x, y, -0.32, 0.06, 0.1, 0.05));   // 眼瞼
  d += f * 0.045 * (g2(x, y, 0.55, -0.1, 0.18, 0.13) + g2(x, y, -0.55, -0.1, 0.18, 0.13)); // 顴骨
  d += f * 0.03 * g2(x, y, 0, -0.43, 0.16, 0.05);                                       // 上唇區
  d += f * 0.032 * g2(x, y, 0, -0.5, 0.17, 0.035);                                      // 上唇
  d -= f * 0.02 * g2(x, y, 0, -0.545, 0.17, 0.012);                                     // 口裂
  d += f * 0.03 * g2(x, y, 0, -0.6, 0.15, 0.04);                                        // 下唇
  d += f * 0.065 * g2(x, y, 0, -0.84, 0.2, 0.1);                                        // 下巴
  d -= f * 0.018 * (g2(x, y, 0.2, -0.42, 0.04, 0.12) + g2(x, y, -0.2, -0.42, 0.04, 0.12)); // 法令紋
  d -= 0.03 * (g2(x, y, 0.88, 0.25, 0.15, 0.15) + g2(x, y, -0.88, 0.25, 0.15, 0.15)) * (1 - f); // 太陽穴
  d += 0.04 * g2(ax, y, 0.8, -0.55, 0.15, 0.12) * sstep(-0.4, 0.2, z);                  // 下顎角
  d += 0.05 * sstep(-0.4, -0.8, z) * g2(0, y, 0, 0.1, 1, 0.45);                          // 枕骨
  return d;
}

/** 外形縮放（下顎收窄、後頸收束、臉部平面） */
function headShape(v: THREE.Vector3) {
  let { x, y, z } = v;
  const low = sstep(0, -1, y);
  x *= 1 - 0.3 * low ** 1.3;
  if (z < 0) z *= 1 - 0.28 * sstep(-0.1, -0.9, y);
  if (z > 0.55) z = 0.55 + (z - 0.55) * (0.72 + 0.28 * sstep(0.4, 0.9, Math.abs(x)));
  if (y > 0.3 && z > 0) z *= 0.96;
  return new THREE.Vector3(x, y, z);
}

const HS = new THREE.Vector3(0.086, 0.122, 0.108); // 頭部半徑（公尺）

function hairMask(x: number, y: number, z: number) {
  // 灰白短髮：額頭髮際線後退，側面至耳上，後腦至枕下
  const top = sstep(0.42 - 0.55 * Math.max(0, -z) - 0.12 * Math.abs(x), 0.55 - 0.55 * Math.max(0, -z) - 0.12 * Math.abs(x), y);
  const face = sstep(0.3, 0.5, z) * (1 - sstep(0.52, 0.62, y));
  const ear = g2(Math.abs(x), y, 0.95, -0.05, 0.12, 0.2);
  return Math.max(0, Math.min(1, top - face * 1.5 - ear));
}

function skinTexture() {
  const W = 1024, H = 512;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  const img = g.createImageData(W, H);
  const base = [188, 141, 117];
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let py = 0; py < H; py++) {
    const theta = (py / H) * Math.PI;
    for (let px = 0; px < W; px++) {
      const phi = (px / W) * Math.PI * 2;
      const x = -Math.cos(phi) * Math.sin(theta), yy = Math.cos(theta), z = Math.sin(phi) * Math.sin(theta);
      const y = yy;
      let [r, gg, bb] = base;
      const f = sstep(0.25, 0.75, z);
      const n = (rnd() - 0.5) * 8;
      // 臉頰泛紅、鼻頭、耳
      const flush = f * (0.6 * (g2(x, y, 0.45, -0.2, 0.2, 0.15) + g2(x, y, -0.45, -0.2, 0.2, 0.15)) + 0.5 * g2(x, y, 0, -0.27, 0.1, 0.08));
      r += flush * 22; gg -= flush * 8; bb -= flush * 4;
      // 唇
      const lip = f * Math.max(g2(x, y, 0, -0.5, 0.15, 0.03), g2(x, y, 0, -0.6, 0.14, 0.035));
      r = r * (1 - lip) + 170 * lip; gg = gg * (1 - lip) + 98 * lip; bb = bb * (1 - lip) + 92 * lip;
      const mouth = f * g2(x, y, 0, -0.548, 0.15, 0.008);
      r -= mouth * 90; gg -= mouth * 70; bb -= mouth * 60;
      // 鬍渣（下顎、上唇）
      const beard = (sstep(-0.35, -0.65, y) * sstep(0.0, 0.5, z) * (1 - lip * 1.5) + f * g2(x, y, 0, -0.44, 0.17, 0.03)) * 0.55;
      if (beard > 0) { const s = rnd() < 0.5 ? 1 : 0.4; r -= beard * 20 * s; gg -= beard * 15 * s; bb -= beard * 6 * s; }
      // 眼睛（略睜，因不適而眯眼）
      for (const ex of [0.31, -0.31]) {
        const dx = (x - ex) / 0.13, dy = (y - 0.06) / 0.035;
        const inEye = dx * dx + dy * dy;
        if (z > 0.3 && inEye < 1) {
          const ir = ((x - ex) / 0.045) ** 2 + ((y - 0.06) / 0.04) ** 2;
          if (ir < 1) { r = 52; gg = 36; bb = 28; if (ir < 0.25) { r = 15; gg = 12; bb = 10; } }
          else { r = 214; gg = 200; bb = 188; }
          if (dy > 0.45) { r *= 0.55; gg *= 0.55; bb *= 0.55; } // 上眼瞼陰影
        } else if (z > 0.3 && inEye < 1.6) {
          const k = 1 - (inEye - 1) / 0.6; r -= k * 40; gg -= k * 36; bb -= k * 30; // 睫毛線／眼周
        }
        // 眼袋
        const bag = f * g2(x, y, ex, -0.03, 0.1, 0.03); r -= bag * 18; gg -= bag * 20; bb -= bag * 8;
      }
      // 眉毛（灰白）
      for (const ex of [0.3, -0.3]) {
        const br = f * g2(x, y, ex + Math.sign(ex) * 0.02, 0.2 - Math.abs(x - ex) * 0.1, 0.16, 0.022);
        if (br > 0.15 && rnd() < 0.85) { r = r * (1 - br) + 70 * br; gg = gg * (1 - br) + 62 * br; bb = bb * (1 - br) + 58 * br; }
      }
      // 頭髮（灰白短髮）
      const hm = hairMask(x, y, z);
      if (hm > 0.05) {
        const grey = rnd() < 0.38 ? [150, 147, 143] : [42, 39, 37];
        const k = Math.min(1, hm * 2) * (0.9 + rnd() * 0.1);
        r = r * (1 - k) + grey[0] * k; gg = gg * (1 - k) + grey[1] * k; bb = bb * (1 - k) + grey[2] * k;
      }
      // 額頭皺紋
      const wr = f * sstep(0.25, 0.4, y) * (1 - sstep(0.5, 0.62, y)) * Math.max(0, Math.sin(y * 140)) * 0.6;
      r -= wr * 14; gg -= wr * 14; bb -= wr * 12;
      const i = (py * W + px) * 4;
      img.data[i] = Math.max(0, Math.min(255, r + n)); img.data[i + 1] = Math.max(0, Math.min(255, gg + n)); img.data[i + 2] = Math.max(0, Math.min(255, bb + n)); img.data[i + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

function headGeometry() {
  const g = new THREE.SphereGeometry(1, 160, 110);
  const p = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const dir = v.clone().normalize();
    const hair = hairMask(dir.x, dir.y, dir.z) * 0.035;
    const s = headShape(dir).multiplyScalar(1 + headDisp(dir.x, dir.y, dir.z) + hair);
    p.setXYZ(i, s.x * HS.x, s.y * HS.y, s.z * HS.z);
  }
  g.computeVertexNormals();
  return g;
}

function earGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0.03); s.bezierCurveTo(0.022, 0.034, 0.03, 0.012, 0.022, -0.008);
  s.bezierCurveTo(0.016, -0.022, 0.012, -0.032, 0.002, -0.03);
  s.bezierCurveTo(-0.006, -0.028, -0.004, -0.01, -0.004, 0.0); s.bezierCurveTo(-0.006, 0.014, -0.006, 0.028, 0, 0.03);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.006, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 4, curveSegments: 16 });
  g.computeVertexNormals();
  return g;
}

// ───────────── 病人服 ─────────────
function gownMaterial() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d')!;
  g.fillStyle = '#a9c4d6'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = 'rgba(255,255,255,.55)';
  for (let y = 0; y < 256; y += 32) for (let x = (y / 32) % 2 ? 16 : 0; x < 256; x += 32) { g.beginPath(); g.moveTo(x + 6, y); g.lineTo(x + 12, y + 6); g.lineTo(x + 6, y + 12); g.lineTo(x, y + 6); g.fill(); }
  g.fillStyle = 'rgba(34,74,104,.35)'; for (let y = 0; y < 256; y += 32) for (let x = 0; x < 256; x += 32) g.fillRect(x + 22, y + 22, 3, 3);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 4); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, normalMap: noiseNormal('gown', 8, 0.7, true), normalScale: new THREE.Vector2(0.4, 0.4) });
}

// ───────────── 蓋被（依身體高度場懸垂） ─────────────
function blanketGeometry() {
  const NS = 70, NT = 110;
  const coreHalf = BED.halfW - 0.015, drape = 0.13;
  const sMax = coreHalf + drape;
  const dTop = 0.14, flatLen = BED.footZ - BED.hingeZ - 0.02, footDrape = 0.16;
  const totalLen = dTop + flatLen + footDrape;
  // 身體高度：腿、髖
  const body = (x: number, along: number) => {
    // along：自腰部 (0) 往腳 (dTop+flatLen) 的距離
    const ax = Math.abs(x);
    const hip = Math.max(0, 1 - ((along - dTop) / 0.36) ** 2) * 0.2 * Math.sqrt(Math.max(0, 1 - (x / 0.21) ** 2));
    const legT = sstep(dTop - 0.05, dTop + 0.25, along);
    const legR = 0.085 - 0.04 * sstep(dTop + 0.2, dTop + 0.85, along);
    const legC = 0.1 + 0.02 * sstep(dTop, dTop + 0.8, along);
    const knee = 0.035 * g2(0, along, 0, dTop + 0.5, 1, 0.12);
    const legH = (0.16 - 0.07 * sstep(dTop + 0.15, dTop + 0.8, along) + knee) * legT;
    const leg = legH * Math.sqrt(Math.max(0, 1 - ((ax - legC) / legR) ** 2));
    const footZ = dTop + flatLen - 0.12;
    const foot = 0.17 * g2(ax, along, 0.12, footZ, 0.055, 0.06);
    const waist = along < dTop ? 0.19 * Math.sqrt(Math.max(0, 1 - (x / 0.19) ** 2)) : 0;
    return Math.max(hip, leg, foot, waist);
  };
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let j = 0; j <= NT; j++) {
    const along = (j / NT) * totalLen;
    for (let i = 0; i <= NS; i++) {
      const s = -sMax + (i / NS) * sMax * 2;
      const as = Math.abs(s);
      const coreX = Math.min(as, coreHalf) * Math.sign(s);
      // 柔化高度（模擬布料張力）
      let h = 0; let wsum = 0;
      for (const o of [-0.04, -0.02, 0, 0.02, 0.04]) { const w = 1 - Math.abs(o) * 10; h += body(coreX + o, Math.min(along, dTop + flatLen)) * w; wsum += w; }
      h = Math.max(h / wsum, body(coreX, Math.min(along, dTop + flatLen)) * 0.92) + 0.02;
      const fold = 0.009 * Math.sin(along * 19 + s * 7) * Math.sin(s * 15 - along * 4) + 0.005 * Math.sin(along * 47 - s * 21);
      h += fold;
      let base: THREE.Vector3;
      if (along < dTop) base = onBack(dTop - along, coreX, h);
      else if (along <= dTop + flatLen) base = onFlat(BED.hingeZ + 0.01 + (along - dTop), coreX, h);
      else { const k = along - dTop - flatLen; base = onFlat(BED.footZ - 0.01 + Math.min(k, 0.03), coreX, Math.max(0.018, h * (1 - k / 0.06)) - Math.max(0, k - 0.03)); }
      if (as > coreHalf) {
        const k = as - coreHalf;
        base.x = Math.sign(s) * (coreHalf + 0.012 + 0.01 * (1 - Math.exp(-k * 30)));
        base.y -= k + 0.004 * Math.sin(along * 40);
        base.x += 0.006 * Math.sin(along * 38) * (k / drape);
      }
      pos.push(base.x, base.y, base.z); uv.push(i / NS * 3, j / NT * 6);
    }
  }
  for (let j = 0; j < NT; j++) for (let i = 0; i < NS; i++) {
    const a = j * (NS + 1) + i, c = a + NS + 1;
    idx.push(a, a + 1, c, a + 1, c + 1, c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

// ───────────── 軀幹與四肢 ─────────────
function torsoSections(inhale = 0): Section[] {
  const chest = 1 + inhale * 0.045;
  const sec = (d: number, rx: number, ry: number): Section => ({ p: onBack(d, 0, ry), rx, ry, up: NRM });
  return [
    { p: onFlat(BED.hingeZ + 0.08, 0, 0.1), rx: 0.175, ry: 0.1, up: NRM },
    sec(0.06, 0.165, 0.1),
    sec(0.2, 0.165, 0.11 * (1 + inhale * 0.03)),
    sec(0.33, 0.18, 0.12 * chest),
    sec(0.43, 0.2, 0.11 * chest),
    sec(0.5, 0.19, 0.085),
    sec(0.535, 0.12, 0.06),
  ];
}

function limb(points: THREE.Vector3[], radii: [number, number][], up = NRM) {
  return loft(points.map((p, i) => ({ p, rx: radii[i][0], ry: radii[i][1], up })), 20, true, true, 6);
}

export function Patient() {
  const skinMap = useMemo(skinTexture, []);
  const skin = useMemo(() => new THREE.MeshPhysicalMaterial({ map: skinMap, roughness: 0.58, sheen: 0.35, sheenColor: new THREE.Color('#ffb59a'), sheenRoughness: 0.6, clearcoat: 0.04 }), [skinMap]);
  const skinPlain = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#c4917a', roughness: 0.6, sheen: 0.35, sheenColor: new THREE.Color('#ffb59a') }), []);
  const gown = useMemo(gownMaterial, []);
  const blanketMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#8fb3c6', roughness: 0.96, normalMap: noiseNormal('blanket', 1, 0.9, true), normalScale: new THREE.Vector2(0.5, 0.5), side: THREE.DoubleSide }), []);
  const head = useMemo(headGeometry, []);
  const ear = useMemo(earGeometry, []);
  const blanket = useMemo(blanketGeometry, []);

  const torso = useMemo(() => {
    const g = loft(torsoSections(0), 40, true, true, 6);
    const gi = loft(torsoSections(1), 40, true, true, 6);
    g.morphAttributes.position = [gi.attributes.position];
    return g;
  }, []);
  const neck = useMemo(() => loft([
    { p: onBack(0.5, 0, 0.08), rx: 0.068, ry: 0.064, up: NRM },
    { p: onBack(0.56, 0, 0.083), rx: 0.064, ry: 0.06, up: NRM },
    { p: onBack(0.61, 0, 0.09), rx: 0.062, ry: 0.064, up: NRM },
  ], 24, false, false), []);

  // 右手：握拳置於胸前（Levine sign）
  const rArm = useMemo(() => {
    const sleeve = limb([onBack(0.47, -0.185, 0.075), onBack(0.42, -0.215, 0.08), onBack(0.35, -0.232, 0.084)], [[0.064, 0.058], [0.062, 0.057], [0.058, 0.054]]);
    const upper = limb([onBack(0.38, -0.228, 0.083), onBack(0.3, -0.24, 0.086), onBack(0.22, -0.25, 0.092), onBack(0.19, -0.245, 0.1)],
      [[0.05, 0.047], [0.047, 0.044], [0.04, 0.038], [0.036, 0.034]]);
    const fore = limb([onBack(0.19, -0.245, 0.1), onBack(0.22, -0.22, 0.14), onBack(0.27, -0.16, 0.19), onBack(0.31, -0.1, 0.225), onBack(0.33, -0.07, 0.24)],
      [[0.036, 0.034], [0.042, 0.036], [0.038, 0.031], [0.031, 0.025], [0.027, 0.021]]);
    const fist = limb([onBack(0.33, -0.07, 0.24), onBack(0.345, -0.045, 0.252), onBack(0.36, -0.015, 0.252), onBack(0.365, 0.0, 0.244)],
      [[0.028, 0.021], [0.044, 0.03], [0.046, 0.034], [0.036, 0.03]]);
    return { sleeve, upper, fore, fist };
  }, []);
  // 左手：放在被子上，食指夾血氧探頭
  const lArm = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const sleeve = limb([onBack(0.47, 0.185, 0.075), onBack(0.42, 0.215, 0.08), onBack(0.35, 0.232, 0.084)], [[0.064, 0.058], [0.062, 0.057], [0.058, 0.054]]);
    const upper = limb([onBack(0.38, 0.228, 0.083), onBack(0.26, 0.248, 0.088), onBack(0.12, 0.262, 0.094), onFlat(BED.hingeZ + 0.1, 0.27, 0.1)],
      [[0.05, 0.047], [0.047, 0.044], [0.041, 0.039], [0.037, 0.035]]);
    const fore = limb([onFlat(BED.hingeZ + 0.1, 0.27, 0.1), onFlat(0.0, 0.26, 0.13), onFlat(0.12, 0.22, 0.165), onFlat(0.22, 0.17, 0.19), onFlat(0.27, 0.15, 0.2)],
      [[0.037, 0.035], [0.042, 0.036], [0.037, 0.03], [0.03, 0.023], [0.027, 0.019]]);
    const hand = limb([onFlat(0.27, 0.15, 0.2), onFlat(0.3, 0.138, 0.203), onFlat(0.335, 0.125, 0.2)], [[0.028, 0.016], [0.044, 0.017], [0.046, 0.015]], up);
    const fingers = [0, 1, 2, 3].map((f) => {
      const x0 = 0.108 + f * 0.012 - 0.018, z0 = 0.343 - Math.abs(f - 1.5) * 0.004;
      const len = [0.058, 0.066, 0.062, 0.05][f];
      return limb([onFlat(z0, x0 + 0.012, 0.2), onFlat(z0 + len * 0.55, x0 + 0.008, 0.196), onFlat(z0 + len, x0 + 0.004, 0.186)],
        [[0.0095, 0.0085], [0.0085, 0.0075], [0.0075, 0.0065]], up);
    });
    const thumb = limb([onFlat(0.29, 0.168, 0.205), onFlat(0.315, 0.175, 0.203), onFlat(0.338, 0.168, 0.198)], [[0.012, 0.011], [0.0105, 0.0095], [0.009, 0.008]], up);
    return { sleeve, upper, fore, hand, fingers, thumb };
  }, []);

  const headPos = onBack(0.685, 0.0, 0.1);
  const headQuat = useMemo(() => {
    const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), DIR, NRM);
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    q.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.18, 0.32, 0.04)));
    return q;
  }, []);
  const pillowPos = onBack(0.71, 0, 0.03);
  const torsoRef = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const ph = (clock.elapsedTime * MONITOR_VITALS.rr) / 60;
    const k = 0.5 - 0.5 * Math.cos(ph * Math.PI * 2);
    if (torsoRef.current?.morphTargetInfluences) torsoRef.current.morphTargetInfluences[0] = k;
  });
  const spo2 = PATIENT_ANCHORS.spo2Finger();

  return (
    <group>
      {/* 枕頭 */}
      <RoundedBox args={[0.58, 0.11, 0.36]} radius={0.05} smoothness={6} position={pillowPos} rotation={[b, 0, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#f5f7f8" roughness={0.9} normalMap={noiseNormal('sheet', 6, 0.6, true)} normalScale={new THREE.Vector2(0.3, 0.3)} />
      </RoundedBox>
      <mesh ref={torsoRef} geometry={torso} material={gown} morphTargetInfluences={[0]} castShadow receiveShadow />
      <mesh geometry={neck} material={skinPlain} castShadow />
      <group position={headPos} quaternion={headQuat}>
        <mesh geometry={head} material={skin} castShadow receiveShadow />
        {[-1, 1].map((s) => (
          <mesh key={s} geometry={ear} material={skinPlain} position={[s * HS.x * 0.98, -0.005, -0.012]} rotation={[0, s * 1.35, s * -0.12]} scale={[1, 1, s]} castShadow />
        ))}
      </group>
      <mesh geometry={rArm.sleeve} material={gown} castShadow />
      <mesh geometry={rArm.upper} material={skinPlain} castShadow />
      <mesh geometry={rArm.fore} material={skinPlain} castShadow />
      <mesh geometry={rArm.fist} material={skinPlain} castShadow />
      <mesh geometry={lArm.sleeve} material={gown} castShadow />
      <mesh geometry={lArm.upper} material={skinPlain} castShadow />
      <mesh geometry={lArm.fore} material={skinPlain} castShadow />
      <mesh geometry={lArm.hand} material={skinPlain} castShadow />
      {lArm.fingers.map((g, i) => <mesh key={i} geometry={g} material={skinPlain} castShadow />)}
      <mesh geometry={lArm.thumb} material={skinPlain} castShadow />
      {/* 血氧探頭 */}
      <group position={spo2} rotation={[0, -0.35, 0]}>
        <RoundedBox args={[0.026, 0.026, 0.045]} radius={0.009} castShadow><meshStandardMaterial color="#2f6fb0" roughness={0.45} /></RoundedBox>
        <mesh position={[0, 0.006, 0.024]}><sphereGeometry args={[0.003, 8, 8]} /><meshStandardMaterial color="#ff3030" emissive="#ff2020" emissiveIntensity={2} toneMapped={false} /></mesh>
      </group>
      {/* 病人手圈 */}
      <mesh position={onFlat(0.27, 0.15, 0.2)} rotation={[0, 0.3, 0]}><torusGeometry args={[0.03, 0.005, 8, 24]} /><meshStandardMaterial color="#f4f4f4" roughness={0.5} /></mesh>
      <mesh geometry={blanket} material={blanketMat} castShadow receiveShadow />
    </group>
  );
}
