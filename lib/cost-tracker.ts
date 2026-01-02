import type { CostStats } from './types';

const MONTHLY_BUDGET = 50;
const COST_PER_MILLION_TOKENS = {
  'gpt-4.1-mini': { input: 0.15, output: 0.6 },
  'gemini-3-pro-image-preview': { input: 0.05, output: 0.15 },
};

export function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = COST_PER_MILLION_TOKENS[model as keyof typeof COST_PER_MILLION_TOKENS] || { input: 0.1, output: 0.3 };
  return (inputTokens * rates.input + outputTokens * rates.output) / 1000000;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function isCurrentMonth(timestamp: number): boolean {
  const date = new Date(timestamp);
  const currentMonth = getCurrentMonth();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}` === currentMonth;
}

export function aggregateCosts(entries: Array<{ cost: number; timestamp: number }>): CostStats {
  const currentMonth = getCurrentMonth();
  const currentMonthEntries = entries.filter(e => isCurrentMonth(e.timestamp));
  
  const currentMonthTotal = currentMonthEntries.reduce((sum, e) => sum + e.cost, 0);
  const totalAllTime = entries.reduce((sum, e) => sum + e.cost, 0);

  return {
    currentMonth: currentMonthTotal,
    totalAllTime,
    monthlyBudget: MONTHLY_BUDGET,
    generationCount: entries.length,
  };
}

export function getBudgetWarning(stats: CostStats): 'none' | 'warning' | 'exceeded' {
  const percentage = (stats.currentMonth / stats.monthlyBudget) * 100;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 80) return 'warning';
  return 'none';
}

