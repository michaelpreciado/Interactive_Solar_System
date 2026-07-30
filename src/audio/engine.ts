/**
 * Audio.
 *
 * Entirely synthesised with the Web Audio API -- no sample files, which keeps
 * the bundle at zero bytes of audio and works with no network at all.
 *
 * Muted by default and created lazily on the first user gesture, because an
 * autoplaying drone is hostile to anyone who opens this at work, and because
 * browsers block AudioContext creation before a gesture anyway.
 */

import { BODY_BY_ID } from '../data/bodies';

interface Voice {
  osc: OscillatorNode;
  gain: GainNode;
  filter: BiquadFilterNode;
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private ambientBus: GainNode | null = null;
  private voices: Voice[] = [];
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private noiseGain: GainNode | null = null;

  private enabled = false;
  private volume = 0.5;
  private started = false;

  /** Called on the first real user gesture. Safe to call repeatedly. */
  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    if (typeof window === 'undefined') return null;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;

    const ctx = new Ctor();
    this.ctx = ctx;

    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    this.ambientBus = ctx.createGain();
    this.ambientBus.gain.value = 0.55;
    this.ambientBus.connect(this.master);

    // Suspend when the tab is hidden: a background drone drains battery and is
    // exactly the kind of thing that gets an app closed.
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) void this.ctx.suspend();
      else if (this.enabled) void this.ctx.resume();
    });

    return ctx;
  }

  setEnabled(on: boolean): void {
    this.enabled = on;
    const ctx = on ? this.ensureContext() : this.ctx;
    if (!ctx || !this.master) return;
    if (on) {
      void ctx.resume();
      if (!this.started) {
        this.startAmbience();
        this.started = true;
      }
    }
    // Ramp rather than jump: a step change in gain is an audible click.
    this.master.gain.cancelScheduledValues(ctx.currentTime);
    this.master.gain.setTargetAtTime(on ? this.volume : 0, ctx.currentTime, 0.4);
  }

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.master && this.ctx && this.enabled) {
      this.master.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.1);
    }
  }

  /**
   * A slow chord whose voicing shifts with the focused body: warm, wide and
   * slightly detuned at the gas giants; cold, high and hollow out at Neptune.
   */
  private startAmbience(): void {
    const ctx = this.ctx;
    if (!ctx || !this.ambientBus) return;

    const partials = [1, 1.5, 2.005, 2.996, 4.02];
    for (const ratio of partials) {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55 * ratio;

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 900;
      filter.Q.value = 0.7;

      const gain = ctx.createGain();
      gain.gain.value = 0.16 / ratio;

      // A very slow LFO on each partial, at an incommensurate rate, so the
      // texture never audibly repeats.
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.017 * ratio + 0.004;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.07 / ratio;
      lfo.connect(lfoGain).connect(gain.gain);
      lfo.start();

      osc.connect(filter).connect(gain).connect(this.ambientBus);
      osc.start();
      this.voices.push({ osc, gain, filter });
    }

    // Filtered noise for the "solar wind" bed.
    const length = ctx.sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    // Brown noise: integrated white, which sits far lower and less hissy.
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const nf = ctx.createBiquadFilter();
    nf.type = 'bandpass';
    nf.frequency.value = 320;
    nf.Q.value = 0.6;

    const ng = ctx.createGain();
    ng.gain.value = 0.1;

    src.connect(nf).connect(ng).connect(this.ambientBus);
    src.start();

    this.noiseSource = src;
    this.noiseFilter = nf;
    this.noiseGain = ng;
  }

  /** Shift the ambience to match a body. */
  setBody(id: string): void {
    const ctx = this.ctx;
    if (!ctx || this.voices.length === 0) return;
    const body = BODY_BY_ID[id];
    if (!body) return;

    // Colder, more distant worlds get a higher, thinner, quieter voicing;
    // the Sun and the gas giants get a low warm one with more noise bed.
    const warmth = Math.max(0, Math.min(1, (body.meanTempK - 40) / 300));
    const root = 44 + (1 - warmth) * 34;
    const cutoff = 420 + warmth * 1600;

    const t = ctx.currentTime;
    this.voices.forEach((v, i) => {
      const ratio = [1, 1.5, 2.005, 2.996, 4.02][i] ?? 1;
      v.osc.frequency.setTargetAtTime(root * ratio, t, 2.5);
      v.filter.frequency.setTargetAtTime(cutoff, t, 2.5);
    });

    if (this.noiseFilter && this.noiseGain) {
      this.noiseFilter.frequency.setTargetAtTime(200 + warmth * 700, t, 2.5);
      this.noiseGain.gain.setTargetAtTime(0.04 + warmth * 0.13, t, 2.5);
    }
  }

  /** A short, soft click for selection. */
  select(): void {
    this.blip(660, 0.045, 0.06);
  }

  /** A rising whoosh for a fly-to. */
  whoosh(): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.5);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(2400, t + 0.5);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.05, t + 0.12);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.7);

    osc.connect(filter).connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  private blip(freq: number, gainValue: number, duration: number): void {
    const ctx = this.ctx;
    if (!ctx || !this.master || !this.enabled) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, t + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain).connect(this.master);
    osc.start(t);
    osc.stop(t + duration + 0.02);
  }

  dispose(): void {
    for (const v of this.voices) {
      try {
        v.osc.stop();
      } catch {
        // Already stopped; nothing to do.
      }
    }
    this.voices = [];
    try {
      this.noiseSource?.stop();
    } catch {
      // Already stopped.
    }
    void this.ctx?.close();
    this.ctx = null;
    this.started = false;
  }
}

export const audio = new AudioEngine();
