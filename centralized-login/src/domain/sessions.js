// domain/sessions.js
// Pure domain functions for session business logic
// Extracted from components for testability and reusability

/**
 * Suspicious session detection thresholds
 * @constant
 */
export const SESSION_THRESHOLDS = {
    /** Hours without access before marking as suspicious */
    SUSPICIOUS_HOURS: 72, // 3 days
    /** Hours without access before marking as stale */
    STALE_HOURS: 168, // 7 days
};

/**
 * Check if a session is current (active on this browser/device)
 * @param {Object} session - Session object
 * @returns {boolean}
 */
export function isCurrentSession(session) {
    return session?.current === true;
}

/**
 * Determine if a session should be flagged as suspicious
 * based on inactivity period.
 * 
 * @param {Object} session - Session object with lastAccess timestamp
 * @param {Date} [now=new Date()] - Reference time for calculation
 * @returns {boolean}
 */
export function isSuspiciousSession(session, now = new Date()) {
    if (!session?.lastAccess) return false;

    const lastAccess = new Date(session.lastAccess);
    const hoursSinceAccess = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);

    return hoursSinceAccess > SESSION_THRESHOLDS.SUSPICIOUS_HOURS;
}

/**
 * Determine if a session is stale (very old, likely orphaned)
 * @param {Object} session - Session object with lastAccess timestamp
 * @param {Date} [now=new Date()] - Reference time for calculation
 * @returns {boolean}
 */
export function isStaleSession(session, now = new Date()) {
    if (!session?.lastAccess) return false;

    const lastAccess = new Date(session.lastAccess);
    const hoursSinceAccess = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60);

    return hoursSinceAccess > SESSION_THRESHOLDS.STALE_HOURS;
}

/**
 * Group sessions by their client/application name
 * @param {Array<Object>} sessions - Array of session objects
 * @returns {Object} Object with clientId keys and session arrays as values
 */
export function groupSessionsByClient(sessions) {
    if (!Array.isArray(sessions)) return {};

    return sessions.reduce((acc, session) => {
        const client = session.clientId || session.applicationName || 'Unknown App';
        if (!acc[client]) {
            acc[client] = [];
        }
        acc[client].push(session);
        return acc;
    }, {});
}

/**
 * Helper to get device type from user agent string
 * @param {string} userAgent - User agent string
 * @returns {string} - Device type: 'Mobile', 'Tablet', or 'Desktop'
 */
export function getDeviceType(userAgent) {
    if (!userAgent) return 'Desktop';

    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        return 'Mobile';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
        return 'Tablet';
    }
    return 'Desktop';
}

/**
 * Calculate session statistics
 * @param {Array<Object>} sessions - Array of session objects
 * @returns {Object} Statistics object
 */
export function calculateSessionStats(sessions) {
    if (!Array.isArray(sessions) || sessions.length === 0) {
        return {
            total: 0,
            active: 0,
            suspicious: 0,
            stale: 0,
            clients: 0,
            devices: 0,
        };
    }

    const sessionsByClient = groupSessionsByClient(sessions);
    const now = new Date();

    return {
        total: sessions.length,
        active: sessions.filter(s => s.active !== false).length,
        suspicious: sessions.filter(s => isSuspiciousSession(s, now)).length,
        stale: sessions.filter(s => isStaleSession(s, now)).length,
        clients: Object.keys(sessionsByClient).length,
        devices: [...new Set(sessions.map(s => getDeviceType(s.userAgent)))].length,
    };
}

/**
 * Filter sessions by criteria
 * @param {Array<Object>} sessions - Sessions to filter
 * @param {Object} criteria - Filter criteria
 * @returns {Array<Object>} Filtered sessions
 */
export function filterSessions(sessions, { suspicious = false, stale = false, client = null } = {}) {
    if (!Array.isArray(sessions)) return [];

    return sessions.filter(session => {
        if (suspicious && !isSuspiciousSession(session)) return false;
        if (stale && !isStaleSession(session)) return false;
        if (client && (session.clientId !== client && session.applicationName !== client)) return false;
        return true;
    });
}
