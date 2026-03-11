import React from 'react';
import { Link } from 'react-router-dom';
import {
  Compass,
  Sparkles,
  GalleryVertical,
  Film,
  PenSquare,
  HeartHandshake,
  Radar,
  Rocket,
  Mail,
  Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PageShell, SectionCard, SectionGrid, DetailList } from '../components/Page/PageShell';

const About = () => {
  const { t } = useTranslation();

  const productAreas = [
    { title: 'Explore', description: 'Midjourney style references and searchable inspiration loops.', icon: <Compass size={20} /> },
    { title: 'Gallery', description: 'Prompt-centric image library for collecting and comparing visual ideas.', icon: <GalleryVertical size={20} /> },
    { title: 'Seedance', description: 'Video-oriented inspiration space for motion prompts and cinematic references.', icon: <Film size={20} /> },
    { title: 'Create', description: 'A publishing flow for prompts, media, and process notes in one place.', icon: <PenSquare size={20} /> },
  ];

  const principles = [
    { label: t('about.features.community.title'), value: t('about.features.community.description') },
    { label: t('about.features.creativity.title'), value: t('about.features.creativity.description') },
    { label: t('about.features.service.title'), value: t('about.features.service.description') },
  ];

  return (
    <PageShell
      showHeader={false}
      width="xl"
      actions={
        <>
          <Link to="/explore" className="btn btn-primary">
            Explore Styles
          </Link>
          <Link to="/contact" className="btn btn-secondary">
            Contact Us
          </Link>
        </>
      }
      aside={
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-tertiary)' }}>
            What is changing
          </p>
          <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
            III.PICS is shifting from a static showcase site into a creator operations surface: a place to discover,
            save, revisit, and publish reference-driven AI work with less friction.
          </p>
          <DetailList
            items={[
              { label: 'Audience', value: 'Creators, prompt collectors, visual researchers' },
              { label: 'Value', value: 'Faster discovery and better publishing context' },
              { label: 'Priority', value: 'Useful tools before marketing pages' },
            ]}
          />
        </div>
      }
    >
      <SectionGrid columns="two">
        <SectionCard icon={<Radar size={20} />} title={t('about.vision.title')} description={t('about.vision.description')} />
        <SectionCard
          icon={<HeartHandshake size={20} />}
          title="Operating principles"
          description="The product direction is now centered on practical creator support rather than generic platform copy."
        >
          <div className="grid gap-3">
            {principles.map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border px-4 py-3"
                style={{ borderColor: 'rgba(148, 163, 184, 0.18)', backgroundColor: 'rgba(248,250,252,0.72)' }}
              >
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {item.label}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </SectionCard>
      </SectionGrid>

      <SectionCard icon={<Sparkles size={20} />} title="Current product surfaces" description="These are the areas the rest of the content system should now reflect.">
        <SectionGrid columns="four">
          {productAreas.map((area) => (
            <div
              key={area.title}
              className="rounded-[22px] border p-5"
              style={{ borderColor: 'rgba(148, 163, 184, 0.18)', backgroundColor: 'rgba(255,255,255,0.72)' }}
            >
              <div
                className="flex h-11 w-11 items-center justify-center rounded-2xl"
                style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: 'var(--accent-primary)' }}
              >
                {area.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {area.title}
              </h3>
              <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                {area.description}
              </p>
            </div>
          ))}
        </SectionGrid>
      </SectionCard>

      <SectionGrid columns="two">
        <SectionCard icon={<Rocket size={20} />} title="Near-term roadmap" description="The highest-leverage improvements are not new marketing copy, but better creator workflows.">
          <ul className="space-y-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
            <li>Unify utility pages under a consistent shell and stronger information hierarchy.</li>
            <li>Reduce overlap between dashboard, favorites, history, and credits surfaces.</li>
            <li>Make publish flows feel like creator tools, not back-office forms.</li>
          </ul>
        </SectionCard>

        <SectionCard icon={<Users size={20} />} title={t('about.team.title')} description={t('about.team.description')}>
          <DetailList
            items={[
              { label: 'Owner', value: 'COOLAI (renqw)' },
              { label: 'Email', value: 'i@mail.iii.pics' },
              { label: 'WeChat', value: t('about.team.wechat') },
            ]}
          />
        </SectionCard>
      </SectionGrid>

      <SectionCard
        icon={<Mail size={20} />}
        title="Need more context?"
        description="If you are deciding whether III.PICS fits your workflow, the quickest next step is to browse a live surface instead of reading more brochure text."
      >
        <div className="flex flex-wrap gap-3">
          <Link to="/gallery" className="btn btn-secondary">
            Open Gallery
          </Link>
          <Link to="/seedance" className="btn btn-secondary">
            Open Seedance
          </Link>
          <a href="mailto:i@mail.iii.pics" className="btn btn-primary">
            Email the team
          </a>
        </div>
      </SectionCard>
    </PageShell>
  );
};

export default About;
