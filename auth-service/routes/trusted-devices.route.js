// routes/trusted-devices.route.js

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const TrustedDevicesService = require('../services/trusted-devices.service');
const DeviceFingerprintService = require('../services/device-fingerprint.service');
const emailModule = require('../modules/email');
const { AppError } = require('../middleware/errorHandler');
const ResponseHandler = require('../utils/responseHandler');
const logger = require('../utils/logger');
const AuditService = require('../services/audit.service');
const asyncHandler = require('../middleware/asyncHandler');

/**
 * GET /api/trusted-devices
 * Get all trusted devices for current user
 */
router.get('/', authMiddleware, asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { status } = req.query; // Optional: filter by status

    logger.info('📱 Fetching devices for user:', { userId });

    const devices = await TrustedDevicesService.getUserDevices(userId, {
      trustStatus: status,
      currentFingerprint: req.session.deviceFingerprint
    });

    await AuditService.log({
      action: 'VIEW_TRUSTED_DEVICES',
      userId: userId,
      metadata: {
        deviceCount: devices.length,
        filters: { status }
      }
    });

    return ResponseHandler.success(res, devices, 'Devices retrieved successfully');

  } catch (error) {
    logger.error('❌ Failed to get devices:', error);
    return next(new AppError('Failed to retrieve devices', 500, 'DEVICE_RETRIEVAL_FAILED'));
  }
}));

/**
 * GET /api/trusted-devices/insights
 * Get device security insights and dashboard data
 */
router.get('/insights', authMiddleware, asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;

    logger.info('🔍 Fetching device insights for user:', { userId });

    const insights = await TrustedDevicesService.getDeviceSecurityInsights(userId);

    await AuditService.log({
      action: 'VIEW_DEVICE_INSIGHTS',
      userId: userId,
      metadata: insights
    });

    return ResponseHandler.success(res, insights, 'Device insights retrieved successfully');

  } catch (error) {
    logger.error('❌ Failed to get device insights:', error);
    return next(new AppError('Failed to get security insights', 500, 'INSIGHTS_FAILED'));
  }
}));

/**
 * POST /api/trusted-devices/register
 * Register/update current device
 */
router.post('/register', authMiddleware, asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const {
      screenWidth,
      screenHeight,
      timezone,
      colorDepth,
      location
    } = req.body;

    logger.info('📱 Registering device for user:', { userId });

    // Validate required fields
    if (!screenWidth || !screenHeight || !timezone) {
      throw new AppError('Missing required device data (screenWidth, screenHeight, timezone)', 400, 'VALIDATION_ERROR');
    }

    // Generate device fingerprint
    const { fingerprint, deviceData } = await DeviceFingerprintService.generateFingerprint({
      headers: req.headers,
      body: { screenWidth, screenHeight, timezone, colorDepth },
      user: req.user,
      ip: req.ip
    });

    logger.info('Generated ', deviceData);


    if (!fingerprint) {
      throw new AppError('Failed to generate device fingerprint', 400, 'FINGERPRINT_FAILED');
    }

    // Get location data
    const locationData = {
      country: location?.country || 'Unknown',
      city: location?.city || 'Unknown',
      ip: deviceData.ipAddress || deviceData.ip_address || 'Unknown'
    };

    // Check if device is trusted + calculate risk
    const trustCheck = await TrustedDevicesService.isDeviceTrusted(
      userId,
      fingerprint,
      deviceData,
      locationData
    );

    // Register device
    const { device, created } = await TrustedDevicesService.registerDevice(
      userId,
      fingerprint,
      deviceData,
      deviceData.ipAddress,
      `${locationData.city}, ${locationData.country}`
    );

    logger.info('✅ Device registered:', {
      deviceId: device.id,
      deviceName: device.device_name,
      created: created,
      riskLevel: trustCheck.riskScore.level
    });

    // Log audit
    await AuditService.log({
      action: created ? 'DEVICE_REGISTERED' : 'DEVICE_UPDATED',
      userId: userId,
      metadata: {
        deviceName: device.device_name,
        deviceType: device.device_type,
        riskLevel: trustCheck.riskScore.level,
        location: locationData
      }
    });

    // Send email for high-risk logins
    if (created && trustCheck.riskScore.level === 'HIGH') {
      try {
        await emailModule.send({
          type: emailModule.EMAIL_TYPES.HIGH_RISK_LOGIN,
          to: req.user.email,
          data: {
            userName: req.user.name || 'User',
            deviceName: device.device_name,
            location: `${locationData.city}, ${locationData.country}`,
            riskScore: trustCheck.riskScore.score,
            riskLevel: trustCheck.riskScore.level,
            loginTime: new Date().toLocaleString(),
            secureUrl: `${process.env.FRONTEND_URL}/account/security`
          }
        });
      } catch (emailError) {
        logger.warn('⚠️ Failed to send high-risk alert:', emailError);
      }
    }

    return ResponseHandler.success(res, {
      message: created ? 'Device registered successfully' : 'Device already registered',
      data: {
        device: {
          id: device.id,
          name: device.device_name,
          type: device.device_type,
          trust_status: device.trust_status,
          created: created
        },
        security: {
          isTrusted: trustCheck.isTrusted,
          riskScore: trustCheck.riskScore.score,
          riskLevel: trustCheck.riskScore.level,
          riskBreakdown: trustCheck.riskScore.breakdown
        }
      }
    }, created ? 'Device registered successfully' : 'Device already registered');

  } catch (error) {
    logger.error('❌ Failed to register device:', error);
    return next(new AppError('Failed to register device', 500, 'DEVICE_REGISTRATION_FAILED'));
  }
}));

