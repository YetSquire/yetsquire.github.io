import { useGLTF } from '@react-three/drei';
import { exhibitSections } from '../data/exhibits.js';

const exteriorModel = '/models/exterior.glb';

export const preloadModels = () => {
  useGLTF.preload(exteriorModel);
  exhibitSections.forEach(s => {
    if (s.containerPath) useGLTF.preload(s.containerPath);
    s.exhibits.forEach(e => e.modelPath && useGLTF.preload(e.modelPath));
  });
  return exteriorModel;
};
