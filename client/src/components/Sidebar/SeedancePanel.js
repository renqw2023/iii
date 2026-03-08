/**
 * SeedancePanel — Seedance Video Prompts 过滤面板
 * Search / Category / Sort → 写入 URL searchParams
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { seedanceAPI } from '../../services/seedanceApi';

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

const SeedancePanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const category = searchParams.get('category') || 'all';
  const sort     = searchParams.get('sort')     || 'newest';

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

  const set = (key, value, defaultVal) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev);
      if (value === defaultVal) p.delete(key); else p.set(key, value);
      return p;
    }, { replace: true });
  };

  const { data: categoriesData } = useQuery(
    'seedance-categories',
    () => seedanceAPI.getCategories(),
    { staleTime: 60_000 }
  );
  const categories = categoriesData?.data?.categories || [];

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
            placeholder="Search video prompts..."
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

      {/* Category */}
      <SectionLabel>Category</SectionLabel>
      <div className="space-y-0.5 px-2 max-h-52 overflow-y-auto"
           style={{ scrollbarWidth: 'thin' }}>
        <button onClick={() => set('category', 'all', 'all')}
                className={tagBtnClass(category === 'all')}>
          All
        </button>
        {categories.map(cat => (
          <button key={cat.name} onClick={() => set('category', cat.name, 'all')}
                  className={tagBtnClass(category === cat.name)}>
            <span className="flex items-center justify-between w-full">
              <span className="truncate">{cat.name}</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', flexShrink: 0 }}>{cat.count}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Sort */}
      <SectionLabel>Sort</SectionLabel>
      <div className="px-2">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
             style={{ background: 'var(--gallery-filter-hover-bg,#f8fafc)' }}>
          <SlidersHorizontal size={13} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
          <select
            value={sort}
            onChange={e => set('sort', e.target.value, 'newest')}
            className="flex-1 bg-transparent text-sm outline-none cursor-pointer"
            style={{ color: 'var(--text-primary)' }}
          >
            <option value="newest">Newest</option>
            <option value="popular">Most liked</option>
            <option value="most-copied">Trending</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SeedancePanel;
