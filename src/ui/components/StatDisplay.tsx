import React from 'react';
import type { Currency } from '../../domain/money/money';
import { formatMoney } from '../../domain/money/money';
import { Badge } from './Badge';

export interface StatDisplayProps {
  label: string;
  amountMinor: number;
  currency: Currency;
  subtext?: React.ReactNode;
  trend?: 'positive' | 'negative' | 'neutral';
  accentColor?: string;
  showSign?: boolean;
}

export const StatDisplay: React.FC<StatDisplayProps> = ({
  label,
  amountMinor,
  currency,
  subtext,
  trend,
  accentColor,
  showSign = false,
}) => {
  const getTrendColor = () => {
    if (trend === 'positive') return 'var(--income-color)';
    if (trend === 'negative') return 'var(--expense-color)';
    return 'inherit';
  };

  return (
    <div
      className="stat-box"
      style={{
        borderLeft: accentColor ? `4px solid ${accentColor}` : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="stat-label">{label}</span>
        <Badge variant={currency === 'USD' ? 'usd' : 'khr'}>{currency}</Badge>
      </div>
      <div className="stat-value" style={{ color: getTrendColor() }}>
        {formatMoney(amountMinor, currency, { showSign })}
      </div>
      {subtext && <div className="stat-sub">{subtext}</div>}
    </div>
  );
};
