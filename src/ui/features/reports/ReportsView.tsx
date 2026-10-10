import React, { useState, useMemo } from 'react';
import type { Category, Transaction } from '../../../domain/models/types';
import type { Currency } from '../../../domain/money/money';
import { formatMoney } from '../../../domain/money/money';
import { Icon } from '../../components/Icon';

interface ReportsViewProps {
  categories: Category[];
  transactions: Transaction[];
  currentMonth: string;
  onChangeMonth: (month: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  categories,
  transactions,
  currentMonth,
  onChangeMonth,
}) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Financial Reports</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            Cash flow and category breakdowns for {currentMonth}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 6, backgroundColor: 'var(--bg-surface)', padding: 4, borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn btn-sm ${currency === 'USD' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrency('USD')}
          >
            USD ($)
          </button>
          <button
            className={`btn btn-sm ${currency === 'KHR' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setCurrency('KHR')}
          >
            KHR (៛)
          </button>
        </div>
      </div>

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
        <label htmlFor="rep-month" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
          Reporting Month:
        </label>
        <input
          id="rep-month"
          type="month"
          className="form-input"
          style={{ width: 'auto', padding: '5px 10px' }}
          value={currentMonth}
          onChange={(e) => onChangeMonth(e.target.value)}
        />
      </div>

      <div className="grid-3">
        <div className="stat-box">
          <span className="stat-label">Total Inflow</span>
          <div className="stat-value" style={{ color: 'var(--income-color)' }}>
            {formatMoney(totalIncome, currency)}
          </div>
          <div className="stat-sub">From salary & other income</div>
        </div>

        <div className="stat-box">
          <span className="stat-label">Total Outflow</span>
          <div className="stat-value" style={{ color: 'var(--expense-color)' }}>
            {formatMoney(totalExpense, currency)}
          </div>
          <div className="stat-sub">Across all expense categories</div>
        </div>

        <div className="stat-box">
          <span className="stat-label">Net Savings</span>
          <div
            className="stat-value"
            style={{ color: netSavings >= 0 ? 'var(--income-color)' : 'var(--expense-color)' }}
          >
            {formatMoney(netSavings, currency, { showSign: true })}
          </div>
          <div className="stat-sub">
            {netSavings >= 0 ? 'Surplus for this month' : 'Deficit for this month'}
          </div>
        </div>
      </div>

      <div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 12 }}>
          Expense Breakdown by Category ({currency})
        </h2>

        {expenseByCategory.length === 0 ? (
          <div className="empty-state" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
            <p className="empty-state-text">No expenses recorded in {currency} for {currentMonth}.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
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
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', width: 34, textAlign: 'right' }}>
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
