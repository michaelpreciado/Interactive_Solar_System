/**
 * Critically-damped springs.
 *
 * Used for every animated value that a user can interrupt: camera distance,
 * camera target, the scale morph, panel accents. Springs beat easing curves
 * here because retargeting mid-flight is continuous -- there is no "restart the
 * tween from a new start value" discontinuity, and no overshoot to tune away.
 *
 * The implementation is the standard semi-implicit critically-damped solver,
 * which is unconditionally stable at any timestep (unlike naive explicit
 * integration, which explodes when a tab is backgrounded and dt spikes).
 */

/**
 * Convert a half-life into an angular frequency.
 *
 * For a critically damped system x(t) = (1 + wt)e^(-wt), so the value reaches
 * halfway when wt ~= 1.6783. Using ln2 here (the first-order answer) would make
 * every transition about 2.4x slower than its stated half-life.
 */
const CRITICAL_HALF_LIFE = 1.6783469900166605;

export const omegaFor = (halfLifeSeconds: number): number =>
  CRITICAL_HALF_LIFE / Math.max(halfLifeSeconds, 1e-4);

export class Spring {
  value: number;
  target: number;
  velocity = 0;
  omega: number;

  constructor(initial: number, halfLifeSeconds = 0.25) {
    this.value = initial;
    this.target = initial;
    this.omega = omegaFor(halfLifeSeconds);
  }

  setHalfLife(seconds: number): void {
    this.omega = omegaFor(seconds);
  }

  /** Jump immediately, killing velocity. Used for reduced-motion. */
  snap(value: number): void {
    this.value = value;
    this.target = value;
    this.velocity = 0;
  }

  step(dt: number): number {
    const w = this.omega;
    // Clamp: a backgrounded tab can hand us a multi-second dt.
    const h = dt > 0.1 ? 0.1 : dt;

    // Semi-implicit critically damped integration. Unconditionally stable at
    // any timestep, unlike explicit integration, which explodes when dt spikes.
    const f = 1 + 2 * h * w;
    const oo = w * w;
    const hoo = h * oo;
    const hhoo = h * hoo;
    const detInv = 1 / (f + hhoo);

    const detX = f * this.value + h * this.velocity + hhoo * this.target;
    const detV = this.velocity + hoo * (this.target - this.value);

    this.value = detX * detInv;
    this.velocity = detV * detInv;
    return this.value;
  }

  get settled(): boolean {
    return (
      Math.abs(this.target - this.value) < 1e-4 && Math.abs(this.velocity) < 1e-4
    );
  }
}

/** Three independent springs sharing a frequency, for positions. */
export class Spring3 {
  readonly x: Spring;
  readonly y: Spring;
  readonly z: Spring;

  constructor(x = 0, y = 0, z = 0, halfLife = 0.25) {
    this.x = new Spring(x, halfLife);
    this.y = new Spring(y, halfLife);
    this.z = new Spring(z, halfLife);
  }

  setTarget(x: number, y: number, z: number): void {
    this.x.target = x;
    this.y.target = y;
    this.z.target = z;
  }

  setHalfLife(seconds: number): void {
    this.x.setHalfLife(seconds);
    this.y.setHalfLife(seconds);
    this.z.setHalfLife(seconds);
  }

  snap(x: number, y: number, z: number): void {
    this.x.snap(x);
    this.y.snap(y);
    this.z.snap(z);
  }

  step(dt: number): void {
    this.x.step(dt);
    this.y.step(dt);
    this.z.step(dt);
  }

  /** Shift by a delta without disturbing the spring state -- floating origin. */
  shift(dx: number, dy: number, dz: number): void {
    this.x.value -= dx;
    this.x.target -= dx;
    this.y.value -= dy;
    this.y.target -= dy;
    this.z.value -= dz;
    this.z.target -= dz;
  }

  get settled(): boolean {
    return this.x.settled && this.y.settled && this.z.settled;
  }
}

/**
 * A spring on the logarithm of a value.
 *
 * Camera distance spans six orders of magnitude. A linear spring from 4.5e6 to
 * 30 spends almost the whole transition crawling through the last 0.001% of the
 * distance; a log spring covers ground at a constant *perceptual* rate, which
 * is what makes a fly-to from the system view to a cloud top feel like one
 * continuous move rather than a slam followed by a crawl.
 */
export class LogSpring {
  private readonly inner: Spring;

  constructor(initial: number, halfLife = 0.5) {
    this.inner = new Spring(Math.log(Math.max(initial, 1e-6)), halfLife);
  }

  get value(): number {
    return Math.exp(this.inner.value);
  }

  get target(): number {
    return Math.exp(this.inner.target);
  }

  set target(v: number) {
    this.inner.target = Math.log(Math.max(v, 1e-6));
  }

  setHalfLife(seconds: number): void {
    this.inner.setHalfLife(seconds);
  }

  snap(v: number): void {
    this.inner.snap(Math.log(Math.max(v, 1e-6)));
  }

  step(dt: number): number {
    this.inner.step(dt);
    return this.value;
  }

  get settled(): boolean {
    return this.inner.settled;
  }
}

/** Shortest-path angular spring, so azimuth never takes the long way round. */
export class AngleSpring {
  private readonly inner: Spring;
  private _target: number;

  constructor(initial: number, halfLife = 0.3) {
    this.inner = new Spring(initial, halfLife);
    this._target = initial;
  }

  get value(): number {
    return this.inner.value;
  }

  get target(): number {
    return this._target;
  }

  set target(v: number) {
    this._target = v;
    // Unwrap relative to the current value so we always rotate the short way.
    let delta = v - this.inner.value;
    delta = ((delta + Math.PI) % (Math.PI * 2)) - Math.PI;
    if (delta < -Math.PI) delta += Math.PI * 2;
    this.inner.target = this.inner.value + delta;
  }

  setHalfLife(seconds: number): void {
    this.inner.setHalfLife(seconds);
  }

  snap(v: number): void {
    this.inner.snap(v);
    this._target = v;
  }

  step(dt: number): number {
    return this.inner.step(dt);
  }

  get settled(): boolean {
    return this.inner.settled;
  }
}
