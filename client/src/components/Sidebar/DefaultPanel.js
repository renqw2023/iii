/**
 * DefaultPanel — 普通页面（history / dashboard / settings 等）
 * 显示 Tags 导航手风琴 + Recent Updates 快捷入口
 */
import React, { useState } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Tag, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { srefAPI } from '../../services/srefApi';

const SectionLabel = ({ children }) => (
  <p className="px-3 mb-1 uppercase tracking-wider"
     style={{ fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 600 }}>
    {children}
  </p>
);

const DefaultPanel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [tagsOpen, setTagsOpen] = useState(true);

  const activeTag = searchParams.get('tag') || 'all';

  const { data: tagsData } = useQuery(
    ['sref-tags'],
    () => srefAPI.getPopularTags(8),
    { staleTime: 5 * 60_000 }
  );
  const tags = tagsData?.data?.tags?.slice(0, 6) || [];

  const tagItemClass = (active) =>
    `flex items-center gap-2 pl-7 pr-3 py-1.5 rounded-lg cursor-pointer text-sm transition-colors
     ${active
       ? 'bg-[var(--gallery-filter-active-bg,#f1f5f9)] text-[var(--text-primary)] font-medium'
       : 'text-[var(--text-secondary)] hover:bg-[var(--gallery-filter-hover-bg,#f8fafc)] hover:text-[var(--text-primary)]'
     }`;

  const isExplore = location.pathname.startsWith('/explore');

  return (
    <div className="mb-4">
      <SectionLabel>Categories</SectionLabel>

      <button
        onClick={() => setTagsOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors
          text-[var(--text-secondary)] hover:bg-[var(--gallery-filter-hover-bg,#f8fafc)] hover:text-[var(--text-primary)]"
      >
        <span className="flex items-center gap-3">
          <Tag size={18} className="flex-shrink-0" />
          Tags
        </span>
        {tagsOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {tagsOpen && (
        <div className="mt-0.5 space-y-0.5">
          <div onClick={() => navigate('/explore')}
               className={tagItemClass(isExplore && activeTag === 'all')}>
            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: 'var(--text-tertiary)' }} />
            All
          </div>
          {tags.map(tag => {
            const name = typeof tag === 'string' ? tag : tag.name || tag._id;
            const active = isExplore && activeTag === name;
            return (
              <div key={name}
                   onClick={() => navigate(`/explore?tag=${encodeURIComponent(name)}`)}
                   className={`${tagItemClass(active)} truncate`}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: 'var(--text-tertiary)' }} />
                <span className="truncate">{name}</span>
              </div>
            );
          })}
        </div>
      )}

      <Link to="/explore?sort=createdAt"
            className="mt-0.5 flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
              text-[var(--text-secondary)] hover:bg-[var(--gallery-filter-hover-bg,#f8fafc)] hover:text-[var(--text-primary)]">
        <Clock size={18} className="flex-shrink-0" />
        Recent Updates
      </Link>
    </div>
  );
};

export default DefaultPanel;
