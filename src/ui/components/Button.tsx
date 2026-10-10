import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      className = '',
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClass = 'btn';
    const variantClass = `btn-${variant}`;
    const sizeClass = size !== 'md' ? `btn-${size}` : '';
    const combinedClass = `${baseClass} ${variantClass} ${sizeClass} ${className}`.trim();

    return (
      <button
        ref={ref}
        className={combinedClass}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span
            style={{
              display: 'inline-block',
              width: 14,
              height: 14,
              border: '2px solid currentColor',
              borderRightColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              marginRight: children ? 6 : 0,
            }}
            aria-hidden="true"
          />
        ) : (
          leftIcon && <span style={{ display: 'inline-flex', marginRight: 6 }}>{leftIcon}</span>
        )}
        {children}
        {!isLoading && rightIcon && (
          <span style={{ display: 'inline-flex', marginLeft: 6 }}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
