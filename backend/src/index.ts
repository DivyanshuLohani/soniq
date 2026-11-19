import dotenv from "dotenv";

dotenv.config();

import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import http from "http";
import logger, { httpLogger } from "./lib/logger";
import prisma from "./lib/prisma";
import adminRouter from "./routes/admin";
import authRouter from "./routes/auth";
import cardRouter from "./routes/card";
import friendsRouter from "./routes/friends";
import leaderboardRouter from "./routes/leaderboard";
import quizRouter from "./routes/quiz";
import spotifyRouter from "./routes/spotify";
import { AnalyticsCacheService } from "./services/analyticsCacheService";
import { setupPresenceWebSocketServer } from "./services/presenceService";
import generateSoniqResultCard from "./services/soniqResultCardVariation";

export const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup to allow frontend requests
app.use(
	cors({
		origin: [
			process.env.FRONTEND_URL || "http://localhost:5173",
			"http://localhost:5173",
			"http://127.0.0.1:5173",
		],
		credentials: true,
	}),
);

app.use(cookieParser());
app.use(express.json());

// Winston HTTP Request Logging Middleware
app.use(httpLogger);

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/spotify", spotifyRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/admin", adminRouter);
app.use("/api/card", cardRouter);
app.use("/api/friends", friendsRouter);

