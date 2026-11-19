import { Router } from "express";
import logger from "../lib/logger";
import prisma from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";
import { AnalyticsCacheService } from "../services/analyticsCacheService";
import {
	getArtistTracksFallback,
	type TrackItem,
} from "../services/fallbackMusicService";
import {
	getArtistTracksSpotify,
	getSpotifyPlaylist,
	getUserPlaylists,
	isSpotifyConfigured,
	refreshSpotifyAccessToken,
} from "../services/spotifyService";
import { getValidSpotifyTokenForUser } from "../services/spotifyTokenService";

const router = Router();

// Helper to shuffle array (Fisher-Yates)
function shuffle<T>(array: T[]): T[] {
	const arr = [...array];
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		const temp = arr[i]!;
		arr[i] = arr[j]!;
		arr[j] = temp;
	}
	return arr;
}

// Generate Quiz for an Artist
router.get("/generate", optionalAuth, async (req, res) => {
	const artistId = ((req.query.artistId as string) || "").trim();
	const artistName = ((req.query.artistName as string) || "").trim();

	if (!artistName) {
		return res.status(400).json({ error: "artistName parameter is required" });
	}

	try {
		let userAccessToken: string | undefined;
		if (req.user?.id) {
			const validToken = await getValidSpotifyTokenForUser(req.user.id);
			if (validToken) {
				userAccessToken = validToken;
			}
		}

		let tracks: TrackItem[] = [];

		// 1. Fetch tracks via Spotify if configured or user token available
		if (
			(isSpotifyConfigured() || userAccessToken) &&
			artistId &&
			!artistId.startsWith("itunes_")
		) {
			try {
				tracks = await getArtistTracksSpotify(
					artistId,
					artistName,
					userAccessToken,
				);
			} catch (err: any) {
				logger.warn("Spotify getArtistTracks failed, falling back", {
					error: err.message,
				});
			}
		}

		// 2. Fallback / supplement with verified iTunes artist lookup to ensure 10+ high quality playable songs
		const currentPlayable = tracks.filter((t) => !!t.previewUrl);
		if (currentPlayable.length < 10) {
			try {
				const fallbackTracks = await getArtistTracksFallback(artistName);
				for (const ft of fallbackTracks) {
					if (
						!tracks.some((t) => t.name.toLowerCase() === ft.name.toLowerCase())
					) {
						tracks.push(ft);
					}
				}
			} catch (err: any) {
				logger.warn("Fallback track fetch failed", { error: err.message });
			}
		}

		// Filter tracks with valid audio preview
		const playableTracks = tracks.filter((t) => !!t.previewUrl);

		if (playableTracks.length < 3) {
			return res.status(400).json({
				error: `Could not find enough songs with playable audio previews for "${artistName}". Found ${playableTracks.length}, minimum 3 needed. Try a different artist.`,
			});
		}

		// Determine quiz question count:
		// If >= 10 songs, pick 10 songs. If fewer (e.g. 4 or 6), make a smaller quiz as requested!
		const targetQuestionCount = Math.min(10, playableTracks.length);

		// Shuffle playable tracks to choose target questions randomly
		const shuffledTracks = shuffle(playableTracks);
		const selectedTargets = shuffledTracks.slice(0, targetQuestionCount);

		const questions = selectedTargets.map((targetTrack, index) => {
			// Pick 2 distractors from the SAME artist (excluding current track)
			const otherTracks = playableTracks.filter(
				(t) => t.id !== targetTrack.id && t.name !== targetTrack.name,
			);
			const shuffledOthers = shuffle(otherTracks);
			const distractors = shuffledOthers.slice(0, 2);

			// Total 3 choices: 1 correct + 2 wrong
			const choices = shuffle([
				{
					id: targetTrack.id,
					name: targetTrack.name,
					albumName: targetTrack.albumName,
					albumCover: targetTrack.albumCover,
					isCorrect: true,
				},
				...distractors.map((d) => ({
					id: d.id,
					name: d.name,
					albumName: d.albumName,
					albumCover: d.albumCover,
					isCorrect: false,
				})),
			]);

			return {
				questionIndex: index,
				audioUrl: targetTrack.previewUrl,
				correctTrackId: targetTrack.id,
				correctTrackName: targetTrack.name,
				albumCover: targetTrack.albumCover,
				albumName: targetTrack.albumName,
				options: choices.map((c) => ({
					id: c.id,
					name: c.name,
					albumName: c.albumName,
					albumCover: c.albumCover,
				})),
			};
		});

		const artistImage =
			playableTracks[0]?.albumCover ||
			"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80";

		const isRegUser = !!(
			req.user &&
			!req.user.isGuest &&
			!req.user.id.startsWith("guest_")
		);
		AnalyticsCacheService.trackEvent("quiz_start", {
			userId: isRegUser ? req.user!.id : null,
			artistId,
			artistName,
			metadata: {
				totalQuestions: questions.length,
				guestUserId: !isRegUser ? req.user?.id || "guest_user" : undefined,
			},
		});

		res.json({
			quiz: {
				artistId:
					artistId || `artist_${artistName.toLowerCase().replace(/\s+/g, "_")}`,
				artistName,
				artistImage,
				totalQuestions: questions.length,
				isShortQuiz: questions.length < 10,
				questions,
			},
		});
	} catch (err: any) {
		logger.error("Quiz generation error", { error: err.message });
		res
			.status(500)
			.json({ error: "Failed to generate quiz", details: err.message });
	}
});

