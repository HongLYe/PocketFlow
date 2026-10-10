import { describe, it, expect } from 'vitest';
import { BackupDataSchema, TransactionSchema } from '../../src/domain/validation/schemas';

describe('PocketFlow Validation & Backup Integrity', () => {
  it('validates a correct backup structure', () => {
    const validBackup = {
      version: 1,
      exportedAt: '2026-10-10T20:00:00.000Z',
      app: 'PocketFlow',
      accounts: [
        {
          id: 'acc-1',
          name: 'Main Cash',
          type: 'cash',
          currency: 'USD',
          openingBalanceMinor: 5000,
          isArchived: false,
          createdAt: '2026-10-01T00:00:00.000Z',
        },
      ],
      categories: [
        {
          id: 'cat-1',
          name: 'Groceries',
          kind: 'expense',
          icon: 'ShoppingBag',
          sortOrder: 1,
          isArchived: false,
        },
      ],
      transactions: [
        {
          id: 'tx-1',
          kind: 'expense',
          accountId: 'acc-1',
          categoryId: 'cat-1',
          amountMinor: 2500,
          currency: 'USD',
          occurredOn: '2026-10-05',
          note: 'Market run',
          createdAt: '2026-10-05T00:00:00.000Z',
          updatedAt: '2026-10-05T00:00:00.000Z',
        },
      ],
      budgets: [
        {
          id: 'b-1',
          categoryId: 'cat-1',
          month: '2026-10',
          currency: 'USD',
          limitMinor: 20000,
        },
      ],
    };

    const parsed = BackupDataSchema.safeParse(validBackup);
    expect(parsed.success).toBe(true);
  });

  it('rejects corrupted or incomplete backup files safely', () => {
    const corruptedBackup = {
      version: 99, // Unsupported version
      app: 'RandomApp',
      accounts: [],
    };

    const parsed = BackupDataSchema.safeParse(corruptedBackup);
    expect(parsed.success).toBe(false);
  });

  it('enforces transfer rules on transactions', () => {
    // Transfer without toAccountId must fail
    const invalidTransfer = {
      id: 'tx-err',
      kind: 'transfer',
      accountId: 'acc-1',
      toAccountId: null,
      amountMinor: 1000,
      currency: 'USD',
      occurredOn: '2026-10-05',
      createdAt: '2026-10-05T00:00:00.000Z',
      updatedAt: '2026-10-05T00:00:00.000Z',
    };
    expect(TransactionSchema.safeParse(invalidTransfer).success).toBe(false);

    // Transfer with same source and destination must fail
    const selfTransfer = {
      ...invalidTransfer,
      toAccountId: 'acc-1',
    };
    expect(TransactionSchema.safeParse(selfTransfer).success).toBe(false);
  });
});
