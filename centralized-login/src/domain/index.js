// domain/index.js
// Barrel export for domain layer

// Session domain logic
export {
    SESSION_THRESHOLDS,
    isCurrentSession,
    isSuspiciousSession,
    isStaleSession,
    groupSessionsByClient,
    getDeviceType,
    calculateSessionStats,
    filterSessions,
} from './sessions';

// Security domain logic
export {
    SECURITY_THRESHOLDS,
    getSecurityScoreColor,
    getSecurityScoreText,
    calculateSecurityScore,
    validatePassword,
    isPasswordExpired,
    getSecurityAlertLevel,
} from './security';
