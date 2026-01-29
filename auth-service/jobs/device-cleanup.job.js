const cron = require('node-cron');
const TrustedDevicesService  = require('../services/trusted-devices.service');
const logger = require('../utils/logger');

function startDeviceCleanupJob() {
  // Run every day at 2:00 AM
  cron.schedule('0 2 * * *', async () => {
    try {
      logger.info('🧹 Starting device cleanup job...');
      
      const result = await TrustedDevicesService.cleanupExpiredDevices();
      
      logger.info('✅ Device cleanup completed:', {
        expiredDevices: result.cleaned,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('❌ Device cleanup job failed:', error);
    }
  });

  logger.info('📅 Device cleanup job scheduled (daily at 2:00 AM)');
}

module.exports = { startDeviceCleanupJob };