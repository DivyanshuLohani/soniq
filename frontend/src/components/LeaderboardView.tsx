import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Clock,
  Target,
  ArrowLeft,
  Filter,
  User as UserIcon,
  Crown,
  Loader2,
  Radio,
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
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 animate-fade-in select-none">
      {/* Top back navigation */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => {
            sounds.playClick();
            onBack();
          }}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] text-xs font-headline font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </button>

        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-[#D4FF32]" />
          <h2 className="font-headline text-lg sm:text-xl font-bold text-[#F4F4F7] tracking-tight">
            Top Players & High Scores
          </h2>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 border-b border-white/[0.08] scrollbar-none">
        <button
          onClick={() => {
            sounds.playClick();
            setTab('overall');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-headline text-xs sm:text-sm font-semibold transition-all ${
            tab === 'overall'
              ? 'bg-[#D4FF32] text-[#08080B]'
              : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>Top Scores</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setTab('by-artist');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-headline text-xs sm:text-sm font-semibold transition-all ${
            tab === 'by-artist'
              ? 'bg-[#D4FF32] text-[#08080B]'
              : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08]'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>By Artist</span>
        </button>

        <button
          onClick={() => {
            sounds.playClick();
            setTab('my-stats');
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-headline text-xs sm:text-sm font-semibold transition-all ${
            tab === 'my-stats'
              ? 'bg-[#D4FF32] text-[#08080B]'
              : 'bg-[#12131A] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08]'
          }`}
        >
          <UserIcon className="w-3.5 h-3.5" />
          <span>Session History</span>
        </button>
      </div>

      {/* Artist selector pill row */}
      {tab === 'by-artist' && (
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {artistStats.map((a) => (
            <button
              key={a.artistName}
              onClick={() => {
                sounds.playClick();
                setSelectedArtist(a.artistName);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-medium whitespace-nowrap transition-all border ${
                selectedArtist.toLowerCase() === a.artistName.toLowerCase()
                  ? 'bg-[#B49BFF] text-[#08080B] border-[#B49BFF]'
                  : 'bg-[#12131A] text-[#8E8E9F] border-white/[0.08] hover:text-[#F4F4F7]'
              }`}
            >
              {a.artistName} ({a.totalGames})
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4FF32]" />
          <span className="text-xs font-mono text-[#8E8E9F]">Loading rankings...</span>
        </div>
      ) : tab === 'my-stats' ? (
        /* My History Tab */
        <div className="space-y-6">
          {myStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl p-4">
                <span className="text-xs text-[#8E8E9F] font-mono block mb-1">Games Played</span>
                <span className="font-mono text-2xl font-bold text-[#F4F4F7]">
                  {myStats.totalGames}
                </span>
              </div>
              <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl p-4">
                <span className="text-xs text-[#8E8E9F] font-mono block mb-1">Top Score</span>
                <span className="font-mono text-2xl font-bold text-[#D4FF32]">
                  {myStats.highScore?.toLocaleString() || 0}
                </span>
              </div>
              <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl p-4">
                <span className="text-xs text-[#8E8E9F] font-mono block mb-1">Accuracy</span>
                <span className="font-mono text-2xl font-bold text-[#B49BFF]">
                  {myStats.avgAccuracy}%
                </span>
              </div>
              <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl p-4">
                <span className="text-xs text-[#8E8E9F] font-mono block mb-1">Fastest Run</span>
                <span className="font-mono text-2xl font-bold text-[#F4F4F7]">
                  {myStats.fastestGame}s
                </span>
              </div>
            </div>
          )}

          <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-white/[0.08] font-headline font-semibold text-xs sm:text-sm text-[#F4F4F7]">
              Past Games
            </div>
            {myHistory.length > 0 ? (
              <div className="divide-y divide-white/[0.06]">
                {myHistory.map((h) => (
                  <div
                    key={h.id}
                    className="p-3.5 sm:p-4 flex items-center justify-between hover:bg-[#12131A] transition-colors"
                  >
                    <div>
                      <h4 className="font-headline font-semibold text-sm text-[#F4F4F7]">
                        {h.artistName}
                      </h4>
                      <p className="text-xs text-[#8E8E9F] font-mono mt-0.5">
                        {h.correctCount}/{h.totalQuestions} ({h.accuracy}%) in {h.timeTakenSeconds}s • {new Date(h.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="font-mono font-bold text-sm text-[#D4FF32]">
                      {h.score.toLocaleString()} pts
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-[#8E8E9F] font-body">
                No assessments logged yet. Run an evaluation from the catalog to see your history.
              </div>
            )}
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="py-20 text-center space-y-3">
          <Trophy className="w-8 h-8 text-[#8E8E9F] mx-auto" />
          <h3 className="font-headline font-semibold text-base text-[#F4F4F7]">
            No benchmark entries recorded
          </h3>
          <p className="text-xs text-[#8E8E9F] font-body">Complete a session on this catalog to register your benchmark.</p>
        </div>
      ) : (
        /* Overall or By-Artist Leaderboard */
        <div className="space-y-6">
          {/* Top 3 Summary Cards */}
          {top3.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {top3.map((item, idx) => {
                const borderAccent =
                  idx === 0
                    ? 'border-[#D4FF32]/50 bg-[#0D0D11]'
                    : idx === 1
                    ? 'border-[#B49BFF]/40 bg-[#0D0D11]'
                    : 'border-white/[0.1] bg-[#0D0D11]';

                const rankText = idx === 0 ? '#1' : idx === 1 ? '#2' : '#3';

                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 flex items-center justify-between gap-3 ${borderAccent}`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#181924] border border-white/[0.08] flex items-center justify-center font-mono text-xs font-bold text-[#D4FF32] shrink-0">
                        {item.playerName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline font-semibold text-sm text-[#F4F4F7] truncate">
                            {item.playerName}
                          </span>
                          <span className="font-mono text-[10px] text-[#8E8E9F]">
                            {rankText}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-[#8E8E9F] truncate">
                          {item.artistName} • {item.accuracy}% acc
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono font-bold text-sm text-[#D4FF32]">
                        {item.score.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-mono text-[#8E8E9F]">
                        {item.timeTakenSeconds}s
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full Table */}
          <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 gap-2 p-3 sm:p-3.5 border-b border-white/[0.08] text-[10px] uppercase tracking-wider font-mono text-[#8E8E9F]">
              <span className="col-span-1 text-center">Rank</span>
              <span className="col-span-4">User</span>
              <span className="col-span-3">Artist</span>
              <span className="col-span-2 text-right">Speed</span>
              <span className="col-span-2 text-right">Score</span>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {entries.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-12 gap-2 p-3 items-center hover:bg-[#12131A] transition-colors"
                >
                  {/* Rank */}
                  <div className="col-span-1 text-center font-mono text-xs text-[#8E8E9F]">
                    {String(item.rank).padStart(2, '0')}
                  </div>

                  {/* Player info */}
                  <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-full bg-[#181924] border border-white/[0.08] flex items-center justify-center font-mono text-[10px] text-[#D4FF32] shrink-0">
                      {item.playerName.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <span className="font-headline font-medium text-[#F4F4F7] text-xs sm:text-sm truncate block">
                        {item.playerName}
                      </span>
                      {item.isSpotifyUser && (
                        <span className="text-[9px] text-[#D4FF32] font-mono flex items-center gap-1">
                          <Radio className="w-2.5 h-2.5 text-[#D4FF32]" />
                          Spotify
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Artist */}
                  <div className="col-span-3 text-xs text-[#8E8E9F] font-mono truncate">
                    {item.artistName}
                  </div>

                  {/* Latency */}
                  <div className="col-span-2 text-right font-mono text-xs text-[#8E8E9F]">
                    {item.timeTakenSeconds}s
                  </div>

                  {/* Score */}
                  <div className="col-span-2 text-right font-mono font-bold text-xs sm:text-sm text-[#D4FF32]">
                    {item.score.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
