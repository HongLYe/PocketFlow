import { describe, it, expect } from 'vitest';
import { calculateBudgetProgressList } from '../../src/domain/calculations/budget';
import type { Budget, Category, Transaction } from '../../src/domain/models/types';

describe('PocketFlow Monthly Budget Domain Calculations', () => {
  const sampleCategories: Category[] = [
    { id: 'cat-groceries', name: 'Groceries', kind: 'expense', icon: 'ShoppingCart', sortOrder: 1, isArchived: false },
    { id: 'cat-dining', name: 'Dining Out', kind: 'expense', icon: 'Utensils', sortOrder: 2, isArchived: false },
    { id: 'cat-salary', name: 'Salary', kind: 'income', icon: 'Briefcase', sortOrder: 3, isArchived: false },
  ];

  const budgetUSD: Budget = {
    id: 'b-groc-usd',
    categoryId: 'cat-groceries',
    month: '2026-10',
    currency: 'USD',
    limitMinor: 20000, // $200.00
  };

  const budgetKHR: Budget = {
    id: 'b-dining-khr',
    categoryId: 'cat-dining',
    month: '2026-10',
    currency: 'KHR',
    limitMinor: 400000, // 400,000 KHR
  };

  it('correctly calculates spending, remaining amount, and percentage used for expense transactions', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        kind: 'expense',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        amountMinor: 5000, // $50.00
        currency: 'USD',
        occurredOn: '2026-10-02',
        createdAt: '2026-10-02T00:00:00Z',
        updatedAt: '2026-10-02T00:00:00Z',
      },
      {
        id: 'tx-2',
        kind: 'expense',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        amountMinor: 10000, // $100.00
        currency: 'USD',
        occurredOn: '2026-10-15',
        createdAt: '2026-10-15T00:00:00Z',
        updatedAt: '2026-10-15T00:00:00Z',
      },
    ];

    const results = calculateBudgetProgressList([budgetUSD], sampleCategories, transactions, '2026-10');
    expect(results).toHaveLength(1);

    const progress = results[0];
    expect(progress.budget.id).toBe('b-groc-usd');
    expect(progress.category?.name).toBe('Groceries');
    expect(progress.spentMinor).toBe(15000); // $150.00
    expect(progress.remainingMinor).toBe(5000); // $50.00
    expect(progress.percentageUsed).toBe(75);
    expect(progress.status).toBe('normal');
  });

  it('strictly excludes transfers and income from budget calculations', () => {
    const transactions: Transaction[] = [
      // Income into Groceries category (e.g. refund/rebate or category reuse)
      {
        id: 'tx-inc',
        kind: 'income',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        amountMinor: 30000,
        currency: 'USD',
        occurredOn: '2026-10-05',
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
      },
      // Transfer between accounts
      {
        id: 'tx-trans',
        kind: 'transfer',
        accountId: 'acc-1',
        toAccountId: 'acc-2',
        categoryId: 'cat-groceries',
        amountMinor: 15000,
        currency: 'USD',
        occurredOn: '2026-10-06',
        createdAt: '2026-10-06T00:00:00Z',
        updatedAt: '2026-10-06T00:00:00Z',
      },
    ];

    const results = calculateBudgetProgressList([budgetUSD], sampleCategories, transactions, '2026-10');
    expect(results[0].spentMinor).toBe(0);
    expect(results[0].remainingMinor).toBe(20000);
    expect(results[0].percentageUsed).toBe(0);
    expect(results[0].status).toBe('normal');
  });

  it('strictly isolates currencies and does not convert or mix USD and KHR', () => {
    const transactions: Transaction[] = [
      // KHR expense in Groceries - must NOT affect USD Groceries budget!
      {
        id: 'tx-khr-groc',
        kind: 'expense',
        accountId: 'acc-khr',
        categoryId: 'cat-groceries',
        amountMinor: 20000,
        currency: 'KHR',
        occurredOn: '2026-10-08',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      },
      // USD expense in Dining - must NOT affect KHR Dining budget!
      {
        id: 'tx-usd-dining',
        kind: 'expense',
        accountId: 'acc-usd',
        categoryId: 'cat-dining',
        amountMinor: 5000,
        currency: 'USD',
        occurredOn: '2026-10-08',
        createdAt: '2026-10-08T00:00:00Z',
        updatedAt: '2026-10-08T00:00:00Z',
      },
    ];

    const results = calculateBudgetProgressList([budgetUSD, budgetKHR], sampleCategories, transactions, '2026-10');
    const usdProgress = results.find((r) => r.budget.id === 'b-groc-usd')!;
    const khrProgress = results.find((r) => r.budget.id === 'b-dining-khr')!;

    expect(usdProgress.spentMinor).toBe(0);
    expect(khrProgress.spentMinor).toBe(0);
  });

  it('filters transactions strictly by the specified month YYYY-MM', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-sep',
        kind: 'expense',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        amountMinor: 10000,
        currency: 'USD',
        occurredOn: '2026-09-30',
        createdAt: '2026-09-30T00:00:00Z',
        updatedAt: '2026-09-30T00:00:00Z',
      },
      {
        id: 'tx-oct',
        kind: 'expense',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        amountMinor: 4000,
        currency: 'USD',
        occurredOn: '2026-10-01',
        createdAt: '2026-10-01T00:00:00Z',
        updatedAt: '2026-10-01T00:00:00Z',
      },
      {
        id: 'tx-nov',
        kind: 'expense',
        accountId: 'acc-1',
        categoryId: 'cat-groceries',
        amountMinor: 12000,
        currency: 'USD',
        occurredOn: '2026-11-01',
        createdAt: '2026-11-01T00:00:00Z',
        updatedAt: '2026-11-01T00:00:00Z',
      },
    ];

    const results = calculateBudgetProgressList([budgetUSD], sampleCategories, transactions, '2026-10');
    expect(results[0].spentMinor).toBe(4000);
    expect(results[0].remainingMinor).toBe(16000);
    expect(results[0].percentageUsed).toBe(20);
  });

  it('indicates warning when usage >= 80% and exceeded when usage >= 100%', () => {
    // Exactly 80%
    const txWarning: Transaction = {
      id: 'tx-w',
      kind: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-groceries',
      amountMinor: 16000, // 80% of 20000
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    };

    let results = calculateBudgetProgressList([budgetUSD], sampleCategories, [txWarning], '2026-10');
    expect(results[0].percentageUsed).toBe(80);
    expect(results[0].status).toBe('warning');

    // 105% (exceeded)
    const txExceeded: Transaction = {
      id: 'tx-e',
      kind: 'expense',
      accountId: 'acc-1',
      categoryId: 'cat-groceries',
      amountMinor: 21000, // 105% of 20000
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    };

    results = calculateBudgetProgressList([budgetUSD], sampleCategories, [txExceeded], '2026-10');
    expect(results[0].spentMinor).toBe(21000);
    expect(results[0].remainingMinor).toBe(-1000); // Negative remaining
    expect(results[0].percentageUsed).toBe(105);
    expect(results[0].status).toBe('exceeded');
  });
});
