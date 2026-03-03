import React from 'react'
import { useUIStore } from '../stores/useUIStore'
import { PlanetData } from '../utils/planetaryCalculations'
import { Planet } from './Planet'
import { Orbits } from './Orbits'
import { Sun } from './Sun'

interface SolarSystemProps {
  planets: PlanetData[]
}

export const SolarSystem: React.FC<SolarSystemProps> = ({ planets }) => {
  const { showOrbits, showLabels } = useUIStore()

  return (
    <>
      {/* Sun-positioned lighting — directional light simulates solar illumination */}
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[0, 100, 0]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={2000}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* Sun */}
      <Sun showLabel={showLabels} />

      {/* Planets */}
      {planets.map((planet, index) => (
        <Planet
          key={planet.name}
          planet={planet}
          index={index}
          showLabel={showLabels}
        />
      ))}

      {/* Orbit paths */}
      {showOrbits && <Orbits planets={planets} />}
    </>
  )
}
