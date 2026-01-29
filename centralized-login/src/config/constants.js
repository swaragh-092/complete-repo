// centalized-login/src/config/constants.js
//
// Centralized configuration constants
// All magic numbers and timing values should be defined here

/**
 * UI Timing Constants
 */
export const UI = {
    TOAST_DURATION_MS: 3000,
    DEBOUNCE_DELAY_MS: 300,
    ANIMATION_DURATION_MS: 200,
    LOADING_DELAY_MS: 150, // Delay before showing loading spinner
};

/**
 * Session & Security Constants
 */
export const SESSION = {
    VALIDATION_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
    IDLE_TIMEOUT_MS: 30 * 60 * 1000,       // 30 minutes
    TOKEN_REFRESH_BUFFER_SEC: 120,          // 2 minutes before expiry
    STALE_SESSION_HOURS: 24,                // Sessions older than this are stale
};

/**
 * API Request Constants
 */
export const API = {
    REQUEST_TIMEOUT_MS: 30000,
    RETRY_COUNT: 3,
    RETRY_DELAY_MS: 1000,
};

/**
 * Pagination Constants
 */
export const PAGINATION = {
    DEFAULT_PAGE_SIZE: 10,
    MAX_PAGE_SIZE: 100,
};

/**
 * Password Policy Constants
 */
export const PASSWORD = {
    MIN_LENGTH: 8,
    MAX_LENGTH: 128,
    WEAK_SCORE_THRESHOLD: 2,
    STRONG_SCORE_THRESHOLD: 4,
};
