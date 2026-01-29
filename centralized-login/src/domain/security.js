// domain/security.js
// Pure domain functions for security business logic
// Extracted from components for testability and reusability

/**
 * Security scoring thresholds
 * @constant
 */
export const SECURITY_THRESHOLDS = {
    /** Minimum password length */
    MIN_PASSWORD_LENGTH: 8,
    /** Days before password is considered old */
    PASSWORD_MAX_AGE_DAYS: 90,
    /** Maximum failed login attempts before flagging */
    MAX_FAILED_LOGINS: 5,
};

/**
 * Get security score color based on score value
 * @param {number} score - Security score (0-100)
 * @returns {'success' | 'warning' | 'error'} MUI color name
 */
export function getSecurityScoreColor(score) {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
}

/**
 * Get human-readable security score text
 * @param {number} score - Security score (0-100)
 * @returns {string} Human-readable label
 */
export function getSecurityScoreText(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Poor';
}

/**
 * Calculate overall security score based on security factors
 * @param {Object} factors - Security factors
 * @param {boolean} factors.emailVerified - Whether email is verified
 * @param {boolean} factors.twoFactorEnabled - Whether 2FA is enabled
 * @param {boolean} factors.hasStrongPassword - Whether password meets strength requirements
 * @param {number} factors.failedLoginAttempts - Recent failed login count
 * @param {Date|null} factors.lastPasswordChange - Last password change date
 * @returns {number} Score from 0-100
 */
export function calculateSecurityScore(factors) {
    const {
        emailVerified = false,
        twoFactorEnabled = false,
        hasStrongPassword = true,
        failedLoginAttempts = 0,
        lastPasswordChange = null,
    } = factors || {};
    let score = 0;

    // Email verification (20 points)
    if (emailVerified) score += 20;

    // 2FA enabled (30 points)
    if (twoFactorEnabled) score += 30;

    // Strong password (20 points)
    if (hasStrongPassword) score += 20;

    // Low failed login attempts (15 points)
    if (failedLoginAttempts === 0) {
        score += 15;
    } else if (failedLoginAttempts < SECURITY_THRESHOLDS.MAX_FAILED_LOGINS) {
        score += 10;
    }

    // Recent password change (15 points)
    if (lastPasswordChange) {
        const daysSinceChange = (Date.now() - new Date(lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceChange < SECURITY_THRESHOLDS.PASSWORD_MAX_AGE_DAYS) {
            score += 15;
        } else if (daysSinceChange < SECURITY_THRESHOLDS.PASSWORD_MAX_AGE_DAYS * 2) {
            score += 8;
        }
    }

    return Math.min(100, score);
}

/**
 * Validate password meets minimum requirements
 * @param {string} password - Password to validate
 * @param {string} [confirmPassword] - Confirmation password (optional)
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validatePassword(password, confirmPassword = null) {
    const errors = [];

    if (!password || password.length < SECURITY_THRESHOLDS.MIN_PASSWORD_LENGTH) {
        errors.push(`Password must be at least ${SECURITY_THRESHOLDS.MIN_PASSWORD_LENGTH} characters`);
    }

    if (confirmPassword !== null && password !== confirmPassword) {
        errors.push('Passwords do not match');
    }

    // Optional: Add more validation rules here
    // if (!/[A-Z]/.test(password)) errors.push('Must contain uppercase letter');
    // if (!/[0-9]/.test(password)) errors.push('Must contain number');

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * Check if password needs to be changed based on age
 * @param {Date|string|null} lastPasswordChange - Last password change date
 * @returns {boolean}
 */
export function isPasswordExpired(lastPasswordChange) {
    if (!lastPasswordChange) return true;

    const daysSinceChange = (Date.now() - new Date(lastPasswordChange).getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceChange > SECURITY_THRESHOLDS.PASSWORD_MAX_AGE_DAYS;
}

/**
 * Determine security alert level based on factors
 * @param {Object} security - Security status object
 * @returns {'none' | 'info' | 'warning' | 'critical'}
 */
export function getSecurityAlertLevel(security) {
    if (!security) return 'none';

    // Critical: multiple concerning factors
    if (
        security.failedLoginAttempts >= SECURITY_THRESHOLDS.MAX_FAILED_LOGINS ||
        (security.suspiciousSessions && security.suspiciousSessions > 0)
    ) {
        return 'critical';
    }

    // Warning: some concerns
    if (
        !security.twoFactorEnabled ||
        security.failedLoginAttempts > 0 ||
        isPasswordExpired(security.lastPasswordChange)
    ) {
        return 'warning';
    }

    // Info: minor suggestions
    if (!security.emailVerified) {
        return 'info';
    }

    return 'none';
}
