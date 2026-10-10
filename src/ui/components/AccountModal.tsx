import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Account, AccountType } from '../../domain/models/types';
import type { Currency } from '../../domain/money/money';
import { parseToMinor, formatMoney } from '../../domain/money/money';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Account) => Promise<void>;
  initialAccount?: Account | null;
}

function generateAccountId(): string {
  return `acc-${crypto.randomUUID ? crypto.randomUUID() : Date.now()}`;
}

function getAccountIsoNow(): string {
  return new Date().toISOString();
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAccount,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [openingBalanceStr, setOpeningBalanceStr] = useState('0');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (initialAccount) {
      setName(initialAccount.name);
      setType(initialAccount.type);
      setCurrency(initialAccount.currency);
      setOpeningBalanceStr(
        formatMoney(initialAccount.openingBalanceMinor, initialAccount.currency, {
          includeSymbol: false,
        })
      );
    } else {
      setName('');
      setType('bank');
      setCurrency('USD');
      setOpeningBalanceStr('0');
    }
    setError(null);
  }, [initialAccount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Account name is required');
      return;
    }

    let openingMinor = 0;
    try {
      openingMinor = parseToMinor(openingBalanceStr || '0', currency);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid opening balance');
      return;
    }

    const account: Account = {
      id: initialAccount ? initialAccount.id : generateAccountId(),
      name: name.trim(),
      type,
      currency,
      openingBalanceMinor: openingMinor,
      isArchived: initialAccount ? initialAccount.isArchived : false,
      createdAt: initialAccount ? initialAccount.createdAt : getAccountIsoNow(),
    };

    setSubmitting(true);
    try {
      await onSave(account);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initialAccount ? 'Edit Account' : 'New Account'}</h2>
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
            <label className="form-label" htmlFor="acc-name">
              Account Name
            </label>
            <input
              id="acc-name"
              type="text"
              className="form-input"
              placeholder="e.g. ABA Bank, Wing Wallet, Cash Wallet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="acc-type">
                Account Type
              </label>
              <select
                id="acc-type"
                className="form-select"
                value={type}
                onChange={(e) => setType(e.target.value as AccountType)}
              >
                <option value="cash">Cash Wallet</option>
                <option value="bank">Bank Account</option>
                <option value="ewallet">E-Wallet</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="acc-currency">
                Currency
              </label>
              <select
                id="acc-currency"
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                disabled={!!initialAccount}
              >
                <option value="USD">USD ($)</option>
                <option value="KHR">Cambodian Riel (៛)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="acc-opening">
              Opening Balance ({currency})
            </label>
            <input
              id="acc-opening"
              type="text"
              inputMode="decimal"
              className="form-input tabular-nums"
              placeholder="0"
              value={openingBalanceStr}
              onChange={(e) => setOpeningBalanceStr(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : initialAccount ? 'Save Changes' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
