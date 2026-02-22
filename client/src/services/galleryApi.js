import api from './api';

// 画廊提示词 API
export const galleryAPI = {
    // 获取画廊列表
    getPrompts: (params = {}) => {
        return api.get('/gallery', { params });
    },

    // 获取精选提示词
    getFeatured: (limit = 12) => {
        return api.get('/gallery/featured', { params: { limit } });
    },

    // 获取热门标签
    getPopularTags: (limit = 20) => {
        return api.get('/gallery/tags/popular', { params: { limit } });
    },

    // 获取分类统计
    getStats: () => {
        return api.get('/gallery/stats');
    },

    // 搜索
    search: (q, params = {}) => {
        return api.get('/gallery/search', { params: { q, ...params } });
    },

    // 获取详情
    getById: (id) => {
        return api.get(`/gallery/${id}`);
    },

    // 记录复制
    recordCopy: (id) => {
        return api.post(`/gallery/${id}/copy`);
    },

    // 点赞/取消
    toggleLike: (id) => {
        return api.post(`/gallery/${id}/like`);
    },

    // 收藏/取消
    toggleFavorite: (id) => {
        return api.post(`/gallery/${id}/favorite`);
    },
};

export default galleryAPI;
