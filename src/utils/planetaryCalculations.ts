import { Vector3 } from 'three'

export interface MoonData {
  name: string
  radius: number
  color: string
  orbitRadius: number
  orbitSpeed: number
  orbitInclination: number
}

export interface PlanetData {
  name: string
  position: Vector3
  radius: number
  color: string
  orbitRadius: number
  orbitSpeed: number
  axialTilt: number
  dayLength: number // hours
  yearLength: number // Earth days
  temperature: number // Kelvin
  moons: MoonData[]
  mass: number // Earth masses
  density: number // g/cm³
  distanceFromSun: number // AU - real distance
}

// Moon data for each planet
const moonData: Record<string, MoonData[]> = {
  mercury: [],
  venus: [],
  earth: [
    {
      name: 'Luna',
      radius: 0.35,
      color: '#c0c0c0',
      orbitRadius: 3.0,
      orbitSpeed: 0.1,
      orbitInclination: 5.1
    }
  ],
  mars: [
    {
      name: 'Phobos',
      radius: 0.12,
      color: '#8c6239',
      orbitRadius: 1.5,
      orbitSpeed: 0.3,
      orbitInclination: 1.0
    },
    {
      name: 'Deimos',
      radius: 0.08,
      color: '#8c6239',
      orbitRadius: 2.2,
      orbitSpeed: 0.15,
      orbitInclination: 1.8
    }
  ],
  jupiter: [
    {
      name: 'Io',
      radius: 0.4,
      color: '#ffff99',
      orbitRadius: 5.0,
      orbitSpeed: 0.25,
      orbitInclination: 0.04
    },
    {
      name: 'Europa',
      radius: 0.3,
      color: '#e6f3ff',
      orbitRadius: 6.2,
      orbitSpeed: 0.18,
      orbitInclination: 0.47
    },
    {
      name: 'Ganymede',
      radius: 0.55,
      color: '#8c7853',
      orbitRadius: 8.0,
      orbitSpeed: 0.12,
      orbitInclination: 0.2
    },
    {
      name: 'Callisto',
      radius: 0.5,
      color: '#404040',
      orbitRadius: 12.0,
      orbitSpeed: 0.08,
      orbitInclination: 0.25
    }
  ],
  saturn: [
    {
      name: 'Mimas',
      radius: 0.15,
      color: '#c0c0c0',
      orbitRadius: 5.5,
      orbitSpeed: 0.35,
      orbitInclination: 1.53
    },
    {
      name: 'Enceladus',
      radius: 0.2,
      color: '#ffffff',
      orbitRadius: 6.8,
      orbitSpeed: 0.25,
      orbitInclination: 0.02
    },
    {
      name: 'Titan',
      radius: 0.7,
      color: '#cc9900',
      orbitRadius: 14.0,
      orbitSpeed: 0.08,
      orbitInclination: 0.31
    },
    {
      name: 'Iapetus',
      radius: 0.35,
      color: '#996633',
      orbitRadius: 22.0,
      orbitSpeed: 0.04,
      orbitInclination: 8.31
    }
  ],
  uranus: [
    {
      name: 'Miranda',
      radius: 0.12,
      color: '#8c8c8c',
      orbitRadius: 4.0,
      orbitSpeed: 0.4,
      orbitInclination: 4.2
    },
    {
      name: 'Ariel',
      radius: 0.18,
      color: '#b0b0b0',
      orbitRadius: 5.2,
      orbitSpeed: 0.3,
      orbitInclination: 0.26
    },
    {
      name: 'Umbriel',
      radius: 0.17,
      color: '#666666',
      orbitRadius: 6.5,
      orbitSpeed: 0.22,
      orbitInclination: 0.13
    },
    {
      name: 'Titania',
      radius: 0.25,
      color: '#999999',
      orbitRadius: 8.8,
      orbitSpeed: 0.15,
      orbitInclination: 0.34
    },
    {
      name: 'Oberon',
      radius: 0.24,
      color: '#777777',
      orbitRadius: 11.0,
      orbitSpeed: 0.12,
      orbitInclination: 0.06
    }
  ],
  neptune: [
    {
      name: 'Triton',
      radius: 0.4,
      color: '#e6f3ff',
      orbitRadius: 8.0,
      orbitSpeed: -0.1, // Retrograde orbit
      orbitInclination: 156.8
    }
  ]
}

