// services/refresh-token.service.js - Enterprise Refresh Token Management Service

const { RefreshToken } = require('../config/database');
const crypto = require('crypto');
const logger = require('../utils/logger');

class RefreshTokenService {
  /**
   * Store a refresh token securely (hash it before storing)
   */
  static async storeToken({
    userId,
    clientId,
    realmName,
    refreshToken,
    accessToken,
    expiresIn = 2592000, // 30 days default
    sessionId = null,
    deviceId = null,
    ipAddress = null,
    userAgent = null,
    metadata = {},
  }) {
    try {
      // Hash the token for secure storage
      const tokenHash = RefreshToken.hashToken(refreshToken);

      // Check if token already exists (prevent duplicates)
      const existing = await RefreshToken.findOne({
        where: { token_hash: tokenHash },
      });

      if (existing) {
        logger.warn('Refresh token already exists', { userId, clientId });
        return existing;
      }

      // Calculate expiration
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);

      // Create new token record
      const tokenRecord = await RefreshToken.create({
        user_id: userId,
        client_id: clientId,
        token_hash: tokenHash,
        realm_name: realmName,
        session_id: sessionId,
        device_id: deviceId,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt,
        metadata: {
          ...metadata,
          stored_at: new Date().toISOString(),
        },
      });

      logger.info('Refresh token stored', {
        userId,
        clientId,
        tokenId: tokenRecord.id,
      });

      return tokenRecord;
    } catch (error) {
      logger.error('Failed to store refresh token', {
        error: error.message,
        userId,
        clientId,
      });
      throw error;
    }
  }

  /**
   * Validate and find a refresh token by hash
   */
  static async validateToken(refreshToken) {
    try {
      const tokenHash = RefreshToken.hashToken(refreshToken);

      const tokenRecord = await RefreshToken.findOne({
        where: { token_hash: tokenHash },
      });

      if (!tokenRecord) {
        return { valid: false, reason: 'Token not found' };
      }

      if (!tokenRecord.isActive()) {
        return {
          valid: false,
          reason: tokenRecord.revoked_at ? 'Token revoked' : 'Token expired',
        };
      }

      return { valid: true, tokenRecord };
    } catch (error) {
      logger.error('Failed to validate refresh token', {
        error: error.message,
      });
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Revoke a refresh token
   */
  static async revokeToken(refreshToken, reason = 'logout') {
    try {
      const tokenHash = RefreshToken.hashToken(refreshToken);

      const tokenRecord = await RefreshToken.findOne({
        where: { token_hash: tokenHash },
      });

      if (tokenRecord) {
        await tokenRecord.revoke(reason);
        logger.info('Refresh token revoked', {
          tokenId: tokenRecord.id,
          userId: tokenRecord.user_id,
          reason,
        });
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to revoke refresh token', {
        error: error.message,
      });
      return false;
    }
  }

  /**
   * Revoke all tokens for a user (logout all devices)
   */
  static async revokeAllUserTokens(userId, clientId = null, reason = 'logout_all') {
    try {
      const where = {
        user_id: userId,
        revoked_at: null, // Only active tokens
      };

      if (clientId) {
        where.client_id = clientId;
      }

      const result = await RefreshToken.update(
        {
          revoked_at: new Date(),
          revoked_reason: reason,
        },
        { where }
      );

      logger.info('All user tokens revoked', {
        userId,
        clientId,
        count: result[0],
      });

      return result[0];
    } catch (error) {
      logger.error('Failed to revoke all user tokens', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Rotate refresh token (revoke old, store new)
   */
  static async rotateToken({
    oldRefreshToken,
    newRefreshToken,
    userId,
    clientId,
    realmName,
    expiresIn,
    sessionId = null,
    deviceId = null,
    ipAddress = null,
    userAgent = null,
    metadata = {},
  }) {
    try {
      // Revoke old token
      const oldTokenHash = RefreshToken.hashToken(oldRefreshToken);
      const oldToken = await RefreshToken.findOne({
        where: { token_hash: oldTokenHash },
      });

      if (oldToken) {
        await oldToken.revoke('rotated');
      }

      // Store new token with reference to old one
      const newToken = await this.storeToken({
        userId,
        clientId,
        realmName,
        refreshToken: newRefreshToken,
        expiresIn,
        sessionId,
        deviceId,
        ipAddress,
        userAgent,
        metadata: {
          ...metadata,
          rotated_from: oldToken?.id || null,
        },
      });

      if (oldToken) {
        newToken.rotated_from = oldToken.id;
        await newToken.save();
      }

      logger.info('Refresh token rotated', {
        userId,
        clientId,
        oldTokenId: oldToken?.id,
        newTokenId: newToken.id,
      });

      return newToken;
    } catch (error) {
      logger.error('Failed to rotate refresh token', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }

  /**
   * Clean up expired tokens (maintenance job)
   */
  static async cleanupExpiredTokens() {
    try {
      const result = await RefreshToken.destroy({
        where: {
          expires_at: { [require('sequelize').Op.lt]: new Date() },
        },
      });

      logger.info('Expired tokens cleaned up', { count: result });
      return result;
    } catch (error) {
      logger.error('Failed to cleanup expired tokens', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Get active tokens for a user
   */
  static async getUserTokens(userId, clientId = null) {
    try {
      const where = {
        user_id: userId,
        revoked_at: null,
        expires_at: { [require('sequelize').Op.gt]: new Date() },
      };

      if (clientId) {
        where.client_id = clientId;
      }

      return await RefreshToken.findAll({
        where,
        order: [['created_at', 'DESC']],
      });
    } catch (error) {
      logger.error('Failed to get user tokens', {
        error: error.message,
        userId,
      });
      throw error;
    }
  }
}

module.exports = RefreshTokenService;







