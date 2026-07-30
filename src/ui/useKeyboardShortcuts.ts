import { useEffect } from 'react';
import { BODIES, BODY_BY_ID, PLANETS } from '../data/bodies';
import { simClock } from '../sim/SimClock';
import { useUIStore } from '../state/uiStore';
import { audio } from '../audio/engine';
import type { DriverHandle } from '../scene/driverHandle';

/** Ordered for number-key selection: Sun, then outward. */
const ORDERED = ['sun', ...PLANETS.map((p) => p.id), 'pluto'];

export function useKeyboardShortcuts(handle: DriverHandle) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const store = useUIStore.getState();

      // Escape always dismisses, even from inside a panel control -- otherwise
      // tabbing into a switch traps you there with no keyboard way out.
      if (e.key === 'Escape') {
        if (store.panel) store.setPanel(null);
        (document.activeElement as HTMLElement | null)?.blur?.();
        return;
      }

      // Every other shortcut yields to form controls.
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      switch (e.key) {
        case ' ':
          simClock.playing = !simClock.playing;
          e.preventDefault();
          break;
        case 'ArrowLeft':
          simClock.setJD(simClock.jd - (e.shiftKey ? 30 : 1));
          e.preventDefault();
          break;
        case 'ArrowRight':
          simClock.setJD(simClock.jd + (e.shiftKey ? 30 : 1));
          e.preventDefault();
          break;
        case '`':
          store.toggleDebugHud();
          break;
        case 'o':
          store.toggleOverlay('orbits');
          break;
        case 'l':
          store.toggleOverlay('labels');
          break;
        case 'f':
          // The driver reads cameraMode each frame, so this is the only write
          // needed -- setting rig.mode here too would race with it.
          store.setCameraMode(store.cameraMode === 'free' ? 'orbit' : 'free');
          break;
        case 't':
          store.setScaleTarget(store.scaleTarget > 0.5 ? 0 : 1);
          break;
        case 'h':
          simClock.toNow();
          break;
        case '[':
        case ']': {
          const current = ORDERED.indexOf(store.focusedBody);
          const next =
            e.key === ']'
              ? Math.min(ORDERED.length - 1, current + 1)
              : Math.max(0, current - 1);
          if (next !== current) {
            store.setFocused(ORDERED[next]);
            audio.whoosh();
          }
          break;
        }
        default: {
          const n = Number(e.key);
          if (!Number.isNaN(n) && e.key !== '' && n >= 0 && n <= 9) {
            const id = ORDERED[n];
            if (id && BODY_BY_ID[id]) {
              store.setFocused(id);
              audio.whoosh();
            }
          }
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handle]);
}

export const SHORTCUT_COUNT = BODIES.length;
