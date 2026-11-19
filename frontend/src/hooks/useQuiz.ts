import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Artist, QuizData, QuizResultSession, AnswerRecord, User } from "../types";
import { api } from "../services/api";
import { analytics } from "../utils/analytics";

interface UseQuizProps {
	user: User | null;
	sharedSessionId: string | null;
	setErrorMessage: (msg: string | null) => void;
}

export function useQuiz({ user, sharedSessionId, setErrorMessage }: UseQuizProps) {
	const navigate = useNavigate();

	const [activeQuiz, setActiveQuiz] = useState<QuizData | null>(null);
	const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
	const [isLoadingQuiz, setIsLoadingQuiz] = useState(false);

	// Completed quiz state
	const [lastSession, setLastSession] = useState<QuizResultSession | null>(null);
	const [lastAnswers, setLastAnswers] = useState<AnswerRecord[]>([]);
	const [lastTimeTaken, setLastTimeTaken] = useState(0);

	// Launch Quiz for an Artist or Playlist
	const handleStartQuiz = useCallback(
		async (artist: Artist) => {
			setSelectedArtist(artist);
			setIsLoadingQuiz(true);
			setErrorMessage(null);

			try {
				let quiz: QuizData;
				if (
					artist.id.startsWith("playlist_") ||
					artist.id.includes("spotify.com/playlist")
				) {
					quiz = await api.generatePlaylistQuiz(
						artist.id.replace("playlist_", ""),
					);
				} else {
					quiz = await api.generateQuiz(artist.id, artist.name);
				}
				setActiveQuiz(quiz);
				navigate("/quiz");
				analytics.trackQuizStart(artist.name, quiz.totalQuestions);
			} catch (err: any) {
				console.error("Quiz start error:", err);
				setErrorMessage(
					err.message || `Failed to generate quiz for ${artist.name}`,
				);
			} finally {
				setIsLoadingQuiz(false);
			}
		},
		[navigate, setErrorMessage],
	);

	const handleStartPlaylistQuiz = useCallback(
		async (playlistUrlOrId: string) => {
			setIsLoadingQuiz(true);
			setErrorMessage(null);

			try {
				const quiz = await api.generatePlaylistQuiz(playlistUrlOrId);
				setSelectedArtist({
					id: quiz.artistId,
					name: quiz.artistName,
					imageUrl: quiz.artistImage,
					genres: ["playlist"],
				});
				setActiveQuiz(quiz);
				navigate("/quiz");
				analytics.trackQuizStart(quiz.artistName, quiz.totalQuestions);
			} catch (err: any) {
				console.error("Playlist quiz start error:", err);
				setErrorMessage(err.message || "Failed to generate playlist quiz");
			} finally {
				setIsLoadingQuiz(false);
			}
		},
		[navigate, setErrorMessage],
	);

	// Finish Quiz and submit answers
	const handleFinishQuiz = useCallback(
		async (answers: AnswerRecord[], totalTimeTaken: number) => {
			if (!activeQuiz) return;

			setLastAnswers(answers);
			setLastTimeTaken(totalTimeTaken);
			navigate("/summary");

			try {
				const guestHandle =
					user?.displayName ||
					localStorage.getItem("soniq_guest_handle") ||
					"Guest Player";
				const result = await api.submitQuiz({
					artistId: activeQuiz.artistId,
					artistName: activeQuiz.artistName,
					artistImage: activeQuiz.artistImage,
					totalQuestions: activeQuiz.totalQuestions,
					timeTakenSeconds: totalTimeTaken,
					answers,
					guestName: guestHandle,
					sharedFromSessionId: sharedSessionId || undefined,
				});

				if (result.success && result.session) {
					setLastSession(result.session);
					analytics.trackQuizComplete(
						result.session.artistName,
						result.session.score,
						result.session.accuracy,
						totalTimeTaken,
					);
				}
			} catch (err: any) {
				console.error("Failed to submit quiz score:", err);
				setErrorMessage("Failed to save score to leaderboard: " + err.message);
			}
		},
		[activeQuiz, navigate, setErrorMessage, sharedSessionId, user?.displayName],
	);

	// Play again with same artist
	const handlePlayAgain = useCallback(() => {
		if (selectedArtist) {
			handleStartQuiz(selectedArtist);
		} else {
			navigate("/");
		}
	}, [handleStartQuiz, navigate, selectedArtist]);

	return {
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
	};
}
