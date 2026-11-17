import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User as UserIcon, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/audioSynth';
import { api } from '../services/api';
import { analytics } from '../utils/analytics';
import type { User } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: User) => void;
  isSpotifyConfigured: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isSpotifyConfigured,
}) => {
  const [mode, setMode] = useState<'login' | 'register' | 'guest'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [guestName, setGuestName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sounds.playClick();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === 'register') {
        const res = await api.register({ email, password, displayName });
        analytics.trackAuth('register', res.user.role);
        onSuccess(res.user);
        onClose();
      } else if (mode === 'login') {
        const res = await api.login({ email, password });
        analytics.trackAuth('login', res.user.role);
        onSuccess(res.user);
        onClose();
      } else if (mode === 'guest') {
        const res = await api.demoLogin(guestName);
        analytics.trackAuth('guest', 'USER');
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpotifyLogin = () => {
    sounds.playClick();
    window.location.href = '/api/auth/spotify';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#0f1523] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-indigo-500/10 text-white overflow-hidden">
        {/* Glow background accents */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

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

        {/* Modal Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-[1px] mx-auto mb-3 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-[#0d121f] rounded-[15px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <h3 className="text-2xl font-black tracking-tight text-white">
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Create Account' : 'Play as Guest'}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login'
              ? 'Sign in to sync your score history and admin access'
              : mode === 'register'
              ? 'Join Matiks Beats to climb the global leaderboard'
              : 'Jump right into the music trivia arena'}
          </p>
        </div>

        {/* Tab switchers */}
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'login' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('register');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'register' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setMode('guest');
              setError(null);
            }}
            className={`flex-1 py-2 rounded-xl transition-all ${
              mode === 'guest' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Guest
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Spotify OAuth Quick Button */}
        {isSpotifyConfigured && mode !== 'guest' && (
          <div className="mb-5">
            <button
              type="button"
              onClick={handleSpotifyLogin}
              className="w-full py-3 px-4 rounded-2xl font-bold text-xs sm:text-sm bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-lg shadow-[#1DB954]/20 flex items-center justify-center gap-2.5 transition-all active:scale-[0.98]"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.498 17.31c-.22.358-.691.474-1.049.255-2.884-1.764-6.514-2.162-10.793-1.185-.407.094-.814-.16-.908-.567-.094-.407.16-.814.567-.908 4.685-1.07 8.706-.615 11.928 1.356.358.22.474.691.255 1.049zm1.467-3.26c-.276.449-.867.594-1.316.318-3.303-2.03-8.337-2.617-12.244-1.431-.504.153-1.036-.134-1.189-.638-.153-.504.134-1.036.638-1.189 4.462-1.354 10.021-.697 13.793 1.624.449.276.594.867.318 1.316zm.126-3.398C15.137 8.36 8.618 8.136 4.845 9.282c-.611.186-1.26-.167-1.446-.778-.186-.611.167-1.26.778-1.446 4.333-1.315 11.536-1.056 16.035 1.615.549.326.731 1.041.405 1.59-.326.549-1.041.731-1.59.405z" />
              </svg>
              <span>Continue with Spotify</span>
            </button>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-white/10 w-full" />
              <span className="bg-[#0f1523] px-3 text-[10px] uppercase font-bold text-slate-500">
                Or with email
              </span>
            </div>
          </div>
        )}

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Display Name
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. SonicRider"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {mode !== 'guest' ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Gamer Tag / Nickname
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-4 h-4 text-slate-500 absolute left-3.5" />
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="e.g. SpeedDemon_42"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-6 rounded-2xl font-black text-xs sm:text-sm bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>
                  {mode === 'login'
                    ? 'SIGN IN'
                    : mode === 'register'
                    ? 'CREATE ACCOUNT'
                    : 'PLAY AS GUEST'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
