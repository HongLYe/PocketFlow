import React, { useState } from 'react';
import type { Account, AccountType } from '../../domain/models/types';
import type { Currency } from '../../domain/money/money';
import { parseToMinor, formatMoney } from '../../domain/money/money';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Alert } from './Alert';

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

interface AccountModalFormProps {
  onClose: () => void;
  onSave: (account: Account) => Promise<void>;
  initialAccount?: Account | null;
}

const AccountModalForm: React.FC<AccountModalFormProps> = ({
  onClose,
  onSave,
  initialAccount,
}) => {
  const [name, setName] = useState(() => initialAccount?.name || '');
  const [type, setType] = useState<AccountType>(() => initialAccount?.type || 'bank');
  const [currency, setCurrency] = useState<Currency>(() => initialAccount?.currency || 'USD');
  const [openingBalanceStr, setOpeningBalanceStr] = useState(() =>
    initialAccount
      ? formatMoney(initialAccount.openingBalanceMinor, initialAccount.currency, {
          includeSymbol: false,
        })
      : '0'
  );
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Input
        label="Account Name"
        id="acc-name"
        placeholder="e.g. ABA Bank, Wing Wallet, Cash Wallet"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />

      <div className="grid-2">
        <Select
          label="Account Type"
          id="acc-type"
          value={type}
          onChange={(e) => setType(e.target.value as AccountType)}
          options={[
            { value: 'cash', label: 'Cash Wallet' },
            { value: 'bank', label: 'Bank Account' },
            { value: 'ewallet', label: 'E-Wallet' },
          ]}
        />

        <Select
          label="Currency"
          id="acc-currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Currency)}
          disabled={!!initialAccount}
          options={[
            { value: 'USD', label: 'USD ($)' },
            { value: 'KHR', label: 'Cambodian Riel (៛)' },
          ]}
          helperText={
            initialAccount ? 'Currency cannot be modified after account creation.' : undefined
          }
        />
      </div>

      <Input
        label={`Opening Balance (${currency})`}
        id="acc-opening"
        type="text"
        inputMode="decimal"
        className="tabular-nums"
        placeholder="0"
        value={openingBalanceStr}
        onChange={(e) => setOpeningBalanceStr(e.target.value)}
        required
        helperText="Starting balance before any tracked transactions occurred."
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
          {initialAccount ? 'Save Changes' : 'Create Account'}
        </Button>
      </div>
    </form>
  );
};

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAccount,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialAccount ? 'Edit Account' : 'New Account'}
      description="Accounts represent your real-world wallets, bank accounts, or e-wallets"
    >
      {isOpen && (
        <AccountModalForm
          key={initialAccount?.id || 'new-account'}
          onClose={onClose}
          onSave={onSave}
          initialAccount={initialAccount}
        />
      )}
    </Dialog>
  );
};
