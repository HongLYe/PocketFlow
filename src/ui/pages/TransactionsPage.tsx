import React, { useState, useMemo } from 'react';
import {
  Plus,
  Download,
  Trash2,
  Edit2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRightLeft,
  Receipt,
  Filter,
  X,
} from 'lucide-react';
import type { Account, Category, Transaction } from '../../domain/models/types';
import { formatMoney } from '../../domain/money/money';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Select } from '../components/Select';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/Badge';

export interface TransactionsPageProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onOpenTransactionModal: (initialTx?: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onExportCSV: () => Promise<void>;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  transactions,
  accounts,
  categories,
  onOpenTransactionModal,
  onDeleteTransaction,
  onExportCSV,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKind, setFilterKind] = useState<string>('all');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterCurrency, setFilterCurrency] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const hasAdvancedFilters =
    filterAccount !== 'all' ||
    filterCategory !== 'all' ||
    !!startDate ||
    !!endDate;

  const hasAnyFilters =
    hasAdvancedFilters ||
    filterKind !== 'all' ||
    filterCurrency !== 'all' ||
    !!searchQuery.trim();

  const handleClearFilters = () => {
    setFilterKind('all');
    setFilterAccount('all');
    setFilterCategory('all');
    setFilterCurrency('all');
    setStartDate('');
    setEndDate('');
    setSearchQuery('');
  };

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterKind !== 'all' && tx.kind !== filterKind) return false;
      if (filterAccount !== 'all' && tx.accountId !== filterAccount && tx.toAccountId !== filterAccount) return false;
      if (filterCategory !== 'all' && tx.categoryId !== filterCategory) return false;
      if (filterCurrency !== 'all' && tx.currency !== filterCurrency) return false;
      if (startDate && tx.occurredOn < startDate) return false;
      if (endDate && tx.occurredOn > endDate) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = tx.categoryId ? catMap.get(tx.categoryId)?.name.toLowerCase() : '';
        const acc = accMap.get(tx.accountId)?.name.toLowerCase() || '';
        const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId)?.name.toLowerCase() || '' : '';
        const note = (tx.note || '').toLowerCase();
        const dateStr = tx.occurredOn;
        if (
          !cat?.includes(q) &&
          !acc.includes(q) &&
          !toAcc.includes(q) &&
          !note.includes(q) &&
          !dateStr.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filterKind, filterAccount, filterCategory, filterCurrency, startDate, endDate, searchQuery, catMap, accMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <PageHeader
        eyebrow="LEDGER & HISTORY"
        title="Transactions"
        description={`Showing ${filtered.length} of ${transactions.length} records`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={onExportCSV}
              leftIcon={<Download size={14} />}
              title="Download CSV export"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onOpenTransactionModal()}
              leftIcon={<Plus size={14} />}
            >
              Add Transaction
            </Button>
          </div>
        }
      />

      {/* Filter Toolbar */}
      <div
        className="surface-card"
        style={{
          padding: '12px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        {/* Primary Filter Row */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <Input
              placeholder="Search note, category, account..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftAddon={<Search size={14} />}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ width: 'auto', minWidth: 120 }}>
            <Select
              value={filterKind}
              onChange={(e) => setFilterKind(e.target.value)}
              options={[
                { value: 'all', label: 'All types' },
                { value: 'expense', label: 'Expenses' },
                { value: 'income', label: 'Income' },
                { value: 'transfer', label: 'Transfers' },
              ]}
            />
          </div>

          <div style={{ width: 'auto', minWidth: 110 }}>
            <Select
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
              options={[
                { value: 'all', label: 'All currencies' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'KHR', label: 'KHR (៛)' },
              ]}
            />
          </div>

          <Button
            variant={hasAdvancedFilters ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            leftIcon={<Filter size={13} />}
          >
            {showAdvancedFilters ? 'Hide filters' : 'Filters'}
            {hasAdvancedFilters && ' (active)'}
          </Button>

          {hasAnyFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              leftIcon={<X size={13} />}
              style={{ color: 'var(--text-muted)' }}
            >
              Reset
            </Button>
          )}
        </div>

        {/* Secondary / Advanced Filter Drawer */}
        {showAdvancedFilters && (
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              flexWrap: 'wrap',
              paddingTop: 10,
              borderTop: '1px solid var(--border-subtle)',
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
                    label: `${a.name} (${a.currency})${a.isArchived ? ' [Archived]' : ''}`,
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
                    label: `${c.name} (${c.kind})${c.isArchived ? ' [Archived]' : ''}`,
                  })),
                ]}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <label htmlFor="tx-filter-start-date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>From</label>
              <input
                id="tx-filter-start-date"
                type="date"
                className="form-input"
                style={{ padding: '5px 8px', fontSize: '0.8rem', width: 130 }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Start date"
                aria-label="Filter start date"
              />
              <label htmlFor="tx-filter-end-date" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>To</label>
              <input
                id="tx-filter-end-date"
                type="date"
                className="form-input"
                style={{ padding: '5px 8px', fontSize: '0.8rem', width: 130 }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="End date"
                aria-label="Filter end date"
              />
            </div>
          </div>
        )}
      </div>

      {/* Transactions Table / List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt size={32} />}
          title="No transactions found"
          description={
            transactions.length === 0
              ? 'You have not recorded any transactions yet.'
              : 'No transactions match the selected filters.'
          }
          action={
            transactions.length === 0 ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenTransactionModal()}
                leftIcon={<Plus size={14} />}
              >
                Add First Transaction
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleClearFilters}
              >
                Reset Filters
              </Button>
            )
          }
        />
      ) : (
        <div className="surface-card">
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 100 }}>Date</th>
                  <th>Category / Details</th>
                  <th>Account</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                  <th style={{ width: 70, textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => {
                  const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
                  const acc = accMap.get(tx.accountId);
                  const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : undefined;

                  return (
                    <tr key={tx.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                        {tx.occurredOn}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className={`tx-icon-badge ${tx.kind}`} style={{ width: 26, height: 26 }}>
                            {tx.kind === 'income' ? (
                              <ArrowUpRight size={13} />
                            ) : tx.kind === 'expense' ? (
                              <ArrowDownRight size={13} />
                            ) : (
                              <ArrowRightLeft size={13} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.86rem' }}>
                              {tx.kind === 'transfer' ? (
                                `Transfer to ${toAcc?.name || 'Account'}`
                              ) : (
                                cat?.name || 'Uncategorized'
                              )}
                            </div>
                            {tx.note && (
                              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                                {tx.note}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td style={{ fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        <span style={{ marginRight: 6 }}>{acc?.name}</span>
                        <Badge variant={tx.currency === 'USD' ? 'usd' : 'khr'}>
                          {tx.currency}
                        </Badge>
                      </td>

                      <td style={{ textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <span className={`tabular-nums tx-amount ${tx.kind}`} style={{ fontSize: '0.92rem' }}>
                          {tx.kind === 'income' ? '+' : tx.kind === 'expense' ? '-' : ''}
                          {formatMoney(tx.amountMinor, tx.currency, { showSign: false })}
                        </span>
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ padding: '3px 5px' }}
                            onClick={() => onOpenTransactionModal(tx)}
                            aria-label="Edit transaction"
                            title="Edit"
                          >
                            <Edit2 size={12} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            style={{ padding: '3px 5px', color: 'var(--expense-color)' }}
                            onClick={async () => {
                              if (window.confirm('Delete this transaction? Your balances will update immediately.')) {
                                await onDeleteTransaction(tx.id);
                              }
                            }}
                            aria-label="Delete transaction"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </Button>
                        </div>
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
  );
};
