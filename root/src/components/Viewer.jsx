// Viewer.jsx
import React, { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, KeyboardControls } from '@react-three/drei';
import { Physics, RigidBody } from '@react-three/rapier';
import { ExhibitRoom } from './ExhibitRoom';
import { Player } from './Player';
import { exhibits } from '../data/exhibits';

// child component that *lives inside* the Canvas
function MovingPlatform({ targetY }) {
  const ref = React.useRef();

  // drive the platform BEFORE each physics step
  React.useLayoutEffect(() => {
    // nothing here
  }, []);

  // this hook is now valid because it’s inside Canvas!
  useFrame(() => {
    if (!ref.current) return;
    const pos = ref.current.translation();
    const dy = targetY - pos.y;
    const velY = dy * 8;
    ref.current.setLinvel({ x: 0, y: velY, z: 0 }, true);
  });

  return (
    <RigidBody
      ref={ref}
      type="dynamic"
      gravityScale={0}
      lockRotations
      linearDamping={4}
      angularDamping={10}
      colliders="cuboid"
    >
      <mesh receiveShadow castShadow>
        <boxGeometry args={[100, 0.2, 10]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </RigidBody>
  );
}

export default function Viewer() {
  const [floorY, setFloorY] = useState(-.1);
  const speed = 0.05;
  const xDist = 10;
  const yDist = 15;
  const xMax = 10;
  const roomBuffer = 50;
  const zStart = 7;

  return (
    <KeyboardControls map={[
      { name: 'forward', keys: ['w','ArrowUp'] },
      { name: 'backward', keys: ['s','ArrowDown'] },
      { name: 'left', keys: ['a','ArrowLeft'] },
      { name: 'right', keys: ['d','ArrowRight'] },
      { name: 'jump', keys: [' '] },
      { name: 'raise', keys: ['q'] },
      { name: 'lower', keys: ['e'] },
    ]}>
      <Canvas
        camera={{ position: [0, 1.5, 10], fov: 60 }}
        style={{ position: 'absolute', inset: 0, width: '100vw', height: '100vh' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[10,10,10]} intensity={1.2}/>
        <Environment preset="sunset"/>

        <Physics gravity={[0,-30,0]}>
          {/* now hooks live inside Canvas */}
          <MovingPlatform targetY={floorY} />

          <Player
            onRaise={() => setFloorY(y => y + speed)}
            onLower={() => setFloorY(y => y - speed)}
            floorY={floorY}
          />

          <ExhibitRoom
            position={[0,0,7]}
            rotation={[0,Math.PI,0]}
            containerPath="/models/container.glb"
            modelPath="/models/model.glb"
            title="V^2/R"
            description="First Place Winner of MHacks 24"
            videoURL="https://www.youtube.com/watch?v=kLf05NDoUnU"
          />
        </Physics>
      </Canvas>
    </KeyboardControls>
  );
}
