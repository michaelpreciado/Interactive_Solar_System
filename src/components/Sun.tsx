import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Mesh, MeshBasicMaterial, MeshStandardMaterial, Color } from 'three'
import { Html } from '@react-three/drei'
import { SimpleSunMaterial, SimpleCoronaMaterial } from './SimpleSunMaterial'

interface SunProps {
  showLabel: boolean
}

export const Sun: React.FC<SunProps> = ({ showLabel }) => {
  const sunRef = useRef<Mesh>(null)
  const coronaRef = useRef<Mesh>(null)
  const flareRef1 = useRef<Mesh>(null)
  const flareRef2 = useRef<Mesh>(null)
  
  const sunRadius = 2.5
  const geometryDetail = 64 // High resolution for close-up viewing
  
  // Enhanced sun material is now handled by SunMaterial component
  // Corona material is now handled by CoronaMaterial component
  
  // Solar flare materials
  const flareMaterial1 = useMemo(() => {
    return new MeshStandardMaterial({
      color: new Color('#FF6600'),
      emissive: new Color('#FF4500'),
      emissiveIntensity: 1.0,
      transparent: true,
      opacity: 0.8,
    })
  }, [])
  
  const flareMaterial2 = useMemo(() => {
    return new MeshStandardMaterial({
      color: new Color('#FFB84D'),
      emissive: new Color('#FF6600'),
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
    })
  }, [])
  
  // Sunspot features
  const sunSpots = useMemo(() => {
    return (
      <group>
        {/* Major sunspots */}
        <mesh position={[sunRadius * 0.4, sunRadius * 0.3, sunRadius * 0.7]}>
          <sphereGeometry args={[sunRadius * 0.08, 16, 16]} />
          <meshStandardMaterial color="#FF3300" emissive="#CC0000" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[-sunRadius * 0.3, -sunRadius * 0.4, sunRadius * 0.6]}>
          <sphereGeometry args={[sunRadius * 0.06, 16, 16]} />
          <meshStandardMaterial color="#FF4400" emissive="#DD1100" emissiveIntensity={0.4} />
        </mesh>
        <mesh position={[sunRadius * 0.2, -sunRadius * 0.5, sunRadius * 0.5]}>
          <sphereGeometry args={[sunRadius * 0.04, 16, 16]} />
          <meshStandardMaterial color="#FF3300" emissive="#CC0000" emissiveIntensity={0.6} />
        </mesh>
      </group>
    )
  }, [sunRadius])
  
  // Solar prominences
  const prominences = useMemo(() => {
    return (
      <group>
        {/* Solar prominences extending from surface */}
        <mesh position={[sunRadius * 0.8, sunRadius * 0.2, sunRadius * 0.3]}>
          <sphereGeometry args={[sunRadius * 0.15, 8, 8]} />
          <meshStandardMaterial 
            color="#FF6600" 
            emissive="#FF4400" 
            emissiveIntensity={0.9} 
            transparent 
            opacity={0.7} 
          />
        </mesh>
        <mesh position={[-sunRadius * 0.7, sunRadius * 0.4, sunRadius * 0.2]}>
          <sphereGeometry args={[sunRadius * 0.12, 8, 8]} />
          <meshStandardMaterial 
            color="#FF7700" 
            emissive="#FF5500" 
            emissiveIntensity={0.8} 
            transparent 
            opacity={0.6} 
          />
        </mesh>
      </group>
    )
  }, [sunRadius])

  useFrame((state) => {
    if (sunRef.current) {
      // Rotate the sun slowly
      sunRef.current.rotation.y += 0.002
      
      // Add subtle pulsing effect
      const pulseFactor = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.02
      sunRef.current.scale.setScalar(pulseFactor)
    }
    
    if (coronaRef.current) {
      // Rotate corona in opposite direction
      coronaRef.current.rotation.y -= 0.001
      
      // Corona breathing effect
      const breathFactor = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05
      coronaRef.current.scale.setScalar(breathFactor)
    }
    
    // Animate solar flares
    if (flareRef1.current) {
      flareRef1.current.rotation.z += 0.01
      const flareScale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.3
      flareRef1.current.scale.setScalar(flareScale)
    }
    
    if (flareRef2.current) {
      flareRef2.current.rotation.z -= 0.008
      const flareScale = 1 + Math.sin(state.clock.elapsedTime * 2.5 + Math.PI) * 0.25
      flareRef2.current.scale.setScalar(flareScale)
    }
  })

  return (
    <group>
      {/* Main sun body */}
      <mesh ref={sunRef}>
        <sphereGeometry args={[sunRadius, geometryDetail, geometryDetail]} />
        <SimpleSunMaterial intensity={2.5} />
      </mesh>
      
      {/* Sunspots */}
      {sunSpots}
      
      {/* Solar prominences */}
      {prominences}
      
      {/* Solar flares */}
      <mesh ref={flareRef1} position={[sunRadius * 0.9, 0, 0]} material={flareMaterial1}>
        <sphereGeometry args={[sunRadius * 0.3, 16, 16]} />
      </mesh>
      <mesh ref={flareRef2} position={[0, sunRadius * 0.9, 0]} material={flareMaterial2}>
        <sphereGeometry args={[sunRadius * 0.25, 16, 16]} />
      </mesh>
      
      {/* Enhanced corona layers with WebGL materials */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[sunRadius * 1.3, geometryDetail, geometryDetail]} />
        <SimpleCoronaMaterial coronaColor="#FF6B35" intensity={0.6} />
      </mesh>
      <mesh>
        <sphereGeometry args={[sunRadius * 1.6, geometryDetail, geometryDetail]} />
        <SimpleCoronaMaterial coronaColor="#FF8C42" intensity={0.4} />
      </mesh>
      <mesh>
        <sphereGeometry args={[sunRadius * 2.0, geometryDetail, geometryDetail]} />
        <SimpleCoronaMaterial coronaColor="#FFB347" intensity={0.2} />
      </mesh>
      
      {/* Intense inner glow */}
             <mesh>
         <sphereGeometry args={[sunRadius * 0.98, geometryDetail, geometryDetail]} />
         <meshStandardMaterial 
           color="#FFFF00" 
           emissive="#FFDD00" 
           emissiveIntensity={1.2} 
           transparent 
           opacity={0.3} 
         />
       </mesh>
      
      {/* Sun label */}
      {showLabel && (
        <Html position={[0, sunRadius + 1, 0]} center>
          <div className="text-white text-sm font-semibold pointer-events-none bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
            Sun
          </div>
        </Html>
      )}
    </group>
  )
} 