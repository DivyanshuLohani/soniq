import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, FileText, Scale, ExternalLink } from 'lucide-react';
import { sounds } from '../utils/audioSynth';

export const TermsPage: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-14 animate-fade-in text-[#F4F4F7] select-none">
      {/* Back to Home Button */}
      <Link
        to="/"
        onClick={() => sounds.playClick()}
        className="inline-flex items-center gap-2 text-xs font-mono text-[#8E8E9F] hover:text-[#D4FF32] transition-colors mb-6 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Back to Home</span>
      </Link>

      {/* Header */}
      <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 mb-8 relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#12131A] border border-white/[0.08] text-[11px] font-mono text-[#8E8E9F] mb-3">
          <Scale className="w-3.5 h-3.5 text-[#D4FF32]" />
          <span>Legal Framework • Effective November 2026</span>
        </div>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight">
          Terms of Service
        </h1>
        <p className="text-xs sm:text-sm font-body text-[#8E8E9F] mt-2 max-w-2xl leading-relaxed">
          Please review these Terms of Service carefully before utilizing soniq.
          By accessing or assessing discography tracks on soniq, you agree to be bound by these provisions.
        </p>
      </div>

      {/* Structured Legal Content */}
      <div className="space-y-6 text-xs sm:text-sm font-body text-[#8E8E9F] leading-relaxed">
        {/* Section 1 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF32]" />
            1. Platform Purpose & Scope
          </h2>
          <p>
            <strong className="text-[#F4F4F7]">soniq</strong> is an audio recognition and catalog intelligence platform designed to evaluate discography recognition, musical recall, and identification speed. The platform provides interactive assessments utilizing short master audio excerpts (up to 30 seconds) in compliance with educational and transformative fair use standards.
          </p>
        </div>

        {/* Section 2 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF32]" />
            2. Audio Previews & Intellectual Property Rights
          </h2>
          <p>
            All artist names, track titles, album cover artwork, sound recordings, and musical compositions presented on soniq remain the exclusive property of their respective copyright holders, recording labels, and artists.
          </p>
          <p>
            soniq does not host, distribute, sell, or broadcast full musical compositions. Audio playback consists exclusively of authorized 30-second master previews fetched on-demand through verified content delivery networks (Apple iTunes / Deezer previews and Spotify API metadata). Soniq operates in full adherence to the Spotify Developer Policy.
          </p>
        </div>

        {/* Section 3 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF32]" />
            3. User Accounts, Handles & Global Leaderboards
          </h2>
          <p>
            Users may participate on soniq via registered accounts, guest handles, or authenticated Spotify OAuth 2.0 connections. You agree to:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#8E8E9F]">
            <li>Select professional and non-abusive handles and display names.</li>
            <li>Refrain from automated scripting, API scraping, synthetic latency falsification, or exploit exploitation.</li>
            <li>Maintain the confidentiality of your session credentials.</li>
          </ul>
          <p className="text-[11px] text-[#8E8E9F] pt-1">
            soniq reserves the right to remove invalid leaderboard submissions, purge falsified records, or restrict access to accounts found in violation of platform integrity.
          </p>
        </div>

        {/* Section 4 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF32]" />
            4. Spotify Non-Affiliation & Platform Independence
          </h2>
          <p>
            soniq utilizes Spotify's Web API for metadata retrieval, album art display, and user authentication, but is not endorsed, certified, or sponsored by Spotify AB. Spotify and the Spotify logo are registered trademarks of Spotify AB.
          </p>
          <p>
            For further details regarding Spotify API compliance, please consult our{' '}
            <Link to="/spotify-disclaimer" className="text-[#D4FF32] underline hover:text-[#c2eb2c]">
              Spotify Disclaimer
            </Link>.
          </p>
        </div>

        {/* Section 5 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF32]" />
            5. Disclaimer of Warranties & Limitation of Liability
          </h2>
          <p>
            soniq is provided on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis without warranties of any kind, whether express or implied. While we strive for 99.9% uptime and low-latency audio buffering, we do not guarantee uninterrupted availability of external third-party CDN audio streams.
          </p>
        </div>

        {/* Section 6 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D4FF32]" />
            6. Contact & Legal Inquiries
          </h2>
          <p>
            For questions regarding these Terms, DMCA notices, or catalog permissions, please contact our administrative team at{' '}
            <a href="mailto:divyanshu@divyanshulohani.xyz" className="text-[#D4FF32] underline">
              divyanshu@divyanshulohani.xyz
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};
