import React, { useState } from 'react';
import { Plus, Wallet, Landmark, Smartphone, Archive, Trash2, Edit2, ChevronDown, ChevronUp } from 'lucide-react';
import type { Account, Transaction } from '../../domain/models/types';
import { calculateAccountBalance } from '../../domain/calculations/balances';
import { formatMoney } from '../../domain/money/money';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { Alert } from '../components/Alert';

export interface AccountsPageProps {
  accounts: Account[];
  transactions: Transaction[];
  onOpenAccountModal: (initialAcc?: Account) => void;
  onArchiveAccount: (id: string) => Promise<void>;
  onUnarchiveAccount?: (id: string) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
}

export const AccountsPage: React.FC<AccountsPageProps> = ({
  accounts,
  transactions,
  onOpenAccountModal,
  onArchiveAccount,
  onUnarchiveAccount,
  onDeleteAccount,
}) => {
  const [showArchived, setShowArchived] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const archivedAccounts = accounts.filter((a) => a.isArchived);

  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'cash':
        return <Wallet size={16} />;
      case 'bank':
        return <Landmark size={16} />;
      case 'ewallet':
        return <Smartphone size={16} />;
    }
  };

  const getTransactionCountForAccount = (id: string) => {
    return transactions.filter((t) => t.accountId === id || t.toAccountId === id).length;
  };

  const handleDelete = async (acc: Account) => {
    setActionError(null);
    const txCount = getTransactionCountForAccount(acc.id);
    if (txCount > 0) {
      setActionError(
        `Cannot delete "${acc.name}" because it has ${txCount} existing transaction(s). Archive the account instead to preserve your financial records.`
      );
      return;
    }

    if (
      window.confirm(
        `Permanently delete account "${acc.name}"? This action cannot be undone.`
      )
    ) {
      try {
        if (onDeleteAccount) {
          await onDeleteAccount(acc.id);
        }
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : 'Failed to delete account');
      }
    }
  };

  const handleArchive = async (acc: Account) => {
    setActionError(null);
    if (
      window.confirm(
        `Archive account "${acc.name}"? All transaction records will be preserved, but the account will no longer appear in transaction selectors.`
      )
    ) {
      try {
        await onArchiveAccount(acc.id);
      } catch (err: unknown) {
        setActionError(err instanceof Error ? err.message : 'Failed to archive account');
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="BALANCES & WALLETS"
        title="Accounts"
        description={`Wallets, banks, and e-wallets (${activeAccounts.length} active)`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenAccountModal()}
            leftIcon={<Plus size={14} />}
          >
            Add Account
          </Button>
        }
      />

      {actionError && (
        <Alert variant="error" onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {activeAccounts.length === 0 ? (
        <EmptyState
          icon={<Wallet size={32} />}
          title="No active accounts"
          description="Create your first bank, cash, or e-wallet account to track balances in USD or Cambodian Riel."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenAccountModal()}
              leftIcon={<Plus size={14} />}
            >
              Create First Account
            </Button>
          }
        />
      ) : (
        <div className="grid-2">
          {activeAccounts.map((acc) => {
            const balance = calculateAccountBalance(acc, transactions);
            const txCount = getTransactionCountForAccount(acc.id);

            return (
              <div
                key={acc.id}
                className="surface-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: '14px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--accent-brand)',
                      }}
                      aria-hidden="true"
                    >
                      {getAccountIcon(acc.type)}
                    </div>
                    <div>
                      <h2 style={{ fontSize: '0.94rem', fontWeight: 600 }}>{acc.name}</h2>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          color: 'var(--text-muted)',
                          textTransform: 'capitalize',
                        }}
                      >
                        {acc.type === 'ewallet' ? 'E-Wallet' : acc.type} · {txCount} tx
                      </span>
                    </div>
                  </div>

                  <Badge variant={acc.currency === 'USD' ? 'usd' : 'khr'}>
                    {acc.currency}
                  </Badge>
                </div>

                <div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Current balance</div>
                  <div
                    className="stat-value tabular-nums"
                    style={{
                      fontSize: '1.3rem',
                      color: balance.currentBalanceMinor < 0 ? 'var(--expense-color)' : 'inherit',
                    }}
                  >
                    {formatMoney(balance.currentBalanceMinor, acc.currency)}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    Opening: {formatMoney(acc.openingBalanceMinor, acc.currency)}
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 6,
                    marginTop: 'auto',
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenAccountModal(acc)}
                    leftIcon={<Edit2 size={12} />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleArchive(acc)}
                    leftIcon={<Archive size={12} />}
                  >
                    Archive
                  </Button>
                  {txCount === 0 && onDeleteAccount && (
                    <Button
                      variant="ghost"
                      size="sm"
                      style={{ color: 'var(--expense-color)' }}
                      onClick={() => handleDelete(acc)}
                      leftIcon={<Trash2 size={12} />}
                      title="Delete unused account"
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {archivedAccounts.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <button
            type="button"
            onClick={() => setShowArchived(!showArchived)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 0',
            }}
          >
            {showArchived ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {archivedAccounts.length} archived account{archivedAccounts.length > 1 ? 's' : ''}
          </button>

          {showArchived && (
            <div
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                marginTop: 6,
                overflow: 'hidden',
              }}
            >
              {archivedAccounts.map((acc) => {
                const txCount = getTransactionCountForAccount(acc.id);
                return (
                  <div
                    key={acc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '9px 14px',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.84rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{acc.name}</span>
                      <Badge variant="neutral">{acc.currency}</Badge>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                        {txCount} transactions preserved
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {onUnarchiveAccount && (
                        <Button
                          variant="secondary"
                          size="sm"
                          style={{ padding: '2px 8px', fontSize: '0.74rem' }}
                          onClick={() => onUnarchiveAccount(acc.id)}
                        >
                          Unarchive
                        </Button>
                      )}
                      {txCount === 0 && onDeleteAccount && (
                        <Button
                          variant="ghost"
                          size="sm"
                          style={{ color: 'var(--expense-color)', padding: '2px 6px' }}
                          onClick={() => handleDelete(acc)}
                          title="Delete unused account"
                        >
                          <Trash2 size={12} />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
