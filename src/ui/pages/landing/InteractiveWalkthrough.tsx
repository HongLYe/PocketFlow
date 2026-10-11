import React, { useState } from 'react';
import {
  Coins,
  ReceiptText,
  PiggyBank,
  PieChart,
  PlusCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { Badge } from '../../components/Badge';

interface TabItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  heading: string;
  summary: string;
  points: string[];
  mockup: React.ReactNode;
}

export const InteractiveWalkthrough: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('balances');

  const tabs: TabItem[] = [
    {
      id: 'balances',
      label: 'Understand Balances',
      icon: <Coins size={16} />,
      heading: 'Dual-Currency Isolation Without Forced Conversions',
      summary:
        'In economies where USD and Cambodian Riel (KHR) circulate together, summing them into a single number distorts reality. PocketFlow keeps both currencies completely isolated.',
      points: [
        'USD cents and KHR whole riels calculated with integer precision',
        'Independent cash, bank, and e-wallet accounts per currency',
        'No arbitrary exchange rate assumptions or inaccurate totals',
      ],
      mockup: (
        <div className="walkthrough-mockup-box">
          <div className="mockup-header">Available Totals by Currency</div>
          <div className="walkthrough-cards-row">
            <div className="walkthrough-card">
              <div className="walkthrough-card-top">
                <span className="walkthrough-card-label">United States Dollar</span>
                <Badge variant="usd">USD</Badge>
              </div>
              <div className="walkthrough-card-value tabular-nums">$2,450.50</div>
              <div className="walkthrough-card-sub">Cash Wallet ($185.00) + ABA Bank ($2,265.50)</div>
            </div>
            <div className="walkthrough-card">
              <div className="walkthrough-card-top">
                <span className="walkthrough-card-label">Cambodian Riel</span>
                <Badge variant="khr">KHR</Badge>
              </div>
              <div className="walkthrough-card-value tabular-nums">៛1,850,000</div>
              <div className="walkthrough-card-sub">Wing E-Wallet (៛1,850,000)</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'expenses',
      label: 'Add an Expense',
      icon: <PlusCircle size={16} />,
      heading: 'Record Spending in Seconds Without Unnecessary Friction',
      summary:
        'No complex menus or mandatory online lookups. Select the account, choose an expense category, type the amount, and save immediately to local browser storage.',
      points: [
        'Immediate validation of amounts (prevents negative amounts)',
        'Built-in support for income, expense, and same-currency transfers',
        'Accounts and monthly totals update instantaneously on save',
      ],
      mockup: (
        <div className="walkthrough-mockup-box">
          <div className="mockup-header">Transaction Entry Flow</div>
          <div className="walkthrough-entry-flow">
            <div className="walkthrough-input-step">
              <span className="step-tag">Type</span>
              <span className="step-val">Expense</span>
            </div>
            <div className="walkthrough-input-step">
              <span className="step-tag">Account</span>
              <span className="step-val">Cash Wallet (USD)</span>
            </div>
            <div className="walkthrough-input-step">
              <span className="step-tag">Category</span>
              <span className="step-val">Food & Dining</span>
            </div>
            <div className="walkthrough-input-step active-step">
              <span className="step-tag">Amount</span>
              <span className="step-val tabular-nums">$14.50</span>
            </div>
          </div>
          <div className="walkthrough-saved-status">
            <CheckCircle2 size={15} color="var(--income-color)" />
            <span>Saved to IndexedDB in 4ms · Balances updated</span>
          </div>
        </div>
      ),
    },
    {
      id: 'transactions',
      label: 'Recent Transactions',
      icon: <ReceiptText size={16} />,
      heading: 'Clear, Chronological Records with Complete Context',
      summary:
        'Review your recent financial history at a glance. Filter by category, account, or date, and search notes whenever you need to check a past expense.',
      points: [
        'Clear visual indicators for income, expense, and internal transfers',
        'Direct filters by date range, account, and category',
        'Fast local search without waiting on server roundtrips',
      ],
      mockup: (
        <div className="walkthrough-mockup-box">
          <div className="mockup-header">Filtered Transaction History</div>
          <div className="walkthrough-tx-rows">
            <div className="walkthrough-tx-item">
              <div>
                <div className="walkthrough-tx-title">Supermarket Groceries</div>
                <div className="walkthrough-tx-desc">ABA Bank · 2026-10-11 · Groceries</div>
              </div>
              <div className="walkthrough-tx-amt tx-negative tabular-nums">-$38.25</div>
            </div>
            <div className="walkthrough-tx-item">
              <div>
                <div className="walkthrough-tx-title">Consulting Invoice Payment</div>
                <div className="walkthrough-tx-desc">ABA Bank · 2026-10-08 · Salary & Income</div>
              </div>
              <div className="walkthrough-tx-amt tx-positive tabular-nums">+$950.00</div>
            </div>
            <div className="walkthrough-tx-item">
              <div>
                <div className="walkthrough-tx-title">Local Market Produce</div>
                <div className="walkthrough-tx-desc">Cash Wallet · 2026-10-06 · Food</div>
              </div>
              <div className="walkthrough-tx-amt tx-negative tabular-nums">-៛25,000</div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'budgets',
      label: 'Category Budgets',
      icon: <PiggyBank size={16} />,
      heading: 'Proactive Spending Caps with Clear Warning Alerts',
      summary:
        'Set monthly spending limits for categories in either USD or KHR. PocketFlow calculates your used and remaining limits in real time and alerts you before you overspend.',
      points: [
        'Visual progress bars calibrated to monthly category limits',
        'Automatic warning badge triggered at 80% utilization',
        'Exceeded state warning when a monthly category limit is passed',
      ],
      mockup: (
        <div className="walkthrough-mockup-box">
          <div className="mockup-header">October Category Limits</div>
          <div className="walkthrough-budget-items">
            <div className="walkthrough-budget-row">
              <div className="walkthrough-b-top">
                <span className="walkthrough-b-name">Dining Out (USD)</span>
                <span className="badge badge-warning">
                  <AlertTriangle size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                  84% · Warning
                </span>
              </div>
              <div className="preview-progress-track">
                <div className="preview-progress-fill preview-fill-warning" style={{ width: '84%' }} />
              </div>
              <div className="walkthrough-b-bottom tabular-nums">
                <span>$210.00 of $250.00 limit</span>
                <span style={{ color: 'var(--warning-color)', fontWeight: 600 }}>$40.00 remaining</span>
              </div>
            </div>

            <div className="walkthrough-budget-row">
              <div className="walkthrough-b-top">
                <span className="walkthrough-b-name">Utilities (KHR)</span>
                <span className="badge">52% on track</span>
              </div>
              <div className="preview-progress-track">
                <div className="preview-progress-fill preview-fill-normal" style={{ width: '52%' }} />
              </div>
              <div className="walkthrough-b-bottom tabular-nums">
                <span>៛156,000 of ៛300,000 limit</span>
                <span>៛144,000 remaining</span>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'reports',
      label: 'Spending Reports',
      icon: <PieChart size={16} />,
      heading: 'Understand Where Your Money Went Each Month',
      summary:
        'Review monthly income vs. expense balance sheets and inspect category distributions for both currencies independently.',
      points: [
        'Separates income, expense, and transfers so balance sheets stay accurate',
        'Category breakdown reveals largest spending buckets',
        'Direct CSV export to open your records in spreadsheet tools',
      ],
      mockup: (
        <div className="walkthrough-mockup-box">
          <div className="mockup-header">October Spending Distribution (USD)</div>
          <div className="walkthrough-report-bars">
            <div className="walkthrough-report-bar-row">
              <span className="report-cat-name">Food & Dining</span>
              <div className="report-bar-track">
                <div className="report-bar-fill" style={{ width: '45%' }} />
              </div>
              <span className="report-cat-amt tabular-nums">$337.25 (45%)</span>
            </div>
            <div className="walkthrough-report-bar-row">
              <span className="report-cat-name">Groceries</span>
              <div className="report-bar-track">
                <div className="report-bar-fill" style={{ width: '32%' }} />
              </div>
              <span className="report-cat-amt tabular-nums">$240.00 (32%)</span>
            </div>
            <div className="walkthrough-report-bar-row">
              <span className="report-cat-name">Transport</span>
              <div className="report-bar-track">
                <div className="report-bar-fill" style={{ width: '15%' }} />
              </div>
              <span className="report-cat-amt tabular-nums">$112.50 (15%)</span>
            </div>
          </div>
        </div>
      ),
    },
  ];

  const current = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="walkthrough-container">
      {/* Segmented Tab Controls */}
      <div className="walkthrough-tabs" role="tablist" aria-label="Product capabilities">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              id={`tab-${tab.id}`}
              className={`walkthrough-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div
        id={`panel-${current.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${current.id}`}
        className="walkthrough-panel"
      >
        <div className="walkthrough-panel-info">
          <h3 className="walkthrough-panel-title">{current.heading}</h3>
          <p className="walkthrough-panel-summary">{current.summary}</p>
          <ul className="walkthrough-points-list">
            {current.points.map((pt, idx) => (
              <li key={idx} className="walkthrough-point-item">
                <ArrowRight size={14} className="point-icon" aria-hidden="true" />
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="walkthrough-panel-preview">{current.mockup}</div>
      </div>
    </div>
  );
};
