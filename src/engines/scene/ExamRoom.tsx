import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { ContactShadows, Environment, Lightformer, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js';
import { ceilingTexture, drawTexture, floorTextures, FONT, HAND, wallTexture } from './textures';
import { AssetSlot } from './AssetSlot';
import { Interactable } from './Interactable';
import { CanvasScreen, MonitorScreen } from './Screens';
import { CameraRig } from './CameraRig';
import { HospitalBed } from './models/HospitalBed';
import { Patient, PATIENT_ANCHORS } from './models/Patient';
import { EcgCart, MonitorHousing } from './models/MedicalDevices';
import { cable } from './models/geo';
import { VIEWPOINTS } from '../../data/level1/objects';
import { useGame, type Quality } from '../../store/gameStore';
import { useUI } from '../../store/uiStore';

RectAreaLightUniformsLib.init();

const W = 7, D = 6, H = 3;           // 房間尺寸 (m)
const X0 = -W / 2, X1 = W / 2, Z0 = -D / 2, Z1 = D / 2;
const DOOR_X = 2.3, DOOR_W = 1.1, DOOR_H = 2.15;

const M = {
  steel: { color: '#c7cdd2', metalness: 0.85, roughness: 0.28 },
  rail: { color: '#2a6a70', roughness: 0.38 },
  laminate: { color: '#d8d1c4', roughness: 0.5 },
  cabinet: { color: '#eef1f3', roughness: 0.42 },
  darkTrim: { color: '#3b4752', roughness: 0.6 },
};

function Room() {
  const floor = useMemo(() => floorTextures([3.5, 3]), []);
  const wall = useMemo(() => wallTexture([3, 1.5]), []);
  const ceil = useMemo(() => ceilingTexture([W / 0.6, D / 0.6]), []);
  const wallMat = <meshStandardMaterial map={wall} roughness={0.88} />;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floor.map} roughnessMap={floor.roughnessMap} roughness={0.55} metalness={0.02} envMapIntensity={0.7} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={ceil} roughness={0.95} />
      </mesh>
      {/* 牆面 */}
      <mesh position={[0, H / 2, Z0]} receiveShadow><planeGeometry args={[W, H]} />{wallMat}</mesh>
      <mesh position={[X0, H / 2, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow><planeGeometry args={[D, H]} />{wallMat}</mesh>
      <mesh position={[X1, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow><planeGeometry args={[D, H]} />{wallMat}</mesh>
      {/* 前牆（含門洞） */}
      {(() => {
        const leftW = DOOR_X - DOOR_W / 2 - X0, rightW = X1 - (DOOR_X + DOOR_W / 2);
        return (
          <group rotation={[0, Math.PI, 0]} position={[0, 0, Z1]}>
            <mesh position={[-(X0 + leftW / 2), H / 2, 0]}><planeGeometry args={[leftW, H]} />{wallMat}</mesh>
            <mesh position={[-(X1 - rightW / 2), H / 2, 0]}><planeGeometry args={[rightW, H]} />{wallMat}</mesh>
            <mesh position={[-DOOR_X, (H + DOOR_H) / 2, 0]}><planeGeometry args={[DOOR_W, H - DOOR_H]} />{wallMat}</mesh>
          </group>
        );
      })()}
      {/* 踢腳板與防撞扶手 */}
      {[
        { p: [0, 0, Z0 + 0.012] as const, r: 0, l: W },
        { p: [X0 + 0.012, 0, 0] as const, r: Math.PI / 2, l: D },
        { p: [X1 - 0.012, 0, 0] as const, r: Math.PI / 2, l: D },
      ].map((w, i) => (
        <group key={i} position={w.p as unknown as [number, number, number]} rotation={[0, w.r, 0]}>
          <mesh position={[0, 0.06, 0]}><boxGeometry args={[w.l, 0.12, 0.02]} /><meshStandardMaterial {...M.darkTrim} /></mesh>
          <RoundedBox args={[w.l - 0.1, 0.14, 0.035]} radius={0.015} position={[0, 0.92, 0.01]} castShadow><meshStandardMaterial {...M.rail} /></RoundedBox>
        </group>
      ))}
    </group>
  );
}

function CeilingLight({ position, flicker = false, intensity = 5 }: { position: [number, number, number]; flicker?: boolean; intensity?: number }) {
  const mat = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.RectAreaLight>(null);
  useFrame(({ clock }) => {
    if (!flicker) return;
    const t = clock.elapsedTime;
    const off = (Math.sin(t * 13.1) > 0.97 && Math.sin(t * 0.7) > 0.2) || (t % 9 > 8.75);
    const k = off ? 0.15 : 1;
    if (mat.current) mat.current.emissiveIntensity = 2.2 * k;
    if (light.current) light.current.intensity = intensity * k;
  });
  return (
    <group position={position}>
      <mesh position={[0, -0.012, 0]}><boxGeometry args={[0.64, 0.02, 1.24]} /><meshStandardMaterial color="#d9dee2" metalness={0.4} roughness={0.4} /></mesh>
      <mesh position={[0, -0.024, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.58, 1.18]} />
        <meshStandardMaterial ref={mat} color="#ffffff" emissive="#f2f7ff" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>
      <rectAreaLight ref={light} width={0.58} height={1.18} intensity={intensity} color="#eef4ff" position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]} />
    </group>
  );
}

function Lights({ quality }: { quality: Quality }) {
  const shadow = quality === 'high' ? 2048 : 1024;
  return (
    <>
      <hemisphereLight args={['#dfe9f5', '#2a3440', 0.35]} />
      <CeilingLight position={[-1.1, H, -1.7]} intensity={6} />
      <CeilingLight position={[1.7, H, -0.6]} intensity={5} />
      <CeilingLight position={[-1.2, H, 1.4]} intensity={3.5} />
      <CeilingLight position={[1.9, H, 2.1]} intensity={3} flicker />
      {/* 床頭檢查燈（主陰影來源） */}
      <spotLight position={[-1.1, 2.9, -1.4]} angle={0.75} penumbra={0.8} intensity={22} distance={6} color="#fff6ea" castShadow={quality !== 'low'}
        shadow-mapSize={[shadow, shadow]} shadow-bias={-0.0004} target-position={[-1.1, 0, -2]} />
      {/* 監視器微光 */}
      <pointLight position={[-1.85, 2.1, -2.6]} intensity={0.6} distance={2} color="#3fe0c8" />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.2} position={[0, 3, 0]} rotation-x={Math.PI / 2} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={0.6} color="#9fd8ff" position={[0, 1.5, -4]} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#ffe2c4" position={[4, 1.5, 0]} rotation-y={-Math.PI / 2} scale={[4, 2, 1]} />
      </Environment>
    </>
  );
}

