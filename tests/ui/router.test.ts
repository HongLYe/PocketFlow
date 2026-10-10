import { describe, it, expect } from 'vitest';
import { ROUTES } from '../../src/ui/routing/routes';

describe('PocketFlow Routing Definitions', () => {
  it('defines distinct routes for all main destinations', () => {
    expect(ROUTES.DASHBOARD).toBe('/');
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
});
