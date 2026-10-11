import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { db, PocketFlowDB } from '../../src/storage/db';
import { PocketFlowRepository, escapeCsvField } from '../../src/storage/repository';
import type { Account, Budget } from '../../src/domain/models/types';
import { calculateAccountBalance } from '../../src/domain/calculations/balances';

describe('PocketFlow Database & Repository Layer Integration', () => {
  let repo: PocketFlowRepository;

  beforeEach(async () => {
    // Clean all tables before each test
    await db.accounts.clear();
    await db.categories.clear();
    await db.transactions.clear();
    await db.budgets.clear();
    await db.settings.clear();

    repo = new PocketFlowRepository();
    await repo.init();
  });

  it('seeds default categories and zero-balance cash accounts without fabricated transactions', async () => {
    const categories = await repo.getCategories();
    expect(categories.length).toBeGreaterThanOrEqual(14);

    const accounts = await repo.getAccounts();
    expect(accounts.length).toBe(2);
    expect(accounts.map((a) => a.currency).sort()).toEqual(['KHR', 'USD']);
    expect(accounts.every((a) => a.openingBalanceMinor === 0)).toBe(true);

    const transactions = await repo.getTransactions();
    expect(transactions).toHaveLength(0); // Zero fabricated transactions
  });

  it('allows creating, reading, and editing an account', async () => {
    const newAcc: Account = {
      id: 'acc-aba-usd',
      name: 'ABA Bank USD',
      type: 'bank',
      currency: 'USD',
      openingBalanceMinor: 25000, // $250.00
      isArchived: false,
      createdAt: '2026-10-10T10:00:00Z',
    };

    await repo.saveAccount(newAcc);

    const fetched = await repo.getAccount('acc-aba-usd');
    expect(fetched).toBeDefined();
    expect(fetched?.name).toBe('ABA Bank USD');
    expect(fetched?.openingBalanceMinor).toBe(25000);
    expect(fetched?.type).toBe('bank');

    // Edit account name
    await repo.saveAccount({ ...newAcc, name: 'ABA Main Checking' });
    const updated = await repo.getAccount('acc-aba-usd');
    expect(updated?.name).toBe('ABA Main Checking');
  });

  it('allows archiving and unarchiving accounts while preserving history', async () => {
    const acc: Account = {
      id: 'acc-wing-khr',
      name: 'Wing Wallet',
      type: 'ewallet',
      currency: 'KHR',
      openingBalanceMinor: 100000,
      isArchived: false,
      createdAt: '2026-10-10T10:00:00Z',
    };
    await repo.saveAccount(acc);

    await repo.archiveAccount('acc-wing-khr');
    let fetched = await repo.getAccount('acc-wing-khr');
    expect(fetched?.isArchived).toBe(true);

    await repo.unarchiveAccount('acc-wing-khr');
    fetched = await repo.getAccount('acc-wing-khr');
    expect(fetched?.isArchived).toBe(false);
  });

  it('allows deleting an account without transactions, but prevents deleting an account with transactions', async () => {
    const unusedAcc: Account = {
      id: 'acc-empty-test',
      name: 'Unused Bank',
      type: 'bank',
      currency: 'USD',
      openingBalanceMinor: 0,
      isArchived: false,
      createdAt: '2026-10-10T10:00:00Z',
    };
    await repo.saveAccount(unusedAcc);
    expect(await repo.getAccount('acc-empty-test')).toBeDefined();

    // Can delete unused account
    await repo.deleteAccount('acc-empty-test');
    expect(await repo.getAccount('acc-empty-test')).toBeUndefined();

    // Now test account with transaction
    const usedAcc: Account = {
      id: 'acc-used-test',
      name: 'Used Bank',
      type: 'bank',
      currency: 'USD',
      openingBalanceMinor: 1000,
      isArchived: false,
      createdAt: '2026-10-10T10:00:00Z',
    };
    await repo.saveAccount(usedAcc);

    const categories = await repo.getCategories();
    const incomeCat = categories.find((c) => c.kind === 'income')!;
    await repo.saveTransaction({
      id: 'tx-for-delete-test',
      kind: 'income',
      accountId: 'acc-used-test',
      categoryId: incomeCat.id,
      amountMinor: 500,
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    });

    // Attempting to delete must throw error
    await expect(repo.deleteAccount('acc-used-test')).rejects.toThrow(
      /Cannot delete an account with existing transactions/
    );
    expect(await repo.getAccount('acc-used-test')).toBeDefined();

    // Test transfer destination account cannot be deleted either
    const destAcc: Account = {
      id: 'acc-dest-delete-test',
      name: 'Dest Bank',
      type: 'bank',
      currency: 'USD',
      openingBalanceMinor: 0,
      isArchived: false,
      createdAt: '2026-10-10T10:00:00Z',
    };
    await repo.saveAccount(destAcc);
    await repo.saveTransaction({
      id: 'tx-trf-delete-test',
      kind: 'transfer',
      accountId: 'acc-used-test',
      toAccountId: 'acc-dest-delete-test',
      amountMinor: 100,
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    });

    await expect(repo.deleteAccount('acc-dest-delete-test')).rejects.toThrow(
      /Cannot delete an account with existing transactions/
    );
  });

  it('strictly prevents changing account currency once transactions exist', async () => {
    const acc: Account = {
      id: 'acc-change-test',
      name: 'Test Wallet',
      type: 'cash',
      currency: 'USD',
      openingBalanceMinor: 1000,
      isArchived: false,
      createdAt: '2026-10-10T10:00:00Z',
    };
    await repo.saveAccount(acc);

    const categories = await repo.getCategories();
    const incomeCat = categories.find((c) => c.kind === 'income')!;

    // Add a transaction
    await repo.saveTransaction({
      id: 'tx-usd-1',
      kind: 'income',
      accountId: 'acc-change-test',
      categoryId: incomeCat.id,
      amountMinor: 500,
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T10:00:00Z',
      updatedAt: '2026-10-10T10:00:00Z',
    });

    // Attempt to change currency to KHR
    await expect(
      repo.saveAccount({
        ...acc,
        currency: 'KHR',
      })
    ).rejects.toThrow(/Cannot change currency/);
  });

  it('handles income, expense, and same-currency transfer lifecycle with correct derived balances', async () => {
    const sourceAcc: Account = {
      id: 'acc-src-usd',
      name: 'Source USD',
      type: 'bank',
      currency: 'USD',
      openingBalanceMinor: 10000, // $100.00
      isArchived: false,
      createdAt: '2026-10-10T00:00:00Z',
    };
    const destAcc: Account = {
      id: 'acc-dst-usd',
      name: 'Dest USD',
      type: 'cash',
      currency: 'USD',
      openingBalanceMinor: 2000, // $20.00
      isArchived: false,
      createdAt: '2026-10-10T00:00:00Z',
    };

    await repo.saveAccount(sourceAcc);
    await repo.saveAccount(destAcc);

    const categories = await repo.getCategories();
    const salaryCat = categories.find((c) => c.kind === 'income')!;
    const foodCat = categories.find((c) => c.kind === 'expense')!;

    // 1. Income: +$50.00
    await repo.saveTransaction({
      id: 'tx-inc',
      kind: 'income',
      accountId: 'acc-src-usd',
      categoryId: salaryCat.id,
      amountMinor: 5000,
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T01:00:00Z',
      updatedAt: '2026-10-10T01:00:00Z',
    });

    // 2. Expense: -$15.00
    await repo.saveTransaction({
      id: 'tx-exp',
      kind: 'expense',
      accountId: 'acc-src-usd',
      categoryId: foodCat.id,
      amountMinor: 1500,
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T02:00:00Z',
      updatedAt: '2026-10-10T02:00:00Z',
    });

    // 3. Transfer: $30.00 from source to dest
    await repo.saveTransaction({
      id: 'tx-trf',
      kind: 'transfer',
      accountId: 'acc-src-usd',
      toAccountId: 'acc-dst-usd',
      amountMinor: 3000,
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T03:00:00Z',
      updatedAt: '2026-10-10T03:00:00Z',
    });

    let allTxs = await repo.getTransactions();
    expect(allTxs).toHaveLength(3);

    // Verify balances
    // Source: 100 + 50 - 15 - 30 = 105 ($105.00 = 10500)
    const srcBal = calculateAccountBalance(sourceAcc, allTxs);
    expect(srcBal.currentBalanceMinor).toBe(10500);

    // Dest: 20 + 30 = 50 ($50.00 = 5000)
    const dstBal = calculateAccountBalance(destAcc, allTxs);
    expect(dstBal.currentBalanceMinor).toBe(5000);

    // Delete the transfer
    await repo.deleteTransaction('tx-trf');
    allTxs = await repo.getTransactions();
    expect(allTxs).toHaveLength(2);

    // Balances after transfer deletion
    // Source: 100 + 50 - 15 = 135 (13500)
    expect(calculateAccountBalance(sourceAcc, allTxs).currentBalanceMinor).toBe(13500);
    // Dest: 20 (2000)
    expect(calculateAccountBalance(destAcc, allTxs).currentBalanceMinor).toBe(2000);
  });

  it('rejects invalid transfers: cross-currency, self-transfer, and missing accounts', async () => {
    const usdAcc: Account = {
      id: 'acc-usd-test',
      name: 'USD Account',
      type: 'bank',
      currency: 'USD',
      openingBalanceMinor: 10000,
      isArchived: false,
      createdAt: '2026-10-10T00:00:00Z',
    };
    const khrAcc: Account = {
      id: 'acc-khr-test',
      name: 'KHR Account',
      type: 'bank',
      currency: 'KHR',
      openingBalanceMinor: 400000,
      isArchived: false,
      createdAt: '2026-10-10T00:00:00Z',
    };

    await repo.saveAccount(usdAcc);
    await repo.saveAccount(khrAcc);

    // 1. Cross-currency transfer (USD -> KHR) must fail
    await expect(
      repo.saveTransaction({
        id: 'tx-cross',
        kind: 'transfer',
        accountId: 'acc-usd-test',
        toAccountId: 'acc-khr-test',
        amountMinor: 1000,
        currency: 'USD',
        occurredOn: '2026-10-10',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      })
    ).rejects.toThrow(/Transfers are only supported between accounts with the same currency/);

    // 2. Self transfer (acc-usd-test -> acc-usd-test) must fail
    await expect(
      repo.saveTransaction({
        id: 'tx-self',
        kind: 'transfer',
        accountId: 'acc-usd-test',
        toAccountId: 'acc-usd-test',
        amountMinor: 1000,
        currency: 'USD',
        occurredOn: '2026-10-10',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      })
    ).rejects.toThrow();

    // 3. Non-existent destination account must fail
    await expect(
      repo.saveTransaction({
        id: 'tx-missing-dest',
        kind: 'transfer',
        accountId: 'acc-usd-test',
        toAccountId: 'acc-non-existent',
        amountMinor: 1000,
        currency: 'USD',
        occurredOn: '2026-10-10',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      })
    ).rejects.toThrow(/Destination account with ID "acc-non-existent" does not exist/);
  });

  it('rejects invalid transactions: missing category, category kind mismatch, currency mismatch', async () => {
    const usdAcc: Account = {
      id: 'acc-usd-test',
      name: 'USD Account',
      type: 'bank',
      currency: 'USD',
      openingBalanceMinor: 10000,
      isArchived: false,
      createdAt: '2026-10-10T00:00:00Z',
    };
    await repo.saveAccount(usdAcc);

    const categories = await repo.getCategories();
    const incomeCat = categories.find((c) => c.kind === 'income')!;

    // 1. Expense transaction using an income category must fail
    await expect(
      repo.saveTransaction({
        id: 'tx-cat-mismatch',
        kind: 'expense',
        accountId: 'acc-usd-test',
        categoryId: incomeCat.id,
        amountMinor: 500,
        currency: 'USD',
        occurredOn: '2026-10-10',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      })
    ).rejects.toThrow(/does not match transaction type/);

    // 2. Transaction currency mismatching source account currency must fail
    await expect(
      repo.saveTransaction({
        id: 'tx-cur-mismatch',
        kind: 'income',
        accountId: 'acc-usd-test',
        categoryId: incomeCat.id,
        amountMinor: 500,
        currency: 'KHR', // KHR on USD account!
        occurredOn: '2026-10-10',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      })
    ).rejects.toThrow(/does not match source account currency/);

    // 3. Non-existent source account must fail
    await expect(
      repo.saveTransaction({
        id: 'tx-no-source',
        kind: 'income',
        accountId: 'non-existent-acc',
        categoryId: incomeCat.id,
        amountMinor: 500,
        currency: 'USD',
        occurredOn: '2026-10-10',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      })
    ).rejects.toThrow(/Source account with ID "non-existent-acc" does not exist/);
  });

  it('persists data across independent database connections (simulating page reload)', async () => {
    const acc: Account = {
      id: 'acc-persist-test',
      name: 'Persistent Bank',
      type: 'bank',
      currency: 'USD',
      openingBalanceMinor: 75000,
      isArchived: false,
      createdAt: '2026-10-10T00:00:00Z',
    };
    await repo.saveAccount(acc);

    const categories = await repo.getCategories();
    const incomeCat = categories.find((c) => c.kind === 'income')!;

    await repo.saveTransaction({
      id: 'tx-persist-1',
      kind: 'income',
      accountId: 'acc-persist-test',
      categoryId: incomeCat.id,
      amountMinor: 12000,
      currency: 'USD',
      occurredOn: '2026-10-10',
      createdAt: '2026-10-10T00:00:00Z',
      updatedAt: '2026-10-10T00:00:00Z',
    });

    // Simulate page reload by creating a new database & repository instance
    const reloadedDb = new PocketFlowDB();
    const reloadedAcc = await reloadedDb.accounts.get('acc-persist-test');
    expect(reloadedAcc).toBeDefined();
    expect(reloadedAcc?.name).toBe('Persistent Bank');
    expect(reloadedAcc?.openingBalanceMinor).toBe(75000);

    const reloadedTx = await reloadedDb.transactions.get('tx-persist-1');
    expect(reloadedTx).toBeDefined();
    expect(reloadedTx?.amountMinor).toBe(12000);
  });

  describe('Budget Management & Duplicate Prevention', () => {
    it('creates, reads, and deletes budgets', async () => {
      const budget: Budget = {
        id: 'b-oct-food',
        categoryId: 'cat-food',
        month: '2026-10',
        currency: 'USD',
        limitMinor: 35000,
      };

      await repo.saveBudget(budget);
      const fetched = await repo.getBudgets('2026-10');
      expect(fetched).toHaveLength(1);
      expect(fetched[0].limitMinor).toBe(35000);

      await repo.deleteBudget('b-oct-food');
      const afterDelete = await repo.getBudgets('2026-10');
      expect(afterDelete).toHaveLength(0);
    });

    it('strictly prevents duplicate budgets for the same category, month, and currency', async () => {
      const budget1: Budget = {
        id: 'b-1',
        categoryId: 'cat-groceries',
        month: '2026-10',
        currency: 'USD',
        limitMinor: 20000,
      };
      await repo.saveBudget(budget1);

      // Attempt duplicate with different ID but same category, month, currency
      const budget2: Budget = {
        id: 'b-2',
        categoryId: 'cat-groceries',
        month: '2026-10',
        currency: 'USD',
        limitMinor: 25000,
      };
      await expect(repo.saveBudget(budget2)).rejects.toThrow(/already exists/);

      // Same category and month but DIFFERENT currency (KHR) must be allowed
      const budgetKHR: Budget = {
        id: 'b-khr',
        categoryId: 'cat-groceries',
        month: '2026-10',
        currency: 'KHR',
        limitMinor: 800000,
      };
      await expect(repo.saveBudget(budgetKHR)).resolves.not.toThrow();

      // Updating the existing budget (same ID) must succeed
      await expect(repo.saveBudget({ ...budget1, limitMinor: 30000 })).resolves.not.toThrow();
      const updated = await repo.getBudgets('2026-10');
      const found = updated.find((b) => b.id === 'b-1');
      expect(found?.limitMinor).toBe(30000);
    });
  });

  describe('Category Management', () => {
    it('allows archiving and unarchiving categories', async () => {
      const categories = await repo.getCategories();
      const cat = categories[0];

      await repo.archiveCategory(cat.id);
      let updated = await repo.getCategory(cat.id);
      expect(updated?.isArchived).toBe(true);

      await repo.unarchiveCategory(cat.id);
      updated = await repo.getCategory(cat.id);
      expect(updated?.isArchived).toBe(false);
    });

    it('preserves historical transactions when accounts and categories are archived', async () => {
      const acc: Account = {
        id: 'acc-archive-history',
        name: 'Savings to Archive',
        type: 'bank',
        currency: 'USD',
        openingBalanceMinor: 5000,
        isArchived: false,
        createdAt: '2026-10-01T00:00:00Z',
      };
      await repo.saveAccount(acc);

      const categories = await repo.getCategories();
      const expenseCat = categories.find((c) => c.kind === 'expense')!;

      await repo.saveTransaction({
        id: 'tx-history-test',
        kind: 'expense',
        accountId: 'acc-archive-history',
        categoryId: expenseCat.id,
        amountMinor: 2500,
        currency: 'USD',
        occurredOn: '2026-10-05',
        createdAt: '2026-10-05T00:00:00Z',
        updatedAt: '2026-10-05T00:00:00Z',
      });

      // Archive both the account and the category
      await repo.archiveAccount('acc-archive-history');
      await repo.archiveCategory(expenseCat.id);

      // Verify transaction is still fully intact and queryable
      const tx = await repo.getTransaction('tx-history-test');
      expect(tx).toBeDefined();
      expect(tx?.amountMinor).toBe(2500);

      const allTxs = await repo.getTransactions();
      const found = allTxs.find((t) => t.id === 'tx-history-test');
      expect(found).toBeDefined();
    });

    it('preserves existing data when seedDefaults is called multiple times (migration stability)', async () => {
      const accountsCountBefore = (await repo.getAccounts()).length;
      const categoriesCountBefore = (await repo.getCategories()).length;

      // Call seedDefaults again directly
      await db.seedDefaults();

      const accountsCountAfter = (await repo.getAccounts()).length;
      const categoriesCountAfter = (await repo.getCategories()).length;

      expect(accountsCountAfter).toBe(accountsCountBefore);
      expect(categoriesCountAfter).toBe(categoriesCountBefore);
    });
  });

  describe('CSV Export & RFC 4180 Escaping', () => {
    it('properly escapes values containing commas, quotes, and newlines', () => {
      expect(escapeCsvField('Hello')).toBe('Hello');
      expect(escapeCsvField('Hello, World')).toBe('"Hello, World"');
      expect(escapeCsvField('Quote "test"')).toBe('"Quote ""test"""');
      expect(escapeCsvField('Multi\nline')).toBe('"Multi\nline"');
      expect(escapeCsvField(null)).toBe('');
      expect(escapeCsvField(undefined)).toBe('');
    });

    it('exports transaction records in CSV format with preserved fields and proper escaping', async () => {
      const acc = (await repo.getAccounts())[0];
      const cat = (await repo.getCategories()).find((c) => c.kind === 'expense')!;

      await repo.saveTransaction({
        id: 'tx-csv-1',
        kind: 'expense',
        accountId: acc.id,
        categoryId: cat.id,
        amountMinor: 1250,
        currency: acc.currency,
        occurredOn: '2026-10-10',
        note: 'Lunch with "team", special meal\nSecond line',
        createdAt: '2026-10-10T00:00:00Z',
        updatedAt: '2026-10-10T00:00:00Z',
      });

      const csv = await repo.exportTransactionsCSV();
      expect(csv).toContain('Date,Type,Account,Destination Account,Category,Amount,Currency,Note');
      expect(csv).toContain('2026-10-10,expense');
      expect(csv).toContain('"Lunch with ""team"", special meal\nSecond line"');
    });
  });

  describe('Backup Export and Atomic Safe Restore', () => {
    it('exports a full versioned backup and restores it atomically', async () => {
      const initialBackup = await repo.exportBackup();
      const parsed = JSON.parse(initialBackup);
      expect(parsed.version).toBe(1);
      expect(parsed.app).toBe('PocketFlow');
      expect(parsed.accounts.length).toBeGreaterThan(0);
      expect(parsed.categories.length).toBeGreaterThan(0);

      // Create a modified backup dataset
      const customBackup = {
        version: 1,
        exportedAt: '2026-10-10T12:00:00Z',
        app: 'PocketFlow',
        accounts: [
          {
            id: 'acc-restored-1',
            name: 'Restored Cash USD',
            type: 'cash',
            currency: 'USD',
            openingBalanceMinor: 50000,
            isArchived: false,
            createdAt: '2026-10-10T00:00:00Z',
          },
        ],
        categories: [
          {
            id: 'cat-restored-1',
            name: 'Restored Tech',
            kind: 'expense',
            icon: 'Cpu',
            sortOrder: 1,
            isArchived: false,
          },
        ],
        transactions: [
          {
            id: 'tx-restored-1',
            kind: 'expense',
            accountId: 'acc-restored-1',
            categoryId: 'cat-restored-1',
            amountMinor: 3000,
            currency: 'USD',
            occurredOn: '2026-10-10',
            note: 'Restored purchase',
            createdAt: '2026-10-10T00:00:00Z',
            updatedAt: '2026-10-10T00:00:00Z',
          },
        ],
        budgets: [
          {
            id: 'b-restored-1',
            categoryId: 'cat-restored-1',
            month: '2026-10',
            currency: 'USD',
            limitMinor: 20000,
          },
        ],
        settings: {
          preferredCurrency: 'USD',
          theme: 'dark',
          weekStartDay: 1,
          onboardingCompleted: true,
          exportVersion: 1,
        },
      };

      const result = await repo.importBackup(JSON.stringify(customBackup));
      expect(result.success).toBe(true);

      // Check that existing records were replaced cleanly with restored ones
      const accounts = await repo.getAccounts();
      expect(accounts).toHaveLength(1);
      expect(accounts[0].id).toBe('acc-restored-1');

      const transactions = await repo.getTransactions();
      expect(transactions).toHaveLength(1);
      expect(transactions[0].id).toBe('tx-restored-1');

      const budgets = await repo.getBudgets('2026-10');
      expect(budgets).toHaveLength(1);
      expect(budgets[0].id).toBe('b-restored-1');

      const settings = await repo.getSettings();
      expect(settings.preferredCurrency).toBe('USD');
      expect(settings.theme).toBe('dark');
    });

    it('rejects invalid or corrupted backups without modifying existing data', async () => {
      // First ensure known state
      const accountsBefore = await repo.getAccounts();
      const accountsCountBefore = accountsBefore.length;

      // 1. Invalid JSON string
      const invalidJsonResult = await repo.importBackup('NOT_A_VALID_JSON{');
      expect(invalidJsonResult.success).toBe(false);

      // 2. Corrupted schema (missing mandatory fields or invalid types)
      const corruptedBackup = {
        version: 1,
        app: 'PocketFlow',
        accounts: [{ id: 'corrupt-1', name: 12345 }], // name should be string
      };
      const corruptedResult = await repo.importBackup(JSON.stringify(corruptedBackup));
      expect(corruptedResult.success).toBe(false);

      // Verify that database was left unchanged!
      const accountsAfter = await repo.getAccounts();
      expect(accountsAfter.length).toBe(accountsCountBefore);
    });
  });
});

