import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { MathUtils } from 'three';

export function FloatingInteractableModel({ path, scale = 1 }) {
  const ref = useRef();
  const isDragging = useRef(false);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const lastX = useRef(0);
  const lastY = useRef(0);

  useEffect(() => {
    const handleMouseDown = (e) => {
      if (e.button === 0) {
        isDragging.current = true;
        lastX.current = e.clientX;
        lastY.current = e.clientY;
      }
    };

    const handleMouseMove = (e) => {
      if (!isDragging.current) return;

      const dx = e.clientX - lastX.current;
      const dy = e.clientY - lastY.current;

      lastX.current = e.clientX;
      lastY.current = e.clientY;

      setRotation((prev) => ({
        x: MathUtils.clamp(prev.x - dy * 0.01, -Math.PI / 2, Math.PI / 2),
        y: prev.y - dx * 0.01,
      }));
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const { scene } = useGLTF(path);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x = rotation.x;
      ref.current.rotation.y = rotation.y;
    }
  });

  return <primitive ref={ref} object={scene} scale={scale} />;
}
