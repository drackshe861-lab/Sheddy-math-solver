import React, { useState, useEffect } from 'react';
import { Navbar, NavTab } from './components/Navbar';
import { SolverView } from './components/SolverView';
import { TopicPracticeView } from './components/TopicPracticeView';
import { FormulaCheatSheetView } from './components/FormulaCheatSheetView';
import { StudyHistoryView } from './components/StudyHistoryView';
import { SolutionResult } from './types/math';
import {
  getSavedSolutions,
  saveSolution,
  deleteSolution,
  clearAllSolutions,
} from './utils/storage';
import { GraduationCap, Heart, Sparkles } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('solver');
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('sheddy_math_theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  const [savedSolutions, setSavedSolutions] = useState<SolutionResult[]>([]);
  const [solverPrompt, setSolverPrompt] = useState<string>('');
  const [practiceTopic, setPracticeTopic] = useState<string | undefined>(undefined);

  // Load solutions on mount
  useEffect(() => {
    setSavedSolutions(getSavedSolutions());
  }, []);

  // Update HTML document class for dark mode
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sheddy_math_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sheddy_math_theme', 'light');
    }
  }, [isDark]);

  const handleSaveToHistory = (solution: SolutionResult) => {
    const updated = saveSolution(solution);
    setSavedSolutions(updated);
  };

  const handleDeleteSolution = (id: string) => {
    const updated = deleteSolution(id);
    setSavedSolutions(updated);
  };

  const handleClearAllHistory = () => {
    clearAllSolutions();
    setSavedSolutions([]);
  };

  const handleOpenInSolver = (solution: SolutionResult) => {
    setSolverPrompt(solution.extractedQuestion);
    setActiveTab('solver');
  };

  const handleSendToSolverFromCheatSheet = (promptText: string) => {
    setSolverPrompt(promptText);
    setActiveTab('solver');
  };

  const handleNavigateToPractice = (topic: string, question: string) => {
    setPracticeTopic(topic);
    setActiveTab('practice');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Navigation Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDark={isDark}
        setIsDark={setIsDark}
        savedCount={savedSolutions.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'solver' && (
          <SolverView
            onSaveToHistory={handleSaveToHistory}
            onNavigateToPractice={handleNavigateToPractice}
            initialPrompt={solverPrompt}
          />
        )}

        {activeTab === 'practice' && (
          <TopicPracticeView
            onSendToSolver={(q) => {
              setSolverPrompt(q);
              setActiveTab('solver');
            }}
            initialTopicFilter={practiceTopic}
          />
        )}

        {activeTab === 'formulas' && (
          <FormulaCheatSheetView onSendToSolver={handleSendToSolverFromCheatSheet} />
        )}

        {activeTab === 'history' && (
          <StudyHistoryView
            solutions={savedSolutions}
            onDeleteSolution={handleDeleteSolution}
            onClearAll={handleClearAllHistory}
            onOpenInSolver={handleOpenInSolver}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-200 bg-white/70 py-6 text-center text-xs text-slate-500 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-400">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white text-[11px] font-black">
              ∑
            </span>
            <span>Sheddy Math Solver</span>
            <span className="text-slate-400">•</span>
            <span className="text-xs font-normal">Junior Secondary School Companion</span>
          </div>

          <p className="flex items-center gap-1 text-xs">
            Created for <span className="font-semibold text-blue-600 dark:text-blue-400">Shedrack's Learning Hub</span>
          </p>

          <p className="text-[11px] text-slate-400">
            Mastering Numbers, Algebra, Geometry & Kinematics
          </p>
        </div>
      </footer>
    </div>
  );
}
