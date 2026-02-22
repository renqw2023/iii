import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Palette,
  Camera,
  Save,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { enhancedUserAPI, enhancedNotificationAPI } from '../services/enhancedApi';
import { getUserAvatar, DEFAULT_FALLBACK_AVATAR } from '../utils/avatarUtils';
import AvatarSelector from '../components/AvatarSelector';
import toast from 'react-hot-toast';
import {
  THEME_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  PRIVACY_OPTIONS,
  NOTIFICATION_OPTIONS,
  DEFAULT_SETTINGS
} from '../config/settingsConfig';

const Settings = () => {
  const { t } = useTranslation();
  const { user, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);

  // 个人资料设置
  const [profileData, setProfileData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    avatar: user?.avatar || ''
  });

  // 隐私设置
  const [privacySettings, setPrivacySettings] = useState(DEFAULT_SETTINGS.privacy);

  // 通知设置
  const [notificationSettings, setNotificationSettings] = useState(DEFAULT_SETTINGS.notifications);

  // 外观设置
  const [appearanceSettings, setAppearanceSettings] = useState(DEFAULT_SETTINGS.appearance);

  // 数据加载状态
  const [dataLoaded, setDataLoaded] = useState(false);

  // 安全设置
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 账户删除
  const [deleteAccountData, setDeleteAccountData] = useState({
    password: '',
    showConfirmation: false
  });

  const tabs = [
    { id: 'profile', name: t('settings.tabs.profile'), icon: User },
    { id: 'privacy', name: t('settings.tabs.privacy'), icon: Shield },
    { id: 'notifications', name: t('settings.tabs.notifications'), icon: Bell },
    { id: 'security', name: t('settings.tabs.security'), icon: Lock },
    { id: 'appearance', name: t('settings.tabs.appearance'), icon: Palette }
  ];

  // 加载用户设置数据
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;
      
      try {
        // 从用户信息中加载隐私和外观设置
        if (user.settings) {
          // 隐私设置
          setPrivacySettings({
            profilePublic: user.settings.profileVisibility === 'public',
            showEmail: user.settings.showEmail || false,
            showLocation: user.settings.showLocation !== false,
            allowFollow: user.settings.allowFollow !== false,
            allowComments: user.settings.allowComments !== false
          });

          // 外观设置
          setAppearanceSettings({
            theme: user.settings.theme || 'system',
            language: user.settings.language || 'zh-CN',
            timezone: user.settings.timezone || 'Asia/Shanghai'
          });
        }

        // 从通知API加载通知设置
        const notificationResponse = await enhancedNotificationAPI.getSettings();
        if (notificationResponse.data?.data) {
          const notificationData = notificationResponse.data.data;
          setNotificationSettings({
             emailNotifications: notificationData.emailNotifications || DEFAULT_SETTINGS.notifications.emailNotifications,
             pushNotifications: notificationData.pushNotifications || DEFAULT_SETTINGS.notifications.pushNotifications,
             likeNotifications: notificationData.notificationTypes?.likes || DEFAULT_SETTINGS.notifications.likeNotifications,
             commentNotifications: notificationData.notificationTypes?.comments || DEFAULT_SETTINGS.notifications.commentNotifications,
             followNotifications: notificationData.notificationTypes?.follows || DEFAULT_SETTINGS.notifications.followNotifications,
             weeklyDigest: notificationData.weeklyDigest || DEFAULT_SETTINGS.notifications.weeklyDigest
           });
        } else {
          // 如果没有数据，使用默认设置
          setNotificationSettings(DEFAULT_SETTINGS.notifications);
        }

        setDataLoaded(true);
      } catch (error) {
        console.error('加载用户设置失败:', error);
        toast.error(t('settings.messages.loadFailed'));
        setDataLoaded(true);
      }
    };

    loadUserSettings();
  }, [user, t]);

  const handleProfileSave = async () => {
    setIsLoading(true);
    try {
      await enhancedUserAPI.updateProfile(profileData);
      toast.success(t('settings.messages.profileUpdated'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('settings.messages.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(t('settings.messages.passwordMismatch'));
      return;
    }
    
    setIsLoading(true);
    try {
      await enhancedUserAPI.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      toast.success(t('settings.messages.passwordChanged'));
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('密码修改失败:', error);
      toast.error(error.response?.data?.message || t('settings.messages.passwordChangeFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteAccountData.password) {
      toast.error(t('settings.messages.deletePasswordRequired'));
      return;
    }

    setIsLoading(true);
    try {
      await enhancedUserAPI.deleteAccount(deleteAccountData.password);
      toast.success(t('settings.messages.accountDeleted'));
      // 清除本地存储并跳转到首页
      localStorage.removeItem('token');
      window.location.href = '/';
    } catch (error) {
      console.error('删除账户失败:', error);
      toast.error(error.response?.data?.message || t('settings.messages.deleteAccountFailed'));
    } finally {
      setIsLoading(false);
      setDeleteAccountData({ password: '', showConfirmation: false });
    }
  };

  const handlePrivacySave = async () => {
    setIsLoading(true);
    try {
      const privacyData = {
        settings: {
          profileVisibility: privacySettings.profilePublic ? 'public' : 'private',
          showEmail: privacySettings.showEmail,
          showLocation: privacySettings.showLocation,
          allowFollow: privacySettings.allowFollow,
          allowComments: privacySettings.allowComments
        }
      };
      
      await enhancedUserAPI.updateProfile(privacyData);
      toast.success(t('settings.messages.settingsSaved'));
      
      // 更新AuthContext中的用户信息
      updateUser({ 
        ...user, 
        settings: { 
          ...user.settings, 
          ...privacyData.settings 
        } 
      });
    } catch (error) {
      console.error('保存隐私设置失败:', error);
      toast.error(error.response?.data?.message || t('settings.messages.settingsSaveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationSave = async () => {
    setIsLoading(true);
    try {
      // 转换为后端API期望的格式
      const apiData = {
        emailNotifications: notificationSettings.emailNotifications,
        pushNotifications: notificationSettings.pushNotifications,
        weeklyDigest: notificationSettings.weeklyDigest,
        notificationTypes: {
          likes: notificationSettings.likeNotifications,
          comments: notificationSettings.commentNotifications,
          follows: notificationSettings.followNotifications
        }
      };
      await enhancedNotificationAPI.updateSettings(apiData);
      toast.success(t('settings.messages.settingsSaved'));
    } catch (error) {
      console.error('保存通知设置失败:', error);
      toast.error(error.response?.data?.message || t('settings.messages.settingsSaveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppearanceSave = async () => {
    setIsLoading(true);
    try {
      await enhancedUserAPI.updateProfile({
        settings: appearanceSettings
      });
      toast.success(t('settings.messages.settingsSaved'));
      updateUser({ ...user, settings: { ...user.settings, ...appearanceSettings } });
    } catch (error) {
      console.error('保存外观设置失败:', error);
      toast.error(error.response?.data?.message || t('settings.messages.settingsSaveFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAvatarSelect = async (avatarPath) => {
    setIsLoading(true);
    try {
      const updatedProfile = { ...profileData, avatar: avatarPath };
      await enhancedUserAPI.updateProfile(updatedProfile);
      
      // 更新本地状态
      setProfileData(updatedProfile);
      
      // 更新AuthContext中的用户信息
      updateUser({ ...user, avatar: avatarPath });
      
      toast.success(t('settings.messages.profileUpdated'));
    } catch (error) {
      toast.error(error.response?.data?.message || t('settings.messages.updateFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.profile.title')}</h3>
        
        {/* 头像选择 */}
        <div className="flex items-center gap-6 mb-6">
          <div className="relative">
            <img
              src={getUserAvatar(user)}
              alt={t('settings.profile.avatar.change')}
              className="w-20 h-20 rounded-full object-cover border-3 border-slate-200 shadow-lg"
              onError={(e) => {
                e.target.src = DEFAULT_FALLBACK_AVATAR;
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer"
                 onClick={() => setShowAvatarSelector(true)}>
              <Camera className="w-6 h-6 text-white opacity-0 hover:opacity-100 transition-opacity duration-200" />
            </div>
          </div>
          <div>
            <button 
              onClick={() => setShowAvatarSelector(true)}
              className="btn btn-secondary btn-sm mb-2"
              disabled={isLoading}
            >
              <Camera className="w-4 h-4 mr-2" />
              {t('settings.profile.avatar.change')}
            </button>
            <p className="text-sm text-slate-500">
              {t('settings.profile.avatar.description')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('settings.profile.username')}
            </label>
            <input
              type="text"
              value={profileData.username}
              onChange={(e) => setProfileData({...profileData, username: e.target.value})}
              className="input"
              placeholder={t('settings.profile.usernamePlaceholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('settings.profile.email')}
            </label>
            <input
              type="email"
              value={profileData.email}
              onChange={(e) => setProfileData({...profileData, email: e.target.value})}
              className="input"
              placeholder={t('settings.profile.emailPlaceholder')}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('settings.profile.location')}
            </label>
            <input
              type="text"
              value={profileData.location}
              onChange={(e) => setProfileData({...profileData, location: e.target.value})}
              className="input"
              placeholder={t('settings.profile.locationPlaceholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('settings.profile.website')}
            </label>
            <input
              type="url"
              value={profileData.website}
              onChange={(e) => setProfileData({...profileData, website: e.target.value})}
              className="input"
              placeholder="https://example.com"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {t('settings.profile.bio')}
          </label>
          <textarea
            value={profileData.bio}
            onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
            className="input min-h-[100px] resize-none"
            placeholder={t('settings.profile.bioPlaceholder')}
            maxLength={200}
          />
          <p className="text-sm text-slate-500 mt-1">
            {profileData.bio.length}/200 {t('settings.profile.bioCounter')}
          </p>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={handleProfileSave}
            disabled={isLoading}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? t('settings.profile.saving') : t('settings.profile.save')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderPrivacyTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.tabs.privacy')}</h3>
        
        <div className="space-y-4">
          {Object.entries(PRIVACY_OPTIONS).map(([key, _config]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">{t(`settings.privacy.${key}.label`)}</p>
                <p className="text-sm text-slate-500">{t(`settings.privacy.${key}.description`)}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={privacySettings[key]}
                  onChange={(e) => setPrivacySettings({
                    ...privacySettings,
                    [key]: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
        
        {/* 保存按钮 */}
        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            onClick={handlePrivacySave}
            disabled={isLoading || !dataLoaded}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? t('settings.profile.saving') : t('settings.profile.save')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotificationsTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.tabs.notifications')}</h3>
        
        <div className="space-y-4">
          {Object.entries(NOTIFICATION_OPTIONS).map(([key, _config]) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-slate-100">
              <div>
                <p className="font-medium text-slate-900">{t(`settings.notifications.${key}.label`)}</p>
                <p className="text-sm text-slate-500">{t(`settings.notifications.${key}.description`)}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationSettings[key]}
                  onChange={(e) => setNotificationSettings({
                    ...notificationSettings,
                    [key]: e.target.checked
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          ))}
        </div>
        
        {/* 保存按钮 */}
        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            onClick={handleNotificationSave}
            disabled={isLoading || !dataLoaded}
            className="btn btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? t('settings.saving') : t('settings.save')}
          </button>
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.security.changePassword')}</h3>
        
        <div className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('settings.security.currentPassword')}
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
              className="input"
              placeholder={t('settings.security.currentPasswordPlaceholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('settings.security.newPassword')}
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
              className="input"
              placeholder={t('settings.security.newPasswordPlaceholder')}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('settings.security.confirmPassword')}
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
              className="input"
              placeholder={t('settings.security.confirmPasswordPlaceholder')}
            />
          </div>

          <button
            onClick={handlePasswordChange}
            disabled={isLoading}
            className="btn btn-primary"
          >
            <Lock className="w-4 h-4 mr-2" />
            {isLoading ? t('settings.security.updating') : t('settings.security.updatePassword')}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-200 pt-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          {t('settings.security.dangerZone')}
        </h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h4 className="font-medium text-red-900 mb-2">{t('settings.security.deleteAccountButton')}</h4>
          <p className="text-sm text-red-700 mb-4">
            {t('settings.security.deleteAccountWarning')}
          </p>
          
          {!deleteAccountData.showConfirmation ? (
            <button 
              onClick={() => setDeleteAccountData(prev => ({ ...prev, showConfirmation: true }))}
              className="btn bg-red-600 hover:bg-red-700 text-white"
            >
              {t('settings.security.deleteMyAccount')}
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-red-900 mb-2">
                  {t('settings.security.confirmDeletePassword')}
                </label>
                <input
                  type="password"
                  value={deleteAccountData.password}
                  onChange={(e) => setDeleteAccountData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder={t('settings.security.passwordPlaceholder')}
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isLoading || !deleteAccountData.password}
                  className="btn bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? t('settings.security.deleting') : t('settings.security.confirmDelete')}
                </button>
                <button
                  onClick={() => setDeleteAccountData({ password: '', showConfirmation: false })}
                  className="btn bg-gray-300 hover:bg-gray-400 text-gray-700"
                >
                  {t('settings.security.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderAppearanceTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-slate-900 mb-4">{t('settings.appearance.title')}</h3>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              {t('settings.appearance.theme')}
            </label>
            <div className="grid grid-cols-3 gap-4">
              {THEME_OPTIONS.map((theme) => (
                <div key={theme.id} className="relative">
                  <input
                    type="radio"
                    id={theme.id}
                    name="theme"
                    className="sr-only peer"
                    checked={appearanceSettings.theme === theme.id}
                    onChange={() => setAppearanceSettings(prev => ({ ...prev, theme: theme.id }))}
                  />
                  <label
                    htmlFor={theme.id}
                    className="block p-4 border-2 border-slate-200 rounded-lg cursor-pointer hover:border-primary-300 peer-checked:border-primary-500 peer-checked:bg-primary-50 transition-all duration-200"
                    title={theme.description}
                  >
                    <div className={`w-full h-12 rounded-md mb-3 ${theme.preview}`}></div>
                    <p className="font-medium text-slate-900">{t(`settings.theme.${theme.id}.name`)}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              {t('settings.appearance.language')}
            </label>
            <select 
              className="select max-w-xs"
              value={appearanceSettings.language}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, language: e.target.value }))}
            >
              {LANGUAGE_OPTIONS.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.nativeName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              {t('settings.appearance.timezone')}
            </label>
            <select 
              className="select max-w-xs"
              value={appearanceSettings.timezone}
              onChange={(e) => setAppearanceSettings(prev => ({ ...prev, timezone: e.target.value }))}
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* 保存按钮 */}
        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            onClick={handleAppearanceSave}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {t('settings.appearance.save')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{t('settings.title')}</h1>
          <p className="text-slate-600">{t('settings.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* 侧边栏导航 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-1"
          >
            <div className="card p-4">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-primary-50 text-primary-600 font-medium'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
            </div>
          </motion.div>

          {/* 主要内容区域 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="card p-6">
              {activeTab === 'profile' && renderProfileTab()}
              {activeTab === 'privacy' && renderPrivacyTab()}
              {activeTab === 'notifications' && renderNotificationsTab()}
              {activeTab === 'security' && renderSecurityTab()}
              {activeTab === 'appearance' && renderAppearanceTab()}
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* 头像选择器弹窗 */}
      <AvatarSelector
        isOpen={showAvatarSelector}
        onClose={() => setShowAvatarSelector(false)}
        onSelect={handleAvatarSelect}
        currentUser={user}
      />
    </div>
  );
};

export default Settings;