import { describe, it, expect, beforeEach } from 'vitest';
import {
  BODIES,
  BODY_BY_ID,
  compressDistance,
  morphedRadius,
} from '../data/bodies';
import { absPos, bodyIndex, distanceAU, radii, stepWorld } from '../sim/world';
import { floatingOrigin } from '../sim/floatingOrigin';
import { AU, J2000, KM_PER_UNIT } from '../sim/constants';
import { __setClock, quality } from '../perf/QualityManager';

const ITERATIONS = 500_000;

describe('world state', () => {
  it('places every parent before its satellites', () => {
    // A single forward pass resolves moon positions only if this holds.
    for (let i = 0; i < BODIES.length; i++) {
      const parent = BODIES[i].parent;
      if (parent) expect(bodyIndex[parent]).toBeLessThan(i);
    }
  });

  it('keeps the Sun at the origin', () => {
    stepWorld(J2000, 0);
    const i = bodyIndex.sun * 3;
    expect(absPos[i]).toBe(0);
    expect(absPos[i + 1]).toBe(0);
    expect(absPos[i + 2]).toBe(0);
  });

  it('puts every planet outside the Sun in compressed mode', () => {
    // The naive scaling this replaced put Mercury *inside* the photosphere.
    stepWorld(J2000, 0);
    const sunRadius = radii[bodyIndex.sun];
    for (const body of BODIES) {
      if (!body.planetId) continue;
      const i = bodyIndex[body.id] * 3;
      const r = Math.hypot(absPos[i], absPos[i + 1], absPos[i + 2]);
      expect(r, `${body.id} clears the Sun`).toBeGreaterThan(sunRadius * 1.5);
    }
  });

  it('preserves orbital ordering in compressed mode', () => {
    stepWorld(J2000, 0);
    const order = [
      'mercury',
      'venus',
      'earth',
      'mars',
      'jupiter',
      'saturn',
      'uranus',
      'neptune',
    ];
    let previous = 0;
    for (const id of order) {
      const i = bodyIndex[id] * 3;
      const r = Math.hypot(absPos[i], absPos[i + 1], absPos[i + 2]);
      expect(r, `${id} is further out than the last`).toBeGreaterThan(previous);
      previous = r;
    }
  });

  it('reaches true scale at morph = 1', () => {
    stepWorld(J2000, 1);
    for (const body of BODIES) {
      if (!body.planetId) continue;
      const i = bodyIndex[body.id];
      const r = Math.hypot(absPos[i * 3], absPos[i * 3 + 1], absPos[i * 3 + 2]);
      // Distance in scene units should equal the AU distance times AU.
      expect(r / AU).toBeCloseTo(distanceAU[i], 6);
      // And radius should equal the real radius.
      expect(radii[i]).toBeCloseTo(body.radiusKm / KM_PER_UNIT, 6);
    }
  });

  it('keeps moons near their parents', () => {
    stepWorld(J2000, 0);
    for (const body of BODIES) {
      if (!body.satellite || !body.parent) continue;
      const i = bodyIndex[body.id] * 3;
      const p = bodyIndex[body.parent] * 3;
      const d = Math.hypot(
        absPos[i] - absPos[p],
        absPos[i + 1] - absPos[p + 1],
        absPos[i + 2] - absPos[p + 2]
      );
      const parentRadius = radii[bodyIndex[body.parent]];
      expect(d, `${body.id} is outside its parent`).toBeGreaterThan(
        parentRadius
      );
      expect(d, `${body.id} is not flung away`).toBeLessThan(parentRadius * 20);
    }
  });

  /**
   * Requires `--expose-gc`, which `vitest.config.ts` passes to the fork pool.
   * Skipped loudly rather than degraded quietly: reading `heapUsed` without a
   * forced collection measures GC scheduling instead of allocation.
   */
  const canMeasureHeap = typeof globalThis.gc === 'function';

  it.skipIf(!canMeasureHeap)('does not allocate per frame', () => {
    const run = (iterations: number) => {
      for (let i = 0; i < iterations; i++) {
        stepWorld(J2000 + i * 0.01, (i % 100) / 100);
      }
    };

    // A long warmup is essential, and the reason is not obvious. V8 tiers this
    // loop up through several compilers, and the compiler's *own* heap
    // allocations -- feedback vectors, optimised code objects, deopt data --
    // are counted by `heapUsed`. Measuring after only a few thousand
    // iterations attributes ~4.7 MB of one-off compilation to the loop body.
    // That figure is stable to within 0.05% across machines, so it looks
    // convincingly like a real leak rather than like measurement error.
    run(300_000);

    globalThis.gc!();
    globalThis.gc!();

    const before = process.memoryUsage().heapUsed;
    run(ITERATIONS);
    const growth = process.memoryUsage().heapUsed - before;

    // Half a million steps over 25 bodies. Allocating even one small object
    // per step would be tens of megabytes; a genuinely allocation-free loop
    // sits in the low kilobytes.
    expect(
      growth,
      `${ITERATIONS} steps grew the heap by ${growth} bytes (${(growth / ITERATIONS).toFixed(3)} per step)`
    ).toBeLessThan(ITERATIONS * 0.5);
  });

  it('morphs radius monotonically between the two scales', () => {
    const earth = BODY_BY_ID.earth;
    const compressed = morphedRadius(earth, 0);
    const half = morphedRadius(earth, 0.5);
    const full = morphedRadius(earth, 1);
    expect(compressed).toBe(earth.displayRadius);
    expect(full).toBeCloseTo(earth.radiusKm / KM_PER_UNIT, 6);
    expect(half).toBeGreaterThan(compressed);
    expect(half).toBeLessThan(full);
  });

  it('compresses distance monotonically', () => {
    let previous = 0;
    for (const au of [0.387, 0.723, 1, 1.524, 5.2, 9.58, 19.2, 30.1, 39.5]) {
      const d = compressDistance(au);
      expect(d).toBeGreaterThan(previous);
      previous = d;
    }
  });
});

