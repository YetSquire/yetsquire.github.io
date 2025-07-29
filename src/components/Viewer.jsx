// Viewer.jsx
import React, { useRef, useMemo } from 'react';
import { Canvas, invalidate } from '@react-three/fiber';
import { Preload, Environment, KeyboardControls, useGLTF } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import * as THREE from 'three';

import { ExhibitRoom } from './ExhibitRoom';
import { Player } from './Player';
import { MovingPlatform } from './MovingPlatform';
import { LevelFloor } from './LevelFloor';
import { ExteriorModel } from './ExteriorModel';
import { CylindricalBoundary } from './Boundary';

import { exhibitSections } from '../data/exhibits';

// ---------------- CONSTS ----------------
const DEFAULT_RADIUS = 10;
const WINDOW         = 1;
const VISIBLE_LEVELS = WINDOW * 2 + 1; // pool size
const SPEED          = 0.07;
const SMOOTH_SPEED   = 8;
const Y_STEP         = 15;
const Y_ADJUST       = 3;
const Z_CENTER       = 0;
const SLOTS_PER_LEVEL= 8;
const DEFAULT_MAX    = 6;

const ABOVE_N = 6;   // tweak
const BELOW_N = 0;

const EMPTY_SECTION = Object.freeze({
  name: '',
  exhibits: [],
  fillBlanks: false,
  containerPath: null,
  radius: DEFAULT_RADIUS,
  maxExhibits: DEFAULT_MAX,
  slotsCount: SLOTS_PER_LEVEL,
  __empty: true,
});

// -------------- HELPERS --------------
function logicalCenter(scrollY) {
  return -Math.round((scrollY + Y_ADJUST) / Y_STEP);
}
function worldYFor(idx, scrollY) {
  return idx * Y_STEP + scrollY + Y_ADJUST;
}
function getSection(i) {
  return exhibitSections[i] ?? EMPTY_SECTION;
}

// -------------- PRELOAD --------------
const exteriorModel = '/models/exterior.glb';
useGLTF.preload(exteriorModel);
exhibitSections.forEach(s => {
  if (s.containerPath) useGLTF.preload(s.containerPath);
  s.exhibits.forEach(e => e.modelPath && useGLTF.preload(e.modelPath));
});

// -------------- R3F-only components --------------
import { useFrame } from '@react-three/fiber';

// Smooths floorYRef towards targetRef (no React state)
function SmoothFloorY({ targetRef, valueRef }) {
  useFrame((_, dt) => {
    valueRef.current = THREE.MathUtils.lerp(
      valueRef.current,
      targetRef.current,
      1 - Math.exp(-dt * SMOOTH_SPEED)
    );
  });
  return null;
}

// Recycles pooled levels when out of range
function Recycler({ poolRef, floorYRef, centerRef, forceRerender }) {
  useFrame(() => {
    const c      = logicalCenter(floorYRef.current);
    const minIdx = c - WINDOW;
    const maxIdx = c + WINDOW;
    const pool   = poolRef.current;
    let changed  = false;

    while (pool[0].logicalIdx < minIdx) {
      const low = pool.shift();
      low.logicalIdx = pool[pool.length - 1].logicalIdx + 1;
      pool.push(low);
      changed = true;
    }
    while (pool[pool.length - 1].logicalIdx > maxIdx) {
      const high = pool.pop();
      high.logicalIdx = pool[0].logicalIdx - 1;
      pool.unshift(high);
      changed = true;
    }

    if (changed) invalidate();
    
    if (c != centerRef.current){
      centerRef.current = c;
      forceRerender();
    }
  });
  return null;
}

// Positions a level group each frame
function LevelShell({ item, floorYRef, children }) {
  const g = useRef();
  useFrame(() => {
    if (g.current)
      g.current.position.y = worldYFor(item.logicalIdx, floorYRef.current);
  });
  return <group ref={g}>{children}</group>;
}

// -------------- SLOT / LEVEL CONTENT --------------
const Slot = React.memo(function Slot({
  index, slotIdx, radius, zCenter, sectionName,
  exhibit, containerPath, isCenterSlot
}) {
  const angleStep  = (2 * Math.PI) / SLOTS_PER_LEVEL;
  const angle      = Math.PI + slotIdx * angleStep;

  const x    = radius * Math.cos(angle);
  const z    = zCenter + radius * Math.sin(angle);
  const rotY = Math.atan2(x, z) + Math.PI;

  if (slotIdx == 1 || slotIdx == SLOTS_PER_LEVEL-1) return null;

  if (isCenterSlot) {
    return (
      <ExhibitRoom
        position={[x, 0, z]}
        rotation={[0, rotY, 0]}
        isCenter
        title={`Level ${index}\n${sectionName}`}
      />
    );
  }

  if (!exhibit) {
    return containerPath ? (
      <ExhibitRoom
        position={[x, 0, z]}
        rotation={[0, rotY, 0]}
        containerPath={containerPath}
      />
    ) : null;
  }

  return (
    <ExhibitRoom
      position={[x, 0, z]}
      rotation={[0, rotY, 0]}
      containerPath={containerPath}
      modelPath={exhibit.modelPath}
      modelScale={exhibit.modelScale}
      modelRotation={exhibit.modelRotation}
      modelOrigin={exhibit.modelOrigin}
      title={exhibit.title}
      description={exhibit.description}
      videoUrl={exhibit.videoUrl}
    />
  );
});

