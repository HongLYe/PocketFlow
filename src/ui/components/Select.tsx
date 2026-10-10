import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      id,
      className = '',
      children,
      required,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className="form-group">
        {label && (
          <label className="form-label" htmlFor={selectId}>
            {label}
            {required && <span style={{ color: 'var(--expense-color)', marginLeft: 3 }}>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`form-select ${className}`}
          style={{
            width: '100%',
            borderColor: error ? 'var(--expense-color)' : undefined,
          }}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          required={required}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
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

Select.displayName = 'Select';