// Simplified orbital elements for the 8 planets
// In a real implementation, these would come from VSOP87 theory
const planetOrbitalElements = {
  mercury: {
    a: 0.387098, // Semi-major axis (AU)
    e: 0.205635, // Eccentricity
    i: 7.004,    // Inclination (degrees)
    omega: 48.331, // Longitude of ascending node
    w: 29.124,   // Argument of perihelion
    M0: 174.796, // Mean anomaly at epoch
    n: 4.0923,   // Mean motion (degrees/day)
  },
  venus: {
    a: 0.723332,
    e: 0.006773,
    i: 3.394,
    omega: 76.678,
    w: 54.884,
    M0: 50.115,
    n: 1.6021,
  },
  earth: {
    a: 1.000001,
    e: 0.016709,
    i: 0.000,
    omega: 0.000,
    w: 102.937,
    M0: 100.464,
    n: 0.9856,
  },
  mars: {
    a: 1.523679,
    e: 0.093941,
    i: 1.849,
    omega: 49.558,
    w: 286.502,
    M0: 19.373,
    n: 0.5240,
  },
  jupiter: {
    a: 5.204267,
    e: 0.048775,
    i: 1.303,
    omega: 100.464,
    w: 273.867,
    M0: 20.020,
    n: 0.0831,
  },
  saturn: {
    a: 9.582017,
    e: 0.055723,
    i: 2.484,
    omega: 113.665,
    w: 339.392,
    M0: 317.020,
    n: 0.0334,
  },
  uranus: {
    a: 19.229411,
    e: 0.047318,
    i: 0.772,
    omega: 74.006,
    w: 96.998,
    M0: 142.238,
    n: 0.0116,
  },
  neptune: {
    a: 30.103658,
    e: 0.008678,
    i: 1.767,
    omega: 131.784,
    w: 272.856,
    M0: 256.228,
    n: 0.0060,
  },
}

// Planet physical data - INCREASED RADIUS SCALING for better visibility
const planetPhysicalData: Record<string, Omit<PlanetData, 'position' | 'distanceFromSun'>> = {
  mercury: {
    name: 'Mercury',
    radius: 0.8, // Increased from 0.383
    color: '#8c7853',
    orbitRadius: 0.387,
    orbitSpeed: 4.15,
    axialTilt: 0.034,
    dayLength: 1407.6,
    yearLength: 87.97,
    temperature: 340,
    moons: moonData.mercury,
    mass: 0.055,
    density: 5.427,
  },
  venus: {
    name: 'Venus',
    radius: 1.2, // Increased from 0.949
    color: '#ffc649',
    orbitRadius: 0.723,
    orbitSpeed: 1.62,
    axialTilt: 177.4,
    dayLength: 5832.5,
    yearLength: 224.7,
    temperature: 737,
    moons: moonData.venus,
    mass: 0.815,
    density: 5.243,
  },
  earth: {
    name: 'Earth',
    radius: 1.3, // Increased from 1.0
    color: '#6b93d6',
    orbitRadius: 1.0,
    orbitSpeed: 1.0,
    axialTilt: 23.4,
    dayLength: 24,
    yearLength: 365.25,
    temperature: 288,
    moons: moonData.earth,
    mass: 1.0,
    density: 5.514,
  },
  mars: {
    name: 'Mars',
    radius: 0.9, // Increased from 0.532
    color: '#c1440e',
    orbitRadius: 1.524,
    orbitSpeed: 0.53,
    axialTilt: 25.2,
    dayLength: 24.6,
    yearLength: 687,
    temperature: 210,
    moons: moonData.mars,
    mass: 0.107,
    density: 3.933,
  },
  jupiter: {
    name: 'Jupiter',
    radius: 4.0, // Reduced from 11.21 but still large
    color: '#d8ca9d',
    orbitRadius: 5.204,
    orbitSpeed: 0.084,
    axialTilt: 3.1,
    dayLength: 9.9,
    yearLength: 4331,
    temperature: 165,
    moons: moonData.jupiter,
    mass: 317.8,
    density: 1.326,
  },
  saturn: {
    name: 'Saturn',
    radius: 3.5, // Reduced from 9.45 but still large
    color: '#fad5a5',
    orbitRadius: 9.582,
    orbitSpeed: 0.034,
    axialTilt: 26.7,
    dayLength: 10.7,
    yearLength: 10747,
    temperature: 134,
    moons: moonData.saturn,
    mass: 95.2,
    density: 0.687,
  },
  uranus: {
    name: 'Uranus',
    radius: 2.5, // Reduced from 4.01
    color: '#4fd0e4',
    orbitRadius: 19.229,
    orbitSpeed: 0.012,
    axialTilt: 97.8,
    dayLength: 17.2,
    yearLength: 30589,
    temperature: 76,
    moons: moonData.uranus,
    mass: 14.5,
    density: 1.271,
  },
  neptune: {
    name: 'Neptune',
    radius: 2.3, // Reduced from 3.88
    color: '#4b70dd',
    orbitRadius: 30.104,
    orbitSpeed: 0.006,
    axialTilt: 28.3,
    dayLength: 16.1,
    yearLength: 59800,
    temperature: 72,
    moons: moonData.neptune,
    mass: 17.1,
    density: 1.638,
  },
}