// Generate Quiz from Spotify Playlist (by URL or Playlist ID)
router.get("/playlist/generate", optionalAuth, async (req, res) => {
	const playlistInput = (
		(req.query.playlist as string) ||
		(req.query.url as string) ||
		(req.query.id as string) ||
		""
	).trim();

	if (!playlistInput) {
		return res
			.status(400)
			.json({ error: "playlist URL or ID parameter is required" });
	}

	try {
		let userAccessToken: string | undefined;
		if (req.user?.id) {
			const validToken = await getValidSpotifyTokenForUser(req.user.id);
			if (validToken) {
				userAccessToken = validToken;
			}
		}

		const playlist = await getSpotifyPlaylist(playlistInput, userAccessToken);
		const playableTracks = playlist.tracks;

		if (playableTracks.length < 3) {
			return res.status(400).json({
				error: `Found only ${playableTracks.length} playable preview songs in this playlist. At least 3 songs with previews are required. Try another playlist.`,
			});
		}

		const targetQuestionCount = Math.min(10, playableTracks.length);
		const shuffledTracks = shuffle(playableTracks);
		const selectedTargets = shuffledTracks.slice(0, targetQuestionCount);

		const questions = selectedTargets.map((targetTrack, index) => {
			// Pick 2 distractors from the playlist
			const otherTracks = playableTracks.filter(
				(t) => t.id !== targetTrack.id && t.name !== targetTrack.name,
			);
			const shuffledOthers = shuffle(otherTracks);
			const distractors = shuffledOthers.slice(0, 2);

			const choices = shuffle([
				{
					id: targetTrack.id,
					name: targetTrack.name,
					albumName: targetTrack.albumName,
					albumCover: targetTrack.albumCover,
					artistName: targetTrack.artistName,
					isCorrect: true,
				},
				...distractors.map((d) => ({
					id: d.id,
					name: d.name,
					albumName: d.albumName,
					albumCover: d.albumCover,
					artistName: d.artistName,
					isCorrect: false,
				})),
			]);

			return {
				questionIndex: index,
				audioUrl: targetTrack.previewUrl,
				correctTrackId: targetTrack.id,
				correctTrackName: targetTrack.name,
				albumCover: targetTrack.albumCover,
				albumName: targetTrack.albumName,
				artistName: targetTrack.artistName,
				options: choices.map((c) => ({
					id: c.id,
					name: c.name,
					albumName: c.albumName,
					albumCover: c.albumCover,
					artistName: c.artistName,
				})),
			};
		});

		const coverImage =
			playlist.imageUrl ||
			playableTracks[0]?.albumCover ||
			"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80";

		const isPlaylistRegUser = !!(
			req.user &&
			!req.user.isGuest &&
			!req.user.id.startsWith("guest_")
		);
		AnalyticsCacheService.trackEvent("quiz_start", {
			userId: isPlaylistRegUser ? req.user!.id : null,
			artistId: `playlist_${playlist.id}`,
			artistName: playlist.name,
			metadata: {
				totalQuestions: questions.length,
				isPlaylist: true,
				guestUserId: !isPlaylistRegUser
					? req.user?.id || "guest_user"
					: undefined,
			},
		});

		res.json({
			quiz: {
				artistId: `playlist_${playlist.id}`,
				artistName: playlist.name,
				artistImage: coverImage,
				totalQuestions: questions.length,
				isShortQuiz: questions.length < 10,
				isPlaylist: true,
				playlistDescription: playlist.description,
				ownerName: playlist.ownerName,
				questions,
			},
		});
	} catch (err: any) {
		logger.error("Playlist quiz generation error", {
			error: err.message,
			playlistInput,
		});
		res.status(500).json({
			error: "Failed to generate playlist quiz",
			details: err.message,
		});
	}
});

