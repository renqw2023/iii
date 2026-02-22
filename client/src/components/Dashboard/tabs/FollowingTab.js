import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, MessageCircle } from 'lucide-react';
import UserAvatar from '../../UserAvatar';
import { ANIMATION_CONFIG } from '../../../utils/dashboard/dashboardConstants';
import { getAnimationDelay, formatNumber } from '../../../utils/dashboard/dashboardHelpers';
import { useTranslation } from 'react-i18next';

const FollowingTab = ({ 
  following, 
  loading 
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (following.length === 0) {
    return (
      <motion.div
        initial={ANIMATION_CONFIG.INITIAL}
        animate={ANIMATION_CONFIG.ANIMATE}
        transition={ANIMATION_CONFIG.TRANSITION}
        className="text-center py-12"
      >
        <div className="text-slate-400 mb-4">
          <UserPlus className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {t('dashboard.following.empty.title')}
        </h3>
        <p className="text-slate-500 mb-6">
          {t('dashboard.following.empty.description')}
        </p>
        <a
          href="/explore/users"
          className="btn btn-primary"
        >
          {t('dashboard.following.empty.action')}
        </a>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {following.map((followItem, index) => {
        const user = followItem.following;
        
        if (!user) return null;
        
        return (
          <motion.div
            key={user._id}
            initial={ANIMATION_CONFIG.INITIAL}
            animate={ANIMATION_CONFIG.ANIMATE}
            transition={{
              ...ANIMATION_CONFIG.TRANSITION,
              delay: getAnimationDelay(index)
            }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow duration-200"
          >
            {/* 用户头像和基本信息 */}
            <div className="flex items-center space-x-4 mb-4">
              <UserAvatar 
                user={user} 
                size="lg" 
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-slate-900 truncate">
                  {user.username}
                </h3>
                {user.bio && (
                  <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                    {user.bio}
                  </p>
                )}
              </div>
            </div>

            {/* 用户统计 */}
            <div className="grid grid-cols-3 gap-4 mb-4 text-center">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatNumber(user.stats?.postsCount || 0)}
                </div>
                <div className="text-xs text-slate-500">
                  {t('dashboard.following.stats.posts')}
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatNumber(user.stats?.followersCount || 0)}
                </div>
                <div className="text-xs text-slate-500">
                  {t('dashboard.following.stats.followers')}
                </div>
              </div>
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {formatNumber(user.stats?.totalLikes || 0)}
                </div>
                <div className="text-xs text-slate-500">
                  {t('dashboard.following.stats.likes')}
                </div>
              </div>
            </div>

            {/* 关注时间 */}
            <div className="text-xs text-slate-400 mb-4">
              {t('dashboard.following.followedAt')}: {new Date(followItem.createdAt).toLocaleDateString()}
            </div>

            {/* 操作按钮 */}
            <div className="flex space-x-2">
              <a
                href={`/user/${user.username}`}
                className="flex-1 btn btn-outline btn-sm"
              >
                {t('dashboard.following.actions.viewProfile')}
              </a>
              <button
                className="btn btn-outline btn-sm px-3"
                title={t('dashboard.following.actions.message')}
              >
                <MessageCircle className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default FollowingTab;