import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, Lock, Eye, Database } from 'lucide-react';
import { sounds } from '../utils/audioSynth';

export const PrivacyPage: React.FC = () => {
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
          <ShieldCheck className="w-3.5 h-3.5 text-[#B49BFF]" />
          <span>Data Governance • Effective November 2026</span>
        </div>
        <h1 className="font-headline text-3xl sm:text-4xl font-bold tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs sm:text-sm font-body text-[#8E8E9F] mt-2 max-w-2xl leading-relaxed">
          Your privacy and data sovereignty are paramount. This policy outlines what data soniq collects,
          how session telemetry is utilized, and your rights to manage or delete your records.
        </p>
      </div>

      {/* Structured Privacy Content */}
      <div className="space-y-6 text-xs sm:text-sm font-body text-[#8E8E9F] leading-relaxed">
        {/* Section 1 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B49BFF]" />
            1. Information We Collect
          </h2>
          <p>
            We adhere to data minimization principles and collect only the information necessary to provide catalog assessment features:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-[#8E8E9F]">
            <li>
              <strong className="text-[#F4F4F7]">Spotify Account Information:</strong> If you authenticate via Spotify OAuth 2.0, we receive your public Spotify ID, display name, avatar URL, and subscription tier (Free vs. Premium). We never receive or store your Spotify account password.
            </li>
            <li>
              <strong className="text-[#F4F4F7]">Direct Credentials:</strong> For email registrations, we store your email address and salted bcrypt password hash. We never store plain-text passwords.
            </li>
            <li>
              <strong className="text-[#F4F4F7]">Assessment Telemetry:</strong> To rank leaderboard scores, we log question response times (mean latency), accuracy percentages, chosen answers, and session timestamps.
            </li>
          </ul>
        </div>

        {/* Section 2 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B49BFF]" />
            2. Information We Never Collect or Sell
          </h2>
          <div className="p-3.5 rounded-xl bg-[#12131A] border border-white/[0.06] text-xs text-[#F4F4F7] space-y-1">
            <div className="flex items-center gap-2 text-[#D4FF32] font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>Zero Monetization of Personal Data</span>
            </div>
            <p className="text-[#8E8E9F]">
              soniq does not sell, rent, monetize, or broker personal user records or telemetry to advertisers or data aggregators. We do not track browsing history outside of soniq.
            </p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B49BFF]" />
            3. Cookies & Session Storage
          </h2>
          <p>
            soniq uses an <code className="text-[#D4FF32] font-mono">auth_token</code> cookie with <code className="text-[#F4F4F7] font-mono">HttpOnly</code>, <code className="text-[#F4F4F7] font-mono">Secure</code>, and <code className="text-[#F4F4F7] font-mono">SameSite=Lax</code> flags to securely persist your authenticated session.
          </p>
          <p>
            Anonymous telemetry and aggregate page visits are monitored using Google Analytics 4 (GA4) with IP anonymization enabled.
          </p>
        </div>

        {/* Section 4 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B49BFF]" />
            4. Data Retention & Account Deletion Rights
          </h2>
          <p>
            You hold the right to inspect, export, or delete your user record and quiz history at any time. When you delete your account from the{' '}
            <Link to="/account" className="text-[#D4FF32] underline hover:text-[#c2eb2c]">
              Account Console
            </Link>, all associated quiz sessions and telemetry records are permanently purged from PostgreSQL.
          </p>
        </div>

        {/* Section 5 */}
        <div className="bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-7 space-y-3">
          <h2 className="font-headline text-base sm:text-lg font-semibold text-[#F4F4F7] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B49BFF]" />
            5. Contact Data Protection Officer
          </h2>
          <p>
            For privacy inquiries, GDPR/CCPA data export requests, or security vulnerability disclosures, contact our privacy officer at{' '}
            <a href="mailto:divyanshu@divyanshulohani.xyz" className="text-[#D4FF32] underline">
              divyanshu@divyanshulohani.xyz
            </a>.
          </p>
        </div>
      </div>
    </div>
  );
};
