import React, { useRef } from 'react';
import { Container } from './Container';
import { FloatingInteractableModel } from './FloatingInteractableModel';
import { Html } from '@react-three/drei';

export function ExhibitRoom({ position, containerPath, modelPath, title }) {
  const ref = useRef();

  return (
    <group position={position}>
      <Container ref={ref} path={containerPath} scale={0.5}>
        <FloatingInteractableModel path={modelPath} scale={1} containerRef={ref} />
      </Container>

      <Html position={[0, 2, 0]} center style={{ color: 'white', fontSize: '1.5em' }}>
        {title}
      </Html>
    </group>
  );
}
