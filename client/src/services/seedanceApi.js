import api from './api';

// Seedance 2.0 视频提示词 API
export const seedanceAPI = {
    // 获取列表
    getPrompts: (params = {}) => {
        return api.get('/seedance', { params });
    },

    // 获取精选
    getFeatured: (limit = 8) => {
        return api.get('/seedance/featured', { params: { limit } });
    },

    // 获取分类列表
    getCategories: () => {
        return api.get('/seedance/categories');
    },

    // 搜索
    search: (q, params = {}) => {
        return api.get('/seedance/search', { params: { q, ...params } });
    },

    // 获取详情
    getById: (id) => {
        return api.get(`/seedance/${id}`);
    },

    // 记录复制
    recordCopy: (id) => {
        return api.post(`/seedance/${id}/copy`);
    },

    // 点赞/取消
    toggleLike: (id) => {
        return api.post(`/seedance/${id}/like`);
    },

    // 收藏/取消
    toggleFavorite: (id) => {
        return api.post(`/seedance/${id}/favorite`);
    },
};

export default seedanceAPI;
