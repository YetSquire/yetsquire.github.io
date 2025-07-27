import React, { useMemo } from 'react';
import * as THREE from 'three';

export function LevelFloor({
  outerRadius = 10,
  innerRadius = 8,
  thickness   = 1,
  segments    = 64,
  position    = [0, 0, 0],
  color       = 'gray',
}) {
  // build the shape only when radii change
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    // outer circle
    s.moveTo(outerRadius, 0);
    s.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    // hole
    const hole = new THREE.Path();
    hole.moveTo(innerRadius, 0);
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    s.holes.push(hole);
    return s;
  }, [outerRadius, innerRadius]);

  // extrude settings
  const extrudeSettings = useMemo(() => ({
    depth:       thickness,
    bevelEnabled: false,
    steps:        1,
    curveSegments: segments,
  }), [thickness, segments]);

  return (
    <mesh receiveShadow castShadow position={position} rotation={[-Math.PI/2, 0, 0]}>
      <extrudeGeometry args={[shape, extrudeSettings]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}