/**
 * POST /api/trusted-devices/:deviceId/trust
 * Mark device as trusted
 */
router.post('/:deviceId/trust', authMiddleware, asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const deviceId = req.params.deviceId;
    const { trustDays = 30 } = req.body;

    logger.info('🔒 Marking device as trusted:', { deviceId, userId, trustDays });

    // Validate trust days
    if (trustDays < 1 || trustDays > 365) {
      throw new AppError('Trust days must be between 1 and 365', 400, 'VALIDATION_ERROR');
    }

    // Get device to verify ownership
    const { TrustedDevice } = require('../config/database');
    const device = await TrustedDevice.findOne({
      where: { id: deviceId, user_id: userId }
    });

    if (!device) {
      logger.warn('Device not found:', { deviceId, userId });
      throw new AppError('Device not found', 404, 'NOT_FOUND');
    }

    // Mark as trusted
    const trustedDevice = await TrustedDevicesService.trustDevice(
      userId,
      device.device_fingerprint,
      trustDays,
      { trustedBy: 'user' }
    );

    logger.info('✅ Device trusted:', {
      deviceName: device.device_name,
      expiresAt: trustedDevice.device.expires_at
    });

    // Log audit
    await AuditService.log({
      action: 'DEVICE_TRUSTED',
      userId: userId,
      metadata: {
        deviceId: device.id,
        deviceName: device.device_name,
        trustDays: trustDays,
        expiresAt: trustedDevice.device.expires_at
      }
    });

    return ResponseHandler.success(res, {
      message: 'Device marked as trusted',
      data: {
        id: trustedDevice.device.id,
        name: trustedDevice.device.device_name,
        trust_status: trustedDevice.device.trust_status,
        expires_at: trustedDevice.device.expires_at
      }
    }, 'Device marked as trusted');

  } catch (error) {
    logger.error('❌ Failed to trust device:', error);
    return next(new AppError('Failed to trust device', 500, 'DEVICE_TRUST_FAILED'));
  }
}));

/**
 * DELETE /api/trusted-devices/:deviceId
 * Revoke device trust
 */
router.delete('/:deviceId', authMiddleware, asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const deviceId = req.params.deviceId;
    const { reason = 'user_initiated' } = req.body;



    logger.info('🔒 Revoking device:', { deviceId, userId, reason });

    // Get device to verify ownership
    const { TrustedDevice } = require('../config/database');
    const device = await TrustedDevice.findOne({
      where: { id: deviceId, user_id: userId }
    });

    logger.info('dd', device);


    if (!device) {
      logger.warn('Device not found:', { deviceId, userId });
      throw new AppError('Device not found', 404, 'NOT_FOUND');
    }

    // Revoke device
    const revokedDevice = await TrustedDevicesService.revokeDevice(
      userId,
      deviceId,
      reason
    );

    logger.info('✅ Device revoked:', {
      deviceName: device.device_name,
      reason: reason
    });

    // Log audit
    await AuditService.log({
      action: 'DEVICE_REVOKED',
      userId: userId,
      metadata: {
        deviceId: device.id,
        deviceName: device.device_name,
        reason: reason
      }
    });

    return ResponseHandler.success(res, {
      message: 'Device removed from trusted list',
      data: {
        id: revokedDevice.device.id,
        name: revokedDevice.device.device_name,
        trust_status: revokedDevice.device.trust_status
      }
    }, 'Device removed from trusted list');

  } catch (error) {
    logger.error('❌ Failed to revoke device:', error);
    return next(new AppError('Failed to revoke device', 500, 'DEVICE_REVOKE_FAILED'));
  }
}));

