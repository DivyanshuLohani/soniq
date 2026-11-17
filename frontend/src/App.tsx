import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ArtistSearch } from './components/ArtistSearch';
import { GameStage } from './components/GameStage';
import { GameSummary } from './components/GameSummary';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminPanel } from './components/AdminPanel';
import { AuthModal } from './components/AuthModal';
import { SpotifyConnectModal } from './components/SpotifyConnectModal';
import { api } from './services/api';
import { analytics } from './utils/analytics';
import type {
  User,
  Artist,
  QuizData,
  QuizResultSession,
  AnswerRecord,
} from './types';
import { AlertCircle, X } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<'home' | 'quiz' | 'summary' | 'leaderboard' | 'admin'>('home');
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Completed quiz state
  const [lastSession, setLastSession] = useState<QuizResultSession | null>(null);
  const [lastAnswers, setLastAnswers] = useState<AnswerRecord[]>([]);
  const [lastTimeTaken, setLastTimeTaken] = useState(0);

  // Modals & Banners
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSpotifyModalOpen, setIsSpotifyModalOpen] = useState(false);
  const [isSpotifyConfigured, setIsSpotifyConfigured] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize app & Google Analytics
  useEffect(() => {
    analytics.init();
    initApp();
  }, []);

  // Track page / view changes in Google Analytics
  useEffect(() => {
    analytics.trackPageView(`/${activeView}`, `Matiks Beats - ${activeView.toUpperCase()}`);
  }, [activeView]);

  const initApp = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
      setErrorMessage(`Spotify Login notice: ${decodeURIComponent(error)}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 1. Check auth status & Spotify config
    try {
      const status = await api.getAuthStatus();
      setIsSpotifyConfigured(status.spotifyConfigured);
    } catch (e) {
      console.warn('Could not check auth status', e);
    }

    // 2. Fetch logged in user
    try {
      const currentUser = await api.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
      } else {
        // Auto-assign a random guest profile if none exists
        const guest = await api.demoLogin();
        setUser(guest.user);
      }
    } catch (e) {
      console.warn('Could not init user session', e);
    }

    // 3. Load featured artists
    try {
      const artists = await api.getFeaturedArtists();
      setFeaturedArtists(artists);
    } catch (e) {
      console.warn('Could not load featured artists', e);
    }
  };

  // Launch Quiz for an Artist
  const handleStartQuiz = async (artist: Artist) => {
    setSelectedArtist(artist);
    setIsLoadingQuiz(true);
    setErrorMessage(null);

    try {
      const quiz = await api.generateQuiz(artist.id, artist.name);
      setActiveQuiz(quiz);
      setActiveView('quiz');
      analytics.trackQuizStart(artist.name, quiz.totalQuestions);
    } catch (err: any) {
      console.error('Quiz start error:', err);
      setErrorMessage(err.message || `Failed to generate quiz for ${artist.name}`);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Finish Quiz and submit answers
  const handleFinishQuiz = async (answers: AnswerRecord[], totalTimeTaken: number) => {
    if (!activeQuiz) return;

    setLastAnswers(answers);
    setLastTimeTaken(totalTimeTaken);
    setActiveView('summary');

    try {
      const result = await api.submitQuiz({
        artistId: activeQuiz.artistId,
        artistName: activeQuiz.artistName,
        artistImage: activeQuiz.artistImage,
        totalQuestions: activeQuiz.totalQuestions,
        timeTakenSeconds: totalTimeTaken,
        answers,
        guestName: user?.displayName,
      });

      if (result.success && result.session) {
        setLastSession(result.session);
        analytics.trackQuizComplete(
          result.session.artistName,
          result.session.score,
          result.session.accuracy,
          totalTimeTaken
        );
      }
    } catch (err: any) {
      console.error('Failed to submit quiz score:', err);
      setErrorMessage('Failed to save score to leaderboard: ' + err.message);
    }
  };

  // Play again with same artist
  const handlePlayAgain = () => {
    if (selectedArtist) {
      handleStartQuiz(selectedArtist);
    } else {
      setActiveView('home');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem('auth_token');
    const guest = await api.demoLogin();
    setUser(guest.user);
  };

  const isQuizMode = activeView === 'quiz';

  return (
    <div
      className={`bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-black ${
        isQuizMode
          ? 'h-[100dvh] max-h-[100dvh] overflow-hidden'
          : 'min-h-screen'
      }`}
    >
      {/* Hide full Navigation Header during active quiz for 1-screen fit without scroll */}
      {!isQuizMode && (
        <Header
          user={user}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenLeaderboard={() => setActiveView('leaderboard')}
          onOpenAdmin={() => setActiveView('admin')}
          onGoHome={() => setActiveView('home')}
          activeView={activeView}
          onLogout={handleLogout}
        />
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-300 px-4 py-2 flex items-center justify-between text-xs animate-fade-in shrink-0">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main App Body */}
      <main className={`flex-1 flex flex-col ${isQuizMode ? 'overflow-hidden' : ''}`}>
        {activeView === 'home' && (
          <ArtistSearch
            featuredArtists={featuredArtists}
            onSelectArtist={handleStartQuiz}
            isLoadingQuiz={isLoadingQuiz}
            onSearch={async (q) => {
              const res = await api.searchArtists(q);
              analytics.trackArtistSearch(q, res.length);
              return res;
            }}
          />
        )}

        {activeView === 'quiz' && activeQuiz && (
          <GameStage
            quiz={activeQuiz}
            onFinishQuiz={handleFinishQuiz}
            onCancelQuiz={() => setActiveView('home')}
          />
        )}

        {activeView === 'summary' && (
          <GameSummary
            session={lastSession}
            answers={lastAnswers}
            totalTimeTaken={lastTimeTaken}
            artistName={activeQuiz?.artistName || selectedArtist?.name || 'Artist'}
            onPlayAgain={handlePlayAgain}
            onPickNewArtist={() => setActiveView('home')}
            onViewLeaderboard={() => setActiveView('leaderboard')}
          />
        )}

        {activeView === 'leaderboard' && (
          <LeaderboardView
            onBack={() => setActiveView('home')}
            currentUser={user}
            onSelectArtistToPlay={(name) => {
              const matched = featuredArtists.find(
                (a) => a.name.toLowerCase() === name.toLowerCase()
              );
              if (matched) {
                handleStartQuiz(matched);
              } else {
                handleStartQuiz({
                  id: `artist_${name.toLowerCase().replace(/\s+/g, '_')}`,
                  name: name,
                  imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
                  genres: ['music'],
                });
              }
            }}
            fetchLeaderboard={api.getLeaderboard}
            fetchArtistStats={api.getLeaderboardArtists}
            fetchMyHistory={api.getMyHistory}
          />
        )}

        {activeView === 'admin' && (
          <AdminPanel onBack={() => setActiveView('home')} />
        )}
      </main>

      {/* Hide footer during quiz mode so zero vertical scrolling is required */}
      {!isQuizMode && (
        <footer className="w-full border-t border-white/5 py-3 px-4 text-center text-xs text-slate-500 shrink-0">
          <p>
            Matiks Beats • Speed Music Quiz • Monorepo on PostgreSQL & Vercel • Google Analytics
          </p>
        </footer>
      )}

      {/* Auth Modal (Sign In / Register / Guest / Spotify) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(newUser) => {
          setUser(newUser);
        }}
        isSpotifyConfigured={isSpotifyConfigured}
      />

      {/* Spotify Direct Modal */}
      <SpotifyConnectModal
        isOpen={isSpotifyModalOpen}
        onClose={() => setIsSpotifyModalOpen(false)}
        isConfigured={isSpotifyConfigured}
        onQuickStartGuest={async (name) => {
          const guest = await api.demoLogin(name);
          setUser(guest.user);
        }}
      />
    </div>
  );
}

export default App;
