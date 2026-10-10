import React, { useState, useMemo } from 'react';
import { BarChart3 } from 'lucide-react';
import type { Category, Transaction } from '../../domain/models/types';
import type { Currency } from '../../domain/money/money';
import { formatMoney } from '../../domain/money/money';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { StatDisplay } from '../components/StatDisplay';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';

export interface ReportsPageProps {
  categories: Category[];
  transactions: Transaction[];
  currentMonth: string;
  onChangeMonth: (month: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  categories,
  transactions,
  currentMonth,
  onChangeMonth,
}) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  // Filter transactions for this month and currency (excluding transfers)
  const monthTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.occurredOn.startsWith(currentMonth) && t.currency === currency && t.kind !== 'transfer'
    );
  }, [transactions, currentMonth, currency]);

  const totalIncome = useMemo(
    () => monthTransactions.filter((t) => t.kind === 'income').reduce((s, t) => s + t.amountMinor, 0),
    [monthTransactions]
  );

  const totalExpense = useMemo(
    () => monthTransactions.filter((t) => t.kind === 'expense').reduce((s, t) => s + t.amountMinor, 0),
    [monthTransactions]
  );

  const netSavings = totalIncome - totalExpense;

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of monthTransactions) {
      if (t.kind === 'expense' && t.categoryId) {
        map.set(t.categoryId, (map.get(t.categoryId) || 0) + t.amountMinor);
      }
    }

    return Array.from(map.entries())
      .map(([catId, amountMinor]) => {
        const cat = catMap.get(catId);
        const percent = totalExpense > 0 ? Math.round((amountMinor / totalExpense) * 100) : 0;
        return {
          catId,
          name: cat?.name || 'Uncategorized',
          icon: cat?.icon || 'HelpCircle',
          amountMinor,
          percent,
        };
      })
      .sort((a, b) => b.amountMinor - a.amountMinor);
  }, [monthTransactions, totalExpense, catMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <PageHeader
        title="Reports"
        description={`Cash flow analytics and category breakdown for ${currentMonth}`}
        actions={
          <div
            style={{
              display: 'flex',
              gap: 4,
              backgroundColor: 'var(--bg-surface)',
              padding: 4,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Button
              variant={currency === 'USD' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCurrency('USD')}
            >
              USD ($)
            </Button>
            <Button
              variant={currency === 'KHR' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setCurrency('KHR')}
            >
              KHR (៛)
            </Button>
          </div>
        }
      />

      {/* Month Control */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          backgroundColor: 'var(--bg-surface)',
          padding: 12,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <label
          htmlFor="report-month-input"
          style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-secondary)' }}
        >
          Reporting Month:
        </label>
        <input
          id="report-month-input"
          type="month"
          className="form-input"
          style={{ width: 'auto', padding: '5px 10px' }}
          value={currentMonth}
          onChange={(e) => onChangeMonth(e.target.value)}
        />
      </div>

      {/* Monthly Cash Flow Stats */}
      <div className="grid-3">
        <StatDisplay
          label="Total Inflow"
          amountMinor={totalIncome}
          currency={currency}
          trend="positive"
          subtext="Salary, investments & other income"
        />

        <StatDisplay
          label="Total Outflow"
          amountMinor={totalExpense}
          currency={currency}
          trend="negative"
          subtext="All expenses for this month"
        />

        <StatDisplay
          label="Net Cash Flow"
          amountMinor={netSavings}
          currency={currency}
          trend={netSavings >= 0 ? 'positive' : 'negative'}
          showSign={true}
          subtext={netSavings >= 0 ? 'Surplus for this month' : 'Deficit for this month'}
        />
      </div>

      {/* Spending Breakdown Table */}
      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12 }}>
          Expense Breakdown by Category ({currency})
        </h2>

        {expenseByCategory.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={36} />}
            title={`No expenses in ${currency} for ${currentMonth}`}
            description="Category spending breakdowns will display here once transactions are recorded for this month."
          />
        ) : (
          <div
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden',
            }}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ width: 140 }}>Share of Spending</th>
                </tr>
              </thead>
              <tbody>
                {expenseByCategory.map((item) => (
                  <tr key={item.catId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Icon name={item.icon} size={15} />
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>
                      <span className="tabular-nums">
                        {formatMoney(item.amountMinor, currency)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="progress-bar-bg" style={{ flex: 1, margin: 0 }}>
                          <div
                            className="progress-bar-fill normal"
                            style={{ width: `${item.percent}%` }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '0.8rem',
                            color: 'var(--text-muted)',
                            width: 34,
                            textAlign: 'right',
                          }}
                        >
                          {item.percent}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
