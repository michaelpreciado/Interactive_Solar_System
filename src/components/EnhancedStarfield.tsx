import React, { useRef, useMemo, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useUIStore } from '../stores/useUIStore'

interface StarfieldProps {
  radius?: number
  depth?: number
  count?: number
  layers?: number
}

export const EnhancedStarfield: React.FC<StarfieldProps> = ({
  radius = 1000,
  depth = 100,
  count = 5000,
  layers = 3
}) => {
  const { performanceSettings, prefersReducedMotion, deviceCapabilities } = useUIStore()
  const groupRef = useRef<THREE.Group>(null)
  const materialRefs = useRef<THREE.PointsMaterial[]>([])
  
  // Optimize star count based on device capabilities
  const optimizedCount = useMemo(() => {
    if (deviceCapabilities.isMobile) {
      return Math.min(count, performanceSettings.starfieldCount)
    }
    return count
  }, [count, deviceCapabilities.isMobile, performanceSettings.starfieldCount])

  // Create multiple star layers with different properties
  const starLayers = useMemo(() => {
    const layersData = []
    
    for (let layer = 0; layer < layers; layer++) {
      const layerCount = Math.floor(optimizedCount / layers)
      const positions = new Float32Array(layerCount * 3)
      const colors = new Float32Array(layerCount * 3)
      const sizes = new Float32Array(layerCount)
      const phases = new Float32Array(layerCount) // For twinkling
      
      // Layer-specific properties
      const layerRadius = radius * (0.6 + layer * 0.4) // Varying distances
      const layerDepth = depth * (0.5 + layer * 0.5)
      
      for (let i = 0; i < layerCount; i++) {
        // Random spherical distribution
        const theta = Math.random() * Math.PI * 2
        const phi = Math.acos(Math.random() * 2 - 1)
        const distance = layerRadius + Math.random() * layerDepth
        
        positions[i * 3] = distance * Math.sin(phi) * Math.cos(theta)
        positions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta)
        positions[i * 3 + 2] = distance * Math.cos(phi)
        
        // Star colors with realistic temperature distribution
        const temp = Math.random()
        if (temp < 0.1) {
          // Blue giants (rare, bright)
          colors[i * 3] = 0.6 + Math.random() * 0.4     // R
          colors[i * 3 + 1] = 0.7 + Math.random() * 0.3 // G
          colors[i * 3 + 2] = 1                         // B
          sizes[i] = 1.5 + Math.random() * 2
        } else if (temp < 0.3) {
          // White stars
          colors[i * 3] = 0.9 + Math.random() * 0.1
          colors[i * 3 + 1] = 0.9 + Math.random() * 0.1
          colors[i * 3 + 2] = 0.9 + Math.random() * 0.1
          sizes[i] = 1 + Math.random() * 1.5
        } else if (temp < 0.7) {
          // Yellow/orange stars (like our sun)
          colors[i * 3] = 1
          colors[i * 3 + 1] = 0.8 + Math.random() * 0.2
          colors[i * 3 + 2] = 0.3 + Math.random() * 0.4
          sizes[i] = 0.8 + Math.random() * 1.2
        } else {
          // Red dwarfs (most common)
          colors[i * 3] = 1
          colors[i * 3 + 1] = 0.3 + Math.random() * 0.3
          colors[i * 3 + 2] = 0.1 + Math.random() * 0.2
          sizes[i] = 0.5 + Math.random() * 0.8
        }
        
        // Random phase for twinkling
        phases[i] = Math.random() * Math.PI * 2
      }
      
      layersData.push({
        positions,
        colors,
        sizes,
        phases,
        baseOpacity: 0.8 - layer * 0.1, // Distant layers are dimmer
        twinkleSpeed: 0.5 + layer * 0.3, // Different twinkling speeds
        layerIndex: layer
      })
    }
    
    return layersData
  }, [optimizedCount, layers, radius, depth])

  // Create twinkling vertex shader
  const vertexShader = `
    attribute float size;
    attribute vec3 color;
    attribute float phase;
    
    varying vec3 vColor;
    varying float vAlpha;
    
    uniform float time;
    uniform float twinkleSpeed;
    uniform float baseOpacity;
    
    void main() {
      vColor = color;
      
      // Twinkling effect using sine wave with phase offset
      float twinkle = sin(time * twinkleSpeed + phase) * 0.3 + 0.7;
      vAlpha = baseOpacity * twinkle;
      
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      
      // Size attenuation based on distance
      float distanceAttenuation = 1.0 / (1.0 + length(mvPosition.xyz) * 0.0001);
      gl_PointSize = size * distanceAttenuation * 100.0;
      
      gl_Position = projectionMatrix * mvPosition;
    }
  `

  // Create fragment shader with star texture
  const fragmentShader = `
    varying vec3 vColor;
    varying float vAlpha;
    
    void main() {
      // Create circular star shape with soft edges
      vec2 center = gl_PointCoord - 0.5;
      float dist = length(center);
      
      // Soft circular falloff
      float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
      
      // Add some sparkle to bright stars
      float sparkle = 1.0 + sin(dist * 20.0) * 0.1;
      
      gl_FragColor = vec4(vColor * sparkle, alpha * vAlpha);
    }
  `

  // Animation frame for twinkling
  useFrame((state) => {
    if (prefersReducedMotion) return
    
    materialRefs.current.forEach((material, index) => {
      if (material && material.uniforms) {
        material.uniforms.time.value = state.clock.elapsedTime
      }
    })
  })

  return (
    <group ref={groupRef}>
      {starLayers.map((layer, index) => {
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.BufferAttribute(layer.positions, 3))
        geometry.setAttribute('color', new THREE.BufferAttribute(layer.colors, 3))
        geometry.setAttribute('size', new THREE.BufferAttribute(layer.sizes, 1))
        geometry.setAttribute('phase', new THREE.BufferAttribute(layer.phases, 1))

        const material = new THREE.ShaderMaterial({
          uniforms: {
            time: { value: 0 },
            twinkleSpeed: { value: layer.twinkleSpeed },
            baseOpacity: { value: layer.baseOpacity }
          },
          vertexShader,
          fragmentShader,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
          vertexColors: true
        })

        // Store material reference for animation
        materialRefs.current[index] = material

        return (
          <points key={`star-layer-${index}`} geometry={geometry} material={material} />
        )
      })}
    </group>
  )
}