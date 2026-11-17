import { Router } from 'express';
import prisma from '../lib/prisma';
import { requireAdmin, optionalAuth } from '../middleware/auth';
import { AnalyticsCacheService } from '../services/analyticsCacheService';
import { isSpotifyConfigured } from '../services/spotifyService';

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
    console.error('Admin analytics error:', err);
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
    console.error('Rebuild cache index error:', err);
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
    console.error('Admin users error:', err);
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

export default router;
