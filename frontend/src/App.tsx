import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertCircle, X } from "lucide-react";

import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { AuthModal } from "./components/AuthModal";
import { SpotifyConnectModal } from "./components/SpotifyConnectModal";
import { AppRoutes } from "./components/AppRoutes";

import { useAuth } from "./hooks/useAuth";
import { useQuiz } from "./hooks/useQuiz";
import { useCatalog } from "./hooks/useCatalog";
import { useFriends } from "./hooks/useFriends";
import { analytics } from "./utils/analytics";

export function App() {
	const navigate = useNavigate();
	const location = useLocation();

	// Auth hook
	const {
		user,
		setUser,
		isSpotifyConfigured,
		isAuthModalOpen,
		setIsAuthModalOpen,
		isSpotifyModalOpen,
		setIsSpotifyModalOpen,
		authError,
		setAuthError,
		initAuth,
		logout,
	} = useAuth();

	// Catalog & challenge hook
	const {
		featuredArtists,
		challengeData,
		setChallengeData,
		sharedSessionId,
		initCatalog,
	} = useCatalog();

	// Friends & Realtime WebSocket Presence hook
	const {
		friends,
		pendingReceived,
		pendingSent,
		isLoading: isFriendsLoading,
		onlineFriendsCount,
		playingFriendsCount,
		broadcastActivity,
		sendFriendRequest,
		acceptFriendRequest,
		declineFriendRequest,
		removeFriend,
	} = useFriends(user);

	// Quiz state & operations hook
	const {
		activeQuiz,
		selectedArtist,
		isLoadingQuiz,
		lastSession,
		lastAnswers,
		lastTimeTaken,
		handleStartQuiz,
		handleStartPlaylistQuiz,
		handleFinishQuiz,
		handlePlayAgain,
	} = useQuiz({
		user,
		sharedSessionId,
		setErrorMessage: setAuthError,
	});

	// Initialize app and analytics
	useEffect(() => {
		analytics.init();
		initAuth();
		initCatalog();
	}, []);

	// Track page / view changes in Google Analytics
	useEffect(() => {
		analytics.trackPageView(
			location.pathname,
			`soniq - ${location.pathname.replace("/", "").toUpperCase() || "CATALOG"}`,
		);
	}, [location.pathname]);

	const isQuizMode = location.pathname === "/quiz";

	// Broadcast live presence status when quiz changes or activeQuiz updates
	useEffect(() => {
		if (isQuizMode && activeQuiz) {
			broadcastActivity({
				isPlaying: true,
				currentArtist: activeQuiz.artistName,
				questionIndex: 0,
				totalQuestions: activeQuiz.totalQuestions,
				currentScore: 0,
			});
		} else {
			broadcastActivity({
				isPlaying: false,
			});
		}
	}, [isQuizMode, activeQuiz, broadcastActivity]);

	return (
		<div
			className={`bg-[#08080B] text-[#F4F4F7] flex flex-col font-sans selection:bg-[#D4FF32] selection:text-[#08080B] ${
				isQuizMode
					? "h-[100dvh] max-h-[100dvh] overflow-hidden"
					: "min-h-screen"
			}`}
		>
			{/* Navigation Header (hidden during active quiz to maximize screen focus) */}
			{!isQuizMode && (
				<Header
					user={user}
					onOpenAuthModal={() => setIsAuthModalOpen(true)}
					onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
					onLogout={logout}
					onlineFriendsCount={onlineFriendsCount}
					playingFriendsCount={playingFriendsCount}
				/>
			)}

			{/* Global Error Notification Banner */}
			{authError && (
				<div className="bg-[#FF4694]/10 border-b border-[#FF4694]/20 text-[#FF4694] px-4 py-2 flex items-center justify-between text-xs animate-fade-in shrink-0">
					<div className="flex items-center gap-2 max-w-4xl mx-auto flex-1">
						<AlertCircle className="w-4 h-4 text-[#FF4694] shrink-0" />
						<span>{authError}</span>
					</div>
					<button
						onClick={() => setAuthError(null)}
						className="p-1 hover:text-[#F4F4F7]"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			)}

			{/* Main App Routes */}
			<main
				className={`flex-1 flex flex-col ${isQuizMode ? "overflow-hidden" : ""}`}
			>
				<AppRoutes
					user={user}
					featuredArtists={featuredArtists}
					challengeData={challengeData}
					setChallengeData={setChallengeData}
					activeQuiz={activeQuiz}
					selectedArtist={selectedArtist}
					isLoadingQuiz={isLoadingQuiz}
					lastSession={lastSession}
					lastAnswers={lastAnswers}
					lastTimeTaken={lastTimeTaken}
					handleStartQuiz={handleStartQuiz}
					handleStartPlaylistQuiz={handleStartPlaylistQuiz}
					handleFinishQuiz={handleFinishQuiz}
					handlePlayAgain={handlePlayAgain}
					handleLogout={logout}
					onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
					onOpenAuthModal={() => setIsAuthModalOpen(true)}
					onQuestionProgress={(questionIndex, totalQuestions, currentScore) => {
						broadcastActivity({
							isPlaying: true,
							currentArtist: activeQuiz?.artistName,
							questionIndex,
							totalQuestions,
							currentScore,
						});
					}}
					friends={friends}
					pendingReceived={pendingReceived}
					pendingSent={pendingSent}
					isFriendsLoading={isFriendsLoading}
					sendFriendRequest={sendFriendRequest}
					acceptFriendRequest={acceptFriendRequest}
					declineFriendRequest={declineFriendRequest}
					removeFriend={removeFriend}
				/>
			</main>

			{/* Footer (hidden during active quiz) */}
			{!isQuizMode && (
				<Footer
					onGoHome={() => navigate("/")}
					onOpenLeaderboard={() => navigate("/leaderboard")}
					onOpenAdmin={() => navigate("/admin")}
					onOpenSpotifyModal={() => setIsSpotifyModalOpen(true)}
					isAdmin={user?.role === "ADMIN"}
				/>
			)}

			{/* Modals */}
			<AuthModal
				isOpen={isAuthModalOpen}
				onClose={() => setIsAuthModalOpen(false)}
				onSuccess={(newUser) => setUser(newUser)}
				isSpotifyConfigured={isSpotifyConfigured}
			/>

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
