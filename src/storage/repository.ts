/**
 * PocketFlow Storage Repository & Backup System
 */
import { db } from './db';
import type { Account, Category, Transaction, Budget, AppSettings } from '../domain/models/types';
import type { BackupData } from '../domain/validation/schemas';
import { BackupDataSchema, TransactionSchema } from '../domain/validation/schemas';
import { formatMoney } from '../domain/money/money';

export interface IPocketFlowRepository {
  getAccounts(): Promise<Account[]>;
  saveAccount(account: Account): Promise<void>;
  archiveAccount(id: string): Promise<void>;

  getCategories(): Promise<Category[]>;
  saveCategory(category: Category): Promise<void>;

  getTransactions(): Promise<Transaction[]>;
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

export class PocketFlowRepository implements IPocketFlowRepository {
  async init(): Promise<void> {
    await db.seedDefaults();
  }

  async getAccounts(): Promise<Account[]> {
    return await db.accounts.toArray();
  }

  async saveAccount(account: Account): Promise<void> {
    await db.accounts.put(account);
  }

  async archiveAccount(id: string): Promise<void> {
    const acc = await db.accounts.get(id);
    if (acc) {
      await db.accounts.update(id, { isArchived: true });
    }
  }

  async getCategories(): Promise<Category[]> {
    return await db.categories.orderBy('sortOrder').toArray();
  }

  async saveCategory(category: Category): Promise<void> {
    await db.categories.put(category);
  }

  async getTransactions(): Promise<Transaction[]> {
    const list = await db.transactions.toArray();
    return list.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt));
  }

  async saveTransaction(tx: Transaction): Promise<void> {
    TransactionSchema.parse(tx);

    if (tx.kind === 'transfer') {
      const source = await db.accounts.get(tx.accountId);
      const target = tx.toAccountId ? await db.accounts.get(tx.toAccountId) : undefined;

      if (!source || !target) {
        throw new Error('Both source and destination accounts must exist for a transfer.');
      }
      if (source.currency !== target.currency) {
        throw new Error(
          `Transfers are only supported between accounts with the same currency. Source: ${source.currency}, Target: ${target.currency}.`
        );
      }
      if (source.id === target.id) {
        throw new Error('Transfer destination must be different from source account.');
      }
    }

    await db.transactions.put(tx);
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
        theme: 'system',
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

      await db.transaction('rw', [db.accounts, db.categories, db.transactions, db.budgets, db.settings], async () => {
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
      });

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

    const header = ['Date', 'Type', 'Account', 'Destination Account', 'Category', 'Amount', 'Currency', 'Note'];
    const rows = transactions.map((t) => [
      t.occurredOn,
      t.kind,
      `"${accMap.get(t.accountId) || t.accountId}"`,
      t.toAccountId ? `"${accMap.get(t.toAccountId) || t.toAccountId}"` : '',
      t.categoryId ? `"${catMap.get(t.categoryId) || t.categoryId}"` : '',
      formatMoney(t.amountMinor, t.currency, { includeSymbol: false }),
      t.currency,
      `"${(t.note || '').replace(/"/g, '""')}"`,
    ]);

    return [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

export const repository = new PocketFlowRepository();
