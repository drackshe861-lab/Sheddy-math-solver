import React from 'react';
import {
  Calculator,
  BookOpen,
  FileSpreadsheet,
  History,
  Moon,
  Sun,
  Sparkles,
  GraduationCap,
} from 'lucide-react';

export type NavTab = 'solver' | 'practice' | 'formulas' | 'history';

interface NavbarProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  savedCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isDark,
  setIsDark,
  savedCount,
}) => {
  const tabs = [
    { id: 'solver' as NavTab, label: 'Equation Solver', icon: Calculator },
    { id: 'practice' as NavTab, label: 'Topic Practice', icon: BookOpen },
    { id: 'formulas' as NavTab, label: 'Formula Cheat Sheet', icon: FileSpreadsheet },
    {
      id: 'history' as NavTab,
      label: 'Study History',
      icon: History,
      badge: savedCount > 0 ? savedCount : null,
    },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/95 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 md:py-0 min-h-[4.5rem] gap-3">
          {/* Logo & Titles */}
          <div className="flex items-center justify-between">
            <div
              onClick={() => setActiveTab('solver')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Calculator className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-slate-900 shadow-sm">
                  ∑
                </span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                    Sheddy Math Solver
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <GraduationCap className="h-3 w-3" /> JSS 1 - 3
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Built for JSS Math Success | Created for Shedrack's Learning Hub
                </p>
              </div>
            </div>

            {/* Dark mode button on small screens */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDark(!isDark)}
                aria-label="Toggle theme"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {isDark ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-slate-700" />}
              </button>
            </div>
          </div>

          {/* Desktop & Tablet Navigation */}
          <div className="flex items-center justify-between md:justify-end gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <nav className="flex items-center gap-1 rounded-2xl bg-slate-100/90 p-1.5 dark:bg-slate-900/90 border border-slate-200/60 dark:border-slate-800">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-white text-blue-700 shadow-sm dark:bg-blue-600 dark:text-white'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>{tab.label}</span>
                    {tab.badge !== null && tab.badge !== undefined && (
                      <span
                        className={`ml-1 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                          isActive
                            ? 'bg-blue-100 text-blue-700 dark:bg-white/20 dark:text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Dark mode button for md+ screens */}
            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle theme"
              className="hidden md:flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {isDark ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
