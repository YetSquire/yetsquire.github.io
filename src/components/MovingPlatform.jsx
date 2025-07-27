import React from 'react';
import { RigidBody } from '@react-three/rapier';

const DEFAULT_THICKNESS = 1; // height of the disc
const DEFAULT_SEGMENTS  = 64; // smoothness

export function MovingPlatform({
  radius,
  thickness = DEFAULT_THICKNESS,
  segments  = DEFAULT_SEGMENTS,
  y         = 0,              // vertical offset
}) {
  return (
    <RigidBody
      type="fixed"
      colliders="hull"
      restitution={0}
      friction={1}
      position={[0, y, 0]}
    >
      <mesh receiveShadow castShadow>
        {/* 
          Cylinder with equal top/bottom radius => flat disc 
          args = [radiusTop, radiusBottom, height, radialSegments]
        */}
        <cylinderGeometry args={[radius, radius, thickness, segments]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </RigidBody>
  );
}
