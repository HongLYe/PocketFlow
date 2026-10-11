/**
 * PocketFlow Financial Domain: Money & Currency
 * 
 * Rules:
 * 1. Zero floating-point arithmetic for stored money or calculations.
 * 2. USD stored in minor units (cents, integer). $12.34 -> 1234.
 * 3. KHR stored in minor units (whole riel, integer). ៛45,000 -> 45000.
 * 4. Never mix USD and KHR in mathematical operations without explicit conversion.
 * 5. Validate amounts and decimal precision strictly before conversion.
 */

export type Currency = 'USD' | 'KHR';

export interface Money {
  readonly amountMinor: number;
  readonly currency: Currency;
}

export const CURRENCY_CONFIG: Record<
  Currency,
  {
    code: Currency;
    symbol: string;
    decimals: number;
    name: string;
  }
> = {
  USD: {
    code: 'USD',
    symbol: '$',
    decimals: 2,
    name: 'US Dollar',
  },
  KHR: {
    code: 'KHR',
    symbol: '៛',
    decimals: 0,
    name: 'Cambodian Riel',
  },
};

/**
 * Returns a local date string in YYYY-MM-DD format.
 * Prevents accidental day shifts caused by UTC conversion.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses user input into minor units (integer cents or riel).
 * Strict decimal precision validation:
 * - USD: max 2 decimal places ($12.34 -> 1234)
 * - KHR: 0 decimal places (៛45,000 -> 45000)
 * Rejects negative numbers, invalid characters, and excess decimals without float math.
 */
export function parseToMinor(input: string | number, currency: Currency): number {
  if (input === null || input === undefined) {
    throw new Error('Amount cannot be null or undefined');
  }

  const rawStr = typeof input === 'number' ? input.toString() : String(input);
  const clean = rawStr.trim().replace(/,/g, '');

  if (!clean) {
    throw new Error('Amount string cannot be empty');
  }

  if (clean.startsWith('-')) {
    throw new Error(`Invalid amount: "${input}". Negative amounts are not allowed.`);
  }

  // Must match positive numbers (e.g. "123", "123.45", "0.99")
  if (!/^\d+(\.\d+)?$/.test(clean)) {
    throw new Error(`Invalid amount format: "${input}". Must be a valid positive number.`);
  }

  const [wholeStr, fracStr = ''] = clean.split('.');
  const config = CURRENCY_CONFIG[currency];

  // Validate decimal precision
  if (config.decimals === 0) {
    if (fracStr.length > 0 && fracStr !== '0' && fracStr !== '00') {
      throw new Error(
        `${currency} does not support fractional units. Received "${clean}".`
      );
    }
    const wholeNum = parseInt(wholeStr, 10);
    if (!Number.isSafeInteger(wholeNum)) {
      throw new Error(`Amount exceeds safe integer limits: "${input}"`);
    }
    return wholeNum;
  }

  // For USD (decimals = 2)
  if (fracStr.length > config.decimals) {
    throw new Error(
      `${currency} allows at most ${config.decimals} decimal places. Received "${clean}".`
    );
  }

  const paddedFrac = fracStr.padEnd(config.decimals, '0');
  const wholeVal = parseInt(wholeStr, 10);
  const fracVal = parseInt(paddedFrac, 10);

  const totalMinor = wholeVal * 100 + fracVal;
  if (!Number.isSafeInteger(totalMinor) || totalMinor < 0) {
    throw new Error(`Amount exceeds safe integer limits: "${input}"`);
  }

  return totalMinor;
}

/**
 * Formats a minor-unit integer for display without floating-point division.
 * Example: 1234, 'USD' -> "$12.34"
 * Example: 45000, 'KHR' -> "៛45,000"
 */
export function formatMoney(
  amountMinor: number,
  currency: Currency,
  options: {
    showSign?: boolean;
    includeSymbol?: boolean;
    forcePositive?: boolean;
  } = {}
): string {
  const { showSign = false, includeSymbol = true, forcePositive = false } = options;
  const config = CURRENCY_CONFIG[currency];
  const isNegative = amountMinor < 0;
  const absMinor = Math.abs(Math.round(amountMinor));

  let formattedNumber = '';
  if (config.decimals === 0) {
    formattedNumber = new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(absMinor);
  } else {
    const whole = Math.floor(absMinor / 100);
    const cents = String(absMinor % 100).padStart(2, '0');
    const wholeFormatted = new Intl.NumberFormat('en-US').format(whole);
    formattedNumber = `${wholeFormatted}.${cents}`;
  }

  let signPrefix = '';
  if (!forcePositive) {
    if (isNegative) {
      signPrefix = '-';
    } else if (showSign && amountMinor > 0) {
      signPrefix = '+';
    }
  }

  if (!includeSymbol) {
    return `${signPrefix}${formattedNumber}`;
  }

  if (currency === 'KHR') {
    return `${signPrefix}៛${formattedNumber}`;
  }

  return `${signPrefix}$${formattedNumber}`;
}

/**
 * Safe integer math operations
 */
export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot add amounts with different currencies: ${a.currency} and ${b.currency}. Convert first.`
    );
  }
  return {
    amountMinor: a.amountMinor + b.amountMinor,
    currency: a.currency,
  };
}

export function subtractMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(
      `Cannot subtract amounts with different currencies: ${a.currency} and ${b.currency}.`
    );
  }
  return {
    amountMinor: a.amountMinor - b.amountMinor,
    currency: a.currency,
  };
}
