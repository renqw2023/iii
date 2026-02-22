import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { enhancedPostAPI } from '../services/enhancedApi';
import LoadingSpinner from './UI/LoadingSpinner';

const RelatedPosts = ({ currentPostId, authorId }) => {
  const { t } = useTranslation();
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRelatedPosts = async () => {
      try {
        setLoading(true);
        // 获取同一作者的其他作品
        const response = await enhancedPostAPI.getPosts({
          author: authorId,
          limit: 3,
          exclude: currentPostId
        });
        
        setRelatedPosts(response.data.posts || []);
      } catch (error) {
        console.error(t('relatedPosts.error.loadFailed'), error);
        setError(t('relatedPosts.error.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    if (authorId && currentPostId) {
      fetchRelatedPosts();
    }
  }, [authorId, currentPostId, t]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-500">{error}</p>
      </div>
    );
  }

  if (relatedPosts.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-sm text-slate-500">{t('relatedPosts.empty')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {relatedPosts.map((post) => (
        <Link
          key={post._id}
          to={`/post/${post._id}`}
          className="flex space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200"
        >
          <div className="w-16 h-16 bg-slate-200 rounded-lg flex-shrink-0 overflow-hidden">
            {post.media && post.media[0] && (
              <img
                src={post.media[0].type === 'video' && post.media[0].thumbnail 
                  ? post.media[0].thumbnail 
                  : post.media[0].url}
                alt={post.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 如果缩略图加载失败，尝试使用原始文件
                  if (post.media[0].type === 'video' && e.target.src === post.media[0].thumbnail) {
                    e.target.src = post.media[0].url;
                  }
                }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 truncate">
              {post.title}
            </h4>
            <p className="text-sm text-slate-500 truncate">
              {post.description || t('relatedPosts.noDescription')}
            </p>
            <div className="flex items-center space-x-2 mt-1 text-xs text-slate-400">
              <span>{t('relatedPosts.stats.views', { count: post.views || 0 })}</span>
              <span>•</span>
              <span>{t('relatedPosts.stats.likes', { count: post.likes?.length || 0 })}</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default RelatedPosts;