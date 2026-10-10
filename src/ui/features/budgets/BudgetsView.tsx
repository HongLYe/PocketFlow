import React, { useState } from 'react';
import { Plus, Trash2, Edit2, AlertCircle } from 'lucide-react';
import type { Budget, Category, Transaction } from '../../../domain/models/types';
import { calculateBudgetProgressList } from '../../../domain/calculations/budget';
import type { Currency } from '../../../domain/money/money';
import { formatMoney } from '../../../domain/money/money';
import { Icon } from '../../components/Icon';

interface BudgetsViewProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  currentMonth: string;
  onOpenBudgetModal: (initialBudget?: Budget) => void;
  onDeleteBudget: (id: string) => Promise<void>;
  onChangeMonth: (month: string) => void;
}

export const BudgetsView: React.FC<BudgetsViewProps> = ({
  budgets,
  categories,
  transactions,
  currentMonth,
  onOpenBudgetModal,
  onDeleteBudget,
  onChangeMonth,
}) => {
  const [filterCurrency, setFilterCurrency] = useState<Currency | 'ALL'>('ALL');

  const allProgress = calculateBudgetProgressList(budgets, categories, transactions, currentMonth);
  const filteredProgress = allProgress.filter(
    (p) => filterCurrency === 'ALL' || p.currency === filterCurrency
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Monthly Budgets</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Category limits for {currentMonth}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => onOpenBudgetModal()}>
          <Plus size={15} /> Set Budget
        </button>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-surface)',
          padding: 12,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label htmlFor="bgt-month-select" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Month:
          </label>
          <input
            id="bgt-month-select"
            type="month"
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px' }}
            value={currentMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <label htmlFor="bgt-currency-select" style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Currency:
          </label>
          <select
            id="bgt-currency-select"
            className="form-select"
            style={{ width: 'auto', padding: '5px 10px' }}
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value as Currency | 'ALL')}
          >
            <option value="ALL">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="KHR">KHR (៛)</option>
          </select>
        </div>
      </div>

      {filteredProgress.length === 0 ? (
        <div className="empty-state" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <AlertCircle className="empty-state-icon" />
          <p className="empty-state-text">No budgets defined for {currentMonth}.</p>
          <button className="btn btn-primary btn-sm" onClick={() => onOpenBudgetModal()}>
            <Plus size={14} /> Add budget limit
          </button>
        </div>
      ) : (
        <div className="grid-2">
          {filteredProgress.map((p) => {
            return (
              <div
                key={p.budget.id}
                className="stat-box"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  borderColor: p.status === 'exceeded' ? 'var(--expense-border)' : 'var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.category && <Icon name={p.category.icon} size={16} />}
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                      {p.category?.name || 'Category'}
                    </h3>
                  </div>
                  <span className={`badge ${p.currency === 'USD' ? 'badge-usd' : 'badge-khr'}`}>
                    {p.currency}
                  </span>
                </div>

                <div className="progress-bar-bg">
                  <div
                    className={`progress-bar-fill ${p.status}`}
                    style={{ width: `${Math.min(p.percentageUsed, 100)}%` }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                  <span>
                    Spent: <strong className="tabular-nums">{formatMoney(p.spentMinor, p.currency)}</strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Limit: <strong className="tabular-nums">{formatMoney(p.limitMinor, p.currency)}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <span
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: p.remainingMinor < 0 ? 'var(--expense-color)' : 'var(--text-secondary)',
                    }}
                  >
                    {p.remainingMinor >= 0
                      ? `${formatMoney(p.remainingMinor, p.currency)} remaining`
                      : `${formatMoney(Math.abs(p.remainingMinor), p.currency)} over budget`}
                  </span>

                  <span
                    className={`badge ${
                      p.status === 'exceeded'
                        ? 'badge-danger'
                        : p.status === 'warning'
                        ? 'badge-warning'
                        : ''
                    }`}
                  >
                    {p.percentageUsed}% used
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 8, paddingTop: 8, borderTop: '1px solid var(--border-subtle)' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => onOpenBudgetModal(p.budget)}
                  >
                    <Edit2 size={13} /> Edit
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    style={{ color: 'var(--expense-color)' }}
                    onClick={async () => {
                      if (window.confirm('Delete this budget?')) {
                        await onDeleteBudget(p.budget.id);
                      }
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
