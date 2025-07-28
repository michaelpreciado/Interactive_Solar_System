import React, { useMemo, memo, useRef } from 'react'
import { DoubleSide } from 'three'
import { useFrame } from '@react-three/fiber'
import { useUIStore } from '../stores/useUIStore'
import { PlanetData } from '../utils/planetaryCalculations'
import { useTimeStore } from '../stores/useTimeStore'

interface OrbitsProps {
  planets: PlanetData[]
}

const OrbitsComponent: React.FC<OrbitsProps> = ({ planets }) => {
  const { showOrbits, performanceSettings } = useUIStore()

  // Memoize orbit geometry settings
  const orbitSettings = useMemo(() => {
    return {
      segments: performanceSettings.orbitSegments,
      enableLights: performanceSettings.enableOrbitalLights,
      maxLights: performanceSettings.maxLights,
    }
  }, [performanceSettings.orbitSegments, performanceSettings.enableOrbitalLights, performanceSettings.maxLights])

  // Memoize orbit data to prevent unnecessary calculations
  const orbitData = useMemo(() => {
    return planets.map((planet, index) => ({
      radius: planet.orbitRadius,
      color: planet.color,
      name: planet.name,
      position: planet.position,
      index,
    }))
  }, [planets])

  // Skip rendering if orbits are disabled
  if (!showOrbits) {
    return null
  }

  return (
    <group>
      {orbitData.map((orbit) => (
        <OrbitRing
          key={orbit.name}
          radius={orbit.radius}
          color={orbit.color}
          name={orbit.name}
          position={orbit.position}
          segments={orbitSettings.segments}
          enableLights={orbitSettings.enableLights}
          lightIndex={orbit.index}
          maxLights={orbitSettings.maxLights}
        />
      ))}
    </group>
  )
}

interface OrbitRingProps {
  radius: number
  color: string
  name: string
  position: { x: number; y: number; z: number }
  segments: number
  enableLights: boolean
  lightIndex: number
  maxLights: number
}

const OrbitRing: React.FC<OrbitRingProps> = memo(({
  radius,
  color,
  name,
  position,
  segments,
  enableLights,
  lightIndex,
  maxLights,
}) => {
  const groupRef = useRef<any>(null)
  const { currentTime } = useTimeStore()

  // Subtle orbital animation
  useFrame(() => {
    if (groupRef.current && enableLights) {
      // Very subtle pulsing animation
      const pulse = Math.sin(currentTime * 0.001 + lightIndex) * 0.02 + 1
      groupRef.current.scale.setScalar(pulse)
    }
  })

  // Clean orbit line material
  const orbitLineMaterial = useMemo(() => {
    return {
      color: color,
      opacity: 0.4,
      transparent: true,
      linewidth: 2,
    }
  }, [color])

  // Subtle glow material
  const glowMaterial = useMemo(() => {
    return {
      color: color,
      opacity: 0.08,
      transparent: true,
      side: DoubleSide,
    }
  }, [color])

  // Minimal orbital position indicators
  const positionIndicators = useMemo(() => {
    const indicators = []
    const indicatorCount = segments >= 64 ? 2 : 1 // Minimal indicators for clean look
    
    for (let i = 0; i < indicatorCount; i++) {
      const angle = (i / indicatorCount) * Math.PI * 2
      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      
      indicators.push({ x, y: 0, z, key: `${name}-indicator-${i}` })
    }
    
    return indicators
  }, [radius, name, segments])

  return (
    <group>
      {/* Clean orbit visualization */}
      <group ref={groupRef}>
        {/* Main orbit line - clean and visible */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.02, radius + 0.02, segments, 1]} />
          <meshBasicMaterial {...orbitLineMaterial} />
        </mesh>

        {/* Subtle orbital glow */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius - 0.1, radius + 0.1, Math.max(32, segments / 2), 1]} />
          <meshBasicMaterial {...glowMaterial} />
        </mesh>

        {/* Clean orbital markers */}
        {enableLights && positionIndicators.map((indicator) => (
          <group key={indicator.key} position={[indicator.x, indicator.y, indicator.z]}>
            {/* Simple orbital point */}
            <mesh>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial 
                color={color} 
                opacity={0.6} 
                transparent 
              />
            </mesh>

            {/* Subtle point light */}
            {lightIndex < maxLights && (
              <pointLight
                color={color}
                intensity={0.2}
                distance={2}
                decay={2}
              />
            )}
          </group>
        ))}

        {/* Minimal orbital plane for high-performance settings */}
        {segments >= 64 && (
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius - 0.2, radius + 0.2, 64, 1]} />
            <meshBasicMaterial 
              color={color} 
              opacity={0.03} 
              transparent 
              side={2}
            />
          </mesh>
        )}
      </group>
    </group>
  )
})

OrbitRing.displayName = 'OrbitRing'

// Memoize the component to prevent unnecessary re-renders
export const Orbits = memo(OrbitsComponent, (prevProps, nextProps) => {
  // Compare planets array length and positions
  if (prevProps.planets.length !== nextProps.planets.length) {
    return false
  }
  
  // Check if any planet position has changed significantly
  for (let i = 0; i < prevProps.planets.length; i++) {
    const prevPlanet = prevProps.planets[i]
    const nextPlanet = nextProps.planets[i]
    
    if (
      prevPlanet.name !== nextPlanet.name ||
      !prevPlanet.position.equals(nextPlanet.position)
    ) {
      return false
    }
  }
  
  return true
})

Orbits.displayName = 'Orbits' 