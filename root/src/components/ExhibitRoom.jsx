// ExhibitRoom.jsx
import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { Container } from './Container';
import { FloatingInteractableModel } from './FloatingInteractableModel';
import ReactPlayer from 'react-player';
import '../styling/sci-fi-panel.css';
import { MyIFrame } from './MyIFrame';

export function ExhibitRoom({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  containerPath,
  modelPath,
  title,
  description,
  videoUrl,
}) {
  const ref = useRef();

  return (
    <group position={position} rotation={rotation}>
      {/* -- Info panel (HTML blended into depth buffer) */}
      <Html
        occlude="blending"
        transform
        distanceFactor={3}
        position={[4, 1, 0]}
        center
      >
        <div className="sci-fi-panel">
          <h2>{title}</h2>
          <p style={{
            width: '100%',
            height: '120px',
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '10px',
            fontSize: '14px',
            lineHeight: '1.5',
            scrollbarWidth: 'thin',           // for Firefox
          }}>
            {description}
          </p>

          <div style={{ width: '500px' }}>
            <MyIFrame videoId={videoUrl} />
          </div>
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
