/**
 * Saturn's rings.
 *
 * Three effects, all analytic, no shadow maps anywhere:
 *
 *  1. The planet's shadow on the rings -- a ray/oblate-spheroid intersection,
 *     about ten instructions.
 *  2. Forward scattering -- a single-scattering slab model, branching on
 *     whether the viewer and the Sun are on the same side of the ring plane.
 *     This is the effect that makes rings look like rings: the thin C ring
 *     glows when backlit while the dense B ring goes dark.
 *  3. Grazing-angle antialiasing -- the profile is mipped and the LOD is
 *     selected from screen-space derivatives, because a 2048-sample radial
 *     texture viewed nearly edge-on aliases catastrophically otherwise.
 *
 * The ring structure itself comes from real radii: the Cassini division at
 * 117,580-122,170 km and the Encke gap at 133,590 km are data, not noise. That
 * is what makes the result recognisably Saturn.
 */

import {
  BufferGeometry,
  ClampToEdgeWrapping,
  DataTexture,
  DoubleSide,
  Float32BufferAttribute,
  LinearFilter,
  LinearMipmapLinearFilter,
  RGBAFormat,
  ShaderMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';

const RING_VERTEX = /* glsl */ `
varying float vRadiusU;
varying vec3 vObjectPos;
varying vec3 vViewDirWorld;
varying vec3 vWorldNormal;

attribute float radiusU;

void main() {
  vRadiusU = radiusU;
  vObjectPos = position;
  vec4 world = modelMatrix * vec4(position, 1.0);
  vViewDirWorld = normalize(cameraPosition - world.xyz);
  // The ring plane's normal is the planet's spin axis.
  vWorldNormal = normalize(mat3(modelMatrix) * vec3(0.0, 1.0, 0.0));
  gl_Position = projectionMatrix * viewMatrix * world;
}
`;

const RING_FRAGMENT = /* glsl */ `
precision highp float;

varying float vRadiusU;
varying vec3 vObjectPos;
varying vec3 vViewDirWorld;
varying vec3 vWorldNormal;

uniform sampler2D uProfile;
uniform vec3 uSunDirObject;
uniform vec3 uSunDirWorld;
uniform vec3 uSunColor;
uniform float uPlanetRadius;   // object space
uniform float uPolarRatio;
uniform float uProfileWidth;
uniform float uBrightness;

const float PI_R = 3.14159265359;
const float TAU_CEILING = 2.5;

float phaseHG(float c, float g) {
  float g2 = g * g;
  return (1.0 - g2) / (4.0 * PI_R * pow(max(1.0 + g2 - 2.0 * g * c, 1e-4), 1.5));
}

/**
 * Is this ring particle inside the planet's shadow?
 * Ray/ellipsoid: prescaling y by the inverse polar ratio turns the oblate
 * spheroid into a unit sphere, which matters -- Saturn is 10% flattened, and a
 * spherical approximation puts the shadow's edge visibly in the wrong place.
 */
float planetShadow(vec3 p, vec3 sunDir) {
  vec3 o = vec3(p.x, p.y / uPolarRatio, p.z);
  vec3 d = normalize(vec3(sunDir.x, sunDir.y / uPolarRatio, sunDir.z));
  float b = dot(o, d);
  if (b > 0.0) return 1.0;             // planet is behind us relative to the Sun
  float c = dot(o, o) - uPlanetRadius * uPlanetRadius;
  float disc = b * b - c;
  if (disc < 0.0) return 1.0;
  // Soften by the Sun's angular size rather than a hard edge.
  float d2 = sqrt(max(dot(o, o) - b * b, 0.0));
  return smoothstep(uPlanetRadius * 0.992, uPlanetRadius * 1.008, d2);
}

void main() {
  // Mip selection from the radial derivative. Without this the ringlets alias
  // into moire the moment the camera drops toward the ring plane.
  float lod = log2(max(1.0, fwidth(vRadiusU) * uProfileWidth));
  vec4 prof = texture2D(uProfile, vec2(clamp(vRadiusU, 0.001, 0.999), 0.5), lod);

  vec3 albedo = prof.rgb;
  // The profile stores optical depth normalised against TAU_CEILING so it fits
  // in an 8-bit channel. Reading it back without rescaling leaves every ring
  // 2.5x too transparent -- the whole system washes out to grey.
  float tau = prof.a * TAU_CEILING;
  if (tau < 0.004) discard;

  vec3 N = normalize(vWorldNormal);
  vec3 V = normalize(vViewDirWorld);
  vec3 L = normalize(uSunDirWorld);

  float muV = abs(dot(V, N));
  float muL = abs(dot(L, N));
  muV = max(muV, 0.02);
  muL = max(muL, 0.02);

  float cosGamma = dot(V, L);
  bool sameSide = (dot(V, N) * dot(L, N)) > 0.0;

  vec3 intensity;
  if (sameSide) {
    // Lit face: backscattered light from a finite slab.
    intensity = albedo * (1.0 - exp(-tau * (1.0 / muV + 1.0 / muL))) *
                phaseHG(cosGamma, 0.25) * 4.0;
  } else {
    // Unlit face: light transmitted through the slab, strongly forward
    // scattered. Thin rings glow, dense rings go dark -- the Cassini look.
    intensity = albedo * exp(-tau / muV) * phaseHG(cosGamma, 0.62) * 9.0;
  }

  intensity *= uSunColor * planetShadow(vObjectPos, uSunDirObject) * uBrightness;

  float alpha = clamp(1.0 - exp(-tau / muV), 0.0, 1.0);
  gl_FragColor = vec4(intensity, alpha);
}
`;

export class RingMaterial extends ShaderMaterial {
  constructor(profile: DataTexture, profileWidth: number) {
    super({
      vertexShader: RING_VERTEX,
      fragmentShader: RING_FRAGMENT,
      uniforms: {
        uProfile: { value: profile },
        uSunDirObject: { value: new Vector3(1, 0, 0) },
        uSunDirWorld: { value: new Vector3(1, 0, 0) },
        uSunColor: { value: new Vector3(1, 0.97, 0.92) },
        uPlanetRadius: { value: 1 },
        uPolarRatio: { value: 0.9 },
        uProfileWidth: { value: profileWidth },
        uBrightness: { value: 1.35 },
      },
      transparent: true,
      depthWrite: false,
      side: DoubleSide,
    });
  }
}

// ------------------------------------------------------------- ring profile

export interface RingBand {
  /** Inner and outer radius, kilometres from the planet's centre. */
  inner: number;
  outer: number;
  /** Peak optical depth. */
  tau: number;
  /** sRGB hex tint. */
  color: string;
}

/**
 * Saturn's real ring structure. Radii from Cassini radio-occultation profiles.
 * Saturn's equatorial radius is 60,268 km, so the D ring starts at 1.11 Rs and
 * the A ring ends at 2.27 Rs.
 */
export const SATURN_RINGS: RingBand[] = [
  { inner: 66900, outer: 74510, tau: 0.08, color: '#6b5f4e' }, // D ring, faint
  { inner: 74658, outer: 92000, tau: 0.35, color: '#9c8a6f' }, // C ring, translucent
  { inner: 92000, outer: 117580, tau: 1.9, color: '#e8d8b4' }, // B ring, dense
  { inner: 117580, outer: 122170, tau: 0.08, color: '#8d7f68' }, // Cassini division
  { inner: 122170, outer: 133589, tau: 0.7, color: '#dcc9a4' }, // A ring, inner
  { inner: 133589, outer: 133895, tau: 0.02, color: '#7a6e5c' }, // Encke gap
  { inner: 133895, outer: 136505, tau: 0.62, color: '#d6c39d' }, // A ring, outer
  { inner: 136505, outer: 136800, tau: 0.05, color: '#7a6e5c' }, // Keeler gap
  { inner: 136800, outer: 140220, tau: 0.5, color: '#cfbc96' }, // A ring, edge
];

const PROFILE_WIDTH = 2048;

function hexToLinear(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/** Deterministic hash, so the ringlet structure is identical every load. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RingProfileResult {
  texture: DataTexture;
  innerKm: number;
  outerKm: number;
  width: number;
}

export function buildRingProfile(bands: RingBand[], seed = 1): RingProfileResult {
  const innerKm = bands[0].inner;
  const outerKm = bands[bands.length - 1].outer;
  const span = outerKm - innerKm;
  const data = new Uint8Array(PROFILE_WIDTH * 4);
  const rand = mulberry32(seed);

  // Pregenerate ringlet octaves so the structure is smooth in radius rather
  // than per-texel noise, which would just look like film grain.
  const octaves = [
    { freq: 90, amp: 0.22, phase: rand() * 1000 },
    { freq: 240, amp: 0.14, phase: rand() * 1000 },
    { freq: 620, amp: 0.08, phase: rand() * 1000 },
    { freq: 1500, amp: 0.04, phase: rand() * 1000 },
  ];

  for (let i = 0; i < PROFILE_WIDTH; i++) {
    const u = i / (PROFILE_WIDTH - 1);
    const km = innerKm + u * span;

    let tau = 0;
    let color: [number, number, number] = [0, 0, 0];
    for (const band of bands) {
      if (km >= band.inner && km <= band.outer) {
        // Feather the band edges over ~120 km so gaps have soft shoulders,
        // which is how the real edges appear at any achievable resolution.
        const edge = Math.min(km - band.inner, band.outer - km);
        const feather = Math.min(1, edge / 120);
        tau = band.tau * (0.35 + 0.65 * feather);
        color = hexToLinear(band.color);
        break;
      }
    }

    if (tau > 0) {
      let ringlets = 0;
      for (const o of octaves) {
        ringlets += Math.sin(u * o.freq * Math.PI * 2 + o.phase) * o.amp;
      }
      tau = Math.max(0, tau * (1 + ringlets));
    }

    const o = i * 4;
    data[o] = Math.round(Math.min(1, color[0]) * 255);
    data[o + 1] = Math.round(Math.min(1, color[1]) * 255);
    data[o + 2] = Math.round(Math.min(1, color[2]) * 255);
    // Optical depth is stored normalised against a ceiling of 2.5.
    data[o + 3] = Math.round(Math.min(1, tau / 2.5) * 255);
  }

  const texture = new DataTexture(data, PROFILE_WIDTH, 1, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.wrapS = ClampToEdgeWrapping;
  texture.wrapT = ClampToEdgeWrapping;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;

  return { texture, innerKm, outerKm, width: PROFILE_WIDTH };
}

/**
 * Radial strip geometry with the normalised radius carried per vertex.
 *
 * `RingGeometry` is unusable here: its UVs are laid out for a texture-mapped
 * annulus and cannot express a radial ramp, which is the one thing the ring
 * shader needs.
 */
export function buildRingGeometry(
  innerRadius: number,
  outerRadius: number,
  thetaSegments: number,
  radialSegments = 4
): BufferGeometry {
  const positions: number[] = [];
  const radiusUs: number[] = [];
  const indices: number[] = [];

  for (let r = 0; r <= radialSegments; r++) {
    const t = r / radialSegments;
    const radius = innerRadius + (outerRadius - innerRadius) * t;
    for (let s = 0; s <= thetaSegments; s++) {
      const angle = (s / thetaSegments) * Math.PI * 2;
      positions.push(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      radiusUs.push(t);
    }
  }

  const stride = thetaSegments + 1;
  for (let r = 0; r < radialSegments; r++) {
    for (let s = 0; s < thetaSegments; s++) {
      const a = r * stride + s;
      const b = a + stride;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geo.setAttribute('radiusU', new Float32BufferAttribute(radiusUs, 1));
  geo.setIndex(indices);
  geo.computeBoundingSphere();
  return geo;
}
