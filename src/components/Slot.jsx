import React from 'react';
import { ExhibitRoom } from './ExhibitRoom';
import {
  DEFAULT_RADIUS,
  SLOTS_PER_LEVEL,
  Z_CENTER,
} from '../utils/constants.js';

export default React.memo(function Slot({
  index,
  slotIdx,
  radius = DEFAULT_RADIUS,
  zCenter = Z_CENTER,
  sectionName,
  exhibit,
  containerPath,
  isCenterSlot,
}) {
  const angleStep = (2 * Math.PI) / SLOTS_PER_LEVEL;
  const angle = Math.PI + slotIdx * angleStep;
  const x = radius * Math.cos(angle);
  const z = zCenter + radius * Math.sin(angle);
  const rotY = Math.atan2(x, z) + Math.PI;

  if (slotIdx === 1 || slotIdx === SLOTS_PER_LEVEL - 1) return null;

  if (isCenterSlot) {
    return (
      <ExhibitRoom
        position={[x, 0, z]}
        rotation={[0, rotY, 0]}
        isCenter
        title={`Level ${index}\n${sectionName}`}
      />
    );
  }

  if (!exhibit) {
    return containerPath ? (
      <ExhibitRoom
        position={[x, 0, z]}
        rotation={[0, rotY, 0]}
        containerPath={containerPath}
      />
    ) : null;
  }

  return (
    <ExhibitRoom
      position={[x, 0, z]}
      rotation={[0, rotY, 0]}
      containerPath={containerPath}
      modelPath={exhibit.modelPath}
      modelScale={exhibit.modelScale}
      modelRotation={exhibit.modelRotation}
      modelOrigin={exhibit.modelOrigin}
      title={exhibit.title}
      description={exhibit.description}
      videoUrl={exhibit.videoUrl}
    />
  );
});
