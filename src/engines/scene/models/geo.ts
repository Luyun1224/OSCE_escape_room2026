import * as THREE from 'three';

/** 程式建模工具：圓角輪廓、倒角擠出、橢圓斷面放樣 (loft)、管線 */

export function roundedRectShape(w: number, h: number, r: number, cx = 0, cy = 0) {
  const s = new THREE.Shape();
  const x = cx - w / 2, y = cy - h / 2;
  r = Math.min(r, w / 2, h / 2);
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

export function roundedRectPath(w: number, h: number, r: number, cx = 0, cy = 0) {
  const s = roundedRectShape(w, h, r, cx, cy);
  const p = new THREE.Path();
  p.setFromPoints(s.getPoints(6).reverse());
  return p;
}

/** 倒角擠出（沿 +Z，置中） */
export function extrude(shape: THREE.Shape, depth: number, bevel = 0.006, seg = 3) {
  const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.0001, depth - bevel * 2), bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: seg, curveSegments: 10 });
  g.translate(0, 0, -(depth - bevel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

export interface Section { p: THREE.Vector3; rx: number; ry: number; up?: THREE.Vector3 }

/** 沿路徑放樣橢圓斷面，產生平滑肢體／軀幹 */
export function loft(sections: Section[], radial = 28, capStart = true, capEnd = true, subdiv = 4) {
  // Catmull-Rom 插值斷面
  const curve = new THREE.CatmullRomCurve3(sections.map((s) => s.p), false, 'centripetal');
  const n = (sections.length - 1) * subdiv + 1;
  const lerp = (k: 'rx' | 'ry', t: number) => {
    const f = t * (sections.length - 1);
    const i = Math.min(Math.floor(f), sections.length - 2);
    const u = f - i;
    const a = sections[i][k], b = sections[i + 1][k];
    const s = u * u * (3 - 2 * u);
    return a + (b - a) * s;
  };
  const upRef = sections[0].up ?? new THREE.Vector3(0, 1, 0);
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const frames = curve.computeFrenetFrames(n - 1, false);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const c = curve.getPointAt(t);
    const T = frames.tangents[i];
    // 以固定參考向量建立穩定座標系
    const B = new THREE.Vector3().crossVectors(T, upRef).normalize();
    if (B.lengthSq() < 1e-6) B.copy(frames.binormals[i]);
    const N = new THREE.Vector3().crossVectors(B, T).normalize();
    const rx = lerp('rx', t), ry = lerp('ry', t);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      const v = c.clone().addScaledVector(B, Math.cos(a) * rx).addScaledVector(N, Math.sin(a) * ry);
      pos.push(v.x, v.y, v.z); uv.push(j / radial, t);
    }
  }
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const addCap = (ring: number, flip: boolean) => {
    const ci = pos.length / 3;
    const c = curve.getPointAt(ring === 0 ? 0 : 1);
    pos.push(c.x, c.y, c.z); uv.push(0.5, ring === 0 ? 0 : 1);
    const base = ring * (radial + 1);
    for (let j = 0; j < radial; j++) flip ? idx.push(ci, base + j, base + j + 1) : idx.push(ci, base + j + 1, base + j);
  };
  if (capStart) addCap(0, false);
  if (capEnd) addCap(n - 1, true);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function tube(points: [number, number, number][], r: number, seg = 64, radial = 10) {
  const c = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  return new THREE.TubeGeometry(c, seg, r, radial, false);
}

/** 懸垂纜線：兩點之間帶重力下垂 */
export function cable(a: [number, number, number], b: [number, number, number], sag: number, r = 0.004, mids: [number, number, number][] = []) {
  if (mids.length) return tube([a, ...mids, b], r, 96, 8);
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * sag, a[2] + (b[2] - a[2]) * t]);
  }
  return tube(pts, r, 96, 8);
}

/** 細微噪點法線貼圖（布料／塑膠紋理） */
const nmCache = new Map<string, THREE.Texture>();
export function noiseNormal(key: string, scale = 1, strength = 0.5, weave = false) {
  if (nmCache.has(key)) return nmCache.get(key)!;
  const N = 256;
  const c = document.createElement('canvas'); c.width = c.height = N;
  const g = c.getContext('2d')!;
  const h = new Float32Array(N * N);
  let s = 12345;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < N * N; i++) h[i] = rnd();
  // 模糊
  for (let pass = 0; pass < 2; pass++) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    h[i] = (h[i] * 2 + h[y * N + ((x + 1) % N)] + h[((y + 1) % N) * N + x]) / 4;
  }
  if (weave) for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) h[y * N + x] += 0.25 * (Math.sin(x * 1.6) * Math.sin(y * 1.6));
  const img = g.createImageData(N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const i = y * N + x;
    const dx = (h[y * N + ((x + 1) % N)] - h[y * N + ((x - 1 + N) % N)]) * strength * 4;
    const dy = (h[((y + 1) % N) * N + x] - h[((y - 1 + N) % N) * N + x]) * strength * 4;
    const v = new THREE.Vector3(-dx, -dy, 1).normalize();
    img.data[i * 4] = (v.x * 0.5 + 0.5) * 255; img.data[i * 4 + 1] = (v.y * 0.5 + 0.5) * 255; img.data[i * 4 + 2] = (v.z * 0.5 + 0.5) * 255; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(scale, scale);
  nmCache.set(key, t);
  return t;
}
