import * as THREE from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform vec3 sunPosition;
uniform float sunRadius;
uniform float intensity;
varying vec2 vUv;

void main() {
    vec4 color = texture2D(tDiffuse, vUv);
    float depth = texture2D(tDepth, vUv).r;
    
    // Calculate distance from sun center (already in UV space)
    float dist = length(vUv - sunPosition.xy);
    
    // Create hard-edged uniform glow
    float glow = step(dist, sunRadius);
    
    // Apply eclipse effect based on depth
    float eclipseFactor = smoothstep(0.0, 0.1, depth);
    
    // Use a constant color for the glow
    vec3 glowColor = vec3(1.0, 0.4, 0.1); // Warm sun color
    
    // Combine effects with uniform intensity
    vec3 finalColor = mix(color.rgb, glowColor, glow * intensity * eclipseFactor);
    
    gl_FragColor = vec4(finalColor, color.a);
}
`

export const EclipseShader = {
    uniforms: {
        tDiffuse: { value: null },
        tDepth: { value: null },
        sunPosition: { value: new THREE.Vector3() },
        sunRadius: { value: 0.1 },
        intensity: { value: 1.0 }
    },
    vertexShader,
    fragmentShader
} 