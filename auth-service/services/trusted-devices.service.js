const { TrustedDevice, UserMetadata, Sequelize, sequelize } = require('../config/database');
const DeviceFingerprintService = require('./device-fingerprint.service');
const { AppError } = require('../middleware/errorHandler');
const { withTransaction } = require('../utils/transaction');
const { Transaction } = require('sequelize');
const logger = require('../utils/logger');


class TrustedDevicesService {
  /**
   * Check if device is trusted
   * @returns {Promise<{isTrusted: boolean, device: object|null, riskScore: object}>}
   */

  static async isDeviceTrusted(
    userId,
    fingerprint,
    currentDevice = {},
    locationData = {}
  ) {
    try {
      const trustedDevices = await this.getTrustedDevicesForUser(userId);

      const riskScore = await DeviceFingerprintService.calculateRiskScore(
        trustedDevices,
        currentDevice,
        locationData
      );

      logger.info("🔍 Device risk assessment:", {
        userId,
        riskLevel: riskScore.level,
        riskScore: riskScore.score,
      });

      // Find exact match
      const trustedDevice = await TrustedDevice.findOne({
        where: {
          user_id: userId,
          device_fingerprint: fingerprint,
          trust_status: "trusted",
          expires_at: { [Sequelize.Op.gt]: new Date() },
        },
      });

      if (trustedDevice) {
        await trustedDevice.update({
          last_used: new Date(),
          ip_address: currentDevice.ipAddress || trustedDevice.ip_address,
        });

        logger.info("Device is trusted:", trustedDevice.device_name);
        return {
          isTrusted: true,
          device: trustedDevice,
          riskScore: riskScore,
        };
      }

      if (trustedDevices.length > 0) {
        for (const td of trustedDevices) {
          const similarity =
            await DeviceFingerprintService.compareFingerprintsSimilarity(
              currentDevice,
              {
                os: td.os,
                browser: td.browser,
                osVersion: td.os_version,
                screenResolution: `${td.metadata?.screen?.width}x${td.metadata?.screen?.height}`,
                timezone: td.metadata?.timezone,
                language: td.metadata?.language,
                userAgent: td.metadata?.userAgent,
                ipAddress: td.ip_address,
              }
            );

          logger.info(`🔍 Similarity with ${td.device_name}: ${similarity}%`);

          if (similarity >= 85) {
            logger.info(" Device matches trusted device via similarity");
            return {
              isTrusted: true,
              device: td,
              similarity: similarity,
              riskScore: riskScore,
            };
          }
        }
      }

      logger.info("Device is not trusted, risk level:", riskScore.level);
      return {
        isTrusted: false,
        device: null,
        riskScore: riskScore,
      };
    } catch (error) {
      logger.error("❌ Error checking device trust:", error);
      throw new AppError(
        "Failed to check device trust",
        500,
        "DEVICE_TRUST_CHECK_FAILED"
      );
    }
  }

  /**
   * Register or update device with transaction support
   */

  static async registerDevice(userId, fingerprint, deviceData, location) {
    try {
      return await withTransaction(async (transaction) => {
        const deviceName = await DeviceFingerprintService.getDeviceName(
          deviceData
        );

        const existingDevice = await TrustedDevice.findOne({
          where: {
            user_id: userId,
            device_fingerprint: fingerprint,
          },
          transaction,
        });

        if (existingDevice) {
          logger.info('🔄 Device already exists, updating:', { existingDevice: existingDevice.device_name });

          // Update existing device
          await existingDevice.update({
            last_used: new Date(),
            ip_address: existingDevice.ip_address,  // USE PARAMETER
            location: location || existingDevice.location,        // USE PARAMETER
            browser: deviceData.browser,
            os: deviceData.os,
            os_version: deviceData.osVersion,
            device_type: deviceData.deviceType,
            metadata: {
              ...existingDevice.metadata,
              ...deviceData,
              updatedAt: new Date().toISOString()
            }
          }, { transaction });

          logger.info('🔄 Device updated:', deviceName);
          return { device: existingDevice, created: false };
        }

        // Create new device
        const newDevice = await TrustedDevice.create(
          {
            user_id: userId,
            device_fingerprint: fingerprint,
            device_name: deviceName,
            device_type: deviceData.deviceType || "desktop",
            browser: deviceData.browser,
            os: deviceData.os,
            os_version: deviceData.osVersion,
            ip_address: 'unknown',           // ✅ USE PARAMETER
            location: location || 'unknown',
            trust_status: "pending",
            metadata: {
              ...deviceData,
              registeredAt: new Date().toISOString(),
            },
            last_used: new Date(),
          },
          { transaction }
        );

        logger.info("✨ New device registered:", deviceName);
        return { device: newDevice, created: true };
      });
    } catch (error) {
      logger.error("❌ Failed to register device:", error);
      throw new AppError(
        "Failed to register device",
        500,
        "DEVICE_REGISTRATION_FAILED"
      );
    }
  }

