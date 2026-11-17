import React, { useState, useEffect, useRef } from 'react';
import {
  Flame,
  Clock,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  X,
  AlertCircle,
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
  // Pre-game countdown state
  const [countdown, setCountdown] = useState<number | null>(3);

  // Question & Gameplay state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [floatingScore, setFloatingScore] = useState<number | null>(null);

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

  const currentQuestion = quiz.questions[currentIndex];

  // 1. Initial 3-2-1 Countdown
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      sounds.playTick(600 + (3 - countdown) * 150);
      const timer = setTimeout(() => {
        setCountdown((c) => (c !== null ? c - 1 : null));
      }, 900);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      sounds.playTick(1200);
      const timer = setTimeout(() => {
        setCountdown(null); // start game!
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // 2. Play Audio Snippet when question changes
  useEffect(() => {
    if (countdown !== null || !currentQuestion) return;

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
  }, [currentIndex, countdown, currentQuestion]);

  // 3. Question Countdown Timer & Total Game Timer
  useEffect(() => {
    if (countdown !== null || isRevealed) return;

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
        // Audio tick when under 4 seconds
        if (prev <= 4.0 && Math.floor(prev * 10) % 10 === 0) {
          sounds.playTick(900);
        }
        return +(prev - 0.1).toFixed(1);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [countdown, isRevealed, currentIndex]);

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
      selectedTrackName: 'Ran out of time',
      isCorrect: false,
      timeSpentSeconds: timeSpent,
      albumCover: currentQuestion.albumCover,
    };

    const nextAnswers = [...answers, answerRecord];
    setAnswers(nextAnswers);

    // Auto-advance
    setTimeout(() => {
      advanceNextQuestion(nextAnswers);
    }, 1300);
  };

  // Handle user selecting an option
  const handleSelectOption = (option: SongOption) => {
    if (isRevealed || countdown !== null || !currentQuestion) return;

    setIsRevealed(true);
    setSelectedOptionId(option.id);

    const isCorrect = option.id === currentQuestion.correctTrackId;
    const timeSpent = +(QUESTION_TIME_LIMIT - questionTimeLeft).toFixed(1);

    let pointsEarned = 0;
    if (isCorrect) {
      const nextStreak = streak + 1;
      setStreak(nextStreak);

      const speedBonus = Math.max(0, Math.round(questionTimeLeft * 8));
      let multiplier = 1.0;
      if (nextStreak >= 5) multiplier = 2.0;
      else if (nextStreak >= 3) multiplier = 1.5;
      else if (nextStreak >= 2) multiplier = 1.2;

      pointsEarned = Math.round((100 + speedBonus) * multiplier);
      setScore((s) => s + pointsEarned);
      setFloatingScore(pointsEarned);

      if (nextStreak >= 3) {
        sounds.playStreak();
      } else {
        sounds.playCorrect();
      }
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

    // Fade out floating score
    setTimeout(() => setFloatingScore(null), 900);

    // Auto-advance
    setTimeout(() => {
      advanceNextQuestion(nextAnswers);
    }, 1300);
  };

  // Advance to next question or complete quiz
  const advanceNextQuestion = (currentAnswersList: AnswerRecord[]) => {
    if (currentIndex + 1 < quiz.questions.length) {
      setCurrentIndex((i) => i + 1);
    } else {
      // Quiz Finished!
      sounds.playVictory();
      onFinishQuiz(currentAnswersList, totalElapsedTime);
    }
  };

  // Keyboard shortcut listener (keys 1, 2, 3)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (countdown !== null || isRevealed || !currentQuestion) return;

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
  }, [countdown, isRevealed, currentQuestion, questionTimeLeft]);

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

  // Pre-game 3-2-1 Overlay
  if (countdown !== null) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#090d16]/95 backdrop-blur-xl">
        <div className="text-center space-y-3 animate-scale-up">
          <p className="text-emerald-400 font-extrabold uppercase tracking-widest text-xs sm:text-sm">
            {quiz.artistName} Quiz
          </p>
          <div className="text-7xl sm:text-9xl font-black bg-gradient-to-b from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
            {countdown === 0 ? 'GO!' : countdown}
          </div>
          <p className="text-slate-400 text-xs">
            Listen closely & pick the right song!
          </p>
        </div>
      </div>
    );
  }

  // Timer color calculation
  const timerRatio = questionTimeLeft / QUESTION_TIME_LIMIT;
  const timerColor =
    timerRatio > 0.5
      ? 'from-emerald-400 to-teal-400'
      : timerRatio > 0.25
      ? 'from-amber-400 to-orange-400'
      : 'from-rose-500 to-red-600';

  return (
    <div className="h-full w-full max-h-[100dvh] flex flex-col justify-between p-2.5 sm:p-4 overflow-hidden max-w-lg sm:max-w-2xl mx-auto select-none">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => {
          setAudioError(true);
          setIsPlayingAudio(false);
        }}
      />

      {/* 1. TOP HUD (Ultra-Compact Single Row Bar) */}
      <div className="shrink-0 w-full bg-[#101728]/95 border border-white/10 rounded-2xl p-2 sm:p-2.5 shadow-lg backdrop-blur-md flex items-center justify-between">
        {/* Left: Exit button & Question index */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sounds.playClick();
              onCancelQuiz();
            }}
            title="Quit Quiz"
            className="p-1 sm:p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs sm:text-sm font-black text-white whitespace-nowrap">
            Q {currentIndex + 1}/{quiz.questions.length}
          </span>
        </div>

        {/* Center: Streak Counter & Score */}
        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-black transition-all ${
              streak >= 3
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : streak > 0
                ? 'bg-orange-500/10 text-orange-400'
                : 'text-slate-500 bg-white/5'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${streak >= 3 ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
            <span>{streak}x</span>
          </div>

          <div className="relative flex items-center font-mono font-black text-sm sm:text-base text-white">
            <span>{score.toLocaleString()}</span>
            {floatingScore !== null && (
              <span className="absolute -top-4 right-0 font-black text-xs text-emerald-400 animate-bounce">
                +{floatingScore}
              </span>
            )}
          </div>
        </div>

        {/* Right: Clock & Sound Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-[11px] sm:text-xs font-mono text-slate-400 bg-white/5 px-2 py-0.5 rounded-lg">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>{totalElapsedTime.toFixed(1)}s</span>
          </div>

          <button
            onClick={handleToggleMute}
            className="p-1 sm:p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        </div>
      </div>

      {/* 2. TIMER PROGRESS BAR (Slim horizontal dynamic line directly under HUD) */}
      <div className="shrink-0 w-full mt-1.5 mb-1.5 px-0.5">
        <div className="flex items-center justify-between text-[11px] font-mono font-bold mb-1">
          <span className="text-slate-400 text-[10px]">TIME REMAINING</span>
          <span
            className={`${
              questionTimeLeft <= 4 ? 'text-rose-400 font-black animate-pulse' : 'text-slate-300'
            }`}
          >
            {questionTimeLeft.toFixed(1)}s
          </span>
        </div>
        <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${timerColor} transition-all duration-100 shadow-md`}
            style={{ width: `${(questionTimeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. CENTER MUSIC STAGE (Flex-1, Compact & Responsive, never forces scroll) */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-1 sm:py-2 px-3 bg-gradient-to-b from-[#12192c]/90 to-[#0c111e]/90 border border-white/10 rounded-2xl shadow-xl relative overflow-hidden mb-2">
        {/* Glowing Background Radial */}
        <div className="absolute w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Compact Vinyl Disc */}
        <div className="relative w-20 h-20 sm:w-28 sm:h-28 rounded-full bg-black/90 p-1.5 shadow-xl border-2 sm:border-4 border-slate-800 flex items-center justify-center shrink-0">
          <div
            className={`w-full h-full rounded-full border border-white/10 flex items-center justify-center overflow-hidden ${
              isPlayingAudio ? 'animate-spin-slow' : ''
            }`}
          >
            {isRevealed ? (
              <img
                src={currentQuestion.albumCover}
                alt={currentQuestion.correctTrackName}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-800 flex items-center justify-center">
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-slate-950 border border-emerald-400/40 flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                </div>
              </div>
            )}
          </div>
          <div className="absolute w-4 h-4 rounded-full bg-slate-900 border border-white/30 z-10" />
        </div>

        {/* Dancing Equalizer Waves */}
        <div className="flex items-center gap-1 h-5 my-1.5 shrink-0">
          <div className={`w-1 rounded-full bg-emerald-400 ${isPlayingAudio ? 'animate-eq-1' : 'h-1.5'}`} />
          <div className={`w-1 rounded-full bg-teal-400 ${isPlayingAudio ? 'animate-eq-2' : 'h-2'}`} />
          <div className={`w-1 rounded-full bg-indigo-400 ${isPlayingAudio ? 'animate-eq-3' : 'h-1.5'}`} />
          <div className={`w-1 rounded-full bg-purple-400 ${isPlayingAudio ? 'animate-eq-4' : 'h-2.5'}`} />
          <div className={`w-1 rounded-full bg-emerald-400 ${isPlayingAudio ? 'animate-eq-2' : 'h-1.5'}`} />
          <div className={`w-1 rounded-full bg-teal-400 ${isPlayingAudio ? 'animate-eq-1' : 'h-2'}`} />
        </div>

        {/* Artist Name & Question Prompt */}
        <div className="text-center px-2 shrink-0">
          <h3 className="text-sm sm:text-base font-black text-white leading-tight">
            {quiz.artistName}
          </h3>
          <p className="text-[11px] sm:text-xs text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
            {isRevealed ? (
              <span className="text-emerald-300 font-bold">
                ✓ {currentQuestion.correctTrackName}
              </span>
            ) : (
              'Which song is playing right now?'
            )}
          </p>
        </div>

        {/* Autoplay blocked prompt */}
        {autoplayBlocked && !isRevealed && (
          <button
            onClick={handleTogglePlayAudio}
            className="mt-1 px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black shadow-lg shadow-emerald-500/20 animate-pulse flex items-center gap-1.5 shrink-0"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Tap to Play Snippet</span>
          </button>
        )}

        {/* Play/Replay snippet pill */}
        <div className="flex items-center gap-2 mt-1.5 shrink-0">
          <button
            onClick={handleTogglePlayAudio}
            className="px-2.5 py-0.5 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] font-semibold text-slate-300 border border-white/10 flex items-center gap-1 transition-colors"
          >
            {isPlayingAudio ? (
              <>
                <Volume2 className="w-3 h-3 text-emerald-400" />
                <span>Playing</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current text-white" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            onClick={handleReplayAudio}
            title="Replay snippet"
            className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/10 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>

        {audioError && (
          <div className="mt-1 text-[10px] text-amber-300 flex items-center gap-1 shrink-0">
            <AlertCircle className="w-3 h-3" />
            <span>Audio preview load error. Click Play to retry.</span>
          </div>
        )}
      </div>

      {/* 4. THE 3 CHOICE CARDS (Lower screen, fixed height, 1-screen fit!) */}
      <div className="shrink-0 w-full space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between px-1">
          <span>Options (From {quiz.artistName}):</span>
          <span className="hidden sm:inline text-slate-500">
            Keys [1], [2], [3]
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption = option.id === currentQuestion.correctTrackId;

            let cardStyle =
              'bg-[#101728]/90 hover:bg-[#162038] border-white/10 text-white hover:border-emerald-500/40 active:scale-[0.99]';

            if (isRevealed) {
              if (isCorrectOption) {
                cardStyle =
                  'bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-500/20 ring-1 ring-emerald-500/40 scale-[1.01]';
              } else if (isSelected && !isCorrectOption) {
                cardStyle =
                  'bg-rose-500/20 border-rose-500 text-rose-200 shadow-md shadow-rose-500/20 animate-shake';
              } else {
                cardStyle = 'bg-black/30 border-white/5 text-slate-500 opacity-40';
              }
            }

            return (
              <button
                key={option.id}
                onClick={() => handleSelectOption(option)}
                disabled={isRevealed}
                className={`w-full p-2 sm:p-3 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group shadow-sm ${cardStyle}`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                  {/* Key shortcut badge [1], [2], [3] */}
                  <span
                    className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black text-xs transition-colors shrink-0 ${
                      isRevealed && isCorrectOption
                        ? 'bg-emerald-500 text-black shadow-sm'
                        : isRevealed && isSelected && !isCorrectOption
                        ? 'bg-rose-500 text-white'
                        : 'bg-white/10 text-slate-300 group-hover:bg-emerald-500/20 group-hover:text-emerald-400'
                    }`}
                  >
                    {idx + 1}
                  </span>

                  {/* Album Cover Thumbnail */}
                  <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-slate-800 border border-white/10 shrink-0 shadow-sm group-hover:border-emerald-500/40 transition-colors">
                    <img
                      src={option.albumCover || currentQuestion.albumCover}
                      alt={option.albumName || option.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&auto=format&fit=crop&q=80';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>

                  {/* Track Name & Album Title */}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-xs sm:text-sm truncate group-hover:text-emerald-300 transition-colors leading-snug">
                      {option.name}
                    </h4>
                    <p className="text-[10px] sm:text-xs text-slate-400 truncate font-medium">
                      {option.albumName || quiz.artistName}
                    </p>
                  </div>
                </div>

                {/* Outcome indicator icons */}
                <div className="ml-2 shrink-0">
                  {isRevealed && isCorrectOption && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-scale-up" />
                  )}
                  {isRevealed && isSelected && !isCorrectOption && (
                    <XCircle className="w-5 h-5 text-rose-400 animate-shake" />
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
