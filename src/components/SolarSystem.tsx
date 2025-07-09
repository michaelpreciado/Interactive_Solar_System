import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { OrbitControls, Stars } from '@react-three/drei'
import { useUIStore } from '../stores/useUIStore'
import { PlanetData } from '../utils/planetaryCalculations'
import { Planet } from './Planet'
import { Orbits } from './Orbits'
import { Sun } from './Sun'

interface SolarSystemProps {
  planets: PlanetData[]
}

export const SolarSystem: React.FC<SolarSystemProps> = ({ planets }) => {
  const { showOrbits, showLabels, prefersReducedMotion, scaleMode } = useUIStore()
  const controlsRef = useRef<any>(null)
  
  // Auto-rotate the view slowly if not in reduced motion mode
  useFrame((state) => {
    if (!prefersReducedMotion && controlsRef.current) {
      controlsRef.current.azimuthAngle += 0.001
    }
  })

  // Adjust controls based on scale mode
  const controlsSettings = {
    minDistance: scaleMode === 'realistic' ? 50 : scaleMode === 'logarithmic' ? 30 : 10,
    maxDistance: scaleMode === 'realistic' ? 2000 : scaleMode === 'logarithmic' ? 800 : 400,
    zoomSpeed: scaleMode === 'realistic' ? 2.0 : scaleMode === 'logarithmic' ? 1.5 : 0.8,
    panSpeed: scaleMode === 'realistic' ? 2.0 : scaleMode === 'logarithmic' ? 1.5 : 0.8,
  }

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.1} />
      <directionalLight
        position={[0, 0, 0]}
        intensity={2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={controlsSettings.maxDistance}
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
      
      {/* Starfield */}
      <Stars
        radius={scaleMode === 'realistic' ? 1500 : scaleMode === 'logarithmic' ? 1000 : 600}
        depth={100}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={prefersReducedMotion ? 0 : 0.5}
      />
      
      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        zoomSpeed={controlsSettings.zoomSpeed}
        panSpeed={controlsSettings.panSpeed}
        rotateSpeed={0.5}
        minDistance={controlsSettings.minDistance}
        maxDistance={controlsSettings.maxDistance}
        minPolarAngle={0}
        maxPolarAngle={Math.PI}
        enableDamping={true}
        dampingFactor={0.05}
        makeDefault
      />
    </>
  )
} 