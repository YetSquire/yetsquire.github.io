import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { SkeletonUtils } from 'three-stdlib';

export function FloatingInteractableModel({ path, scale = 1, modelOrigin=[0, 0, 0] }) {
  const { scene } = useGLTF(path);

  const cloned = useMemo(() => {
    // SkeletonUtils handles deep cloning of skeletons, animations, bones, etc.
    return SkeletonUtils.clone(scene);
  }, [scene]);

  return <primitive object={cloned} scale={scale} position={modelOrigin} />;
}
