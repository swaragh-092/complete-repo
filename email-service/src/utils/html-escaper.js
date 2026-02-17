'use strict';

/**
 * Escapes HTML characters in a string to prevent injection.
 * @param {string} str - The string to escape.
 * @returns {string} - The escaped string.
 */
function escapeHtml(str) {
    if (typeof str !== 'string') {
        return str;
    }
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Escapes all string values in an object (shallow).
 * @param {object} data - The data object.
 * @returns {object} - New object with escaped values.
 */
function escapeData(data) {
    if (!data || typeof data !== 'object') {
        return data;
    }

    const escaped = {};
    for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string') {
            escaped[key] = escapeHtml(value);
        } else if (Array.isArray(value)) {
            // Basic array handling if needed, or just pass through
            escaped[key] = value;
        } else if (typeof value === 'object' && value !== null) {
            // Recursive escape might be needed for nested objects like riskScore
            escaped[key] = escapeData(value);
        } else {
            escaped[key] = value;
        }
    }
    return escaped;
}

module.exports = {
    escapeHtml,
    escapeData
};
