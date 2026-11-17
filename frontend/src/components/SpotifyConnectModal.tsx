import React from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, ExternalLink, Radio } from 'lucide-react';
import { sounds } from '../utils/audioSynth';

interface SpotifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  isConfigured: boolean;
  onQuickStartGuest: (name: string) => void;
}

export const SpotifyConnectModal: React.FC<SpotifyModalProps> = ({
  isOpen,
  onClose,
  isConfigured,
  onQuickStartGuest,
}) => {
  const [guestName, setGuestName] = React.useState('');

  if (!isOpen) return null;

  const handleSpotifyLogin = () => {
    sounds.playClick();
    window.location.href = '/api/auth/spotify';
  };

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    onQuickStartGuest(guestName.trim() || 'GuestUser');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#08080B]/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-2xl text-[#F4F4F7] overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-full bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-full bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center shrink-0">
            <Radio className="w-6 h-6 text-[#1DB954]" />
          </div>
          <div>
            <h3 className="font-headline text-xl font-bold tracking-tight">Connect Spotify</h3>
            <p className="text-xs font-body text-[#8E8E9F]">
              Sign in to sync your Spotify profile & personal leaderboard ranks
            </p>
          </div>
        </div>

        {/* Spotify Integration Section */}
        {isConfigured ? (
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-[#12131A] border border-white/[0.08] text-xs text-[#D4FF32] flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#D4FF32] shrink-0 mt-0.5" />
              <span className="font-body text-[#F4F4F7]">
                Spotify OAuth 2.0 is active. Connect your Spotify account to show off your Spotify username on the soniq leaderboard!
              </span>
            </div>

            <button
              onClick={handleSpotifyLogin}
              className="w-full py-3 px-6 rounded-full font-headline font-bold text-black bg-[#1DB954] hover:bg-[#1ed760] transition-all shadow-md flex items-center justify-center gap-2.5 active:scale-[0.98]"
            >
              <Radio className="w-4 h-4" />
              <span>Authorize with Spotify</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-xl bg-[#12131A] border border-white/[0.08] text-xs text-[#8E8E9F] flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-[#FF4694] shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-headline font-bold block text-[#F4F4F7]">
                  Spotify API Key Not Configured
                </span>
                <span className="font-body text-[#8E8E9F]">
                  You can play soniq trivia and listen to real song audio previews right away in open mode!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-white/[0.08] w-full" />
          <span className="bg-[#0D0D11] px-3 font-mono text-[10px] uppercase text-[#8E8E9F]">
            Or Play as Guest
          </span>
        </div>

        {/* Guest Profile Form */}
        <form onSubmit={handleGuestSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-headline font-semibold text-[#8E8E9F] mb-1">
              Display Name / Handle:
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. alex_m"
              maxLength={24}
              className="w-full px-4 py-2.5 rounded-full bg-[#12131A] border border-white/[0.08] text-[#F4F4F7] placeholder-[#8E8E9F] focus:outline-none focus:border-[#D4FF32] text-xs sm:text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-6 rounded-full font-headline font-bold text-xs sm:text-sm bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <span>Continue as Guest</span>
          </button>
        </form>
      </div>
    </div>
  );
};
