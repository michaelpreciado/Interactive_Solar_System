/**
 * World state: every body's absolute position, radius and spin for the current
 * frame.
 *
 * All storage is preallocated. `step()` runs once per frame and performs no
 * allocation whatsoever -- no `new Vector3`, no array literals, no closures.
 * `src/test/world.test.ts` asserts that with a heap-delta check.
 */

import {
  BODIES,
  BODY_BY_ID,
  compressDistance,
  morphedRadius,
  type BodyDef,
} from '../data/bodies';
import { AU, DEG2RAD, J2000, KM_PER_UNIT, TAU } from './constants';
import { PLANET_ELEMENTS, propagate, propagateSatellite } from './ephemeris';

const N = BODIES.length;

/** id -> dense index into the parallel arrays below. */
export const bodyIndex: Record<string, number> = Object.fromEntries(
  BODIES.map((b, i) => [b.id, i])
);

/** Absolute scene-space position, 3 floats per body. Float64. */
export const absPos = new Float64Array(N * 3);

/** Heliocentric distance in AU, per body. Zero for the Sun. */
export const distanceAU = new Float64Array(N);

/** Rendered radius in scene units for the current morph, per body. */
export const radii = new Float64Array(N);

/** Rotation angle about the body's own axis, radians. */
export const spin = new Float64Array(N);

/** Scratch for the ecliptic-frame propagate output. */
const eclipticScratch = new Float64Array(3);
const satScratch = new Float64Array(3);

/**
 * Compressed-mode distance for a satellite, in scene units.
 *
 * True ratios are unusable when the parent is drawn at an artistic radius:
 * the Moon at its real 60 parent-radii would sit 148 display-radii out. A
 * log remap keeps the ordering (Phobos hugs Mars, Iapetus is far out) while
 * fitting everything into a frame you can actually look at.
 */
function compressedSatelliteDistance(body: BodyDef, parent: BodyDef): number {
  const ratio = body.satellite!.semiMajorKm / parent.radiusKm;
  return parent.displayRadius * (2.2 + 1.6 * Math.log10(Math.max(ratio, 1.01)));
}

// Precompute the per-body constants the frame loop would otherwise recompute.
interface Precomputed {
  def: BodyDef;
  parentIndex: number;
  trueRadiusUnits: number;
  trueSatDistance: number;
  compressedSatDistance: number;
  /** Radians of spin per day. */
  spinRate: number;
}

const pre: Precomputed[] = BODIES.map((def) => {
  const parent = def.parent ? BODY_BY_ID[def.parent] : undefined;
  return {
    def,
    parentIndex: def.parent ? bodyIndex[def.parent] : -1,
    trueRadiusUnits: def.radiusKm / KM_PER_UNIT,
    trueSatDistance: def.satellite ? def.satellite.semiMajorKm / KM_PER_UNIT : 0,
    compressedSatDistance:
      def.satellite && parent ? compressedSatelliteDistance(def, parent) : 0,
    spinRate: def.rotationHours === 0 ? 0 : (TAU * 24) / def.rotationHours,
  };
});

// Bodies are ordered so that parents always precede their moons, which lets a
// single forward pass resolve moon positions without a second traversal.
const orderCheck = BODIES.every(
  (b, i) => !b.parent || bodyIndex[b.parent] < i
);
if (!orderCheck) {
  throw new Error('BODIES must list every parent before its satellites');
}

/**
 * Advance the world to a Julian date.
 *
 * @param jd     Julian date.
 * @param morphT 0 = compressed/artistic scale, 1 = true scale.
 */
export function stepWorld(jd: number, morphT: number): void {
  const daysSinceEpoch = jd - J2000;

  for (let i = 0; i < N; i++) {
    const p = pre[i];
    const def = p.def;
    const o = i * 3;

    radii[i] = morphedRadius(def, morphT);
    spin[i] = (p.spinRate * daysSinceEpoch) % TAU;

    if (def.planetId) {
      propagate(PLANET_ELEMENTS[def.planetId], jd, eclipticScratch, 0);

      const ex = eclipticScratch[0];
      const ey = eclipticScratch[1];
      const ez = eclipticScratch[2];
      const rAU = Math.sqrt(ex * ex + ey * ey + ez * ez);
      distanceAU[i] = rAU;

      // Interpolate the *distance* rather than the position so the direction
      // is exact at every morph value and planets never drift off their orbit.
      const trueUnits = rAU * AU;
      const compressedUnits = compressDistance(rAU);
      const target = compressedUnits + (trueUnits - compressedUnits) * morphT;
      const k = rAU > 0 ? target / (rAU * AU) : 0;

      // Ecliptic (x, y, z) -> scene (x, z, -y). Determinant +1.
      absPos[o] = ex * AU * k;
      absPos[o + 1] = ez * AU * k;
      absPos[o + 2] = -ey * AU * k;
    } else if (def.satellite && p.parentIndex >= 0) {
      const po = p.parentIndex * 3;
      const dist =
        p.compressedSatDistance +
        (p.trueSatDistance - p.compressedSatDistance) * morphT;

      propagateSatellite(
        dist,
        def.satellite.periodDays,
        def.satellite.inclinationDeg,
        def.satellite.phase,
        jd,
        satScratch,
        0
      );

      absPos[o] = absPos[po] + satScratch[0];
      absPos[o + 1] = absPos[po + 1] + satScratch[1];
      absPos[o + 2] = absPos[po + 2] + satScratch[2];
      distanceAU[i] = distanceAU[p.parentIndex];
    } else {
      // The Sun sits at the origin of the heliocentric frame.
      absPos[o] = 0;
      absPos[o + 1] = 0;
      absPos[o + 2] = 0;
      distanceAU[i] = 0;
    }
  }
}

/** True (unmorphed) radius in scene units, for the scale-comparison UI. */
export function trueRadiusUnits(id: string): number {
  return pre[bodyIndex[id]].trueRadiusUnits;
}

/** Obliquity in radians, precomputed for the driver. */
export const obliquityRad = new Float64Array(BODIES.map((b) => b.obliquityDeg * DEG2RAD));

/** Squared distance between two bodies this frame, in scene units. */
export function distanceBetween(aIndex: number, bIndex: number): number {
  const ao = aIndex * 3;
  const bo = bIndex * 3;
  const dx = absPos[ao] - absPos[bo];
  const dy = absPos[ao + 1] - absPos[bo + 1];
  const dz = absPos[ao + 2] - absPos[bo + 2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export const BODY_COUNT = N;
