import React, { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ShaderMaterial, Vector3, Color } from 'three'
import { useTimeStore } from '../stores/useTimeStore'

// Sun vertex shader
const sunVertexShader = `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform float time;
uniform float sunRadius;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vToCamera;
varying float vDistanceToCamera;

void main() {
    vUv = uv;
    
    // Transform to world space
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Normal in world space
    vNormal = normalize(normalMatrix * normal);
    
    // Direction to camera
    vToCamera = normalize(cameraPosition - vWorldPosition);
    vDistanceToCamera = length(cameraPosition - vWorldPosition);
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

// Sun fragment shader with solar effects
const sunFragmentShader = `
precision highp float;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vToCamera;
varying float vDistanceToCamera;

uniform float time;
uniform vec3 sunColor;
uniform float intensity;
uniform float coronaIntensity;
uniform vec3 coronaColor;
uniform float sunRadius;

// Noise functions for solar surface effects
float random(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

// Fractal noise for complex solar patterns
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
    }
    
    return value;
}

void main() {
    // Base solar surface with animated noise
    vec2 animatedUv = vUv + vec2(time * 0.01, time * 0.005);
    float surfaceNoise = fbm(animatedUv * 8.0);
    surfaceNoise += fbm(animatedUv * 16.0) * 0.5;
    surfaceNoise += fbm(animatedUv * 32.0) * 0.25;
    
    // Solar prominences (flame-like patterns)
    float prominences = fbm(vUv * 6.0 + vec2(time * 0.02, 0.0));
    prominences = pow(prominences, 2.0);
    
    // Solar granulation (small cells on surface)
    float granulation = noise(vUv * 64.0 + time * 0.1) * 0.3;
    
    // Combine surface effects
    float surfaceDetail = surfaceNoise + prominences * 0.5 + granulation;
    surfaceDetail = clamp(surfaceDetail, 0.0, 1.0);
    
    // Fresnel effect for rim lighting
    float fresnel = 1.0 - dot(vToCamera, vNormal);
    fresnel = pow(fresnel, 1.5);
    
    // Base sun color with surface variation
    vec3 baseColor = sunColor;
    baseColor = mix(baseColor * 0.8, baseColor * 1.4, surfaceDetail);
    
    // Add solar flare colors
    vec3 flareColor = mix(vec3(1.0, 0.6, 0.1), vec3(1.0, 0.9, 0.3), surfaceDetail);
    baseColor = mix(baseColor, flareColor, prominences * 0.7);
    
    // Intensity based on surface detail and distance
    float finalIntensity = intensity * (0.8 + surfaceDetail * 0.4);
    
    // Corona effect at the edges
    vec3 corona = coronaColor * coronaIntensity * fresnel * fresnel;
    
    // Distance-based glow
    float distanceGlow = 1.0 / (1.0 + vDistanceToCamera * 0.001);
    
    // Final color
    vec3 finalColor = baseColor * finalIntensity + corona;
    finalColor *= (1.0 + distanceGlow * 0.5);
    
    // Enhanced rim for dramatic effect
    finalColor += sunColor * fresnel * 2.0;
    
    gl_FragColor = vec4(finalColor, 1.0);
}
`

// Corona vertex shader (for outer glow effect)
const coronaVertexShader = `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform float time;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vToCamera;
varying float vFresnel;

void main() {
    vUv = uv;
    
    // Transform to world space
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    
    // Normal in world space
    vNormal = normalize(normalMatrix * normal);
    
    // Direction to camera
    vToCamera = normalize(cameraPosition - worldPosition.xyz);
    
    // Fresnel for rim effect
    vFresnel = 1.0 - dot(vToCamera, vNormal);
    vFresnel = pow(vFresnel, 1.5);
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`

// Corona fragment shader
const coronaFragmentShader = `
precision highp float;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vToCamera;
varying float vFresnel;

uniform float time;
uniform vec3 coronaColor;
uniform float coronaIntensity;

float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    // Animated corona noise
    float coronaNoise = noise(vUv * 16.0 + time * 0.1);
    coronaNoise += noise(vUv * 32.0 + time * 0.15) * 0.5;
    
    // Corona intensity based on viewing angle
    float intensity = vFresnel * coronaIntensity;
    intensity *= (0.7 + coronaNoise * 0.6);
    
    // Color with plasma-like effect
    vec3 color = coronaColor;
    color = mix(color, vec3(1.0, 0.8, 0.4), coronaNoise * 0.5);
    
    gl_FragColor = vec4(color * intensity, intensity * 0.8);
}
`

interface SunMaterialProps {
  sunRadius: number
  intensity?: number
  coronaIntensity?: number
  sunColor?: string
  coronaColor?: string
}

export const SunMaterial: React.FC<SunMaterialProps> = ({
  sunRadius,
  intensity = 2.0,
  coronaIntensity = 1.0,
  sunColor = '#FDB813',
  coronaColor = '#FF6B35'
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const { camera } = useThree()
  const { currentTime } = useTimeStore()

  const sunUniforms = useMemo(() => ({
    time: { value: 0 },
    sunColor: { value: new Color(sunColor) },
    intensity: { value: intensity },
    coronaIntensity: { value: coronaIntensity },
    coronaColor: { value: new Color(coronaColor) },
    sunRadius: { value: sunRadius },
    cameraPosition: { value: camera.position },
  }), [sunRadius, intensity, coronaIntensity, sunColor, coronaColor, camera.position])

  // Update uniforms each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = currentTime * 0.001
      materialRef.current.uniforms.cameraPosition.value.copy(state.camera.position)
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={sunVertexShader}
      fragmentShader={sunFragmentShader}
      uniforms={sunUniforms}
      transparent={false}
      depthWrite={true}
      depthTest={true}
    />
  )
}

interface CoronaMaterialProps {
  coronaColor?: string
  coronaIntensity?: number
}

export const CoronaMaterial: React.FC<CoronaMaterialProps> = ({
  coronaColor = '#FF6B35',
  coronaIntensity = 0.8
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const { camera } = useThree()
  const { currentTime } = useTimeStore()

  const coronaUniforms = useMemo(() => ({
    time: { value: 0 },
    coronaColor: { value: new Color(coronaColor) },
    coronaIntensity: { value: coronaIntensity },
    cameraPosition: { value: camera.position },
  }), [coronaColor, coronaIntensity, camera.position])

  // Update uniforms each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = currentTime * 0.001
      materialRef.current.uniforms.cameraPosition.value.copy(state.camera.position)
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={coronaVertexShader}
      fragmentShader={coronaFragmentShader}
      uniforms={coronaUniforms}
      transparent={true}
      depthWrite={false}
      depthTest={true}
      side={2} // THREE.DoubleSide
    />
  )
} 