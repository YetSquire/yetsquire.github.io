import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, KeyboardControls } from '@react-three/drei';
import { ExhibitRoom } from './ExhibitRoom';
import { Player } from './Player';
import { MovingPlatform } from './MovingPlatform';
import { exhibits } from '../data/exhibits';
import { Physics } from '@react-three/rapier';

function renderExhibitRooms(scrollY = 0) {
  const rooms   = [];
  const COLS    = 5;     // x-direction columns
  const X_START = -5;    // left-most room
  const X_STEP  = 5;
  const Y_STEP  = 7;     // vertical distance between rows
  const Z_POS   = 7;

  exhibits.forEach((exhibit, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);

    rooms.push(
      <ExhibitRoom
        key={i}
        position={[
          X_START + col * X_STEP,
          row * Y_STEP + scrollY,     // ← shifted by scrollY
          Z_POS
        ]}
        rotation={[0, Math.PI, 0]}
        containerPath={exhibit.containerPath}
        modelPath={exhibit.modelPath}
        title={exhibit.title}
        description={exhibit.description}
        videoUrl={exhibit.videoUrl}
      />
    );
  });


  // handle buffer above


  // handle buffer below

  return rooms;
}


export default function Viewer() {
  const [floorY, setFloorY] = useState(-0.1);

  return (
    <KeyboardControls map={[
      { name: 'forward', keys: ['w', 'ArrowUp'] },
      { name: 'backward', keys: ['s', 'ArrowDown'] },
      { name: 'left', keys: ['a', 'ArrowLeft'] },
      { name: 'right', keys: ['d', 'ArrowRight'] },
      { name: 'jump', keys: [' '] },
      { name: 'raise', keys: ['q'] },
      { name: 'lower', keys: ['e'] },
    ]}>
      <Canvas camera={{ position: [0, 1.5, 10], fov: 60 }} style={{ position: 'absolute', inset: 0 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.2} />
        <Environment preset="sunset" />

        <Physics gravity={[0,-50,0]}>
          <MovingPlatform/>

          <Player
            onRaise={() => setFloorY((y) => y + 0.1)}
            onLower={() => setFloorY((y) => y - 0.1)}
          />
        </Physics>
    
        {renderExhibitRooms(floorY)}
      </Canvas>
    </KeyboardControls>
  );
}
