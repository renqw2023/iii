import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Palette, Image, Film } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { favoritesAPI } from '../services/favoritesApi';
import toast from 'react-hot-toast';
import { PageShell, SectionCard } from '../components/Page/PageShell';

const TABS = [
  { key: 'sref', label: 'Sref', icon: Palette, color: '#a855f7' },
  { key: 'gallery', label: 'Gallery', icon: Image, color: '#3b82f6' },
  { key: 'seedance', label: 'Video', icon: Film, color: '#10b981' },
];

const FavCard = ({ item, onRemove, navigate }) => {
  const { targetType, target } = item;
  if (!target) return null;

  const image = target.previewImage || target.thumbnailUrl || '';
  const title = target.title || target.srefCode || target.prompt?.substring(0, 40) || '';
  const url =
    targetType === 'sref'
      ? `/explore/${target._id}`
      : targetType === 'gallery'
        ? `/gallery/${target._id}`
        : `/seedance/${target._id}`;

  return (
    <div className="group relative overflow-hidden rounded-[22px] border" style={{ borderColor: 'var(--border-color)', backgroundColor: 'rgba(255,255,255,0.82)' }}>
      <button type="button" onClick={() => navigate(url, { state: { fromList: true } })} className="w-full text-left">
        <div className="aspect-[4/3]" style={{ backgroundColor: 'var(--bg-card)' }}>
          {image ? (
            <img src={image} alt={title} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex h-full items-center justify-center opacity-20">
              <Heart size={32} />
            </div>
          )}
        </div>
        <div className="p-4">
          <p className="line-clamp-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
        </div>
      </button>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onRemove(item);
        }}
        className="absolute right-3 top-3 rounded-full p-2 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ backgroundColor: 'rgba(15,23,42,0.72)', color: '#fff' }}
        title="Remove favorite"
      >
        <Heart size={13} fill="currentColor" style={{ color: '#ef4444' }} />
      </button>
    </div>
  );
};

const Favorites = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sref');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchFavorites = useCallback(async (type, currentPage = 1) => {
    setLoading(true);
    try {
      const response = await favoritesAPI.getList(type, currentPage, 24);
      const data = response.data.data;
      setItems(data.favorites || []);
      setTotalPages(data.pagination?.pages || 1);
      setPage(data.pagination?.current || 1);
    } catch {
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(activeTab, 1);
  }, [activeTab, fetchFavorites]);

  const handleRemove = async (item) => {
    try {
      await favoritesAPI.remove(item.targetType, item.targetId);
      setItems((prev) => prev.filter((entry) => entry._id !== item._id));
      toast.success('Removed from favorites');
    } catch {
      toast.error('Action failed');
    }
  };

  const tabInfo = TABS.find((tab) => tab.key === activeTab);

  return (
    <PageShell showHeader={false}>
      <SectionCard icon={<Heart size={20} />} title="Filter by saved type" description="Separate prompt references, gallery pieces, and video ideas so the collection stays usable as it grows.">
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className="flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors"
                style={{
                  borderColor: active ? 'transparent' : 'var(--border-color)',
                  backgroundColor: active ? tab.color : 'rgba(255,255,255,0.72)',
                  color: active ? '#fff' : 'var(--text-secondary)',
                }}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard icon={<Heart size={20} />} title={tabInfo ? `${tabInfo.label} collection` : 'Collection'} description="Saved cards stay lightweight here so you can scan quickly and remove things without opening a modal.">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner size="md" />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center" style={{ color: 'var(--text-tertiary)' }}>
            {tabInfo && <tabInfo.icon size={44} className="mx-auto mb-4 opacity-20" />}
            <p className="text-base">No saved {tabInfo?.label} yet</p>
            <p className="mt-1 text-sm opacity-70">Use the heart action on cards you want to keep for later.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((item) => (
                <FavCard key={item._id} item={item} onRemove={handleRemove} navigate={navigate} />
              ))}
            </div>

            {totalPages > 1 ? (
              <div className="mt-8 flex flex-wrap justify-center gap-2">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((currentPage) => (
                  <button
                    key={currentPage}
                    type="button"
                    onClick={() => fetchFavorites(activeTab, currentPage)}
                    className="h-9 w-9 rounded-full border text-sm font-medium transition-colors"
                    style={{
                      borderColor: 'var(--border-color)',
                      backgroundColor: currentPage === page ? 'var(--accent-primary)' : 'rgba(255,255,255,0.72)',
                      color: currentPage === page ? '#fff' : 'var(--text-secondary)',
                    }}
                  >
                    {currentPage}
                  </button>
                ))}
              </div>
            ) : null}
          </>
        )}
      </SectionCard>
    </PageShell>
  );
};

export default Favorites;