/** 床頭設備帶（平面圖示，不偽裝為立體醫療設備） */
function Headwall() {
  const tex = useMemo(() => drawTexture('headwall', 1024, 192, (g, w, h) => {
    g.fillStyle = '#dfe5e8'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9d1d6'; g.fillRect(0, h - 14, w, 14);
    const plate = (x: number, color: string, label: string) => {
      g.fillStyle = '#f5f7f8'; g.fillRect(x, 50, 92, 100);
      g.strokeStyle = '#aab4ba'; g.lineWidth = 2; g.strokeRect(x, 50, 92, 100);
      g.fillStyle = color; g.fillRect(x, 50, 92, 22);
      g.fillStyle = '#fff'; g.font = `700 16px ${FONT}`; g.textAlign = 'center'; g.fillText(label, x + 46, 67);
      g.fillStyle = '#7d878e'; g.beginPath(); g.arc(x + 46, 110, 18, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#3c454c'; g.beginPath(); g.arc(x + 46, 110, 8, 0, Math.PI * 2); g.fill();
    };
    plate(300, '#2e9b57', 'O₂'); plate(410, '#1c1c1c', 'AIR'); plate(520, '#f0c419', 'VAC');
    g.fillStyle = '#e45858'; g.fillRect(680, 70, 70, 60); g.fillStyle = '#fff'; g.font = `700 14px ${FONT}`; g.fillText('緊急呼叫', 715, 106);
    g.fillStyle = '#4b5660'; g.font = `500 18px ${FONT}`; g.textAlign = 'left'; g.fillText('BED 3 · 診察床 3', 40, 110);
  }), []);
  return (
    <group position={[-1.15, 1.45, Z0 + 0.03]}>
      <RoundedBox args={[2.6, 0.5, 0.06]} radius={0.02} castShadow receiveShadow><meshStandardMaterial color="#e3e8eb" roughness={0.4} /></RoundedBox>
      <mesh position={[0, 0, 0.031]}><planeGeometry args={[2.5, 0.46]} /><meshStandardMaterial map={tex} roughness={0.5} /></mesh>
    </group>
  );
}

/** 隔簾（布料皺褶以頂點位移生成） */
function Curtain() {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(1.9, 2.25, 120, 8);
    const p = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i);
      p.setZ(i, Math.sin(x * 22) * 0.045 + Math.sin(x * 7.3) * 0.02 + (y < -0.9 ? Math.sin(x * 22) * 0.01 : 0));
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <group position={[-2.4, 0, Z0 + 1.0]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 2.92, 0]}><boxGeometry args={[2.0, 0.03, 0.05]} /><meshStandardMaterial {...M.steel} /></mesh>
      <mesh geometry={geo} position={[0, 1.72, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#8fb9bb" roughness={0.95} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 2.86, 0]}><planeGeometry args={[1.9, 0.14]} /><meshStandardMaterial color="#f2f4f5" roughness={0.9} side={THREE.DoubleSide} /></mesh>
    </group>
  );
}

