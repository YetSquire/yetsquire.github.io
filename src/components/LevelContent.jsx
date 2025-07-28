// LevelContent.jsx
import React, { useMemo } from 'react';
import { getSection } from './utils';  // or inline your section logic
import { LevelFloor } from './LevelFloor';
import Slot from './Slot';            // keep your existing Slot

const DEFAULT_RADIUS      = 10;
const DEFAULT_MAX_EXHIBIT = 6;
const SLOTS_PER_LEVEL     = 8;
const Z_CENTER            = 0;

export default function LevelContent({ logicalIdx }) {
  const section = getSection(logicalIdx);
  const {
    exhibits,
    fillBlanks,
    containerPath,
    name,
    radius      = DEFAULT_RADIUS,
    maxExhibits = DEFAULT_MAX_EXHIBIT,
    slotsCount  = SLOTS_PER_LEVEL,
    __empty     = false,
  } = section;

  // --- special cases unchanged (but no worldY calc here) ---
  // we rely on LevelShell's group position

  if (!__empty && logicalIdx === 0 && exhibits[0]) {
    const welcome = exhibits[0];
    return (
      <>
        <LevelFloor
          position={[0, -2.6, Z_CENTER]}      // local space, y=0 center of shell
          outerRadius={radius + 2}
          innerRadius={radius - 2}
          thickness={1}
          segments={64}
          color="gray"
        />
        <Slot
          index={logicalIdx}
          slotIdx={0}
          worldY={0}
          radius={radius}
          zCenter={Z_CENTER}
          isCenterSlot
          sectionName={name}
          exhibit={{ modelPath: welcome.modelPath, title: welcome.title, description: welcome.description }}
        />
      </>
    );
  }

  /* ---- normal ring build ---- */
  const exList   = __empty ? [] : exhibits.slice(0, maxExhibits);
  const totalSlots = slotsCount;
  const slotsArr = useMemo(() => {
    const out = new Array(totalSlots).fill(null);
    let exCursor = 0;
    for (let slot = 0; slot < totalSlots; slot++) {
      if (slot === 0) continue;
      if (slot === 1 || slot === totalSlots - 1) { out[slot] = null; continue; }
      out[slot] = exList[exCursor++] || (fillBlanks && !__empty ? {} : null);
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

      <Slot                  /* center panel */
        index={logicalIdx}
        slotIdx={0}
        worldY={0}
        radius={radius}
        zCenter={Z_CENTER}
        isCenterSlot
        sectionName={name}
      />

      {slotsArr.map((ex, sIdx) =>
        sIdx === 0 ? null : (
          <Slot
            key={sIdx}
            index={logicalIdx}
            slotIdx={sIdx}
            worldY={0}
            radius={radius}
            zCenter={Z_CENTER}
            sectionName={name}
            exhibit={ex && Object.keys(ex).length ? ex : null}
            containerPath={containerPath}
          />
        )
      )}
    </>
  );
}
