export class AudioMixer {
  constructor(fftSize = 256) {
    this.fftSize = fftSize;
    this.audioContext = null;
    this.analyser = null;
    this.channels = new Map(); // channelId -> { source, gain, element }
    this.frequencyData = new Uint8Array(fftSize / 2);
    this.connected = false;
  }

  ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    if (!this.analyser) {
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = this.fftSize;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.minDecibels = -90;
      this.analyser.maxDecibels = -10;
      this.analyser.connect(this.audioContext.destination);
      this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
      this.connected = true;
    }
  }

  addChannel(channelId, audioElement) {
    this.ensureContext();
    if (this.channels.has(channelId)) return this.channels.get(channelId).gain;

    const source = this.audioContext.createMediaElementSource(audioElement);
    const gain = this.audioContext.createGain();
    gain.gain.value = 0;

    // Per-channel analyser sits between gain and mixed analyser
    const channelAnalyser = this.audioContext.createAnalyser();
    channelAnalyser.fftSize = this.fftSize;
    channelAnalyser.smoothingTimeConstant = 0.8;
    channelAnalyser.minDecibels = -90;
    channelAnalyser.maxDecibels = -10;

    source.connect(gain);
    gain.connect(channelAnalyser);
    channelAnalyser.connect(this.analyser);

    this.channels.set(channelId, { source, gain, channelAnalyser, element: audioElement });
    return gain;
  }

  setChannelVolume(channelId, volume) {
    const ch = this.channels.get(channelId);
    if (ch) ch.gain.gain.value = volume;
  }

  getFrequencyData() {
    if (!this.connected || !this.analyser) return this.frequencyData;
    this.analyser.getByteFrequencyData(this.frequencyData);
    return this.frequencyData;
  }

  getChannelFrequencyData(channelId) {
    const ch = this.channels.get(channelId);
    if (!ch) return null;
    if (!ch.frequencyData) {
      ch.frequencyData = new Uint8Array(ch.channelAnalyser.frequencyBinCount);
    }
    ch.channelAnalyser.getByteFrequencyData(ch.frequencyData);
    return ch.frequencyData;
  }

  dispose() {
    this.channels.forEach(ch => {
      ch.source.disconnect();
      ch.gain.disconnect();
      ch.channelAnalyser.disconnect();
    });
    this.channels.clear();
    if (this.analyser) this.analyser.disconnect();
    if (this.audioContext) this.audioContext.close();
    this.connected = false;
  }
}
