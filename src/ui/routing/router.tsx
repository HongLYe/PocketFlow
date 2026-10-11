import React, { useState, useEffect, useCallback } from 'react';
import type { RoutePath } from './routes';
import { RouterContext, useRouter } from './useRouter';

const LANDING_ANCHORS = new Set(['landing', 'features', 'preview', 'privacy', 'faq', 'how-it-works', 'getting-started']);

function getPathFromHash(): string {
  const rawHash = window.location.hash.slice(1);
  if (!rawHash || rawHash === '') return '/';
  const clean = rawHash.startsWith('/') ? rawHash.slice(1) : rawHash;
  if (LANDING_ANCHORS.has(clean)) return '/';
  return rawHash.startsWith('/') ? rawHash : `/${rawHash}`;
}

export const Router: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => getPathFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      const newPath = getPathFromHash();
      setCurrentPath(newPath);

      const rawHash = window.location.hash.slice(1);
      const clean = rawHash.startsWith('/') ? rawHash.slice(1) : rawHash;
      if (!LANDING_ANCHORS.has(clean)) {
        window.scrollTo(0, 0);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((to: string) => {
    const normalized = to.startsWith('/') ? to : `/${to}`;
    window.location.hash = normalized;
    setCurrentPath(normalized);
    window.scrollTo(0, 0);
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};
interface RouteProps {
  path: RoutePath | string;
  children: React.ReactNode;
}

export const Route: React.FC<RouteProps> = ({ path, children }) => {
  const { currentPath } = useRouter();
  if (currentPath !== path) return null;
  return <>{children}</>;
};

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  to: RoutePath | string;
  className?: string;
  activeClassName?: string;
  children: React.ReactNode;
}

export const Link: React.FC<LinkProps> = ({
  to,
  className = '',
  activeClassName = 'active',
  children,
  onClick,
  ...props
}) => {
  const { currentPath, navigate } = useRouter();
  const isActive = currentPath === to;
  const combinedClassName = `${className} ${isActive ? activeClassName : ''}`.trim();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate(to);
    if (onClick) onClick(e);
  };

  return (
    <a
      href={`#${to}`}
      className={combinedClassName}
      onClick={handleClick}
      aria-current={isActive ? 'page' : undefined}
      {...props}
    >
      {children}
    </a>
  );
};
