import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Canvas, invalidate } from '@react-three/fiber';
import { Preload, Environment, KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { preloadModels } from '../preload/preloadModels.js';
import SmoothFloorMovement from './SmoothFloorMovement.jsx';
import Recycler from './Recycler.jsx';
import LevelShell from './LevelShell.jsx';
import LevelContent from './LevelContent.jsx';
import { Player } from './Player';
import { MovingPlatform } from './MovingPlatform';
import { ExteriorModel } from './ExteriorModel';
import { CylindricalBoundary } from './Boundary';
import { logicalCenter } from '../utils/helpers.js';
import { VISIBLE_LEVELS, WINDOW, SPEED, DEFAULT_RADIUS } from '../utils/constants.js';

export default function Viewer() {
  const exterior = preloadModels();
  
  const floorYTarget = useRef(0);
  const floorY = useRef(0);
  const pool = useRef(null);
  const [flush, setFlush] = useState(0);
  const centerRef = useRef(logicalCenter(0));

  if (!pool.current) {
    const c = logicalCenter(0);
    pool.current = Array.from({ length: VISIBLE_LEVELS }, (_, i) => ({
      id: i,
      logicalIdx: c - WINDOW + i,
    }));
  }

  const forceRerender = useCallback(() => setFlush(f => f + 1), []);

  useEffect(() => invalidate(), []);

  return (
    <KeyboardControls
      map={[
        { name: 'forward', keys: ['w', 'ArrowUp'] },
        { name: 'backward', keys: ['s', 'ArrowDown'] },
        { name: 'left', keys: ['a', 'ArrowLeft'] },
        { name: 'right', keys: ['d', 'ArrowRight'] },
        { name: 'jump', keys: [' '] },
        { name: 'raise', keys: ['q'] },
        { name: 'lower', keys: ['e'] },
      ]}
    >
      <Canvas
        frameloop="demand"
        dpr={[1, 1.5]}
        gl={{ powerPreference: 'high-performance', antialias: false }}
        camera={{ position: [0, 2, 12], rotation: [0, Math.PI / 2, 0], fov: 60 }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#050a15');
          scene.fog = new THREE.FogExp2('#050a15', 0.1);
        }}
      >
        <Preload all />
        <SmoothFloorMovement targetRef={floorYTarget} valueRef={floorY} />
        <Recycler poolRef={pool} floorYRef={floorY} centerRef={centerRef} forceRerender={forceRerender} />
        <ExteriorModel path={exterior} scale={DEFAULT_RADIUS * 1.5} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.6} />
        <Physics gravity={[0, -50, 0]}>
          <MovingPlatform radius={DEFAULT_RADIUS * 0.75} />
          <CylindricalBoundary radius={DEFAULT_RADIUS * 0.75} height={10} />
          <Player
            onRaise={() => {
              floorYTarget.current += SPEED;
              invalidate();
            }}
            onLower={() => {
              floorYTarget.current -= SPEED;
              invalidate();
            }}
          />
        </Physics>
        {pool.current.map(item => (
          
          <LevelShell key={item.id} logicalIdx={item.logicalIdx} floorYRef={floorY}>
            <LevelContent logicalIdx={item.logicalIdx} center={centerRef.current} />
          </LevelShell>
        ))}
      </Canvas>
    </KeyboardControls>
  );
}
