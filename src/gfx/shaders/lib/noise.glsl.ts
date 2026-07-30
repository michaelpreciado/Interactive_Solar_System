/**
 * Noise primitives.
 *
 * These run in the *bake* pass, which happens a handful of times at load, so
 * they can afford to be good. The runtime path samples the baked result and
 * only re-invokes `fbm3` for the close-zoom detail octaves.
 */

/** Ashima-style 3D simplex noise. ~40% cheaper than classic Perlin in 3D. */
export const SIMPLEX3 = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`;

/** Worley / cellular noise. Returns (F1, F2) -- F2-F1 gives crack networks. */
export const WORLEY3 = /* glsl */ `
vec3 hash33(vec3 p) {
  p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
           dot(p, vec3(269.5, 183.3, 246.1)),
           dot(p, vec3(113.5, 271.9, 124.6)));
  return fract(sin(p) * 43758.5453123);
}

vec2 worley(vec3 p) {
  vec3 base = floor(p);
  vec3 f = fract(p);
  float f1 = 1e9;
  float f2 = 1e9;
  for (int k = -1; k <= 1; k++) {
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec3 g = vec3(float(i), float(j), float(k));
        vec3 o = hash33(base + g);
        vec3 r = g + o - f;
        float d = dot(r, r);
        if (d < f1) { f2 = f1; f1 = d; }
        else if (d < f2) { f2 = d; }
      }
    }
  }
  return vec2(sqrt(f1), sqrt(f2));
}
`;

/** Fractal sums, ridged variants, and domain warping. */
export const FBM = /* glsl */ `
float fbm3(vec3 p, int octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * snoise(p);
    norm += amp;
    p *= lacunarity;
    amp *= gain;
  }
  return sum / max(norm, 1e-5);
}

/** Ridged multifractal: sharp crests, the basis of mountain ranges. */
float ridged3(vec3 p, int octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  float prev = 1.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    float n = 1.0 - abs(snoise(p));
    n *= n;
    n *= prev;
    prev = n;
    sum += amp * n;
    norm += amp;
    p *= lacunarity;
    amp *= gain;
  }
  return sum / max(norm, 1e-5);
}

/** Billowy noise: rounded lobes, good for cloud decks. */
float billow3(vec3 p, int octaves, float lacunarity, float gain) {
  float sum = 0.0;
  float amp = 0.5;
  float norm = 0.0;
  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    sum += amp * abs(snoise(p));
    norm += amp;
    p *= lacunarity;
    amp *= gain;
  }
  return sum / max(norm, 1e-5);
}

/**
 * Two-level domain warp. This is what turns "noise" into "weather" -- the
 * sample point is displaced by another noise field before evaluation, so
 * features shear and curl instead of sitting in an isotropic blur.
 */
vec3 warp3(vec3 p, float amount, int octaves) {
  vec3 q = vec3(
    fbm3(p + vec3(0.0, 0.0, 0.0), octaves, 2.0, 0.5),
    fbm3(p + vec3(5.2, 1.3, 2.8), octaves, 2.0, 0.5),
    fbm3(p + vec3(1.7, 9.2, 4.1), octaves, 2.0, 0.5)
  );
  return p + q * amount;
}

float warpedFbm(vec3 p, float warpAmount, int warpOct, int oct) {
  return fbm3(warp3(p, warpAmount, warpOct), oct, 2.0, 0.5);
}
`;

/** Direction <-> equirectangular mapping, plus a seamless sphere sampler. */
export const SPHERE_MAP = /* glsl */ `
const float PI_ = 3.14159265359;
const float TAU_ = 6.28318530718;

/** Equirect uv in [0,1]^2 -> unit direction. */
vec3 uvToDirection(vec2 uv) {
  float lon = (uv.x - 0.5) * TAU_;
  float lat = (uv.y - 0.5) * PI_;
  float cl = cos(lat);
  return vec3(cl * cos(lon), sin(lat), cl * sin(lon));
}

/** Unit direction -> equirect uv. */
vec2 directionToUv(vec3 d) {
  return vec2(atan(d.z, d.x) / TAU_ + 0.5, asin(clamp(d.y, -1.0, 1.0)) / PI_ + 0.5);
}

float latitudeOf(vec3 d) { return asin(clamp(d.y, -1.0, 1.0)); }
float longitudeOf(vec3 d) { return atan(d.z, d.x); }
`;

/** Colour ramp lookup and small colour utilities. */
export const COLOR_LIB = /* glsl */ `
vec3 rampLookup(sampler2D lut, float t) {
  return texture2D(lut, vec2(clamp(t, 0.003, 0.997), 0.5)).rgb;
}

/** Planck-locus approximation, for star colour from temperature. */
vec3 blackbody(float kelvin) {
  float t = clamp(kelvin, 1000.0, 40000.0) / 100.0;
  float r, g, b;
  if (t <= 66.0) {
    r = 1.0;
    g = clamp(0.39008157 * log(t) - 0.63184144, 0.0, 1.0);
    b = t <= 19.0 ? 0.0 : clamp(0.54320678 * log(t - 10.0) - 1.19625408, 0.0, 1.0);
  } else {
    r = clamp(1.29293618 * pow(t - 60.0, -0.1332047592), 0.0, 1.0);
    g = clamp(1.12989086 * pow(t - 60.0, -0.0755148492), 0.0, 1.0);
    b = 1.0;
  }
  return vec3(r, g, b);
}

float luminance(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
`;

/** Everything a bake shader needs, in one string. */
export const NOISE_BUNDLE = [SIMPLEX3, WORLEY3, FBM, SPHERE_MAP, COLOR_LIB].join('\n');
