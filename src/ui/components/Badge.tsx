import React from 'react';

export interface BadgeProps {
  variant?: 'usd' | 'khr' | 'success' | 'warning' | 'danger' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  className = '',
}) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'usd':
        return 'badge-usd';
      case 'khr':
        return 'badge-khr';
      case 'warning':
        return 'badge-warning';
      case 'danger':
        return 'badge-danger';
      case 'success':
        return '';
      default:
        return '';
    }
  };

  const getCustomStyle = (): React.CSSProperties => {
    if (variant === 'success') {
      return {
        backgroundColor: 'var(--income-bg)',
        color: 'var(--income-color)',
        border: '1px solid var(--income-border)',
      };
    }
    if (variant === 'neutral') {
      return {
        backgroundColor: 'var(--bg-subtle)',
        color: 'var(--text-secondary)',
        border: '1px solid var(--border-subtle)',
      };
    }
    return {};
  };

  return (
    <span
      className={`badge ${getVariantClass()} ${className}`.trim()}
      style={getCustomStyle()}
    >
      {children}
    </span>
  );
};
