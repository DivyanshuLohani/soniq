import React, { useRef, useState } from 'react';
import {
  Clock,
  Target,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  BarChart2,
  Layers,
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
  const correctCount = answers.filter((a) => a.isCorrect).length;
  const totalQuestions = answers.length;
  const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgSpeed = totalQuestions > 0 ? (totalTimeTaken / totalQuestions).toFixed(2) : '0.00';

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
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center animate-fade-in select-none">
      {/* Session Report Header Card */}
      <div className="w-full bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#12131A] border border-white/[0.08] text-[11px] font-mono text-[#8E8E9F] mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF32]" />
              <span>Assessment Completed</span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#F4F4F7] tracking-tight">
              Session Performance Report
            </h2>
            <p className="text-xs font-body text-[#8E8E9F] mt-0.5">
              Catalog: <span className="text-[#F4F4F7] font-semibold">{artistName}</span> • 10 Audio Excerpts Evaluated
            </p>
          </div>

          {session?.artistRank && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12131A] border border-white/[0.08] text-xs font-mono text-[#D4FF32]">
              <Trophy className="w-3.5 h-3.5 text-[#D4FF32]" />
              <span>Leaderboard Rank #{session.artistRank}</span>
            </div>
          )}
        </div>

        {/* 4 Precision Telemetry Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-3.5">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
              Score
            </span>
            <span className="font-mono text-2xl font-bold text-[#D4FF32]">
              {session ? session.score.toLocaleString() : '---'}
            </span>
            <span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
              Pts Earned
            </span>
          </div>

          <div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-3.5">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
              Accuracy
            </span>
            <span className="font-mono text-2xl font-bold text-[#F4F4F7]">
              {accuracyPercent}%
            </span>
            <span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
              {correctCount} / {totalQuestions} Matched
            </span>
          </div>

          <div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-3.5">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
              Mean Latency
            </span>
            <span className="font-mono text-2xl font-bold text-[#F4F4F7]">
              {avgSpeed}s
            </span>
            <span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
              Per Excerpt
            </span>
          </div>

          <div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-3.5">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
              Streak
            </span>
            <span className="font-mono text-2xl font-bold text-[#B49BFF]">
              {maxStreak}
            </span>
            <span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
              Max Consecutive
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retest Catalog</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onPickNewArtist();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#12131A] hover:bg-[#181924] text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-2 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Select Another Artist</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onViewLeaderboard();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-2 transition-all"
          >
            <Trophy className="w-3.5 h-3.5 text-[#D4FF32]" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Excerpt Identification Audit Breakdown */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F4F4F7]">
            Excerpt Recognition Breakdown
          </h3>
          <span className="font-mono text-xs text-[#8E8E9F]">
            {correctCount} / {answers.length} Correct
          </span>
        </div>

        <div className="space-y-1.5">
          {answers.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                item.isCorrect
                  ? 'bg-[#0D0D11] border-white/[0.08]'
                  : 'bg-[#0D0D11] border-[#FF4694]/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-md bg-[#12131A] text-[#8E8E9F] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <img
                  src={item.albumCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                  alt={item.trackName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
                  }}
                  className="w-10 h-10 rounded-lg object-cover bg-[#08080B] border border-white/[0.08] shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-semibold text-xs sm:text-sm text-[#F4F4F7] truncate">
                      {item.trackName}
                    </h4>
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FF32] shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#FF4694] shrink-0" />
                    )}
                  </div>

                  {!item.isCorrect && (
                    <p className="text-[11px] text-[#FF4694] font-body truncate mt-0.5">
                      Selected: <span className="line-through text-[#8E8E9F]">{item.selectedTrackName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs font-mono text-[#8E8E9F]">
                  {item.timeSpentSeconds.toFixed(2)}s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
