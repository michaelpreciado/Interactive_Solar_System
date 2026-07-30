/**
 * The single source of truth for every body in the simulation.
 *
 * Physical values are real (IAU / NASA planetary fact sheet). Rendering values
 * are art direction. The two are kept in separate fields so the "true scale"
 * morph can interpolate between them without anything else in the app needing
 * to know which mode it is in.
 */

import { KM_PER_UNIT } from '../sim/constants';
import type { PlanetId } from '../sim/ephemeris';

/**
 * Which baked-surface program a body uses. Six archetypes rather than one
 * uber-shader with runtime branches: untaken branches still cost register
 * pressure on mobile GPUs, and eleven bespoke shaders is unmaintainable.
 */
export type Archetype =
  | 'star'
  | 'rocky'
  | 'terran'
  | 'gasGiant'
  | 'iceGiant'
  | 'iceMoon'
  | 'volcanic';

export type BodyKind = 'star' | 'planet' | 'dwarf' | 'moon';

export interface SatelliteOrbit {
  /** Semi-major axis about the parent, km. */
  semiMajorKm: number;
  /** Sidereal period in days. Negative means a retrograde orbit. */
  periodDays: number;
  /** Inclination to the parent's equator, degrees. */
  inclinationDeg: number;
  /** Orbital phase at J2000, radians. Spreads moons out so they don't line up. */
  phase: number;
}

export interface AtmosphereDef {
  /** Shell height as a fraction of body radius. */
  heightFraction: number;
  /** Rayleigh scattering tint (linear RGB, roughly wavelength-dependent). */
  rayleigh: [number, number, number];
  /** Mie (aerosol) tint. */
  mie: [number, number, number];
  /** Mie asymmetry g in [0,1). Higher is more forward-scattering haze. */
  mieG: number;
  /** Overall optical density multiplier. */
  density: number;
}

export interface BodyDef {
  id: string;
  name: string;
  kind: BodyKind;
  archetype: Archetype;
  /** Parent body id. Absent for the Sun and the planets. */
  parent?: string;
  /** Planets and Pluto propagate from Standish elements keyed by this id. */
  planetId?: PlanetId;
  /** Moons propagate from these instead. */
  satellite?: SatelliteOrbit;

  // ---- Physical -----------------------------------------------------------
  /** Equatorial radius, km. */
  radiusKm: number;
  /** Polar flattening (0 = sphere). Saturn is visibly oblate at 0.098. */
  flattening: number;
  massKg: number;
  /** Sidereal rotation period, hours. Negative means retrograde. */
  rotationHours: number;
  /** Axial tilt, degrees. */
  obliquityDeg: number;
  /** Mean surface (or 1-bar) temperature, kelvin. */
  meanTempK: number;
  /** Surface gravity, m/s^2. */
  gravity: number;
  /** Escape velocity, km/s. */
  escapeVelocityKms: number;
  /** Bond albedo, 0..1. */
  albedo: number;
  /** Mean density, g/cm^3. */
  densityGcm3: number;
  /** Dominant atmospheric constituents, for the composition readout. */
  composition: Array<{ label: string; fraction: number }>;

  // ---- Rendering ----------------------------------------------------------
  /**
   * Radius used in compressed mode, scene units. Chosen so every body is
   * clickable at system scale while relative sizes still read correctly.
   */
  displayRadius: number;
  /** Orbit-line and UI accent colour, sRGB hex. */
  accent: string;
  /** Deterministic seed for the procedural bake. */
  seed: number;
  /** Colour ramp stops for the surface LUT, sRGB hex, dark to bright. */
  palette: string[];
  atmosphere?: AtmosphereDef;
  /** Heroes get 2048px cube-map bakes; everything else gets a small equirect. */
  hero?: boolean;
  /** Emissive strength in linear HDR. Only the Sun exceeds 1 and blooms. */
  emissive?: number;
}

// Scene-unit radius from true kilometres.
const u = (km: number) => km / KM_PER_UNIT;

