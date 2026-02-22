import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Settings, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../../utils/avatarUtils';

const DashboardHeader = ({ user }) => {
  const { t } = useTranslation();

  // 如果用户信息不存在，显示加载状态
  if (!user) {
    return (
      <div className="card p-6 mb-8 animate-pulse">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-slate-200 rounded-full"></div>
          <div className="space-y-2">
            <div className="h-6 bg-slate-200 rounded w-32"></div>
            <div className="h-4 bg-slate-200 rounded w-48"></div>
            <div className="h-3 bg-slate-200 rounded w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="card p-6 mb-8"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
        {/* 用户信息区域 */}
        <div className="flex items-center space-x-4 mb-4 md:mb-0">
          <img
            src={getUserAvatar(user)}
            alt={user?.username || '用户头像'}
            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
            onError={(e) => {
              e.target.src = DEFAULT_FALLBACK_AVATAR;
            }}
          />
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {user?.username || t('dashboard.welcome')}
            </h1>
            <p className="text-slate-600 mb-2">
              {user?.bio || t('dashboard.profile.defaultBio')}
            </p>
            <div className="flex items-center space-x-1 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>
                {t('dashboard.profile.joinedAt')} {new Date(user?.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* 操作按钮区域 */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <Link to="/create" className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              {t('dashboard.profile.createNew')}
            </Link>
            <Link to="/create-prompt" className="btn btn-secondary">
              <Plus className="w-4 h-4 mr-2" />
              创建提示词
            </Link>
          </div>
          <Link to="/settings" className="btn btn-secondary">
            <Settings className="w-4 h-4 mr-2" />
            {t('dashboard.profile.settings')}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;