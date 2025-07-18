import React, { useRef, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { Box3, MathUtils, Vector3 } from 'three';

export function FloatingInteractableModel({ path, scale = 1, containerRef }) {
  const meshRef = useRef();
  const { scene } = useGLTF(path);

  /** ----- drag state ----- */
  const isDragging = useRef(false);
  const lastXY     = useRef([0, 0]);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const proposed   = new Vector3();

  /* ========== mouse handlers ========== */
  useEffect(() => {
    const onDown = (e) => {
      if (e.button !== 0) return;          // left-click only
      isDragging.current = true;
      lastXY.current = [e.clientX, e.clientY];
    };

    const onMove = (e) => {
      if (!isDragging.current) return;

      // ----- rotation (free X-Y spin) -----
      const [lx, ly] = lastXY.current;
      const dx = e.clientX - lx;
      const dy = e.clientY - ly;
      lastXY.current = [e.clientX, e.clientY];

      setRotation((prev) => ({
        x: MathUtils.clamp(prev.x - dy * 0.01, -Math.PI / 2, Math.PI / 2),
        y: prev.y - dx * 0.01,
      }));

      // ----- translation in XZ plane -----
      proposed.copy(meshRef.current.position)
              .add(new Vector3(dx * 0.01, 0, dy * 0.01));

      // Build boxes for collision test
      const tankObj = containerRef.current;
      if (!tankObj) return;                // tank not loaded yet

      const tankBox = new Box3().setFromObject(tankObj);
      const modelBox = new Box3().setFromObject(meshRef.current)
                                 .translate(proposed.clone().sub(meshRef.current.position));

      // Move only if the model stays *inside* the tank box
      if (tankBox.containsBox(modelBox)) {
        meshRef.current.position.copy(proposed);
      }
    };

    const onUp = () => { isDragging.current = false; };

    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup',   onUp);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup',   onUp);
    };
  }, [containerRef]);

  /* ========== apply rotation each frame ========== */
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x = rotation.x;
      meshRef.current.rotation.y = rotation.y;
    }
  });

  return <primitive ref={meshRef} object={scene} scale={scale} />;
}
