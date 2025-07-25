import React, { useRef } from 'react';
import { Html } from '@react-three/drei';
import { Container } from './Container';
import { FloatingInteractableModel } from './FloatingInteractableModel';
import '../styling/sci-fi-panel.css';
import { MyIFrame } from './MyIFrame';

export function ExhibitRoom({
  position      = [0, 0, 0],
  rotation      = [0, 0, 0],
  containerPath,
  modelPath,
  title,
  description,
  videoUrl,
  isCenter = false,
}) {
  if (!title && !modelPath && !containerPath) return null;
  const ref = useRef();

  const panelPos = isCenter ? [0, 0.75, 0] : [4, 0.5, 0];
  const maxWidth = isCenter ? '800px' : '350px';
  const headingStyle = {
    textAlign: isCenter ? 'center' : 'left',
    fontSize: isCenter ? '2.5rem' : '1.25rem',
    marginBottom: '0.5rem',
  };

  return (
    <group position={position} rotation={rotation}>
      {/* ─────── Info Panel ─────── */}
      {(title || description) && (
        <>
          <Html
            occlude="blending"
            transform
            distanceFactor={isCenter ? 4 : 3}
            position={panelPos}
            center
          >
            <div className="hologram-panel" style={{ maxWidth, width: '100%' }}>
              {title && <h2 style={headingStyle}>{title}</h2>}
              {description && (
                <p
                  style={{
                    width: '100%',
                    height: '120px',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingRight: '10px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    scrollbarWidth: 'thin',
                  }}
                >
                  {description}
                </p>
              )}
              {videoUrl && (
                <div style={{ width: '100%' }}>
                  <MyIFrame videoId={videoUrl} />
                </div>
              )}
            </div>
          </Html>

          {/* Panel Lighting */}
          <pointLight
            position={[panelPos[0], panelPos[1], panelPos[2] + 1]}
            intensity={2.0}
            distance={8}
            decay={2}
            color="#00ffff"
          />
        </>
      )}

      {/* ─────── 3D Model & Light ─────── */}
      {!isCenter && containerPath && (
        <Container ref={ref} path={containerPath} scale={0.5}>
          {modelPath && <FloatingInteractableModel path={modelPath} scale={1} />}
        </Container>
      )}

      {!isCenter && modelPath && (
        <pointLight
          position={[0, -0.5, 0]}
          intensity={0.5}
          distance={5}
          decay={2}
          color="#0088ff"
        />
      )}
    </group>
  );
}