  /**
   * Revoke device trust with reason
   */

  static async revokeDevice(
    userId,
    deviceId,
    reason = "User initiated revocation"
  ) {
    try {
      return await withTransaction(async (transaction) => {
        const device = await TrustedDevice.findOne({
          where: {
            id: deviceId,
            user_id: userId,
          },
          transaction,
        });

        if (!device) {
          throw new AppError(
            "Trusted device not found",
            404,
            "TRUSTED_DEVICE_NOT_FOUND"
          );
        }

        await device.update(
          {
            trust_status: "revoked",
            expires_at: new Date(),
            metadata: {
              ...device.metadata,
              revokeAt: new Date().toISOString(),
              revocationReason: reason,
            },
          },
          { transaction }
        );

        return { success: true, device };
      });
    } catch (error) {
      logger.error("❌ Failed to revoke device trust:", error);
      throw new AppError(
        "Failed to revoke device trust",
        500,
        "DEVICE_REVOCATION_FAILED"
      );
    }
  }

  /**
   * Get all devices for user with detailed info
   */

  static async getUserDevices(userId, options = {}) {
    try {
      const where = { user_id: userId };

      if (options.trust_status) {
        where.trust_status = options.trust_status;
      }

      const devices = await TrustedDevice.findAll({
        where: where,
        order: [["last_used", "DESC"]],
        attributes: options.includeFingerprint
          ? undefined
          : { exclude: ["device_fingerprint"] },
      });

      // Enrich with additional info
      const enrichedDevices = devices.map((device) => ({
        ...device.toJSON(),
        isExpired:
          device.expires_at && new Date(device.expires_at) < new Date(),
        daysUntilExpiry: device.expires_at
          ? Math.ceil(
            (new Date(device.expires_at) - new Date()) / (1000 * 60 * 60 * 24)
          )
          : null,
        isCurrentDevice:
          options.currentFingerprint === device.device_fingerprint,
      }));

      return enrichedDevices;
    } catch (error) {
      logger.error("❌ Failed to get user devices:", error);
      throw new AppError(
        "Failed to retrieve devices",
        500,
        "DEVICE_RETRIEVAL_FAILED"
      );
    }
  }

  /**
   * Get trusted devices for risk scoring
   */

  static async getTrustedDevicesForUser(userId) {
    try {
      const devices = await TrustedDevice.findAll({
        where: {
          user_id: userId,
          trust_status: "trusted",
          [Sequelize.Op.or]: [
            { expires_at: { [Sequelize.Op.gt]: new Date() } },
            { expires_at: null },
          ],
        },
      });

      return devices;
    } catch (error) {
      logger.error("❌ Failed to get trusted devices:", error);
      return [];
    }
  }

  /**
   * Auto-cleanup expired devices (run as cron job)
   */

  static async cleanupExpiredDevices() {
    try {
      const result = await TrustedDevice.update(
        {
          trust_status: "expired",
          metadata: Sequelize.fn(
            "jsonb_set",
            Sequelize.col("metadata"),
            "{expiredAt}",
            `"${new Date().toISOString()}"`
          ),
        },
        {
          where: {
            trust_status: "trusted",
            expires_at: { [Sequelize.Op.lte]: new Date() },
          },
        }
      );

      logger.info("🧹 Cleaned up expired devices:", result[0]);
      return { cleaned: result[0] };
    } catch (error) {
      logger.error("❌ Failed to cleanup expired devices:", error);
      throw new AppError(
        "Failed to cleanup devices",
        500,
        "DEVICE_CLEANUP_FAILED"
      );
    }
  }

