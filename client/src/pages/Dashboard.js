import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import StatsPanel from '../components/Dashboard/StatsPanel';
import DashboardHeader from '../components/Dashboard/DashboardHeader';
import DashboardTabs from '../components/Dashboard/DashboardTabs';
import PostsTab from '../components/Dashboard/tabs/PostsTab';
import PromptsTab from '../components/Dashboard/tabs/PromptsTab';
import FavoritesTab from '../components/Dashboard/tabs/FavoritesTab';
import FollowingTab from '../components/Dashboard/tabs/FollowingTab';
import FollowersTab from '../components/Dashboard/tabs/FollowersTab';
import SocialTab from '../components/Dashboard/tabs/SocialTab';
import PostEditModal from '../components/Dashboard/modals/PostEditModal';
import PromptEditModal from '../components/Dashboard/modals/PromptEditModal';
import useDashboardData from '../hooks/useDashboardData';
import usePostEdit from '../hooks/usePostEdit';
import usePromptEdit from '../hooks/usePromptEdit';
import { generateTabsConfig } from '../utils/dashboard/dashboardHelpers';
import { ANIMATION_CONFIG } from '../utils/dashboard/dashboardConstants';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [activeTab, setActiveTab] = useState('posts');
  const [favoritesSubTab, setFavoritesSubTab] = useState('posts');

  // 使用自定义Hook管理数据
  const {
    userStats,
    userPosts,
    userPrompts,
    favoritesPosts,
    favoritesPrompts,
    followingUsers,
    followerUsers,
    loading,
    error,
    pagination,
    refreshData,
    updatePost,
    updatePrompt,
    // removePost, // 暂未使用
    // removePrompt, // 暂未使用
    loadPostsPage,
    loadPromptsPage
  } = useDashboardData(user?.id);

  // 使用编辑Hook
  const {
    editingPost,
    editForm: postEditForm,
    isUpdating: isUpdatingPost,
    validationErrors: postValidationErrors,
    startEdit: startPostEdit,
    cancelEdit: cancelPostEdit,
    updateField: updatePostField,
    addTag: addPostTag,
    removeTag: removePostTag,
    saveEdit: savePostEdit,
    // isEditing: isEditingPost, // 暂未使用
    hasChanges: postHasChanges
  } = usePostEdit((postId, updatedPost) => {
    updatePost(postId, updatedPost);
  });

  const {
    editingPrompt,
    editForm: promptEditForm,
    isUpdating: isUpdatingPrompt,
    validationErrors: promptValidationErrors,
    startEdit: startPromptEdit,
    cancelEdit: cancelPromptEdit,
    updateField: updatePromptField,
    addTag: addPromptTag,
    removeTag: removePromptTag,
    saveEdit: savePromptEdit,
    // isEditing: isEditingPrompt, // 暂未使用
    hasChanges: promptHasChanges,
    getCategoryOptions,
    getDifficultyOptions
  } = usePromptEdit((promptId, updatedPrompt) => {
    updatePrompt(promptId, updatedPrompt);
  });

  // 生成标签页配置
  const tabs = generateTabsConfig({
    userPosts,
    userPrompts,
    favoritesPosts,
    favoritesPrompts,
    followingUsers,
    followerUsers
  }, pagination, t);

  // 处理编辑操作
  const handleEditPost = useCallback((post) => {
    startPostEdit(post);
  }, [startPostEdit]);

  const handleEditPrompt = useCallback((prompt) => {
    startPromptEdit(prompt);
  }, [startPromptEdit]);

  // 处理标签页切换
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    if (tabId === 'favorites') {
      setFavoritesSubTab('posts');
    }
  }, []);

  // 处理视图模式切换
  const handleViewModeChange = useCallback((mode) => {
    setViewMode(mode);
  }, []);

  // 处理分页切换
  const handlePostsPageChange = useCallback((page) => {
    loadPostsPage(page);
  }, [loadPostsPage]);

  const handlePromptsPageChange = useCallback((page) => {
    loadPromptsPage(page);
  }, [loadPromptsPage]);

  // 渲染标签页内容
  const renderTabContent = () => {
    switch (activeTab) {
      case 'posts':
        return (
          <PostsTab
            posts={userPosts}
            viewMode={viewMode}
            onEditPost={handleEditPost}
            editingPost={editingPost}
            loading={loading}
            pagination={pagination?.posts}
            onPageChange={handlePostsPageChange}
          />
        );
      
      case 'prompts':
        return (
          <PromptsTab
            prompts={userPrompts}
            viewMode={viewMode}
            onEditPrompt={handleEditPrompt}
            editingPrompt={editingPrompt}
            loading={loading}
            pagination={pagination?.prompts}
            onPageChange={handlePromptsPageChange}
          />
        );
      
      case 'favorites':
        return (
          <div>
            {/* 收藏子标签页 */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setFavoritesSubTab('posts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  favoritesSubTab === 'posts'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('dashboard.favorites.posts.title')} ({favoritesPosts.length})
              </button>
              <button
                onClick={() => setFavoritesSubTab('prompts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  favoritesSubTab === 'prompts'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t('dashboard.favorites.prompts.title')} ({favoritesPrompts.length})
              </button>
            </div>
            
            <FavoritesTab
              favorites={favoritesPosts}
              favoritePrompts={favoritesPrompts}
              viewMode={viewMode}
              loading={loading}
              activeSubTab={favoritesSubTab}
            />
          </div>
        );
      
      case 'following':
        return (
          <FollowingTab
            following={followingUsers}
            loading={loading}
          />
        );
      
      case 'followers':
        return (
          <FollowersTab
            followers={followerUsers}
            loading={loading}
          />
        );
      
      case 'social':
        return (
          <SocialTab
            following={followingUsers}
            followers={followerUsers}
            loading={loading}
          />
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={refreshData}
            className="btn btn-primary"
          >
            {t('dashboard.posts.error')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 用户信息头部 */}
        <motion.div
          initial={ANIMATION_CONFIG.INITIAL}
          animate={ANIMATION_CONFIG.ANIMATE}
          transition={ANIMATION_CONFIG.TRANSITION}
        >
          <DashboardHeader user={user} userStats={userStats} />
        </motion.div>

        {/* 统计面板 */}
        <StatsPanel user={user} stats={userStats} />

        {/* 内容区域 */}
        <motion.div
          initial={ANIMATION_CONFIG.INITIAL}
          animate={ANIMATION_CONFIG.ANIMATE}
          transition={{ ...ANIMATION_CONFIG.TRANSITION, delay: 0.2 }}
          className="card"
        >
          {/* 标签页导航 */}
          <DashboardTabs
            tabs={tabs}
            activeTab={activeTab}
            viewMode={viewMode}
            onTabChange={handleTabChange}
            onViewModeChange={handleViewModeChange}
            showViewModeToggle={activeTab === 'posts' || activeTab === 'prompts'}
          />

          {/* 标签页内容 */}
          <div className="p-6">
            {renderTabContent()}
          </div>
        </motion.div>

        {/* 编辑模态框 */}
        <PostEditModal
          isOpen={!!editingPost}
          onClose={cancelPostEdit}
          editForm={postEditForm}
          onUpdateField={updatePostField}
          onAddTag={addPostTag}
          onRemoveTag={removePostTag}
          onSave={savePostEdit}
          isUpdating={isUpdatingPost}
          validationErrors={postValidationErrors}
          hasChanges={postHasChanges(userPosts.find(p => p._id === editingPost))}
        />

        <PromptEditModal
          isOpen={!!editingPrompt}
          onClose={cancelPromptEdit}
          editForm={promptEditForm}
          onUpdateField={updatePromptField}
          onAddTag={addPromptTag}
          onRemoveTag={removePromptTag}
          onSave={savePromptEdit}
          isUpdating={isUpdatingPrompt}
          validationErrors={promptValidationErrors}
          hasChanges={promptHasChanges(userPrompts.find(p => p._id === editingPrompt))}
          categoryOptions={getCategoryOptions()}
          difficultyOptions={getDifficultyOptions()}
        />
      </div>
    </div>
  );
};

export default Dashboard;