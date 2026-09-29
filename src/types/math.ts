export interface SolutionResult {
  id: string;
  extractedQuestion: string;
  finalAnswer: string;
  gradeLevel: string;
  topic: string;
  steps: string[];
  keyTip: string;
  similarQuestion: string;
  timestamp: number;
  userPrompt?: string;
  imagePreviewUrl?: string;
  warning?: string;
  isFallback?: boolean;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  gradeLevel: 'JSS 1' | 'JSS 2' | 'JSS 3';
  question: string;
  options: string[];
  correctOptionIndex: number;
  finalAnswer: string;
  hint: string;
  explanation: string;
}

export interface Flashcard {
  id: string;
  topic: string;
  gradeLevel: string;
  front: string;
  back: string;
  example: string;
  tip?: string;
}

export interface FormulaItem {
  id: string;
  title: string;
  category: 'numbers' | 'algebra' | 'geometry' | 'kinematics';
  gradeLevel: 'JSS 1' | 'JSS 2' | 'JSS 3' | 'All JSS';
  formula: string;
  variables: { symbol: string; meaning: string }[];
  example: string;
  explanation: string;
  tip?: string;
}
