import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Banana, Copy, ArrowRight } from 'lucide-react';
import { galleryAPI } from '../../services/galleryApi';
import { useNanobananaSEO } from '../../hooks/useSEO';
import LandingGalleryGrid from '../../components/Landing/LandingGalleryGrid';

const STEPS = [
  { n: '01', title: 'Browse NanoBanana prompts', body: 'Explore thousands of AI images created with NanoBanana Pro. Every image shows the exact prompt used to generate it.' },
  { n: '02', title: 'Find your inspiration', body: 'Click any image to open the full view. See the complete prompt, style tags, and generation details.' },
  { n: '03', title: 'Copy the prompt', body: 'One click copies the full prompt to your clipboard. No editing needed — use it as-is or customize to fit your vision.' },
  { n: '04', title: 'Generate with NanoBanana Pro', body: 'Paste the prompt into NanaBanana Pro and generate your own stunning AI image in seconds.' },
];

const NanobananaGallery = () => {
  useNanobananaSEO();

  const { data, isLoading } = useQuery(
    ['landing-nanobanana'],
    () => galleryAPI.getPrompts({ page: 1, limit: 12, sort: 'newest', model: 'nanobanana' }),
    { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const items = data?.data?.prompts || data?.data?.data || [];

  return (
    <div style={{ background: '#08000f', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(234,179,8,0.10)', border: '1px solid rgba(234,179,8,0.3)', borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#fbbf24', marginBottom: '1.5rem' }}>
          <Banana size={13} /> NanoBanana Pro · AI Image Generator
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #ffffff, #fef3c7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            NanoBanana Pro
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #fbbf24, #f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            AI Image Prompt Gallery
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Browse thousands of NanoBanana Pro AI image prompts with stunning visual results.
          Copy any prompt instantly — no prompt engineering experience needed. Free AI art inspiration updated daily.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/gallery?model=nanobanana" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: '#ca8a04', color: '#fff', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <Banana size={16} /> Browse All Prompts
          </Link>
          <Link to="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: 'transparent', color: '#fde68a', border: '1.5px solid rgba(234,179,8,0.3)', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            Try AI Generator
          </Link>
        </div>
      </section>

      {/* ── What is NanoBanana Pro ── */}
      <section style={{ padding: '1rem 1.5rem 3rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: 'rgba(234,179,8,0.05)', border: '1px solid rgba(234,179,8,0.12)', borderRadius: '0.75rem', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', marginBottom: '0.5rem' }}>What is NanoBanana Pro?</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            NanoBanana Pro is a powerful AI image generator known for its photorealistic output and creative versatility.
            On III.PICS, we've curated thousands of the best NanoBanana Pro prompts so you can instantly see what works —
            from portraits and landscapes to abstract art and product photography. Browse, copy, and create without limits.
          </p>
        </div>
      </section>

      {/* ── Gallery Grid ── */}
      <section style={{ padding: '0 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
          Latest NanoBanana Pro Prompts
        </h2>
        <LandingGalleryGrid items={items} type="gallery" isLoading={isLoading} />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/gallery?model=nanobanana" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            View all NanoBanana Pro prompts <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── How To ── */}
      <section style={{ padding: '3rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: '#f1f5f9' }}>
          How to Use NanoBanana Pro Prompts
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          From browsing to generating — four easy steps
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ca8a04', marginBottom: '0.5rem', lineHeight: 1 }}>{s.n}</div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.5rem' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: '3rem 1.5rem 5rem', maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(202,138,4,0.12), rgba(249,115,22,0.08))', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '1rem', padding: '2.5rem 2rem' }}>
          <Copy size={28} style={{ color: '#fbbf24', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
            Ready to explore all NanoBanana Pro prompts?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Thousands of curated AI image prompts — browse, copy, and create for free.
          </p>
          <Link to="/gallery?model=nanobanana" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: '#ca8a04', color: '#fff', borderRadius: '0.625rem', fontWeight: 700, textDecoration: 'none' }}>
            Browse NanoBanana Gallery <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default NanobananaGallery;
