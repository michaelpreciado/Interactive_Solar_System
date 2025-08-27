import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useUIStore } from '../stores/useUIStore'
import { mobileOptimizations } from '../utils/performanceUtils'

// Mobile-optimized planet material with reduced complexity
export const MobilePlanetMaterial: React.FC<{
  planetName: string
  baseColor?: string
  normalIntensity?: number
  specularIntensity?: number
  enableAtmosphere?: boolean
}> = ({ 
  planetName, 
  baseColor = '#8B4513',
  normalIntensity = 0.5,
  specularIntensity = 0.3,
  enableAtmosphere = false
}) => {
  const { deviceCapabilities, performanceSettings } = useUIStore()
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  // Get optimal shader precision for mobile
  const shaderPrecision = mobileOptimizations.getShaderPrecision(
    deviceCapabilities.isMobile,
    deviceCapabilities.performanceTier === 'low'
  )
  
  // Create mobile-optimized shader material
  const material = useMemo(() => {
    const vertexShader = `
      precision ${shaderPrecision} float;
      
      attribute vec3 position;
      attribute vec3 normal;
      attribute vec2 uv;
      
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      uniform vec3 sunPosition;
      uniform float time;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vLightDirection;
      varying float vLightIntensity;
      ${enableAtmosphere ? 'varying float vAtmosphere;' : ''}
      
      void main() {
        vUv = uv;
        
        // Simplified normal transformation
        vNormal = normalize(normalMatrix * normal);
        
        // World position (simplified)
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        
        // Light direction to sun
        vLightDirection = normalize(sunPosition - worldPosition.xyz);
        
        // Simple diffuse lighting calculation
        vLightIntensity = max(dot(vNormal, vLightDirection), 0.0);
        
        ${enableAtmosphere ? `
        // Simple atmosphere effect
        vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);
        vAtmosphere = 1.0 - max(dot(viewDirection, vNormal), 0.0);
        ` : ''}
        
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `
    
    const fragmentShader = `
      precision ${shaderPrecision} float;
      
      uniform vec3 baseColor;
      uniform vec3 sunColor;
      uniform float time;
      uniform float normalIntensity;
      uniform float specularIntensity;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vLightDirection;
      varying float vLightIntensity;
      ${enableAtmosphere ? 'varying float vAtmosphere;' : ''}
      
      // Simplified noise function for mobile
      float simpleNoise(vec2 uv) {
        return sin(uv.x * 10.0) * sin(uv.y * 10.0) * 0.1 + 0.9;
      }
      
      void main() {
        vec3 color = baseColor;
        
        // Add simple surface variation
        float surface = simpleNoise(vUv * 2.0);
        color *= surface;
        
        // Simple diffuse lighting
        color *= vLightIntensity * sunColor + 0.1; // Ambient
        
        // Simple specular highlight (mobile-friendly)
        ${specularIntensity > 0 ? `
        float specular = pow(max(dot(vNormal, vLightDirection), 0.0), 8.0);
        color += specular * sunColor * specularIntensity;
        ` : ''}
        
        ${enableAtmosphere ? `
        // Simple atmosphere glow
        vec3 atmosphereColor = vec3(0.5, 0.7, 1.0);
        color = mix(color, atmosphereColor, vAtmosphere * 0.2);
        ` : ''}
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
    
    return new THREE.ShaderMaterial({
      uniforms: {
        baseColor: { value: new THREE.Color(baseColor) },
        sunColor: { value: new THREE.Color('#FFFFFF') },
        sunPosition: { value: new THREE.Vector3(0, 0, 0) },
        time: { value: 0 },
        normalIntensity: { value: normalIntensity },
        specularIntensity: { value: specularIntensity }
      },
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide,
      transparent: false
    })
  }, [baseColor, normalIntensity, specularIntensity, enableAtmosphere, shaderPrecision])
  
  // Minimal animation for mobile performance
  useFrame((state) => {
    if (materialRef.current && performanceSettings.enableAnimations) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime * 0.1
    }
  })
  
  return <primitive object={material} ref={materialRef} />
}

// Ultra-simple sun material for mobile
export const MobileSunMaterial: React.FC<{
  intensity?: number
  color?: string
}> = ({ intensity = 1, color = '#FDB813' }) => {
  const { deviceCapabilities, performanceSettings } = useUIStore()
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  
  const shaderPrecision = mobileOptimizations.getShaderPrecision(
    deviceCapabilities.isMobile,
    deviceCapabilities.performanceTier === 'low'
  )
  
  const material = useMemo(() => {
    const vertexShader = `
      precision ${shaderPrecision} float;
      
      attribute vec3 position;
      attribute vec2 uv;
      
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;
      uniform float time;
      
      varying vec2 vUv;
      varying float vPulse;
      
      void main() {
        vUv = uv;
        
        // Simple pulsing effect
        vPulse = sin(time * 2.0) * 0.1 + 0.9;
        
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `
    
    const fragmentShader = `
      precision ${shaderPrecision} float;
      
      uniform vec3 sunColor;
      uniform float intensity;
      uniform float time;
      
      varying vec2 vUv;
      varying float vPulse;
      
      void main() {
        // Simple radial gradient for sun surface
        vec2 center = vUv - 0.5;
        float dist = length(center);
        
        // Core and surface colors
        vec3 coreColor = sunColor * 1.5;
        vec3 surfaceColor = sunColor * 0.8;
        
        // Simple gradient from core to surface
        vec3 color = mix(coreColor, surfaceColor, dist * 2.0);
        
        // Add pulsing intensity
        color *= intensity * vPulse;
        
        gl_FragColor = vec4(color, 1.0);
      }
    `
    
    return new THREE.ShaderMaterial({
      uniforms: {
        sunColor: { value: new THREE.Color(color) },
        intensity: { value: intensity },
        time: { value: 0 }
      },
      vertexShader,
      fragmentShader,
      side: THREE.FrontSide
    })
  }, [color, intensity, shaderPrecision])
  
  useFrame((state) => {
    if (materialRef.current && performanceSettings.enableAnimations) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime
    }
  })
  
  return <primitive object={material} ref={materialRef} />
}

// Simplified ring material for planets
export const MobileRingMaterial: React.FC<{
  innerRadius?: number
  outerRadius?: number
  opacity?: number
  color?: string
}> = ({ innerRadius = 1.2, outerRadius = 2.0, opacity = 0.6, color = '#B8860B' }) => {
  const { deviceCapabilities } = useUIStore()
  
  const shaderPrecision = mobileOptimizations.getShaderPrecision(
    deviceCapabilities.isMobile,
    deviceCapabilities.performanceTier === 'low'
  )
  
  const material = useMemo(() => {
    const vertexShader = `
      precision ${shaderPrecision} float;
      
      attribute vec3 position;
      attribute vec2 uv;
      
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;
      
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        vUv = uv;
        
        // Distance from center for ring effect
        vDistance = length(position.xz);
        
        gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0);
      }
    `
    
    const fragmentShader = `
      precision ${shaderPrecision} float;
      
      uniform vec3 ringColor;
      uniform float innerRadius;
      uniform float outerRadius;
      uniform float opacity;
      
      varying vec2 vUv;
      varying float vDistance;
      
      void main() {
        // Simple ring alpha based on distance
        float ringMask = step(innerRadius, vDistance) * (1.0 - step(outerRadius, vDistance));
        
        // Fade towards edges
        float fade = 1.0 - abs(vDistance - (innerRadius + outerRadius) * 0.5) / ((outerRadius - innerRadius) * 0.5);
        
        // Simple ring pattern
        float pattern = sin(vDistance * 20.0) * 0.1 + 0.9;
        
        vec3 color = ringColor * pattern;
        float alpha = ringMask * fade * opacity;
        
        gl_FragColor = vec4(color, alpha);
      }
    `
    
    return new THREE.ShaderMaterial({
      uniforms: {
        ringColor: { value: new THREE.Color(color) },
        innerRadius: { value: innerRadius },
        outerRadius: { value: outerRadius },
        opacity: { value: opacity }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [innerRadius, outerRadius, opacity, color, shaderPrecision])
  
  return <primitive object={material} />
}

// Mobile-optimized atmosphere material
export const MobileAtmosphereMaterial: React.FC<{
  planetRadius?: number
  atmosphereScale?: number
  color?: string
  opacity?: number
}> = ({ planetRadius = 1, atmosphereScale = 1.1, color = '#87CEEB', opacity = 0.3 }) => {
  const { deviceCapabilities } = useUIStore()
  
  const shaderPrecision = mobileOptimizations.getShaderPrecision(
    deviceCapabilities.isMobile,
    deviceCapabilities.performanceTier === 'low'
  )
  
  const material = useMemo(() => {
    const vertexShader = `
      precision ${shaderPrecision} float;
      
      attribute vec3 position;
      attribute vec3 normal;
      
      uniform mat4 modelMatrix;
      uniform mat4 viewMatrix;
      uniform mat4 projectionMatrix;
      uniform mat3 normalMatrix;
      uniform vec3 cameraPosition;
      
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      varying float vFresnel;
      
      void main() {
        vNormal = normalize(normalMatrix * normal);
        
        vec4 worldPosition = modelMatrix * vec4(position, 1.0);
        vViewDirection = normalize(cameraPosition - worldPosition.xyz);
        
        // Simple Fresnel effect
        vFresnel = 1.0 - max(dot(vViewDirection, vNormal), 0.0);
        
        gl_Position = projectionMatrix * viewMatrix * worldPosition;
      }
    `
    
    const fragmentShader = `
      precision ${shaderPrecision} float;
      
      uniform vec3 atmosphereColor;
      uniform float opacity;
      
      varying vec3 vNormal;
      varying vec3 vViewDirection;
      varying float vFresnel;
      
      void main() {
        // Simple atmosphere glow
        float intensity = pow(vFresnel, 2.0);
        
        vec3 color = atmosphereColor;
        float alpha = intensity * opacity;
        
        gl_FragColor = vec4(color, alpha);
      }
    `
    
    return new THREE.ShaderMaterial({
      uniforms: {
        atmosphereColor: { value: new THREE.Color(color) },
        opacity: { value: opacity }
      },
      vertexShader,
      fragmentShader,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })
  }, [color, opacity, shaderPrecision])
  
  return <primitive object={material} />
}

// Instanced material for multiple objects (asteroids, etc.)
export const MobileInstancedMaterial: React.FC<{
  baseColor?: string
  metalness?: number
  roughness?: number
}> = ({ baseColor = '#808080', metalness = 0.1, roughness = 0.8 }) => {
  const { deviceCapabilities } = useUIStore()
  
  // Use standard material for better performance on mobile with instancing
  const material = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      color: baseColor,
      // Simplified lighting model for mobile
    })
  }, [baseColor])
  
  return <primitive object={material} />
}

// Material factory for creating optimized materials based on device performance
export const createOptimizedMaterial = (
  type: 'planet' | 'sun' | 'ring' | 'atmosphere' | 'instanced',
  options: Record<string, any>,
  deviceCapabilities: any
) => {
  const isMobile = deviceCapabilities.isMobile
  const isLowEnd = deviceCapabilities.performanceTier === 'low'
  
  // Use simplified materials for low-end devices
  if (isLowEnd) {
    switch (type) {
      case 'planet':
        return new THREE.MeshLambertMaterial({
          color: options.baseColor || '#8B4513'
        })
      case 'sun':
        return new THREE.MeshBasicMaterial({
          color: options.color || '#FDB813',
          emissive: options.color || '#FDB813',
          emissiveIntensity: 0.5
        })
      case 'ring':
        return new THREE.MeshBasicMaterial({
          color: options.color || '#B8860B',
          transparent: true,
          opacity: options.opacity || 0.6,
          side: THREE.DoubleSide
        })
      default:
        return new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
    }
  }
  
  // Use custom shaders for better devices
  switch (type) {
    case 'planet':
      return <MobilePlanetMaterial {...options} />
    case 'sun':
      return <MobileSunMaterial {...options} />
    case 'ring':
      return <MobileRingMaterial {...options} />
    case 'atmosphere':
      return <MobileAtmosphereMaterial {...options} />
    case 'instanced':
      return <MobileInstancedMaterial {...options} />
    default:
      return new THREE.MeshBasicMaterial({ color: '#FFFFFF' })
  }
}