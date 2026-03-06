import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, Image, Film, Palette } from 'lucide-react';
import { useBrowsingHistory } from '../hooks/useBrowsingHistory';

const TYPE_ICONS = {
  sref:     { icon: Palette, label: 'Sref',    color: '#a855f7' },
  gallery:  { icon: Image,   label: 'Gallery', color: '#3b82f6' },
  seedance: { icon: Film,    label: 'Video',   color: '#10b981' },
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
    if (window.confirm('确定清空全部浏览历史？')) {
      clearHistory();
      setItems([]);
    }
  };

  const handleRemove = (id, type) => {
    removeFromHistory(id, type);
    setItems(prev => prev.filter(h => !(h.id === id && h.type === type)));
  };

  const filtered = filter === 'all' ? items : items.filter(h => h.type === filter);

  const formatTime = (iso) => {
    const date = new Date(iso);
    const now = new Date();
    const diff = now - date;
    if (diff < 60 * 1000) return '刚刚';
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} 分钟前`;
    if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / 3600000)} 小时前`;
    return date.toLocaleDateString('zh-CN');
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Clock size={24} />
          浏览历史
        </h1>
        {items.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' }}
          >
            <Trash2 size={14} />
            清空历史
          </button>
        )}
      </div>

      {/* 筛选 Tab */}
      <div className="flex gap-2 mb-5">
        {['all', 'sref', 'gallery', 'seedance'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className="px-3 py-1.5 text-sm rounded-lg transition-colors"
            style={{
              backgroundColor: filter === t ? 'var(--accent-primary)' : 'var(--bg-card)',
              color: filter === t ? '#fff' : 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
            }}
          >
            {{ all: '全部', sref: 'Sref', gallery: 'Gallery', seedance: '视频' }[t]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-tertiary)' }}>
          <Clock size={48} className="mx-auto mb-4 opacity-20" />
          <p>暂无浏览记录</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {filtered.map(item => {
            const typeInfo = TYPE_ICONS[item.type] || TYPE_ICONS.gallery;
            const TypeIcon = typeInfo.icon;
            return (
              <div
                key={`${item.type}-${item.id}`}
                className="group relative rounded-xl overflow-hidden cursor-pointer"
                style={{ border: '1px solid var(--border-color)' }}
                onClick={() => navigate(item.url, { state: { fromList: true } })}
              >
                {/* 图片 */}
                <div className="aspect-square bg-gray-800">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                      <TypeIcon size={32} />
                    </div>
                  )}
                </div>

                {/* 底部信息 */}
                <div
                  className="p-2"
                  style={{ backgroundColor: 'var(--bg-card)' }}
                >
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs" style={{ color: typeInfo.color }}>
                      {typeInfo.label}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatTime(item.visitedAt)}
                    </span>
                  </div>
                </div>

                {/* hover 删除按钮 */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(item.id, item.type); }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff' }}
                  title="移除"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default History;
