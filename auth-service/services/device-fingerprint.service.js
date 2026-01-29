const crypto = require('crypto');
const UAParser = require('ua-parser-js');
const { AppError } = require('../middleware/errorHandler')
const { AuditLog } = require('../config/database');
const { withTransaction } = require('../utils/transaction');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

dotenv.config();

class DeviceFingerprintService {

  static async generateFingerprint(req) {
    try {
      const userAgent = req.headers['user-agent'] || '';
      const parser = new UAParser(userAgent);
      const ua = parser.getResult();
      const body = req.body || {};

      const fingerprintData = {
        version: '1.0.0', // version control for future updates
        os: ua.os.name || 'unknown',
        osVersion: ua.os.version || 'unknown',
        browser: ua.browser.name || 'unknown',
        browserVersion: ua.browser.version || 'unknown',
        deviceModel: ua.device.model || 'unknown',
        deviceType: ua.device.type || 'desktop',
        userAgent,
        language: req.headers['accept-language'] || 'unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown',

        screen: {
          width: body.screenWidth || 0,
          height: body.screenHeight || 0,
          colorDepth: body.colorDepth || 0,
        },
        ipAddress: req.ip || req.headers['x-forwarded-for'] || 'unknown',
      };

      // 🧠 Sort keys for deterministic hash (avoid order issues)
      const stableString = JSON.stringify(fingerprintData, Object.keys(fingerprintData).sort());

      // Add salt for extra uniqueness (e.g., organization-level)
      const salt = process.env.FP_SALT || 'default_salt';
      const hash = crypto.createHash('sha256').update(stableString + salt).digest('hex');

      // Log for auditing (in a safe transaction)
      await withTransaction(async (transaction) => {
        await AuditLog.create({
          action: 'GENERATE_FINGERPRINT',
          details: { fingerprint: hash.substring(0, 12) + '...', fingerprintData },
          userId: req.user?.sub || null,
          ipAddress: fingerprintData.ipAddress
        }, { transaction });
      });

      logger.info('📱 Generated Fingerprint:', hash.substring(0, 16) + '...');
      return { fingerprint: hash, deviceData: fingerprintData };

    } catch (error) {
      logger.error('❌ Failed to generate fingerprint:', error);
      throw new AppError('Failed to generate device fingerprint', 500, 'FP_GENERATION_FAILED');
    }
  }

  /**
* Get human-readable device name
*/
  static async getDeviceName(deviceData) {
    try {
      if (!deviceData) throw new AppError('Missing device data', 400, 'DEVICE_DATA_MISSING');
      const { browser, os, deviceType, browserVersion, osVersion } = deviceData;
      const readableName = `${browser || 'Unknown Browser'} ${browserVersion || ''} on ${os || 'Unknown OS'} ${osVersion || ''} (${deviceType || 'unknown device'})`;

      const type = deviceType || 'unknown device';


      return readableName.trim();
    } catch (error) {
      logger.error('❌ Failed to get device name:', error);
      throw new AppError('Failed to get device name', 500, 'DEVICE_NAME_FAILED');

    }
  }

  /**
 * Compare two fingerprints for similarity
 * Returns similarity score 0-100
 */

  static async compareFingerprintsSimilarity(fp1, fp2, tolerance = 0) {
    try {
      if (!fp1 || !fp2) {
        throw new AppError('Missing fingerprint data', 400, 'FP_MISSING');
      }

      // 🔹 Basic structural validation
      if (typeof fp1 !== 'object' || typeof fp2 !== 'object') {
        throw new AppError('Invalid fingerprint format', 400, 'FP_INVALID');
      }
      const weights = {
        os: 20,
        browser: 15,
        screenResolution: 15,
        timezone: 5,
        language: 5,
        userAgent: 10,
        ipAdress: 10,
        canvasHash: 5,
        fontsHash: 5,
        audioHash: 5
      }

      let totalScore = 0;
      let maxScore = 0;

      for (const [key, weight] of Object.entries(weights)) {
        maxScore += weight;

        if (!fp1[key] || !fp2[key]) continue;

        const v1 = String(fp1[key]).toLowerCase();
        const v2 = String(fp2[key]).toLowerCase();

        if (v1 === v2) {
          totalScore += weight;
        } else if (key === "ipAddress") {
          if (fp1[key].split(".").slice(0, 3).join(".") === fp2[key].split(".").slice(0, 3).join(".")) {
            totalScore += weight * 0.7;
          }
        } else if (key === "browser" || key === "userAgent") {
          if (v1.includes(v2.split(" ")[0]) || v2.includes(v1.split(" ")[0])) {
            totalScore += weight * 0.5;
          }
        }
      }

      let similarity = (totalScore / maxScore) * 100;

      if (tolerance > 0) {
        similarity = Math.max(0, similarity - tolerance);
      }

      return Math.round(similarity);

    } catch (error) {
      throw new AppError('Fingerprint comparison failed', 500, 'FP_COMPARE_ERROR');
    }
  }