// Convert degrees to radians
const deg2rad = (degrees: number): number => degrees * (Math.PI / 180)

// Solve Kepler's equation for eccentric anomaly
const solveKepler = (M: number, e: number): number => {
  let E = M
  for (let i = 0; i < 10; i++) {
    E = M + e * Math.sin(E)
  }
  return E
}

// Get scale factor based on scale mode
const getScaleFactor = (scaleMode: 'compressed' | 'realistic' | 'logarithmic'): number => {
  switch (scaleMode) {
    case 'compressed':
      return 8 // Current compressed scale
    case 'realistic':
      return 35 // More realistic scale (Neptune ~1050 units away)
    case 'logarithmic':
      return 15 // Compromise between compressed and realistic
    default:
      return 8
  }
}

// Apply logarithmic scaling for better visualization of large distances
const applyLogarithmicScale = (distance: number, baseScale: number): number => {
  // Use logarithmic scaling to compress outer planet distances while preserving inner planet spacing
  const logScale = Math.log10(distance + 1) * baseScale * 0.8
  return Math.max(logScale, distance * (baseScale * 0.3)) // Ensure minimum distance
}

// Calculate planet position from orbital elements
const calculatePlanetPosition = (
  elements: typeof planetOrbitalElements.mercury,
  julianDate: number,
  scaleMode: 'compressed' | 'realistic' | 'logarithmic' = 'compressed'
): { position: Vector3; distance: number } => {
  const { a, e, i, omega, w, M0, n } = elements
  
  // Days since J2000.0 epoch
  const daysSinceEpoch = julianDate - 2451545.0
  
  // Mean anomaly
  const M = deg2rad(M0 + n * daysSinceEpoch)
  
  // Eccentric anomaly
  const E = solveKepler(M, e)
  
  // True anomaly
  const nu = 2 * Math.atan2(
    Math.sqrt(1 + e) * Math.sin(E / 2),
    Math.sqrt(1 - e) * Math.cos(E / 2)
  )
  
  // Distance from Sun in AU
  const r = a * (1 - e * Math.cos(E))
  
  // Position in orbital plane
  const xOrb = r * Math.cos(nu)
  const yOrb = r * Math.sin(nu)
  
  // Convert to ecliptic coordinates
  const cosOmega = Math.cos(deg2rad(omega))
  const sinOmega = Math.sin(deg2rad(omega))
  const cosW = Math.cos(deg2rad(w))
  const sinW = Math.sin(deg2rad(w))
  const cosI = Math.cos(deg2rad(i))
  const sinI = Math.sin(deg2rad(i))
  
  const x = (cosOmega * cosW - sinOmega * sinW * cosI) * xOrb +
           (-cosOmega * sinW - sinOmega * cosW * cosI) * yOrb
  
  const y = (sinOmega * cosW + cosOmega * sinW * cosI) * xOrb +
           (-sinOmega * sinW + cosOmega * cosW * cosI) * yOrb
  
  const z = (sinW * sinI) * xOrb + (cosW * sinI) * yOrb
  
  // Apply appropriate scaling based on mode
  const baseScale = getScaleFactor(scaleMode)
  let scale = baseScale
  
  if (scaleMode === 'logarithmic') {
    scale = applyLogarithmicScale(r, baseScale) / r
  }
  
  return {
    position: new Vector3(x * scale, z * scale, y * scale),
    distance: r // Real distance in AU
  }
}

// Main function to get all planet positions at a given Julian date
export const getPlanetPositions = (
  julianDate: number, 
  scaleMode: 'compressed' | 'realistic' | 'logarithmic' = 'compressed'
): PlanetData[] => {
  const planets: PlanetData[] = []
  
  for (const [planetName, elements] of Object.entries(planetOrbitalElements)) {
    const { position, distance } = calculatePlanetPosition(elements, julianDate, scaleMode)
    const physicalData = planetPhysicalData[planetName]
    
    planets.push({
      ...physicalData,
      position,
      distanceFromSun: distance,
    })
  }
  
  return planets
}

// Export for WASM interface compatibility
export const planetPositions = getPlanetPositions

// Export distance information for UI
export const getDistanceInfo = (scaleMode: 'compressed' | 'realistic' | 'logarithmic') => {
  const scaleFactor = getScaleFactor(scaleMode)
  return {
    scaleFactor,
    scaleDescription: {
      compressed: 'Compressed for easy viewing (1 AU = 8 units)',
      realistic: 'Realistic scale (1 AU = 35 units)',
      logarithmic: 'Logarithmic scale - preserves inner planet spacing'
    }[scaleMode],
    maxDistance: scaleMode === 'realistic' ? 1050 : scaleMode === 'logarithmic' ? 400 : 240
  }
} 