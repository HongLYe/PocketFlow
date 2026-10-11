/**
 * PocketFlow Storage Repository & Backup System
 */
import { db } from './db';
import type { Account, Category, Transaction, Budget, AppSettings } from '../domain/models/types';
import type { BackupData } from '../domain/validation/schemas';
import {
  BackupDataSchema,
  TransactionSchema,
  AccountSchema,
  CategorySchema,
  BudgetSchema,
} from '../domain/validation/schemas';
import { formatMoney } from '../domain/money/money';

export interface IPocketFlowRepository {
  init(): Promise<void>;

  getAccounts(): Promise<Account[]>;
  getAccount(id: string): Promise<Account | undefined>;
  saveAccount(account: Account): Promise<void>;
  archiveAccount(id: string): Promise<void>;
  unarchiveAccount(id: string): Promise<void>;
  deleteAccount(id: string): Promise<void>;

  getCategories(): Promise<Category[]>;
  getCategory(id: string): Promise<Category | undefined>;
  saveCategory(category: Category): Promise<void>;
  archiveCategory(id: string): Promise<void>;
  unarchiveCategory(id: string): Promise<void>;

  getTransactions(): Promise<Transaction[]>;
  getTransaction(id: string): Promise<Transaction | undefined>;
  saveTransaction(tx: Transaction): Promise<void>;
  deleteTransaction(id: string): Promise<void>;

  getBudgets(month?: string): Promise<Budget[]>;
  saveBudget(budget: Budget): Promise<void>;
  deleteBudget(id: string): Promise<void>;

  getSettings(): Promise<AppSettings>;
  updateSettings(settings: Partial<AppSettings>): Promise<void>;

  exportBackup(): Promise<string>;
  importBackup(jsonString: string): Promise<{ success: boolean; error?: string }>;
  exportTransactionsCSV(): Promise<string>;
}

/**
 * Escapes a single CSV field value according to RFC 4180 standards.
 */
