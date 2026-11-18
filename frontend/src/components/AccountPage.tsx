import {
	AlertCircle,
	ArrowLeft,
	Calendar,
	CheckCircle2,
	Clock,
	ExternalLink,
	Layers,
	LogOut,
	Radio,
	RotateCcw,
	ShieldCheck,
	Sparkles,
	Target,
	Trophy,
	User as UserIcon,
} from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";
import type { Artist, User } from "../types";
import { sounds } from "../utils/audioSynth";

interface AccountPageProps {
	user: User | null;
	onLogout: () => void;
	onOpenSpotifyModal: () => void;
	onSelectArtist: (artist: Artist) => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({
	user,
	onLogout,
	onOpenSpotifyModal,
	onSelectArtist,
}) => {
	const navigate = useNavigate();
	const [history, setHistory] = useState<any[]>([]);
	const [stats, setStats] = useState<any | null>(null);
	const [isLoadingHistory, setIsLoadingHistory] = useState(true);

	useEffect(() => {
		loadUserHistory();
	}, [user]);

	const loadUserHistory = async () => {
		if (!user) return;
		try {
			setIsLoadingHistory(true);
			const res = await api.getMyHistory();
			setHistory(res.history || []);
			setStats(res.stats || null);
		} catch (e) {
			console.warn("Could not load user history", e);
		} finally {
			setIsLoadingHistory(false);
		}
	};

	const userInitials = user?.displayName
		? user.displayName.slice(0, 2).toUpperCase()
		: "U";

	return (
		<div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in text-[#F4F4F7] select-none">
			{/* Back Button */}
			<Link
				to="/"
				onClick={() => sounds.playClick()}
				className="inline-flex items-center gap-2 text-xs font-mono text-[#8E8E9F] hover:text-[#D4FF32] transition-colors mb-6 group"
			>
				<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
				<span className="hidden md:block">Back to Home</span>
			</Link>

			{/* Account Profile Hero Card */}
			<div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 mb-6 shadow-xl relative overflow-hidden">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-white/[0.08]">
					<div className="flex items-center gap-4">
						<div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#12131A] border border-white/[0.12] flex items-center justify-center font-mono text-2xl font-bold text-[#D4FF32] shadow-md shrink-0">
							{user?.avatarUrl ? (
								<img
									src={user.avatarUrl}
									alt={user.displayName}
									className="w-full h-full object-cover rounded-2xl"
								/>
							) : (
								userInitials
							)}
						</div>

						<div>
							<div className="flex items-center gap-2 mb-1">
								<h1 className="font-headline text-2xl sm:text-3xl font-bold tracking-tight">
									{user?.displayName || "Guest User"}
								</h1>
								{user?.role === "ADMIN" && (
									<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#B49BFF]/15 text-[#B49BFF] border border-[#B49BFF]/30 text-[10px] font-mono font-semibold">
										<ShieldCheck className="w-3 h-3" />
										ADMIN
									</span>
								)}
								{user?.isGuest && (
									<span className="px-2 py-0.5 rounded-full bg-[#181924] text-[#8E8E9F] border border-white/[0.08] text-[10px] font-mono">
										Guest Mode
									</span>
								)}
							</div>

							<p className="text-xs font-mono text-[#8E8E9F]">
								{user?.email ||
									"Guest Session • Connect Spotify or create account to sync across devices"}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-2.5">
						<button
							onClick={() => {
								sounds.playClick();
								onLogout();
								navigate("/");
							}}
							className="px-4 py-2 rounded-full font-headline text-xs font-semibold bg-[#12131A] hover:bg-[#181924] text-[#FF4694] hover:text-[#ff2b85] border border-white/[0.08] flex items-center gap-2 transition-colors"
						>
							<LogOut className="w-3.5 h-3.5" />
							<span>Sign Out</span>
						</button>
					</div>
				</div>

				{/* 4 Performance Metric Cards */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6">
					<div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-4">
						<span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
							Quizzes
						</span>
						<span className="font-mono text-2xl sm:text-3xl font-bold text-[#D4FF32]">
							{stats?.totalGames ?? history.length}
						</span>
						<span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
							Played
						</span>
					</div>

					<div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-4">
						<span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
							Top Score
						</span>
						<span className="font-mono text-2xl sm:text-3xl font-bold text-[#F4F4F7]">
							{stats?.bestScore
								? stats.bestScore.toLocaleString()
								: history.length > 0
									? Math.max(...history.map((h) => h.score)).toLocaleString()
									: "---"}
						</span>
						<span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
							Points
						</span>
					</div>

					<div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-4">
						<span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
							Accuracy
						</span>
						<span className="font-mono text-2xl sm:text-3xl font-bold text-[#B49BFF]">
							{stats?.averageAccuracy
								? `${Math.round(stats.averageAccuracy)}%`
								: history.length > 0
									? `${Math.round(history.reduce((a, b) => a + b.accuracy, 0) / history.length)}%`
									: "---"}
						</span>
						<span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
							Correct Guesses
						</span>
					</div>

					<div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-4">
						<span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
							Fastest Run
						</span>
						<span className="font-mono text-2xl sm:text-3xl font-bold text-[#F4F4F7]">
							{stats?.fastestGame
								? `${stats.fastestGame.toFixed(1)}s`
								: history.length > 0
									? `${Math.min(...history.map((h) => h.timeTakenSeconds)).toFixed(1)}s`
									: "---"}
						</span>
						<span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
							10 Songs
						</span>
					</div>
				</div>
			</div>

			{/* Spotify Connection & Audio Stream Details */}
			<div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 mb-6">
				<h3 className="font-headline text-sm sm:text-base font-semibold text-[#F4F4F7] mb-3 flex items-center gap-2">
					<Radio className="w-4 h-4 text-[#1DB954]" />
					<span>Spotify & Music Previews</span>
				</h3>

				{user?.isSpotifyConnected ? (
					<div className="space-y-4">
						<div className="p-4 rounded-xl bg-[#12131A] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-full bg-[#1DB954]/15 border border-[#1DB954]/30 flex items-center justify-center text-[#1DB954]">
									<CheckCircle2 className="w-5 h-5" />
								</div>
								<div>
									<div className="flex items-center gap-2">
										<span className="font-headline font-semibold text-sm text-[#F4F4F7]">
											Spotify Account Connected
										</span>
										<span
											className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
												user.spotifyProduct === "premium"
													? "bg-[#1DB954]/15 text-[#1DB954] border border-[#1DB954]/30"
													: "bg-[#B49BFF]/15 text-[#B49BFF] border border-[#B49BFF]/30"
											}`}
										>
											Spotify{" "}
											{user.spotifyProduct === "premium" ? "Premium" : "Free"}
										</span>
									</div>
									<p className="text-xs text-[#8E8E9F] font-mono mt-0.5">
										User: {user.spotifyId} • Instant Song Previews Active
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								<Link
									to="/spotify-disclaimer"
									className="px-3 py-1.5 rounded-full text-xs font-mono text-[#8E8E9F] hover:text-[#F4F4F7] bg-[#181924] border border-white/[0.08]"
								>
									Spotify Info
								</Link>
							</div>
						</div>

						<p className="text-xs text-[#8E8E9F] leading-relaxed">
							{user.spotifyProduct === "premium"
								? "Your Spotify Premium account is connected! Enjoy instant song previews on every quiz."
								: "Spotify Free connected! You get all 30-second song clips with zero ads or playback blocks."}
						</p>
					</div>
				) : (
					<div className="p-4 rounded-xl bg-[#12131A] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
						<div>
							<h4 className="font-headline font-semibold text-sm text-[#F4F4F7]">
								Connect Spotify Profile
							</h4>
							<p className="text-xs text-[#8E8E9F] mt-0.5">
								Link your Spotify to save your scores and show your name on the
								leaderboard. Works with both{" "}
								<span className="text-[#B49BFF]">Spotify Free</span> and{" "}
								<span className="text-[#D4FF32]">Spotify Premium</span>.
							</p>
						</div>

						<button
							onClick={() => {
								sounds.playClick();
								onOpenSpotifyModal();
							}}
							className="px-4 py-2 rounded-full font-headline text-xs font-bold bg-[#1DB954] hover:bg-[#1ed760] text-black shadow-md flex items-center justify-center gap-2 shrink-0 transition-all"
						>
							<Radio className="w-3.5 h-3.5" />
							<span>Connect Spotify</span>
						</button>
					</div>
				)}
			</div>

			{/* Assessment History Table */}
			<div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7">
				<div className="flex items-center justify-between mb-4">
					<div className="flex items-center gap-2">
						<Trophy className="w-4 h-4 text-[#D4FF32]" />
						<h3 className="font-headline text-sm sm:text-base font-semibold text-[#F4F4F7]">
							Your Past Quizzes
						</h3>
					</div>
					<span className="font-mono text-xs text-[#8E8E9F]">
						{history.length} Games Played
					</span>
				</div>

				{isLoadingHistory ? (
					<div className="py-12 text-center text-xs font-mono text-[#8E8E9F] animate-pulse">
						Loading your games...
					</div>
				) : history.length === 0 ? (
					<div className="py-12 text-center space-y-3">
						<div className="w-12 h-12 rounded-full bg-[#12131A] border border-white/[0.08] flex items-center justify-center mx-auto text-[#8E8E9F]">
							<Trophy className="w-5 h-5" />
						</div>
						<p className="text-xs font-body text-[#8E8E9F]">
							You haven&apos;t played any quizzes yet. Pick an artist and see
							how you do!
						</p>
						<Link
							to="/"
							onClick={() => sounds.playClick()}
							className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-headline text-xs font-semibold bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] transition-all"
						>
							<span>Play a Quiz</span>
						</Link>
					</div>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-left text-xs font-mono">
							<thead>
								<tr className="border-b border-white/[0.08] text-[#8E8E9F] uppercase text-[10px]">
									<th className="pb-3 font-semibold">Artist</th>
									<th className="pb-3 font-semibold">Score</th>
									<th className="pb-3 font-semibold">Accuracy</th>
									<th className="pb-3 font-semibold">Time</th>
									<th className="pb-3 font-semibold text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-white/[0.04]">
								{history.map((session, i) => (
									<tr
										key={session.id || i}
										className="hover:bg-white/[0.02] transition-colors"
									>
										<td className="py-3 pr-3 font-headline font-semibold text-[#F4F4F7]">
											<div className="flex items-center gap-2.5">
												{session.artistImage && (
													<img
														src={session.artistImage}
														alt={session.artistName}
														className="w-7 h-7 rounded-lg object-cover bg-[#12131A]"
													/>
												)}
												<span>{session.artistName}</span>
											</div>
										</td>
										<td className="py-3 pr-3 text-[#D4FF32] font-bold">
											{session.score.toLocaleString()}
										</td>
										<td className="py-3 pr-3 text-[#B49BFF]">
											{Math.round(session.accuracy)}%
										</td>
										<td className="py-3 pr-3 text-[#8E8E9F]">
											{session.timeTakenSeconds.toFixed(1)}s
										</td>
										<td className="py-3 text-right">
											<button
												onClick={() => {
													sounds.playClick();
													onSelectArtist({
														id: session.artistId,
														name: session.artistName,
														imageUrl: session.artistImage || "",
														genres: ["music"],
													});
												}}
												className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#12131A] hover:bg-[#181924] border border-white/[0.08] text-[11px] text-[#F4F4F7] hover:text-[#D4FF32] transition-colors"
											>
												<RotateCcw className="w-3 h-3" />
												<span>Retest</span>
											</button>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</div>
	);
};
