// Planet Fragment Shader
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
} 