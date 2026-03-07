import axios from 'axios';

export const searchSref = (query, limit = 5) =>
  axios.get(`/api/sref?search=${encodeURIComponent(query)}&limit=${limit}`);

export const searchGallery = (query, limit = 5) =>
  axios.get(`/api/gallery?search=${encodeURIComponent(query)}&limit=${limit}`);
