/**
 * PocketFlow Financial Domain: Money & Currency
 * 
 * Rules:
 * 1. Zero floating-point arithmetic.
 * 2. USD stored in minor units (cents, integer). $12.34 -> 1234.
 * 3. KHR stored in minor units (whole riel, integer). ៛45,000 -> 45000.
 * 4. Never mix USD and KHR in mathematical operations without explicit conversion.
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
 * Parses user string input into minor units (integer).
 * Rejects negative numbers or invalid values.
 */
export function parseToMinor(input: string | number, currency: Currency): number {
  if (typeof input === 'number') {
    if (isNaN(input) || !isFinite(input) || input < 0) {
      throw new Error(`Invalid positive amount: ${input}`);
    }
    const decimals = CURRENCY_CONFIG[currency].decimals;
    return Math.round(input * Math.pow(10, decimals));
  }

  const clean = input.trim().replace(/,/g, '');
  if (!clean || clean.startsWith('-')) {
    throw new Error(`Invalid amount string: "${input}". Negative amounts are not allowed.`);
  }

  const num = Number(clean);
  if (isNaN(num) || !isFinite(num) || num < 0) {
    throw new Error(`Could not parse amount: "${input}"`);
  }

  const decimals = CURRENCY_CONFIG[currency].decimals;
  if (decimals === 0) {
    return Math.round(num);
  }

  // Multiply by 10^decimals safely
  return Math.round(num * Math.pow(10, decimals));
}

/**
 * Formats a minor-unit integer for display.
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
  const absMinor = Math.abs(amountMinor);
  
  const majorValue = config.decimals > 0 
    ? absMinor / Math.pow(10, config.decimals)
    : absMinor;

  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(majorValue);

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
    // Cambodian Riel commonly displays symbol before or after
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
