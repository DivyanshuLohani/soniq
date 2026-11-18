import { Router, Request, Response } from 'express';
import puppeteer, { Browser } from 'puppeteer';
import prisma from '../lib/prisma';
import { logger } from '../lib/logger';

const router = Router();

// Reusable browser instance for sub-second rendering
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
      ],
    }).catch((err) => {
      browserPromise = null;
      throw err;
    });
  }
  return browserPromise;
}

// Generate the HTML template for the Classic Card
function buildClassicCardHtml(params: {
  artistName: string;
  artistImage?: string | null;
  score: string | number;
  accuracy: string | number;
  speed: string | number;
  streak: string | number;
  correctCount: string | number;
  totalCount: string | number;
  isWideOg?: boolean;
}): string {
  const {
    artistName,
    artistImage,
    score,
    accuracy,
    speed,
    streak,
    correctCount,
    totalCount,
    isWideOg,
  } = params;

  const isPerfect = Number(accuracy) === 100;
  const tierText = isPerfect
    ? 'PERFECT RUN'
    : Number(accuracy) >= 80
    ? 'EXPERT TIER'
    : 'MUSIC LOVER';

  const defaultArtistArt =
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80';

  if (isWideOg) {
    // 1200x630 OpenGraph Banner Layout
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700&family=Space+Grotesk:wght@600;700;800;900&family=Space+Mono:wght@700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 1200px;
      height: 630px;
      background: #08080B;
      color: #F4F4F7;
      font-family: 'Space Grotesk', sans-serif;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 36px;
    }
    .card {
      width: 100%;
      height: 100%;
      border-radius: 36px;
      border: 2px solid rgba(212, 255, 50, 0.4);
      background: #08080B radial-gradient(circle at 100% 0%, rgba(212, 255, 50, 0.15) 0%, transparent 50%),
                  radial-gradient(circle at 0% 100%, rgba(180, 155, 255, 0.12) 0%, transparent 50%);
      padding: 40px 48px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 25px 60px rgba(0,0,0,0.8);
      position: relative;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: #D4FF32;
      box-shadow: 0 0 16px #D4FF32;
    }
    .brand-title {
      font-size: 32px;
      font-weight: 900;
      color: #F4F4F7;
      letter-spacing: -0.5px;
    }
    .brand-title span { color: #D4FF32; }
    .tier-badge {
      padding: 8px 20px;
      border-radius: 20px;
      background: #12131A;
      border: 1px solid rgba(255, 255, 255, 0.12);
      color: #D4FF32;
      font-family: 'Space Mono', monospace;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 1px;
    }
    .hero-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
      margin: 10px 0;
    }
    .artist-side {
      display: flex;
      align-items: center;
      gap: 24px;
      flex: 1;
      min-width: 0;
    }
    .artist-art {
      width: 130px;
      height: 130px;
      border-radius: 28px;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.15);
      box-shadow: 0 15px 35px rgba(0,0,0,0.6);
      shrink-0;
    }
    .artist-info {
      min-width: 0;
    }
    .quiz-tag {
      font-size: 12px;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #8E8E9F;
      margin-bottom: 6px;
    }
    .artist-name {
      font-size: 42px;
      font-weight: 900;
      color: #F4F4F7;
      letter-spacing: -0.5px;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .score-box {
      background: rgba(13, 13, 17, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 28px;
      padding: 20px 48px;
      text-align: center;
      min-width: 330px;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
    }
    .score-label {
      font-size: 11px;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #8E8E9F;
    }
    .score-number {
      font-size: 64px;
      font-weight: 900;
      font-family: 'Space Mono', monospace;
      color: #D4FF32;
      line-height: 1.05;
      margin: 4px 0;
      letter-spacing: -1px;
    }
    .score-meta {
      font-size: 14px;
      font-family: 'Space Mono', monospace;
      color: #8E8E9F;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .score-meta span { color: #F4F4F7; font-weight: 700; }
    .score-meta .acc { color: #D4FF32; }
    .stats-row {
      display: flex;
      gap: 20px;
    }
    .stat-pill {
      flex: 1;
      background: #12131A;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 16px;
      text-align: center;
    }
    .stat-pill .label {
      font-size: 11px;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      color: #8E8E9F;
      letter-spacing: 1px;
    }
    .stat-pill .value {
      font-size: 24px;
      font-family: 'Space Mono', monospace;
      font-weight: 800;
      color: #F4F4F7;
      margin-top: 4px;
    }
    .stat-pill .value.streak { color: #B49BFF; }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
      padding-top: 16px;
      font-size: 14px;
      color: #8E8E9F;
      font-family: 'Space Mono', monospace;
    }
    .footer .cta { color: #D4FF32; font-weight: 700; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <div class="brand-dot"></div>
        <div class="brand-title">soniq<span>.</span></div>
      </div>
      <div class="tier-badge">${tierText}</div>
    </div>

    <div class="hero-row">
      <div class="artist-side">
        <img class="artist-art" src="${artistImage || defaultArtistArt}" alt="" />
        <div class="artist-info">
          <div class="quiz-tag">Quiz Challenge Completed</div>
          <div class="artist-name">${artistName}</div>
        </div>
      </div>

      <div class="score-box">
        <div class="score-label">Final Score</div>
        <div class="score-number">${Number(score).toLocaleString()}</div>
        <div class="score-meta">
          <span>${correctCount}/${totalCount} Correct</span>
          •
          <span class="acc">${accuracy}% Accuracy</span>
        </div>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-pill">
        <div class="label">Reaction Speed</div>
        <div class="value">${speed}s</div>
      </div>
      <div class="stat-pill">
        <div class="label">Top Streak</div>
        <div class="value streak">${streak} in a row</div>
      </div>
    </div>

    <div class="footer">
      <div>Play speed music trivia free at soniq.dibbu.dev</div>
      <div class="cta">Can you beat my score?</div>
    </div>
  </div>
</body>
</html>`;
  }

  // Portrait Classic Card Layout (Matching frontend card exactly)
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600;700;800;900&family=Space+Mono:wght@700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      width: 480px;
      height: 720px;
      background: #08080B;
      color: #F4F4F7;
      font-family: 'Space Grotesk', sans-serif;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 24px;
    }
    .card {
      width: 100%;
      height: 100%;
      border-radius: 32px;
      border: 2px solid rgba(212, 255, 50, 0.4);
      background: #08080B radial-gradient(circle at 100% 0%, rgba(212, 255, 50, 0.12) 0%, transparent 50%),
                  radial-gradient(circle at 0% 100%, rgba(180, 155, 255, 0.1) 0%, transparent 50%);
      padding: 32px 28px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      box-shadow: 0 20px 50px rgba(0,0,0,0.8);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #D4FF32;
      box-shadow: 0 0 12px #D4FF32;
    }
    .brand-title {
      font-size: 24px;
      font-weight: 900;
      color: #F4F4F7;
    }
    .brand-title span { color: #D4FF32; }
    .tier-badge {
      padding: 6px 14px;
      border-radius: 20px;
      background: #12131A;
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #D4FF32;
      font-family: 'Space Mono', monospace;
      font-size: 11px;
      font-weight: 700;
    }
    .artist-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin: 12px 0;
    }
    .artist-art {
      width: 110px;
      height: 110px;
      border-radius: 24px;
      object-fit: cover;
      border: 2px solid rgba(255, 255, 255, 0.12);
      box-shadow: 0 15px 30px rgba(0,0,0,0.7);
      margin-bottom: 12px;
    }
    .quiz-tag {
      font-size: 11px;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 2px;
      color: #8E8E9F;
      margin-bottom: 4px;
    }
    .artist-name {
      font-size: 28px;
      font-weight: 900;
      color: #F4F4F7;
    }
    .score-box {
      background: rgba(13, 13, 17, 0.95);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 22px;
      padding: 18px 24px;
      text-align: center;
      margin: 10px 0;
    }
    .score-label {
      font-size: 11px;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      color: #8E8E9F;
    }
    .score-number {
      font-size: 52px;
      font-weight: 900;
      font-family: 'Space Mono', monospace;
      color: #D4FF32;
      margin: 4px 0;
    }
    .score-meta {
      font-size: 13px;
      font-family: 'Space Mono', monospace;
      color: #8E8E9F;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }
    .score-meta span { color: #F4F4F7; font-weight: 600; }
    .score-meta .acc { color: #D4FF32; font-weight: 700; }
    .stats-row {
      display: flex;
      gap: 12px;
      margin: 10px 0;
    }
    .stat-pill {
      flex: 1;
      background: #12131A;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 12px;
      text-align: center;
    }
    .stat-pill .label {
      font-size: 10px;
      font-family: 'Space Mono', monospace;
      text-transform: uppercase;
      color: #8E8E9F;
    }
    .stat-pill .value {
      font-size: 18px;
      font-family: 'Space Mono', monospace;
      font-weight: 800;
      color: #F4F4F7;
      margin-top: 2px;
    }
    .stat-pill .value.streak { color: #B49BFF; }
    .footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
      padding-top: 14px;
      font-size: 12px;
      color: #8E8E9F;
      font-family: 'Space Mono', monospace;
    }
    .footer .cta { color: #D4FF32; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="brand">
        <div class="brand-dot"></div>
        <div class="brand-title">soniq<span>.</span></div>
      </div>
      <div class="tier-badge">${tierText}</div>
    </div>

    <div class="artist-section">
      <img class="artist-art" src="${artistImage || defaultArtistArt}" alt="" />
      <div class="quiz-tag">Quiz Completed</div>
      <div class="artist-name">${artistName}</div>
    </div>

    <div class="score-box">
      <div class="score-label">Final Score</div>
      <div class="score-number">${Number(score).toLocaleString()}</div>
      <div class="score-meta">
        <span>${correctCount}/${totalCount} Correct</span>
        •
        <span class="acc">${accuracy}% Accuracy</span>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-pill">
        <div class="label">Reaction Speed</div>
        <div class="value">${speed}s</div>
      </div>
      <div class="stat-pill">
        <div class="label">Top Streak</div>
        <div class="value streak">${streak} in a row</div>
      </div>
    </div>

    <div class="footer">
      <div>Play free at soniq.dibbu.dev</div>
      <div class="cta">Can you beat my score?</div>
    </div>
  </div>
</body>
</html>`;
}

// GET /api/card/og
router.get('/og', async (req: Request, res: Response) => {
  const startTime = Date.now();
  let page: any = null;
  try {
    let artistName = String(req.query.artist || '').trim();
    let artistImage = (req.query.image as string) || null;
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
        artistImage = session.artistImage;
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

    const html = buildClassicCardHtml({
      artistName,
      artistImage,
      score,
      accuracy,
      speed,
      streak,
      correctCount,
      totalCount,
      isWideOg: true,
    });

    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pngBuffer = await page.screenshot({ type: 'png' });

    const duration = Date.now() - startTime;
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800, immutable');
    res.setHeader('Server-Timing', `gen;dur=${duration}`);
    return res.status(200).send(Buffer.from(pngBuffer));
  } catch (err: any) {
    logger.error('Error generating OpenGraph card image', { error: err.message });
    return res.status(500).json({ error: 'Failed to generate OG image' });
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
});

// GET /api/card/generate (portrait card)
router.get('/generate', async (req: Request, res: Response) => {
  let page: any = null;
  try {
    const artistName = String(req.query.artist || 'Artist');
    const artistImage = (req.query.image as string) || null;
    const score = String(req.query.score || '0');
    const accuracy = String(req.query.accuracy || '100');
    const speed = String(req.query.speed || '0.00');
    const streak = String(req.query.streak || '0');
    const correctCount = String(req.query.correct || '10');
    const totalCount = String(req.query.total || '10');

    const html = buildClassicCardHtml({
      artistName,
      artistImage,
      score,
      accuracy,
      speed,
      streak,
      correctCount,
      totalCount,
      isWideOg: false,
    });

    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setViewport({ width: 480, height: 720, deviceScaleFactor: 2 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pngBuffer = await page.screenshot({ type: 'png' });

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
    return res.status(200).send(Buffer.from(pngBuffer));
  } catch (err: any) {
    logger.error('Error generating card image', { error: err.message });
    return res.status(500).json({ error: 'Failed to generate card image' });
  } finally {
    if (page) {
      await page.close().catch(() => {});
    }
  }
});

export default router;
