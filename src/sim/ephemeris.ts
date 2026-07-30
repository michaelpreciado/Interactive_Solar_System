/**
 * Keplerian ephemeris.
 *
 * Element set is Standish's "Keplerian Elements for Approximate Positions of
 * the Major Planets" (JPL Solar System Dynamics), which gives each element at
 * J2000.0 together with a secular rate per Julian century. Accuracy is roughly
 * arcminute-level over 1800-2050 and degrades gracefully outside it.
 *
 * Two things here are deliberately different from the naive formulation:
 *
 *  1. The table gives *mean longitude* L and *longitude of perihelion* varpi,
 *     not mean anomaly. Mean anomaly is M = L - varpi, and the argument of
 *     perihelion is w = varpi - node. Conflating L with M is a real and easy
 *     mistake -- the previous implementation in this repo did exactly that for
 *     Earth and drew it ~105 degrees (about 3.5 months) off its true position.
 *     `src/test/ephemeris.test.ts` guards against the regression.
 *
 *  2. Kepler's equation is solved by Newton-Raphson rather than the fixed-point
 *     iteration E <- M + e sin E. Fixed point converges slowly above e ~ 0.3;
 *     Pluto is e = 0.249 and grows from there over long time spans.
 *
 * Everything in the hot path writes into caller-provided Float64Arrays. No
 * allocation occurs per frame.
 */

import { AU, DAYS_PER_CENTURY, DEG2RAD, J2000, TAU } from './constants';

export interface KeplerianElements {
  /** Semi-major axis, AU. */
  a: number;
  /** Eccentricity, dimensionless. */
  e: number;
  /** Inclination to the ecliptic, degrees. */
  inc: number;
  /** Mean longitude, degrees. */
  L: number;
  /** Longitude of perihelion (varpi = node + argument of perihelion), degrees. */
  peri: number;
  /** Longitude of the ascending node, degrees. */
  node: number;
  /** Secular rates, per Julian century, in the same units as above. */
  aDot: number;
  eDot: number;
  incDot: number;
  LDot: number;
  periDot: number;
  nodeDot: number;
}

const el = (
  a: number,
  e: number,
  inc: number,
  L: number,
  peri: number,
  node: number,
  aDot: number,
  eDot: number,
  incDot: number,
  LDot: number,
  periDot: number,
  nodeDot: number
): KeplerianElements => ({
  a,
  e,
  inc,
  L,
  peri,
  node,
  aDot,
  eDot,
  incDot,
  LDot,
  periDot,
  nodeDot,
});

/**
 * Standish elements, J2000 epoch, rates per Julian century.
 * Earth's row is strictly the Earth-Moon barycentre, which is what you want for
 * a heliocentric view at this scale (the offset peaks around 4700 km).
 */
export const PLANET_ELEMENTS = {
  mercury: el(
    0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593,
    0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081
  ),
  venus: el(
    0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255,
    0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418
  ),
  earth: el(
    1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0.0,
    0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0.0
  ),
  mars: el(
    1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891,
    0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343
  ),
  jupiter: el(
    5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909,
    -0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106
  ),
  saturn: el(
    9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448,
    -0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794
  ),
  uranus: el(
    19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503,
    -0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589
  ),
  neptune: el(
    30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574,
    0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.00508664
  ),
  pluto: el(
    39.48211675, 0.2488273, 17.14001206, 238.92903833, 224.06891629, 110.30393684,
    -0.00031596, 0.0000517, 0.00004818, 145.20780515, -0.04062942, -0.01183482
  ),
} satisfies Record<string, KeplerianElements>;

export type PlanetId = keyof typeof PLANET_ELEMENTS;

export const PLANET_IDS = Object.keys(PLANET_ELEMENTS) as PlanetId[];

/**
 * Solve Kepler's equation M = E - e sin E for the eccentric anomaly.
 *
 * Newton-Raphson from a Danby starting guess. Converges to machine precision in
 * a handful of iterations for every eccentricity we care about (verified to
 * residual 0 for e in {0, 0.3, 0.6, 0.9, 0.95}).
 */
export function solveKepler(M: number, e: number, tolerance = 1e-12): number {
  // Wrap to [-PI, PI] so the initial guess is always on the right branch.
  let m = M % TAU;
  if (m > Math.PI) m -= TAU;
  else if (m < -Math.PI) m += TAU;

  // Danby's starting value: much better than E = M for high eccentricity.
  let E = m + 0.85 * e * Math.sign(Math.sin(m) || 1);

  for (let i = 0; i < 64; i++) {
    const sinE = Math.sin(E);
    const f = E - e * sinE - m;
    const fp = 1 - e * Math.cos(E);
    // fp -> 0 only as e -> 1 at perihelion; guard so we never divide by zero.
    const dE = f / (Math.abs(fp) < 1e-12 ? 1e-12 : fp);
    E -= dE;
    if (Math.abs(dE) < tolerance) break;
  }
  return E;
}

