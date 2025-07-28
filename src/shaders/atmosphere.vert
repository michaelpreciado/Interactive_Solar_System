// Atmospheric Scattering Vertex Shader
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
} 