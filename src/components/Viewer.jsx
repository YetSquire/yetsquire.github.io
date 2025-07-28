// Viewer.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Preload, Environment, KeyboardControls, useGLTF } from '@react-three/drei';
import { invalidate } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';

import { ExhibitRoom } from './ExhibitRoom';
import { Player } from './Player';
import { MovingPlatform } from './MovingPlatform';
import { LevelFloor } from './LevelFloor';
import { ExteriorModel } from './ExteriorModel';
import { CylindricalBoundary } from './Boundary';

import { exhibitSections } from '../data/exhibits';


const DEFAULT_RADIUS      = 10;
const DEFAULT_MAX_EXHIBIT = 6;
const SLOTS_PER_LEVEL     = 8;
const Y_STEP              = 10;
const Y_ADJUST            = 3;
const Z_CENTER            = 0;
const WINDOW              = 2;
const VISIBLE_LEVELS      = WINDOW * 2 + 1;
const SPEED               = 0.07;      
const SMOOTHINGSPEED      = 8;
const EMPTY_SECTION = Object.freeze({
  name: '',
  exhibits: [],
  fillBlanks: false,
  containerPath: null,
  radius: DEFAULT_RADIUS,
  maxExhibits: DEFAULT_MAX_EXHIBIT,
  slotsCount: SLOTS_PER_LEVEL,
  __empty: true,
});


const exteriorModel = "/models/exterior.glb";
useGLTF.preload(exteriorModel);
exhibitSections.forEach(section => {
  if (section.containerPath) useGLTF.preload(section.containerPath);
  section.exhibits.forEach(ex => ex.modelPath && useGLTF.preload(ex.modelPath));
});


function getSection(idx) {
  return exhibitSections[idx] ?? EMPTY_SECTION;
}
function worldYFor(idx, scrollY) {
  return idx * Y_STEP + scrollY + Y_ADJUST;
}
function logicalCenter(scrollY) {
  return -Math.round((scrollY + Y_ADJUST) / Y_STEP);
}


const Slot = React.memo(function Slot({
  index,
  slotIdx,
  worldY,
  radius,
  zCenter,
  sectionName,
  exhibit,
  containerPath,
  isCenterSlot
}) {
  const totalSlots = SLOTS_PER_LEVEL;
  const angleStep  = (2 * Math.PI) / totalSlots;
  const angle      = Math.PI + slotIdx * angleStep;

  const x    = radius * Math.cos(angle);
  const z    = zCenter + radius * Math.sin(angle);
  const rotY = Math.atan2(x, z) + Math.PI;

  if (isCenterSlot) {
    return (
      <ExhibitRoom
        position={[x, worldY, z]}
        rotation={[0, rotY, 0]}
        isCenter
        title={`Level ${index}\n${sectionName}`}
      />
    );
  }

  if (!exhibit) {
    return containerPath ? (
      <ExhibitRoom
        position={[x, worldY, z]}
        rotation={[0, rotY, 0]}
        containerPath={containerPath}
      />
    ) : null;
  }

  return (
    <ExhibitRoom
      position={[x, worldY, z]}
      rotation={[0, rotY, 0]}
      containerPath={containerPath}
      modelPath={exhibit.modelPath}
      title={exhibit.title}
      description={exhibit.description}
      videoUrl={exhibit.videoUrl}
    />
  );
});


