import { useMemo } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import { extrude, noiseNormal, roundedRectPath, roundedRectShape } from './geo';
import { drawTexture, FONT } from '../textures';

/**
 * 急診電動病床（程式建模）
 * 座標：原點為床體正下方地面中心；床頭朝 -Z。背板抬高 BED.backDeg 度（半坐臥姿）。
 */
export const BED = {
  halfW: 0.45, deckY: 0.5, mattT: 0.15, hingeZ: -0.18, headZ: -1.0, footZ: 1.0, backDeg: 32,
  get top() { return this.deckY + this.mattT; },
};

export const bedMats = () => ({
  white: new THREE.MeshPhysicalMaterial({ color: '#e8ecef', roughness: 0.32, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
  grey: new THREE.MeshStandardMaterial({ color: '#8f9aa3', roughness: 0.45, metalness: 0.1 }),
  dark: new THREE.MeshStandardMaterial({ color: '#30363c', roughness: 0.55 }),
  teal: new THREE.MeshPhysicalMaterial({ color: '#2b7d86', roughness: 0.35, clearcoat: 0.4 }),
  steel: new THREE.MeshStandardMaterial({ color: '#c3c9ce', roughness: 0.25, metalness: 0.9 }),
  rubber: new THREE.MeshStandardMaterial({ color: '#1d2125', roughness: 0.85 }),
  vinyl: new THREE.MeshStandardMaterial({ color: '#35536b', roughness: 0.42 }),
  sheet: new THREE.MeshStandardMaterial({ color: '#f1f4f5', roughness: 0.92, normalMap: noiseNormal('sheet', 6, 0.6, true), normalScale: new THREE.Vector2(0.35, 0.35) }),
});

function Caster({ position, m }: { position: [number, number, number]; m: ReturnType<typeof bedMats> }) {
  const tire = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 16; i++) { const a = -Math.PI / 2 + (i / 16) * Math.PI; pts.push(new THREE.Vector2(0.045 + Math.cos(a) * 0.018, Math.sin(a) * 0.012)); }
    const g = new THREE.LatheGeometry(pts, 32); g.rotateZ(Math.PI / 2); return g;
  }, []);
  const fork = useMemo(() => extrude(roundedRectShape(0.05, 0.1, 0.02), 0.006, 0.002), []);
  return (
    <group position={position}>
      <mesh position={[0, 0.155, 0]} castShadow material={m.steel}><cylinderGeometry args={[0.016, 0.016, 0.05, 20]} /></mesh>
      <mesh position={[0, 0.125, 0]} castShadow material={m.dark}><cylinderGeometry args={[0.032, 0.036, 0.022, 28]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} geometry={fork} material={m.dark} position={[s * 0.034, 0.08, -0.012]} rotation={[0, Math.PI / 2, 0]} castShadow />)}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.016, 0.063, -0.02]}>
          <mesh geometry={tire} material={m.rubber} castShadow />
          <mesh rotation={[0, 0, Math.PI / 2]} material={m.grey}><cylinderGeometry args={[0.03, 0.03, 0.022, 24]} /></mesh>
        </group>
      ))}
      <mesh position={[0, 0.06, -0.02]} rotation={[0, 0, Math.PI / 2]} material={m.steel}><cylinderGeometry args={[0.008, 0.008, 0.08, 12]} /></mesh>
      <RoundedBox args={[0.03, 0.012, 0.06]} radius={0.004} position={[0, 0.115, 0.05]} material={m.teal} />
    </group>
  );
}

