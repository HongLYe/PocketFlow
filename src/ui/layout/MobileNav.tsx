import React from 'react';
import {
  LayoutDashboard,
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
    { to: ROUTES.TRANSACTIONS, label: 'Transactions', icon: Receipt },
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
          >
            <IconComponent size={20} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};
