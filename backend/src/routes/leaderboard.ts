import { Router } from 'express';
import prisma from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';
import logger from '../lib/logger';

const router = Router();

// Get Leaderboard (global or filtered by artist; excludes playlists)
router.get('/', async (req, res) => {
  const artist = req.query.artist as string | undefined;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  try {
    const whereClause: any = {
      NOT: {
        artistId: {
          startsWith: 'playlist_',
        },
      },
    };

    if (artist && artist.trim()) {
      whereClause.artistName = {
        equals: artist.trim(),
      };
    }

    const sessions = await prisma.gameSession.findMany({
      where: whereClause,
      orderBy: [
        { score: 'desc' },
        { timeTakenSeconds: 'asc' },
        { createdAt: 'desc' },
      ],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            spotifyId: true,
          },
        },
      },
    });

    const formatted = sessions.map((s, index) => ({
      rank: index + 1,
      id: s.id,
      score: s.score,
      correctCount: s.correctCount,
      totalQuestions: s.totalQuestions,
      accuracy: s.accuracy,
      timeTakenSeconds: s.timeTakenSeconds,
      artistName: s.artistName,
      artistImage: s.artistImage,
      playerName: s.user?.displayName || s.guestName || 'Anonymous Player',
      playerAvatar: s.user?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.guestName || 'User')}&backgroundColor=12131a&textColor=d4ff32`,
      isSpotifyUser: !!s.user?.spotifyId,
      createdAt: s.createdAt,
    }));

    res.json({ leaderboard: formatted });
  } catch (err: any) {
    logger.error('Leaderboard fetch error', { error: err.message });
    res.status(500).json({ error: 'Failed to load leaderboard', details: err.message });
  }
});

// Get popular artists on leaderboard (excludes playlists)
router.get('/artists', async (_req, res) => {
  try {
    const groups = await prisma.gameSession.groupBy({
      by: ['artistName'],
      where: {
        NOT: {
          artistId: {
            startsWith: 'playlist_',
          },
        },
      },
      _count: {
        _all: true,
      },
      _max: {
        score: true,
      },
      orderBy: {
        _count: {
          artistName: 'desc',
        },
      },
      take: 20,
    });

    const artistsWithImages = await Promise.all(
      groups.map(async (g) => {
        const topSession = await prisma.gameSession.findFirst({
          where: { artistName: g.artistName },
          select: { artistImage: true },
        });

        return {
          artistName: g.artistName,
          totalGames: g._count._all,
          highScore: g._max.score || 0,
          artistImage: topSession?.artistImage || null,
        };
      })
    );

    res.json({ artists: artistsWithImages });
  } catch (err: any) {
    logger.error('Leaderboard artists error', { error: err.message });
    res.status(500).json({ error: 'Failed to load artist stats', details: err.message });
  }
});

// Get user's personal game statistics & history
router.get('/me', optionalAuth, async (req, res) => {
  if (!req.user) {
    return res.json({ history: [], stats: null });
  }

  try {
    const sessions = await prisma.gameSession.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: {
        answers: true,
      },
    });

    if (sessions.length === 0) {
      return res.json({
        history: [],
        stats: {
          totalGames: 0,
          bestScore: 0,
          averageAccuracy: 0,
          fastestGame: 0,
        },
      });
    }

    const totalGames = sessions.length;
    const bestScore = Math.max(...sessions.map((s) => s.score));
    const avgAccuracy =
      sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalGames;
    const fastestGame = Math.min(...sessions.map((s) => s.timeTakenSeconds));

    res.json({
      history: sessions,
      stats: {
        totalGames,
        bestScore,
        averageAccuracy: parseFloat(avgAccuracy.toFixed(1)),
        fastestGame: parseFloat(fastestGame.toFixed(2)),
      },
    });
  } catch (err: any) {
    logger.error('Personal stats error', { error: err.message });
    res.status(500).json({ error: 'Failed to load user history', details: err.message });
  }
});

// Get public profile and game history of any user by ID
router.get('/user/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sessions = await prisma.gameSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    const totalGames = sessions.length;
    const bestScore = totalGames > 0 ? Math.max(...sessions.map((s) => s.score)) : 0;
    const avgAccuracy =
      totalGames > 0
        ? sessions.reduce((sum, s) => sum + s.accuracy, 0) / totalGames
        : 0;
    const fastestGame =
      totalGames > 0 ? Math.min(...sessions.map((s) => s.timeTakenSeconds)) : 0;

    res.json({
      user,
      history: sessions,
      stats: {
        totalGames,
        bestScore,
        averageAccuracy: parseFloat(avgAccuracy.toFixed(1)),
        fastestGame: parseFloat(fastestGame.toFixed(2)),
      },
    });
  } catch (err: any) {
    logger.error('Public user profile error', { error: err.message });
    res.status(500).json({ error: 'Failed to load public profile', details: err.message });
  }
});

export default router;
