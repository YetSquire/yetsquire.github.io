import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function MovingPlatform({ floorY, platformX = 0, platformZ = 0, platformRef }) {
  useFrame((_, delta) => {
    if (!platformRef.current) return;
    const currentY = platformRef.current.position.y;
    const lerpedY = THREE.MathUtils.lerp(currentY, floorY, delta * 5);
    platformRef.current.position.set(platformX, lerpedY, platformZ);
  });

  return (
    <mesh ref={platformRef} receiveShadow castShadow>
      <boxGeometry args={[100, 1, 10]} />
      <meshStandardMaterial color="gray" />
    </mesh>
  );
}
