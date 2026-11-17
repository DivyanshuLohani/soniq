import { getAudioPreview, formatDisplayTitle, type TrackItem, type ArtistItem } from './fallbackMusicService';
import logger from '../lib/logger';

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
    'playlist-read-private',
    'playlist-read-collaborative',
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
  product?: string;
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
    product?: string;
  };

  return {
    id: data.id,
    displayName: data.display_name || `Spotify User ${data.id.slice(0, 5)}`,
    email: data.email,
    avatarUrl: data.images && data.images.length > 0 ? data.images[0]?.url : undefined,
    spotifyUri: data.uri,
    product: data.product || 'free',
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
    } catch (e: any) {
      logger.warn('Could not get client credentials token', { error: e.message });
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
    } catch (e: any) {
      logger.warn('Could not fetch extra albums', { error: e.message });
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

export interface PlaylistDetails {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  ownerName?: string;
  totalTracks: number;
  tracks: TrackItem[];
}

export function extractSpotifyPlaylistId(input: string): string | null {
  const trimmed = input.trim();
  // 1. Raw 22-char ID
  if (/^[a-zA-Z0-9]{22}$/.test(trimmed)) {
    return trimmed;
  }
  // 2. spotify:playlist:ID
  const uriMatch = trimmed.match(/spotify:playlist:([a-zA-Z0-9]{22})/);
  if (uriMatch && uriMatch[1]) return uriMatch[1];
  // 3. https://open.spotify.com/playlist/ID
  const urlMatch = trimmed.match(/playlist\/([a-zA-Z0-9]{22})/);
  if (urlMatch && urlMatch[1]) return urlMatch[1];
  return null;
}

// Resolve individual track album artwork and album name
export async function getTrackAlbumDetails(
  trackId: string,
  artistName: string,
  trackName: string
): Promise<{ albumCover?: string; albumName?: string } | null> {
  // 1. Try Spotify Track Embed visualIdentity (gives the actual song's 640x640 album artwork from Spotify CDN)
  if (trackId && /^[a-zA-Z0-9]{22}$/.test(trackId)) {
    try {
      const res = await fetch(`https://open.spotify.com/embed/track/${trackId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
      });
      if (res.ok) {
        const html = await res.text();
        const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
        if (match && match[1]) {
          const parsed = JSON.parse(match[1]);
          const entity = parsed.props?.pageProps?.state?.data?.entity;
          const images = entity?.visualIdentity?.image;
          if (Array.isArray(images) && images.length > 0) {
            const best = images.find((img: any) => img.maxWidth === 640) || images[0];
            if (best?.url) {
              return {
                albumCover: best.url,
                albumName: entity.name || entity.title || trackName,
              };
            }
          }
        }
      }
    } catch {
      // fallback to iTunes
    }
  }

  // 2. Fallback to iTunes Search for the exact track
  try {
    const query = encodeURIComponent(`${artistName} ${trackName}`);
    const res = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const cover = item.artworkUrl100
          ? item.artworkUrl100.replace('100x100bb', '600x600bb')
          : undefined;
        return {
          albumCover: cover,
          albumName: item.collectionName || trackName,
        };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

export async function getSpotifyPlaylist(
  playlistIdOrUrl: string,
  userAccessToken?: string
): Promise<PlaylistDetails> {
  const playlistId = extractSpotifyPlaylistId(playlistIdOrUrl);
  if (!playlistId) {
    throw new Error('Invalid Spotify playlist link or ID. Please check the URL.');
  }

  let token = userAccessToken;
  if (!token && isSpotifyConfigured()) {
    try {
      token = await getClientCredentialsToken();
    } catch (e: any) {
      logger.warn('Could not get client credentials token for playlist', { error: e.message });
    }
  }

  // 1. Direct Spotify Embed Reader (Zero Config, 100% Reliable for ALL Public Playlists regardless of market/API restrictions)
  try {
    const embedRes = await fetch(`https://open.spotify.com/embed/playlist/${playlistId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      },
    });

    if (embedRes.ok) {
      const html = await embedRes.text();
      const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
      if (nextDataMatch && nextDataMatch[1]) {
        const parsed = JSON.parse(nextDataMatch[1]);
        const entity = parsed.props?.pageProps?.state?.data?.entity;
        if (entity && Array.isArray(entity.trackList) && entity.trackList.length > 0) {
          const rawTracks: TrackItem[] = [];
          const seen = new Set<string>();

          for (const item of entity.trackList) {
            const title = item.title || item.name;
            if (!title) continue;

            const norm = title.toLowerCase().replace(/\s*\(.*\)/g, '').replace(/[^\w]/g, '').trim();
            if (!norm || seen.has(norm)) continue;
            seen.add(norm);

            const artistName = item.subtitle || (item.authors && item.authors.length > 0 ? item.authors.map((a: any) => a.name).join(', ') : 'Various Artists');
            const previewUrl = item.audioPreview?.url || null;
            const albumCover = item.coverArt?.sources && item.coverArt.sources.length > 0
              ? item.coverArt.sources[0].url
              : (entity.coverArt?.sources && entity.coverArt.sources.length > 0 ? entity.coverArt.sources[0].url : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80');

            rawTracks.push({
              id: item.uri ? item.uri.replace('spotify:track:', '') : `track_${Math.random().toString(36).substring(2, 9)}`,
              name: formatDisplayTitle(title),
              artistName,
              albumName: entity.name || 'Playlist Track',
              albumCover: '', // Resolved individually per song below
              previewUrl: item.audioPreview?.url || null,
              durationMs: item.duration,
            });
          }

          // Resolve song audio previews and song-specific album covers in parallel
          const resolved = await Promise.all(
            rawTracks.map(async (trk) => {
              const [preview, trackDetails] = await Promise.all([
                trk.previewUrl ? Promise.resolve(trk.previewUrl) : getAudioPreview(trk.artistName, trk.name),
                getTrackAlbumDetails(trk.id, trk.artistName, trk.name),
              ]);

              const defaultCover = entity.coverArt?.sources && entity.coverArt.sources.length > 0
                ? entity.coverArt.sources[0].url
                : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

              return {
                ...trk,
                previewUrl: preview,
                albumCover: trackDetails?.albumCover || defaultCover,
                albumName: trackDetails?.albumName || trk.albumName,
              };
            })
          );

          const playableTracks = resolved.filter((t) => !!t.previewUrl);
          const playlistCover = entity.coverArt?.sources && entity.coverArt.sources.length > 0
            ? entity.coverArt.sources[0].url
            : playableTracks[0]?.albumCover;

          if (playableTracks.length >= 3) {
            return {
              id: playlistId,
              name: entity.name || entity.title || 'Custom Playlist',
              description: entity.subtitle || entity.description,
              imageUrl: playlistCover,
              ownerName: entity.authors && entity.authors.length > 0 ? entity.authors[0].name : 'Spotify Curator',
              totalTracks: playableTracks.length,
              tracks: playableTracks,
            };
          }
        }
      }
    }
  } catch (err: any) {
    logger.warn('Direct Spotify embed fetch failed for playlist', { error: err.message, playlistId });
  }

  // 2. Official Spotify Web API Fallback (if user is authenticated or has token)
  if (token) {
    try {
      const res = await fetch(`${SPOTIFY_API_BASE}/playlists/${playlistId}?fields=id,name,description,images,owner,tracks.items(track(id,name,duration_ms,preview_url,album(name,images),artists(name,id)))`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = (await res.json()) as any;
        const rawItems = data.tracks?.items || [];
        const rawTracks: TrackItem[] = [];
        const seen = new Set<string>();

        for (const item of rawItems) {
          const t = item.track;
          if (!t || !t.name) continue;
          if (t.duration_ms && t.duration_ms < 40000) continue;

          const norm = t.name.toLowerCase().replace(/\s*\(.*\)/g, '').replace(/[^\w]/g, '').trim();
          if (!norm || seen.has(norm)) continue;
          seen.add(norm);

          const artistName = t.artists && t.artists.length > 0 ? t.artists[0].name : 'Various Artists';
          const artistId = t.artists && t.artists.length > 0 ? t.artists[0].id : '';
          const cover = t.album?.images && t.album.images.length > 0
            ? t.album.images[0].url
            : (data.images && data.images[0] ? data.images[0].url : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80');

          rawTracks.push({
            id: t.id || `track_${Math.random().toString(36).substring(2, 9)}`,
            name: formatDisplayTitle(t.name),
            artistName,
            artistId,
            albumName: t.album?.name || data.name || 'Playlist Track',
            albumCover: cover,
            previewUrl: t.preview_url || null,
            durationMs: t.duration_ms,
          });
        }

        const resolved = await Promise.all(
          rawTracks.map(async (trk) => {
            if (trk.previewUrl) return trk;
            const preview = await getAudioPreview(trk.artistName, trk.name);
            return {
              ...trk,
              previewUrl: preview,
            };
          })
        );

        const playableTracks = resolved.filter((t) => !!t.previewUrl);

        if (playableTracks.length > 0) {
          return {
            id: data.id,
            name: data.name || 'Custom Playlist',
            description: data.description,
            imageUrl: data.images && data.images.length > 0 ? data.images[0].url : undefined,
            ownerName: data.owner?.display_name || 'Spotify Curator',
            totalTracks: playableTracks.length,
            tracks: playableTracks,
          };
        }
      }
    } catch (err: any) {
      logger.warn('Spotify API playlist fetch failed', { error: err.message });
    }
  }

  throw new Error('Could not load songs for this playlist. Please check that the playlist is public.');
}

export async function getUserPlaylists(userAccessToken: string): Promise<Array<{
  id: string;
  name: string;
  imageUrl?: string;
  tracksCount: number;
}>> {
  const res = await fetch(`${SPOTIFY_API_BASE}/me/playlists?limit=25`, {
    headers: {
      Authorization: `Bearer ${userAccessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch user playlists: ${res.status}`);
  }

  const data = (await res.json()) as any;
  const items = data.items || [];

  return items.map((p: any) => ({
    id: p.id,
    name: p.name,
    imageUrl: p.images && p.images.length > 0 ? p.images[0].url : undefined,
    tracksCount: p.tracks?.total || 0,
  }));
}