function WallMonitor() {
  return (
    <Interactable id="monitor" position={[-1.85, 2.12, Z0 + 0.06]} marker={[0, 0.32, 0.05]}>
      <AssetSlot assetId="patient_monitor" size={[0.74, 0.52, 0.1]}>
        <group position={[0, 0, 0.1]}>
          <MonitorHousing><MonitorScreen width={0.64} height={0.415} /></MonitorHousing>
        </group>
      </AssetSlot>
    </Interactable>
  );
}

function Workstation() {
  const unlocked = useGame((s) => s.level1.flags.includes('reasoning_unlocked'));
  const solved = useGame((s) => s.level1.flags.includes('puzzle_solved'));
  const drawEMR = (g: CanvasRenderingContext2D, w: number, h: number) => {
    const grd = g.createLinearGradient(0, 0, 0, h); grd.addColorStop(0, '#0f1d2b'); grd.addColorStop(1, '#0a131c');
    g.fillStyle = grd; g.fillRect(0, 0, w, h);
    g.fillStyle = '#13B8B0'; g.fillRect(0, 0, w, 46);
    g.fillStyle = '#04201f'; g.font = `700 22px ${FONT}`; g.fillText('EMR · 急診電子病歷系統', 22, 31);
    g.textAlign = 'center';
    if (solved) {
      g.fillStyle = '#4ef08a'; g.font = `700 40px ${FONT}`; g.fillText('✓ 存取已恢復', w / 2, h / 2 - 10);
      g.fillStyle = '#c6d4de'; g.font = `400 22px ${FONT}`; g.fillText('問題表述已上傳 · 門禁解除', w / 2, h / 2 + 34);
    } else {
      g.fillStyle = unlocked ? '#F4B74A' : '#E45858'; g.font = `700 64px ${FONT}`; g.fillText(unlocked ? '◉' : '🔒', w / 2, h / 2 - 40);
      g.font = `700 30px ${FONT}`; g.fillText(unlocked ? '臨床推理板已啟動' : 'ACCESS LOCKED', w / 2, h / 2 + 20);
      g.fillStyle = '#9fb0bd'; g.font = `400 20px ${FONT}`;
      g.fillText(unlocked ? '請上傳床 3 病人之問題表述' : '緊急管制程序 · 資料完整性檢查中…', w / 2, h / 2 + 60);
    }
    g.textAlign = 'left'; g.fillStyle = '#4b5c6a'; g.font = `400 16px ${FONT}`; g.fillText('BED 3 · ED-0000-1173', 22, h - 20);
  };
  return (
    <group position={[X1 - 0.42, 0, -0.75]} rotation={[0, -Math.PI / 2, 0]}>
      {/* 桌體 */}
      <RoundedBox args={[1.7, 0.04, 0.72]} radius={0.012} position={[0, 0.76, 0]} castShadow receiveShadow><meshStandardMaterial {...M.laminate} /></RoundedBox>
      <RoundedBox args={[0.46, 0.7, 0.66]} radius={0.01} position={[-0.6, 0.37, 0]} castShadow receiveShadow><meshStandardMaterial {...M.cabinet} /></RoundedBox>
      {[0.58, 0.36, 0.14].map((y) => (
        <group key={y}>
          <mesh position={[-0.6, y, 0.333]}><boxGeometry args={[0.44, 0.005, 0.003]} /><meshStandardMaterial color="#b8c0c6" /></mesh>
          <mesh position={[-0.6, y + 0.07, 0.345]}><boxGeometry args={[0.14, 0.014, 0.02]} /><meshStandardMaterial {...M.steel} /></mesh>
        </group>
      ))}
      <mesh position={[0.8, 0.37, 0]} castShadow><boxGeometry args={[0.04, 0.74, 0.66]} /><meshStandardMaterial {...M.cabinet} /></mesh>
      <mesh position={[0.1, 0.45, -0.32]}><boxGeometry args={[1.4, 0.5, 0.02]} /><meshStandardMaterial {...M.cabinet} /></mesh>
      {/* 吊櫃 */}
      <group position={[0, 2.05, -0.18]}>
        <RoundedBox args={[1.7, 0.7, 0.36]} radius={0.012} castShadow><meshStandardMaterial {...M.cabinet} /></RoundedBox>
        {[-0.425, 0.425].map((x) => (
          <group key={x}>
            <mesh position={[x, 0, 0.182]}><boxGeometry args={[0.82, 0.66, 0.004]} /><meshStandardMaterial color="#f6f8f9" roughness={0.35} /></mesh>
            <mesh position={[x + (x < 0 ? 0.33 : -0.33), -0.22, 0.2]}><boxGeometry args={[0.018, 0.14, 0.02]} /><meshStandardMaterial {...M.steel} /></mesh>
          </group>
        ))}
      </group>
      {/* 電腦工作站 */}
      <Interactable id="terminal" position={[0.1, 0.78, -0.12]} marker={[0, 0.62, 0.05]}>
        <mesh position={[0, 0.005, 0.02]}><boxGeometry args={[0.22, 0.01, 0.16]} /><meshStandardMaterial color="#20262c" roughness={0.5} /></mesh>
        <mesh position={[0, 0.16, -0.02]}><boxGeometry args={[0.04, 0.3, 0.03]} /><meshStandardMaterial color="#20262c" roughness={0.5} /></mesh>
        <RoundedBox args={[0.62, 0.38, 0.03]} radius={0.01} position={[0, 0.36, 0.01]} castShadow><meshStandardMaterial color="#14191e" roughness={0.35} /></RoundedBox>
        <group position={[0, 0.365, 0.027]}>
          <CanvasScreen width={0.585} height={0.335} draw={drawEMR} deps={[unlocked, solved]} />
        </group>
        <RoundedBox args={[0.44, 0.018, 0.14]} radius={0.006} position={[0, 0.01, 0.3]} castShadow><meshStandardMaterial color="#2a3036" roughness={0.6} /></RoundedBox>
        <RoundedBox args={[0.06, 0.02, 0.1]} radius={0.009} position={[0.32, 0.01, 0.3]} castShadow><meshStandardMaterial color="#2a3036" roughness={0.5} /></RoundedBox>
      </Interactable>
      {/* 檢傷單（夾板） */}
      <Interactable id="triage_sheet" position={[-0.55, 0.785, 0.12]} rotation={[0, 0.25, 0]} marker={[0, 0.18, 0]}>
        <RoundedBox args={[0.24, 0.008, 0.33]} radius={0.003} castShadow><meshStandardMaterial color="#6b4f35" roughness={0.6} /></RoundedBox>
        <mesh position={[0, 0.006, 0.01]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.21, 0.29]} />
          <meshStandardMaterial roughness={0.9} map={drawTexture('triage-paper', 256, 352, (g, w, h) => {
            g.fillStyle = '#fbfbf7'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#E45858'; g.fillRect(0, 0, w, 26);
            g.fillStyle = '#fff'; g.font = `700 14px ${FONT}`; g.fillText('急診檢傷紀錄', 12, 18);
            g.fillStyle = '#9aa3a8';
            for (let y = 44; y < h - 10; y += 16) g.fillRect(12, y, 60 + ((y * 7) % 150), 3);
          })} />
        </mesh>
        <mesh position={[0, 0.012, -0.14]}><boxGeometry args={[0.09, 0.012, 0.03]} /><meshStandardMaterial {...M.steel} /></mesh>
      </Interactable>
      {/* 桌下掉落的交班單 */}
      <Interactable id="handoff" position={[0.35, 0.003, 0.5]} rotation={[0, 0.6, 0]} marker={[0, 0.12, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[0.21, 0.2]} />
          <meshStandardMaterial roughness={0.9} map={drawTexture('handoff-paper', 256, 240, (g, w, h) => {
            g.fillStyle = '#f4f1e8'; g.fillRect(0, 0, w, h);
            g.fillStyle = '#4a5560'; g.font = `600 13px ${FONT}`; g.fillText('交班單 HANDOFF', 10, 20);
            g.strokeStyle = '#2b4a8a'; g.lineWidth = 2;
            for (let y = 40; y < h - 20; y += 18) { g.beginPath(); g.moveTo(12, y); for (let x = 12; x < w - 20; x += 8) g.lineTo(x, y + Math.sin(x * 0.4 + y) * 2); g.stroke(); }
            g.fillStyle = '#e8e3d4'; g.beginPath(); g.moveTo(w, h * 0.55); g.lineTo(w * 0.7, h); g.lineTo(w, h); g.fill();
          })} />
        </mesh>
      </Interactable>
    </group>
  );
}