  /**
 * Revoke all devices for user (emergency/security breach)
 */

  static async revokeAllDevices(userId, reason = 'security_emergency') {
    try {
      return await withTransaction(async (transaction) => {
        const result = await TrustedDevice.update(
          {
            trust_status: 'revoked',
            expires_at: new Date(),
            metadata: sequelize.fn(
              'jsonb_set',
              sequelize.col('metadata'),
              '{revokedAt}',
              JSON.stringify({
                timestamp: new Date().toISOString(),
                reason: reason
              })
            )
          },
          {
            where: {
              user_id: userId,
              trust_status: 'trusted'
            },
            transaction
          }
        );

        logger.info('🔒 Revoked all trusted devices for user:', {
          userId,
          count: result[0],
          reason
        });

        return { revoked: result[0], reason };
      });

    } catch (error) {
      logger.error('❌ Failed to revoke all devices:', error);
      throw new AppError('Failed to revoke all devices', 500, 'DEVICE_REVOKE_ALL_FAILED');
    }
  }

  /**
   * Get device security insights
   */

  static async getDeviceSecurityInsights(userId) {
    try {
      const devices = await TrustedDevice.findAll({
        where: { user_id: userId }
      });


      const insights = {
        total: devices.length,
        trusted: devices.filter(d => d.trust_status === 'trusted').length,
        pending: devices.filter(d => d.trust_status === 'pending').length,
        revoked: devices.filter(d => d.trust_status === 'revoked').length,
        expired: devices.filter(d => d.trust_status === 'expired').length,
        expiringSoon: devices.filter(d =>
          d.expires_at &&
          new Date(d.expires_at) > new Date() &&
          new Date(d.expires_at) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        ).length,
        locations: [...new Set(devices.map(d => d.location))].filter(Boolean),
        lastActivity: devices.reduce((latest, d) =>
          !latest || new Date(d.last_used) > new Date(latest) ? d.last_used : latest
          , null)
      };

      return insights;

    } catch (error) {
      logger.error('❌ Failed to get device insights:', error);
      throw new AppError('Failed to get security insights', 500, 'DEVICE_INSIGHTS_FAILED');
    }
  }


  /**
 * Mark device as trusted with expiration
 * @param {string} userId - User ID
 * @param {string} fingerprint - Device fingerprint
 * @param {number} trustDays - Number of days to trust (default 30)
 * @param {object} metadata - Additional metadata
 * @returns {Promise<{success: boolean, device: object}>}
 */
  static async trustDevice(userId, fingerprint, trustDays = 30, metadata = {}) {
    try {
      return await withTransaction(async (transaction) => {
        // Find the device
        const device = await TrustedDevice.findOne({
          where: {
            user_id: userId,
            device_fingerprint: fingerprint
          },
          transaction
        });

        if (!device) {
          throw new AppError(
            'Device not found',
            404,
            'DEVICE_NOT_FOUND'
          );
        }

        // Validate trustDays
        if (trustDays < 1 || trustDays > 365) {
          throw new AppError(
            'Trust days must be between 1 and 365',
            400,
            'INVALID_TRUST_DAYS'
          );
        }

        // Calculate expiration date
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + trustDays);

        // Update device to trusted
        await device.update(
          {
            trust_status: 'trusted',
            trusted_at: new Date(),
            expires_at: expiresAt,
            metadata: {
              ...(device.metadata || {}),  // ✅ Guard against null/undefined
              trustedAt: new Date().toISOString(),
              trustDays: trustDays,
              trustedBy: metadata?.trustedBy || 'user',  // ✅ Safe access
              expiresAt: expiresAt.toISOString()
            }
          },
          { transaction }
        );


        logger.info('✅ Device marked as trusted:', {
          deviceId: device.id,
          deviceName: device.device_name,
          expiresAt: expiresAt,
          trustDays: trustDays
        });

        return {
          success: true,
          device: device.toJSON()
        };
      });
    } catch (error) {
      logger.error('❌ Failed to trust device:', error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        'Failed to trust device',
        500,
        'DEVICE_TRUST_FAILED'
      );
    }
  }
}


module.exports = TrustedDevicesService;