import { useState, type ReactNode } from 'react';
import { Html } from '@react-three/drei';
import type { ThreeEvent } from '@react-three/fiber';
import { useUI } from '../../store/uiStore';
import { useGame } from '../../store/gameStore';
import { OBJECT_MAP } from '../../data/level1/objects';
import { handleInteraction } from '../interaction/interactionEngine';
import { sfx } from '../../audio/audioEngine';

interface Props {
  id: string;
  children: ReactNode;
  marker?: [number, number, number];
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/** 可互動物件包裝：滑鼠提示、標記、點擊事件 */
export function Interactable({ id, children, marker = [0, 0.3, 0], position, rotation }: Props) {
  const [hover, setHover] = useState(false);
  const reveal = useUI((s) => s.reveal);
  const difficulty = useGame((s) => s.profile?.difficulty ?? 'basic');
  const inspected = useGame((s) => s.level1.inspected.includes(id));
  const setHovered = useUI((s) => s.setHovered);
  const label = OBJECT_MAP[id]?.label ?? id;

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!hover) sfx('hover');
    setHover(true); setHovered(id); document.body.style.cursor = 'pointer';
  };
  const out = () => { setHover(false); setHovered(null); document.body.style.cursor = 'auto'; };
  const click = (e: ThreeEvent<MouseEvent>) => { e.stopPropagation(); handleInteraction(id); };

  const showRing = hover || reveal || difficulty === 'basic' || (difficulty === 'standard' && !inspected);
  const ringStyle = difficulty === 'standard' && !hover && !reveal ? 'faint' : '';

  return (
    <group position={position} rotation={rotation}>
      <group onPointerOver={over} onPointerOut={out} onClick={click}>{children}</group>
      {showRing && (
        <Html position={marker} center zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`hotspot ${hover ? 'is-hover' : ''} ${inspected ? 'is-done' : ''} ${ringStyle}`}>
            <span className="hotspot-ring" />
            {(hover || reveal) && <span className="hotspot-label">{label}{inspected ? ' ✓' : ''}</span>}
          </div>
        </Html>
      )}
    </group>
  );
}
