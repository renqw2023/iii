import api from './api';

export const srefAPI = {
    getPosts: (params = {}) => api.get('/sref', { params }),
    getPopularTags: (limit = 30) => api.get('/sref/tags/popular', { params: { limit } }),
    getById: (id) => api.get(`/sref/${id}`),
    toggleLike: (id) => api.post(`/sref/${id}/like`),
};

export default srefAPI;
