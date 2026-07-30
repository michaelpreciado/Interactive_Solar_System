/**
 * Discrete UI state.
 *
 * This store is written by user interaction only. Nothing in the frame loop
 * ever calls `set()` -- continuously changing values (time, distances, fps)
 * go through `telemetry.ts`, which bypasses React entirely.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { TierName } from '../perf/tiers';

export type AudienceMode = 'explorer' | 'scientist';
export type CameraMode = 'orbit' | 'follow' | 'free';
export type PanelId =
  | 'inspector'
  | 'layers'
  | 'tours'
  | 'compare'
  | 'settings'
  | 'quiz'
  | null;

export interface OverlayFlags {
  orbits: boolean;
  labels: boolean;
  asteroids: boolean;
  atmospheres: boolean;
  habitableZone: boolean;
  eclipticGrid: boolean;
}

interface UIState {
  focusedBody: string;
  hoveredBody: string | null;
  panel: PanelId;
  audience: AudienceMode;
  cameraMode: CameraMode;
  overlays: OverlayFlags;

  /** 0 = compressed/artistic scale, 1 = true scale. Spring target. */
  scaleTarget: number;

  tier: TierName;
  tierAuto: boolean;
  targetFps: number;

  audioEnabled: boolean;
  audioVolume: number;

  reducedMotion: boolean;
  showDebugHud: boolean;
  introComplete: boolean;

  /** Body ids the user has visited, for the discovery mechanic. */
  visited: string[];

  setFocused: (id: string) => void;
  setHovered: (id: string | null) => void;
  setPanel: (p: PanelId) => void;
  togglePanel: (p: NonNullable<PanelId>) => void;
  setAudience: (m: AudienceMode) => void;
  setCameraMode: (m: CameraMode) => void;
  toggleOverlay: (k: keyof OverlayFlags) => void;
  setOverlay: (k: keyof OverlayFlags, v: boolean) => void;
  setScaleTarget: (t: number) => void;
  setTier: (t: TierName, auto?: boolean) => void;
  setTargetFps: (f: number) => void;
  setAudioEnabled: (v: boolean) => void;
  setAudioVolume: (v: number) => void;
  setReducedMotion: (v: boolean) => void;
  toggleDebugHud: () => void;
  completeIntro: () => void;
  markVisited: (id: string) => void;
}

const STORAGE_KEY = 'orrery.prefs.v1';

interface PersistedPrefs {
  audience?: AudienceMode;
  overlays?: Partial<OverlayFlags>;
  audioEnabled?: boolean;
  audioVolume?: number;
  tier?: TierName;
  tierAuto?: boolean;
  targetFps?: number;
  visited?: string[];
  introComplete?: boolean;
}

function loadPrefs(): PersistedPrefs {
  if (typeof localStorage === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedPrefs) : {};
  } catch {
    return {};
  }
}

const saved = loadPrefs();

const DEFAULT_OVERLAYS: OverlayFlags = {
  orbits: true,
  labels: true,
  asteroids: true,
  atmospheres: true,
  habitableZone: false,
  eclipticGrid: false,
};

const prefersReducedMotion =
  typeof matchMedia !== 'undefined' &&
  matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useUIStore = create<UIState>()(
  subscribeWithSelector((set, get) => ({
    focusedBody: 'sun',
    hoveredBody: null,
    panel: null,
    audience: saved.audience ?? 'explorer',
    cameraMode: 'orbit',
    overlays: { ...DEFAULT_OVERLAYS, ...saved.overlays },
    scaleTarget: 0,
    tier: saved.tier ?? 'balanced',
    tierAuto: saved.tierAuto ?? true,
    targetFps: saved.targetFps ?? 120,
    audioEnabled: saved.audioEnabled ?? false,
    audioVolume: saved.audioVolume ?? 0.5,
    reducedMotion: prefersReducedMotion,
    showDebugHud: false,
    introComplete: saved.introComplete ?? false,
    visited: saved.visited ?? [],

    setFocused: (id) => {
      set({ focusedBody: id });
      get().markVisited(id);
    },
    setHovered: (id) => set({ hoveredBody: id }),
    setPanel: (p) => set({ panel: p }),
    togglePanel: (p) => set((s) => ({ panel: s.panel === p ? null : p })),
    setAudience: (audience) => set({ audience }),
    setCameraMode: (cameraMode) => set({ cameraMode }),
    toggleOverlay: (k) =>
      set((s) => ({ overlays: { ...s.overlays, [k]: !s.overlays[k] } })),
    setOverlay: (k, v) => set((s) => ({ overlays: { ...s.overlays, [k]: v } })),
    setScaleTarget: (scaleTarget) =>
      set({ scaleTarget: Math.max(0, Math.min(1, scaleTarget)) }),
    setTier: (tier, auto = false) => set({ tier, tierAuto: auto }),
    setTargetFps: (targetFps) => set({ targetFps }),
    setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
    setAudioVolume: (audioVolume) => set({ audioVolume }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    toggleDebugHud: () => set((s) => ({ showDebugHud: !s.showDebugHud })),
    completeIntro: () => set({ introComplete: true }),
    markVisited: (id) =>
      set((s) => (s.visited.includes(id) ? s : { visited: [...s.visited, id] })),
  }))
);

// Persist the subset of state worth remembering. Subscribing outside React
// means this costs nothing at render time.
if (typeof localStorage !== 'undefined') {
  let saveTimer: ReturnType<typeof setTimeout> | undefined;
  useUIStore.subscribe(
    (s) => [s.audience, s.overlays, s.audioEnabled, s.audioVolume, s.tier, s.tierAuto, s.targetFps, s.visited, s.introComplete] as const,
    () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const s = useUIStore.getState();
        const payload: PersistedPrefs = {
          audience: s.audience,
          overlays: s.overlays,
          audioEnabled: s.audioEnabled,
          audioVolume: s.audioVolume,
          tier: s.tier,
          tierAuto: s.tierAuto,
          targetFps: s.targetFps,
          visited: s.visited,
          introComplete: s.introComplete,
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        } catch {
          // Private browsing / quota. Preferences are a nicety, not a feature.
        }
      }, 400);
    },
    { equalityFn: (a, b) => a.every((v, i) => v === b[i]) }
  );
}

/** Non-reactive read, for use inside the frame loop. */
export const uiState = () => useUIStore.getState();
