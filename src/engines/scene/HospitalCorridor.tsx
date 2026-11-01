import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { ceilingTexture, drawTexture, floorTextures, FONT, wallTexture } from './textures';
import type { Quality } from '../../store/gameStore';

/** 首頁背景：夜間醫院走廊（程序化建築＋電影式緩慢推軌） */
const CW = 3.2, CH = 2.9, SEG = 4, N = 12;

function Segment({ i, quality }: { i: number; quality: Quality }) {
  const z = -i * SEG;
  const panel = useRef<THREE.MeshStandardMaterial>(null);
  const flick = i === 3 || i === 7;
  useFrame(({ clock }) => {
    if (!flick || !panel.current) return;
    const t = clock.elapsedTime + i;
    const off = Math.sin(t * 17) > 0.93 || (t % 6.3 > 6.0);
    panel.current.emissiveIntensity = off ? 0.15 : i === 7 ? 0.9 : 2.4;
  });
  const side = i % 2 === 0 ? 1 : -1;
  const doorTex = useMemo(() => drawTexture(`plate-${i}`, 256, 96, (g, w, h) => {
    g.fillStyle = '#101C2B'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#13B8B0'; g.fillRect(0, 0, 8, h);
    g.fillStyle = '#F4F7FA'; g.font = `700 34px ${FONT}`;
    const names = ['診察室', '處置室', '觀察區', '檢驗室', '診察室', '藥局', '影像室', '急救區', '交班室', '技能室', '值班室', '儲藏室'];
    g.fillText(`${names[i % names.length]} ${(i % 9) + 1}`, 22, 46);
    g.fillStyle = '#7f93a3'; g.font = `500 20px ${FONT}`; g.fillText(`ROOM ${String(101 + i)}`, 22, 78);
  }), [i]);
  return (
    <group position={[0, 0, z]}>
      {/* 天花燈 */}
      <mesh position={[0, CH - 0.015, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.6, 1.2]} />
        <meshStandardMaterial ref={panel} color="#fff" emissive="#eaf2ff" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      {/* 門 */}
      <group position={[side * (CW / 2 - 0.01), 0, -1.2]} rotation={[0, -side * Math.PI / 2, 0]}>
        <mesh position={[0, 1.05, 0.02]} castShadow={quality === 'high'}><boxGeometry args={[1.1, 2.1, 0.05]} /><meshStandardMaterial color={i % 3 === 0 ? '#b49a78' : '#a9b6bf'} roughness={0.55} /></mesh>
        <mesh position={[0, 1.5, 0.05]}><planeGeometry args={[0.24, 0.5]} /><meshStandardMaterial color="#cfe7ef" emissive={i % 4 === 1 ? '#5fd0c8' : '#20303a'} emissiveIntensity={i % 4 === 1 ? 0.7 : 0.25} roughness={0.15} /></mesh>
        <mesh position={[0, 0.15, 0.05]}><planeGeometry args={[1.06, 0.26]} /><meshStandardMaterial color="#c7cdd2" metalness={0.8} roughness={0.3} /></mesh>
        {[-1, 1].map((s) => <mesh key={s} position={[s * 0.58, 1.08, 0.03]}><boxGeometry args={[0.06, 2.16, 0.1]} /><meshStandardMaterial color="#c7cdd2" metalness={0.7} roughness={0.35} /></mesh>)}
        <mesh position={[0.95, 1.7, 0.02]}><planeGeometry args={[0.5, 0.19]} /><meshStandardMaterial map={doorTex} roughness={0.4} /></mesh>
      </group>
    </group>
  );
}

