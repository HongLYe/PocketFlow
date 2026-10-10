import React from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface AlertProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  onClose,
  className = '',
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle2 size={18} />;
      case 'error':
        return <AlertCircle size={18} />;
      case 'warning':
        return <AlertTriangle size={18} />;
      case 'info':
        return <Info size={18} />;
    }
  };

  const getStyles = () => {
    switch (variant) {
      case 'success':
        return {
          bg: 'var(--income-bg)',
          color: 'var(--income-color)',
          border: 'var(--income-border)',
        };
      case 'error':
        return {
          bg: 'var(--expense-bg)',
          color: 'var(--expense-color)',
          border: 'var(--expense-border)',
        };
      case 'warning':
        return {
          bg: 'var(--warning-bg)',
          color: 'var(--warning-color)',
          border: 'var(--warning-border)',
        };
      case 'info':
        return {
          bg: 'var(--bg-subtle)',
          color: 'var(--text-primary)',
          border: 'var(--border-default)',
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      role="alert"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: styles.bg,
        color: styles.color,
        border: `1px solid ${styles.border}`,
        fontSize: '0.88rem',
      }}
    >
      <div style={{ flexShrink: 0, marginTop: title ? 2 : 0 }}>{getIcon()}</div>
      <div style={{ flex: 1 }}>
        {title && (
          <h4 style={{ fontWeight: 600, marginBottom: 2, fontSize: '0.92rem' }}>
            {title}
          </h4>
        )}
        <div style={{ color: variant === 'info' ? 'var(--text-secondary)' : 'inherit' }}>
          {children}
        </div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss alert"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: 2,
            opacity: 0.7,
          }}
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
};