export function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class PocketFlowRepository implements IPocketFlowRepository {
  async init(): Promise<void> {
    await db.seedDefaults();
  }

  async getAccounts(): Promise<Account[]> {
    return await db.accounts.toArray();
  }

  async getAccount(id: string): Promise<Account | undefined> {
    return await db.accounts.get(id);
  }

  async saveAccount(account: Account): Promise<void> {
    AccountSchema.parse(account);

    await db.transaction('rw', [db.accounts, db.transactions], async () => {
      const existing = await db.accounts.get(account.id);
      if (existing && existing.currency !== account.currency) {
        const txCount = await db.transactions
          .where('accountId')
          .equals(account.id)
          .or('toAccountId')
          .equals(account.id)
          .count();

        if (txCount > 0) {
          throw new Error(
            `Cannot change currency for account "${account.name}" because it already has ${txCount} transaction(s). Historical currency integrity must be preserved.`
          );
        }
      }
      await db.accounts.put(account);
    });
  }

  async archiveAccount(id: string): Promise<void> {
    const acc = await db.accounts.get(id);
    if (acc) {
      await db.accounts.update(id, { isArchived: true });
    }
  }

  async unarchiveAccount(id: string): Promise<void> {
    const acc = await db.accounts.get(id);
    if (acc) {
      await db.accounts.update(id, { isArchived: false });
    }
  }

  async deleteAccount(id: string): Promise<void> {
    await db.transaction('rw', [db.accounts, db.transactions], async () => {
      const txCount = await db.transactions
        .where('accountId')
        .equals(id)
        .or('toAccountId')
        .equals(id)
        .count();

      if (txCount > 0) {
        throw new Error(
          'Cannot delete an account with existing transactions. Please archive the account instead to preserve financial history.'
        );
      }
      await db.accounts.delete(id);
    });
  }

  async getCategories(): Promise<Category[]> {
    return await db.categories.orderBy('sortOrder').toArray();
  }

  async getCategory(id: string): Promise<Category | undefined> {
    return await db.categories.get(id);
  }

  async saveCategory(category: Category): Promise<void> {
    CategorySchema.parse(category);
    await db.categories.put(category);
  }

  async archiveCategory(id: string): Promise<void> {
    const cat = await db.categories.get(id);
    if (cat) {
      await db.categories.update(id, { isArchived: true });
    }
  }

  async unarchiveCategory(id: string): Promise<void> {
    const cat = await db.categories.get(id);
    if (cat) {
      await db.categories.update(id, { isArchived: false });
    }
  }

  async getTransactions(): Promise<Transaction[]> {
    const list = await db.transactions.toArray();
    return list.sort(
      (a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt)
    );
  }

  async getTransaction(id: string): Promise<Transaction | undefined> {
    return await db.transactions.get(id);
  }

  async saveTransaction(tx: Transaction): Promise<void> {
    TransactionSchema.parse(tx);

    await db.transaction('rw', [db.transactions, db.accounts, db.categories], async () => {
      const source = await db.accounts.get(tx.accountId);
      if (!source) {
        throw new Error(`Source account with ID "${tx.accountId}" does not exist.`);
      }

      if (source.currency !== tx.currency) {
        throw new Error(
          `Transaction currency (${tx.currency}) does not match source account currency (${source.currency}).`
        );
      }

      if (tx.kind === 'transfer') {
        if (!tx.toAccountId) {
          throw new Error('Transfers require a destination account.');
        }
        if (tx.accountId === tx.toAccountId) {
          throw new Error('Transfer destination must be different from source account.');
        }

        const target = await db.accounts.get(tx.toAccountId);
        if (!target) {
          throw new Error(`Destination account with ID "${tx.toAccountId}" does not exist.`);
        }

        if (source.currency !== target.currency) {
          throw new Error(
            `Transfers are only supported between accounts with the same currency. Source: ${source.currency}, Target: ${target.currency}.`
          );
        }

        if (tx.categoryId) {
          throw new Error('Transfers cannot have a category assigned.');
        }
      } else {
        if (!tx.categoryId) {
          throw new Error(`Category is required for ${tx.kind} transactions.`);
        }

        const category = await db.categories.get(tx.categoryId);
        if (!category) {
          throw new Error(`Category with ID "${tx.categoryId}" does not exist.`);
        }

        if (category.kind !== tx.kind) {
          throw new Error(
            `Category "${category.name}" (${category.kind}) does not match transaction type (${tx.kind}).`
          );
        }
      }

      await db.transactions.put(tx);
    });
  }

  async deleteTransaction(id: string): Promise<void> {
    await db.transactions.delete(id);
  }

  async getBudgets(month?: string): Promise<Budget[]> {
    if (month) {
      return await db.budgets.where('month').equals(month).toArray();
    }
    return await db.budgets.toArray();
  }

  async saveBudget(budget: Budget): Promise<void> {
    BudgetSchema.parse(budget);

    // Prevent duplicate budgets for the same category, month, and currency
    const existing = await db.budgets
      .where('[categoryId+month+currency]')
      .equals([budget.categoryId, budget.month, budget.currency])
      .first();

    if (existing && existing.id !== budget.id) {
      throw new Error(
        `A budget for this category in ${budget.month} (${budget.currency}) already exists.`
      );
    }

    await db.budgets.put(budget);
  }

  async deleteBudget(id: string): Promise<void> {
    await db.budgets.delete(id);
  }

  async getSettings(): Promise<AppSettings> {
    const s = await db.settings.get('global');
    if (!s) {
      return {
        preferredCurrency: 'ALL',
        theme: 'light',
        weekStartDay: 1,
        onboardingCompleted: true,
        exportVersion: 1,
      };
    }
    return s;
  }

  async updateSettings(settings: Partial<AppSettings>): Promise<void> {
    const current = await this.getSettings();
    await db.settings.put({
      ...current,
      ...settings,
      id: 'global',
    });
  }

  async exportBackup(): Promise<string> {
    const accounts = await db.accounts.toArray();
    const categories = await db.categories.toArray();
    const transactions = await db.transactions.toArray();
    const budgets = await db.budgets.toArray();
    const settings = await this.getSettings();

    const backup: BackupData = {
      version: 1,
      exportedAt: new Date().toISOString(),
      app: 'PocketFlow',
      accounts,
      categories,
      transactions,
      budgets,
      settings,
    };

    return JSON.stringify(backup, null, 2);
  }

  async importBackup(jsonString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const parsed = JSON.parse(jsonString);
      const validated = BackupDataSchema.parse(parsed);

      await db.transaction(
        'rw',
        [db.accounts, db.categories, db.transactions, db.budgets, db.settings],
        async () => {
          await db.accounts.clear();
          await db.categories.clear();
          await db.transactions.clear();
          await db.budgets.clear();
          await db.settings.clear();

          await db.accounts.bulkAdd(validated.accounts);
          await db.categories.bulkAdd(validated.categories);
          await db.transactions.bulkAdd(validated.transactions);
          await db.budgets.bulkAdd(validated.budgets);
          if (validated.settings) {
            await db.settings.put({ ...validated.settings, id: 'global' });
          }
        }
      );

      return { success: true };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid backup data format';
      return { success: false, error: message };
    }
  }

  async exportTransactionsCSV(): Promise<string> {
    const transactions = await this.getTransactions();
    const accounts = await this.getAccounts();
    const categories = await this.getCategories();

    const accMap = new Map(accounts.map((a) => [a.id, a.name]));
    const catMap = new Map(categories.map((c) => [c.id, c.name]));

    const header = [
      'Date',
      'Type',
      'Account',
      'Destination Account',
      'Category',
      'Amount',
      'Currency',
      'Note',
    ];
    const rows = transactions.map((t) => [
      escapeCsvField(t.occurredOn),
      escapeCsvField(t.kind),
      escapeCsvField(accMap.get(t.accountId) || t.accountId),
      escapeCsvField(t.toAccountId ? accMap.get(t.toAccountId) || t.toAccountId : ''),
      escapeCsvField(t.categoryId ? catMap.get(t.categoryId) || t.categoryId : ''),
      escapeCsvField(formatMoney(t.amountMinor, t.currency, { includeSymbol: false })),
      escapeCsvField(t.currency),
      escapeCsvField(t.note || ''),
    ]);

    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const repository = new PocketFlowRepository();

