import { useEffect, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { create } from 'zustand';

/**
 * 3D → 2D 標記投影
 * 以單一 DOM 覆蓋層顯示互動熱點與「待補模型」標籤；每幀將世界座標投影至螢幕，直接更新 DOM 位置（不觸發 React 重繪）。
 */
export interface MarkerInfo { id: string; kind: 'hotspot' | 'pending'; label: string; sub?: string }
interface Entry extends MarkerInfo { obj: THREE.Object3D; offset: THREE.Vector3 }

const entries = new Map<string, Entry>();
export const markerEls = new Map<string, HTMLElement>();
export const useMarkers = create<{ list: MarkerInfo[] }>(() => ({ list: [] }));
const sync = () => useMarkers.setState({ list: [...entries.values()].map(({ id, kind, label, sub }) => ({ id, kind, label, sub })) });

export function useMarker(ref: RefObject<THREE.Object3D | null>, info: MarkerInfo, offset: [number, number, number]) {
  const [x, y, z] = offset;
  useEffect(() => {
    if (!ref.current) return;
    entries.set(info.id, { ...info, obj: ref.current, offset: new THREE.Vector3(x, y, z) });
    sync();
    return () => { entries.delete(info.id); sync(); };
  }, [ref, info.id, info.kind, info.label, info.sub, x, y, z]);
}

const v = new THREE.Vector3();
export function MarkerProjector() {
  useFrame(({ camera, size }) => {
    for (const e of entries.values()) {
      const el = markerEls.get(e.id);
      if (!el) continue;
      v.copy(e.offset);
      e.obj.localToWorld(v);
      v.project(camera);
      const hidden = v.z > 1 || Math.abs(v.x) > 1.2 || Math.abs(v.y) > 1.2;
      el.style.visibility = hidden ? 'hidden' : 'visible';
      el.style.transform = `translate3d(${((v.x + 1) / 2) * size.width}px, ${((1 - v.y) / 2) * size.height}px, 0)`;
    }
  });
  return null;
}
