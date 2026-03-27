import React, { useState, useCallback } from 'react';
import { Heart, Bookmark } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

/**
 * FavoriteButton — 通用收藏按钮
 * @param {string} targetType  - 'sref' | 'gallery' | 'seedance'
 * @param {string} targetId    - 内容 ID
 * @param {boolean} initialFavorited - 初始收藏状态（可选）
 * @param {string} className   - 额外样式类
 * @param {string} size        - 图标大小 (px)
 */
const FavoriteButton = ({
  targetType,
  targetId,
  initialFavorited = false,
  className = '',
  size = 16,
  iconType = 'heart',
}) => {
  const { isAuthenticated, openLoginModal } = useAuth();
  const { t } = useTranslation();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [loading, setLoading] = useState(false);

  const handleClick = useCallback(async (e) => {
    e.stopPropagation(); // 防止触发卡片点击
    e.preventDefault();

    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (loading) return;
    setLoading(true);

    // 乐观更新
    const prev = favorited;
    setFavorited(!prev);

    try {
      if (prev) {
        await axios.delete(`/api/favorites/${targetType}/${targetId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success(t('favorites.actions.unfavoriteSuccess'));
      } else {
        await axios.post('/api/favorites', { targetType, targetId }, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        toast.success(t('favorites.actions.favoriteSuccess'));
      }
    } catch (err) {
      setFavorited(prev);
      if (err.response?.status === 409) {
        // 已收藏，状态同步一下
        setFavorited(true);
      } else {
        toast.error(t('favorites.actions.favoriteFailed'));
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, openLoginModal, loading, favorited, targetType, targetId, t]);

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`flex items-center justify-center rounded-full transition-all duration-200 ${className}`}
      style={{
        opacity: loading ? 0.6 : 1,
        cursor: loading ? 'wait' : 'pointer',
      }}
      aria-label={favorited ? t('favorites.actions.unfavorite') : t('favorites.actions.favorite')}
      title={favorited ? t('favorites.actions.unfavorite') : t('favorites.actions.favorite')}
    >
      {iconType === 'bookmark' ? (
        <Bookmark
          size={size}
          fill={favorited ? 'currentColor' : 'none'}
          style={{
            color: favorited ? '#818cf8' : 'currentColor',
            transition: 'all 0.2s ease',
            transform: loading ? 'scale(0.85)' : 'scale(1)',
          }}
        />
      ) : (
        <Heart
          size={size}
          fill={favorited ? 'currentColor' : 'none'}
          style={{
            color: favorited ? '#ef4444' : 'currentColor',
            transition: 'all 0.2s ease',
            transform: loading ? 'scale(0.85)' : 'scale(1)',
          }}
        />
      )}
    </button>
  );
};

export default FavoriteButton;
