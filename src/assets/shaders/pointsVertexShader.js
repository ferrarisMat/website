// Custom shader for camera-facing brightness, mouse attract, organic movement, and audio reactivity
export const pointsVertexShader = `
  attribute vec3 color;
  attribute float aSize;
  attribute float aSpeed;
  attribute float aPhase;
  attribute float aFreqBin;
  varying vec3 vColor;
  varying float vBrightness;
  varying float vFreqEnergy;

  uniform float size;
  uniform float time;
  uniform vec3 mousePosition;
  uniform float attractStrength;
  uniform float driftScale;
  uniform float entryProgress;
  uniform sampler2D uFrequencyData;
  uniform float uAudioReactive;
  uniform vec3 uActiveCenter;

  void main() {
    vColor = color;
    float t = time * aSpeed;
    float p = aPhase * 6.2832; // phase offset in radians

    // Normal from globe center
    vec3 normal = normalize(position);

    // Subtle perpetual organic movement along normal (radial breathing)
    float wave1 = sin(position.x * 10.0 + t * 0.8 + p) * cos(position.z * 8.0 + t * 0.5);
    float wave2 = sin(position.y * 12.0 + t * 0.6) * cos(position.x * 9.0 + t * 0.9 + p);
    float wave3 = cos(position.z * 11.0 + t * 0.7 + p) * sin(position.y * 7.0 + t * 0.4);
    float drift = (wave1 + wave2 + wave3) * 0.003 * driftScale;

    // Tangential drift along globe surface - phase gives each particle unique direction
    vec3 tangent1 = normalize(cross(normal, vec3(sin(p), cos(p), 0.0) + normal * 0.01));
    vec3 tangent2 = normalize(cross(normal, tangent1));
    float tDrift1 = sin(position.z * 6.0 + t * 0.3 + p) * cos(position.y * 5.0 + t * 0.5);
    float tDrift2 = cos(position.x * 7.0 + t * 0.4) * sin(position.z * 4.0 + t * 0.35 + p);
    vec3 tangentialOffset = (tangent1 * tDrift1 + tangent2 * tDrift2) * 0.002 * driftScale;

    vec3 finalPosition = position + normal * drift + tangentialOffset;

    // Entry animation: per-particle staggered spring from above
    float entryScale = 0.0;
    if (entryProgress >= 0.0) {
      float maxDelay = 0.125;
      float entryT = max(0.0, entryProgress - aPhase * maxDelay);
      float eDamp = 5.0;
      float eFreq = 3.5;
      float eAmp = 5.0;
      // Starts at 1+eAmp (far above final position), oscillates and settles to 1.0
      entryScale = 1.0 + eAmp * exp(-eDamp * entryT) * cos(eFreq * entryT);
    }
    finalPosition *= entryScale;

    // Audio-reactive displacement with multi-band sampling
    float freqEnergy = 0.0;
    if (uAudioReactive > 0.0) {
      // Sharp center sample + neighbors for smoother band response
      float center = texture2D(uFrequencyData, vec2(aFreqBin, 0.5)).r;
      float left   = texture2D(uFrequencyData, vec2(max(aFreqBin - 0.02, 0.0), 0.5)).r;
      float right  = texture2D(uFrequencyData, vec2(min(aFreqBin + 0.02, 1.0), 0.5)).r;
      float rawFreq = center * 0.6 + (left + right) * 0.2;
      // Non-linear response: sharpen peaks, suppress floor
      float shaped = smoothstep(0.1, 0.7, rawFreq);
      freqEnergy = shaped * uAudioReactive;
      // Power curve: nearly invisible at low energy, subtle at high
      float displacement = pow(freqEnergy, 1.5) * 0.06;
      finalPosition += normal * displacement;
    }

    // Audio ripple propagation from active country center
    if (uActiveCenter != vec3(0.0) && uAudioReactive > 0.0 && uAudioReactive < 0.5) {
      // Great-circle distance on sphere (angle between normals)
      float gcDist = acos(clamp(dot(normal, normalize(uActiveCenter)), -1.0, 1.0));
      // Sample bass energy (low frequency bins) for the ripple pulse
      float bassEnergy = texture2D(uFrequencyData, vec2(0.05, 0.5)).r;
      // Expanding concentric rings: travel outward from active center
      float rippleSpeed = 3.0;
      float rippleFreq = 8.0;
      float ripple = sin(gcDist * rippleFreq - time * rippleSpeed) * 0.5 + 0.5;
      // Attenuate with distance — closer countries react more
      float distAtten = exp(-gcDist * 1.5);
      float rippleStrength = ripple * bassEnergy * distAtten * uAudioReactive * 2.0;
      finalPosition += normal * rippleStrength * 0.03;
      freqEnergy = max(freqEnergy, rippleStrength * 0.5);
    }
    vFreqEnergy = freqEnergy;

    // Mouse interaction
    if (attractStrength > 0.0) {
      float dist = distance(finalPosition, mousePosition);

      // Fade out ripple at the very center to avoid visual hole
      float centerFade = smoothstep(0.0, 0.12, dist);

      // Water surface ripples
      float ripple1 = sin(dist * 7.0 - time * 4.0) * exp(-dist * 4.5) * 0.03;
      float ripple2 = sin(dist * 4.0 - time * 2.5) * exp(-dist * 4.0) * 0.02;
      finalPosition += normal * (ripple1 + ripple2) * attractStrength * centerFade;

      // Gravitational pull + orbital swirl (floating particles only, not country dots)
      float particleFactor = max(0.0, (driftScale - 1.0) / 7.0);
      if (particleFactor > 0.0) {
        vec3 toMouse = mousePosition - finalPosition;
        float pullStrength = exp(-dist * dist * 4.0) * 0.05 * particleFactor;
        finalPosition += toMouse * pullStrength * attractStrength;

        vec3 orbitDir = normalize(cross(toMouse, normal));
        float orbitStrength = exp(-dist * dist * 3.0) * 0.03 * particleFactor;
        finalPosition += orbitDir * orbitStrength * attractStrength * sin(time * 2.0 + dist * 5.0);
      }
    }

    // Camera-facing brightness
    vec3 finalWorldPosition = (modelMatrix * vec4(finalPosition, 1.0)).xyz;
    vec3 viewDirection = normalize(cameraPosition - finalWorldPosition);
    vec3 worldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    float brightness = max(dot(worldNormal, viewDirection), 0.0);
    vBrightness = 0.5 + brightness * 0.5;

    // Standard point size calculation with audio size boost
    vec4 mvPosition = modelViewMatrix * vec4(finalPosition, 1.0);
    // Power curve: barely visible size change at low energy, gentle at high
    float audioSizeBoost = 1.0 + pow(freqEnergy, 1.5) * 1.2;
    gl_PointSize = entryScale > 0.0 ? size * aSize * audioSizeBoost * (300.0 / -mvPosition.z) : 0.0;
    gl_Position = projectionMatrix * mvPosition;
  }
`;
