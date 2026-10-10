import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  BarChart3,
  Settings,
  Plus,
} from 'lucide-react';
import { Link } from '../routing/router';
import { ROUTES } from '../routing/routes';
import { Button } from '../components/Button';

export interface SidebarProps {
  onNewTransaction: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNewTransaction }) => {
  const navItems = [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { to: ROUTES.TRANSACTIONS, label: 'Transactions', icon: Receipt },
    { to: ROUTES.BUDGETS, label: 'Budgets', icon: PiggyBank },
    { to: ROUTES.REPORTS, label: 'Reports', icon: BarChart3 },
    { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="sidebar" aria-label="Main Navigation">
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
            aria-hidden="true"
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
            <Link key={item.to} to={item.to} className="nav-item">
              <IconComponent size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: 16, borderTop: '1px solid var(--border-subtle)' }}>
        <Button
          variant="primary"
          style={{ width: '100%' }}
          onClick={onNewTransaction}
          leftIcon={<Plus size={16} />}
        >
          New Transaction
        </Button>
      </div>
    </aside>
  );
};
