/**
 * The starfield.
 *
 * Baked once into a cube map and assigned to `scene.background`. That path in
 * three costs *zero draw calls* and zero alpha overdraw.
 *
 * The alternative -- a few thousand `Points` -- swims and aliases under camera
 * motion, which is precisely the artifact you notice during a cinematic fly-to,
 * and it is the single most common tell that a space scene is hobbyist. A
 * cubemap is rock stable and strictly cheaper.
 *
 * Stars are placed by hashing a 3D cell grid, with a magnitude distribution
 * that follows the real power law and colour from a Planck approximation of
 * B-V temperature. A faint Milky Way band is added in galactic coordinates.
 */

import {
  BufferGeometry,
  Float32BufferAttribute,
  GLSL3,
  HalfFloatType,
  LinearFilter,
  Matrix3,
  Mesh,
  NoColorSpace,
  OrthographicCamera,
  RawShaderMaterial,
  RGBAFormat,
  Scene,
  WebGLCubeRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three';
import { COLOR_LIB, FBM, SIMPLEX3 } from '../shaders/lib/noise.glsl.ts';

const STAR_VERTEX = /* glsl */ `
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const STAR_FRAGMENT = /* glsl */ `
precision highp float;
#define texture2D texture
${SIMPLEX3}
${FBM}
${COLOR_LIB}

in vec2 vUv;
layout(location = 0) out vec4 fragColor;

uniform mat3 uFaceBasis;
uniform float uDensity;
uniform float uBrightness;

/** Rotation from equatorial J2000 into galactic coordinates. */
const mat3 GALACTIC = mat3(
  -0.0548755604, -0.8734370902, -0.4838350155,
   0.4941094279, -0.4448296300,  0.7469822445,
  -0.8676661490, -0.1980763734,  0.4559837762
);

vec3 hash31(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}

void main() {
  vec3 dir = normalize(uFaceBasis * vec3(vUv * 2.0 - 1.0, 1.0));

  vec3 color = vec3(0.0);

  // Three cell scales: a few bright stars, many faint ones. Sampling each cell
  // and its 26 neighbours would be 27x the cost for no visible gain, so each
  // scale contributes at most one star per cell and the scales are offset.
  for (int level = 0; level < 3; level++) {
    float scale = 60.0 * pow(2.6, float(level));
    vec3 gp = dir * scale;
    vec3 cell = floor(gp);
    vec3 f = fract(gp);

    for (int k = -1; k <= 1; k++) {
      for (int j = -1; j <= 1; j++) {
        for (int i = -1; i <= 1; i++) {
          vec3 offs = vec3(float(i), float(j), float(k));
          vec3 h = hash31(cell + offs + float(level) * 17.0);

          // Magnitude follows a power law: most stars are faint.
          float mag = pow(h.z, 5.0);
          if (mag < 0.0015) continue;

          vec3 starPos = offs + h;
          float d = length(f - starPos);

          // Point-spread function. The tight core plus a wide faint halo is
          // what makes a star read as a star rather than a dot.
          float core = exp(-d * d * 900.0);
          float halo = exp(-d * d * 90.0) * 0.16;

          // B-V colour: hot blue-white giants are rare, cool red dwarfs common.
          float temp = mix(2600.0, 12000.0, pow(fract(h.x * 7.3), 2.2));
          vec3 tint = blackbody(temp);

          color += tint * mag * (core + halo) * uBrightness;
        }
      }
    }
  }

  // The Milky Way: a dust-mottled band concentrated at low galactic latitude.
  vec3 gal = GALACTIC * dir;
  float galLat = asin(clamp(gal.z, -1.0, 1.0));
  float band = exp(-galLat * galLat * 42.0);
  float clouds = fbm3(dir * 6.0, 5, 2.2, 0.55) * 0.5 + 0.5;
  float dust = fbm3(dir * 14.0 + 9.0, 4, 2.4, 0.5) * 0.5 + 0.5;
  vec3 milkyWay = vec3(0.52, 0.55, 0.72) * band * clouds * (0.35 + 0.65 * dust) * 0.16;

  // Faint unresolved starlight, so the band isn't a stripe on pure black.
  color += milkyWay * uDensity;
  color += vec3(0.004, 0.005, 0.010);

  fragColor = vec4(color, 1.0);
}
`;

/** Same derivation as the surface bakery; see the note there. */
const FACE_BASES: Matrix3[] = [
  new Matrix3().set(0, 0, 1, 0, 1, 0, 1, 0, 0), // +X -> ( 1,  v,  u)
  new Matrix3().set(0, 0, -1, 0, 1, 0, -1, 0, 0), // -X -> (-1,  v, -u)
  new Matrix3().set(-1, 0, 0, 0, 0, 1, 0, -1, 0), // +Y -> (-u,  1, -v)
  new Matrix3().set(-1, 0, 0, 0, 0, -1, 0, 1, 0), // -Y -> (-u, -1,  v)
  new Matrix3().set(-1, 0, 0, 0, 1, 0, 0, 0, 1), // +Z -> (-u,  v,  1)
  new Matrix3().set(1, 0, 0, 0, 1, 0, 0, 0, -1), // -Z -> ( u,  v, -1)
];

export interface StarfieldResult {
  texture: Texture;
  dispose(): void;
}

export function bakeStarfield(renderer: WebGLRenderer, size = 1024): StarfieldResult {
  const geo = new BufferGeometry();
  geo.setAttribute(
    'position',
    new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3)
  );
  geo.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));

  const material = new RawShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: STAR_VERTEX,
    fragmentShader: STAR_FRAGMENT,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      uFaceBasis: { value: new Matrix3() },
      uDensity: { value: 1 },
      uBrightness: { value: 1 },
    },
  });

  const mesh = new Mesh(geo, material);
  mesh.frustumCulled = false;
  const scene = new Scene();
  scene.add(mesh);
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // Half float so the brightest stars stay above 1.0 and catch the bloom pass.
  const rt = new WebGLCubeRenderTarget(size, {
    format: RGBAFormat,
    type: HalfFloatType,
    generateMipmaps: false,
    minFilter: LinearFilter,
    magFilter: LinearFilter,
  });
  rt.texture.colorSpace = NoColorSpace;

  const prev = renderer.getRenderTarget();
  const prevFace = renderer.getActiveCubeFace();
  for (let face = 0; face < 6; face++) {
    (material.uniforms.uFaceBasis.value as Matrix3).copy(FACE_BASES[face]);
    renderer.setRenderTarget(rt, face);
    renderer.render(scene, camera);
  }
  renderer.setRenderTarget(prev, prevFace);

  geo.dispose();
  material.dispose();

  return {
    texture: rt.texture,
    dispose: () => rt.dispose(),
  };
}
