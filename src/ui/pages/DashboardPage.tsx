import React, { useState } from 'react';
import {
  Plus,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Wallet,
  Landmark,
  Smartphone,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { Account, Category, Transaction, Budget } from '../../domain/models/types';
import { calculateFinancialSummary, calculateAccountBalance } from '../../domain/calculations/balances';
import { calculateBudgetProgressList } from '../../domain/calculations/budget';
import { formatMoney } from '../../domain/money/money';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { Link } from '../routing/router';
import { ROUTES } from '../routing/routes';
import { Icon } from '../components/Icon';

export interface DashboardPageProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  currentMonth: string;
  onOpenTransactionModal: () => void;
  onOpenAccountModal: (initialAcc?: Account) => void;
  onArchiveAccount: (id: string) => Promise<void>;
  onUnarchiveAccount?: (id: string) => Promise<void>;
  onDeleteAccount?: (id: string) => Promise<void>;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  accounts,
  transactions,
  categories,
  budgets,
  currentMonth,
  onOpenTransactionModal,
  onOpenAccountModal,
  onUnarchiveAccount,
}) => {
  const [showArchived, setShowArchived] = useState(false);

  const financialSummary = calculateFinancialSummary(accounts, transactions, currentMonth);
  const budgetProgress = calculateBudgetProgressList(budgets, categories, transactions, currentMonth);

  const budgetWarnings = budgetProgress.filter(
    (b) => b.status === 'warning' || b.status === 'exceeded'
  );

  const recentTransactions = transactions.slice(0, 5);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const activeAccounts = accounts.filter((a) => !a.isArchived);
  const archivedAccounts = accounts.filter((a) => a.isArchived);

  const hasAnyTransactions = transactions.length > 0;

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {/* Page Header */}
      <PageHeader
        eyebrow="OVERVIEW · LOCAL LEDGER"
        title="Dashboard"
        description={`Summary for ${currentMonth} (local storage)`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onOpenAccountModal()}
              leftIcon={<Plus size={14} />}
            >
              Add Account
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenTransactionModal}
              leftIcon={<Plus size={14} />}
            >
              Record Transaction
            </Button>
          </div>
        }
      />

      {/* Available Balance Cards: Dual-Currency Isolation */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Available Balances</h2>
        </div>
        <div className="grid-2">
          {/* USD Card */}
          <div className="stat-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span className="stat-label">US Dollars (USD)</span>
              <Badge variant="usd">USD</Badge>
            </div>
            <div className="stat-value">
              {formatMoney(financialSummary.USD.totalBalanceMinor, 'USD')}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginTop: 10,
                paddingTop: 8,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Income this month</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--income-color)' }}>
                  {formatMoney(financialSummary.USD.monthlyIncomeMinor, 'USD')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Spent this month</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--expense-color)' }}>
                  {formatMoney(financialSummary.USD.monthlyExpenseMinor, 'USD')}
                </div>
              </div>
            </div>
          </div>

          {/* KHR Card */}
          <div className="stat-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span className="stat-label">Cambodian Riel (KHR)</span>
              <Badge variant="khr">KHR</Badge>
            </div>
            <div className="stat-value">
              {formatMoney(financialSummary.KHR.totalBalanceMinor, 'KHR')}
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
                marginTop: 10,
                paddingTop: 8,
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Income this month</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--income-color)' }}>
                  {formatMoney(financialSummary.KHR.monthlyIncomeMinor, 'KHR')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Spent this month</div>
                <div style={{ fontSize: '0.86rem', fontWeight: 600, color: 'var(--expense-color)' }}>
                  {formatMoney(financialSummary.KHR.monthlyExpenseMinor, 'KHR')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Balances Section */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Accounts ({activeAccounts.length})</h2>
          <Link
            to={ROUTES.ACCOUNTS}
            className="btn btn-ghost btn-sm"
            style={{ fontSize: '0.8rem', padding: '3px 8px' }}
          >
            Manage accounts
          </Link>
        </div>

        {activeAccounts.length === 0 ? (
          <EmptyState
            icon={<Wallet size={32} />}
            title="No active accounts"
            description="Create your first account to record balances."
            action={
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
        ) : (
          <div className="grid-2">
            {activeAccounts.map((acc) => {
              const bal = calculateAccountBalance(acc, transactions);
              return (
                <div
                  key={acc.id}
                  className="surface-card"
                  style={{
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'var(--bg-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent-brand)',
                          flexShrink: 0,
                        }}
                      >
                        {getAccountIcon(acc.type)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: '0.88rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {acc.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                          {acc.type === 'ewallet' ? 'E-Wallet' : acc.type}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <Badge variant={acc.currency === 'USD' ? 'usd' : 'khr'}>
                        {acc.currency}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        style={{ padding: '2px 6px', height: 26 }}
                        onClick={() => onOpenAccountModal(acc)}
                        aria-label={`Edit ${acc.name}`}
                        title="Edit account"
                      >
                        <Edit2 size={12} />
                      </Button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 2 }}>
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Current balance</span>
                    <span
                      style={{
                        fontSize: '1.15rem',
                        fontWeight: 700,
                        letterSpacing: '-0.02em',
                        color: bal.currentBalanceMinor < 0 ? 'var(--expense-color)' : 'inherit',
                      }}
                      className="tabular-nums"
                    >
                      {formatMoney(bal.currentBalanceMinor, acc.currency)}
                    </span>
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
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 0',
              }}
            >
              {showArchived ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              {archivedAccounts.length} archived account{archivedAccounts.length > 1 ? 's' : ''}
            </button>

            {showArchived && (
              <div
                style={{
                  marginTop: 6,
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  overflow: 'hidden',
                }}
              >
                {archivedAccounts.map((acc) => (
                  <div
                    key={acc.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      borderBottom: '1px solid var(--border-subtle)',
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>{acc.name}</span>
                      <Badge variant="neutral">{acc.currency}</Badge>
                    </div>
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
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Budget Warnings (Active Alerts Only) */}
      {budgetWarnings.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <AlertTriangle size={16} color="var(--warning-color)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--warning-color)' }}>
              Budget Attention ({budgetWarnings.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {budgetWarnings.map((b) => (
              <div
                key={b.budget.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.82rem',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '7px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <strong>{b.category?.name || 'Category'}</strong>: {b.percentageUsed}% used (
                  {formatMoney(b.spentMinor, b.currency)} of {formatMoney(b.limitMinor, b.currency)})
                </div>
                <Badge variant={b.status === 'exceeded' ? 'danger' : 'warning'}>
                  {b.status === 'exceeded' ? 'Exceeded' : 'Near limit'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity Section */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Recent Transactions</h2>
          {hasAnyTransactions && (
            <Link
              to={ROUTES.TRANSACTIONS}
              className="btn btn-ghost btn-sm"
              style={{ fontSize: '0.8rem', padding: '3px 8px' }}
            >
              View all ({transactions.length})
            </Link>
          )}
        </div>

        {!hasAnyTransactions ? (
          <EmptyState
            icon={<Receipt size={32} />}
            title="No transactions recorded yet"
            description="PocketFlow stores your finances locally in this browser. Record your first expense or income to start tracking."
            action={
              <Button
                variant="primary"
                size="sm"
                onClick={onOpenTransactionModal}
                leftIcon={<Plus size={14} />}
              >
                Record First Transaction
              </Button>
            }
          />
        ) : (
          <div className="surface-card">
            {recentTransactions.map((tx) => {
              const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
              const acc = accMap.get(tx.accountId);
              const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : undefined;

              return (
                <div key={tx.id} className="tx-row">
                  <div className="tx-row-left">
                    <div className={`tx-icon-badge ${tx.kind}`}>
                      {tx.kind === 'income' ? (
                        <ArrowUpRight size={16} />
                      ) : tx.kind === 'expense' ? (
                        <ArrowDownRight size={16} />
                      ) : (
                        <ArrowRightLeft size={16} />
                      )}
                    </div>
                    <div className="tx-details">
                      <div className="tx-category">
                        {tx.kind === 'transfer' ? (
                          <>Transfer: {acc?.name} to {toAcc?.name}</>
                        ) : (
                          <>
                            {cat ? (
                              <Icon
                                name={cat.icon}
                                size={13}
                                style={{ display: 'inline', marginRight: 4, verticalAlign: -1 }}
                              />
                            ) : null}
                            {cat?.name || 'Uncategorized'}
                          </>
                        )}
                      </div>
                      <div className="tx-meta">
                        {tx.occurredOn} · {acc?.name} {tx.note ? `· ${tx.note}` : ''}
                      </div>
                    </div>
                  </div>

                  <div className={`tx-amount ${tx.kind}`}>
                    {tx.kind === 'income' ? '+' : tx.kind === 'expense' ? '-' : ''}
                    {formatMoney(tx.amountMinor, tx.currency, { showSign: false })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
