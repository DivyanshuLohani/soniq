import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAdmin, optionalAuth } from '../middleware/auth';
import { AnalyticsCacheService } from '../services/analyticsCacheService';
import { isSpotifyConfigured } from '../services/spotifyService';
import logger from '../lib/logger';

const router = Router();

// Apply auth & admin check to all admin routes
router.use(optionalAuth, requireAdmin);

// 1. Get Cached Analytics Index
router.get('/analytics', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const data = await AnalyticsCacheService.getCachedOverview(forceRefresh);
    res.json({ analytics: data });
  } catch (err: any) {
    logger.error('Admin analytics error', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve analytics', details: err.message });
  }
});

// 2. Force Rebuild Database Cache Index
router.post('/rebuild-cache', async (_req, res) => {
  try {
    const result = await AnalyticsCacheService.rebuildAllIndexes();
    res.json({
      success: true,
      message: 'Database analytics cache index rebuilt successfully',
      computationTimeMs: result.computationTimeMs,
    });
  } catch (err: any) {
    logger.error('Rebuild cache index error', { error: err.message });
    res.status(500).json({ error: 'Failed to rebuild cache index', details: err.message });
  }
});

// 3. Get User Management List
router.get('/users', async (req, res) => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const users = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        displayName: true,
        role: true,
        avatarUrl: true,
        spotifyId: true,
        createdAt: true,
        _count: {
          select: {
            sessions: true,
          },
        },
      },
    });

    res.json({
      users: users.map((u) => ({
        ...u,
        totalGames: u._count.sessions,
        isSpotifyUser: !!u.spotifyId,
      })),
    });
  } catch (err: any) {
    logger.error('Admin users error', { error: err.message });
    res.status(500).json({ error: 'Failed to retrieve users', details: err.message });
  }
});

// 4. Update User Role (Promote / Demote)
router.patch('/users/:id/role', async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ error: 'Role must be either USER or ADMIN' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, displayName: true, role: true },
    });

    res.json({ success: true, user: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update user role', details: err.message });
  }
});

// 5. Delete User
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user?.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ success: true, message: 'User deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete user', details: err.message });
  }
});

