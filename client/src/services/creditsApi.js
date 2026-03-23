import axios from 'axios';

const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`
});

export const creditsAPI = {
  getBalance: () =>
    axios.get('/api/credits/balance', { headers: getAuthHeaders() }),

  checkin: () =>
    axios.post('/api/credits/checkin', {}, { headers: getAuthHeaders() }),

  getHistory: (page = 1, limit = 20) =>
    axios.get(`/api/credits/history?page=${page}&limit=${limit}`, { headers: getAuthHeaders() }),

  getPlans: () =>
    axios.get('/api/payments/plans'),

  createCheckout: (planId) =>
    axios.post('/api/payments/create-checkout', { planId }, { headers: getAuthHeaders() }),

  adminGrant: (userId, amount, note) =>
    axios.post('/api/credits/admin/grant', { userId, amount, note }, { headers: getAuthHeaders() }),

  adminDeduct: (userId, amount, note) =>
    axios.post('/api/credits/admin/deduct', { userId, amount, note }, { headers: getAuthHeaders() }),

  getOrders: () =>
    axios.get('/api/payments/orders', { headers: getAuthHeaders() }),

  getCurrentPlan: () =>
    axios.get('/api/payments/current-plan', { headers: getAuthHeaders() }),

  redeem: (code) =>
    axios.post('/api/credits/redeem', { code }, { headers: getAuthHeaders() }),

  adminGenerateCodes: (payload) =>
    axios.post('/api/credits/admin/generate-codes', payload, { headers: getAuthHeaders() }),

  adminGetGiftCodes: (page = 1, limit = 20) =>
    axios.get(`/api/credits/admin/gift-codes?page=${page}&limit=${limit}`, { headers: getAuthHeaders() }),

  adminDeactivateCode: (code) =>
    axios.patch(`/api/credits/admin/gift-codes/${code}/deactivate`, {}, { headers: getAuthHeaders() }),
};
