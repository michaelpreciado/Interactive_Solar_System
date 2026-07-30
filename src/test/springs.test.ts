import { describe, it, expect } from 'vitest';
import { AngleSpring, LogSpring, Spring, Spring3 } from '../sim/springs';

/**
 * The regression these guard: an earlier version of the integrator dropped a
 * factor of the timestep from the numerator, so springs converged to the wrong
 * value entirely. The visible symptom was the camera settling 2,480 AU from a
 * target it had been asked to sit 400 units from -- a blank screen, with no
 * error anywhere.
 */
function settle(spring: Spring, seconds = 6, dt = 1 / 60): number {
  for (let t = 0; t < seconds; t += dt) spring.step(dt);
  return spring.value;
}

describe('Spring', () => {
  it('converges to its target', () => {
    const s = new Spring(0, 0.25);
    s.target = 400;
    expect(settle(s)).toBeCloseTo(400, 4);
  });

  it('stays at its target when it starts there', () => {
    const s = new Spring(400, 0.25);
    s.target = 400;
    expect(settle(s)).toBeCloseTo(400, 6);
  });

  it('honours its half-life to within a frame', () => {
    const halfLife = 0.5;
    const s = new Spring(0, halfLife);
    s.target = 1;
    const dt = 1 / 240;
    for (let t = 0; t < halfLife; t += dt) s.step(dt);
    expect(s.value).toBeGreaterThan(0.47);
    expect(s.value).toBeLessThan(0.53);
  });

  it('never overshoots', () => {
    const s = new Spring(0, 0.2);
    s.target = 100;
    let max = -Infinity;
    for (let t = 0; t < 4; t += 1 / 60) max = Math.max(max, s.step(1 / 60));
    expect(max).toBeLessThanOrEqual(100.0001);
  });

  it('stays stable across a huge timestep', () => {
    // A backgrounded tab hands back multi-second deltas on return. Explicit
    // integration would diverge here. Each step is clamped to 100 ms, so 20
    // steps is 2 s of settling -- close to the target, not exactly on it. What
    // matters is that it stays finite and monotone rather than exploding.
    const s = new Spring(0, 0.2);
    s.target = 50;
    for (let i = 0; i < 20; i++) s.step(5);
    expect(Number.isFinite(s.value)).toBe(true);
    expect(Math.abs(s.value - 50)).toBeLessThan(0.01);
  });

  it('converges identically at 60 and 240 Hz', () => {
    const a = new Spring(0, 0.3);
    const b = new Spring(0, 0.3);
    a.target = 10;
    b.target = 10;
    for (let t = 0; t < 3; t += 1 / 60) a.step(1 / 60);
    for (let t = 0; t < 3; t += 1 / 240) b.step(1 / 240);
    expect(a.value).toBeCloseTo(b.value, 3);
  });

  it('reports settled only once it has arrived', () => {
    const s = new Spring(0, 0.2);
    s.target = 5;
    expect(s.settled).toBe(false);
    settle(s);
    expect(s.settled).toBe(true);
  });
});

describe('LogSpring', () => {
  it('converges across six orders of magnitude', () => {
    const s = new LogSpring(4.5e6, 0.5);
    s.target = 30;
    for (let t = 0; t < 8; t += 1 / 60) s.step(1 / 60);
    expect(s.value).toBeCloseTo(30, 2);
  });

  it('covers ground at a constant perceptual rate', () => {
    // Halfway through the transition a log spring should be near the geometric
    // mean, not the arithmetic one. That is the whole reason it exists: a
    // linear spring spends the entire flight crawling through the last 0.001%.
    const s = new LogSpring(1e6, 0.5);
    s.target = 1;
    for (let t = 0; t < 0.5; t += 1 / 240) s.step(1 / 240);
    expect(s.value).toBeLessThan(5000);
    expect(s.value).toBeGreaterThan(50);
  });
});

describe('AngleSpring', () => {
  it('takes the short way around', () => {
    const s = new AngleSpring(3.0, 0.2);
    s.target = -3.0; // 0.28 rad away the short way, 6.0 the long way
    let travelled = 0;
    let prev = s.value;
    for (let t = 0; t < 3; t += 1 / 60) {
      const v = s.step(1 / 60);
      travelled += Math.abs(v - prev);
      prev = v;
    }
    expect(travelled).toBeLessThan(1.0);
  });
});

describe('Spring3', () => {
  it('shifts without disturbing spring state -- the floating-origin path', () => {
    const s = new Spring3(100, 200, 300, 0.3);
    s.setTarget(150, 250, 350);
    s.step(1 / 60);

    const before = { x: s.x.value, y: s.y.value, z: s.z.value };
    const beforeVel = { x: s.x.velocity, y: s.y.velocity, z: s.z.velocity };

    s.shift(1000, 2000, 3000);

    // Relative geometry must be preserved exactly, or the camera jumps on the
    // frame the origin rebases.
    expect(s.x.value).toBeCloseTo(before.x - 1000, 9);
    expect(s.y.value).toBeCloseTo(before.y - 2000, 9);
    expect(s.z.value).toBeCloseTo(before.z - 3000, 9);
    expect(s.x.target).toBeCloseTo(150 - 1000, 9);
    expect(s.x.velocity).toBe(beforeVel.x);
    expect(s.y.velocity).toBe(beforeVel.y);
    expect(s.z.velocity).toBe(beforeVel.z);
  });
});
