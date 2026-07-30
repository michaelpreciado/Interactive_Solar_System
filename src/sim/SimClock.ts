/**
 * The simulation clock.
 *
 * Deliberately a plain mutable singleton with no React binding of any kind.
 * That is the enforcement mechanism for "zero React renders per frame": there
 * is simply no hook to reach for. Anything in the UI that needs to display time
 * reads it through the 10 Hz telemetry channel instead.
 */

import { J2000, MS_PER_DAY, UNIX_EPOCH_JD, dateToJulian } from './constants';

/** Julian dates outside this window are meaningless for our element set. */
export const MIN_JD = dateToJulian(new Date(Date.UTC(1600, 0, 1)));
export const MAX_JD = dateToJulian(new Date(Date.UTC(2400, 0, 1)));

/**
 * The Standish elements are quoted as good over 1800-2050. Outside it we still
 * propagate, but the UI marks the readout as extrapolated rather than quietly
 * presenting fiction as fact.
 */
export const ACCURATE_MIN_JD = dateToJulian(new Date(Date.UTC(1800, 0, 1)));
export const ACCURATE_MAX_JD = dateToJulian(new Date(Date.UTC(2050, 0, 1)));

export interface TimeSpeedPreset {
  label: string;
  daysPerSecond: number;
}

export const SPEED_PRESETS: TimeSpeedPreset[] = [
  { label: 'Paused', daysPerSecond: 0 },
  { label: 'Real time', daysPerSecond: 1 / 86400 },
  { label: '1 hour/s', daysPerSecond: 1 / 24 },
  { label: '1 day/s', daysPerSecond: 1 },
  { label: '1 week/s', daysPerSecond: 7 },
  { label: '1 month/s', daysPerSecond: 30.44 },
  { label: '1 year/s', daysPerSecond: 365.25 },
  { label: '10 years/s', daysPerSecond: 3652.5 },
];

class Clock {
  /** Current Julian date. Float64 throughout; never narrowed to float32. */
  jd = dateToJulian(new Date());

  /** Simulation days advanced per wall-clock second. */
  daysPerSecond = 1;

  playing = false;

  /** Monotonically increasing seconds since app start, for shader uTime. */
  elapsed = 0;

  /** Set true for one frame after a discrete jump, so trails can reset. */
  discontinuity = false;

  advance(dtSeconds: number): void {
    this.elapsed += dtSeconds;
    this.discontinuity = false;
    if (!this.playing || this.daysPerSecond === 0) return;
    this.setJD(this.jd + this.daysPerSecond * dtSeconds, false);
  }

  setJD(jd: number, discontinuous = true): void {
    const clamped = jd < MIN_JD ? MIN_JD : jd > MAX_JD ? MAX_JD : jd;
    if (discontinuous && Math.abs(clamped - this.jd) > 1) this.discontinuity = true;
    this.jd = clamped;
  }

  setDate(date: Date): void {
    this.setJD(dateToJulian(date));
  }

  toNow(): void {
    this.setDate(new Date());
  }

  get date(): Date {
    return new Date((this.jd - UNIX_EPOCH_JD) * MS_PER_DAY);
  }

  /** Years since J2000, used by shaders that want a slow global phase. */
  get yearsSinceJ2000(): number {
    return (this.jd - J2000) / 365.25;
  }

  get isExtrapolated(): boolean {
    return this.jd < ACCURATE_MIN_JD || this.jd > ACCURATE_MAX_JD;
  }

  /** Normalised [0,1] position within the scrubbable range. */
  get normalized(): number {
    return (this.jd - MIN_JD) / (MAX_JD - MIN_JD);
  }

  setNormalized(t: number): void {
    this.setJD(MIN_JD + t * (MAX_JD - MIN_JD));
  }
}

export const simClock = new Clock();
