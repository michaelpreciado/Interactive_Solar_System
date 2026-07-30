/**
 * Post-processing.
 *
 * `postprocessing` (pmndrs) rather than three's own `EffectComposer`, because
 * it merges every effect into a *single* fullscreen shader instead of chaining
 * a render-target ping-pong per effect. At an 8.3 ms budget that difference is
 * the entire argument for having post at all.
 *
 * Selective bloom without a second scene pass: the composer runs in linear HDR,
 * and the only things authored above 1.0 are the Sun (emissive 8-20) and city
 * lights. A plain luminance threshold at 1.0 therefore *is* selective bloom,
 * for free. This is also why tone mapping must happen here, after bloom, and
 * not on the renderer.
 */

import { Bloom, ChromaticAberration, EffectComposer, Noise, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction, KernelSize, ToneMappingMode } from 'postprocessing';
import { useEffect, useState } from 'react';
import { HalfFloatType, Vector2 } from 'three';

import { quality } from '../perf/QualityManager';
import type { QualitySettings } from '../perf/tiers';

export function Composer() {
  const [settings, setSettings] = useState<QualitySettings>(() => quality.settings);

  // Remounting an EffectPass recompiles the merged shader, which is a visible
  // hitch. The quality controller already rate-limits itself to one change per
  // five seconds, so reacting directly is safe.
  useEffect(() => quality.subscribe((s) => setSettings(s)), []);

  if (settings.bloomLevels === 0) {
    // Minimal tier: no composer at all. The renderer tone maps directly.
    return null;
  }

  return (
    <EffectComposer
      multisampling={settings.msaa}
      // HDR throughout. If the buffer were 8-bit the Sun would clip to white
      // before the bloom threshold ever saw it, and "selective" bloom would
      // become "everything blooms a little".
      frameBufferType={HalfFloatType}
    >
      <Bloom
        intensity={1.15}
        luminanceThreshold={1.0}
        luminanceSmoothing={0.28}
        mipmapBlur
        levels={settings.bloomLevels}
        kernelSize={KernelSize.LARGE}
      />
      {settings.chromaticAberration ? (
        <ChromaticAberration
          offset={new Vector2(0.0005, 0.0005)}
          radialModulation
          modulationOffset={0.35}
          blendFunction={BlendFunction.NORMAL}
        />
      ) : (
        <></>
      )}
      <Vignette offset={0.28} darkness={0.42} blendFunction={BlendFunction.NORMAL} />
      {settings.filmGrain ? (
        // Grain is not nostalgia here: the deep-space gradient bands badly in
        // 8-bit output, and a little noise dithers it away more cheaply than
        // any ordered dither.
        <Noise opacity={0.016} blendFunction={BlendFunction.OVERLAY} />
      ) : (
        <></>
      )}
      {/* AgX rolls hue on hot pixels instead of clipping them to desaturated
          white, which matters when the Sun is six orders brighter than Neptune. */}
      <ToneMapping mode={ToneMappingMode.AGX} />
      {settings.msaa === 0 ? <SMAA /> : <></>}
    </EffectComposer>
  );
}
