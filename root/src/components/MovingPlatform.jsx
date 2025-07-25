import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {RigidBody} from '@react-three/rapier';
import * as THREE from 'three';

export function MovingPlatform({ }) {

  return (
    <RigidBody
      type="fixed"
      colliders="cuboid"
      restitution={0}
      friction={1}
    >
      <mesh receiveShadow castShadow>
        <boxGeometry args={[60, 1, 10]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </RigidBody>
  );
}
