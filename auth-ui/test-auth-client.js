import { auth } from '@spidy092/auth-client';
auth.setConfig({
    clientKey: 'test-client',
    authBaseUrl: 'https://auth.local.test/auth'
});
console.log('Valid Config:', auth.getConfig());
