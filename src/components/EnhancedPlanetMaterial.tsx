import React, { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ShaderMaterial, Vector3, Color } from 'three'
import { useTimeStore } from '../stores/useTimeStore'

// Simplified but effective planet vertex shader
const simplePlanetVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

// Simplified but beautiful planet fragment shader
const simplePlanetFragmentShader = `
uniform vec3 planetColor;
uniform float time;
uniform bool isGasGiant;
uniform bool hasAtmosphere;
uniform vec3 atmosphereColor;
uniform float emissiveIntensity;
uniform vec3 sunPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

// Simple noise function
float simpleNoise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Base color
    vec3 color = planetColor;
    
    // Simple lighting calculation
    vec3 lightDirection = normalize(sunPosition - vWorldPosition);
    float lightIntensity = max(dot(vNormal, lightDirection), 0.1);
    
    // Add some surface variation for gas giants
    if (isGasGiant) {
        float noise1 = simpleNoise(vUv * 10.0 + time * 0.01);
        float noise2 = simpleNoise(vUv * 20.0 + time * 0.02);
        float bands = sin(vUv.y * 15.0 + noise1 * 2.0) * 0.5 + 0.5;
        color = mix(color, color * 1.4, bands * 0.3 + noise2 * 0.1);
    }
    
    // Atmospheric glow effect
    if (hasAtmosphere) {
        vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
        float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
        vec3 atmosphereGlow = atmosphereColor * pow(fresnel, 2.0) * 0.5;
        color += atmosphereGlow;
    }
    
    // Apply lighting
    color *= lightIntensity;
    
    // Add ambient lighting so planets aren't completely dark
    color += planetColor * 0.3;
    
    // Add emissive for selection
    color += planetColor * emissiveIntensity;
    
    gl_FragColor = vec4(color, 1.0);
}
`

// Simple atmospheric shader
const simpleAtmosphereVertexShader = `
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const simpleAtmosphereFragmentShader = `
uniform vec3 atmosphereColor;
uniform float time;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
    float intensity = pow(fresnel, 1.5) * 0.8;
    
    // Add some animation
    float pulse = sin(time * 2.0) * 0.1 + 0.9;
    intensity *= pulse;
    
    gl_FragColor = vec4(atmosphereColor, intensity * 0.6);
}
`

interface EnhancedPlanetMaterialProps {
  planetColor: string
  planetName: string
  isSelected?: boolean
  hasAtmosphere?: boolean
  atmosphereColor?: string
}

export const EnhancedPlanetMaterial: React.FC<EnhancedPlanetMaterialProps> = ({
  planetColor,
  planetName,
  isSelected = false,
  hasAtmosphere = false,
  atmosphereColor = '#87CEEB'
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const { camera } = useThree()
  const { currentTime } = useTimeStore()

  const isGasGiant = planetName === 'Jupiter' || planetName === 'Saturn'

  const uniforms = useMemo(() => ({
    planetColor: { value: new Color(planetColor) },
    time: { value: 0 },
    isGasGiant: { value: isGasGiant },
    hasAtmosphere: { value: hasAtmosphere },
    atmosphereColor: { value: new Color(atmosphereColor) },
    emissiveIntensity: { value: isSelected ? 0.3 : 0.0 },
    sunPosition: { value: new Vector3(0, 0, 0) },
    cameraPosition: { value: camera.position },
  }), [planetColor, isGasGiant, hasAtmosphere, atmosphereColor, isSelected, camera.position])

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = currentTime * 0.001
      materialRef.current.uniforms.emissiveIntensity.value = isSelected ? 0.3 : 0.0
      materialRef.current.uniforms.cameraPosition.value.copy(camera.position)
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={simplePlanetVertexShader}
      fragmentShader={simplePlanetFragmentShader}
      uniforms={uniforms}
      transparent={false}
    />
  )
}

interface SimpleAtmosphereMaterialProps {
  atmosphereColor: string
}

export const SimpleAtmosphereMaterial: React.FC<SimpleAtmosphereMaterialProps> = ({
  atmosphereColor
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const { currentTime } = useTimeStore()
  const { camera } = useThree()

  const uniforms = useMemo(() => ({
    atmosphereColor: { value: new Color(atmosphereColor) },
    time: { value: 0 },
    cameraPosition: { value: camera.position },
  }), [atmosphereColor, camera.position])

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = currentTime * 0.001
      materialRef.current.uniforms.cameraPosition.value.copy(camera.position)
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={simpleAtmosphereVertexShader}
      fragmentShader={simpleAtmosphereFragmentShader}
      uniforms={uniforms}
      transparent={true}
      depthWrite={false}
      side={2}
    />
  )
} 