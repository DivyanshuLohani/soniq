import type React from "react";
import type { QuizResultSession } from "../../types";

export interface LoreCardProps {
	artistName: string;
	session: QuizResultSession | null;
	accuracyPercent: number;
	correctCount: number;
	totalQuestions: number;
	totalTimeTaken: number;
	isPerfectScore: boolean;
	innerRef?: React.RefObject<HTMLDivElement | null>;
}

export const LoreCard: React.FC<LoreCardProps> = ({
	artistName,
	session,
	accuracyPercent,
	correctCount,
	totalQuestions,
	totalTimeTaken,
	isPerfectScore,
	innerRef,
}) => {
	return (
		<div
			ref={innerRef}
			className="w-[360px] sm:w-[400px] h-[580px] sm:h-[620px] p-5 sm:p-6 rounded-[28px] sm:rounded-[32px] text-[#F4F4F7] flex flex-col justify-between relative overflow-hidden font-sans border-2 border-[#D4FF32]/50 shadow-2xl shrink-0"
			style={{ backgroundColor: "#08080B" }}
		>
			{/* Concert / Stage Atmospheric Background */}
			<div className="absolute inset-0 z-0">
				<img
					src={
						session?.artistImage ||
						"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80"
					}
					alt=""
					crossOrigin="anonymous"
					className="w-full h-full object-cover filter brightness-[0.38] contrast-125 scale-105"
				/>
				{/* Deep Stage lighting gradients */}
				<div className="absolute inset-0 bg-gradient-to-t from-[#08080B] via-[#08080B]/60 to-[#08080B]/40" />
				<div className="absolute inset-0 bg-radial from-transparent via-[#08080B]/40 to-[#08080B]" />
			</div>

			{/* Top Holographic Header */}
			<div className="relative z-10 flex items-center justify-between">
				<div className="px-3.5 py-1 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center gap-1.5 shadow-lg">
					<span className="w-1.5 h-1.5 rounded-full bg-[#D4FF32] shadow-[0_0_8px_#D4FF32]" />
					<span className="font-mono text-[10px] tracking-wider text-white font-extrabold uppercase">
						SONIQ<span className="text-[#D4FF32]">.LORE</span>
					</span>
				</div>
			</div>

			{/* Center Holographic Hero: Rotating Vinyl with Artist Artwork */}
			<div className="relative z-10 flex flex-col items-center justify-center my-auto text-center w-full px-2">
				{/* Circular Vinyl Art Center */}
				<div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-[#D4FF32] via-[#B49BFF] to-[#FF4694] shadow-[0_0_35px_rgba(212,255,50,0.3)] mb-3 shrink-0">
					<div className="w-full h-full rounded-full overflow-hidden bg-black border-2 border-black flex items-center justify-center">
						<img
							src={
								session?.artistImage ||
								"https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&auto=format&fit=crop&q=80"
							}
							alt={artistName}
							crossOrigin="anonymous"
							className="w-full h-full object-cover filter contrast-125"
						/>
					</div>
					{/* Vinyl Groove Ring Overlay */}
					<div className="absolute inset-2 rounded-full border border-white/20 pointer-events-none" />
				</div>

				{/* Global Tier Pill */}
				<div className="inline-flex items-center justify-center px-4 py-1 rounded-full bg-[#D4FF32] text-[#08080B] text-[10px] sm:text-[11px] font-mono font-black tracking-wider uppercase mb-2 shadow-lg shadow-[#D4FF32]/25 shrink-0">
					{isPerfectScore
						? "TOP 0.1% GLOBAL"
						: accuracyPercent >= 80
						? "TOP 1.2% GLOBAL"
						: "VERIFIED LISTENER"}
				</div>

				{/* Clean Bold Title */}
				<h1 className="font-headline text-2xl sm:text-3xl font-black text-white tracking-tight uppercase px-4 drop-shadow-md mb-2 leading-tight max-w-full truncate">
					{artistName}
				</h1>

				{/* Score & PTS cleanly grouped on one horizontal line */}
				<div className="flex items-baseline justify-center gap-2 mb-3 shrink-0">
					<span className="font-mono text-3xl font-black text-[#D4FF32] tracking-tight drop-shadow-lg leading-none">
						{session?.score.toLocaleString() || "0"}
					</span>
					<span className="font-mono text-sm font-bold text-white/80 uppercase tracking-widest leading-none">
						PTS
					</span>
				</div>

				{/* Vibrant Waveform Visualizer Bars */}
				<div className="flex items-center justify-center gap-1.5 h-8 shrink-0">
					{[12, 22, 16, 30, 20, 26, 14, 18, 24, 14].map((h, i) => (
						<div
							key={i}
							className="w-1.5 rounded-full"
							style={{
								height: `${h}px`,
								backgroundColor: i % 2 === 0 ? "#D4FF32" : "#B49BFF",
								boxShadow: "0 0 10px rgba(212, 255, 50, 0.4)",
							}}
						/>
					))}
				</div>
			</div>

			{/* Bottom Card Footer Pill (Charli / Lore style) */}
			<div className="relative z-10 w-full p-3 rounded-2xl bg-black/75 backdrop-blur-md border border-white/15 flex items-center justify-between shadow-xl">
				<div className="flex items-center gap-2.5">
					<div className="w-6 h-6 rounded-lg bg-[#D4FF32] text-black flex items-center justify-center font-bold text-xs">
						▶
					</div>
					<div>
						<p className="font-mono text-xs font-bold text-white tracking-wide">
							soniq.dibbu.dev
						</p>
						<p className="text-[10px] text-white/60 font-mono">
							{correctCount}/{totalQuestions} songs ({accuracyPercent}%) in{" "}
							{totalTimeTaken.toFixed(1)}s
						</p>
					</div>
				</div>

				<div className="text-right">
					<span className="text-[10px] font-mono font-bold text-[#D4FF32] uppercase tracking-wider block">
						COME BEAT MY SCORE
					</span>
				</div>
			</div>
		</div>
	);
};
