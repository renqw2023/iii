import React, { useEffect, useRef } from 'react';
import { useInfiniteQuery } from 'react-query';
import { Loader2 } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useLocation, Outlet } from 'react-router-dom';
import SrefCard from '../components/Sref/SrefCard';
import { srefAPI } from '../services/srefApi';
import { useSidebarPanel } from '../contexts/SidebarContext';
import ExplorePanel from '../components/Sidebar/ExplorePanel';

const Explore = () => {
  useSidebarPanel(ExplorePanel);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sentinelRef = useRef(null);

  const isListActive = location.pathname === '/explore';

  // 直接从 URL searchParams 读取 filter 状态（Sidebar 负责写入）
  const activeTag    = searchParams.get('tag')  || 'all';
  const sortBy       = searchParams.get('sort') || 'createdAt';
  const searchQuery  = searchParams.get('q')    || '';

  const buildParams = (page) => {
    const p = { page, limit: 24, sort: sortBy };
    if (activeTag !== 'all') p.tags = activeTag;
    if (searchQuery) p.search = searchQuery;
    return p;
  };

  const {
    data, isLoading, isFetching, isFetchingNextPage, fetchNextPage, hasNextPage,
  } = useInfiniteQuery(
    ['sref-list', activeTag, sortBy, searchQuery],
    ({ pageParam = 1 }) => srefAPI.getPosts(buildParams(pageParam)),
    {
      getNextPageParam: (lastPage) => {
        const { page, pages } = lastPage?.data?.pagination || {};
        return page < pages ? page + 1 : undefined;
      },
      keepPreviousData: true,
      staleTime: 30000,
      enabled: isListActive,
    }
  );

  const srefs = data?.pages?.flatMap(p => p?.data?.posts || []) || [];
  const total = data?.pages?.[0]?.data?.pagination?.total || 0;

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <>
      <Helmet>
        <title>Style Gallery - Midjourney Sref Styles</title>
        <meta name="description" content="Browse 1300+ Midjourney --sref style references. Find your perfect style code." />
      </Helmet>

      <div className="gallery-page">
        <div className="gallery-stage">
          <div className="gallery-stage-header">
          <span className="gallery-results-info">
            {total} styles
            {isFetching && !isFetchingNextPage && (
              <Loader2 size={13} className="animate-spin" style={{ display: 'inline', marginLeft: '0.5rem' }} />
            )}
          </span>
        </div>

        {isLoading ? (
          <div className="gallery-loading">
            <Loader2 size={32} className="animate-spin" />
            <p>Loading styles...</p>
          </div>
        ) : srefs.length === 0 ? (
          <div className="gallery-empty">
            <span className="text-4xl">🎨</span>
            <p>No styles found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="gallery-grid gallery-stage-grid">
            {srefs.map((sref) => (
              <SrefCard key={sref._id} sref={sref} />
            ))}
          </div>
        )}

        <div ref={sentinelRef} style={{ height: 1 }} />
        {isFetchingNextPage && (
          <div className="gallery-loading" style={{ padding: '1.5rem 0' }}>
            <Loader2 size={24} className="animate-spin" />
          </div>
        )}
        {!hasNextPage && srefs.length > 0 && (
          <div className="home-load-more">
            <span className="home-load-more-hint">—</span>
          </div>
        )}
        </div>
      </div>
      <Outlet />
    </>
  );
};

export default Explore;
