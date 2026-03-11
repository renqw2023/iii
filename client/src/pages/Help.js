import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HelpCircle, Search, PenSquare, Compass, Heart, Mail, ChevronDown } from 'lucide-react';
import { PageShell, SectionCard, SectionGrid } from '../components/Page/PageShell';

const Help = () => {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [openIds, setOpenIds] = useState([]);

  const faqSections = useMemo(
    () => [
      {
        id: 'getting-started',
        title: t('help.sections.gettingStarted.title'),
        items: [
          { question: t('help.sections.gettingStarted.questions.howToRegister.question'), answer: t('help.sections.gettingStarted.questions.howToRegister.answer') },
          { question: t('help.sections.gettingStarted.questions.howToLogin.question'), answer: t('help.sections.gettingStarted.questions.howToLogin.answer') },
          { question: t('help.sections.gettingStarted.questions.firstSteps.question'), answer: t('help.sections.gettingStarted.questions.firstSteps.answer') },
        ],
      },
      {
        id: 'creating-posts',
        title: t('help.sections.creatingPosts.title'),
        items: [
          { question: t('help.sections.creatingPosts.questions.howToPost.question'), answer: t('help.sections.creatingPosts.questions.howToPost.answer') },
          { question: t('help.sections.creatingPosts.questions.supportedFormats.question'), answer: t('help.sections.creatingPosts.questions.supportedFormats.answer') },
          { question: t('help.sections.creatingPosts.questions.addingParams.question'), answer: t('help.sections.creatingPosts.questions.addingParams.answer') },
        ],
      },
      {
        id: 'interaction',
        title: t('help.sections.interaction.title'),
        items: [
          { question: t('help.sections.interaction.questions.howToFavorite.question'), answer: t('help.sections.interaction.questions.howToFavorite.answer') },
          { question: t('help.sections.interaction.questions.howToFollow.question'), answer: t('help.sections.interaction.questions.howToFollow.answer') },
          { question: t('help.sections.interaction.questions.howToComment.question'), answer: t('help.sections.interaction.questions.howToComment.answer') },
        ],
      },
      {
        id: 'midjourney',
        title: t('help.sections.midjourneyParams.title'),
        items: [
          { question: t('help.sections.midjourneyParams.questions.whatAreParams.question'), answer: t('help.sections.midjourneyParams.questions.whatAreParams.answer') },
          { question: t('help.sections.midjourneyParams.questions.basicFormat.question'), answer: t('help.sections.midjourneyParams.questions.basicFormat.answer') },
          { question: t('help.sections.midjourneyParams.questions.aspectRatio.question'), answer: t('help.sections.midjourneyParams.questions.aspectRatio.answer') },
        ],
      },
    ],
    [t],
  );

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSections = faqSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (!normalizedQuery) {
          return true;
        }
        return `${item.question} ${item.answer}`.toLowerCase().includes(normalizedQuery);
      }),
    }))
    .filter((section) => section.items.length > 0);

  const toggleOpen = (id) => {
    setOpenIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const quickTasks = [
    { label: 'Start exploring', to: '/explore', icon: <Compass size={18} /> },
    { label: 'Publish a post', to: '/create', icon: <PenSquare size={18} /> },
    { label: 'Review favorites', to: '/favorites', icon: <Heart size={18} /> },
  ];

  return (
    <PageShell
      showHeader={false}
      width="xl"
      actions={
        <>
          <Link to="/contact" className="btn btn-primary">
            Contact Support
          </Link>
          <Link to="/create" className="btn btn-secondary">
            Open Create
          </Link>
        </>
      }
    >
      <SectionCard icon={<Search size={20} />} title="Search the help library" description="A lightweight keyword filter is enough here because the content set is still small and tightly scoped.">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} />
          <input type="text" value={query} onChange={(event) => setQuery(event.target.value)} className="input pl-11" placeholder={t('help.searchPlaceholder', 'Search help')} />
        </div>
      </SectionCard>

      <SectionGrid columns="three">
        {quickTasks.map((task) => (
          <Link
            key={task.to}
            to={task.to}
            className="rounded-[22px] border p-5 no-underline transition-transform hover:-translate-y-0.5"
            style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255,255,255,0.82)', color: 'var(--text-primary)' }}
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-primary)' }}>
              {task.icon}
            </div>
            <h3 className="mt-4 text-lg font-semibold">{task.label}</h3>
            <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
              Jump directly into the product surface most likely to solve this question.
            </p>
          </Link>
        ))}
      </SectionGrid>

      <div className="space-y-4">
        {filteredSections.map((section) => {
          const isOpen = openIds.includes(section.id);
          return (
            <SectionCard key={section.id} icon={<HelpCircle size={20} />} title={section.title} description={`${section.items.length} answer${section.items.length > 1 ? 's' : ''} in this section`}>
              <button
                type="button"
                onClick={() => toggleOpen(section.id)}
                className="flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left"
                style={{ borderColor: 'rgba(148, 163, 184, 0.18)', backgroundColor: 'rgba(248,250,252,0.72)', color: 'var(--text-primary)' }}
              >
                <span className="font-medium">Open answers</span>
                <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen ? (
                <div className="mt-4 space-y-3">
                  {section.items.map((item) => (
                    <div
                      key={item.question}
                      className="rounded-2xl border px-4 py-4"
                      style={{ borderColor: 'rgba(148, 163, 184, 0.18)', backgroundColor: 'rgba(255,255,255,0.72)' }}
                    >
                      <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                        {item.question}
                      </p>
                      <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                        {item.answer}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </SectionCard>
          );
        })}
      </div>

      <SectionCard icon={<Mail size={20} />} title={t('help.contact.title')} description={t('help.contact.description')}>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:i@mail.iii.pics" className="btn btn-primary">
            {t('help.contact.emailButton')}
          </a>
          <Link to="/contact" className="btn btn-secondary">
            Open Contact Page
          </Link>
          <div className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            {t('help.contact.wechat')}
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
};

export default Help;
