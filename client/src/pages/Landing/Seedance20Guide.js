import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Video, Copy, ArrowRight, Play, Zap } from 'lucide-react';
import { seedanceAPI, getThumbnailSrc } from '../../services/seedanceApi';
import { useSeedance20SEO } from '../../hooks/useSEO';

const ACCENT = '#7c3aed';
const ACCENT_DIM = 'rgba(124,58,237,0.12)';
const ACCENT_BORDER = 'rgba(124,58,237,0.3)';

const STEPS = [
  { n: '01', title: 'Browse 1,200+ real prompts', body: 'Every video in our gallery includes the exact Seedance 2.0 prompt that generated it. No secrets, no paywalls.' },
  { n: '02', title: 'Study what works', body: 'Filter by style, motion type, or subject. Learn how cinematic language, camera moves, and subject descriptions affect output.' },
  { n: '03', title: 'Copy with one click', body: 'Copy any Seedance 2.0 prompt to your clipboard instantly. Remix the subject, style, or camera to personalize the result.' },
  { n: '04', title: 'Generate your video', body: 'Paste the prompt into III.PICS or Seedance directly. Iterate quickly using our free daily credits — no subscription needed.' },
];

const PROMPT_TIPS = [
  { label: 'Camera Movement', example: '"Slow dolly in on the subject, shallow depth of field, bokeh background"' },
  { label: 'Lighting', example: '"Golden hour backlight, warm rim light, soft shadows"' },
  { label: 'Style', example: '"Cinematic 4K, film grain, desaturated shadows, Kodak color palette"' },
  { label: 'Motion', example: '"Subject turns slowly toward camera, hair moves gently in wind"' },
];

const Seedance20Guide = () => {
  useSeedance20SEO();

  const { data, isLoading } = useQuery(
    ['landing-seedance20'],
    () => seedanceAPI.getPrompts({ page: 1, limit: 12, sort: 'newest' }),
    { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const items = data?.data?.prompts || data?.data?.data || [];

  return (
    <div style={{ background: '#08000f', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#a78bfa', marginBottom: '1.5rem' }}>
          <Video size={13} /> Seedance 2.0 · 1,200+ Real Prompts
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #ffffff, #ede9fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Seedance 2.0 Prompts
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            That Actually Work
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          The most complete Seedance 2.0 prompt gallery — 1,200+ text-to-video and image-to-video examples
          with their original prompts. Learn what makes Seedance output cinematic, copy proven prompts,
          and generate stunning AI videos for free.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/seedance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: ACCENT, color: '#fff', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <Play size={15} /> Browse All Videos
          </Link>
          <Link to="/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: 'transparent', color: '#a78bfa', border: `1.5px solid ${ACCENT_BORDER}`, borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <Zap size={15} /> Try Free Generator
          </Link>
        </div>
      </section>

      {/* ── What is Seedance 2.0 ── */}
      <section style={{ padding: '1rem 1.5rem 3rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '0.75rem', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.5rem' }}>What is Seedance 2.0?</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            Seedance 2.0 is a state-of-the-art text-to-video AI model developed by ByteDance,
            generating high-quality 720p–1080p video clips from natural language prompts.
            It supports text-to-video, image-to-video, and offers fine-grained control over
            camera movement, lighting, and motion style. Compared to alternatives like Kling and Sora,
            Seedance 2.0 stands out for prompt accuracy and cinematic output quality.
            III.PICS hosts 1,200+ real Seedance 2.0 examples — the largest free gallery available.
          </p>
        </div>
      </section>

      {/* ── Prompt Tips ── */}
      <section style={{ padding: '0 1.5rem 3rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1rem', color: '#f1f5f9' }}>
          Seedance 2.0 Prompt Techniques
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {PROMPT_TIPS.map((t) => (
            <div key={t.label} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{t.label}</h3>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: 1.6, fontStyle: 'italic', margin: 0 }}>{t.example}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Video Grid ── */}
      <section style={{ padding: '0 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
          Latest Seedance 2.0 AI Videos
        </h2>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '16/9', borderRadius: '0.5rem', background: 'linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%)', backgroundSize: '200% 100%', animation: 'sd20Shimmer 1.4s infinite' }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {items.map((item) => (
              <Link
                key={item._id}
                to={`/seedance/${item._id}`}
                style={{ display: 'block', borderRadius: '0.5rem', overflow: 'hidden', background: '#1e293b', textDecoration: 'none', position: 'relative', aspectRatio: '16/9' }}
              >
                <img
                  src={getThumbnailSrc(item.thumbnailUrl || item.previewImage)}
                  alt={item.prompt?.substring(0, 60) || item.title || 'Seedance 2.0 AI video'}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div
                  style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', padding: '0.6rem', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <span style={{ fontSize: '0.72rem', color: '#e2e8f0', fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {item.prompt?.substring(0, 60) || item.title || ''}
                  </span>
                </div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <Play size={16} color="#fff" fill="#fff" />
                </div>
              </Link>
            ))}
          </div>
        )}
        <style>{`@keyframes sd20Shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/seedance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            View all 1,200+ Seedance videos <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── How To ── */}
      <section style={{ padding: '3rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: '#f1f5f9' }}>
          How to Use Seedance 2.0 Prompts
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          From prompt to cinematic AI video in four steps
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: ACCENT, marginBottom: '0.5rem', lineHeight: 1 }}>{s.n}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '3rem 1.5rem 5rem', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: `linear-gradient(135deg, ${ACCENT_DIM}, rgba(96,165,250,0.08))`, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '1rem', padding: '2.5rem 2rem' }}>
          <Copy size={28} style={{ color: '#a78bfa', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
            Start with Seedance 2.0 today
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            1,200+ curated prompts, free daily credits, no subscription. The fastest way to create AI videos.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/seedance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: ACCENT, color: '#fff', borderRadius: '0.625rem', fontWeight: 700, textDecoration: 'none' }}>
              Browse Prompts <ArrowRight size={16} />
            </Link>
            <Link to="/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'transparent', color: '#a78bfa', border: `1.5px solid ${ACCENT_BORDER}`, borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none' }}>
              Generate Now <Zap size={14} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Seedance20Guide;