function Whiteboard() {
  const tex = useMemo(() => drawTexture('whiteboard', 1024, 640, (g, w, h) => {
    g.fillStyle = '#f7f9fa'; g.fillRect(0, 0, w, h);
    g.fillStyle = 'rgba(0,0,0,0.04)'; for (let i = 0; i < 12; i++) g.fillRect(Math.random() * w, Math.random() * h, 200, 30);
    g.font = `600 40px ${HAND}`; g.fillStyle = '#1f4fa8'; g.fillText('夜班 Night Shift', 40, 70);
    g.font = `500 34px ${HAND}`; g.fillStyle = '#263238';
    g.fillText('床1  腹痛 → 會診外科', 40, 160);
    g.fillText('床2  發燒 → 等血液培養', 40, 230);
    g.fillStyle = '#c62828'; g.fillText('床3  胸痛 02:10 — 12-lead ???', 40, 300);
    g.fillText('       系統異常！檔案被鎖', 40, 350);
    g.fillStyle = 'rgba(38,50,56,0.25)'; g.fillText('先確認用', 40, 450);
    g.fillStyle = 'rgba(200,210,215,0.6)'; g.fillRect(160, 420, 520, 50);
    g.strokeStyle = '#1f4fa8'; g.lineWidth = 3; g.strokeRect(720, 120, 240, 160);
    g.fillStyle = '#1f4fa8'; g.font = `500 26px ${HAND}`; g.fillText('值班 PGY →', 740, 180); g.fillText('ext. 2213', 740, 230);
  }), []);
  return (
    <Interactable id="whiteboard" position={[X0 + 0.03, 1.55, 0.6]} rotation={[0, Math.PI / 2, 0]} marker={[0, 0.6, 0.05]}>
      <RoundedBox args={[1.66, 1.06, 0.03]} radius={0.01} castShadow><meshStandardMaterial {...M.steel} roughness={0.35} /></RoundedBox>
      <mesh position={[0, 0, 0.016]}><planeGeometry args={[1.6, 1.0]} /><meshStandardMaterial map={tex} roughness={0.15} metalness={0} envMapIntensity={0.6} /></mesh>
      <mesh position={[0, -0.55, 0.04]}><boxGeometry args={[1.2, 0.025, 0.07]} /><meshStandardMaterial {...M.steel} /></mesh>
    </Interactable>
  );
}

