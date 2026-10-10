/**
 * PocketFlow Budget Progress Calculations
 */
import type { Budget, Category, Transaction } from '../models/types';
import type { Currency } from '../money/money';

export type BudgetStatus = 'normal' | 'warning' | 'exceeded';

export interface BudgetProgress {
  budget: Budget;
  category?: Category;
  currency: Currency;
  limitMinor: number;
  spentMinor: number;
  remainingMinor: number;
  percentageUsed: number;
  status: BudgetStatus;
}

/**
 * Calculates budget progress for a list of budgets in a specific month
 */
export function calculateBudgetProgressList(
  budgets: Budget[],
  categories: Category[],
  transactions: Transaction[],
  targetMonth: string // YYYY-MM
): BudgetProgress[] {
  const categoryMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

  return budgets
    .filter((b) => b.month === targetMonth)
    .map((budget) => {
      const spentMinor = transactions
        .filter(
          (t) =>
            t.kind === 'expense' &&
            t.categoryId === budget.categoryId &&
            t.currency === budget.currency &&
            t.occurredOn.startsWith(targetMonth)
        )
        .reduce((sum, t) => sum + t.amountMinor, 0);

      const remainingMinor = budget.limitMinor - spentMinor;
      const percentageUsed = budget.limitMinor > 0 
        ? Math.round((spentMinor / budget.limitMinor) * 100) 
        : 0;

      let status: BudgetStatus = 'normal';
      if (percentageUsed >= 100) {
        status = 'exceeded';
      } else if (percentageUsed >= 80) {
        status = 'warning';
      }

      return {
        budget,
        category: categoryMap.get(budget.categoryId),
        currency: budget.currency,
        limitMinor: budget.limitMinor,
        spentMinor,
        remainingMinor,
        percentageUsed,
        status,
      };
    });
}
