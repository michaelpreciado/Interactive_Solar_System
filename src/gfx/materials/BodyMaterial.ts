/**
 * The runtime planet material.
 *
 * Extends `MeshStandardMaterial` via `onBeforeCompile` rather than being a
 * bespoke `ShaderMaterial`. That keeps three's PBR, shadow sampling, tone
 * mapping and colour management -- reimplementing `shadowmap_pars_fragment`
 * correctly is a week of work for no gain.
 *
 * Injected on top of stock standard shading:
 *   - cube-map albedo / surface-data sampling by object-space direction
 *   - a physically-sized soft terminator (the Sun subtends 0.53 degrees, so a
 *     hard `max(NdotL, 0)` is both wrong and obviously wrong)
 *   - night-side city lights that bloom in across the terminator
 *   - per-latitude band scroll, giving gas giants real differential rotation
 *   - analytic ring shadows via a 1-D optical-depth profile
 *   - a close-range detail octave so zooming past the baked resolution reveals
 *     more surface rather than a blur
 */

import {
  Color,
  MeshStandardMaterial,
  Texture,
  Vector3,
  Vector4,
  type IUniform,
  type WebGLProgramParametersWithUniforms,
} from 'three';

import { FBM, SIMPLEX3 } from '../shaders/lib/noise.glsl.ts';

export interface BodyMaterialOptions {
  /** Enables the city-lights and ocean-specular path. */
  terran?: boolean;
  /** Enables per-latitude differential rotation. */
  banded?: boolean;
  /** Enables the analytic ring-shadow term. */
  ringShadow?: boolean;
  /** Extra procedural octaves blended in at close range. */
  detailOctaves?: number;
}

export class BodyMaterial extends MeshStandardMaterial {
  readonly bodyUniforms: Record<string, IUniform> = {
    uAlbedoCube: { value: null as Texture | null },
    uSurfaceCube: { value: null as Texture | null },
    uTime: { value: 0 },
    /** Sun direction in the mesh's *object* space. */
    uSunDirObject: { value: new Vector3(1, 0, 0) },
    /** Scroll offset for banded atmospheres. */
    uBandScroll: { value: 0 },
    /** Blend weight for the close-range detail octaves, 0..1. */
    uDetailBlend: { value: 0 },
    uDetailScale: { value: 40 },
    uSeed: { value: 0 },
    uNightLightColor: { value: new Color(1.0, 0.78, 0.42) },
    uNightLightStrength: { value: 1.6 },
    /** Angular radius of the Sun as seen from this body, radians. */
    uSunAngularRadius: { value: 0.00465 },
    uSunColor: { value: new Color(1.0, 0.96, 0.9) },
    /** Solar irradiance at this body, normalised so Earth is 1. */
    uSunIrradiance: { value: 1 },
    /** xy = inner/outer ring radius in body radii, z = tilt sign, w = enabled. */
    uRingBounds: { value: new Vector4(0, 0, 1, 0) },
    uRingProfile: { value: null as Texture | null },
    /** Oblateness: polar radius / equatorial radius. */
    uPolarRatio: { value: 1 },
  };

  private readonly opts: Required<BodyMaterialOptions>;

  constructor(options: BodyMaterialOptions = {}) {
    super({
      color: 0xffffff,
      roughness: 0.9,
      metalness: 0,
    });
    this.opts = {
      terran: options.terran ?? false,
      banded: options.banded ?? false,
      ringShadow: options.ringShadow ?? false,
      detailOctaves: options.detailOctaves ?? 0,
    };
  }

  setDetailOctaves(n: number): void {
    if (n === this.opts.detailOctaves) return;
    this.opts.detailOctaves = n;
    this.needsUpdate = true;
  }

  setTextures(albedo: Texture, surface: Texture): void {
    this.bodyUniforms.uAlbedoCube.value = albedo;
    this.bodyUniforms.uSurfaceCube.value = surface;
    // No `needsUpdate` here: the program already declares both samplers because
    // the placeholders are real textures, never null. Swapping the value is
    // enough, and avoids a recompile hitch mid-flight.
  }

  /**
   * Without this, three's program cache keys on material *parameters* and never
   * sees the string injection below, so two BodyMaterials with different
   * feature sets silently share one compiled program. The symptom is a planet
   * inexplicably rendering with another planet's features.
   */
  override customProgramCacheKey(): string {
    const o = this.opts;
    return `body|${o.terran ? 1 : 0}${o.banded ? 1 : 0}${o.ringShadow ? 1 : 0}|${o.detailOctaves}`;
  }