export const BODIES: BodyDef[] = [
  // ---------------------------------------------------------------- Sun ----
  {
    id: 'sun',
    name: 'Sun',
    kind: 'star',
    archetype: 'star',
    radiusKm: 696000,
    flattening: 0,
    massKg: 1.9885e30,
    rotationHours: 609.12,
    obliquityDeg: 7.25,
    meanTempK: 5772,
    gravity: 274,
    escapeVelocityKms: 617.6,
    albedo: 0,
    densityGcm3: 1.408,
    composition: [
      { label: 'Hydrogen', fraction: 0.734 },
      { label: 'Helium', fraction: 0.25 },
      { label: 'Oxygen', fraction: 0.008 },
      { label: 'Carbon', fraction: 0.003 },
    ],
    displayRadius: 28,
    accent: '#ffb648',
    seed: 1,
    palette: ['#5a1400', '#c23c00', '#ff8a1e', '#ffd166', '#fff6e0'],
    hero: true,
    emissive: 14,
  },

  // ------------------------------------------------------------ Mercury ----
  {
    id: 'mercury',
    name: 'Mercury',
    kind: 'planet',
    archetype: 'rocky',
    planetId: 'mercury',
    radiusKm: 2439.7,
    flattening: 0,
    massKg: 3.3011e23,
    rotationHours: 1407.6,
    obliquityDeg: 0.034,
    meanTempK: 440,
    gravity: 3.7,
    escapeVelocityKms: 4.25,
    albedo: 0.088,
    densityGcm3: 5.427,
    composition: [
      { label: 'Oxygen', fraction: 0.42 },
      { label: 'Sodium', fraction: 0.29 },
      { label: 'Hydrogen', fraction: 0.22 },
      { label: 'Helium', fraction: 0.06 },
    ],
    displayRadius: 1.5,
    accent: '#a8a29a',
    seed: 2,
    palette: ['#2b2724', '#5c554e', '#8b8279', '#b3aaa0', '#d6cec5'],
  },

  // -------------------------------------------------------------- Venus ----
  {
    id: 'venus',
    name: 'Venus',
    kind: 'planet',
    archetype: 'rocky',
    planetId: 'venus',
    radiusKm: 6051.8,
    flattening: 0,
    massKg: 4.8675e24,
    rotationHours: -5832.5,
    obliquityDeg: 177.36,
    meanTempK: 737,
    gravity: 8.87,
    escapeVelocityKms: 10.36,
    albedo: 0.76,
    densityGcm3: 5.243,
    composition: [
      { label: 'Carbon dioxide', fraction: 0.965 },
      { label: 'Nitrogen', fraction: 0.035 },
      { label: 'Sulfur dioxide', fraction: 0.00015 },
    ],
    displayRadius: 2.4,
    accent: '#e8c37a',
    seed: 3,
    palette: ['#6b4a1e', '#a8783a', '#d4a860', '#eccd90', '#f7e6c2'],
    atmosphere: {
      heightFraction: 0.045,
      rayleigh: [0.9, 0.72, 0.4],
      mie: [1.0, 0.86, 0.6],
      mieG: 0.78,
      density: 3.4,
    },
    hero: true,
  },

  // -------------------------------------------------------------- Earth ----
  {
    id: 'earth',
    name: 'Earth',
    kind: 'planet',
    archetype: 'terran',
    planetId: 'earth',
    radiusKm: 6371.0,
    flattening: 0.00335,
    massKg: 5.97237e24,
    rotationHours: 23.9345,
    obliquityDeg: 23.44,
    meanTempK: 288,
    gravity: 9.807,
    escapeVelocityKms: 11.186,
    albedo: 0.306,
    densityGcm3: 5.514,
    composition: [
      { label: 'Nitrogen', fraction: 0.781 },
      { label: 'Oxygen', fraction: 0.209 },
      { label: 'Argon', fraction: 0.0093 },
      { label: 'Carbon dioxide', fraction: 0.00042 },
    ],
    displayRadius: 2.6,
    accent: '#5aa9e6',
    seed: 4,
    palette: ['#123a63', '#1d6ba8', '#2b7d43', '#8a9a52', '#ddcfa8'],
    atmosphere: {
      heightFraction: 0.045,
      rayleigh: [0.19, 0.46, 1.0],
      mie: [1.0, 0.95, 0.9],
      mieG: 0.68,
      density: 1.0,
    },
    hero: true,
  },
  {
    id: 'luna',
    name: 'The Moon',
    kind: 'moon',
    archetype: 'rocky',
    parent: 'earth',
    satellite: { semiMajorKm: 384400, periodDays: 27.321661, inclinationDeg: 5.145, phase: 2.1 },
    radiusKm: 1737.4,
    flattening: 0,
    massKg: 7.342e22,
    rotationHours: 655.72,
    obliquityDeg: 6.68,
    meanTempK: 250,
    gravity: 1.62,
    escapeVelocityKms: 2.38,
    albedo: 0.11,
    densityGcm3: 3.344,
    composition: [{ label: 'Trace exosphere', fraction: 1 }],
    displayRadius: 0.72,
    accent: '#cfcbc4',
    seed: 5,
    palette: ['#232323', '#4a4a48', '#7c7a75', '#a8a49c', '#cfcbc4'],
  },

  // --------------------------------------------------------------- Mars ----
  {
    id: 'mars',
    name: 'Mars',
    kind: 'planet',
    archetype: 'rocky',
    planetId: 'mars',
    radiusKm: 3389.5,
    flattening: 0.00589,
    massKg: 6.4171e23,
    rotationHours: 24.6229,
    obliquityDeg: 25.19,
    meanTempK: 210,
    gravity: 3.721,
    escapeVelocityKms: 5.03,
    albedo: 0.25,
    densityGcm3: 3.9335,
    composition: [
      { label: 'Carbon dioxide', fraction: 0.951 },
      { label: 'Nitrogen', fraction: 0.026 },
      { label: 'Argon', fraction: 0.019 },
      { label: 'Oxygen', fraction: 0.0016 },
    ],
    displayRadius: 1.9,
    accent: '#e2703a',
    seed: 6,
    palette: ['#3a1608', '#7a3216', '#b4552a', '#d98b52', '#f0d8c0'],
    atmosphere: {
      heightFraction: 0.035,
      rayleigh: [0.55, 0.38, 0.28],
      mie: [1.0, 0.72, 0.45],
      mieG: 0.72,
      density: 0.16,
    },
    hero: true,
  },
  {
    id: 'phobos',
    name: 'Phobos',
    kind: 'moon',
    archetype: 'rocky',
    parent: 'mars',
    satellite: { semiMajorKm: 9376, periodDays: 0.31891, inclinationDeg: 1.093, phase: 0.4 },
    radiusKm: 11.27,
    flattening: 0.3,
    massKg: 1.0659e16,
    rotationHours: 7.65,
    obliquityDeg: 0,
    meanTempK: 233,
    gravity: 0.0057,
    escapeVelocityKms: 0.0114,
    albedo: 0.071,
    densityGcm3: 1.876,
    composition: [{ label: 'Carbonaceous rock', fraction: 1 }],
    displayRadius: 0.16,
    accent: '#8a7a6a',
    seed: 7,
    palette: ['#1d1814', '#3d332a', '#5f5245', '#807162', '#9d8d7c'],
  },
  {
    id: 'deimos',
    name: 'Deimos',
    kind: 'moon',
    archetype: 'rocky',
    parent: 'mars',
    satellite: { semiMajorKm: 23463, periodDays: 1.263, inclinationDeg: 0.93, phase: 3.9 },
    radiusKm: 6.2,
    flattening: 0.28,
    massKg: 1.4762e15,
    rotationHours: 30.31,
    obliquityDeg: 0,
    meanTempK: 233,
    gravity: 0.003,
    escapeVelocityKms: 0.0056,
    albedo: 0.068,
    densityGcm3: 1.471,
    composition: [{ label: 'Carbonaceous rock', fraction: 1 }],
    displayRadius: 0.13,
    accent: '#9b8b78',
    seed: 8,
    palette: ['#211b16', '#42382e', '#66594a', '#877866', '#a5947f'],
  },

  // ------------------------------------------------------------ Jupiter ----
  {
    id: 'jupiter',
    name: 'Jupiter',
    kind: 'planet',
    archetype: 'gasGiant',
    planetId: 'jupiter',
    radiusKm: 69911,
    flattening: 0.06487,
    massKg: 1.8982e27,
    rotationHours: 9.925,
    obliquityDeg: 3.13,
    meanTempK: 165,
    gravity: 24.79,
    escapeVelocityKms: 59.5,
    albedo: 0.503,
    densityGcm3: 1.326,
    composition: [
      { label: 'Hydrogen', fraction: 0.898 },
      { label: 'Helium', fraction: 0.102 },
      { label: 'Methane', fraction: 0.003 },
      { label: 'Ammonia', fraction: 0.00026 },
    ],
    displayRadius: 8.2,
    accent: '#d8a06a',
    seed: 9,
    palette: ['#4a2c18', '#8a5a30', '#c08d55', '#e3c096', '#f6ead6'],
    atmosphere: {
      heightFraction: 0.028,
      rayleigh: [0.6, 0.5, 0.42],
      mie: [1.0, 0.85, 0.66],
      mieG: 0.7,
      density: 0.9,
    },
    hero: true,
  },
  {
    id: 'io',
    name: 'Io',
    kind: 'moon',
    archetype: 'volcanic',
    parent: 'jupiter',
    satellite: { semiMajorKm: 421700, periodDays: 1.769138, inclinationDeg: 0.05, phase: 0.9 },
    radiusKm: 1821.6,
    flattening: 0,
    massKg: 8.9319e22,
    rotationHours: 42.46,
    obliquityDeg: 0,
    meanTempK: 110,
    gravity: 1.796,
    escapeVelocityKms: 2.558,
    albedo: 0.63,
    densityGcm3: 3.528,
    composition: [{ label: 'Sulfur dioxide', fraction: 0.9 }],
    displayRadius: 0.74,
    accent: '#f0d95a',
    seed: 10,
    palette: ['#3a2a06', '#8a6a10', '#d4b32a', '#f2e07a', '#fdf6c8'],
  },
  {
    id: 'europa',
    name: 'Europa',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'jupiter',
    satellite: { semiMajorKm: 671034, periodDays: 3.551181, inclinationDeg: 0.47, phase: 2.7 },
    radiusKm: 1560.8,
    flattening: 0,
    massKg: 4.7998e22,
    rotationHours: 85.23,
    obliquityDeg: 0.1,
    meanTempK: 102,
    gravity: 1.314,
    escapeVelocityKms: 2.025,
    albedo: 0.67,
    densityGcm3: 3.013,
    composition: [{ label: 'Oxygen (trace)', fraction: 1 }],
    displayRadius: 0.66,
    accent: '#dfe8f2',
    seed: 11,
    palette: ['#5a4a3a', '#9a8878', '#cfd6de', '#e8eef5', '#ffffff'],
  },
  {
    id: 'ganymede',
    name: 'Ganymede',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'jupiter',
    satellite: { semiMajorKm: 1070412, periodDays: 7.15455, inclinationDeg: 0.2, phase: 5.1 },
    radiusKm: 2634.1,
    flattening: 0,
    massKg: 1.4819e23,
    rotationHours: 171.71,
    obliquityDeg: 0.33,
    meanTempK: 110,
    gravity: 1.428,
    escapeVelocityKms: 2.741,
    albedo: 0.43,
    densityGcm3: 1.936,
    composition: [{ label: 'Oxygen (trace)', fraction: 1 }],
    displayRadius: 0.86,
    accent: '#b0a795',
    seed: 12,
    palette: ['#332c26', '#5f544a', '#8d8175', '#b6ab9d', '#d8d0c4'],
  },
  {
    id: 'callisto',
    name: 'Callisto',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'jupiter',
    satellite: { semiMajorKm: 1882709, periodDays: 16.6890, inclinationDeg: 0.192, phase: 1.4 },
    radiusKm: 2410.3,
    flattening: 0,
    massKg: 1.0759e23,
    rotationHours: 400.54,
    obliquityDeg: 0,
    meanTempK: 134,
    gravity: 1.235,
    escapeVelocityKms: 2.44,
    albedo: 0.22,
    densityGcm3: 1.834,
    composition: [{ label: 'Carbon dioxide (trace)', fraction: 1 }],
    displayRadius: 0.82,
    accent: '#7d7368',
    seed: 13,
    palette: ['#1e1a17', '#3d352e', '#655a4e', '#8d8072', '#b3a698'],
  },

  // ------------------------------------------------------------- Saturn ----
  {
    id: 'saturn',
    name: 'Saturn',
    kind: 'planet',
    archetype: 'gasGiant',
    planetId: 'saturn',
    radiusKm: 58232,
    flattening: 0.09796,
    massKg: 5.6834e26,
    rotationHours: 10.656,
    obliquityDeg: 26.73,
    meanTempK: 134,
    gravity: 10.44,
    escapeVelocityKms: 35.5,
    albedo: 0.342,
    densityGcm3: 0.687,
    composition: [
      { label: 'Hydrogen', fraction: 0.963 },
      { label: 'Helium', fraction: 0.0325 },
      { label: 'Methane', fraction: 0.0045 },
    ],
    displayRadius: 7.0,
    accent: '#e6cf9a',
    seed: 14,
    palette: ['#5e4622', '#9c7c43', '#cfb075', '#ecd7a8', '#faf0d8'],
    atmosphere: {
      heightFraction: 0.028,
      rayleigh: [0.62, 0.55, 0.42],
      mie: [1.0, 0.9, 0.7],
      mieG: 0.7,
      density: 0.8,
    },
    hero: true,
  },
  {
    id: 'enceladus',
    name: 'Enceladus',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'saturn',
    satellite: { semiMajorKm: 237948, periodDays: 1.370218, inclinationDeg: 0.009, phase: 1.1 },
    radiusKm: 252.1,
    flattening: 0,
    massKg: 1.0802e20,
    rotationHours: 32.885,
    obliquityDeg: 0,
    meanTempK: 75,
    gravity: 0.113,
    escapeVelocityKms: 0.239,
    albedo: 0.81,
    densityGcm3: 1.609,
    composition: [{ label: 'Water vapour plumes', fraction: 1 }],
    displayRadius: 0.3,
    accent: '#f2f8ff',
    seed: 15,
    palette: ['#8fa2b4', '#c2d2e0', '#e2edf7', '#f4f9ff', '#ffffff'],
  },
  {
    id: 'titan',
    name: 'Titan',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'saturn',
    satellite: { semiMajorKm: 1221870, periodDays: 15.945, inclinationDeg: 0.349, phase: 4.4 },
    radiusKm: 2574.7,
    flattening: 0,
    massKg: 1.3452e23,
    rotationHours: 382.68,
    obliquityDeg: 0,
    meanTempK: 94,
    gravity: 1.352,
    escapeVelocityKms: 2.639,
    albedo: 0.22,
    densityGcm3: 1.882,
    composition: [
      { label: 'Nitrogen', fraction: 0.943 },
      { label: 'Methane', fraction: 0.049 },
      { label: 'Hydrogen', fraction: 0.001 },
    ],
    displayRadius: 0.85,
    accent: '#e0a94e',
    seed: 16,
    palette: ['#4a2f0c', '#8a5f1c', '#c08e34', '#e0b45e', '#f2d99a'],
    atmosphere: {
      heightFraction: 0.09,
      rayleigh: [0.85, 0.6, 0.28],
      mie: [1.0, 0.75, 0.35],
      mieG: 0.82,
      density: 2.6,
    },
  },
  {
    id: 'iapetus',
    name: 'Iapetus',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'saturn',
    satellite: { semiMajorKm: 3560820, periodDays: 79.3215, inclinationDeg: 15.47, phase: 0.2 },
    radiusKm: 734.5,
    flattening: 0.046,
    massKg: 1.8056e21,
    rotationHours: 1903.7,
    obliquityDeg: 0,
    meanTempK: 110,
    gravity: 0.223,
    escapeVelocityKms: 0.573,
    albedo: 0.25,
    densityGcm3: 1.088,
    composition: [{ label: 'Water ice and tholins', fraction: 1 }],
    displayRadius: 0.4,
    accent: '#b9ada0',
    seed: 17,
    palette: ['#141110', '#3a322c', '#8d8478', '#cfc7ba', '#eee8dc'],
  },

  // ------------------------------------------------------------- Uranus ----
  {
    id: 'uranus',
    name: 'Uranus',
    kind: 'planet',
    archetype: 'iceGiant',
    planetId: 'uranus',
    radiusKm: 25362,
    flattening: 0.02293,
    massKg: 8.681e25,
    rotationHours: -17.24,
    obliquityDeg: 97.77,
    meanTempK: 76,
    gravity: 8.87,
    escapeVelocityKms: 21.3,
    albedo: 0.3,
    densityGcm3: 1.27,
    composition: [
      { label: 'Hydrogen', fraction: 0.825 },
      { label: 'Helium', fraction: 0.152 },
      { label: 'Methane', fraction: 0.023 },
    ],
    displayRadius: 4.4,
    accent: '#8fd8e0',
    seed: 18,
    palette: ['#12414a', '#1f6b74', '#3fa0a6', '#87cfd4', '#cdeff2'],
    atmosphere: {
      heightFraction: 0.038,
      rayleigh: [0.28, 0.72, 0.86],
      mie: [0.8, 0.95, 1.0],
      mieG: 0.6,
      density: 1.1,
    },
  },
  {
    id: 'titania',
    name: 'Titania',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'uranus',
    satellite: { semiMajorKm: 436300, periodDays: 8.706234, inclinationDeg: 0.34, phase: 2.2 },
    radiusKm: 788.4,
    flattening: 0,
    massKg: 3.4e21,
    rotationHours: 208.95,
    obliquityDeg: 0,
    meanTempK: 70,
    gravity: 0.367,
    escapeVelocityKms: 0.773,
    albedo: 0.35,
    densityGcm3: 1.711,
    composition: [{ label: 'Water ice and rock', fraction: 1 }],
    displayRadius: 0.42,
    accent: '#a9a29c',
    seed: 19,
    palette: ['#282422', '#4e4744', '#7a726c', '#a49b94', '#c9c0b8'],
  },

  // ------------------------------------------------------------ Neptune ----
  {
    id: 'neptune',
    name: 'Neptune',
    kind: 'planet',
    archetype: 'iceGiant',
    planetId: 'neptune',
    radiusKm: 24622,
    flattening: 0.01708,
    massKg: 1.02413e26,
    rotationHours: 16.11,
    obliquityDeg: 28.32,
    meanTempK: 72,
    gravity: 11.15,
    escapeVelocityKms: 23.5,
    albedo: 0.29,
    densityGcm3: 1.638,
    composition: [
      { label: 'Hydrogen', fraction: 0.8 },
      { label: 'Helium', fraction: 0.19 },
      { label: 'Methane', fraction: 0.015 },
    ],
    displayRadius: 4.3,
    accent: '#5a7ce0',
    seed: 20,
    palette: ['#0a1a4a', '#1a3a86', '#3a63c4', '#7fa0e8', '#c6d8ff'],
    atmosphere: {
      heightFraction: 0.038,
      rayleigh: [0.2, 0.42, 1.0],
      mie: [0.7, 0.85, 1.0],
      mieG: 0.6,
      density: 1.2,
    },
  },
  {
    id: 'triton',
    name: 'Triton',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'neptune',
    // Retrograde: the negative period reverses the direction of travel.
    satellite: { semiMajorKm: 354759, periodDays: -5.876854, inclinationDeg: 156.885, phase: 3.3 },
    radiusKm: 1353.4,
    flattening: 0,
    massKg: 2.139e22,
    rotationHours: -141.04,
    obliquityDeg: 0,
    meanTempK: 38,
    gravity: 0.779,
    escapeVelocityKms: 1.455,
    albedo: 0.76,
    densityGcm3: 2.061,
    composition: [{ label: 'Nitrogen (thin)', fraction: 1 }],
    displayRadius: 0.6,
    accent: '#e8dfe8',
    seed: 21,
    palette: ['#6a5a66', '#9a8a96', '#c8bcc4', '#e6dee4', '#fbf7fa'],
  },

  // -------------------------------------------------------------- Pluto ----
  {
    id: 'pluto',
    name: 'Pluto',
    kind: 'dwarf',
    archetype: 'iceMoon',
    planetId: 'pluto',
    radiusKm: 1188.3,
    flattening: 0,
    massKg: 1.303e22,
    rotationHours: -153.29,
    obliquityDeg: 122.53,
    meanTempK: 44,
    gravity: 0.62,
    escapeVelocityKms: 1.21,
    albedo: 0.52,
    densityGcm3: 1.854,
    composition: [
      { label: 'Nitrogen', fraction: 0.9 },
      { label: 'Methane', fraction: 0.07 },
      { label: 'Carbon monoxide', fraction: 0.03 },
    ],
    displayRadius: 1.1,
    accent: '#d6b89a',
    seed: 22,
    palette: ['#3a2a20', '#6d5442', '#9e8067', '#c9ae90', '#eeddc6'],
  },
  {
    id: 'charon',
    name: 'Charon',
    kind: 'moon',
    archetype: 'iceMoon',
    parent: 'pluto',
    satellite: { semiMajorKm: 19591, periodDays: 6.3872, inclinationDeg: 0.08, phase: 1.7 },
    radiusKm: 606,
    flattening: 0,
    massKg: 1.586e21,
    rotationHours: 153.29,
    obliquityDeg: 0,
    meanTempK: 53,
    gravity: 0.288,
    escapeVelocityKms: 0.59,
    albedo: 0.35,
    densityGcm3: 1.702,
    composition: [{ label: 'Water ice', fraction: 1 }],
    displayRadius: 0.55,
    accent: '#a9a2a0',
    seed: 23,
    palette: ['#2a2624', '#514a46', '#7d746e', '#a69c95', '#cdc3ba'],
  },
];

