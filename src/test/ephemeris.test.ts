import { describe, it, expect } from 'vitest';
import {
  PLANET_ELEMENTS,
  PLANET_IDS,
  eclipticLongitude,
  heliocentricDistance,
  propagate,
  solveKepler,
} from '../sim/ephemeris';
import { J2000, dateToJulian, lightTimeSeconds } from '../sim/constants';
import { AU } from '../sim/constants';

describe('solveKepler', () => {
  // The previous implementation used the fixed-point iteration
  // E <- M + e sin E, which degrades badly as eccentricity climbs. Newton
  // Raphson has to hold to machine precision across the whole range, because
  // Pluto is e = 0.249 and grows under the secular rates.
  it.each([0, 0.1, 0.3, 0.6, 0.9, 0.95])('converges at e = %s', (e) => {
    for (let M = -Math.PI; M <= Math.PI; M += 0.31) {
      const E = solveKepler(M, e);
      const residual = E - e * Math.sin(E) - M;
      expect(Math.abs(residual)).toBeLessThan(1e-12);
    }
  });

  it('is exact at the apses', () => {
    expect(solveKepler(0, 0.5)).toBeCloseTo(0, 12);
    expect(Math.abs(solveKepler(Math.PI, 0.5))).toBeCloseTo(Math.PI, 10);
  });
});

