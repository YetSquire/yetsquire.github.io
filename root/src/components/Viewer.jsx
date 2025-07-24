import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, KeyboardControls } from '@react-three/drei';
import { ExhibitRoom } from './ExhibitRoom';
import { Player } from './Player';
import { MovingPlatform } from './MovingPlatform';
import { exhibits } from '../data/exhibits';

function renderExhibitRooms() {
  const rooms = [];
  const xDist = 10;
  const zDist = 15;
  const yAdjust = 7;
  const xNum = 10;
  const buffer = 1;

  for (let i = 0; i < buffer; i++) {
    const exhibit = exhibits[i % exhibits.length]; // wrap around or repeat

    const xIndex = i % xNum;
    const zIndex = Math.floor(i / xNum);

    const position = [
      xIndex * xDist,
      zIndex * zDist,
      yAdjust,
    ];
    rooms.push(
      <ExhibitRoom
        key={i}
        position={position}
        rotation={[0, Math.PI, 0]}
        containerPath={exhibit?.containerPath}
        modelPath={exhibit?.modelPath}
        title={exhibit?.title}
        description={exhibit?.description}
        videoUrl={exhibit?.videoUrl}
      />
    );
  }

  return rooms;
}

export default function Viewer() {
  const [floorY, setFloorY] = useState(-0.1);
  const platformRef = useRef();

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

        <MovingPlatform floorY={floorY} platformRef={platformRef} />

        <Player
          onRaise={() => setFloorY((y) => y + 0.1)}
          onLower={() => setFloorY((y) => y - 0.1)}
          platformX={0}
          platformZ={0}
          platformWidth={100}
          platformDepth={10}
          floorY={floorY}
          platformRef={platformRef}
        />
        {renderExhibitRooms()}
      </Canvas>
    </KeyboardControls>
  );
}
