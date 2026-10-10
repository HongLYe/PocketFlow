import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './storage/db';
import { repository } from './storage/repository';
import type { Transaction, Budget } from './domain/models/types';
import { Router, Route } from './ui/routing/router';
import { ROUTES } from './ui/routing/routes';
import { AppShell } from './ui/layout/AppShell';
import { DashboardPage } from './ui/pages/DashboardPage';
import { TransactionsPage } from './ui/pages/TransactionsPage';
import { BudgetsPage } from './ui/pages/BudgetsPage';
import { ReportsPage } from './ui/pages/ReportsPage';
import { SettingsPage } from './ui/pages/SettingsPage';
import { TransactionModal } from './ui/components/TransactionModal';
import { BudgetModal } from './ui/components/BudgetModal';

export const App: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Modal states
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);

  // Initialize DB seeds on mount
  useEffect(() => {
    repository.init();
  }, []);

  // Reactive queries from Dexie
  const accounts = useLiveQuery(() => db.accounts.toArray(), []) || [];
  const categories = useLiveQuery(() => db.categories.orderBy('sortOrder').toArray(), []) || [];
  const transactions =
    useLiveQuery(async () => {
      const list = await db.transactions.toArray();
      return list.sort(
        (a, b) =>
          b.occurredOn.localeCompare(a.occurredOn) || b.createdAt.localeCompare(a.createdAt)
      );
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

  return (
    <Router>
      <AppShell
        onNewTransaction={() => handleOpenTransactionModal()}
        isLoading={!settingsRecord}
      >
        {/* Route 1: Dashboard (Starting destination) */}
        <Route path={ROUTES.DASHBOARD}>
          <DashboardPage
            accounts={accounts}
            transactions={transactions}
            categories={categories}
            budgets={budgets}
            currentMonth={currentMonth}
            onOpenTransactionModal={() => handleOpenTransactionModal()}
          />
        </Route>

        {/* Route 2: Transactions */}
        <Route path={ROUTES.TRANSACTIONS}>
          <TransactionsPage
            transactions={transactions}
            accounts={accounts}
            categories={categories}
            onOpenTransactionModal={handleOpenTransactionModal}
            onDeleteTransaction={(id) => repository.deleteTransaction(id)}
            onExportCSV={handleExportCSV}
          />
        </Route>

        {/* Route 3: Budgets */}
        <Route path={ROUTES.BUDGETS}>
          <BudgetsPage
            budgets={budgets}
            categories={categories}
            transactions={transactions}
            currentMonth={currentMonth}
            onOpenBudgetModal={handleOpenBudgetModal}
            onDeleteBudget={(id) => repository.deleteBudget(id)}
            onChangeMonth={setCurrentMonth}
          />
        </Route>

        {/* Route 4: Reports */}
        <Route path={ROUTES.REPORTS}>
          <ReportsPage
            categories={categories}
            transactions={transactions}
            currentMonth={currentMonth}
            onChangeMonth={setCurrentMonth}
          />
        </Route>

        {/* Route 5: Settings */}
        <Route path={ROUTES.SETTINGS}>
          <SettingsPage
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
        </Route>
      </AppShell>

      {/* Global Modals */}
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
    </Router>
  );
};

export default App;
