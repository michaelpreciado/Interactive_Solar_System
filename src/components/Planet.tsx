import React, { useRef, useMemo, memo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Mesh, Vector3, Color } from 'three'
import { useTimeStore } from '../stores/useTimeStore'
import { useUIStore } from '../stores/useUIStore'
import { PlanetData } from '../utils/planetaryCalculations'
import { Moon } from './Moon'

interface PlanetProps {
  planet: PlanetData
  index: number
  showLabel: boolean
}

const PlanetComponent: React.FC<PlanetProps> = ({ planet, index, showLabel }) => {
  const meshRef = useRef<Mesh>(null)
  const { isPlaying, timeSpeed, currentTime } = useTimeStore()
  const { setSelectedPlanet, selectedPlanet, performanceSettings, deviceCapabilities } = useUIStore()

  // Calculate if this planet is selected
  const isSelected = selectedPlanet === planet.name.toLowerCase()

  // Memoize geometry detail based on performance settings
  const geometryDetail = useMemo(() => {
    return performanceSettings.planetGeometryDetail
  }, [performanceSettings.planetGeometryDetail])

  // Memoize planet materials with performance optimizations
  const planetMaterial = useMemo(() => {
    const baseColor = new Color(planet.color)
    const emissiveColor = baseColor.clone().multiplyScalar(0.1)
    
    return {
      color: planet.color,
      emissive: emissiveColor,
      emissiveIntensity: isSelected ? 0.3 : 0.1,
      roughness: 0.8,
      metalness: 0.1,
      transparent: true,
      opacity: 1.0,
    }
  }, [planet.color, isSelected])

  // Memoize gas giant materials
  const gasGiantMaterial = useMemo(() => {
    if (planet.name === 'Jupiter' || planet.name === 'Saturn') {
      return {
        ...planetMaterial,
        emissiveIntensity: isSelected ? 0.4 : 0.2,
        roughness: 0.6,
        metalness: 0.0,
      }
    }
    return planetMaterial
  }, [planetMaterial, planet.name, isSelected])

  // Optimize atmospheric effects for mobile
  const atmosphericEffects = useMemo(() => {
    if (!performanceSettings.enableAtmosphere) return null
    
    return (
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[planet.radius * 1.2, geometryDetail / 2, geometryDetail / 2]} />
        <meshBasicMaterial 
          color={planet.color} 
          opacity={isSelected ? 0.15 : 0.08} 
          transparent 
          side={2}
        />
      </mesh>
    )
  }, [performanceSettings.enableAtmosphere, planet.color, planet.radius, geometryDetail, isSelected])

  // Optimize Saturn rings for mobile
  const saturnRings = useMemo(() => {
    if (planet.name !== 'Saturn' || !performanceSettings.enableRings) return null
    
    return (
      <group>
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[planet.radius * 1.2, planet.radius * 2.2, Math.max(32, geometryDetail)]} />
          <meshBasicMaterial 
            color="#fad5a5" 
            opacity={0.7} 
            transparent 
            side={2}
          />
        </mesh>
        {performanceSettings.enableOrbitalLights && (
          <pointLight
            position={[0, 0, 0]}
            color="#fad5a5"
            intensity={0.3}
            distance={planet.radius * 4}
            decay={2}
          />
        )}
      </group>
    )
  }, [planet.name, planet.radius, performanceSettings.enableRings, performanceSettings.enableOrbitalLights, geometryDetail])

  // Optimize lighting effects
  const lightingEffects = useMemo(() => {
    if (!performanceSettings.enableOrbitalLights) return null
    
    return (
      <>
        {/* Planet rim light */}
        <pointLight
          position={[0, 0, 0]}
          color={planet.color}
          intensity={isSelected ? 0.8 : 0.4}
          distance={planet.radius * 4}
          decay={2}
        />
        
        {/* Enhanced selection indicator */}
        {isSelected && (
          <group>
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[planet.radius * 1.5, planet.radius * 1.7, 32]} />
              <meshBasicMaterial 
                color={planet.color} 
                opacity={0.6} 
                transparent 
                side={2}
              />
            </mesh>
            
            <pointLight
              position={[0, planet.radius * 2, 0]}
              color="#ffffff"
              intensity={1.0}
              distance={planet.radius * 8}
              decay={2}
            />
          </group>
        )}
      </>
    )
  }, [performanceSettings.enableOrbitalLights, planet.color, planet.radius, isSelected])

  // Throttled animation for better performance
  useFrame((state, delta) => {
    if (meshRef.current && isPlaying && performanceSettings.enableAnimations) {
      // Reduce animation frequency on mobile
      const animationMultiplier = deviceCapabilities.isMobile ? 0.5 : 1
      const rotationSpeed = (24 / planet.dayLength) * timeSpeed * delta * 0.1 * animationMultiplier
      meshRef.current.rotation.y += rotationSpeed
    }
  })

  const handleClick = () => {
    setSelectedPlanet(planet.name.toLowerCase())
  }

  // Memoize filtered moons for performance
  const visibleMoons = useMemo(() => {
    if (!performanceSettings.enableMoonFeatures) return []
    
    // Limit number of moons on mobile devices
    const maxMoons = deviceCapabilities.isMobile ? 2 : planet.moons.length
    return planet.moons.slice(0, maxMoons)
  }, [planet.moons, performanceSettings.enableMoonFeatures, deviceCapabilities.isMobile])

  return (
    <group position={planet.position}>
      {/* Lighting effects */}
      {lightingEffects}

      {/* Planet atmospheric glow */}
      {atmosphericEffects}

      {/* Main planet sphere */}
      <mesh 
        ref={meshRef} 
        onClick={handleClick}
        position={[0, 0, 0]}
        userData={{ planetName: planet.name }}
      >
        <sphereGeometry args={[planet.radius, geometryDetail, geometryDetail]} />
        <meshStandardMaterial 
          {...(planet.name === 'Jupiter' || planet.name === 'Saturn' ? gasGiantMaterial : planetMaterial)}
        />
      </mesh>

      {/* Saturn's rings */}
      {saturnRings}

      {/* Planet label */}
      {showLabel && (
        <Html position={[0, planet.radius + 1, 0]} center>
          <div className={`text-white text-sm font-semibold pointer-events-none bg-black/50 px-2 py-1 rounded backdrop-blur-sm ${
            isSelected ? 'ring-2 ring-white' : ''
          }`}>
            {planet.name}
          </div>
        </Html>
      )}

      {/* Render optimized moons */}
      {visibleMoons.map((moon, moonIndex) => (
        <Moon
          key={moon.name}
          moon={moon}
          planetPosition={[planet.position.x, planet.position.y, planet.position.z]}
          time={currentTime}
          showLabel={showLabel && !deviceCapabilities.isMobile} // Hide moon labels on mobile
          performanceSettings={performanceSettings}
        />
      ))}
    </group>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const Planet = memo(PlanetComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.planet.name === nextProps.planet.name &&
    prevProps.planet.position.equals(nextProps.planet.position) &&
    prevProps.index === nextProps.index &&
    prevProps.showLabel === nextProps.showLabel
  )
}) 