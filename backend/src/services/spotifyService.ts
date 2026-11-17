import { getAudioPreview, formatDisplayTitle, type TrackItem, type ArtistItem } from './fallbackMusicService';

const SPOTIFY_AUTH_ENDPOINT = 'https://accounts.spotify.com/authorize';
const SPOTIFY_TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

let cachedClientToken: { token: string; expiresAt: number } | null = null;

export function isSpotifyConfigured(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

export function getSpotifyAuthUrl(state: string): string {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/api/auth/spotify/callback';
  const scopes = [
    'user-read-private',
    'user-read-email',
    'streaming',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing'
  ].join(' ');

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    scope: scopes,
    state: state,
    show_dialog: 'true',
  });

  return `${SPOTIFY_AUTH_ENDPOINT}?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3001/api/auth/spotify/callback';

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Spotify token exchange failed: ${res.status} - ${errorBody}`);
  }

  const data = (await res.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

export async function refreshSpotifyAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error('Failed to refresh Spotify token');
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
  };
}

export async function getClientCredentialsToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID || '';
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    throw new Error('Spotify client credentials not configured');
  }

  const now = Date.now();
  if (cachedClientToken && cachedClientToken.expiresAt > now + 60000) {
    return cachedClientToken.token;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch(SPOTIFY_TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Client credentials error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedClientToken = {
    token: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return data.access_token;
}

export async function getSpotifyUserProfile(accessToken: string): Promise<{
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  spotifyUri?: string;
}> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user profile: ${res.status}`);
  }

  const data = (await res.json()) as {
    id: string;
    display_name?: string;
    email?: string;
    images?: Array<{ url: string }>;
    uri?: string;
  };

  return {
    id: data.id,
    displayName: data.display_name || `Spotify User ${data.id.slice(0, 5)}`,
    email: data.email,
    avatarUrl: data.images && data.images.length > 0 ? data.images[0]?.url : undefined,
    spotifyUri: data.uri,
  };
}

export async function searchSpotifyArtists(
  query: string,
  userAccessToken?: string
): Promise<ArtistItem[]> {
  let token = userAccessToken;
  if (!token && isSpotifyConfigured()) {
    try {
      token = await getClientCredentialsToken();
    } catch (e) {
      console.warn('Could not get client credentials token:', e);
    }
  }

  if (!token) {
    return [];
  }

  const encoded = encodeURIComponent(query);
  const res = await fetch(`${SPOTIFY_API_BASE}/search?type=artist&q=${encoded}&limit=8`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Spotify search failed with status ${res.status}`);
  }

  const data = (await res.json()) as {
    artists?: {
      items: Array<{
        id: string;
        name: string;
        images?: Array<{ url: string }>;
        genres?: string[];
        popularity?: number;
        followers?: { total: number };
      }>;
    };
  };

  if (!data.artists?.items) return [];

  return data.artists.items.map((item) => ({
    id: item.id,
    name: item.name,
    imageUrl:
      item.images && item.images.length > 0
        ? item.images[0]?.url || ''
        : 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
    genres: item.genres || [],
    popularity: item.popularity,
    followers: item.followers?.total,
  }));
}

export async function getArtistTracksSpotify(
  artistId: string,
  artistName: string,
  userAccessToken?: string
): Promise<TrackItem[]> {
  let token = userAccessToken;
  if (!token && isSpotifyConfigured()) {
    try {
      token = await getClientCredentialsToken();
    } catch {
      // ignore
    }
  }

  if (!token) return [];

  // 1. Get Top Tracks
  const topTracksRes = await fetch(`${SPOTIFY_API_BASE}/artists/${artistId}/top-tracks?market=US`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  let rawTracks: any[] = [];
  if (topTracksRes.ok) {
    const data = (await topTracksRes.json()) as { tracks: any[] };
    rawTracks = data.tracks || [];
  }

  // 2. If fewer than 15 tracks, get album tracks to expand the pool
  if (rawTracks.length < 15) {
    try {
      const albumsRes = await fetch(
        `${SPOTIFY_API_BASE}/artists/${artistId}/albums?include_groups=album,single&limit=5&market=US`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (albumsRes.ok) {
        const albumData = (await albumsRes.json()) as { items: any[] };
        for (const album of albumData.items || []) {
          const albumTracksRes = await fetch(
            `${SPOTIFY_API_BASE}/albums/${album.id}/tracks?limit=10&market=US`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (albumTracksRes.ok) {
            const tracksData = (await albumTracksRes.json()) as { items: any[] };
            for (const t of tracksData.items || []) {
              rawTracks.push({
                ...t,
                album: {
                  name: album.name,
                  images: album.images,
                },
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn('Could not fetch extra albums:', e);
    }
  }

  // Deduplicate tracks by normalized name and remove skits/intros
  const seen = new Set<string>();
  const validTracks: TrackItem[] = [];

  for (const t of rawTracks) {
    if (!t.name) continue;
    if (t.duration_ms && t.duration_ms < 45000) continue; // skip skits under 45s
    if (/^(intro|outro|interlude|skit|commentary)\b/i.test(t.name)) continue;

    const norm = (t.name || '').toLowerCase().replace(/\s*\(.*\)/g, '').replace(/[^\w]/g, '').trim();
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);

    const cover =
      t.album?.images && t.album.images.length > 0
        ? t.album.images[0].url
        : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

    validTracks.push({
      id: t.id,
      name: formatDisplayTitle(t.name),
      artistName: artistName,
      artistId: artistId,
      albumName: t.album?.name || 'Single / Album',
      albumCover: cover,
      previewUrl: t.preview_url || null,
      spotifyUri: t.uri,
      durationMs: t.duration_ms,
    });
  }

  // 3. For any track without preview_url, resolve exact verified audio preview in parallel
  const resolved = await Promise.all(
    validTracks.map(async (trk) => {
      if (trk.previewUrl) return trk;
      const preview = await getAudioPreview(artistName, trk.name);
      return {
        ...trk,
        previewUrl: preview,
      };
    })
  );

  // Return only tracks with confirmed previewUrl
  return resolved.filter((t) => !!t.previewUrl);
}
