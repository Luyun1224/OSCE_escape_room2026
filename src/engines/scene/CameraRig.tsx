import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

interface Props {
  pos: [number, number, number];
  target: [number, number, number];
  parallax?: number;
  speed?: number;
}

/** 平順的固定視角切換＋輕微滑鼠視差 */
export function CameraRig({ pos, target, parallax = 0.12, speed = 2.4 }: Props) {
  const { camera, pointer } = useThree();
  const look = useRef(new THREE.Vector3(...target));
  const tp = new THREE.Vector3();
  const tt = new THREE.Vector3();
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-speed * Math.min(dt, 0.05));
    tp.set(pos[0] + pointer.x * parallax, pos[1] + pointer.y * parallax * 0.4, pos[2]);
    tt.set(target[0] + pointer.x * parallax * 2.2, target[1] + pointer.y * parallax * 1.4, target[2]);
    camera.position.lerp(tp, k);
    look.current.lerp(tt, k);
    camera.lookAt(look.current);
  });
  return null;
}
