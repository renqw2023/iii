import axios from 'axios';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const favoritesAPI = {
  // 获取收藏列表（分页）
  getList: (targetType, page = 1, limit = 20) => {
    const params = new URLSearchParams({ page, limit });
    if (targetType && targetType !== 'all') params.set('type', targetType);
    return axios.get(`/api/favorites?${params}`, { headers: getAuthHeaders() });
  },

  // 添加收藏
  add: (targetType, targetId) =>
    axios.post('/api/favorites', { targetType, targetId }, { headers: getAuthHeaders() }),

  // 取消收藏
  remove: (targetType, targetId) =>
    axios.delete(`/api/favorites/${targetType}/${targetId}`, { headers: getAuthHeaders() }),

  // 批量检查收藏状态（逗号分隔 IDs）
  check: (targetType, ids) =>
    axios.get(`/api/favorites/check?targetType=${targetType}&targetIds=${ids.join(',')}`, {
      headers: getAuthHeaders()
    }),
};
