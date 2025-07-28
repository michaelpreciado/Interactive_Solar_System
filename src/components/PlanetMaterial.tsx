import React, { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { ShaderMaterial, Vector3, Color, Texture } from 'three'
import { useTimeStore } from '../stores/useTimeStore'

// Import shader code as strings
const planetVertexShader = `// Planet Vertex Shader
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute vec3 tangent;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform float time;
uniform float planetRadius;
uniform bool hasAtmosphere;

// Lighting uniforms
uniform vec3 sunPosition;
uniform vec3 sunColor;
uniform float sunIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vToSun;
varying vec3 vToCamera;
varying float vAtmosphereEffect;

void main() {
    vUv = uv;
    
    // Transform normal to world space
    vNormal = normalize(normalMatrix * normal);
    vTangent = normalize(normalMatrix * tangent);
    vBitangent = cross(vNormal, vTangent);
    
    // World position
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // View position
    vec4 viewPosition = viewMatrix * worldPosition;
    vViewPosition = viewPosition.xyz;
    
    // Light direction (to sun)
    vToSun = normalize(sunPosition - vWorldPosition);
    
    // View direction (to camera)
    vToCamera = normalize(cameraPosition - vWorldPosition);
    
    // Atmospheric effect based on viewing angle
    if (hasAtmosphere) {
        float dotProduct = dot(vNormal, vToCamera);
        vAtmosphereEffect = 1.0 - abs(dotProduct);
        vAtmosphereEffect = pow(vAtmosphereEffect, 2.0);
    } else {
        vAtmosphereEffect = 0.0;
    }
    
    gl_Position = projectionMatrix * viewPosition;
}`

const planetFragmentShader = `// Planet Fragment Shader
precision highp float;

// Varyings from vertex shader
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewPosition;
varying vec3 vTangent;
varying vec3 vBitangent;
varying vec3 vToSun;
varying vec3 vToCamera;
varying float vAtmosphereEffect;

// Material uniforms
uniform vec3 planetColor;
uniform float roughness;
uniform float metalness;
uniform float emissiveIntensity;
uniform bool hasTexture;
uniform sampler2D diffuseMap;
uniform sampler2D normalMap;
uniform sampler2D roughnessMap;
uniform bool hasNormalMap;
uniform bool hasRoughnessMap;

// Lighting uniforms
uniform vec3 sunColor;
uniform float sunIntensity;
uniform vec3 ambientColor;
uniform float ambientIntensity;

// Atmospheric uniforms
uniform bool hasAtmosphere;
uniform vec3 atmosphereColor;
uniform float atmosphereIntensity;

// Planet-specific uniforms
uniform bool isGasGiant;
uniform float cloudDensity;
uniform float time;

// Noise function for procedural effects
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

// Fresnel effect calculation
float fresnel(vec3 viewDir, vec3 normal, float power) {
    return pow(1.0 - max(dot(viewDir, normal), 0.0), power);
}

// PBR lighting calculation
vec3 calculatePBR(vec3 albedo, vec3 normal, vec3 viewDir, vec3 lightDir, vec3 lightColor, float roughness, float metalness) {
    // Half vector
    vec3 halfVector = normalize(lightDir + viewDir);
    
    // Dot products
    float NdotL = max(dot(normal, lightDir), 0.0);
    float NdotV = max(dot(normal, viewDir), 0.0);
    float NdotH = max(dot(normal, halfVector), 0.0);
    float VdotH = max(dot(viewDir, halfVector), 0.0);
    
    // Fresnel
    vec3 F0 = mix(vec3(0.04), albedo, metalness);
    vec3 F = F0 + (1.0 - F0) * pow(1.0 - VdotH, 5.0);
    
    // Distribution (GGX)
    float alpha = roughness * roughness;
    float alpha2 = alpha * alpha;
    float denom = NdotH * NdotH * (alpha2 - 1.0) + 1.0;
    float D = alpha2 / (3.14159265 * denom * denom);
    
    // Geometry
    float k = (roughness + 1.0) * (roughness + 1.0) / 8.0;
    float G1L = NdotL / (NdotL * (1.0 - k) + k);
    float G1V = NdotV / (NdotV * (1.0 - k) + k);
    float G = G1L * G1V;
    
    // BRDF
    vec3 numerator = D * G * F;
    float denominator = 4.0 * NdotV * NdotL + 0.001;
    vec3 specular = numerator / denominator;
    
    // Diffuse
    vec3 kS = F;
    vec3 kD = vec3(1.0) - kS;
    kD *= 1.0 - metalness;
    vec3 diffuse = kD * albedo / 3.14159265;
    
    return (diffuse + specular) * lightColor * NdotL;
}

void main() {
    // Base color
    vec3 baseColor = planetColor;
    if (hasTexture) {
        baseColor *= texture2D(diffuseMap, vUv).rgb;
    }
    
    // Normal calculation
    vec3 normal = normalize(vNormal);
    if (hasNormalMap) {
        vec3 normalMap = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
        mat3 TBN = mat3(normalize(vTangent), normalize(vBitangent), normal);
        normal = normalize(TBN * normalMap);
    }
    
    // Material properties
    float finalRoughness = roughness;
    if (hasRoughnessMap) {
        finalRoughness *= texture2D(roughnessMap, vUv).r;
    }
    
    // Gas giant cloud effects
    if (isGasGiant) {
        float cloudNoise = noise(vUv * 8.0 + time * 0.1);
        cloudNoise += noise(vUv * 16.0 + time * 0.15) * 0.5;
        cloudNoise += noise(vUv * 32.0 + time * 0.2) * 0.25;
        
        // Add cloud bands for Jupiter/Saturn
        float bands = sin(vUv.y * 20.0 + cloudNoise * 2.0) * 0.5 + 0.5;
        baseColor = mix(baseColor, baseColor * 1.3, bands * cloudDensity);
        
        // Adjust roughness for gas giants
        finalRoughness = mix(finalRoughness, 0.1, cloudDensity);
    }
    
    // PBR lighting
    vec3 viewDir = normalize(vToCamera);
    vec3 lightDir = normalize(vToSun);
    
    vec3 lighting = calculatePBR(baseColor, normal, viewDir, lightDir, sunColor * sunIntensity, finalRoughness, metalness);
    
    // Ambient lighting
    vec3 ambient = ambientColor * ambientIntensity * baseColor;
    
    // Atmospheric scattering
    vec3 atmosphereGlow = vec3(0.0);
    if (hasAtmosphere && vAtmosphereEffect > 0.0) {
        float atmosphereFresnel = fresnel(viewDir, normal, 2.0);
        atmosphereGlow = atmosphereColor * atmosphereIntensity * vAtmosphereEffect * atmosphereFresnel;
    }
    
    // Emissive (for selection highlight)
    vec3 emissive = baseColor * emissiveIntensity;
    
    // Final color
    vec3 finalColor = lighting + ambient + atmosphereGlow + emissive;
    
    // Atmospheric rim lighting
    if (hasAtmosphere) {
        float rimEffect = 1.0 - dot(viewDir, normal);
        rimEffect = pow(rimEffect, 3.0);
        finalColor += atmosphereColor * rimEffect * 0.5;
    }
    
    gl_FragColor = vec4(finalColor, 1.0);
}`

const atmosphereVertexShader = `// Atmospheric Scattering Vertex Shader
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
uniform vec3 cameraPosition;
uniform vec3 sunPosition;
uniform float planetRadius;
uniform float atmosphereRadius;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vToCamera;
varying vec3 vToSun;
varying float vAtmosphereHeight;
varying vec2 vUv;

void main() {
    vUv = uv;
    
    // Transform to world space
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Normal in world space
    vNormal = normalize(normalMatrix * normal);
    
    // Direction vectors
    vToCamera = normalize(cameraPosition - vWorldPosition);
    vToSun = normalize(sunPosition);
    
    // Calculate height in atmosphere (0 = planet surface, 1 = atmosphere edge)
    float distanceFromCenter = length(vWorldPosition);
    vAtmosphereHeight = (distanceFromCenter - planetRadius) / (atmosphereRadius - planetRadius);
    
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}`

const atmosphereFragmentShader = `// Atmospheric Scattering Fragment Shader
precision highp float;

varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vToCamera;
varying vec3 vToSun;
varying float vAtmosphereHeight;
varying vec2 vUv;

// Atmospheric parameters
uniform vec3 atmosphereColor;
uniform float atmosphereDensity;
uniform float sunIntensity;
uniform vec3 sunColor;
uniform float rayleighScattering;
uniform float mieScattering;
uniform float scatteringAsymmetry;

// Planet parameters
uniform float planetRadius;
uniform float atmosphereRadius;
uniform bool isPlanetVisible;

// Rayleigh scattering phase function
float rayleighPhase(float cosTheta) {
    return 3.0 / (16.0 * 3.14159265) * (1.0 + cosTheta * cosTheta);
}

// Mie scattering phase function (Henyey-Greenstein)
float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    return (1.0 - g2) / (4.0 * 3.14159265 * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
}

// Atmospheric density falloff
float atmosphericDensity(float height) {
    return exp(-height * atmosphereDensity);
}

void main() {
    // Calculate scattering angles
    float cosTheta = dot(normalize(vToCamera), normalize(vToSun));
    
    // Height-based density
    float density = atmosphericDensity(vAtmosphereHeight);
    
    // Rayleigh scattering (shorter wavelengths)
    vec3 rayleighColor = vec3(0.3, 0.6, 1.0); // Blue-ish
    float rayleighPhaseValue = rayleighPhase(cosTheta);
    vec3 rayleighScatter = rayleighColor * rayleighScattering * rayleighPhaseValue * density;
    
    // Mie scattering (longer wavelengths, dust/particles)
    vec3 mieColor = vec3(1.0, 0.8, 0.6); // Orange-ish
    float miePhaseValue = miePhase(cosTheta, scatteringAsymmetry);
    vec3 mieScatter = mieColor * mieScattering * miePhaseValue * density;
    
    // Combine scattering effects
    vec3 scatteredLight = (rayleighScatter + mieScatter) * sunColor * sunIntensity;
    
    // Atmospheric glow based on view angle
    float rim = 1.0 - abs(dot(vToCamera, vNormal));
    float atmosphereGlow = pow(rim, 2.0) * density;
    
    // Final atmospheric color
    vec3 atmosphereEffect = scatteredLight + atmosphereColor * atmosphereGlow;
    
    // Fade based on height in atmosphere
    float heightFade = 1.0 - smoothstep(0.8, 1.0, vAtmosphereHeight);
    
    // Opacity based on density and viewing angle
    float opacity = density * heightFade * (0.3 + 0.7 * rim);
    
    // Enhanced sunset/sunrise effect
    float sunAngle = dot(vNormal, normalize(vToSun));
    if (sunAngle < 0.2 && sunAngle > -0.2) {
        vec3 sunsetColor = vec3(1.0, 0.4, 0.1);
        float sunsetIntensity = 1.0 - abs(sunAngle) / 0.2;
        atmosphereEffect += sunsetColor * sunsetIntensity * 0.5;
        opacity += sunsetIntensity * 0.3;
    }
    
    gl_FragColor = vec4(atmosphereEffect, opacity);
}`

interface PlanetMaterialProps {
  planetColor: string
  planetRadius: number
  planetName: string
  roughness?: number
  metalness?: number
  emissiveIntensity?: number
  hasAtmosphere?: boolean
  atmosphereColor?: string
  diffuseMap?: Texture
  normalMap?: Texture
  roughnessMap?: Texture
  isSelected?: boolean
}

export const PlanetMaterial: React.FC<PlanetMaterialProps> = ({
  planetColor,
  planetRadius,
  planetName,
  roughness = 0.8,
  metalness = 0.1,
  emissiveIntensity = 0.1,
  hasAtmosphere = false,
  atmosphereColor = "#87CEEB",
  diffuseMap,
  normalMap,
  roughnessMap,
  isSelected = false
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const { camera } = useThree()
  const { currentTime } = useTimeStore()

  // Determine if this is a gas giant
  const isGasGiant = planetName === 'Jupiter' || planetName === 'Saturn'

  // Planet-specific material properties
  const materialProps = useMemo(() => {
    switch (planetName) {
      case 'Mercury':
        return { roughness: 0.9, metalness: 0.3, atmosphereColor: "#444444" }
      case 'Venus':
        return { roughness: 0.1, metalness: 0.0, atmosphereColor: "#FFC649" }
      case 'Earth':
        return { roughness: 0.6, metalness: 0.0, atmosphereColor: "#87CEEB" }
      case 'Mars':
        return { roughness: 0.8, metalness: 0.1, atmosphereColor: "#CD5C5C" }
      case 'Jupiter':
        return { roughness: 0.2, metalness: 0.0, atmosphereColor: "#D2691E" }
      case 'Saturn':
        return { roughness: 0.3, metalness: 0.0, atmosphereColor: "#FAD5A5" }
      case 'Uranus':
        return { roughness: 0.1, metalness: 0.0, atmosphereColor: "#4FD0E7" }
      case 'Neptune':
        return { roughness: 0.1, metalness: 0.0, atmosphereColor: "#4169E1" }
      default:
        return { roughness, metalness, atmosphereColor }
    }
  }, [planetName, roughness, metalness, atmosphereColor])

  // Sun position (at origin for our solar system)
  const sunPosition = useMemo(() => new Vector3(0, 0, 0), [])

  // Planet material uniforms
  const planetUniforms = useMemo(() => ({
    // Material properties
    planetColor: { value: new Color(planetColor) },
    roughness: { value: materialProps.roughness },
    metalness: { value: materialProps.metalness },
    emissiveIntensity: { value: isSelected ? emissiveIntensity * 3 : emissiveIntensity },
    
    // Textures
    hasTexture: { value: !!diffuseMap },
    diffuseMap: { value: diffuseMap || null },
    normalMap: { value: normalMap || null },
    roughnessMap: { value: roughnessMap || null },
    hasNormalMap: { value: !!normalMap },
    hasRoughnessMap: { value: !!roughnessMap },
    
    // Lighting
    sunPosition: { value: sunPosition },
    sunColor: { value: new Color('#FFF8DC') },
    sunIntensity: { value: 1.0 },
    ambientColor: { value: new Color('#404040') },
    ambientIntensity: { value: 0.1 },
    
    // Atmospheric effects
    hasAtmosphere: { value: hasAtmosphere },
    atmosphereColor: { value: new Color(materialProps.atmosphereColor) },
    atmosphereIntensity: { value: hasAtmosphere ? 0.5 : 0.0 },
    
    // Planet-specific
    isGasGiant: { value: isGasGiant },
    cloudDensity: { value: isGasGiant ? 0.8 : 0.0 },
    time: { value: 0 },
    
    // Camera
    cameraPosition: { value: camera.position },
    planetRadius: { value: planetRadius },
  }), [
    planetColor, materialProps, emissiveIntensity, isSelected, diffuseMap, 
    normalMap, roughnessMap, hasAtmosphere, isGasGiant, camera.position, planetRadius
  ])

  // Update uniforms each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = currentTime * 0.001
      materialRef.current.uniforms.cameraPosition.value.copy(state.camera.position)
      materialRef.current.uniforms.emissiveIntensity.value = isSelected ? emissiveIntensity * 3 : emissiveIntensity
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={planetVertexShader}
      fragmentShader={planetFragmentShader}
      uniforms={planetUniforms}
      transparent={false}
      depthWrite={true}
      depthTest={true}
    />
  )
}

interface AtmosphereMaterialProps {
  planetRadius: number
  atmosphereRadius: number
  atmosphereColor: string
  density?: number
  rayleighScattering?: number
  mieScattering?: number
}

export const AtmosphereMaterial: React.FC<AtmosphereMaterialProps> = ({
  planetRadius,
  atmosphereRadius,
  atmosphereColor,
  density = 2.0,
  rayleighScattering = 0.025,
  mieScattering = 0.01
}) => {
  const materialRef = useRef<ShaderMaterial>(null)
  const { camera } = useThree()

  const atmosphereUniforms = useMemo(() => ({
    // Atmospheric parameters
    atmosphereColor: { value: new Color(atmosphereColor) },
    atmosphereDensity: { value: density },
    sunIntensity: { value: 1.0 },
    sunColor: { value: new Color('#FFF8DC') },
    rayleighScattering: { value: rayleighScattering },
    mieScattering: { value: mieScattering },
    scatteringAsymmetry: { value: 0.76 },
    
    // Planet parameters
    planetRadius: { value: planetRadius },
    atmosphereRadius: { value: atmosphereRadius },
    isPlanetVisible: { value: true },
    
    // Sun position
    sunPosition: { value: new Vector3(0, 0, 0) },
    cameraPosition: { value: camera.position },
  }), [planetRadius, atmosphereRadius, atmosphereColor, density, rayleighScattering, mieScattering, camera.position])

  // Update camera position each frame
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.cameraPosition.value.copy(state.camera.position)
    }
  })

  return (
    <shaderMaterial
      ref={materialRef}
      vertexShader={atmosphereVertexShader}
      fragmentShader={atmosphereFragmentShader}
      uniforms={atmosphereUniforms}
      transparent={true}
      depthWrite={false}
      depthTest={true}
      side={2} // THREE.DoubleSide
    />
  )
} 