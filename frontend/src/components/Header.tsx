import React from 'react';
import {
  Volume2,
  VolumeX,
  Trophy,
  Radio,
  LogOut,
  Sparkles,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import type { User } from '../types';
import { sounds } from '../utils/audioSynth';

interface HeaderProps {
  user: User | null;
  onOpenAuthModal: () => void;
  onOpenLeaderboard: () => void;
  onOpenAdmin: () => void;
  onGoHome: () => void;
  activeView: 'home' | 'quiz' | 'summary' | 'leaderboard' | 'admin';
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuthModal,
  onOpenLeaderboard,
  onOpenAdmin,
  onGoHome,
  activeView,
  onLogout,
}) => {
  const [muted, setMuted] = React.useState(sounds.getMuted());

  const toggleSound = () => {
    const next = !muted;
    sounds.setMuted(next);
    setMuted(next);
    if (!next) sounds.playClick();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#090d16]/85 backdrop-blur-md px-3 sm:px-6 py-2.5 sm:py-3 transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => {
            sounds.playClick();
            onGoHome();
          }}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-indigo-600 to-purple-600 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#0d121f] rounded-[11px] flex items-center justify-center">
              <Radio className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            </div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                MATIKS
              </span>
              <span className="font-bold text-[10px] sm:text-xs uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                BEATS
              </span>
            </div>
            <span className="text-[10px] font-medium text-slate-400 hidden sm:inline">
              Speed Song Trivia • Guess in 15s
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Panel button (only for ADMIN users) */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAdmin();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                activeView === 'admin'
                  ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-500/20'
                  : 'bg-purple-500/15 text-purple-300 border-purple-500/30 hover:bg-purple-500/25'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
              <span>Admin</span>
            </button>
          )}

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenLeaderboard();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
              activeView === 'leaderboard'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-lg shadow-amber-500/10'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>

          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            title={muted ? 'Unmute sounds' : 'Mute sounds'}
            className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
          >
            {muted ? (
              <VolumeX className="w-4 h-4 text-rose-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          {/* User Profile / Auth Button */}
          {user && !user.isGuest ? (
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1 pr-2.5">
              <img
                src={user.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=player'}
                alt={user.displayName}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg object-cover bg-indigo-950"
              />
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white max-w-[80px] sm:max-w-[110px] truncate">
                  {user.displayName}
                </span>
                <span className="text-[9px] text-emerald-400 font-medium flex items-center gap-1">
                  {user.role === 'ADMIN' ? '👑 Admin' : user.isSpotifyConnected ? '🟢 Spotify' : '✓ Member'}
                </span>
              </div>
              <button
                onClick={() => {
                  sounds.playClick();
                  onLogout();
                }}
                title="Sign Out"
                className="ml-1 p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAuthModal();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{user?.isGuest ? 'Sign In / Register' : 'Sign In'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
