import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import bcrypt from 'bcryptjs';
import authRouter from './routes/auth';
import spotifyRouter from './routes/spotify';
import quizRouter from './routes/quiz';
import leaderboardRouter from './routes/leaderboard';
import adminRouter from './routes/admin';
import prisma from './lib/prisma';
import { AnalyticsCacheService } from './services/analyticsCacheService';

export const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup to allow frontend requests
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:5173',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
    ],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/quiz', quizRouter);
app.use('/api/leaderboard', leaderboardRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'artist-quiz-api',
    database: 'PostgreSQL',
  });
});

// Seed sample leaderboard scores & Admin user if DB is empty
async function seedInitialDataIfNeeded() {
  try {
    // 1. Seed default Admin user if none exists
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount === 0) {
      console.log('Seeding default Admin user (admin@matiks.beats)...');
      const passHash = await bcrypt.hash('AdminPass123!', 10);
      await prisma.user.create({
        data: {
          email: 'admin@matiks.beats',
          passwordHash: passHash,
          displayName: 'BeatAdmin',
          role: 'ADMIN',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=BeatAdmin',
        },
      });
      console.log('Admin user seeded: admin@matiks.beats / AdminPass123!');
    }

    // 2. Seed showcase game sessions if empty
    const sessionCount = await prisma.gameSession.count();
    if (sessionCount === 0) {
      console.log('Seeding initial showcase leaderboard entries...');
      const samples = [
        {
          guestName: 'BeatMaster_Alex',
          artistId: 'spotify_queen',
          artistName: 'Queen',
          artistImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          totalQuestions: 10,
          correctCount: 10,
          score: 2380,
          timeTakenSeconds: 19.4,
          accuracy: 100.0,
        },
        {
          guestName: 'GrooveRider_Mia',
          artistId: 'spotify_the_weeknd',
          artistName: 'The Weeknd',
          artistImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
          totalQuestions: 10,
          correctCount: 9,
          score: 1950,
          timeTakenSeconds: 22.8,
          accuracy: 90.0,
        },
        {
          guestName: 'Swiftie_Leo',
          artistId: 'spotify_taylor_swift',
          artistName: 'Taylor Swift',
          artistImage: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80',
          totalQuestions: 10,
          correctCount: 10,
          score: 2420,
          timeTakenSeconds: 18.2,
          accuracy: 100.0,
        },
        {
          guestName: 'SynthWave_Dan',
          artistId: 'spotify_daft_punk',
          artistName: 'Daft Punk',
          artistImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
          totalQuestions: 8,
          correctCount: 8,
          score: 1820,
          timeTakenSeconds: 15.6,
          accuracy: 100.0,
        },
        {
          guestName: 'AudioNinja_Kai',
          artistId: 'spotify_billie_eilish',
          artistName: 'Billie Eilish',
          artistImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80',
          totalQuestions: 10,
          correctCount: 8,
          score: 1610,
          timeTakenSeconds: 27.5,
          accuracy: 80.0,
        },
      ];

      for (const s of samples) {
        await prisma.gameSession.create({ data: s });
      }
      console.log('Seeded sample leaderboard entries successfully');
    }

    // 3. Pre-warm analytics cache index
    await AnalyticsCacheService.buildAndCacheAnalyticsIndex();
  } catch (err) {
    console.warn('Seeding warning:', err);
  }
}

// In local mode or standalone server, start listening
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`🎵 Artist Quiz Backend running with PostgreSQL at http://localhost:${PORT}`);
    await seedInitialDataIfNeeded();
  });
}

export default app;
