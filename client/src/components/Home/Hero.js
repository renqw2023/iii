import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Wand2, Banana, ImageIcon, Shuffle, X, ArrowRight, Video, Compass, LogIn, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import axios from 'axios';
import { galleryAPI } from '../../services/galleryApi';
import { srefAPI } from '../../services/srefApi';
import ScrollingGallery from './ScrollingGallery';

const STATS_CACHE_KEY = 'heroStatsCache';
const STATS_TTL = 24 * 60 * 60 * 1000;

async function fetchStats() {
  const cached = localStorage.getItem(STATS_CACHE_KEY);
  if (cached) {
    try {
      const { data, ts } = JSON.parse(cached);
      if (Date.now() - ts < STATS_TTL) return data;
    } catch (_) {}
  }
  const { data } = await axios.get('/api/seo/stats');
  localStorage.setItem(STATS_CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
  return data;
}

const useCountUp = (target, duration = 1800) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = null;
    const step = (timestamp) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return count;
};

const formatCount = (val) => val >= 1000 ? Math.round(val / 1000) + 'K+' : val + '+';

const HERO_STYLES = `
  .split-hero {
    height: 100vh;
    display: flex;
    overflow: hidden;
    background: #08000f;
  }
  .split-hero-left {
    width: 38%;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border-right: 1px solid rgba(255,255,255,0.10);
    transition: background 1.2s ease;
  }
  .split-hero-left-content {
    position: relative;
    z-index: 3;
    padding: 2rem 2.5rem;
    max-width: 480px;
    width: 100%;
  }
  .hero-video-bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    transition: opacity 0.8s ease;
    pointer-events: none;
  }
  .split-hero-right {
    width: 62%;
    position: relative;
    overflow: hidden;
    flex-shrink: 0;
  }
  .split-hero h1 {
    font-size: clamp(2.5rem, 4vw, 4rem);
    font-weight: 800;
    line-height: 1.1;
    margin-bottom: 1rem;
  }
  .split-hero-tagline {
    font-size: 1.05rem;
    font-weight: 600;
    color: #60a5fa;
    margin-bottom: 0.4rem;
  }
  .split-hero-subtitle {
    font-size: 0.95rem;
    color: #94a3b8;
    margin-bottom: 2rem;
  }
  .split-hero-ctas {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
  .split-hero-cta-row {
    display: flex;
    gap: 0.75rem;
  }
  .split-hero-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.4rem;
    border-radius: 0.625rem;
    font-size: 0.95rem;
    font-weight: 600;
    background: #0f172a;
    color: #fff;
    border: none;
    cursor: pointer;
    text-decoration: none;
    transition: background 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .split-hero-btn-primary:hover {
    background: #1e293b;
    transform: translateY(-1px);
    color: #fff;
    text-decoration: none;
  }
  .split-hero-btn-secondary {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1.4rem;
    border-radius: 0.625rem;
    font-size: 0.95rem;
    font-weight: 600;
    background: transparent;
    color: #cbd5e1;
    border: 1.5px solid rgba(148,163,184,0.3);
    cursor: pointer;
    text-decoration: none;
    transition: border-color 0.2s, color 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .split-hero-btn-secondary:hover {
    border-color: rgba(148,163,184,0.6);
    color: #f1f5f9;
    transform: translateY(-1px);
    text-decoration: none;
  }
  .split-hero-btn-ghost {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.6rem 1.2rem;
    border-radius: 0.625rem;
    font-size: 0.875rem;
    background: transparent;
    color: #64748b;
    border: 1px solid rgba(100,116,139,0.25);
    cursor: pointer;
    transition: color 0.2s, border-color 0.2s;
  }
  .split-hero-btn-ghost:hover {
    color: #94a3b8;
    border-color: rgba(100,116,139,0.5);
  }
  .split-hero-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  .split-hero-stat {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    padding: 0.6rem 0.75rem;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.07);
    border-radius: 0.5rem;
    text-decoration: none;
    transition: background 0.2s, border-color 0.2s;
    cursor: pointer;
  }
  .split-hero-stat:hover {
    background: rgba(255,255,255,0.09);
    border-color: rgba(255,255,255,0.18);
    text-decoration: none;
  }
  .split-hero-stat-icon {
    width: 2rem;
    height: 2rem;
    border-radius: 0.375rem;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .split-hero-stat-num {
    font-size: 1.1rem;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1.2;
  }
  .split-hero-stat-label {
    font-size: 0.72rem;
    color: #64748b;
    line-height: 1.3;
  }

  /* lightbox */
  .hero-lightbox {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
  }
  .hero-lightbox-inner {
    position: relative;
    max-width: 520px;
    width: 90vw;
    background: #1e293b;
    border-radius: 1rem;
    overflow: hidden;
    box-shadow: 0 25px 60px rgba(0,0,0,0.6);
  }
  .hero-lightbox-close {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    z-index: 10;
    background: rgba(0,0,0,0.5);
    border: none;
    border-radius: 50%;
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #fff;
  }
  .hero-lightbox-img {
    width: 100%;
    max-height: 60vh;
    object-fit: contain;
    display: block;
  }
  .hero-lightbox-footer {
    padding: 1rem 1.25rem;
    display: flex;
    justify-content: flex-end;
  }
  .hero-lightbox-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    color: #60a5fa;
    background: none;
    border: none;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: color 0.2s;
  }
  .hero-lightbox-link:hover {
    color: #93c5fd;
  }

  /* ── Sun / Moon orbs ── */
  .hero-orb {
    position: absolute;
    top: 1.2rem;
    left: 1.2rem;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 50%;
    cursor: pointer;
    z-index: 20;
    pointer-events: auto;
  }
  .hero-orb-sun {
    background: radial-gradient(circle at 38% 36%, #fff5c0, #fbbf24 40%, #f97316 75%, #ea580c);
    box-shadow: 0 0 14px 5px rgba(251,191,36,0.60), 0 0 34px 14px rgba(249,115,22,0.32);
    animation: orbSunPulse 3s ease-in-out infinite;
  }
  .hero-orb-moon {
    background: radial-gradient(circle at 36% 34%, #f0f8ff, #bdd4f8 42%, #7baae8 76%, #4a7ec8);
    box-shadow: 0 0 14px 5px rgba(185,212,255,0.60), 0 0 34px 14px rgba(120,170,240,0.32);
    animation: orbMoonPulse 3s ease-in-out infinite;
  }
  .hero-orb-sun:hover {
    box-shadow: 0 0 22px 10px rgba(251,191,36,0.80), 0 0 50px 22px rgba(249,115,22,0.48);
  }
  .hero-orb-moon:hover {
    box-shadow: 0 0 22px 10px rgba(185,212,255,0.80), 0 0 50px 22px rgba(120,170,240,0.48);
  }
  @keyframes orbSunPulse {
    0%,100% { box-shadow: 0 0 14px 5px rgba(251,191,36,0.60), 0 0 34px 14px rgba(249,115,22,0.32); }
    50%      { box-shadow: 0 0 22px 9px rgba(251,191,36,0.82), 0 0 50px 20px rgba(249,115,22,0.48); }
  }
  @keyframes orbMoonPulse {
    0%,100% { box-shadow: 0 0 14px 5px rgba(185,212,255,0.60), 0 0 34px 14px rgba(120,170,240,0.32); }
    50%      { box-shadow: 0 0 22px 9px rgba(185,212,255,0.82), 0 0 50px 20px rgba(120,170,240,0.48); }
  }

  /* ── Sun falling (right arc) ──
     Positions pre-computed along cubic-bezier C(3,3)(90,3)(90,89)(80,89)
     使用11个等间距点 + linear 插值，消除折角感 */
  .hero-sun-falling {
    position: absolute;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 36%, #fff5c0, #fbbf24 40%, #f97316 75%, #ea580c);
    box-shadow: 0 0 20px 8px rgba(251,191,36,0.70), 0 0 44px 18px rgba(249,115,22,0.40);
    z-index: 20;
    pointer-events: none;
    will-change: left, top;
    animation: sunFall 1.8s linear forwards;
  }
  @keyframes sunFall {
    0%   { left: 3%;  top: 3%;  opacity: 1; }
    10%  { left: 24%; top: 3%;              }
    20%  { left: 43%; top: 5%;              }
    30%  { left: 59%; top: 10%;             }
    40%  { left: 72%; top: 17%;             }
    50%  { left: 81%; top: 26%;             }
    60%  { left: 87%; top: 37%;             }
    70%  { left: 90%; top: 49%;             }
    80%  { left: 89%; top: 62%;             }
    90%  { left: 86%; top: 75%;             }
    100% { left: 80%; top: 89%; opacity: 0.7; }
  }

  /* ── Moon rising (left arc) ──
     Positions pre-computed along cubic-bezier C(80,89)(-20,89)(-20,3)(3,3)
     11个等间距点 + linear，与 sunFall 合成完整椭圆 */
  .hero-moon-rising {
    position: absolute;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    background: radial-gradient(circle at 36% 34%, #f0f8ff, #bdd4f8 42%, #7baae8 76%, #4a7ec8);
    box-shadow: 0 0 18px 7px rgba(185,212,255,0.65), 0 0 40px 16px rgba(120,170,240,0.35);
    z-index: 20;
    pointer-events: none;
    opacity: 0;
    will-change: left, top;
    animation: moonRise 2.2s linear 0.9s forwards;
  }
  @keyframes moonRise {
    0%   { left: 80%; top: 89%; opacity: 0; }
    5%   { left: 79%; top: 89%; opacity: 1; }
    10%  { left: 69%; top: 89%;             }
    20%  { left: 47%; top: 86%;             }
    30%  { left: 27%; top: 78%;             }
    40%  { left: 12%; top: 67%;             }
    50%  { left: 4%;  top: 54%;             }
    60%  { left: 3%;  top: 41%;             }
    70%  { left: 3%;  top: 29%;             }
    80%  { left: 3%;  top: 19%;             }
    90%  { left: 3%;  top: 10%;             }
    100% { left: 3%;  top: 3%;  opacity: 1; }
  }

  /* Night→Day: 月亮走右弧落下，太阳走左弧升起（复用相同关键帧路径） */
  .hero-moon-falling {
    position: absolute;
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 50%;
    background: radial-gradient(circle at 36% 34%, #f0f8ff, #bdd4f8 42%, #7baae8 76%, #4a7ec8);
    box-shadow: 0 0 18px 7px rgba(185,212,255,0.65), 0 0 40px 16px rgba(120,170,240,0.35);
    z-index: 20;
    pointer-events: none;
    will-change: left, top;
    animation: sunFall 1.8s linear forwards;
  }
  .hero-sun-rising {
    position: absolute;
    width: 2.8rem;
    height: 2.8rem;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 36%, #fff5c0, #fbbf24 40%, #f97316 75%, #ea580c);
    box-shadow: 0 0 20px 8px rgba(251,191,36,0.70), 0 0 44px 18px rgba(249,115,22,0.40);
    z-index: 20;
    pointer-events: none;
    opacity: 0;
    will-change: left, top;
    animation: moonRise 2.2s linear 0.9s forwards;
  }
`;

