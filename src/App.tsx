import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  PiggyBank,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';
import { db } from './storage/db';
import { repository } from './storage/repository';
import type { Transaction, Account, Budget } from './domain/models/types';
import { DashboardView } from './ui/features/dashboard/DashboardView';
import { TransactionsView } from './ui/features/transactions/TransactionsView';
import { AccountsView } from './ui/features/accounts/AccountsView';
import { BudgetsView } from './ui/features/budgets/BudgetsView';
import { ReportsView } from './ui/features/reports/ReportsView';
import { SettingsView } from './ui/features/settings/SettingsView';
import { TransactionModal } from './ui/components/TransactionModal';
import { AccountModal } from './ui/components/AccountModal';
import { BudgetModal } from './ui/components/BudgetModal';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Initialize DB seeds on mount
  useEffect(() => {
    repository.init();
  }, []);

  // Reactive queries from Dexie
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), []) || [];
  const transactions = useLiveQuery(async () => {
    const list = await db.transactions.toArray();
    return list.sort((a, b) => b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt));
  }, []) || [];
  const budgets = useLiveQuery(() => db.budgets.toArray(), []) || [];
  const settingsRecord = useLiveQuery(() => db.settings.get('global'), []);

  // Theme synchronization
  useEffect(() => {
    if (!settingsRecord) return;
    const theme = settingsRecord.theme;
    if (theme === 'dark') {
      document.documentElement.dataset.theme = 'dark';
    } else if (theme === 'light') {
      document.documentElement.dataset.theme = 'light';
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.dataset.theme = prefersDark ? 'dark' : 'light';
    }
  }, [settingsRecord]);

  // Modal triggers
  const handleOpenTransactionModal = (initialTx?: Transaction) => {
    setEditingTx(initialTx || null);
    setIsTxModalOpen(true);
  };

  const handleOpenAccountModal = (initialAcc?: Account) => {
    setEditingAccount(initialAcc || null);
    setIsAccountModalOpen(true);
  };

  const handleOpenBudgetModal = (initialBudget?: Budget) => {
    setEditingBudget(initialBudget || null);
    setIsBudgetModalOpen(true);
  };

  // Export handlers
  const handleExportBackup = async () => {
    const json = await repository.exportBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const csv = await repository.exportTransactionsCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketflow-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'budgets', label: 'Budgets', icon: PiggyBank },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--accent-brand)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
              }}
            >
              P
            </div>
            PocketFlow
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Local-First · USD & KHR
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => setActiveTab(item.id)}
              >
                <IconComponent size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)' }}>
          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => handleOpenTransactionModal()}
          >
            <Plus size={16} /> New Transaction
          </button>
        </div>
      </aside>

      {/* Main View Area */}
      <main className="main-content">
        <div className="content-container">
          {activeTab === 'dashboard' && (
            <DashboardView
              accounts={accounts}
              transactions={transactions}
              categories={categories}
              budgets={budgets}
              currentMonth={currentMonth}
              onOpenTransactionModal={() => handleOpenTransactionModal()}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionsView
              transactions={transactions}
              accounts={accounts}
              categories={categories}
              onOpenTransactionModal={handleOpenTransactionModal}
              onDeleteTransaction={(id) => repository.deleteTransaction(id)}
              onExportCSV={handleExportCSV}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsView
              accounts={accounts}
              transactions={transactions}
              onOpenAccountModal={handleOpenAccountModal}
              onArchiveAccount={(id) => repository.archiveAccount(id)}
            />
          )}

          {activeTab === 'budgets' && (
            <BudgetsView
              budgets={budgets}
              categories={categories}
              transactions={transactions}
              currentMonth={currentMonth}
              onOpenBudgetModal={handleOpenBudgetModal}
              onDeleteBudget={(id) => repository.deleteBudget(id)}
              onChangeMonth={setCurrentMonth}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              categories={categories}
              transactions={transactions}
              currentMonth={currentMonth}
              onChangeMonth={setCurrentMonth}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={
                settingsRecord || {
                  preferredCurrency: 'ALL',
                  theme: 'system',
                  weekStartDay: 1,
                  onboardingCompleted: true,
                  exportVersion: 1,
                }
              }
              categories={categories}
              onUpdateSettings={(s) => repository.updateSettings(s)}
              onExportBackup={handleExportBackup}
              onImportBackup={(json) => repository.importBackup(json)}
              onExportCSV={handleExportCSV}
              onAddCategory={(cat) => repository.saveCategory(cat)}
            />
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-nav" aria-label="Mobile Navigation">
        {navItems.slice(0, 5).map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              className={`mobile-nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => setActiveTab(item.id)}
            >
              <IconComponent size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        onSave={async (tx) => {
          await repository.saveTransaction(tx);
        }}
        accounts={accounts}
        categories={categories}
        initialTransaction={editingTx}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onSave={async (acc) => {
          await repository.saveAccount(acc);
        }}
        initialAccount={editingAccount}
      />

      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSave={async (bgt) => {
          await repository.saveBudget(bgt);
        }}
        categories={categories}
        initialBudget={editingBudget}
        defaultMonth={currentMonth}
      />
    </div>
  );
};

export default App;
