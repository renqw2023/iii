import api from './api';

export const generateAPI = {
  getModels: () => api.get('/generate/models').then(r => r.data.models),
  // 图像生成可能需要 30-60 秒，单独使用长 timeout
  generateImage: (body) => api.post('/generate/image', body, { timeout: 120000 }).then(r => r.data),
  // 视频生成可能需要 60-120 秒
  generateVideo: (body) => api.post('/generate/video', body, { timeout: 180000 }).then(r => r.data),
};
