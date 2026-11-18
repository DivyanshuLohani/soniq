import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
  Radio,
  Activity,
  Disc,
} from 'lucide-react';
import type { QuizData, AnswerRecord, SongOption } from '../types';
import { sounds } from '../utils/audioSynth';

interface GameStageProps {
  quiz: QuizData;
  onFinishQuiz: (answers: AnswerRecord[], totalTimeTaken: number) => void;
  onCancelQuiz: () => void;
}

const QUESTION_TIME_LIMIT = 15; // 15 seconds per question

export const GameStage: React.FC<GameStageProps> = ({
  quiz,
  onFinishQuiz,
  onCancelQuiz,
}) => {
  // Pre-session buffer/initialization state
  const [isInitializing, setIsInitializing] = useState(true);

  // Question & Gameplay state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  // Scores & streaks
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // Timers
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [totalElapsedTime, setTotalElapsedTime] = useState(0);

  // Audio snippet element
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(sounds.getMuted());

  // Audio reactive simulation driven by playback time and musical rhythm
  const [audioFrequencyData, setAudioFrequencyData] = useState<number[]>(() => new Array(24).fill(16));
  const [beatEnergy, setBeatEnergy] = useState<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const currentQuestion = quiz.questions[currentIndex];

  // Dynamic beat pulse & frequency animation tied to HTML5 audio playback
  useEffect(() => {
    if (!isPlayingAudio) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      setBeatEnergy(0);
      setAudioFrequencyData(new Array(24).fill(16));
      return;
    }

    const updateAudioFrame = () => {
      const audio = audioRef.current;
      const t = audio && audio.currentTime > 0 ? audio.currentTime : performance.now() / 1000;

      // Punchy 125 BPM beat drop & bass swell
      const beatCycle = (t * 2.1) % 1; // 0 to 1 cycle per beat
      const bassKick = Math.exp(-beatCycle * 5.0); // sharp kick decay
      const snareHit = Math.exp(-((beatCycle + 0.5) % 1) * 6.0) * 0.7;
      const combinedBeat = Math.min(1, bassKick + snareHit);
      setBeatEnergy(combinedBeat);

      // 24 dynamic frequency bars that flare past the 240px card
      const bars = Array.from({ length: 24 }, (_, i) => {
        const distFromCenter = Math.abs(i - 11.5) / 12; // 0 at center, 1 at edges
        const wave1 = Math.sin(t * 8.5 + i * 0.4) * 0.5 + 0.5;
        const wave2 = Math.cos(t * 13.0 - i * 0.6) * 0.5 + 0.5;
        
        // Bass heavy in center, high hats on wings
        const freqWeight = distFromCenter < 0.4 ? combinedBeat * 1.2 : wave2;
        const baseHeight = 25 + (1 - distFromCenter * 0.3) * 60;
        const dynamicBoost = (wave1 * 0.5 + freqWeight * 0.8) * (combinedBeat * 110 + 40);
        
        return Math.min(220, Math.max(20, Math.round(baseHeight + dynamicBoost)));
      });
      setAudioFrequencyData(bars);

      animationFrameRef.current = requestAnimationFrame(updateAudioFrame);
    };

    animationFrameRef.current = requestAnimationFrame(updateAudioFrame);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlayingAudio]);

  // 1. Initial seamless session load (1.2s buffer)
  useEffect(() => {
    if (!isInitializing) return;
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, [isInitializing]);

  // 2. Play Audio Snippet when question changes
  useEffect(() => {
    if (isInitializing || !currentQuestion) return;

    setIsRevealed(false);
    setSelectedOptionId(null);
    setQuestionTimeLeft(QUESTION_TIME_LIMIT);
    setAudioError(false);
    setAutoplayBlocked(false);

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = currentQuestion.audioUrl;
      audioRef.current.load();

      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlayingAudio(true);
            setAutoplayBlocked(false);
          })
          .catch((err) => {
            console.warn('Audio autoplay blocked by browser:', err);
            setIsPlayingAudio(false);
            setAutoplayBlocked(true);
          });
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [currentIndex, isInitializing, currentQuestion]);

  // 3. Question Countdown Timer & Total Game Timer
  useEffect(() => {
    if (isInitializing || isRevealed) return;

    const interval = setInterval(() => {
      // Total elapsed timer
      setTotalElapsedTime((prev) => +(prev + 0.1).toFixed(1));

      // Question countdown timer
      setQuestionTimeLeft((prev) => {
        if (prev <= 0.1) {
          clearInterval(interval);
          handleTimeExpired();
          return 0;
        }
        if (prev <= 3.0 && Math.floor(prev * 10) % 10 === 0) {
          sounds.playTick(750);
        }
        return +(prev - 0.1).toFixed(1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isInitializing, isRevealed, currentIndex]);

  // Handle timeout on a question
  const handleTimeExpired = () => {
    if (isRevealed || !currentQuestion) return;
    setIsRevealed(true);
    sounds.playWrong();
    setStreak(0);

    const timeSpent = QUESTION_TIME_LIMIT;
    const answerRecord: AnswerRecord = {
      questionIndex: currentIndex,
      trackId: currentQuestion.correctTrackId,
      trackName: currentQuestion.correctTrackName,
      selectedTrackId: 'TIMEOUT',
      selectedTrackName: 'Time expired',
      isCorrect: false,
      timeSpentSeconds: timeSpent,
      albumCover: currentQuestion.albumCover,
    };

    const nextAnswers = [...answers, answerRecord];
    setAnswers(nextAnswers);

    // Auto-advance
    setTimeout(() => {
      advanceNextQuestion(nextAnswers);
    }, 1100);
  };

  // Handle user selecting an option
  const handleSelectOption = (option: SongOption) => {
    if (isRevealed || isInitializing || !currentQuestion) return;

    setIsRevealed(true);
    setSelectedOptionId(option.id);

    const isCorrect = option.id === currentQuestion.correctTrackId;
    const timeSpent = +(QUESTION_TIME_LIMIT - questionTimeLeft).toFixed(1);

    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);

      const speedBonus = Math.max(0, Math.round(questionTimeLeft * 8));
      let multiplier = 1.0;
      if (nextStreak >= 5) multiplier = 2.0;
      else if (nextStreak >= 3) multiplier = 1.5;
      else if (nextStreak >= 2) multiplier = 1.2;

      const pointsEarned = Math.round((100 + speedBonus) * multiplier);
      setScore((s) => s + pointsEarned);

      sounds.playCorrect();
    } else {
      setStreak(0);
      sounds.playWrong();
    }

    const answerRecord: AnswerRecord = {
      questionIndex: currentIndex,
      trackId: currentQuestion.correctTrackId,
      trackName: currentQuestion.correctTrackName,
      selectedTrackId: option.id,
      selectedTrackName: option.name,
      isCorrect,
      timeSpentSeconds: Math.max(0.4, timeSpent),
      albumCover: currentQuestion.albumCover,
    };

    const nextAnswers = [...answers, answerRecord];
    setAnswers(nextAnswers);

    // Auto-advance
    setTimeout(() => {
      advanceNextQuestion(nextAnswers);
    }, 1100);
  };

  // Advance to next question or complete quiz
  const advanceNextQuestion = (currentAnswersList: AnswerRecord[]) => {
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Session finished
      sounds.playVictory();
      onFinishQuiz(currentAnswersList, totalElapsedTime);
    }
  };

  // Keyboard shortcut listener (keys 1, 2, 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isInitializing || isRevealed || !currentQuestion) return;

      if (e.key === '1' && currentQuestion.options[0]) {
        handleSelectOption(currentQuestion.options[0]);
      } else if (e.key === '2' && currentQuestion.options[1]) {
        handleSelectOption(currentQuestion.options[1]);
      } else if (e.key === '3' && currentQuestion.options[2]) {
        handleSelectOption(currentQuestion.options[2]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isInitializing, isRevealed, currentQuestion, questionTimeLeft]);

  // Audio control toggles
  const handleTogglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current
        .play()
        .then(() => {
          setIsPlayingAudio(true);
          setAutoplayBlocked(false);
        })
        .catch(() => {
          setAudioError(true);
        });
    }
  };

  const handleReplayAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => {
        setIsPlayingAudio(true);
        setAutoplayBlocked(false);
      })
      .catch(() => {
        setAudioError(true);
      });
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    sounds.setMuted(next);
    setIsMuted(next);
    if (!next) sounds.playClick();
  };

  // Pre-session initialization screen
  if (isInitializing) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#08080B]/95 backdrop-blur-md select-none">
        <div className="text-center space-y-4 max-w-sm px-4">
          <div className="w-10 h-10 rounded-full bg-[#12131A] border border-white/[0.1] mx-auto flex items-center justify-center">
            <Radio className="w-5 h-5 text-[#D4FF32]" />
          </div>
          <div>
            <h3 className="font-headline text-base font-bold text-[#F4F4F7]">
              Loading tracks...
            </h3>
            <p className="text-xs font-mono text-[#8E8E9F] mt-1">
              {quiz.artistName} • 10 Songs
            </p>
          </div>
          <div className="w-48 h-1 bg-[#12131A] rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-[#D4FF32] rounded-full animate-pulse" style={{ width: '80%' }} />
          </div>
        </div>
      </div>
    );
  }

  const isUrgentTime = questionTimeLeft <= 4.0;

  return (
    <div className="h-full w-full max-h-[100dvh] flex flex-col p-4 sm:p-6 overflow-hidden max-w-lg sm:max-w-xl mx-auto select-none">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => {
          setAudioError(true);
          setIsPlayingAudio(false);
        }}
      />

      {/* 1. TOP BAR HUD - Clean, spacious, well balanced */}
      <header className="shrink-0 w-full flex items-center justify-between pb-3 border-b border-white/[0.08] mb-3">
        {/* Left: Exit button & Track Counter */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sounds.playClick();
              onCancelQuiz();
            }}
            title="Exit Quiz"
            className="p-1.5 -ml-1.5 rounded-lg text-[#8E8E9F] hover:text-[#FF4694] hover:bg-white/[0.04] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-[#F4F4F7]">
            TRACK <span className="text-[#D4FF32] font-bold">{String(currentIndex + 1).padStart(2, '0')}</span>
            <span className="text-[#8E8E9F]">/{String(quiz.questions.length).padStart(2, '0')}</span>
          </div>
        </div>

        {/* Center: Streak Pill (if any) */}
        {streak > 1 && (
          <div className="font-mono text-[11px] font-semibold text-[#D4FF32] px-2.5 py-0.5 rounded-full bg-[#D4FF32]/10 border border-[#D4FF32]/30 animate-pulse">
            STREAK {streak}
          </div>
        )}

        {/* Right: Score, Timer & Mute */}
        <div className="flex items-center gap-3">
          <div className="font-mono text-xs sm:text-sm font-bold text-[#F4F4F7]">
            {score.toLocaleString()} <span className="text-[10px] text-[#8E8E9F] font-normal">PTS</span>
          </div>

          <div className="hidden xs:flex items-center gap-1 text-xs font-mono text-[#8E8E9F]">
            <Clock className="w-3.5 h-3.5 text-[#8E8E9F]" />
            <span>{totalElapsedTime.toFixed(1)}s</span>
          </div>

          <button
            onClick={handleToggleMute}
            className="p-1.5 rounded-lg text-[#8E8E9F] hover:text-[#F4F4F7] hover:bg-white/[0.04] transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#8E8E9F]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#D4FF32]" />
            )}
          </button>
        </div>
      </header>

      {/* 2. TIMELINE PROGRESS BAR */}
      <div className="shrink-0 w-full mb-4">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-[#8E8E9F]">EXCERPT TIMELINE</span>
          <span className={isUrgentTime ? 'text-[#FF4694] font-bold' : 'text-[#8E8E9F]'}>
            {questionTimeLeft.toFixed(1)}s REMAINING
          </span>
        </div>
        <div className="w-full h-1.5 bg-[#12131A] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              isUrgentTime ? 'bg-[#FF4694]' : 'bg-[#D4FF32]'
            }`}
            style={{ width: `${(questionTimeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. CENTER PLAYER SQUARE - Clean, steady hero square */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-2 relative">
        {/* Ambient glow & Animated Music Bars behind the square */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <div
            className={`absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border border-[#D4FF32]/15 transition-opacity duration-300 ${
              isPlayingAudio ? 'opacity-40' : 'opacity-5'
            }`}
          />
          <div
            className={`absolute w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-radial from-[#D4FF32]/10 via-transparent to-transparent blur-2xl transition-opacity duration-500 ${
              isPlayingAudio ? 'opacity-60' : 'opacity-0'
            }`}
          />

          {/* Equalizer Frequency Bars reacting with the music behind the square */}
          {isPlayingAudio && (
            <div className="absolute flex items-center justify-center w-full max-w-[340px] sm:max-w-[420px] px-2 gap-1.5 sm:gap-2 z-0">
              {audioFrequencyData.map((height, i) => (
                <div
                  key={i}
                  className="w-1.5 sm:w-2.5 rounded-full transition-all duration-75 shrink-0"
                  style={{
                    height: `${height}px`,
                    backgroundColor: i % 2 === 0 ? '#D4FF32' : '#B49BFF',
                    opacity: 0.6 + (height / 220) * 0.4,
                    boxShadow: height > 80 ? '0 0 16px rgba(212, 255, 50, 0.5)' : 'none',
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Beat-reactive dynamic glow and shadow behind the square */}
        <div
          className="absolute z-0 rounded-3xl pointer-events-none transition-all duration-75"
          style={{
            width: isPlayingAudio ? `${220 + beatEnergy * 50}px` : '208px',
            height: isPlayingAudio ? `${220 + beatEnergy * 50}px` : '208px',
            background: isPlayingAudio
              ? `radial-gradient(circle, rgba(212, 255, 50, ${0.25 + beatEnergy * 0.35}) 0%, rgba(180, 155, 255, ${0.15 + beatEnergy * 0.25}) 50%, transparent 80%)`
              : 'transparent',
            filter: `blur(${16 + beatEnergy * 24}px)`,
            opacity: isPlayingAudio ? 0.85 + beatEnergy * 0.15 : 0,
            transform: `scale(${1 + beatEnergy * 0.12})`,
          }}
        />

        {/* Square Card - Stable & Steady (no wobble) with beat-reactive glow border/shadow */}
        <div
          className="relative z-10 w-52 h-52 sm:w-60 sm:h-60 aspect-square rounded-3xl overflow-hidden bg-[#0D0D11] border border-white/[0.12] flex flex-col items-center justify-center p-5 text-center group transition-shadow duration-75"
          style={{
            boxShadow: isPlayingAudio
              ? `0 0 ${20 + beatEnergy * 35}px rgba(212, 255, 50, ${0.2 + beatEnergy * 0.35}), 0 20px 40px -15px rgba(0, 0, 0, 0.9)`
              : '0 20px 40px -15px rgba(0, 0, 0, 0.9)',
          }}
        >
          {isRevealed ? (
            <>
              <img
                src={currentQuestion.albumCover}
                alt={currentQuestion.correctTrackName}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-4 text-left">
                <span className="text-[10px] font-mono text-[#D4FF32] tracking-wider uppercase font-bold">Answer</span>
                <h3 className="font-headline font-bold text-base sm:text-lg text-white truncate">
                  {currentQuestion.correctTrackName}
                </h3>
                <p className="text-xs sm:text-sm text-white/70 truncate">{quiz.artistName}</p>
              </div>
            </>
          ) : (
            <>
              {/* Subtle accent glow inside card when playing */}
              {isPlayingAudio && (
                <div className="absolute inset-0 bg-gradient-to-br from-[#D4FF32]/5 via-transparent to-[#B49BFF]/5 pointer-events-none" />
              )}

              {/* Center icon / Play state */}
              <div className="relative z-10 flex flex-col items-center justify-center gap-2.5">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  isPlayingAudio
                    ? 'bg-[#D4FF32]/15 border border-[#D4FF32]/40 text-[#D4FF32]'
                    : 'bg-[#181924] border border-white/10 text-[#8E8E9F]'
                }`}>
                  <Radio className={`w-8 h-8 ${isPlayingAudio ? 'animate-pulse text-[#D4FF32]' : ''}`} />
                </div>

                <div className="text-center px-2">
                  <h3 className="font-headline text-base sm:text-lg font-bold text-[#F4F4F7] truncate max-w-[190px]">
                    {quiz.artistName}
                  </h3>
                  <p className="text-xs text-[#8E8E9F] font-mono mt-0.5">
                    Which song is playing?
                  </p>
                </div>
              </div>

              {/* Bottom Quick Controls in Square */}
              <div className="relative z-10 flex items-center gap-2 mt-3">
                <button
                  onClick={handleTogglePlayAudio}
                  className="px-3.5 py-1.5 rounded-full bg-[#181924] hover:bg-[#202230] text-[#F4F4F7] text-xs font-mono border border-white/10 flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {isPlayingAudio ? (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-[#D4FF32]" />
                      <span>Playing</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current text-[#F4F4F7]" />
                      <span>Play</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleReplayAudio}
                  title="Replay from start"
                  className="p-1.5 rounded-full bg-[#181924] hover:bg-[#202230] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/10 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}

          {audioError && (
            <div className="absolute inset-x-0 bottom-0 text-[10px] text-[#FF4694] font-mono flex items-center justify-between px-3 py-1 bg-[#FF4694]/20 border-t border-[#FF4694]/30 z-20">
              <span className="truncate">Buffering excerpt...</span>
              <button
                onClick={handleReplayAudio}
                className="text-[#D4FF32] font-semibold underline ml-2 shrink-0"
              >
                Retry
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4. SELECTION OPTIONS - Clean, prominent, easy to click */}
      <div className="shrink-0 w-full space-y-2 pt-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E9F] flex items-center justify-between px-1">
          <span>CHOOSE THE TRACK</span>
          <span className="hidden sm:inline text-[#8E8E9F]/60">
            Keys [1], [2], [3]
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption = option.id === currentQuestion.correctTrackId;

            let cardClasses =
              'bg-[#12131A] hover:bg-[#181924] border-white/[0.08] text-[#F4F4F7] hover:border-white/[0.2]';

            if (isRevealed) {
              if (isCorrectOption) {
                cardClasses =
                  'bg-[#D4FF32] border-[#D4FF32] text-[#08080B] font-semibold shadow-lg shadow-[#D4FF32]/10';
              } else if (isSelected && !isCorrectOption) {
                cardClasses =
                  'bg-[#FF4694]/10 border-[#FF4694] text-[#FF4694]';
              } else {
                cardClasses = 'bg-[#0D0D11] border-white/[0.04] text-[#8E8E9F] opacity-30';
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                disabled={isRevealed}
                className={`w-full py-3 sm:py-3.5 px-3.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group active:scale-[0.99] ${cardClasses}`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  {/* Left key-index pill [1, 2, 3] in Space Mono */}
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold transition-colors shrink-0 ${
                      isRevealed && isCorrectOption
                        ? 'bg-[#08080B] text-[#D4FF32]'
                        : isRevealed && isSelected && !isCorrectOption
                        ? 'bg-[#FF4694] text-[#08080B]'
                        : 'bg-[#181924] text-[#8E8E9F] border border-white/[0.08]'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Album Cover Thumbnail */}
                  <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden bg-[#08080B] border border-white/[0.08] shrink-0">
                    <img
                      src={option.albumCover || currentQuestion.albumCover}
                      alt={option.albumName || option.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Track Name & Album Title */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-headline font-semibold text-xs sm:text-sm truncate">
                      {option.name}
                    </h4>
                    <p className={`text-[11px] truncate font-body ${
                      isRevealed && isCorrectOption ? 'text-[#08080B]/80' : 'text-[#8E8E9F]'
                    }`}>
                      {option.albumName || quiz.artistName}
                    </p>
                  </div>
                </div>

                {/* Outcome indicator */}
                <div className="ml-2 shrink-0">
                  {isRevealed && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-[#08080B]" />
                  )}
                  {isRevealed && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-[#FF4694]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
