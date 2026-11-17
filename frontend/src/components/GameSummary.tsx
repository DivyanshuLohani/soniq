import React, { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Clock,
  Target,
  Flame,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Award,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import type { QuizResultSession, AnswerRecord } from '../types';
import { sounds } from '../utils/audioSynth';

interface GameSummaryProps {
  session: QuizResultSession | null;
  answers: AnswerRecord[];
  totalTimeTaken: number;
  artistName: string;
  onPlayAgain: () => void;
  onPickNewArtist: () => void;
  onViewLeaderboard: () => void;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  session,
  answers,
  totalTimeTaken,
  artistName,
  onPlayAgain,
  onPickNewArtist,
  onViewLeaderboard,
}) => {
  // Mini audio player for question review
  const [playingTrackIndex, setPlayingTrackIndex] = useState<number | null>(null);
  const audioReviewRef = useRef<HTMLAudioElement | null>(null);

  // Trigger celebratory confetti burst on mount
  useEffect(() => {
    try {
      const end = Date.now() + 1500;
      const colors = ['#10B981', '#6366F1', '#F59E0B', '#EC4899'];

      (function frame() {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: colors,
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      })();
    } catch {
      // ignore
    }
  }, []);

  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = answers.length;
  const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgSpeed = totalQuestions > 0 ? (totalTimeTaken / totalQuestions).toFixed(1) : '0.0';

  // Find max streak in answers
  let maxStreak = 0;
  let currentStreak = 0;
  answers.forEach((a) => {
    if (a.isCorrect) {
      currentStreak++;
      if (currentStreak > maxStreak) maxStreak = currentStreak;
    } else {
      currentStreak = 0;
    }
  });

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8 flex flex-col items-center animate-fade-in select-none">
      <audio
        ref={audioReviewRef}
        onEnded={() => setPlayingTrackIndex(null)}
      />

      {/* Hero Victory Card */}
      <div className="w-full bg-gradient-to-b from-[#131b31] via-[#0f1629] to-[#0a0f1d] border border-white/10 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden mb-8 text-center">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-16 w-80 h-80 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Award className="w-4 h-4" />
          <span>Match Complete</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-2">
          {accuracyPercent >= 90
            ? 'LEGENDARY PERFORMANCE!'
            : accuracyPercent >= 70
            ? 'GREAT JOB!'
            : 'NICE TRY!'}
        </h2>

        <p className="text-slate-400 text-sm mb-6">
          You answered {totalQuestions} tracks by <span className="text-white font-bold">{artistName}</span>
        </p>

        {/* Big Score Display */}
        <div className="inline-flex flex-col items-center bg-black/40 border border-white/10 rounded-3xl px-8 py-5 mb-8 shadow-inner">
          <span className="text-xs uppercase font-extrabold tracking-widest text-slate-400">
            Final Score
          </span>
          <span className="text-5xl sm:text-6xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-300 bg-clip-text text-transparent font-mono my-1">
            {session ? session.score.toLocaleString() : '---'}
          </span>
          {session?.artistRank && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300 mt-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Rank #{session.artistRank} on {artistName} Leaderboard!</span>
            </div>
          )}
        </div>

        {/* 4 Matiks Key Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 max-w-xl mx-auto mb-6">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Target className="w-3.5 h-3.5 text-emerald-400" />
              <span>Accuracy</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {accuracyPercent}%
            </div>
            <div className="text-[10px] text-slate-400">
              {correctCount} / {totalQuestions}
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Clock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Total Time</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {totalTimeTaken.toFixed(1)}s
            </div>
            <div className="text-[10px] text-slate-400">
              clock speed
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Avg Speed</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {avgSpeed}s
            </div>
            <div className="text-[10px] text-slate-400">
              per song
            </div>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-3.5">
            <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Best Streak</span>
            </div>
            <div className="text-xl font-black text-white font-mono">
              {maxStreak}
            </div>
            <div className="text-[10px] text-slate-400">
              consecutive
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-black text-sm bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>PLAY AGAIN</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onPickNewArtist();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm bg-white/10 hover:bg-white/20 text-white border border-white/10 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Search className="w-4 h-4" />
            <span>CHOOSE ANOTHER ARTIST</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onViewLeaderboard();
            }}
            className="w-full sm:w-auto px-6 py-3.5 rounded-2xl font-bold text-sm bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>LEADERBOARDS</span>
          </button>
        </div>
      </div>

      {/* Question by Question Review */}
      <div className="w-full space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 px-1">
          Quiz Breakdown ({answers.length} Questions)
        </h3>

        <div className="space-y-2">
          {answers.map((item, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
                item.isCorrect
                  ? 'bg-emerald-500/5 border-emerald-500/20'
                  : 'bg-rose-500/5 border-rose-500/20'
              }`}
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="w-6 h-6 rounded-lg bg-white/5 text-slate-400 flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {idx + 1}
                </span>

                {/* Album Cover Thumbnail */}
                <img
                  src={item.albumCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                  alt={item.trackName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
                  }}
                  className="w-11 h-11 rounded-xl object-cover bg-slate-800 border border-white/10 shrink-0 shadow-sm"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-white text-sm sm:text-base truncate">
                      {item.trackName}
                    </h4>
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                  </div>

                  {!item.isCorrect && (
                    <p className="text-xs text-rose-300 truncate">
                      Your answer: <span className="line-through">{item.selectedTrackName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs font-mono text-slate-400">
                  {item.timeSpentSeconds.toFixed(1)}s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
