import React from 'react';
import {
  Wallet,
  Landmark,
  Smartphone,
  Utensils,
  ShoppingCart,
  Zap,
  Coffee,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

export const DashboardPreview: React.FC = () => {
  return (
    <div className="preview-frame" aria-label="Illustrative PocketFlow Dashboard Preview">
      {/* Frame Top Header */}
      <div className="preview-frame-header">
        <div className="preview-frame-title">
          <img
            src="/App icon only.png"
            alt="PocketFlow icon"
            style={{ width: 18, height: 18, borderRadius: '28%', objectFit: 'contain' }}
          />
          <span className="preview-app-title">PocketFlow</span>
          <span className="preview-mode-tag">Simulated Preview</span>
        </div>
        <div className="preview-frame-date">
          <span className="tabular-nums">October 2026</span>
        </div>
      </div>

      {/* Frame Content */}
      <div className="preview-body">
        {/* Available Balances Row - Dual Currency Isolation */}
        <div className="preview-section-title">Available Balances</div>
        <div className="preview-balances-grid">
          {/* USD Balance Card */}
          <div className="preview-stat-card">
            <div className="preview-stat-top">
              <span className="preview-stat-label">US Dollars (USD)</span>
              <span className="badge badge-usd">USD</span>
            </div>
            <div className="preview-stat-amount tabular-nums">$2,450.50</div>
            <div className="preview-stat-sub-grid">
              <div>
                <div className="preview-sub-label">Income this month</div>
                <div className="preview-sub-val preview-sub-income tabular-nums">+$3,200.00</div>
              </div>
              <div>
                <div className="preview-sub-label">Spent this month</div>
                <div className="preview-sub-val preview-sub-expense tabular-nums">-$749.50</div>
              </div>
            </div>
          </div>

          {/* KHR Balance Card */}
          <div className="preview-stat-card">
            <div className="preview-stat-top">
              <span className="preview-stat-label">Cambodian Riel (KHR)</span>
              <span className="badge badge-khr">KHR</span>
            </div>
            <div className="preview-stat-amount tabular-nums">៛1,850,000</div>
            <div className="preview-stat-sub-grid">
              <div>
                <div className="preview-sub-label">Income this month</div>
                <div className="preview-sub-val preview-sub-income tabular-nums">+៛2,500,000</div>
              </div>
              <div>
                <div className="preview-sub-label">Spent this month</div>
                <div className="preview-sub-val preview-sub-expense tabular-nums">-៛650,000</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lower Grid: Accounts, Recent Transactions & Category Budgets */}
        <div className="preview-two-col">
          {/* Left Column: Recent Transactions & Accounts */}
          <div className="preview-col-main">
            {/* Accounts Bar */}
            <div className="preview-card-block">
              <div className="preview-block-header">
                <span className="preview-block-title">Active Accounts</span>
                <span className="preview-block-count">3 accounts</span>
              </div>
              <div className="preview-accounts-list">
                <div className="preview-account-pill">
                  <div className="preview-account-icon-wrap" aria-hidden="true">
                    <Wallet size={13} />
                  </div>
                  <span className="preview-account-name">Cash Wallet</span>
                  <span className="badge badge-usd">USD</span>
                  <span className="preview-account-bal tabular-nums">$185.00</span>
                </div>
                <div className="preview-account-pill">
                  <div className="preview-account-icon-wrap" aria-hidden="true">
                    <Landmark size={13} />
                  </div>
                  <span className="preview-account-name">ABA Bank</span>
                  <span className="badge badge-usd">USD</span>
                  <span className="preview-account-bal tabular-nums">$2,265.50</span>
                </div>
                <div className="preview-account-pill">
                  <div className="preview-account-icon-wrap" aria-hidden="true">
                    <Smartphone size={13} />
                  </div>
                  <span className="preview-account-name">Wing E-Wallet</span>
                  <span className="badge badge-khr">KHR</span>
                  <span className="preview-account-bal tabular-nums">៛1,850,000</span>
                </div>
              </div>
            </div>

            {/* Recent Transactions List */}
            <div className="preview-card-block">
              <div className="preview-block-header">
                <span className="preview-block-title">Recent Transactions</span>
                <span className="preview-block-count">5 records</span>
              </div>
              <div className="preview-tx-list">
                <div className="preview-tx-row">
                  <div className="preview-tx-icon-wrap preview-tx-expense" aria-hidden="true">
                    <ShoppingCart size={14} />
                  </div>
                  <div className="preview-tx-meta">
                    <div className="preview-tx-desc">Weekly Groceries</div>
                    <div className="preview-tx-sub">ABA Bank · Oct 11 · Groceries</div>
                  </div>
                  <div className="preview-tx-amount preview-tx-expense tabular-nums">-$42.80</div>
                </div>

                <div className="preview-tx-row">
                  <div className="preview-tx-icon-wrap preview-tx-income" aria-hidden="true">
                    <Briefcase size={14} />
                  </div>
                  <div className="preview-tx-meta">
                    <div className="preview-tx-desc">Monthly Salary</div>
                    <div className="preview-tx-sub">ABA Bank · Oct 01 · Income</div>
                  </div>
                  <div className="preview-tx-amount preview-tx-income tabular-nums">+$3,200.00</div>
                </div>

                <div className="preview-tx-row">
                  <div className="preview-tx-icon-wrap preview-tx-expense" aria-hidden="true">
                    <Utensils size={14} />
                  </div>
                  <div className="preview-tx-meta">
                    <div className="preview-tx-desc">Family Lunch</div>
                    <div className="preview-tx-sub">Cash Wallet · Oct 09 · Food</div>
                  </div>
                  <div className="preview-tx-amount preview-tx-expense tabular-nums">-៛45,000</div>
                </div>

                <div className="preview-tx-row">
                  <div className="preview-tx-icon-wrap preview-tx-expense" aria-hidden="true">
                    <Zap size={14} />
                  </div>
                  <div className="preview-tx-meta">
                    <div className="preview-tx-desc">Electricity Bill</div>
                    <div className="preview-tx-sub">Wing E-Wallet · Oct 05 · Utilities</div>
                  </div>
                  <div className="preview-tx-amount preview-tx-expense tabular-nums">-៛210,000</div>
                </div>

                <div className="preview-tx-row">
                  <div className="preview-tx-icon-wrap preview-tx-expense" aria-hidden="true">
                    <Coffee size={14} />
                  </div>
                  <div className="preview-tx-meta">
                    <div className="preview-tx-desc">Morning Espresso</div>
                    <div className="preview-tx-sub">Wing E-Wallet · Oct 04 · Dining</div>
                  </div>
                  <div className="preview-tx-amount preview-tx-expense tabular-nums">-$3.50</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Category Budgets Progress */}
          <div className="preview-col-side">
            <div className="preview-card-block">
              <div className="preview-block-header">
                <span className="preview-block-title">Monthly Budgets</span>
                <span className="preview-block-count">October</span>
              </div>
              <div className="preview-budget-list">
                {/* Budget 1: Warning threshold */}
                <div className="preview-budget-item">
                  <div className="preview-budget-top">
                    <span className="preview-budget-name">Food & Dining (USD)</span>
                    <span className="badge badge-warning" style={{ fontSize: '0.68rem', padding: '1px 7px' }}>
                      <AlertTriangle size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />
                      81% used
                    </span>
                  </div>
                  <div className="preview-progress-track">
                    <div
                      className="preview-progress-fill preview-fill-warning"
                      style={{ width: '81%' }}
                      role="progressbar"
                      aria-valuenow={81}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="preview-budget-meta tabular-nums">
                    <span>$285.00 spent</span>
                    <span className="preview-budget-limit">of $350.00 limit</span>
                  </div>
                </div>

                {/* Budget 2: Normal threshold */}
                <div className="preview-budget-item">
                  <div className="preview-budget-top">
                    <span className="preview-budget-name">Groceries (USD)</span>
                    <span className="badge" style={{ fontSize: '0.68rem', padding: '1px 7px' }}>60% used</span>
                  </div>
                  <div className="preview-progress-track">
                    <div
                      className="preview-progress-fill preview-fill-normal"
                      style={{ width: '60%' }}
                      role="progressbar"
                      aria-valuenow={60}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="preview-budget-meta tabular-nums">
                    <span>$240.00 spent</span>
                    <span className="preview-budget-limit">of $400.00 limit</span>
                  </div>
                </div>

                {/* Budget 3: KHR budget */}
                <div className="preview-budget-item">
                  <div className="preview-budget-top">
                    <span className="preview-budget-name">Utilities (KHR)</span>
                    <span className="badge" style={{ fontSize: '0.68rem', padding: '1px 7px' }}>70% used</span>
                  </div>
                  <div className="preview-progress-track">
                    <div
                      className="preview-progress-fill preview-fill-normal"
                      style={{ width: '70%' }}
                      role="progressbar"
                      aria-valuenow={70}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    />
                  </div>
                  <div className="preview-budget-meta tabular-nums">
                    <span>៛210,000 spent</span>
                    <span className="preview-budget-limit">of ៛300,000 limit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Local Storage Privacy Indicator */}
            <div className="preview-local-notice">
              <div className="preview-notice-title">Browser-Local Storage</div>
              <p className="preview-notice-desc">
                Accounts, budgets, and transactions are persisted in browser IndexedDB. Zero cloud transmission.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
