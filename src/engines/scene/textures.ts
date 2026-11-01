import * as THREE from 'three';

/**
 * 程序化 PBR 貼圖（Canvas 生成，無外部素材依賴）
 * 待補素材：經授權之高解析 PBR 材質（地板 PVC、牆面、天花板），可於 assetManifest 中替換。
 */

const cache = new Map<string, THREE.Texture>();

function seeded(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
}

function canvas(w: number, h: number) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!] as const;
}

function finish(c: HTMLCanvasElement, key: string, repeat: [number, number] = [1, 1], color = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  cache.set(key, t);
  return t;
}

/** 醫院 PVC 地板：均勻斑點＋接縫 */
export function floorTextures(repeat: [number, number]) {
  const key = `floor-${repeat.join('x')}`;
  if (cache.has(key)) return { map: cache.get(key)!, roughnessMap: cache.get(key + '-r')! };
  const N = 1024;
  const [c, g] = canvas(N, N);
  const [rc, rg] = canvas(N, N);
  const rnd = seeded(7);
  g.fillStyle = '#9aa6ad'; g.fillRect(0, 0, N, N);
  rg.fillStyle = '#6a6a6a'; rg.fillRect(0, 0, N, N);
  for (let i = 0; i < 26000; i++) {
    const x = rnd() * N, y = rnd() * N, r = rnd() * 1.6 + 0.3;
    const v = rnd();
    g.fillStyle = v < 0.5 ? `rgba(70,82,90,${0.25 + rnd() * 0.3})` : v < 0.85 ? `rgba(220,226,230,${0.25 + rnd() * 0.3})` : `rgba(32,120,125,${0.25})`;
    g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  // 細微磨損與不均勻
  for (let i = 0; i < 40; i++) {
    const x = rnd() * N, y = rnd() * N, r = 60 + rnd() * 180;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, `rgba(255,255,255,${0.03 + rnd() * 0.03})`); grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd; g.fillRect(x - r, y - r, r * 2, r * 2);
    const rgd = rg.createRadialGradient(x, y, 0, x, y, r);
    rgd.addColorStop(0, `rgba(30,30,30,${0.25})`); rgd.addColorStop(1, 'rgba(30,30,30,0)');
    rg.fillStyle = rgd; rg.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // 焊接接縫
  g.strokeStyle = 'rgba(40,50,56,0.55)'; g.lineWidth = 2;
  rg.strokeStyle = '#b0b0b0'; rg.lineWidth = 3;
  for (const p of [0, N / 2]) { g.beginPath(); g.moveTo(p, 0); g.lineTo(p, N); g.stroke(); rg.beginPath(); rg.moveTo(p, 0); rg.lineTo(p, N); rg.stroke(); }
  const map = finish(c, key, repeat);
  const roughnessMap = finish(rc, key + '-r', repeat, false);
  return { map, roughnessMap };
}

/** 牆面：霧面乳膠漆 */
export function wallTexture(repeat: [number, number], tint = '#e6ebee') {
  const key = `wall-${tint}-${repeat.join('x')}`;
  if (cache.has(key)) return cache.get(key)!;
  const N = 512;
  const [c, g] = canvas(N, N);
  const rnd = seeded(11);
  g.fillStyle = tint; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},${rnd() * 0.035})`;
    g.fillRect(rnd() * N, rnd() * N, 2, 2);
  }
  return finish(c, key, repeat);
}

/** 天花板：600mm 礦纖板 */
export function ceilingTexture(repeat: [number, number]) {
  const key = `ceil-${repeat.join('x')}`;
  if (cache.has(key)) return cache.get(key)!;
  const N = 512;
  const [c, g] = canvas(N, N);
  const rnd = seeded(3);
  g.fillStyle = '#e9ecee'; g.fillRect(0, 0, N, N);
  for (let i = 0; i < 5000; i++) { g.fillStyle = `rgba(90,100,110,${0.08 + rnd() * 0.15})`; g.fillRect(rnd() * N, rnd() * N, 1.5, 1.5); }
  g.strokeStyle = '#c3c9ce'; g.lineWidth = 8; g.strokeRect(0, 0, N, N);
  g.strokeStyle = '#f7f8f9'; g.lineWidth = 2; g.strokeRect(5, 5, N - 10, N - 10);
  return finish(c, key, repeat);
}

/** 文字／圖像貼圖 */
export function drawTexture(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void) {
  if (cache.has(key)) return cache.get(key)!;
  const [c, g] = canvas(w, h);
  draw(g, w, h);
  return finish(c, key, [1, 1]);
}

export const FONT = '"Noto Sans TC","PingFang TC","Microsoft JhengHei","Heiti TC",system-ui,sans-serif';
export const HAND = '"Comic Sans MS","Bradley Hand","Segoe Print","Kaiti TC","KaiTi",cursive';
