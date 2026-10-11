/**
 * PocketFlow Reports & Financial Analytics Calculations
 * 
 * Rules:
 * 1. Zero floating-point arithmetic for stored money or calculations.
 * 2. Transfers are excluded from income and expense summaries.
 * 3. USD and KHR are kept strictly separate.
 * 4. Transparent month-over-month comparisons and trend aggregations.
 */
import type { Category, Transaction } from '../models/types';
import type { Currency } from '../money/money';

export interface MonthSummary {
  month: string;
  currency: Currency;
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

export interface MonthOverMonthComparison {
  currentMonth: string;
  previousMonth: string;
  currency: Currency;
  currentExpenseMinor: number;
  previousExpenseMinor: number;
  expenseDiffMinor: number;
  expenseChangePercent: number | null; // null if previous was 0
  currentIncomeMinor: number;
  previousIncomeMinor: number;
  incomeDiffMinor: number;
  incomeChangePercent: number | null;
  topCategory?: {
    id: string;
    name: string;
    icon: string;
    amountMinor: number;
    percent: number;
  };
}

export interface CategorySpendingShare {
  catId: string;
  name: string;
  icon: string;
  amountMinor: number;
  percent: number;
}

/**
 * Returns previous month in YYYY-MM format.
 */
export function getPreviousMonth(month: string): string {
  const [yearStr, monthStr] = month.split('-');
  let year = parseInt(yearStr, 10);
  let m = parseInt(monthStr, 10);

  if (m === 1) {
    year -= 1;
    m = 12;
  } else {
    m -= 1;
  }

  return `${year}-${String(m).padStart(2, '0')}`;
}

/**
 * Returns a list of past months ending with `endMonth`.
 */
export function getPastMonths(endMonth: string, count = 6): string[] {
  const months: string[] = [];
  let curr = endMonth;
  for (let i = 0; i < count; i++) {
    months.unshift(curr);
    curr = getPreviousMonth(curr);
  }
  return months;
}

/**
 * Calculates income, expense, and net cash flow for a specific month and currency.
 */
export function calculateMonthSummary(
  transactions: Transaction[],
  month: string,
  currency: Currency
): MonthSummary {
  let incomeMinor = 0;
  let expenseMinor = 0;

  for (const t of transactions) {
    if (t.currency !== currency) continue;
    if (t.kind === 'transfer') continue; // Exclude transfers
    if (!t.occurredOn.startsWith(month)) continue;

    if (t.kind === 'income') {
      incomeMinor += t.amountMinor;
    } else if (t.kind === 'expense') {
      expenseMinor += t.amountMinor;
    }
  }

  return {
    month,
    currency,
    incomeMinor,
    expenseMinor,
    netMinor: incomeMinor - expenseMinor,
  };
}

/**
 * Calculates category-by-category expense distribution for a given month and currency.
 */
export function calculateCategoryBreakdown(
  transactions: Transaction[],
  categories: Category[],
  month: string,
  currency: Currency
): CategorySpendingShare[] {
  const catMap = new Map<string, Category>(categories.map((c) => [c.id, c]));
  const spendingMap = new Map<string, number>();
  let totalExpenseMinor = 0;

  for (const t of transactions) {
    if (t.currency !== currency) continue;
    if (t.kind !== 'expense') continue;
    if (!t.occurredOn.startsWith(month)) continue;

    const catId = t.categoryId || 'uncategorized';
    spendingMap.set(catId, (spendingMap.get(catId) || 0) + t.amountMinor);
    totalExpenseMinor += t.amountMinor;
  }

  return Array.from(spendingMap.entries())
    .map(([catId, amountMinor]) => {
      const cat = catMap.get(catId);
      const percent = totalExpenseMinor > 0 ? Math.round((amountMinor / totalExpenseMinor) * 100) : 0;
      return {
        catId,
        name: cat?.name || 'Uncategorized',
        icon: cat?.icon || 'HelpCircle',
        amountMinor,
        percent,
      };
    })
    .sort((a, b) => b.amountMinor - a.amountMinor);
}

/**
 * Calculates month-over-month comparison between current month and previous month.
 */
export function calculateMonthOverMonth(
  transactions: Transaction[],
  categories: Category[],
  currentMonth: string,
  currency: Currency
): MonthOverMonthComparison {
  const previousMonth = getPreviousMonth(currentMonth);

  const currentSummary = calculateMonthSummary(transactions, currentMonth, currency);
  const previousSummary = calculateMonthSummary(transactions, previousMonth, currency);

  const expenseDiffMinor = currentSummary.expenseMinor - previousSummary.expenseMinor;
  let expenseChangePercent: number | null = null;
  if (previousSummary.expenseMinor > 0) {
    expenseChangePercent = Math.round(
      ((currentSummary.expenseMinor - previousSummary.expenseMinor) / previousSummary.expenseMinor) *
        100
    );
  }

  const incomeDiffMinor = currentSummary.incomeMinor - previousSummary.incomeMinor;
  let incomeChangePercent: number | null = null;
  if (previousSummary.incomeMinor > 0) {
    incomeChangePercent = Math.round(
      ((currentSummary.incomeMinor - previousSummary.incomeMinor) / previousSummary.incomeMinor) *
        100
    );
  }

  const breakdown = calculateCategoryBreakdown(transactions, categories, currentMonth, currency);
  const topCategory = breakdown.length > 0 ? {
    id: breakdown[0].catId,
    name: breakdown[0].name,
    icon: breakdown[0].icon,
    amountMinor: breakdown[0].amountMinor,
    percent: breakdown[0].percent,
  } : undefined;

  return {
    currentMonth,
    previousMonth,
    currency,
    currentExpenseMinor: currentSummary.expenseMinor,
    previousExpenseMinor: previousSummary.expenseMinor,
    expenseDiffMinor,
    expenseChangePercent,
    currentIncomeMinor: currentSummary.incomeMinor,
    previousIncomeMinor: previousSummary.incomeMinor,
    incomeDiffMinor,
    incomeChangePercent,
    topCategory,
  };
}

/**
 * Calculates monthly cash flow trend across multiple months.
 */
export function calculateMonthlyTrend(
  transactions: Transaction[],
  endMonth: string,
  currency: Currency,
  count = 6
): MonthSummary[] {
  const months = getPastMonths(endMonth, count);
  return months.map((m) => calculateMonthSummary(transactions, m, currency));
}

/**
 * Filters transactions for report drill-down.
 */
export function filterReportTransactions(
  transactions: Transaction[],
  filters: {
    startDate?: string;
    endDate?: string;
    accountId?: string;
    categoryId?: string;
    currency?: Currency;
  }
): Transaction[] {
  return transactions.filter((t) => {
    if (filters.currency && t.currency !== filters.currency) return false;
    if (filters.accountId && t.accountId !== filters.accountId && t.toAccountId !== filters.accountId) return false;
    if (filters.categoryId && t.categoryId !== filters.categoryId) return false;
    if (filters.startDate && t.occurredOn < filters.startDate) return false;
    if (filters.endDate && t.occurredOn > filters.endDate) return false;
    return true;
  });
}
