import React, { forwardRef, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { SkeletonUtils } from 'three-stdlib';
/**
 * Renders the stasis-tank model and exposes its Group via forwardRef
 * so children (the floating object) can peek at its bounding box.
 * 
 * LATER- HANDLE ROTATIONS ON CLICK
 */
export const Container = forwardRef(({ path, scale = 1, children, containerOrigin=[0, 0, 0] }, ref) => {
  const group = useRef();
  const { scene } = useGLTF(path);

  const cloned = useMemo(() => {
    // SkeletonUtils handles deep cloning of skeletons, animations, bones, etc.
    return SkeletonUtils.clone(scene);
  }, [scene]);

  // Make the inner group available to the parent through the ref
  React.useImperativeHandle(ref, () => group.current);
  

  return (
    <group ref={group}>
      {/* The tank mesh */}
      <primitive object={cloned} scale={scale} position={containerOrigin}/>
      {/* Children (floating model) live *inside* the tank group */}
      {children}
    </group>
  );
});


// {
//   const ref = useRef();
//   const isDragging = useRef(false);
//   const [rotation, setRotation] = useState({ x: 0, y: 0 });
//   const lastX = useRef(0);
//   const lastY = useRef(0);

//   useEffect(() => {
//     const handleMouseDown = (e) => {
//       if (e.button === 0) {
//         isDragging.current = true;
//         lastX.current = e.clientX;
//         lastY.current = e.clientY;
//       }
//     };

//     const handleMouseMove = (e) => {
//       if (!isDragging.current) return;

//       const dx = e.clientX - lastX.current;
//       const dy = e.clientY - lastY.current;

//       lastX.current = e.clientX;
//       lastY.current = e.clientY;

//       setRotation((prev) => ({
//         x: MathUtils.clamp(prev.x - dy * 0.01, -Math.PI / 2, Math.PI / 2),
//         y: prev.y - dx * 0.01,
//       }));
//     };

//     const handleMouseUp = () => {
//       isDragging.current = false;
//     };

//     window.addEventListener('mousedown', handleMouseDown);
//     window.addEventListener('mousemove', handleMouseMove);
//     window.addEventListener('mouseup', handleMouseUp);

//     return () => {
//       window.removeEventListener('mousedown', handleMouseDown);
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, []);

//   const { scene } = useGLTF(path);

//   useFrame(() => {
//     if (ref.current) {
//       // ref.current.rotation.x = rotation.x;
//       ref.current.rotation.y = rotation.y;
//     }
//   });

//   return <primitive ref={ref} object={scene} scale={scale} />;
// }
