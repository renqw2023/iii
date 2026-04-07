import api from './api';
import i18n from '../i18n';

const withLang = (body) => ({ ...body, lang: i18n.language || 'en' });

export const generateAPI = {
  getModels: () => api.get('/generate/models').then(r => r.data.models),
  // 图像生成可能需要 30-60 秒，单独使用长 timeout
  generateImage: (body) => api.post('/generate/image', withLang(body), { timeout: 120000 }).then(r => r.data),
  // 视频生成可能需要 60-120 秒
  generateVideo: (body) => api.post('/generate/video', withLang(body), { timeout: 420000 }).then(r => r.data),
  uploadVideoFrame: (file) => {
    const form = new FormData();
    form.append('frame', file);
    return api.post('/generate/video/upload-frame', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 30000,
    }).then(r => r.data);
  },
  uploadVideo: (file) => {
    const form = new FormData();
    form.append('video', file);
    return api.post('/generate/video/upload-video', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    }).then(r => r.data);
  },
};
