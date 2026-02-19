import { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { pointsFragmentShader, pointsVertexShader } from '../assets/shaders';
import { useMusic } from '../hooks/useMusic';
import { computeScrollState, computeSegmentBreakpoints } from '../services/scroll/scrollModel';
import { getCountryCode } from '../services/music/countryStoreMap';
import PlayPauseButton from '../components/PlayPauseButton';

// Check if a point is inside a polygon using ray casting algorithm
function isPointInPolygon(point, polygon) {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];

    const intersect = ((yi > y) !== (yj > y)) &&
      (x < (xj - xi) * (y - yi) / (yj - yi) + xi);

    if (intersect) inside = !inside;
  }

  return inside;
}

// Convert hex color string to [r, g, b] floats (0-1)
function hexToRgb(hex) {
  const c = parseInt(hex.replace('#', ''), 16);
  return [((c >> 16) & 255) / 255, ((c >> 8) & 255) / 255, (c & 255) / 255];
}

// Simple deterministic hash for jitter
function pseudoRandom(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// Fill a polygon with dots using jittered grid for organic borders
function fillPolygonWithDots(coordinates, dotDensity = 1) {
  const points = [];
  const polygon = coordinates[0]; // Outer ring

  // Find bounding box
  let minLon = Infinity, maxLon = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;

  polygon.forEach(([lon, lat]) => {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  });

  // Generate jittered grid of points
  const step = 1 / dotDensity;
  const jitterAmount = step * 0.45; // Nearly half-step jitter for organic feel
  for (let lon = minLon; lon <= maxLon; lon += step) {
    for (let lat = minLat; lat <= maxLat; lat += step) {
      // Deterministic jitter based on grid position
      const jLon = lon + (pseudoRandom(lon, lat) - 0.5) * jitterAmount * 2;
      const jLat = lat + (pseudoRandom(lat, lon) - 0.5) * jitterAmount * 2;
      if (isPointInPolygon([jLon, jLat], polygon)) {
        points.push({ lat: jLat, lon: jLon });
      }
    }
  }

  return points;
}

// Parse GeoJSON and fill countries with dots, grouped by country
function parseGeoJSON(geoJSON, dotDensity = 1.5) {
  const countriesData = {};

  geoJSON.features.forEach(feature => {
    const countryName = feature.properties.NAME || feature.properties.name || 'Unknown';
    const geometry = feature.geometry;
    const points = [];

    if (geometry.type === 'Polygon') {
      const countryPoints = fillPolygonWithDots(geometry.coordinates, dotDensity);
      points.push(...countryPoints);
    } else if (geometry.type === 'MultiPolygon') {
      geometry.coordinates.forEach(polygon => {
        const countryPoints = fillPolygonWithDots(polygon, dotDensity);
        points.push(...countryPoints);
      });
    }

    if (points.length > 0) {
      countriesData[countryName] = points;
    }
  });

  return countriesData;
}

// Convert lat/lon to 3D coordinates on a sphere
function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

const BASE_SCROLL_PX = 1000;

// Location breakpoints with coordinates — globe tour through the world's DnB scenes
const locations = [
  { name: 'Start', lat: 20, lon: 0, distance: 5, country: null, isCity: false },

  // — Europe —
  { name: 'United Kingdom', lat: 54.0, lon: -2.0, distance: 3, country: 'United Kingdom', isCity: false, description: 'The birthplace of jungle and drum & bass. Andy C, Goldie, Sub Focus, Wilkinson, High Contrast — jump-up, jungle, dancefloor and liquid funk all started here.' },

  { name: 'Belgium', lat: 50.5, lon: 4.5, distance: 3, country: 'Belgium', isCity: false, description: 'Netsky, Andromedik, and Murdock carry the Belgian flag — liquid, dancefloor and rollers with deep breakbeat roots.' },

  { name: 'Netherlands', lat: 52.2, lon: 5.3, distance: 3, country: 'Netherlands', isCity: false, description: 'Home of Noisia, Black Sun Empire, and Nymfo. The Dutch neurofunk school rewired the genre\'s sound design.' },

  { name: 'Germany', lat: 51.2, lon: 10.5, distance: 3, country: 'Germany', isCity: false, description: 'Phace and Current Value push neurofunk and crossbreed to their limits from Berlin\'s industrial underground.' },

  { name: 'Austria', lat: 47.5, lon: 14.6, distance: 3, country: 'Austria', isCity: false, description: 'Mefjus, Camo & Krooked, and DisasZt — Vienna\'s neurofunk and dancefloor producers are among the genre\'s most precise.' },

  { name: 'Czech Republic', lat: 49.8, lon: 15.5, distance: 3, country: 'Czechia', isCity: false, description: 'A-Cray and Forbidden Society lead Prague\'s dark, technical scene — neurofunk and darkstep at their heaviest.' },

  // — Africa —
  { name: 'South Africa', lat: -29.0, lon: 24.0, distance: 3, country: 'South Africa', isCity: false, description: 'Counterstrike brings techstep and neurofunk from the southern hemisphere — raw, uncompromising bass.' },

  // — South America —
  { name: 'Brazil', lat: -14.2, lon: -51.9, distance: 3, country: 'Brazil', isCity: false, description: 'DJ Marky, DJ Patife, and Alibi fused samba with liquid DnB to create sambass — a uniquely Brazilian sound.' },

  { name: 'Colombia', lat: 4.6, lon: -74.1, distance: 3, country: 'Colombia', isCity: false, description: 'Sigma Bogotá and a growing crew push neurofunk and tech DnB from Latin America\'s emerging bass capital.' },

  // — North America —
  { name: 'United States of America', lat: 37.1, lon: -95.7, distance: 3, country: 'United States of America', isCity: false, description: 'Dieselboy pioneered US techstep; Justin Hawkes (Flite) carries the torch with liquid and dancefloor DnB.' },

  { name: 'Canada', lat: 56.1, lon: -106.3, distance: 3, country: 'Canada', isCity: false, description: 'Bensley, Marcus Visionary, Gremlinz, and Stranjah — jungle, deep minimal DnB and dancefloor bass across Toronto and beyond.' },

  // — Asia —
  { name: 'Japan', lat: 36.2, lon: 138.25, distance: 3, country: 'Japan', isCity: false, description: 'Makoto\'s liquid and soulful DnB connects Tokyo\'s meticulous scene to the genre\'s UK roots.' },

  // — Oceania —
  { name: 'New Zealand', lat: -41.3, lon: 174.8, distance: 3, country: 'New Zealand', isCity: false, description: 'The Upbeats and State of Mind built a neurofunk powerhouse on the edge of the world.' },

  { name: 'Australia', lat: -25.3, lon: 133.8, distance: 3, country: 'Australia', isCity: false, description: 'Pendulum and ShockOne took dancefloor DnB global — one of the strongest scenes outside the UK.' }
];

// Convert lat/lon to globe rotation to center the country
function getGlobeRotation(lat, lon) {
  // Rotate globe to bring country to front (facing camera at z-)
  // Camera is at (0, 0, z) looking at origin
  // lon=90 naturally faces camera, adjust rotation accordingly

  const rotationY = -(lon - 90) * (Math.PI / 180) + Math.PI;
  const rotationX = -(lat * -Math.PI) / 180;

  return { x: rotationX, y: rotationY };
}

// Calculate shortest angular distance between two angles
function normalizeAngleDiff(target, current) {
  let diff = target - current;
  // Normalize to [-π, π] range to find shortest path
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return diff;
}

// Create circular alpha texture for round points
let circleTexture = null;
function getCircleTexture() {
  if (circleTexture) return circleTexture;

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // Create simple circular mask without gradient
  ctx.clearRect(0, 0, 64, 64);
  ctx.fillStyle = 'rgba(255, 255, 255, 1)';
  ctx.beginPath();
  ctx.arc(32, 32, 30, 0, Math.PI * 2);
  ctx.fill();

  circleTexture = new THREE.CanvasTexture(canvas);
  return circleTexture;
}

function CountryPoints({ countryName, points, radius, mousePositionRef, attractStrengthRef, entryProgressRef, entryPendingRef, frequencyTextureRef, audioReactiveRef, activeCenterRef, countryBlendsRef, countryFreqMapRef }) {
  // Single material — uniforms interpolated by activeBlend in useFrame
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: pointsVertexShader,
    fragmentShader: pointsFragmentShader,
    uniforms: {
      size: { value: 0.015 },
      map: { value: getCircleTexture() },
      opacity: { value: 0.7 },
      time: { value: 0 },
      mousePosition: { value: new THREE.Vector3() },
      attractStrength: { value: 0 },
      driftScale: { value: 1.0 },
      entryProgress: { value: -1.0 },
      uFrequencyData: { value: null },
      uAudioReactive: { value: 0.0 },
      uActiveCenter: { value: new THREE.Vector3() }
    },
    transparent: true,
    depthTest: true,
    depthWrite: false
  }), []);

  // Update uniforms every frame — blend between active/inactive based on activeBlend
  useFrame((state) => {
    // Trigger entry animation on first render frame after data loads
    if (entryPendingRef.current && entryProgressRef.current < 0) {
      entryProgressRef.current = 0;
      entryPendingRef.current = false;
    }

    const blend = countryBlendsRef.current[countryName] || 0;
    const baseReactive = audioReactiveRef?.current || 0;

    const t = state.clock.elapsedTime;
    material.uniforms.time.value = t;
    material.uniforms.mousePosition.value.copy(mousePositionRef.current);
    material.uniforms.attractStrength.value = attractStrengthRef.current;
    material.uniforms.entryProgress.value = entryProgressRef.current;

    // Interpolate size, opacity, audio reactivity by activeBlend
    material.uniforms.size.value = 0.015 + 0.005 * blend;
    material.uniforms.opacity.value = 0.7 + 0.3 * blend;
    material.uniforms.uAudioReactive.value = baseReactive * (0.16 + 0.84 * blend);

    // Use per-channel frequency texture when this country has its own channel, else mixed
    const channelTexture = countryFreqMapRef.current[countryName];
    material.uniforms.uFrequencyData.value = channelTexture || frequencyTextureRef?.current || null;

    // Ripple origin
    if (activeCenterRef?.current) {
      material.uniforms.uActiveCenter.value.copy(activeCenterRef.current);
    }
  });

  const geometry = useMemo(() => {
    // Compute centroid and max distance for center-out frequency mapping
    let centLat = 0, centLon = 0;
    points.forEach(p => { centLat += p.lat; centLon += p.lon; });
    centLat /= points.length;
    centLon /= points.length;
    let maxDist = 0;
    points.forEach(p => {
      const d = Math.sqrt((p.lat - centLat) ** 2 + (p.lon - centLon) ** 2);
      if (d > maxDist) maxDist = d;
    });
    if (maxDist === 0) maxDist = 1;

    const positions = new Float32Array(points.length * 3);
    const colors = new Float32Array(points.length * 3);
    const sizes = new Float32Array(points.length).fill(1.0);
    const speeds = new Float32Array(points.length).fill(1.0);
    const phases = new Float32Array(points.length);
    const freqBins = new Float32Array(points.length);
    const [cr, cg, cb] = hexToRgb('#00FF88');

    points.forEach((point, i) => {
      const vector = latLonToVector3(point.lat, point.lon, radius + 0.01);
      positions[i * 3] = vector.x;
      positions[i * 3 + 1] = vector.y;
      positions[i * 3 + 2] = vector.z;
      colors[i * 3] = cr;
      colors[i * 3 + 1] = cg;
      colors[i * 3 + 2] = cb;
      phases[i] = Math.random();
      // Center-out frequency mapping: 0.0=lows at center, 1.0=highs at edges
      const d = Math.sqrt((point.lat - centLat) ** 2 + (point.lon - centLon) ** 2);
      freqBins[i] = Math.min(d / maxDist, 1.0);
    });

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('aFreqBin', new THREE.BufferAttribute(freqBins, 1));
    return geom;
  }, [points, radius]);

  return <points geometry={geometry} material={material} />;
}

