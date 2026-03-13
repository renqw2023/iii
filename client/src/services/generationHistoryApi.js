import api from './api';

export const generationHistoryAPI = {
  getHistory: (params = {}) =>
    api.get('/generate/history', { params }).then(r => r.data),
  deleteRecord: (id) =>
    api.delete(`/generate/history/${id}`).then(r => r.data),
};
