export const pointsFragmentShader = `
  uniform sampler2D map;
  uniform float opacity;
  varying vec3 vColor;
  varying float vBrightness;
  varying float vFreqEnergy;

  void main() {
    vec4 texColor = texture2D(map, gl_PointCoord);
    if (texColor.a < 0.01) discard;

    // Color shift: green -> cyan -> white as energy rises (power curve keeps low energy subtle)
    vec3 energyColor = vColor;
    float e = pow(vFreqEnergy, 1.5); // suppress low-energy color shifts
    if (e > 0.0) {
      vec3 cyan = vec3(0.2, 1.0, 1.0);
      vec3 white = vec3(1.0, 1.0, 1.0);
      vec3 mid = mix(vColor, cyan, smoothstep(0.15, 0.6, e));
      energyColor = mix(mid, white, smoothstep(0.6, 1.0, e));
    }

    float audioBrightness = 1.0 + e * 0.6;
    gl_FragColor = vec4(energyColor * vBrightness * audioBrightness, texColor.a * opacity);
  }
`;