const Level = React.memo(function Level({
  poolIdx,
  logicalIdx,
  scrollY,
}) {
  const section = getSection(logicalIdx);

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

  const worldY = worldYFor(logicalIdx, scrollY);
  const totalSlots = slotsCount;

  // Special cases
  if (!__empty && logicalIdx === 0 && exhibits[0]) {
    const welcome = exhibits[0];
    return (
      <>
        <LevelFloor
          position={[0, worldY - 2.6, Z_CENTER]}
          outerRadius={radius + 2}
          innerRadius={radius - 2}
          thickness={1}
          segments={64}
          color="gray"
        />
        <ExhibitRoom
          isCenter
          position={[-radius, worldY, 0]}
          rotation={[0, Math.PI / 2, 0]}
          modelPath={welcome?.modelPath}
          title={`Level ${logicalIdx}\n${welcome?.title}`}
          description={welcome?.description}
        />
      </>
    );
  }

  if (!__empty && logicalIdx === 1 && exhibits[0]) {
    const about = exhibits[0];
    return (
      <>
        <LevelFloor
          position={[0, worldY - 2.6, Z_CENTER]}
          outerRadius={radius + 2}
          innerRadius={radius - 2}
          thickness={1}
          segments={64}
          color="gray"
        />
        <ExhibitRoom
          position={[-radius, worldY, 0]}
          rotation={[0, Math.PI / 2, 0]}
          containerPath={containerPath}
          modelPath={about?.modelPath}
          title={`Level ${logicalIdx}\n${about?.title}`}
          description={about?.description}
          videoUrl={about?.videoUrl}
        />
      </>
    );
  }

  // Normal ring
  const exList   = __empty ? [] : exhibits.slice(0, maxExhibits);
  const slotsArr = useMemo(() => {
    const out = new Array(totalSlots).fill(null);
    let exCursor = 0;
    for (let slot = 0; slot < totalSlots; slot++) {
      if (slot === 0) continue;
      if (slot === 1 || slot === totalSlots - 1) {
        out[slot] = null;
        continue;
      }
      out[slot] = exList[exCursor++] || (fillBlanks && !__empty ? {} : null);
    }
    return out;
  }, [totalSlots, exList, fillBlanks, __empty]);

  return (
    <>
      <LevelFloor
        position={[0, worldY - 2.6, Z_CENTER]}
        outerRadius={radius + 2}
        innerRadius={radius - 2}
        thickness={1}
        segments={64}
        color="gray"
      />

      <Slot
        key={`slot-${poolIdx}-center`}
        index={logicalIdx}
        slotIdx={0}
        worldY={worldY}
        radius={radius}
        zCenter={Z_CENTER}
        sectionName={name}
        containerPath={containerPath}
        isCenterSlot
      />

      {slotsArr.map((ex, sIdx) =>
        sIdx === 0 ? null : (
          <Slot
            key={`slot-${poolIdx}-${sIdx}`}
            index={logicalIdx}
            slotIdx={sIdx}
            worldY={worldY}
            radius={radius}
            zCenter={Z_CENTER}
            sectionName={name}
            exhibit={Object.keys(ex || {}).length ? ex : null}
            containerPath={containerPath}
            isCenterSlot={false}
          />
        )
      )}
    </>
  );
});


function SmoothFloorY({ targetRef, value, setValue }) {
  const vRef = useRef(value);
  useFrame((_, dt) => {
    const t = targetRef.current;
    vRef.current = THREE.MathUtils.lerp(
      vRef.current,
      t,
      1 - Math.exp(-dt * SMOOTHINGSPEED)
    );
    if (Math.abs(vRef.current - value) > 0.0001) {
      setValue(vRef.current);
    }
  });
  return null;
}


export default function Viewer() {
  const [floorY, setFloorY] = useState(0);
  const floorYTargetRef = useRef(0);

  const poolRef = useRef(null);
  const lastCenterRef = useRef(logicalCenter(0));

  if (!poolRef.current) {
    const c = logicalCenter(0);
    poolRef.current = Array.from({ length: VISIBLE_LEVELS }, (_, i) => ({
      poolIdx: i,
      logicalIdx: c - WINDOW + i,
    }));
  }

  useEffect(() => {
    const c = logicalCenter(floorY);
    let last = lastCenterRef.current;
    const pool = poolRef.current;

    while (c > last) {
      const first = pool.shift();
      const newLogical = pool[pool.length - 1].logicalIdx + 1;
      pool.push({ ...first, logicalIdx: newLogical });
      last += 1;
    }
    while (c < last) {
      const lastItem = pool.pop();
      const newLogical = pool[0].logicalIdx - 1;
      pool.unshift({ ...lastItem, logicalIdx: newLogical });
      last -= 1;
    }
    lastCenterRef.current = c;
  }, [floorY]);

  const poolSnapshot = poolRef.current;

  return (
    <KeyboardControls
      map={[
        { name: 'forward',  keys: ['w', 'ArrowUp'] },
        { name: 'backward', keys: ['s', 'ArrowDown'] },
        { name: 'left',     keys: ['a', 'ArrowLeft'] },
        { name: 'right',    keys: ['d', 'ArrowRight'] },
        { name: 'jump',     keys: [' '] },
        { name: 'raise',    keys: ['q'] },
        { name: 'lower',    keys: ['e'] },
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
        <SmoothFloorY targetRef={floorYTargetRef} value={floorY} setValue={setFloorY} />

        <ExteriorModel path={exteriorModel} scale={DEFAULT_RADIUS * 1.5} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.6} />

        <Physics gravity={[0, -50, 0]}>
          <MovingPlatform radius={DEFAULT_RADIUS * 3 / 4} />
          <CylindricalBoundary radius={DEFAULT_RADIUS * 3 / 4} height={10} />

          <Player
            onRaise={() => { floorYTargetRef.current += SPEED; invalidate(); }}
            onLower={() => { floorYTargetRef.current -= SPEED; invalidate(); }}
          />
        </Physics>

        {poolSnapshot.map(({ poolIdx, logicalIdx }) => (
          <Level
            key={`lvl-${poolIdx}`}
            poolIdx={poolIdx}
            logicalIdx={logicalIdx}
            scrollY={floorY}
          />
        ))}
      </Canvas>
    </KeyboardControls>
  );
}
