import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Volume2,
  VolumeX,
  Trophy,
  LogOut,
  ShieldCheck,
  Radio,
  User as UserIcon,
  ChevronDown,
  Sparkles,
  ExternalLink,
  FileText,
  Lock,
  Headphones,
  Settings,
  Music2,
  UserCheck,
} from 'lucide-react';
import type { User } from '../types';
import { sounds } from '../utils/audioSynth';

interface HeaderProps {
  user: User | null;
  onOpenAuthModal: () => void;
  onOpenSpotifyModal?: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenAuthModal,
  onOpenSpotifyModal,
  onLogout,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [muted, setMuted] = useState(sounds.getMuted());
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close account menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close account menu on route change
  useEffect(() => {
    setIsAccountMenuOpen(false);
  }, [location.pathname]);

  const toggleSound = () => {
    const next = !muted;
    sounds.setMuted(next);
    setMuted(next);
    if (!next) sounds.playClick();
  };

  const userInitials = user?.displayName
    ? user.displayName.slice(0, 2).toUpperCase()
    : 'U';

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#08080B]/95 backdrop-blur-md px-4 sm:px-8 py-3 transition-all select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand / Logo */}
        <Link
          to="/"
          onClick={() => sounds.playClick()}
          className="flex items-center gap-3 group select-none"
        >
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#D4FF32] text-[#0D0D11]">
            <Music2 className="w-4 h-4 text-[#0D0D11]" />
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-headline font-bold text-xl tracking-tight text-[#F4F4F7]">
              soniq<span className="text-[#D4FF32]">.</span>
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8E8E9F] hidden sm:inline">
              Music Trivia
            </span>
          </div>
        </Link>

        {/* Center / Right Navigation Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play / Songs Link */}
          <Link
            to="/"
            onClick={() => sounds.playClick()}
            className={`px-3 py-1.5 rounded-full text-xs font-headline font-semibold transition-colors ${
              isActive('/')
                ? 'bg-[#181924] text-[#F4F4F7] border border-white/[0.12]'
                : 'text-[#8E8E9F] hover:text-[#F4F4F7]'
            }`}
          >
            Play
          </Link>

