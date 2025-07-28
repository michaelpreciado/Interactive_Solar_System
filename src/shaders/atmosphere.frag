// Atmospheric Scattering Fragment Shader
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
} 