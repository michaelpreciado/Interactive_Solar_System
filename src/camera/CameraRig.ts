/**
 * The camera.
 *
 * Four modes over one spring-driven state vector:
 *
 *   ORBIT   spherical orbit around the focused body
 *   FOLLOW  same, but the target tracks the body as it moves along its orbit,
 *           so a planet you are circling doesn't slide out from under you
 *   FREE    6-DOF flight, WASD plus pointer drag
 *
 * Transitions use critically-damped springs rather than tweens, so a fly-to is
 * interruptible at any instant with no discontinuity and no overshoot. Distance
 * springs in *log space*: the range from a system view to a cloud top is six
 * orders of magnitude, and a linear spring spends the whole transition crawling
 * through the last fraction of a percent.
 */

import { PerspectiveCamera, Spherical, Vector3 } from 'three';
import { AngleSpring, LogSpring, Spring3 } from '../sim/springs';
import { floatingOrigin, type Rebasable } from '../sim/floatingOrigin';

export type RigMode = 'orbit' | 'follow' | 'free';

const UP = new Vector3(0, 1, 0);
const MIN_POLAR = 0.02;
const MAX_POLAR = Math.PI - 0.02;

export class CameraRig implements Rebasable {
  mode: RigMode = 'orbit';

  /** Scene-space point the camera orbits. */
  readonly target = new Spring3(0, 0, 0, 0.35);
  readonly distance = new LogSpring(400, 0.55);
  readonly azimuth = new AngleSpring(0.6, 0.4);
  readonly polar = new AngleSpring(1.15, 0.4);

  /** Free-flight state. */
  readonly freePosition = new Vector3();
  private readonly freeVelocity = new Vector3();
  private freeYaw = 0;
  private freePitch = 0;

  /** Minimum orbit distance, set from the focused body's radius each frame. */
  minDistance = 1;
  maxDistance = 5e7;

  /** Set true to collapse all springs to instant, for reduced motion. */
  instant = false;

  /**
   * Shift the focused body up the screen, as a fraction of viewport height.
   *
   * On a phone the HUD occupies the lower two thirds, so a subject centred in
   * the canvas renders behind the inspector. This is a pure screen-space pan --
   * the camera slides along its own up axis without re-aiming -- so the viewing
   * angle, distance and terminator are all unchanged.
   */
  screenBias = 0;

  private readonly scratch = new Vector3();
  private readonly spherical = new Spherical();
  private unregister: () => void;

  constructor() {
    this.unregister = floatingOrigin.register(this);
  }

  dispose(): void {
    this.unregister();
  }

  /** Floating-origin rebase. Missing any of these produces a one-frame jump. */
  applyOriginShift(dx: number, dy: number, dz: number): void {
    this.target.shift(dx, dy, dz);
    this.freePosition.x -= dx;
    this.freePosition.y -= dy;
    this.freePosition.z -= dz;
  }

  /** Point the rig at a scene-space position without moving the camera. */
  setTarget(x: number, y: number, z: number): void {
    this.target.setTarget(x, y, z);
    if (this.instant) this.target.snap(x, y, z);
  }

  snapTarget(x: number, y: number, z: number): void {
    this.target.snap(x, y, z);
  }

  /**
   * Begin a fly-to. Interruptible: calling again mid-flight simply retargets
   * the springs, which is why this never needs a "cancel the previous tween"
   * code path.
   */
  flyTo(
    x: number,
    y: number,
    z: number,
    distance: number,
    options: { azimuth?: number; polar?: number; duration?: number } = {}
  ): void {
    const half = (options.duration ?? 1.8) * 0.32;
    this.target.setHalfLife(half);
    this.distance.setHalfLife(half * 1.15);
    this.azimuth.setHalfLife(half);
    this.polar.setHalfLife(half);

    this.target.setTarget(x, y, z);
    this.distance.target = clamp(distance, this.minDistance, this.maxDistance);
    if (options.azimuth !== undefined) this.azimuth.target = options.azimuth;
    if (options.polar !== undefined) {
      this.polar.target = clamp(options.polar, MIN_POLAR, MAX_POLAR);
    }

    if (this.instant) {
      this.target.snap(x, y, z);
      this.distance.snap(this.distance.target);
      this.azimuth.snap(this.azimuth.target);
      this.polar.snap(this.polar.target);
    }
  }

  /** Pointer drag in orbit mode. */
  orbitBy(deltaAzimuth: number, deltaPolar: number): void {
    this.azimuth.target = this.azimuth.target - deltaAzimuth;
    this.polar.target = clamp(
      this.polar.target - deltaPolar,
      MIN_POLAR,
      MAX_POLAR
    );
    // Direct manipulation wants a tighter spring than a cinematic fly-to.
    this.azimuth.setHalfLife(0.12);
    this.polar.setHalfLife(0.12);
  }

  /** Wheel / pinch. `factor` > 1 zooms out. */
  dolly(factor: number): void {
    this.distance.setHalfLife(0.18);
    this.distance.target = clamp(
      this.distance.target * factor,
      this.minDistance,
      this.maxDistance
    );
  }