/**
 * POST /api/trusted-devices/emergency/revoke-all
 * Revoke ALL trusted devices (security emergency)
 */
router.post('/emergency/revoke-all', authMiddleware, asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const { reason = 'security_emergency' } = req.body;

    logger.warn('🚨 EMERGENCY: Revoking ALL devices for user:', { userId, reason });

    // Confirm with password/2FA in production
    // TODO: Add password confirmation or 2FA verification

    // Revoke all devices
    const result = await TrustedDevicesService.revokeAllDevices(userId, reason);

    logger.info('✅ All devices revoked:', {
      userId: userId,
      revokedCount: result.revoked,
      reason: reason
    });

    // Log audit with high severity
    await AuditService.log({
      action: 'EMERGENCY_REVOKE_ALL_DEVICES',
      userId: userId,
      severity: 'CRITICAL',
      metadata: {
        revokedCount: result.revoked,
        reason: reason,
        timestamp: new Date().toISOString()
      }
    });

    // Send security alert email
    try {
      await emailModule.send({
        type: emailModule.EMAIL_TYPES.SECURITY_ALERT,
        to: req.user.email,
        data: {
          userName: req.user.name || 'User',
          alertTitle: 'All trusted devices have been revoked',
          alertMessage: 'You initiated a security emergency and revoked all trusted devices.',
        }
      });
    } catch (emailError) {
      logger.warn('Failed to send emergency alert email:', emailError);
    }

    return ResponseHandler.success(res, {
      message: 'All trusted devices have been revoked',
      data: {
        revokedCount: result.revoked,
        reason: result.reason
      }
    }, 'All trusted devices have been revoked');

  } catch (error) {
    logger.error('❌ Failed to revoke all devices:', error);
    return next(new AppError('Failed to revoke all devices', 500, 'EMERGENCY_REVOKE_FAILED'));
  }
}));

/**
 * GET /api/trusted-devices/:deviceId
 * Get single device details
 */
router.get('/:deviceId', authMiddleware, asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const deviceId = req.params.deviceId;

    logger.info('📱 Fetching device details:', { deviceId, userId });

    const { TrustedDevice } = require('../config/database');
    const device = await TrustedDevice.findOne({
      where: { id: deviceId, user_id: userId },
      attributes: { exclude: ['device_fingerprint'] }
    });

    if (!device) {
      throw new AppError('Device not found', 404, 'NOT_FOUND');
    }

    const enrichedDevice = {
      ...device.toJSON(),
      isExpired: device.expires_at && new Date(device.expires_at) < new Date(),
      daysUntilExpiry: device.expires_at
        ? Math.ceil((new Date(device.expires_at) - new Date()) / (1000 * 60 * 60 * 24))
        : null,
      isCurrentDevice: device.id === req.session.deviceId
    };

    return ResponseHandler.success(res, enrichedDevice, 'Device details retrieved successfully');

  } catch (error) {
    logger.error('❌ Failed to get device details:', error);
    return next(new AppError('Failed to retrieve device', 500, 'DEVICE_FETCH_FAILED'));
  }
}));

/**
 * PATCH /api/trusted-devices/:deviceId
 * Update device name or other properties
 */
router.patch('/:deviceId', authMiddleware, asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user.id || req.user.sub;
    const deviceId = req.params.deviceId;
    const { device_name } = req.body;

    logger.info('✏️ Updating device:', { deviceId, userId });

    if (!device_name) {
      throw new AppError('Device name is required', 400, 'VALIDATION_ERROR');
    }

    const { TrustedDevice } = require('../config/database');
    const device = await TrustedDevice.findOne({
      where: { id: deviceId, user_id: userId }
    });

    if (!device) {
      throw new AppError('Device not found', 404, 'NOT_FOUND');
    }

    // Update device name
    await device.update({ device_name: device_name });

    logger.info('✅ Device updated:', { deviceId, newName: device_name });

    // Log audit
    await AuditService.log({
      action: 'DEVICE_RENAMED',
      userId: userId,
      metadata: {
        deviceId: device.id,
        oldName: device.device_name,
        newName: device_name
      }
    });

    return ResponseHandler.success(res, {
      message: 'Device updated successfully',
      data: {
        id: device.id,
        name: device.device_name
      }
    }, 'Device updated successfully');

  } catch (error) {
    logger.error('❌ Failed to update device:', error);
    return next(new AppError('Failed to update device', 500, 'DEVICE_UPDATE_FAILED'));
  }
}));

module.exports = router;
