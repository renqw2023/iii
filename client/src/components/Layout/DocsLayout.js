import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ArrowLeft, BookOpenText, Moon, Sun } from 'lucide-react';
import Logo from '../UI/Logo';
import LanguageSwitcher from '../UI/LanguageSwitcher';
import { useTheme } from '../../contexts/ThemeContext';

const docsNavLinkStyle = {
  color: 'var(--text-secondary)',
  textDecoration: 'none',
};

const DocsLayout = () => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(180deg, rgba(248,250,252,0.95) 0%, rgba(255,255,255,1) 18%, rgba(248,250,252,0.95) 100%)',
      }}
    >
      <div className="min-h-screen">
        <header
          className="sticky top-0 z-40 border-b backdrop-blur-xl"
          style={{
            backgroundColor: 'rgba(255,255,255,0.88)',
            borderColor: 'rgba(148,163,184,0.16)',
          }}
        >
          <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <Logo size="sm" showText linkToHome />
              <div
                className="hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] md:inline-flex"
                style={{
                  borderColor: 'rgba(148,163,184,0.14)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(248,250,252,0.82)',
                }}
              >
                <BookOpenText size={14} />
                <span>Docs</span>
              </div>
            </div>

            <nav className="hidden items-center gap-5 lg:flex">
              <Link to="/" style={docsNavLinkStyle}>
                Home
              </Link>
              <Link to="/explore" style={docsNavLinkStyle}>
                Explore
              </Link>
              <Link to="/gallery" style={docsNavLinkStyle}>
                Gallery
              </Link>
              <Link to="/seedance" style={docsNavLinkStyle}>
                Seedance
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/"
                className="hidden items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium no-underline sm:inline-flex"
                style={{
                  borderColor: 'rgba(148,163,184,0.14)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(248,250,252,0.82)',
                }}
              >
                <ArrowLeft size={14} />
                Back Home
              </Link>

              <button
                type="button"
                onClick={toggleTheme}
                className="flex h-10 w-10 items-center justify-center rounded-full border"
                style={{
                  borderColor: 'rgba(148,163,184,0.14)',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'rgba(248,250,252,0.82)',
                }}
                aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DocsLayout;
