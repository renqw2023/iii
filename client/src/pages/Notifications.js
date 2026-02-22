import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  Star, 
  Trash2, 
  Check, 
  CheckCheck,
  Filter
} from 'lucide-react';
// 移除未使用的导入: Settings as SettingsIcon
import { useNotifications } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
// import { Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const Notifications = () => {
  const { t } = useTranslation();
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications
  } = useNotifications();

  const [filter, setFilter] = useState('all'); // all, unread, read
  const [typeFilter, setTypeFilter] = useState('all'); // all, like, comment, follow, system

  // 获取通知图标
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'unfollow':
        return <UserPlus className="w-5 h-5 text-gray-500" />;
      case 'post_featured':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'system':
        return <Bell className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  // 获取通知类型文本
  const getNotificationTypeText = (type) => {
    switch (type) {
      case 'like':
        return t('notifications.types.like');
      case 'comment':
        return t('notifications.types.comment');
      case 'follow':
        return t('notifications.types.follow');
      case 'unfollow':
        return t('notifications.types.unfollow');
      case 'post_featured':
        return t('notifications.types.post_featured');
      case 'system':
        return t('notifications.types.system');
      default:
        return t('notifications.types.default');
    }
  };

  // 过滤通知
  const filteredNotifications = (notifications || []).filter(notification => {
    // 按读取状态过滤
    if (filter === 'unread' && notification.read) return false;
    if (filter === 'read' && !notification.read) return false;
    
    // 按类型过滤
    if (typeFilter !== 'all' && notification.type !== typeFilter) return false;
    
    return true;
  });

  // 处理通知点击
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        await markAsRead(notification._id);
      } catch (error) {
        console.error('标记通知已读失败:', error);
      }
    }
  };

  // 处理删除通知
  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await deleteNotification(notificationId);
      toast.success(t('notifications.messages.deleted'));
    } catch (error) {
      console.error('删除通知失败:', error);
      toast.error(t('notifications.messages.deleteFailed'));
    }
  };

  // 处理全部标记为已读
  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success(t('notifications.messages.allMarkedAsRead'));
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
      toast.error(t('notifications.messages.operationFailed'));
    }
  };

  // 处理清除已读通知
  const handleClearReadNotifications = async () => {
    try {
      await clearReadNotifications();
      toast.success(t('notifications.messages.readCleared'));
    } catch (error) {
      console.error('清除已读通知失败:', error);
      toast.error(t('notifications.messages.clearFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* 页面标题 */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Bell className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {t('notifications.title')}
                </h1>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-sm px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>{t('notifications.actions.markAllRead')}</span>
                  </button>
                )}
                
                <button
                  onClick={handleClearReadNotifications}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('notifications.actions.clearRead')}</span>
                </button>
              </div>
            </div>
          </motion.div>

          {/* 过滤器 */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 mb-6 shadow-lg"
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('notifications.filter.label')}:</span>
              </div>
              
              {/* 读取状态过滤 */}
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: t('notifications.filter.all') },
                  { key: 'unread', label: t('notifications.filter.unread') },
                  { key: 'read', label: t('notifications.filter.read') }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setFilter(item.key)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filter === item.key
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              
              {/* 类型过滤 */}
              <div className="flex space-x-2">
                {[
                  { key: 'all', label: t('notifications.filter.allTypes') },
                  { key: 'like', label: t('notifications.types.like') },
                  { key: 'comment', label: t('notifications.types.comment') },
                  { key: 'follow', label: t('notifications.types.follow') },
                  { key: 'system', label: t('notifications.types.system') }
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => setTypeFilter(item.key)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      typeFilter === item.key
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* 通知列表 */}
          <div className="space-y-4">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-lg"
                >
                  <Bell className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-500 dark:text-gray-400 mb-2">
                    {t('notifications.empty.title')}
                  </h3>
                  <p className="text-gray-400 dark:text-gray-500">
                    {filter === 'unread' ? t('notifications.empty.noUnread') : filter === 'read' ? t('notifications.empty.noRead') : t('notifications.empty.noNotifications')}
                  </p>
                </motion.div>
              ) : (
                filteredNotifications.map((notification, index) => (
                  <motion.div
                    key={notification._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl ${
                      !notification.read ? 'border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      {/* 通知图标 */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      
                      {/* 通知内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-gray-900 dark:text-white font-medium">
                              {notification.message}
                            </p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                {getNotificationTypeText(notification.type)}
                              </span>
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDistanceToNow(new Date(notification.createdAt), {
                                  addSuffix: true,
                                  locale: zhCN
                                })}
                              </span>
                              {!notification.read && (
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                              )}
                            </div>
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                title={t('notifications.actions.markAsRead')}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => handleDeleteNotification(notification._id, e)}
                              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                              title={t('notifications.actions.delete')}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;