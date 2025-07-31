export const DEFAULT_RADIUS = 10;
export const WINDOW = 1;
export const VISIBLE_LEVELS = WINDOW * 2 + 1;
export const SPEED = 0.07;
export const SMOOTH_SPEED = 8;
export const Y_STEP = 15;
export const Y_ADJUST = 3;
export const Z_CENTER = 0;
export const SLOTS_PER_LEVEL = 8;
export const DEFAULT_MAX = 6;
export const ABOVE_N = 6;
export const BELOW_N = 0;

export const EMPTY_SECTION = Object.freeze({
  name: '',
  exhibits: [],
  fillBlanks: false,
  containerPath: null,
  radius: DEFAULT_RADIUS,
  maxExhibits: DEFAULT_MAX,
  slotsCount: SLOTS_PER_LEVEL,
  __empty: true,
});
