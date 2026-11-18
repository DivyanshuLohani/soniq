import { ArrowLeft, Headphones, Radio, ShieldCheck } from "lucide-react";
import type React from "react";
import { Link } from "react-router-dom";
import { sounds } from "../utils/audioSynth";

export const SpotifyDisclaimerPage: React.FC = () => {
	return (
		<div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in text-[#F4F4F7] select-none">
			{/* Back to Home Button */}
			<Link
				to="/"
				onClick={() => sounds.playClick()}
				className="inline-flex items-center gap-2 text-xs font-mono text-[#8E8E9F] hover:text-[#D4FF32] transition-colors mb-6 group"
			>
				<ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
				<span className="hidden md:block">Back to Home</span>
			</Link>

			{/* Header */}
			<div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
				<div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#12131A] border border-white/[0.08] text-[11px] font-mono text-[#1DB954] mb-3">
					<Radio className="w-3.5 h-3.5 text-[#1DB954]" />
					<span>Spotify API Compliance & Platform Independence</span>
				</div>
				<h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight">
					Spotify Disclaimer & Notice
				</h1>
				<p className="text-xs sm:text-sm font-body text-[#8E8E9F] mt-2 max-w-2xl leading-relaxed">
					Comprehensive disclosure regarding our integration with the Spotify
					Web API, audio preview architecture, and independent product status.
				</p>
			</div>

			{/* Mandatory Statutory Notice */}
			<div className="p-4 sm:p-5 rounded-2xl bg-[#12131A] border border-[#1DB954]/30 mb-8 space-y-2">
				<div className="flex items-center gap-2 text-[#1DB954] font-headline font-semibold text-sm">
					<ShieldCheck className="w-4 h-4" />
					<span>Official Spotify API Attribution</span>
				</div>
				<p className="text-xs sm:text-sm font-body text-[#F4F4F7] leading-relaxed">
					This product uses Spotify&apos;s Web API for metadata catalog queries
					and account synchronization, but is not endorsed, certified,
					sponsored, or otherwise approved by Spotify AB.
				</p>
				<p className="text-[11px] font-mono text-[#8E8E9F]">
					Spotify is a registered trademark of Spotify AB. All music artist
					names, logos, track metadata, and album artwork belong exclusively to
					their respective copyright holders.
				</p>
			</div>

			{/* Structured Notice Sections */}
			<div className="space-y-6 text-xs sm:text-sm font-body text-[#8E8E9F] leading-relaxed">
				{/* Section 1: Non-Premium Spotify Compatibility Explained */}
				<div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
					<h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#1DB954]" />
						1. Spotify Free vs. Premium Support: How Audio Plays
					</h2>
					<p>
						Many developers and users ask:{" "}
						<strong className="text-[#F4F4F7]">
							&ldquo;What happens if a user does not have Spotify
							Premium?&rdquo;
						</strong>
					</p>
					<p>
						Spotify&apos;s official <em>Web Playback SDK</em> strictly requires
						a Spotify Premium subscription and disallows free Spotify accounts
						from transferring audio playback to web browsers. Furthermore,
						Spotify deprecated 30-second audio preview links in recent revisions
						of their API.
					</p>
					<div className="p-3.5 rounded-xl bg-[#12131A] border border-white/[0.06] space-y-2 text-xs">
						<div className="flex items-center gap-2 text-[#D4FF32] font-semibold">
							<Headphones className="w-4 h-4 text-[#D4FF32]" />
							<span>Soniq&apos;s Dual-Source Audio Engine Solution</span>
						</div>
						<p className="text-[#8E8E9F]">
							To guarantee that{" "}
							<strong className="text-[#F4F4F7]">
								every user can play without restrictions
							</strong>
							, soniq operates a server-side dual-source audio resolving
							pipeline:
						</p>
						<ul className="list-disc pl-5 space-y-1 text-[#8E8E9F]">
							<li>
								When songs are fetched, soniq matches tracks against verified
								master 30-second previews supplied via high-speed CDNs (Apple
								iTunes and Deezer master feeds).
							</li>
							<li>
								Audio playback executes natively through standard HTML5{" "}
								<code className="text-[#D4FF32] font-mono">&lt;audio&gt;</code>{" "}
								elements with zero reliance on Spotify&apos;s restricted Web
								Playback SDK.
							</li>
							<li>
								As a result,{" "}
								<strong className="text-[#F4F4F7]">
									Spotify Free users, Spotify Premium users, and Guest users
									have 100% equal, seamless access
								</strong>{" "}
								to all 10-question discography assessments.
							</li>
						</ul>
					</div>
				</div>

				{/* Section 2: Spotify OAuth & Scopes */}
				<div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
					<h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#1DB954]" />
						2. Spotify Scopes & User Permissions
					</h2>
					<p>
						When you connect your Spotify account, soniq requests read-only
						permissions:
					</p>
					<ul className="list-disc pl-5 space-y-1 text-[#8E8E9F]">
						<li>
							<code className="text-[#D4FF32] font-mono">
								user-read-private
							</code>
							: To display your Spotify account display name and country region.
						</li>
						<li>
							<code className="text-[#D4FF32] font-mono">user-read-email</code>:
							To associate your account and verify your identity.
						</li>
					</ul>
					<p className="text-[11px] text-[#8E8E9F] pt-1">
						We never request permissions to modify your Spotify playlists,
						manipulate playback, or view your private payment information.
					</p>
				</div>

				{/* Section 3: Copyright & DMCA Policy */}
				<div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
					<h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#1DB954]" />
						3. Intellectual Property, Fair Use & DMCA
					</h2>
					<p>
						soniq operates strictly within the boundaries of educational
						testing, commentary, and transformative audio recognition under the
						Fair Use doctrine. All preview samples are restricted to 30 seconds
						or less and cannot be downloaded or captured for commercial
						reproduction.
					</p>
					<p>
						If you are a copyright owner or an agent thereof and believe that
						any content infringed upon your rights, please submit a formal DMCA
						takedown request to{" "}
						<a
							href="mailto:divyanshu@divyanshulohani.xyz"
							className="text-[#D4FF32] underline"
						>
							divyanshu@divyanshulohani.xyz
						</a>
						. Prompt takedown will occur within 24 business hours.
					</p>
				</div>
			</div>
		</div>
	);
};