function LevelContent({ logicalIdx, center }) {
  if (logicalIdx < center - BELOW_N) return null; 
  if (logicalIdx > center + ABOVE_N) return null; 
  const section = getSection(logicalIdx);
  const {
    exhibits,
    fillBlanks,
    containerPath,
    name,
    radius      = DEFAULT_RADIUS,
    maxExhibits = DEFAULT_MAX,
    slotsCount  = SLOTS_PER_LEVEL,
    __empty     = false,
  } = section;

  // Special 0 / 1 behavior
  if (!__empty && logicalIdx === 0 && exhibits[0]) {
    const welcome = exhibits[0];
    return (
      <>
        <LevelFloor
          position={[0, -2.6, Z_CENTER]}
          outerRadius={radius + 2}
          innerRadius={radius - 2}
          thickness={1}
          segments={64}
          color="gray"
        />
        <ExhibitRoom
          isCenter
          position={[-radius, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          modelPath={welcome?.modelPath}
          modelScale={welcome?.modelScale}
          modelRotation={welcome?.modelRotation}
          modelOrigin={welcome?.modelOrigin}
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
          position={[0, -2.6, Z_CENTER]}
          outerRadius={radius + 2}
          innerRadius={radius - 2}
          thickness={1}
          segments={64}
          color="gray"
        />
        <ExhibitRoom
          position={[-radius, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          containerPath={containerPath}
          modelPath={about?.modelPath}
          modelScale={about?.modelScale}
          modelRotation={about?.modelRotation}
          modelOrigin={about?.modelOrigin}
          title={`Level ${logicalIdx}\n${about?.title}`}
          description={about?.description}
          videoUrl={about?.videoUrl}
        />
      </>
    );
  }

  // Normal ring
  const exList   = __empty ? [] : exhibits.slice(0, maxExhibits);
  const totalSlots = slotsCount;

  const slotsArr = useMemo(() => {
    const out = new Array(totalSlots).fill(null);
    let exCursor = 0;
    for (let slot = 0; slot < totalSlots; slot++) {
      if (slot === 0) continue;
      if (slot === 1 || slot === totalSlots - 1) { out[slot] = null; continue; }
      out[slot] = exList[exCursor++] || (fillBlanks && !__empty ? {} : null);
    }
    return out;
  }, [totalSlots, exList, fillBlanks, __empty]);

  return (
    <>
      <LevelFloor
        position={[0, -2.6, Z_CENTER]}
        outerRadius={radius + 2}
        innerRadius={radius - 2}
        thickness={1}
        segments={64}
        color="gray"
      />

      <Slot
        index={logicalIdx}
        slotIdx={0}
        radius={radius}
        zCenter={Z_CENTER}
        sectionName={name}
        containerPath={containerPath}
        isCenterSlot
      />

      {slotsArr.map((ex, sIdx) =>
        sIdx === 0 ? null : (
          <Slot
            key={sIdx}
            index={logicalIdx}
            slotIdx={sIdx}
            radius={radius}
            zCenter={Z_CENTER}
            sectionName={name}
            exhibit={ex && Object.keys(ex).length ? ex : null}
            containerPath={containerPath}
            isCenterSlot={false}
          />
        )
      )}
    </>
  );
}

// -------------- MAIN --------------
export default function Viewer() {
  const floorYTarget = useRef(0);
  const floorY       = useRef(0);

  const pool = useRef(null);
const [tick, setTick] = React.useState(0); // force re-render
const centerRef = useRef(logicalCenter(0));
if (!pool.current) {
  const c = logicalCenter(0);
  pool.current = Array.from({ length: VISIBLE_LEVELS }, (_, i) => ({
    id: i,                               // stable
    logicalIdx: c - WINDOW + i,
  }));
}
const forceRerender = React.useCallback(() => setTick(t => t + 1), []);

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

        {/* Drive floorY imperatively */}
        <SmoothFloorY targetRef={floorYTarget} valueRef={floorY} />
        <Recycler poolRef={pool} floorYRef={floorY} centerRef={centerRef} forceRerender={forceRerender} />

        <ExteriorModel path={exteriorModel} scale={DEFAULT_RADIUS * 1.5} />
        <Environment preset="sunset" />
        <ambientLight intensity={0.6} />

        <Physics gravity={[0, -50, 0]}>
          <MovingPlatform radius={DEFAULT_RADIUS * 0.75} />
          <CylindricalBoundary radius={DEFAULT_RADIUS * 0.75} height={10} />

          <Player
            onRaise={() => { floorYTarget.current += SPEED; invalidate(); }}
            onLower={() => { floorYTarget.current -= SPEED; invalidate(); }}
          />
        </Physics>

        {pool.current.map((item) => (
          <LevelShell key={item.id} item={item} floorYRef={floorY}>
            <LevelContent logicalIdx={item.logicalIdx} center={centerRef.current} />
          </LevelShell>
        ))}
      </Canvas>
    </KeyboardControls>
  );
}