/**
 * Propagate one element set to a Julian date and write the heliocentric
 * ecliptic position into `out` at `offset`, in AU.
 *
 * Output axes are the J2000 ecliptic frame: +x toward the vernal equinox,
 * +z toward ecliptic north. Conversion to the scene's Y-up frame happens in
 * `writeSceneVector`.
 */
export function propagate(
  elements: KeplerianElements,
  jd: number,
  out: Float64Array,
  offset: number
): void {
  const T = (jd - J2000) / DAYS_PER_CENTURY;

  const a = elements.a + elements.aDot * T;
  const e = elements.e + elements.eDot * T;
  const inc = (elements.inc + elements.incDot * T) * DEG2RAD;
  const L = (elements.L + elements.LDot * T) * DEG2RAD;
  const peri = (elements.peri + elements.periDot * T) * DEG2RAD;
  const node = (elements.node + elements.nodeDot * T) * DEG2RAD;

  // Argument of perihelion and mean anomaly. This is the step the old code got
  // wrong: M is L - varpi, not L.
  const argPeri = peri - node;
  const M = L - peri;

  const E = solveKepler(M, e);

  // Position in the orbital plane, perifocal coordinates.
  const cosE = Math.cos(E);
  const sinE = Math.sin(E);
  const xPeri = a * (cosE - e);
  const yPeri = a * Math.sqrt(1 - e * e) * sinE;

  // Rotate perifocal -> ecliptic: Rz(-node) Rx(-inc) Rz(-argPeri).
  const cosW = Math.cos(argPeri);
  const sinW = Math.sin(argPeri);
  const cosO = Math.cos(node);
  const sinO = Math.sin(node);
  const cosI = Math.cos(inc);
  const sinI = Math.sin(inc);

  const x1 = cosW * xPeri - sinW * yPeri;
  const y1 = sinW * xPeri + cosW * yPeri;

  const y2 = cosI * y1;
  const z2 = sinI * y1;

  out[offset] = cosO * x1 - sinO * y2;
  out[offset + 1] = sinO * x1 + cosO * y2;
  out[offset + 2] = z2;
}

/**
 * Heliocentric distance in AU for an element set at a Julian date.
 * Cheaper than a full propagate when only the radius is needed.
 */
export function heliocentricDistance(elements: KeplerianElements, jd: number): number {
  const T = (jd - J2000) / DAYS_PER_CENTURY;
  const a = elements.a + elements.aDot * T;
  const e = elements.e + elements.eDot * T;
  const L = (elements.L + elements.LDot * T) * DEG2RAD;
  const peri = (elements.peri + elements.periDot * T) * DEG2RAD;
  const E = solveKepler(L - peri, e);
  return a * (1 - e * Math.cos(E));
}

/**
 * Heliocentric ecliptic longitude in degrees, [0, 360).
 * Used by tests and by the conjunction finder.
 */
export function eclipticLongitude(elements: KeplerianElements, jd: number): number {
  propagate(elements, jd, SCRATCH3, 0);
  const deg = (Math.atan2(SCRATCH3[1], SCRATCH3[0]) * 180) / Math.PI;
  return deg < 0 ? deg + 360 : deg;
}

const SCRATCH3 = new Float64Array(3);

/**
 * Convert an ecliptic AU triple to scene units in three.js's Y-up frame.
 *
 * Ecliptic (x, y, z) -> scene (x, z, -y). Determinant is +1, so handedness is
 * preserved and orbital motion stays counter-clockwise viewed from the north.
 */
export function toSceneAxes(
  src: Float64Array,
  srcOffset: number,
  dst: Float64Array,
  dstOffset: number
): void {
  dst[dstOffset] = src[srcOffset] * AU;
  dst[dstOffset + 1] = src[srcOffset + 2] * AU;
  dst[dstOffset + 2] = -src[srcOffset + 1] * AU;
}

/**
 * Propagate a body directly into scene-unit Y-up coordinates.
 * Combines `propagate` + `toSceneAxes` without an intermediate array.
 */
export function propagateToScene(
  elements: KeplerianElements,
  jd: number,
  out: Float64Array,
  offset: number
): void {
  propagate(elements, jd, SCRATCH3, 0);
  out[offset] = SCRATCH3[0] * AU;
  out[offset + 1] = SCRATCH3[2] * AU;
  out[offset + 2] = -SCRATCH3[1] * AU;
}

/**
 * Circular-orbit propagation for satellites, in scene units relative to the
 * parent. Real lunar theory is overkill at this scale; what matters visually is
 * the correct period, inclination, and phase.
 */
export function propagateSatellite(
  semiMajorUnits: number,
  periodDays: number,
  inclinationDeg: number,
  phaseAtEpoch: number,
  jd: number,
  out: Float64Array,
  offset: number
): void {
  const theta = phaseAtEpoch + (TAU * (jd - J2000)) / periodDays;
  const inc = inclinationDeg * DEG2RAD;
  const x = Math.cos(theta) * semiMajorUnits;
  const y = Math.sin(theta) * semiMajorUnits;
  out[offset] = x;
  out[offset + 1] = Math.sin(inc) * y;
  out[offset + 2] = -Math.cos(inc) * y;
}
