/**
 * Floating origin.
 *
 * Scene coordinates run from 1e-3 units (a kilometre of surface detail) out to
 * 4.5e6 units (Neptune). Object3D matrices are float32, whose ULP at 4.5e6 is
 * about 0.5 units -- 500 km. Flying along Neptune's cloud tops with a raw
 * heliocentric transform would quantise the camera into garbage.
 *
 * The fix is to keep world truth in Float64 here, and only ever hand three.js
 * positions *relative to a nearby origin*. The origin follows the camera in
 * coarse jumps, so rendered magnitudes stay small and float32 has precision to
 * spare.
 *
 * Everything that holds a scene-space position must be registered, or it will
 * jump by the rebase delta on the frame the origin moves. That is the one bug
 * this module can produce, so the registry is explicit rather than implicit.
 */

import type { Vector3 } from 'three';

export interface Rebasable {
  /** Subtract the delta from any cached scene-space position. */
  applyOriginShift(dx: number, dy: number, dz: number): void;
}

/** Rebase once the camera drifts this far from the current origin. */
const REBASE_THRESHOLD = 20000; // scene units = 20 million km

class FloatingOrigin {
  /** Current origin in absolute scene units (Float64). */
  readonly origin = new Float64Array(3);

  private readonly rebasables = new Set<Rebasable>();

  register(r: Rebasable): () => void {
    this.rebasables.add(r);
    return () => this.rebasables.delete(r);
  }

  /** Absolute Float64 position -> scene-space position, written into `out`. */
  toScene(abs: Float64Array, offset: number, out: Vector3): void {
    out.set(
      abs[offset] - this.origin[0],
      abs[offset + 1] - this.origin[1],
      abs[offset + 2] - this.origin[2]
    );
  }

  /** Scene-space position -> absolute Float64, written into `out`. */
  toAbsolute(scene: Vector3, out: Float64Array, offset: number): void {
    out[offset] = scene.x + this.origin[0];
    out[offset + 1] = scene.y + this.origin[1];
    out[offset + 2] = scene.z + this.origin[2];
  }

  /**
   * Move the origin to `target` if the camera has drifted too far, notifying
   * every registered holder. Returns true if a rebase happened.
   *
   * Called with the camera's current scene position. Rebasing only when the
   * camera is far from the origin means it never fires on a still frame, so a
   * residual sub-ULP error can never present as a visible pop.
   */
  maybeRebase(cameraScene: Vector3): boolean {
    const distSq =
      cameraScene.x * cameraScene.x +
      cameraScene.y * cameraScene.y +
      cameraScene.z * cameraScene.z;
    if (distSq < REBASE_THRESHOLD * REBASE_THRESHOLD) return false;

    const dx = cameraScene.x;
    const dy = cameraScene.y;
    const dz = cameraScene.z;

    this.origin[0] += dx;
    this.origin[1] += dy;
    this.origin[2] += dz;

    for (const r of this.rebasables) r.applyOriginShift(dx, dy, dz);
    return true;
  }

  /** Hard-set the origin, e.g. when snapping focus to a distant body. */
  moveTo(x: number, y: number, z: number): void {
    const dx = x - this.origin[0];
    const dy = y - this.origin[1];
    const dz = z - this.origin[2];
    if (dx === 0 && dy === 0 && dz === 0) return;
    this.origin[0] = x;
    this.origin[1] = y;
    this.origin[2] = z;
    for (const r of this.rebasables) r.applyOriginShift(dx, dy, dz);
  }

  reset(): void {
    this.moveTo(0, 0, 0);
  }
}

export const floatingOrigin = new FloatingOrigin();
