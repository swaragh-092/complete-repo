import { auth } from '@spidy092/auth-client';

/**
 * Extract data from standardized API response
 * Response format: { success, statusCode, message, data, meta }
 */
const extractData = (res) => res.data?.data ?? res.data;

export const devicesApi = {
  async getAll() {
    const res = await auth.api.get('/trusted-devices');
    const data = extractData(res);
    // Handle both array and object with devices property
    return Array.isArray(data) ? data : (data?.devices || []);
  },

  async register(data) {
    const res = await auth.api.post('/trusted-devices/register', data);
    return extractData(res);
  },

  async trust(id, days = 30) {
    const res = await auth.api.post(`/trusted-devices/${id}/trust`, { trustDays: days });
    return extractData(res);
  },

  async revoke(id) {
    const res = await auth.api.delete(`/trusted-devices/${id}`, { data: { reason: 'user_initiated' } });
    return extractData(res);
  },

  async revokeAll() {
    const res = await auth.api.post('/trusted-devices/emergency/revoke-all', {
      reason: 'User initiated',
    });
    return extractData(res);
  },
};
