import { useState, useEffect, useCallback } from 'react';
import { enhancedUserAPI, enhancedPostAPI, promptAPI } from '../services/enhancedApi';
import { DEFAULT_USER_STATS, PAGINATION_CONFIG } from '../utils/dashboard/dashboardConstants';
import { formatUserStats, handleApiError } from '../utils/dashboard/dashboardHelpers';
import toast from 'react-hot-toast';

/**
 * Dashboard数据管理Hook
 * @param {string} userId - 用户ID
 * @returns {Object} 数据和操作函数
 */
const useDashboardData = (userId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    userStats: DEFAULT_USER_STATS,
    userPosts: [],
    userPrompts: [],
    favoritesPosts: [],
    favoritesPrompts: [],
    followingUsers: [],
    followerUsers: []
  });

  // 分页状态
  const [pagination, setPagination] = useState({
    posts: { currentPage: 1, totalPages: 1, total: 0, loading: false },
    prompts: { currentPage: 1, totalPages: 1, total: 0, loading: false }
  });

  /**
   * 加载用户统计数据
   */
  const loadUserStats = useCallback(async () => {
    try {
      const response = await enhancedUserAPI.getUserStats(userId);
      return response.data.stats || DEFAULT_USER_STATS;
    } catch (error) {
      console.warn('Failed to get user stats:', error);
      return DEFAULT_USER_STATS;
    }
  }, [userId]);

  /**
   * 加载用户作品（支持分页）
   */
  const loadUserPosts = useCallback(async (page = 1, limit = PAGINATION_CONFIG.DEFAULT_LIMIT) => {
    try {
      const response = await enhancedPostAPI.getPosts({ 
        author: userId, 
        page,
        limit, 
        sort: 'createdAt' 
      });
      return {
        posts: response.data.posts || [],
        pagination: response.data.pagination || { current: 1, pages: 1, total: 0 }
      };
    } catch (error) {
      console.warn('Failed to get user posts:', error);
      return { posts: [], pagination: { current: 1, pages: 1, total: 0 } };
    }
  }, [userId]);

  /**
   * 加载用户提示词（支持分页）
   */
  const loadUserPrompts = useCallback(async (page = 1, limit = PAGINATION_CONFIG.DEFAULT_LIMIT) => {
    try {
      const response = await promptAPI.getUserPrompts(userId, { 
        page,
        limit, 
        sortBy: 'createdAt' 
      });
      return {
        prompts: response.data.prompts || [],
        pagination: response.data.pagination || { current: 1, pages: 1, total: 0 }
      };
    } catch (error) {
      console.warn('Failed to get user prompts:', error);
      return { prompts: [], pagination: { current: 1, pages: 1, total: 0 } };
    }
  }, [userId]);

  /**
   * 加载关注列表
   */
  const loadFollowing = useCallback(async () => {
    try {
      const response = await enhancedUserAPI.getFollowing(userId, { 
        limit: PAGINATION_CONFIG.SOCIAL_LIMIT 
      });
      return response.data.following || [];
    } catch (error) {
      console.warn('Failed to get following list:', error);
      return [];
    }
  }, [userId]);

  /**
   * 加载粉丝列表
   */
  const loadFollowers = useCallback(async () => {
    try {
      const response = await enhancedUserAPI.getFollowers(userId, { 
        limit: PAGINATION_CONFIG.SOCIAL_LIMIT 
      });
      return response.data.followers || [];
    } catch (error) {
      console.warn('Failed to get followers list:', error);
      return [];
    }
  }, [userId]);

  /**
   * 加载收藏作品
   */
  const loadFavoritesPosts = useCallback(async () => {
    try {
      const response = await enhancedUserAPI.getFavorites({ 
        limit: PAGINATION_CONFIG.DEFAULT_LIMIT 
      });
      return response.data.prompts || [];
    } catch (error) {
      console.warn('Failed to get favorites list:', error);
      return [];
    }
  }, []);

  /**
   * 加载收藏提示词
   */
  const loadFavoritesPrompts = useCallback(async () => {
    try {
      const response = await promptAPI.getFavoritePrompts({ 
        limit: PAGINATION_CONFIG.DEFAULT_LIMIT 
      });
      return response.data.favorites || [];
    } catch (error) {
      console.warn('Failed to get favorite prompts:', error);
      return [];
    }
  }, []);

  /**
   * 加载所有数据
   */
  const loadData = useCallback(async () => {
    if (!userId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 并行加载所有数据
      const [
        stats,
        postsResult,
        promptsResult,
        following,
        followers,
        favoritesPosts,
        favoritesPrompts
      ] = await Promise.all([
        loadUserStats(),
        loadUserPosts(1), // 加载第一页作品
        loadUserPrompts(1), // 加载第一页提示词
        loadFollowing(),
        loadFollowers(),
        loadFavoritesPosts(),
        loadFavoritesPrompts()
      ]);

      // 格式化统计数据，使用实际数据补充
      const formattedStats = formatUserStats(stats, {
        userPosts: postsResult.posts,
        followingUsers: following,
        followerUsers: followers
      });

      setData({
        userStats: formattedStats,
        userPosts: postsResult.posts,
        userPrompts: promptsResult.prompts,
        favoritesPosts,
        favoritesPrompts,
        followingUsers: following,
        followerUsers: followers
      });

      // 更新分页状态
      setPagination({
        posts: {
          currentPage: postsResult.pagination.current,
          totalPages: postsResult.pagination.pages,
          total: postsResult.pagination.total,
          loading: false
        },
        prompts: {
          currentPage: promptsResult.pagination.current,
          totalPages: promptsResult.pagination.pages,
          total: promptsResult.pagination.total,
          loading: false
        }
      });

      console.log('Dashboard data loaded successfully:', {
        stats: formattedStats,
        postsCount: postsResult.posts.length,
        promptsCount: promptsResult.prompts.length,
        followingCount: following.length,
        followersCount: followers.length,
        favoritesPostsCount: favoritesPosts.length,
        favoritesPromptsCount: favoritesPrompts.length,
        postsPagination: postsResult.pagination,
        promptsPagination: promptsResult.pagination
      });
    } catch (error) {
      console.error('加载数据失败:', error);
      const errorMessage = handleApiError(error, '加载数据失败');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId, loadUserStats, loadUserPosts, loadUserPrompts, loadFollowing, loadFollowers, loadFavoritesPosts, loadFavoritesPrompts]);

  /**
   * 刷新数据
   */
  const refreshData = useCallback(() => {
    loadData();
  }, [loadData]);

  /**
   * 更新本地帖子数据
   */
  const updatePost = useCallback((postId, updatedPost) => {
    setData(prevData => ({
      ...prevData,
      userPosts: prevData.userPosts.map(post => 
        post._id === postId ? updatedPost : post
      )
    }));
  }, []);

  /**
   * 更新本地提示词数据
   */
  const updatePrompt = useCallback((promptId, updatedPrompt) => {
    setData(prevData => ({
      ...prevData,
      userPrompts: prevData.userPrompts.map(prompt => 
        prompt._id === promptId ? updatedPrompt : prompt
      )
    }));
  }, []);

  /**
   * 删除本地帖子数据
   */
  const removePost = useCallback((postId) => {
    setData(prevData => ({
      ...prevData,
      userPosts: prevData.userPosts.filter(post => post._id !== postId)
    }));
  }, []);

  /**
   * 删除本地提示词数据
   */
  const removePrompt = useCallback((promptId) => {
    setData(prevData => ({
      ...prevData,
      userPrompts: prevData.userPrompts.filter(prompt => prompt._id !== promptId)
    }));
  }, []);

  /**
   * 加载指定页面的作品数据
   */
  const loadPostsPage = useCallback(async (page) => {
    setPagination(prev => ({
      ...prev,
      posts: { ...prev.posts, loading: true }
    }));

    try {
      const result = await loadUserPosts(page);
      
      setData(prevData => ({
        ...prevData,
        userPosts: result.posts
      }));

      setPagination(prev => ({
        ...prev,
        posts: {
          currentPage: result.pagination.current,
          totalPages: result.pagination.pages,
          total: result.pagination.total,
          loading: false
        }
      }));
    } catch (error) {
      console.error('加载作品页面失败:', error);
      setPagination(prev => ({
        ...prev,
        posts: { ...prev.posts, loading: false }
      }));
    }
  }, [loadUserPosts]);

  /**
   * 加载指定页面的提示词数据
   */
  const loadPromptsPage = useCallback(async (page) => {
    setPagination(prev => ({
      ...prev,
      prompts: { ...prev.prompts, loading: true }
    }));

    try {
      const result = await loadUserPrompts(page);
      
      setData(prevData => ({
        ...prevData,
        userPrompts: result.prompts
      }));

      setPagination(prev => ({
        ...prev,
        prompts: {
          currentPage: result.pagination.current,
          totalPages: result.pagination.pages,
          total: result.pagination.total,
          loading: false
        }
      }));
    } catch (error) {
      console.error('加载提示词页面失败:', error);
      setPagination(prev => ({
        ...prev,
        prompts: { ...prev.prompts, loading: false }
      }));
    }
  }, [loadUserPrompts]);

  // 初始化加载数据
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    loading,
    error,
    ...data,
    pagination,
    refreshData,
    updatePost,
    updatePrompt,
    removePost,
    removePrompt,
    loadPostsPage,
    loadPromptsPage
  };
};

export default useDashboardData;