import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  BookOpen,
  Printer,
  Calculator,
  Lightbulb,
  ArrowRight,
  Sparkles,
  Check,
} from 'lucide-react';
import { FORMULA_CHEAT_SHEET } from '../data/jssCurriculum';
import { FormulaItem } from '../types/math';

interface FormulaCheatSheetViewProps {
  onSendToSolver?: (question: string) => void;
}

export const FormulaCheatSheetView: React.FC<FormulaCheatSheetViewProps> = ({
  onSendToSolver,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');

  // Mini Interactive Calculators
  const [activeCalculator, setActiveCalculator] = useState<'speed' | 'interest' | 'circle' | 'pythagoras'>('speed');

  // Speed calculator inputs
  const [distInput, setDistInput] = useState<number>(120);
  const [timeInput, setTimeInput] = useState<number>(2);

  // Interest calculator inputs
  const [principalInput, setPrincipalInput] = useState<number>(50000);
  const [rateInput, setRateInput] = useState<number>(5);
  const [yearsInput, setYearsInput] = useState<number>(3);

  // Circle inputs
  const [radiusInput, setRadiusInput] = useState<number>(7);

  // Pythagoras inputs
  const [sideA, setSideA] = useState<number>(3);
  const [sideB, setSideB] = useState<number>(4);

  const categories = [
    { id: 'all', label: 'All Formulas' },
    { id: 'numbers', label: 'Numbers & Numeration' },
    { id: 'algebra', label: 'Algebraic Processes' },
    { id: 'geometry', label: 'Geometry & Mensuration' },
    { id: 'kinematics', label: 'Kinematics & Everyday' },
  ];

  const filteredFormulas = FORMULA_CHEAT_SHEET.filter((item) => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (selectedGrade !== 'all' && item.gradeLevel !== selectedGrade) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.title.toLowerCase().includes(q) ||
        item.formula.toLowerCase().includes(q) ||
        item.explanation.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Calculations
  const calculatedSpeed = timeInput > 0 ? (distInput / timeInput).toFixed(2) : '0';
  const calculatedInterest = ((principalInput * rateInput * yearsInput) / 100).toLocaleString();
  const calculatedTotalAmount = (
    principalInput +
    (principalInput * rateInput * yearsInput) / 100
  ).toLocaleString();
  const calculatedCircumference = (2 * Math.PI * radiusInput).toFixed(2);
  const calculatedArea = (Math.PI * radiusInput * radiusInput).toFixed(2);
  const calculatedHypotenuse = Math.sqrt(sideA * sideA + sideB * sideB).toFixed(2);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 mb-1">
            <FileSpreadsheet className="h-3.5 w-3.5" />
            <span>Essential JSS Reference Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Formula Cheat Sheet & Quick Rules
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Quick revision handbook for JSS 1, 2, and 3 examinations.
          </p>
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <Printer className="h-4 w-4" />
          <span>Print Study Sheet</span>
        </button>
      </div>

      {/* Interactive Formula Tester & Calculator Tool */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-colors">
        <div className="flex items-center gap-2.5 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
            <Calculator className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Interactive Formula Verification Tool
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Test your numbers with standard JSS formulas to verify your manual calculations
            </p>
          </div>
        </div>

        {/* Calculator Tabs */}
        <div className="mt-4 flex flex-wrap gap-2">
          {[
            { id: 'speed', label: 'Speed = Distance / Time' },
            { id: 'interest', label: 'Simple Interest = PRT / 100' },
            { id: 'circle', label: 'Circle Area = πr²' },
            { id: 'pythagoras', label: 'Pythagoras c² = a² + b²' },
          ].map((calc) => (
            <button
              key={calc.id}
              type="button"
              onClick={() => setActiveCalculator(calc.id as any)}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeCalculator === calc.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {calc.label}
            </button>
          ))}
        </div>

        {/* Active Calculator Body */}
        <div className="mt-5 rounded-2xl bg-slate-50 p-5 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
          {activeCalculator === 'speed' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Distance (km):
                </label>
                <input
                  type="number"
                  value={distInput}
                  onChange={(e) => setDistInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Time (hours):
                </label>
                <input
                  type="number"
                  value={timeInput}
                  step="0.5"
                  onChange={(e) => setTimeInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="rounded-xl bg-teal-50 p-3 text-teal-900 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800">
                <span className="text-[11px] font-bold uppercase tracking-wider block">Calculated Speed:</span>
                <p className="text-xl font-black">{calculatedSpeed} km/h</p>
                <span className="text-[11px] opacity-80">Formula: v = {distInput} ÷ {timeInput}</span>
              </div>
            </div>
          )}

          {activeCalculator === 'interest' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Principal P (₦ / $):
                </label>
                <input
                  type="number"
                  value={principalInput}
                  step="5000"
                  onChange={(e) => setPrincipalInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Rate R (% per year):
                </label>
                <input
                  type="number"
                  value={rateInput}
                  onChange={(e) => setRateInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Time T (years):
                </label>
                <input
                  type="number"
                  value={yearsInput}
                  onChange={(e) => setYearsInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="rounded-xl bg-teal-50 p-3 text-teal-900 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800">
                <span className="text-[11px] font-bold uppercase tracking-wider block">Simple Interest:</span>
                <p className="text-xl font-black">₦{calculatedInterest}</p>
                <span className="text-[11px] opacity-80">Total Amount: ₦{calculatedTotalAmount}</span>
              </div>
            </div>
          )}

          {activeCalculator === 'circle' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Radius r (cm):
                </label>
                <input
                  type="number"
                  value={radiusInput}
                  onChange={(e) => setRadiusInput(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="rounded-xl bg-teal-50 p-3 text-teal-900 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800">
                <span className="text-[11px] font-bold uppercase tracking-wider block">Circumference (2πr):</span>
                <p className="text-xl font-black">{calculatedCircumference} cm</p>
                <span className="text-[11px] opacity-80">Diameter = {radiusInput * 2} cm</span>
              </div>

              <div className="rounded-xl bg-blue-50 p-3 text-blue-900 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-200 dark:border-blue-800">
                <span className="text-[11px] font-bold uppercase tracking-wider block">Area (πr²):</span>
                <p className="text-xl font-black">{calculatedArea} cm²</p>
                <span className="text-[11px] opacity-80">π × {radiusInput}²</span>
              </div>
            </div>
          )}

          {activeCalculator === 'pythagoras' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Side a (cm):
                </label>
                <input
                  type="number"
                  value={sideA}
                  onChange={(e) => setSideA(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Side b (cm):
                </label>
                <input
                  type="number"
                  value={sideB}
                  onChange={(e) => setSideB(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-sm font-bold text-slate-900 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                />
              </div>

              <div className="rounded-xl bg-teal-50 p-3 text-teal-900 border border-teal-200 dark:bg-teal-950/50 dark:text-teal-200 dark:border-teal-800">
                <span className="text-[11px] font-bold uppercase tracking-wider block">Hypotenuse c:</span>
                <p className="text-xl font-black">{calculatedHypotenuse} cm</p>
                <span className="text-[11px] opacity-80">c = √({sideA}² + {sideB}²)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search formula, theorem, or rule..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white shadow-2xs"
          />
        </div>

        {/* Grade Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Grade:</span>
          <div className="flex items-center rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {['all', 'JSS 1', 'JSS 2', 'JSS 3'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSelectedGrade(lvl)}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  selectedGrade === lvl
                    ? 'bg-white text-blue-700 shadow-sm dark:bg-slate-700 dark:text-amber-400'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {lvl === 'all' ? 'All' : lvl}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`rounded-2xl px-4 py-2 text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Formulas Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredFormulas.map((item) => (
          <div
            key={item.id}
            className="flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700 transition-all"
          >
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 dark:border-slate-800">
                <span className="rounded-lg bg-blue-50 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {item.gradeLevel}
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {item.category}
                </span>
              </div>

              <h4 className="mt-3 text-lg font-black text-slate-900 dark:text-white">
                {item.title}
              </h4>

              {/* Formula Display Box */}
              <div className="mt-3 rounded-2xl bg-blue-50/70 p-3.5 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-900/60">
                <p className="font-mono text-base font-extrabold text-blue-900 dark:text-blue-200">
                  {item.formula}
                </p>
              </div>

              {/* Variables breakdown */}
              {item.variables.length > 0 && (
                <div className="mt-4 space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    What Variables Mean:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-1">
                    {item.variables.map((v, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="rounded bg-slate-100 px-1 py-0.2 font-mono font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          {v.symbol}
                        </span>
                        <span>= {v.meaning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Explanation & Example */}
              <p className="mt-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {item.explanation}
              </p>

              <div className="mt-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Real JSS Example:
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {item.example}
                </p>
              </div>

              {item.tip && (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                  <span>{item.tip}</span>
                </p>
              )}
            </div>

            {onSendToSolver && (
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => onSendToSolver(`Solve an example problem using formula: ${item.formula} (${item.title})`)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>Practice with this Formula</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
