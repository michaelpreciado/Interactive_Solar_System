/**
 * The surface bake shader.
 *
 * Runs once per body at load, into a cube-map face. Two logical outputs,
 * selected by `uOutput` and rendered in separate passes because
 * `WebGLCubeRenderTarget` has no MRT support:
 *
 *   output 0 (albedo)  rgb = surface colour, a = specular/ocean mask
 *   output 1 (surface) r = height, g = roughness, b = emissive, a = cloud alpha
 *
 * The governing art principle: **hero features are hand-placed analytic
 * primitives at their real coordinates, and noise is only connective tissue.**
 * The Great Red Spot is an ellipse at 22 degrees south, Valles Marineris is a
 * polyline across Mars's equator, the polar caps are latitude thresholds. Pure
 * FBM produces something that reads as "procedural planet"; placing the
 * landmarks people recognise is what makes it read as *that* planet.
 */

export const BAKE_VERTEX = /* glsl */ `
in vec3 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

export const BAKE_FRAGMENT = /* glsl */ `
in vec2 vUv;

layout(location = 0) out vec4 fragColor;

/** 0 = albedo pass, 1 = surface-data pass. */
uniform int uOutput;
uniform sampler2D uPalette;
uniform mat3 uFaceBasis;   // maps a face-local direction into object space
uniform float uSeed;
uniform float uTime;

// Per-body art-direction knobs.
uniform float uRoughBase;
uniform float uBandCount;
uniform float uBandContrast;
uniform float uWarpAmount;
uniform float uCraterDensity;
uniform float uIceExtent;
uniform float uContinentLevel;

// Analytic hero features. xy = (longitude, latitude) in radians,
// zw = (angular radius, strength). Unused slots have w = 0.
uniform vec4 uSpotA;
uniform vec4 uSpotB;
uniform float uSpotSwirl;

const float PI2 = 3.14159265359;

// ---------------------------------------------------------------- utilities

float hash11(float p) { return fract(sin(p * 127.1) * 43758.5453123); }

/** Great-circle distance between two (lon, lat) points, radians. */
float angularDistance(vec2 a, vec2 b) {
  float dLat = a.y - b.y;
  float dLon = a.x - b.x;
  float s = sin(dLat * 0.5);
  float t = sin(dLon * 0.5);
  float h = s * s + cos(a.y) * cos(b.y) * t * t;
  return 2.0 * asin(sqrt(clamp(h, 0.0, 1.0)));
}

/** Smooth latitude-band mask, used for polar caps and jet streams. */
float bandMask(float lat, float centre, float width) {
  return 1.0 - smoothstep(width * 0.5, width, abs(lat - centre));
}

/**
 * Distance from a point to a great-circle polyline segment, used to carve
 * real named features (Valles Marineris, Europa's linea) rather than hoping
 * noise produces something canyon-shaped.
 */
