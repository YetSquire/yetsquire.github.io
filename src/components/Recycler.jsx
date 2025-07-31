import { useFrame, invalidate } from '@react-three/fiber';
import { logicalCenter } from '../utils/helpers.js';
import { WINDOW } from '../utils/constants.js';

export default function Recycler({
  poolRef,
  floorYRef,
  centerRef,
  forceRerender,
}) {
  useFrame(() => {
    const c = logicalCenter(floorYRef.current);
    const minIdx = c - WINDOW;
    const maxIdx = c + WINDOW;
    const pool = poolRef.current;
    let changed = false;

    while (pool[0].logicalIdx < minIdx) {
      const low = pool.shift();
      low.logicalIdx = pool[pool.length - 1].logicalIdx + 1;
      pool.push(low);
      changed = true;
    }
    while (pool[pool.length - 1].logicalIdx > maxIdx) {
      const high = pool.pop();
      high.logicalIdx = pool[0].logicalIdx - 1;
      pool.unshift(high);
      changed = true;
    }
    if (changed) invalidate();
    if (c !== centerRef.current) {
      centerRef.current = c;
      forceRerender();
    }
  });
  return null;
}