describe('floating origin', () => {
  beforeEach(() => floatingOrigin.reset());

  it('preserves relative geometry exactly through a rebase', () => {
    stepWorld(J2000, 0);

    const earth = bodyIndex.earth * 3;
    const mars = bodyIndex.mars * 3;
    const before = Math.hypot(
      absPos[earth] - absPos[mars],
      absPos[earth + 1] - absPos[mars + 1],
      absPos[earth + 2] - absPos[mars + 2]
    );

    floatingOrigin.moveTo(absPos[earth], absPos[earth + 1], absPos[earth + 2]);

    const rel = (i: number, axis: number) =>
      absPos[i + axis] - floatingOrigin.origin[axis];
    const after = Math.hypot(
      rel(earth, 0) - rel(mars, 0),
      rel(earth, 1) - rel(mars, 1),
      rel(earth, 2) - rel(mars, 2)
    );

    expect(after).toBeCloseTo(before, 9);
  });

  it('keeps the focused body at sub-metre distance from the scene origin', () => {
    // This is the whole point: Neptune sits 4.5e6 units out, where float32 has
    // ~500 m of resolution. Rebasing onto it brings the rendered magnitude to
    // zero so precision is available for surface detail.
    stepWorld(J2000, 1);
    const n = bodyIndex.neptune * 3;
    floatingOrigin.moveTo(absPos[n], absPos[n + 1], absPos[n + 2]);
    const rendered = Math.hypot(
      absPos[n] - floatingOrigin.origin[0],
      absPos[n + 1] - floatingOrigin.origin[1],
      absPos[n + 2] - floatingOrigin.origin[2]
    );
    expect(rendered).toBeLessThan(1e-3);
  });

  it('notifies registered holders with the exact delta', () => {
    const seen: number[][] = [];
    const off = floatingOrigin.register({
      applyOriginShift: (dx, dy, dz) => seen.push([dx, dy, dz]),
    });
    floatingOrigin.moveTo(100, -200, 300);
    floatingOrigin.moveTo(150, -200, 300);
    off();
    floatingOrigin.moveTo(0, 0, 0);

    expect(seen).toEqual([
      [100, -200, 300],
      [50, 0, 0],
    ]);
  });
});

describe('adaptive quality', () => {
  let now = 0;

  beforeEach(() => {
    now = 0;
    __setClock(() => now);
    quality.reset('high');
    quality.locked = false;
    quality.budgetMs = 1000 / 60;
  });

  const feed = (frameMs: number, seconds: number) => {
    const frames = Math.round((seconds * 1000) / frameMs);
    for (let i = 0; i < frames; i++) {
      now += frameMs;
      quality.sample(frameMs);
    }
  };

  it('demotes under sustained overrun', () => {
    expect(quality.tierName).toBe('high');
    feed(40, 8); // way over a 16.7 ms budget
    expect(quality.tierName).not.toBe('high');
  });

  it('does not demote on a brief spike', () => {
    feed(8, 3);
    // One bad half-second, then recovery. p95 must not swing the tier.
    feed(60, 0.3);
    feed(8, 1);
    expect(quality.tierName).toBe('high');
  });

  it('promotes when there is sustained headroom, then stops at the ceiling', () => {
    quality.reset('balanced');
    feed(5, 30);
    expect(['high', 'ultra']).toContain(quality.tierName);
  });

  it('respects a manual lock', () => {
    quality.locked = true;
    quality.reset('ultra');
    quality.locked = true;
    feed(90, 15);
    expect(quality.tierName).toBe('ultra');
  });

  it('reports percentiles, not the mean', () => {
    // 95% fast frames, 5% catastrophic. The mean would look acceptable; p95
    // must not.
    for (let i = 0; i < 240; i++) {
      now += 8;
      quality.sample(i % 20 === 0 ? 200 : 8);
    }
    expect(quality.stats.p50).toBeLessThan(12);
    expect(quality.stats.p95).toBeGreaterThan(50);
  });
});
