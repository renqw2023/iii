import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { enhancedNotificationAPI } from '../services/enhancedApi';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    email: true,
    push: true,
    likes: true,
    comments: true,
    follows: true
  });

  // 使用ref来避免useEffect依赖问题
  const isAuthenticatedRef = useRef(isAuthenticated);
  isAuthenticatedRef.current = isAuthenticated;

  // 获取未读通知数量
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticatedRef.current) return;
    
    try {
      const response = await enhancedNotificationAPI.getUnreadCount();
      setUnreadCount(response.data.data.unreadCount || 0);
    } catch (error) {
      console.error('获取未读通知数量失败:', error);
      // 如果是429错误，不要重复请求
      if (error.response?.status === 429) {
        console.warn('Request rate too high, skipping this request');
        return;
      }
    }
  }, []); // 移除isAuthenticated依赖

  // 获取通知列表
  const fetchNotifications = useCallback(async (params = {}) => {
    if (!isAuthenticatedRef.current) return;
    
    setIsLoading(true);
    try {
      const response = await enhancedNotificationAPI.getNotifications(params);
      setNotifications(response.data.data.notifications || []);
      return response.data.data;
    } catch (error) {
      console.error('获取通知失败:', error);
      setNotifications([]);
      // 如果是429错误，不要重复请求
      if (error.response?.status === 429) {
        console.warn('请求频率过高，跳过此次请求');
        return;
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []); // 移除isAuthenticated依赖

  // 标记通知为已读
  const markAsRead = async (notificationId) => {
    try {
      await enhancedNotificationAPI.markAsRead(notificationId);
      
      setNotifications(prev => 
        (prev || []).map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('标记通知已读失败:', error);
      if (error.response?.status !== 429) {
        throw error;
      }
    }
  };

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      await enhancedNotificationAPI.markAllAsRead();
      
      setNotifications(prev => 
        (prev || []).map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('标记所有通知已读失败:', error);
      if (error.response?.status !== 429) {
        throw error;
      }
    }
  };

  // 删除通知
  const deleteNotification = async (notificationId) => {
    try {
      await enhancedNotificationAPI.deleteNotification(notificationId);
      
      const notification = (notifications || []).find(n => n._id === notificationId);
      setNotifications(prev => (prev || []).filter(n => n._id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('删除通知失败:', error);
      if (error.response?.status !== 429) {
        throw error;
      }
    }
  };

  // 清除已读通知
  const clearReadNotifications = async () => {
    try {
      await enhancedNotificationAPI.clearReadNotifications();
      setNotifications(prev => (prev || []).filter(notification => !notification.read));
    } catch (error) {
      console.error('清除已读通知失败:', error);
      if (error.response?.status !== 429) {
        throw error;
      }
    }
  };

  // 更新通知设置
  const updateSettings = async (newSettings) => {
    try {
      await enhancedNotificationAPI.updateSettings(newSettings);
      setSettings(newSettings);
    } catch (error) {
      console.error('更新通知设置失败:', error);
      if (error.response?.status !== 429) {
        throw error;
      }
    }
  };

  // 格式化时间
  const formatTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return '刚刚';
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}小时前`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}天前`;
    
    return date.toLocaleDateString();
  };

  // 初始化时获取通知 - 使用更安全的方式
  useEffect(() => {
    let isMounted = true;
    
    const loadNotifications = async () => {
      if (isAuthenticated && isMounted) {
        try {
          // 使用Promise.allSettled避免一个请求失败影响另一个
          const results = await Promise.allSettled([
            fetchNotifications(),
            fetchUnreadCount()
          ]);
          
          // 检查结果并记录错误
          results.forEach((result, index) => {
            if (result.status === 'rejected') {
              const apiName = index === 0 ? 'fetchNotifications' : 'fetchUnreadCount';
              console.warn(`${apiName} failed:`, result.reason);
            }
          });
        } catch (error) {
          console.error('加载通知失败:', error);
        }
      } else if (!isAuthenticated && isMounted) {
        setNotifications([]);
        setUnreadCount(0);
      }
    };
    
    loadNotifications();
    
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount]); // 现在可以安全地包含函数依赖

  const value = {
    notifications,
    unreadCount,
    isLoading,
    settings,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearReadNotifications,
    updateSettings,
    formatTime
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};