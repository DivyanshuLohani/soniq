import type React from "react";
import { Link } from "react-router-dom";

export const TermsPage: React.FC = () => {
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
					Terms of Service
				</h1>
				<p className="text-xs font-mono text-[#8E8E9F]">
					Effective: November 2026
				</p>
			</header>

			<div className="space-y-8 text-sm leading-relaxed">
				<p>
					Please review these Terms of Service carefully before utilizing soniq.
					By accessing or assessing discography tracks on soniq, you agree to be
					bound by these provisions.
				</p>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						1. Platform Purpose & Scope
					</h2>
					<p>
						soniq is an audio recognition and catalog intelligence platform
						designed to evaluate discography recognition, musical recall, and
						identification speed. The platform provides interactive assessments
						utilizing short master audio excerpts (up to 30 seconds) in
						compliance with educational and transformative fair use standards.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						2. Audio Previews & Intellectual Property Rights
					</h2>
					<p>
						All artist names, track titles, album cover artwork, sound
						recordings, and musical compositions presented on soniq remain the
						exclusive property of their respective copyright holders, recording
						labels, and artists.
					</p>
					<p>
						soniq does not host, distribute, sell, or broadcast full musical
						compositions. Audio playback consists exclusively of authorized
						30-second master previews fetched on-demand through verified content
						delivery networks (Apple iTunes / Deezer previews and Spotify API
						metadata). Soniq operates in full adherence to the Spotify Developer
						Policy.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						3. User Accounts, Handles & Global Leaderboards
					</h2>
					<p>
						Users may participate on soniq via registered accounts, guest
						handles, or authenticated Spotify OAuth 2.0 connections. You agree
						to:
					</p>
					<ul className="list-disc pl-5 space-y-1">
						<li>
							Select professional and non-abusive handles and display names.
						</li>
						<li>
							Refrain from automated scripting, API scraping, synthetic latency
							falsification, or exploit exploitation.
						</li>
						<li>Maintain the confidentiality of your session credentials.</li>
					</ul>
					<p className="text-xs text-[#8E8E9F]">
						soniq reserves the right to remove invalid leaderboard submissions,
						purge falsified records, or restrict access to accounts found in
						violation of platform integrity.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						4. Spotify Non-Affiliation & Platform Independence
					</h2>
					<p>
						soniq utilizes Spotify&apos;s Web API for metadata retrieval, album
						art display, and user authentication, but is not endorsed,
						certified, or sponsored by Spotify AB. Spotify and the Spotify logo
						are registered trademarks of Spotify AB.
					</p>
					<p>
						For further details regarding Spotify API compliance, please consult
						our{" "}
						<Link
							to="/spotify-disclaimer"
							className="text-[#F4F4F7] underline hover:text-white"
						>
							Spotify Disclaimer
						</Link>
						.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						5. Disclaimer of Warranties & Limitation of Liability
					</h2>
					<p>
						soniq is provided on an &ldquo;as is&rdquo; and &ldquo;as
						available&rdquo; basis without warranties of any kind, whether
						express or implied. While we strive for 99.9% uptime and low-latency
						audio buffering, we do not guarantee uninterrupted availability of
						external third-party CDN audio streams.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						6. Contact & Legal Inquiries
					</h2>
					<p>
						For questions regarding these Terms, DMCA notices, or catalog
						permissions, please contact our administrative team at{" "}
						<a
							href="mailto:divyanshu@divyanshulohani.xyz"
							className="text-[#F4F4F7] underline hover:text-white"
						>
							divyanshu@divyanshulohani.xyz
						</a>
						.
					</p>
				</section>
			</div>
		</div>
	);
};
