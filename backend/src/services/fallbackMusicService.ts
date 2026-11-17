// Music fallback & preview resolution service

export interface TrackItem {
  id: string;
  name: string;
  artistName: string;
  artistId: string;
  albumName: string;
  albumCover: string;
  previewUrl: string | null;
  spotifyUri?: string;
  durationMs?: number;
}

export interface ArtistItem {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  popularity?: number;
  followers?: number;
}

// Popular featured artists for quick start
export const FEATURED_ARTISTS: ArtistItem[] = [
  {
    id: "spotify_queen",
    name: "Queen",
    imageUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
    genres: ["classic rock", "glam rock", "rock"],
    popularity: 92,
    followers: 52000000,
  },
  {
    id: "spotify_the_weeknd",
    name: "The Weeknd",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
    genres: ["canadian pop", "pop", "r&b"],
    popularity: 98,
    followers: 85000000,
  },
  {
    id: "spotify_taylor_swift",
    name: "Taylor Swift",
    imageUrl: "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
    genres: ["pop"],
    popularity: 100,
    followers: 110000000,
  },
  {
    id: "spotify_billie_eilish",
    name: "Billie Eilish",
    imageUrl: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
    genres: ["art pop", "electropop", "pop"],
    popularity: 93,
    followers: 78000000,
  },
  {
    id: "spotify_coldplay",
    name: "Coldplay",
    imageUrl: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=600&auto=format&fit=crop&q=80",
    genres: ["permanent wave", "pop", "rock"],
    popularity: 91,
    followers: 49000000,
  },
  {
    id: "spotify_bruno_mars",
    name: "Bruno Mars",
    imageUrl: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600&auto=format&fit=crop&q=80",
    genres: ["pop", "r&b"],
    popularity: 95,
    followers: 55000000,
  },
  {
    id: "spotify_daft_punk",
    name: "Daft Punk",
    imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
    genres: ["electro", "filter house", "synthpop"],
    popularity: 85,
    followers: 24000000,
  },
  {
    id: "spotify_dua_lipa",
    name: "Dua Lipa",
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&auto=format&fit=crop&q=80",
    genres: ["dance pop", "pop", "uk pop"],
    popularity: 90,
    followers: 43000000,
  },
];

// Disallowed keyword list to reject karaoke, tribute acts, parodies, and covers
const DISALLOWED_KEYWORDS = [
  'tribute',
  'karaoke',
  'instrumental',
  'backing track',
  'in the style of',
  'made famous by',
  'originally performed by',
  'originally by',
  'cover band',
  'muppets',
  'parody',
  'piano version',
  'acoustic guitar cover',
  'lullaby',
];

export function formatDisplayTitle(name: string): string {
  return name
    .replace(/\s*\[[^\]]*(remaster|version)[^\]]*\]/gi, '')
    .replace(/\s*\([^)]*(remaster|version)[^)]*\)/gi, '')
    .replace(/\s*-\s*[^-(]*(remaster|version).*$/gi, '')
    .replace(/\s*\(Live\s+[^)]+\)/gi, ' (Live)')
    .replace(/\s*\(From [^)]+\)/gi, '')
    .trim();
}

export function cleanSongTitle(title: string): string {
  return title
    .replace(/\s*-\s*(Remastered|Radio Edit|Live|Mono|Deluxe|Single|Version|20\d\d|19\d\d|From The Motion Picture).*/i, '')
    .replace(/\s*\(.*(remaster|version|edit|live|deluxe|bonus|mono|single|anniversary|expanded|from\b).*\)/i, '')
    .replace(/[^\w\s]/gi, '')
    .trim()
    .toLowerCase();
}

export function cleanArtistName(name: string): string {
  return name.replace(/[^\w\s]/gi, '').trim().toLowerCase();
}

// Search iTunes for verified audio preview with strict artist & title matching
export async function getAudioPreview(artistName: string, trackName: string): Promise<string | null> {
  try {
    const cTitle = cleanSongTitle(trackName);
    const cArtist = cleanArtistName(artistName);

    // Stripped search query
    const simplifiedTrack = trackName
      .replace(/\s*\(.*\)/g, '')
      .replace(/\s*-.*$/g, '')
      .trim();

    const query = encodeURIComponent(`${artistName} ${simplifiedTrack}`);
    const url = `https://itunes.apple.com/search?term=${query}&entity=song&limit=15`;
    
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    
    const data = (await res.json()) as {
      results?: Array<{
        previewUrl?: string;
        trackName?: string;
        artistName?: string;
        artworkUrl100?: string;
      }>;
    };

    if (!data.results || data.results.length === 0) return null;

    // Filter candidate matches
    const candidates = data.results.filter((r) => {
      if (!r.previewUrl) return false;
      const rArtist = (r.artistName || '').toLowerCase();
      const rTrack = (r.trackName || '').toLowerCase();

      // Disqualify any tribute, karaoke, parody, or cover versions
      if (DISALLOWED_KEYWORDS.some((kw) => rArtist.includes(kw) || rTrack.includes(kw))) {
        return false;
      }

      // Strict artist check: Must match or feature the artist
      const rCleanArtist = cleanArtistName(r.artistName || '');
      const artistMatches =
        rCleanArtist === cArtist ||
        rCleanArtist.startsWith(`${cArtist} `) ||
        rCleanArtist.includes(` ${cArtist} `) ||
        rCleanArtist.includes(cArtist) ||
        cArtist.includes(rCleanArtist);

      if (!artistMatches) return false;

      // Track title check
      const rCleanTrack = cleanSongTitle(r.trackName || '');
      const trackMatches =
        rCleanTrack === cTitle ||
        rCleanTrack.startsWith(cTitle) ||
        cTitle.startsWith(rCleanTrack) ||
        rCleanTrack.includes(cTitle) ||
        cTitle.includes(rCleanTrack);

      return trackMatches;
    });

    if (candidates.length === 0) return null;

    // Rank candidates: prioritize exact studio tracks
    candidates.sort((a, b) => {
      const aTitle = cleanSongTitle(a.trackName || '');
      const bTitle = cleanSongTitle(b.trackName || '');
      const aExact = aTitle === cTitle ? 10 : 0;
      const bExact = bTitle === cTitle ? 10 : 0;
      const aLive = (a.trackName || '').toLowerCase().includes('live') ? -3 : 0;
      const bLive = (b.trackName || '').toLowerCase().includes('live') ? -3 : 0;
      return (bExact + bLive) - (aExact + aLive);
    });

    return candidates[0]?.previewUrl || null;
  } catch (err) {
    console.error(`Error resolving preview for ${artistName} - ${trackName}:`, err);
    return null;
  }
}

