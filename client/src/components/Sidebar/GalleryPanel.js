/**
 * GalleryPanel — AI Prompt Gallery 过滤面板
 * Search / Model / Style / Sort → 写入 URL searchParams
 */
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X, SlidersHorizontal } from 'lucide-react';

const SectionLabel = ({ children }) => (
  <p className="px-3 mb-1 mt-3 uppercase tracking-wider"
     style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
    {children}
  </p>
);

const MODELS = [
  { key: 'all',        label: 'All',            icon: '🔥' },
  { key: 'nanobanana', label: 'NanoBanana Pro',  icon: '🍌' },
  { key: 'gptimage',   label: 'GPT Image',       icon: '🤖' },
];

const STYLE_TAGS = [
  { key: 'all',                  label: 'All' },
  { key: 'photography',          label: 'Photography' },
  { key: 'cinematic-film-still', label: 'Cinematic' },
  { key: 'anime-manga',          label: 'Anime / Manga' },
  { key: '3d-render',            label: '3D Render' },
  { key: 'illustration',         label: 'Illustration' },
  { key: 'cyberpunk-sci-fi',     label: 'Cyberpunk / Sci-Fi' },
  { key: 'portrait-selfie',      label: 'Portrait' },
  { key: 'product',              label: 'Product' },
  { key: 'food-drink',           label: 'Food & Drink' },
];

const tagBtnClass = (active) =>
  `w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer
   ${active
     ? 'bg-[var(--gallery-filter-active-bg,#f1f5f9)] text-[var(--text-primary)] font-medium'
     : 'text-[var(--text-secondary)] hover:bg-[var(--gallery-filter-hover-bg,#f8fafc)] hover:text-[var(--text-primary)]'
   }`;

const GalleryPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');

  const model     = searchParams.get('model') || 'all';
  const activeTag = searchParams.get('tag')   || 'all';
  const sort      = searchParams.get('sort')  || 'newest';

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
            placeholder="Search prompts..."
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

      {/* Model */}
      <SectionLabel>Model</SectionLabel>
      <div className="space-y-0.5 px-2">
        {MODELS.map(m => (
          <button key={m.key} onClick={() => set('model', m.key, 'all')}
                  className={tagBtnClass(model === m.key)}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>

      {/* Style */}
      <SectionLabel>Style</SectionLabel>
      <div className="space-y-0.5 px-2">
        {STYLE_TAGS.map(t => (
          <button key={t.key} onClick={() => set('tag', t.key, 'all')}
                  className={tagBtnClass(activeTag === t.key)}>
            {t.label}
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

export default GalleryPanel;
