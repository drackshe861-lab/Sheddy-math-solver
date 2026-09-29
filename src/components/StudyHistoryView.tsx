import React, { useState } from 'react';
import {
  History,
  Trash2,
  Search,
  ExternalLink,
  Copy,
  Check,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowRight,
  GraduationCap,
  Image as ImageIcon,
} from 'lucide-react';
import { SolutionResult } from '../types/math';
import { MathMarkdown } from './MathMarkdown';

interface StudyHistoryViewProps {
  solutions: SolutionResult[];
  onDeleteSolution: (id: string) => void;
  onClearAll: () => void;
  onOpenInSolver: (solution: SolutionResult) => void;
}

export const StudyHistoryView: React.FC<StudyHistoryViewProps> = ({
  solutions,
  onDeleteSolution,
  onClearAll,
  onOpenInSolver,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const topics = ['all', ...Array.from(new Set(solutions.map((s) => s.topic)))];

  const filteredSolutions = solutions.filter((item) => {
    if (selectedTopic !== 'all' && item.topic !== selectedTopic) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.extractedQuestion.toLowerCase().includes(q) ||
        item.finalAnswer.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 mb-1">
            <History className="h-3.5 w-3.5" />
            <span>Shedrack's Personal Study Archives</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Study History & Saved Solutions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Review past calculations, review tricky formulas, and track revision progress.
          </p>
        </div>

        {solutions.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your entire study history?')) {
                onClearAll();
              }
            }}
            className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-900/60 dark:bg-rose-950/60 dark:text-rose-300 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search saved problems..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-2xs"
          />
        </div>

        {topics.length > 1 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {topics.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTopic(t)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                  selectedTopic === t
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                }`}
              >
                {t === 'all' ? 'All Topics' : t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* History Items List */}
      {filteredSolutions.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400 mb-3">
            <History className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Saved Calculations Found
          </h3>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Whenever you type a question or snap a notebook photo in the Equation Solver, it gets saved right here for instant revision.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSolutions.map((item) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                      {item.gradeLevel}
                    </span>
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                      {item.topic}
                    </span>
                    {item.imagePreviewUrl && (
                      <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        <ImageIcon className="h-3 w-3" /> Photo
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(item.timestamp)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteSolution(item.id)}
                      className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Question & Final Answer */}
                <div className="mt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                      {item.extractedQuestion}
                    </h4>

                    {/* Final Answer Banner */}
                    <div className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-teal-50 px-3.5 py-2 border border-teal-200 dark:bg-teal-950/40 dark:border-teal-800">
                      <span className="text-xs font-black uppercase tracking-wider text-teal-700 dark:text-teal-400">
                        Answer:
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-teal-950 dark:text-teal-200">
                        <MathMarkdown content={item.finalAnswer} />
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.id, `${item.extractedQuestion}\nAnswer: ${item.finalAnswer}`)}
                      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-teal-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenInSolver(item)}
                      className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-sm"
                    >
                      <span>Open in Solver</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible Steps Breakdown */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {isExpanded ? 'Hide Steps' : `View ${item.steps.length} Steps & Memory Tip`}
                  </button>

                  {isExpanded && (
                    <div className="mt-4 space-y-3 pl-2 border-l-2 border-blue-400 dark:border-blue-600">
                      {item.steps.map((st, sIdx) => (
                        <div key={sIdx} className="text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                          <span className="font-bold text-blue-600 dark:text-blue-400 mr-2">
                            Step {sIdx + 1}:
                          </span>
                          <MathMarkdown content={st} />
                        </div>
                      ))}
                      {item.keyTip && (
                        <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
                          <span className="font-bold">Key Tip: </span> {item.keyTip}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
