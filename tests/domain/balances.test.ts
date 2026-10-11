import { describe, it, expect } from 'vitest';
import { calculateAccountBalance, calculateFinancialSummary } from '../../src/domain/calculations/balances';
import { calculateBudgetProgressList } from '../../src/domain/calculations/budget';
import { Account, Transaction, Budget, Category } from '../../src/domain/models/types';

describe('PocketFlow Balance & Budget Calculations', () => {
  const accountCashUSD: Account = {
    id: 'acc-usd-1',
    name: 'Cash USD',
    type: 'cash',
    currency: 'USD',
    openingBalanceMinor: 10000, // $100.00
    isArchived: false,
    createdAt: '2026-10-01T00:00:00Z',
  };

  const accountBankUSD: Account = {
    id: 'acc-usd-2',
    name: 'Bank USD',
    type: 'bank',
    currency: 'USD',
    openingBalanceMinor: 50000, // $500.00
    isArchived: false,
    createdAt: '2026-10-01T00:00:00Z',
  };

  const accountCashKHR: Account = {
    id: 'acc-khr-1',
    name: 'Cash KHR',
    type: 'cash',
    currency: 'KHR',
    openingBalanceMinor: 200000, // ៛200,000
    isArchived: false,
    createdAt: '2026-10-01T00:00:00Z',
  };

  it('calculates balance with income, expenses, and transfers correctly', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-1',
        kind: 'income',
        accountId: 'acc-usd-1',
        categoryId: 'cat-salary',
        amountMinor: 5000, // +$50.00
        currency: 'USD',
        occurredOn: '2026-10-05',
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
      },
      {
        id: 'tx-2',
        kind: 'expense',
        accountId: 'acc-usd-1',
        categoryId: 'cat-food',
        amountMinor: 2000, // -$20.00
        currency: 'USD',
        occurredOn: '2026-10-06',
        createdAt: '2026-10-06T00:00:00Z',
        updatedAt: '2026-10-06T00:00:00Z',
      },
      {
        id: 'tx-3',
        kind: 'transfer',
        accountId: 'acc-usd-1',
        toAccountId: 'acc-usd-2',
        amountMinor: 3000, // Transfer $30 from acc-usd-1 to acc-usd-2
        currency: 'USD',
        occurredOn: '2026-10-07',
        createdAt: '2026-10-07T00:00:00Z',
        updatedAt: '2026-10-07T00:00:00Z',
      },
    ];

    // Cash USD: 100 + 50 - 20 - 30 = 100 ($100.00)
    const cashBal = calculateAccountBalance(accountCashUSD, transactions);
    expect(cashBal.currentBalanceMinor).toBe(10000);

    // Bank USD: 500 + 30 = 530 ($530.00)
    const bankBal = calculateAccountBalance(accountBankUSD, transactions);
    expect(bankBal.currentBalanceMinor).toBe(53000);
  });

  it('keeps total money invariant during transfers and excludes transfers from income/expense', () => {
    const transactions: Transaction[] = [
      {
        id: 'tx-transfer',
        kind: 'transfer',
        accountId: 'acc-usd-1',
        toAccountId: 'acc-usd-2',
        amountMinor: 5000, // $50
        currency: 'USD',
        occurredOn: '2026-10-10',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      },
    ];

    const summary = calculateFinancialSummary(
      [accountCashUSD, accountBankUSD, accountCashKHR],
      transactions,
      '2026-10'
    );

    // Total USD money remains exactly $100 + $500 = $600 (60000 cents)
    expect(summary.USD.totalBalanceMinor).toBe(60000);
    // Transfers are excluded from monthly income and expenses
    expect(summary.USD.monthlyIncomeMinor).toBe(0);
    expect(summary.USD.monthlyExpenseMinor).toBe(0);

    // KHR total is intact
    expect(summary.KHR.totalBalanceMinor).toBe(200000);
  });

  it('handles empty accounts with zero balance or untouched opening balance', () => {
    const emptyAccount: Account = {
      id: 'acc-empty',
      name: 'Empty Wallet',
      type: 'cash',
      currency: 'USD',
      openingBalanceMinor: 0,
      isArchived: false,
      createdAt: '2026-10-01T00:00:00Z',
    };

    const untouchedAccount: Account = {
      id: 'acc-untouched',
      name: 'Savings',
      type: 'bank',
      currency: 'KHR',
      openingBalanceMinor: 500000,
      isArchived: false,
      createdAt: '2026-10-01T00:00:00Z',
    };

    const balEmpty = calculateAccountBalance(emptyAccount, []);
    expect(balEmpty.currentBalanceMinor).toBe(0);

    const balUntouched = calculateAccountBalance(untouchedAccount, []);
    expect(balUntouched.currentBalanceMinor).toBe(500000);
  });

  it('correctly updates derived balances when transactions are edited or deleted', () => {
    const tx1: Transaction = {
      id: 'tx-1',
      kind: 'income',
      accountId: 'acc-usd-1',
      categoryId: 'cat-salary',
      amountMinor: 5000, // +$50.00
      currency: 'USD',
      occurredOn: '2026-10-05',
      createdAt: '2026-10-05T00:00:00Z',
      updatedAt: '2026-10-05T00:00:00Z',
    };

    const tx2: Transaction = {
      id: 'tx-2',
      kind: 'expense',
      accountId: 'acc-usd-1',
      categoryId: 'cat-food',
      amountMinor: 2000, // -$20.00
      currency: 'USD',
      occurredOn: '2026-10-06',
      createdAt: '2026-10-06T00:00:00Z',
      updatedAt: '2026-10-06T00:00:00Z',
    };

    let txList = [tx1, tx2];
    // Cash USD: 10000 + 5000 - 2000 = 13000
    expect(calculateAccountBalance(accountCashUSD, txList).currentBalanceMinor).toBe(13000);

    // Edit tx2 from 2000 ($20) to 3500 ($35)
    const editedTx2: Transaction = { ...tx2, amountMinor: 3500 };
    txList = [tx1, editedTx2];
    // Cash USD: 10000 + 5000 - 3500 = 11500
    expect(calculateAccountBalance(accountCashUSD, txList).currentBalanceMinor).toBe(11500);

    // Delete tx2 completely
    txList = [tx1];
    // Cash USD: 10000 + 5000 = 15000
    expect(calculateAccountBalance(accountCashUSD, txList).currentBalanceMinor).toBe(15000);

    // Delete tx1 as well
    txList = [];
    // Cash USD returns to opening balance: 10000
    expect(calculateAccountBalance(accountCashUSD, txList).currentBalanceMinor).toBe(10000);
  });

  it('enforces month boundary behavior accurately', () => {
    const txOctoberStart: Transaction = {
      id: 'tx-oct-1',
      kind: 'income',
      accountId: 'acc-usd-1',
      categoryId: 'cat-salary',
      amountMinor: 10000,
      currency: 'USD',
      occurredOn: '2026-10-01',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
    };

    const txOctoberEnd: Transaction = {
      id: 'tx-oct-31',
      kind: 'expense',
      accountId: 'acc-usd-1',
      categoryId: 'cat-food',
      amountMinor: 4000,
      currency: 'USD',
      occurredOn: '2026-10-31',
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    };

    const txNovemberFirst: Transaction = {
      id: 'tx-nov-1',
      kind: 'expense',
      accountId: 'acc-usd-1',
      categoryId: 'cat-food',
      amountMinor: 2500,
      currency: 'USD',
      occurredOn: '2026-11-01',
      createdAt: '2026-11-01T00:00:00Z',
      updatedAt: '2026-11-01T00:00:00Z',
    };

    const transactions = [txOctoberStart, txOctoberEnd, txNovemberFirst];

    // For October 2026
    const octSummary = calculateFinancialSummary([accountCashUSD], transactions, '2026-10');
    expect(octSummary.USD.monthlyIncomeMinor).toBe(10000);
    expect(octSummary.USD.monthlyExpenseMinor).toBe(4000); // 31st is included, Nov 1st is excluded
    expect(octSummary.USD.monthlyNetMinor).toBe(6000);

    // For November 2026
    const novSummary = calculateFinancialSummary([accountCashUSD], transactions, '2026-11');
    expect(novSummary.USD.monthlyIncomeMinor).toBe(0);
    expect(novSummary.USD.monthlyExpenseMinor).toBe(2500); // Only Nov 1st
    expect(novSummary.USD.monthlyNetMinor).toBe(-2500);
  });

  it('calculates budget progress and warning states accurately', () => {
    const categories: Category[] = [
      { id: 'cat-food', name: 'Food', kind: 'expense', icon: 'utensils', sortOrder: 1, isArchived: false },
    ];
    const budgets: Budget[] = [
      { id: 'b-1', categoryId: 'cat-food', month: '2026-10', currency: 'USD', limitMinor: 10000 }, // $100 budget
    ];
    const transactions: Transaction[] = [
      {
        id: 't-1',
        kind: 'expense',
        accountId: 'acc-usd-1',
        categoryId: 'cat-food',
        amountMinor: 8500, // $85 (85%)
        currency: 'USD',
        occurredOn: '2026-10-05',
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
      },
    ];

    const progress = calculateBudgetProgressList(budgets, categories, transactions, '2026-10');
    expect(progress).toHaveLength(1);
    expect(progress[0].spentMinor).toBe(8500);
    expect(progress[0].remainingMinor).toBe(1500);
    expect(progress[0].percentageUsed).toBe(85);
    expect(progress[0].status).toBe('warning');
  });
});
