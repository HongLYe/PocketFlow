import { describe, it, expect } from 'vitest';
import {
  parseToMinor,
  formatMoney,
  addMoney,
  subtractMoney,
  getLocalDateString,
} from '../../src/domain/money/money';

describe('PocketFlow Money & Currency Domain Logic', () => {
  it('correctly parses USD string inputs into minor cents', () => {
    expect(parseToMinor('12.34', 'USD')).toBe(1234);
    expect(parseToMinor('0.99', 'USD')).toBe(99);
    expect(parseToMinor('100', 'USD')).toBe(10000);
    expect(parseToMinor('1,250.50', 'USD')).toBe(125050);
    expect(parseToMinor('12.3', 'USD')).toBe(1230); // 1 decimal padded
    expect(parseToMinor('0', 'USD')).toBe(0);
  });

  it('correctly parses KHR string inputs into whole riel minor units', () => {
    expect(parseToMinor('45000', 'KHR')).toBe(45000);
    expect(parseToMinor('1,000,000', 'KHR')).toBe(1000000);
    expect(parseToMinor('500', 'KHR')).toBe(500);
    expect(parseToMinor('0', 'KHR')).toBe(0);
  });

  it('rejects decimal precision violations strictly without float rounding', () => {
    // USD allows at most 2 decimal places
    expect(() => parseToMinor('12.345', 'USD')).toThrow(/allows at most 2 decimal places/);
    expect(() => parseToMinor('0.1234', 'USD')).toThrow(/allows at most 2 decimal places/);

    // KHR allows 0 decimal places (whole riel only)
    expect(() => parseToMinor('45000.5', 'KHR')).toThrow(/does not support fractional units/);
    expect(() => parseToMinor('100.25', 'KHR')).toThrow(/does not support fractional units/);
  });

  it('rejects negative numbers and invalid inputs', () => {
    expect(() => parseToMinor('-10', 'USD')).toThrow(/Negative amounts are not allowed/);
    expect(() => parseToMinor('-0.01', 'USD')).toThrow(/Negative amounts are not allowed/);
    expect(() => parseToMinor('-5000', 'KHR')).toThrow(/Negative amounts are not allowed/);
    expect(() => parseToMinor('abc', 'USD')).toThrow(/Invalid amount format/);
    expect(() => parseToMinor('', 'USD')).toThrow(/Amount string cannot be empty/);
    expect(() => parseToMinor('12.34.56', 'USD')).toThrow(/Invalid amount format/);
  });

  it('formats USD with two decimal places and $ symbol', () => {
    expect(formatMoney(1234, 'USD')).toBe('$12.34');
    expect(formatMoney(0, 'USD')).toBe('$0.00');
    expect(formatMoney(50, 'USD')).toBe('$0.50');
    expect(formatMoney(-1234, 'USD')).toBe('-$12.34');
    expect(formatMoney(1234, 'USD', { showSign: true })).toBe('+$12.34');
    expect(formatMoney(1234, 'USD', { includeSymbol: false })).toBe('12.34');
    expect(formatMoney(-1234, 'USD', { includeSymbol: false })).toBe('-12.34');
  });

  it('formats KHR with no decimal places and ៛ symbol', () => {
    expect(formatMoney(45000, 'KHR')).toBe('៛45,000');
    expect(formatMoney(0, 'KHR')).toBe('៛0');
    expect(formatMoney(-50000, 'KHR')).toBe('-៛50,000');
    expect(formatMoney(45000, 'KHR', { showSign: true })).toBe('+៛45,000');
    expect(formatMoney(45000, 'KHR', { includeSymbol: false })).toBe('45,000');
  });

  it('performs safe addition and subtraction within the same currency', () => {
    const a = { amountMinor: 1000, currency: 'USD' as const };
    const b = { amountMinor: 500, currency: 'USD' as const };
    expect(addMoney(a, b)).toEqual({ amountMinor: 1500, currency: 'USD' });
    expect(subtractMoney(a, b)).toEqual({ amountMinor: 500, currency: 'USD' });
  });

  it('refuses to add or subtract across different currencies', () => {
    const usd = { amountMinor: 1000, currency: 'USD' as const };
    const khr = { amountMinor: 40000, currency: 'KHR' as const };
    expect(() => addMoney(usd, khr)).toThrow(/different currencies/);
    expect(() => subtractMoney(usd, khr)).toThrow(/different currencies/);
  });

  it('generates local date strings in YYYY-MM-DD format avoiding UTC shift', () => {
    const localDateStr = getLocalDateString(new Date(2026, 9, 15)); // Month is 0-indexed (9 = Oct)
    expect(localDateStr).toBe('2026-10-15');
    expect(getLocalDateString()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

