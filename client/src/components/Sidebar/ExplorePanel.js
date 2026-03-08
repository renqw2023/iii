/**
 * ExplorePanel — Sref Style Gallery 过滤面板
 * Search / Style Tags / Sort → 写入 URL searchParams
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { srefAPI } from '../../services/srefApi';

const SectionLabel = ({ children }) => (
  <p className="px-3 mb-1 mt-3 uppercase tracking-wider"
     style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
    {children}
  </p>
);

const tagBtnClass = (active) =>
  `w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer
   ${active
     ? 'bg-[var(--gallery-filter-active-bg,#f1f5f9)] text-[var(--text-primary)] font-medium'
     : 'text-[var(--text-secondary)] hover:bg-[var(--gallery-filter-hover-bg,#f8fafc)] hover:text-[var(--text-primary)]'
   }`;

const ExplorePanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const activeTag = searchParams.get('tag')  || 'all';
  const sortBy    = searchParams.get('sort') || 'createdAt';

  // 防抖写入 searchParams
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev);
        if (searchInput) p.set('q', searchInput); else p.delete('q');
        return p;
      }, { replace: true });
    }, 300);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  const setTag = (tag) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (tag === 'all') p.delete('tag'); else p.set('tag', tag);
      return p;
    }, { replace: true });
  };

  const setSort = (sort) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (sort === 'createdAt') p.delete('sort'); else p.set('sort', sort);
      return p;
    }, { replace: true });
  };

  const { data: tagsData } = useQuery(
    ['sref-tags'],
    () => srefAPI.getPopularTags(40),
    { staleTime: 5 * 60_000 }
  );
  const tags = tagsData?.data?.tags || [];

  return (
    <div className="mb-4">
      {/* Search */}
      <SectionLabel>Search</SectionLabel>
      <div className="px-2 mb-1">
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-lg border"
             style={{ borderColor: 'var(--border-color)', background: 'var(--bg-primary)' }}>
          <Search size={14} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search styles..."
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: 'var(--text-primary)' }}
          />
          {searchInput && (
            <button onClick={() => setSearchInput('')}>
              <X size={13} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          )}
        </div>
      </div>

      {/* Style Tags */}
      <SectionLabel>Style</SectionLabel>
      <div className="space-y-0.5 px-2 max-h-64 overflow-y-auto"
           style={{ scrollbarWidth: 'thin' }}>
        <button onClick={() => setTag('all')} className={tagBtnClass(activeTag === 'all')}>
          All
        </button>
        {tags.map(tag => {
          const name  = typeof tag === 'string' ? tag : tag.name || tag._id;
          const count = tag.count;
          return (
            <button key={name} onClick={() => setTag(name)} className={tagBtnClass(activeTag === name)}>
              <span className="flex items-center justify-between w-full">
                <span className="truncate">{name}</span>
                {count && <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>{count}</span>}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sort */}
      <SectionLabel>Sort</SectionLabel>
      <div className="px-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
             style={{ background: 'var(--gallery-filter-hover-bg,#f8fafc)' }}>
          <SlidersHorizontal size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <select
            value={sortBy}
            onChange={e => setSort(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
          >
            <option value="createdAt">Newest</option>
            <option value="views">Most viewed</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ExplorePanel;
