import { Suspense, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { ASSETS, assetUrl } from './assetManifest';
import { useMarker } from './markers';

interface Props {
  assetId: string;
  size: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
  showLabel?: boolean;
  /** 尚無 GLB 時使用的程式建模版本 */
  children?: ReactNode;
}

function Gltf({ url, scale = 1 }: { url: string; scale?: number }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => { if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return c;
  }, [scene]);
  return <primitive object={cloned} scale={scale} />;
}

/** 待補模型標示：掃描框（透明呈現缺漏素材，不偽裝為正式成品） */
function PendingVolume({ id, size, label, showLabel }: { id: string; size: [number, number, number]; label: string; showLabel: boolean }) {
  const [w, h, d] = size;
  const scan = useRef<THREE.Mesh>(null);
  const root = useRef<THREE.Group>(null);
  useMarker(root, { id: `pending-${id}`, kind: 'pending', label: showLabel ? label : '' }, [0, h + 0.1, 0]);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), [w, h, d]);
  const corners = useMemo(() => {
    const pts: number[] = [];
    const L = Math.min(w, h, d) * 0.22;
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
      const x = (sx * w) / 2, y = (sy * h) / 2, z = (sz * d) / 2;
      pts.push(x, y, z, x - sx * L, y, z, x, y, z, x, y - sy * L, z, x, y, z, x, y, z - sz * L);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [w, h, d]);
  useFrame(({ clock }) => {
    if (scan.current) scan.current.position.y = (Math.sin(clock.elapsedTime * 0.8) * 0.5) * h * 0.92;
  });
  return (
    <group ref={root}>
    <group position={[0, h / 2, 0]}>
      <mesh>
        <boxGeometry args={[w, h, d]} />
        <meshBasicMaterial color="#13B8B0" transparent opacity={0.035} depthWrite={false} />
      </mesh>
      <lineSegments geometry={edges}>
        <lineBasicMaterial color="#13B8B0" transparent opacity={0.22} />
      </lineSegments>
      <lineSegments geometry={corners}>
        <lineBasicMaterial color="#5fe0d8" transparent opacity={0.9} />
      </lineSegments>
      <mesh ref={scan} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w * 0.98, d * 0.98]} />
        <meshBasicMaterial color="#13B8B0" transparent opacity={0.07} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
    </group>
  );
}

export function AssetSlot({ assetId, size, position, rotation, showLabel = true, children }: Props) {
  const a = ASSETS[assetId];
  return (
    <group position={position} rotation={rotation}>
      {a?.status === 'available' ? (
        <Suspense fallback={<PendingVolume id={assetId} size={size} label={`${a.label}（載入中）`} showLabel={false} />}>
          <Gltf url={assetUrl(a)} scale={a.scale} />
        </Suspense>
      ) : children ? children : (
        <PendingVolume id={assetId} size={size} label={a?.label ?? assetId} showLabel={showLabel} />
      )}
    </group>
  );
}