function DoorArea() {
  const solved = useGame((s) => s.level1.flags.includes('puzzle_solved'));
  const doorOpen = useUI((s) => s.doorOpen);
  const leaf = useRef<THREE.Group>(null);
  const led = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }, dt) => {
    if (leaf.current) leaf.current.rotation.y = THREE.MathUtils.damp(leaf.current.rotation.y, doorOpen ? -1.3 : 0, 2.5, dt);
    if (led.current) led.current.emissiveIntensity = solved ? 3 : 1.5 + Math.sin(clock.elapsedTime * 4) * 1.2;
  });
  const sign = useMemo(() => drawTexture('room-sign', 512, 160, (g, w, h) => {
    g.fillStyle = '#101C2B'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#13B8B0'; g.fillRect(0, 0, 14, h);
    g.fillStyle = '#F4F7FA'; g.font = `700 54px ${FONT}`; g.fillText('診察室 3', 40, 78);
    g.fillStyle = '#9fb0bd'; g.font = `500 30px ${FONT}`; g.fillText('EXAM ROOM 3', 40, 128);
  }), []);
  return (
    <group position={[DOOR_X, 0, Z1]}>
      {/* 門框 */}
      {[-1, 1].map((s) => <mesh key={s} position={[s * (DOOR_W / 2 + 0.03), DOOR_H / 2, -0.02]} castShadow><boxGeometry args={[0.06, DOOR_H, 0.14]} /><meshStandardMaterial {...M.steel} roughness={0.4} /></mesh>)}
      <mesh position={[0, DOOR_H + 0.03, -0.02]}><boxGeometry args={[DOOR_W + 0.12, 0.06, 0.14]} /><meshStandardMaterial {...M.steel} roughness={0.4} /></mesh>
      {/* 門片（鉸鏈於左側） */}
      <group ref={leaf} position={[DOOR_W / 2 - 0.02, 0, 0]}>
        <group position={[-(DOOR_W - 0.04) / 2, DOOR_H / 2, 0]}>
          <RoundedBox args={[DOOR_W - 0.04, DOOR_H - 0.02, 0.045]} radius={0.01} castShadow receiveShadow><meshStandardMaterial color="#b49a78" roughness={0.55} /></RoundedBox>
          <mesh position={[0, 0.45, -0.024]}><planeGeometry args={[0.28, 0.6]} /><meshPhysicalMaterial color="#9cc7d6" transmission={0.4} roughness={0.15} transparent opacity={0.55} /></mesh>
          <mesh position={[0, -DOOR_H / 2 + 0.16, -0.024]}><planeGeometry args={[DOOR_W - 0.06, 0.28]} /><meshStandardMaterial {...M.steel} side={THREE.DoubleSide} /></mesh>
          <mesh position={[-0.42, -0.05, -0.05]}><boxGeometry args={[0.16, 0.025, 0.04]} /><meshStandardMaterial {...M.steel} /></mesh>
        </group>
      </group>
      {/* 門牌 */}
      <mesh position={[-DOOR_W / 2 - 0.45, 1.75, -0.012]} rotation={[0, Math.PI, 0]}><planeGeometry args={[0.5, 0.16]} /><meshStandardMaterial map={sign} roughness={0.4} /></mesh>
      {/* 門禁面板 */}
      <Interactable id="door" position={[-DOOR_W / 2 - 0.2, 1.3, -0.02]} rotation={[0, Math.PI, 0]} marker={[0, 0.18, 0.03]}>
        <RoundedBox args={[0.12, 0.18, 0.025]} radius={0.008} castShadow><meshStandardMaterial color="#1b232b" roughness={0.4} /></RoundedBox>
        <mesh position={[0, 0.05, 0.014]}><circleGeometry args={[0.012, 24]} /><meshStandardMaterial ref={led} color={solved ? '#4ef08a' : '#E45858'} emissive={solved ? '#4ef08a' : '#E45858'} emissiveIntensity={2} toneMapped={false} /></mesh>
        <mesh position={[0, -0.025, 0.014]}><planeGeometry args={[0.08, 0.08]} /><meshStandardMaterial color="#2e3a45" roughness={0.3} metalness={0.3} /></mesh>
      </Interactable>
      {/* 乾洗手液 */}
      <Interactable id="sanitizer" position={[-DOOR_W / 2 - 0.85, 1.15, -0.04]} rotation={[0, Math.PI, 0]} marker={[0, 0.2, 0.04]}>
        <RoundedBox args={[0.12, 0.24, 0.09]} radius={0.02} castShadow><meshStandardMaterial color="#f4f6f7" roughness={0.3} /></RoundedBox>
        <mesh position={[0, 0.03, 0.046]}><planeGeometry args={[0.09, 0.09]} /><meshStandardMaterial roughness={0.4} map={drawTexture('sanitizer-label', 128, 128, (g, w, h) => {
          g.fillStyle = '#13B8B0'; g.fillRect(0, 0, w, h); g.fillStyle = '#fff'; g.font = `700 22px ${FONT}`; g.textAlign = 'center';
          g.fillText('乾洗手', w / 2, 56); g.font = `500 16px ${FONT}`; g.fillText('Hand Rub', w / 2, 86);
        })} /></mesh>
        <mesh position={[0, -0.1, 0.035]}><boxGeometry args={[0.07, 0.03, 0.05]} /><meshStandardMaterial color="#cfd6db" roughness={0.3} /></mesh>
      </Interactable>
      {/* 壁鐘 */}
      <WallClock position={[-DOOR_W / 2 - 1.5, 2.45, -0.02]} />
    </group>
  );
}

