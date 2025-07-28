import React, { useRef, useLayoutEffect } from 'react';
import { Html } from '@react-three/drei';
import { Container } from './Container';
import { FloatingInteractableModel } from './FloatingInteractableModel';
import { MyIFrame } from './MyIFrame';
import * as THREE from 'three';
import '../styling/sci-fi-panel.css';

const MODEL_BEAM_INT   = 150;
const MODEL_BEAM_DIST  = 6;
const MODEL_BEAM_ANGLE = 0.5;

// tweak this to move the light relative to containerOrigin:
const lightOffset = [0, -2.5, 2];

export function ExhibitRoom({
  position         = [0, 0, 0],
  rotation         = [0, 0, 0],
  containerPath,
  modelPath,
  title,
  description,
  videoUrl,
  isCenter         = false,
  containerOrigin  = [-1.25, 1, 0],
  modelOrigin      = [-1.25, 0.25, 0],
}) {
  if (!title && !modelPath && !containerPath) return null;

  // where the light sits in local space:
  const lightPos = [
    containerOrigin[0] + lightOffset[0],
    containerOrigin[1] + lightOffset[1],
    containerOrigin[2] + lightOffset[2],
  ];

  const lightRef = useRef();
  const modelRef = useRef();

  // once both are mounted, tell Three.js “aim light at model”
  useLayoutEffect(() => {
    if (lightRef.current && modelRef.current) {
      lightRef.current.target = modelRef.current;
    }
  }, []);

  const panelPos = isCenter ? [0, 0.75, 0] : [2, 0.5, 0];
  const maxWidth = isCenter ? '800px' : '100%';
  const headingStyle = {
    textAlign:     isCenter ? 'center' : 'left',
    fontSize:      isCenter ? '2.5rem' : '1.25rem',
    marginBottom:  '0.5rem',
    display:       !description ? 'flex' : undefined,
    alignItems:    !description ? 'center' : undefined,
    justifyContent: !description ? (isCenter ? 'center' : 'flex-start') : undefined,
    height:        !description ? '100%' : undefined,
  };
  const isDeactivated = !title && !description && !videoUrl;

  return (
    <group position={position} rotation={rotation}>

      {/* ─── Container + Model ─── */}
      {!isCenter && containerPath && (
        <Container path={containerPath} scale={0.75} containerOrigin={containerOrigin}>
          {modelPath && (
            // wrap the model in a group so we can get its Object3D
            <group ref={modelRef} position={modelOrigin}>
              <FloatingInteractableModel
                path={modelPath}
                scale={1}
              />
            </group>
          )}
        </Container>
      )}

      {/* ─── Spotlight + Projector ─── */}
      {/* {!isCenter && containerPath && modelPath && (
        <>
          <spotLight
            ref={lightRef}
            position={lightPos}
            angle={MODEL_BEAM_ANGLE}
            intensity={MODEL_BEAM_INT}
            distance={MODEL_BEAM_DIST}
            penumbra={1}
            color="#00ffff"
          />

          <mesh position={lightPos}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshStandardMaterial
              emissive="#00ffff"
              emissiveIntensity={3}
              color="black"
            />
          </mesh>
        </>
      )} */}
      
      <Html
        occlude="blending"
        transform
        distanceFactor={isCenter ? 4 : 4}
        position={panelPos}
        center
        style={{ overflow: 'visible' }}
      >
        <div
          className={`hologram-panel${isDeactivated ? ' deactivated' : ''}`}
          style={{
            maxWidth,
            width: isCenter ? maxWidth : '400px',
            boxSizing: 'border-box',
            display: !description ? 'flex' : 'block',
            flexDirection: 'column',
            justifyContent: 'center',
            height: '100%',
          }}
        >
          {isDeactivated ? (
            // your “deactivated” content—could be a greyed‑out overlay or text
            <div className="deactivated-message">
            </div>
          ) : (
            <>
              {title && <h2 style={headingStyle}>{title}</h2>}
              {description && (
                <p style={{
                  width: '100%',
                  height: '100%',
                  overflowY: 'auto',
                  paddingRight: '15px',
                  fontSize: '14px',
                  lineHeight: '1.5',
                  scrollbarWidth: 'thin',
                  textAlign: isCenter ? 'center' : 'left',
                }}>
                  {description}
                </p>
              )}
              {videoUrl && (
                <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  <MyIFrame videoId={videoUrl} />
                </div>
              )}
            </>
          )}
        </div>
      </Html>
    </group>
  );
}
