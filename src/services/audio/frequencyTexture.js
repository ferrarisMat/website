import * as THREE from 'three';

export class FrequencyTexture {
  constructor(binCount = 128) {
    this.width = binCount;
    this.data = new Uint8Array(this.width * 4); // RGBA format for universal WebGL compatibility
    this.texture = new THREE.DataTexture(
      this.data,
      this.width,
      1,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.wrapS = THREE.ClampToEdgeWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.needsUpdate = true;
  }

  update(frequencyData) {
    if (!frequencyData) return;
    for (let i = 0; i < this.width; i++) {
      const val = i < frequencyData.length ? frequencyData[i] : 0;
      this.data[i * 4] = val;     // R
      this.data[i * 4 + 1] = val; // G
      this.data[i * 4 + 2] = val; // B
      this.data[i * 4 + 3] = 255; // A
    }
    this.texture.needsUpdate = true;
  }

  getTexture() {
    return this.texture;
  }

  dispose() {
    this.texture.dispose();
  }
}
