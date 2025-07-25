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

  const panelPos = isCenter ? [0, 0.75, 0] : [2.5, 0.5, 0];
  const maxWidth = isCenter ? '800px' : '100%';
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
            style={{ overflow: 'visible' }}
          >
            <div
              className="hologram-panel"
              style={{
                maxWidth,
                width: isCenter ? maxWidth : '350px',
                boxSizing: 'border-box', 
              }}
            >
              {title && <h2 style={headingStyle}>{title}</h2>}
              {description && (
                <p
                  style={{
                    width: '100%',
                    height: '100%',
                    overflowY: 'auto',
                    overflowX: 'hidden',
                    paddingRight: '15px',
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

        </>
      )}

      {!isCenter && containerPath && (
        <Container ref={ref} path={containerPath} scale={0.5}>
          {modelPath && <FloatingInteractableModel path={modelPath} scale={1} />}
        </Container>
      )}

      {!isCenter && modelPath && (
        <spotLight
            position={[0, 1.5, 1]}
            angle={MODEL_SPOT_ANGLE}
            intensity={MODEL_SPOT_INT}
            distance={MODEL_SPOT_DIST}
            penumbra={0.5}
            color="#00aaff"
            castShadow
        />
      )}
    </group>
  );
}
