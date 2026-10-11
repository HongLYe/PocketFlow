import React from 'react';

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, description, actions }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 18,
      }}
    >
      <div style={{ minWidth: 0, flex: '1 1 240px' }}>
        {eyebrow && <span className="eyebrow-label">{eyebrow}</span>}
        <h1
          style={{
            fontSize: '1.45rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            lineHeight: 1.2,
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            style={{
              fontSize: '0.84rem',
              color: 'var(--text-muted)',
              marginTop: 3,
              lineHeight: 1.4,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
            justifyContent: 'flex-start',
          }}
        >
          {actions}
        </div>
      )}
    </div>
  );
};
