import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Trash2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Printer,
  Bookmark,
  BookmarkCheck,
  ArrowRight,
  Edit3,
  Lightbulb,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { SolutionResult } from '../types/math';
import { SAMPLE_SOLVER_PROMPTS } from '../data/jssCurriculum';
import { CameraCaptureModal } from './CameraCaptureModal';
import { MathMarkdown } from './MathMarkdown';
import confetti from 'canvas-confetti';

interface SolverViewProps {
  onSaveToHistory: (solution: SolutionResult) => void;
  onNavigateToPractice?: (topic: string, question: string) => void;
  initialPrompt?: string;
}

export const SolverView: React.FC<SolverViewProps> = ({
  onSaveToHistory,
  onNavigateToPractice,
  initialPrompt = '',
}) => {
  const [inputMode, setInputMode] = useState<'type' | 'image'>('type');
  const [questionText, setQuestionText] = useState(initialPrompt);
  const [gradeLevel, setGradeLevel] = useState<'All JSS' | 'JSS 1' | 'JSS 2' | 'JSS 3'>('All JSS');
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string>('image/jpeg');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Result state
  const [result, setResult] = useState<SolutionResult | null>(null);
  const [isEditingExtracted, setIsEditingExtracted] = useState(false);
  const [editedQuestionText, setEditedQuestionText] = useState('');
  const [copiedAnswer, setCopiedAnswer] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (initialPrompt) {
      setQuestionText(initialPrompt);
      setInputMode('type');
    }
  }, [initialPrompt]);

  // Insert math symbol at cursor position in text area
  const insertSymbol = (sym: string) => {
    if (!textareaRef.current) {
      setQuestionText((prev) => prev + sym);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = questionText;
    const updated = current.substring(0, start) + sym + current.substring(end);
    setQuestionText(updated);

    // restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + sym.length, start + sym.length);
    }, 10);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  };

  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPG, WEBP).');
      return;
    }
    setImageMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(reader.result as string);
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const clearImage = () => {
    setImageDataUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSolve = async (overridePrompt?: string) => {
    const promptToSend = overridePrompt !== undefined ? overridePrompt : questionText;

    if (inputMode === 'type' && !promptToSend.trim()) {
      setErrorMessage('Please enter a math question to solve.');
      return;
    }

    if (inputMode === 'image' && !imageDataUrl) {
      setErrorMessage('Please upload or snap a photo of your math question.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    stopSpeech();

    try {
      const response = await fetch('/api/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: inputMode === 'type' ? promptToSend : (promptToSend.trim() ? promptToSend : undefined),
          imageBase64: inputMode === 'image' && imageDataUrl ? imageDataUrl : undefined,
          mimeType: imageMimeType,
          gradeLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to solve problem.');
      }

      const data = await response.json();
      const newResult: SolutionResult = {
        id: `sol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        extractedQuestion: data.extractedQuestion || promptToSend,
        finalAnswer: data.finalAnswer,
        gradeLevel: data.gradeLevel || gradeLevel,
        topic: data.topic || 'General JSS Math',
        steps: data.steps || [],
        keyTip: data.keyTip || 'Review each step carefully and check your signs!',
        similarQuestion: data.similarQuestion || 'Try solving a variation with different numbers!',
        timestamp: Date.now(),
        userPrompt: promptToSend,
        imagePreviewUrl: inputMode === 'image' && imageDataUrl ? imageDataUrl : undefined,
      };

      setResult(newResult);
      setEditedQuestionText(newResult.extractedQuestion);
      setIsSaved(true);
      onSaveToHistory(newResult);

      // Trigger celebratory confetti for positive reinforcement
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#0D9488', '#F59E0B'],
        });
      } catch {
        // ignore if blocked
      }

      // Smooth scroll down to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err: any) {
      console.error('Solve error:', err);
      setErrorMessage(err.message || 'Something went wrong while solving. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!result) return;
    navigator.clipboard.writeText(`${result.finalAnswer}\n\nProblem: ${result.extractedQuestion}`);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const handleSaveToggle = () => {
    if (!result) return;
    onSaveToHistory(result);
    setIsSaved(true);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSpeak = () => {
    if (!result || !('speechSynthesis' in window)) return;

    if (isSpeaking) {
      stopSpeech();
      return;
    }

    const textToRead = `Here is the solution for Shedrack's learning hub.
Question: ${result.extractedQuestion}.
The final answer is: ${result.finalAnswer}.
Step 1: ${result.steps.join('. Next step: ')}.
Teacher tip: ${result.keyTip}`;

    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const quickSymbols = ['x²', 'x³', '√', '÷', '×', '±', 'π', '≤', '≥', '≠', '(', ')', '='];

  return (
    <div className="space-y-8">
      {/* Top Banner & Context */}
      <div className="rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-10 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute right-12 top-6 h-28 w-28 rounded-full bg-amber-400/10 blur-xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-amber-300 backdrop-blur-md mb-3 border border-white/10">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span>Encouraging Step-by-Step AI Math Tutor</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Ask any JSS Math Problem or Snap a Photo
          </h2>
          <p className="mt-2 text-sm sm:text-base text-blue-100/90 leading-relaxed">
            Get instant, classroom-clear explanations tailored for JSS 1, 2, and 3. Understand the exact formulas,
            reasons behind each step, and key exam memory tips.
          </p>
        </div>
      </div>

      {/* Main Solver Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        {/* Input Mode Selector & Grade Level */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => setInputMode('type')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                inputMode === 'type'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Edit3 className="h-4 w-4" />
              <span>Type Question</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('image')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold transition-all ${
                inputMode === 'image'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Camera className="h-4 w-4" />
              <span>Upload Photo / Camera</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
              Grade Level:
            </label>
            <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60">
              {(['All JSS', 'JSS 1', 'JSS 2', 'JSS 3'] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setGradeLevel(lvl)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    gradeLevel === lvl
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

        {/* Mode A: Type Question */}
        {inputMode === 'type' && (
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="math-input" className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Enter Your Math Question or Word Problem
              </label>
              <div className="relative rounded-2xl border border-slate-300 bg-slate-50/50 p-1 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950/50">
                <textarea
                  id="math-input"
                  ref={textareaRef}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="e.g. Find the HCF and LCM of 36 and 84, or solve 3x + 7 = 22..."
                  rows={4}
                  className="w-full resize-none rounded-xl bg-transparent p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 text-sm sm:text-base font-medium"
                />

                {/* Quick math symbol toolbar */}
                <div className="flex items-center gap-1.5 flex-wrap border-t border-slate-200/80 p-2 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/60 rounded-b-xl">
                  <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 mr-1">
                    Quick Symbols:
                  </span>
                  {quickSymbols.map((sym) => (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => insertSymbol(sym)}
                      className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-slate-200 bg-white px-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      {sym}
                    </button>
                  ))}
                  {questionText && (
                    <button
                      type="button"
                      onClick={() => setQuestionText('')}
                      className="ml-auto text-xs font-semibold text-rose-500 hover:text-rose-600 px-2 py-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Sample Questions */}
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-500" />
                <span>Try an example from the JSS curriculum:</span>
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_SOLVER_PROMPTS.slice(0, 5).map((sample, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuestionText(sample.prompt);
                      setGradeLevel(sample.grade as any);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50/70 hover:text-blue-700 dark:border-slate-800 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    <span>{sample.label}</span>
                    <span className="rounded bg-blue-100 px-1 py-0.2 text-[10px] text-blue-800 dark:bg-blue-900/60 dark:text-blue-300 font-bold">
                      {sample.grade}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Mode B: Upload Photo / Camera */}
        {inputMode === 'image' && (
          <div className="mt-5 space-y-4">
            {!imageDataUrl ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/60 p-8 text-center hover:border-blue-500 hover:bg-blue-50/30 dark:border-slate-700 dark:bg-slate-950/40 dark:hover:border-blue-400 transition-all"
              >
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 mb-3 shadow-inner">
                  <Upload className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Drop math textbook or notebook photo here
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                  Accepts PNG, JPG, or WEBP up to 20MB. Clear handwritten calculations or printed textbook questions.
                </p>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    <span>Browse Files</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCameraOpen(true)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Camera className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span>Snap with Camera</span>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-900/5 dark:border-slate-700 dark:bg-slate-950 p-2">
                  <div className="relative max-h-96 w-full flex items-center justify-center overflow-hidden rounded-xl bg-black/5 dark:bg-black/30">
                    <img
                      src={imageDataUrl}
                      alt="Uploaded Math Question"
                      className="max-h-96 w-auto object-contain rounded-lg"
                    />
                  </div>
                  <div className="mt-3 flex items-center justify-between px-2">
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4" /> Photo ready for analysis
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Retake
                      </button>
                      <button
                        type="button"
                        onClick={clearImage}
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove
                      </button>
                    </div>
                  </div>
                </div>

                {/* Optional note or question specification */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Optional: Add any specific instruction (e.g. "Only solve question 4b"):
                  </label>
                  <input
                    type="text"
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="e.g. Solve part (ii) using prime factorization method..."
                    className="w-full rounded-xl border border-slate-300 bg-slate-50/50 px-3.5 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950/50 dark:text-white"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error message banner */}
        {errorMessage && (
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-200">
            <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="text-xs sm:text-sm font-medium">
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <span>Encouraging explanation + memory tips + similar practice problem</span>
          </p>
          <button
            type="button"
            onClick={() => handleSolve()}
            disabled={isLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-3.5 text-sm sm:text-base font-black text-white shadow-lg shadow-blue-600/25 hover:from-blue-800 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin" />
                <span>Thinking & Solving Step-by-Step...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5 text-amber-300" />
                <span>Solve & Explain Step-by-Step</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results Output Display */}
      {result && (
        <div ref={resultsRef} className="space-y-6 scroll-mt-24">
          {/* Header Bar of Result */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300 font-bold">
                ✓
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Solution Ready
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {result.topic} • {result.gradeLevel}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSpeak}
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors ${
                  isSpeaking
                    ? 'border-amber-400 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
                <span>{isSpeaking ? 'Stop Audio' : 'Listen to Tutor'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveToggle}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4 text-teal-600" /> : <Bookmark className="h-4 w-4" />}
                <span>{isSaved ? 'Saved to Study' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                <Printer className="h-4 w-4" />
                <span className="hidden sm:inline">Print / PDF</span>
              </button>
            </div>
          </div>

          {/* Extracted Problem Verification Box */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {result.imagePreviewUrl ? 'Transcribed Math Problem (OCR)' : 'Problem Statement'}
              </span>
              <button
                type="button"
                onClick={() => setIsEditingExtracted(!isEditingExtracted)}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>{isEditingExtracted ? 'Done Editing' : 'Edit & Re-solve'}</span>
              </button>
            </div>

            {isEditingExtracted ? (
              <div className="space-y-3">
                <textarea
                  value={editedQuestionText}
                  onChange={(e) => setEditedQuestionText(e.target.value)}
                  rows={2}
                  className="w-full rounded-xl border border-blue-400 bg-blue-50/20 p-3 text-sm font-semibold text-slate-900 focus:outline-none dark:border-blue-600 dark:bg-slate-950 dark:text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingExtracted(false);
                      handleSolve(editedQuestionText);
                    }}
                    className="rounded-xl bg-blue-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
                  >
                    Re-solve with Edited Text
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <p className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                  {result.extractedQuestion}
                </p>
                {result.imagePreviewUrl && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                    <span>Extracted accurately from notebook / camera photo</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Final Answer Highlight Box (Teal Accent) */}
          <div className="rounded-3xl border-2 border-teal-500/60 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-teal-500/10 p-6 sm:p-7 shadow-md dark:border-teal-500/40 dark:bg-teal-950/20 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white shadow-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Final Answer
                </span>
                <div className="mt-3 text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  <MathMarkdown content={result.finalAnswer} />
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyAnswer}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl border border-teal-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-teal-800 shadow-sm hover:bg-teal-50 dark:border-teal-700 dark:bg-slate-900 dark:text-teal-200 dark:hover:bg-slate-800 transition-colors"
              >
                {copiedAnswer ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Step-by-Step Breakdown Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300 font-black">
                123
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Step-by-Step Explanation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Explaining the mathematical reasoning behind each transformation
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {result.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="group relative flex items-start gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 sm:p-5 hover:border-blue-300 hover:bg-blue-50/30 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-blue-900/60 transition-all"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-xs font-black text-white shadow-xs group-hover:bg-blue-700">
                    {idx + 1}
                  </div>
                  <div className="flex-1 pt-0.5 text-sm sm:text-base leading-relaxed">
                    <MathMarkdown content={step} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Tip / Memory Rule (Amber Accent) */}
          {result.keyTip && (
            <div className="rounded-3xl border border-amber-300/80 bg-amber-50/70 p-6 shadow-sm dark:border-amber-600/40 dark:bg-amber-950/20">
              <div className="flex items-start gap-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-400 text-slate-900 shadow-sm">
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                    Teacher's Memory Rule & Exam Tip
                  </h4>
                  <p className="mt-1 text-sm sm:text-base font-semibold text-amber-950 dark:text-amber-100 leading-relaxed">
                    {result.keyTip}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Practice Similar Problem Card */}
          {result.similarQuestion && (
            <div className="rounded-3xl border border-indigo-200 bg-gradient-to-r from-blue-50 via-indigo-50/40 to-white p-6 sm:p-7 shadow-sm dark:border-indigo-900/60 dark:bg-gradient-to-r dark:from-slate-900 dark:to-indigo-950/30">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1.5">
                  <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    <Sparkles className="h-3.5 w-3.5" /> Reinforce What You Learned
                  </span>
                  <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    Practice Similar Problem:
                  </h4>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    {result.similarQuestion}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setQuestionText(result.similarQuestion);
                      setInputMode('type');
                      handleSolve(result.similarQuestion);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-blue-700 transition-colors"
                  >
                    <span>Solve in Sheddy</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>

                  {onNavigateToPractice && (
                    <button
                      type="button"
                      onClick={() => onNavigateToPractice(result.topic, result.similarQuestion)}
                      className="inline-flex items-center gap-2 rounded-xl border border-indigo-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-700 dark:bg-slate-800 dark:text-indigo-300 transition-colors"
                    >
                      <span>Take Topic Quiz</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(dataUrl) => {
          setImageDataUrl(dataUrl);
          setImageMimeType('image/jpeg');
          setInputMode('image');
        }}
      />
    </div>
  );
};
