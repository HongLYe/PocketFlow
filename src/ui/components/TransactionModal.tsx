import React, { useState } from 'react';
import type { Account, Category, Transaction, TransactionKind } from '../../domain/models/types';
import type { Currency } from '../../domain/money/money';
import { parseToMinor, formatMoney, getLocalDateString } from '../../domain/money/money';
import { Dialog } from './Dialog';
import { Button } from './Button';
import { Input } from './Input';
import { Select } from './Select';
import { Alert } from './Alert';

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

interface TransactionModalFormProps {
  onClose: () => void;
  onSave: (tx: Transaction) => Promise<void>;
  accounts: Account[];
  categories: Category[];
  initialTransaction?: Transaction | null;
}

const TransactionModalForm: React.FC<TransactionModalFormProps> = ({
  onClose,
  onSave,
  accounts,
  categories,
  initialTransaction,
}) => {
  const [kind, setKind] = useState<TransactionKind>(() => initialTransaction?.kind || 'expense');
  const [amountStr, setAmountStr] = useState(() =>
    initialTransaction
      ? formatMoney(initialTransaction.amountMinor, initialTransaction.currency, {
          includeSymbol: false,
        })
      : ''
  );

  const activeAccounts = accounts.filter(
    (a) => !a.isArchived || a.id === initialTransaction?.accountId || a.id === initialTransaction?.toAccountId
  );

  const [accountId, setAccountId] = useState(() => {
    if (initialTransaction) return initialTransaction.accountId;
    return activeAccounts[0]?.id || accounts[0]?.id || '';
  });

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currency: Currency = selectedAccount ? selectedAccount.currency : 'USD';

  const [toAccountId, setToAccountId] = useState(() => initialTransaction?.toAccountId || '');

  const [categoryId, setCategoryId] = useState(() => {
    if (initialTransaction?.categoryId) return initialTransaction.categoryId;
    const initialKind = initialTransaction?.kind || 'expense';
    const matchCat = categories.find((c) => c.kind === initialKind && !c.isArchived);
    return matchCat?.id || '';
  });

  const [occurredOn, setOccurredOn] = useState(() => initialTransaction?.occurredOn || getLocalDateString());
  const [note, setNote] = useState(() => initialTransaction?.note || '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const transferEligibleAccounts = activeAccounts.filter(
    (a) => a.id !== accountId && a.currency === currency
  );

  const availableCategories = categories.filter(
    (c) => c.kind === kind && (!c.isArchived || c.id === initialTransaction?.categoryId)
  );

  const handleKindChange = (newKind: TransactionKind) => {
    setKind(newKind);
    setError(null);
    if (newKind !== 'transfer') {
      setToAccountId('');
      const matchCat = categories.find((c) => c.kind === newKind && !c.isArchived);
      setCategoryId(matchCat ? matchCat.id : '');
    } else {
      setCategoryId('');
      if (transferEligibleAccounts.length > 0) {
        setToAccountId(transferEligibleAccounts[0].id);
      }
    }
  };

  const handleAccountChange = (newAccId: string) => {
    setAccountId(newAccId);
    setToAccountId('');
  };

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
    <form onSubmit={handleSubmit}>
      {error && (
        <Alert variant="error" className="mb-4" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Kind Selector Pills */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          backgroundColor: 'var(--bg-subtle)',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
        }}
        role="group"
        aria-label="Transaction type"
      >
        {(['expense', 'income', 'transfer'] as TransactionKind[]).map((k) => (
          <Button
            key={k}
            type="button"
            variant={kind === k ? 'primary' : 'ghost'}
            size="sm"
            style={{ flex: 1, textTransform: 'capitalize' }}
            onClick={() => handleKindChange(k)}
          >
            {k}
          </Button>
        ))}
      </div>

      <Input
        label={`Amount (${currency})`}
        id="tx-amount"
        type="text"
        inputMode="decimal"
        className="tabular-nums"
        placeholder={currency === 'USD' ? '0.00' : '0'}
        value={amountStr}
        onChange={(e) => setAmountStr(e.target.value)}
        leftAddon={currency === 'USD' ? '$' : '៛'}
        autoFocus
        required
      />

      <div className="grid-2">
        <Select
          label={kind === 'transfer' ? 'From Account' : 'Account'}
          id="tx-account"
          value={accountId}
          onChange={(e) => handleAccountChange(e.target.value)}
          options={activeAccounts.map((acc) => ({
            value: acc.id,
            label: `${acc.name} (${acc.currency})${acc.isArchived ? ' [Archived]' : ''}`,
          }))}
          required
        />

        {kind === 'transfer' ? (
          <Select
            label={`To Account (${currency})`}
            id="tx-to-account"
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            options={[
              { value: '', label: 'Select destination account...' },
              ...transferEligibleAccounts.map((acc) => ({
                value: acc.id,
                label: `${acc.name} (${acc.currency})${acc.isArchived ? ' [Archived]' : ''}`,
              })),
            ]}
            helperText={
              transferEligibleAccounts.length === 0
                ? `No other ${currency} accounts available for transfer.`
                : undefined
            }
            required
          />
        ) : (
          <Select
            label="Category"
            id="tx-category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            options={availableCategories.map((cat) => ({
              value: cat.id,
              label: `${cat.name}${cat.isArchived ? ' [Archived]' : ''}`,
            }))}
            required
          />
        )}
      </div>

      <div className="grid-2">
        <Input
          label="Date"
          id="tx-date"
          type="date"
          value={occurredOn}
          onChange={(e) => setOccurredOn(e.target.value)}
          required
        />

        <Input
          label="Note (Optional)"
          id="tx-note"
          type="text"
          placeholder="e.g. Lunch with team, electricity bill"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 18 }}>
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="sm" isLoading={submitting}>
          {initialTransaction ? 'Update Transaction' : 'Save Transaction'}
        </Button>
      </div>
    </form>
  );
};

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accounts,
  categories,
  initialTransaction,
}) => {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
      description="Financial transactions are strictly recorded in the selected account's currency."
    >
      {isOpen && (
        <TransactionModalForm
          key={initialTransaction?.id || 'new-tx'}
          onClose={onClose}
          onSave={onSave}
          accounts={accounts}
          categories={categories}
          initialTransaction={initialTransaction}
        />
      )}
    </Dialog>
  );
};