// Bot & Crawler OpenGraph HTML Responder for shared challenge & account URLs
app.get("/share", async (req, res) => {
	const sid = req.query.sid as string | undefined;
	const uid = req.query.uid as string | undefined;
	const play =
		(req.query.play as string) ||
		(req.query.playlist as string) ||
		"Music Trivia";

	let title = `Can you beat my score on ${play}? — soniq`;
	let desc = `Play the speed music quiz on ${play} at soniq. 10 quick clips to test your ear!`;
	const host = req.get("host") || "localhost:3001";
	const protocol = req.protocol === "https" || req.get("x-forwarded-proto") === "https" ? "https" : "http";
	const serverBase = `${protocol}://${host}`;

	let ogImageUrl = `${serverBase}/api/card/og?sid=${encodeURIComponent(sid || "")}`;

	if (uid) {
		try {
			const user = await prisma.user.findUnique({
				where: { id: uid },
				include: { sessions: true },
			});
			if (user) {
				const games = user.sessions.length;
				const best = games > 0 ? Math.max(...user.sessions.map((s) => s.score)) : 0;
				title = `${user.displayName}'s Music Trivia Stats — soniq`;
				desc = `Check out ${user.displayName}'s speed music trivia records! High score: ${best.toLocaleString()} PTS across ${games} quizzes.`;
				ogImageUrl = `${serverBase}/api/card/account?uid=${encodeURIComponent(uid)}`;
			}
		} catch {
			// Fallback
		}
	} else if (sid) {
		try {
			const session = await prisma.gameSession.findUnique({
				where: { id: sid },
			});
			if (session) {
				title = `I scored ${session.score.toLocaleString()} PTS on the ${session.artistName} Quiz! — soniq`;
				desc = `I got ${session.correctCount}/${session.totalQuestions} tracks right (${session.accuracy}% accuracy) in ${session.timeTakenSeconds}s! Can you beat me?`;
				ogImageUrl = `${serverBase}/api/card/og?sid=${encodeURIComponent(sid)}`;
			}
		} catch {
			// Fallback to query defaults
		}
	}

	const frontendBase =
		process.env.FRONTEND_URL ||
		(req.headers.origin as string) ||
		(req.headers.referer ? new URL(req.headers.referer).origin : "") ||
		"http://localhost:5173";

	let redirectUrl = `${frontendBase}/?${new URLSearchParams(req.query as any).toString()}`;
	if (uid) {
		redirectUrl = `${frontendBase}/account?uid=${encodeURIComponent(uid)}`;
	}

	res.setHeader("Content-Type", "text/html; charset=utf-8");
	return res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${desc}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${redirectUrl}" />
  <meta property="og:site_name" content="soniq" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${desc}" />
  <meta property="og:image" content="${ogImageUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${desc}" />
  <meta name="twitter:image" content="${ogImageUrl}" />
  <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
</head>
<body style="background:#08080B;color:#F4F4F7;font-family:sans-serif;padding:40px;text-align:center;">
  <h2>Loading quiz challenge...</h2>
  <p><a href="${redirectUrl}" style="color:#D4FF32;">Click here if you are not redirected automatically.</a></p>
</body>
</html>`);
});

// Health check
app.get("/api/health", (_req, res) => {
	res.json({
		status: "ok",
		timestamp: new Date().toISOString(),
		service: "artist-quiz-api",
		database: "PostgreSQL",
	});
});

// Seed sample leaderboard scores & Admin user if DB is empty
async function seedInitialDataIfNeeded() {
	try {
		// 1. Seed default Admin user if none exists
		const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });
		if (adminCount === 0) {
			logger.info(
				"Seeding default Admin user (divyanshu@divyanshulohani.xyz)...",
			);
			const passHash = await bcrypt.hash("AdminPass123!", 10);
			await prisma.user.create({
				data: {
					email: "divyanshu@divyanshulohani.xyz",
					passwordHash: passHash,
					displayName: "soniq Admin",
					role: "ADMIN",
					avatarUrl:
						"https://api.dicebear.com/7.x/initials/svg?seed=Admin&backgroundColor=12131a&textColor=d4ff32",
				},
			});
			logger.info(
				"Admin user seeded: divyanshu@divyanshulohani.xyz / AdminPass123!",
			);
		}

		// 2. Seed showcase game sessions if empty
		const sessionCount = await prisma.gameSession.count();
		if (sessionCount === 0) {
			logger.info("Seeding initial showcase leaderboard entries...");
			const samples = [
				{
					guestName: "BeatMaster_Alex",
					artistId: "spotify_queen",
					artistName: "Queen",
					artistImage:
						"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80",
					totalQuestions: 10,
					correctCount: 10,
					score: 2380,
					timeTakenSeconds: 19.4,
					accuracy: 100.0,
				},
				{
					guestName: "GrooveRider_Mia",
					artistId: "spotify_the_weeknd",
					artistName: "The Weeknd",
					artistImage:
						"https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80",
					totalQuestions: 10,
					correctCount: 9,
					score: 1950,
					timeTakenSeconds: 22.8,
					accuracy: 90.0,
				},
				{
					guestName: "Swiftie_Leo",
					artistId: "spotify_taylor_swift",
					artistName: "Taylor Swift",
					artistImage:
						"https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=600&auto=format&fit=crop&q=80",
					totalQuestions: 10,
					correctCount: 10,
					score: 2420,
					timeTakenSeconds: 18.2,
					accuracy: 100.0,
				},
				{
					guestName: "SynthWave_Dan",
					artistId: "spotify_daft_punk",
					artistName: "Daft Punk",
					artistImage:
						"https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80",
					totalQuestions: 8,
					correctCount: 8,
					score: 1820,
					timeTakenSeconds: 15.6,
					accuracy: 100.0,
				},
				{
					guestName: "AudioNinja_Kai",
					artistId: "spotify_billie_eilish",
					artistName: "Billie Eilish",
					artistImage:
						"https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=600&auto=format&fit=crop&q=80",
					totalQuestions: 10,
					correctCount: 8,
					score: 1610,
					timeTakenSeconds: 27.5,
					accuracy: 80.0,
				},
			];

			for (const s of samples) {
				await prisma.gameSession.create({ data: s });
			}
			logger.info("Seeded sample leaderboard entries successfully");
		}

		// 3. Pre-warm analytics cache index
		await AnalyticsCacheService.buildAndCacheAnalyticsIndex();
	} catch (err) {
		logger.warn("Seeding warning", { error: (err as any).message });
	}
}

// In local mode or standalone server, start listening
if (process.env.NODE_ENV !== "test" && !process.env.VERCEL) {
	const server = http.createServer(app);
	setupPresenceWebSocketServer(server);

	server.listen(PORT, async () => {
		logger.info(`Server listening on http://localhost:${PORT}`, {
			port: PORT,
			env: process.env.NODE_ENV || "development",
		});
		await seedInitialDataIfNeeded();
	});
}

export default app;
