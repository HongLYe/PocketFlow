import React, { useState } from 'react';
import { Plus, Trash2, Edit2, PiggyBank } from 'lucide-react';
import type { Budget, Category, Transaction } from '../../domain/models/types';
import { calculateBudgetProgressList } from '../../domain/calculations/budget';
import type { Currency } from '../../domain/money/money';
import { formatMoney } from '../../domain/money/money';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Select } from '../components/Select';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';
import { Icon } from '../components/Icon';

export interface BudgetsPageProps {
  budgets: Budget[];
  categories: Category[];
  transactions: Transaction[];
  currentMonth: string;
  onOpenBudgetModal: (initialBudget?: Budget) => void;
  onDeleteBudget: (id: string) => Promise<void>;
  onChangeMonth: (month: string) => void;
}

export const BudgetsPage: React.FC<BudgetsPageProps> = ({
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        eyebrow="SPENDING TARGETS"
        title="Budgets"
        description={`Spending limits and progress for ${currentMonth}`}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenBudgetModal()}
            leftIcon={<Plus size={14} />}
          >
            Set Budget
          </Button>
        }
      />

      {/* Control Toolbar */}
      <div
        className="surface-card"
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '10px 14px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            htmlFor="budget-month-input"
            style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            Month:
          </label>
          <input
            id="budget-month-input"
            type="month"
            className="form-input"
            style={{ width: 'auto', padding: '5px 8px', fontSize: '0.84rem' }}
            value={currentMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label
            htmlFor="budget-currency-select"
            style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            Currency:
          </label>
          <Select
            id="budget-currency-select"
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value as Currency | 'ALL')}
            options={[
              { value: 'ALL', label: 'All Currencies' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'KHR', label: 'KHR (៛)' },
            ]}
          />
        </div>
      </div>

      {/* Budgets Grid or Honest Empty State */}
      {filteredProgress.length === 0 ? (
        <EmptyState
          icon={<PiggyBank size={32} />}
          title={`No budget limits set for ${currentMonth}`}
          description="Create monthly limits for expense categories to keep spending on track in USD or KHR."
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenBudgetModal()}
              leftIcon={<Plus size={14} />}
            >
              Set First Budget
            </Button>
          }
        />
      ) : (
        <div className="grid-2">
          {filteredProgress.map((p) => {
            return (
              <div
                key={p.budget.id}
                className="surface-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  padding: '14px 16px',
                  borderColor:
                    p.status === 'exceeded'
                      ? 'var(--expense-border)'
                      : p.status === 'warning'
                      ? 'var(--warning-border)'
                      : 'var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {p.category && <Icon name={p.category.icon} size={15} />}
                    <h2 style={{ fontSize: '0.92rem', fontWeight: 600 }}>
                      {p.category?.name || 'Category'}
                    </h2>
                  </div>
                  <Badge variant={p.currency === 'USD' ? 'usd' : 'khr'}>
                    {p.currency}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div
                  className="progress-bar-bg"
                  role="progressbar"
                  aria-valuenow={p.percentageUsed}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${p.category?.name || 'Category'} budget: ${p.percentageUsed}% used`}
                >
                  <div
                    className={`progress-bar-fill ${p.status}`}
                    style={{ width: `${Math.min(p.percentageUsed, 100)}%` }}
                  />
                </div>

                {/* Numbers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                  <span>
                    Spent: <strong className="tabular-nums">{formatMoney(p.spentMinor, p.currency)}</strong>
                  </span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Limit: <strong className="tabular-nums">{formatMoney(p.limitMinor, p.currency)}</strong>
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                  <span
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      color: p.remainingMinor < 0 ? 'var(--expense-color)' : 'var(--text-secondary)',
                    }}
                  >
                    {p.remainingMinor >= 0
                      ? `${formatMoney(p.remainingMinor, p.currency)} remaining`
                      : `${formatMoney(Math.abs(p.remainingMinor), p.currency)} over budget`}
                  </span>

                  <Badge
                    variant={
                      p.status === 'exceeded'
                        ? 'danger'
                        : p.status === 'warning'
                        ? 'warning'
                        : 'neutral'
                    }
                  >
                    {p.percentageUsed}% used
                  </Badge>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 6,
                    marginTop: 4,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenBudgetModal(p.budget)}
                    leftIcon={<Edit2 size={12} />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: 'var(--expense-color)' }}
                    onClick={async () => {
                      if (window.confirm('Delete this budget?')) {
                        await onDeleteBudget(p.budget.id);
                      }
                    }}
                    leftIcon={<Trash2 size={12} />}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
