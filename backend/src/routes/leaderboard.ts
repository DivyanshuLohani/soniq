import { Router } from 'express';
import prisma from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';

const router = Router();

// Get Leaderboard (global or filtered by artist)
router.get('/', async (req, res) => {
  const artist = req.query.artist as string | undefined;
  const limit = Math.min(100, parseInt(req.query.limit as string) || 50);

  try {
    const whereClause: any = {};
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
      playerAvatar: s.user?.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(s.guestName || 'anon')}`,
      isSpotifyUser: !!s.user?.spotifyId,
      createdAt: s.createdAt,
    }));

    res.json({ leaderboard: formatted });
  } catch (err: any) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Failed to load leaderboard', details: err.message });
  }
});

// Get popular artists on leaderboard
router.get('/artists', async (_req, res) => {
  try {
    const groups = await prisma.gameSession.groupBy({
      by: ['artistName'],
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
    console.error('Leaderboard artists error:', err);
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
    console.error('Personal stats error:', err);
    res.status(500).json({ error: 'Failed to load user history', details: err.message });
  }
});

export default router;
