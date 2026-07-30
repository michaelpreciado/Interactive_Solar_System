/**
 * Picking, orbiting, zooming and touch.
 *
 * All input is handled on the canvas element directly rather than through R3F's
 * `onClick` / `onPointerMove` props, because those raycast *through React* --
 * every pointer move would run a scene traversal and potentially a state write.
 *
 * Picking is an analytic ray/sphere test against the ~25 registered bodies,
 * which is a few hundred floating-point operations. A BVH would be slower to
 * build than this is to run.
 */

import { useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Raycaster, Vector2, Vector3, type PerspectiveCamera } from 'three';

import { allBodies } from './registry';
import { uiState, useUIStore } from '../state/uiStore';
import type { DriverHandle } from './driverHandle';
import { audio } from '../audio/engine';

/** Screen-space slack so sub-pixel bodies and fat fingers can still be hit. */
const PICK_TOLERANCE_PX = 16;
const DRAG_THRESHOLD_PX = 5;

export function Pointer({ handle }: { handle: DriverHandle }) {
  const { gl, camera, size } = useThree();
  const rig = handle.rig;

  const state = useRef({
    dragging: false,
    moved: 0,
    lastX: 0,
    lastY: 0,
    pointers: new Map<number, { x: number; y: number }>(),
    pinchDistance: 0,
  });

  useEffect(() => {
    const el = gl.domElement;
    const s = state.current;
    const perspective = camera as PerspectiveCamera;

    const onPointerDown = (e: PointerEvent) => {
      // Without this the browser starts a text-selection drag from the canvas,
      // which highlights the whole HUD as you orbit and swallows the gesture.
      e.preventDefault();
      el.setPointerCapture(e.pointerId);
      s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      s.dragging = true;
      s.moved = 0;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      if (s.pointers.size === 2) {
        const [a, b] = [...s.pointers.values()];
        s.pinchDistance = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.pointers.has(e.pointerId)) {
        // Hover: cheap enough to run every move because it's one pass over 25
        // bodies with no allocation, and it only writes to the store on change.
        updateHover(e, el, perspective);
        return;
      }
      s.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (s.pointers.size === 2) {
        const [a, b] = [...s.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (s.pinchDistance > 0 && d > 0) {
          rig.dolly(s.pinchDistance / d);
        }
        s.pinchDistance = d;
        return;
      }

      const dx = e.clientX - s.lastX;
      const dy = e.clientY - s.lastY;
      s.lastX = e.clientX;
      s.lastY = e.clientY;
      s.moved += Math.abs(dx) + Math.abs(dy);

      if (uiState().cameraMode === 'free') {
        rig.lookBy(dx * 0.0032, dy * 0.0032);
      } else {
        rig.orbitBy(dx * 0.006, dy * 0.006);
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      s.pointers.delete(e.pointerId);
      if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
      if (s.pointers.size < 2) s.pinchDistance = 0;

      // A drag is not a click. Without this every orbit gesture would also
      // reselect whatever happened to be under the release point.
      if (s.moved < DRAG_THRESHOLD_PX) {
        const hit = pick(e, el, perspective);
        if (hit) {
          useUIStore.getState().setFocused(hit);
          audio.select();
        }
      }
      s.dragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Normalise across deltaMode: Firefox reports lines, not pixels.
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? size.height : 1;
      rig.dolly(Math.exp(e.deltaY * unit * 0.0012));
    };

    const onContextMenu = (e: Event) => e.preventDefault();

    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    el.addEventListener('pointercancel', onPointerUp);
    el.addEventListener('wheel', onWheel, { passive: false });
    el.addEventListener('contextmenu', onContextMenu);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
      el.removeEventListener('pointercancel', onPointerUp);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('contextmenu', onContextMenu);
    };
  }, [gl, camera, rig, size.height]);

  return null;
}

const ndc = new Vector2();
const raycaster = new Raycaster();
const toBody = new Vector3();

function toNdc(e: PointerEvent, el: HTMLCanvasElement): Vector2 {
  const rect = el.getBoundingClientRect();
  ndc.set(
    ((e.clientX - rect.left) / rect.width) * 2 - 1,
    -((e.clientY - rect.top) / rect.height) * 2 + 1
  );
  return ndc;
}

/**
 * Ray/sphere against every visible body, nearest hit wins.
 *
 * The tolerance is applied in *screen* space by inflating the test radius by
 * the world size of `PICK_TOLERANCE_PX` at that depth, so a distant Mercury
 * that renders two pixels wide is still tappable on a phone.
 */
function pick(e: PointerEvent, el: HTMLCanvasElement, camera: PerspectiveCamera): string | null {
  raycaster.setFromCamera(toNdc(e, el), camera);

  let best: string | null = null;
  let bestT = Infinity;

  const tanHalfFov = Math.tan((camera.fov * Math.PI) / 360);
  const pxToWorld = (2 * tanHalfFov) / el.clientHeight;

  for (const h of allBodies()) {
    if (!h.active) continue;
    toBody.copy(h.group.position).sub(raycaster.ray.origin);
    const along = toBody.dot(raycaster.ray.direction);
    if (along <= 0) continue;

    const radius = h.group.scale.x + PICK_TOLERANCE_PX * pxToWorld * along;
    const perpSq = toBody.lengthSq() - along * along;
    if (perpSq > radius * radius) continue;

    if (along < bestT) {
      bestT = along;
      best = h.id;
    }
  }

  return best;
}

let lastHover: string | null = null;

function updateHover(e: PointerEvent, el: HTMLCanvasElement, camera: PerspectiveCamera): void {
  const hit = pick(e, el, camera);
  if (hit === lastHover) return;
  lastHover = hit;
  useUIStore.getState().setHovered(hit);
  el.style.cursor = hit ? 'pointer' : 'grab';
}
