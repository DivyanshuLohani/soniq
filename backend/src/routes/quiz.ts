import { Router } from 'express';
import prisma from '../lib/prisma';
import { optionalAuth } from '../middleware/auth';
import { AnalyticsCacheService } from '../services/analyticsCacheService';
import {
  isSpotifyConfigured,
  getArtistTracksSpotify,
} from '../services/spotifyService';
import {
  getArtistTracksFallback,
  type TrackItem,
} from '../services/fallbackMusicService';

const router = Router();

// Helper to shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

// Generate Quiz for an Artist
router.get('/generate', optionalAuth, async (req, res) => {
  const artistId = (req.query.artistId as string || '').trim();
  const artistName = (req.query.artistName as string || '').trim();

  if (!artistName) {
    return res.status(400).json({ error: 'artistName parameter is required' });
  }

  try {
    let userAccessToken: string | undefined;
    if (req.user?.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: { accessToken: true },
      });
      if (dbUser?.accessToken) {
        userAccessToken = dbUser.accessToken;
      }
    }

    let tracks: TrackItem[] = [];

    // 1. Fetch tracks via Spotify if configured or user token available
    if ((isSpotifyConfigured() || userAccessToken) && artistId && !artistId.startsWith('itunes_')) {
      try {
        tracks = await getArtistTracksSpotify(artistId, artistName, userAccessToken);
      } catch (err) {
        console.warn('Spotify getArtistTracks failed, falling back:', err);
      }
    }

    // 2. Fallback / supplement with verified iTunes artist lookup to ensure 10+ high quality playable songs
    const currentPlayable = tracks.filter((t) => !!t.previewUrl);
    if (currentPlayable.length < 10) {
      try {
        const fallbackTracks = await getArtistTracksFallback(artistName);
        for (const ft of fallbackTracks) {
          if (!tracks.some((t) => t.name.toLowerCase() === ft.name.toLowerCase())) {
            tracks.push(ft);
          }
        }
      } catch (err) {
        console.warn('Fallback track fetch failed:', err);
      }
    }

    // Filter tracks with valid audio preview
    const playableTracks = tracks.filter((t) => !!t.previewUrl);

    if (playableTracks.length < 3) {
      return res.status(400).json({
        error: `Could not find enough songs with playable audio previews for "${artistName}". Found ${playableTracks.length}, minimum 3 needed. Try a different artist.`,
      });
    }

    // Determine quiz question count:
    // If >= 10 songs, pick 10 songs. If fewer (e.g. 4 or 6), make a smaller quiz as requested!
    const targetQuestionCount = Math.min(10, playableTracks.length);

    // Shuffle playable tracks to choose target questions randomly
    const shuffledTracks = shuffle(playableTracks);
    const selectedTargets = shuffledTracks.slice(0, targetQuestionCount);

    const questions = selectedTargets.map((targetTrack, index) => {
      // Pick 2 distractors from the SAME artist (excluding current track)
      const otherTracks = playableTracks.filter((t) => t.id !== targetTrack.id && t.name !== targetTrack.name);
      const shuffledOthers = shuffle(otherTracks);
      const distractors = shuffledOthers.slice(0, 2);

      // Total 3 choices: 1 correct + 2 wrong
      const choices = shuffle([
        {
          id: targetTrack.id,
          name: targetTrack.name,
          albumName: targetTrack.albumName,
          albumCover: targetTrack.albumCover,
          isCorrect: true,
        },
        ...distractors.map((d) => ({
          id: d.id,
          name: d.name,
          albumName: d.albumName,
          albumCover: d.albumCover,
          isCorrect: false,
        })),
      ]);

      return {
        questionIndex: index,
        audioUrl: targetTrack.previewUrl,
        correctTrackId: targetTrack.id,
        correctTrackName: targetTrack.name,
        albumCover: targetTrack.albumCover,
        albumName: targetTrack.albumName,
        options: choices.map((c) => ({
          id: c.id,
          name: c.name,
          albumName: c.albumName,
          albumCover: c.albumCover,
        })),
      };
    });

    const artistImage =
      playableTracks[0]?.albumCover ||
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80';

    AnalyticsCacheService.trackEvent('quiz_start', {
      userId: req.user?.id,
      artistId,
      artistName,
      metadata: { totalQuestions: questions.length },
    });

    res.json({
      quiz: {
        artistId: artistId || `artist_${artistName.toLowerCase().replace(/\s+/g, '_')}`,
        artistName,
        artistImage,
        totalQuestions: questions.length,
        isShortQuiz: questions.length < 10,
        questions,
      },
    });
  } catch (err: any) {
    console.error('Quiz generation error:', err);
    res.status(500).json({ error: 'Failed to generate quiz', details: err.message });
  }
});