function SideRail({ length, height, m, flip }: { length: number; height: number; m: ReturnType<typeof bedMats>; flip?: boolean }) {
  const geo = useMemo(() => {
    const s = roundedRectShape(length, height, 0.05);
    const wl = (length - 0.12) / 2 - 0.02;
    s.holes.push(roundedRectPath(wl, height - 0.13, 0.035, -wl / 2 - 0.02, -0.015));
    s.holes.push(roundedRectPath(wl, height - 0.13, 0.035, wl / 2 + 0.02, -0.015));
    return extrude(s, 0.034, 0.008);
  }, [length, height]);
  const panel = useMemo(() => drawTexture('rail-panel', 256, 96, (g, w, h) => {
    g.fillStyle = '#20282f'; g.fillRect(0, 0, w, h);
    const btn = (x: number, label: string, c = '#dfe6ea') => { g.fillStyle = '#38434c'; g.beginPath(); g.roundRect(x, 18, 50, 60, 10); g.fill(); g.fillStyle = c; g.font = `700 26px ${FONT}`; g.textAlign = 'center'; g.fillText(label, x + 25, 60); };
    btn(8, '▲'); btn(68, '▼'); btn(136, '◢'); btn(196, '☎', '#F4B74A');
  }), []);
  return (
    <group rotation={[0, flip ? -Math.PI / 2 : Math.PI / 2, 0]}>
      <mesh geometry={geo} material={m.white} castShadow receiveShadow />
      <mesh position={[length / 2 - 0.2, -0.02, 0.019]}><planeGeometry args={[0.2, 0.075]} /><meshStandardMaterial map={panel} roughness={0.4} /></mesh>
      <RoundedBox args={[length - 0.06, 0.018, 0.04]} radius={0.008} position={[0, height / 2 - 0.012, 0]} material={m.teal} />
    </group>
  );
}

function BoardPanel({ w, h, m, footboard }: { w: number; h: number; m: ReturnType<typeof bedMats>; footboard?: boolean }) {
  const geo = useMemo(() => {
    const s = roundedRectShape(w, h, 0.07);
    s.holes.push(roundedRectPath(0.16, 0.05, 0.025, -w / 2 + 0.16, h / 2 - 0.08));
    s.holes.push(roundedRectPath(0.16, 0.05, 0.025, w / 2 - 0.16, h / 2 - 0.08));
    return extrude(s, 0.05, 0.012);
  }, [w, h]);
  const lcd = useMemo(() => drawTexture('foot-lcd', 512, 200, (g, W, H) => {
    g.fillStyle = '#1b2228'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#0d2a2c'; g.beginPath(); g.roundRect(20, 22, 230, 150, 12); g.fill();
    g.fillStyle = '#5fe0d8'; g.font = `700 30px ${FONT}`; g.fillText('BACK 32°', 40, 80);
    g.font = `500 22px ${FONT}`; g.fillStyle = '#9fd8d4'; g.fillText('BRAKE ● ON', 40, 120); g.fillText('SCALE  -- kg', 40, 155);
    const keys = ['⌂', '▲', '▼', '⟲', '⚖', '⏻'];
    keys.forEach((k, i) => { const x = 280 + (i % 3) * 74, y = 30 + Math.floor(i / 3) * 74; g.fillStyle = '#323d46'; g.beginPath(); g.roundRect(x, y, 62, 62, 12); g.fill(); g.fillStyle = '#e7edf0'; g.font = `700 28px ${FONT}`; g.textAlign = 'center'; g.fillText(k, x + 31, y + 42); g.textAlign = 'left'; });
  }), []);
  return (
    <group>
      <mesh geometry={geo} material={m.white} castShadow receiveShadow />
      <RoundedBox args={[w - 0.22, h * 0.32, 0.012]} radius={0.01} position={[0, -h * 0.12, footboard ? 0.028 : -0.028]} material={m.teal} />
      {footboard && <mesh position={[0, -h * 0.12, 0.036]}><planeGeometry args={[0.36, 0.14]} /><meshStandardMaterial map={lcd} roughness={0.3} /></mesh>}
    </group>
  );
}

