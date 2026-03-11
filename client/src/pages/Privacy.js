import React from 'react';
import { Shield, Database, Eye, Lock, UserCheck, AlertTriangle, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { AnchorNav, PageShell, SectionCard } from '../components/Page/PageShell';

const Privacy = () => {
  const { t } = useTranslation();

  const sections = [
    { id: 'overview', title: t('privacy.sections.overview.title'), icon: <Shield size={20} />, content: t('privacy.sections.overview.content', { returnObjects: true }) },
    { id: 'collection', title: t('privacy.sections.collection.title'), icon: <Database size={20} />, content: t('privacy.sections.collection.content', { returnObjects: true }) },
    { id: 'usage', title: t('privacy.sections.usage.title'), icon: <Eye size={20} />, content: t('privacy.sections.usage.content', { returnObjects: true }) },
    { id: 'sharing', title: t('privacy.sections.sharing.title'), icon: <UserCheck size={20} />, content: t('privacy.sections.sharing.content', { returnObjects: true }) },
    { id: 'security', title: t('privacy.sections.security.title'), icon: <Lock size={20} />, content: t('privacy.sections.security.content', { returnObjects: true }) },
    { id: 'rights', title: t('privacy.sections.rights.title'), icon: <UserCheck size={20} />, content: t('privacy.sections.rights.content', { returnObjects: true }) },
    { id: 'retention', title: t('privacy.sections.retention.title'), icon: <Database size={20} />, content: t('privacy.sections.retention.content', { returnObjects: true }) },
    { id: 'international', title: t('privacy.sections.international.title'), icon: <AlertTriangle size={20} />, content: t('privacy.sections.international.content', { returnObjects: true }) },
  ];

  return (
    <PageShell
      showHeader={false}
      width="xl"
      aside={
        <div className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: 'var(--text-tertiary)' }}>
            On this page
          </h2>
          <AnchorNav items={sections.map((section) => ({ href: `#${section.id}`, label: section.title }))} />
        </div>
      }
    >
      <SectionCard icon={<AlertTriangle size={20} />} title={t('privacy.importantNotice.title')} description={t('privacy.importantNotice.content')} tone="danger" />

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

      <SectionCard icon={<Mail size={20} />} title={t('privacy.contact.title')} description={t('privacy.contact.description')}>
        <div className="flex flex-wrap gap-3">
          <a href="mailto:privacy@iii.pics" className="btn btn-primary">
            {t('privacy.contact.email')}
          </a>
          <div className="rounded-xl border px-4 py-2 text-sm" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
            {t('privacy.contact.wechat')}
          </div>
        </div>
      </SectionCard>
    </PageShell>
  );
};

export default Privacy;
