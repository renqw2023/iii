import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Image, Copy, ArrowRight, Wand2 } from 'lucide-react';
import { galleryAPI } from '../../services/galleryApi';
import LandingGalleryGrid from '../../components/Landing/LandingGalleryGrid';
import { useWan27SEO } from '../../hooks/useSEO';

const ACCENT = '#0d9488';
const ACCENT_DIM = 'rgba(13,148,136,0.12)';
const ACCENT_BORDER = 'rgba(13,148,136,0.3)';

const STEPS = [
  { n: '01', title: 'Browse Wan2.7 examples', body: 'Explore AI images and videos generated with Wan2.7. See exactly what prompts produce which results — no guesswork.' },
  { n: '02', title: 'Find your style', body: 'Click any image to open the full detail view, see the complete prompt, and explore related generations.' },
  { n: '03', title: 'Copy the prompt', body: 'One-click copy of the full Wan2.7 prompt to your clipboard. Remix it with your own subject and artistic direction.' },
  { n: '04', title: 'Generate with Wan2.7', body: 'Paste the prompt into the III.PICS generator or your own Wan2.7 setup. Adjust style, resolution, and motion as needed.' },
];

const FEATURES = [
  { title: 'Text-to-Image', body: 'Generate high-resolution images from natural language descriptions. Wan2.7 excels at photorealistic scenes, artistic styles, and complex compositions.' },
  { title: 'Image-to-Image', body: 'Transform any reference image while preserving composition. Ideal for style transfer, product mockups, and creative reinterpretations.' },
  { title: 'Image-to-Video', body: 'Animate still images into fluid 3–5 second video clips. Wan2.7\'s motion model understands physics and natural movement.' },
];

const Wan27Gallery = () => {
  useWan27SEO();

  const { data, isLoading } = useQuery(
    ['landing-wan27'],
    () => galleryAPI.getPrompts({ page: 1, limit: 12, sort: 'newest' }),
    { staleTime: 15 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const items = data?.data?.prompts || data?.data?.data || [];

  return (
    <div style={{ background: '#020c0a', minHeight: '100vh', color: '#e2e8f0' }}>

      {/* ── Hero ── */}
      <section style={{ padding: '5rem 1.5rem 3rem', maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '2rem', padding: '0.35rem 1rem', fontSize: '0.8rem', color: '#2dd4bf', marginBottom: '1.5rem' }}>
          <Image size={13} /> Wan2.7 · Alibaba Cloud AI Model
        </div>
        <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, lineHeight: 1.1, marginBottom: '1rem' }}>
          <span style={{ background: 'linear-gradient(135deg, #ffffff, #ccfbf1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Wan2.7 AI Image Generator
          </span>
          <br />
          <span style={{ background: 'linear-gradient(135deg, #2dd4bf, #60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Prompts & Examples Gallery
          </span>
        </h1>
        <p style={{ fontSize: '1.1rem', color: '#94a3b8', maxWidth: 640, margin: '0 auto 2rem', lineHeight: 1.7 }}>
          Browse real Wan2.7 AI-generated images and videos with their original prompts.
          Wan 2.7 by Alibaba Cloud supports text-to-image, image-to-image, and image-to-video —
          copy proven prompts and generate stunning results instantly.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: ACCENT, color: '#fff', borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            <Wand2 size={15} /> Try Wan2.7 Free
          </Link>
          <Link to="/gallery" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.5rem', background: 'transparent', color: '#2dd4bf', border: `1.5px solid ${ACCENT_BORDER}`, borderRadius: '0.625rem', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            Browse Gallery
          </Link>
        </div>
      </section>

      {/* ── What is Wan2.7 ── */}
      <section style={{ padding: '1rem 1.5rem 3rem', maxWidth: 800, margin: '0 auto' }}>
        <div style={{ background: ACCENT_DIM, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '0.75rem', padding: '1.5rem 2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#2dd4bf', marginBottom: '0.5rem' }}>What is Wan2.7?</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            Wan2.7 is Alibaba Cloud's open-source multimodal AI generation model supporting text-to-image,
            image-to-image, and image-to-video tasks. It delivers photorealistic output with strong
            instruction following, making it ideal for product photography, artistic illustration,
            and short video clips. On III.PICS you can generate with Wan2.7 directly — or browse
            curated examples to find the prompts that work best for your use case.
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section style={{ padding: '0 1.5rem 3rem', maxWidth: 900, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
          {FEATURES.map((f) => (
            <div key={f.title} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1.25rem' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#2dd4bf', marginBottom: '0.4rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.6, margin: 0 }}>{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Gallery Grid ── */}
      <section style={{ padding: '0 1.5rem 4rem', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem', color: '#f1f5f9' }}>
          Latest AI-Generated Images
        </h2>
        <LandingGalleryGrid items={items} isLoading={isLoading} type="gallery" />
        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/gallery" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#2dd4bf', fontWeight: 600, textDecoration: 'none', fontSize: '0.95rem' }}>
            View all AI images <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* ── How To ── */}
      <section style={{ padding: '3rem 1.5rem 4rem', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 700, textAlign: 'center', marginBottom: '0.5rem', color: '#f1f5f9' }}>
          How to Use Wan2.7 Prompts
        </h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2.5rem', fontSize: '0.95rem' }}>
          From prompt inspiration to generated image in four steps
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
        <div style={{ background: `linear-gradient(135deg, ${ACCENT_DIM}, rgba(96,165,250,0.06))`, border: `1px solid ${ACCENT_BORDER}`, borderRadius: '1rem', padding: '2.5rem 2rem' }}>
          <Copy size={28} style={{ color: '#2dd4bf', marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.75rem' }}>
            Ready to generate with Wan2.7?
          </h2>
          <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Free daily credits — no subscription required. Generate images and videos with Wan2.7 directly on III.PICS.
          </p>
          <Link to="/generate" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.75rem', background: ACCENT, color: '#fff', borderRadius: '0.625rem', fontWeight: 700, textDecoration: 'none' }}>
            Start Generating Free <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Wan27Gallery;
