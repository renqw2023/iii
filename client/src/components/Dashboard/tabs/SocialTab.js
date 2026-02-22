import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, UserPlus, Heart } from 'lucide-react';
import UserAvatar from '../../UserAvatar';
import { ANIMATION_CONFIG } from '../../../utils/dashboard/dashboardConstants';
import { getAnimationDelay, formatNumber } from '../../../utils/dashboard/dashboardHelpers';
import { useTranslation } from 'react-i18next';

const SocialTab = ({ 
  following, 
  followers,
  loading 
}) => {
  const { t } = useTranslation();
  const [activeSubTab, setActiveSubTab] = useState('following');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const currentData = activeSubTab === 'following' ? following : followers;
  const isEmpty = following.length === 0 && followers.length === 0;

  if (isEmpty) {
    return (
      <motion.div
        initial={ANIMATION_CONFIG.INITIAL}
        animate={ANIMATION_CONFIG.ANIMATE}
        transition={ANIMATION_CONFIG.TRANSITION}
        className="text-center py-12"
      >
        <div className="text-slate-400 mb-4">
          <Users className="w-16 h-16 mx-auto mb-4" />
        </div>
        <h3 className="text-lg font-medium text-slate-900 mb-2">
          {t('dashboard.social.empty.title')}
        </h3>
        <p className="text-slate-500 mb-6">
          {t('dashboard.social.empty.description')}
        </p>
        <a
          href="/explore/users"
          className="btn btn-primary"
        >
          {t('dashboard.social.empty.action')}
        </a>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 子标签页切换 */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveSubTab('following')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'following'
              ? 'bg-primary-100 text-primary-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserPlus className="w-4 h-4 inline-block mr-2" />
          {t('dashboard.tabs.following')} ({following.length})
        </button>
        <button
          onClick={() => setActiveSubTab('followers')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeSubTab === 'followers'
              ? 'bg-primary-100 text-primary-700'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Heart className="w-4 h-4 inline-block mr-2" />
          {t('dashboard.tabs.followers')} ({followers.length})
        </button>
      </div>

      {/* 用户列表 */}
      {currentData.length === 0 ? (
        <motion.div
          initial={ANIMATION_CONFIG.INITIAL}
          animate={ANIMATION_CONFIG.ANIMATE}
          transition={ANIMATION_CONFIG.TRANSITION}
          className="text-center py-8"
        >
          <div className="text-slate-400 mb-4">
            {activeSubTab === 'following' ? (
              <UserPlus className="w-12 h-12 mx-auto mb-4" />
            ) : (
              <Heart className="w-12 h-12 mx-auto mb-4" />
            )}
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {activeSubTab === 'following' 
              ? t('dashboard.following.empty.title')
              : t('dashboard.followers.empty.title')
            }
          </h3>
          <p className="text-slate-500">
            {activeSubTab === 'following' 
              ? t('dashboard.following.empty.description')
              : t('dashboard.followers.empty.description')
            }
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {currentData.map((user, index) => (
            <motion.div
              key={user._id}
              initial={ANIMATION_CONFIG.INITIAL}
              animate={ANIMATION_CONFIG.ANIMATE}
              transition={{
                ...ANIMATION_CONFIG.TRANSITION,
                delay: getAnimationDelay(index)
              }}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <UserAvatar 
                    user={user} 
                    size="md" 
                    className="ring-2 ring-white shadow-sm"
                  />
                  <div>
                    <h3 className="font-medium text-slate-900">
                      {user.username}
                    </h3>
                    {user.bio && (
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">
                        {user.bio}
                      </p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-sm text-slate-500">
                      <span>
                        {formatNumber(user.followersCount || 0)} {t('dashboard.stats.followers')}
                      </span>
                      <span>
                        {formatNumber(user.followingCount || 0)} {t('dashboard.stats.following')}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <a
                    href={`/profile/${user.username}`}
                    className="btn btn-outline btn-sm"
                  >
                    {t('dashboard.social.viewProfile')}
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SocialTab;