// 6. Recent Quiz Sessions
router.get('/recent-sessions', async (_req, res) => {
  try {
    const sessions = await prisma.gameSession.findMany({
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    res.json({ sessions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load sessions', details: err.message });
  }
});

// 7. System Diagnostics
router.get('/diagnostics', async (_req, res) => {
  try {
    const dbStartTime = performance.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatencyMs = +(performance.now() - dbStartTime).toFixed(1);

    const cacheEntry = await prisma.analyticsCache.findUnique({
      where: { key: 'analytics:overview' },
    });

    res.json({
      database: {
        status: 'healthy',
        engine: 'PostgreSQL',
        latencyMs: dbLatencyMs,
      },
      spotify: {
        configured: isSpotifyConfigured(),
      },
      analytics: {
        googleAnalyticsConfigured: !!(process.env.GA_MEASUREMENT_ID || process.env.VITE_GA_MEASUREMENT_ID),
        cacheStatus: cacheEntry ? 'cached' : 'empty',
        cacheLastUpdated: cacheEntry?.lastUpdated || null,
        cacheExpiresAt: cacheEntry?.expiresAt || null,
      },
      serverTime: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Diagnostics failed', details: err.message });
  }
});

// 8. Featured Artists Management (Home Page)
router.get('/featured-artists', async (_req, res) => {
  try {
    const artists = await prisma.featuredArtist.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ artists });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch featured artists', details: err.message });
  }
});

router.post('/featured-artists', async (req, res) => {
  try {
    const { artistId, name, imageUrl, genres, popularity, displayOrder, isActive, customSongs } = req.body;
    if (!name || !imageUrl) {
      return res.status(400).json({ error: 'Name and imageUrl are required' });
    }

    const uniqueId = artistId || `artist_${Date.now()}`;
    const artist = await prisma.featuredArtist.create({
      data: {
        artistId: uniqueId,
        name: name.trim(),
        imageUrl: imageUrl.trim(),
        genres: Array.isArray(genres) ? genres.join(', ') : (genres || 'pop'),
        popularity: typeof popularity === 'number' ? popularity : 90,
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
        isActive: isActive !== false,
        customSongs: customSongs ? (typeof customSongs === 'string' ? customSongs : JSON.stringify(customSongs)) : null,
      },
    });

    res.json({ success: true, artist });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create featured artist', details: err.message });
  }
});

router.put('/featured-artists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, imageUrl, genres, popularity, displayOrder, isActive, customSongs } = req.body;

    const data: any = {};
    if (name !== undefined) data.name = name.trim();
    if (imageUrl !== undefined) data.imageUrl = imageUrl.trim();
    if (genres !== undefined) data.genres = Array.isArray(genres) ? genres.join(', ') : genres;
    if (popularity !== undefined) data.popularity = popularity;
    if (displayOrder !== undefined) data.displayOrder = displayOrder;
    if (isActive !== undefined) data.isActive = isActive;
    if (customSongs !== undefined) {
      data.customSongs = typeof customSongs === 'string' ? customSongs : JSON.stringify(customSongs);
    }

    const updated = await prisma.featuredArtist.update({
      where: { id },
      data,
    });

    res.json({ success: true, artist: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update featured artist', details: err.message });
  }
});

router.delete('/featured-artists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.featuredArtist.delete({ where: { id } });
    res.json({ success: true, message: 'Featured artist deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete featured artist', details: err.message });
  }
});

// 9. Featured Songs / Tracks Management (Home Page)
router.get('/featured-tracks', async (_req, res) => {
  try {
    const tracks = await prisma.featuredTrack.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    res.json({ tracks });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch featured tracks', details: err.message });
  }
});

router.post('/featured-tracks', async (req, res) => {
  try {
    const { title, artistName, albumName, albumCover, previewUrl, spotifyUri, displayOrder, isActive } = req.body;
    if (!title || !artistName) {
      return res.status(400).json({ error: 'Title and artistName are required' });
    }

    const track = await prisma.featuredTrack.create({
      data: {
        title: title.trim(),
        artistName: artistName.trim(),
        albumName: albumName ? albumName.trim() : null,
        albumCover: albumCover ? albumCover.trim() : null,
        previewUrl: previewUrl ? previewUrl.trim() : null,
        spotifyUri: spotifyUri ? spotifyUri.trim() : null,
        displayOrder: typeof displayOrder === 'number' ? displayOrder : 0,
        isActive: isActive !== false,
      },
    });

    res.json({ success: true, track });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create featured track', details: err.message });
  }
});

router.put('/featured-tracks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, artistName, albumName, albumCover, previewUrl, spotifyUri, displayOrder, isActive } = req.body;

    const data: any = {};
    if (title !== undefined) data.title = title.trim();
    if (artistName !== undefined) data.artistName = artistName.trim();
    if (albumName !== undefined) data.albumName = albumName ? albumName.trim() : null;
    if (albumCover !== undefined) data.albumCover = albumCover ? albumCover.trim() : null;
    if (previewUrl !== undefined) data.previewUrl = previewUrl ? previewUrl.trim() : null;
    if (spotifyUri !== undefined) data.spotifyUri = spotifyUri ? spotifyUri.trim() : null;
    if (displayOrder !== undefined) data.displayOrder = displayOrder;
    if (isActive !== undefined) data.isActive = isActive;

    const updated = await prisma.featuredTrack.update({
      where: { id },
      data,
    });

    res.json({ success: true, track: updated });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update featured track', details: err.message });
  }
});

router.delete('/featured-tracks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.featuredTrack.delete({ where: { id } });
    res.json({ success: true, message: 'Featured track deleted' });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete featured track', details: err.message });
  }
});

export default router;
