import React from 'react';
import { Sidebar } from './Sidebar';
import { MobileNav } from './MobileNav';

export interface AppShellProps {
  children: React.ReactNode;
  onNewTransaction: () => void;
  isLoading?: boolean;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  onNewTransaction,
  isLoading = false,
}) => {
  return (
    <div className="app-layout">
      {/* Desktop Navigation Sidebar */}
      <Sidebar onNewTransaction={onNewTransaction} />

      {/* Main Content Viewport */}
      <main className="main-content" id="main-content" tabIndex={-1}>
        <div className="content-container">
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '40vh',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
                gap: 10,
              }}
              role="status"
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: '2px solid var(--accent-brand)',
                  borderRightColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite',
                }}
                aria-hidden="true"
              />
              <span>Loading local data...</span>
            </div>
          ) : (
            children
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
};
