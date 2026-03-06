import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Palette, Image, Film } from 'lucide-react';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { favoritesAPI } from '../services/favoritesApi';
import toast from 'react-hot-toast';

const TABS = [
  { key: 'sref',     label: 'Sref',    icon: Palette, color: '#a855f7' },
  { key: 'gallery',  label: 'Gallery', icon: Image,   color: '#3b82f6' },
  { key: 'seedance', label: 'Video',   icon: Film,    color: '#10b981' },
];

const FavCard = ({ item, onRemove, navigate }) => {
  const { targetType, target } = item;
  if (!target) return null;

  const image = target.previewImage || target.thumbnailUrl || '';
  const title = target.title || target.srefCode || target.prompt?.substring(0, 40) || '';
  const url =
    targetType === 'sref'     ? `/explore/${target._id}` :
    targetType === 'gallery'  ? `/gallery/${target._id}` :
    `/seedance/${target._id}`;

  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer"
      style={{ border: '1px solid var(--border-color)' }}
      onClick={() => navigate(url, { state: { fromList: true } })}
    >
      <div className="aspect-square" style={{ backgroundColor: 'var(--bg-card)' }}>
        {image ? (
          <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-20">
            <Heart size={32} />
          </div>
        )}
      </div>
      <div className="p-2" style={{ backgroundColor: 'var(--bg-card)' }}>
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {title}
        </p>
      </div>
      {/* hover 取消收藏 */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(item); }}
        className="absolute top-1.5 right-1.5 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff' }}
        title="取消收藏"
      >
        <Heart size={12} fill="currentColor" style={{ color: '#ef4444' }} />
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

  const fetchFavorites = useCallback(async (type, p = 1) => {
    setLoading(true);
    try {
      const res = await favoritesAPI.getList(type, p, 24);
      const data = res.data.data;
      setItems(data.favorites || []);
      setTotalPages(data.pagination?.pages || 1);
      setPage(data.pagination?.current || 1);
    } catch {
      toast.error('获取收藏失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFavorites(activeTab, 1);
  }, [activeTab, fetchFavorites]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleRemove = async (item) => {
    try {
      await favoritesAPI.remove(item.targetType, item.targetId);
      setItems(prev => prev.filter(i => i._id !== item._id));
      toast.success('已取消收藏');
    } catch {
      toast.error('操作失败');
    }
  };

  const tabInfo = TABS.find(t => t.key === activeTab);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* 标题 */}
      <div className="flex items-center gap-3 mb-6">
        <Heart size={22} style={{ color: '#ef4444' }} fill="currentColor" />
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
          我的收藏
        </h1>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-2 mb-6">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                backgroundColor: active ? tab.color : 'var(--bg-card)',
                color: active ? '#fff' : 'var(--text-secondary)',
                border: `1px solid ${active ? tab.color : 'var(--border-color)'}`,
              }}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 内容区 */}
      {loading ? (
        <div className="flex justify-center py-20">
          <LoadingSpinner size="md" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-tertiary)' }}>
          {tabInfo && <tabInfo.icon size={48} className="mx-auto mb-4 opacity-20" />}
          <p className="text-base">暂无 {tabInfo?.label} 收藏</p>
          <p className="text-sm mt-1 opacity-60">在卡片上点击心形图标即可收藏</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map(item => (
              <FavCard
                key={item._id}
                item={item}
                onRemove={handleRemove}
                navigate={navigate}
              />
            ))}
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  onClick={() => fetchFavorites(activeTab, p)}
                  className="w-8 h-8 rounded-lg text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: p === page ? 'var(--accent-primary)' : 'var(--bg-card)',
                    color: p === page ? '#fff' : 'var(--text-secondary)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Favorites;
