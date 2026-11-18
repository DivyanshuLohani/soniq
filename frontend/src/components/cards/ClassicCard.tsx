import type React from "react";
import { Sparkles } from "lucide-react";
import type { QuizResultSession } from "../../types";

export interface ClassicCardProps {
	artistName: string;
	session: QuizResultSession | null;
	accuracyPercent: number;
	correctCount: number;
	totalQuestions: number;
	avgSpeed: string;
	maxStreak: number;
	isPerfectScore: boolean;
	innerRef?: React.RefObject<HTMLDivElement | null>;
}

export const ClassicCard: React.FC<ClassicCardProps> = ({
	artistName,
	session,
	accuracyPercent,
	correctCount,
	totalQuestions,
	avgSpeed,
	maxStreak,
	isPerfectScore,
	innerRef,
}) => {
	return (
		<div
			ref={innerRef}
			className="w-[360px] sm:w-[400px] min-h-[580px] sm:min-h-[620px] p-6 sm:p-7 rounded-[28px] sm:rounded-3xl bg-[#08080B] border-2 border-[#D4FF32]/40 text-[#F4F4F7] flex flex-col justify-between relative overflow-hidden font-sans shadow-2xl shrink-0"
			style={{
				backgroundImage:
					"radial-gradient(circle at 100% 0%, rgba(212,255,50,0.12) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(180,155,255,0.1) 0%, transparent 50%)",
			}}
		>
			{/* Brand header */}
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<span className="w-3 h-3 rounded-full bg-[#D4FF32] shadow-[0_0_12px_#D4FF32]" />
					<span className="font-headline font-black text-xl tracking-tight text-[#F4F4F7]">
						soniq<span className="text-[#D4FF32]">.</span>
					</span>
				</div>
				<div className="px-3 py-1 rounded-full bg-[#12131A] border border-white/[0.1] text-[11px] font-mono text-[#D4FF32]">
					{isPerfectScore
						? "PERFECT RUN"
						: accuracyPercent >= 80
						? "EXPERT TIER"
						: "MUSIC LOVER"}
				</div>
			</div>

			{/* Artist & Artwork Highlight */}
			<div className="flex w-full flex-col items-center text-center my-4 space-y-3">
				{session?.artistImage ? (
					<img
						src={session.artistImage}
						alt={artistName}
						crossOrigin="anonymous"
						className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover shadow-2xl border-2 border-white/[0.12]"
					/>
				) : (
					<div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#12131A] border border-white/[0.1] flex items-center justify-center">
						<Sparkles className="w-10 h-10 text-[#D4FF32]" />
					</div>
				)}
				<div>
					<p className="text-xs font-mono text-[#8E8E9F] uppercase tracking-widest">
						QUIZ COMPLETED
					</p>
					<h2 className="font-headline w-full text-2xl font-black text-[#F4F4F7] tracking-tight">
						{artistName}
					</h2>
				</div>
			</div>

			{/* Big Score Counter */}
			<div className="bg-[#0D0D11]/90 border border-white/[0.1] rounded-2xl p-4 text-center my-2 shadow-inner">
				<span className="text-[11px] font-mono uppercase text-[#8E8E9F] tracking-wider block">
					FINAL SCORE
				</span>
				<div className="font-mono text-4xl sm:text-5xl font-black text-[#D4FF32] my-1 tracking-tight">
					{session?.score.toLocaleString() || "0"}
				</div>
				<div className="flex items-center justify-center gap-2 text-xs font-mono text-[#8E8E9F]">
					<span className="text-[#F4F4F7] font-semibold">
						{correctCount}/{totalQuestions} Correct
					</span>
					<span>•</span>
					<span className="text-[#D4FF32] font-semibold">
						{accuracyPercent}% Accuracy
					</span>
				</div>
			</div>

			{/* Quick Metrics Bar */}
			<div className="grid grid-cols-2 gap-2 my-2">
				<div className="bg-[#12131A] border border-white/[0.08] p-3 rounded-xl text-center">
					<span className="text-[10px] font-mono uppercase text-[#8E8E9F] block">
						Reaction Speed
					</span>
					<span className="font-mono text-lg font-bold text-[#F4F4F7]">
						{avgSpeed}s
					</span>
				</div>
				<div className="bg-[#12131A] border border-white/[0.08] p-3 rounded-xl text-center">
					<span className="text-[10px] font-mono uppercase text-[#8E8E9F] block">
						Top Streak
					</span>
					<span className="font-mono text-lg font-bold text-[#B49BFF]">
						{maxStreak} In A Row
					</span>
				</div>
			</div>

			{/* Card Footer Call to Action */}
			<div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#8E8E9F]">
				<span>Play free at soniq.dibbu.dev</span>
				<span className="text-[#D4FF32]">Can you beat my score?</span>
			</div>
		</div>
	);
};
