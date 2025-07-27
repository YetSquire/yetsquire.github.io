import { RigidBody, CuboidCollider } from '@react-three/rapier';
import * as THREE from 'three';

export function CylindricalBoundary({ radius = 5, height = 10, segments = 32, thickness = 0.2 }) {
  const colliders = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(angle);
    const z = radius * Math.sin(angle);
    const rotation = new THREE.Euler(0, angle, 0).toArray();

    colliders.push(
      <CuboidCollider
        key={i}
        args={[thickness / 2, height / 2, 0.1]} // thin wall slice
        position={[x, height / 2, z]}
        rotation={rotation}
      />
    );
  }

  return <RigidBody type="fixed" colliders={false}>{colliders}</RigidBody>;
}