  override onBeforeCompile(shader: WebGLProgramParametersWithUniforms): void {
    Object.assign(shader.uniforms, this.bodyUniforms);

    const defines: string[] = [];
    if (this.opts.terran) defines.push('#define BODY_TERRAN');
    if (this.opts.banded) defines.push('#define BODY_BANDED');
    if (this.opts.ringShadow) defines.push('#define BODY_RING_SHADOW');
    if (this.opts.detailOctaves > 0) {
      defines.push('#define BODY_DETAIL');
      defines.push(`#define BODY_DETAIL_OCTAVES ${this.opts.detailOctaves}`);
    }
    const defineBlock = defines.join('\n');

    // ------------------------------------------------------------- vertex
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
varying vec3 vObjectDir;
varying vec3 vObjectPos;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
vObjectDir = normalize(position);
vObjectPos = position;`
      );

    // ----------------------------------------------------------- fragment
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
${defineBlock}

varying vec3 vObjectDir;
varying vec3 vObjectPos;

uniform samplerCube uAlbedoCube;
uniform samplerCube uSurfaceCube;
uniform float uTime;
uniform vec3 uSunDirObject;
uniform float uBandScroll;
uniform float uDetailBlend;
uniform float uDetailScale;
uniform float uSeed;
uniform vec3 uNightLightColor;
uniform float uNightLightStrength;
uniform float uSunAngularRadius;
uniform vec3 uSunColor;
uniform float uSunIrradiance;
uniform vec4 uRingBounds;
uniform sampler2D uRingProfile;
uniform float uPolarRatio;

${this.opts.detailOctaves > 0 ? SIMPLEX3 + FBM : ''}

/**
 * Rotate a direction about the Y axis by an amount that varies with latitude.
 * Jupiter's equatorial jet runs ~100 m/s faster than its mid-latitude belts,
 * so the bands genuinely shear against each other over a few hours. One
 * multiply-add buys the single most recognisable thing about a gas giant.
 */
vec3 bandScroll(vec3 d, float amount) {
  float lat = asin(clamp(d.y, -1.0, 1.0));
  // Prograde equatorial jet with alternating higher-latitude flow.
  float omega = amount * (0.62 + 0.38 * cos(lat * 5.4));
  float c = cos(omega), s = sin(omega);
  return vec3(c * d.x - s * d.z, d.y, s * d.x + c * d.z);
}

/**
 * Optical depth of the ring system along the fragment-to-Sun ray.
 * The ring plane is y = 0 in the planet's equatorial object space, so this is
 * one ray-plane intersection and one 1-D texture fetch -- analytically exact
 * at any zoom, which no shadow map can manage for a gap as thin as Encke's.
 */
float ringShadowFactor(vec3 objPos, vec3 sunDir) {
  if (uRingBounds.w < 0.5 || abs(sunDir.y) < 1e-4) return 1.0;
  float t = -objPos.y / sunDir.y;
  if (t <= 0.0) return 1.0;
  vec3 hit = objPos + sunDir * t;
  float r = length(hit.xz);
  if (r < uRingBounds.x || r > uRingBounds.y) return 1.0;
  float u = (r - uRingBounds.x) / max(uRingBounds.y - uRingBounds.x, 1e-5);
  float tau = texture2D(uRingProfile, vec2(u, 0.5)).a;
  // Beer-Lambert through a slab tilted by the solar elevation.
  return exp(-tau / max(abs(sunDir.y), 0.05));
}
`
      )
      // Albedo: sample the baked cube map, optionally band-scrolled, with a
      // close-range detail octave blended on top.
      .replace(
        '#include <map_fragment>',
        `
vec3 sampleDir = normalize(vObjectDir);
#ifdef BODY_BANDED
  sampleDir = bandScroll(sampleDir, uBandScroll);
#endif

vec4 albedoTexel = textureCube(uAlbedoCube, sampleDir);
vec4 surfaceTexel = textureCube(uSurfaceCube, sampleDir);

diffuseColor.rgb *= albedoTexel.rgb;

#ifdef BODY_DETAIL
  if (uDetailBlend > 0.001) {
    float d = fbm3(sampleDir * uDetailScale + uSeed, BODY_DETAIL_OCTAVES, 2.1, 0.5);
    // Modulate rather than add, so detail darkens crevices and brightens
    // ridges instead of washing the palette toward grey.
    diffuseColor.rgb *= 1.0 + d * 0.35 * uDetailBlend;
  }
#endif
`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `
float roughnessFactor = roughness * surfaceTexel.g;
#ifdef BODY_TERRAN
  // The ocean mask is in albedo.a. A smooth ocean plus three's PBR gives the
  // specular sun-glint for free -- no bespoke water shader required.
  roughnessFactor = mix(roughnessFactor, 0.05, albedoTexel.a);
#endif
roughnessFactor = clamp(roughnessFactor, 0.03, 1.0);
`
      )
      // Perturb the normal from the baked height field with a 4-tap finite
      // difference. Cheaper than storing a normal map and a quarter the memory.
      .replace(
        '#include <normal_fragment_maps>',
        `
{
  float texel = 1.0 / 512.0;
  vec3 t1 = normalize(cross(sampleDir, abs(sampleDir.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0)));
  vec3 t2 = cross(sampleDir, t1);
  float hL = textureCube(uSurfaceCube, normalize(sampleDir - t1 * texel)).r;
  float hR = textureCube(uSurfaceCube, normalize(sampleDir + t1 * texel)).r;
  float hD = textureCube(uSurfaceCube, normalize(sampleDir - t2 * texel)).r;
  float hU = textureCube(uSurfaceCube, normalize(sampleDir + t2 * texel)).r;
  vec3 bumped = normalize(normal - (t1 * (hR - hL) + t2 * (hU - hD)) * 12.0);
  normal = normalize(mix(normal, bumped, 0.85));
}
`
      )
      /**
       * Replace three's direct lighting entirely with an analytic solar term.
       *
       * A single shared `DirectionalLight` cannot light a 30 AU scene: its
       * direction is only correct for one body at a time, so everything else
       * gets its terminator in the wrong place. Deriving the sun direction
       * per body in object space is both correct everywhere and cheaper than a
       * shadow-mapped light -- which is why shadow maps are switched off
       * entirely and ring shadows are done analytically instead.
       */
      .replace(
        '#include <lights_fragment_end>',
        `#include <lights_fragment_end>
{
  vec3 objNormal = normalize(vObjectDir);
  float NdotL = dot(objNormal, uSunDirObject);

  // The Sun is a disc, not a point. Its angular radius is a real computable
  // quantity -- half a degree from Earth, 20 arcseconds from Neptune -- so the
  // terminator's softness follows from physics rather than from taste.
  float w = max(uSunAngularRadius, 0.0015);
  float dayFactor = smoothstep(-w, w, NdotL) * max(NdotL, 0.0);

  float shadow = 1.0;
#ifdef BODY_RING_SHADOW
  shadow = ringShadowFactor(vObjectPos, uSunDirObject);
#endif

  vec3 sun = uSunColor * uSunIrradiance * dayFactor * shadow;
  reflectedLight.directDiffuse = material.diffuseColor * sun;

  // Keep a specular lobe for oceans and ice, using the same analytic direction.
  vec3 viewDir = normalize(vViewPosition);
  vec3 halfDir = normalize(uSunDirObject + normalize(-vObjectPos));
  float NdotH = max(dot(objNormal, halfDir), 0.0);
  float gloss = pow(NdotH, mix(400.0, 8.0, roughnessFactor));
  reflectedLight.directSpecular = sun * gloss * (1.0 - roughnessFactor) * 0.7;
}
`
      )
      // City lights: emissive on the night side, fading in through the
      // terminator and suppressed under cloud.
      .replace(
        '#include <emissivemap_fragment>',
        `
#ifdef BODY_TERRAN
{
  float NdotL = dot(normalize(vObjectDir), uSunDirObject);
  float night = smoothstep(0.10, -0.06, NdotL);
  float lights = surfaceTexel.b * night * (1.0 - surfaceTexel.a * 0.75);
  totalEmissiveRadiance += uNightLightColor * lights * uNightLightStrength;
}
#else
  // emissiveIntensity is a JS-side property that three folds into the emissive
  // uniform; it does not exist as a shader identifier. Io's glowing calderas
  // come straight from the baked emissive channel instead.
  totalEmissiveRadiance += vec3(surfaceTexel.b) * uNightLightStrength;
#endif
`
      );
  }
}