function Shell({ quality }: { quality: Quality }) {
  const L = SEG * N;
  const floor = useMemo(() => floorTextures([2, L / 3]), [L]);
  const wall = useMemo(() => wallTexture([L / 3, 1], '#dfe6ea'), [L]);
  const ceil = useMemo(() => ceilingTexture([CW / 0.6, L / 0.6]), [L]);
  const zc = -L / 2 + SEG;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]}>
        <planeGeometry args={[CW, L]} />
        {quality === 'high' ? (
          <MeshReflectorMaterial map={floor.map} roughnessMap={floor.roughnessMap} resolution={512} mixBlur={6} mixStrength={1.2} blur={[300, 80]} roughness={0.7} metalness={0.05} mirror={0} />
        ) : (
          <meshStandardMaterial map={floor.map} roughnessMap={floor.roughnessMap} roughness={0.45} />
        )}
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, CH, zc]}><planeGeometry args={[CW, L]} /><meshStandardMaterial map={ceil} roughness={0.95} /></mesh>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * CW / 2, CH / 2, zc]} rotation={[0, -s * Math.PI / 2, 0]}><planeGeometry args={[L, CH]} /><meshStandardMaterial map={wall} roughness={0.85} /></mesh>
          <RoundedBox args={[0.05, 0.12, L]} radius={0.02} position={[s * (CW / 2 - 0.04), 0.92, zc]}><meshStandardMaterial color="#2a6a70" roughness={0.38} /></RoundedBox>
          <mesh position={[s * (CW / 2 - 0.01), 0.06, zc]} rotation={[0, -s * Math.PI / 2, 0]}><planeGeometry args={[L, 0.12]} /><meshStandardMaterial color="#3b4752" roughness={0.6} /></mesh>
        </group>
      ))}
      {/* 懸吊指示牌 */}
      <group position={[0, CH - 0.35, -6]}>
        <mesh><planeGeometry args={[1.4, 0.32]} /><meshStandardMaterial map={drawTexture('sign-er', 700, 160, (g, w, h) => {
          g.fillStyle = '#E45858'; g.fillRect(0, 0, w, h);
          g.fillStyle = '#fff'; g.font = `700 70px ${FONT}`; g.fillText('急診 EMERGENCY', 30, 105);
          g.font = `700 80px ${FONT}`; g.fillText('→', w - 110, 108);
        })} roughness={0.4} /></mesh>
        {[-0.5, 0.5].map((x) => <mesh key={x} position={[x, 0.26, 0]}><cylinderGeometry args={[0.006, 0.006, 0.2]} /><meshStandardMaterial color="#888" /></mesh>)}
      </group>
    </group>
  );
}

function DollyCamera({ reduced }: { reduced: boolean }) {
  useFrame(({ camera, clock, pointer }) => {
    const t = clock.elapsedTime;
    const z = 3 - ((t * (reduced ? 0 : 0.32)) % SEG);
    camera.position.set(Math.sin(t * 0.21) * 0.18 + pointer.x * 0.1, 1.62 + Math.sin(t * 0.9) * 0.012, z);
    camera.lookAt(Math.sin(t * 0.13) * 0.35 + pointer.x * 0.3, 1.45 + pointer.y * 0.12, z - 8);
  });
  return null;
}

export function CorridorScene({ quality, reduced }: { quality: Quality; reduced: boolean }) {
  return (
    <>
      <color attach="background" args={['#070d14']} />
      <fog attach="fog" args={['#0a1520', 4, 30]} />
      <DollyCamera reduced={reduced} />
      <hemisphereLight args={['#cfe0f0', '#1a222b', 0.45]} />
      {[0, -8, -16].map((z) => <pointLight key={z} position={[0, CH - 0.3, z]} intensity={3.5} distance={9} color="#e6efff" />)}
      <pointLight position={[0, 1.4, -28]} intensity={4} distance={14} color="#13B8B0" />
      <Shell quality={quality} />
      {Array.from({ length: N }, (_, i) => <Segment key={i} i={i} quality={quality} />)}
      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={1.5} position={[0, 3, -4]} rotation-x={Math.PI / 2} scale={[2, 10, 1]} />
        <Lightformer form="rect" intensity={0.5} color="#13B8B0" position={[0, 1.5, -20]} scale={[4, 3, 1]} />
      </Environment>
    </>
  );
}
