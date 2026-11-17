import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Clock,
  Target,
  Sparkles,
  ArrowLeft,
  Search,
  Filter,
  User as UserIcon,
  Crown,
  Loader2,
} from 'lucide-react';
import type { LeaderboardEntry, ArtistStat, User } from '../types';
import { sounds } from '../utils/audioSynth';

interface LeaderboardViewProps {
  onBack: () => void;
  currentUser: User | null;
  onSelectArtistToPlay: (artistName: string) => void;
  fetchLeaderboard: (artist?: string) => Promise<LeaderboardEntry[]>;
  fetchArtistStats: () => Promise<ArtistStat[]>;
  fetchMyHistory: () => Promise<{ history: any[]; stats: any }>;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  onBack,
  currentUser,
  onSelectArtistToPlay,
  fetchLeaderboard,
  fetchArtistStats,
  fetchMyHistory,
}) => {
  const [tab, setTab] = useState<'overall' | 'by-artist' | 'my-stats'>('overall');
  const [selectedArtist, setSelectedArtist] = useState<string>('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [artistStats, setArtistStats] = useState<ArtistStat[]>([]);
  const [myHistory, setMyHistory] = useState<any[]>([]);
  const [myStats, setMyStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load leaderboard entries
  useEffect(() => {
    loadData();
  }, [tab, selectedArtist]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (tab === 'overall') {
        const data = await fetchLeaderboard();
        setEntries(data);
      } else if (tab === 'by-artist') {
        const stats = await fetchArtistStats();
        setArtistStats(stats);
        const artistToQuery = selectedArtist || (stats[0]?.artistName || '');
        if (artistToQuery && !selectedArtist) {
          setSelectedArtist(artistToQuery);
        }
        if (artistToQuery) {
          const data = await fetchLeaderboard(artistToQuery);
          setEntries(data);
        }
      } else if (tab === 'my-stats') {
        const data = await fetchMyHistory();
        setMyHistory(data.history || []);
        setMyStats(data.stats || null);
      }
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const top3 = entries.slice(0, 3);
  const restOfEntries = entries.slice(3);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-8 animate-fade-in select-none">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs sm:text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Arena</span>
        </button>

        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            HALL OF FAME
          </h2>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-center gap-2 mb-8 p-1.5 bg-[#101728] border border-white/10 rounded-2xl max-w-md mx-auto">
        <button
          onClick={() => {
            sounds.playClick();
            setTab('overall');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tab === 'overall'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Overall Top
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setTab('by-artist');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tab === 'by-artist'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          By Artist
        </button>
        <button
          onClick={() => {
            sounds.playClick();
            setTab('my-stats');
          }}
          className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            tab === 'my-stats'
              ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          My History
        </button>
      </div>

      {/* Artist Filter Pills (When on "By Artist" tab) */}
      {tab === 'by-artist' && artistStats.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {artistStats.map((ast) => (
              <button
                key={ast.artistName}
                onClick={() => {
                  sounds.playClick();
                  setSelectedArtist(ast.artistName);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedArtist === ast.artistName
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-500/20'
                    : 'bg-white/5 text-slate-300 border-white/5 hover:bg-white/10'
                }`}
              >
                {ast.artistName} ({ast.totalGames} played)
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
          <span className="text-xs text-slate-400">Loading leaderboard stats...</span>
        </div>
      ) : tab === 'my-stats' ? (
        /* My Personal Stats & History */
        <div className="space-y-6">
          {myStats && myStats.totalGames > 0 ? (
            <>
              {/* Stat summary cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-[#101728] border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-xs text-slate-400 font-bold mb-1">Total Quizzes</div>
                  <div className="text-2xl font-black text-white font-mono">
                    {myStats.totalGames}
                  </div>
                </div>
                <div className="bg-[#101728] border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-xs text-slate-400 font-bold mb-1">High Score</div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {myStats.bestScore.toLocaleString()}
                  </div>
                </div>
                <div className="bg-[#101728] border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-xs text-slate-400 font-bold mb-1">Avg Accuracy</div>
                  <div className="text-2xl font-black text-indigo-400 font-mono">
                    {myStats.averageAccuracy}%
                  </div>
                </div>
                <div className="bg-[#101728] border border-white/10 rounded-2xl p-4 text-center">
                  <div className="text-xs text-slate-400 font-bold mb-1">Fastest Match</div>
                  <div className="text-2xl font-black text-amber-400 font-mono">
                    {myStats.fastestGame}s
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-[#101728] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-4 border-b border-white/5 font-bold text-sm text-slate-300">
                  Past Matches
                </div>
                <div className="divide-y divide-white/5">
                  {myHistory.map((h, i) => (
                    <div
                      key={h.id || i}
                      className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-950 flex items-center justify-center font-bold text-white text-xs">
                          {h.artistName.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-sm">
                            {h.artistName}
                          </div>
                          <div className="text-xs text-slate-400">
                            {h.correctCount}/{h.totalQuestions} correct ({h.accuracy}%) • {h.timeTakenSeconds}s
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-mono font-black text-emerald-400 text-base">
                          {h.score.toLocaleString()} pts
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(h.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-[#101728] border border-white/10 rounded-3xl p-8">
              <Sparkles className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-lg font-black text-white mb-1">No Matches Played Yet</h3>
              <p className="text-xs text-slate-400 mb-6">
                Pick an artist, play your first quiz, and your high score will be immortalized here!
              </p>
              <button
                onClick={() => {
                  sounds.playClick();
                  onBack();
                }}
                className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs"
              >
                Play Now
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Overall or By-Artist Leaderboard */
        <div className="space-y-8">
          {/* Top 3 Podium (Matiks style) */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-4">
              {/* 2nd Place */}
              {top3[1] && (
                <div className="order-2 md:order-1 bg-[#101728]/90 border border-slate-500/30 rounded-3xl p-5 text-center shadow-xl relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-3 right-3 text-2xl font-black text-slate-400">
                    🥈
                  </div>
                  <img
                    src={top3[1].playerAvatar}
                    alt={top3[1].playerName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-400 shadow-md mb-3"
                  />
                  <span className="text-sm font-black text-white truncate max-w-[160px]">
                    {top3[1].playerName}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[160px] mb-2">
                    {top3[1].artistName}
                  </span>
                  <div className="text-2xl font-black text-slate-200 font-mono">
                    {top3[1].score.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {top3[1].accuracy}% acc • {top3[1].timeTakenSeconds}s
                  </div>
                </div>
              )}

              {/* 1st Place Champion */}
              {top3[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/20 via-[#131b2e] to-[#0d1322] border-2 border-amber-400 rounded-3xl p-6 text-center shadow-2xl relative overflow-hidden flex flex-col items-center scale-105 z-10">
                  <div className="absolute top-3 right-3 text-3xl font-black text-amber-400 animate-bounce-subtle">
                    👑
                  </div>
                  <img
                    src={top3[0].playerAvatar}
                    alt={top3[0].playerName}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg mb-3"
                  />
                  <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black uppercase tracking-wider mb-1">
                    Champion
                  </div>
                  <span className="text-base font-black text-white truncate max-w-[180px]">
                    {top3[0].playerName}
                  </span>
                  <span className="text-xs text-slate-300 truncate max-w-[180px] mb-2">
                    {top3[0].artistName}
                  </span>
                  <div className="text-3xl font-black text-amber-400 font-mono">
                    {top3[0].score.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    {top3[0].accuracy}% acc • {top3[0].timeTakenSeconds}s
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {top3[2] && (
                <div className="order-3 bg-[#101728]/90 border border-amber-700/30 rounded-3xl p-5 text-center shadow-xl relative overflow-hidden flex flex-col items-center">
                  <div className="absolute top-3 right-3 text-2xl font-black text-amber-600">
                    🥉
                  </div>
                  <img
                    src={top3[2].playerAvatar}
                    alt={top3[2].playerName}
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-700 shadow-md mb-3"
                  />
                  <span className="text-sm font-black text-white truncate max-w-[160px]">
                    {top3[2].playerName}
                  </span>
                  <span className="text-xs text-slate-400 truncate max-w-[160px] mb-2">
                    {top3[2].artistName}
                  </span>
                  <div className="text-2xl font-black text-amber-500/90 font-mono">
                    {top3[2].score.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-1">
                    {top3[2].accuracy}% acc • {top3[2].timeTakenSeconds}s
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Table */}
          <div className="bg-[#101728] border border-white/10 rounded-3xl overflow-hidden shadow-xl">
            <div className="grid grid-cols-12 gap-2 p-4 border-b border-white/5 text-[11px] uppercase tracking-wider font-extrabold text-slate-400">
              <span className="col-span-1 text-center">Rank</span>
              <span className="col-span-4 sm:col-span-4">Player</span>
              <span className="col-span-3 sm:col-span-3">Artist</span>
              <span className="col-span-2 text-right">Speed</span>
              <span className="col-span-2 text-right">Score</span>
            </div>

            <div className="divide-y divide-white/5">
              {entries.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 p-3.5 sm:p-4 items-center hover:bg-white/5 transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1 text-center font-mono font-black text-sm">
                    {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : `#${item.rank}`}
                  </div>

                  {/* Player info */}
                  <div className="col-span-4 sm:col-span-4 flex items-center gap-2.5 min-w-0">
                    <img
                      src={item.playerAvatar}
                      alt={item.playerName}
                      className="w-8 h-8 rounded-xl object-cover bg-slate-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <span className="font-bold text-white text-xs sm:text-sm truncate block">
                        {item.playerName}
                      </span>
                      {item.isSpotifyUser && (
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Spotify
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Artist */}
                  <div className="col-span-3 sm:col-span-3 min-w-0">
                    <span className="font-semibold text-slate-300 text-xs sm:text-sm truncate block">
                      {item.artistName}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {item.correctCount}/{item.totalQuestions} correct
                    </span>
                  </div>

                  {/* Speed */}
                  <div className="col-span-2 text-right font-mono text-xs sm:text-sm text-slate-400">
                    {item.timeTakenSeconds}s
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-right font-mono font-black text-sm sm:text-base text-emerald-400">
                    {item.score.toLocaleString()}
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-400">
                  No records yet. Be the first to play and set the record!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
