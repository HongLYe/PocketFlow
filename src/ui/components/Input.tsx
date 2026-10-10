import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftAddon,
      rightAddon,
      id,
      className = '',
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="form-group">
        {label && (
          <label className="form-label" htmlFor={inputId}>
            {label}
            {required && <span style={{ color: 'var(--expense-color)', marginLeft: 3 }}>*</span>}
          </label>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftAddon && (
            <span
              style={{
                position: 'absolute',
                left: 10,
                color: 'var(--text-muted)',
                fontWeight: 600,
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {leftAddon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`form-input ${className}`}
            style={{
              width: '100%',
              paddingLeft: leftAddon ? 32 : 12,
              paddingRight: rightAddon ? 32 : 12,
              borderColor: error ? 'var(--expense-color)' : undefined,
            }}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            required={required}
            {...props}
          />
          {rightAddon && (
            <span
              style={{
                position: 'absolute',
                right: 10,
                color: 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {rightAddon}
            </span>
          )}
        </div>
        {error && (
          <span
            id={errorId}
            style={{ fontSize: '0.78rem', color: 'var(--expense-color)', marginTop: 2 }}
            role="alert"
          >
            {error}
          </span>
        )}
        {!error && helperText && (
          <span id={helperId} style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
