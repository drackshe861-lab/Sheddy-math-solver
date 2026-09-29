import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Flame,
  Award,
  Layers,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { QuizQuestion, Flashcard } from '../types/math';
import {
  JSS_TOPICS,
  CURATED_QUIZ_QUESTIONS,
  CURATED_FLASHCARDS,
} from '../data/jssCurriculum';
import { recordQuizAnswer, getQuizStats } from '../utils/storage';
import { MathMarkdown } from './MathMarkdown';
import confetti from 'canvas-confetti';

interface TopicPracticeViewProps {
  onSendToSolver: (question: string) => void;
  initialTopicFilter?: string;
}

export const TopicPracticeView: React.FC<TopicPracticeViewProps> = ({
  onSendToSolver,
  initialTopicFilter,
}) => {
  const [activeMode, setActiveMode] = useState<'quiz' | 'flashcards'>('quiz');
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initialTopicFilter || null);
  const [selectedGrade, setSelectedGrade] = useState<'All JSS' | 'JSS 1' | 'JSS 2' | 'JSS 3'>('All JSS');

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>(CURATED_QUIZ_QUESTIONS);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isLoadingAiQuestion, setIsLoadingAiQuestion] = useState(false);
  const [quizStats, setQuizStats] = useState(getQuizStats());

  // Flashcards state
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Filter questions based on selected topic & grade
  const filteredQuestions = quizQuestions.filter((q) => {
    if (selectedTopic && q.topic !== selectedTopic) return false;
    if (selectedGrade !== 'All JSS' && q.gradeLevel !== selectedGrade) return false;
    return true;
  });

  const currentQuestion: QuizQuestion | undefined =
    filteredQuestions[currentQuizIndex] || filteredQuestions[0];

  // Filter flashcards
  const filteredCards = CURATED_FLASHCARDS.filter((c) => {
    if (selectedTopic && c.topic !== selectedTopic) return false;
    if (selectedGrade !== 'All JSS' && c.gradeLevel !== selectedGrade) return false;
    return true;
  });
  const currentCard: Flashcard | undefined = filteredCards[cardIndex] || filteredCards[0];

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOption(idx);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null || !currentQuestion) return;
    setIsSubmitted(true);
    const isCorrect = selectedOption === currentQuestion.correctOptionIndex;

    const newStats = recordQuizAnswer(isCorrect, currentQuestion.topic);
    setQuizStats(newStats);

    if (isCorrect) {
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#0D9488', '#2563EB', '#F59E0B'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowHint(false);
    if (currentQuizIndex < filteredQuestions.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      setCurrentQuizIndex(0);
    }
  };

  const handlePreviousQuestion = () => {
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowHint(false);
    if (currentQuizIndex > 0) {
      setCurrentQuizIndex((prev) => prev - 1);
    } else {
      setCurrentQuizIndex(filteredQuestions.length - 1);
    }
  };

  // Generate a dynamic question via Gemini for deeper practice
  const handleGenerateAiQuestion = async () => {
    setIsLoadingAiQuestion(true);
    try {
      const topicName = selectedTopic || 'Algebraic Processes';
      const grade = selectedGrade === 'All JSS' ? 'JSS 2' : selectedGrade;

      const res = await fetch('/api/practice-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicName,
          gradeLevel: grade,
          sourceQuestion: currentQuestion ? currentQuestion.question : undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate practice question');

      const data = await res.json();
      const generated: QuizQuestion = {
        id: `ai-${Date.now()}`,
        topic: topicName,
        gradeLevel: grade as any,
        question: data.question,
        options: data.options,
        correctOptionIndex: data.correctOptionIndex,
        finalAnswer: data.finalAnswer,
        hint: data.hint,
        explanation: data.explanation,
      };

      setQuizQuestions((prev) => [generated, ...prev]);
      setCurrentQuizIndex(0);
      setSelectedOption(null);
      setIsSubmitted(false);
      setShowHint(false);
    } catch {
      // Fallback already handled
    } finally {
      setIsLoadingAiQuestion(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header & Streak Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 mb-1">
            <BookOpen className="h-3.5 w-3.5" />
            <span>JSS Mathematics Practice Lab</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Topic Practice & Flashcards
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Reinforce key rules, master tricky word problems, and test your speed.
          </p>
        </div>

        {/* Stats Pills */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2.5 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800">
            <Flame className="h-5 w-5 text-amber-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Streak
              </p>
              <p className="text-base font-black text-amber-900 dark:text-amber-200">
                {quizStats.streak} in a row
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-2xl bg-teal-50 px-4 py-2.5 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800">
            <Award className="h-5 w-5 text-teal-600 dark:text-teal-400" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-teal-800 dark:text-teal-300">
                Solved
              </p>
              <p className="text-base font-black text-teal-900 dark:text-teal-200">
                {quizStats.correctCount} / {quizStats.totalAnswered}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Module Topic Cards (4 Key Categories) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select JSS Curriculum Module
          </h3>
          {selectedTopic && (
            <button
              type="button"
              onClick={() => {
                setSelectedTopic(null);
                setCurrentQuizIndex(0);
              }}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Show All Topics
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {JSS_TOPICS.map((topic) => {
            const isSelected = selectedTopic === topic.name;
            return (
              <div
                key={topic.id}
                onClick={() => {
                  setSelectedTopic(isSelected ? null : topic.name);
                  setCurrentQuizIndex(0);
                  setCardIndex(0);
                }}
                className={`cursor-pointer rounded-3xl p-5 border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/80 shadow-md ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/40'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                }`}
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr ${topic.color} text-white mb-3 shadow-sm`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {topic.name}
                </h4>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {topic.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {topic.subtopics.slice(0, 3).map((sub, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode Switcher: Interactive Quiz vs Flashcards */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-800">
        <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setActiveMode('quiz')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeMode === 'quiz'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Interactive Quiz</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('flashcards')}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
              activeMode === 'flashcards'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Formula Flashcards</span>
          </button>
        </div>

        {/* Grade filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Level:</span>
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {(['All JSS', 'JSS 1', 'JSS 2', 'JSS 3'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setSelectedGrade(lvl);
                  setCurrentQuizIndex(0);
                  setCardIndex(0);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  selectedGrade === lvl
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode A: Interactive Quiz */}
      {activeMode === 'quiz' && (
        <div className="space-y-6">
          {currentQuestion ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
              {/* Question Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                    {currentQuestion.gradeLevel}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {currentQuestion.topic}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    Question {currentQuizIndex + 1} of {filteredQuestions.length}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAiQuestion}
                    disabled={isLoadingAiQuestion}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900/60 dark:bg-blue-950/60 dark:text-blue-300 disabled:opacity-50"
                  >
                    {isLoadingAiQuestion ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                    )}
                    <span>{isLoadingAiQuestion ? 'Generating...' : '+ AI Question'}</span>
                  </button>
                </div>
              </div>

              {/* Question Body */}
              <div className="mt-6">
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-relaxed">
                  <MathMarkdown content={currentQuestion.question} />
                </h3>
              </div>

              {/* Multiple Choice Options */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentQuestion.options.map((opt, idx) => {
                  const isSelected = selectedOption === idx;
                  const isCorrect = idx === currentQuestion.correctOptionIndex;

                  let cardStyle =
                    'border-slate-200 bg-slate-50/70 text-slate-800 hover:border-blue-400 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-200';

                  if (isSelected && !isSubmitted) {
                    cardStyle =
                      'border-blue-600 bg-blue-50 text-blue-900 ring-2 ring-blue-500/20 dark:border-blue-500 dark:bg-blue-950/60 dark:text-white';
                  } else if (isSubmitted) {
                    if (isCorrect) {
                      cardStyle =
                        'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20 dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-200';
                    } else if (isSelected && !isCorrect) {
                      cardStyle =
                        'border-rose-400 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-950/60 dark:text-rose-200';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(idx)}
                      disabled={isSubmitted}
                      className={`flex items-center justify-between rounded-2xl border p-4 text-left font-bold text-sm sm:text-base transition-all ${cardStyle}`}
                    >
                      <span className="flex-1">
                        <MathMarkdown content={opt} />
                      </span>
                      {isSubmitted && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-teal-600 shrink-0 ml-2" />
                      )}
                      {isSubmitted && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-rose-500 shrink-0 ml-2" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Actions & Hint button */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-5 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>{showHint ? 'Hide Hint' : 'Need a Hint?'}</span>
                </button>

                <div className="flex items-center gap-2">
                  {!isSubmitted ? (
                    <button
                      type="button"
                      onClick={handleSubmitAnswer}
                      disabled={selectedOption === null}
                      className="rounded-2xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      Check Answer
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
                    >
                      <span>Next Question</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Hint Card */}
              {showHint && (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-xs sm:text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-bold uppercase tracking-wider text-[11px] text-amber-700 dark:text-amber-400">
                        Teacher's Hint:
                      </p>
                      <p className="mt-0.5 font-medium leading-relaxed">{currentQuestion.hint}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Post-submission Feedback & Teacher's Explanation */}
              {isSubmitted && (
                <div
                  className={`mt-5 rounded-2xl p-5 border ${
                    selectedOption === currentQuestion.correctOptionIndex
                      ? 'border-teal-300 bg-teal-50/80 text-teal-950 dark:border-teal-800 dark:bg-teal-950/30 dark:text-teal-100'
                      : 'border-amber-300 bg-amber-50/80 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      {selectedOption === currentQuestion.correctOptionIndex ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-teal-600" /> Excellent! Correct Answer
                        </>
                      ) : (
                        <>
                          <HelpCircle className="h-4 w-4 text-amber-600" /> Keep Going! Review the Explanation
                        </>
                      )}
                    </span>

                    <button
                      type="button"
                      onClick={() => onSendToSolver(currentQuestion.question)}
                      className="text-xs font-bold text-blue-700 dark:text-blue-300 hover:underline flex items-center gap-1"
                    >
                      <span>Open in Sheddy Solver</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="text-sm font-semibold leading-relaxed mt-2">
                    {currentQuestion.explanation}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500">
                No quiz questions found for this topic and grade combination.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedTopic(null);
                  setSelectedGrade('All JSS');
                }}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode B: Formula & Rule Flashcards */}
      {activeMode === 'flashcards' && (
        <div className="space-y-6">
          {currentCard ? (
            <div className="mx-auto max-w-2xl">
              {/* Card Container with 3D Flip */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative min-h-[320px] w-full cursor-pointer rounded-3xl border-2 border-blue-500/20 bg-gradient-to-br from-white to-slate-50 p-8 shadow-lg dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 transition-all hover:shadow-xl hover:border-blue-400 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                        {currentCard.gradeLevel}
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        {currentCard.topic}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">
                      Card {cardIndex + 1} of {filteredCards.length}
                    </span>
                  </div>

                  {!isFlipped ? (
                    <div className="mt-8 text-center">
                      <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-3">
                        Question / Concept
                      </span>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-snug">
                        {currentCard.front}
                      </h3>
                      <p className="mt-6 text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform flex items-center justify-center gap-1.5">
                        <RotateCcw className="h-4 w-4" /> Tap card to reveal answer & formula
                      </p>
                    </div>
                  ) : (
                    <div className="mt-6 space-y-4">
                      <span className="inline-block rounded-full bg-teal-100 px-3 py-1 text-xs font-bold text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 mb-1">
                        Teacher's Answer & Rule
                      </span>
                      <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                        {currentCard.back}
                      </p>
                      <div className="rounded-2xl bg-blue-50/70 p-4 dark:bg-slate-950/60 border border-blue-100 dark:border-slate-800">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-1">
                          Worked Example:
                        </span>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {currentCard.example}
                        </p>
                      </div>
                      {currentCard.tip && (
                        <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <span>{currentCard.tip}</span>
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-400">
                  <span>Click to flip card</span>
                  <span className="font-semibold text-blue-600 dark:text-blue-400">
                    {isFlipped ? 'Answer View' : 'Question View'}
                  </span>
                </div>
              </div>

              {/* Flashcard Navigation */}
              <div className="mt-6 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex((prev) => (prev > 0 ? prev - 1 : filteredCards.length - 1));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>

                <button
                  type="button"
                  onClick={() => setIsFlipped(!isFlipped)}
                  className="rounded-2xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-xs sm:text-sm font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300"
                >
                  <RotateCcw className="h-4 w-4 inline mr-1.5" /> Flip
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsFlipped(false);
                    setCardIndex((prev) => (prev < filteredCards.length - 1 ? prev + 1 : 0));
                  }}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700"
                >
                  Next <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <p className="text-sm font-medium text-slate-500">
                No flashcards found for this filter.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
