import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, Scale, AlertTriangle, Shield, Users, Gavel, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnchorNav, PageShell, SectionCard } from '../components/Page/PageShell';

const Terms = () => {
  const { t } = useTranslation();

  const sections = [
    { id: 'acceptance', title: t('terms.sections.acceptance.title'), icon: <FileText size={20} />, content: t('terms.sections.acceptance.content', { returnObjects: true }) },
    { id: 'description', title: t('terms.sections.description.title'), icon: <Users size={20} />, content: t('terms.sections.description.content', { returnObjects: true }) },
    { id: 'eligibility', title: t('terms.sections.eligibility.title'), icon: <Shield size={20} />, content: t('terms.sections.eligibility.content', { returnObjects: true }) },
    { id: 'content', title: t('terms.sections.content.title'), icon: <FileText size={20} />, content: t('terms.sections.content.content', { returnObjects: true }) },
    { id: 'conduct', title: t('terms.sections.conduct.title'), icon: <Scale size={20} />, content: t('terms.sections.conduct.content', { returnObjects: true }) },
    { id: 'intellectual', title: t('terms.sections.intellectual.title'), icon: <Shield size={20} />, content: t('terms.sections.intellectual.content', { returnObjects: true }) },
    { id: 'privacy', title: t('terms.sections.privacy.title'), icon: <Shield size={20} />, content: t('terms.sections.privacy.content', { returnObjects: true }) },
    { id: 'termination', title: t('terms.sections.termination.title'), icon: <AlertTriangle size={20} />, content: t('terms.sections.termination.content', { returnObjects: true }) },
    { id: 'disclaimer', title: t('terms.sections.disclaimer.title'), icon: <AlertTriangle size={20} />, content: t('terms.sections.disclaimer.content', { returnObjects: true }) },
    { id: 'limitation', title: t('terms.sections.limitation.title'), icon: <Scale size={20} />, content: t('terms.sections.limitation.content', { returnObjects: true }) },
    { id: 'governing', title: t('terms.sections.governing.title'), icon: <Gavel size={20} />, content: t('terms.sections.governing.content', { returnObjects: true }) },
    { id: 'contact', title: t('terms.sections.contact.title'), icon: <Users size={20} />, content: t('terms.sections.contact.content', { returnObjects: true }) },
  ];

  return (
    <PageShell
      showHeader={false}
      width="xl"
      aside={
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
            Sections
          </h2>
          <AnchorNav items={sections.map((section) => ({ href: `#${section.id}`, label: section.title }))} />
        </div>
      }
    >
      <SectionCard icon={<AlertTriangle size={20} />} title={t('terms.importantNotice.title')} description={t('terms.importantNotice.content')} tone="danger" />

      <div className="space-y-4">
        {sections.map((section) => (
          <div key={section.id} id={section.id}>
            <SectionCard icon={section.icon} title={section.title}>
              <div className="space-y-4">
                {section.content.map((paragraph) => (
                  <p key={paragraph} className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </SectionCard>
          </div>
        ))}
      </div>

      <SectionCard icon={<Mail size={20} />} title={t('terms.needHelp.title')} description={t('terms.needHelp.content')}>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:i@mail.iii.pics" className="btn btn-primary">
            {t('terms.needHelp.email')}
          </a>
          <Link to="/contact" className="btn btn-secondary">
            Open Contact Page
          </Link>
        </div>
      </SectionCard>
    </PageShell>
  );
};

export default Terms;
