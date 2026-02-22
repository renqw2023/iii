import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Grid, List, Search, Filter, Trash2, Share2 } from 'lucide-react';
import PostCard from '../components/Post/PostCard';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { enhancedUserAPI } from '../services/enhancedApi';
import { useTranslation } from 'react-i18next';

const Favorites = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('dateAdded');
  const [selectedItems, setSelectedItems] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const isLoading = false;

  // 获取收藏列表
  const fetchFavorites = useCallback(async (page = 1) => {
    try {
      setError(null);
      const response = await enhancedUserAPI.getFavorites({ page, limit: 12 });
      setFavorites(response.data.favorites);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('获取收藏列表失败:', error);
      setError(t('favorites.error.loadFailed'));
    }
  }, [t]);



  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    }
  }, [user?.id, fetchFavorites]); // 添加fetchFavorites依赖

  const handleSearch = (e) => {
    e.preventDefault();
    // 实际搜索逻辑
  };

  const handleSelectItem = (itemId) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === favorites.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(favorites.map(fav => fav._id));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(selectedItems.map(id => enhancedUserAPI.toggleFavorite(id)));
      setFavorites(prev => prev.filter(fav => !selectedItems.includes(fav._id)));
      setSelectedItems([]);
      setIsSelectionMode(false);
    } catch (error) {
      console.error('批量删除失败:', error);
      alert(t('favorites.error.deleteFailed'));
    }
  };

  const handleShareSelected = () => {
    // 实际分享逻辑
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={() => fetchFavorites()} className="btn btn-primary">
            {t('common.reload')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <Heart className="w-8 h-8 text-red-500" />
              {t('favorites.title')}
            </h1>
            <p className="text-slate-600">
              {t('favorites.count', { count: favorites.length })}
            </p>
          </div>

          {/* 批量操作按钮 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSelectionMode(!isSelectionMode)}
              className={`btn ${isSelectionMode ? 'btn-secondary' : 'btn-ghost'}`}
            >
              {isSelectionMode ? t('favorites.actions.cancelSelection') : t('favorites.actions.batchManage')}
            </button>
          </div>
        </motion.div>

        {/* 搜索和筛选区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="card p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('favorites.search.placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 pr-4"
                />
              </div>
            </form>

            <div className="flex items-center gap-4">
              {/* 排序选项 */}
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="select py-2 px-3 text-sm"
                >
                  <option value="dateAdded">{t('favorites.sort.dateAdded')}</option>
                  <option value="dateCreated">{t('favorites.sort.dateCreated')}</option>
                  <option value="popularity">{t('favorites.sort.popularity')}</option>
                  <option value="title">{t('favorites.sort.title')}</option>
                </select>
              </div>

              {/* 视图切换 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    viewMode === 'list'
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 批量操作栏 */}
          {isSelectionMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 pt-4 border-t border-slate-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.length === favorites.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300"
                    />
                    <span className="text-sm text-slate-600">
                      {t('favorites.actions.selectAll')} ({selectedItems.length}/{favorites.length})
                    </span>
                  </label>
                </div>

                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleShareSelected}
                      className="btn btn-ghost btn-sm"
                    >
                      <Share2 className="w-4 h-4 mr-2" />
                      {t('favorites.actions.share')}
                    </button>
                    <button
                      onClick={handleDeleteSelected}
                      className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {t('favorites.actions.remove')}
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>

        {/* 收藏列表 */}
        {favorites.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favorites.map((favorite, index) => (
                  <motion.div
                    key={favorite._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative"
                  >
                    {isSelectionMode && (
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(favorite._id)}
                          onChange={() => handleSelectItem(favorite._id)}
                          className="w-5 h-5 rounded border-slate-300 bg-white/90 backdrop-blur-sm"
                        />
                      </div>
                    )}
                    <PostCard post={favorite.post || favorite} />
                    <div className="mt-2 text-xs text-slate-500 text-center">
                      {t('favorites.favoriteDate')} {new Date(favorite.dateAdded || favorite.createdAt).toLocaleDateString()}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {favorites.map((favorite, index) => (
                  <motion.div
                    key={favorite._id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="card p-6"
                  >
                    <div className="flex items-center gap-4">
                      {isSelectionMode && (
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(favorite._id)}
                          onChange={() => handleSelectItem(favorite._id)}
                          className="w-5 h-5 rounded border-slate-300"
                        />
                      )}
                      
                      <div className="w-24 h-24 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {(() => {
                          const firstMedia = favorite.post?.media?.[0] || favorite.media?.[0];
                          let imageUrl = '';
                          
                          if (firstMedia) {
                            if (firstMedia.type === 'video' && firstMedia.thumbnail) {
                              imageUrl = firstMedia.thumbnail;
                            } else {
                              imageUrl = firstMedia.url;
                            }
                          }
                          
                          return (
                            <img
                              src={imageUrl}
                              alt={favorite.post?.title || favorite.title}
                              className="w-full h-full object-cover"
                            />
                          );
                        })()}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-900 mb-1">
                          {favorite.post?.title || favorite.title}
                        </h3>
                        <p className="text-sm text-slate-600 mb-2 line-clamp-2">
                          {favorite.post?.description || favorite.description}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>
                            {t('favorites.author')}: {favorite.post?.author?.username || favorite.author?.username}
                          </span>
                          <span>
                            {t('favorites.favoriteDate')} {new Date(favorite.dateAdded || favorite.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center py-16"
          >
            <Heart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {t('favorites.empty.title')}
            </h3>
            <p className="text-slate-600 mb-6">
              {t('favorites.empty.description')}
            </p>
            <button className="btn btn-primary">
              {t('favorites.empty.exploreButton')}
            </button>
          </motion.div>
        )}
        
        {/* 分页 */}
        {pagination.pages > 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mt-8"
          >
            <div className="flex items-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => fetchFavorites(page)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    page === pagination.current
                      ? 'bg-primary-600 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Favorites;