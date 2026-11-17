import prisma from '../lib/prisma';
import logger from '../lib/logger';

export interface AnalyticsOverview {
  totalQuizzes: number;
  totalUsers: number;
  totalQuestionsAnswered: number;
  totalCorrectAnswers: number;
  globalAccuracy: number;
  averageScore: number;
  totalPlayTimeSeconds: number;
  fastestGame: number;
  topArtists: Array<{
    artistName: string;
    totalGames: number;
    highScore: number;
    avgAccuracy: number;
    artistImage: string | null;
  }>;
  recentTrends: Array<{
    date: string;
    gamesCount: number;
    avgScore: number;
  }>;
  cacheMetadata: {
    lastUpdated: string;
    expiresAt: string;
    computationTimeMs: number;
    isFresh: boolean;
  };
}

export class AnalyticsCacheService {
  private static TTL_SECONDS = 300; // 5 minute default cache TTL

  /**
   * Track analytical events in DB asynchronously without blocking user response
   */
  public static async trackEvent(
    eventType: string,
    payload: {
      userId?: string | null;
      artistId?: string | null;
      artistName?: string | null;
      metadata?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      await prisma.analyticsEvent.create({
        data: {
          eventType,
          userId: payload.userId || null,
          artistId: payload.artistId || null,
          artistName: payload.artistName || null,
          metadata: payload.metadata ? JSON.stringify(payload.metadata) : null,
        },
      });
    } catch (err: any) {
      logger.warn('Analytics event tracking warning', { error: err.message });
    }
  }

  /**
   * Builds and indexes all analytics data into the database cache
   */
  public static async buildAndCacheAnalyticsIndex(): Promise<AnalyticsOverview> {
    const startTime = performance.now();

    // 1. Fetch KPI aggregates in parallel
    const [
      totalQuizzes,
      totalUsers,
      totalQuestionsAnswered,
      totalCorrectAnswers,
      aggregateStats,
      artistGroups,
      recentSessions,
    ] = await Promise.all([
      prisma.gameSession.count(),
      prisma.user.count(),
      prisma.gameAnswer.count(),
      prisma.gameAnswer.count({ where: { isCorrect: true } }),
      prisma.gameSession.aggregate({
        _avg: { score: true, accuracy: true },
        _sum: { timeTakenSeconds: true },
        _min: { timeTakenSeconds: true },
      }),
      prisma.gameSession.groupBy({
        by: ['artistName'],
        _count: { _all: true },
        _max: { score: true },
        _avg: { accuracy: true },
        orderBy: { _count: { artistName: 'desc' } },
        take: 10,
      }),
      prisma.gameSession.findMany({
        select: {
          score: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    // 2. Resolve artist images for top artists
    const topArtists = await Promise.all(
      artistGroups.map(async (g) => {
        const sample = await prisma.gameSession.findFirst({
          where: { artistName: g.artistName },
          select: { artistImage: true },
        });

        return {
          artistName: g.artistName,
          totalGames: g._count._all,
          highScore: g._max.score || 0,
          avgAccuracy: parseFloat((g._avg.accuracy || 0).toFixed(1)),
          artistImage: sample?.artistImage || null,
        };
      })
    );

    // 3. Compute daily trend aggregates
    const trendMap = new Map<string, { total: number; scoreSum: number }>();
    for (const session of recentSessions) {
      const dayKey = session.createdAt.toISOString().slice(0, 10);
      const existing = trendMap.get(dayKey) || { total: 0, scoreSum: 0 };
      existing.total += 1;
      existing.scoreSum += session.score;
      trendMap.set(dayKey, existing);
    }

    const recentTrends = Array.from(trendMap.entries())
      .map(([date, data]) => ({
        date,
        gamesCount: data.total,
        avgScore: Math.round(data.scoreSum / data.total),
      }))
      .slice(0, 7)
      .reverse();

    const computationTime = +(performance.now() - startTime).toFixed(2);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.TTL_SECONDS * 1000);

    const globalAccuracy =
      totalQuestionsAnswered > 0
        ? parseFloat(((totalCorrectAnswers / totalQuestionsAnswered) * 100).toFixed(1))
        : 0;

    const overviewData: AnalyticsOverview = {
      totalQuizzes,
      totalUsers,
      totalQuestionsAnswered,
      totalCorrectAnswers,
      globalAccuracy,
      averageScore: Math.round(aggregateStats._avg.score || 0),
      totalPlayTimeSeconds: Math.round(aggregateStats._sum.timeTakenSeconds || 0),
      fastestGame: parseFloat((aggregateStats._min.timeTakenSeconds || 0).toFixed(1)),
      topArtists,
      recentTrends,
      cacheMetadata: {
        lastUpdated: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        computationTimeMs: computationTime,
        isFresh: true,
      },
    };

    // 4. Save to Database Cache Index Table (Upsert)
    try {
      await prisma.analyticsCache.upsert({
        where: { key: 'analytics:overview' },
        create: {
          key: 'analytics:overview',
          data: JSON.stringify(overviewData),
          computationTimeMs: computationTime,
          lastUpdated: now,
          expiresAt: expiresAt,
        },
        update: {
          data: JSON.stringify(overviewData),
          computationTimeMs: computationTime,
          lastUpdated: now,
          expiresAt: expiresAt,
        },
      });
    } catch (err: any) {
      logger.warn('Failed to persist analytics cache record', { error: err.message });
    }

    return overviewData;
  }

  /**
   * Retrieves cached analytics index or rebuilds if stale
   */
  public static async getCachedOverview(forceRebuild = false): Promise<AnalyticsOverview> {
    if (!forceRebuild) {
      try {
        const cached = await prisma.analyticsCache.findUnique({
          where: { key: 'analytics:overview' },
        });

        if (cached && new Date(cached.expiresAt) > new Date()) {
          const parsed = JSON.parse(cached.data) as AnalyticsOverview;
          parsed.cacheMetadata.isFresh = false;
          return parsed;
        }
      } catch (err: any) {
        logger.warn('Error reading analytics cache', { error: err.message });
      }
    }

    return this.buildAndCacheAnalyticsIndex();
  }

  /**
   * Rebuilds all database cache indexes immediately
   */
  public static async rebuildAllIndexes(): Promise<{ success: boolean; computationTimeMs: number }> {
    const startTime = performance.now();
    await this.buildAndCacheAnalyticsIndex();
    const duration = +(performance.now() - startTime).toFixed(2);
    return { success: true, computationTimeMs: duration };
  }
}

export default AnalyticsCacheService;