function FloatingParticles({ radius, count, mousePositionRef, attractStrengthRef, entryProgressRef, frequencyTextureRef, audioReactiveRef, activeCenterRef }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: pointsVertexShader,
    fragmentShader: pointsFragmentShader,
    uniforms: {
      size: { value: 0.015 },
      map: { value: getCircleTexture() },
      opacity: { value: 0.7 },
      time: { value: 0 },
      mousePosition: { value: new THREE.Vector3() },
      attractStrength: { value: 0 },
      driftScale: { value: 8.0 },
      entryProgress: { value: -1.0 },
      uFrequencyData: { value: null },
      uAudioReactive: { value: 0.0 },
      uActiveCenter: { value: new THREE.Vector3() }
    },
    transparent: true,
    depthTest: true,
    depthWrite: false
  }), []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    material.uniforms.time.value = t;
    material.uniforms.mousePosition.value.copy(mousePositionRef.current);
    material.uniforms.attractStrength.value = attractStrengthRef.current;
    material.uniforms.entryProgress.value = entryProgressRef.current;
    if (frequencyTextureRef?.current) {
      material.uniforms.uFrequencyData.value = frequencyTextureRef.current;
    }
    material.uniforms.uAudioReactive.value = (audioReactiveRef?.current || 0) * 0.05; // barely there shimmer
    if (activeCenterRef?.current) {
      material.uniforms.uActiveCenter.value.copy(activeCenterRef.current);
    }
  });

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const speeds = new Float32Array(count);
    const phases = new Float32Array(count);
    const freqBins = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random point on/around sphere at varying heights
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      // Spread from surface (radius+0.01) to well above (radius+0.25)
      const r = radius + 0.01 + Math.pow(Math.random(), 2) * 0.25;

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.cos(phi);
      positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      const [pr, pg, pb] = hexToRgb('#00FF88');
      colors[i * 3] = pr;
      colors[i * 3 + 1] = pg;
      colors[i * 3 + 2] = pb;

      // Random size between 0.3 and 1.8
      sizes[i] = 0.3 + Math.random() * 1.5;
      // Random speed between 0.3 and 2.5
      speeds[i] = 0.3 + Math.random() * 2.2;
      // Random phase 0-1 for unique movement direction
      phases[i] = Math.random();
      // Random frequency bin for ambient audio shimmer
      freqBins[i] = Math.random();
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geom.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
    geom.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));
    geom.setAttribute('aFreqBin', new THREE.BufferAttribute(freqBins, 1));
    return geom;
  }, [radius, count]);

  return <points geometry={geometry} material={material} />;
}

