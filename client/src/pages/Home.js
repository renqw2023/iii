import React, { useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link, useNavigationType, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import { srefAPI } from '../services/srefApi';
import { galleryAPI } from '../services/galleryApi';
import { seedanceAPI } from '../services/seedanceApi';
import VideoCard from '../components/Seedance/VideoCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import Hero from '../components/Home/Hero';
import FanGallery from '../components/Home/FanGallery';
import { useHomeSEO } from '../hooks/useSEO';

const HOME_SCROLL_KEY = 'home_scrollY';

const Home = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  useHomeSEO();

  useEffect(() => {
    const save = () => sessionStorage.setItem(HOME_SCROLL_KEY, String(Math.round(window.scrollY)));
    window.addEventListener('scroll', save, { passive: true });
    return () => window.removeEventListener('scroll', save);
  }, []);

  const { data: srefData, status: srefStatus } = useQuery(
    ['home-sref-preview'],
    () => srefAPI.getPosts({ page: 1, limit: 15, sort: 'createdAt' }),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const { data: galleryData, status: galleryStatus } = useQuery(
    ['home-gallery-preview'],
    () => galleryAPI.getPrompts({ page: 1, limit: 15, sort: 'newest' }),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );
  const { data: videoData, status: videoStatus } = useQuery(
    ['home-video-preview'],
    () => seedanceAPI.getPrompts({ page: 1, limit: 12, sort: 'newest' }),
    { staleTime: 5 * 60 * 1000, refetchOnWindowFocus: false }
  );

  const srefPosts = srefData?.data?.posts || [];
  const galleryPrompts = galleryData?.data?.prompts || [];
  const videoPosts = videoData?.data?.prompts || [];
  const isLoading = srefStatus === 'loading' || galleryStatus === 'loading' || videoStatus === 'loading';

  useEffect(() => {
    if (navigationType !== 'POP') return;
    if (isLoading) return;
    const saved = sessionStorage.getItem(HOME_SCROLL_KEY);
    if (!saved) return;
    sessionStorage.removeItem(HOME_SCROLL_KEY);
    requestAnimationFrame(() => {
      window.scrollTo(0, parseInt(saved, 10));
    });
  }, [navigationType, isLoading]);

  return (
    <>
      <Hero />

      <div className="home-dark-area">
        <section className="home-section home-content-section">
          <div className="home-section-header">
            <div>
              <h2>
                <span className="gradient-text">{t('home.latestSref.title')}</span>
                <span className="home-section-header-text"> {t('home.latestSref.titleSuffix')}</span>
              </h2>
              <span className="home-section-activity-badge">● {t('home.latestSref.activity')}</span>
            </div>
            <Link to="/explore" className="home-section-link">
              {t('home.latestSref.viewAll')} <ArrowRight size={14} />
            </Link>
          </div>
          {srefStatus === 'loading' ? (
            <div className="gallery-loading"><LoadingSpinner size="md" /></div>
          ) : (
            <FanGallery
              items={srefPosts}
              getImage={(post) => post.previewImage}
              getAlt={(post) => post.srefCode || ''}
              onItemClick={(post) => navigate(`/explore/${post._id}`, { state: { fromList: true } })}
            />
          )}
        </section>

        <section className="home-section home-content-section">
          <div className="home-section-header">
            <div>
              <h2>
                <span className="gradient-text">{t('home.latestGallery.title')}</span>
                <span className="home-section-header-text"> {t('home.latestGallery.titleSuffix')}</span>
              </h2>
              <span className="home-section-activity-badge">● {t('home.latestGallery.activity')}</span>
            </div>
            <Link to="/gallery" className="home-section-link">
              {t('home.latestGallery.viewAll')} <ArrowRight size={14} />
            </Link>
          </div>
          {galleryStatus === 'loading' ? (
            <div className="gallery-loading"><LoadingSpinner size="md" /></div>
          ) : (
            <FanGallery
              items={galleryPrompts}
              getImage={(prompt) => prompt.previewImage}
              getAlt={(prompt) => prompt.title || ''}
              onItemClick={(prompt) => navigate(`/gallery/${prompt._id}`, { state: { fromList: true } })}
            />
          )}
        </section>

        <section className="home-section home-content-section">
          <div className="home-section-header">
            <div>
              <h2>
                <span className="gradient-text">{t('home.latestVideo.title')}</span>
                <span className="home-section-header-text"> {t('home.latestVideo.titleSuffix')}</span>
              </h2>
              <span className="home-section-activity-badge">● {t('home.latestVideo.activity')}</span>
            </div>
            <Link to="/seedance" className="home-section-link">
              {t('home.latestVideo.viewAll')} <ArrowRight size={14} />
            </Link>
          </div>
          {videoStatus === 'loading' ? (
            <div className="gallery-loading"><LoadingSpinner size="md" /></div>
          ) : (
            <div className="seedance-grid">
              {videoPosts.map((prompt) => (
                <VideoCard key={prompt._id} prompt={prompt} fastHoverPreview />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Home;
