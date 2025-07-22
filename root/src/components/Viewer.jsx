import React, {useState, useRef} from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { KeyboardControls } from '@react-three/drei';
import { ExhibitRoom } from './ExhibitRoom';
import { Player } from './Player';

var floorSpeed = 0.05;

export default function Viewer() {
  const [floorY, setFloorY] = useState(-0.1);
  const floorRef = useRef();

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
        camera={{ position: [0, 1.5, 10], fov: 60 }}
        style={{ position: 'absolute', inset: 0, width: '100vw', height: '100vh' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 10]} intensity={1.2} />
        <Environment preset="sunset" />

        <Physics gravity={[0, 0, 0]}>
          {/* Floor */}
          <RigidBody type="fixed" position={[0, floorY, 0]} receiveShadow castShadow>
            <mesh ref={floorRef} >
              <boxGeometry args={[10, 0.2, 10]} />
              <meshStandardMaterial color="gray" />
            </mesh>
          </RigidBody>

          {/* Player capsule */}
          <Player onRaise={() => setFloorY(f => f + floorSpeed)} onLower={() => setFloorY(f => f - floorSpeed)} floorY={floorY} />

          {/* Exhibit rooms */}
          {/* TODO- mathematically define array + text + height */}
          <ExhibitRoom
            position={[0, 0, 6]}
            rotation={[0, Math.PI, 0]}
            containerPath="/models/container.glb"
            modelPath="/models/model.glb"
            title="Project Beta"
            floorRef={floorRef}
          />
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}
