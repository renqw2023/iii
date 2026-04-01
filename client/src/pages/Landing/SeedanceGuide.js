import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Video, Copy, ArrowRight, Play } from 'lucide-react';
import { seedanceAPI, getThumbnailSrc } from '../../services/seedanceApi';
import { useSeedanceGuideSEO } from '../../hooks/useSEO';

const STEPS = [
  { n: '01', title: 'Browse Seedance 2.0 prompts', body: 'Explore AI video prompts generated with Seedance 2.0. Every video shows the exact text prompt that created it — no secrets.' },
  { n: '02', title: 'Watch the preview', body: 'Hover over any video card to see it play. Click to open the full view with all generation details and prompt text.' },
  { n: '03', title: 'Copy the prompt', body: 'One click copies the full video prompt to your clipboard. Use it as-is or remix it with your own subject and style.' },
  { n: '04', title: 'Generate your video', body: 'Paste the prompt into Seedance 2.0 and generate your own AI video. Tweak motion, style, and subject to personalize the result.' },
];

const SeedanceGuide = () => {
  useSeedanceGuideSEO();

  const { data, isLoading } = useQuery(
    ['landing-seedance'],
    () => seedanceAPI.getPrompts({ page: 1, limit: 8, sort: 'newest' }),
    { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const items = data?.data?.prompts || data?.data?.data || [];

  return (
    <div style={{ background: '#08000f', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#a78bfa', marginBottom: '1.5rem' }}>
          <Video size={13} /> Seedance 2.0 · AI Video Generator
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #ffffff, #ede9fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Seedance 2.0 AI Video
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #a78bfa, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Prompt Gallery & Examples
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Discover real Seedance 2.0 text-to-video prompts with their generated results.
          Browse AI video examples, copy proven prompts, and create stunning videos with OpenAI's leading video generation model.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/seedance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: '#7c3aed', color: '#fff', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <Play size={15} /> Browse All Videos
          </Link>
          <Link to="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: 'transparent', color: '#c4b5fd', border: '1.5px solid rgba(139,92,246,0.3)', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            Try Video Generator
          </Link>
        </div>
      </section>

      {/* ── What is Seedance 2.0 ── */}
      <section style={{ padding: '1rem 1.5rem 3rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.12)', borderRadius: '0.75rem', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#a78bfa', marginBottom: '0.5rem' }}>What is Seedance 2.0?</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            Seedance 2.0 is a state-of-the-art text-to-video AI model that generates fluid, high-quality video clips from natural language descriptions.
            On III.PICS, we've curated hundreds of the best Seedance 2.0 video prompts so you can see exactly what works —
            from cinematic landscape shots to dynamic character animations and abstract visual art.
          </p>
        </div>
      </section>

      {/* ── Video Grid ── */}
      <section style={{ padding: '0 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
          Latest Seedance 2.0 AI Videos
        </h2>
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '0.75rem' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ aspectRatio: '16/9', borderRadius: '0.5rem', background: 'linear-gradient(90deg, #1e293b 25%, #263348 50%, #1e293b 75%)', backgroundSize: '200% 100%', animation: 'seedanceShimmer 1.4s infinite' }} />
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
                  alt={item.prompt?.substring(0, 60) || item.title || 'Seedance video'}
                  loading="lazy"
                  decoding="async"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', padding: '0.6rem', opacity: 0, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.opacity = 1}
                  onMouseLeave={e => e.currentTarget.style.opacity = 0}
                >
                  <span style={{ fontSize: '0.72rem', color: '#e2e8f0', fontFamily: 'monospace', background: 'rgba(0,0,0,0.5)', padding: '2px 6px', borderRadius: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
                    {item.prompt?.substring(0, 50) || item.title || ''}
                  </span>
                </div>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                  <Play size={16} color="#fff" fill="#fff" />
                </div>
              </Link>
            ))}
          </div>
        )}
        <style>{`@keyframes seedanceShimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }`}</style>
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/seedance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#a78bfa', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            View all Seedance 2.0 videos <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── How To ── */}
      <section style={{ padding: '3rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: '#f1f5f9' }}>
          How to Use Seedance 2.0 Prompts
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          From prompt inspiration to generated video in four steps
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#7c3aed', marginBottom: '0.5rem', lineHeight: 1 }}>{s.n}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '3rem 1.5rem 5rem', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.12), rgba(96,165,250,0.08))', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '1rem', padding: '2.5rem 2rem' }}>
          <Copy size={28} style={{ color: '#a78bfa', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
            Ready to explore Seedance 2.0 video prompts?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Hundreds of curated AI video prompts — browse, copy, and create for free.
          </p>
          <Link to="/seedance" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: '#7c3aed', color: '#fff', borderRadius: '0.625rem', fontWeight: 700, textDecoration: 'none' }}>
            Browse Seedance Gallery <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default SeedanceGuide;
