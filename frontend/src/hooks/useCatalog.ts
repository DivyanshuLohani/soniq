import { useState, useCallback } from "react";
import type { Artist } from "../types";
import { api } from "../services/api";

export interface ChallengeData {
	id: string;
	inviterName: string;
	inviterAvatar?: string;
	artistId: string;
	artistName: string;
	artistImage?: string;
	score: number;
	accuracy: number;
	totalQuestions: number;
}

export function useCatalog() {
	const [featuredArtists, setFeaturedArtists] = useState<Artist[]>([]);
	const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
	const [sharedSessionId, setSharedSessionId] = useState<string | null>(null);

	const initCatalog = useCallback(async () => {
		const params = new URLSearchParams(window.location.search);
		const sid = params.get("sid");
		const uid = params.get("uid");
		const playArtist = params.get("play") || params.get("artist");
		const playPlaylist = params.get("playlist");

		// If a user account link was shared to root (e.g. /?uid=...), redirect to /account?uid=...
		if (uid && window.location.pathname === "/") {
			window.location.replace(`/account?uid=${encodeURIComponent(uid)}`);
			return;
		}

		try {
			const featured = await api.getFeatured();
			setFeaturedArtists(featured.artists);

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
					id: "playlist_invite",
					inviterName: "A music lover",
					artistId: playPlaylist,
					artistName: "Spotify Playlist",
					score: 2500,
					accuracy: 90,
					totalQuestions: 10,
				});
			} else if (playArtist) {
				const matched = featured.artists.find(
					(a: Artist) => a.name.toLowerCase() === playArtist.toLowerCase(),
				);
				setChallengeData({
					id: "artist_invite",
					inviterName: "A friend",
					artistId:
						matched?.id ||
						`artist_${playArtist.toLowerCase().replace(/\s+/g, "_")}`,
					artistName: playArtist,
					artistImage:
						matched?.imageUrl ||
						"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
					score: 2800,
					accuracy: 90,
					totalQuestions: 10,
				});
			}
		} catch (e) {
			console.warn("Could not load featured content", e);
		}
	}, []);

	return {
		featuredArtists,
		challengeData,
		setChallengeData,
		sharedSessionId,
		initCatalog,
	};
}
