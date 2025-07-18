import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { Container } from './Container';
import { FloatingInteractableModel } from './FloatingInteractableModel';

function ZoomableCamera() {
  const { camera, gl } = useThree();
  useEffect(() => {
    const wheel = (e) => {
      e.preventDefault();                            // stop page scroll
      camera.position.z = MathUtils.clamp(
        camera.position.z + e.deltaY * 0.01,
        2,                                           // near
        10                                           // far
      );
    };
    gl.domElement.addEventListener('wheel', wheel, { passive: false });
    return () => gl.domElement.removeEventListener('wheel', wheel);
  }, [camera, gl]);
  return null;
}

export default function Viewer() {
  const tankRef = useRef();   // <— will point at Container’s group

  return (
    <Canvas
      camera={{ position: [0, 1.5, 5], fov: 90 }}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    >
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      {/* Tank is parent; floating model is its child */}
      <Container ref={tankRef} path="/models/container.glb" scale={0.5}>
        <FloatingInteractableModel
          path="/models/model.glb"
          scale={1}
          containerRef={tankRef}
        />
      </Container>

      <ZoomableCamera />
      <Environment preset="sunset" />
    </Canvas>
  );
}
