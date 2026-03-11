import React, { useEffect, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  ArrowUpRight,
  BookOpenText,
  CheckCircle2,
  GalleryVertical,
  Film,
  PenSquare,
  Search,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getDocsContent } from '../content/docsContent';

const DOC_ROUTE_HASHES = {
  '/about': 'about',
  '/help': 'help',
  '/privacy': 'privacy',
  '/terms': 'terms',
  '/contact': 'contact',
};

const articleCardStyle = {
  borderColor: 'rgba(148,163,184,0.14)',
  backgroundColor: 'rgba(255,255,255,0.82)',
};

const noteCardStyle = {
  borderColor: 'rgba(148,163,184,0.16)',
  backgroundColor: 'rgba(248,250,252,0.74)',
};

const ArticleSection = ({ section }) => (
  <section id={section.id} className="scroll-mt-24 border-b pb-10 last:border-b-0" style={{ borderColor: 'rgba(148,163,184,0.14)' }}>
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: 'var(--accent-primary)' }}>
        {section.eyebrow}
      </p>
      <h2 className="text-2xl font-semibold sm:text-[2rem]" style={{ color: 'var(--text-primary)' }}>
        {section.title}
      </h2>
      {section.description ? (
        <p className="max-w-3xl text-[15px] leading-8" style={{ color: 'var(--text-secondary)' }}>
          {section.description}
        </p>
      ) : null}
    </div>

    {section.notice ? (
      <div
        className="mt-6 rounded-2xl border px-5 py-4 text-sm leading-7"
        style={{
          borderColor: 'rgba(245,158,11,0.22)',
          backgroundColor: 'rgba(255,251,235,0.92)',
          color: 'var(--text-secondary)',
        }}
      >
        {section.notice}
      </div>
    ) : null}

    {section.paragraphs ? (
      <div className="mt-6 space-y-4">
        {section.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-[15px] leading-8" style={{ color: 'var(--text-secondary)' }}>
            {paragraph}
          </p>
        ))}
      </div>
    ) : null}

    {section.cards ? (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {section.cards.map((card) => (
          <div key={card.title} className="rounded-2xl border p-5" style={noteCardStyle}>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {card.title}
            </h3>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {card.body}
            </p>
          </div>
        ))}
      </div>
    ) : null}

    {section.callouts ? (
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {section.callouts.map((callout) => (
          <div key={callout.title} className="rounded-2xl border p-5" style={noteCardStyle}>
            <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {callout.title}
            </h3>
            <ul className="mt-3 space-y-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {callout.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    ) : null}

    {section.subSections ? (
      <div className="mt-8 space-y-8">
        {section.subSections.map((subSection) => (
          <div key={subSection.id} id={subSection.id} className="scroll-mt-24">
            <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
              {subSection.title}
            </h3>
            {subSection.paragraphs ? (
              <div className="mt-3 space-y-3">
                {subSection.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="text-[15px] leading-8" style={{ color: 'var(--text-secondary)' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            ) : null}
            {subSection.bullets ? (
              <ul className="mt-4 space-y-3">
                {subSection.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-3 text-[15px] leading-8" style={{ color: 'var(--text-secondary)' }}>
                    <CheckCircle2 size={16} className="mt-1 shrink-0" style={{ color: 'var(--accent-primary)' }} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    ) : null}

    {section.contactMethods ? (
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {section.contactMethods.map((method) => (
          <a
            key={method.title}
            href={method.href}
            target={method.href.startsWith('http') ? '_blank' : undefined}
            rel={method.href.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="rounded-2xl border p-5 no-underline transition-transform hover:-translate-y-0.5"
            style={{ ...noteCardStyle, color: 'var(--text-primary)' }}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">{method.title}</h3>
              <ArrowUpRight size={15} style={{ color: 'var(--text-tertiary)' }} />
            </div>
            <p className="mt-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              {method.description}
            </p>
            <p className="mt-4 text-sm font-medium">{method.actionLabel}</p>
          </a>
        ))}
      </div>
    ) : null}
  </section>
);

const DocsCenter = () => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const content = useMemo(() => getDocsContent(i18n.resolvedLanguage || i18n.language), [i18n.language, i18n.resolvedLanguage]);

  const activeSection = useMemo(() => {
    const hashSection = location.hash.replace('#', '');
    if (hashSection) {
      return hashSection;
    }
    return DOC_ROUTE_HASHES[location.pathname] || 'quickstart';
  }, [location.hash, location.pathname]);

  const activeTopSection = useMemo(() => {
    const sectionIds = new Set(content.sections.map((section) => section.id));
    if (sectionIds.has(activeSection)) {
      return activeSection;
    }

    const section = content.sections.find((item) =>
      item.subSections?.some((subSection) => subSection.id === activeSection),
    );

    return section?.id || 'quickstart';
  }, [activeSection, content.sections]);

  const onThisPage = useMemo(() => {
    const current = content.sections.find((section) => section.id === activeTopSection);
    if (!current) {
      return [];
    }

    if (current.subSections?.length) {
      return current.subSections.map((subSection) => ({ href: `#${subSection.id}`, label: subSection.title }));
    }

    return content.sections.map((section) => ({ href: `#${section.id}`, label: section.label }));
  }, [activeTopSection, content.sections]);

  useEffect(() => {
    const targetId = location.hash.replace('#', '') || DOC_ROUTE_HASHES[location.pathname];
    if (!targetId) {
      window.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }

    const element = document.getElementById(targetId);
    if (!element) {
      return;
    }

    window.requestAnimationFrame(() => {
      element.scrollIntoView({ block: 'start', behavior: 'auto' });
    });
  }, [location.hash, location.pathname]);

  return (
    <>
      <Helmet>
        <title>{`${content.pageTitle} - III.PICS Docs`}</title>
        <meta name="description" content={content.pageDescription} />
      </Helmet>

      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-[220px_minmax(0,780px)_220px]">
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <div className="mb-4 flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                  style={{ ...noteCardStyle, color: 'var(--accent-primary)' }}
                >
                  <BookOpenText size={18} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                    {content.leftNavTitle}
                  </p>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    III.PICS Docs
                  </p>
                </div>
              </div>

              <nav className="space-y-1">
                {content.sections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-xl px-3 py-2 text-sm no-underline transition-colors"
                    style={{
                      backgroundColor: activeTopSection === section.id ? 'rgba(99,102,241,0.08)' : 'transparent',
                      color: activeTopSection === section.id ? 'var(--text-primary)' : 'var(--text-secondary)',
                    }}
                  >
                    {section.label}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <main className="min-w-0">
            <article className="rounded-[28px] border px-6 py-8 sm:px-10 sm:py-10" style={articleCardStyle}>
              <header className="border-b pb-8" style={{ borderColor: 'rgba(148,163,184,0.14)' }}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: 'var(--accent-primary)' }}>
                  {content.topBadge}
                </p>
                <h1 className="mt-3 text-3xl font-semibold sm:text-[2.8rem]" style={{ color: 'var(--text-primary)' }}>
                  {content.topTitle}
                </h1>
                <p className="mt-4 max-w-3xl text-[15px] leading-8" style={{ color: 'var(--text-secondary)' }}>
                  {content.topDescription}
                </p>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {[
                    ['Explore', '/explore', Search],
                    ['Gallery', '/gallery', GalleryVertical],
                    ['Seedance', '/seedance', Film],
                    ['Create', '/create', PenSquare],
                  ].map(([title, to, Icon]) => (
                    <Link
                      key={title}
                      to={to}
                      className="rounded-2xl border p-4 no-underline transition-transform hover:-translate-y-0.5"
                      style={{ ...noteCardStyle, color: 'var(--text-primary)' }}
                    >
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: 'rgba(99,102,241,0.08)', color: 'var(--accent-primary)' }}
                      >
                        <Icon size={18} />
                      </div>
                      <h2 className="mt-3 text-base font-semibold">{title}</h2>
                    </Link>
                  ))}
                </div>
              </header>

              <div className="space-y-10 pt-8">
                {content.sections.map((section) => (
                  <ArticleSection key={section.id} section={section} />
                ))}
              </div>
            </article>
          </main>

          <aside className="hidden xl:block">
            <div className="sticky top-24 rounded-[24px] border p-4" style={articleCardStyle}>
              <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
                On this page
              </p>
              <div className="mt-4 space-y-1">
                {onThisPage.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-2 py-1.5 text-sm no-underline transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
};

export default DocsCenter;
