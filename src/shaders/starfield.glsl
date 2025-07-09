// Starfield Vertex Shader
attribute vec3 position;
attribute vec2 uv;
attribute vec3 color;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform float time;
uniform float size;

varying vec2 vUv;
varying vec3 vColor;
varying float vOpacity;

void main() {
    vUv = uv;
    vColor = color;
    
    vec3 pos = position;
    
    // Add subtle movement for parallax effect
    pos.x += sin(time * 0.5 + position.z * 0.1) * 0.1;
    pos.y += cos(time * 0.3 + position.x * 0.1) * 0.1;
    
    // Vary opacity based on distance and time for twinkling effect
    vOpacity = 0.5 + 0.5 * sin(time * 2.0 + position.x * 10.0 + position.y * 10.0);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Make stars appear as points with size based on distance
    gl_PointSize = size * (300.0 / -mvPosition.z);
}

// Starfield Fragment Shader
precision mediump float;

varying vec2 vUv;
varying vec3 vColor;
varying float vOpacity;

void main() {
    // Create circular star shape
    float distance = length(gl_PointCoord - vec2(0.5, 0.5));
    float alpha = 1.0 - smoothstep(0.0, 0.5, distance);
    
    // Add glow effect
    float glow = 1.0 - smoothstep(0.0, 0.8, distance);
    
    vec3 color = vColor + vec3(0.3, 0.3, 0.4) * glow;
    
    gl_FragColor = vec4(color, alpha * vOpacity);
} 