// Fetch connected user's Spotify playlists
router.get("/playlist/user-playlists", optionalAuth, async (req, res) => {
	if (!req.user?.id) {
		return res
			.status(401)
			.json({ error: "Log in with Spotify to browse your playlists" });
	}

	try {
		const validToken = await getValidSpotifyTokenForUser(req.user.id);

		if (!validToken) {
			return res.status(400).json({
				error: "No valid Spotify access token found. Please reconnect Spotify.",
			});
		}

		let playlists;
		try {
			playlists = await getUserPlaylists(validToken);
		} catch (tokenErr: any) {
			// If Spotify returned 401 or expired during request, attempt an explicit refresh
			logger.warn("Spotify getUserPlaylists failed, attempting token refresh", {
				error: tokenErr.message,
				userId: req.user.id,
			});
			const user = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { refreshToken: true },
			});
			if (user?.refreshToken) {
				const refreshed = await refreshSpotifyAccessToken(user.refreshToken);
				await prisma.user.update({
					where: { id: req.user.id },
					data: {
						accessToken: refreshed.accessToken,
						...(refreshed.refreshToken ? { refreshToken: refreshed.refreshToken } : {}),
						tokenExpiry: new Date(Date.now() + refreshed.expiresIn * 1000),
					},
				});
				playlists = await getUserPlaylists(refreshed.accessToken);
			} else {
				throw tokenErr;
			}
		}

		res.json({ playlists });
	} catch (err: any) {
		logger.error("Error fetching user playlists", {
			error: err.message,
			userId: req.user.id,
		});
		res
			.status(500)
			.json({ error: "Failed to fetch your playlists", details: err.message });
	}
});