export const BODY_BY_ID: Record<string, BodyDef> = Object.fromEntries(
  BODIES.map((b) => [b.id, b])
);

export const BODY_IDS = BODIES.map((b) => b.id);

export const PLANETS = BODIES.filter((b) => b.kind === 'planet');
export const MOONS = BODIES.filter((b) => b.kind === 'moon');

/** True radius in scene units. */
export const trueRadius = (b: BodyDef): number => u(b.radiusKm);

/**
 * Radius for a given scale morph. t=0 is compressed/artistic, t=1 is true scale.
 * Both endpoints are precomputed so this is two multiplies in the frame loop.
 */
export const morphedRadius = (b: BodyDef, t: number): number =>
  b.displayRadius + (u(b.radiusKm) - b.displayRadius) * t;

/** Satellite semi-major axis in scene units. */
export const satelliteRadius = (b: BodyDef): number =>
  b.satellite ? b.satellite.semiMajorKm / KM_PER_UNIT : 0;

/**
 * Compressed-mode orbital distance.
 *
 * Real distances span 0.39 to 39 AU. Scaled naively against the Sun's artistic
 * display radius of 28 units, Mercury ends up *inside the Sun*. The constant
 * offset clears the photosphere with room to spare, and the sub-linear exponent
 * pulls Pluto back into frame while preserving the ordering and the sense that
 * the outer system is far emptier than the inner.
 *
 * Mercury lands at 76 units, Earth at 97, Jupiter at 183, Neptune at 383.
 */
const INNER_CLEARANCE = 45;
export const compressDistance = (au: number): number =>
  INNER_CLEARANCE + 52 * Math.pow(au, 0.55);