function Globe({ scrollY, onScrollStateChange, updateFrequencyData, frequencyTextureRef, channelFreqTexturesRef, channelAssignmentRef, audioReactiveRef, analyserConnected }) {
  const globeRef = useRef();
  const sphereRef = useRef();
  const radius = 2;
  const [countriesData, setCountriesData] = useState({});
  const [currentLocation, setCurrentLocation] = useState(locations[0]);
  const [isLoading, setIsLoading] = useState(true);
  const countryBlendsRef = useRef({});       // countryName -> blend float (0-1)
  const countryFreqMapRef = useRef({});      // countryName -> DataTexture (per-channel)
  // Distance-based scroll breakpoints (computed once)
  const breakpoints = useMemo(() => computeSegmentBreakpoints(locations, BASE_SCROLL_PX), []);
  const targetRotation = useRef({ x: 0, y: 0 });
  const targetZoom = useRef(5);
  const mousePosition = useRef(new THREE.Vector3(0, 0, 0));
  const prevMousePosition = useRef(new THREE.Vector3(0, 0, 0));
  const mouseVelocityDir = useRef(new THREE.Vector3(0, 0, 0));
  const mouseSpeed = useRef(0);
  const attractStrength = useRef(0);
  const smoothProximity = useRef(1.0);
  const entryProgress = useRef(-1.0);
  const entryPending = useRef(false);
  const cameraOffset = useRef({ x: 0, y: 0 });
  const targetCameraOffset = useRef({ x: 0, y: 0 });
  const scrollProgressRef = useRef(0);
  const countriesDataRef = useRef({});
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());
  const activeCenter = useRef(new THREE.Vector3());
  const inverseMatrix = useRef(new THREE.Matrix4());

  // Initialize globe rotation on mount
  useEffect(() => {
    if (globeRef.current) {
      const defaultRotation = getGlobeRotation(20, 0);
      globeRef.current.rotation.x = defaultRotation.x;
      globeRef.current.rotation.y = defaultRotation.y;
      targetRotation.current = defaultRotation;
    }
  }, []);

  // Mouse tracking for attract effect
  useEffect(() => {
    const handleMouseMove = (event) => {
      // Convert mouse position to normalized device coordinates (-1 to +1)
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Load GeoJSON data
  useEffect(() => {
    setIsLoading(true);
    fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
      .then(response => response.json())
      .then(data => {
        const countries = parseGeoJSON(data, 3);
        setCountriesData(countries);
        countriesDataRef.current = countries;

        entryPending.current = true; // signal CountryPoints to trigger animation
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading GeoJSON:', error);
      });
  }, [setIsLoading]);

  // Compute adaptive zoom for a given location
  const computeZoom = useCallback((location) => {
    if (!location.country) return location.distance;
    let zoom = 3.0;
    const points = countriesDataRef.current[location.country];
    if (points && points.length > 0) {
      const cLat = location.lat * Math.PI / 180;
      const cLon = location.lon * Math.PI / 180;
      const maxArc = 30 * Math.PI / 180;
      let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
      let count = 0;
      points.forEach(p => {
        const lat = p.lat * Math.PI / 180;
        const lon = p.lon * Math.PI / 180;
        const d = Math.acos(Math.min(1, Math.sin(cLat) * Math.sin(lat) +
          Math.cos(cLat) * Math.cos(lat) * Math.cos(lon - cLon)));
        if (d < maxArc) {
          minLat = Math.min(minLat, p.lat);
          maxLat = Math.max(maxLat, p.lat);
          minLon = Math.min(minLon, p.lon);
          maxLon = Math.max(maxLon, p.lon);
          count++;
        }
      });
      if (count > 0) {
        const avgLat = (minLat + maxLat) / 2;
        const lonCorrected = (maxLon - minLon) * Math.cos(avgLat * Math.PI / 180);
        const maxSpan = Math.max(maxLat - minLat, lonCorrected);
        zoom = Math.min(Math.max(2.5 + maxSpan * 0.035, 2.5), 4.0);
      }
    }
    return zoom;
  }, []);

  // Continuous scroll: interpolate between adjacent locations
  useEffect(() => {
    const scrollState = computeScrollState(scrollY, breakpoints);
    const { prevIndex, nextIndex, rotationBlend } = scrollState;

    const prevLoc = locations[prevIndex];
    const nextLoc = locations[nextIndex];

    // Dominant location (higher volume) for zoom computation
    const dominantLoc = rotationBlend <= 0.5 ? prevLoc : nextLoc;
    setCurrentLocation(dominantLoc);

    // Notify parent with scroll state for audio crossfade
    onScrollStateChange(scrollState);

    // Compute per-country active blend values
    const blends = {};
    if (prevLoc.country) blends[prevLoc.country] = (blends[prevLoc.country] || 0) + (1 - rotationBlend);
    if (nextLoc.country) blends[nextLoc.country] = (blends[nextLoc.country] || 0) + rotationBlend;
    // Clamp to [0, 1] (same country on both sides → 1)
    Object.keys(blends).forEach(k => { blends[k] = Math.min(blends[k], 1); });
    countryBlendsRef.current = blends;

    // Map country names to per-channel frequency textures
    const freqMap = {};
    const assign = channelAssignmentRef.current;
    const textures = channelFreqTexturesRef.current;
    if (prevLoc.country) {
      const code = getCountryCode(prevLoc.country);
      if (assign.A === code && textures.A) freqMap[prevLoc.country] = textures.A;
      else if (assign.B === code && textures.B) freqMap[prevLoc.country] = textures.B;
    }
    if (nextLoc.country && nextLoc.country !== prevLoc.country) {
      const code = getCountryCode(nextLoc.country);
      if (assign.A === code && textures.A) freqMap[nextLoc.country] = textures.A;
      else if (assign.B === code && textures.B) freqMap[nextLoc.country] = textures.B;
    }
    countryFreqMapRef.current = freqMap;

    // Interpolate active center for audio ripple propagation (uses rotation plateau)
    if (prevLoc.country && nextLoc.country) {
      const vPrev = latLonToVector3(prevLoc.lat, prevLoc.lon, 1);
      const vNext = latLonToVector3(nextLoc.lat, nextLoc.lon, 1);
      activeCenter.current.lerpVectors(vPrev, vNext, rotationBlend);
      activeCenter.current.normalize();
    } else if (dominantLoc.country) {
      const v = latLonToVector3(dominantLoc.lat, dominantLoc.lon, 1);
      activeCenter.current.copy(v);
    } else {
      activeCenter.current.set(0, 0, 0);
    }

    // Interpolate lat/lon using rotation plateau (stays on country, then transitions)
    let lonDiff = nextLoc.lon - prevLoc.lon;
    if (lonDiff > 180) lonDiff -= 360;
    if (lonDiff < -180) lonDiff += 360;
    const interpLat = prevLoc.lat + (nextLoc.lat - prevLoc.lat) * rotationBlend;
    const interpLon = prevLoc.lon + lonDiff * rotationBlend;

    scrollProgressRef.current = scrollState.scrollProgress;

    // Always set interpolated rotation target
    targetRotation.current = getGlobeRotation(interpLat, interpLon);

    // Interpolate zoom and camera offset between Start and first country
    const startZoom = prevLoc.distance;
    const countryZoom = computeZoom(dominantLoc.country ? dominantLoc : nextLoc);
    const startOffset = { x: 0, y: 0 };
    const zr = Math.sqrt(countryZoom / 4);
    const countryOffset = { x: -1.5 * zr, y: 0.7 * zr };

    if (prevIndex === 0 && prevLoc.name === 'Start') {
      // Transitioning from Start: use rotationBlend so zoom/offset/rotation move together
      targetZoom.current = startZoom + (countryZoom - startZoom) * rotationBlend;
      targetCameraOffset.current = {
        x: startOffset.x + (countryOffset.x - startOffset.x) * rotationBlend,
        y: startOffset.y + (countryOffset.y - startOffset.y) * rotationBlend
      };
    } else if (dominantLoc.name === 'Start') {
      targetZoom.current = startZoom;
      targetCameraOffset.current = startOffset;
    } else {
      targetZoom.current = countryZoom;
      targetCameraOffset.current = countryOffset;
    }
  }, [scrollY, breakpoints, onScrollStateChange, computeZoom, channelAssignmentRef, channelFreqTexturesRef]);

  // Globe rotation and camera animation
  useFrame((state, delta) => {
    // Update audio frequency texture each frame
    if (updateFrequencyData) updateFrequencyData();
    // Smooth audio reactive transition
    if (audioReactiveRef) {
      const target = analyserConnected?.current ? 1.0 : 0.0;
      audioReactiveRef.current += (target - audioReactiveRef.current) * Math.min(delta * 3, 1);
    }

    // Entry animation: advance progress by delta (started by CountryPoints on first render)
    if (entryProgress.current >= 0) {
      entryProgress.current += delta;
    }

    // Smooth camera offset and zoom first (needed for rotation adjustment)
    const lerpFactor = Math.min(delta * 3, 1);
    cameraOffset.current.x += (targetCameraOffset.current.x - cameraOffset.current.x) * lerpFactor;
    cameraOffset.current.y += (targetCameraOffset.current.y - cameraOffset.current.y) * lerpFactor;
    const currentZoom = state.camera.position.z;
    const newZoom = currentZoom + (targetZoom.current - currentZoom) * lerpFactor;

    // 1. Apply globe rotation, adjusted so the country faces the actual camera position
    if (globeRef.current) {
      if (scrollProgressRef.current === 0) {
        // Fully at Start: auto-rotate
        const autoRotQ = new THREE.Quaternion().setFromAxisAngle(
          new THREE.Vector3(0, 1, 0), delta * 0.1
        );
        globeRef.current.quaternion.multiply(autoRotQ);
      } else {
        // Compute visible zone center and target rotation via quaternion
        const tanHalfFov = Math.tan(30 * Math.PI / 180);
        const aspect = state.viewport.aspect;
        const ox = cameraOffset.current.x, oy = cameraOffset.current.y;

        // Globe center in NDC
        const gNdcX = -ox / (newZoom * tanHalfFov * aspect);
        const gNdcY = -oy / (newZoom * tanHalfFov);
        const gRadX = radius / (newZoom * tanHalfFov * aspect);
        const gRadY = radius / (newZoom * tanHalfFov);

        // Visible zone center (clamped to viewport)
        const vcX = (Math.max(-1, gNdcX - gRadX) + Math.min(1, gNdcX + gRadX)) / 2;
        const vcY = (Math.max(-1, gNdcY - gRadY) + Math.min(1, gNdcY + gRadY)) / 2;

        // Ray from camera through visible zone center
        const rdx = vcX * tanHalfFov * aspect;
        const rdy = vcY * tanHalfFov;
        const rdz = -1;
        const rLen = Math.sqrt(rdx * rdx + rdy * rdy + 1);
        const ndx = rdx / rLen, ndy = rdy / rLen, ndz = rdz / rLen;

        // Ray-sphere intersection (sphere at origin, radius)
        const b = 2 * (ox * ndx + oy * ndy + newZoom * ndz);
        const c = ox * ox + oy * oy + newZoom * newZoom - radius * radius;
        const disc = b * b - 4 * c;

        if (disc >= 0) {
          const t = (-b - Math.sqrt(disc)) / 2;
          const hx = ox + t * ndx, hy = oy + t * ndy, hz = newZoom + t * ndz;
          const hLen = Math.sqrt(hx * hx + hy * hy + hz * hz);

          // Convert hit point to lat/lon (inverse of latLonToVector3)
          const tLat = Math.asin(Math.max(-1, Math.min(1, hy / hLen))) * 180 / Math.PI;
          const tLon = Math.atan2(hz / hLen, -hx / hLen) * 180 / Math.PI - 180;

          // Quaternion: rotation that brings country to +z (uses interpolated target)
          const Rc = targetRotation.current;
          const Qc = new THREE.Quaternion().setFromEuler(new THREE.Euler(Rc.x, Rc.y, 0, 'XYZ'));

          // Quaternion: rotation that brings target point to +z
          const Rt = getGlobeRotation(tLat, tLon);
          const Qt = new THREE.Quaternion().setFromEuler(new THREE.Euler(Rt.x, Rt.y, 0, 'XYZ'));

          // Final = inverse(Qt) * Qc → brings country to where target point was
          const Qf = Qt.clone().conjugate().multiply(Qc);

          // Quaternion slerp for shortest-path rotation
          globeRef.current.quaternion.slerp(Qf, Math.min(delta * 3, 1));
        }
      }

      // Force matrix update after rotation so raycasting uses current transform
      globeRef.current.updateMatrixWorld(true);
    }

    // Apply camera position and lookAt
    state.camera.position.set(cameraOffset.current.x, cameraOffset.current.y, newZoom);
    state.camera.lookAt(cameraOffset.current.x, cameraOffset.current.y, 0);

    // 2. Refresh camera matrices so raycaster uses up-to-date transform
    state.camera.updateMatrixWorld(true);
    state.camera.updateProjectionMatrix();

    // 3. Raycast AFTER all matrix updates
    raycaster.current.setFromCamera(mouse.current, state.camera);

    if (globeRef.current) {
      // Try sphere intersection first for accurate on-globe positioning
      const intersects = sphereRef.current
        ? raycaster.current.intersectObject(sphereRef.current, false)
        : [];

      let localPoint = null;
      let targetProximity = 0.0;

      if (intersects.length > 0) {
        // Mouse is over the globe - use precise intersection
        inverseMatrix.current.copy(globeRef.current.matrixWorld).invert();
        localPoint = intersects[0].point.clone().applyMatrix4(inverseMatrix.current);
        targetProximity = 1.0;
      } else {
        // Mouse is off-globe - use ray closest point for floating particles
        const ray = raycaster.current.ray;
        const closestWorldPoint = new THREE.Vector3();
        ray.closestPointToPoint(new THREE.Vector3(0, 0, 0), closestWorldPoint);
        const distToCenter = closestWorldPoint.length();
        const interactionRadius = radius + 0.4;

        if (distToCenter < interactionRadius) {
          inverseMatrix.current.copy(globeRef.current.matrixWorld).invert();
          const localClosest = closestWorldPoint.applyMatrix4(inverseMatrix.current);
          localPoint = localClosest.normalize().multiplyScalar(radius + 0.01);
          targetProximity = Math.max(0, 1.0 - (distToCenter - radius) / (interactionRadius - radius));
        }
      }

      // Smooth proximity transitions between on-globe and off-globe
      smoothProximity.current += (targetProximity - smoothProximity.current) * Math.min(delta * 5, 1);

      // Reduce effect when focused on a country
      const focusFactor = currentLocation.name === 'Start' ? 1.0 : 0.3;

      if (localPoint) {
        const lerpSpeed = Math.min(delta * 12, 1);
        mousePosition.current.lerp(localPoint, lerpSpeed);

        const velocity = localPoint.distanceTo(prevMousePosition.current) / Math.max(delta, 0.001);

        const dir = localPoint.clone().sub(prevMousePosition.current);
        if (dir.length() > 0.0001) {
          mouseVelocityDir.current.copy(dir).normalize();
          mouseSpeed.current = velocity;
        }

        prevMousePosition.current.copy(localPoint);

        const targetStrength = Math.min(velocity * 0.8, 1.0) * smoothProximity.current * focusFactor;
        if (targetStrength > attractStrength.current) {
          attractStrength.current += (targetStrength - attractStrength.current) * Math.min(delta * 8, 1);
        } else {
          attractStrength.current += (targetStrength - attractStrength.current) * Math.min(delta * 0.5, 1);
        }
      } else {
        if (mouseSpeed.current > 0.01) {
          const momentum = mouseVelocityDir.current.clone().multiplyScalar(mouseSpeed.current * delta * 0.3);
          mousePosition.current.add(momentum);
          mousePosition.current.normalize().multiplyScalar(radius + 0.01);
          mouseSpeed.current *= Math.max(1 - delta * 3, 0);
        }

        attractStrength.current = Math.max(attractStrength.current - delta * 0.8, 0);
      }
    }
  });

  return (
    <group ref={globeRef}>
      {/* Invisible sphere for on-globe raycasting */}
      <mesh ref={sphereRef}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Country dots */}
      {Object.entries(countriesData).map(([countryName, points]) => {
        if (points.length === 0) return null;
        return (
          <CountryPoints
            key={countryName}
            countryName={countryName}
            points={points}
            radius={radius}
            mousePositionRef={mousePosition}
            attractStrengthRef={attractStrength}
            entryProgressRef={entryProgress}
            entryPendingRef={entryPending}
            frequencyTextureRef={frequencyTextureRef}
            audioReactiveRef={audioReactiveRef}
            activeCenterRef={activeCenter}
            countryBlendsRef={countryBlendsRef}
            countryFreqMapRef={countryFreqMapRef}
          />
        );
      })}

      {/* Ambient floating particles */}
      <FloatingParticles
        radius={radius}
        count={15000}
        mousePositionRef={mousePosition}
        attractStrengthRef={attractStrength}
        entryProgressRef={entryProgress}
        frequencyTextureRef={frequencyTextureRef}
        audioReactiveRef={audioReactiveRef}
        activeCenterRef={activeCenter}
      />
    </group>
  );
}

function Test() {
  const [scrollY, setScrollY] = useState(0);
  const [active, setActive] = useState({});
  const breakpoints = useMemo(() => computeSegmentBreakpoints(locations, BASE_SCROLL_PX), []);
  const totalScrollHeight = breakpoints[breakpoints.length - 1];

  const {
    isPlaying,
    currentTracks,
    togglePlayPause,
    updateScrollAudio,
    updateFrequencyData,
    frequencyTextureRef,
    channelFreqTexturesRef,
    channelAssignmentRef,
    audioReactiveRef,
    analyserConnected
  } = useMusic();

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update audio crossfade on scroll state change
  const handleScrollStateChange = useCallback((scrollState) => {
    const { prevIndex, nextIndex, blend } = scrollState;
    const dominantLoc = blend <= 0.5 ? locations[prevIndex] : locations[nextIndex];
    setActive(dominantLoc);
    updateScrollAudio(scrollState, locations);
  }, [updateScrollAudio]);

  // Show the louder track in the UI
  const displayTrack = active && currentTracks
    ? (currentTracks.prev || currentTracks.next)
    : null;

  return (
    <>
      {active && <div style={{ position: 'fixed', zIndex: 1, color: 'white' }}>
        <h1>{active.country}</h1>
        <p>{active.description}</p>
      </div>}
      <PlayPauseButton
        isConfigured={true}
        isPlaying={isPlaying}
        currentTrack={displayTrack}
        onToggle={togglePlayPause}
      />
      <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, background: '#000' }}>
        <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
          <color attach="background" args={['#092327']} />
          <Globe
            scrollY={scrollY}
            onScrollStateChange={handleScrollStateChange}
            updateFrequencyData={updateFrequencyData}
            frequencyTextureRef={frequencyTextureRef}
            channelFreqTexturesRef={channelFreqTexturesRef}
            channelAssignmentRef={channelAssignmentRef}
            audioReactiveRef={audioReactiveRef}
            analyserConnected={analyserConnected}
          />
        </Canvas>
      </div>
      {/* Spacer to enable scrolling */}
      <div style={{ height: (totalScrollHeight + window.innerHeight) + 'px', position: 'relative', pointerEvents: 'none' }} />
    </>
  );
}

export default Test;
