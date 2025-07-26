import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { SkeletonUtils } from 'three-stdlib';

export function ExteriorModel({ path, scale = 10, modelOrigin=[0, 0, 0] }) {
  const { scene } = useGLTF(path);

  const cloned = useMemo(() => {
    return SkeletonUtils.clone(scene);
  }, [scene]);

  return <primitive object={cloned} scale={scale} position={modelOrigin} />;
}
