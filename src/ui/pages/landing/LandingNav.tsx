import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight, Sun, Moon } from 'lucide-react';
import { useRouter } from '../../routing/useRouter';
import { ROUTES } from '../../routing/routes';

export const LandingNav: React.FC = () => {
  const { navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return document.documentElement.dataset.theme === 'dark' ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Sync theme
  const toggleTheme = () => {
    const nextTheme = isDarkTheme ? 'light' : 'dark';
    document.documentElement.dataset.theme = nextTheme;
    setIsDarkTheme(!isDarkTheme);
  };

  // Close mobile menu on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const scrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenApp = () => {
    setMobileMenuOpen(false);
    navigate(ROUTES.DASHBOARD);
  };

  return (
    <header className="landing-nav-header">
      <div className="landing-nav-container">
        {/* Brand / Logo */}
        <a
          href="#"
          className="landing-brand"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          aria-label="PocketFlow Home"
        >
          <img
            src="/App icon only.png"
            alt="PocketFlow Logo"
            style={{
              width: 26,
              height: 26,
              borderRadius: '28%',
              objectFit: 'contain',
              flexShrink: 0,
            }}
          />
          <span className="landing-brand-text">PocketFlow</span>
        </a>

        {/* Desktop Navigation Links */}
        <nav className="landing-desktop-nav" aria-label="Main Landing Navigation">
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('features')}
          >
            Features
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('preview')}
          >
            Product Preview
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('privacy')}
          >
            Privacy
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('how-it-works')}
          >
            How It Works
          </button>
          <button
            type="button"
            className="landing-nav-link"
            onClick={() => scrollToSection('faq')}
          >
            FAQ
          </button>
        </nav>

        {/* Right Action Bar: Theme toggle + Primary App CTA */}
        <div className="landing-nav-actions">
          <button
            type="button"
            className="landing-theme-toggle"
            onClick={toggleTheme}
            aria-label={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
            title={isDarkTheme ? 'Switch to light theme' : 'Switch to dark theme'}
          >
            {isDarkTheme ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            type="button"
            className="btn btn-primary btn-sm landing-open-app-btn"
            onClick={handleOpenApp}
          >
            <span>Open PocketFlow</span>
            <ArrowUpRight size={14} style={{ marginLeft: 4 }} aria-hidden="true" />
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            type="button"
            className="landing-mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu-drawer"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Accessible Mobile Drawer */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="landing-mobile-drawer" role="dialog" aria-modal="true">
          <nav className="landing-mobile-menu-list">
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => scrollToSection('preview')}
            >
              Product Preview
            </button>
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => scrollToSection('privacy')}
            >
              Privacy & Local Storage
            </button>
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => scrollToSection('how-it-works')}
            >
              How It Works
            </button>
            <button
              type="button"
              className="landing-mobile-link"
              onClick={() => scrollToSection('faq')}
            >
              Frequently Asked Questions
            </button>

            <div className="landing-mobile-footer-actions">
              <button
                type="button"
                className="btn btn-primary landing-mobile-cta"
                onClick={handleOpenApp}
              >
                <span>Open PocketFlow</span>
                <ArrowUpRight size={16} style={{ marginLeft: 6 }} aria-hidden="true" />
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