function WallClock({ position }: { position: [number, number, number] }) {
  const elapsed = useGame((s) => Math.floor(s.level1.elapsedMs / 60000));
  const minutes = 14 + elapsed; // 02:14 起算
  const tex = useMemo(() => drawTexture(`clock-${minutes}`, 256, 256, (g, w) => {
    const c = w / 2;
    g.fillStyle = '#fafbfc'; g.beginPath(); g.arc(c, c, 120, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#2c3640'; g.lineWidth = 8; g.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; g.lineWidth = 5; g.beginPath(); g.moveTo(c + Math.sin(a) * 96, c - Math.cos(a) * 96); g.lineTo(c + Math.sin(a) * 110, c - Math.cos(a) * 110); g.stroke(); }
    const hA = ((2 + minutes / 60) / 12) * Math.PI * 2, mA = (minutes / 60) * Math.PI * 2;
    g.lineWidth = 9; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(hA) * 58, c - Math.cos(hA) * 58); g.stroke();
    g.lineWidth = 6; g.beginPath(); g.moveTo(c, c); g.lineTo(c + Math.sin(mA) * 88, c - Math.cos(mA) * 88); g.stroke();
    g.fillStyle = '#E45858'; g.beginPath(); g.arc(c, c, 8, 0, Math.PI * 2); g.fill();
  }), [minutes]);
  return (
    <mesh position={position} rotation={[0, Math.PI, 0]}>
      <circleGeometry args={[0.16, 48]} />
      <meshStandardMaterial map={tex} roughness={0.3} />
    </mesh>
  );
}

