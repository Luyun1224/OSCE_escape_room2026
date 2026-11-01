import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FONT } from './textures';
import { MONITOR_VITALS } from '../case/chestPainCase';

/** 示意性 Lead II 節律波形（竇性心搏過速；僅節律示意，非診斷用 12 導程） */
function ecgShape(p: number) {
  const g = (c: number, w: number, a: number) => a * Math.exp(-((p - c) ** 2) / (2 * w * w));
  return g(0.12, 0.025, 0.12) + g(0.3, 0.008, -0.12) + g(0.32, 0.01, 1.0) + g(0.345, 0.01, -0.25) + g(0.55, 0.045, 0.25);
}

/** 生命徵象監視器螢幕：即時繪製 Canvas 貼圖 */
export function MonitorScreen({ width = 0.62, height = 0.4 }: { width?: number; height?: number }) {
  const W = 640, H = 412;
  const { canvas, tex } = useMemo(() => {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return { canvas: c, tex: t };
  }, []);
  const trace = useRef<number[]>(new Array(420).fill(0));
  const pleth = useRef<number[]>(new Array(420).fill(0));
  const acc = useRef(0);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame(({ clock }, dt) => {
    acc.current += dt;
    if (acc.current < 1 / 30) return;
    acc.current = 0;
    const t = clock.elapsedTime;
    const period = 60 / MONITOR_VITALS.hr;
    const ph = (t % period) / period;
    trace.current.push(ecgShape(ph)); trace.current.splice(0, trace.current.length - 420);
    trace.current.push(ecgShape(((t + 1 / 60) % period) / period)); trace.current.shift();
    const pp = ((t - 0.2) % period) / period;
    pleth.current.push(Math.max(0, Math.sin(pp * Math.PI) ** 3 * (pp < 0.5 ? 1 : 0.8))); pleth.current.shift();
    pleth.current.push(Math.max(0, Math.sin(pp * Math.PI) ** 3)); pleth.current.shift();
    const g = canvas.getContext('2d')!;
    g.fillStyle = '#05090d'; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(80,110,120,0.18)'; g.lineWidth = 1;
    for (let x = 0; x < 440; x += 22) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); }
    const plot = (arr: number[], y0: number, amp: number, color: string) => {
      g.strokeStyle = color; g.lineWidth = 2.4; g.beginPath();
      arr.forEach((v, i) => { const x = 10 + i; const y = y0 - v * amp; i ? g.lineTo(x, y) : g.moveTo(x, y); });
      g.stroke();
    };
    g.font = `600 15px ${FONT}`; g.fillStyle = '#4ef08a'; g.fillText('II', 14, 26);
    plot(trace.current, 120, 80, '#4ef08a');
    g.fillStyle = '#5ad7f2'; g.fillText('Pleth', 14, 190);
    plot(pleth.current, 270, 60, '#5ad7f2');
    g.fillStyle = '#f4d35e'; g.fillText('Resp', 14, 310);
    const resp = trace.current.map((_, i) => 0.5 + 0.5 * Math.sin((t * 2 * Math.PI * MONITOR_VITALS.rr) / 60 - i * 0.03));
    plot(resp, 380, 40, '#f4d35e');
    // 數值面板
    g.fillStyle = '#0c141b'; g.fillRect(440, 0, 200, H);
    const big = (label: string, val: string, unit: string, y: number, color: string, size = 54) => {
      g.fillStyle = color; g.font = `600 14px ${FONT}`; g.fillText(label, 452, y - size + 4);
      g.font = `700 ${size}px ${FONT}`; g.fillText(val, 456, y + 4);
      g.font = `500 13px ${FONT}`; g.fillText(unit, 590, y - size + 4);
    };
    const blink = Math.floor(t * 2) % 2 === 0;
    big('HR', String(MONITOR_VITALS.hr), 'bpm', 80, '#4ef08a', 58);
    if (blink) { g.fillStyle = '#4ef08a'; g.beginPath(); g.arc(610, 70, 6, 0, Math.PI * 2); g.fill(); }
    big('SpO₂', String(MONITOR_VITALS.spo2), '%', 180, '#5ad7f2', 50);
    big('NIBP', `${MONITOR_VITALS.sys}/${MONITOR_VITALS.dia}`, 'mmHg', 280, '#e8eef2', 36);
    big('RR', String(MONITOR_VITALS.rr), 'rpm', 380, '#f4d35e', 40);
    tex.needsUpdate = true;
  });
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/** 一般 Canvas 螢幕（靜態，依 key 重繪） */
export function CanvasScreen({ width, height, px = [800, 480], draw, deps, emissive = true }: {
  width: number; height: number; px?: [number, number];
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void; deps: unknown[]; emissive?: boolean;
}) {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = px[0]; c.height = px[1];
    draw(c.getContext('2d')!, px[0], px[1]);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh>
      <planeGeometry args={[width, height]} />
      {emissive ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshStandardMaterial map={tex} roughness={0.8} />}
    </mesh>
  );
}
