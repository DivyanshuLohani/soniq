import { Router } from 'express';
import {
  isSpotifyConfigured,
  searchSpotifyArtists,
} from '../services/spotifyService';
import {
  FEATURED_ARTISTS,
  searchArtistsFallback,
} from '../services/fallbackMusicService';
import { optionalAuth } from '../middleware/auth';
import prisma from '../lib/prisma';

const router = Router();

// Get featured popular artists for instant game start
router.get('/featured', (_req, res) => {
  res.json({ artists: FEATURED_ARTISTS });
});

// Search artists
router.get('/search', optionalAuth, async (req, res) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ artists: FEATURED_ARTISTS });
  }

  try {
    let userAccessToken: string | undefined;

    // Check if user has Spotify access token
    if (req.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { accessToken: true, tokenExpiry: true },
      });
      if (dbUser?.accessToken) {
        userAccessToken = dbUser.accessToken;
      }
    }

    let artists: any[] = [];

    // Attempt Spotify Search if credentials or user token exist
    if (isSpotifyConfigured() || userAccessToken) {
      try {
        artists = await searchSpotifyArtists(query, userAccessToken);
      } catch (err) {
        console.warn('Spotify search failed, falling back to iTunes:', err);
      }
    }

    // Fallback if no artists found or Spotify not configured
    if (!artists || artists.length === 0) {
      artists = await searchArtistsFallback(query);
    }

    res.json({ artists });
  } catch (err: any) {
    console.error('Artist search error:', err);
    res.status(500).json({ error: 'Failed to search artists', details: err.message });
  }
});

export default router;
