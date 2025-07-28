// utils.js
export const Y_STEP   = 10;
export const Y_ADJUST = 3;

export function worldYFor(idx, scrollY) {
  return idx * Y_STEP + scrollY + Y_ADJUST;
}
export function logicalCenter(scrollY) {
  return -Math.round((scrollY + Y_ADJUST) / Y_STEP);
}
