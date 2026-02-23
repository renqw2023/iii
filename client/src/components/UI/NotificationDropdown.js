import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  X,
  Check,
  CheckCheck
} from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';

const NotificationDropdown = () => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    formatTime
  } = useNotifications();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      default:
        return <Bell className="w-4 h-4 text-slate-500" />;
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* 通知按钮 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-all duration-200"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉菜单 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 py-2 z-50"
          >
            {/* 头部 */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
              <h3 className="font-semibold text-slate-900">{t('notifications.title')}</h3>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            {/* 通知列表 */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Bell className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p>{t('notifications.empty')}</p>
                </div>
              ) : (
                (notifications || []).map((notification) => (
                  <div
                    key={notification._id}
                    className={`relative group px-4 py-3 hover:bg-slate-50 transition-colors duration-200 ${
                      !notification.read ? 'bg-primary-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 通知图标 */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* 通知内容 */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatTime(notification.createdAt)}
                        </p>
                      </div>

                      {/* 未读标识 */}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2"></div>
                      )}

                      {/* 操作按钮 */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        {!notification.read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            className="p-1 text-slate-400 hover:text-green-600 rounded"
                            title={t('notifications.markAsRead')}
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 rounded"
                          title={t('notifications.delete')}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* 点击区域 */}
                    {notification.post && (
                      <Link
                        to={`/post/${notification.post._id}`}
                        className="absolute inset-0"
                        onClick={() => handleNotificationClick(notification)}
                      />
                    )}
                  </div>
                ))
              )}
            </div>

            {/* 底部 */}
            {notifications && notifications.length > 0 && (
              <div className="border-t border-slate-100 px-4 py-2">
                <Link
                  to="/notifications"
                  className="text-sm text-primary-600 hover:text-primary-700 block text-center"
                  onClick={() => setIsOpen(false)}
                >
                  {t('notifications.viewAll')}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 点击外部Close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationDropdown;