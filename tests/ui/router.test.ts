import { describe, it, expect } from 'vitest';
import { ROUTES } from '../../src/ui/routing/routes';

describe('PocketFlow Routing Definitions', () => {
  it('defines distinct routes for all main destinations', () => {
    expect(ROUTES.LANDING).toBe('/');
    expect(ROUTES.DASHBOARD).toBe('/app');
    expect(ROUTES.ACCOUNTS).toBe('/accounts');
    expect(ROUTES.TRANSACTIONS).toBe('/transactions');
    expect(ROUTES.BUDGETS).toBe('/budgets');
    expect(ROUTES.REPORTS).toBe('/reports');
    expect(ROUTES.SETTINGS).toBe('/settings');
  });

  it('guarantees each route path is unique', () => {
    const paths = Object.values(ROUTES);
    const unique = new Set(paths);
    expect(unique.size).toBe(paths.length);
  });

  it('correctly identifies valid vs unknown routes', () => {
    const validRoutes = new Set(Object.values(ROUTES));
    expect(validRoutes.has('/')).toBe(true);
    expect(validRoutes.has('/app')).toBe(true);
    expect(validRoutes.has('/accounts')).toBe(true);
    expect(validRoutes.has('/transactions')).toBe(true);
    expect(validRoutes.has('/budgets')).toBe(true);
    expect(validRoutes.has('/reports')).toBe(true);
    expect(validRoutes.has('/settings')).toBe(true);

    // Unknown routes must not match
    expect(validRoutes.has('/unknown' as any)).toBe(false);
    expect(validRoutes.has('/404' as any)).toBe(false);
    expect(validRoutes.has('/admin' as any)).toBe(false);
  });
});

