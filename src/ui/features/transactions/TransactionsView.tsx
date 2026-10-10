import React, { useState, useMemo } from 'react';
import { Plus, Download, Trash2, Edit2, Search, ArrowUpRight, ArrowDownRight, ArrowRightLeft } from 'lucide-react';
import type { Account, Category, Transaction } from '../../../domain/models/types';
import { formatMoney } from '../../../domain/money/money';

interface TransactionsViewProps {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  onOpenTransactionModal: (initialTx?: Transaction) => void;
  onDeleteTransaction: (id: string) => Promise<void>;
  onExportCSV: () => Promise<void>;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em' }}>Transactions</h1>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
            {filtered.length} of {transactions.length} transactions
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary" onClick={onExportCSV} title="Download CSV for spreadsheets">
            <Download size={15} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => onOpenTransactionModal()}>
            <Plus size={15} /> Add Transaction
          </button>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          flexWrap: 'wrap',
          backgroundColor: 'var(--bg-surface)',
          padding: 12,
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ width: '100%', paddingLeft: 32 }}
            placeholder="Search note, category, account..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="expense">Expenses Only</option>
          <option value="income">Income Only</option>
          <option value="transfer">Transfers Only</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
        >
          <option value="all">All Currencies</option>
          <option value="USD">USD ($)</option>
          <option value="KHR">KHR (៛)</option>
        </select>

        <select
          className="form-select"
          style={{ width: 'auto' }}
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
        >
          <option value="all">All Accounts</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} ({a.currency})
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)' }}>
          <p className="empty-state-text">No transactions match your current filters.</p>
          {(filterKind !== 'all' || filterAccount !== 'all' || filterCurrency !== 'all' || searchQuery) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFilterKind('all');
                setFilterAccount('all');
                setFilterCurrency('all');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
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
                      <span className={`badge ${tx.currency === 'USD' ? 'badge-usd' : 'badge-khr'}`} style={{ marginLeft: 6 }}>
                        {tx.currency}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 700 }}>
                      <span className={`tabular-nums ${tx.kind === 'income' ? 'tx-amount income' : tx.kind === 'expense' ? 'tx-amount expense' : ''}`}>
                        {tx.kind === 'income' ? '+' : tx.kind === 'expense' ? '-' : ''}
                        {formatMoney(tx.amountMinor, tx.currency, { showSign: false })}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: 4 }}
                          onClick={() => onOpenTransactionModal(tx)}
                          title="Edit transaction"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: 4, color: 'var(--expense-color)' }}
                          onClick={async () => {
                            if (window.confirm('Delete this transaction? Your balances will update immediately.')) {
                              await onDeleteTransaction(tx.id);
                            }
                          }}
                          title="Delete transaction"
                        >
                          <Trash2 size={13} />
                        </button>
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
