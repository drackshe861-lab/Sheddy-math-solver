import { SolutionResult } from '../types/math';

const STORAGE_KEY = 'sheddy_math_history_v1';
const FAVORITES_KEY = 'sheddy_math_favorites_v1';
const QUIZ_STATS_KEY = 'sheddy_math_quiz_stats_v1';

export function getSavedSolutions(): SolutionResult[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load history from localStorage', e);
    return [];
  }
}

export function saveSolution(solution: SolutionResult): SolutionResult[] {
  try {
    const existing = getSavedSolutions();
    // Prepend new solution, avoid duplicates
    const filtered = existing.filter((item) => item.id !== solution.id);
    const updated = [solution, ...filtered].slice(0, 50); // keep up to 50
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save solution to localStorage', e);
    return [];
  }
}

export function deleteSolution(id: string): SolutionResult[] {
  try {
    const existing = getSavedSolutions();
    const updated = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to delete solution from localStorage', e);
    return [];
  }
}

export function clearAllSolutions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear solutions', e);
  }
}

export interface QuizStats {
  totalAnswered: number;
  correctCount: number;
  streak: number;
  bestStreak: number;
  topicsMastered: Record<string, number>;
}

export function getQuizStats(): QuizStats {
  try {
    const data = localStorage.getItem(QUIZ_STATS_KEY);
    return data
      ? JSON.parse(data)
      : {
          totalAnswered: 0,
          correctCount: 0,
          streak: 0,
          bestStreak: 0,
          topicsMastered: {},
        };
  } catch {
    return {
      totalAnswered: 0,
      correctCount: 0,
      streak: 0,
      bestStreak: 0,
      topicsMastered: {},
    };
  }
}

export function recordQuizAnswer(isCorrect: boolean, topic: string): QuizStats {
  const stats = getQuizStats();
  stats.totalAnswered += 1;
  if (isCorrect) {
    stats.correctCount += 1;
    stats.streak += 1;
    if (stats.streak > stats.bestStreak) {
      stats.bestStreak = stats.streak;
    }
    stats.topicsMastered[topic] = (stats.topicsMastered[topic] || 0) + 1;
  } else {
    stats.streak = 0;
  }

  try {
    localStorage.setItem(QUIZ_STATS_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to update quiz stats', e);
  }

  return stats;
}
