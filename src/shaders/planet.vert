// Planet Vertex Shader
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
} 