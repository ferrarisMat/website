import * as THREE from 'three';

export const AtmosphereShader = {
  uniforms: {
    'c': { value: 0.5 },
    'p': { value: 4.0 },
    'glowColor': { value: new THREE.Color(0x4fc3f7) },
    'viewVector': { value: new THREE.Vector3() },
    'sunPosition': { value: new THREE.Vector3(0, 0, 0) }
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float c;
    uniform float p;
    uniform vec3 glowColor;
    uniform vec3 viewVector;
    uniform vec3 sunPosition;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying vec3 vWorldPosition;
    void main() {
      // Calculate view direction
      vec3 viewDirection = normalize(viewVector - vPosition);
      
      // Calculate sun direction from surface point
      vec3 sunDirection = normalize(sunPosition - vWorldPosition);
      
      // Rim lighting effect for atmosphere
      float rim = 1.0 - max(dot(viewDirection, vNormal), 0.0);
      float atmosphereIntensity = smoothstep(0.0, 1.0, pow(rim, 2.0));
      
      // Sun illumination
      float sunIllumination = max(0.0, dot(vNormal, sunDirection));
      float illuminationFactor = 0.3 + 0.7 * smoothstep(0.0, 1.0, sunIllumination);
      
      // Combine effects with better balance
      float finalIntensity = atmosphereIntensity * illuminationFactor * 0.08;
      
      // Atmosphere color
      vec3 atmosphereColor = vec3(0.4, 0.7, 1.0);
      
      gl_FragColor = vec4(atmosphereColor, finalIntensity);
    }
  `
}; 