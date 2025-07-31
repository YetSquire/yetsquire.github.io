// LevelShell.jsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { worldYFor } from '../utils/utils';

/**
 * A thin wrapper that moves its children in `useFrame`
 * without triggering React renders.
 */
export default function LevelShell({ logicalIdx, floorYRef, children }) {
  const g = useRef();
  useFrame(() => {
    if (g.current) g.current.position.y = worldYFor(logicalIdx, floorYRef.current);
  });
  return <group ref={g}>{children}</group>;
}
