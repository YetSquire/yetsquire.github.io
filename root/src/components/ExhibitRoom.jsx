import React, { useRef } from 'react';
import { Container } from './Container';
import { FloatingInteractableModel } from './FloatingInteractableModel';
import { Html } from '@react-three/drei';

export function ExhibitRoom({ position, rotation, containerPath, modelPath, title, floorRef }) {
  const ref = useRef();

  return (
    <group position={position} rotation={rotation}>
      {/* 3D floating info panel */}
      <Html
        transform
        occlude={[floorRef]}
        position={[5, 0, 0]}  // behind or beside model
        distanceFactor={5}
        style={{
          width: '400px',
          height: '300px',
          overflowY: 'auto',
          background: 'rgba(0, 10, 30, 0.9)',
          border: '2px solid #00ffff88',
          color: '#00ccff',
          padding: '1em',
          borderRadius: '12px',
          fontFamily: 'Orbitron, sans-serif',
          boxShadow: '0 0 15px #00ffff88',
          backdropFilter: 'blur(4px)',
          scrollbarWidth: 'thin',
        }}
      >
        <h2 style={{ marginTop: 0, borderBottom: '1px solid #00ffff44' }}>{title}</h2>

        <video
          src="/videos/demo.mp4"
          controls
          style={{
            width: '100%',
            border: '1px solid #00ccff44',
            borderRadius: '6px',
            marginBottom: '0.5em',
          }}
        />

        <p>
          This is a sci-fi-themed description of the project. Scroll to read more.
        </p>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed nec ultricies libero. Duis
          vitae luctus arcu, eget sagittis ex. Pellentesque habitant morbi tristique senectus et
          netus et malesuada fames ac turpis egestas.
        </p>
        <p>
          Additional content could go here — even interactive elements like links or images.
        </p>
      </Html>

      {/* Exhibit Model */}
      <Container ref={ref} path={containerPath} scale={0.5}>
        <FloatingInteractableModel path={modelPath} scale={1} containerRef={ref} />
      </Container>
    </group>
  );
}
