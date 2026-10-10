/**
 * PocketFlow Balance & Cashflow Calculations
 */
import type { Currency } from '../money/money';
import type { Account, Transaction } from '../models/types';

export interface AccountBalance {
  accountId: string;
  accountName: string;
  currency: Currency;
  openingBalanceMinor: number;
  currentBalanceMinor: number;
}

export interface CurrencySummary {
  currency: Currency;
  totalBalanceMinor: number;
  monthlyIncomeMinor: number;
  monthlyExpenseMinor: number;
  monthlyNetMinor: number;
}

/**
 * Calculates current balance for a single account
 */
export function calculateAccountBalance(
  account: Account,
  transactions: Transaction[]
): AccountBalance {
  let deltaMinor = 0;

  for (const tx of transactions) {
    if (tx.currency !== account.currency) continue;

    if (tx.accountId === account.id) {
      if (tx.kind === 'income') {
        deltaMinor += tx.amountMinor;
      } else if (tx.kind === 'expense') {
        deltaMinor -= tx.amountMinor;
      } else if (tx.kind === 'transfer') {
        deltaMinor -= tx.amountMinor;
      }
    } else if (tx.kind === 'transfer' && tx.toAccountId === account.id) {
      deltaMinor += tx.amountMinor;
    }
  }

  return {
    accountId: account.id,
    accountName: account.name,
    currency: account.currency,
    openingBalanceMinor: account.openingBalanceMinor,
    currentBalanceMinor: account.openingBalanceMinor + deltaMinor,
  };
}

/**
 * Calculates total balance and monthly totals separately for USD and KHR
 */
export function calculateFinancialSummary(
  accounts: Account[],
  transactions: Transaction[],
  currentMonth: string // YYYY-MM
): { USD: CurrencySummary; KHR: CurrencySummary } {
  const activeAccounts = accounts.filter((a) => !a.isArchived);

  let usdTotal = 0;
  let khrTotal = 0;

  for (const acc of activeAccounts) {
    const bal = calculateAccountBalance(acc, transactions);
    if (acc.currency === 'USD') {
      usdTotal += bal.currentBalanceMinor;
    } else {
      khrTotal += bal.currentBalanceMinor;
    }
  }

  let usdIncome = 0;
  let usdExpense = 0;
  let khrIncome = 0;
  let khrExpense = 0;

  for (const tx of transactions) {
    if (!tx.occurredOn.startsWith(currentMonth)) continue;
    if (tx.kind === 'transfer') continue; // Transfers are neither income nor expense

    if (tx.currency === 'USD') {
      if (tx.kind === 'income') usdIncome += tx.amountMinor;
      else if (tx.kind === 'expense') usdExpense += tx.amountMinor;
    } else {
      if (tx.kind === 'income') khrIncome += tx.amountMinor;
      else if (tx.kind === 'expense') khrExpense += tx.amountMinor;
    }
  }

  return {
    USD: {
      currency: 'USD',
      totalBalanceMinor: usdTotal,
      monthlyIncomeMinor: usdIncome,
      monthlyExpenseMinor: usdExpense,
      monthlyNetMinor: usdIncome - usdExpense,
    },
    KHR: {
      currency: 'KHR',
      totalBalanceMinor: khrTotal,
      monthlyIncomeMinor: khrIncome,
      monthlyExpenseMinor: khrExpense,
      monthlyNetMinor: khrIncome - khrExpense,
    },
  };
}
