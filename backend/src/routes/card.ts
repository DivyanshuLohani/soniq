import { Router, type Request, type Response } from 'express';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { generateSoniqResultCard } from '../services/soniqResultCard';
import { generateSoniqAccountCard } from '../services/soniqAccountCard';

const router = Router();

const DEFAULT_COVER_IMAGE =
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

// Helper to sanitize & generate result card via sharp SVG
async function createResultCardBuffer(params: {
  artistName: string;
  coverImageUrl?: string | null;
  score: string | number;
  accuracy: string | number;
  speed: string | number;
  streak: string | number;
  correctCount: string | number;
  totalCount: string | number;
}): Promise<Buffer> {
  const artistName = String(params.artistName || 'Music Trivia').trim();
  const coverImageUrl = (params.coverImageUrl && params.coverImageUrl.startsWith('http'))
    ? params.coverImageUrl
    : DEFAULT_COVER_IMAGE;
  const score = Math.max(0, parseInt(String(params.score)) || 0);
  const correct = Math.max(0, parseInt(String(params.correctCount)) || 0);
  const total = Math.max(1, parseInt(String(params.totalCount)) || 10);
  const reactionSpeedSeconds = Math.max(0, parseFloat(String(params.speed)) || 0);
  let topStreak = Math.max(0, parseInt(String(params.streak)) || 0);

  // If a perfect score (all questions correct) was achieved, streak cannot be 0; it must be total
  if (correct === total && correct > 0 && topStreak === 0) {
    topStreak = total;
  }

  return generateSoniqResultCard({
    artistName,
    coverImageUrl,
    score,
    correct: Math.min(correct, total),
    total,
    reactionSpeedSeconds,
    topStreak,
    perfectRun: correct === total,
  });
}

// 1. GET /api/card/og - OpenGraph image generator using Sharp SVG
router.get('/og', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    let artistName = String(req.query.artist || '').trim();
    let coverImageUrl = (req.query.image as string) || null;
    let score: string | number = String(req.query.score || '0');
    let accuracy: string | number = String(req.query.accuracy || '100');
    let speed: string | number = String(req.query.speed || '0.00');
    let streak: string | number = String(req.query.streak || '0');
    let correctCount: string | number = String(req.query.correct || '10');
    let totalCount: string | number = String(req.query.total || '10');

    // If session ID `sid` is provided, fetch exact results from database
    const sid = req.query.sid as string | undefined;
    if (sid) {
      const session = await prisma.gameSession.findUnique({
        where: { id: sid },
        include: { answers: { orderBy: { questionIndex: 'asc' } } },
      });
      if (session) {
        artistName = session.artistName;
        coverImageUrl = session.artistImage;
        score = session.score;
        accuracy = session.accuracy;
        correctCount = session.correctCount;
        totalCount = session.totalQuestions;
        speed = (session.timeTakenSeconds / Math.max(1, session.totalQuestions)).toFixed(2);

        // Compute max streak from session answers if available
        if (session.answers && session.answers.length > 0) {
          let maxS = 0;
          let curS = 0;
          for (const ans of session.answers) {
            if (ans.isCorrect) {
              curS++;
              if (curS > maxS) maxS = curS;
            } else {
              curS = 0;
            }
          }
          streak = maxS;
        } else if (session.correctCount === session.totalQuestions) {
          // Fallback for perfect score when answers list is empty
          streak = session.totalQuestions;
        }
      }
    } else if (parseInt(String(correctCount)) > 0 && parseInt(String(correctCount)) === parseInt(String(totalCount)) && (!streak || streak === '0')) {
      // If no sid but perfect run query parameters are passed with 0 streak, streak equals totalCount
      streak = totalCount;
    }

    if (!artistName) {
      artistName = 'Music Trivia';
    }

    const pngBuffer = await createResultCardBuffer({
      artistName,
      coverImageUrl,
      score,
      accuracy,
      speed,
      streak,
      correctCount,
      totalCount,
    });

    const duration = Date.now() - startTime;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');
    res.setHeader('Server-Timing', `gen;dur=${duration}`);
    return res.status(200).send(pngBuffer);
  } catch (err: any) {
    logger.error('Error generating OpenGraph card image via Sharp', { error: err.message });
    return res.status(500).json({ error: 'Failed to generate OG image' });
  }
});

// 2. GET /api/card/generate - Endpoint alias
router.get('/generate', async (req: Request, res: Response) => {
  try {
    const artistName = String(req.query.artist || 'Artist');
    const coverImageUrl = (req.query.image as string) || null;
    const score = String(req.query.score || '0');
    const accuracy = String(req.query.accuracy || '100');
    const speed = String(req.query.speed || '0.00');
    let streak = String(req.query.streak || '0');
    const correctCount = String(req.query.correct || '10');
    const totalCount = String(req.query.total || '10');

    if (parseInt(String(correctCount)) > 0 && parseInt(String(correctCount)) === parseInt(String(totalCount)) && (!streak || streak === '0')) {
      streak = totalCount;
    }

    const pngBuffer = await createResultCardBuffer({
      artistName,
      coverImageUrl,
      score,
      accuracy,
      speed,
      streak,
      correctCount,
      totalCount,
    });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(pngBuffer);
  } catch (err: any) {
    logger.error('Error generating card image via Sharp', { error: err.message });
    return res.status(500).json({ error: 'Failed to generate card image' });
  }
});

// 3. GET /api/card/account - OpenGraph & Share Card for user account stats
router.get('/account', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const uid = req.query.uid as string | undefined;

    let displayName = String(req.query.name || 'Music Fan').trim();
    let avatarUrl = (req.query.avatar as string) || null;
    let totalGames = parseInt(String(req.query.games || '0')) || 0;
    let bestScore = parseInt(String(req.query.score || '0')) || 0;
    let averageAccuracy = parseFloat(String(req.query.accuracy || '0')) || 0;
    let fastestTimeSeconds = parseFloat(String(req.query.speed || '0')) || 0;

    // If userId `uid` provided, pull live aggregate from PostgreSQL
    if (uid) {
      const user = await prisma.user.findUnique({
        where: { id: uid },
        select: {
          displayName: true,
          avatarUrl: true,
          sessions: {
            select: {
              score: true,
              accuracy: true,
              timeTakenSeconds: true,
            },
          },
        },
      });

      if (user) {
        displayName = user.displayName;
        avatarUrl = user.avatarUrl;
        totalGames = user.sessions.length;
        if (totalGames > 0) {
          bestScore = Math.max(...user.sessions.map((s) => s.score));
          averageAccuracy =
            user.sessions.reduce((acc, s) => acc + s.accuracy, 0) / totalGames;
          fastestTimeSeconds = Math.min(...user.sessions.map((s) => s.timeTakenSeconds));
        }
      }
    }

    const pngBuffer = await generateSoniqAccountCard({
      displayName,
      avatarUrl,
      totalGames,
      bestScore,
      averageAccuracy,
      fastestTimeSeconds,
    });

    const duration = Date.now() - startTime;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    res.setHeader('Server-Timing', `gen;dur=${duration}`);
    return res.status(200).send(pngBuffer);
  } catch (err: any) {
    logger.error('Error generating account card image via Sharp', { error: err.message });
    return res.status(500).json({ error: 'Failed to generate account card image' });
  }
});

export default router;
