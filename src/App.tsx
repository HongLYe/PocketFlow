import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './storage/db';
import { repository } from './storage/repository';
import type { Account, Transaction, Budget, Category, AppSettings } from './domain/models/types';
import { Router, Route } from './ui/routing/router';
import { useRouter } from './ui/routing/useRouter';
import { ROUTES } from './ui/routing/routes';
import { AppShell } from './ui/layout/AppShell';
import { DashboardPage } from './ui/pages/DashboardPage';
import { AccountsPage } from './ui/pages/AccountsPage';
import { TransactionsPage } from './ui/pages/TransactionsPage';
import { BudgetsPage } from './ui/pages/BudgetsPage';
import { ReportsPage } from './ui/pages/ReportsPage';
import { SettingsPage } from './ui/pages/SettingsPage';
import { LandingPage } from './ui/pages/LandingPage';
import { NotFoundPage } from './ui/pages/NotFoundPage';
import { TransactionModal } from './ui/components/TransactionModal';
import { BudgetModal } from './ui/components/BudgetModal';
import { AccountModal } from './ui/components/AccountModal';

interface MainViewProps {
  accounts: Account[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  currentMonth: string;
  settingsRecord: AppSettings | undefined;
  onOpenTransactionModal: (tx?: Transaction) => void;
  onOpenAccountModal: (acc?: Account) => void;
  onOpenBudgetModal: (bgt?: Budget) => void;
  onArchiveAccount: (id: string) => Promise<void>;
  onUnarchiveAccount: (id: string) => Promise<void>;
  onDeleteAccount: (id: string) => Promise<void>;
  onExportCSV: () => Promise<void>;
  onExportBackup: () => Promise<void>;
  onImportBackup: (json: string) => Promise<{ success: boolean; error?: string }>;
  setCurrentMonth: (m: string) => void;
}

const MainView: React.FC<MainViewProps> = (props) => {
  const { currentPath } = useRouter();

  if (currentPath === ROUTES.LANDING) {
    return <LandingPage />;
  }

  const isKnownRoute = Object.values(ROUTES).includes(currentPath as any);

  return (
    <AppShell
      onNewTransaction={() => props.onOpenTransactionModal()}
      isLoading={!props.settingsRecord}
    >
      {!isKnownRoute ? (
        <NotFoundPage />
      ) : (
        <>
          {/* Route 1: Dashboard */}
          <Route path={ROUTES.DASHBOARD}>
            <DashboardPage
              accounts={props.accounts}
              transactions={props.transactions}
              categories={props.categories}
              budgets={props.budgets}
              currentMonth={props.currentMonth}
              onOpenTransactionModal={() => props.onOpenTransactionModal()}
              onOpenAccountModal={props.onOpenAccountModal}
              onArchiveAccount={props.onArchiveAccount}
              onUnarchiveAccount={props.onUnarchiveAccount}
              onDeleteAccount={props.onDeleteAccount}
            />
          </Route>

          {/* Route 2: Accounts */}
          <Route path={ROUTES.ACCOUNTS}>
            <AccountsPage
              accounts={props.accounts}
              transactions={props.transactions}
              onOpenAccountModal={props.onOpenAccountModal}
              onArchiveAccount={props.onArchiveAccount}
              onUnarchiveAccount={props.onUnarchiveAccount}
              onDeleteAccount={props.onDeleteAccount}
            />
          </Route>

          {/* Route 3: Transactions */}
          <Route path={ROUTES.TRANSACTIONS}>
            <TransactionsPage
              transactions={props.transactions}
              accounts={props.accounts}
              categories={props.categories}
              onOpenTransactionModal={props.onOpenTransactionModal}
              onDeleteTransaction={(id) => repository.deleteTransaction(id)}
              onExportCSV={props.onExportCSV}
            />
          </Route>

          {/* Route 4: Budgets */}
          <Route path={ROUTES.BUDGETS}>
            <BudgetsPage
              budgets={props.budgets}
              categories={props.categories}
              transactions={props.transactions}
              currentMonth={props.currentMonth}
              onOpenBudgetModal={props.onOpenBudgetModal}
              onDeleteBudget={(id) => repository.deleteBudget(id)}
              onChangeMonth={props.setCurrentMonth}
            />
          </Route>

          {/* Route 5: Reports */}
          <Route path={ROUTES.REPORTS}>
            <ReportsPage
              categories={props.categories}
              transactions={props.transactions}
              accounts={props.accounts}
              currentMonth={props.currentMonth}
              onChangeMonth={props.setCurrentMonth}
            />
          </Route>

          {/* Route 6: Settings */}
          <Route path={ROUTES.SETTINGS}>
            <SettingsPage
              settings={
                props.settingsRecord || {
                  preferredCurrency: 'ALL',
                  theme: 'light',
                  weekStartDay: 1,
                  onboardingCompleted: true,
                  exportVersion: 1,
                }
              }
              categories={props.categories}
              onUpdateSettings={(s) => repository.updateSettings(s)}
              onExportBackup={props.onExportBackup}
              onImportBackup={props.onImportBackup}
              onExportCSV={props.onExportCSV}
              onAddCategory={(cat) => repository.saveCategory(cat)}
              onArchiveCategory={(id) => repository.archiveCategory(id)}
              onUnarchiveCategory={(id) => repository.unarchiveCategory(id)}
            />
          </Route>
        </>
      )}
    </AppShell>
  );
};

export const App: React.FC = () => {
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
    if (!settingsRecord) {
      document.documentElement.dataset.theme = 'light';
      return;
    }
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
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pocketflow-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Router>
      <MainView
        accounts={accounts}
        transactions={transactions}
        categories={categories}
        budgets={budgets}
        currentMonth={currentMonth}
        settingsRecord={settingsRecord}
        onOpenTransactionModal={handleOpenTransactionModal}
        onOpenAccountModal={handleOpenAccountModal}
        onOpenBudgetModal={handleOpenBudgetModal}
        onArchiveAccount={(id) => repository.archiveAccount(id)}
        onUnarchiveAccount={(id) => repository.unarchiveAccount(id)}
        onDeleteAccount={(id) => repository.deleteAccount(id)}
        onExportCSV={handleExportCSV}
        onExportBackup={handleExportBackup}
        onImportBackup={(json) => repository.importBackup(json)}
        setCurrentMonth={setCurrentMonth}
      />

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
    </Router>
  );
};

export default App;

