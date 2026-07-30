/**
 * The Sun.
 *
 * A full custom shader rather than an extended standard material: the Sun is
 * the one body that emits rather than reflects, so none of three's PBR path is
 * useful to it. Output is linear HDR in the 8-20 range, which is what makes the
 * threshold bloom in the composer behave as *selective* bloom without a second
 * scene pass -- nothing else in the scene exceeds 1.0.
 */

import { AdditiveBlending, BackSide, Color, ShaderMaterial, Texture, Vector3 } from 'three';
import { FBM, SIMPLEX3, WORLEY3 } from '../shaders/lib/noise.glsl.ts';

const STAR_VERTEX = /* glsl */ `
varying vec3 vObjectDir;
varying vec3 vViewDir;
void main() {
  vObjectDir = normalize(position);
  vec4 world = modelMatrix * vec4(position, 1.0);
  vViewDir = normalize(cameraPosition - world.xyz);
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const STAR_FRAGMENT = /* glsl */ `
precision highp float;
${SIMPLEX3}
${WORLEY3}
${FBM}

varying vec3 vObjectDir;
varying vec3 vViewDir;

uniform samplerCube uAlbedoCube;
uniform samplerCube uSurfaceCube;
uniform float uTime;
uniform float uIntensity;
uniform vec3 uTint;

void main() {
  vec3 d = normalize(vObjectDir);

  // Granulation drifts and evolves. Two rates so cells both move and boil,
  // which is what stops it reading as a static texture on a spinning ball.
  vec3 flow = d + vec3(0.0, uTime * 0.004, 0.0);
  float boil = fbm3(flow * 7.0 + uTime * 0.05, 3, 2.2, 0.5);

  vec3 baked = textureCube(uAlbedoCube, d).rgb;
  float heat = textureCube(uSurfaceCube, d).r;
  float emissive = textureCube(uSurfaceCube, d).b;

  // Limb darkening: the classic Eddington approximation. Without it the disc
  // reads as a flat circle rather than a sphere.
  float mu = max(dot(normalize(vViewDir), d), 0.0);
  float limb = 0.35 + 0.65 * pow(mu, 0.55);

  vec3 color = baked * uTint;
  color *= 0.85 + 0.30 * boil;
  color *= limb;

  // Hotter regions push further into HDR so bloom picks them out selectively.
  float hdr = uIntensity * emissive * (0.7 + 0.6 * heat);
  gl_FragColor = vec4(color * hdr, 1.0);
}
`;

export class StarMaterial extends ShaderMaterial {
  constructor() {
    super({
      vertexShader: STAR_VERTEX,
      fragmentShader: STAR_FRAGMENT,
      uniforms: {
        uAlbedoCube: { value: null as Texture | null },
        uSurfaceCube: { value: null as Texture | null },
        uTime: { value: 0 },
        uIntensity: { value: 14 },
        uTint: { value: new Color(1.0, 0.94, 0.86) },
      },
      // Tone mapping happens in the composer, after bloom, so the material must
      // not be tone mapped here or the HDR range is crushed before it blooms.
      toneMapped: false,
      fog: false,
    });
  }

  setTextures(albedo: Texture, surface: Texture): void {
    this.uniforms.uAlbedoCube.value = albedo;
    this.uniforms.uSurfaceCube.value = surface;
  }
}

// ------------------------------------------------------------------ corona

/**
 * A camera-facing billboard, not a shell.
 *
 * A back-face sphere seems like the obvious way to do a corona, but its
 * silhouette is a hard circle: however sharp you make the rim falloff, the
 * geometry's own edge stays visible and the whole thing reads as a soap bubble
 * around the star. A billboard with a radial falloff has no silhouette at all,
 * always faces the viewer, and costs two triangles.
 */
const CORONA_VERTEX = /* glsl */ `
varying vec2 vQuad;

uniform float uScale;

void main() {
  vQuad = position.xy;
  // Billboard: take the object's world origin, then offset in view space so the
  // quad always faces the camera regardless of the parent's rotation.
  vec4 originView = viewMatrix * modelMatrix * vec4(0.0, 0.0, 0.0, 1.0);
  float worldScale = length(vec3(modelMatrix[0].x, modelMatrix[0].y, modelMatrix[0].z));
  originView.xy += position.xy * uScale * worldScale;
  gl_Position = projectionMatrix * originView;
}
`;

const CORONA_FRAGMENT = /* glsl */ `
precision highp float;
${SIMPLEX3}
${FBM}

varying vec2 vQuad;

uniform float uTime;
uniform vec3 uColor;
uniform float uIntensity;
uniform float uCoreRadius;

void main() {
  float r = length(vQuad);
  if (r > 1.0) discard;

  // Two falloffs summed: a tight inner glow hugging the photosphere and a
  // broad faint halo. One exponential alone reads as either a hard ring or a
  // shapeless smudge.
  float inner = exp(-pow(max(r - uCoreRadius, 0.0) * 9.0, 1.4));
  float outer = exp(-pow(max(r - uCoreRadius, 0.0) * 2.6, 1.1)) * 0.32;

  // Streamers, keyed to angle so they radiate outward rather than swirl.
  float angle = atan(vQuad.y, vQuad.x);
  float streamers =
    fbm3(vec3(cos(angle) * 2.0, sin(angle) * 2.0, uTime * 0.03), 4, 2.3, 0.5) * 0.5 + 0.5;

  float a = (inner + outer * (0.55 + 0.65 * streamers));
  // Fade to nothing at the quad edge so the billboard boundary is never visible.
  a *= smoothstep(1.0, 0.82, r);

  gl_FragColor = vec4(uColor * uIntensity * a, a);
}
`;

export class CoronaMaterial extends ShaderMaterial {
  constructor(scale = 3.4, coreRadius = 0.3) {
    super({
      vertexShader: CORONA_VERTEX,
      fragmentShader: CORONA_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new Color(1.0, 0.74, 0.4) },
        uIntensity: { value: 2.4 },
        uScale: { value: scale },
        uCoreRadius: { value: coreRadius },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
      depthTest: true,
      side: BackSide,
      toneMapped: false,
      fog: false,
    });
  }
}

export const SUN_DIRECTION = new Vector3();
