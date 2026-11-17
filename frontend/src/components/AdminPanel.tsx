import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RefreshCw,
  Users,
  Activity,
  BarChart3,
  Server,
  Database,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Target,
  Trophy,
  Loader2,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { sounds } from '../utils/audioSynth';
import type { AnalyticsOverview, AdminUserItem, DiagnosticsData } from '../types';

interface AdminPanelProps {
  onBack: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'users' | 'sessions' | 'diagnostics'>('analytics');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsOverview | null>(null);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebuildingCache, setIsRebuildingCache] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    loadTabContent();
  }, [activeTab]);

  const loadTabContent = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'analytics') {
        const data = await api.getAdminAnalytics();
        setAnalyticsData(data);
      } else if (activeTab === 'users') {
        const data = await api.getAdminUsers();
        setUsers(data);
      } else if (activeTab === 'sessions') {
        const data = await api.getAdminRecentSessions();
        setSessions(data);
      } else if (activeTab === 'diagnostics') {
        const data = await api.getAdminDiagnostics();
        setDiagnostics(data);
      }
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRebuildCache = async () => {
    sounds.playClick();
    setIsRebuildingCache(true);
    setFeedbackMessage(null);
    try {
      const res = await api.rebuildAnalyticsCache();
      const updated = await api.getAdminAnalytics(true);
      setAnalyticsData(updated);
      setFeedbackMessage(`Database cache index rebuilt in ${res.computationTimeMs}ms!`);
    } catch (err: any) {
      setFeedbackMessage('Failed to rebuild cache index: ' + err.message);
    } finally {
      setIsRebuildingCache(false);
    }
  };

  const handleToggleRole = async (userId: string, currentRole: 'USER' | 'ADMIN') => {
    sounds.playClick();
    const newRole = currentRole === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      await api.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setFeedbackMessage(`User role updated to ${newRole}`);
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to update role');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    sounds.playClick();
    try {
      await api.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setFeedbackMessage('User deleted successfully');
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to delete user');
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 animate-fade-in select-none">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onBack();
            }}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black text-white tracking-tight">Admin Console</h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Verified</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Database Cache Index & Analytics Engine • PostgreSQL
            </p>
          </div>
        </div>

        {/* Cache Index Rebuild Button */}
        <button
          onClick={handleRebuildCache}
          disabled={isRebuildingCache}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRebuildingCache ? 'animate-spin' : ''}`} />
          <span>{isRebuildingCache ? 'Rebuilding Index...' : 'Rebuild Analytics Cache Index'}</span>
        </button>
      </div>

      {/* Notification Banner */}
      {feedbackMessage && (
        <div className="mb-6 p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-slate-400 hover:text-white text-xs">
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-white/10 scrollbar-none">
        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('analytics');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'analytics'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics Dashboard</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('users');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('sessions');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'sessions'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Live Sessions</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setActiveTab('diagnostics');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeTab === 'diagnostics'
              ? 'bg-emerald-500 text-black shadow-md'
              : 'bg-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>System Diagnostics</span>
        </button>
      </div>

      {/* Tab Body */}
      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xs text-slate-400">Loading admin data...</span>
        </div>
      ) : activeTab === 'analytics' && analyticsData ? (
        /* Analytics Tab with Database Cache Metrics */
        <div className="space-y-6">
          {/* Cache Metadata Card */}
          <div className="p-4 rounded-2xl bg-[#101728] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300 font-semibold">
                Database Cache Index Status:
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-bold">
                Indexed in {analyticsData.cacheMetadata.computationTimeMs}ms
              </span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">
              Last updated: {new Date(analyticsData.cacheMetadata.lastUpdated).toLocaleTimeString()} • TTL: 5 min
            </div>
          </div>

          {/* 4 Core KPI Tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#101728] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mb-1">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Total Matches</span>
              </div>
              <div className="text-3xl font-black text-white font-mono">
                {analyticsData.totalQuizzes.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                across all artists
              </div>
            </div>

            <div className="bg-[#101728] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span>Registered Users</span>
              </div>
              <div className="text-3xl font-black text-indigo-300 font-mono">
                {analyticsData.totalUsers.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                players in DB
              </div>
            </div>

            <div className="bg-[#101728] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mb-1">
                <Target className="w-3.5 h-3.5 text-emerald-400" />
                <span>Global Accuracy</span>
              </div>
              <div className="text-3xl font-black text-emerald-400 font-mono">
                {analyticsData.globalAccuracy}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {analyticsData.totalCorrectAnswers} / {analyticsData.totalQuestionsAnswered} answered
              </div>
            </div>

            <div className="bg-[#101728] border border-white/10 rounded-2xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mb-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span>Total Play Time</span>
              </div>
              <div className="text-3xl font-black text-teal-300 font-mono">
                {Math.round(analyticsData.totalPlayTimeSeconds / 60)}m
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                fastest: {analyticsData.fastestGame}s
              </div>
            </div>
          </div>

          {/* Top Artists Performance Table */}
          <div className="bg-[#101728] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-white/5 font-bold text-sm text-white flex items-center justify-between">
              <span>Top Artists by Plays & Accuracy (Cached Aggregates)</span>
              <span className="text-xs text-slate-400 font-normal">Top 10</span>
            </div>

            <div className="divide-y divide-white/5">
              {analyticsData.topArtists.map((artist, idx) => (
                <div
                  key={artist.artistName}
                  className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-white/5 text-slate-400 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <img
                      src={artist.artistImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop&q=80'}
                      alt={artist.artistName}
                      className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0 border border-white/10"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-white text-sm sm:text-base truncate">
                        {artist.artistName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {artist.totalGames} games played • Avg Accuracy: {artist.avgAccuracy}%
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs uppercase text-slate-500 block font-semibold">
                      High Score
                    </span>
                    <span className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                      {artist.highScore.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'users' ? (
        /* User Management Tab */
        <div className="bg-[#101728] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 font-bold text-sm text-white flex items-center justify-between">
            <span>Registered Users Directory ({users.length})</span>
          </div>

          <div className="divide-y divide-white/5">
            {users.map((u) => (
              <div
                key={u.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={u.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                    alt={u.displayName}
                    className="w-10 h-10 rounded-xl object-cover bg-slate-800 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-white text-sm truncate">
                        {u.displayName}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-white/10 text-slate-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {u.email || 'Guest / Spotify Account'} • {u.totalGames} matches
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => handleToggleRole(u.id, u.role)}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-slate-300 hover:text-white border border-white/10 transition-colors"
                  >
                    {u.role === 'ADMIN' ? 'Demote to User' : 'Promote to Admin'}
                  </button>
                  <button
                    onClick={() => handleDeleteUser(u.id)}
                    className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : activeTab === 'sessions' ? (
        /* Live Recent Sessions Tab */
        <div className="bg-[#101728] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-white/5 font-bold text-sm text-white">
            Live Game Sessions Feed (Latest 30)
          </div>

          <div className="divide-y divide-white/5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-indigo-950/80 border border-indigo-500/20 flex items-center justify-center font-bold text-xs text-indigo-300 shrink-0">
                    {s.artistName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-white text-sm truncate">
                      {s.artistName}
                    </div>
                    <div className="text-xs text-slate-400">
                      Player: <span className="text-slate-200">{s.user?.displayName || s.guestName || 'Anonymous'}</span> •{' '}
                      {s.correctCount}/{s.totalQuestions} ({s.accuracy}%) in {s.timeTakenSeconds}s
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-black text-emerald-400 text-sm sm:text-base">
                    {s.score.toLocaleString()} pts
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {new Date(s.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Diagnostics Tab */
        diagnostics && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-[#101728] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2">
                  <Database className="w-4 h-4 text-emerald-400" />
                  <span>Database Engine</span>
                </div>
                <div className="text-xl font-black text-white">
                  {diagnostics.database.engine}
                </div>
                <div className="text-xs text-emerald-400 font-mono mt-1">
                  Latency: {diagnostics.database.latencyMs}ms • Connected
                </div>
              </div>

              <div className="bg-[#101728] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                  <span>Google Analytics</span>
                </div>
                <div className="text-xl font-black text-white">
                  {diagnostics.analytics.googleAnalyticsConfigured ? 'Active (GA4)' : 'Not Configured'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  via VITE_GA_MEASUREMENT_ID
                </div>
              </div>

              <div className="bg-[#101728] border border-white/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-slate-400 text-xs font-bold mb-2">
                  <Server className="w-4 h-4 text-amber-400" />
                  <span>Spotify API</span>
                </div>
                <div className="text-xl font-black text-white">
                  {diagnostics.spotify.configured ? 'Configured' : 'Open / Preview Mode'}
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  OAuth & API status
                </div>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
