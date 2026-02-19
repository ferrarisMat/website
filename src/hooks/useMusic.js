import { useState, useRef, useEffect, useCallback } from 'react';
import { searchDnBTracks } from '../services/music/musicService';
import { getAudioElement, playOnChannel, pauseChannel, pauseAll, resumeAll } from '../services/music/musicPlayer';
import { AudioMixer } from '../services/audio/audioAnalyser';
import { FrequencyTexture } from '../services/audio/frequencyTexture';
import { getCountryCode } from '../services/music/countryStoreMap';

export function useMusic() {
  const [playing, setPlaying] = useState(false);
  const [currentTracks, setCurrentTracks] = useState({ prev: null, next: null });

  const mixerRef = useRef(null);
  const freqTextureRef = useRef(null);
  const frequencyTextureRef = useRef(null);
  const audioReactiveRef = useRef(0.0);
  const analyserConnectedRef = useRef(false);

  const channelFreqTextureARef = useRef(null);  // FrequencyTexture instance for channel A
  const channelFreqTextureBRef = useRef(null);  // FrequencyTexture instance for channel B
  const channelFreqTexturesRef = useRef({ A: null, B: null }); // DataTexture refs for rendering

  const trackCacheRef = useRef({});       // countryCode -> tracks[]
  const trackIndexRef = useRef({});       // countryCode -> current index
  const channelAssignment = useRef({ A: null, B: null }); // channelId -> countryCode
  const channelAssignmentRef = useRef({ A: null, B: null }); // exposed to Globe
  const fetchingRef = useRef({});         // countryCode -> true (in-flight guard)
  const playingRef = useRef(false);       // avoid stale closure

  // Create frequency textures on mount (mixed + per-channel)
  useEffect(() => {
    freqTextureRef.current = new FrequencyTexture();
    frequencyTextureRef.current = freqTextureRef.current.getTexture();
    channelFreqTextureARef.current = new FrequencyTexture();
    channelFreqTextureBRef.current = new FrequencyTexture();
    channelFreqTexturesRef.current = {
      A: channelFreqTextureARef.current.getTexture(),
      B: channelFreqTextureBRef.current.getTexture()
    };
    return () => {
      freqTextureRef.current?.dispose();
      channelFreqTextureARef.current?.dispose();
      channelFreqTextureBRef.current?.dispose();
      mixerRef.current?.dispose();
    };
  }, []);

  // Track ended handlers — advance to next track in queue, loop
  useEffect(() => {
    const handleEnded = (channelId) => () => {
      const code = channelAssignment.current[channelId];
      if (!code) return;
      const tracks = trackCacheRef.current[code];
      if (!tracks || tracks.length === 0) return;
      const idx = ((trackIndexRef.current[code] || 0) + 1) % tracks.length;
      trackIndexRef.current[code] = idx;
      if (tracks[idx].preview_url) {
        playOnChannel(channelId, tracks[idx].preview_url);
      }
    };

    const elA = getAudioElement('A');
    const elB = getAudioElement('B');
    const handlerA = handleEnded('A');
    const handlerB = handleEnded('B');
    elA.addEventListener('ended', handlerA);
    elB.addEventListener('ended', handlerB);
    return () => {
      elA.removeEventListener('ended', handlerA);
      elB.removeEventListener('ended', handlerB);
    };
  }, []);

  const ensureMixer = useCallback(() => {
    if (mixerRef.current) return;
    mixerRef.current = new AudioMixer();
    mixerRef.current.addChannel('A', getAudioElement('A'));
    mixerRef.current.addChannel('B', getAudioElement('B'));
    analyserConnectedRef.current = true;
  }, []);

  const fetchTracksForCountry = useCallback(async (countryCode) => {
    if (trackCacheRef.current[countryCode] || fetchingRef.current[countryCode]) return;
    fetchingRef.current[countryCode] = true;
    try {
      const tracks = await searchDnBTracks(countryCode);
      trackCacheRef.current[countryCode] = tracks;
    } catch (err) {
      console.error('Failed to fetch tracks for', countryCode, err);
    } finally {
      fetchingRef.current[countryCode] = false;
    }
  }, []);

  const startCountryOnChannel = useCallback((channelId, countryCode) => {
    const tracks = trackCacheRef.current[countryCode];
    if (!tracks || tracks.length === 0) {
      // Fetch then start when ready
      fetchTracksForCountry(countryCode).then(() => {
        const fetched = trackCacheRef.current[countryCode];
        // Verify this channel still belongs to this country
        if (fetched && fetched.length > 0 && channelAssignment.current[channelId] === countryCode && playingRef.current) {
          const idx = trackIndexRef.current[countryCode] || 0;
          if (fetched[idx]?.preview_url) {
            playOnChannel(channelId, fetched[idx].preview_url);
          }
        }
      });
      return;
    }
    if (playingRef.current) {
      const idx = trackIndexRef.current[countryCode] || 0;
      if (tracks[idx]?.preview_url) {
        playOnChannel(channelId, tracks[idx].preview_url);
      }
    }
  }, [fetchTracksForCountry]);

  // Called on every scroll change
  const updateScrollAudio = useCallback((scrollState, locations) => {
    const { prevIndex, nextIndex, blend, volumePrev, volumeNext } = scrollState;

    const prevCountry = locations[prevIndex]?.country;
    const nextCountry = locations[nextIndex]?.country;
    const prevCode = prevCountry ? getCountryCode(prevCountry) : null;
    const nextCode = nextCountry ? getCountryCode(nextCountry) : null;

    const assign = channelAssignment.current;
    const neededCodes = new Set([prevCode, nextCode].filter(Boolean));

    // Free channels whose country is no longer needed
    ['A', 'B'].forEach(ch => {
      if (assign[ch] && !neededCodes.has(assign[ch])) {
        pauseChannel(ch);
        assign[ch] = null;
      }
    });

    // Assign needed countries to free channels
    neededCodes.forEach(code => {
      if (assign.A === code || assign.B === code) return;
      const freeCh = assign.A === null ? 'A' : assign.B === null ? 'B' : null;
      if (!freeCh) return;
      assign[freeCh] = code;
      startCountryOnChannel(freeCh, code);
    });

    // Set volumes
    if (mixerRef.current) {
      ['A', 'B'].forEach(ch => {
        let vol = 0;
        if (assign[ch] === prevCode && prevCode) vol = volumePrev;
        if (assign[ch] === nextCode && nextCode) vol = volumeNext;
        // If prevCode === nextCode, full volume
        if (prevCode && nextCode && prevCode === nextCode && assign[ch] === prevCode) vol = 1;
        mixerRef.current.setChannelVolume(ch, vol);
      });
    }

    // Sync exposed channel assignment for Globe
    channelAssignmentRef.current = { A: assign.A, B: assign.B };

    // Prefetch adjacent countries
    [prevIndex - 1, nextIndex + 1].forEach(i => {
      if (i >= 0 && i < locations.length && locations[i].country) {
        const code = getCountryCode(locations[i].country);
        if (code) fetchTracksForCountry(code);
      }
    });

    // Update current tracks for UI
    const prevTrack = prevCode && trackCacheRef.current[prevCode]
      ? trackCacheRef.current[prevCode][trackIndexRef.current[prevCode] || 0] : null;
    const nextTrack = nextCode && trackCacheRef.current[nextCode]
      ? trackCacheRef.current[nextCode][trackIndexRef.current[nextCode] || 0] : null;
    setCurrentTracks({ prev: prevTrack, next: nextTrack });
  }, [startCountryOnChannel, fetchTracksForCountry]);

  const togglePlayPause = useCallback(() => {
    if (playing) {
      pauseAll();
      setPlaying(false);
      playingRef.current = false;
    } else {
      ensureMixer();
      playingRef.current = true;
      // Start playback on any assigned channels
      const assign = channelAssignment.current;
      ['A', 'B'].forEach(ch => {
        if (assign[ch]) {
          const tracks = trackCacheRef.current[assign[ch]];
          const idx = trackIndexRef.current[assign[ch]] || 0;
          if (tracks && tracks[idx]?.preview_url) {
            playOnChannel(ch, tracks[idx].preview_url);
          }
        }
      });
      setPlaying(true);
    }
  }, [playing, ensureMixer]);

  const updateFrequencyData = useCallback(() => {
    if (!mixerRef.current || !freqTextureRef.current) return;
    const data = mixerRef.current.getFrequencyData();
    freqTextureRef.current.update(data);
    // Per-channel frequency data
    const dataA = mixerRef.current.getChannelFrequencyData('A');
    const dataB = mixerRef.current.getChannelFrequencyData('B');
    if (dataA && channelFreqTextureARef.current) channelFreqTextureARef.current.update(dataA);
    if (dataB && channelFreqTextureBRef.current) channelFreqTextureBRef.current.update(dataB);
  }, []);

  return {
    isPlaying: playing,
    currentTracks,
    togglePlayPause,
    updateScrollAudio,
    updateFrequencyData,
    frequencyTextureRef,
    channelFreqTexturesRef,
    channelAssignmentRef,
    audioReactiveRef,
    analyserConnected: analyserConnectedRef
  };
}
