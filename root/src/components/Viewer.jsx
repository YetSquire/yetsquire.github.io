import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, KeyboardControls, useGLTF, Points, PointMaterial  } from '@react-three/drei';
import { ExhibitRoom } from './ExhibitRoom';
import { Player } from './Player';
import { MovingPlatform } from './MovingPlatform';
import { exhibitSections } from '../data/exhibits';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';

exhibitSections.forEach(section => {
  if (section.containerPath) {
    useGLTF.preload(section.containerPath);
  }
  section.exhibits.forEach(exhibit => {
    if (exhibit.modelPath) {
      useGLTF.preload(exhibit.modelPath);
    }
  });
});

/* constants */
const X_STEP = 5;
const Y_STEP = 7;
const Z_POS  = 7;

/* helper for side columns: [-3,-2,-1,1,2,3] */
const SIDE_COLS = [-3, -2, -1, 1, 2, 3];

function renderExhibitRooms(scrollY = 0) {
  const rooms = [];

  exhibitSections.forEach((section, sIndex) => {
    const { exhibits, fillBlanks, containerPath, name } = section;
    const worldY = sIndex * Y_STEP + scrollY;          // vertical level

    if (sIndex === 1) {  // About level
      const aboutExhibit = exhibits[0];
      rooms.push(
        <ExhibitRoom
          key="about-single"
          position={[0, worldY, Z_POS]}
          rotation={[0, Math.PI, 0]}
          containerPath={containerPath}
          modelPath={aboutExhibit?.modelPath}
          title={`Level ${sIndex}\n${aboutExhibit?.title}`}
          description={aboutExhibit?.description}
          videoUrl={aboutExhibit?.videoUrl}
        />
      );
      return;                        // only one exhibit
    }

    if (sIndex === 0) {  // Welcome level
      const welcomeExhibit = exhibits[0];
      rooms.push(
        <ExhibitRoom
          key="welcome-big"
          isCenter                   
          position={[0, worldY, Z_POS]}
          rotation={[0, Math.PI, 0]}
          modelPath={welcomeExhibit?.modelPath}
          title={`Level ${sIndex}\n${welcomeExhibit?.title}`}
          description={welcomeExhibit?.description}
        />
      );
      return;                  
    }

    /* ───────────── Default level ───────────── */

    /* 1. Center title panel */
    rooms.push(
      <ExhibitRoom
        key={`lvl-${sIndex}-center`}
        isCenter
        position={[0, worldY, Z_POS]}
        rotation={[0, Math.PI, 0]}
        title={`Level ${sIndex}\n${name}`}
      />
    );

    /* 2. Side exhibits (max 6) */
    const sideExhibits = exhibits.slice(0, 6); // clip to 6
    SIDE_COLS.forEach((col, idx) => {
      const exhibit = sideExhibits[idx];

      if (!exhibit && !fillBlanks) return;      // skip empty slot
      console.log(containerPath)
      console.log(exhibit?.modelPath)
      rooms.push(
        <ExhibitRoom
          key={`lvl-${sIndex}-slot-${idx}`}
          position={[col * X_STEP, worldY, Z_POS]}
          rotation={[0, Math.PI, 0]}
          containerPath={containerPath}
          modelPath={exhibit?.modelPath}
          title={exhibit?.title}
          description={exhibit?.description}
          videoUrl={exhibit?.videoUrl}
        />
      );
    });
  });

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
      <Canvas
        camera={{ position: [0, 2, 12], fov: 60 }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#050a15'); // or 'black'
          scene.fog = new THREE.FogExp2('#050a15', 0.07);
        }}
        >
        {/* Dim HDRI for faint reflections — intensity 0.05-0.1 */}
        {/* <Environment
          files="/hdrs/scifi_hangar_2k.hdr"
          background={false}
          intensity={0.08}
        /> */}

        <Environment preset="night" background={false} />


        {/* Add a VERY low ambient so shadows aren’t pure black */}
        {/* <ambientLight intensity={0.1} color="#0a1e2f" /> */}
        <ambientLight intensity={0.6} />
        <Points limit={500} range={[
              [-20, -10, -20],  // min xyz
              [ 20,  10,  20],  // max xyz
            ]}
          >
            <PointMaterial
              transparent
              size={0.15}
              sizeAttenuation
              color="#88aaff"
              depthWrite={false}
              opacity={0.15}
            />
          </Points>

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
