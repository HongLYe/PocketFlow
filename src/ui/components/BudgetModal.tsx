import React, { useState } from 'react';
import type { Budget, Category } from '../../domain/models/types';
import type { Currency } from '../../domain/money/money';
import { parseToMinor, formatMoney } from '../../domain/money/money';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Alert } from './Alert';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Budget) => Promise<void>;
  categories: Category[];
  initialBudget?: Budget | null;
  defaultMonth: string;
}

interface BudgetModalFormProps {
  onClose: () => void;
  onSave: (budget: Budget) => Promise<void>;
  categories: Category[];
  initialBudget?: Budget | null;
  defaultMonth: string;
}

const BudgetModalForm: React.FC<BudgetModalFormProps> = ({
  onClose,
  onSave,
  categories,
  initialBudget,
  defaultMonth,
}) => {
  const expenseCategories = categories.filter(
    (c) => c.kind === 'expense' && (!c.isArchived || c.id === initialBudget?.categoryId)
  );

  const [categoryId, setCategoryId] = useState(() => {
    if (initialBudget) return initialBudget.categoryId;
    return expenseCategories[0]?.id || '';
  });

  const [month, setMonth] = useState(() => initialBudget?.month || defaultMonth);
  const [currency, setCurrency] = useState<Currency>(() => initialBudget?.currency || 'USD');
  const [limitStr, setLimitStr] = useState(() =>
    initialBudget
      ? formatMoney(initialBudget.limitMinor, initialBudget.currency, { includeSymbol: false })
      : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!categoryId) {
      setError('Please select an expense category');
      return;
    }

    let limitMinor = 0;
    try {
      limitMinor = parseToMinor(limitStr, currency);
      if (limitMinor <= 0) {
        setError('Budget limit must be greater than zero');
        return;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid limit amount');
      return;
    }

    const budget: Budget = {
      id: initialBudget ? initialBudget.id : `bgt-${month}-${categoryId}-${currency}`,
      categoryId,
      month,
      currency,
      limitMinor,
    };

    setSubmitting(true);
    try {
      await onSave(budget);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Select
        label="Expense Category"
        id="bgt-category"
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        options={expenseCategories.map((cat) => ({
          value: cat.id,
          label: `${cat.name}${cat.isArchived ? ' [Archived]' : ''}`,
        }))}
        required
      />

      <div className="grid-2">
        <Input
          label="Budget Month"
          id="bgt-month"
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          required
        />

        <Select
          label="Currency"
          id="bgt-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          options={[
            { value: 'USD', label: 'USD ($)' },
            { value: 'KHR', label: 'Cambodian Riel (៛)' },
          ]}
          required
        />
      </div>

      <Input
        label={`Spending Limit (${currency})`}
        id="bgt-limit"
        type="text"
        inputMode="decimal"
        className="tabular-nums"
        placeholder={currency === 'USD' ? '300.00' : '500000'}
        value={limitStr}
        onChange={(e) => setLimitStr(e.target.value)}
        leftAddon={currency === 'USD' ? '$' : '៛'}
        autoFocus
        required
        helperText={`Maximum planned spending for this category in ${month}.`}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
          {initialBudget ? 'Update Budget' : 'Save Budget'}
        </Button>
      </div>
    </form>
  );
};

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialBudget,
  defaultMonth,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialBudget ? 'Edit Monthly Budget' : 'Set Monthly Budget'}
      description="Budgets track spending per category for a specific month and currency."
    >
      {isOpen && (
        <BudgetModalForm
          key={initialBudget?.id || 'new-budget'}
          onClose={onClose}
          onSave={onSave}
          categories={categories}
          initialBudget={initialBudget}
          defaultMonth={defaultMonth}
        />
      )}
    </Dialog>
  );
};
