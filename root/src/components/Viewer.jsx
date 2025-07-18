import React from 'react';
import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import { FloatingInteractableModel } from './FloatingInteractableModel';
import { Container } from './Container';

function ZoomableCamera() {
  const { camera, gl } = useThree();

  useEffect(() => {
    const onWheel = (e) => {
      e.preventDefault();
      camera.position.z = Math.min(Math.max(camera.position.z + e.deltaY * 0.01, 2), 10);
    };
    gl.domElement.addEventListener('wheel', onWheel);
    return () => gl.domElement.removeEventListener('wheel', onWheel);
  }, [camera, gl]);

  return null;
}

export default function Viewer() {
  return (
    <Canvas camera={{ position: [0, 1.5, 5], fov: 50 }} style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
      }}>
      <ambientLight intensity={1} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} />

      <Container path="/models/container.glb" scale={0.5} />
      <FloatingInteractableModel path="/models/model.glb" scale={1} />

      <ZoomableCamera />
      <Environment preset="sunset" />
    </Canvas>
  );
}