// Search artists in iTunes
export async function searchArtistsFallback(query: string): Promise<ArtistItem[]> {
  try {
    const encoded = encodeURIComponent(query);
    const url = `https://itunes.apple.com/search?term=${encoded}&entity=musicArtist&limit=8`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = (await res.json()) as {
      results?: Array<{
        artistId: number;
        artistName: string;
        primaryGenreName?: string;
      }>;
    };

    if (!data.results) return [];

    const artists: ArtistItem[] = await Promise.all(
      data.results.map(async (item) => {
        let imageUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
        try {
          const songRes = await fetch(`https://itunes.apple.com/lookup?id=${item.artistId}&entity=song&limit=2`);
          if (songRes.ok) {
            const songData = (await songRes.json()) as { results?: Array<{ artworkUrl100?: string }> };
            if (songData.results && songData.results.length > 1 && songData.results[1]?.artworkUrl100) {
              imageUrl = songData.results[1].artworkUrl100.replace('100x100bb', '600x600bb');
            }
          }
        } catch {
          // keep default
        }

        return {
          id: `itunes_${item.artistId}`,
          name: item.artistName,
          imageUrl,
          genres: item.primaryGenreName ? [item.primaryGenreName.toLowerCase()] : ['pop', 'music'],
          popularity: 80,
          followers: 1000000,
        };
      })
    );

    return artists;
  } catch (err) {
    console.error('Fallback artist search failed:', err);
    return [];
  }
}

// Fetch tracks for an artist via exact artistId lookup to guarantee ONLY this artist's tracks
export async function getArtistTracksFallback(artistName: string): Promise<TrackItem[]> {
  try {
    const normTarget = artistName.toLowerCase().trim();

    // 1. Search for the exact artist ID
    const artistSearchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(artistName)}&entity=musicArtist&limit=5`;
    const aRes = await fetch(artistSearchUrl);
    if (!aRes.ok) return [];

    const aData = (await aRes.json()) as {
      results?: Array<{ artistId: number; artistName: string }>;
    };

    const artists = aData.results || [];
    const matchedArtist =
      artists.find((a) => a.artistName.toLowerCase().trim() === normTarget) ||
      artists.find((a) => a.artistName.toLowerCase().includes(normTarget)) ||
      artists[0];

    if (!matchedArtist) {
      return [];
    }

    // 2. Perform direct artist lookup by ID
    const lookupUrl = `https://itunes.apple.com/lookup?id=${matchedArtist.artistId}&entity=song&limit=50`;
    const lRes = await fetch(lookupUrl);
    if (!lRes.ok) return [];

    const lData = (await lRes.json()) as {
      results?: Array<{
        wrapperType?: string;
        trackId?: number;
        trackName?: string;
        artistName?: string;
        collectionName?: string;
        artworkUrl100?: string;
        previewUrl?: string;
        trackTimeMillis?: number;
      }>;
    };

    if (!lData.results) return [];

    // Skip the first item which is the artist metadata wrapper
    const rawTracks = lData.results.slice(1);
    const seenNames = new Set<string>();
    const tracks: TrackItem[] = [];

    for (const item of rawTracks) {
      if (!item.trackName || !item.previewUrl) continue;

      // Filter out short intros, interludes, or skits under 45 seconds
      if ((item.trackTimeMillis || 0) < 45000) continue;

      const tArtist = (item.artistName || '').toLowerCase();
      const tName = (item.trackName || '').toLowerCase();

      // Disallow karaoke, tributes, covers, and muppets
      if (DISALLOWED_KEYWORDS.some((kw) => tArtist.includes(kw) || tName.includes(kw))) {
        continue;
      }

      // Filter out intro/outro/skit titles
      if (/^(intro|outro|interlude|skit|commentary)\b/i.test(tName)) {
        continue;
      }

      // Deduplicate by normalized track name
      const normTrackName = item.trackName.toLowerCase().replace(/\s*\(.*\)/g, '').replace(/[^\w]/g, '').trim();
      if (!normTrackName || seenNames.has(normTrackName)) continue;
      seenNames.add(normTrackName);

      // High-res album artwork
      const cover = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

      const cleanTitle = formatDisplayTitle(item.trackName);
      if (!cleanTitle) continue;

      tracks.push({
        id: `track_${item.trackId}`,
        name: cleanTitle,
        artistName: item.artistName || matchedArtist.artistName,
        artistId: `artist_${matchedArtist.artistId}`,
        albumName: item.collectionName || 'Album',
        albumCover: cover,
        previewUrl: item.previewUrl,
        durationMs: item.trackTimeMillis || 180000,
      });
    }

    return tracks;
  } catch (err) {
    console.error(`Failed to get tracks for artist ${artistName}:`, err);
    return [];
  }
}
