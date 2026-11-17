import React from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, ExternalLink, Key } from 'lucide-react';
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
    onQuickStartGuest(guestName.trim() || 'SpeedRocker');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-[#0e1424] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 text-white overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            sounds.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#1DB954]/10 border border-[#1DB954]/30 flex items-center justify-center">
            <svg className="w-7 h-7 fill-[#1DB954]" viewBox="0 0 24 24">
              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.31c-.22.358-.691.474-1.049.255-2.884-1.764-6.514-2.162-10.793-1.185-.407.094-.814-.16-.908-.567-.094-.407.16-.814.567-.908 4.685-1.07 8.706-.615 11.928 1.356.358.22.474.691.255 1.049zm1.467-3.26c-.276.449-.867.594-1.316.318-3.303-2.03-8.337-2.617-12.244-1.431-.504.153-1.036-.134-1.189-.638-.153-.504.134-1.036.638-1.189 4.462-1.354 10.021-.697 13.793 1.624.449.276.594.867.318 1.316zm.126-3.398C15.137 8.36 8.618 8.136 4.845 9.282c-.611.186-1.26-.167-1.446-.778-.186-.611.167-1.26.778-1.446 4.333-1.315 11.536-1.056 16.035 1.615.549.326.731 1.041.405 1.59-.326.549-1.041.731-1.59.405z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold tracking-tight">Connect Spotify</h3>
            <p className="text-xs text-slate-400">
              Sign in to sync your Spotify profile & personal leaderboard ranks
            </p>
          </div>
        </div>

        {/* Spotify Integration Section */}
        {isConfigured ? (
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Spotify OAuth 2.0 is active on backend. Connect your Spotify account to play and show off your Spotify username on the leaderboard!
              </span>
            </div>

            <button
              onClick={handleSpotifyLogin}
              className="w-full py-3.5 px-6 rounded-2xl font-bold text-black bg-[#1DB954] hover:bg-[#1ed760] transition-all shadow-lg shadow-[#1DB954]/25 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.31c-.22.358-.691.474-1.049.255-2.884-1.764-6.514-2.162-10.793-1.185-.407.094-.814-.16-.908-.567-.094-.407.16-.814.567-.908 4.685-1.07 8.706-.615 11.928 1.356.358.22.474.691.255 1.049zm1.467-3.26c-.276.449-.867.594-1.316.318-3.303-2.03-8.337-2.617-12.244-1.431-.504.153-1.036-.134-1.189-.638-.153-.504.134-1.036.638-1.189 4.462-1.354 10.021-.697 13.793 1.624.449.276.594.867.318 1.316zm.126-3.398C15.137 8.36 8.618 8.136 4.845 9.282c-.611.186-1.26-.167-1.446-.778-.186-.611.167-1.26.778-1.446 4.333-1.315 11.536-1.056 16.035 1.615.549.326.731 1.041.405 1.59-.326.549-1.041.731-1.59.405z" />
              </svg>
              <span>Authorize with Spotify</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4 mb-6">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block text-amber-300">
                  Spotify API Key Not Yet Configured in .env
                </span>
                <span className="text-slate-300">
                  You can play quizzes and listen to real song audio previews right away in open mode! To enable Spotify OAuth login:
                </span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-black/40 border border-white/5 space-y-2 text-xs text-slate-300 font-mono">
              <p className="text-slate-400">Add to <code className="text-emerald-400">backend/.env</code>:</p>
              <div className="bg-slate-900/80 p-2.5 rounded-xl border border-white/5 text-[11px] leading-relaxed">
                <div>SPOTIFY_CLIENT_ID="your_client_id"</div>
                <div>SPOTIFY_CLIENT_SECRET="your_client_secret"</div>
              </div>
              <a
                href="https://developer.spotify.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 text-xs font-sans mt-1"
              >
                <span>Get Spotify Keys on Spotify Developer Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="border-t border-white/10 w-full" />
          <span className="bg-[#0e1424] px-3 text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Or Play as Guest
          </span>
        </div>

        {/* Guest Profile Form */}
        <form onSubmit={handleGuestSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Choose your Gamer Tag / Nickname:
            </label>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. SonicRiddim, BeatMaster99"
              maxLength={24}
              className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 text-sm transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-6 rounded-2xl font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Continue as Guest</span>
          </button>
        </form>
      </div>
    </div>
  );
};
