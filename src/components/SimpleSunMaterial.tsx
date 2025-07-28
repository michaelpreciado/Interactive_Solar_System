import React, { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ShaderMaterial, Color } from 'three'
import { useTimeStore } from '../stores/useTimeStore'

const simpleSunVertexShader = `
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

const simpleSunFragmentShader = `
uniform vec3 sunColor;
uniform float time;
uniform float intensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

float simpleNoise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec3 color = sunColor;
    
    // Add some surface variation
    float noise1 = simpleNoise(vUv * 5.0 + time * 0.1);
    float noise2 = simpleNoise(vUv * 10.0 + time * 0.2);
    float surface = noise1 * 0.3 + noise2 * 0.2;
    
    color = mix(color, color * 1.5, surface);
    
    // Add fresnel glow
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
    color += sunColor * pow(fresnel, 2.0) * 0.8;
    
    color *= intensity;
    
    gl_FragColor = vec4(color, 1.0);
}
`

const simpleCoronaVertexShader = `
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

const simpleCoronaFragmentShader = `
uniform vec3 coronaColor;
uniform float time;
uniform float intensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float fresnel = 1.0 - abs(dot(viewDirection, vNormal));
    
    float alpha = pow(fresnel, 1.5) * intensity;
    alpha *= (0.8 + sin(time * 3.0) * 0.2);
    
    gl_FragColor = vec4(coronaColor, alpha * 0.5);
}
`

interface SimpleSunMaterialProps {
  intensity?: number
}

export const SimpleSunMaterial: React.FC<SimpleSunMaterialProps> = ({
  intensity = 2.0
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const { camera } = useThree()
  const { currentTime } = useTimeStore()

  const uniforms = useMemo(() => ({
    sunColor: { value: new Color('#FDB813') },
    time: { value: 0 },
    intensity: { value: intensity },
    cameraPosition: { value: camera.position },
  }), [intensity, camera.position])

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = currentTime * 0.001
      materialRef.current.uniforms.cameraPosition.value.copy(camera.position)
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={simpleSunVertexShader}
      fragmentShader={simpleSunFragmentShader}
      uniforms={uniforms}
      transparent={false}
    />
  )
}

interface SimpleCoronaMaterialProps {
  coronaColor?: string
  intensity?: number
}

export const SimpleCoronaMaterial: React.FC<SimpleCoronaMaterialProps> = ({
  coronaColor = '#FF6B35',
  intensity = 0.6
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const { camera } = useThree()
  const { currentTime } = useTimeStore()

  const uniforms = useMemo(() => ({
    coronaColor: { value: new Color(coronaColor) },
    time: { value: 0 },
    intensity: { value: intensity },
    cameraPosition: { value: camera.position },
  }), [coronaColor, intensity, camera.position])

  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = currentTime * 0.001
      materialRef.current.uniforms.cameraPosition.value.copy(camera.position)
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={simpleCoronaVertexShader}
      fragmentShader={simpleCoronaFragmentShader}
      uniforms={uniforms}
      transparent={true}
      depthWrite={false}
      side={2}
    />
  )
} 