function BedsideArea() {
  const bag = useMemo(() => drawTexture('medbag', 256, 320, (g, w, h) => {
    g.fillStyle = '#f7f5ef'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#2e8b57'; g.fillRect(0, 40, w, 46);
    g.fillStyle = '#fff'; g.font = `700 26px ${FONT}`; g.textAlign = 'center'; g.fillText('藥　袋', w / 2, 74);
    g.fillStyle = '#4a5560'; g.font = `500 16px ${FONT}`; g.textAlign = 'left';
    ['姓名：林○明', '用法：詳見藥袋內說明', '○○社區藥局'].forEach((t, i) => g.fillText(t, 20, 130 + i * 30));
  }), []);
  return (
    <group>
      {/* 床邊櫃 */}
      <group position={[0.35, 0, Z0 + 0.55]}>
        <RoundedBox args={[0.46, 0.78, 0.46]} radius={0.015} position={[0, 0.39, 0]} castShadow receiveShadow><meshStandardMaterial color="#e8ecef" roughness={0.4} /></RoundedBox>
        <mesh position={[0, 0.62, 0.231]}><boxGeometry args={[0.42, 0.004, 0.002]} /><meshStandardMaterial color="#aab3b9" /></mesh>
        <mesh position={[0, 0.68, 0.24]}><boxGeometry args={[0.16, 0.015, 0.02]} /><meshStandardMaterial {...M.steel} /></mesh>
        {/* 藥袋 */}
        <Interactable id="med_bag" position={[0.02, 0.78, 0.04]} rotation={[0, -0.35, 0]} marker={[0, 0.3, 0]}>
          <mesh position={[0, 0.12, 0]} castShadow>
            <boxGeometry args={[0.17, 0.24, 0.07]} />
            <meshStandardMaterial attach="material-0" color="#efece4" roughness={0.9} />
            <meshStandardMaterial attach="material-1" color="#efece4" roughness={0.9} />
            <meshStandardMaterial attach="material-2" color="#e6e2d8" roughness={0.9} />
            <meshStandardMaterial attach="material-3" color="#efece4" roughness={0.9} />
            <meshStandardMaterial attach="material-4" map={bag} roughness={0.85} />
            <meshStandardMaterial attach="material-5" color="#efece4" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.25, 0.012]} rotation={[-0.5, 0, 0]} castShadow><boxGeometry args={[0.17, 0.05, 0.004]} /><meshStandardMaterial color="#e6e2d8" roughness={0.9} /></mesh>
        </Interactable>
      </group>
      {/* 心電圖機（待補模型） */}
      <Interactable id="ecg_machine" position={[1.05, 0, Z0 + 0.5]} marker={[0, 1.3, 0]}>
        <group rotation={[0, -0.5, 0]}>
          <AssetSlot assetId="ecg_cart" size={[0.5, 1.05, 0.5]}><EcgCart /></AssetSlot>
        </group>
      </Interactable>
    </group>
  );
}

