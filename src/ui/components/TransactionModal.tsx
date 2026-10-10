import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Account, Category, Transaction, TransactionKind } from '../../domain/models/types';
import type { Currency } from '../../domain/money/money';
import { parseToMinor, formatMoney } from '../../domain/money/money';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (tx: Transaction) => Promise<void>;
  accounts: Account[];
  categories: Category[];
  initialTransaction?: Transaction | null;
}

function generateTxId(): string {
  return `tx-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
}

function getIsoTimestamp(): string {
  return new Date().toISOString();
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  categories,
  initialTransaction,
}) => {
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [amountStr, setAmountStr] = useState('');
  const [accountId, setAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [occurredOn, setOccurredOn] = useState(() => new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const selectedAccount = activeAccounts.find((a) => a.id === accountId);
  const currency: Currency = selectedAccount ? selectedAccount.currency : 'USD';

  const transferEligibleAccounts = activeAccounts.filter(
    (a) => a.id !== accountId && a.currency === currency
  );

  useEffect(() => {
    if (!isOpen) return;

    if (initialTransaction) {
      setKind(initialTransaction.kind);
      setAmountStr(
        formatMoney(initialTransaction.amountMinor, initialTransaction.currency, {
          includeSymbol: false,
        })
      );
      setAccountId(initialTransaction.accountId);
      setToAccountId(initialTransaction.toAccountId || '');
      setCategoryId(initialTransaction.categoryId || '');
      setOccurredOn(initialTransaction.occurredOn);
      setNote(initialTransaction.note || '');
    } else {
      setKind('expense');
      setAmountStr('');
      setAccountId(activeAccounts[0]?.id || '');
      setToAccountId('');
      setOccurredOn(new Date().toISOString().split('T')[0]);
      setNote('');
      const firstExpenseCat = categories.find((c) => c.kind === 'expense');
      setCategoryId(firstExpenseCat?.id || '');
    }
    setError(null);
  }, [initialTransaction, isOpen, activeAccounts, categories]);

  const handleKindChange = (newKind: TransactionKind) => {
    setKind(newKind);
    if (newKind !== 'transfer') {
      const matchCat = categories.find((c) => c.kind === newKind);
      if (matchCat) setCategoryId(matchCat.id);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountId) {
      setError('Please select an account');
      return;
    }

    let minorAmount = 0;
    try {
      minorAmount = parseToMinor(amountStr, currency);
      if (minorAmount <= 0) {
        setError('Amount must be greater than zero');
        return;
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid amount');
      return;
    }

    if (kind === 'transfer') {
      if (!toAccountId) {
        setError('Please select a destination account for the transfer');
        return;
      }
      if (accountId === toAccountId) {
        setError('Destination account must be different from source account');
        return;
      }
    } else {
      if (!categoryId) {
        setError('Please select a category');
        return;
      }
    }

    const tx: Transaction = {
      id: initialTransaction ? initialTransaction.id : generateTxId(),
      kind,
      accountId,
      toAccountId: kind === 'transfer' ? toAccountId : null,
      categoryId: kind !== 'transfer' ? categoryId : null,
      amountMinor: minorAmount,
      currency,
      occurredOn,
      note: note.trim() || undefined,
      createdAt: initialTransaction ? initialTransaction.createdAt : getIsoTimestamp(),
      updatedAt: getIsoTimestamp(),
    };

    setSubmitting(true);
    try {
      await onSave(tx);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
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
          <div
            style={{
              display: 'flex',
              gap: 4,
              backgroundColor: 'var(--bg-subtle)',
              padding: 4,
              borderRadius: 'var(--radius-md)',
              marginBottom: 16,
            }}
          >
            {(['expense', 'income', 'transfer'] as TransactionKind[]).map((k) => (
              <button
                key={k}
                type="button"
                className={`btn btn-sm ${kind === k ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, textTransform: 'capitalize' }}
                onClick={() => handleKindChange(k)}
              >
                {k}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tx-amount">
              Amount ({currency})
            </label>
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                }}
              >
                {currency === 'USD' ? '$' : '៛'}
              </span>
              <input
                id="tx-amount"
                type="text"
                inputMode="decimal"
                className="form-input tabular-nums"
                style={{ paddingLeft: 28, fontSize: '1.15rem', fontWeight: 600, width: '100%' }}
                placeholder={currency === 'USD' ? '0.00' : '0'}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tx-account">
              {kind === 'transfer' ? 'From Account' : 'Account'}
            </label>
            <select
              id="tx-account"
              className="form-select"
              value={accountId}
              onChange={(e) => {
                setAccountId(e.target.value);
                setToAccountId('');
              }}
              required
            >
              {activeAccounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.currency})
                </option>
              ))}
            </select>
          </div>

          {kind === 'transfer' && (
            <div className="form-group">
              <label className="form-label" htmlFor="tx-to-account">
                To Account ({currency})
              </label>
              <select
                id="tx-to-account"
                className="form-select"
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                required
              >
                <option value="">Select destination account...</option>
                {transferEligibleAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            </div>
          )}

          {kind !== 'transfer' && (
            <div className="form-group">
              <label className="form-label" htmlFor="tx-category">
                Category
              </label>
              <select
                id="tx-category"
                className="form-select"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                {categories
                  .filter((c) => c.kind === kind && !c.isArchived)
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="tx-date">
              Date
            </label>
            <input
              id="tx-date"
              type="date"
              className="form-input"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="tx-note">
              Note (Optional)
            </label>
            <input
              id="tx-note"
              type="text"
              className="form-input"
              placeholder="e.g. Lunch with team, monthly electric bill"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : initialTransaction ? 'Update' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
