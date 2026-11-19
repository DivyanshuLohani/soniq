import { ExternalLink, Headphones, Music2, Trophy } from "lucide-react";
import type React from "react";
import { Link } from "react-router-dom";
import { sounds } from "../utils/audioSynth";

interface FooterProps {
	onGoHome: () => void;
	onOpenLeaderboard: () => void;
	onOpenAdmin: () => void;
	onOpenSpotifyModal?: () => void;
	isAdmin?: boolean;
}

const LINKS = {
	explore: [
		{ label: "Discover Artists", href: "/" },
		{ label: "Artist Quizzes", href: "/" },
		{ label: "Friends & Social", href: "/friends" },
		{ label: "Leaderboard", href: "/leaderboard" },
	],
	resources: [
		{ label: "About", href: "/about" },
		{ label: "FAQ", href: "/about" },
		{ label: "Creator (dibbu.dev)", href: "https://dibbu.dev", external: true },
		{ label: "Contact", href: "mailto:divyanshu@divyanshulohani.xyz", external: true },
		{
			label: "GitHub",
			href: "https://github.com/DivyanshuLohani/soniq",
			external: true,
		},
	],
	legal: [
		{ label: "Privacy Policy", href: "/privacy" },
		{ label: "Terms of Service", href: "/terms" },
		{ label: "Spotify Disclaimer", href: "/spotify-disclaimer" },
	],
};

export const Footer: React.FC<FooterProps> = ({
	onGoHome,
	onOpenLeaderboard,
	onOpenAdmin,
	onOpenSpotifyModal,
	isAdmin,
}) => {
	const handleClick = (callback?: () => void) => {
		sounds.playClick();
		if (callback) callback();
	};

	const linkClass =
		"text-sm text-[#92929F] hover:text-white transition-colors duration-200 block";

	return (
		<footer className="mt-auto w-full bg-[#0D0D11] border-t border-white/[0.08] text-[#92929F] select-none">
			<div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
				<div className="grid grid-cols-2 md:grid-cols-5 gap-10">
					{/* Brand */}
					<div className="col-span-2 md:col-span-2 space-y-4">
						<Link
							to="/"
							onClick={() => handleClick(onGoHome)}
							className="inline-flex items-center gap-2.5 group"
						>
							<div className="w-8 h-8 rounded-lg bg-[#D4FF32] flex items-center justify-center">
								<Music2 className="w-4 h-4 text-[#0D0D11]" />
							</div>

							<span className="text-xl font-bold text-white tracking-tight">
								soniq<span className="text-[#D4FF32]">.</span>
							</span>
						</Link>

						<p className="text-sm leading-relaxed max-w-xs">
							A place for music lovers to discover artists, test their
							knowledge, and see how well they really know their favourite
							music.
						</p>

						<button
							onClick={() => handleClick(() => onOpenSpotifyModal?.())}
							className="inline-flex items-center gap-2 text-sm text-white hover:text-[#D4FF32] transition-colors"
						>
							<Headphones className="w-4 h-4" />
							<span>Connect Spotify</span>
						</button>
					</div>

					{/* Explore */}
					<div>
						<h4 className="text-sm font-semibold text-white mb-4">Explore</h4>

						<ul className="space-y-3">
							<li>
								<Link
									to="/"
									onClick={() => handleClick(onGoHome)}
									className={linkClass}
								>
									Discover Artists
								</Link>
							</li>

							<li>
								<Link
									to="/"
									onClick={() => handleClick(onGoHome)}
									className={linkClass}
								>
									Artist Quizzes
								</Link>
							</li>

							<li>
								<Link
									to="/leaderboard"
									onClick={() => handleClick(onOpenLeaderboard)}
									className={linkClass}
								>
									Leaderboard
								</Link>
							</li>
						</ul>
					</div>

					{/* Resources */}
					<div>
						<h4 className="text-sm font-semibold text-white mb-4">Resources</h4>

						<ul className="space-y-3">
							{LINKS.resources.map((link) => (
								<li key={link.label}>
									{link.external ? (
										<a
											href={link.href}
											target="_blank"
											rel="noopener noreferrer"
											onClick={() => handleClick()}
											className={linkClass}
										>
											{link.label}
											<ExternalLink className="inline w-3 h-3 ml-1" />
										</a>
									) : (
										<Link
											to={link.href}
											onClick={() => handleClick()}
											className={linkClass}
										>
											{link.label}
										</Link>
									)}
								</li>
							))}
						</ul>
					</div>

					{/* Legal */}
					<div>
						<h4 className="text-sm font-semibold text-white mb-4">Legal</h4>

						<ul className="space-y-3">
							{LINKS.legal.map((link) => (
								<li key={link.label}>
									<Link
										to={link.href}
										onClick={() => handleClick()}
										className={linkClass}
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>

						{isAdmin && (
							<Link
								to="/admin"
								onClick={() => handleClick(onOpenAdmin)}
								className={`${linkClass} mt-4 text-[#B49BFF] hover:text-[#d5c7ff]`}
							>
								Admin Console
							</Link>
						)}
					</div>
				</div>

				{/* Bottom */}
				<div className="mt-12 pt-6 border-t border-white/[0.08] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
					<div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-3 text-xs">
						<p>© {new Date().getFullYear()} soniq. All rights reserved.</p>
						<span className="hidden sm:inline text-white/[0.2]">•</span>
						<p className="text-[#8E8E9F]">
							Crafted with passion by{" "}
							<a
								href="https://dibbu.dev"
								target="_blank"
								rel="noopener noreferrer"
								className="text-[#D4FF32] hover:underline font-medium inline-flex items-center gap-0.5"
							>
								dibbu.dev
								<ExternalLink className="w-2.5 h-2.5" />
							</a>
						</p>
					</div>

					<p className="text-xs text-[#777783] max-w-xl sm:text-right">
						This product uses Spotify's API but is not endorsed, certified, or
						otherwise approved by Spotify.
					</p>
				</div>
			</div>
		</footer>
	);
};
