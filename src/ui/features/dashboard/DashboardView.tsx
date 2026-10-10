import React from 'react';
import { Plus, AlertTriangle, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import type { Account, Category, Transaction, Budget } from '../../../domain/models/types';
import { calculateFinancialSummary } from '../../../domain/calculations/balances';
import { calculateBudgetProgressList } from '../../../domain/calculations/budget';
import { formatMoney } from '../../../domain/money/money';
import { Icon } from '../../components/Icon';

interface DashboardViewProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  currentMonth: string;
  onOpenTransactionModal: () => void;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  transactions,
  categories,
  budgets,
  currentMonth,
  onOpenTransactionModal,
  onNavigate,
}) => {
  const financialSummary = calculateFinancialSummary(accounts, transactions, currentMonth);
  const budgetProgress = calculateBudgetProgressList(budgets, categories, transactions, currentMonth);

  const budgetWarnings = budgetProgress.filter(
    (b) => b.status === 'warning' || b.status === 'exceeded'
  );

  const recentTransactions = transactions.slice(0, 6);
  const catMap = new Map(categories.map((c) => [c.id, c]));
  const accMap = new Map(accounts.map((a) => [a.id, a]));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Financial Overview</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Month of {currentMonth} · Local & Offline
          </p>
        </div>
        <button className="btn btn-primary" onClick={onOpenTransactionModal}>
          <Plus size={16} /> Add Transaction
        </button>
      </div>

      <div>
        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
          Available Balance (Independent Currencies)
        </div>
        <div className="grid-2">
          <div className="stat-box" style={{ borderLeft: '4px solid #0284c7' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">Total US Dollars</span>
              <span className="badge badge-usd">USD</span>
            </div>
            <div className="stat-value">
              {formatMoney(financialSummary.USD.totalBalanceMinor, 'USD')}
            </div>
            <div className="stat-sub" style={{ display: 'flex', gap: 16 }}>
              <span>
                In: <strong style={{ color: 'var(--income-color)' }}>{formatMoney(financialSummary.USD.monthlyIncomeMinor, 'USD')}</strong>
              </span>
              <span>
                Out: <strong style={{ color: 'var(--expense-color)' }}>{formatMoney(financialSummary.USD.monthlyExpenseMinor, 'USD')}</strong>
              </span>
            </div>
          </div>

          <div className="stat-box" style={{ borderLeft: '4px solid #d97706' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="stat-label">Total Cambodian Riel</span>
              <span className="badge badge-khr">KHR</span>
            </div>
            <div className="stat-value">
              {formatMoney(financialSummary.KHR.totalBalanceMinor, 'KHR')}
            </div>
            <div className="stat-sub" style={{ display: 'flex', gap: 16 }}>
              <span>
                In: <strong style={{ color: 'var(--income-color)' }}>{formatMoney(financialSummary.KHR.monthlyIncomeMinor, 'KHR')}</strong>
              </span>
              <span>
                Out: <strong style={{ color: 'var(--expense-color)' }}>{formatMoney(financialSummary.KHR.monthlyExpenseMinor, 'KHR')}</strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {budgetWarnings.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--warning-bg)',
            border: '1px solid var(--warning-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={18} color="var(--warning-color)" />
            <h3 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--warning-color)' }}>
              Budget Attention Required ({budgetWarnings.length})
            </h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
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
                  <strong>{b.category?.name || 'Category'}</strong>: {b.percentageUsed}% of limit (
                  {formatMoney(b.spentMinor, b.currency)} / {formatMoney(b.limitMinor, b.currency)})
                </div>
                <span className={`badge ${b.status === 'exceeded' ? 'badge-danger' : 'badge-warning'}`}>
                  {b.status === 'exceeded' ? 'Exceeded' : 'Near limit'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Recent Activity</h2>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => onNavigate('transactions')}
          >
            View All ({transactions.length})
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="empty-state" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <p className="empty-state-text">No transactions recorded for this device yet.</p>
            <button className="btn btn-primary btn-sm" onClick={onOpenTransactionModal}>
              <Plus size={14} /> Record your first expense
            </button>
          </div>
        ) : (
          <div style={{ border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
                            {cat ? <Icon name={cat.icon} size={14} style={{ display: 'inline', marginRight: 4, verticalAlign: -2 }} /> : null}
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
