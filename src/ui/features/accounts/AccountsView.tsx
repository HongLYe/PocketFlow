import React from 'react';
import { Plus, Wallet, Landmark, Smartphone, Archive } from 'lucide-react';
import type { Account, Transaction } from '../../../domain/models/types';
import { calculateAccountBalance } from '../../../domain/calculations/balances';
import { formatMoney } from '../../../domain/money/money';

interface AccountsViewProps {
  accounts: Account[];
  transactions: Transaction[];
  onOpenAccountModal: (initialAcc?: Account) => void;
  onArchiveAccount: (id: string) => Promise<void>;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  accounts,
  transactions,
  onOpenAccountModal,
  onArchiveAccount,
}) => {
  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const archivedAccounts = accounts.filter((a) => a.isArchived);

  const getAccountIcon = (type: Account['type']) => {
    switch (type) {
      case 'cash':
        return <Wallet size={18} />;
      case 'bank':
        return <Landmark size={18} />;
      case 'ewallet':
        return <Smartphone size={18} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Accounts</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Wallets, banks, and e-wallets ({activeAccounts.length} active)
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onOpenAccountModal()}>
          <Plus size={15} /> Add Account
        </button>
      </div>

      <div className="grid-2">
        {activeAccounts.map((acc) => {
          const balance = calculateAccountBalance(acc, transactions);

          return (
            <div key={acc.id} className="stat-box" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--bg-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent-brand)',
                    }}
                  >
                    {getAccountIcon(acc.type)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{acc.name}</h3>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                      {acc.type}
                    </span>
                  </div>
                </div>

                <span className={`badge ${acc.currency === 'USD' ? 'badge-usd' : 'badge-khr'}`}>
                  {acc.currency}
                </span>
              </div>

              <div>
                <span className="stat-label">Current Balance</span>
                <div className="stat-value" style={{ color: balance.currentBalanceMinor < 0 ? 'var(--expense-color)' : 'inherit' }}>
                  {formatMoney(balance.currentBalanceMinor, acc.currency)}
                </div>
                <div className="stat-sub">
                  Opening: {formatMoney(acc.openingBalanceMinor, acc.currency)}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onOpenAccountModal(acc)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  style={{ color: 'var(--text-muted)' }}
                  onClick={async () => {
                    if (window.confirm(`Archive "${acc.name}"? Historical transactions will be preserved.`)) {
                      await onArchiveAccount(acc.id);
                    }
                  }}
                  title="Archive account"
                >
                  <Archive size={14} /> Archive
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {archivedAccounts.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8 }}>
            Archived Accounts ({archivedAccounts.length})
          </h3>
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            {archivedAccounts.map((acc) => (
              <div
                key={acc.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  color: 'var(--text-muted)',
                  fontSize: '0.86rem',
                }}
              >
                <span>{acc.name} ({acc.currency})</span>
                <span className="badge">Archived</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
