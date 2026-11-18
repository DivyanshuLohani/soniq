import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';
import { generateSoniqResultCard } from '../services/soniqResultCard';

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
  const topStreak = Math.max(0, parseInt(String(params.streak)) || 0);

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
      });
      if (session) {
        artistName = session.artistName;
        coverImageUrl = session.artistImage;
        score = session.score;
        accuracy = session.accuracy;
        correctCount = session.correctCount;
        totalCount = session.totalQuestions;
        speed = (session.timeTakenSeconds / Math.max(1, session.totalQuestions)).toFixed(2);
      }
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
    const streak = String(req.query.streak || '0');
    const correctCount = String(req.query.correct || '10');
    const totalCount = String(req.query.total || '10');

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

export default router;
