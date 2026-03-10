import api from './api';

export const generateAPI = {
  getModels: () => api.get('/generate/models').then(r => r.data.models),
  generateImage: (body) => api.post('/generate/image', body).then(r => r.data),
};
