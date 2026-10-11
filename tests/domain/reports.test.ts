import { describe, it, expect } from 'vitest';
import {
  getPreviousMonth,
  getPastMonths,
  calculateMonthSummary,
  calculateCategoryBreakdown,
  calculateMonthOverMonth,
  calculateMonthlyTrend,
  filterReportTransactions,
} from '../../src/domain/calculations/reports';
import type { Category, Transaction } from '../../src/domain/models/types';

describe('PocketFlow Reports & Financial Analytics Calculations', () => {
  const categories: Category[] = [
    { id: 'cat-salary', name: 'Salary', kind: 'income', icon: 'Briefcase', sortOrder: 1, isArchived: false },
    { id: 'cat-groceries', name: 'Groceries', kind: 'expense', icon: 'ShoppingCart', sortOrder: 2, isArchived: false },
    { id: 'cat-utilities', name: 'Utilities', kind: 'expense', icon: 'Zap', sortOrder: 3, isArchived: false },
  ];

  describe('Month Utilities', () => {
    it('calculates the previous month correctly, including across year boundaries', () => {
      expect(getPreviousMonth('2026-10')).toBe('2026-09');
      expect(getPreviousMonth('2026-01')).toBe('2025-12');
    });

    it('generates a list of past months in chronological order', () => {
      const pastMonths = getPastMonths('2026-03', 4);
      expect(pastMonths).toEqual(['2025-12', '2026-01', '2026-02', '2026-03']);
    });
  });

  describe('calculateMonthSummary', () => {
    it('aggregates income and expenses and calculates net flow for the given currency', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          kind: 'income',
          accountId: 'acc-usd',
          categoryId: 'cat-salary',
          amountMinor: 200000, // $2,000.00
          currency: 'USD',
          occurredOn: '2026-10-01',
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        },
        {
          id: 'tx-2',
          kind: 'expense',
          accountId: 'acc-usd',
          categoryId: 'cat-groceries',
          amountMinor: 40000, // $400.00
          currency: 'USD',
          occurredOn: '2026-10-05',
          createdAt: '2026-10-05T00:00:00Z',
          updatedAt: '2026-10-05T00:00:00Z',
        },
        {
          id: 'tx-3',
          kind: 'expense',
          accountId: 'acc-usd',
          categoryId: 'cat-utilities',
          amountMinor: 15000, // $150.00
          currency: 'USD',
          occurredOn: '2026-10-12',
          createdAt: '2026-10-12T00:00:00Z',
          updatedAt: '2026-10-12T00:00:00Z',
        },
      ];

      const summary = calculateMonthSummary(transactions, '2026-10', 'USD');
      expect(summary.month).toBe('2026-10');
      expect(summary.currency).toBe('USD');
      expect(summary.incomeMinor).toBe(200000);
      expect(summary.expenseMinor).toBe(55000);
      expect(summary.netMinor).toBe(145000);
    });

    it('excludes transfers and other currencies from the monthly summary', () => {
      const transactions: Transaction[] = [
        // USD Transfer between accounts
        {
          id: 'tx-trans',
          kind: 'transfer',
          accountId: 'acc-usd-1',
          toAccountId: 'acc-usd-2',
          amountMinor: 50000,
          currency: 'USD',
          occurredOn: '2026-10-02',
          createdAt: '2026-10-02T00:00:00Z',
          updatedAt: '2026-10-02T00:00:00Z',
        },
        // KHR Expense
        {
          id: 'tx-khr',
          kind: 'expense',
          accountId: 'acc-khr',
          categoryId: 'cat-groceries',
          amountMinor: 800000,
          currency: 'KHR',
          occurredOn: '2026-10-03',
          createdAt: '2026-10-03T00:00:00Z',
          updatedAt: '2026-10-03T00:00:00Z',
        },
      ];

      const summaryUSD = calculateMonthSummary(transactions, '2026-10', 'USD');
      expect(summaryUSD.incomeMinor).toBe(0);
      expect(summaryUSD.expenseMinor).toBe(0);
      expect(summaryUSD.netMinor).toBe(0);

      const summaryKHR = calculateMonthSummary(transactions, '2026-10', 'KHR');
      expect(summaryKHR.expenseMinor).toBe(800000);
      expect(summaryKHR.netMinor).toBe(-800000);
    });
  });

  describe('calculateCategoryBreakdown', () => {
    it('computes category share percentages and sorts by amount descending', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-1',
          kind: 'expense',
          accountId: 'acc-usd',
          categoryId: 'cat-groceries',
          amountMinor: 7500, // 75%
          currency: 'USD',
          occurredOn: '2026-10-02',
          createdAt: '2026-10-02T00:00:00Z',
          updatedAt: '2026-10-02T00:00:00Z',
        },
        {
          id: 'tx-2',
          kind: 'expense',
          accountId: 'acc-usd',
          categoryId: 'cat-utilities',
          amountMinor: 2500, // 25%
          currency: 'USD',
          occurredOn: '2026-10-04',
          createdAt: '2026-10-04T00:00:00Z',
          updatedAt: '2026-10-04T00:00:00Z',
        },
      ];

      const breakdown = calculateCategoryBreakdown(transactions, categories, '2026-10', 'USD');
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].catId).toBe('cat-groceries');
      expect(breakdown[0].amountMinor).toBe(7500);
      expect(breakdown[0].percent).toBe(75);

      expect(breakdown[1].catId).toBe('cat-utilities');
      expect(breakdown[1].amountMinor).toBe(2500);
      expect(breakdown[1].percent).toBe(25);
    });

    it('returns empty array when no expenses exist for the month', () => {
      const breakdown = calculateCategoryBreakdown([], categories, '2026-10', 'USD');
      expect(breakdown).toEqual([]);
    });
  });

  describe('calculateMonthOverMonth', () => {
    it('compares current month expenses and income against previous month with percentages', () => {
      const transactions: Transaction[] = [
        // September (previous)
        {
          id: 'tx-sep-exp',
          kind: 'expense',
          accountId: 'acc-usd',
          categoryId: 'cat-groceries',
          amountMinor: 10000, // $100.00
          currency: 'USD',
          occurredOn: '2026-09-15',
          createdAt: '2026-09-15T00:00:00Z',
          updatedAt: '2026-09-15T00:00:00Z',
        },
        {
          id: 'tx-sep-inc',
          kind: 'income',
          accountId: 'acc-usd',
          categoryId: 'cat-salary',
          amountMinor: 200000,
          currency: 'USD',
          occurredOn: '2026-09-01',
          createdAt: '2026-09-01T00:00:00Z',
          updatedAt: '2026-09-01T00:00:00Z',
        },
        // October (current)
        {
          id: 'tx-oct-exp',
          kind: 'expense',
          accountId: 'acc-usd',
          categoryId: 'cat-groceries',
          amountMinor: 15000, // $150.00 (+50%)
          currency: 'USD',
          occurredOn: '2026-10-10',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
        },
        {
          id: 'tx-oct-inc',
          kind: 'income',
          accountId: 'acc-usd',
          categoryId: 'cat-salary',
          amountMinor: 200000, // $2,000.00 (0% change)
          currency: 'USD',
          occurredOn: '2026-10-01',
          createdAt: '2026-10-01T00:00:00Z',
          updatedAt: '2026-10-01T00:00:00Z',
        },
      ];

      const mom = calculateMonthOverMonth(transactions, categories, '2026-10', 'USD');
      expect(mom.currentMonth).toBe('2026-10');
      expect(mom.previousMonth).toBe('2026-09');
      expect(mom.currentExpenseMinor).toBe(15000);
      expect(mom.previousExpenseMinor).toBe(10000);
      expect(mom.expenseDiffMinor).toBe(5000);
      expect(mom.expenseChangePercent).toBe(50);

      expect(mom.currentIncomeMinor).toBe(200000);
      expect(mom.previousIncomeMinor).toBe(200000);
      expect(mom.incomeDiffMinor).toBe(0);
      expect(mom.incomeChangePercent).toBe(0);

      expect(mom.topCategory?.name).toBe('Groceries');
      expect(mom.topCategory?.amountMinor).toBe(15000);
    });

    it('returns null percentage changes gracefully when previous month had zero spending/income', () => {
      const transactions: Transaction[] = [
        {
          id: 'tx-oct-exp',
          kind: 'expense',
          accountId: 'acc-usd',
          categoryId: 'cat-groceries',
          amountMinor: 10000,
          currency: 'USD',
          occurredOn: '2026-10-10',
          createdAt: '2026-10-10T00:00:00Z',
          updatedAt: '2026-10-10T00:00:00Z',
        },
      ];

      const mom = calculateMonthOverMonth(transactions, categories, '2026-10', 'USD');
      expect(mom.previousExpenseMinor).toBe(0);
      expect(mom.expenseChangePercent).toBeNull();
      expect(mom.previousIncomeMinor).toBe(0);
      expect(mom.incomeChangePercent).toBeNull();
    });
  });

  describe('calculateMonthlyTrend', () => {
    it('returns ordered monthly summaries for the requested window', () => {
      const trend = calculateMonthlyTrend([], '2026-10', 'USD', 3);
      expect(trend).toHaveLength(3);
      expect(trend.map((t) => t.month)).toEqual(['2026-08', '2026-09', '2026-10']);
    });
  });

  describe('filterReportTransactions', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        kind: 'expense',
        accountId: 'acc-bank-usd',
        categoryId: 'cat-groceries',
        amountMinor: 5000,
        currency: 'USD',
        occurredOn: '2026-10-05',
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
      },
      {
        id: 'tx-2',
        kind: 'expense',
        accountId: 'acc-cash-usd',
        categoryId: 'cat-utilities',
        amountMinor: 2000,
        currency: 'USD',
        occurredOn: '2026-10-15',
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      },
      {
        id: 'tx-3',
        kind: 'transfer',
        accountId: 'acc-bank-usd',
        toAccountId: 'acc-cash-usd',
        amountMinor: 10000,
        currency: 'USD',
        occurredOn: '2026-10-20',
        createdAt: '2026-10-20T00:00:00Z',
        updatedAt: '2026-10-20T00:00:00Z',
      },
      {
        id: 'tx-4',
        kind: 'expense',
        accountId: 'acc-cash-khr',
        categoryId: 'cat-groceries',
        amountMinor: 40000,
        currency: 'KHR',
        occurredOn: '2026-10-22',
        createdAt: '2026-10-22T00:00:00Z',
        updatedAt: '2026-10-22T00:00:00Z',
      },
    ];

    it('filters by date range', () => {
      const filtered = filterReportTransactions(transactions, {
        startDate: '2026-10-01',
        endDate: '2026-10-10',
      });
      expect(filtered.map((t) => t.id)).toEqual(['tx-1']);
    });

    it('filters by currency', () => {
      const filtered = filterReportTransactions(transactions, { currency: 'KHR' });
      expect(filtered.map((t) => t.id)).toEqual(['tx-4']);
    });

    it('filters by category', () => {
      const filtered = filterReportTransactions(transactions, { categoryId: 'cat-utilities' });
      expect(filtered.map((t) => t.id)).toEqual(['tx-2']);
    });

    it('filters by account, matching either source or destination', () => {
      const filtered = filterReportTransactions(transactions, { accountId: 'acc-cash-usd' });
      // tx-2 (source is acc-cash-usd) and tx-3 (destination is acc-cash-usd)
      expect(filtered.map((t) => t.id).sort()).toEqual(['tx-2', 'tx-3']);
    });
  });
});