  static async calculateRiskScore(trustedDevices = [], currentDevice = {}, locationData = {}) {
    try {
      let totalRisk = 0;
      const breakdown = {};

      // Configurable risk weights
      const weights = {
        NEW_USER: 40,
        NEW_DEVICE: 25,
        LOCATION_ANOMALY: 15,
        TIME_ANOMALY: 10,
        NETWORK_ANOMALY: 5,
        OTHER: 5
      };

      // 🧩 1. New User (no trusted devices)
      if (!trustedDevices || trustedDevices.length === 0) {
        totalRisk += weights.NEW_USER;
        breakdown.newUser = weights.NEW_USER;
      }

      // 🧩 2. Compare current device to known devices (via fingerprint similarity)
      let deviceSimilarity = 0;
      if (trustedDevices?.length > 0) {
        for (const td of trustedDevices) {
          const sim = await this.compareFingerprintsSimilarity(currentDevice, {
            os: td.os,
            browser: td.browser,
            osVersion: td.osVersion,
            deviceType: td.deviceType,
            screenResolution: td.screenResolution
          });

          deviceSimilarity = Math.max(deviceSimilarity, sim);
        }
      }

      if (deviceSimilarity < 70) {
        totalRisk += weights.NEW_DEVICE;
        breakdown.newDevice = weights.NEW_DEVICE;
      }

      // 🧩 3. Location-based anomaly detection
      if (locationData?.country && trustedDevices?.length > 0) {
        const knownCountries = [
          ...new Set(trustedDevices.map(td => td.location?.country).filter(Boolean))
        ];

        if (knownCountries.length > 0 && !knownCountries.includes(locationData.country)) {
          totalRisk += weights.LOCATION_ANOMALY;
          breakdown.locationAnomaly = weights.LOCATION_ANOMALY;
        }
      }

      // 🧩 4. Time-based anomaly (e.g., odd login times)
      const hour = new Date().getHours();
      if (hour < 6 || hour > 22) {
        totalRisk += weights.TIME_ANOMALY;
        breakdown.timeAnomaly = weights.TIME_ANOMALY;
      }

      // 🧩 5. Network anomaly (optional)
      if (locationData?.ip && trustedDevices?.length > 0) {
        const knownNetworks = [
          ...new Set(trustedDevices.map(td => td.ip?.split('.')?.slice(0, 2).join('.')).filter(Boolean))
        ];

        const currentNetwork = locationData.ip?.split('.')?.slice(0, 2).join('.');
        if (currentNetwork && !knownNetworks.includes(currentNetwork)) {
          totalRisk += weights.NETWORK_ANOMALY;
          breakdown.networkAnomaly = weights.NETWORK_ANOMALY;
        }
      }

      // 🧩 Cap at 100
      const finalScore = Math.min(100, totalRisk);

      return {
        score: finalScore,
        level:
          finalScore >= 75 ? 'HIGH' :
            finalScore >= 40 ? 'MEDIUM' : 'LOW',
        breakdown,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Risk calculation failed:', error);
      return {
        score: 100,
        level: 'HIGH',
        breakdown: { error: 'Calculation error' },
        timestamp: new Date().toISOString()
      };
    }
  }



}


module.exports = DeviceFingerprintService;