import { describe, it, expect } from 'vitest';
import { parseToMinor, formatMoney, addMoney, subtractMoney } from '../../src/domain/money/money';

describe('PocketFlow Money & Currency Domain Logic', () => {
  it('correctly parses USD string inputs into minor cents', () => {
    expect(parseToMinor('12.34', 'USD')).toBe(1234);
    expect(parseToMinor('0.99', 'USD')).toBe(99);
    expect(parseToMinor('100', 'USD')).toBe(10000);
    expect(parseToMinor('1,250.50', 'USD')).toBe(125050);
  });

  it('correctly parses KHR string inputs into whole riel minor units', () => {
    expect(parseToMinor('45000', 'KHR')).toBe(45000);
    expect(parseToMinor('1,000,000', 'KHR')).toBe(1000000);
    expect(parseToMinor('500', 'KHR')).toBe(500);
  });

  it('rejects negative numbers and invalid inputs', () => {
    expect(() => parseToMinor('-10', 'USD')).toThrow();
    expect(() => parseToMinor('abc', 'USD')).toThrow();
    expect(() => parseToMinor(-5, 'KHR')).toThrow();
  });

  it('formats USD with two decimal places and $ symbol', () => {
    expect(formatMoney(1234, 'USD')).toBe('$12.34');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
    expect(formatMoney(50, 'USD')).toBe('$0.50');
    expect(formatMoney(-1234, 'USD')).toBe('-$12.34');
    expect(formatMoney(1234, 'USD', { showSign: true })).toBe('+$12.34');
  });

  it('formats KHR with no decimal places and ៛ symbol', () => {
    expect(formatMoney(45000, 'KHR')).toBe('៛45,000');
    expect(formatMoney(0, 'KHR')).toBe('៛0');
    expect(formatMoney(-50000, 'KHR')).toBe('-៛50,000');
    expect(formatMoney(45000, 'KHR', { showSign: true })).toBe('+៛45,000');
  });

  it('performs safe addition within the same currency', () => {
    const a = { amountMinor: 1000, currency: 'USD' as const };
    const b = { amountMinor: 500, currency: 'USD' as const };
    expect(addMoney(a, b)).toEqual({ amountMinor: 1500, currency: 'USD' });
  });

  it('refuses to add or subtract across different currencies', () => {
    const usd = { amountMinor: 1000, currency: 'USD' as const };
    const khr = { amountMinor: 40000, currency: 'KHR' as const };
    expect(() => addMoney(usd, khr)).toThrow(/different currencies/);
    expect(() => subtractMoney(usd, khr)).toThrow(/different currencies/);
  });
});
