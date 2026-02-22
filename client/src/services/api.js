import axios from 'axios';
import config from '../config';

// 创建axios实例
const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
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

// 响应拦截器 - 处理token过期和错误
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // 处理认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // 避免在登录页面重复跳转
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    // 增强错误信息
    if (error.response) {
      // 服务器响应错误
      error.friendlyMessage = error.response.data?.message || '服务器错误';
      error.errorCode = error.response.data?.code;
      error.errorId = error.response.data?.errorId || Date.now().toString(36);
    } else if (error.request) {
      // 网络错误
      error.friendlyMessage = '网络连接失败，请检查网络设置';
      error.errorCode = 'NETWORK_ERROR';
    } else {
      // 其他错误
      error.friendlyMessage = '发生了未知错误';
      error.errorCode = 'UNKNOWN_ERROR';
    }
    
    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  verifyEmail: (data) => api.post('/auth/verify-email', data),
  resendVerification: (data) => api.post('/auth/resend-verification', data),
  getMe: () => api.get('/auth/me'),
  refreshToken: () => api.post('/auth/refresh'),
  checkUsername: (username) => api.get(`/auth/check-username/${encodeURIComponent(username)}`),
  checkEmail: (email) => api.get(`/auth/check-email/${encodeURIComponent(email)}`),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  verifyResetToken: (data) => api.post('/auth/verify-reset-token', data),
  resetPassword: (data) => api.post('/auth/reset-password', data),
};

// 用户相关API
export const userAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  updateProfile: (userData) => api.put('/users/profile', userData),
  updatePassword: (passwordData) => api.put('/users/password', passwordData),
  deleteAccount: (password) => api.delete('/users/account', { data: { password } }),
  followUser: (userId) => api.post(`/users/${userId}/follow`),
  getFollowers: (userId, params) => api.get(`/users/${userId}/followers`, { params }),
  getFollowing: (userId, params) => api.get(`/users/${userId}/following`, { params }),
  getFavorites: (params) => api.get('/users/favorites', { params }),
  toggleFavorite: (postId) => api.post(`/users/favorites/${postId}`),
  getUserStats: (userId) => api.get(`/users/${userId}/stats`),
  searchUsers: (query, params) => api.get('/users/search', { params: { q: query, ...params } }),
};

// 帖子相关API
export const postAPI = {
  getPosts: (params) => api.get('/posts', { params }),
  getPost: (postId) => api.get(`/posts/${postId}`),
  createPost: (formData) => api.post('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updatePost: (postId, postData) => api.put(`/posts/${postId}`, postData),
  deletePost: (postId) => api.delete(`/posts/${postId}`),
  likePost: (postId) => api.post(`/posts/${postId}/like`),
  addComment: (postId, comment) => api.post(`/posts/${postId}/comment`, comment),
  deleteComment: (postId, commentId) => api.delete(`/posts/${postId}/comment/${commentId}`),
  replyToComment: (postId, commentId, reply) => api.post(`/posts/${postId}/comment/${commentId}/reply`, reply),
  deleteReply: (postId, commentId, replyId) => api.delete(`/posts/${postId}/comment/${commentId}/reply/${replyId}`),
  getFeaturedPosts: () => api.get('/posts/featured'),
  searchPosts: (query, params) => api.get('/posts/search', { params: { q: query, ...params } }),
  getPostsByTag: (tag, params) => api.get(`/posts/tag/${tag}`, { params }),
  getPopularTags: () => api.get('/posts/tags/popular'),
};

// 管理员相关API
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getPosts: (params) => api.get('/admin/posts', { params }),
  getPrompts: (params) => api.get('/admin/prompts', { params }),
  updateUserStatus: (userId, status) => api.put(`/admin/users/${userId}/status`, status),
  updatePost: (postId, postData) => api.put(`/admin/posts/${postId}`, postData),
  updatePrompt: (promptId, promptData) => api.put(`/admin/prompts/${promptId}`, promptData),
  deletePost: (postId) => api.delete(`/admin/posts/${postId}`),
  deletePrompt: (promptId) => api.delete(`/admin/prompts/${promptId}`),
  toggleFeatured: (postId, isFeatured) => api.put(`/admin/posts/${postId}/featured`, { isFeatured }),
  togglePromptFeatured: (promptId, isFeatured) => api.put(`/admin/prompts/${promptId}/featured`, { isFeatured }),
  // 批量操作
  batchUpdateUsers: (userIds, action) => api.post('/admin/users/batch', { userIds, action }),
  batchUpdatePosts: (postIds, action) => 
    api.post('/admin/posts/batch', { postIds, action }),
  batchUpdatePrompts: (promptIds, action) => 
    api.post('/admin/prompts/batch', { promptIds, action }),
  
  // 数据导出
  exportData: (type, format = 'csv') => 
    api.get(`/admin/export/${type}`, { 
      params: { format },
      responseType: format === 'json' ? 'json' : 'blob' 
    }),
  
  // 数据导入
  importData: (type, data, mode = 'create') => 
    api.post(`/admin/import/${type}`, { data, mode }),
  
  // 发送系统通知
  sendSystemNotification: (data) => api.post('/notifications/system', data),
};

// 通知相关API
export const notificationAPI = {
  getNotifications: (params) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (notificationId) => api.put('/notifications/mark-read', { notificationIds: [notificationId] }),
  markAllAsRead: () => api.put('/notifications/mark-read', { markAll: true }),
  deleteNotification: (notificationId) => api.delete('/notifications', { data: { notificationIds: [notificationId] } }),
  clearReadNotifications: () => api.delete('/notifications/clear-read'),
  updateSettings: (settings) => api.put('/notifications/settings', settings),
  getSettings: () => api.get('/notifications/settings'),
};

// 文件上传API
export const uploadAPI = {
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  uploadVideo: (file) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/upload/video', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

export default api;