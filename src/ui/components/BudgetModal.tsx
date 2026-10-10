import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Budget, Category } from '../../domain/models/types';
import type { Currency } from '../../domain/money/money';
import { parseToMinor, formatMoney } from '../../domain/money/money';

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (budget: Budget) => Promise<void>;
  categories: Category[];
  initialBudget?: Budget | null;
  defaultMonth: string;
}

export const BudgetModal: React.FC<BudgetModalProps> = ({
  isOpen,
  onClose,
  onSave,
  categories,
  initialBudget,
  defaultMonth,
}) => {
  const [categoryId, setCategoryId] = useState('');
  const [month, setMonth] = useState(defaultMonth);
  const [currency, setCurrency] = useState<Currency>('USD');
  const [limitStr, setLimitStr] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const expenseCategories = categories.filter((c) => c.kind === 'expense' && !c.isArchived);

  useEffect(() => {
    if (initialBudget) {
      setCategoryId(initialBudget.categoryId);
      setMonth(initialBudget.month);
      setCurrency(initialBudget.currency);
      setLimitStr(
        formatMoney(initialBudget.limitMinor, initialBudget.currency, { includeSymbol: false })
      );
    } else {
      setCategoryId(expenseCategories[0]?.id || '');
      setMonth(defaultMonth);
      setCurrency('USD');
      setLimitStr('');
    }
    setError(null);
  }, [initialBudget, isOpen, defaultMonth, expenseCategories]);

  if (!isOpen) return null;

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
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initialBudget ? 'Edit Budget' : 'Set Monthly Budget'}</h2>
          <button className="btn btn-secondary btn-sm" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--expense-bg)',
              color: 'var(--expense-color)',
              border: '1px solid var(--expense-border)',
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
              fontSize: '0.85rem',
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="bgt-category">
              Expense Category
            </label>
            <select
              id="bgt-category"
              className="form-select"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              required
            >
              {expenseCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="bgt-month">
                Month
              </label>
              <input
                id="bgt-month"
                type="month"
                className="form-input"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="bgt-currency">
                Currency
              </label>
              <select
                id="bgt-currency"
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
              >
                <option value="USD">USD ($)</option>
                <option value="KHR">Cambodian Riel (៛)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="bgt-limit">
              Spending Limit ({currency})
            </label>
            <input
              id="bgt-limit"
              type="text"
              inputMode="decimal"
              className="form-input tabular-nums"
              placeholder={currency === 'USD' ? '300.00' : '500000'}
              value={limitStr}
              onChange={(e) => setLimitStr(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : initialBudget ? 'Update Budget' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
