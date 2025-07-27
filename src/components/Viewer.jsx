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

/* constants */

/* at top of your file */
const DEFAULT_RADIUS      = 10;  // metres
const DEFAULT_MAX_EXHIBIT = 6;   // max number of exhibits to show
const SLOTS_PER_LEVEL     = 6;   // total slots: [sign, gap, exhibits..., gap]
const Y_STEP   = 10;
const Y_ADJUST = 3;
const Z_CENTER = 0;

function renderExhibits(scrollY = 0) {
  const items = [];

  exhibitSections.forEach((section, sIndex) => {
    const {
      exhibits,
      fillBlanks,
      containerPath,
      name,
      radius      = DEFAULT_RADIUS,
      maxExhibits = DEFAULT_MAX_EXHIBIT,
      slotsCount  = SLOTS_PER_LEVEL,
    } = section;

    const worldY = sIndex * Y_STEP + scrollY + Y_ADJUST;
    const thisX    = -radius;
    const thisZ    = 0;
    const thisRotY = Math.PI/2;

    
    items.push(
      <LevelFloor
        key={`floor-${sIndex}`}
        position={[0, worldY - 2, Z_CENTER]}   // same offset as before
        outerRadius={radius + 2}               // a bit larger than your exhibit circle
        innerRadius={radius - 2}               // hole just inside the exhibit ring
        thickness={1}                          // how “tall” the ring is
        segments={64}                          // smoothness
        color="gray"
      />
    );

    /* ─── Special levels ─── */
    if (sIndex === 1) {
      // About
      const about = exhibits[0];
      items.push(
        <ExhibitRoom
          key="about-single"
          position={[thisX, worldY, thisZ]}
          rotation={[0, thisRotY, 0]}
          containerPath={containerPath}
          modelPath={about?.modelPath}
          title={`Level ${sIndex}\n${about?.title}`}
          description={about?.description}
          videoUrl={about?.videoUrl}
        />
      );
      return;
    }
    if (sIndex === 0) {
      // Welcome
      const welcome = exhibits[0];
      items.push(
        <ExhibitRoom
          key="welcome-big"
          isCenter
          position={[thisX, worldY, thisZ]}
          rotation={[0, thisRotY, 0]}
          modelPath={welcome?.modelPath}
          title={`Level ${sIndex}\n${welcome?.title}`}
          description={welcome?.description}
        />
      );
      return;
    }

    /* ─── Normal circular pillar ─── */
    // clamp how many real exhibits we place
    const exList = exhibits.slice(0, maxExhibits);

    // circle math
    const totalSlots = slotsCount;
    const angleStep  = (2 * Math.PI) / totalSlots;
    // start at left-most (π)
    let angle = Math.PI;

    // we’ll consume exhibits in order from index 2..(slotsCount-2)
    let exCursor = 0;

    for (let slot = 0; slot < totalSlots; slot++, angle += angleStep) {
      const x    = radius * Math.cos(angle);
      const z    = Z_CENTER + radius * Math.sin(angle);
      const rotY = Math.atan2(x, z) + Math.PI;
      const key  = `lvl-${sIndex}-slot-${slot}`;

      // slot 0: level sign
      if (slot === 0) {
        items.push(
          <ExhibitRoom
            key={key}
            isCenter
            position={[x, worldY, z]}
            rotation={[0, rotY, 0]}
            title={`Level ${sIndex}\n${name}`}
          />
        );
        continue;
      }
      // slots 2..(last-1): exhibits or placeholders
      const exhibit = exList[exCursor++];
      if (exhibit) {
        items.push(
          <ExhibitRoom
            key={key}
            position={[x, worldY, z]}
            rotation={[0, rotY, 0]}
            containerPath={containerPath}
            modelPath={exhibit.modelPath}
            title={exhibit.title}
            description={exhibit.description}
            videoUrl={exhibit.videoUrl}
          />
        );
      } else if (fillBlanks) {
        // placeholder container only
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
  });

  return items;
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
