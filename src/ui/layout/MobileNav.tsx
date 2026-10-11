import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Receipt,
  PiggyBank,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Link } from '../routing/router';
import { ROUTES } from '../routing/routes';

export const MobileNav: React.FC = () => {
  const navItems = [
    { to: ROUTES.DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
    { to: ROUTES.ACCOUNTS, label: 'Accounts', icon: Wallet },
    { to: ROUTES.TRANSACTIONS, label: 'Txns', fullLabel: 'Transactions', icon: Receipt },
    { to: ROUTES.BUDGETS, label: 'Budgets', icon: PiggyBank },
    { to: ROUTES.REPORTS, label: 'Reports', icon: BarChart3 },
    { to: ROUTES.SETTINGS, label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className="mobile-nav-item"
            title={item.fullLabel || item.label}
            aria-label={item.fullLabel || item.label}
          >
            <IconComponent size={18} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