          {/* Leaderboard Link */}
          <Link
            to="/leaderboard"
            onClick={() => sounds.playClick()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-headline font-semibold transition-colors ${
              isActive('/leaderboard')
                ? 'bg-[#181924] text-[#F4F4F7] border border-white/[0.12]'
                : 'text-[#8E8E9F] hover:text-[#F4F4F7]'
            }`}
          >
            <Trophy className="w-3.5 h-3.5 text-[#D4FF32]" />
            <span>Leaderboard</span>
          </Link>

          {/* Admin Console (Admin users only) */}
          {user?.role === 'ADMIN' && (
            <Link
              to="/admin"
              onClick={() => sounds.playClick()}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-headline font-semibold transition-all border ${
                isActive('/admin')
                  ? 'bg-[#B49BFF] text-[#08080B] border-[#B49BFF]'
                  : 'bg-[#181924] text-[#B49BFF] border-[#B49BFF]/30 hover:border-[#B49BFF]'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </Link>
          )}

          {/* Sound Feedback Toggle */}
          <button
            onClick={toggleSound}
            title={muted ? 'Unmute tactile audio feedback' : 'Mute tactile audio feedback'}
            className="p-1.5 rounded-full bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] transition-colors"
          >
            {muted ? (
              <VolumeX className="w-3.5 h-3.5 text-[#8E8E9F]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#D4FF32]" />
            )}
          </button>

          {/* Account Menu Anchor */}
          <div className="relative" ref={menuRef}>
            {user && !user.isGuest ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAccountMenuOpen((prev) => !prev);
                }}
                className={`flex items-center gap-2 bg-[#12131A] hover:bg-[#181924] border rounded-full p-1 pl-1.5 pr-2.5 transition-all ${
                  isAccountMenuOpen || isActive('/account')
                    ? 'border-[#D4FF32]/60 ring-1 ring-[#D4FF32]/20'
                    : 'border-white/[0.08]'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-[#181924] border border-white/[0.1] flex items-center justify-center font-mono text-[10px] font-bold text-[#D4FF32] shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.displayName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    userInitials
                  )}
                </div>

                <span className="text-xs font-headline font-medium text-[#F4F4F7] max-w-[90px] sm:max-w-[120px] truncate">
                  {user.displayName}
                </span>

                {user.isSpotifyConnected && (
                  <span
                    className={`hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono uppercase font-semibold ${
                      user.spotifyProduct === 'premium'
                        ? 'bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30'
                        : 'bg-[#B49BFF]/15 text-[#B49BFF] border border-[#B49BFF]/30'
                    }`}
                  >
                    {user.spotifyProduct === 'premium' ? 'Premium' : 'Free'}
                  </span>
                )}

                <ChevronDown
                  className={`w-3 h-3 text-[#8E8E9F] transition-transform duration-200 ${
                    isAccountMenuOpen ? 'rotate-180 text-[#D4FF32]' : ''
                  }`}
                />
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playClick();
                  setIsAccountMenuOpen((prev) => !prev);
                }}
                className={`flex items-center gap-2 bg-[#12131A] hover:bg-[#181924] border rounded-full p-1 pl-2 pr-2.5 transition-all ${
                  isAccountMenuOpen ? 'border-[#D4FF32]/50' : 'border-white/[0.08]'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-[#181924] flex items-center justify-center text-[#D4FF32] text-xs font-mono font-bold">
                  {userInitials}
                </div>
                <span className="text-xs font-headline font-semibold text-[#F4F4F7]">
                  {user?.displayName || 'Guest'}
                </span>
                <ChevronDown
                  className={`w-3 h-3 text-[#8E8E9F] transition-transform duration-200 ${
                    isAccountMenuOpen ? 'rotate-180 text-[#D4FF32]' : ''
                  }`}
                />
              </button>
            )}

            {/* Account Menu Dropdown Card */}
            {isAccountMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#0D0D11] border border-white/[0.1] rounded-2xl shadow-2xl p-3 z-50 text-xs animate-fade-in divide-y divide-white/[0.06]">
                {/* User Summary Header */}
                <div className="p-2 pb-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#12131A] border border-white/[0.1] flex items-center justify-center font-mono text-sm font-bold text-[#D4FF32] shrink-0">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.displayName}
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        userInitials
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="font-headline font-bold text-sm text-[#F4F4F7] truncate">
                          {user?.displayName || 'Guest User'}
                        </span>
                        {user?.role === 'ADMIN' && (
                          <span className="px-1.5 py-0.2 rounded bg-[#B49BFF]/20 text-[#B49BFF] text-[9px] font-mono font-bold">
                            ADMIN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-[#8E8E9F] truncate">
                        {user?.email || (user?.isGuest ? 'Guest Session' : 'Account active')}
                      </p>
                    </div>
                  </div>

                  {/* Spotify Status Pill */}
                  <div className="pt-1 flex items-center justify-between bg-[#12131A] border border-white/[0.06] rounded-xl px-2.5 py-1.5">
                    <div className="flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-[#1DB954]" />
                      <span className="text-[11px] text-[#F4F4F7] font-medium">
                        {user?.isSpotifyConnected
                          ? `Spotify ${user.spotifyProduct === 'premium' ? 'Premium' : 'Free'}`
                          : 'Spotify: Not Linked'}
                      </span>
                    </div>
                    {user?.isSpotifyConnected ? (
                      <span className="text-[10px] font-mono text-[#D4FF32]">
                        Connected
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsAccountMenuOpen(false);
                          if (onOpenSpotifyModal) onOpenSpotifyModal();
                        }}
                        className="text-[10px] font-mono text-[#1DB954] hover:underline"
                      >
                        Connect
                      </button>
                    )}
                  </div>
                </div>

                {/* Primary Navigation Actions */}
                <div className="py-2 space-y-0.5">
                  <Link
                    to="/account"
                    onClick={() => sounds.playClick()}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#F4F4F7] hover:bg-[#181924] hover:text-[#D4FF32] transition-colors"
                  >
                    <UserIcon className="w-4 h-4 text-[#D4FF32]" />
                    <div className="flex flex-col">
                      <span className="font-headline font-semibold text-xs">Your Profile</span>
                      <span className="text-[10px] text-[#8E8E9F]">Stats, streaks & past games</span>
                    </div>
                  </Link>

                  <Link
                    to="/leaderboard"
                    onClick={() => sounds.playClick()}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#F4F4F7] hover:bg-[#181924] hover:text-[#D4FF32] transition-colors"
                  >
                    <Trophy className="w-4 h-4 text-[#D4FF32]" />
                    <div className="flex flex-col">
                      <span className="font-headline font-semibold text-xs">Leaderboard</span>
                      <span className="text-[10px] text-[#8E8E9F]">See top players and scores</span>
                    </div>
                  </Link>

                  {user?.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => sounds.playClick()}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-[#B49BFF] hover:bg-[#181924] hover:text-[#d5c7ff] transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#B49BFF]" />
                      <div className="flex flex-col">
                        <span className="font-headline font-semibold text-xs">Admin Console</span>
                        <span className="text-[10px] text-[#8E8E9F]">Manage featured tracks & artists</span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* Secondary Links & Legal */}
                <div className="py-2 space-y-0.5">
                  <Link
                    to="/spotify-disclaimer"
                    onClick={() => sounds.playClick()}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[#8E8E9F] hover:bg-[#181924] hover:text-[#F4F4F7] transition-colors text-[11px]"
                  >
                    <span>Spotify & Audio Info</span>
                    <Radio className="w-3 h-3 text-[#1DB954]" />
                  </Link>

                  <Link
                    to="/terms"
                    onClick={() => sounds.playClick()}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[#8E8E9F] hover:bg-[#181924] hover:text-[#F4F4F7] transition-colors text-[11px]"
                  >
                    <span>Terms of Service</span>
                    <FileText className="w-3 h-3" />
                  </Link>

                  <Link
                    to="/privacy"
                    onClick={() => sounds.playClick()}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-[#8E8E9F] hover:bg-[#181924] hover:text-[#F4F4F7] transition-colors text-[11px]"
                  >
                    <span>Privacy Policy</span>
                    <Lock className="w-3 h-3" />
                  </Link>
                </div>

                {/* Authentication Footer Actions */}
                <div className="pt-2">
                  {user && !user.isGuest ? (
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setIsAccountMenuOpen(false);
                        onLogout();
                        navigate('/');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[#FF4694] hover:bg-[#FF4694]/10 transition-colors font-headline font-semibold text-xs"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  ) : (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => {
                          sounds.playClick();
                          setIsAccountMenuOpen(false);
                          onOpenAuthModal();
                        }}
                        className="w-full py-2 px-3 rounded-full font-headline font-bold text-xs bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] transition-all flex items-center justify-center gap-2"
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Sign In or Register</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
