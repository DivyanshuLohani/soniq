import { Router } from "express";
import logger from "../lib/logger";
import prisma from "../lib/prisma";
import { optionalAuth } from "../middleware/auth";
import {
	FEATURED_ARTISTS,
	searchArtistsFallback,
} from "../services/fallbackMusicService";
import {
	isSpotifyConfigured,
	searchSpotifyArtists,
} from "../services/spotifyService";

const router = Router();

// Seed initial database featured items if empty
async function ensureFeaturedSeeded() {
	try {
		const artistCount = await prisma.featuredArtist.count();
		if (artistCount === 0) {
			logger.info("Seeding initial featured artists in PostgreSQL");
			for (let i = 0; i < FEATURED_ARTISTS.length; i++) {
				const a = FEATURED_ARTISTS[i];
				if (!a || !a.id || !a.name || !a.imageUrl) {
					logger.warn(
						`Skipping invalid featured artist entry: ${JSON.stringify(a)}`,
					);
					continue;
				}
				await prisma.featuredArtist.create({
					data: {
						artistId: a.id,
						name: a.name,
						imageUrl: a.imageUrl,
						genres: a.genres.join(", "),
						popularity: a.popularity || 90,
						displayOrder: i,
						isActive: true,
					},
				});
			}
		}

		const trackCount = await prisma.featuredTrack.count();
		if (trackCount === 0) {
			logger.info("Seeding initial featured songs in PostgreSQL");
			const defaultTracks = [
				{
					title: "Bohemian Rhapsody",
					artistName: "Queen",
					albumName: "A Night at the Opera",
					albumCover:
						"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80",
					previewUrl:
						"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview116/v4/a4/09/b3/a409b30c-25e2-e1c9-7d03-e6538413a968/mzaf_10022067756778903264.plus.aac.p.m4a",
					displayOrder: 0,
				},
				{
					title: "Blinding Lights",
					artistName: "The Weeknd",
					albumName: "After Hours",
					albumCover:
						"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&auto=format&fit=crop&q=80",
					previewUrl:
						"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/91/9f/bd/919fbd1a-9f79-2458-7557-6107eb024765/mzaf_11306352932375807955.plus.aac.p.m4a",
					displayOrder: 1,
				},
				{
					title: "Cruel Summer",
					artistName: "Taylor Swift",
					albumName: "Lover",
					albumCover:
						"https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=300&auto=format&fit=crop&q=80",
					previewUrl:
						"https://audio-ssl.itunes.apple.com/itunes-assets/AudioPreview115/v4/a3/1d/a2/a31da298-6932-d1be-017e-9764516766d3/mzaf_15783350125211910629.plus.aac.p.m4a",
					displayOrder: 2,
				},
			];

			for (const t of defaultTracks) {
				await prisma.featuredTrack.create({
					data: {
						...t,
						isActive: true,
					},
				});
			}
		}
	} catch (err: any) {
		logger.warn("Could not auto-seed featured items", { error: err.message });
	}
}

// Get featured popular artists and songs for instant home page display
router.get("/featured", async (_req, res) => {
	try {
		await ensureFeaturedSeeded();

		const dbArtists = await prisma.featuredArtist.findMany({
			where: { isActive: true },
			orderBy: { displayOrder: "asc" },
		});

		const dbTracks = await prisma.featuredTrack.findMany({
			where: { isActive: true },
			orderBy: { displayOrder: "asc" },
		});

		const artists = dbArtists.map((a) => ({
			id: a.artistId,
			dbId: a.id,
			name: a.name,
			imageUrl: a.imageUrl,
			genres: a.genres ? a.genres.split(",").map((g) => g.trim()) : [],
			popularity: a.popularity,
			customSongs: a.customSongs ? JSON.parse(a.customSongs) : null,
		}));

		res.json({ artists, tracks: dbTracks });
	} catch (err: any) {
		logger.error("Error fetching featured data", { error: err.message });
		res.json({ artists: FEATURED_ARTISTS, tracks: [] });
	}
});

// Get featured songs specifically
router.get("/featured-tracks", async (_req, res) => {
	try {
		const tracks = await prisma.featuredTrack.findMany({
			where: { isActive: true },
			orderBy: { displayOrder: "asc" },
		});
		res.json({ tracks });
	} catch (err: any) {
		res
			.status(500)
			.json({ error: "Failed to fetch tracks", details: err.message });
	}
});

// Search artists
router.get("/search", optionalAuth, async (req, res) => {
	const query = ((req.query.q as string) || "").trim();
	if (!query) {
		return res.json({ artists: FEATURED_ARTISTS });
	}

	try {
		let userAccessToken: string | undefined;

		// Check if user has Spotify access token
		if (req.user?.id) {
			const dbUser = await prisma.user.findUnique({
				where: { id: req.user.id },
				select: { accessToken: true, tokenExpiry: true },
			});
			if (dbUser?.accessToken) {
				userAccessToken = dbUser.accessToken;
			}
		}

		let artists: any[] = [];

		// Attempt Spotify Search if credentials or user token exist
		if (isSpotifyConfigured() || userAccessToken) {
			try {
				artists = await searchSpotifyArtists(query, userAccessToken);
			} catch (err: any) {
				logger.warn("Spotify search failed, falling back to iTunes", {
					error: err.message,
				});
			}
		}

		// Fallback if no artists found or Spotify not configured
		if (!artists || artists.length === 0) {
			artists = await searchArtistsFallback(query);
		}

		res.json({ artists });
	} catch (err: any) {
		logger.error("Artist search error", { error: err.message, query });
		res
			.status(500)
			.json({ error: "Failed to search artists", details: err.message });
	}
});

export default router;
