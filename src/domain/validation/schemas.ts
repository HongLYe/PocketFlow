/**
 * PocketFlow Validation Schemas using Zod
 */
import { z } from 'zod';

export const CurrencySchema = z.enum(['USD', 'KHR']);

export const AccountTypeSchema = z.enum(['cash', 'bank', 'ewallet']);

export const AccountSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Account name is required'),
  type: AccountTypeSchema,
  currency: CurrencySchema,
  openingBalanceMinor: z.number().int().nonnegative('Opening balance cannot be negative'),
  isArchived: z.boolean(),
  createdAt: z.string().datetime().or(z.string().min(10)),
});

export const CategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, 'Category name is required'),
  kind: z.enum(['income', 'expense']),
  icon: z.string().min(1),
  color: z.string().optional(),
  sortOrder: z.number().int(),
  isArchived: z.boolean(),
});

export const TransactionSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['income', 'expense', 'transfer']),
  accountId: z.string().min(1, 'Account is required'),
  toAccountId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  amountMinor: z.number().int().positive('Amount must be greater than zero'),
  currency: CurrencySchema,
  occurredOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  note: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
}).refine(
  (data) => {
    if (data.kind === 'transfer') {
      return !!data.toAccountId && data.toAccountId !== data.accountId;
    }
    return true;
  },
  {
    message: 'Transfers require a distinct destination account',
    path: ['toAccountId'],
  }
).refine(
  (data) => {
    if (data.kind !== 'transfer') {
      return !!data.categoryId;
    }
    return true;
  },
  {
    message: 'Income and Expense transactions require a category',
    path: ['categoryId'],
  }
);

export const BudgetSchema = z.object({
  id: z.string().min(1),
  categoryId: z.string().min(1, 'Category is required'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be YYYY-MM'),
  currency: CurrencySchema,
  limitMinor: z.number().int().positive('Budget limit must be greater than zero'),
});

export const AppSettingsSchema = z.object({
  preferredCurrency: z.enum(['USD', 'KHR', 'ALL']),
  theme: z.enum(['light', 'dark', 'system']),
  weekStartDay: z.union([z.literal(0), z.literal(1)]),
  onboardingCompleted: z.boolean(),
  exportVersion: z.number().int(),
});

/**
 * Backup / Export Schema
 */
export const BackupDataSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string(),
  app: z.literal('PocketFlow'),
  accounts: z.array(AccountSchema),
  categories: z.array(CategorySchema),
  transactions: z.array(TransactionSchema),
  budgets: z.array(BudgetSchema),
  settings: AppSettingsSchema.optional(),
});

export type BackupData = z.infer<typeof BackupDataSchema>;
