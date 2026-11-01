import { useRef, useState, type ReactNode } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import type * as THREE from 'three';
import { useUI } from '../../store/uiStore';
import { OBJECT_MAP } from '../../data/level1/objects';
import { handleInteraction } from '../interaction/interactionEngine';
import { sfx } from '../../audio/audioEngine';
import { useMarker } from './markers';

interface Props {
  id: string;
  children: ReactNode;
  marker?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/** 可互動物件包裝：滑鼠提示、標記（由 MarkerLayer 繪製）、點擊事件 */
export function Interactable({ id, children, marker = [0, 0.3, 0], position, rotation }: Props) {
  const [hover, setHover] = useState(false);
  const ref = useRef<THREE.Group>(null);
  const setHovered = useUI((s) => s.setHovered);
  useMarker(ref, { id, kind: 'hotspot', label: OBJECT_MAP[id]?.label ?? id }, marker);

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!hover) sfx('hover');
    setHover(true); setHovered(id); document.body.style.cursor = 'pointer';
  };
  const out = () => { setHover(false); setHovered(null); document.body.style.cursor = 'auto'; };
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); handleInteraction(id); };

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <group onPointerOver={over} onPointerOut={out} onClick={click}>{children}</group>
    </group>
  );
}
