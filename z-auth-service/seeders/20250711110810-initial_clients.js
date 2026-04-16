'use strict';

module.exports = {
  up: async (queryInterface) => {
    await queryInterface.bulkInsert('clients', [
      {
        client_key: 'nodeapp',
        realm: 'my-projects',
        client_id: 'node-app',
        client_secret: 'RVLkyIfwxlslikzOHFovQUNRlTIIEx4b',
        callback_url: 'http://localhost:4000/auth/callback/nodeapp',
        requires_tenant: false,
        tenant_id: null,
        created_at: new Date(),
      },
      {
        client_key: 'nodesecapp',
        realm: 'my-projects',
        client_id: 'node-secapp',
        client_secret: 'sN8nkk0BQyhI8XXWe2PsaLBF57bNfGmH',
        callback_url: 'http://localhost:4000/auth/callback/nodesecapp',
        requires_tenant: false,
        tenant_id: null,
        created_at: new Date(),
      },
      {
        client_key: 'pms',
        realm: 'my-projects',
        client_id: 'pms',
        client_secret: 'pms_secret',
        callback_url: 'http://localhost:4000/auth/callback/pms',
        requires_tenant: true,
        tenant_id: 'org_123',
        created_at: new Date(),
      },
      {
        client_key: 'ams',
        realm: 'my-projects',
        client_id: 'ams',
        client_secret: 'ams_secret',
        callback_url: 'http://localhost:4000/auth/callback/ams',
        requires_tenant: true,
        tenant_id: 'org_123',
        created_at: new Date(),
      },
      {
        client_key: 'admin-cli',
        realm: 'master',
        client_id: 'admin-cli',
        client_secret: 'ams_secret',
        callback_url: 'http://localhost:4000/auth/callback/ams',
        requires_tenant: true,
        tenant_id: 'org_123',
        created_at: new Date(),
      },
    ]);
  },

  down: async (queryInterface) => {
    await queryInterface.bulkDelete('clients', null, {});
  },
};