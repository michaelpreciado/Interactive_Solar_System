/**
 * Per-body bake recipes.
 *
 * The uniform values that turn the shared archetype shader into a specific,
 * recognisable world. Analytic feature slots (`spotA`, `spotB`) carry real
 * coordinates: the Great Red Spot at 22 degrees south, Valles Marineris across
 * Mars's equator, Olympus Mons at 18.65N 133.8W.
 */

import type { Archetype } from '../../data/bodies';
import { DEG2RAD } from '../../sim/constants';

export interface Recipe {
  define: string;
  roughBase: number;
  bandCount: number;
  bandContrast: number;
  warpAmount: number;
  craterDensity: number;
  /** Latitude in radians beyond which ice appears. 0 disables. */
  iceExtent: number;
  /** Sea-level threshold for terran bodies. */
  continentLevel: number;
  /** [longitude, latitude, angular radius, strength] in radians. */
  spotA: [number, number, number, number];
  spotB: [number, number, number, number];
  spotSwirl: number;
}

const ARCHETYPE_DEFINE: Record<Archetype, string> = {
  star: 'ARCH_STAR',
  rocky: 'ARCH_ROCKY',
  terran: 'ARCH_TERRAN',
  gasGiant: 'ARCH_GASGIANT',
  iceGiant: 'ARCH_ICEGIANT',
  iceMoon: 'ARCH_ICEMOON',
  volcanic: 'ARCH_VOLCANIC',
};

const NONE: [number, number, number, number] = [0, 0, 0, 0];

const base = (archetype: Archetype): Recipe => ({
  define: ARCHETYPE_DEFINE[archetype],
  roughBase: 0.85,
  bandCount: 9,
  bandContrast: 0.5,
  warpAmount: 0.5,
  craterDensity: 0.5,
  iceExtent: 0,
  continentLevel: 0.52,
  spotA: NONE,
  spotB: NONE,
  spotSwirl: 0,
});

const deg = (d: number) => d * DEG2RAD;

export const RECIPES: Record<string, Recipe> = {
  sun: { ...base('star'), roughBase: 1 },

  mercury: {
    ...base('rocky'),
    roughBase: 0.94,
    // The most heavily cratered surface in the system.
    craterDensity: 1.0,
    iceExtent: 0,
  },

  venus: {
    ...base('rocky'),
    roughBase: 0.7,
    // Resurfaced by volcanism ~500 Myr ago, so almost no craters survive.
    craterDensity: 0.12,
    iceExtent: 0,
  },

  earth: {
    ...base('terran'),
    roughBase: 0.8,
    continentLevel: 0.515,
    // ~66.5 degrees, the Arctic Circle.
    iceExtent: deg(66.5),
  },

  luna: {
    ...base('rocky'),
    roughBase: 0.95,
    craterDensity: 0.95,
  },

  mars: {
    ...base('rocky'),
    roughBase: 0.9,
    craterDensity: 0.62,
    // The CO2 caps reach much further than Earth's; the driver modulates this
    // seasonally from Mars's true anomaly.
    iceExtent: deg(62),
    // Valles Marineris: 4000 km long, centred near 14S, running 85W to 35W.
    spotA: [deg(-60), deg(-14), deg(26), 1.0],
    // Olympus Mons: 18.65N, 133.8W, ~600 km across.
    spotB: [deg(-133.8), deg(18.65), deg(5.1), 1.0],
  },

  phobos: { ...base('rocky'), roughBase: 0.97, craterDensity: 1.0 },
  deimos: { ...base('rocky'), roughBase: 0.97, craterDensity: 0.85 },

  jupiter: {
    ...base('gasGiant'),
    roughBase: 0.62,
    bandCount: 11,
    bandContrast: 0.72,
    warpAmount: 0.8,
    // The Great Red Spot: 22S, roughly 16,000 km across on a 69,911 km radius,
    // so an angular half-width of about 0.115 rad.
    spotA: [deg(-40), deg(-22), 0.115, 1.0],
    // Oval BA, "Red Spot Junior", at 33S.
    spotB: [deg(80), deg(-33), 0.05, 0.35],
    spotSwirl: 2.4,
  },

  io: { ...base('volcanic'), roughBase: 0.8 },
  europa: {
    ...base('iceMoon'),
    roughBase: 0.35,
    // Dominated by linea rather than craters -- a young, resurfacing shell.
    craterDensity: 0.9,
  },
  ganymede: { ...base('iceMoon'), roughBase: 0.7, craterDensity: 0.5 },
  callisto: { ...base('iceMoon'), roughBase: 0.85, craterDensity: 0.15 },

  saturn: {
    ...base('gasGiant'),
    roughBase: 0.65,
    bandCount: 9,
    // Saturn's bands are real but much softer than Jupiter's.
    bandContrast: 0.34,
    warpAmount: 0.55,
    spotSwirl: 1.2,
  },

  enceladus: { ...base('iceMoon'), roughBase: 0.25, craterDensity: 0.55 },
  titan: {
    ...base('iceMoon'),
    roughBase: 0.6,
    // The surface is barely visible under the haze, so detail is wasted here;
    // the atmosphere shell does the work.
    craterDensity: 0.2,
  },
  iapetus: {
    ...base('iceMoon'),
    roughBase: 0.8,
    craterDensity: 0.3,
    // Cassini Regio: the leading hemisphere is an order of magnitude darker.
    spotB: [deg(90), 0, 0, 1.0],
  },

  uranus: {
    ...base('iceGiant'),
    roughBase: 0.6,
    bandCount: 7,
    // Famously featureless. Any more contrast than this looks wrong.
    bandContrast: 0.06,
  },

  titania: { ...base('iceMoon'), roughBase: 0.82, craterDensity: 0.4 },

  neptune: {
    ...base('iceGiant'),
    roughBase: 0.6,
    bandCount: 8,
    bandContrast: 0.12,
    // The Great Dark Spot, at 22S.
    spotB: [deg(-30), deg(-22), 0.14, 0.9],
  },

  triton: { ...base('iceMoon'), roughBase: 0.3, craterDensity: 0.45 },

  pluto: {
    ...base('iceMoon'),
    roughBase: 0.7,
    craterDensity: 0.35,
    // Sputnik Planitia, the bright nitrogen-ice heart, near 20N 180E.
    spotB: [deg(180), deg(20), 0, 0.0],
  },
  charon: { ...base('iceMoon'), roughBase: 0.85, craterDensity: 0.25 },
};

export function recipeFor(id: string, archetype: Archetype): Recipe {
  return RECIPES[id] ?? base(archetype);
}
