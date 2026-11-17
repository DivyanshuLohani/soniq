import React, { useRef, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import * as htmlToImage from 'html-to-image';
import {
  Clock,
  Target,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  Trophy,
  ArrowRight,
  BarChart2,
  Layers,
  Sparkles,
  Share2,
  Download,
  Copy,
  Check,
  Zap,
  Flame,
  X,
} from 'lucide-react';
import type { QuizResultSession, AnswerRecord } from '../types';
import { sounds } from '../utils/audioSynth';

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
  const accuracyPercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const avgSpeed = totalQuestions > 0 ? (totalTimeTaken / totalQuestions).toFixed(2) : '0.00';

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

  // Share Card generation state
  const shareCardRef = useRef<HTMLDivElement | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Trigger celebration confetti if all questions are right
  useEffect(() => {
    if (isPerfectScore) {
      sounds.playStreak();

      const duration = 2500;
      const animationEnd = Date.now() + duration;
      const colors = ['#D4FF32', '#B49BFF', '#FF4694', '#FFFFFF'];

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

  // Generate share image
  const handleOpenShare = async () => {
    sounds.playClick();
    setIsShareModalOpen(true);
    setIsGeneratingImage(true);

    // Allow DOM to settle
    setTimeout(async () => {
      if (shareCardRef.current) {
        try {
          const dataUrl = await htmlToImage.toPng(shareCardRef.current, {
            pixelRatio: 2,
            quality: 0.95,
            cacheBust: true,
          });
          setGeneratedImageUrl(dataUrl);
        } catch (err) {
          console.error('Failed to generate image:', err);
        } finally {
          setIsGeneratingImage(false);
        }
      } else {
        setIsGeneratingImage(false);
      }
    }, 150);
  };

  // Construct direct challenge link with tracking query params
  const directPlayParam = artistName.startsWith('playlist_')
    ? `playlist=${encodeURIComponent(artistName.replace('playlist_', ''))}`
    : `play=${encodeURIComponent(artistName)}`;
  const sidParam = session?.id ? `&sid=${encodeURIComponent(session.id)}` : '';
  const challengeUrl = `${window.location.origin}/?${directPlayParam}${sidParam}`;

  // Native Web Share API (opens Instagram, WhatsApp, X, etc. on mobile & desktop)
  const handleNativeShare = async () => {
    sounds.playClick();
    if (!shareCardRef.current) return;

    try {
      const blob = await htmlToImage.toBlob(shareCardRef.current, {
        pixelRatio: 2,
        quality: 0.95,
      });

      if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'soniq-results.png', { type: 'image/png' })] })) {
        const file = new File([blob], 'soniq-results.png', { type: 'image/png' });
        await navigator.share({
          title: `My soniq quiz score on ${artistName}!`,
          text: `I just scored ${session?.score || 0} pts with ${accuracyPercent}% accuracy on ${artistName} on soniq! Can you beat me? Play now:`,
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
      console.warn('Share dismissed or failed:', err);
    }
  };

  const handleDownloadImage = async () => {
    sounds.playClick();
    if (!shareCardRef.current) return;
    try {
      const dataUrl = generatedImageUrl || await htmlToImage.toPng(shareCardRef.current, { pixelRatio: 2 });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `soniq-${artistName.toLowerCase().replace(/\s+/g, '-')}-score.png`;
      a.click();
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleCopyImage = async () => {
    sounds.playClick();
    if (!shareCardRef.current) return;
    try {
      const blob = await htmlToImage.toBlob(shareCardRef.current, { pixelRatio: 2 });
      if (blob && (window as any).ClipboardItem) {
        await navigator.clipboard.write([
          new (window as any).ClipboardItem({ 'image/png': blob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      } else {
        handleDownloadImage();
      }
    } catch (err) {
      console.error('Copy image error:', err);
      handleDownloadImage();
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
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-8 flex flex-col items-center animate-fade-in select-none">
      {/* Session Report Header Card */}
      <div className="w-full bg-[#0D0D11] border border-white/[0.08] rounded-2xl p-6 sm:p-8 shadow-lg relative overflow-hidden mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.08]">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-[#12131A] border border-white/[0.08] text-[11px] font-mono text-[#8E8E9F] mb-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4FF32]" />
              <span>Quiz Finished</span>
            </div>
            <h2 className="font-headline text-2xl sm:text-3xl font-bold text-[#F4F4F7] tracking-tight">
              Your Quiz Results
            </h2>
            <p className="text-xs font-body text-[#8E8E9F] mt-0.5">
              Artist: <span className="text-[#F4F4F7] font-semibold">{artistName}</span> • {totalQuestions} Songs Played
            </p>
            {isPerfectScore && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#D4FF32]/10 border border-[#D4FF32]/30 text-[11px] font-mono text-[#D4FF32] mt-2">
                <Sparkles className="w-3 h-3 text-[#D4FF32]" />
                <span>100% Correct • Perfect Run!</span>
              </div>
            )}
          </div>

          {session?.artistRank && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#12131A] border border-white/[0.08] text-xs font-mono text-[#D4FF32]">
              <Trophy className="w-3.5 h-3.5 text-[#D4FF32]" />
              <span>Leaderboard Rank #{session.artistRank}</span>
            </div>
          )}
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-3.5">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
              Score
            </span>
            <span className="font-mono text-2xl font-bold text-[#D4FF32]">
              {session ? session.score.toLocaleString() : '---'}
            </span>
            <span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
              Points
            </span>
          </div>

          <div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-3.5">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
              Accuracy
            </span>
            <span className="font-mono text-2xl font-bold text-[#F4F4F7]">
              {accuracyPercent}%
            </span>
            <span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
              {correctCount} / {totalQuestions} Correct
            </span>
          </div>

          <div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-3.5">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
              Avg Speed
            </span>
            <span className="font-mono text-2xl font-bold text-[#F4F4F7]">
              {avgSpeed}s
            </span>
            <span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
              Per Song
            </span>
          </div>

          <div className="bg-[#12131A] border border-white/[0.06] rounded-xl p-3.5">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] block mb-1">
              Streak
            </span>
            <span className="font-mono text-2xl font-bold text-[#B49BFF]">
              {maxStreak}
            </span>
            <span className="text-[10px] font-mono text-[#8E8E9F] block mt-0.5">
              Best Streak
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <button
            onClick={handleOpenShare}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#B49BFF] text-[#08080B] hover:bg-[#a385fa] flex items-center justify-center gap-2 transition-all shadow-md group"
          >
            <Share2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
            <span>Share Result</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onPlayAgain();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Play Again</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onPickNewArtist();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#12131A] hover:bg-[#181924] text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-2 transition-all"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Pick Another Artist</span>
          </button>

          <button
            onClick={() => {
              sounds.playClick();
              onViewLeaderboard();
            }}
            className="w-full sm:w-auto px-5 py-2.5 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-2 transition-all"
          >
            <Trophy className="w-3.5 h-3.5 text-[#D4FF32]" />
            <span>Leaderboard</span>
          </button>
        </div>
      </div>

      {/* Track by Track Breakdown */}
      <div className="w-full space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-headline text-xs sm:text-sm font-semibold uppercase tracking-wider text-[#F4F4F7]">
            Track by Track
          </h3>
          <span className="font-mono text-xs text-[#8E8E9F]">
            {correctCount} / {answers.length} Correct
          </span>
        </div>

        <div className="space-y-1.5">
          {answers.map((item, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                item.isCorrect
                  ? 'bg-[#0D0D11] border-white/[0.08]'
                  : 'bg-[#0D0D11] border-[#FF4694]/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-6 h-6 rounded-md bg-[#12131A] text-[#8E8E9F] flex items-center justify-center text-xs font-mono font-bold shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>

                <img
                  src={item.albumCover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80'}
                  alt={item.trackName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
                  }}
                  className="w-10 h-10 rounded-lg object-cover bg-[#08080B] border border-white/[0.08] shrink-0"
                />

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="font-headline font-semibold text-xs sm:text-sm text-[#F4F4F7] truncate">
                      {item.trackName}
                    </h4>
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FF32] shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-[#FF4694] shrink-0" />
                    )}
                  </div>

                  {!item.isCorrect && (
                    <p className="text-[11px] text-[#FF4694] font-body truncate mt-0.5">
                      Selected: <span className="line-through text-[#8E8E9F]">{item.selectedTrackName}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 ml-2">
                <span className="text-xs font-mono text-[#8E8E9F]">
                  {item.timeSpentSeconds.toFixed(2)}s
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hidden Render Target for Shareable Story Image Generation */}
      <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
        <div
          ref={shareCardRef}
          className="w-[420px] p-7 rounded-3xl bg-[#08080B] border-2 border-[#D4FF32]/40 text-[#F4F4F7] flex flex-col justify-between relative overflow-hidden font-sans"
          style={{
            minHeight: '620px',
            backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(212,255,50,0.12) 0%, transparent 50%), radial-gradient(circle at 0% 100%, rgba(180,155,255,0.1) 0%, transparent 50%)',
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
              {isPerfectScore ? 'PERFECT RUN' : accuracyPercent >= 80 ? 'EXPERT TIER' : 'MUSIC LOVER'}
            </div>
          </div>

          {/* Artist & Artwork Highlight */}
          <div className="flex flex-col items-center text-center my-4 space-y-3">
            {session?.artistImage ? (
              <img
                src={session.artistImage}
                alt={artistName}
                crossOrigin="anonymous"
                className="w-28 h-28 rounded-2xl object-cover shadow-2xl border-2 border-white/[0.12]"
              />
            ) : (
              <div className="w-28 h-28 rounded-2xl bg-[#12131A] border border-white/[0.1] flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-[#D4FF32]" />
              </div>
            )}
            <div>
              <p className="text-xs font-mono text-[#8E8E9F] uppercase tracking-widest">
                QUIZ COMPLETED
              </p>
              <h2 className="font-headline text-2xl font-black text-[#F4F4F7] tracking-tight">
                {artistName}
              </h2>
            </div>
          </div>

          {/* Big Score Counter */}
          <div className="bg-[#0D0D11]/90 border border-white/[0.1] rounded-2xl p-4 text-center my-2 shadow-inner">
            <span className="text-[11px] font-mono uppercase text-[#8E8E9F] tracking-wider block">
              FINAL SCORE
            </span>
            <div className="font-mono text-5xl font-black text-[#D4FF32] my-1 tracking-tight">
              {session?.score.toLocaleString() || '0'}
            </div>
            <div className="flex items-center justify-center gap-2 text-xs font-mono text-[#8E8E9F]">
              <span className="text-[#F4F4F7] font-semibold">{correctCount}/{totalQuestions} Correct</span>
              <span>•</span>
              <span className="text-[#D4FF32] font-semibold">{accuracyPercent}% Accuracy</span>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-2 my-2">
            <div className="bg-[#12131A] border border-white/[0.08] p-3 rounded-xl text-center">
              <span className="text-[10px] font-mono uppercase text-[#8E8E9F] block">Reaction Speed</span>
              <span className="font-mono text-lg font-bold text-[#F4F4F7]">{avgSpeed}s</span>
            </div>
            <div className="bg-[#12131A] border border-white/[0.08] p-3 rounded-xl text-center">
              <span className="text-[10px] font-mono uppercase text-[#8E8E9F] block">Top Streak</span>
              <span className="font-mono text-lg font-bold text-[#B49BFF]">{maxStreak} In A Row</span>
            </div>
          </div>

          {/* Card Footer Call to Action */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#8E8E9F]">
            <span>Play free at soniq.dibbu.dev</span>
            <span className="text-[#D4FF32]">Can you beat my score?</span>
          </div>
        </div>
      </div>

      {/* Share Result Dialog Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D0D11] border border-white/[0.1] rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl relative flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#B49BFF]" />
                <h3 className="font-headline font-bold text-sm sm:text-base text-[#F4F4F7]">
                  Share Your Score
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1 rounded-full text-[#8E8E9F] hover:text-[#F4F4F7] hover:bg-[#12131A]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Image Preview Container */}
            <div className="relative rounded-2xl overflow-hidden bg-[#08080B] border border-white/[0.08] flex items-center justify-center p-2 min-h-[300px]">
              {isGeneratingImage ? (
                <div className="flex flex-col items-center gap-2 text-xs font-mono text-[#8E8E9F]">
                  <span className="w-5 h-5 border-2 border-[#D4FF32] border-t-transparent rounded-full animate-spin" />
                  <span>Snapping score card...</span>
                </div>
              ) : generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt="Score Card Preview"
                  className="w-full max-h-[340px] object-contain rounded-xl shadow-lg"
                />
              ) : null}
            </div>

            {/* Sharing Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleNativeShare}
                className="col-span-2 py-2.5 px-4 rounded-full font-headline font-semibold text-xs sm:text-sm bg-[#D4FF32] text-[#08080B] hover:bg-[#c2eb2c] flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Share2 className="w-4 h-4" />
                <span>Share to Socials (Instagram / X / WhatsApp)</span>
              </button>

              <button
                onClick={handleCopyImage}
                className="py-2 px-3 rounded-full font-headline font-semibold text-xs bg-[#12131A] hover:bg-[#181924] text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-1.5 transition-all"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-[#D4FF32]" />
                    <span className="text-[#D4FF32]">Copied Image!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-[#8E8E9F]" />
                    <span>Copy Image</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadImage}
                className="py-2 px-3 rounded-full font-headline font-semibold text-xs bg-[#12131A] hover:bg-[#181924] text-[#F4F4F7] border border-white/[0.08] flex items-center justify-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5 text-[#8E8E9F]" />
                <span>Download PNG</span>
              </button>
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full py-2 rounded-full text-xs font-mono text-[#8E8E9F] hover:text-[#F4F4F7] flex items-center justify-center gap-1.5 border border-dashed border-white/[0.08]"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-[#D4FF32]" />
                  <span className="text-[#D4FF32]">Link copied to clipboard!</span>
                </>
              ) : (
                <span>Copy challenge link</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
