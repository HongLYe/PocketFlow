/**
 * PocketFlow Route Definitions
 */

export const ROUTES = {
  LANDING: '/',
  DASHBOARD: '/app',
  ACCOUNTS: '/accounts',
  TRANSACTIONS: '/transactions',
  BUDGETS: '/budgets',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];

