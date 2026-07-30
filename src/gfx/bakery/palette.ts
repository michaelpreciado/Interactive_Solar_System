/**
 * Colour ramps.
 *
 * Palettes live in TypeScript, not GLSL, so art direction is editable data
 * rather than shader edits. Each body's stop list becomes a 256x1 DataTexture
 * that the bake shader samples with `rampLookup`.
 */

import { ClampToEdgeWrapping, DataTexture, LinearFilter, RGBAFormat, SRGBColorSpace } from 'three';

const RAMP_WIDTH = 256;

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Build a ramp texture from sRGB hex stops.
 *
 * Interpolation happens in sRGB space deliberately: these stops were chosen by
 * eye, and interpolating them in linear space desaturates the midpoints in a
 * way that makes every planet look washed out. The texture is tagged
 * SRGBColorSpace so three converts to linear on sample.
 */
export function buildRamp(stops: string[]): DataTexture {
  const data = new Uint8Array(RAMP_WIDTH * 4);
  const rgb = stops.map(hexToRgb);
  const segments = rgb.length - 1;

  for (let i = 0; i < RAMP_WIDTH; i++) {
    const t = i / (RAMP_WIDTH - 1);
    const scaled = t * segments;
    const idx = Math.min(segments - 1, Math.floor(scaled));
    const f = scaled - idx;
    const a = rgb[idx];
    const b = rgb[idx + 1];
    // Smoothstep between stops so the ramp has no visible banding edges.
    const s = f * f * (3 - 2 * f);
    const o = i * 4;
    data[o] = Math.round(a[0] + (b[0] - a[0]) * s);
    data[o + 1] = Math.round(a[1] + (b[1] - a[1]) * s);
    data[o + 2] = Math.round(a[2] + (b[2] - a[2]) * s);
    data[o + 3] = 255;
  }

  const tex = new DataTexture(data, RAMP_WIDTH, 1, RGBAFormat);
  tex.colorSpace = SRGBColorSpace;
  tex.minFilter = LinearFilter;
  tex.magFilter = LinearFilter;
  tex.wrapS = ClampToEdgeWrapping;
  tex.wrapT = ClampToEdgeWrapping;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return tex;
}

const cache = new Map<string, DataTexture>();

export function rampFor(id: string, stops: string[]): DataTexture {
  let t = cache.get(id);
  if (!t) {
    t = buildRamp(stops);
    cache.set(id, t);
  }
  return t;
}

export function disposeRamps(): void {
  for (const t of cache.values()) t.dispose();
  cache.clear();
}
