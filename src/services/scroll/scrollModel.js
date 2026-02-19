/**
 * Computes continuous scroll state for globe navigation.
 * Returns interpolation values between adjacent locations.
 * Supports distance-based segment lengths for natural travel pacing.
 */

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Great-circle angular distance in radians (haversine)
function haversineAngle(lat1, lon1, lat2, lon2) {
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Compute cumulative scroll breakpoints based on geographic distance.
 * Returns an array of pixel positions: [0, d0, d0+d1, ...].
 * Uses sqrt scaling to compress extreme ranges.
 */
export function computeSegmentBreakpoints(locations, baseScrollPx) {
  // Compute raw distances
  const distances = [];
  for (let i = 1; i < locations.length; i++) {
    const prev = locations[i - 1];
    const curr = locations[i];
    distances.push(haversineAngle(prev.lat, prev.lon, curr.lat, curr.lon));
  }

  // Average distance for normalization
  const avgDist = distances.reduce((s, d) => s + d, 0) / distances.length;

  // Build cumulative breakpoints with sqrt scaling and min/max clamps
  const breakpoints = [0];
  for (let i = 0; i < distances.length; i++) {
    const ratio = avgDist > 0 ? distances[i] / avgDist : 1;
    const scaled = baseScrollPx * Math.sqrt(ratio);
    const clamped = Math.max(baseScrollPx * 0.4, Math.min(baseScrollPx * 2.0, scaled));
    breakpoints.push(breakpoints[i] + clamped);
  }

  return breakpoints;
}

/**
 * Compute scroll state from pixel position and segment breakpoints.
 * breakpoints: cumulative pixel positions from computeSegmentBreakpoints.
 */
export function computeScrollState(scrollY, breakpoints) {
  const locationCount = breakpoints.length;
  const maxScroll = breakpoints[locationCount - 1];
  const clampedScrollY = Math.min(Math.max(scrollY, 0), maxScroll);

  // Find which segment we're in
  let prevIndex = 0;
  for (let i = 1; i < locationCount; i++) {
    if (clampedScrollY >= breakpoints[i]) {
      prevIndex = i;
    } else {
      break;
    }
  }

  const nextIndex = Math.min(prevIndex + 1, locationCount - 1);
  const segmentStart = breakpoints[prevIndex];
  const segmentEnd = breakpoints[nextIndex];
  const segmentLength = segmentEnd - segmentStart;

  const blend = segmentLength > 0 ? (clampedScrollY - segmentStart) / segmentLength : 0;
  const scrollProgress = prevIndex + blend;

  // Plateau volume: full volume in the middle 40%, crossfade in outer 30% each side
  const volumeNext = smoothstep(0.3, 0.7, blend);
  const volumePrev = 1 - volumeNext;

  // Rotation follows the same plateau
  const rotationBlend = smoothstep(0.3, 0.7, blend);

  return {
    scrollProgress,
    prevIndex,
    nextIndex,
    blend,
    rotationBlend,
    volumePrev,
    volumeNext
  };
}
