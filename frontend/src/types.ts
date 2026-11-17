export interface User {
  id: string;
  spotifyId?: string | null;
  displayName: string;
  email?: string | null;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string | null;
  isSpotifyConnected?: boolean;
  isGuest?: boolean;
}

export interface Artist {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  popularity?: number;
  followers?: number;
}

export interface SongOption {
  id: string;
  name: string;
  albumName: string;
  albumCover: string;
}

export interface QuizQuestion {
  questionIndex: number;
  audioUrl: string;
  correctTrackId: string;
  correctTrackName: string;
  albumCover: string;
  albumName: string;
  options: SongOption[];
}

export interface QuizData {
  artistId: string;
  artistName: string;
  artistImage: string;
  totalQuestions: number;
  isShortQuiz: boolean;
  questions: QuizQuestion[];
}

export interface AnswerRecord {
  questionIndex: number;
  trackId: string;
  trackName: string;
  selectedTrackId: string;
  selectedTrackName: string;
  isCorrect: boolean;
  timeSpentSeconds: number;
  albumCover?: string;
}

export interface QuizResultSession {
  id: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  timeTakenSeconds: number;
  artistName: string;
  artistImage?: string;
  artistRank: number;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  score: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  timeTakenSeconds: number;
  artistName: string;
  artistImage?: string;
  playerName: string;
  playerAvatar: string;
  isSpotifyUser: boolean;
  createdAt: string;
}

export interface ArtistStat {
  artistName: string;
  totalGames: number;
  highScore: number;
  artistImage: string | null;
}

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

export interface AdminUserItem {
  id: string;
  email?: string | null;
  displayName: string;
  role: 'USER' | 'ADMIN';
  avatarUrl?: string | null;
  totalGames: number;
  isSpotifyUser: boolean;
  createdAt: string;
}

export interface DiagnosticsData {
  database: {
    status: string;
    engine: string;
    latencyMs: number;
  };
  spotify: {
    configured: boolean;
  };
  analytics: {
    googleAnalyticsConfigured: boolean;
    cacheStatus: string;
    cacheLastUpdated: string | null;
    cacheExpiresAt: string | null;
  };
  serverTime: string;
}
