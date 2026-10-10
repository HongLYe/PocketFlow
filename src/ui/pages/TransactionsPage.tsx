import React, { useState, useMemo } from 'react';
import { Plus, Download, Trash2, Edit2, Search, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Receipt } from 'lucide-react';
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
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  const catMap = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const accMap = useMemo(() => new Map(accounts.map((a) => [a.id, a])), [accounts]);

  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      if (filterKind !== 'all' && tx.kind !== filterKind) return false;
      if (filterAccount !== 'all' && tx.accountId !== filterAccount && tx.toAccountId !== filterAccount) return false;
      if (filterCurrency !== 'all' && tx.currency !== filterCurrency) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const cat = tx.categoryId ? catMap.get(tx.categoryId)?.name.toLowerCase() : '';
        const acc = accMap.get(tx.accountId)?.name.toLowerCase() || '';
        const note = (tx.note || '').toLowerCase();
        if (!cat?.includes(q) && !acc.includes(q) && !note.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, filterKind, filterAccount, filterCurrency, searchQuery, catMap, accMap]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <PageHeader
        title="Transactions"
        description={`Showing ${filtered.length} of ${transactions.length} records`}
        actions={
          <>
            <Button
              variant="secondary"
              onClick={onExportCSV}
              leftIcon={<Download size={15} />}
              title="Download CSV report"
            >
              Export CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => onOpenTransactionModal()}
              leftIcon={<Plus size={15} />}
            >
              Add Transaction
            </Button>
          </>
        }
      />

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-surface)',
          padding: 12,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          alignItems: 'center',
        }}
      >
        <div style={{ flex: '1 1 200px' }}>
          <Input
            placeholder="Search note, category, account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftAddon={<Search size={15} />}
            style={{ marginBottom: 0 }}
          />
        </div>

        <div style={{ width: 'auto' }}>
          <Select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value)}
            options={[
              { value: 'all', label: 'All Types' },
              { value: 'expense', label: 'Expenses Only' },
              { value: 'income', label: 'Income Only' },
              { value: 'transfer', label: 'Transfers Only' },
            ]}
          />
        </div>

        <div style={{ width: 'auto' }}>
          <Select
            value={filterCurrency}
            onChange={(e) => setFilterCurrency(e.target.value)}
            options={[
              { value: 'all', label: 'All Currencies' },
              { value: 'USD', label: 'USD ($)' },
              { value: 'KHR', label: 'KHR (៛)' },
            ]}
          />
        </div>

        <div style={{ width: 'auto' }}>
          <Select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            options={[
              { value: 'all', label: 'All Accounts' },
              ...accounts.map((a) => ({
                value: a.id,
                label: `${a.name} (${a.currency})`,
              })),
            ]}
          />
        </div>
      </div>

      {/* Transactions List / Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Receipt size={36} />}
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
                onClick={() => {
                  setFilterKind('all');
                  setFilterAccount('all');
                  setFilterCurrency('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            )
          }
        />
      ) : (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            overflowX: 'auto',
          }}
        >
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: 110 }}>Date</th>
                <th>Description</th>
                <th>Account</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ width: 80, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tx) => {
                const cat = tx.categoryId ? catMap.get(tx.categoryId) : undefined;
                const acc = accMap.get(tx.accountId);
                const toAcc = tx.toAccountId ? accMap.get(tx.toAccountId) : undefined;

                return (
                  <tr key={tx.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                      {tx.occurredOn}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className={`tx-icon-badge ${tx.kind}`} style={{ width: 28, height: 28 }}>
                          {tx.kind === 'income' ? (
                            <ArrowUpRight size={14} />
                          ) : tx.kind === 'expense' ? (
                            <ArrowDownRight size={14} />
                          ) : (
                            <ArrowRightLeft size={14} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>
                            {tx.kind === 'transfer' ? (
                              `Transfer to ${toAcc?.name || 'Account'}`
                            ) : (
                              cat?.name || 'Uncategorized'
                            )}
                          </div>
                          {tx.note && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              {tx.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td style={{ fontSize: '0.84rem' }}>
                      {acc?.name}
                      <Badge variant={tx.currency === 'USD' ? 'usd' : 'khr'} className="ml-1">
                        {tx.currency}
                      </Badge>
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      <span
                        className={`tabular-nums ${
                          tx.kind === 'income'
                            ? 'tx-amount income'
                            : tx.kind === 'expense'
                            ? 'tx-amount expense'
                            : ''
                        }`}
                      >
                        {tx.kind === 'income' ? '+' : tx.kind === 'expense' ? '-' : ''}
                        {formatMoney(tx.amountMinor, tx.currency, { showSign: false })}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                        <Button
                          variant="secondary"
                          size="sm"
                          style={{ padding: 4 }}
                          onClick={() => onOpenTransactionModal(tx)}
                          aria-label="Edit transaction"
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          style={{ padding: 4, color: 'var(--expense-color)' }}
                          onClick={async () => {
                            if (window.confirm('Delete this transaction? Your balances will update immediately.')) {
                              await onDeleteTransaction(tx.id);
                            }
                          }}
                          aria-label="Delete transaction"
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