export function HospitalBed() {
  const m = useMemo(bedMats, []);
  const back = (BED.backDeg * Math.PI) / 180;
  const backLen = BED.hingeZ - BED.headZ; // 0.82
  const legLen = BED.footZ - BED.hingeZ;
  const baseGeo = useMemo(() => { const g = extrude(roundedRectShape(0.62, 1.55, 0.08), 0.07, 0.015); g.rotateX(-Math.PI / 2); return g; }, []);
  const W = BED.halfW * 2;
  return (
    <group>
      {/* 底座與腳輪 */}
      <mesh geometry={baseGeo} position={[0, 0.2, 0]} material={m.grey} castShadow receiveShadow />
      {[[-0.31, -0.74], [0.31, -0.74], [-0.31, 0.74], [0.31, 0.74]].map(([x, z]) => <Caster key={`${x}${z}`} position={[x, 0, z]} m={m} />)}
      {/* 升降柱 */}
      {[-0.5, 0.5].map((z) => (
        <group key={z} position={[0, 0, z]}>
          <RoundedBox args={[0.2, 0.2, 0.13]} radius={0.02} position={[0, 0.33, 0]} material={m.white} castShadow />
          <RoundedBox args={[0.16, 0.14, 0.1]} radius={0.015} position={[0, 0.44, 0]} material={m.grey} castShadow />
        </group>
      ))}
      {/* 床架 */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <RoundedBox args={[0.045, 0.06, legLen]} radius={0.01} position={[s * (BED.halfW - 0.02), BED.deckY - 0.03, BED.hingeZ + legLen / 2]} material={m.steel} castShadow />
          <mesh position={[s * (BED.halfW + 0.005), BED.deckY - 0.03, BED.footZ - 0.02]} rotation={[0, 0, 0]} material={m.dark}><cylinderGeometry args={[0.035, 0.035, 0.05, 24]} /></mesh>
        </group>
      ))}
      <RoundedBox args={[W - 0.06, 0.03, 0.04]} radius={0.01} position={[0, BED.deckY - 0.04, 0.5]} material={m.steel} />
      {/* 腿部床墊（含床單） */}
      <group position={[0, BED.deckY, BED.hingeZ + legLen / 2]}>
        <RoundedBox args={[W - 0.04, BED.mattT, legLen - 0.03]} radius={0.045} smoothness={5} position={[0, BED.mattT / 2, 0]} material={m.vinyl} castShadow receiveShadow />
        <RoundedBox args={[W - 0.02, BED.mattT * 0.55, legLen - 0.015]} radius={0.04} smoothness={5} position={[0, BED.mattT * 0.74, 0]} material={m.sheet} receiveShadow />
      </group>
      {/* 背板（抬高） */}
      <group position={[0, BED.deckY, BED.hingeZ]} rotation={[back, 0, 0]}>
        {[-1, 1].map((s) => <RoundedBox key={s} args={[0.045, 0.06, backLen]} radius={0.01} position={[s * (BED.halfW - 0.02), -0.03, -backLen / 2]} material={m.steel} castShadow />)}
        <RoundedBox args={[W - 0.04, BED.mattT, backLen - 0.02]} radius={0.045} smoothness={5} position={[0, BED.mattT / 2, -backLen / 2]} material={m.vinyl} castShadow receiveShadow />
        <RoundedBox args={[W - 0.02, BED.mattT * 0.55, backLen - 0.01]} radius={0.04} smoothness={5} position={[0, BED.mattT * 0.74, -backLen / 2]} material={m.sheet} receiveShadow />
        {/* 床頭側欄（隨背板） */}
        {[-1, 1].map((s) => (
          <group key={s} position={[s * (BED.halfW + 0.035), BED.mattT + 0.11, -backLen / 2 - 0.02]}>
            <SideRail length={0.68} height={0.3} m={m} flip={s < 0} />
          </group>
        ))}
        {/* 點滴架插座 */}
        {[-1, 1].map((s) => <mesh key={s} position={[s * (BED.halfW - 0.02), 0.02, -backLen + 0.02]} material={m.dark}><cylinderGeometry args={[0.014, 0.014, 0.07, 16]} /></mesh>)}
      </group>
      {/* 床尾側欄 */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (BED.halfW + 0.035), BED.top + 0.1, 0.36]}>
          <SideRail length={0.8} height={0.3} m={m} flip={s < 0} />
        </group>
      ))}
      {/* 床頭板／床尾板 */}
      <group position={[0, 0.78, BED.headZ - 0.07]}><BoardPanel w={W + 0.02} h={0.6} m={m} /></group>
      <group position={[0, 0.72, BED.footZ + 0.05]}><BoardPanel w={W + 0.02} h={0.48} m={m} footboard /></group>
    </group>
  );
}
