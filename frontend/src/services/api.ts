import type {
  User,
  Artist,
  QuizData,
  QuizResultSession,
  LeaderboardEntry,
  ArtistStat,
  AnswerRecord,
  AnalyticsOverview,
  AdminUserItem,
  DiagnosticsData,
} from '../types';

const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Auth
  async getAuthStatus(): Promise<{ spotifyConfigured: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/auth/status`);
    if (!res.ok) throw new Error('Failed to get auth status');
    return res.json();
  },

  async getCurrentUser(): Promise<User | null> {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user || null;
    } catch {
      return null;
    }
  },

  async register(payload: { email: string; password: string; displayName?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Registration failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  async login(payload: { email: string; password: string }): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  async demoLogin(name?: string): Promise<{ token: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to login as demo user');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST', headers: getAuthHeaders() });
  },

  // Spotify / Artist Search
  async getFeaturedArtists(): Promise<Artist[]> {
    const res = await fetch(`${API_BASE}/spotify/featured`);
    if (!res.ok) throw new Error('Failed to fetch featured artists');
    const data = await res.json();
    return data.artists || [];
  },

  async searchArtists(query: string): Promise<Artist[]> {
    const res = await fetch(`${API_BASE}/spotify/search?q=${encodeURIComponent(query)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to search artists');
    const data = await res.json();
    return data.artists || [];
  },

  // Quiz
  async generateQuiz(artistId: string, artistName: string): Promise<QuizData> {
    const res = await fetch(
      `${API_BASE}/quiz/generate?artistId=${encodeURIComponent(artistId)}&artistName=${encodeURIComponent(artistName)}`,
      { headers: getAuthHeaders() }
    );
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to generate quiz');
    }
    const data = await res.json();
    return data.quiz;
  },

  async submitQuiz(payload: {
    artistId: string;
    artistName: string;
    artistImage?: string;
    totalQuestions: number;
    timeTakenSeconds: number;
    answers: AnswerRecord[];
    guestName?: string;
  }): Promise<{ success: boolean; session: QuizResultSession }> {
    const res = await fetch(`${API_BASE}/quiz/submit`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to submit quiz');
    }
    return res.json();
  },

  // Leaderboard
  async getLeaderboard(artist?: string, limit: number = 50): Promise<LeaderboardEntry[]> {
    const params = new URLSearchParams();
    if (artist) params.set('artist', artist);
    if (limit) params.set('limit', limit.toString());

    const res = await fetch(`${API_BASE}/leaderboard?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    const data = await res.json();
    return data.leaderboard || [];
  },

  async getLeaderboardArtists(): Promise<ArtistStat[]> {
    const res = await fetch(`${API_BASE}/leaderboard/artists`);
    if (!res.ok) throw new Error('Failed to fetch leaderboard artists');
    const data = await res.json();
    return data.artists || [];
  },

  async getMyHistory(): Promise<{ history: any[]; stats: any }> {
    const res = await fetch(`${API_BASE}/leaderboard/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch personal stats');
    return res.json();
  },

  // Admin Panel APIs
  async getAdminAnalytics(forceRefresh = false): Promise<AnalyticsOverview> {
    const res = await fetch(`${API_BASE}/admin/analytics${forceRefresh ? '?refresh=true' : ''}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch admin analytics');
    }
    const data = await res.json();
    return data.analytics;
  },

  async rebuildAnalyticsCache(): Promise<{ success: boolean; message: string; computationTimeMs: number }> {
    const res = await fetch(`${API_BASE}/admin/rebuild-cache`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to rebuild cache');
    }
    return res.json();
  },

  async getAdminUsers(): Promise<AdminUserItem[]> {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to fetch users');
    }
    const data = await res.json();
    return data.users;
  },

  async updateUserRole(userId: string, role: 'USER' | 'ADMIN'): Promise<{ success: boolean; user: any }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to update user role');
    }
    return res.json();
  },

  async deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete user');
    }
    return res.json();
  },

  async getAdminRecentSessions(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/admin/recent-sessions`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch recent sessions');
    const data = await res.json();
    return data.sessions;
  },

  async getAdminDiagnostics(): Promise<DiagnosticsData> {
    const res = await fetch(`${API_BASE}/admin/diagnostics`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch diagnostics');
    return res.json();
  },
};
