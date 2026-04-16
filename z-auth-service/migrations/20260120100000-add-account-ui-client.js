'use strict';

/**
 * Migration: Update callback_url and redirect_url for account-ui and admin-ui
 * 
 * Only updates these two columns - no other changes.
 */

module.exports = {
    up: async (queryInterface, Sequelize) => {
        const gatewayUrl = process.env.GATEWAY_URL || 'https://localhost';

        // Update account-ui URLs
        await queryInterface.sequelize.query(
            `UPDATE clients SET 
        callback_url = '${gatewayUrl}/auth/callback/account-ui',
        redirect_url = '${gatewayUrl}/account/'
      WHERE client_key = 'account-ui'`
        );
        console.log('✅ account-ui URLs updated');

        // Update admin-ui URLs
        await queryInterface.sequelize.query(
            `UPDATE clients SET 
        callback_url = '${gatewayUrl}/auth/callback/admin-ui',
        redirect_url = '${gatewayUrl}/admin/'
      WHERE client_key = 'admin-ui'`
        );
        console.log('✅ admin-ui URLs updated');
    },

    down: async (queryInterface, Sequelize) => {
        // Revert to old local.test URLs
        await queryInterface.sequelize.query(
            `UPDATE clients SET 
        callback_url = 'https://auth.local.test:4000/auth/callback/account-ui',
        redirect_url = 'https://account.local.test:5174/'
      WHERE client_key = 'account-ui'`
        );

        await queryInterface.sequelize.query(
            `UPDATE clients SET 
        callback_url = 'https://auth.local.test:4000/auth/callback/admin-ui',
        redirect_url = 'https://admin.local.test:5173/'
      WHERE client_key = 'admin-ui'`
        );
        console.log('✅ Reverted to local.test URLs');
    }
};
