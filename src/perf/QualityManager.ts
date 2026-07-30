/**
 * Adaptive quality controller.
 *
 * Measures the display's actual refresh rate, then holds a frame-time budget by
 * stepping the quality tier up and down with hysteresis.
 *
 * Two decisions worth stating:
 *
 *  - It watches the *p95* frame time, not the mean. A mean hides exactly the
 *    hitches users notice, and a single GC pause should not demote the session.
 *  - Demotion needs 2 s of sustained overrun, promotion needs 5 s of sustained
 *    headroom, and there is a 5 s cooldown after any change. Without that
 *    asymmetry the controller oscillates around the boundary, which is far more
 *    distracting than simply running one tier lower.
 */

import { TIERS, TIER_ORDER, stepTier, type QualitySettings, type TierName } from './tiers';

const WINDOW = 240;
const DEMOTE_AFTER_MS = 2000;
const PROMOTE_AFTER_MS = 5000;
const COOLDOWN_MS = 5000;
const DEMOTE_RATIO = 1.15;
const PROMOTE_RATIO = 0.7;

export type QualityListener = (settings: QualitySettings, reason: string) => void;

class QualityManager {
  private tier: TierName = 'balanced';
  private frames = new Float32Array(WINDOW);
  private cursor = 0;
  private filled = 0;
  private sorted = new Float32Array(WINDOW);

  private overrunSince = 0;
  private headroomSince = 0;
  private lastChangeAt = -Infinity;

  private listeners = new Set<QualityListener>();

  /** Target frame budget in ms. Set from the measured refresh rate. */
  budgetMs = 1000 / 60;

  /** User override: when set, the controller stops adapting. */
  locked = false;

  /** Last computed statistics, for the debug HUD. */
  readonly stats = { p50: 0, p95: 0, p99: 0, fps: 0 };

  get settings(): QualitySettings {
    return TIERS[this.tier];
  }

  get tierName(): TierName {
    return this.tier;
  }

  subscribe(fn: QualityListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  setTier(name: TierName, reason = 'manual'): void {
    if (name === this.tier) return;
    this.tier = name;
    this.lastChangeAt = now();
    this.overrunSince = 0;
    this.headroomSince = 0;
    this.filled = 0;
    this.cursor = 0;
    for (const fn of this.listeners) fn(this.settings, reason);
  }

  /**
   * Measure the display refresh rate over ~30 frames and set the budget.
   * Resolves with the detected rate.
   */
  async detectRefreshRate(): Promise<number> {
    if (typeof requestAnimationFrame === 'undefined') return 60;
    const samples: number[] = [];
    let last = now();
    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = now();
        const dt = t - last;
        last = t;
        if (dt > 0.5 && dt < 100) samples.push(dt);
        if (samples.length >= 30) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    if (samples.length === 0) return 60;
    samples.sort((a, b) => a - b);
    const median = samples[samples.length >> 1];
    const hz = Math.round(1000 / median);
    // Snap to a plausible panel rate rather than trusting a noisy median.
    const candidates = [30, 60, 75, 90, 120, 144, 165, 240];
    const snapped = candidates.reduce((best, c) =>
      Math.abs(c - hz) < Math.abs(best - hz) ? c : best
    );
    this.budgetMs = 1000 / snapped;
    return snapped;
  }

  /** Force a specific frame-rate cap, from the settings UI. */
  setTargetFps(fps: number): void {
    this.budgetMs = 1000 / Math.max(15, fps);
  }

  /** Called once per frame from the driver with the last frame's duration. */
  sample(frameMs: number): void {
    this.frames[this.cursor] = frameMs;
    this.cursor = (this.cursor + 1) % WINDOW;
    if (this.filled < WINDOW) this.filled++;

    // Recompute percentiles once per full window rather than every frame: a
    // 240-element sort at 120 Hz would itself be a measurable cost.
    if (this.cursor % 30 !== 0 || this.filled < 60) return;

    const n = this.filled;
    this.sorted.set(this.frames.subarray(0, n));
    const view = this.sorted.subarray(0, n);
    view.sort();

    this.stats.p50 = view[Math.floor(n * 0.5)];
    this.stats.p95 = view[Math.floor(n * 0.95)];
    this.stats.p99 = view[Math.min(n - 1, Math.floor(n * 0.99))];
    this.stats.fps = this.stats.p50 > 0 ? 1000 / this.stats.p50 : 0;

    if (this.locked) return;
    this.evaluate();
  }

  private evaluate(): void {
    const t = now();
    if (t - this.lastChangeAt < COOLDOWN_MS) return;

    const p95 = this.stats.p95;

    if (p95 > this.budgetMs * DEMOTE_RATIO) {
      this.headroomSince = 0;
      if (this.overrunSince === 0) this.overrunSince = t;
      else if (t - this.overrunSince > DEMOTE_AFTER_MS) {
        const next = stepTier(this.tier, -1);
        if (next !== this.tier) {
          this.setTier(next, `p95 ${p95.toFixed(1)}ms over ${this.budgetMs.toFixed(1)}ms budget`);
        } else {
          // Already at the floor; stop retrying every window.
          this.overrunSince = t;
        }
      }
      return;
    }

    if (p95 < this.budgetMs * PROMOTE_RATIO) {
      this.overrunSince = 0;
      if (this.headroomSince === 0) this.headroomSince = t;
      else if (t - this.headroomSince > PROMOTE_AFTER_MS) {
        const next = stepTier(this.tier, 1);
        if (next !== this.tier) {
          this.setTier(next, `p95 ${p95.toFixed(1)}ms well under budget`);
        } else {
          this.headroomSince = t;
        }
      }
      return;
    }

    // Inside the deadband: reset both timers so a brief excursion doesn't
    // accumulate toward a change.
    this.overrunSince = 0;
    this.headroomSince = 0;
  }

  /** Test seam: drive the controller from a synthetic trace. */
  reset(tier: TierName = 'balanced'): void {
    this.tier = tier;
    this.filled = 0;
    this.cursor = 0;
    this.overrunSince = 0;
    this.headroomSince = 0;
    this.lastChangeAt = -Infinity;
  }
}

let nowOverride: (() => number) | null = null;
const now = () => (nowOverride ? nowOverride() : performance.now());

/** Test seam so the hysteresis timings can be exercised without real time. */
export function __setClock(fn: (() => number) | null): void {
  nowOverride = fn;
}

export const quality = new QualityManager();
export { TIER_ORDER };
