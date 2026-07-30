/**
 * The handle shared between the driver and the interface.
 *
 * Kept out of the driver module so that file exports only its component, which
 * is what react-refresh needs to hot-reload the frame loop cleanly.
 */

import { CameraRig } from '../camera/CameraRig';
import { Spring } from '../sim/springs';

export interface DriverHandle {
  rig: CameraRig;
  scaleMorph: Spring;
}

export function createDriverHandle(): DriverHandle {
  return { rig: new CameraRig(), scaleMorph: new Spring(0, 0.6) };
}
