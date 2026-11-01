import { useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { extrude, roundedRectPath, roundedRectShape, tube } from './geo';
import { drawTexture, FONT } from '../textures';

/** 醫療設備（程式建模）：壁掛生命徵象監視器機殼、12 導程心電圖機推車 */

const mats = () => ({
  shell: new THREE.MeshPhysicalMaterial({ color: '#dfe4e8', roughness: 0.35, clearcoat: 0.3 }),
  shellDark: new THREE.MeshStandardMaterial({ color: '#3a434b', roughness: 0.5 }),
  bezel: new THREE.MeshStandardMaterial({ color: '#1a1f24', roughness: 0.35 }),
  steel: new THREE.MeshStandardMaterial({ color: '#c3c9ce', roughness: 0.25, metalness: 0.9 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#1d2125', roughness: 0.85 }),
  cableGrey: new THREE.MeshStandardMaterial({ color: '#6f777e', roughness: 0.55 }),
  teal: new THREE.MeshPhysicalMaterial({ color: '#2b7d86', roughness: 0.35, clearcoat: 0.4 }),
});

/** 壁掛監視器機殼；children 放螢幕內容 */
export function MonitorHousing({ children }: { children: ReactNode }) {
  const m = useMemo(mats, []);
  const body = useMemo(() => {
    const s = roundedRectShape(0.74, 0.52, 0.045);
    return extrude(s, 0.07, 0.014);
  }, []);
  const bezel = useMemo(() => {
    const s = roundedRectShape(0.7, 0.48, 0.03);
    s.holes.push(roundedRectPath(0.645, 0.425, 0.012, 0, 0.012));
    return extrude(s, 0.012, 0.004);
  }, []);
  const back = useMemo(() => { const s = roundedRectShape(0.5, 0.34, 0.06); return extrude(s, 0.06, 0.02); }, []);
  const handle = useMemo(() => tube([[-0.2, 0, 0], [-0.19, 0.045, 0], [0, 0.055, 0], [0.19, 0.045, 0], [0.2, 0, 0]], 0.011, 40, 12), []);
  const keys = useMemo(() => drawTexture('mon-keys', 512, 48, (g, w, h) => {
    g.fillStyle = '#1a1f24'; g.fillRect(0, 0, w, h);
    const labels = ['☰', '⏸', '🔔', 'NIBP', '⟲', '⏻'];
    labels.forEach((l, i) => { const x = 20 + i * 80; g.fillStyle = '#2c343b'; g.beginPath(); g.roundRect(x, 8, 66, 32, 8); g.fill(); g.fillStyle = l === '🔔' ? '#F4B74A' : '#cfd8de'; g.font = `600 18px ${FONT}`; g.textAlign = 'center'; g.fillText(l, x + 33, 31); });
  }), []);
  return (
    <group>
      <mesh geometry={body} material={m.shell} castShadow position={[0, 0, -0.035]} />
      <mesh geometry={back} material={m.shellDark} position={[0, -0.01, -0.09]} castShadow />
      <mesh geometry={bezel} material={m.bezel} position={[0, 0, 0.006]} />
      <group position={[0, 0.012, 0.003]}>{children}</group>
      <mesh position={[0, -0.232, 0.013]}><planeGeometry args={[0.5, 0.034]} /><meshStandardMaterial map={keys} roughness={0.4} /></mesh>
      {/* 旋鈕 */}
      <group position={[0.322, -0.215, 0.012]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={m.shellDark}><cylinderGeometry args={[0.018, 0.02, 0.02, 32]} /></mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.011]} material={m.steel}><cylinderGeometry args={[0.012, 0.012, 0.004, 24]} /></mesh>
      </group>
      {/* 警示燈條 */}
      <RoundedBox args={[0.3, 0.022, 0.05]} radius={0.01} position={[0, 0.27, -0.02]}>
        <meshPhysicalMaterial color="#F4B74A" emissive="#F4B74A" emissiveIntensity={0.25} roughness={0.2} transmission={0.3} transparent opacity={0.9} />
      </RoundedBox>
      <mesh geometry={handle} material={m.shellDark} position={[0, 0.27, -0.06]} />
      {/* 壁掛支架 */}
      <RoundedBox args={[0.14, 0.2, 0.02]} radius={0.006} position={[0, -0.02, -0.16]} material={m.steel} />
      <mesh position={[0, -0.02, -0.135]} rotation={[Math.PI / 2, 0, 0]} material={m.steel}><cylinderGeometry args={[0.025, 0.025, 0.05, 24]} /></mesh>
      {/* 側邊導程插孔 */}
      {[0.08, 0.02, -0.04, -0.1].map((y, i) => (
        <mesh key={y} position={[-0.372, y, -0.02]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.011, 0.011, 0.012, 20]} />
          <meshStandardMaterial color={['#3fbf6f', '#3f7fd6', '#e8e8e8', '#f0c419'][i]} roughness={0.4} />
        </mesh>
      ))}
    </group>
  );
}

const LEAD_COLORS = ['#ffffff', '#111111', '#2e9b57', '#e04848', '#e04848', '#f0c419', '#2e9b57', '#3f7fd6', '#e07a2e', '#8a4fc0'];

/** 12 導程心電圖機推車（含導程線） */
export function EcgCart() {
  const m = useMemo(mats, []);
  const machineGeo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(-0.17, 0); s.lineTo(0.17, 0); s.lineTo(0.17, 0.06); s.lineTo(-0.12, 0.12); s.lineTo(-0.17, 0.12); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.36, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 4, curveSegments: 8 });
    g.translate(0, 0, -0.18); g.rotateY(Math.PI / 2); g.computeVertexNormals();
    return g;
  }, []);
  const screen = useMemo(() => drawTexture('ecg-screen', 512, 300, (g, w, h) => {
    g.fillStyle = '#071018'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#E45858'; g.fillRect(0, 0, w, 44);
    g.fillStyle = '#fff'; g.font = `700 24px ${FONT}`; g.fillText('⚠ ERROR E-17', 16, 31);
    g.fillStyle = '#e8eef2'; g.font = `500 22px ${FONT}`; g.fillText('DATA ACCESS LOCKED', 16, 100);
    g.fillStyle = '#9fb0bd'; g.font = `400 18px ${FONT}`; g.fillText('LAST RECORD  01:58', 16, 140); g.fillText('PATIENT ID  ███████', 16, 170);
    g.strokeStyle = 'rgba(78,240,138,.35)'; g.lineWidth = 2; g.beginPath();
    for (let x = 0; x < w; x += 2) { const p = (x % 120) / 120; const yv = 250 - (p > 0.4 && p < 0.44 ? 40 : p > 0.44 && p < 0.47 ? -12 : 0) - Math.sin(p * Math.PI) * 4; x ? g.lineTo(x, yv) : g.moveTo(x, yv); }
    g.stroke();
  }), []);
  const keypad = useMemo(() => drawTexture('ecg-keys', 512, 200, (g, w, h) => {
    g.fillStyle = '#d6dce0'; g.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 12; c++) { g.fillStyle = r === 0 && c > 8 ? '#2e9b57' : '#f3f5f6'; g.beginPath(); g.roundRect(10 + c * 41, 12 + r * 46, 34, 36, 6); g.fill(); g.strokeStyle = '#aab3b9'; g.stroke(); }
    g.fillStyle = '#fff'; g.font = `700 14px ${FONT}`; g.fillText('AUTO', 382, 36); g.fillText('COPY', 423, 36); g.fillText('STOP', 464, 36);
  }), []);
  const paper = useMemo(() => drawTexture('ecg-paper', 256, 128, (g, w, h) => {
    g.fillStyle = '#fbe9ea'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(228,88,88,.35)'; g.lineWidth = 1;
    for (let x = 0; x < w; x += 8) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 8) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  }), []);
  // 導程線：主線自機器垂下並纏繞掛鉤，10 條分線帶電極夾
  const trunk = useMemo(() => tube([[0.19, 0.93, 0.05], [0.25, 0.86, 0.08], [0.27, 0.7, 0.1], [0.25, 0.55, 0.12], [0.27, 0.45, 0.06], [0.26, 0.6, 0.0], [0.24, 0.78, -0.02]], 0.006, 120, 10), []);
  const leads = useMemo(() => LEAD_COLORS.map((_, i) => {
    const a = (i / LEAD_COLORS.length) * Math.PI * 2;
    const end: [number, number, number] = [0.28 + Math.cos(a) * 0.05, 0.3 + (i % 3) * 0.05, 0.1 + Math.sin(a) * 0.06];
    return { geo: tube([[0.25, 0.55, 0.12], [0.27 + Math.cos(a) * 0.03, 0.45, 0.12 + Math.sin(a) * 0.04], end], 0.0025, 40, 6), end };
  }), []);
  const castor = (x: number, z: number) => (
    <group key={`${x}${z}`} position={[x, 0, z]}>
      <mesh position={[0, 0.045, 0]} rotation={[0, 0, Math.PI / 2]} material={m.rubber}><cylinderGeometry args={[0.035, 0.035, 0.025, 24]} /></mesh>
      <mesh position={[0, 0.09, 0]} material={m.shellDark}><cylinderGeometry args={[0.018, 0.022, 0.03, 16]} /></mesh>
    </group>
  );
  return (
    <group>
      {/* 五爪底座 */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <RoundedBox args={[0.05, 0.03, 0.24]} radius={0.012} position={[0, 0.105, 0.12]} material={m.shellDark} castShadow />
            {castor(0, 0.23)}
          </group>
        );
      })}
      <mesh position={[0, 0.115, 0]} material={m.shellDark}><cylinderGeometry args={[0.07, 0.08, 0.04, 32]} /></mesh>
      {/* 立柱 */}
      <mesh position={[0, 0.48, 0]} material={m.steel} castShadow><cylinderGeometry args={[0.022, 0.022, 0.72, 24]} /></mesh>
      {/* 置物籃 */}
      <group position={[0, 0.5, 0]}>
        <RoundedBox args={[0.3, 0.1, 0.22]} radius={0.01} material={m.shell} castShadow />
        <RoundedBox args={[0.12, 0.05, 0.08]} radius={0.006} position={[-0.06, 0.07, 0.02]}><meshStandardMaterial color="#e6eef2" roughness={0.6} /></RoundedBox>
        <RoundedBox args={[0.1, 0.045, 0.07]} radius={0.006} position={[0.07, 0.065, -0.03]}><meshStandardMaterial color="#d33f49" roughness={0.6} /></RoundedBox>
      </group>
      {/* 頂部托盤與機器 */}
      <RoundedBox args={[0.44, 0.03, 0.4]} radius={0.012} position={[0, 0.855, 0]} material={m.shell} castShadow receiveShadow />
      <group position={[0, 0.87, 0]}>
        <mesh geometry={machineGeo} material={m.shell} castShadow receiveShadow />
        {/* 斜面：鍵盤＋螢幕 */}
        <group position={[0, 0.0925, 0.0]} rotation={[-Math.atan2(0.06, 0.29), 0, 0]}>
          <mesh position={[0, 0.006, 0.075]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.32, 0.12]} /><meshStandardMaterial map={keypad} roughness={0.5} /></mesh>
        </group>
        <group position={[0, 0.2, -0.13]} rotation={[-0.35, 0, 0]}>
          <RoundedBox args={[0.3, 0.19, 0.02]} radius={0.008} material={m.bezel} castShadow />
          <mesh position={[0, 0, 0.011]}><planeGeometry args={[0.27, 0.16]} /><meshBasicMaterial map={screen} toneMapped={false} /></mesh>
        </group>
        <mesh position={[0, 0.1, -0.15]} material={m.shellDark}><boxGeometry args={[0.06, 0.12, 0.02]} /></mesh>
        {/* 紙匣與心電圖紙 */}
        <mesh position={[0, 0.125, -0.185]} rotation={[-1.1, 0, 0]}><planeGeometry args={[0.24, 0.07]} /><meshStandardMaterial map={paper} roughness={0.9} side={THREE.DoubleSide} /></mesh>
      </group>
      {/* 掛鉤與導程線 */}
      <mesh position={[0.24, 0.78, -0.02]} rotation={[0, 0, -0.6]} material={m.steel}><torusGeometry args={[0.03, 0.006, 8, 20, Math.PI * 1.3]} /></mesh>
      <mesh geometry={trunk} material={m.cableGrey} castShadow />
      {leads.map((l, i) => (
        <group key={i}>
          <mesh geometry={l.geo}><meshStandardMaterial color={LEAD_COLORS[i]} roughness={0.5} /></mesh>
          <RoundedBox args={[0.014, 0.03, 0.01]} radius={0.004} position={l.end}><meshStandardMaterial color={LEAD_COLORS[i]} roughness={0.4} /></RoundedBox>
        </group>
      ))}
      {/* 推把 */}
      <mesh position={[0, 1.02, 0.17]} rotation={[0, 0, Math.PI / 2]} material={m.teal}><cylinderGeometry args={[0.014, 0.014, 0.36, 16]} /></mesh>
      {[-0.17, 0.17].map((x) => <mesh key={x} position={[x, 0.95, 0.17]} material={m.steel}><cylinderGeometry args={[0.01, 0.01, 0.14, 12]} /></mesh>)}
    </group>
  );
}
