import React from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { ArtistSearch } from "./ArtistSearch";
import { ChallengeInvite } from "./ChallengeInvite";
import { GameStage } from "./GameStage";
import { GameSummary } from "./GameSummary";
import { LeaderboardView } from "./LeaderboardView";
import { AccountPage } from "./AccountPage";
import { AdminPanel } from "./AdminPanel";
import { TermsPage } from "./TermsPage";
import { PrivacyPage } from "./PrivacyPage";
import { SpotifyDisclaimerPage } from "./SpotifyDisclaimerPage";
import { AboutPage } from "./AboutPage";
import { FriendsPage } from "./FriendsPage";
import { api } from "../services/api";
import { analytics } from "../utils/analytics";
import type { Artist, QuizData, QuizResultSession, AnswerRecord, User, FriendItem, PendingFriendRequest } from "../types";
import type { ChallengeData } from "../hooks/useCatalog";

interface AppRoutesProps {
	user: User | null;
	featuredArtists: Artist[];
	challengeData: ChallengeData | null;
	setChallengeData: (data: ChallengeData | null) => void;
	activeQuiz: QuizData | null;
	selectedArtist: Artist | null;
	isLoadingQuiz: boolean;
	lastSession: QuizResultSession | null;
	lastAnswers: AnswerRecord[];
	lastTimeTaken: number;
	handleStartQuiz: (artist: Artist) => void;
	handleStartPlaylistQuiz: (urlOrId: string) => void;
	handleFinishQuiz: (answers: AnswerRecord[], totalTime: number) => void;
	handlePlayAgain: () => void;
	handleLogout: () => void;
	onOpenSpotifyModal: () => void;
	onOpenAuthModal?: () => void;
	onQuestionProgress?: (questionIndex: number, totalQuestions: number, currentScore: number) => void;
	// Friends state & actions
	friends: FriendItem[];
	pendingReceived: PendingFriendRequest[];
	pendingSent: PendingFriendRequest[];
	isFriendsLoading: boolean;
	sendFriendRequest: (targetUserId: string) => Promise<any>;
	acceptFriendRequest: (friendshipId: string) => Promise<any>;
	declineFriendRequest: (friendshipId: string) => Promise<any>;
	removeFriend: (friendshipId: string) => Promise<any>;
}

export const AppRoutes: React.FC<AppRoutesProps> = ({
	user,
	featuredArtists,
	challengeData,
	setChallengeData,
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
	handleLogout,
	onOpenSpotifyModal,
	onOpenAuthModal,
	onQuestionProgress,
	friends,
	pendingReceived,
	pendingSent,
	isFriendsLoading,
	sendFriendRequest,
	acceptFriendRequest,
	declineFriendRequest,
	removeFriend,
}) => {
	const navigate = useNavigate();

	return (
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
								if (
									challengeData.artistId.startsWith("playlist_") ||
									challengeData.artistId.includes("spotify.com/playlist")
								) {
									handleStartPlaylistQuiz(
										challengeData.artistId.replace("playlist_", ""),
									);
								} else {
									handleStartQuiz({
										id: challengeData.artistId,
										name: challengeData.artistName,
										imageUrl:
											challengeData.artistImage ||
											"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
										genres: ["music"],
									});
								}
							}}
							onExploreOther={() => setChallengeData(null)}
						/>
					) : (
						<ArtistSearch
							featuredArtists={featuredArtists}
							onSelectArtist={handleStartQuiz}
							onSelectPlaylist={handleStartPlaylistQuiz}
							isLoadingQuiz={isLoadingQuiz}
							user={user}
							onOpenSpotifyModal={onOpenSpotifyModal}
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
							onCancelQuiz={() => navigate("/")}
							onQuestionProgress={onQuestionProgress}
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
						artistName={
							activeQuiz?.artistName || selectedArtist?.name || "Artist"
						}
						onPlayAgain={handlePlayAgain}
						onPickNewArtist={() => navigate("/")}
						onViewLeaderboard={() => navigate("/leaderboard")}
					/>
				}
			/>

			{/* Benchmark Leaderboard */}
			<Route
				path="/leaderboard"
				element={
					<LeaderboardView
						onBack={() => navigate("/")}
						currentUser={user}
						onSelectArtistToPlay={(name) => {
							const matched = featuredArtists.find(
								(a) => a.name.toLowerCase() === name.toLowerCase(),
							);
							if (matched) {
								handleStartQuiz(matched);
							} else {
								handleStartQuiz({
									id: `artist_${name.toLowerCase().replace(/\s+/g, "_")}`,
									name: name,
									imageUrl:
										"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
									genres: ["music"],
								});
							}
						}}
						fetchLeaderboard={api.getLeaderboard}
						fetchArtistStats={api.getLeaderboardArtists}
						fetchMyHistory={api.getMyHistory}
					/>
				}
			/>

			{/* Friends & Social Page */}
			<Route
				path="/friends"
				element={
					<FriendsPage
						user={user}
						friends={friends}
						pendingReceived={pendingReceived}
						pendingSent={pendingSent}
						isLoading={isFriendsLoading}
						onSendRequest={sendFriendRequest}
						onAcceptRequest={acceptFriendRequest}
						onDeclineRequest={declineFriendRequest}
						onRemoveFriend={removeFriend}
						onOpenAuthModal={onOpenAuthModal}
						onPlayWithArtist={(artistName) => {
							const matched = featuredArtists.find(
								(a) => a.name.toLowerCase() === artistName.toLowerCase(),
							);
							if (matched) {
								handleStartQuiz(matched);
							} else {
								handleStartQuiz({
									id: `artist_${artistName.toLowerCase().replace(/\s+/g, "_")}`,
									name: artistName,
									imageUrl:
										"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
									genres: ["music"],
								});
							}
						}}
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
						onOpenSpotifyModal={onOpenSpotifyModal}
						onSelectArtist={handleStartQuiz}
					/>
				}
			/>

			{/* Admin Control Center */}
			<Route
				path="/admin"
				element={
					user?.role === "ADMIN" ? (
						<AdminPanel onBack={() => navigate("/")} />
					) : (
						<Navigate to="/" replace />
					)
				}
			/>

			{/* Legal & Informational Pages */}
			<Route path="/terms" element={<TermsPage />} />
			<Route path="/privacy" element={<PrivacyPage />} />
			<Route
				path="/spotify-disclaimer"
				element={<SpotifyDisclaimerPage />}
			/>
			<Route path="/about" element={<AboutPage />} />
			<Route path="/faq" element={<AboutPage />} />

			{/* Fallback */}
			<Route path="*" element={<Navigate to="/" replace />} />
		</Routes>
	);
};
