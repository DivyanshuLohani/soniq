import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Sparkles, Headphones, Trophy, HelpCircle, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audioSynth';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in text-[#F4F4F7] select-none">
      {/* Back to Home Button */}
      <Link
        to="/"
        onClick={() => sounds.playClick()}
        className="inline-flex items-center gap-2 text-xs font-mono text-[#8E8E9F] hover:text-[#D4FF32] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Home</span>
      </Link>

      {/* Header */}
      <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#12131A] border border-white/[0.08] text-[11px] font-mono text-[#D4FF32] mb-3">
          <Sparkles className="w-3.5 h-3.5 text-[#D4FF32]" />
          <span>The Music Guesser Game</span>
        </div>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight">
          About soniq
        </h1>
        <p className="text-xs sm:text-sm font-body text-[#8E8E9F] mt-2 max-w-2xl leading-relaxed">
          The ultimate music quiz where you hear a clip, guess the track, and flex your music knowledge.
          Pick any artist, test your ear, and compete on the global leaderboard.
        </p>
        <p className="text-xs font-mono text-[#8E8E9F] mt-3">
          Built and curated by{' '}
          <a
            href="https://dibbu.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#D4FF32] hover:underline font-semibold"
          >
            Divyanshu Lohani (dibbu.dev)
          </a>.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#D4FF32]/10 border border-[#D4FF32]/20 flex items-center justify-center text-[#D4FF32]">
            <Headphones className="w-4 h-4" />
          </div>
          <h3 className="font-headline font-semibold text-sm text-[#F4F4F7]">Instant Song Previews</h3>
          <p className="text-xs text-[#8E8E9F] leading-relaxed">
            High-quality 30-second clips that play instantly. Works seamlessly for Spotify Free and Premium users alike.
          </p>
        </div>

        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#B49BFF]/10 border border-[#B49BFF]/20 flex items-center justify-center text-[#B49BFF]">
            <Trophy className="w-4 h-4" />
          </div>
          <h3 className="font-headline font-semibold text-sm text-[#F4F4F7]">Speed & Streaks</h3>
          <p className="text-xs text-[#8E8E9F] leading-relaxed">
            The faster you guess, the more points you get. Chain consecutive correct answers to unlock massive streak multipliers.
          </p>
        </div>

        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-xl p-5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-[#FF4694]/10 border border-[#FF4694]/20 flex items-center justify-center text-[#FF4694]">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="font-headline font-semibold text-sm text-[#F4F4F7]">Challenging Options</h3>
          <p className="text-xs text-[#8E8E9F] leading-relaxed">
            All wrong choices come from the exact same artist so you can&apos;t just guess by elimination.
          </p>
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#D4FF32]" />
          <h2 className="font-headline text-lg font-bold text-[#F4F4F7]">
            Frequently Asked Questions (FAQ)
          </h2>
        </div>

        <div className="space-y-4 text-xs sm:text-sm font-body text-[#8E8E9F]">
          <div className="border-b border-white/[0.06] pb-4 space-y-1">
            <h4 className="font-headline font-semibold text-[#F4F4F7]">
              Do I need a Spotify Premium subscription to play?
            </h4>
            <p>
              No! While Spotify&apos;s Web Playback SDK requires Premium for full track streaming, soniq utilizes a dual-source audio CDN preview pipeline. You can play, listen to excerpts, and compete whether you have Spotify Free, Spotify Premium, or a guest profile.
            </p>
          </div>

          <div className="border-b border-white/[0.06] pb-4 space-y-1">
            <h4 className="font-headline font-semibold text-[#F4F4F7]">
              How is the assessment score calculated?
            </h4>
            <p>
              Each correct answer awards 1,000 base points. Rapid answers receive speed bonus points (up to 500 points per question depending on sub-second reaction time), multiplied by your active consecutive streak.
            </p>
          </div>

          <div className="space-y-1">
            <h4 className="font-headline font-semibold text-[#F4F4F7]">
              Can I use keyboard shortcuts?
            </h4>
            <p>
              Yes! Use keys <code className="text-[#D4FF32] font-mono">[1]</code>, <code className="text-[#D4FF32] font-mono">[2]</code>, and <code className="text-[#D4FF32] font-mono">[3]</code> to select options, and <code className="text-[#D4FF32] font-mono">[Space]</code> to pause or resume audio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
