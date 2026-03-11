import React from 'react';
import { motion } from 'framer-motion';

const PAGE_WIDTHS = {
  lg: 'max-w-5xl',
  xl: 'max-w-6xl',
  '2xl': 'max-w-7xl',
};

export const PageShell = ({
  showHeader = true,
  eyebrow,
  title,
  description,
  actions = null,
  metrics = [],
  aside = null,
  width = 'xl',
  children,
}) => {
  const widthClass = PAGE_WIDTHS[width] || PAGE_WIDTHS.xl;

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className={`${widthClass} mx-auto space-y-8`}>
        {showHeader ? (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="py-2 sm:py-3"
          >
            <div className={`grid gap-6 ${aside ? 'lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start' : ''}`}>
              <div className="space-y-4">
                {eyebrow ? (
                  <span
                    className="inline-flex items-center text-[11px] font-semibold uppercase tracking-[0.24em]"
                    style={{
                      color: 'var(--accent-primary)',
                    }}
                  >
                    {eyebrow}
                  </span>
                ) : null}

                <div className="space-y-2">
                  <h1
                    className="max-w-4xl text-3xl font-semibold leading-tight sm:text-4xl lg:text-[2.6rem]"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {title}
                  </h1>
                  {description ? (
                    <p
                      className="max-w-3xl text-sm leading-7 sm:text-[15px]"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {description}
                    </p>
                  ) : null}
                </div>

                {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}

                {metrics.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {metrics.map((metric) => (
                      <div
                        key={metric.label}
                        className="rounded-full border px-3 py-2"
                        style={{
                          borderColor: 'rgba(148, 163, 184, 0.18)',
                          backgroundColor: 'rgba(255, 255, 255, 0.56)',
                        }}
                      >
                        <p className="text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                          {metric.label}
                        </p>
                        <p className="mt-1 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {metric.value}
                        </p>
                        {metric.note ? (
                          <p className="mt-0.5 text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {metric.note}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              {aside ? (
                <div
                  className="rounded-[22px] border p-4"
                  style={{
                    borderColor: 'rgba(148, 163, 184, 0.18)',
                    background: 'rgba(255,255,255,0.62)',
                  }}
                >
                  {aside}
                </div>
              ) : null}
            </div>
          </motion.section>
        ) : null}

        <div className="space-y-6">{children}</div>
      </div>
    </div>
  );
};

export const SectionGrid = ({ columns = 'three', children }) => {
  const className =
    columns === 'two'
      ? 'grid gap-5 lg:grid-cols-2'
      : columns === 'four'
        ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4'
        : 'grid gap-5 lg:grid-cols-3';

  return <div className={className}>{children}</div>;
};

export const SectionCard = ({ icon, title, description, children, tone = 'default' }) => {
  const accent =
    tone === 'danger'
      ? { background: 'rgba(239, 68, 68, 0.08)', color: '#dc2626' }
      : tone === 'success'
        ? { background: 'rgba(16, 185, 129, 0.1)', color: '#059669' }
        : { background: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-primary)' };

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-[26px] border p-6 sm:p-7"
      style={{
        borderColor: 'var(--border-color)',
        backgroundColor: 'rgba(255, 255, 255, 0.82)',
        boxShadow: '0 18px 60px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div className="flex items-start gap-4">
        {icon ? (
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: accent.background, color: accent.color }}
          >
            {icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? (
            <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h2>
          ) : null}
          {description ? (
            <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {description}
            </p>
          ) : null}
          {children ? <div className="mt-5">{children}</div> : null}
        </div>
      </div>
    </motion.section>
  );
};

export const AnchorNav = ({ items = [] }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((item) => (
        <a
          key={item.href}
          href={item.href}
          className="rounded-full border px-3 py-1.5 text-sm transition-colors"
          style={{
            borderColor: 'var(--border-color)',
            color: 'var(--text-secondary)',
            backgroundColor: 'rgba(255,255,255,0.72)',
          }}
        >
          {item.label}
        </a>
      ))}
    </nav>
  );
};

export const DetailList = ({ items = [] }) => (
  <div className="space-y-3">
    {items.map((item) => (
      <div
        key={item.label}
        className="flex items-start justify-between gap-4 rounded-2xl border px-4 py-3"
        style={{
          borderColor: 'rgba(148, 163, 184, 0.18)',
          backgroundColor: 'rgba(248, 250, 252, 0.72)',
        }}
      >
        <div>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-tertiary)' }}>
            {item.label}
          </p>
          {item.description ? (
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {item.description}
            </p>
          ) : null}
        </div>
        <div className="text-right text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {item.value}
        </div>
      </div>
    ))}
  </div>
);