  enterFree(camera: PerspectiveCamera): void {
    this.mode = 'free';
    this.freePosition.copy(camera.position);
    this.freeVelocity.set(0, 0, 0);

    // Seed the free-flight orientation from where the camera already looks, so
    // switching modes never snaps the view.
    const dir = this.scratch.set(
      this.target.x.value - camera.position.x,
      this.target.y.value - camera.position.y,
      this.target.z.value - camera.position.z
    );
    if (dir.lengthSq() < 1e-12) dir.set(0, 0, -1);
    dir.normalize();

    this.freeYaw = Math.atan2(-dir.x, -dir.z);
    this.freePitch = Math.asin(clamp(dir.y, -1, 1));
  }

  exitFree(camera: PerspectiveCamera): void {
    this.mode = 'orbit';
    // Preserve the current view by deriving orbit parameters from the camera's
    // actual position relative to the target.
    this.scratch.set(
      camera.position.x - this.target.x.value,
      camera.position.y - this.target.y.value,
      camera.position.z - this.target.z.value
    );
    this.spherical.setFromVector3(this.scratch);
    this.distance.snap(Math.max(this.spherical.radius, this.minDistance));
    this.azimuth.snap(this.spherical.theta);
    this.polar.snap(clamp(this.spherical.phi, MIN_POLAR, MAX_POLAR));
  }

  lookBy(deltaYaw: number, deltaPitch: number): void {
    this.freeYaw -= deltaYaw;
    this.freePitch = clamp(this.freePitch - deltaPitch, -1.5, 1.5);
  }

  /** Free-flight thrust in camera-local axes. */
  thrust(
    right: number,
    up: number,
    forward: number,
    dt: number,
    speed: number
  ): void {
    const cy = Math.cos(this.freeYaw);
    const sy = Math.sin(this.freeYaw);
    const cp = Math.cos(this.freePitch);
    const sp = Math.sin(this.freePitch);

    const fwd = this.scratch.set(-sy * cp, sp, -cy * cp);
    this.freeVelocity.addScaledVector(fwd, forward * speed * dt);
    this.freeVelocity.addScaledVector(
      this.scratch.set(cy, 0, -sy),
      right * speed * dt
    );
    this.freeVelocity.addScaledVector(UP, up * speed * dt);
  }

  update(dt: number, camera: PerspectiveCamera): void {
    if (this.mode === 'free') {
      this.freePosition.addScaledVector(this.freeVelocity, dt);
      // Exponential drag: responsive to input, but coasts to a stop rather than
      // stopping dead, which reads as inertia rather than as friction.
      this.freeVelocity.multiplyScalar(Math.exp(-2.4 * dt));
      camera.position.copy(this.freePosition);

      const cy = Math.cos(this.freeYaw);
      const sy = Math.sin(this.freeYaw);
      const cp = Math.cos(this.freePitch);
      const sp = Math.sin(this.freePitch);
      this.scratch.set(-sy * cp, sp, -cy * cp).add(camera.position);
      camera.up.copy(UP);
      camera.lookAt(this.scratch);
    } else {
      this.target.step(dt);
      const r = this.distance.step(dt);
      const theta = this.azimuth.step(dt);
      const phi = clamp(this.polar.step(dt), MIN_POLAR, MAX_POLAR);

      const sinPhi = Math.sin(phi);
      camera.position.set(
        this.target.x.value + r * sinPhi * Math.sin(theta),
        this.target.y.value + r * Math.cos(phi),
        this.target.z.value + r * sinPhi * Math.cos(theta)
      );
      camera.up.copy(UP);
      camera.lookAt(
        this.target.x.value,
        this.target.y.value,
        this.target.z.value
      );
      this.applyScreenBias(camera, r);
    }

    this.updateClipPlanes(camera);
  }

  /**
   * Slide the camera along its own up axis so the target renders higher.
   *
   * Orientation is left alone, so this is a pan rather than a tilt. The world
   * offset needed to move the image by a fraction `f` of viewport height is
   * `2 f r tan(fov/2)`, where r is the distance to the target.
   */
  private applyScreenBias(camera: PerspectiveCamera, distance: number): void {
    if (this.screenBias === 0) return;
    const halfHeight = distance * Math.tan((camera.fov * Math.PI) / 360);
    const shift = 2 * this.screenBias * halfHeight;
    // Local up after lookAt, not world up: the camera is usually tilted.
    this.scratch.set(0, 1, 0).applyQuaternion(camera.quaternion);
    camera.position.addScaledVector(this.scratch, -shift);
  }

  /**
   * Recompute near/far every frame from the distance to what we are looking at.
   *
   * This is what makes a six-order-of-magnitude scene work without a
   * logarithmic depth buffer. Log depth writes `gl_FragDepth` for every
   * fragment, which disables early-Z rejection across the whole scene -- an
   * unaffordable cost when a planet plus a translucent atmosphere shell can
   * cover the screen. Holding far/near under ~1e5 keeps 24-bit depth precise
   * and costs two divides.
   */
  private updateClipPlanes(camera: PerspectiveCamera): void {
    const dx = camera.position.x - this.target.x.value;
    const dy = camera.position.y - this.target.y.value;
    const dz = camera.position.z - this.target.z.value;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

    const near = Math.max(dist * 0.002, this.minDistance * 0.01, 1e-4);
    const far = Math.max(near * 1e5, dist * 40 + 1e6);

    if (camera.near !== near || camera.far !== far) {
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
  }

  get settled(): boolean {
    return (
      this.target.settled &&
      this.distance.settled &&
      this.azimuth.settled &&
      this.polar.settled
    );
  }

  /** Current distance from the target, for telemetry and LOD. */
  get currentDistance(): number {
    return this.distance.value;
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}
