import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, Image, Film, Palette, ArrowRight } from 'lucide-react';
import { useBrowsingHistory } from '../hooks/useBrowsingHistory';
import { PageShell, SectionCard } from '../components/Page/PageShell';

const TYPE_ICONS = {
  sref: { icon: Palette, label: 'Sref', color: '#a855f7' },
  gallery: { icon: Image, label: 'Gallery', color: '#3b82f6' },
  seedance: { icon: Film, label: 'Video', color: '#10b981' },
};

const History = () => {
  const navigate = useNavigate();
  const { getHistory, clearHistory, removeFromHistory } = useBrowsingHistory();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    setItems(getHistory());
  }, [getHistory]);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear your browsing history?')) {
      clearHistory();
      setItems([]);
    }
  };

  const handleRemove = (id, type) => {
    removeFromHistory(id, type);
    setItems((prev) => prev.filter((entry) => !(entry.id === id && entry.type === type)));
  };

  const filtered = filter === 'all' ? items : items.filter((item) => item.type === filter);

  const formatTime = (iso) => {
    const date = new Date(iso);
    const diff = Date.now() - date.getTime();
    if (diff < 60 * 1000) return 'Just now';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <PageShell
      showHeader={false}
      actions={
        items.length > 0 ? (
          <button type="button" onClick={handleClear} className="btn btn-secondary" style={{ color: '#dc2626' }}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear history
          </button>
        ) : null
      }
    >
      <SectionCard icon={<Clock size={20} />} title="Browse History" description="Use these filters to narrow the return path instead of scanning the full archive.">
        <div className="flex flex-wrap gap-2">
          {['all', 'sref', 'gallery', 'seedance'].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilter(type)}
              className="rounded-full border px-4 py-2 text-sm transition-colors"
              style={{
                borderColor: filter === type ? 'transparent' : 'var(--border-color)',
                backgroundColor: filter === type ? 'var(--accent-primary)' : 'rgba(255,255,255,0.72)',
                color: filter === type ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {{ all: 'All', sref: 'Sref', gallery: 'Gallery', seedance: 'Video' }[type]}
            </button>
          ))}
        </div>
      </SectionCard>

      {filtered.length === 0 ? (
        <SectionCard icon={<Clock size={20} />} title="No history yet" description="Once you open cards from Explore, Gallery, or Seedance, they will appear here for quick return.">
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Try opening a style, gallery item, or video prompt first.
          </p>
        </SectionCard>
      ) : (
        <SectionCard icon={<ArrowRight size={20} />} title="Recent visits" description="Most recent items stay at the top so the page behaves like a working queue, not an archive.">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const typeInfo = TYPE_ICONS[item.type] || TYPE_ICONS.gallery;
              const TypeIcon = typeInfo.icon;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="group relative overflow-hidden rounded-[22px] border"
                  style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255,255,255,0.82)' }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(item.url, { state: { fromList: true } })}
                    className="w-full text-left"
                  >
                    <div className="aspect-[4/3] bg-slate-100">
                      {item.image ? (
                        <img src={item.image} alt={item.title} className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <div className="flex h-full items-center justify-center opacity-25">
                          <TypeIcon size={32} />
                        </div>
                      )}
                    </div>
                    <div className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold uppercase tracking-[0.16em]" style={{ color: typeInfo.color }}>
                          {typeInfo.label}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {formatTime(item.visitedAt)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {item.title}
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemove(item.id, item.type);
                    }}
                    className="absolute right-3 top-3 rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100"
                    style={{ backgroundColor: 'rgba(15,23,42,0.72)', color: '#fff' }}
                    title="Remove"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </SectionCard>
      )}
    </PageShell>
  );
};

export default History;
