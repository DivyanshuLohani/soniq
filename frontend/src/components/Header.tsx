import React from 'react';
import {
  Volume2,
  VolumeX,
  Trophy,
  Disc3,
  LogOut,
  ShieldCheck,
  Radio,
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

  const userInitials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : 'U';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08080B]/95 backdrop-blur-md px-4 sm:px-8 py-3 transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <div
          onClick={() => {
            sounds.playClick();
            onGoHome();
          }}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#12131A] border border-white/[0.12] group-hover:border-[#D4FF32] transition-colors">
            <span className="w-2 h-2 rounded-full bg-[#D4FF32]" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-headline font-bold text-xl tracking-tight text-[#F4F4F7]">
              soniq
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E9F] hidden sm:inline">
              Catalog Intelligence
            </span>
          </div>
        </div>

        {/* Center Navigation Links */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Catalog Link */}
          <button
            onClick={() => {
              sounds.playClick();
              onGoHome();
            }}
            className={`px-3 py-1.5 rounded-full text-xs font-headline font-semibold transition-colors ${
              activeView === 'home'
                ? 'bg-[#181924] text-[#F4F4F7] border border-white/[0.12]'
                : 'text-[#8E8E9F] hover:text-[#F4F4F7]'
            }`}
          >
            Catalog
          </button>

          {/* Leaderboard Link */}
          <button
            onClick={() => {
              sounds.playClick();
              onOpenLeaderboard();
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-headline font-semibold transition-colors ${
              activeView === 'leaderboard'
                ? 'bg-[#181924] text-[#F4F4F7] border border-white/[0.12]'
                : 'text-[#8E8E9F] hover:text-[#F4F4F7]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#D4FF32]" />
            <span>Leaderboard</span>
          </button>

          {/* Admin Console (Admin users only) */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAdmin();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-headline font-semibold transition-all border ${
                activeView === 'admin'
                  ? 'bg-[#B49BFF] text-[#08080B] border-[#B49BFF]'
                  : 'bg-[#181924] text-[#B49BFF] border-[#B49BFF]/30 hover:border-[#B49BFF]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
          )}

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={muted ? 'Unmute audio feedback' : 'Mute audio feedback'}
            className="p-1.5 rounded-full bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] transition-colors"
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-[#8E8E9F]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#D4FF32]" />
            )}
          </button>

          {/* User Account / Profile */}
          {user && !user.isGuest ? (
            <div className="flex items-center gap-2 bg-[#12131A] border border-white/[0.08] rounded-full p-1 pl-1.5 pr-2">
              <div className="w-6 h-6 rounded-full bg-[#181924] border border-white/[0.1] flex items-center justify-center font-mono text-[10px] font-bold text-[#D4FF32]">
                {userInitials}
              </div>
              <span className="text-xs font-headline font-medium text-[#F4F4F7] max-w-[90px] sm:max-w-[120px] truncate">
                {user.displayName}
              </span>
              <button
                onClick={() => {
                  sounds.playClick();
                  onLogout();
                }}
                title="Sign Out"
                className="p-1 rounded-full text-[#8E8E9F] hover:text-[#FF4694] transition-colors ml-0.5"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                sounds.playClick();
                onOpenAuthModal();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-headline font-semibold bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] transition-all"
            >
              <UserIcon className="w-3.5 h-3.5" />
              <span>{user?.isGuest ? 'Sign In' : 'Account'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
