import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Wand2, Copy, ArrowRight, Compass } from 'lucide-react';
import { srefAPI } from '../../services/srefApi';
import { useMidjourneySrefSEO } from '../../hooks/useSEO';
import LandingGalleryGrid from '../../components/Landing/LandingGalleryGrid';

const STEPS = [
  { n: '01', title: 'Browse the sref gallery', body: 'Explore over 1,300 Midjourney --sref style codes with visual previews. Each card shows you exactly what the style looks like before you use it.' },
  { n: '02', title: 'Click to explore', body: 'Open any style to see full-size previews, related images, and the exact sref code. Compare styles side-by-side to find the perfect look for your project.' },
  { n: '03', title: 'Copy the sref code', body: 'Hit the copy button to instantly grab the --sref code. No typing, no memorizing — one click and it\'s on your clipboard.' },
  { n: '04', title: 'Add to your Midjourney prompt', body: 'Paste at the end of your prompt: `/imagine a portrait of a knight --sref 1234567890`. Midjourney will match that exact visual style.' },
];

const MidjourneySrefGuide = () => {
  useMidjourneySrefSEO();

  const { data, isLoading } = useQuery(
    ['landing-sref'],
    () => srefAPI.getPosts({ page: 1, limit: 12, sort: 'newest' }),
    { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const items = data?.data?.posts || data?.data?.data || [];

  return (
    <div style={{ background: '#08000f', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#818cf8', marginBottom: '1.5rem' }}>
          <Wand2 size={13} /> 1,300+ Style Reference Codes
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #ffffff, #c7d2fe)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Midjourney Style Reference
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #818cf8, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Codes (--sref) Gallery
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          The most complete free library of Midjourney <code style={{ background: 'rgba(99,102,241,0.15)', padding: '1px 6px', borderRadius: 4, color: '#a5b4fc', fontSize: '0.95em' }}>--sref</code> style reference codes.
          Browse visual previews, copy codes in one click, and transform your AI art instantly.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: '#4f46e5', color: '#fff', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <Compass size={16} /> Browse All Styles
          </Link>
          <Link to="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: 'transparent', color: '#c7d2fe', border: '1.5px solid rgba(99,102,241,0.4)', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            Try AI Generator
          </Link>
        </div>
      </section>

      {/* ── Gallery Grid ── */}
      <section style={{ padding: '1rem 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
          Latest Midjourney Sref Styles
        </h2>
        <LandingGalleryGrid items={items} type="sref" isLoading={isLoading} />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            View all 1,300+ sref codes <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── How To ── */}
      <section style={{ padding: '3rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: '#f1f5f9' }}>
          How to Use Midjourney --sref Codes
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          Four simple steps to apply any style reference to your Midjourney prompts
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#4f46e5', marginBottom: '0.5rem', lineHeight: 1 }}>{s.n}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '3rem 1.5rem 5rem', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.15), rgba(139,92,246,0.10))', border: '1px solid rgba(99,102,241,0.25)', borderRadius: '1rem', padding: '2.5rem 2rem' }}>
          <Copy size={28} style={{ color: '#818cf8', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
            Ready to explore all Midjourney sref codes?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Over 1,300 visual style references — browse, favorite, and copy for free.
          </p>
          <Link to="/explore" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: '#4f46e5', color: '#fff', borderRadius: '0.625rem', fontWeight: 700, textDecoration: 'none' }}>
            Browse Sref Gallery <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default MidjourneySrefGuide;
