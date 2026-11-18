import confetti from "canvas-confetti";
import {
	Check,
	CheckCircle2,
	Clock,
	Copy,
	Download,
	Layers,
	RotateCcw,
	Search,
	Share2,
	Sparkles,
	Trophy,
	XCircle,
} from "lucide-react";
import { domToBlob, domToPng } from "modern-screenshot";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import type { AnswerRecord, QuizResultSession } from "../types";
import { sounds } from "../utils/audioSynth";
import { ClassicCard } from "./cards/ClassicCard";
import { LoreCard } from "./cards/LoreCard";

interface GameSummaryProps {
	session: QuizResultSession | null;
	answers: AnswerRecord[];
	totalTimeTaken: number;
	artistName: string;
	onPlayAgain: () => void;
	onPickNewArtist: () => void;
	onViewLeaderboard: () => void;
}

export const GameSummary: React.FC<GameSummaryProps> = ({
	session,
	answers,
	totalTimeTaken,
	artistName,
	onPlayAgain,
	onPickNewArtist,
	onViewLeaderboard,
}) => {
	const correctCount = answers.filter((a) => a.isCorrect).length;
	const totalQuestions = answers.length;
	const accuracyPercent =
		totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
	const avgSpeed =
		totalQuestions > 0 ? (totalTimeTaken / totalQuestions).toFixed(2) : "0.00";

	// Find max streak in answers
	let maxStreak = 0;
	let currentStreak = 0;
	answers.forEach((a) => {
		if (a.isCorrect) {
			currentStreak++;
			if (currentStreak > maxStreak) maxStreak = currentStreak;
		} else {
			currentStreak = 0;
		}
	});

	const isPerfectScore = totalQuestions > 0 && correctCount === totalQuestions;

	// Embedded Share Card State
	const [cardStyle, setCardStyle] = useState<"lore" | "classic">("lore");
	const [isGeneratingImage, setIsGeneratingImage] = useState(false);
	const [copiedLink, setCopiedLink] = useState(false);
	const [copiedImage, setCopiedImage] = useState(false);

	const loreCardRef = useRef<HTMLDivElement | null>(null);
	const classicCardRef = useRef<HTMLDivElement | null>(null);

	// Trigger celebration confetti if all questions are right
	useEffect(() => {
		if (isPerfectScore) {
			sounds.playStreak();

			const duration = 2500;
			const animationEnd = Date.now() + duration;
			const colors = ["#D4FF32", "#B49BFF", "#FF4694", "#FFFFFF"];

			const frame = () => {
				confetti({
					particleCount: 5,
					angle: 60,
					spread: 60,
					origin: { x: 0, y: 0.75 },
					colors,
					zIndex: 100,
				});
				confetti({
					particleCount: 5,
					angle: 120,
					spread: 60,
					origin: { x: 1, y: 0.75 },
					colors,
					zIndex: 100,
				});

				if (Date.now() < animationEnd) {
					requestAnimationFrame(frame);
				}
			};
			frame();
		}
	}, [isPerfectScore]);

	// Construct direct challenge link with tracking query params pointing to /share
	const directPlayParam = artistName.startsWith("playlist_")
		? `playlist=${encodeURIComponent(artistName.replace("playlist_", ""))}`
		: `play=${encodeURIComponent(artistName)}`;
	const sidParam = session?.id ? `&sid=${encodeURIComponent(session.id)}` : "";
	const challengeUrl = `${window.location.origin}/share?${directPlayParam}${sidParam}`;

	const getActiveCardRef = () =>
		cardStyle === "lore" ? loreCardRef.current : classicCardRef.current;

	// Native Web Share API
	const handleNativeShare = async () => {
		sounds.playClick();
		const targetRef = getActiveCardRef();
		if (!targetRef) return;

		try {
			const blob = await domToBlob(targetRef, {
				scale: 2,
				backgroundColor: "#08080B",
			});

			if (
				blob &&
				navigator.canShare &&
				navigator.canShare({
					files: [new File([blob], "soniq-results.png", { type: "image/png" })],
				})
			) {
				const file = new File([blob], "soniq-results.png", {
					type: "image/png",
				});
				await navigator.share({
					title: `My soniq quiz score on ${artistName}!`,
					text: `I scored ${session?.score || 0} pts (${accuracyPercent}%) on ${artistName} on soniq! Can you beat me? Play now:`,
					url: challengeUrl,
					files: [file],
				});
			} else if (navigator.share) {
				await navigator.share({
					title: `My soniq score on ${artistName}!`,
					text: `I scored ${session?.score || 0} pts (${accuracyPercent}%) on ${artistName}! Play the same quiz here:`,
					url: challengeUrl,
				});
			} else {
				handleDownloadImage();
			}
		} catch (err) {
			console.warn("Share dismissed or failed:", err);
		}
	};

	const handleDownloadImage = async () => {
		sounds.playClick();
		const targetRef = getActiveCardRef();
		if (!targetRef) return;
		try {
			setIsGeneratingImage(true);
			const dataUrl = await domToPng(targetRef, {
				scale: 2,
				backgroundColor: "#08080B",
			});
			const a = document.createElement("a");
			a.href = dataUrl;
			a.download = `soniq-${artistName.toLowerCase().replace(/\s+/g, "-")}-${cardStyle}-card.png`;
			a.click();
		} catch (err) {
			console.error("Download error:", err);
		} finally {
			setIsGeneratingImage(false);
		}
	};

	const handleCopyImage = async () => {
		sounds.playClick();
		const targetRef = getActiveCardRef();
		if (!targetRef) return;
		try {
			setIsGeneratingImage(true);
			const blob = await domToBlob(targetRef, {
				scale: 2,
				backgroundColor: "#08080B",
			});
			if (blob && (window as any).ClipboardItem) {
				await navigator.clipboard.write([
					new (window as any).ClipboardItem({ "image/png": blob }),
				]);
				setCopiedImage(true);
				setTimeout(() => setCopiedImage(false), 2000);
			} else {
				handleDownloadImage();
			}
		} catch (err) {
			console.error("Copy image error:", err);
			handleDownloadImage();
		} finally {
			setIsGeneratingImage(false);
		}
	};

	const handleCopyLink = () => {
		sounds.playClick();
		const shareText = `I scored ${session?.score || 0} pts (${accuracyPercent}% accuracy) on the ${artistName} quiz on soniq! Can you beat me? Play here: ${challengeUrl}`;
		navigator.clipboard.writeText(shareText);
		setCopiedLink(true);
		setTimeout(() => setCopiedLink(false), 2000);
	};

	return (
		<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center select-none animate-fade-in">
			<section className="w-full bg-[#0D0D11] border border-white/[0.08] rounded-3xl p-5 sm:p-7 shadow-xl mb-8 flex flex-col items-center">
				{/* Center Live Card View */}
				<div className="w-full flex flex-col lg:flex-row items-center justify-center gap-8 py-2">
					{/* Rendered Live Preview Card */}
					<div className="relative group transition-transform duration-300 hover:scale-[1.01]">
						{cardStyle === "lore" ? (
							<LoreCard
								artistName={artistName}
								session={session}
								accuracyPercent={accuracyPercent}
								correctCount={correctCount}
								totalQuestions={totalQuestions}
								totalTimeTaken={totalTimeTaken}
								isPerfectScore={isPerfectScore}
								innerRef={loreCardRef}
							/>
						) : (
							<ClassicCard
								artistName={artistName}
								session={session}
								accuracyPercent={accuracyPercent}
								correctCount={correctCount}
								totalQuestions={totalQuestions}
								avgSpeed={avgSpeed}
								maxStreak={maxStreak}
								isPerfectScore={isPerfectScore}
								innerRef={classicCardRef}
							/>
						)}
					</div>
					{/* Style Selector Tabs */}
					<div className="flex items-center justify-center w-full gap-1.5 p-1  rounded-xl self-start sm:self-center">
						<button
							onClick={() => {
								sounds.playClick();
								setCardStyle("lore");
							}}
							className={`py-1.5 px-3.5 rounded-lg text-xs font-headline font-semibold transition-all flex items-center gap-1.5 ${
								cardStyle === "lore"
									? "bg-[#D4FF32] text-[#08080B] shadow-sm"
									: "text-[#8E8E9F] hover:text-[#F4F4F7]"
							}`}
						>
							<Sparkles className="w-3.5 h-3.5" />
							<span>Lore Card</span>
						</button>
						<button
							onClick={() => {
								sounds.playClick();
								setCardStyle("classic");
							}}
							className={`py-1.5 px-3.5 rounded-lg text-xs font-headline font-semibold transition-all flex items-center gap-1.5 ${
								cardStyle === "classic"
									? "bg-[#D4FF32] text-[#08080B] shadow-sm"
									: "text-[#8E8E9F] hover:text-[#F4F4F7]"
							}`}
						>
							<Layers className="w-3.5 h-3.5" />
							<span>Classic Card</span>
						</button>
					</div>

					{/* Card Controls & Export Options */}
					<div className="flex flex-col gap-3 w-full max-w-xs">
						<div className="p-4 rounded-2xl bg-[#12131A] border border-white/[0.08] space-y-3">
							<span className="text-[11px] font-mono uppercase tracking-wider text-[#8E8E9F] block">
								Export & Share
							</span>

							<button
								onClick={handleNativeShare}
								className="w-full py-2.5 px-4 rounded-xl font-headline font-semibold text-xs sm:text-sm bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
							>
								<Share2 className="w-4 h-4" />
								<span>Share to Socials</span>
							</button>

							<button
								onClick={handleCopyImage}
								disabled={isGeneratingImage}
								className="w-full py-2.5 px-4 rounded-xl font-headline font-semibold text-xs bg-[#181924] hover:bg-[#202230] text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-2 transition-all active:scale-95"
							>
								{copiedImage ? (
									<>
										<Check className="w-4 h-4 text-[#D4FF32]" />
										<span className="text-[#D4FF32]">Image Copied!</span>
									</>
								) : (
									<>
										<Copy className="w-4 h-4 text-[#8E8E9F]" />
										<span>Copy Card Image</span>
									</>
								)}
							</button>

							<button
								onClick={handleDownloadImage}
								disabled={isGeneratingImage}
								className="w-full py-2.5 px-4 rounded-xl font-headline font-semibold text-xs bg-[#181924] hover:bg-[#202230] text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-2 transition-all active:scale-95"
							>
								<Download className="w-4 h-4 text-[#8E8E9F]" />
								<span>Download High-Res PNG</span>
							</button>
						</div>

						{/* Challenge link copy */}
						<button
							onClick={handleCopyLink}
							className="w-full py-2.5 px-3 rounded-2xl text-xs font-mono text-[#8E8E9F] hover:text-[#F4F4F7] flex items-center justify-center gap-2 border border-dashed border-white/[0.08] bg-[#0D0D11]/50 hover:bg-[#12131A] transition-colors"
						>
							{copiedLink ? (
								<>
									<Check className="w-3.5 h-3.5 text-[#D4FF32]" />
									<span className="text-[#D4FF32]">Challenge link copied!</span>
								</>
							) : (
								<>
									<Copy className="w-3.5 h-3.5" />
									<span>Copy challenge link</span>
								</>
							)}
						</button>
					</div>
				</div>
			</section>

			<div className="w-full bg-[#0D0D11] border border-white/[0.08] rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden mb-8">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
					<div className="min-w-0">
						<div className="flex items-center gap-2 mb-1.5">
							<span className="w-2 h-2 rounded-full bg-[#D4FF32] shadow-[0_0_8px_#D4FF32]" />
							<span className="text-xs font-mono uppercase tracking-wider text-[#8E8E9F]">
								Quiz Completed
							</span>
							{isPerfectScore && (
								<span className="px-2.5 py-0.5 rounded-full bg-[#D4FF32]/10 border border-[#D4FF32]/30 text-[11px] font-mono text-[#D4FF32]">
									100% Perfect Run
								</span>
							)}
						</div>
						<h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#F4F4F7] tracking-tight truncate">
							{artistName}
						</h2>
					</div>

					{session?.artistRank && (
						<div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12131A] border border-white/[0.08] text-xs font-mono text-[#D4FF32] shrink-0 self-start sm:self-center">
							<Trophy className="w-4 h-4 text-[#D4FF32]" />
							<span>Rank #{session.artistRank}</span>
						</div>
					)}
				</div>

				{/* 4 Performance Metric Badges */}
				<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
					<div className="bg-[#12131A] border border-white/[0.06] rounded-2xl p-3.5 text-center">
						<span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-0.5">
							Score
						</span>
						<span className="font-mono text-2xl font-bold text-[#D4FF32] block">
							{session ? session.score.toLocaleString() : "---"}
						</span>
						<span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
							Points
						</span>
					</div>

					<div className="bg-[#12131A] border border-white/[0.06] rounded-2xl p-3.5 text-center">
						<span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-0.5">
							Accuracy
						</span>
						<span className="font-mono text-2xl font-bold text-[#F4F4F7] block">
							{accuracyPercent}%
						</span>
						<span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
							{correctCount} / {totalQuestions} Correct
						</span>
					</div>

					<div className="bg-[#12131A] border border-white/[0.06] rounded-2xl p-3.5 text-center">
						<span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-0.5">
							Avg Speed
						</span>
						<span className="font-mono text-2xl font-bold text-[#F4F4F7] block">
							{avgSpeed}s
						</span>
						<span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
							Per Song
						</span>
					</div>

					<div className="bg-[#12131A] border border-white/[0.06] rounded-2xl p-3.5 text-center">
						<span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-0.5">
							Top Streak
						</span>
						<span className="font-mono text-2xl font-bold text-[#B49BFF] block">
							{maxStreak}
						</span>
						<span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
							Best Streak
						</span>
					</div>
				</div>

				{/* Auto-sizing Action Buttons (Fit content naturally without squishing) */}
				<div className="flex flex-wrap items-center gap-3 pt-2">
					<button
						onClick={() => {
							sounds.playClick();
							onPlayAgain();
						}}
						className="px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95"
					>
						<RotateCcw className="w-4 h-4" />
						<span>Play Again</span>
					</button>

					<button
						onClick={() => {
							sounds.playClick();
							onPickNewArtist();
						}}
						className="px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#12131A] hover:bg-[#181924] text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-2 transition-all active:scale-95"
					>
						<Search className="w-4 h-4" />
						<span>Pick Another Artist</span>
					</button>

					<button
						onClick={() => {
							sounds.playClick();
							onViewLeaderboard();
						}}
						className="px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-2 transition-all active:scale-95"
					>
						<Trophy className="w-4 h-4 text-[#D4FF32]" />
						<span>Leaderboard</span>
					</button>

					<button
						onClick={handleNativeShare}
						className="px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#B49BFF] text-[#08080B] hover:bg-[#a385fa] flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ml-auto"
					>
						<Share2 className="w-4 h-4" />
						<span>Share Result</span>
					</button>
				</div>
			</div>

			{/* 3. TRACK-BY-TRACK BREAKDOWN */}
			<section className="w-full space-y-3 mb-6">
				<div className="flex items-center justify-between px-1">
					<h3 className="font-headline text-sm font-semibold uppercase tracking-wider text-[#F4F4F7]">
						Track by Track Breakdown
					</h3>
					<span className="font-mono text-xs text-[#8E8E9F]">
						{correctCount} / {answers.length} Correct
					</span>
				</div>

				<div className="space-y-2">
					{answers.map((item, idx) => (
						<div
							key={idx}
							className={`p-3.5 rounded-2xl border flex items-center justify-between transition-colors ${
								item.isCorrect
									? "bg-[#0D0D11] border-white/[0.08]"
									: "bg-[#0D0D11] border-[#FF4694]/30"
							}`}
						>
							<div className="flex items-center gap-3.5 min-w-0">
								<span className="w-6 h-6 rounded-lg bg-[#12131A] text-[#8E8E9F] flex items-center justify-center text-xs font-mono font-bold shrink-0">
									{String(idx + 1).padStart(2, "0")}
								</span>

								<img
									src={
										item.albumCover ||
										"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80"
									}
									alt={item.trackName}
									onError={(e) => {
										(e.target as HTMLImageElement).src =
											"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80";
									}}
									className="w-11 h-11 rounded-xl object-cover bg-[#08080B] border border-white/[0.08] shrink-0"
								/>

								<div className="min-w-0 flex-1">
									<div className="flex items-center gap-2">
										<h4 className="font-headline font-semibold text-xs sm:text-sm text-[#F4F4F7] truncate">
											{item.trackName}
										</h4>
										{item.isCorrect ? (
											<CheckCircle2 className="w-4 h-4 text-[#D4FF32] shrink-0" />
										) : (
											<XCircle className="w-4 h-4 text-[#FF4694] shrink-0" />
										)}
									</div>

									{!item.isCorrect && (
										<p className="text-[11px] text-[#FF4694] font-body truncate mt-0.5">
											Selected:{" "}
											<span className="line-through text-[#8E8E9F]">
												{item.selectedTrackName}
											</span>
										</p>
									)}
								</div>
							</div>

							<div className="shrink-0 ml-3">
								<span className="text-xs font-mono text-[#8E8E9F]">
									{item.timeSpentSeconds.toFixed(2)}s
								</span>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	);
};
