import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';
import { Link } from '../routing/router';
import { ROUTES } from '../routing/routes';
import { Button } from '../components/Button';
import { APP_VERSION } from '../../config/version';

export interface SidebarProps {
  onNewTransaction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewTransaction }) => {
  const navItems = [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { to: ROUTES.ACCOUNTS, label: 'Accounts', icon: Wallet },
    { to: ROUTES.TRANSACTIONS, label: 'Transactions', icon: Receipt },
    { to: ROUTES.BUDGETS, label: 'Budgets', icon: PiggyBank },
    { to: ROUTES.REPORTS, label: 'Reports', icon: BarChart3 },
    { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar" aria-label="Main Navigation">
      <div className="sidebar-header">
        <Link to={ROUTES.LANDING} className="sidebar-logo" style={{ textDecoration: 'none' }} title="View PocketFlow landing page">
          <img
            src="/App icon only.png"
            alt="PocketFlow Logo"
            style={{
              width: 26,
              height: 26,
              borderRadius: '28%',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <span>PocketFlow</span>
          <span
            style={{
              fontSize: '0.68rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
              padding: '1px 6px',
              backgroundColor: 'var(--color-canvas-soft)',
              borderRadius: '9999px',
              border: '1px solid var(--color-hairline-soft)',
              marginLeft: 'auto',
              fontWeight: 500,
            }}
          >
            {APP_VERSION}
          </span>
        </Link>
        <div className="sidebar-tagline">
          Local money tracker (USD & KHR)
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link key={item.to} to={item.to} className="nav-item">
              <IconComponent size={17} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Button
          variant="primary"
          style={{ width: '100%' }}
          onClick={onNewTransaction}
          leftIcon={<Plus size={15} />}
        >
          New Transaction
        </Button>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
          <Link
            to={ROUTES.LANDING}
            style={{
              fontSize: '0.74rem',
              color: 'var(--text-muted)',
              textDecoration: 'none',
              padding: '2px 4px',
            }}
          >
            ← Landing Page
          </Link>
          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              fontFamily: 'monospace',
            }}
          >
            {APP_VERSION}
          </span>
        </div>
      </div>
    </aside>
  );
};
