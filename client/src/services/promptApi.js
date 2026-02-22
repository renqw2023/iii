import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// 创建axios实例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理通用错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token过期或无效，清除本地存储并重定向到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const promptAPI = {
  // 获取提示词列表
  getPrompts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // 添加查询参数
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category) queryParams.append('category', params.category);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.search) queryParams.append('search', params.search);
    if (params.tags) queryParams.append('tags', params.tags);
    
    return api.get(`/prompts?${queryParams.toString()}`);
  },

  // 获取精选提示词
  getFeaturedPrompts: (limit = 10) => {
    return api.get(`/prompts/featured?limit=${limit}`);
  },

  // 获取热门标签
  getPopularTags: (limit = 20) => {
    return api.get(`/prompts/tags/popular?limit=${limit}`);
  },

  // 创建新提示词
  createPrompt: (formData) => {
    return api.post('/prompts', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 获取单个提示词详情
  getPromptById: (id) => {
    return api.get(`/prompts/${id}`);
  },

  // 点赞/取消点赞提示词
  toggleLike: (id) => {
    return api.post(`/prompts/${id}/like`);
  },

  // 收藏/取消收藏提示词
  toggleBookmark: (id) => {
    return api.post(`/prompts/${id}/favorite`);
  },

  // 复制提示词
  copyPrompt: (id) => {
    return api.post(`/prompts/${id}/copy`);
  },

  // 添加评论
  addComment: (id, data) => {
    return api.post(`/prompts/${id}/comment`, data);
  },

  // 回复评论
  replyToComment: (promptId, commentId, data) => {
    return api.post(`/prompts/${promptId}/comment`, { ...data, parentComment: commentId });
  },

  // 获取用户发布的提示词
  getUserPrompts: (userId, params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    return api.get(`/prompts/user/${userId}?${queryParams.toString()}`);
  },

  // 获取我的提示词
  getMyPrompts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    return api.get(`/prompts/my?${queryParams.toString()}`);
  },

  // 更新提示词
  updatePrompt: (id, formData) => {
    return api.put(`/prompts/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // 删除提示词
  deletePrompt: (id) => {
    return api.delete(`/prompts/${id}`);
  },

  // 获取提示词统计信息
  getPromptStats: (id) => {
    return api.get(`/prompts/${id}/stats`);
  },

  // 搜索提示词
  searchPrompts: (query, params = {}) => {
    const queryParams = new URLSearchParams();
    queryParams.append('q', query);
    
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category) queryParams.append('category', params.category);
    if (params.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    
    return api.get(`/prompts/search?${queryParams.toString()}`);
  },

  // 获取相关提示词
  getRelatedPrompts: (id, params = {}) => {
    const queryParams = new URLSearchParams();
    
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.category) queryParams.append('category', params.category);
    if (params.tags && Array.isArray(params.tags)) {
      params.tags.forEach(tag => queryParams.append('tags', tag));
    }
    
    return api.get(`/prompts/${id}/related?${queryParams.toString()}`);
  },

  // 举报提示词
  reportPrompt: (id, data) => {
    return api.post(`/prompts/${id}/report`, data);
  },

  // 获取提示词分类统计
  getCategoryStats: () => {
    return api.get('/prompts/stats/categories');
  },

  // 获取趋势提示词
  getTrendingPrompts: (period = '7d', limit = 10) => {
    return api.get(`/prompts/trending?period=${period}&limit=${limit}`);
  },

  // 获取用户收藏的提示词
  getFavoritePrompts: (params = {}) => {
    const queryParams = new URLSearchParams();
    
    // 添加查询参数
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    return api.get(`/prompts/favorites?${queryParams.toString()}`);
  }
};

export default promptAPI;