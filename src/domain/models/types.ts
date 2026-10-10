/**
 * PocketFlow Domain Entities
 */
import type { Currency } from '../money/money';

export type AccountType = 'cash' | 'bank' | 'ewallet';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  openingBalanceMinor: number;
  isArchived: boolean;
  createdAt: string;
}

export type TransactionKind = 'income' | 'expense' | 'transfer';

export interface Category {
  id: string;
  name: string;
  kind: 'income' | 'expense';
  icon: string;
  color?: string;
  sortOrder: number;
  isArchived: boolean;
}

export interface Transaction {
  id: string;
  kind: TransactionKind;
  accountId: string;
  toAccountId?: string | null; // Set only for 'transfer'
  categoryId?: string | null;  // Set only for 'income' or 'expense'
  amountMinor: number;         // Positive integer
  currency: Currency;
  occurredOn: string;          // ISO date format YYYY-MM-DD
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  month: string;               // YYYY-MM
  currency: Currency;
  limitMinor: number;          // Positive integer
}

export interface AppSettings {
  preferredCurrency: Currency | 'ALL';
  theme: 'light' | 'dark' | 'system';
  weekStartDay: 0 | 1; // 0 = Sunday, 1 = Monday
  onboardingCompleted: boolean;
  exportVersion: number;
}
