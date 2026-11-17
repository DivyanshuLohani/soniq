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

  const currentQuestion = quiz.questions[currentIndex];

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
    <div className="h-full w-full max-h-[100dvh] flex flex-col justify-between p-3 sm:p-5 overflow-hidden max-w-lg sm:max-w-2xl mx-auto select-none">
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        onError={() => {
          setAudioError(true);
          setIsPlayingAudio(false);
        }}
      />

      {/* 1. TOP HUD */}
      <div className="shrink-0 w-full bg-[#0D0D11] border border-white/[0.08] rounded-xl px-3 py-2 shadow-sm flex items-center justify-between">
        {/* Left: Exit button & Track index */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              sounds.playClick();
              onCancelQuiz();
            }}
            title="Exit Quiz"
            className="p-1 rounded-full text-[#8E8E9F] hover:text-[#FF4694] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs font-bold text-[#F4F4F7] tracking-wider">
            TRACK {String(currentIndex + 1).padStart(2, '0')}/{String(quiz.questions.length).padStart(2, '0')}
          </span>
        </div>

        {/* Center: Streak Counter & Score */}
        <div className="flex items-center gap-3">
          {streak > 1 && (
            <div className="font-mono text-xs text-[#D4FF32] px-2 py-0.5 rounded-full bg-[#D4FF32]/10 border border-[#D4FF32]/25">
              STREAK {streak}
            </div>
          )}

          <div className="font-mono text-xs sm:text-sm font-bold text-[#F4F4F7]">
            {score.toLocaleString()} <span className="text-[10px] text-[#8E8E9F]">PTS</span>
          </div>
        </div>

        {/* Right: Clock & Sound Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs font-mono text-[#8E8E9F]">
            <Clock className="w-3 h-3 text-[#8E8E9F]" />
            <span>{totalElapsedTime.toFixed(1)}s</span>
          </div>

          <button
            onClick={handleToggleMute}
            className="p-1 text-[#8E8E9F] hover:text-[#F4F4F7] transition-colors"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-[#8E8E9F]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#D4FF32]" />
            )}
          </button>
        </div>
      </div>

      {/* 2. PRECISION TIMELINE GAUGE */}
      <div className="shrink-0 w-full mt-2 mb-2">
        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
          <span className="text-[#8E8E9F]">EXCERPT TIMELINE</span>
          <span className={isUrgentTime ? 'text-[#FF4694] font-bold' : 'text-[#8E8E9F]'}>
            {questionTimeLeft.toFixed(1)}s REMAINING
          </span>
        </div>
        <div className="w-full h-1 bg-[#12131A] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-100 ${
              isUrgentTime ? 'bg-[#FF4694]' : 'bg-[#D4FF32]'
            }`}
            style={{ width: `${(questionTimeLeft / QUESTION_TIME_LIMIT) * 100}%` }}
          />
        </div>
      </div>

      {/* 3. AUDIO RECOGNITION CANVAS */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-3 sm:p-4 bg-[#0D0D11] border border-white/[0.08] rounded-xl shadow-lg relative overflow-hidden mb-2">
        {/* Center Artwork / Spectrum Display */}
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-[#12131A] border border-white/[0.08] shrink-0 mb-3 flex items-center justify-center">
          {isRevealed ? (
            <img
              src={currentQuestion.albumCover}
              alt={currentQuestion.correctTrackName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 text-[#8E8E9F]">
              <Radio className={`w-6 h-6 text-[#D4FF32] ${isPlayingAudio ? 'animate-pulse' : ''}`} />
              <span className="text-[9px] font-mono tracking-widest uppercase">STREAM</span>
            </div>
          )}
        </div>

        {/* Minimal Spectrum Bars */}
        <div className="flex items-center gap-1 h-4 mb-2 shrink-0">
          <div className={`w-0.5 rounded-full bg-[#D4FF32] ${isPlayingAudio ? 'animate-eq-1' : 'h-1'}`} />
          <div className={`w-0.5 rounded-full bg-[#B49BFF] ${isPlayingAudio ? 'animate-eq-2' : 'h-1.5'}`} />
          <div className={`w-0.5 rounded-full bg-[#D4FF32] ${isPlayingAudio ? 'animate-eq-3' : 'h-1'}`} />
          <div className={`w-0.5 rounded-full bg-[#B49BFF] ${isPlayingAudio ? 'animate-eq-4' : 'h-2'}`} />
          <div className={`w-0.5 rounded-full bg-[#D4FF32] ${isPlayingAudio ? 'animate-eq-2' : 'h-1'}`} />
        </div>

        {/* Artist Catalog & Prompt */}
        <div className="text-center px-2 shrink-0">
          <h3 className="font-headline text-sm sm:text-base font-bold text-[#F4F4F7]">
            {quiz.artistName}
          </h3>
          <p className="text-xs text-[#8E8E9F] font-body truncate max-w-xs sm:max-w-md mt-0.5">
            {isRevealed ? (
              <span className="text-[#D4FF32] font-semibold flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D4FF32]" />
                {currentQuestion.correctTrackName}
              </span>
            ) : (
              'Which song is playing?'
            )}
          </p>
        </div>

        {/* Audio controls */}
        <div className="flex items-center gap-2 mt-2 shrink-0">
          {autoplayBlocked && !isRevealed ? (
            <button
              onClick={handleTogglePlayAudio}
              className="px-3 py-1 rounded-full bg-[#D4FF32] text-[#08080B] text-xs font-headline font-semibold flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Tap to Play Song</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleTogglePlayAudio}
                className="px-2.5 py-1 rounded-full bg-[#12131A] hover:bg-[#181924] text-[11px] font-mono text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] flex items-center gap-1 transition-colors"
              >
                {isPlayingAudio ? (
                  <>
                    <Volume2 className="w-3 h-3 text-[#D4FF32]" />
                    <span>Playing</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-current text-[#F4F4F7]" />
                    <span>Play</span>
                  </>
                )}
              </button>
              <button
                onClick={handleReplayAudio}
                title="Replay from start"
                className="p-1 rounded-full bg-[#12131A] hover:bg-[#181924] text-[#8E8E9F] hover:text-[#F4F4F7] border border-white/[0.08] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        {audioError && (
          <div className="mt-1 text-[10px] text-[#FF4694] font-mono flex items-center justify-between w-full px-2 py-0.5 rounded bg-[#FF4694]/10 border border-[#FF4694]/20 shrink-0">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3 h-3 text-[#FF4694]" />
              <span>Buffering track...</span>
            </div>
            <button
              onClick={handleReplayAudio}
              className="text-[#D4FF32] font-semibold underline hover:text-[#c2eb2c] ml-2"
            >
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 4. SELECTION OPTIONS */}
      <div className="shrink-0 w-full space-y-1.5 sm:space-y-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-[#8E8E9F] flex items-center justify-between px-1">
          <span>Choose the track</span>
          <span className="hidden sm:inline text-[#8E8E9F]/60">
            Keys [1], [2], [3]
          </span>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isCorrectOption = option.id === currentQuestion.correctTrackId;

            let cardClasses =
              'bg-[#12131A] hover:bg-[#181924] border-white/[0.08] text-[#F4F4F7] hover:border-white/[0.2]';

            if (isRevealed) {
              if (isCorrectOption) {
                cardClasses =
                  'bg-[#D4FF32] border-[#D4FF32] text-[#08080B] font-semibold';
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
                className={`w-full p-2.5 rounded-xl border text-left transition-all duration-150 flex items-center justify-between group ${cardClasses}`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Left key-index pill [1, 2, 3] in Space Mono */}
                  <span
                    className={`w-6 h-6 rounded-md flex items-center justify-center font-mono text-xs transition-colors shrink-0 ${
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
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-[#08080B] border border-white/[0.08] shrink-0">
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
                    <CheckCircle2 className="w-4 h-4 text-[#08080B]" />
                  )}
                  {isRevealed && isSelected && !isCorrectOption && (
                    <XCircle className="w-4 h-4 text-[#FF4694]" />
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
