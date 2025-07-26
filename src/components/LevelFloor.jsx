import React from 'react';

export function LevelFloor({ position, width = 60, depth = 2, color = '#ffffffff' }) {
  return (
    <mesh
      position={position}      /* just under exhibits */
      rotation={[-Math.PI / 2, 0, 0]}   /* flat */
      receiveShadow
    >
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
