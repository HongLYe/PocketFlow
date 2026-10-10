import React, { useState, useEffect, useCallback } from 'react';
import type { RoutePath } from './routes';
import { RouterContext, useRouter } from './useRouter';

function getPathFromHash(): string {
  const hash = window.location.hash.slice(1);
  if (!hash || hash === '') return '/';
  return hash.startsWith('/') ? hash : `/${hash}`;
}

export const Router: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPath, setCurrentPath] = useState<string>(() => getPathFromHash());

  useEffect(() => {
    const handleHashChange = () => {
      setCurrentPath(getPathFromHash());
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = useCallback((to: string) => {
    const normalized = to.startsWith('/') ? to : `/${to}`;
    window.location.hash = normalized;
    setCurrentPath(normalized);
  }, []);

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export { useRouter };

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
