// Dual-channel preview player for crossfading between two countries.
// CORS: crossOrigin must be set before src so AnalyserNode gets frequency data.

const elements = {};

export function getAudioElement(channelId) {
  if (!elements[channelId]) {
    elements[channelId] = document.createElement('audio');
    elements[channelId].crossOrigin = 'anonymous';
  }
  return elements[channelId];
}

export function playOnChannel(channelId, previewUrl) {
  const audio = getAudioElement(channelId);
  audio.pause();
  audio.src = previewUrl;
  return audio.play().catch(err => {
    if (err.name === 'AbortError') return;
    throw err;
  });
}

export function pauseChannel(channelId) {
  if (elements[channelId]) elements[channelId].pause();
}

export function resumeChannel(channelId) {
  if (elements[channelId] && elements[channelId].src) {
    return elements[channelId].play().catch(err => {
      if (err.name === 'AbortError') return;
      throw err;
    });
  }
}

export function pauseAll() {
  Object.values(elements).forEach(el => { if (el) el.pause(); });
}

export function resumeAll() {
  Object.values(elements).forEach(el => {
    if (el && el.src) {
      el.play().catch(err => {
        if (err.name === 'AbortError') return;
        throw err;
      });
    }
  });
}
