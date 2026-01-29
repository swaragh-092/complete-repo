import { auth } from '@spidy092/auth-client';

/**
 * Extract data from standardized API response
 * Response format: { success, statusCode, message, data, meta }
 */
const extractData = (res) => res.data?.data ?? res.data;

export const profileApi = {
  async get() {
    const res = await auth.api.get('/account/profile');
    return extractData(res);
  },

  async update(payload) {
    const res = await auth.api.put('/account/profile', payload);
    return extractData(res);
  },

  async getSummary() {
    const res = await auth.api.get('/account/profile/summary');
    return extractData(res);
  },

  async getOrganizations() {
    const res = await auth.api.get('/account/organizations');
    const data = extractData(res);
    // Handle both array and object with organizations property
    return Array.isArray(data) ? data : (data?.organizations || []);
  },

  async getPermissions() {
    const res = await auth.api.get('/account/permissions');
    const data = extractData(res);
    // Handle both array and object with permissions property
    return Array.isArray(data) ? data : (data?.permissions || []);
  },
};
