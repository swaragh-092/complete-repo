import { auth } from '@spidy092/auth-client';

/**
 * Extract data from standardized API response
 * Response format: { success, statusCode, message, data, meta }
 */
const extractData = (res) => res.data?.data ?? res.data;

export const securityApi = {
  getOverview: async () => {
    const res = await auth.api.get('/account/security');
    return extractData(res);
  },

  getEvents: async () => {
    const res = await auth.api.get('/account/security-events');
    const data = extractData(res);
    // Handle both array and object with events property
    return Array.isArray(data) ? data : (data?.events || []);
  },

  getStatus: async () => {
    const res = await auth.api.get('/account/2fa/status');
    return extractData(res);
  },

  start2FASetup: async () => {
    const res = await auth.api.post('/account/2fa/setup-redirect');
    return extractData(res); // { redirectUrl }
  },

  check2FAConfigured: async () => {
    const res = await auth.api.get('/account/2fa/check');
    return extractData(res); // { configured: boolean }
  },

  disable2FA: async () => {
    const res = await auth.api.post('/account/2fa/disable');
    return extractData(res);
  },

  changePassword: async (payload) => {
    const res = await auth.api.post('/account/change-password', payload);
    return extractData(res);
  },
};
