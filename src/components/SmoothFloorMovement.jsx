import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { SMOOTH_SPEED } from '../utils/constants.js';
import { invalidate } from '@react-three/fiber';

export default function SmoothFloorMovement({ targetRef, valueRef }) {
  useFrame((_, dt) => {
    if (Math.abs(valueRef.current - targetRef.current) > 0.0001) invalidate();
    valueRef.current = THREE.MathUtils.lerp(
      valueRef.current,
      targetRef.current,
      1 - Math.exp(-dt * SMOOTH_SPEED),
    );
  });
  return null;
}
