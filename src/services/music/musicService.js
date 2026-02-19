// iTunes Search API — free, no auth, returns 30s preview URLs (direct M4A).
// Search by artist name for each country's DnB scene.

const ITUNES_SEARCH = 'https://itunes.apple.com/search';

// Artists per country — searched individually then merged + shuffled
const countryArtists = {
  GB: ['Hedex', 'Andy C', 'Goldie', 'Sub Focus', 'Wilkinson', 'High Contrast'],
  BE: ['Netsky', 'Andromedik', 'Murdock', 'Eptic'],
  NL: ['Noisia', 'Black Sun Empire', 'Nymfo'],
  AT: ['Mefjus', 'Camo & Krooked', 'DisasZt'],
  CZ: ['A-Cray', 'Forbidden Society'],
  DE: ['Phace', 'Current Value'],
  NZ: ['The Upbeats', 'State of Mind'],
  AU: ['Pendulum', 'ShockOne'],
  US: ['Dieselboy', 'Justin Hawkes'],
  CA: ['Bensley', 'Marcus Visionary', 'Gremlinz', 'Stranjah'],
  BR: ['DJ Marky', 'DJ Patife', 'Alibi'],
  ZA: ['Counterstrike'],
  JP: ['Makoto'],
  CO: ['Sigma']
};

function normalizeTrack(item) {
  return {
    id: String(item.trackId),
    name: item.trackName,
    artist: item.artistName,
    album: item.collectionName,
    preview_url: item.previewUrl || null,
    artwork: item.artworkUrl100 || null
  };
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function searchArtist(artist, countryCode, limit) {
  const params = new URLSearchParams({
    term: artist,
    media: 'music',
    country: countryCode,
    limit: String(limit)
  });

  const response = await fetch(`${ITUNES_SEARCH}?${params}`);
  if (!response.ok) return [];

  const data = await response.json();
  return (data.results || []).map(normalizeTrack).filter(t => t.preview_url);
}

export async function searchDnBTracks(countryCode, limit = 6) {
  const artists = countryArtists[countryCode] || ['drum and bass'];

  // Fetch all artists in parallel, `limit` tracks per artist
  const results = await Promise.all(
    artists.map(artist => searchArtist(artist, countryCode, limit))
  );

  // Merge, deduplicate by track id, and shuffle
  const seen = new Set();
  const merged = [];
  for (const tracks of results) {
    for (const track of tracks) {
      if (!seen.has(track.id)) {
        seen.add(track.id);
        merged.push(track);
      }
    }
  }

  return shuffle(merged);
}
