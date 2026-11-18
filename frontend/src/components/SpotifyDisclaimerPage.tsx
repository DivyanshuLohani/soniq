import type React from "react";
import { Link } from "react-router-dom";

export const SpotifyDisclaimerPage: React.FC = () => {
	return (
		<div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14 text-[#C4C4D0] font-sans">
			<Link
				to="/"
				className="text-xs font-mono text-[#8E8E9F] hover:text-[#F4F4F7] transition-colors mb-8 inline-block"
			>
				&larr; Back to Home
			</Link>

			<header className="border-b border-white/10 pb-6 mb-8">
				<h1 className="text-2xl sm:text-3xl font-semibold text-[#F4F4F7] mb-2">
					Spotify Disclaimer & Notice
				</h1>
				<p className="text-xs font-mono text-[#8E8E9F]">
					Spotify API Compliance & Platform Independence
				</p>
			</header>

			<div className="space-y-8 text-sm leading-relaxed">
				<div className="border-l-2 border-white/20 pl-4 space-y-2 text-xs sm:text-sm">
					<p className="font-semibold text-[#F4F4F7]">
						Official Spotify API Attribution
					</p>
					<p>
						This product uses Spotify&apos;s Web API for metadata catalog queries
						and account synchronization, but is not endorsed, certified,
						sponsored, or otherwise approved by Spotify AB.
					</p>
					<p className="text-xs text-[#8E8E9F]">
						Spotify is a registered trademark of Spotify AB. All music artist
						names, logos, track metadata, and album artwork belong exclusively to
						their respective copyright holders.
					</p>
				</div>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						1. Spotify Free vs. Premium Support: How Audio Plays
					</h2>
					<p>
						Many developers and users ask: &ldquo;What happens if a user does not have Spotify Premium?&rdquo;
					</p>
					<p>
						Spotify&apos;s official Web Playback SDK strictly requires a Spotify Premium subscription and disallows free Spotify accounts from transferring audio playback to web browsers. Furthermore, Spotify deprecated 30-second audio preview links in recent revisions of their API.
					</p>
					<p>
						To guarantee that every user can play without restrictions, soniq operates a server-side dual-source audio resolving pipeline:
					</p>
					<ul className="list-disc pl-5 space-y-1">
						<li>
							When songs are fetched, soniq matches tracks against verified master 30-second previews supplied via high-speed CDNs (Apple iTunes and Deezer master feeds).
						</li>
						<li>
							Audio playback executes natively through standard HTML5 &lt;audio&gt; elements with zero reliance on Spotify&apos;s restricted Web Playback SDK.
						</li>
						<li>
							As a result, Spotify Free users, Spotify Premium users, and Guest users have 100% equal, seamless access to all 10-question discography assessments.
						</li>
					</ul>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						2. Spotify Scopes & User Permissions
					</h2>
					<p>
						When you connect your Spotify account, soniq requests read-only permissions:
					</p>
					<ul className="list-disc pl-5 space-y-1">
						<li>
							<code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono">user-read-private</code>: To display your Spotify account display name and country region.
						</li>
						<li>
							<code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono">user-read-email</code>: To associate your account and verify your identity.
						</li>
					</ul>
					<p className="text-xs text-[#8E8E9F]">
						We never request permissions to modify your Spotify playlists, manipulate playback, or view your private payment information.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						3. Intellectual Property, Fair Use & DMCA
					</h2>
					<p>
						soniq operates strictly within the boundaries of educational testing, commentary, and transformative audio recognition under the Fair Use doctrine. All preview samples are restricted to 30 seconds or less and cannot be downloaded or captured for commercial reproduction.
					</p>
					<p>
						If you are a copyright owner or an agent thereof and believe that any content infringed upon your rights, please submit a formal DMCA takedown request to{" "}
						<a
							href="mailto:divyanshu@divyanshulohani.xyz"
							className="text-[#F4F4F7] underline hover:text-white"
						>
							divyanshu@divyanshulohani.xyz
						</a>
						. Prompt takedown will occur within 24 business hours.
					</p>
				</section>
			</div>
		</div>
	);
};