float distanceToArc(vec2 p, vec2 a, vec2 b) {
  // Cheap planar approximation: valid because every feature we place spans
  // far less than a radian and sits away from the poles.
  vec2 pa = vec2((p.x - a.x) * cos(a.y), p.y - a.y);
  vec2 ba = vec2((b.x - a.x) * cos(a.y), b.y - a.y);
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

// --------------------------------------------------------------- archetypes

#if defined(ARCH_STAR)
void shadeBody(vec3 dir, float lat, float lon, out vec3 albedo, out float height,
               out float rough, out float emissive, out float spec, out float cloud) {
  vec3 p = dir * 5.0 + uSeed;

  // Two scales of convection: supergranulation under granulation.
  vec2 cellA = worley(p * 2.2);
  vec2 cellB = worley(p * 9.0);
  float granule = (cellA.y - cellA.x) * 0.55 + (cellB.y - cellB.x) * 0.45;
  granule = pow(clamp(granule * 1.6, 0.0, 1.0), 0.7);

  float turbulence = fbm3(p * 4.0, 5, 2.1, 0.5) * 0.5 + 0.5;
  float t = clamp(granule * 0.68 + turbulence * 0.32, 0.0, 1.0);

  // Sunspots: cool umbrae with warm penumbrae, clustered at mid latitudes
  // where they actually occur rather than scattered uniformly.
  float spotField = fbm3(p * 1.3 + 31.0, 3, 2.0, 0.5);
  float latBand = bandMask(abs(lat), 0.28, 0.42);
  float spot = smoothstep(0.34, 0.52, spotField) * latBand;
  t = mix(t, t * 0.24, spot);

  albedo = rampLookup(uPalette, t);
  height = t;
  rough = 1.0;
  // Emissive drives the HDR value; the umbra genuinely emits less.
  emissive = mix(1.0, 0.32, spot) * (0.75 + 0.35 * t);
  spec = 0.0;
  cloud = 0.0;
}
#endif

#if defined(ARCH_ROCKY)
void shadeBody(vec3 dir, float lat, float lon, out vec3 albedo, out float height,
               out float rough, out float emissive, out float spec, out float cloud) {
  vec3 p = dir * 2.6 + uSeed * 13.0;

  float base = fbm3(p, 6, 2.0, 0.5) * 0.5 + 0.5;
  float ridges = ridged3(p * 2.2, 5, 2.1, 0.5);

  // Crater field. Worley F1 gives the basin, and the rim is the derivative
  // of the basin -- a bright annulus just outside the floor.
  vec2 c1 = worley(p * (5.0 + uCraterDensity * 9.0));
  vec2 c2 = worley(p * (13.0 + uCraterDensity * 18.0) + 7.0);
  float basin = smoothstep(0.42, 0.0, c1.x);
  float rim = smoothstep(0.30, 0.40, c1.x) * smoothstep(0.52, 0.42, c1.x);
  float smallCraters = smoothstep(0.28, 0.0, c2.x) * 0.4;
  float craters = (basin * 0.55 + smallCraters) * uCraterDensity;

  float h = base * 0.55 + ridges * 0.35 - craters * 0.5 + rim * 0.22 * uCraterDensity;
  h = clamp(h, 0.0, 1.0);

  // Maria: large, dark, smooth basalt plains. Thresholded low-frequency noise,
  // which is genuinely how they are distributed.
  float maria = smoothstep(0.52, 0.66, fbm3(p * 0.7 + 51.0, 3, 2.0, 0.5) * 0.5 + 0.5);

  // Named canyon systems, if this body has any.
  float canyon = 0.0;
  if (uSpotA.w > 0.0) {
    vec2 pt = vec2(lon, lat);
    float d = min(
      distanceToArc(pt, uSpotA.xy, uSpotA.xy + vec2(uSpotA.z, 0.03)),
      distanceToArc(pt, uSpotA.xy + vec2(uSpotA.z, 0.03), uSpotA.xy + vec2(uSpotA.z * 1.9, -0.02))
    );
    canyon = smoothstep(0.055, 0.0, d) * uSpotA.w;
    h -= canyon * 0.42;
  }

  // Shield volcano, if present: a broad cone with a summit caldera.
  if (uSpotB.w > 0.0) {
    float d = angularDistance(vec2(lon, lat), uSpotB.xy);
    float cone = smoothstep(uSpotB.z, 0.0, d);
    float caldera = smoothstep(uSpotB.z * 0.18, 0.0, d);
    h += (cone * 0.55 - caldera * 0.30) * uSpotB.w;
  }

  float t = clamp(h * 0.82 + 0.09, 0.0, 1.0);
  t = mix(t, t * 0.55, maria * 0.7);

  // Polar frost, if this body keeps any.
  float ice = smoothstep(uIceExtent - 0.16, uIceExtent + 0.05, abs(lat)) * step(0.01, uIceExtent);
  ice *= 0.55 + 0.45 * smoothstep(0.35, 0.65, base);

  albedo = mix(rampLookup(uPalette, t), vec3(0.94, 0.96, 1.0), ice);
  albedo *= 1.0 - canyon * 0.35;

  height = h;
  rough = mix(uRoughBase, 0.55, ice) * (1.0 - maria * 0.15);
  emissive = 0.0;
  spec = ice * 0.15;
  cloud = 0.0;
}
#endif

#if defined(ARCH_TERRAN)
void shadeBody(vec3 dir, float lat, float lon, out vec3 albedo, out float height,
               out float rough, out float emissive, out float spec, out float cloud) {
  vec3 p = dir * 1.9 + uSeed * 7.0;

  // Continents: warped ridged noise thresholded into land. The warp is what
  // gives coastlines their fractal, non-blobby character.
  float warped = warpedFbm(p, 0.55, 3, 6) * 0.5 + 0.5;
  float ridges = ridged3(p * 2.4 + 3.0, 5, 2.1, 0.5);
  float continent = warped * 0.72 + ridges * 0.28;

  float landMask = smoothstep(uContinentLevel - 0.03, uContinentLevel + 0.05, continent);
  float shelf = smoothstep(uContinentLevel - 0.10, uContinentLevel, continent);

  // Elevation above sea level, renormalised so coastlines start at zero.
  float land = max(continent - uContinentLevel, 0.0) / max(1.0 - uContinentLevel, 1e-3);
  float mountains = ridged3(p * 5.5 + 11.0, 5, 2.2, 0.5) * land;
  float elevation = land * 0.6 + mountains * 0.4;

  // Moisture drives the biome ramp, and it falls off with elevation and with
  // distance from the equator -- deserts land in the subtropics, as they do.
  float moisture = fbm3(p * 2.7 + 21.0, 4, 2.0, 0.55) * 0.5 + 0.5;
  float latFactor = cos(lat);
  moisture *= 0.45 + 0.55 * latFactor;
  moisture -= elevation * 0.35;
  moisture -= bandMask(abs(lat), 0.42, 0.5) * 0.22;

  // Ice caps, plus alpine snow above the freezing line.
  float polar = smoothstep(uIceExtent - 0.14, uIceExtent + 0.06, abs(lat));
  float alpine = smoothstep(0.55, 0.78, elevation);
  float ice = clamp(polar + alpine * 0.85, 0.0, 1.0);

  // The palette runs deep ocean -> shelf -> forest -> arid -> rock.
  float t = mix(
    mix(0.02, 0.22, shelf),
    mix(0.72, 0.42, clamp(moisture, 0.0, 1.0)) + elevation * 0.22,
    landMask
  );
  vec3 surface = rampLookup(uPalette, clamp(t, 0.0, 1.0));
  albedo = mix(surface, vec3(0.92, 0.95, 0.99), ice * landMask + polar * (1.0 - landMask) * 0.9);

  height = mix(0.35 - shelf * 0.12, 0.5 + elevation * 0.5, landMask);
  rough = mix(0.06, mix(0.85, 0.6, ice), landMask);
  spec = (1.0 - landMask) * (1.0 - polar * 0.8);

  // City lights: population clusters favour coasts and temperate latitudes,
  // and cluster rather than spreading evenly. Three multiplied noise fields
  // approximate that far better than one.
  float coastal = smoothstep(0.0, 0.16, land) * smoothstep(0.5, 0.06, land);
  float temperate = bandMask(abs(lat), 0.72, 1.5);
  float clusters = smoothstep(0.55, 0.85, fbm3(p * 9.0 + 61.0, 4, 2.2, 0.5) * 0.5 + 0.5);
  float speckle = smoothstep(0.62, 0.95, fbm3(p * 34.0 + 91.0, 3, 2.4, 0.5) * 0.5 + 0.5);
  emissive = landMask * (1.0 - ice) * temperate *
             (coastal * 0.55 + 0.45) * clusters * (0.35 + 0.65 * speckle);

  // Cloud deck, baked into the alpha channel and sampled by the shell mesh at
  // two different scroll rates so one texture animates convincingly.
  float bands = 0.5 + 0.5 * sin(lat * 6.0);
  float cirrus = billow3(p * 3.1 + 41.0, 5, 2.3, 0.55);
  float storm = warpedFbm(p * 2.2 + 71.0, 0.7, 2, 4) * 0.5 + 0.5;
  cloud = clamp(smoothstep(0.42, 0.78, cirrus * 0.6 + storm * 0.4) * (0.55 + 0.45 * bands), 0.0, 1.0);
}
#endif

#if defined(ARCH_GASGIANT)
void shadeBody(vec3 dir, float lat, float lon, out vec3 albedo, out float height,
               out float rough, out float emissive, out float spec, out float cloud) {
  // Latitude is the primary coordinate for a banded atmosphere. Perturbing it
  // with noise *before* the band lookup is what makes bands undulate and
  // interleave rather than sitting as clean stripes.
  vec3 p = dir * 2.0 + uSeed * 3.0;

  float turbulence = fbm3(p * 3.0, 5, 2.1, 0.5);
  float curl = fbm3(p * 6.5 + 17.0, 4, 2.2, 0.5);

  float latPerturbed = lat + turbulence * 0.10 + curl * 0.035;
  float bandPhase = latPerturbed * uBandCount;

  // Alternating zones and belts, with a sharper profile than a plain sine so
  // the boundaries read as shear lines.
  float band = sin(bandPhase);
  band = sign(band) * pow(abs(band), 0.6);
  float t = 0.5 + band * 0.5 * uBandContrast;

  // Zonal jets: fine, high-contrast filaments riding the band boundaries.
  float jet = abs(cos(bandPhase));
  float filament = fbm3(vec3(latPerturbed * 30.0, dir.x * 8.0, dir.z * 8.0) + 5.0, 4, 2.3, 0.5);
  t += filament * 0.10 * smoothstep(0.6, 1.0, jet);

  // Storm ovals scattered along the belts.
  float ovals = smoothstep(0.62, 0.88, billow3(p * 7.0 + 23.0, 4, 2.0, 0.5));
  t += ovals * 0.12;

  // ---- The Great Red Spot -------------------------------------------------
  // An explicit ellipse at its real coordinates, whose sampling domain is
  // *rotated by an amount that falls off from the centre*. That differential
  // rotation is what makes it read as a vortex instead of a coloured smudge.
  float spotMask = 0.0;
  if (uSpotA.w > 0.0) {
    vec2 q = vec2((lon - uSpotA.x) * cos(lat), lat - uSpotA.y);
    // Anticyclones are wider than they are tall.
    q.y /= 0.52;
    float d = length(q) / max(uSpotA.z, 1e-4);
    if (d < 1.6) {
      float swirl = uSpotSwirl * (1.0 - smoothstep(0.0, 1.2, d));
      float cs = cos(swirl), sn = sin(swirl);
      vec2 qr = mat2(cs, -sn, sn, cs) * q;
      float spotNoise = fbm3(vec3(qr * 9.0, uSeed), 4, 2.1, 0.5);
      spotMask = smoothstep(1.0, 0.35, d) * uSpotA.w;
      t = mix(t, 0.90 + spotNoise * 0.10, spotMask);
      // A bright collar of upwelling cloud around the vortex edge.
      t += smoothstep(0.75, 1.0, d) * smoothstep(1.25, 1.0, d) * 0.18 * uSpotA.w;
    }
  }

  // A secondary oval (Oval BA on Jupiter, the Great Dark Spot on Neptune).
  if (uSpotB.w > 0.0) {
    vec2 q = vec2((lon - uSpotB.x) * cos(lat), (lat - uSpotB.y) / 0.6);
    float d = length(q) / max(uSpotB.z, 1e-4);
    float m = smoothstep(1.0, 0.3, d) * uSpotB.w;
    t = mix(t, uSpotB.w > 0.5 ? 0.08 : 0.78, m);
    spotMask = max(spotMask, m);
  }

  albedo = rampLookup(uPalette, clamp(t, 0.0, 1.0));
  height = clamp(t, 0.0, 1.0);
  rough = uRoughBase;
  emissive = 0.0;
  spec = 0.0;
  // Alpha carries the band index so the runtime can scroll each latitude at
  // its own rate without recomputing the band structure.
  cloud = clamp(0.5 + 0.5 * sin(bandPhase), 0.0, 1.0);
}
#endif

#if defined(ARCH_ICEGIANT)
void shadeBody(vec3 dir, float lat, float lon, out vec3 albedo, out float height,
               out float rough, out float emissive, out float spec, out float cloud) {
  vec3 p = dir * 1.7 + uSeed * 5.0;

  // Ice giants are *subtle*. Overdoing the banding is the classic tell that a
  // solar system is procedural, so contrast here is deliberately tiny.
  float turbulence = fbm3(p * 2.4, 4, 2.0, 0.5);
  float bandPhase = (lat + turbulence * 0.07) * uBandCount;
  float t = 0.5 + sin(bandPhase) * 0.5 * uBandContrast;

  // Bright methane cirrus streaks, confined to specific latitudes.
  float streakLat = bandMask(abs(lat), 0.62, 0.44);
  float streaks = smoothstep(0.70, 0.93, billow3(p * 11.0 + 13.0, 4, 2.4, 0.5));
  t += streaks * streakLat * 0.30;

  // Polar hood.
  t += smoothstep(1.05, 1.4, abs(lat)) * 0.12;

  if (uSpotB.w > 0.0) {
    vec2 q = vec2((lon - uSpotB.x) * cos(lat), (lat - uSpotB.y) / 0.55);
    float d = length(q) / max(uSpotB.z, 1e-4);
    t = mix(t, 0.06, smoothstep(1.0, 0.25, d) * uSpotB.w);
  }

  albedo = rampLookup(uPalette, clamp(t, 0.0, 1.0));
  height = clamp(t, 0.0, 1.0);
  rough = uRoughBase;
  emissive = 0.0;
  spec = 0.0;
  cloud = clamp(0.5 + 0.5 * sin(bandPhase), 0.0, 1.0);
}
#endif

#if defined(ARCH_ICEMOON)
void shadeBody(vec3 dir, float lat, float lon, out vec3 albedo, out float height,
               out float rough, out float emissive, out float spec, out float cloud) {
  vec3 p = dir * 3.0 + uSeed * 17.0;

  float base = fbm3(p, 5, 2.0, 0.5) * 0.5 + 0.5;

  // Linea: Worley F2-F1 produces cell *boundaries*, which is almost exactly
  // what a fractured ice shell looks like. Three scales layered gives the
  // characteristic long ridges crossed by finer ones.
  vec2 wA = worley(p * 3.2);
  vec2 wB = worley(p * 7.5 + 4.0);
  vec2 wC = worley(p * 16.0 + 9.0);
  float crackA = smoothstep(0.16, 0.0, wA.y - wA.x);
  float crackB = smoothstep(0.11, 0.0, wB.y - wB.x) * 0.7;
  float crackC = smoothstep(0.07, 0.0, wC.y - wC.x) * 0.4;
  float cracks = clamp(crackA + crackB + crackC, 0.0, 1.0) * uCraterDensity;

  // Impact craters, sparser than on an airless rock because the shell resurfaces.
  vec2 cr = worley(p * 9.0 + 21.0);
  float craters = smoothstep(0.26, 0.0, cr.x) * (1.0 - uCraterDensity) * 0.8;

  float t = clamp(0.62 + base * 0.34 - craters * 0.30, 0.0, 1.0);
  // Tholin staining in the fractures: the reddish-brown that makes Europa
  // recognisable rather than a plain white ball.
  t = mix(t, 0.20, cracks * 0.75);

  // Strong hemispheric albedo contrast, for two-faced moons like Iapetus.
  if (uSpotB.w > 0.0) {
    float leading = 0.5 + 0.5 * cos(lon - uSpotB.x);
    t = mix(t, t * 0.16, pow(leading, 2.5) * uSpotB.w);
  }

  albedo = rampLookup(uPalette, t);
  height = base * 0.6 - craters * 0.35 + cracks * 0.1;
  rough = mix(uRoughBase, 0.9, craters);
  emissive = 0.0;
  spec = (1.0 - cracks) * 0.25;
  cloud = 0.0;
}
#endif

#if defined(ARCH_VOLCANIC)
void shadeBody(vec3 dir, float lat, float lon, out vec3 albedo, out float height,
               out float rough, out float emissive, out float spec, out float cloud) {
  vec3 p = dir * 3.4 + uSeed * 23.0;

  float base = fbm3(p, 5, 2.0, 0.55) * 0.5 + 0.5;

  // Calderas: Worley cells whose centres are dark and floors are hot.
  vec2 c1 = worley(p * 4.5);
  vec2 c2 = worley(p * 10.0 + 6.0);
  float caldera = smoothstep(0.30, 0.0, c1.x);
  float smallVents = smoothstep(0.16, 0.0, c2.x);

  // Sulfur allotropes: the yellow/orange/white/black palette Io actually has.
  float sulfur = fbm3(p * 2.0 + 13.0, 4, 2.0, 0.5) * 0.5 + 0.5;
  float t = clamp(0.45 + sulfur * 0.5 + base * 0.15, 0.0, 1.0);
  t = mix(t, 0.05, caldera * 0.85);
  t = mix(t, 0.98, smoothstep(0.72, 0.9, sulfur) * 0.5);

  // Fresh flows radiating from the vents.
  float flows = smoothstep(0.35, 0.05, c1.x) * smoothstep(0.0, 0.25, c1.x);
  t = mix(t, 0.88, flows * 0.4);

  albedo = rampLookup(uPalette, t);
  height = base * 0.5 - caldera * 0.4 + smallVents * 0.1;
  rough = mix(uRoughBase, 0.95, caldera);
  // The caldera floors genuinely glow; this is what the bloom pass will catch.
  emissive = caldera * caldera * 0.55 + smallVents * 0.12;
  spec = 0.0;
  cloud = 0.0;
}
#endif

// -------------------------------------------------------------------- main

void main() {
  // The fullscreen quad covers one cube face; the basis rotates it into place.
  vec3 faceDir = vec3(vUv * 2.0 - 1.0, 1.0);
  vec3 dir = normalize(uFaceBasis * faceDir);

  float lat = asin(clamp(dir.y, -1.0, 1.0));
  float lon = atan(dir.z, dir.x);

  vec3 albedo;
  float height, rough, emissive, spec, cloud;
  shadeBody(dir, lat, lon, albedo, height, rough, emissive, spec, cloud);

  fragColor = uOutput == 0
    ? vec4(max(albedo, vec3(0.0)), clamp(spec, 0.0, 1.0))
    : vec4(
        clamp(height, 0.0, 1.0),
        clamp(rough, 0.02, 1.0),
        clamp(emissive, 0.0, 1.0),
        clamp(cloud, 0.0, 1.0)
      );
}
`;