// Get public session details for a challenge invitation (e.g. ?sid=...)
router.get("/session/:id", async (req, res) => {
	const { id } = req.params;
	try {
		const session = await prisma.gameSession.findUnique({
			where: { id },
			include: {
				user: {
					select: {
						displayName: true,
						avatarUrl: true,
					},
				},
			},
		});

		if (!session) {
			return res.status(404).json({ error: "Challenge session not found" });
		}

		res.json({
			session: {
				id: session.id,
				inviterName:
					session.user?.displayName || session.guestName || "A music lover",
				inviterAvatar:
					session.user?.avatarUrl ||
					`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(session.guestName || "User")}&backgroundColor=12131a&textColor=d4ff32`,
				artistId: session.artistId,
				artistName: session.artistName,
				artistImage: session.artistImage,
				score: session.score,
				accuracy: session.accuracy,
				totalQuestions: session.totalQuestions,
			},
		});
	} catch (err: any) {
		logger.error("Error fetching challenge session", {
			error: err.message,
			id,
		});
		res.status(500).json({ error: "Failed to retrieve challenge details" });
	}
});
router.post("/submit", optionalAuth, async (req, res) => {
	try {
		const {
			artistId,
			artistName,
			artistImage,
			totalQuestions,
			timeTakenSeconds,
			answers,
			guestName,
			sharedFromSessionId,
		} = req.body;

		if (!artistName || !Array.isArray(answers) || answers.length === 0) {
			return res.status(400).json({ error: "Invalid quiz submission data" });
		}

		if (sharedFromSessionId) {
			AnalyticsCacheService.trackEvent("share_challenge_played", {
				userId: req.user?.id,
				metadata: { sharedFromSessionId, artistName },
			});
		}

		// Calculate score & statistics
		let correctCount = 0;
		let computedScore = 0;
		let currentStreak = 0;

		for (const ans of answers) {
			if (ans.isCorrect) {
				correctCount++;
				currentStreak++;

				// Base points: 100
				// Speed bonus: up to 100 points based on fast response (15s limit)
				const timeSpent = Math.max(0.5, ans.timeSpentSeconds || 3);
				const speedBonus = Math.max(0, Math.round((15 - timeSpent) * 10));

				// Streak multiplier: 1x, 1.2x, 1.5x, 2x
				let multiplier = 1.0;
				if (currentStreak >= 5) multiplier = 2.0;
				else if (currentStreak >= 3) multiplier = 1.5;
				else if (currentStreak >= 2) multiplier = 1.2;

				computedScore += Math.round((100 + speedBonus) * multiplier);
			} else {
				currentStreak = 0;
			}
		}

		const accuracy =
			totalQuestions > 0 ? (correctCount / totalQuestions) * 100 : 0;
		const finalTime =
			typeof timeTakenSeconds === "number" && timeTakenSeconds > 0
				? timeTakenSeconds
				: answers.reduce((sum, a) => sum + (a.timeSpentSeconds || 3), 0);

		// Determine whether this session is an authenticated user or guest
		const isRegisteredUser = !!(
			req.user &&
			!req.user.isGuest &&
			!req.user.id.startsWith("guest_")
		);
		const effectiveUserId = isRegisteredUser ? req.user!.id : null;
		const effectiveGuestName = isRegisteredUser
			? req.user!.displayName
			: guestName ||
				(req.user?.displayName ? req.user.displayName : "Guest Player");

		// Save GameSession & Answers in DB
		const session = await prisma.gameSession.create({
			data: {
				userId: effectiveUserId,
				guestName: effectiveGuestName,
				artistId:
					artistId || `artist_${artistName.toLowerCase().replace(/\s+/g, "_")}`,
				artistName: artistName,
				artistImage: artistImage || null,
				totalQuestions: totalQuestions || answers.length,
				correctCount: correctCount,
				score: computedScore,
				timeTakenSeconds: parseFloat(finalTime.toFixed(2)),
				accuracy: parseFloat(accuracy.toFixed(1)),
				answers: {
					create: answers.map((a: any, idx: number) => ({
						questionIndex: idx,
						trackId: a.trackId || `track_${idx}`,
						trackName: a.trackName || "Unknown Song",
						selectedTrackId: a.selectedTrackId || "none",
						selectedTrackName: a.selectedTrackName || "Skipped",
						isCorrect: !!a.isCorrect,
						timeSpentSeconds: parseFloat((a.timeSpentSeconds || 0).toFixed(2)),
					})),
				},
			},
			include: {
				answers: true,
			},
		});

		// Check rank on this artist's leaderboard
		const betterSessionsCount = await prisma.gameSession.count({
			where: {
				artistName: { equals: artistName },
				OR: [
					{ score: { gt: computedScore } },
					{
						score: computedScore,
						timeTakenSeconds: { lt: session.timeTakenSeconds },
					},
				],
			},
		});

		const artistRank = betterSessionsCount + 1;

		AnalyticsCacheService.trackEvent("quiz_complete", {
			userId: effectiveUserId,
			artistId: session.artistId,
			artistName: session.artistName,
			metadata: {
				guestUserId: !isRegisteredUser
					? req.user?.id || `guest_${session.id}`
					: undefined,
				guestName: effectiveGuestName,
				score: session.score,
				accuracy: session.accuracy,
				timeTakenSeconds: session.timeTakenSeconds,
				artistRank,
			},
		});

		res.json({
			success: true,
			session: {
				id: session.id,
				score: session.score,
				correctCount: session.correctCount,
				totalQuestions: session.totalQuestions,
				accuracy: session.accuracy,
				timeTakenSeconds: session.timeTakenSeconds,
				artistName: session.artistName,
				artistImage: session.artistImage,
				artistRank,
				createdAt: session.createdAt,
			},
		});
	} catch (err: any) {
		logger.error("Quiz submit error", { error: err.message });
		res
			.status(500)
			.json({ error: "Failed to save quiz results", details: err.message });
	}
});

export default router;
