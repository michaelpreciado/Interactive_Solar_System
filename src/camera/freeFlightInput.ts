/**
 * Free-flight keyboard state.
 *
 * A plain module-level set rather than React state: the driver reads it every
 * frame, and routing held keys through a store would put a state write in the
 * animation path for as long as a key is down.
 */

const held = new Set<string>();

const BINDINGS: Record<string, string> = {
  KeyW: 'forward',
  KeyS: 'back',
  KeyA: 'left',
  KeyD: 'right',
  KeyQ: 'down',
  KeyE: 'up',
  Space: 'up',
  ShiftLeft: 'boost',
  ShiftRight: 'boost',
};

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return (
    !!el &&
    (el.tagName === 'INPUT' ||
      el.tagName === 'SELECT' ||
      el.tagName === 'TEXTAREA' ||
      el.isContentEditable)
  );
}

export function attachFreeFlightInput(): () => void {
  const onDown = (e: KeyboardEvent) => {
    if (isTypingTarget(e.target)) return;
    const action = BINDINGS[e.code];
    if (!action) return;
    held.add(action);
    // Space would otherwise scroll the page and also toggle playback.
    if (e.code === 'Space') e.preventDefault();
  };

  const onUp = (e: KeyboardEvent) => {
    const action = BINDINGS[e.code];
    if (action) held.delete(action);
  };

  // Losing focus mid-press would otherwise leave the key stuck down and the
  // camera drifting forever.
  const clear = () => held.clear();

  window.addEventListener('keydown', onDown);
  window.addEventListener('keyup', onUp);
  window.addEventListener('blur', clear);

  return () => {
    window.removeEventListener('keydown', onDown);
    window.removeEventListener('keyup', onUp);
    window.removeEventListener('blur', clear);
    held.clear();
  };
}

export interface ThrustAxes {
  right: number;
  up: number;
  forward: number;
  boost: boolean;
}

const axes: ThrustAxes = { right: 0, up: 0, forward: 0, boost: false };

/** Current thrust axes. The returned object is reused; do not retain it. */
export function readThrust(): ThrustAxes {
  axes.right = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0);
  axes.up = (held.has('up') ? 1 : 0) - (held.has('down') ? 1 : 0);
  axes.forward = (held.has('forward') ? 1 : 0) - (held.has('back') ? 1 : 0);
  axes.boost = held.has('boost');
  return axes;
}

export const anyThrust = (): boolean => held.size > 0;
