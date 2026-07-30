/**
 * Atmospheric limb.
 *
 * A back-face shell just above the surface, additively blended. The shader
 * marches a small number of steps along the view ray through an exponential
 * density profile, accumulating Rayleigh and Mie scattering.
 *
 * This is deliberately "Bruneton-lite": a real precomputed multiple-scattering
 * model is beautiful and far too expensive for a shell that can cover half the
 * screen at 120 fps. Single scattering with a proper phase function gets the
 * blue day-side glow, the orange terminator, and the bright forward-scattered
 * limb -- which is all of the effect anyone actually perceives.
 */

import {
  AdditiveBlending,
  BackSide,
  ShaderMaterial,
  Vector3,
  type IUniform,
} from 'three';
import type { AtmosphereDef } from '../../data/bodies';

const ATMO_VERTEX = /* glsl */ `
varying vec3 vObjectPos;
varying vec3 vViewRay;

void main() {
  vObjectPos = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  // Camera position in object space, so the whole march stays in a frame where
  // the planet is a unit sphere at the origin -- no world-space precision
  // issues at 30 AU, and the ray-sphere maths stays trivial.
  vec3 camObj = (inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
  vViewRay = position - camObj;
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const ATMO_FRAGMENT = /* glsl */ `
precision highp float;

varying vec3 vObjectPos;
varying vec3 vViewRay;

uniform vec3 uSunDirObject;
uniform vec3 uRayleigh;
uniform vec3 uMie;
uniform float uMieG;
uniform float uDensity;
uniform float uPlanetRadius;   // object-space, normally 1.0
uniform float uAtmoRadius;
uniform float uExposure;

const float PI_A = 3.14159265359;

float rayleighPhase(float c) {
  return (3.0 / (16.0 * PI_A)) * (1.0 + c * c);
}

float miePhase(float c, float g) {
  float g2 = g * g;
  float denom = 1.0 + g2 - 2.0 * g * c;
  return (3.0 / (8.0 * PI_A)) * ((1.0 - g2) * (1.0 + c * c)) /
         ((2.0 + g2) * pow(max(denom, 1e-4), 1.5));
}

/** Nearest positive root of |o + t d| = r, or -1. */
float sphereEnter(vec3 o, vec3 d, float r) {
  float b = dot(o, d);
  float c = dot(o, o) - r * r;
  float disc = b * b - c;
  if (disc < 0.0) return -1.0;
  return -b - sqrt(disc);
}

float density(float height) {
  // Exponential falloff with a scale height of ~1/8 of the shell thickness,
  // which matches Earth's 8 km against a 60 km visible limb closely enough.
  return exp(-height * 8.0);
}

void main() {
  vec3 dir = normalize(vViewRay);
  vec3 origin = vObjectPos - vViewRay;   // camera, object space

  float shell = uAtmoRadius - uPlanetRadius;

  // March from where the ray enters the shell to whichever comes first: the
  // planet surface, or the far side of the shell.
  float tEnter = max(sphereEnter(origin, dir, uAtmoRadius), 0.0);
  float tSurface = sphereEnter(origin, dir, uPlanetRadius);
  float bFar = dot(origin, dir);
  float cFar = dot(origin, origin) - uAtmoRadius * uAtmoRadius;
  float discFar = bFar * bFar - cFar;
  if (discFar < 0.0) discard;
  float tExit = -bFar + sqrt(discFar);
  float tEnd = tSurface > 0.0 ? min(tSurface, tExit) : tExit;
  if (tEnd <= tEnter) discard;

  float segment = (tEnd - tEnter) / float(ATMO_STEPS);
  vec3 accumR = vec3(0.0);
  vec3 accumM = vec3(0.0);
  float optical = 0.0;

  for (int i = 0; i < ATMO_STEPS; i++) {
    float t = tEnter + segment * (float(i) + 0.5);
    vec3 p = origin + dir * t;
    float r = length(p);
    float height = clamp((r - uPlanetRadius) / max(shell, 1e-5), 0.0, 1.0);
    float d = density(height) * uDensity;

    // Sun visibility: cheap analytic shadow from the planet body itself, which
    // is what produces the dark night-side limb and the orange terminator ring.
    float cosSun = dot(normalize(p), uSunDirObject);
    float shadow = smoothstep(-0.15, 0.15, cosSun);

    // Light that reaches this sample has already crossed some atmosphere.
    float sunPath = exp(-optical * 0.35);

    accumR += d * shadow * sunPath * segment;
    accumM += d * shadow * sunPath * segment * smoothstep(0.0, 0.6, cosSun);
    optical += d * segment;
  }

  float cosTheta = dot(dir, uSunDirObject);
  vec3 scattered =
    uRayleigh * accumR * rayleighPhase(cosTheta) +
    uMie * accumM * miePhase(cosTheta, uMieG);

  scattered *= uExposure;

  float alpha = clamp(1.0 - exp(-length(scattered) * 2.2), 0.0, 1.0);
  gl_FragColor = vec4(scattered, alpha);
}
`;

export interface AtmosphereUniforms {
  uSunDirObject: IUniform<Vector3>;
  uRayleigh: IUniform<Vector3>;
  uMie: IUniform<Vector3>;
  uMieG: IUniform<number>;
  uDensity: IUniform<number>;
  uPlanetRadius: IUniform<number>;
  uAtmoRadius: IUniform<number>;
  uExposure: IUniform<number>;
}

export class AtmosphereMaterial extends ShaderMaterial {
  private steps: number;

  constructor(def: AtmosphereDef, steps = 8) {
    super({
      vertexShader: ATMO_VERTEX,
      fragmentShader: `#define ATMO_STEPS ${steps}\n${ATMO_FRAGMENT}`,
      uniforms: {
        uSunDirObject: { value: new Vector3(1, 0, 0) },
        uRayleigh: { value: new Vector3(...def.rayleigh) },
        uMie: { value: new Vector3(...def.mie) },
        uMieG: { value: def.mieG },
        uDensity: { value: def.density },
        uPlanetRadius: { value: 1 },
        uAtmoRadius: { value: 1 + def.heightFraction },
        uExposure: { value: 6.5 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      side: BackSide,
      toneMapped: false,
      fog: false,
    });
    this.steps = steps;
  }

  setSteps(steps: number): void {
    if (steps === this.steps) return;
    this.steps = steps;
    this.fragmentShader = `#define ATMO_STEPS ${steps}\n${ATMO_FRAGMENT}`;
    this.needsUpdate = true;
  }

  override customProgramCacheKey(): string {
    return `atmo|${this.steps}`;
  }
}