const BED_POS: [number, number, number] = [-1.15, 0, Z0 + 1.15];

function BedAndPatient() {
  return (
    <group position={BED_POS}>
      <AssetSlot assetId="hospital_bed" size={[0.98, 0.62, 2.1]}><HospitalBed /></AssetSlot>
      <Interactable id="patient" marker={[0, 1.35, -0.72]}>
        <AssetSlot assetId="patient_male_60s" size={[0.55, 0.32, 1.75]}><Patient /></AssetSlot>
      </Interactable>
    </group>
  );
}

/** 監視器 → 病人的導程線與血氧線（世界座標） */
function MonitorCables() {
  const geos = useMemo(() => {
    const w = (v: THREE.Vector3): [number, number, number] => [v.x + BED_POS[0], v.y + BED_POS[1], v.z + BED_POS[2]];
    const chest = w(PATIENT_ANCHORS.chestLeads());
    const finger = w(PATIENT_ANCHORS.spo2Finger());
    return {
      ecg: cable([-2.22, 2.1, Z0 + 0.13], chest, 0, 0.0045, [[-2.26, 1.75, Z0 + 0.08], [-2.0, 1.32, Z0 + 0.3], [-1.45, 1.22, Z0 + 0.42]]),
      spo2: cable([-2.22, 2.04, Z0 + 0.13], finger, 0, 0.0035, [[-2.3, 1.6, Z0 + 0.1], [-1.72, 1.05, Z0 + 0.6], [-1.0, 0.98, -1.6], [finger[0] + 0.05, finger[1] + 0.02, finger[2] - 0.08]]),
    };
  }, []);
  return (
    <group>
      <mesh geometry={geos.ecg} castShadow><meshStandardMaterial color="#5e666d" roughness={0.5} /></mesh>
      <mesh geometry={geos.spo2} castShadow><meshStandardMaterial color="#2f6fb0" roughness={0.5} /></mesh>
    </group>
  );
}

export function ExamRoomScene({ quality }: { quality: Quality }) {
  const vpId = useGame((s) => s.level1.viewpoint);
  const vp = VIEWPOINTS[vpId] ?? VIEWPOINTS.overview;
  return (
    <>
      <color attach="background" args={['#0b121a']} />
      <fog attach="fog" args={['#0b121a', 9, 18]} />
      <CameraRig pos={vp.pos} target={vp.target} />
      <Lights quality={quality} />
      <Room />
      <Headwall />
      <Curtain />
      <WallMonitor />
      <Workstation />
      <Whiteboard />
      <DoorArea />
      <BedsideArea />
      <BedAndPatient />
      <MonitorCables />
      <ContactShadows position={[0, 0.002, 0]} scale={[W, D]} resolution={quality === 'high' ? 1024 : 512} blur={2.4} opacity={0.5} far={2.2} frames={1} />
    </>
  );
}
