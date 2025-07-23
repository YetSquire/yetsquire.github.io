// ExhibitRoom.jsx
import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { Container } from './Container';
import { FloatingInteractableModel } from './FloatingInteractableModel';
import ReactPlayer from 'react-player';
import '../styling/sci-fi-panel.css'

export function ExhibitRoom({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  containerPath,
  modelPath,
  title,
  description,
  videoUrl,
}) {
  const ref = useRef();               // no <THREE.Group> generic in JS

  return (
    <group position={position} rotation={rotation}>
      {/* -- Info panel (HTML blended into depth buffer) */}
      <Html
        occlude="blending"
        transform
        distanceFactor={3}
        position={[2, 1, 0]}
        center
      >
        <div className="sci-fi-panel">
          <h2>{title}</h2>
          <p>{description}</p>

          <iframe
            width="560"
            height="315"
            src="https://www.youtube.com/embed/kLf05NDoUnU"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
        </div>
      </Html>

      {/* -- 3-D exhibit */}
      <Container ref={ref} path={containerPath} scale={0.5}>
        <FloatingInteractableModel
          path={modelPath}
          scale={1}
          containerRef={ref}
        />
      </Container>
    </group>
  );
}
