import type React from "react";
import { Link } from "react-router-dom";

export const PrivacyPage: React.FC = () => {
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
					Privacy Policy
				</h1>
				<p className="text-xs font-mono text-[#8E8E9F]">
					Effective: November 2026
				</p>
			</header>

			<div className="space-y-8 text-sm leading-relaxed">
				<p>
					Your privacy and data sovereignty are paramount. This policy outlines
					what data soniq collects, how session telemetry is utilized, and your
					rights to manage or delete your records.
				</p>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						1. Information We Collect
					</h2>
					<p>
						We adhere to data minimization principles and collect only the
						information necessary to provide catalog assessment features:
					</p>
					<ul className="list-disc pl-5 space-y-2">
						<li>
							<strong className="text-[#F4F4F7]">
								Spotify Account Information:
							</strong>{" "}
							If you authenticate via Spotify OAuth 2.0, we receive your public
							Spotify ID, display name, avatar URL, and subscription tier (Free
							vs. Premium). We never receive or store your Spotify account
							password.
						</li>
						<li>
							<strong className="text-[#F4F4F7]">Direct Credentials:</strong>{" "}
							For email registrations, we store your email address and salted
							bcrypt password hash. We never store plain-text passwords.
						</li>
						<li>
							<strong className="text-[#F4F4F7]">Assessment Telemetry:</strong>{" "}
							To rank leaderboard scores, we log question response times (mean
							latency), accuracy percentages, chosen answers, and session
							timestamps.
						</li>
					</ul>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						2. Information We Never Collect or Sell
					</h2>
					<p>
						soniq does not sell, rent, monetize, or broker personal user
						records or telemetry to advertisers or data aggregators. We do not
						track browsing history outside of soniq.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						3. Cookies & Session Storage
					</h2>
					<p>
						soniq uses an <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono">auth_token</code> cookie
						with <code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono">HttpOnly</code>,{" "}
						<code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono">Secure</code>, and{" "}
						<code className="text-xs bg-white/5 px-1.5 py-0.5 rounded font-mono">SameSite=Lax</code> flags
						to securely persist your authenticated session.
					</p>
					<p>
						Anonymous telemetry and aggregate page visits are monitored using
						Google Analytics 4 (GA4) with IP anonymization enabled.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						4. Data Retention & Account Deletion Rights
					</h2>
					<p>
						You hold the right to inspect, export, or delete your user record
						and quiz history at any time. When you delete your account from the{" "}
						<Link
							to="/account"
							className="text-[#F4F4F7] underline hover:text-white"
						>
							Account Console
						</Link>
						, all associated quiz sessions and telemetry records are permanently
						purged from PostgreSQL.
					</p>
				</section>

				<section className="space-y-3">
					<h2 className="text-base font-semibold text-[#F4F4F7]">
						5. Contact Data Protection Officer
					</h2>
					<p>
						For privacy inquiries, GDPR/CCPA data export requests, or security
						vulnerability disclosures, contact our privacy officer at{" "}
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
