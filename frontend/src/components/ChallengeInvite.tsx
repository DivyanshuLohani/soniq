import React from 'react';
import { Play, Trophy, Sparkles, ArrowRight, Music, Flame, Award } from 'lucide-react';
import { sounds } from '../utils/audioSynth';

interface ChallengeInviteProps {
  challenge: {
    id: string;
    inviterName: string;
    inviterAvatar?: string;
    artistId: string;
    artistName: string;
    artistImage?: string;
    score: number;
    accuracy: number;
    totalQuestions: number;
  };
  onStartChallenge: () => void;
  onExploreOther: () => void;
  isLoading: boolean;
}

export const ChallengeInvite: React.FC<ChallengeInviteProps> = ({
  challenge,
  onStartChallenge,
  onExploreOther,
  isLoading,
}) => {
  return (
    <div className="w-full max-w-xl mx-auto px-4 py-10 flex flex-col items-center animate-fade-in select-none">
      <div className="w-full bg-[#0D0D11] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden text-center flex flex-col items-center">
        {/* Glow ambient background */}
        <div className="absolute -top-24 -left-24 w-52 h-52 bg-[#D4FF32]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-52 h-52 bg-[#B49BFF]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Invited Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#12131A] border border-white/[0.1] text-xs font-mono text-[#D4FF32] mb-5 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#D4FF32]" />
          <span>You&apos;ve Been Challenged!</span>
        </div>

        {/* Inviter Avatar & Name */}
        <div className="flex items-center gap-3 mb-6 bg-[#12131A]/80 border border-white/[0.08] px-4 py-2 rounded-full">
          <img
            src={challenge.inviterAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(challenge.inviterName)}&backgroundColor=12131a&textColor=d4ff32`}
            alt={challenge.inviterName}
            className="w-7 h-7 rounded-full object-cover border border-[#D4FF32]/40"
          />
          <span className="text-xs sm:text-sm font-headline font-semibold text-[#F4F4F7]">
            <span className="text-[#D4FF32]">{challenge.inviterName}</span> invited you to beat their score
          </span>
        </div>

        {/* Artist / Quiz Showcase */}
        <div className="relative my-2">
          {challenge.artistImage ? (
            <img
              src={challenge.artistImage}
              alt={challenge.artistName}
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-2xl border-2 border-white/[0.12]"
            />
          ) : (
            <div className="w-32 h-32 rounded-2xl bg-[#12131A] border border-white/[0.12] flex items-center justify-center">
              <Music className="w-12 h-12 text-[#D4FF32]" />
            </div>
          )}
        </div>

        <div className="mt-3 mb-4 space-y-1">
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#8E8E9F]">
            {challenge.artistId.startsWith('playlist_') ? 'SPOTIFY PLAYLIST QUIZ' : 'ARTIST QUIZ'}
          </span>
          <h1 className="font-headline text-3xl sm:text-4xl font-black text-[#F4F4F7] tracking-tight">
            {challenge.artistName}
          </h1>
        </div>

        {/* Inviter's Benchmark to beat */}
        <div className="w-full bg-[#12131A] border border-white/[0.08] rounded-2xl p-4 my-3 text-center">
          <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
            SCORE TO BEAT
          </span>
          <div className="font-mono text-4xl sm:text-5xl font-black text-[#D4FF32] my-0.5 tracking-tight">
            {challenge.score.toLocaleString()} <span className="text-xs font-mono text-[#8E8E9F]">PTS</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#8E8E9F] mt-1">
            <span>{challenge.accuracy}% Accuracy</span>
            <span>•</span>
            <span>{challenge.totalQuestions} Questions</span>
          </div>
        </div>

        {/* Big Start Quiz Button (unlocks web audio on explicit user interaction) */}
        <div className="w-full space-y-3 mt-4">
          <button
            onClick={() => {
              sounds.playClick();
              onStartChallenge();
            }}
            disabled={isLoading}
            className="w-full py-4 px-6 rounded-full font-headline font-bold text-sm sm:text-base bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(212,255,50,0.35)] disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Loading Songs...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                <span>Accept Challenge & Start Quiz</span>
              </>
            )}
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onExploreOther();
            }}
            className="text-xs font-mono text-[#8E8E9F] hover:text-[#F4F4F7] transition-colors py-1"
          >
            Or browse other artists
          </button>
        </div>
      </div>
    </div>
  );
};
