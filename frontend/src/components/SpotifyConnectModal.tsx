import React from 'react';
import { X, CheckCircle2, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import { sounds } from '../utils/audioSynth';
import type { User } from '../types';

interface SpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  user?: User | null;
}

// Official Spotify Logo SVG following Spotify Brand Guidelines
const SpotifyLogo = ({ className = "w-6 h-6" }: { className?: string }) => (
  <svg
    viewBox="0 0 168 168"
    className={className}
    fill="currentColor"
    role="img"
    aria-label="Spotify"
  >
    <path d="M83.996.002C37.607.002 0 37.608 0 83.998c0 46.393 37.607 83.999 83.996 83.999 46.39 0 83.998-37.606 83.998-84C167.994 37.609 130.386.002 83.996.002zm38.52 121.173a5.234 5.234 0 01-7.202 1.737c-19.728-12.05-44.56-14.773-73.805-8.08a5.244 5.244 0 01-2.348-10.222c32.023-7.33 59.432-4.22 81.618 9.363a5.236 5.236 0 011.737 7.202zm10.29-22.868a6.564 6.564 0 01-9.027 2.158c-22.584-13.882-57.01-17.904-83.722-9.796a6.565 6.565 0 01-3.83-12.553c30.548-9.273 68.514-4.78 94.42 11.164a6.565 6.565 0 012.16 9.027zm.89-23.82c-27.094-16.09-71.79-17.57-97.585-9.742a7.877 7.877 0 01-4.597-15.062c29.697-9.023 79.034-7.324 110.15 11.144a7.88 7.88 0 01-7.968 13.66z" />
  </svg>
);

export const SpotifyConnectModal: React.FC<SpotifyModalProps> = ({
  isOpen,
  onClose,
  isConfigured,
  user,
}) => {
  // If user is already connected or modal is closed, do not render
  if (!isOpen || user?.isSpotifyConnected) return null;

  const handleSpotifyConnect = () => {
    sounds.playClick();
    // Redirect to Spotify OAuth flow; pass auth token if available so it connects to current account
    window.location.href = '/api/auth/spotify';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08080B]/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0D0D11] border border-white/[0.1] rounded-3xl p-6 sm:p-8 shadow-2xl text-[#F4F4F7] overflow-hidden">
        {/* Subtle accent glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-[#1DB954]/15 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] transition-colors"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Official Header with Spotify Logo */}
        <div className="flex flex-col items-center text-center mb-6 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-[#12131A] border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954] shadow-lg mb-4">
            <SpotifyLogo className="w-10 h-10 text-[#1DB954]" />
          </div>
          <h3 className="font-headline text-2xl font-bold tracking-tight text-[#F4F4F7]">
            Connect Spotify
          </h3>
          <p className="text-xs font-body text-[#8E8E9F] mt-1.5 max-w-xs leading-relaxed">
            Link your Spotify to sync your public playlists, load custom quizzes, and save your scores.
          </p>
        </div>

        {/* What You Get / Info Box */}
        <div className="space-y-3 mb-6">
          <div className="p-3.5 rounded-2xl bg-[#12131A] border border-white/[0.08] space-y-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D4FF32]" />
              <span className="font-headline text-xs font-semibold text-[#F4F4F7]">
                Works with Free & Premium Accounts
              </span>
            </div>
            <p className="text-[11px] font-body text-[#8E8E9F] leading-relaxed">
              Whether you have Spotify Free or Premium, soniq streams high-fidelity 30-second audio previews with zero interruptions or audio restrictions.
            </p>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="px-2.5 py-0.5 rounded-full bg-[#181924] text-[10px] font-mono text-[#D4FF32] border border-[#D4FF32]/20">
                ✓ Free & Premium Supported
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#181924] text-[10px] font-mono text-[#B49BFF] border border-[#B49BFF]/20">
                ✓ Connects to your account
              </span>
            </div>
          </div>
        </div>

        {/* Primary Action Button - Spotify Brand Compliant */}
        <div className="space-y-3">
          <button
            onClick={handleSpotifyConnect}
            className="w-full py-3.5 px-6 rounded-full font-headline font-bold text-sm text-black bg-[#1DB954] hover:bg-[#1ed760] transition-all shadow-lg flex items-center justify-center gap-2.5 active:scale-[0.98]"
          >
            <SpotifyLogo className="w-5 h-5 text-black" />
            <span>Connect with Spotify</span>
          </button>

          {/* Simple Clean Link to Dismiss / Close */}
          <div className="text-center pt-2">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="text-xs font-mono text-[#8E8E9F] hover:text-[#F4F4F7] transition-colors"
            >
              Not now, keep playing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
