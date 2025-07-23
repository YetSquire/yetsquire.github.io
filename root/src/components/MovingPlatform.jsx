// MovingPlatform.jsx
import React, { useRef } from 'react';
import { RigidBody, useBeforePhysicsStep } from '@react-three/rapier';

export function MovingPlatform({ y }) {
  const ref = useRef();
  const yRef = useRef(y);
  yRef.current = y;

  // This runs just before world.step(), so the platform moves in-sync
  useBeforePhysicsStep(() => {
    const body = ref.current;
    if (!body) return;
    body.wakeUp();  // ensure it’s active
    body.setNextKinematicTranslation({ x: 0, y: yRef.current, z: 0 });
  });

  return (
    <RigidBody
      ref={ref}
      type="kinematicPositionBased"
      gravityScale={0}
      colliders="cuboid"
      lockRotations
    >
      <mesh receiveShadow>
        <boxGeometry args={[10, 0.2, 10]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </RigidBody>
  );
}
