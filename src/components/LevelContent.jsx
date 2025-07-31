import React, { useMemo } from 'react';
import { LevelFloor } from './LevelFloor';
import Slot from './Slot';
import {
  DEFAULT_RADIUS,
  DEFAULT_MAX,
  SLOTS_PER_LEVEL,
  Z_CENTER,
  ABOVE_N,
  BELOW_N,
} from '../utils/constants.js';
import { getSection } from '../utils/helpers.js';
import { ExhibitRoom } from './ExhibitRoom.jsx';

export default function LevelContent({ logicalIdx, center, isMobile }) {
  if (logicalIdx < center - BELOW_N) return null;
  if (logicalIdx > center + ABOVE_N) return null;

  const section = getSection(logicalIdx);
  const {
    exhibits,
    fillBlanks,
    containerPath,
    name,
    radius = DEFAULT_RADIUS,
    maxExhibits = DEFAULT_MAX,
    slotsCount = SLOTS_PER_LEVEL,
    __empty = false,
  } = section;

  if (!__empty && logicalIdx === 0 && exhibits[0]) {
    const welcome = exhibits[0];
    return (
      <>
        <LevelFloor
          position={[0, -2.6, Z_CENTER]}
          outerRadius={radius + 2}
          innerRadius={radius - 2}
          thickness={1}
          segments={64}
          color="gray"
        />
        <ExhibitRoom
          isCenter
          position={[-radius, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          modelPath={welcome.modelPath}
          modelScale={welcome.modelScale}
          modelRotation={welcome.modelRotation}
          modelOrigin={welcome.modelOrigin}
          title={`Level ${logicalIdx}\n${welcome.title}`}
          description={
            isMobile ? welcome.mobileDescription : welcome.description
          }
        />
      </>
    );
  }

  if (!__empty && logicalIdx === 1 && exhibits[0]) {
    const about = exhibits[0];
    return (
      <>
        <LevelFloor
          position={[0, -2.6, Z_CENTER]}
          outerRadius={radius + 2}
          innerRadius={radius - 2}
          thickness={1}
          segments={64}
          color="gray"
        />
        <ExhibitRoom
          position={[-radius, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          containerPath={containerPath}
          modelPath={about.modelPath}
          modelScale={about.modelScale}
          modelRotation={about.modelRotation}
          modelOrigin={about.modelOrigin}
          title={`Level ${logicalIdx}\n${about.title}`}
          description={about.description}
          videoUrl={about.videoUrl}
        />
      </>
    );
  }

  const exList = __empty ? [] : exhibits.slice(0, maxExhibits);
  const totalSlots = slotsCount;

  const slotsArr = useMemo(() => {
    const out = new Array(totalSlots).fill(null);
    let exCursor = 0;
    for (let slot = 0; slot < totalSlots; slot++) {
      if (slot === 0) continue;
      if (slot === 1 || slot === totalSlots - 1) continue;
      out[slot] =
        exList[exCursor++] || (fillBlanks && !__empty ? {} : null);
    }
    return out;
  }, [totalSlots, exList, fillBlanks, __empty]);

  return (
    <>
      <LevelFloor
        position={[0, -2.6, Z_CENTER]}
        outerRadius={radius + 2}
        innerRadius={radius - 2}
        thickness={1}
        segments={64}
        color="gray"
      />
      <Slot
        index={logicalIdx}
        slotIdx={0}
        radius={radius}
        zCenter={Z_CENTER}
        sectionName={name}
        containerPath={containerPath}
        isCenterSlot
      />
      {slotsArr.map((ex, sIdx) =>
        sIdx === 0 ? null : (
          <Slot
            key={sIdx}
            index={logicalIdx}
            slotIdx={sIdx}
            radius={radius}
            zCenter={Z_CENTER}
            sectionName={name}
            exhibit={ex && Object.keys(ex).length ? ex : null}
            containerPath={containerPath}
            isCenterSlot={false}
          />
        ),
      )}
    </>
  );
}
