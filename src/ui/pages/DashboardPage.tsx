import React from 'react';
import { Plus, Receipt, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import type { Account, Category, Transaction, Budget } from '../../domain/models/types';
import { calculateFinancialSummary } from '../../domain/calculations/balances';
import { calculateBudgetProgressList } from '../../domain/calculations/budget';
import { formatMoney } from '../../domain/money/money';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { StatDisplay } from '../components/StatDisplay';
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
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  accounts,
  transactions,
  categories,
  budgets,
  currentMonth,
  onOpenTransactionModal,
}) => {
  const financialSummary = calculateFinancialSummary(accounts, transactions, currentMonth);
  const budgetProgress = calculateBudgetProgressList(budgets, categories, transactions, currentMonth);

  const budgetWarnings = budgetProgress.filter(
    (b) => b.status === 'warning' || b.status === 'exceeded'
  );

  const recentTransactions = transactions.slice(0, 5);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  const hasAnyTransactions = transactions.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description={`Financial status for ${currentMonth} · Stored locally on this device`}
        actions={
          <Button
            variant="primary"
            onClick={onOpenTransactionModal}
            leftIcon={<Plus size={16} />}
          >
            Add Transaction
          </Button>
        }
      />

      {/* Available Balance Cards: Dual-Currency Isolation */}
      <div>
        <div
          style={{
            fontSize: '0.78rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: 8,
          }}
        >
          Independent Currency Balances
        </div>
        <div className="grid-2">
          <StatDisplay
            label="Total US Dollars"
            amountMinor={financialSummary.USD.totalBalanceMinor}
            currency="USD"
            accentColor="#0284c7"
            subtext={
              <div style={{ display: 'flex', gap: 14 }}>
                <span>
                  In: <strong style={{ color: 'var(--income-color)' }}>{formatMoney(financialSummary.USD.monthlyIncomeMinor, 'USD')}</strong>
                </span>
                <span>
                  Out: <strong style={{ color: 'var(--expense-color)' }}>{formatMoney(financialSummary.USD.monthlyExpenseMinor, 'USD')}</strong>
                </span>
              </div>
            }
          />

          <StatDisplay
            label="Total Cambodian Riel"
            amountMinor={financialSummary.KHR.totalBalanceMinor}
            currency="KHR"
            accentColor="#d97706"
            subtext={
              <div style={{ display: 'flex', gap: 14 }}>
                <span>
                  In: <strong style={{ color: 'var(--income-color)' }}>{formatMoney(financialSummary.KHR.monthlyIncomeMinor, 'KHR')}</strong>
                </span>
                <span>
                  Out: <strong style={{ color: 'var(--expense-color)' }}>{formatMoney(financialSummary.KHR.monthlyExpenseMinor, 'KHR')}</strong>
                </span>
              </div>
            }
          />
        </div>
      </div>

      {/* Budget Warnings (Active Alerts Only) */}
      {budgetWarnings.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={18} color="var(--warning-color)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--warning-color)' }}>
              Budget Attention Required ({budgetWarnings.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {budgetWarnings.map((b) => (
              <div
                key={b.budget.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.86rem',
                  backgroundColor: 'var(--bg-surface)',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <div>
                  <strong>{b.category?.name || 'Category'}</strong>: {b.percentageUsed}% used (
                  {formatMoney(b.spentMinor, b.currency)} / {formatMoney(b.limitMinor, b.currency)})
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Recent Transactions</h2>
          {hasAnyTransactions && (
            <Link
              to={ROUTES.TRANSACTIONS}
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--accent-brand)',
                textDecoration: 'none',
              }}
            >
              View all ({transactions.length}) →
            </Link>
          )}
        </div>

        {!hasAnyTransactions ? (
          <EmptyState
            icon={<Receipt size={36} />}
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
          <div
            style={{
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            {recentTransactions.map((tx) => {
              const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
              const acc = accMap.get(tx.accountId);
              const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : undefined;

              return (
                <div key={tx.id} className="tx-row">
                  <div className="tx-row-left">
                    <div className={`tx-icon-badge ${tx.kind}`}>
                      {tx.kind === 'income' ? (
                        <ArrowUpRight size={18} />
                      ) : tx.kind === 'expense' ? (
                        <ArrowDownRight size={18} />
                      ) : (
                        <ArrowRightLeft size={18} />
                      )}
                    </div>
                    <div className="tx-details">
                      <div className="tx-category">
                        {tx.kind === 'transfer' ? (
                          <>Transfer: {acc?.name} → {toAcc?.name}</>
                        ) : (
                          <>
                            {cat ? (
                              <Icon
                                name={cat.icon}
                                size={14}
                                style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }}
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
