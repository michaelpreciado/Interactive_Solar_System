import React, { useMemo, memo } from 'react'
import { Html } from '@react-three/drei'
import { MoonData } from '../utils/planetaryCalculations'
import { PerformanceSettings } from '../utils/performanceUtils'

interface MoonProps {
  moon: MoonData
  planetPosition: [number, number, number]
  time: number
  showLabel: boolean
  performanceSettings: PerformanceSettings
}

const MoonComponent: React.FC<MoonProps> = ({ 
  moon, 
  planetPosition, 
  time, 
  showLabel, 
  performanceSettings 
}) => {
  // Memoize geometry detail based on performance settings
  const geometryDetail = useMemo(() => {
    return performanceSettings.moonGeometryDetail
  }, [performanceSettings.moonGeometryDetail])

  // Memoize moon position calculation
  const moonPosition = useMemo(() => {
    const angle = (time * moon.orbitSpeed) % (Math.PI * 2)
    const inclination = moon.orbitInclination * (Math.PI / 180)
    
    const x = Math.cos(angle) * moon.orbitRadius
    const z = Math.sin(angle) * moon.orbitRadius * Math.cos(inclination)
    const y = Math.sin(angle) * moon.orbitRadius * Math.sin(inclination)
    
    return [
      planetPosition[0] + x,
      planetPosition[1] + y,
      planetPosition[2] + z
    ] as [number, number, number]
  }, [planetPosition, time, moon.orbitSpeed, moon.orbitRadius, moon.orbitInclination])

  // Memoize moon material
  const moonMaterial = useMemo(() => {
    return {
      color: moon.color,
      roughness: 0.9,
      metalness: 0.0,
      emissive: moon.color,
      emissiveIntensity: 0.05,
    }
  }, [moon.color])

  // Skip rendering if moon features are disabled
  if (!performanceSettings.enableMoonFeatures) {
    return null
  }

  return (
    <group position={moonPosition}>
      {/* Moon sphere */}
      <mesh>
        <sphereGeometry args={[moon.radius, geometryDetail, geometryDetail]} />
        <meshStandardMaterial {...moonMaterial} />
      </mesh>

      {/* Moon label - only if enabled and not on mobile */}
      {showLabel && (
        <Html position={[0, moon.radius + 0.5, 0]} center>
          <div className="text-white text-xs font-normal pointer-events-none bg-black/40 px-1 py-0.5 rounded backdrop-blur-sm">
            {moon.name}
          </div>
        </Html>
      )}
    </group>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const Moon = memo(MoonComponent, (prevProps, nextProps) => {
  return (
    prevProps.moon.name === nextProps.moon.name &&
    prevProps.planetPosition[0] === nextProps.planetPosition[0] &&
    prevProps.planetPosition[1] === nextProps.planetPosition[1] &&
    prevProps.planetPosition[2] === nextProps.planetPosition[2] &&
    prevProps.time === nextProps.time &&
    prevProps.showLabel === nextProps.showLabel &&
    prevProps.performanceSettings === nextProps.performanceSettings
  )
}) 