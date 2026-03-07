import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Clock, Image, Palette } from 'lucide-react';
import { searchSref, searchGallery } from '../../services/searchApi';
import { useBrowsingHistory } from '../../hooks/useBrowsingHistory';

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const SearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [srefResults, setSrefResults] = useState([]);
  const [galleryResults, setGalleryResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { getHistory } = useBrowsingHistory();
  const history = getHistory();

  const debouncedQuery = useDebounce(query, 300);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSrefResults([]);
      setGalleryResults([]);
    }
  }, [isOpen]);

  // ESC to close
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleKeyDown]);

  // Search
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSrefResults([]);
      setGalleryResults([]);
      return;
    }
    setIsLoading(true);
    Promise.all([
      searchSref(debouncedQuery, 5).catch(() => null),
      searchGallery(debouncedQuery, 5).catch(() => null),
    ]).then(([srefRes, galleryRes]) => {
      setSrefResults(srefRes?.data?.srefs || srefRes?.data?.data || []);
      setGalleryResults(galleryRes?.data?.prompts || galleryRes?.data?.data || []);
    }).finally(() => setIsLoading(false));
  }, [debouncedQuery]);

  const goTo = (url) => {
    navigate(url);
    onClose();
  };

  const hasResults = srefResults.length > 0 || galleryResults.length > 0;
  const showHistory = !query.trim() && history.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[998] flex items-start justify-center pt-20 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            className="relative w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
            initial={{ opacity: 0, y: -20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <Search size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                type="text"
                placeholder="搜索 Sref 风格、Gallery 图片..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: 'var(--text-primary)' }}
              />
              {query && (
                <button onClick={() => setQuery('')} style={{ color: 'var(--text-tertiary)' }}>
                  <X size={16} />
                </button>
              )}
              {isLoading && (
                <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)' }} />
              )}
            </div>

            {/* Results / History */}
            <div className="max-h-96 overflow-y-auto">
              {/* Browsing history when empty */}
              {showHistory && (
                <div className="p-3">
                  <p className="text-xs font-medium px-2 mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                    <Clock size={12} /> 最近浏览
                  </p>
                  {history.slice(0, 6).map((item) => (
                    <button
                      key={item.id}
                      onClick={() => goTo(item.url)}
                      className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors hover:bg-white/5"
                    >
                      {item.image ? (
                        <img src={item.image} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-md flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                          <Image size={14} style={{ color: 'var(--text-tertiary)' }} />
                        </div>
                      )}
                      <span className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.title}</span>
                      <span className="text-xs ml-auto flex-shrink-0" style={{ color: 'var(--text-tertiary)' }}>
                        {item.type === 'sref' ? 'Sref' : item.type === 'gallery' ? 'Gallery' : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Search results */}
              {query.trim() && !isLoading && (
                <div className="p-3 space-y-4">
                  {/* Sref results */}
                  {srefResults.length > 0 && (
                    <div>
                      <p className="text-xs font-medium px-2 mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                        <Palette size={12} /> Sref 风格
                      </p>
                      {srefResults.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => goTo(`/explore/${item._id}`)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors hover:bg-white/5"
                        >
                          {item.images?.[0] ? (
                            <img src={item.images[0]} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-md flex-shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{item.sref || item.code || item._id}</p>
                            {item.tags?.length > 0 && (
                              <p className="text-xs truncate" style={{ color: 'var(--text-tertiary)' }}>{item.tags.slice(0, 3).join(' · ')}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Gallery results */}
                  {galleryResults.length > 0 && (
                    <div>
                      <p className="text-xs font-medium px-2 mb-2 flex items-center gap-1.5" style={{ color: 'var(--text-tertiary)' }}>
                        <Image size={12} /> Gallery 图片
                      </p>
                      {galleryResults.map((item) => (
                        <button
                          key={item._id}
                          onClick={() => goTo(`/gallery/${item._id}`)}
                          className="w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors hover:bg-white/5"
                        >
                          {item.previewImage ? (
                            <img src={item.previewImage} alt="" className="w-8 h-8 rounded-md object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded-md flex-shrink-0" style={{ backgroundColor: 'var(--bg-tertiary)' }} />
                          )}
                          <p className="text-sm truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                            {item.title || item.prompt?.substring(0, 50) || 'Gallery'}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}

                  {!hasResults && (
                    <div className="text-center py-8">
                      <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>没有找到 "{query}" 相关内容</p>
                    </div>
                  )}
                </div>
              )}

              {!query.trim() && !showHistory && (
                <div className="text-center py-10">
                  <Search size={32} className="mx-auto mb-3 opacity-20" style={{ color: 'var(--text-tertiary)' }} />
                  <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>输入关键词搜索</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;