// Submit Quiz Results
router.post('/submit', optionalAuth, async (req, res) => {
  try {
    const {
      artistId,
      artistName,
      artistImage,
      totalQuestions,
      timeTakenSeconds,
      answers,
      guestName,
    } = req.body;

    if (!artistName || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Invalid quiz submission data' });
    }

    // Calculate score & statistics
    let correctCount = 0;
    let computedScore = 0;
    let currentStreak = 0;

    for (const ans of answers) {
      if (ans.isCorrect) {
        correctCount++;
        currentStreak++;

        // Base points: 100
        // Speed bonus: up to 100 points based on fast response (15s limit)
        const timeSpent = Math.max(0.5, ans.timeSpentSeconds || 3);
        const speedBonus = Math.max(0, Math.round((15 - timeSpent) * 10));

        // Streak multiplier: 1x, 1.2x, 1.5x, 2x
        let multiplier = 1.0;
        if (currentStreak >= 5) multiplier = 2.0;
        else if (currentStreak >= 3) multiplier = 1.5;
        else if (currentStreak >= 2) multiplier = 1.2;

        computedScore += Math.round((100 + speedBonus) * multiplier);
      } else {
        currentStreak = 0;
      }
    }

    const accuracy = totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
    const finalTime = typeof timeTakenSeconds === 'number' && timeTakenSeconds > 0
      ? timeTakenSeconds
      : answers.reduce((sum, a) => sum + (a.timeSpentSeconds || 3), 0);

    // Save GameSession & Answers in DB
    const session = await prisma.gameSession.create({
      data: {
        userId: req.user?.id || null,
        guestName: !req.user ? (guestName || 'Anonymous Player') : req.user.displayName,
        artistId: artistId || `artist_${artistName.toLowerCase().replace(/\s+/g, '_')}`,
        artistName: artistName,
        artistImage: artistImage || null,
        totalQuestions: totalQuestions || answers.length,
        correctCount: correctCount,
        score: computedScore,
        timeTakenSeconds: parseFloat(finalTime.toFixed(2)),
        accuracy: parseFloat(accuracy.toFixed(1)),
        answers: {
          create: answers.map((a: any, idx: number) => ({
            questionIndex: idx,
            trackId: a.trackId || `track_${idx}`,
            trackName: a.trackName || 'Unknown Song',
            selectedTrackId: a.selectedTrackId || 'none',
            selectedTrackName: a.selectedTrackName || 'Skipped',
            isCorrect: !!a.isCorrect,
            timeSpentSeconds: parseFloat((a.timeSpentSeconds || 0).toFixed(2)),
          })),
        },
      },
      include: {
        answers: true,
      },
    });

    // Check rank on this artist's leaderboard
    const betterSessionsCount = await prisma.gameSession.count({
      where: {
        artistName: { equals: artistName },
        OR: [
          { score: { gt: computedScore } },
          { score: computedScore, timeTakenSeconds: { lt: session.timeTakenSeconds } },
        ],
      },
    });

    const artistRank = betterSessionsCount + 1;

    AnalyticsCacheService.trackEvent('quiz_complete', {
      userId: req.user?.id,
      artistId: session.artistId,
      artistName: session.artistName,
      metadata: {
        score: session.score,
        accuracy: session.accuracy,
        timeTakenSeconds: session.timeTakenSeconds,
        artistRank,
      },
    });

    res.json({
      success: true,
      session: {
        id: session.id,
        score: session.score,
        correctCount: session.correctCount,
        totalQuestions: session.totalQuestions,
        accuracy: session.accuracy,
        timeTakenSeconds: session.timeTakenSeconds,
        artistName: session.artistName,
        artistImage: session.artistImage,
        artistRank,
        createdAt: session.createdAt,
      },
    });
  } catch (err: any) {
    console.error('Quiz submit error:', err);
    res.status(500).json({ error: 'Failed to save quiz results', details: err.message });
  }
});

export default router;
