import { Y_ADJUST, Y_STEP } from './constants.js';
import { exhibitSections } from '../data/exhibits.js';
import { EMPTY_SECTION } from './constants.js';

export const logicalCenter = scrollY =>
  -Math.round((scrollY + Y_ADJUST) / Y_STEP);

export const worldYFor = (idx, scrollY) =>
  idx * Y_STEP + scrollY + Y_ADJUST;

export const getSection = i => exhibitSections[i] ?? EMPTY_SECTION;
