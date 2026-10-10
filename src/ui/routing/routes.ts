/**
 * PocketFlow Route Definitions
 */

export const ROUTES = {
  DASHBOARD: '/',
  TRANSACTIONS: '/transactions',
  BUDGETS: '/budgets',
  REPORTS: '/reports',
  SETTINGS: '/settings',
} as const;

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES];
