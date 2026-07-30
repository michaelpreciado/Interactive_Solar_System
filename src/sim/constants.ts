/**
 * Units and physical constants.
 *
 * Scene unit convention: 1 unit = 1000 km (one megametre).
 * Earth radius = 6.371 units, 1 AU = 149597.8707 units, Neptune ~4.5e6 units.
 *
 * Positions are computed and stored in Float64 in this module's units, then
 * rebased through the floating origin before ever touching a float32 Object3D
 * matrix. See `src/sim/floatingOrigin.ts`.
 */

/** Kilometres per scene unit. */
export const KM_PER_UNIT = 1000;

/** Astronomical unit in kilometres (IAU 2012 definition). */
export const AU_KM = 149597870.7;

/** Astronomical unit in scene units. */
export const AU = AU_KM / KM_PER_UNIT;

/** Speed of light in km/s. */
export const C_KM_S = 299792.458;

/** Julian date of the J2000.0 epoch (2000-01-01T12:00:00 TT). */
export const J2000 = 2451545.0;

/** Julian date of the Unix epoch (1970-01-01T00:00:00 UTC). */
export const UNIX_EPOCH_JD = 2440587.5;

/** Days in a Julian century. */
export const DAYS_PER_CENTURY = 36525;

/** Mean solar day in milliseconds. */
export const MS_PER_DAY = 86400000;

export const DEG2RAD = Math.PI / 180;
export const RAD2DEG = 180 / Math.PI;
export const TAU = Math.PI * 2;

/** Obliquity of the ecliptic at J2000, in radians. */
export const OBLIQUITY_J2000 = 23.43928 * DEG2RAD;

/** Convert a JavaScript Date to a Julian date. */
export function dateToJulian(date: Date): number {
  return date.getTime() / MS_PER_DAY + UNIX_EPOCH_JD;
}

/** Convert a Julian date to a JavaScript Date. Only meaningful in years 1..9999. */
export function julianToDate(jd: number): Date {
  return new Date((jd - UNIX_EPOCH_JD) * MS_PER_DAY);
}

/** Julian centuries elapsed since J2000.0. */
export function centuriesSinceJ2000(jd: number): number {
  return (jd - J2000) / DAYS_PER_CENTURY;
}

/** Light travel time in seconds across a distance given in scene units. */
export function lightTimeSeconds(distanceUnits: number): number {
  return (distanceUnits * KM_PER_UNIT) / C_KM_S;
}

/** Normalise an angle in degrees to [0, 360). */
export function normalizeDegrees(deg: number): number {
  const r = deg % 360;
  return r < 0 ? r + 360 : r;
}

/** Normalise an angle in radians to [-PI, PI]. */
export function wrapRadians(rad: number): number {
  let r = (rad + Math.PI) % TAU;
  if (r < 0) r += TAU;
  return r - Math.PI;
}
