import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ImageIcon, Copy, ArrowRight, Sparkles } from 'lucide-react';
import { galleryAPI } from '../../services/galleryApi';
import { useGptImageSEO } from '../../hooks/useSEO';
import LandingGalleryGrid from '../../components/Landing/LandingGalleryGrid';

const STEPS = [
  { n: '01', title: 'Explore GPT Image results', body: 'Browse real GPT Image 1.5 generations from the III.PICS community. Every image shows the exact prompt that created it.' },
  { n: '02', title: 'Study the prompts', body: 'Learn what makes a great GPT Image prompt — composition, style descriptors, and detail level all affect the output significantly.' },
  { n: '03', title: 'Copy any prompt', body: 'Click to copy the full prompt instantly. Use it directly in ChatGPT or your OpenAI-powered tools.' },
  { n: '04', title: 'Generate and remix', body: 'Paste into GPT Image 1.5, generate your result, and tweak the prompt to personalize the style, subject, or mood.' },
];

const GptImageGallery = () => {
  useGptImageSEO();

  const { data, isLoading } = useQuery(
    ['landing-gptimage'],
    () => galleryAPI.getPrompts({ page: 1, limit: 12, sort: 'newest', model: 'gptimage' }),
    { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const items = data?.data?.prompts || data?.data?.data || [];

  return (
    <div style={{ background: '#08000f', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(34,197,94,0.10)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#4ade80', marginBottom: '1.5rem' }}>
          <ImageIcon size={13} /> GPT Image 1.5 · OpenAI
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #ffffff, #dcfce7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            GPT Image 1.5 Prompts
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #4ade80, #22d3ee)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            AI Art Gallery & Inspiration
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Discover real GPT Image 1.5 prompts with their generated results. Learn exactly what prompts produce stunning ChatGPT images —
          copy, remix, and create your own AI art with OpenAI's most powerful image generator.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/gallery?model=gptimage" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: '#16a34a', color: '#fff', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <ImageIcon size={16} /> Browse All GPT Prompts
          </Link>
          <Link to="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: 'transparent', color: '#86efac', border: '1.5px solid rgba(34,197,94,0.3)', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <Sparkles size={15} /> Try Generator
          </Link>
        </div>
      </section>

      {/* ── What is GPT Image 1.5 ── */}
      <section style={{ padding: '1rem 1.5rem 3rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: '0.75rem', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#4ade80', marginBottom: '0.5rem' }}>What is GPT Image 1.5?</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            GPT Image 1.5 is OpenAI's latest text-to-image model, available directly in ChatGPT.
            It produces photorealistic images, detailed illustrations, and creative artwork from natural language prompts.
            On III.PICS, we've collected thousands of proven GPT Image 1.5 prompts so you can see exactly what works —
            from hyperrealistic portraits to stylized concept art and product mockups.
          </p>
        </div>
      </section>

      {/* ── Gallery Grid ── */}
      <section style={{ padding: '0 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
          Latest GPT Image 1.5 Generations
        </h2>
        <LandingGalleryGrid items={items} type="gallery" isLoading={isLoading} />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/gallery?model=gptimage" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#4ade80', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            View all GPT Image prompts <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── How To ── */}
      <section style={{ padding: '3rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: '#f1f5f9' }}>
          How to Use GPT Image 1.5 Prompts
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          Learn from real examples and generate your own AI images
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#16a34a', marginBottom: '0.5rem', lineHeight: 1 }}>{s.n}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '3rem 1.5rem 5rem', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.12), rgba(34,211,238,0.08))', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '1rem', padding: '2.5rem 2rem' }}>
          <Copy size={28} style={{ color: '#4ade80', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
            Ready to explore GPT Image 1.5 prompts?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Thousands of proven ChatGPT image prompts — browse, learn, and create for free.
          </p>
          <Link to="/gallery?model=gptimage" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: '#16a34a', color: '#fff', borderRadius: '0.625rem', fontWeight: 700, textDecoration: 'none' }}>
            Browse GPT Image Gallery <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default GptImageGallery;
