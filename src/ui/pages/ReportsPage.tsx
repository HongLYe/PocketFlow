import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Filter,
  Calendar,
  Layers,
} from 'lucide-react';
import type { Account, Category, Transaction } from '../../domain/models/types';
import type { Currency } from '../../domain/money/money';
import { formatMoney } from '../../domain/money/money';
import {
  calculateMonthOverMonth,
  calculateCategoryBreakdown,
  calculateMonthlyTrend,
  filterReportTransactions,
} from '../../domain/calculations/reports';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { StatDisplay } from '../components/StatDisplay';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { Badge } from '../components/Badge';
import { Select } from '../components/Select';

export interface ReportsPageProps {
  categories: Category[];
  transactions: Transaction[];
  accounts?: Account[];
  currentMonth: string;
  onChangeMonth: (month: string) => void;
}

function getMonthEndDate(monthStr: string): string {
  const [yearStr, monthStrNum] = monthStr.split('-');
  const y = parseInt(yearStr, 10);
  const m = parseInt(monthStrNum, 10);
  const lastDay = new Date(y, m, 0).getDate();
  return `${monthStr}-${String(lastDay).padStart(2, '0')}`;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  categories,
  transactions,
  accounts = [],
  currentMonth,
  onChangeMonth,
}) => {
  const [currency, setCurrency] = useState<Currency>('USD');

  // Drilldown filters (bounded to reporting month by default)
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>(() => `${currentMonth}-01`);
  const [endDate, setEndDate] = useState<string>(() => getMonthEndDate(currentMonth));

  // Update date bounds when reporting month changes
  const handleMonthChange = (newMonth: string) => {
    onChangeMonth(newMonth);
    setStartDate(`${newMonth}-01`);
    setEndDate(getMonthEndDate(newMonth));
  };

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  // Calculations
  const mom = useMemo(
    () => calculateMonthOverMonth(transactions, categories, currentMonth, currency),
    [transactions, categories, currentMonth, currency]
  );

  const categoryBreakdown = useMemo(
    () => calculateCategoryBreakdown(transactions, categories, currentMonth, currency),
    [transactions, categories, currentMonth, currency]
  );

  const monthlyTrend = useMemo(
    () => calculateMonthlyTrend(transactions, currentMonth, currency, 6),
    [transactions, currentMonth, currency]
  );

  const maxTrendValue = useMemo(() => {
    let max = 0;
    for (const m of monthlyTrend) {
      if (m.incomeMinor > max) max = m.incomeMinor;
      if (m.expenseMinor > max) max = m.expenseMinor;
    }
    return max > 0 ? max : 1;
  }, [monthlyTrend]);

  const filteredDrilldown = useMemo(() => {
    return filterReportTransactions(transactions, {
      currency,
      accountId: filterAccount !== 'all' ? filterAccount : undefined,
      categoryId: filterCategory !== 'all' ? filterCategory : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [transactions, currency, filterAccount, filterCategory, startDate, endDate]);

  const drilldownTotal = useMemo(() => {
    return filteredDrilldown.reduce((sum, t) => {
      if (t.kind === 'income') return sum + t.amountMinor;
      if (t.kind === 'expense') return sum - t.amountMinor;
      return sum;
    }, 0);
  }, [filteredDrilldown]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        eyebrow="FINANCIAL ANALYSIS"
        title="Reports"
        description={`Cash flow and spending breakdown for ${currentMonth} (${currency})`}
        actions={
          <div
            style={{
              display: 'flex',
              gap: 4,
              backgroundColor: 'var(--bg-surface)',
              padding: 3,
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
        className="surface-card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          flexWrap: 'wrap',
        }}
      >
        <Calendar size={15} color="var(--text-muted)" />
        <label
          htmlFor="report-month-input"
          style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}
        >
          Reporting Month:
        </label>
        <input
          id="report-month-input"
          type="month"
          className="form-input"
          style={{ width: 'auto', padding: '5px 8px', fontSize: '0.84rem' }}
          value={currentMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
        />
      </div>

      {/* Monthly Cash Flow Stats */}
      <div className="grid-3">
        <StatDisplay
          label="Total Inflow"
          amountMinor={mom.currentIncomeMinor}
          currency={currency}
          trend="positive"
          subtext={
            mom.incomeChangePercent !== null ? (
              <span>
                {mom.incomeChangePercent >= 0 ? '+' : ''}
                {mom.incomeChangePercent}% vs {mom.previousMonth}
              </span>
            ) : (
              'Income this month'
            )
          }
        />

        <StatDisplay
          label="Total Outflow"
          amountMinor={mom.currentExpenseMinor}
          currency={currency}
          trend="negative"
          subtext={
            mom.expenseChangePercent !== null ? (
              <span>
                {mom.expenseChangePercent >= 0 ? '+' : ''}
                {mom.expenseChangePercent}% vs {mom.previousMonth}
              </span>
            ) : (
              'Expenses this month'
            )
          }
        />

        <StatDisplay
          label="Net Cash Flow"
          amountMinor={mom.currentIncomeMinor - mom.currentExpenseMinor}
          currency={currency}
          trend={mom.currentIncomeMinor >= mom.currentExpenseMinor ? 'positive' : 'negative'}
          showSign={true}
          subtext={
            mom.currentIncomeMinor >= mom.currentExpenseMinor
              ? 'Monthly surplus'
              : 'Monthly deficit'
          }
        />
      </div>

      {/* Month-over-Month & Top Category */}
      <div className="grid-2">
        <div
          className="surface-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {mom.expenseDiffMinor > 0 ? (
              <TrendingUp size={16} color="var(--expense-color)" />
            ) : mom.expenseDiffMinor < 0 ? (
              <TrendingDown size={16} color="var(--income-color)" />
            ) : (
              <ArrowRight size={16} color="var(--text-muted)" />
            )}
            <h3 style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              Month-over-Month Spending
            </h3>
          </div>

          <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: 2 }}>
            {mom.previousExpenseMinor === 0 && mom.currentExpenseMinor === 0 ? (
              <p>No expenses recorded in either month.</p>
            ) : mom.previousExpenseMinor === 0 ? (
              <p>
                Spent <strong>{formatMoney(mom.currentExpenseMinor, currency)}</strong> this month.
                (No expenses recorded in {mom.previousMonth}).
              </p>
            ) : (
              <p>
                Spent{' '}
                <strong>{formatMoney(mom.currentExpenseMinor, currency)}</strong> this month vs{' '}
                <strong>{formatMoney(mom.previousExpenseMinor, currency)}</strong> in {mom.previousMonth}.{' '}
                <span
                  style={{
                    fontWeight: 600,
                    color: mom.expenseDiffMinor > 0 ? 'var(--expense-color)' : 'var(--income-color)',
                  }}
                >
                  {mom.expenseDiffMinor > 0 ? 'Increase of ' : 'Decrease of '}
                  {formatMoney(Math.abs(mom.expenseDiffMinor), currency)}
                  {mom.expenseChangePercent !== null ? ` (${mom.expenseChangePercent > 0 ? '+' : ''}${mom.expenseChangePercent}%)` : ''}
                </span>.
              </p>
            )}
          </div>
        </div>

        <div
          className="surface-card"
          style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={16} color="var(--accent-brand)" />
            <h3 style={{ fontSize: '0.88rem', fontWeight: 600 }}>Top Spending Category</h3>
          </div>

          {mom.topCategory ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
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
                  flexShrink: 0,
                }}
              >
                <Icon name={mom.topCategory.icon} size={16} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.94rem' }}>
                  {mom.topCategory.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <strong className="tabular-nums" style={{ color: 'var(--text-primary)' }}>
                    {formatMoney(mom.topCategory.amountMinor, currency)}
                  </strong>{' '}
                  ({mom.topCategory.percent}% of total monthly expenses)
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              No expenses recorded yet in {currentMonth}.
            </p>
          )}
        </div>
      </div>

      {/* Spending Breakdown Table */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Spending by Category ({currency})</h2>
        </div>

        {categoryBreakdown.length === 0 ? (
          <EmptyState
            icon={<BarChart3 size={32} />}
            title={`No expenses in ${currency} for ${currentMonth}`}
            description="Category spending breakdowns will display here once transactions are recorded for this month."
          />
        ) : (
          <div className="surface-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                    <th style={{ width: 180 }}>Share of Expenses</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((item) => (
                    <tr key={item.catId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Icon name={item.icon} size={14} />
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
                          <div
                            className="progress-bar-bg"
                            style={{ flex: 1, margin: 0, height: 6 }}
                            role="progressbar"
                            aria-valuenow={item.percent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`${item.name} represents ${item.percent}% of spending`}
                          >
                            <div
                              className="progress-bar-fill normal"
                              style={{ width: `${item.percent}%`, height: '100%' }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: '0.78rem',
                              color: 'var(--text-muted)',
                              width: 34,
                              textAlign: 'right',
                            }}
                            className="tabular-nums"
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
          </div>
        )}
      </div>

      {/* Income vs Expenses Over Time */}
      <div>
        <div className="section-header">
          <h2 className="section-title">Income vs Expenses Over Time ({currency})</h2>
        </div>

        <div className="surface-card" style={{ padding: '14px 16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {monthlyTrend.map((m) => {
              const incomeWidth = Math.round((m.incomeMinor / maxTrendValue) * 100);
              const expenseWidth = Math.round((m.expenseMinor / maxTrendValue) * 100);

              return (
                <div
                  key={m.month}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 5,
                    paddingBottom: 10,
                    borderBottom: '1px solid var(--border-subtle)',
                  }}
                  aria-label={`${m.month}: Income ${formatMoney(m.incomeMinor, currency)}, Expense ${formatMoney(m.expenseMinor, currency)}, Net ${formatMoney(m.netMinor, currency, { showSign: true })}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.84rem' }}>
                      {m.month} {m.month === currentMonth ? '(Current)' : ''}
                    </span>
                    <span
                      style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: m.netMinor >= 0 ? 'var(--income-color)' : 'var(--expense-color)',
                      }}
                      className="tabular-nums"
                    >
                      Net: {formatMoney(m.netMinor, currency, { showSign: true })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {/* Inflow bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem' }}>
                      <span style={{ width: 46, color: 'var(--text-muted)' }}>Inflow</span>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${incomeWidth}%`,
                            height: '100%',
                            backgroundColor: 'var(--income-color)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />
                      </div>
                      <span style={{ width: 75, textAlign: 'right', fontWeight: 500 }} className="tabular-nums">
                        {formatMoney(m.incomeMinor, currency)}
                      </span>
                    </div>

                    {/* Outflow bar */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.76rem' }}>
                      <span style={{ width: 46, color: 'var(--text-muted)' }}>Outflow</span>
                      <div
                        style={{
                          flex: 1,
                          height: 8,
                          backgroundColor: 'var(--bg-subtle)',
                          borderRadius: 'var(--radius-sm)',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${expenseWidth}%`,
                            height: '100%',
                            backgroundColor: 'var(--expense-color)',
                            borderRadius: 'var(--radius-sm)',
                          }}
                        />
                      </div>
                      <span style={{ width: 75, textAlign: 'right', fontWeight: 500 }} className="tabular-nums">
                        {formatMoney(m.expenseMinor, currency)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Drill-down & Filter Tool */}
      <div>
        <div className="section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={15} />
            <h2 className="section-title">Transaction Drill-Down ({currency})</h2>
          </div>
          <div style={{ fontSize: '0.82rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Subtotal: </span>
            <strong className="tabular-nums">
              {formatMoney(drilldownTotal, currency, { showSign: true })}
            </strong>
          </div>
        </div>

        <div
          className="surface-card"
          style={{
            padding: '10px 14px',
            marginBottom: 10,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div style={{ minWidth: 140, flex: '1 1 140px' }}>
            <Select
              value={filterAccount}
              onChange={(e) => setFilterAccount(e.target.value)}
              options={[
                { value: 'all', label: 'All accounts' },
                ...accounts.map((a) => ({
                  value: a.id,
                  label: `${a.name} (${a.currency})`,
                })),
              ]}
            />
          </div>

          <div style={{ minWidth: 140, flex: '1 1 140px' }}>
            <Select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              options={[
                { value: 'all', label: 'All categories' },
                ...categories.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.kind})`,
                })),
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label htmlFor="drilldown-start-date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>From</label>
            <input
              id="drilldown-start-date"
              type="date"
              className="form-input"
              style={{ padding: '5px 8px', fontSize: '0.8rem', width: 130 }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              aria-label="Drilldown start date"
            />
            <label htmlFor="drilldown-end-date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>To</label>
            <input
              id="drilldown-end-date"
              type="date"
              className="form-input"
              style={{ padding: '5px 8px', fontSize: '0.8rem', width: 130 }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              aria-label="Drilldown end date"
            />
          </div>
        </div>

        {filteredDrilldown.length === 0 ? (
          <EmptyState
            icon={<Filter size={30} />}
            title="No matching transactions"
            description="Adjust the filter criteria above to examine different transactions."
          />
        ) : (
          <div className="surface-card">
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 100 }}>Date</th>
                    <th>Category / Note</th>
                    <th>Account</th>
                    <th style={{ textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDrilldown.map((tx) => {
                    const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
                    const acc = accMap.get(tx.accountId);
                    const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : undefined;

                    return (
                      <tr key={tx.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                          {tx.occurredOn}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                            {tx.kind === 'transfer'
                              ? `Transfer to ${toAcc?.name || 'Account'}`
                              : cat?.name || 'Uncategorized'}
                          </div>
                          {tx.note && (
                            <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              {tx.note}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                          <span style={{ marginRight: 6 }}>{acc?.name}</span>
                          <Badge variant={tx.currency === 'USD' ? 'usd' : 'khr'}>
                            {tx.currency}
                          </Badge>
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: 600, whiteSpace: 'nowrap' }}>
                          <span className={`tabular-nums tx-amount ${tx.kind}`}>
                            {tx.kind === 'income' ? '+' : tx.kind === 'expense' ? '-' : ''}
                            {formatMoney(tx.amountMinor, tx.currency, { showSign: false })}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
