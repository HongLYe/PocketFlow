import React from 'react';
import {
  ArrowRight,
  Shield,
  Coins,
  Cpu,
  WifiOff,
  CheckCircle,
  FileSpreadsheet,
  Download,
  AlertCircle,
  ArrowUpRight,
  ChevronDown,
  Layers,
  PieChart,
} from 'lucide-react';
import { useRouter } from '../routing/useRouter';
import { ROUTES } from '../routing/routes';
import { LandingNav } from './landing/LandingNav';
import { DashboardPreview } from './landing/DashboardPreview';
import { InteractiveWalkthrough } from './landing/InteractiveWalkthrough';
import { Badge } from '../components/Badge';
import './landing.css';

export const LandingPage: React.FC = () => {
  const { navigate } = useRouter();

  const handleStartTracking = () => {
    navigate(ROUTES.DASHBOARD);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page-root">
      {/* 1. Navigation */}
      <LandingNav />

      <main id="landing-main-content">
        {/* 2. Hero Section */}
        <section className="landing-hero" id="hero" aria-labelledby="hero-heading">
          <div className="landing-container">
            <div className="eyebrow-label hero-eyebrow">
              PERSONAL FINANCE, WITHOUT THE NOISE
            </div>

            <h1 id="hero-heading" className="hero-headline">
              Know where your money goes.
            </h1>

            <p className="hero-supporting-text">
              A calmer way to track spending, plan your budget, and understand your money, with
              your financial data kept entirely on your device.
            </p>

            <div className="hero-ctas-row">
              <button
                type="button"
                className="btn btn-primary hero-btn-primary"
                onClick={handleStartTracking}
              >
                <span>Start tracking</span>
                <ArrowRight size={16} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="btn btn-secondary hero-btn-secondary"
                onClick={() => scrollToSection('features')}
              >
                Explore features
              </button>
            </div>

            {/* Architecture & Trust Highlights */}
            <div className="hero-trust-bar">
              <div className="trust-item">
                <Coins size={16} className="trust-icon" aria-hidden="true" />
                <span>USD & KHR Dual-Currency</span>
              </div>
              <div className="trust-item">
                <Cpu size={16} className="trust-icon" aria-hidden="true" />
                <span>IndexedDB Browser Storage</span>
              </div>
              <div className="trust-item">
                <WifiOff size={16} className="trust-icon" aria-hidden="true" />
                <span>Works 100% Offline</span>
              </div>
              <div className="trust-item">
                <FileSpreadsheet size={16} className="trust-icon" aria-hidden="true" />
                <span>JSON & CSV Data Portability</span>
              </div>
            </div>

            {/* Hero Visual Preview */}
            <div className="hero-preview-box">
              <DashboardPreview />
            </div>
            <p className="hero-preview-caption">
              Faithful rendering of the PocketFlow dashboard using illustrative sample records. No
              backend or accounts needed.
            </p>
          </div>
        </section>

        {/* 3. Product Preview / Interactive Walkthrough */}
        <section className="landing-section" id="preview" aria-labelledby="preview-heading">
          <div className="landing-container">
            <div className="section-head-wrap">
              <div className="section-eyebrow">Product Preview</div>
              <h2 id="preview-heading" className="section-main-heading">
                Designed for daily money tracking
              </h2>
              <p className="section-subtext">
                Explore the five key workflows built directly into the application to help you keep
                accurate tabs on your personal finances.
              </p>
            </div>

            <InteractiveWalkthrough />
          </div>
        </section>

        {/* 4. Meaningful Features */}
        <section className="landing-section" id="features" aria-labelledby="features-heading">
          <div className="landing-container">
            <div className="section-head-wrap">
              <div className="section-eyebrow">Core Features</div>
              <h2 id="features-heading" className="section-main-heading">
                Practical financial tools without the bloat
              </h2>
              <p className="section-subtext">
                Every capability in PocketFlow was built to solve practical tracking problems
                reliably and quickly.
              </p>
            </div>

            <div className="features-stack">
              {/* Feature 1: Dual-Currency Isolation */}
              <article className="feature-flagship-block">
                <div className="feature-flagship-text">
                  <span className="feature-tag">Dual-Currency Engine</span>
                  <h3 className="feature-title">Native USD and Cambodian Riel (KHR) Isolation</h3>
                  <p className="feature-desc">
                    In dual-currency economies, conflating currencies leads to misleading totals.
                    PocketFlow maintains distinct accounts and balances for both USD and KHR without
                    forcing unstable currency conversions.
                  </p>
                  <p className="feature-desc">
                    All money values are stored as exact integers, like USD cents ($12.34 as 1234) and
                    whole riel (៛45,000 as 45000), eliminating floating-point rounding errors
                    common in generic web spreadsheets.
                  </p>
                </div>
                <div className="feature-visual-dual" aria-hidden="true">
                  <div className="dual-box">
                    <div className="dual-box-header">
                      <span className="dual-box-title">Cash & Bank Accounts</span>
                      <Badge variant="usd">USD</Badge>
                    </div>
                    <div className="dual-box-val tabular-nums">$2,450.50</div>
                    <div className="dual-box-note">Stored with 2 decimal precision (cents)</div>
                  </div>
                  <div className="dual-box">
                    <div className="dual-box-header">
                      <span className="dual-box-title">E-Wallets & Local Cash</span>
                      <Badge variant="khr">KHR</Badge>
                    </div>
                    <div className="dual-box-val tabular-nums">៛1,850,000</div>
                    <div className="dual-box-note">Stored with whole riel precision</div>
                  </div>
                </div>
              </article>

              {/* Feature Pair 1: Quick Transactions + Category Budgets */}
              <div className="features-grid-pair">
                <article className="feature-split-card">
                  <div className="feature-icon-header">
                    <div className="feature-icon-box">
                      <Layers size={18} aria-hidden="true" />
                    </div>
                    <h3 className="feature-heading-compact">Quick Transaction Tracking</h3>
                  </div>
                  <p className="feature-desc">
                    Log expenses and income with category, account, date, and note in seconds.
                    Balances update instantaneously upon saving.
                  </p>
                  <ul className="feature-details-list">
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Instant balance adjustment across cash, banks, and e-wallets</span>
                    </li>
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Transfers between same-currency accounts without inflating income or expense</span>
                    </li>
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Customizable categories with individual icons</span>
                    </li>
                  </ul>
                </article>

                <article className="feature-split-card">
                  <div className="feature-icon-header">
                    <div className="feature-icon-box">
                      <AlertCircle size={18} aria-hidden="true" />
                    </div>
                    <h3 className="feature-heading-compact">Category-Based Monthly Budgets</h3>
                  </div>
                  <p className="feature-desc">
                    Set spending limits for individual categories in USD or KHR. Track used amounts
                    and receive proactive warnings before exceeding limits.
                  </p>
                  <ul className="feature-details-list">
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Automatic visual warning triggered at 80% utilization</span>
                    </li>
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Distinct alert state when a monthly budget is exceeded</span>
                    </li>
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Budgets in one currency never interfere with budgets in another</span>
                    </li>
                  </ul>
                </article>
              </div>

              {/* Feature Pair 2: Reports + Backup & Restore */}
              <div className="features-grid-pair">
                <article className="feature-split-card">
                  <div className="feature-icon-header">
                    <div className="feature-icon-box">
                      <PieChart size={18} aria-hidden="true" />
                    </div>
                    <h3 className="feature-heading-compact">Clear Spending Reports</h3>
                  </div>
                  <p className="feature-desc">
                    Review your financial health through monthly income versus expense summaries and
                    proportional category distributions.
                  </p>
                  <ul className="feature-details-list">
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Breakdown by category shows your largest spending areas</span>
                    </li>
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Month-to-month net savings calculation per currency</span>
                    </li>
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Export all transaction data to CSV for spreadsheet analysis</span>
                    </li>
                  </ul>
                </article>

                <article className="feature-split-card">
                  <div className="feature-icon-header">
                    <div className="feature-icon-box">
                      <Download size={18} aria-hidden="true" />
                    </div>
                    <h3 className="feature-heading-compact">Data Export and Safe Restore</h3>
                  </div>
                  <p className="feature-desc">
                    You have complete ownership of your records. Export versioned JSON backups
                    anytime and restore them reliably on any device running PocketFlow.
                  </p>
                  <ul className="feature-details-list">
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>One-click full JSON database export (accounts, transactions, budgets)</span>
                    </li>
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>Zod schema validation protects against corrupted backup imports</span>
                    </li>
                    <li className="feature-details-item">
                      <CheckCircle size={14} className="feature-check-icon" aria-hidden="true" />
                      <span>No vendor lock-in or proprietary cloud formats</span>
                    </li>
                  </ul>
                </article>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Local-First Privacy & Trade-Offs Section */}
        <section className="landing-section" id="privacy" aria-labelledby="privacy-heading">
          <div className="landing-container">
            <div className="section-head-wrap">
              <div className="section-eyebrow">Privacy & Architecture</div>
              <h2 id="privacy-heading" className="section-main-heading">
                Your financial records stay in your browser
              </h2>
              <p className="section-subtext">
                PocketFlow operates without a backend database or user accounts. We believe personal
                finances should be private by default.
              </p>
            </div>

            <div className="privacy-grid">
              {/* How it works */}
              <div className="privacy-card">
                <div className="privacy-card-header">
                  <Shield size={20} color="var(--income-color)" aria-hidden="true" />
                  <h3 className="privacy-card-title">How Local-First Works</h3>
                </div>
                <ul className="privacy-card-points">
                  <li className="privacy-point">
                    <CheckCircle size={15} color="var(--income-color)" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>
                      <strong>Browser IndexedDB database:</strong> All accounts, budgets, and
                      transactions are stored directly inside your browser storage via Dexie.
                    </span>
                  </li>
                  <li className="privacy-point">
                    <CheckCircle size={15} color="var(--income-color)" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>
                      <strong>No mandatory accounts or servers:</strong> There is no registration
                      flow, no email address required, and no remote database holding your balance
                      records.
                    </span>
                  </li>
                  <li className="privacy-point">
                    <CheckCircle size={15} color="var(--income-color)" style={{ flexShrink: 0, marginTop: 3 }} />
                    <span>
                      <strong>Zero network transmission:</strong> Financial entries are never sent
                      over the internet during normal usage. The application works completely
                      offline.
                    </span>
                  </li>
                </ul>
                <div className="privacy-note-callout privacy-note-safe">
                  PocketFlow does not collect telemetry, run marketing tracking scripts, or transmit
                  your spending logs.
                </div>
              </div>

              {/* The Honest Trade-Offs */}
              <div className="privacy-card">
                <div className="privacy-card-header">
                  <AlertCircle size={20} color="var(--warning-color)" aria-hidden="true" />
                  <h3 className="privacy-card-title">Honest Trade-offs & Backup Care</h3>
                </div>
                <ul className="privacy-card-points">
                  <li className="privacy-point">
                    <span style={{ color: 'var(--warning-color)', fontWeight: 700 }}>•</span>
                    <span>
                      <strong>No automatic synchronization:</strong> Because PocketFlow has no
                      cloud server, transactions added on your phone will not appear automatically
                      on your desktop computer.
                    </span>
                  </li>
                  <li className="privacy-point">
                    <span style={{ color: 'var(--warning-color)', fontWeight: 700 }}>•</span>
                    <span>
                      <strong>Browser data clearing risk:</strong> If you explicitly clear your
                      browser's website storage or wipe your device, local records will be erased.
                    </span>
                  </li>
                  <li className="privacy-point">
                    <span style={{ color: 'var(--warning-color)', fontWeight: 700 }}>•</span>
                    <span>
                      <strong>Local storage is not encrypted:</strong> Financial records are stored
                      unencrypted in the browser database. Protection relies on your operating
                      system and device access controls.
                    </span>
                  </li>
                </ul>
                <div className="privacy-note-callout privacy-note-warn">
                  <strong>Recommendation:</strong> Periodically download a JSON backup from the
                  Settings page so you always have a copy saved to safe personal storage.
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Getting Started (3-Step Workflow) */}
        <section className="landing-section" id="how-it-works" aria-labelledby="steps-heading">
          <div className="landing-container">
            <div className="section-head-wrap">
              <div className="section-eyebrow">Getting Started</div>
              <h2 id="steps-heading" className="section-main-heading">
                Start tracking in three simple steps
              </h2>
              <p className="section-subtext">
                Getting started takes under a minute. No setup wizard or configuration forms.
              </p>
            </div>

            <div className="steps-row">
              <div className="step-card">
                <div className="step-number-badge">1</div>
                <h3 className="step-title">Set up your accounts</h3>
                <p className="step-text">
                  Create cash wallets, bank accounts, or e-wallets in either USD or KHR with your
                  starting balance.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number-badge">2</div>
                <h3 className="step-title">Record income and expenses</h3>
                <p className="step-text">
                  Add transactions in a few clicks. Select the category, enter the amount, and watch
                  your balances update instantly.
                </p>
              </div>

              <div className="step-card">
                <div className="step-number-badge">3</div>
                <h3 className="step-title">Review spending and budgets</h3>
                <p className="step-text">
                  Keep tabs on category budgets, examine monthly reports, and export your records
                  whenever you want a backup.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Frequently Asked Questions */}
        <section className="landing-section" id="faq" aria-labelledby="faq-heading">
          <div className="landing-container">
            <div className="section-head-wrap">
              <div className="section-eyebrow">Questions & Answers</div>
              <h2 id="faq-heading" className="section-main-heading">
                Frequently asked questions
              </h2>
              <p className="section-subtext">
                Clear answers based directly on how PocketFlow works.
              </p>
            </div>

            <div className="faq-list">
              <details className="faq-item">
                <summary className="faq-summary">
                  <span>Is PocketFlow free to use?</span>
                  <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                </summary>
                <div className="faq-content">
                  <p>
                    Yes. PocketFlow is completely free and runs directly in your browser with no
                    subscription, paywall, or premium tiers.
                  </p>
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-summary">
                  <span>Does it support both USD and Cambodian riel (KHR)?</span>
                  <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                </summary>
                <div className="faq-content">
                  <p>
                    Yes. PocketFlow is specifically designed for dual-currency use. USD amounts are
                    stored in cents, KHR amounts in whole riel, and their balances and reports are
                    kept strictly separate so totals remain authentic.
                  </p>
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-summary">
                  <span>Where is my financial data stored?</span>
                  <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                </summary>
                <div className="faq-content">
                  <p>
                    All accounts, transactions, categories, and budgets are stored locally on your
                    device in your browser's IndexedDB database via Dexie. No data is sent to a
                    cloud server.
                  </p>
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-summary">
                  <span>Does PocketFlow synchronize between devices?</span>
                  <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                </summary>
                <div className="faq-content">
                  <p>
                    No. Because PocketFlow has no central backend server, data does not
                    automatically sync between your phone and computer. You can move your records
                    manually between devices using the JSON export and restore tools in Settings.
                  </p>
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-summary">
                  <span>What happens if I clear my browser data?</span>
                  <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                </summary>
                <div className="faq-content">
                  <p>
                    Clearing your browser's site data or storage will delete your local database. We
                    strongly recommend regularly downloading a JSON backup file from the Settings
                    page so you have a copy safely stored on your device.
                  </p>
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-summary">
                  <span>Can I export my financial records?</span>
                  <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                </summary>
                <div className="faq-content">
                  <p>
                    Yes. PocketFlow supports two export formats: a full JSON database backup for
                    restoring into PocketFlow, and a CSV export for analyzing your transactions in
                    Excel, Numbers, or Google Sheets.
                  </p>
                </div>
              </details>

              <details className="faq-item">
                <summary className="faq-summary">
                  <span>Is my financial data encrypted?</span>
                  <ChevronDown size={18} className="faq-chevron" aria-hidden="true" />
                </summary>
                <div className="faq-content">
                  <p>
                    No database-level encryption is implemented. Data is saved in standard browser
                    IndexedDB storage. Your records are protected by your device's operating system
                    and profile security.
                  </p>
                </div>
              </details>
            </div>
          </div>
        </section>

        {/* 8. Final Call to Action */}
        <section className="landing-final-cta" aria-labelledby="final-cta-heading">
          <div className="landing-container">
            <div className="final-cta-content">
              <h2 id="final-cta-heading" className="final-cta-heading">
                Take control of your spending today.
              </h2>
              <p className="final-cta-sub">
                Open PocketFlow directly in your browser. No registration, no email address, and no
                cloud backend.
              </p>
              <div className="final-cta-actions">
                <button
                  type="button"
                  className="btn btn-primary hero-btn-primary"
                  onClick={handleStartTracking}
                >
                  <span>Open PocketFlow</span>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 9. Footer */}
      <footer className="landing-footer" role="contentinfo">
        <div className="landing-container">
          <div className="footer-top">
            <div className="footer-brand-col">
              <div className="footer-brand-title">
                <img
                  src="/App icon only.png"
                  alt="PocketFlow logo"
                  style={{ width: 24, height: 24, borderRadius: '28%', objectFit: 'contain' }}
                />
                <span>PocketFlow</span>
              </div>
              <p className="footer-desc">
                A simple, private, local-first personal finance app for tracking income, expenses,
                accounts, and budgets.
              </p>
            </div>

            <nav className="footer-nav-links" aria-label="Footer Navigation">
              <button
                type="button"
                className="footer-nav-link"
                onClick={() => scrollToSection('features')}
              >
                Features
              </button>
              <button
                type="button"
                className="footer-nav-link"
                onClick={() => scrollToSection('preview')}
              >
                Product Preview
              </button>
              <button
                type="button"
                className="footer-nav-link"
                onClick={() => scrollToSection('privacy')}
              >
                Privacy
              </button>
              <button
                type="button"
                className="footer-nav-link"
                onClick={() => scrollToSection('faq')}
              >
                FAQ
              </button>
              <button
                type="button"
                className="footer-nav-link"
                onClick={handleStartTracking}
                style={{ color: 'var(--accent-brand)', fontWeight: 600 }}
              >
                Open Application →
              </button>
            </nav>
          </div>

          <div className="footer-bottom">
            <span>Local-first architecture · Dual-currency USD & KHR · IndexedDB storage</span>
            <span>No cookies · No tracking scripts · No central server</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