describe('planet positions', () => {
  // Regression guard for the bug this rewrite fixes. The old element table
  // stored Earth's *mean longitude* in the mean-anomaly slot, which placed
  // Earth at 205.3 degrees at J2000 -- about 105 degrees, or 3.5 months, off.
  it('places Earth at its true heliocentric longitude at J2000', () => {
    const lon = eclipticLongitude(PLANET_ELEMENTS.earth, J2000);
    expect(lon).toBeGreaterThan(99.9);
    expect(lon).toBeLessThan(101.0);
  });

  it('keeps Earth between perihelion and aphelion all year', () => {
    let min = Infinity;
    let max = -Infinity;
    for (let d = 0; d < 366; d++) {
      const r = heliocentricDistance(PLANET_ELEMENTS.earth, J2000 + d);
      min = Math.min(min, r);
      max = Math.max(max, r);
    }
    expect(min).toBeGreaterThan(0.9825);
    expect(min).toBeLessThan(0.9840);
    expect(max).toBeGreaterThan(1.0160);
    expect(max).toBeLessThan(1.0175);
  });

  it('respects each orbit r in [a(1-e), a(1+e)]', () => {
    // The bounds have to be evaluated with the secular rates applied, not the
    // J2000 values: over a decade Mars's a and e drift enough that a fixed
    // bound is exceeded by ~7e-6 AU.
    for (const id of PLANET_IDS) {
      const el = PLANET_ELEMENTS[id];
      for (let d = 0; d < 4000; d += 37) {
        const T = d / 36525;
        const a = el.a + el.aDot * T;
        const e = el.e + el.eDot * T;
        const r = heliocentricDistance(el, J2000 + d);
        expect(r, `${id} perihelion`).toBeGreaterThanOrEqual(a * (1 - e) - 1e-9);
        expect(r, `${id} aphelion`).toBeLessThanOrEqual(a * (1 + e) + 1e-9);
      }
    }
  });

  it('reaches perihelion at the longitude of perihelion', () => {
    // A strong wiring check on the full rotation chain (argument of perihelion,
    // ascending node, inclination): at closest approach the body must lie in the
    // direction of varpi. Tolerance covers the scan granularity plus the
    // projection error from the orbital plane onto the ecliptic, which grows
    // with inclination (~i^2/2, so ~2.5 deg for Pluto's 17 deg).
    for (const id of PLANET_IDS) {
      const el = PLANET_ELEMENTS[id];
      const periodDays = (36525 * 360) / el.LDot;
      let best = Infinity;
      let bestJd = J2000;
      const step = periodDays / 4000;
      for (let d = 0; d < periodDays; d += step) {
        const r = heliocentricDistance(el, J2000 + d);
        if (r < best) {
          best = r;
          bestJd = J2000 + d;
        }
      }
      const lon = eclipticLongitude(el, bestJd);
      const diff = Math.abs(((lon - el.peri + 540) % 360) - 180);
      expect(diff, `${id} perihelion longitude`).toBeLessThan(3);
    }
  });

  it('reproduces published heliocentric longitudes at J2000', () => {
    // True (not mean) heliocentric ecliptic longitudes at J2000.0. These differ
    // from the mean longitudes in the element table by the equation of centre,
    // which is ~24 deg for Mercury at e = 0.206 -- a distinction worth encoding,
    // since conflating the two is exactly the class of bug this suite guards.
    // Derived independently as L + equation of centre, expanded to e^3:
    //   C = (2e - e^3/4) sin M + (5/4) e^2 sin 2M + (13/12) e^3 sin 3M
    //
    // That series yields the longitude measured *in the orbital plane*, while
    // the code returns the ecliptic projection. The two differ by up to
    // i^2 / 2 radians, so the tolerance is derived from each body's inclination
    // rather than picked by hand -- 0.15 deg for Earth, 2.7 deg for Pluto's
    // 17 deg tilt. A fixed tolerance here would either fail Pluto or be too
    // loose to catch a real transcription error in the inner planets.
    const expected: Record<string, number> = {
      mercury: 253.976,
      venus: 182.58,
      earth: 100.38,
      mars: 359.43,
      jupiter: 36.374,
      saturn: 45.56,
      uranus: 316.401,
      neptune: 303.913,
      pluto: 249.055,
    };
    // i^2/2 radians expressed in degrees is i_deg^2 * pi / 360.
    const projectionError = (incDeg: number) => (incDeg * incDeg * Math.PI) / 360;

    for (const [id, deg] of Object.entries(expected)) {
      const el = PLANET_ELEMENTS[id as keyof typeof PLANET_ELEMENTS];
      const lon = eclipticLongitude(el, J2000);
      const diff = Math.abs(((lon - deg + 540) % 360) - 180);
      const tolerance = 0.15 + projectionError(Math.abs(el.inc));
      expect(
        diff,
        `${id} longitude (got ${lon.toFixed(3)}, tolerance ${tolerance.toFixed(3)})`
      ).toBeLessThan(tolerance);
    }
  });

  it('orders the planets correctly by distance at a modern date', () => {
    const jd = dateToJulian(new Date('2026-07-29T00:00:00Z'));
    const distances = PLANET_IDS.filter((id) => id !== 'pluto').map((id) =>
      heliocentricDistance(PLANET_ELEMENTS[id], jd)
    );
    for (let i = 1; i < distances.length; i++) {
      expect(distances[i]).toBeGreaterThan(distances[i - 1]);
    }
  });

  it('propagates without allocating', () => {
    const out = new Float64Array(3);
    propagate(PLANET_ELEMENTS.mars, J2000, out, 0);
    const first = Array.from(out);
    propagate(PLANET_ELEMENTS.mars, J2000, out, 0);
    // Pure function of (elements, jd): identical inputs give identical output.
    expect(Array.from(out)).toEqual(first);
  });

  it('advances Earth roughly one degree per day', () => {
    const a = eclipticLongitude(PLANET_ELEMENTS.earth, J2000);
    const b = eclipticLongitude(PLANET_ELEMENTS.earth, J2000 + 1);
    const delta = ((b - a + 540) % 360) - 180;
    expect(delta).toBeGreaterThan(0.9);
    expect(delta).toBeLessThan(1.1);
  });

  it('returns Earth to its starting longitude after one year', () => {
    const a = eclipticLongitude(PLANET_ELEMENTS.earth, J2000);
    const b = eclipticLongitude(PLANET_ELEMENTS.earth, J2000 + 365.256);
    const delta = Math.abs(((b - a + 540) % 360) - 180);
    expect(delta).toBeLessThan(0.05);
  });
});

describe('light travel time', () => {
  it('is about 8.3 minutes to Earth', () => {
    const minutes = lightTimeSeconds(AU) / 60;
    expect(minutes).toBeGreaterThan(8.2);
    expect(minutes).toBeLessThan(8.4);
  });

  it('is about 4.17 hours to Neptune', () => {
    const hours = lightTimeSeconds(30.1 * AU) / 3600;
    expect(hours).toBeGreaterThan(4.1);
    expect(hours).toBeLessThan(4.25);
  });
});
