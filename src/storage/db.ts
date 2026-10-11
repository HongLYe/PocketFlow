/**
 * PocketFlow Local-First Storage (Dexie.js / IndexedDB)
 */
import Dexie, { type EntityTable } from 'dexie';
import type { Account, Category, Transaction, Budget, AppSettings } from '../domain/models/types';

export const INITIAL_CATEGORIES: Omit<Category, 'id'>[] = [
  // Expense categories
  { name: 'Food & Dining', kind: 'expense', icon: 'Utensils', sortOrder: 1, isArchived: false },
  { name: 'Groceries', kind: 'expense', icon: 'ShoppingBag', sortOrder: 2, isArchived: false },
  { name: 'Transportation', kind: 'expense', icon: 'Car', sortOrder: 3, isArchived: false },
  { name: 'Housing & Rent', kind: 'expense', icon: 'Home', sortOrder: 4, isArchived: false },
  { name: 'Utilities & Bills', kind: 'expense', icon: 'Zap', sortOrder: 5, isArchived: false },
  { name: 'Healthcare', kind: 'expense', icon: 'HeartPulse', sortOrder: 6, isArchived: false },
  { name: 'Entertainment', kind: 'expense', icon: 'Film', sortOrder: 7, isArchived: false },
  { name: 'Shopping', kind: 'expense', icon: 'ShoppingCart', sortOrder: 8, isArchived: false },
  { name: 'Education', kind: 'expense', icon: 'GraduationCap', sortOrder: 9, isArchived: false },
  { name: 'General Expense', kind: 'expense', icon: 'HelpCircle', sortOrder: 10, isArchived: false },
  // Income categories
  { name: 'Salary', kind: 'income', icon: 'Briefcase', sortOrder: 1, isArchived: false },
  { name: 'Freelance & Business', kind: 'income', icon: 'Laptop', sortOrder: 2, isArchived: false },
  { name: 'Investments', kind: 'income', icon: 'TrendingUp', sortOrder: 3, isArchived: false },
  { name: 'Gifts & Other Income', kind: 'income', icon: 'Gift', sortOrder: 4, isArchived: false },
];

export class PocketFlowDB extends Dexie {
  accounts!: EntityTable<Account, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  transactions!: EntityTable<Transaction, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  settings!: EntityTable<AppSettings & { id: string }, 'id'>;

  constructor() {
    super('PocketFlowDatabase');

    // Schema definition
    this.version(1).stores({
      accounts: 'id, name, type, currency, isArchived, createdAt',
      categories: 'id, name, kind, sortOrder, isArchived',
      transactions: 'id, kind, accountId, toAccountId, categoryId, currency, occurredOn, createdAt',
      budgets: 'id, categoryId, month, currency, [categoryId+month+currency]',
      settings: 'id',
    });
  }

  async seedDefaults(): Promise<void> {
    const catCount = await this.categories.count();
    if (catCount === 0) {
      await this.categories.bulkPut(
        INITIAL_CATEGORIES.map((cat, idx) => ({
          ...cat,
          id: `cat-${idx + 1}`,
        }))
      );
    }

    const accCount = await this.accounts.count();
    if (accCount === 0) {
      const now = new Date().toISOString();
      await this.accounts.bulkPut([
        {
          id: 'acc-cash-usd',
          name: 'Cash (USD)',
          type: 'cash',
          currency: 'USD',
          openingBalanceMinor: 0,
          isArchived: false,
          createdAt: now,
        },
        {
          id: 'acc-cash-khr',
          name: 'Cash (KHR)',
          type: 'cash',
          currency: 'KHR',
          openingBalanceMinor: 0,
          isArchived: false,
          createdAt: now,
        },
      ]);
    }

    const settingsCount = await this.settings.count();
    if (settingsCount === 0) {
      await this.settings.put({
        id: 'global',
        preferredCurrency: 'ALL',
        theme: 'system',
        weekStartDay: 1,
        onboardingCompleted: true,
        exportVersion: 1,
      });
    }
  }
}

export const db = new PocketFlowDB();
