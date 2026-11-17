import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ArtistSearch } from './components/ArtistSearch';
import { GameStage } from './components/GameStage';
import { GameSummary } from './components/GameSummary';
import { LeaderboardView } from './components/LeaderboardView';
import { AdminPanel } from './components/AdminPanel';
import { AccountPage } from './components/AccountPage';
import { TermsPage } from './components/TermsPage';
import { PrivacyPage } from './components/PrivacyPage';
import { SpotifyDisclaimerPage } from './components/SpotifyDisclaimerPage';
import { AboutPage } from './components/AboutPage';
import { ChallengeInvite } from './components/ChallengeInvite';
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
  FeaturedTrackItem,
} from './types';
import { AlertCircle, X } from 'lucide-react';

export function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(null);
  const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
  const [featuredTracks, setFeaturedTracks] = useState<FeaturedTrackItem[]>([]);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);

  // Active quiz state
  const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

  // Completed quiz state
  const [lastSession, setLastSession] = useState<QuizResultSession | null>(null);
  const [lastAnswers, setLastAnswers] = useState<AnswerRecord[]>([]);
  const [lastTimeTaken, setLastTimeTaken] = useState(0);

  // Challenge invitation state (from ?sid=... or ?play=...)
  const [challengeData, setChallengeData] = useState<{
    id: string;
    inviterName: string;
    inviterAvatar?: string;
    artistId: string;
    artistName: string;
    artistImage?: string;
    score: number;
    accuracy: number;
    totalQuestions: number;
  } | null>(null);
  const [sharedSessionId, setSharedSessionId] = useState<string | null>(null);

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
    analytics.trackPageView(
      location.pathname,
      `soniq - ${location.pathname.replace('/', '').toUpperCase() || 'CATALOG'}`
    );
  }, [location.pathname]);

  const initApp = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const error = params.get('error');

    if (token) {
      localStorage.setItem('auth_token', token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (error) {
      const decoded = decodeURIComponent(error);
      let userNotice = decoded;
      if (decoded.includes('403') || decoded.includes('Development Mode') || decoded.includes('forbidden')) {
        userNotice = 'Spotify access restricted (403): If your Spotify developer app is in Development Mode, your Spotify email must be added under Users Management in the Spotify Developer Dashboard. You can continue playing in Guest mode!';
      }
      setErrorMessage(`Spotify notice: ${userNotice}`);
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

    // 3. Load featured artists and tracks
    try {
      const featured = await api.getFeatured();
      setFeaturedArtists(featured.artists);
      setFeaturedTracks(featured.tracks);

      // Check if user arrived via a shared quiz challenge (?sid=... and/or ?play=... / ?playlist=...)
      const sid = params.get('sid');
      const playArtist = params.get('play') || params.get('artist');
      const playPlaylist = params.get('playlist');

      if (sid) {
        setSharedSessionId(sid);
        try {
          const challenge = await api.getChallengeSession(sid);
          if (challenge) {
            setChallengeData(challenge);
            return;
          }
        } catch {
          // fallback to play param
        }
      }

      if (playPlaylist) {
        setChallengeData({
          id: 'playlist_invite',
          inviterName: 'A music lover',
          artistId: playPlaylist,
          artistName: 'Spotify Playlist',
          score: 2500,
          accuracy: 90,
          totalQuestions: 10,
        });
      } else if (playArtist) {
        const matched = featured.artists.find(
          (a: Artist) => a.name.toLowerCase() === playArtist.toLowerCase()
        );
        setChallengeData({
          id: 'artist_invite',
          inviterName: 'A friend',
          artistId: matched?.id || `artist_${playArtist.toLowerCase().replace(/\s+/g, '_')}`,
          artistName: playArtist,
          artistImage: matched?.imageUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
          score: 2800,
          accuracy: 90,
          totalQuestions: 10,
        });
      }
    } catch (e) {
      console.warn('Could not load featured content', e);
    }
  };

  // Launch Quiz for an Artist or Playlist
  const handleStartQuiz = async (artist: Artist) => {
    setSelectedArtist(artist);
    setIsLoadingQuiz(true);
    setErrorMessage(null);

    try {
      let quiz: QuizData;
      if (artist.id.startsWith('playlist_') || artist.id.includes('spotify.com/playlist')) {
        quiz = await api.generatePlaylistQuiz(artist.id.replace('playlist_', ''));
      } else {
        quiz = await api.generateQuiz(artist.id, artist.name);
      }
      setActiveQuiz(quiz);
      navigate('/quiz');
      analytics.trackQuizStart(artist.name, quiz.totalQuestions);
    } catch (err: any) {
      console.error('Quiz start error:', err);
      setErrorMessage(err.message || `Failed to generate quiz for ${artist.name}`);
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  const handleStartPlaylistQuiz = async (playlistUrlOrId: string) => {
    setIsLoadingQuiz(true);
    setErrorMessage(null);

    try {
      const quiz = await api.generatePlaylistQuiz(playlistUrlOrId);
      setSelectedArtist({
        id: quiz.artistId,
        name: quiz.artistName,
        imageUrl: quiz.artistImage,
        genres: ['playlist'],
      });
      setActiveQuiz(quiz);
      navigate('/quiz');
      analytics.trackQuizStart(quiz.artistName, quiz.totalQuestions);
    } catch (err: any) {
      console.error('Playlist quiz start error:', err);
      setErrorMessage(err.message || 'Failed to generate playlist quiz');
    } finally {
      setIsLoadingQuiz(false);
    }
  };

  // Finish Quiz and submit answers
  const handleFinishQuiz = async (answers: AnswerRecord[], totalTimeTaken: number) => {
    if (!activeQuiz) return;

    setLastAnswers(answers);
    setLastTimeTaken(totalTimeTaken);
    navigate('/summary');

    try {
      const result = await api.submitQuiz({
        artistId: activeQuiz.artistId,
        artistName: activeQuiz.artistName,
        artistImage: activeQuiz.artistImage,
        totalQuestions: activeQuiz.totalQuestions,
        timeTakenSeconds: totalTimeTaken,
        answers,
        guestName: user?.displayName,
        sharedFromSessionId: sharedSessionId || undefined,
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
      navigate('/');
    }
  };

  const handleLogout = async () => {
    await api.logout();
    setUser(null);
    localStorage.removeItem('auth_token');
    const guest = await api.demoLogin();
    setUser(guest.user);
  };

  const isQuizMode = location.pathname === '/quiz';

  return (
    <div
      className={`bg-[#08080B] text-[#F4F4F7] flex flex-col font-sans selection:bg-[#D4FF32] selection:text-[#08080B] ${
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
          onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="bg-[#FF4694]/10 border-b border-[#FF4694]/20 text-[#FF4694] px-4 py-2 flex items-center justify-between text-xs animate-fade-in shrink-0">
          <div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
            <AlertCircle className="w-4 h-4 text-[#FF4694] shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="p-1 hover:text-[#F4F4F7]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main App Routes */}
      <main className={`flex-1 flex flex-col ${isQuizMode ? 'overflow-hidden' : ''}`}>
        <Routes>
          {/* Catalog Home */}
          <Route
            path="/"
            element={
              challengeData ? (
                <ChallengeInvite
                  challenge={challengeData}
                  isLoading={isLoadingQuiz}
                  onStartChallenge={() => {
                    if (challengeData.artistId.startsWith('playlist_') || challengeData.artistId.includes('spotify.com/playlist')) {
                      handleStartPlaylistQuiz(challengeData.artistId.replace('playlist_', ''));
                    } else {
                      handleStartQuiz({
                        id: challengeData.artistId,
                        name: challengeData.artistName,
                        imageUrl: challengeData.artistImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
                        genres: ['music'],
                      });
                    }
                  }}
                  onExploreOther={() => setChallengeData(null)}
                />
              ) : (
                <ArtistSearch
                  featuredArtists={featuredArtists}
                  featuredTracks={featuredTracks}
                  onSelectArtist={handleStartQuiz}
                  onSelectPlaylist={handleStartPlaylistQuiz}
                  isLoadingQuiz={isLoadingQuiz}
                  user={user}
                  onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
                  onSearch={async (q) => {
                    const res = await api.searchArtists(q);
                    analytics.trackArtistSearch(q, res.length);
                    return res;
                  }}
                />
              )
            }
          />

          {/* Alternate explore / quizzes paths from footer */}
          <Route path="/explore" element={<Navigate to="/" replace />} />
          <Route path="/quizzes" element={<Navigate to="/" replace />} />

          {/* Active Quiz Assessment Mode */}
          <Route
            path="/quiz"
            element={
              activeQuiz ? (
                <GameStage
                  quiz={activeQuiz}
                  onFinishQuiz={handleFinishQuiz}
                  onCancelQuiz={() => navigate('/')}
                />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Assessment Summary & Performance Report */}
          <Route
            path="/summary"
            element={
              <GameSummary
                session={lastSession}
                answers={lastAnswers}
                totalTimeTaken={lastTimeTaken}
                artistName={activeQuiz?.artistName || selectedArtist?.name || 'Artist'}
                onPlayAgain={handlePlayAgain}
                onPickNewArtist={() => navigate('/')}
                onViewLeaderboard={() => navigate('/leaderboard')}
              />
            }
          />

          {/* Benchmark Leaderboard */}
          <Route
            path="/leaderboard"
            element={
              <LeaderboardView
                onBack={() => navigate('/')}
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
                      imageUrl:
                        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80',
                      genres: ['music'],
                    });
                  }
                }}
                fetchLeaderboard={api.getLeaderboard}
                fetchArtistStats={api.getLeaderboardArtists}
                fetchMyHistory={api.getMyHistory}
              />
            }
          />

          {/* Account Profile Page */}
          <Route
            path="/account"
            element={
              <AccountPage
                user={user}
                onLogout={handleLogout}
                onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
                onSelectArtist={handleStartQuiz}
              />
            }
          />

          {/* Admin Control Center */}
          <Route
            path="/admin"
            element={
              user?.role === 'ADMIN' ? (
                <AdminPanel onBack={() => navigate('/')} />
              ) : (
                <Navigate to="/" replace />
              )
            }
          />

          {/* Legal & Informational Pages */}
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/spotify-disclaimer" element={<SpotifyDisclaimerPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<AboutPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Comprehensive Professional Footer (hidden during active quiz mode to preserve single-screen layout) */}
      {!isQuizMode && (
        <Footer
          onGoHome={() => navigate('/')}
          onOpenLeaderboard={() => navigate('/leaderboard')}
          onOpenAdmin={() => navigate('/admin')}
          onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
          isAdmin={user?.role === 'ADMIN'}
        />
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

      {/* Spotify Direct Modal - Only opens for accounts where Spotify is not yet linked */}
      <SpotifyConnectModal
        isOpen={isSpotifyModalOpen && !user?.isSpotifyConnected}
        onClose={() => setIsSpotifyModalOpen(false)}
        isConfigured={isSpotifyConfigured}
        user={user}
      />
    </div>
  );
}

export default App;
