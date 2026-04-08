import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Video, Copy, ArrowRight, Play } from 'lucide-react';
import { seedanceAPI, getThumbnailSrc } from '../../services/seedanceApi';
import { useVeo31SEO } from '../../hooks/useSEO';

const ACCENT = '#2563eb';
const ACCENT_DIM = 'rgba(37,99,235,0.12)';
const ACCENT_BORDER = 'rgba(37,99,235,0.3)';

const STEPS = [
  { n: '01', title: 'Browse Veo 3.1 prompts', body: 'Explore AI video prompts designed for Google Veo 3.1. See real generated results alongside the exact text that created them.' },
  { n: '02', title: 'Watch the preview', body: 'Hover any video card to preview. Click to open the full detail view with the complete prompt and generation settings.' },
  { n: '03', title: 'Copy the prompt', body: 'One-click copy of the full Veo 3.1 prompt. Use it as-is for cinematic results or adapt it to your own subject.' },
  { n: '04', title: 'Generate with Veo 3.1', body: 'Paste the prompt into the III.PICS video generator or Google AI Studio. Veo 3.1 excels at physics-accurate, cinematic video.' },
];

const FEATURES = [
  { title: 'Cinematic Quality', body: 'Veo 3.1 produces 1080p video with consistent lighting, realistic physics, and smooth motion — closer to film than most AI models.' },
  { title: 'Precise Prompt Following', body: 'Specify camera angles, movement, lighting, and subject behavior. Veo 3.1 interprets detailed cinematography prompts with high accuracy.' },
  { title: 'Image-to-Video', body: 'Animate any still image into a 5–8 second video clip. Ideal for product shots, portraits, and artistic scenes.' },
];

const Veo31Gallery = () => {
  useVeo31SEO();

  const { data, isLoading } = useQuery(
    ['landing-veo31'],
    () => seedanceAPI.getPrompts({ page: 1, limit: 8, sort: 'newest' }),
    { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const items = data?.data?.prompts || data?.data?.data || [];

  return (
    <div style={{ background: '#020818', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#60a5fa', marginBottom: '1.5rem' }}>
          <Video size={13} /> Google Veo 3.1 · Text-to-Video AI
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #ffffff, #dbeafe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Google Veo 3.1 Prompts
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            AI Video Examples & Gallery
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Browse proven Google Veo 3.1 text-to-video prompts with their generated results.
          Discover cinematic camera moves, product video techniques, and creative animations —
          copy any prompt and start generating instantly.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: ACCENT, color: '#fff', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <Play size={15} /> Try Veo 3.1 Free
          </Link>
          <Link to="/seedance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: 'transparent', color: '#60a5fa', border: `1.5px solid ${ACCENT_BORDER}`, borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            Browse Video Gallery
          </Link>
        </div>
      </section>

      {/* ── What is Veo 3.1 ── */}
      <section style={{ padding: '1rem 1.5rem 3rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '0.75rem', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.5rem' }}>What is Google Veo 3.1?</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            Google Veo 3.1 is Google DeepMind's latest text-to-video and image-to-video AI model,
            capable of generating high-fidelity 1080p video clips from detailed text prompts.
            Veo 3 understands cinematic language — camera movements, lighting setups, physics simulation —
            making it one of the most powerful video generation models available.
            On III.PICS you can generate with Veo 3.1 directly using free daily credits.
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '0 1.5rem 3rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Video Grid ── */}
      <section style={{ padding: '0 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
          Latest AI Video Examples
        </h2>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '16/9', borderRadius: '0.5rem', background: 'linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%)', backgroundSize: '200% 100%', animation: 'veoShimmer 1.4s infinite' }} />
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
                  alt={item.prompt?.substring(0, 60) || item.title || 'Veo 3.1 AI video'}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <Play size={16} color="#fff" fill="#fff" />
                </div>
              </Link>
            ))}
          </div>
        )}
        <style>{`@keyframes veoShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/seedance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#60a5fa', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            View all AI videos <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── How To ── */}
      <section style={{ padding: '3rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: '#f1f5f9' }}>
          How to Use Google Veo 3.1 Prompts
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          From cinematic prompt to generated video in four steps
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
        <div style={{ background: `linear-gradient(135deg, ${ACCENT_DIM}, rgba(167,139,250,0.06))`, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '1rem', padding: '2.5rem 2rem' }}>
          <Copy size={28} style={{ color: '#60a5fa', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
            Ready to generate with Google Veo 3.1?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Free daily credits — generate cinematic AI videos with Veo 3.1 on III.PICS. No subscription required.
          </p>
          <Link to="/create" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: ACCENT, color: '#fff', borderRadius: '0.625rem', fontWeight: 700, textDecoration: 'none' }}>
            Generate Video Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Veo31Gallery;