const Hero = () => {
  const { t } = useTranslation();
  const { user, openLoginModal } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [randomWork, setRandomWork] = useState(null);
  const [isRandomLoading, setIsRandomLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [statTargets, setStatTargets] = useState({
    srefCount: 1300,
    galleryCount: 13000,
    seedanceCount: 1000,
    generationCount: 0,
  });

  useEffect(() => {
    fetchStats().then(setStatTargets).catch(() => {});
  }, []);

  const mjCount = useCountUp(statTargets.srefCount);
  const nbCount = useCountUp(statTargets.galleryCount);
  const sdCount = useCountUp(statTargets.seedanceCount);
  const gpCount = useCountUp(statTargets.generationCount);

  const videoARef = useRef(null);
  const videoBRef = useRef(null);

  useEffect(() => {
    const vA = videoARef.current;
    const vB = videoBRef.current;
    if (!vA || !vB) return;

    let active = 'a';
    const CROSSFADE_AT = 7.0;

    const onAUpdate = () => {
      if (active === 'a' && vA.currentTime >= CROSSFADE_AT) {
        active = 'b';
        vB.currentTime = 0;
        vB.play().catch(() => {});
        vB.style.opacity = '1';
        vA.style.opacity = '0';
      }
    };
    const onBUpdate = () => {
      if (active === 'b' && vB.currentTime >= CROSSFADE_AT) {
        active = 'a';
        vA.currentTime = 0;
        vA.play().catch(() => {});
        vA.style.opacity = '1';
        vB.style.opacity = '0';
      }
    };

    vA.addEventListener('timeupdate', onAUpdate);
    vB.addEventListener('timeupdate', onBUpdate);
    vA.play().catch(() => {});

    return () => {
      vA.removeEventListener('timeupdate', onAUpdate);
      vB.removeEventListener('timeupdate', onBUpdate);
      vA.pause();
      vB.pause();
    };
  }, []);

  const handleOpenRandomWork = async () => {
    if (isRandomLoading) return;
    try {
      setIsRandomLoading(true);
      const [galleryResponse, srefResponse] = await Promise.allSettled([
        galleryAPI.getRandom(),
        srefAPI.getRandom(),
      ]);
      const candidates = [];
      const galleryPrompt = galleryResponse.status === 'fulfilled'
        ? galleryResponse.value?.data?.prompt : null;
      if (galleryPrompt?._id && galleryPrompt?.previewImage) {
        candidates.push({ type: 'gallery', id: galleryPrompt._id, previewImage: galleryPrompt.previewImage, title: galleryPrompt.title });
      }
      const srefPost = srefResponse.status === 'fulfilled'
        ? srefResponse.value?.data?.post : null;
      if (srefPost?._id && srefPost?.previewImage) {
        candidates.push({ type: 'explore', id: srefPost._id, previewImage: srefPost.previewImage, title: srefPost.title || `--sref ${srefPost.srefCode || ''}`.trim() });
      }
      if (candidates.length === 0) throw new Error('No random work candidates available');
      setRandomWork(candidates[Math.floor(Math.random() * candidates.length)]);
    } catch (error) {
      console.error('Failed to load random work:', error);
      toast.error('Failed to load a random work. Please try again.');
    } finally {
      setIsRandomLoading(false);
    }
  };

  const handleCloseRandomWork = () => setRandomWork(null);

  const handleOrbClick = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    // sun fall: 1.8s | moon rise delay 0.9s + 2.2s = total 3.1s → switch at 3.2s
    setTimeout(() => {
      toggleTheme();
      setIsTransitioning(false);
    }, 3200);
  };

  const handleBrowseRandomWork = () => {
    if (!randomWork?.id) return;
    const returnTo = `${location.pathname}${location.search}${location.hash}` || '/';
    const targetPath = randomWork.type === 'explore' ? `/explore/${randomWork.id}` : `/gallery/${randomWork.id}`;
    const targetUrl = `${targetPath}?returnTo=${encodeURIComponent(returnTo)}`;
    setRandomWork(null);
    navigate(targetUrl, { state: { fromHomeSurprise: true, returnTo } });
  };

  return (
    <section className="split-hero">
      <style>{HERO_STYLES}</style>

      {/* Left Panel */}
      <div
        className="split-hero-left"
        style={{
          background: 'transparent',
        }}
      >
        {/* Video background */}
        <>
          <video ref={videoARef} className="hero-video-bg"
            src="/hero-bg.mp4" muted playsInline preload="auto"
            style={{ opacity: 1 }}
          />
          <video ref={videoBRef} className="hero-video-bg"
            src="/hero-bg.mp4" muted playsInline preload="auto"
            style={{ opacity: 0 }}
          />
          {/* Readability overlay */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: isDark
              ? 'linear-gradient(to right, rgba(8,0,15,0.55) 0%, rgba(8,0,15,0.3) 100%)'
              : 'linear-gradient(to right, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.35) 100%)'
          }} />
          {/* Watermark cover — bottom-right */}
          <div style={{
            position: 'absolute', bottom: 0, right: 0,
            width: '180px', height: '70px', zIndex: 2,
            background: isDark
              ? 'linear-gradient(135deg, transparent 30%, rgba(4,0,8,0.92) 100%)'
              : 'linear-gradient(135deg, transparent 30%, rgba(240,240,240,0.95) 100%)'
          }} />
        </>

        {/* Sun / Moon orb */}
        {!isTransitioning && (
          <div
            className={`hero-orb ${isDark ? 'hero-orb-moon' : 'hero-orb-sun'}`}
            onClick={handleOrbClick}
            title={isDark ? 'Switch to day' : 'Switch to night'}
          />
        )}
        {isTransitioning && (
          <>
            <div className={isDark ? 'hero-moon-falling' : 'hero-sun-falling'} />
            <div className={isDark ? 'hero-sun-rising'  : 'hero-moon-rising'} />
          </>
        )}

        <div className="split-hero-left-content">
          <h1>
            <span style={{ background: 'linear-gradient(135deg, #ffffff, #e2e8f0)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>III.PICS</span>
            <br />
            <span style={{ fontSize: 'clamp(1.1rem, 2vw, 1.5rem)', fontWeight: 500, color: '#94a3b8' }}>
              {t('home.hero.title')}
            </span>
          </h1>

          <p className="split-hero-tagline">{t('home.hero.slogan')}</p>
          <p className="split-hero-subtitle">{t('home.hero.subtitle')}</p>

          <div className="split-hero-ctas">
            <div className="split-hero-cta-row">
              <Link to="/explore" className="split-hero-btn-primary">
                <Compass size={16} />
                Explore Gallery
              </Link>
              {user ? (
                <Link to="/dashboard" className="split-hero-btn-secondary">
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>
              ) : (
                <button className="split-hero-btn-secondary" onClick={openLoginModal}>
                  <LogIn size={16} />
                  Sign In
                </button>
              )}
            </div>
            <div>
              <button
                className="split-hero-btn-ghost"
                onClick={handleOpenRandomWork}
                disabled={isRandomLoading}
              >
                <Shuffle size={14} />
                {isRandomLoading ? 'Loading...' : t('home.hero.randomBtn')}
              </button>
            </div>
          </div>

          <div className="split-hero-stats">
            <Link to="/explore" className="split-hero-stat">
              <div className="split-hero-stat-icon" style={{ background: 'rgba(59,130,246,0.15)' }}>
                <Wand2 size={16} color="#3b82f6" />
              </div>
              <div>
                <div className="split-hero-stat-num">{formatCount(mjCount)}</div>
                <div className="split-hero-stat-label">{t('home.hero.stats.midjourney')}</div>
              </div>
            </Link>
            <Link to="/gallery" className="split-hero-stat">
              <div className="split-hero-stat-icon" style={{ background: 'rgba(234,179,8,0.15)' }}>
                <Banana size={16} color="#ca8a04" />
              </div>
              <div>
                <div className="split-hero-stat-num">{formatCount(nbCount)}</div>
                <div className="split-hero-stat-label">{t('home.hero.stats.nanobanana')}</div>
              </div>
            </Link>
            <Link to="/seedance" className="split-hero-stat">
              <div className="split-hero-stat-icon" style={{ background: 'rgba(168,85,247,0.15)' }}>
                <Video size={16} color="#a855f7" />
              </div>
              <div>
                <div className="split-hero-stat-num">{formatCount(sdCount)}</div>
                <div className="split-hero-stat-label">{t('home.hero.stats.seedance')}</div>
              </div>
            </Link>
            <Link to="/generate" className="split-hero-stat">
              <div className="split-hero-stat-icon" style={{ background: 'rgba(34,197,94,0.15)' }}>
                <ImageIcon size={16} color="#22c55e" />
              </div>
              <div>
                <div className="split-hero-stat-num">{formatCount(gpCount)}</div>
                <div className="split-hero-stat-label">{t('home.hero.stats.gptimage')}</div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="split-hero-right">
        <ScrollingGallery />
      </div>

      {/* Random work lightbox */}
      {randomWork && (
        <div className="hero-lightbox" onClick={handleCloseRandomWork}>
          <div className="hero-lightbox-inner" onClick={e => e.stopPropagation()}>
            <button className="hero-lightbox-close" onClick={handleCloseRandomWork} aria-label="Close">
              <X size={16} />
            </button>
            <img
              src={randomWork.previewImage}
              alt={randomWork.title || 'Random work preview'}
              className="hero-lightbox-img"
            />
            <div className="hero-lightbox-footer">
              <button type="button" className="hero-lightbox-link" onClick={handleBrowseRandomWork}>
                {t('home.hero.exploreButton')} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Hero;
