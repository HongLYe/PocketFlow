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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Budgets"
        description={`Spending limits and progress for ${currentMonth}`}
        actions={
          <Button
            variant="primary"
            onClick={() => onOpenBudgetModal()}
            leftIcon={<Plus size={15} />}
          >
            Set Budget
          </Button>
        }
      />

      {/* Control Toolbar */}
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
          <label
            htmlFor="budget-month-input"
            style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            Month:
          </label>
          <input
            id="budget-month-input"
            type="month"
            className="form-input"
            style={{ width: 'auto', padding: '5px 10px' }}
            value={currentMonth}
            onChange={(e) => onChangeMonth(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <label
            htmlFor="budget-currency-select"
            style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}
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
          icon={<PiggyBank size={36} />}
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
                className="stat-box"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
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
                    {p.category && <Icon name={p.category.icon} size={16} />}
                    <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>
                      {p.category?.name || 'Category'}
                    </h3>
                  </div>
                  <Badge variant={p.currency === 'USD' ? 'usd' : 'khr'}>
                    {p.currency}
                  </Badge>
                </div>

                {/* Progress bar */}
                <div className="progress-bar-bg">
                  <div
                    className={`progress-bar-fill ${p.status}`}
                    style={{ width: `${Math.min(p.percentageUsed, 100)}%` }}
                  />
                </div>

                {/* Numbers */}
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
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid var(--border-subtle)',
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onOpenBudgetModal(p.budget)}
                    leftIcon={<Edit2 size={13} />}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    style={{ color: 'var(--expense-color)' }}
                    onClick={async () => {
                      if (window.confirm('Delete this budget?')) {
                        await onDeleteBudget(p.budget.id);
                      }
                    }}
                    leftIcon={<Trash2 size={13} />}
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
