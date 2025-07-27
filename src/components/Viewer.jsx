import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, KeyboardControls, useGLTF, Points, PointMaterial  } from '@react-three/drei';
import { ExhibitRoom } from './ExhibitRoom';
import { Player } from './Player';
import { MovingPlatform } from './MovingPlatform';
import { exhibitSections } from '../data/exhibits';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';
import { LevelFloor } from './LevelFloor';
import { ExteriorModel } from './ExteriorModel'; 
import { CylindricalBoundary } from './Boundary';

const exteriorModel = "/models/exterior.glb";
useGLTF.preload(exteriorModel);
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



const DEFAULT_RADIUS      = 10;  
const DEFAULT_MAX_EXHIBIT = 6;
const SLOTS_PER_LEVEL     = 8;
const Y_STEP   = 10;
const Y_ADJUST = 3;
const Z_CENTER = 0;
const WINDOW = 6;

function makeEmptySection(idx) {
  return {
    name: `Refresh to Return`,
    exhibits: [],
    fillBlanks: false,
    containerPath: null,
    radius: DEFAULT_RADIUS,
    maxExhibits: DEFAULT_MAX_EXHIBIT,
    slotsCount: SLOTS_PER_LEVEL,
    __empty: true,
  };
}

// ---------------------------------
// render ONE level (section or empty)
// ---------------------------------
function renderLevel(index, worldY, section) {
  const {
    exhibits,
    fillBlanks,
    containerPath,
    name,
    radius      = DEFAULT_RADIUS,
    maxExhibits = DEFAULT_MAX_EXHIBIT,
    slotsCount  = SLOTS_PER_LEVEL,
    __empty     = false,
  } = section;

  const items = [];

  // Ring floor
  items.push(
    <LevelFloor
      key={`floor-${index}`}
      position={[0, worldY - 2.6, Z_CENTER]}
      outerRadius={radius + 2}
      innerRadius={radius - 2}
      thickness={1}
      segments={64}
      color="gray"
    />
  );

  // --- Special real levels only if they exist ---
  if (!__empty && index === 0 && exhibits[0]) {
    const welcome = exhibits[0];
    items.push(
      <ExhibitRoom
        key="welcome-big"
        isCenter
        position={[-radius, worldY, 0]}
        rotation={[0, Math.PI / 2, 0]}
        modelPath={welcome?.modelPath}
        title={`Level ${index}\n${welcome?.title}`}
        description={welcome?.description}
      />
    );
    return items;
  }

  if (!__empty && index === 1 && exhibits[0]) {
    const about = exhibits[0];
    items.push(
      <ExhibitRoom
        key="about-single"
        position={[-radius, worldY, 0]}
        rotation={[0, Math.PI / 2, 0]}
        containerPath={containerPath}
        modelPath={about?.modelPath}
        title={`Level ${index}\n${about?.title}`}
        description={about?.description}
        videoUrl={about?.videoUrl}
      />
    );
    return items;
  }

  const totalSlots = slotsCount;
  const angleStep  = (2 * Math.PI) / totalSlots;
  let angle = Math.PI;

  const exList = __empty ? [] : exhibits.slice(0, maxExhibits);
  let exCursor = 0;

  for (let slot = 0; slot < totalSlots; slot++, angle += angleStep) {
    const x    = radius * Math.cos(angle);
    const z    = Z_CENTER + radius * Math.sin(angle);
    const rotY = Math.atan2(x, z) + Math.PI;
    const key  = `lvl-${index}-slot-${slot}`;

    if (slot === 0) {
      items.push(
        <ExhibitRoom
          key={key}
          isCenter
          position={[x, worldY, z]}
          rotation={[0, rotY, 0]}
          title={`Level ${index}\n${name}`}
        />
      );
      continue;
    }

    if (slot === 1 || slot === totalSlots - 1) continue;

    const ex = exList[exCursor++];
    if (ex) {
      items.push(
        <ExhibitRoom
          key={key}
          position={[x, worldY, z]}
          rotation={[0, rotY, 0]}
          containerPath={containerPath}
          modelPath={ex.modelPath}
          title={ex.title}
          description={ex.description}
          videoUrl={ex.videoUrl}
        />
      );
    } else if (fillBlanks && !__empty) {
      items.push(
        <ExhibitRoom
          key={key}
          position={[x, worldY, z]}
          rotation={[0, rotY, 0]}
          containerPath={containerPath}
        />
      );
    }
  }

  return items;
}


function renderExhibits(scrollY = 0) {
  const items = [];

  // which level index is roughly at scrollY?
  const center = -Math.round((scrollY + Y_ADJUST) / Y_STEP);

  for (let i = center - WINDOW; i <= center + WINDOW; i++) {
    const section = exhibitSections[i] ?? makeEmptySection(i);
    const worldY  = i * Y_STEP + scrollY + Y_ADJUST;
    items.push(...renderLevel(i, worldY, section));
  }

  return items;
}

export default function Viewer() {
  const [floorY, setFloorY] = useState(0);

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
        camera={{ position: [0, 2, 12], rotation: [0, Math.PI/2, 0], fov: 60 }}
        style={{ position: 'absolute', inset: 0 }}
        onCreated={({ scene }) => {
          scene.background = new THREE.Color('#050a15'); // or 'black'
          scene.fog = new THREE.FogExp2('#050a15', 0.1);
        }}
        >
        {/* Dim HDRI for faint reflections — intensity 0.05-0.1 */}
        {/* <Environment
          files="/hdrs/scifi_hangar_2k.hdr"
          background={false}
          intensity={0.08}
        /> */}
        <ExteriorModel path={exteriorModel} scale={DEFAULT_RADIUS*1.5} />

        <Environment preset="sunset"/>


        {/* Add a VERY low ambient so shadows aren’t pure black */}
        {/* <ambientLight intensity={0.1} color="#0a1e2f" /> */}
        <ambientLight intensity={0.6} />

        <Physics gravity={[0,-50,0]}>
          <MovingPlatform radius={DEFAULT_RADIUS*3/4}/>
          <CylindricalBoundary radius={DEFAULT_RADIUS*3/4} height={10} />
          {/* CHECK */}

          <Player
            onRaise={() => setFloorY((y) => y + 0.1)}
            onLower={() => setFloorY((y) => y - 0.1)}
          />
        </Physics>
    
        {renderExhibits(floorY)}
      </Canvas>
    </KeyboardControls>
  );
}
