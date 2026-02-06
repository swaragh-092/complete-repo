/**
 * @fileoverview SSO CLI Configuration
 * @description Centralized configuration module with environment support
 * 
 * Configuration priority:
 * 1. Environment variables (SSO_*)
 * 2. Config file (sso-client.config.json) if exists
 * 3. Default values
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load configuration from optional config file
 * @returns {Object} Config object or empty object
 */
function loadConfigFile() {
    const configPaths = [
        path.join(process.cwd(), 'sso-client.config.json'),
        path.join(__dirname, '..', '..', 'sso-client.config.json'),
    ];

    for (const configPath of configPaths) {
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, 'utf-8');
                return JSON.parse(content);
            } catch (error) {
                console.warn(`Warning: Failed to parse ${configPath}:`, error.message);
            }
        }
    }
    return {};
}

// Load file-based config (if exists)
const fileConfig = loadConfigFile();

/**
 * SSO CLI Configuration
 * All values can be overridden via environment variables
 */
export const SSO_CONFIG = {
    // Protocol: 'http' or 'https'
    protocol: process.env.SSO_PROTOCOL || fileConfig.protocol || 'https',

    // Base domain for all services
    domain: process.env.SSO_DOMAIN || fileConfig.domain || 'local.test',

    // Docker/Gateway mode (no ports in URLs)
    dockerMode: process.env.SSO_DOCKER_MODE === 'true' || fileConfig.dockerMode || false,

    // Auth service behind gateway (always use portless URLs for auth callbacks)
    // This is common when auth-service is dockerized but client is not
    authBehindGateway: process.env.SSO_AUTH_BEHIND_GATEWAY === 'true' || fileConfig.authBehindGateway || true,

    // Auth service port
    authServicePort: parseInt(
        process.env.SSO_AUTH_PORT || fileConfig.authServicePort || '4000',
        10
    ),

    // Account UI port
    accountUiPort: parseInt(
        process.env.SSO_ACCOUNT_UI_PORT || fileConfig.accountUiPort || '5174',
        10
    ),

    // API timeout in milliseconds
    apiTimeout: parseInt(
        process.env.SSO_API_TIMEOUT || fileConfig.apiTimeout || '30000',
        10
    ),

    // Computed URLs (getters)
    get authServiceUrl() {
        if (this.dockerMode) {
            return `${this.protocol}://auth.${this.domain}`;
        }
        return `${this.protocol}://auth.${this.domain}:${this.authServicePort}`;
    },

    get accountUiUrl() {
        if (this.dockerMode) {
            return `${this.protocol}://account.${this.domain}`;
        }
        return `${this.protocol}://account.${this.domain}:${this.accountUiPort}`;
    },

    /**
     * Get client application URL
     * @param {string} clientKey - Client identifier
     * @param {number|string} port - Port number
     * @returns {string} Full URL
     */
    getClientUrl(clientKey, port) {
        if (this.dockerMode) {
            return `${this.protocol}://${clientKey}.${this.domain}`;
        }
        return `${this.protocol}://${clientKey}.${this.domain}:${port}`;
    },

    /**
     * Get redirect URL for client (callback endpoint)
     * @param {string} clientKey - Client identifier
     * @param {number|string} port - Port number
     * @returns {string} Callback URL
     */
    getRedirectUrl(clientKey, port) {
        if (this.dockerMode) {
            return `${this.protocol}://${clientKey}.${this.domain}/callback`;
        }
        return `${this.protocol}://${clientKey}.${this.domain}:${port}/callback`;
    },

    /**
     * Get auth service callback URL for client
     * @param {string} clientKey - Client identifier
     * @returns {string} Auth service callback URL
     */
    getCallbackUrl(clientKey) {
        // Auth service callback URL should always use gateway (portless) when auth is behind gateway
        // This is the URL registered in Keycloak and must match what the browser sends
        if (this.authBehindGateway || this.dockerMode) {
            return `${this.protocol}://auth.${this.domain}/auth/callback/${clientKey}`;
        }
        return `${this.authServiceUrl}/auth/callback/${clientKey}`;
    },
};

/**
 * Template variables configuration
 */
export const TEMPLATE_DEFAULTS = {
    COLOR_PRIMARY: '#6366f1',
    COLOR_SECONDARY: '#8b5cf6',
    ICON_DEFAULT: '🆕',
    DEFAULT_PORT: '5173',
};

/**
 * Required dependencies for generated projects
 * Single source of truth for all npm install commands
 */
export const DEPENDENCIES = {
    // Runtime dependencies
    runtime: [
        '@spidy092/auth-client',
        'react-router-dom',
        '@tanstack/react-query',
        '@mui/material',
        '@mui/icons-material',
        '@emotion/react',
        '@emotion/styled',
        'notistack',
        'date-fns',
    ],
    // Dev dependencies
    dev: [
        'vite-plugin-mkcert',
    ],
    // Get full install command
    getInstallCommand() {
        return `npm install ${this.runtime.join(' ')} && npm install -D ${this.dev.join(' ')}`;
    },
    // Get short display command
    getDisplayCommand() {
        return `npm install ${this.runtime.slice(0, 3).join(' ')} ... (and MUI, mkcert)`;
    },
};

// ============================================================================
// ENTERPRISE CONFIGURATION - Themes, Features, Session Security
// ============================================================================

/**
 * Theme presets for generated applications
 * Can be overridden via sso-client.config.json: { "theme": "corporate" }
 */
export const THEMES = {
    default: {
        name: 'Default',
        primary: '#6366f1',
        secondary: '#8b5cf6',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
        gradientHover: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
        background: {
            light: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            dark: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        },
    },
    corporate: {
        name: 'Corporate',
        primary: '#1e40af',
        secondary: '#3b82f6',
        gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
        gradientHover: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
        background: {
            light: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            dark: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        },
    },
    modern: {
        name: 'Modern',
        primary: '#059669',
        secondary: '#10b981',
        gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
        gradientHover: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
        background: {
            light: 'linear-gradient(135deg, #065f46 0%, #047857 100%)',
            dark: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
        },
    },
    sunset: {
        name: 'Sunset',
        primary: '#ea580c',
        secondary: '#f97316',
        gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
        gradientHover: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
        background: {
            light: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
            dark: 'linear-gradient(135deg, #431407 0%, #7c2d12 100%)',
        },
    },
    midnight: {
        name: 'Midnight',
        primary: '#7c3aed',
        secondary: '#a855f7',
        gradient: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
        gradientHover: 'linear-gradient(135deg, #6d28d9 0%, #9333ea 100%)',
        background: {
            light: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
            dark: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        },
    },

    // Get theme by name with fallback to default
    getTheme(themeName) {
        return this[themeName] || this.default;
    },

    // Get list of available theme names
    getAvailableThemes() {
        return Object.keys(this).filter(key => typeof this[key] === 'object' && this[key].name);
    },
};

/**
 * Feature flags for generated applications
 * Can be overridden via sso-client.config.json: { "features": { "enableMFA": false } }
 */
export const FEATURES = {
    // Authentication features
    enableMFA: fileConfig.features?.enableMFA ?? true,
    enableSocialLogin: fileConfig.features?.enableSocialLogin ?? true,
    enablePasswordless: fileConfig.features?.enablePasswordless ?? false,

    // Session security features
    enableIdleTimeout: fileConfig.features?.enableIdleTimeout ?? true,
    enableCrossTabSync: fileConfig.features?.enableCrossTabSync ?? true,
    enableSessionValidation: fileConfig.features?.enableSessionValidation ?? true,
    enableProactiveRefresh: fileConfig.features?.enableProactiveRefresh ?? true,

    // UI features
    enableDarkMode: fileConfig.features?.enableDarkMode ?? true,
    enableThemeSwitcher: fileConfig.features?.enableThemeSwitcher ?? true,

    // Development features
    generateTests: fileConfig.features?.generateTests ?? false,
    generateStorybook: fileConfig.features?.generateStorybook ?? false,
    generateDocker: fileConfig.features?.generateDocker ?? false,

    // Advanced features
    enableAuditLogs: fileConfig.features?.enableAuditLogs ?? true,
    enableDevMode: fileConfig.features?.enableDevMode ?? process.env.NODE_ENV !== 'production',
};

/**
 * Session security configuration
 * Can be overridden via sso-client.config.json: { "session": { "idleTimeoutMs": 900000 } }
 */
export const SESSION_CONFIG = {
    // Token refresh buffer (seconds before expiry to trigger refresh)
    tokenRefreshBuffer: fileConfig.session?.tokenRefreshBuffer ?? 120,

    // Session validation interval (milliseconds)
    sessionValidationInterval: fileConfig.session?.sessionValidationInterval ?? (5 * 60 * 1000), // 5 min

    // Idle timeout (milliseconds) - logout after inactivity
    idleTimeoutMs: fileConfig.session?.idleTimeoutMs ?? (30 * 60 * 1000), // 30 min

    // Skip validation when browser tab is hidden
    skipValidationWhenHidden: fileConfig.session?.skipValidationWhenHidden ?? true,

    // Validate on tab visibility change
    validateOnVisibility: fileConfig.session?.validateOnVisibility ?? false,

    // API request timeout (milliseconds)
    apiTimeout: fileConfig.session?.apiTimeout ?? 10000,

    // Session validation retry attempts
    validationRetries: fileConfig.session?.validationRetries ?? 3,

    // Retry delay (milliseconds)
    retryDelay: fileConfig.session?.retryDelay ?? 1000,
};

/**
 * Get selected theme from config file or default
 */
export function getSelectedTheme() {
    const themeName = fileConfig.theme || process.env.SSO_THEME || 'default';
    return THEMES.getTheme(themeName);
}

/**
 * Validation patterns
 */
export const VALIDATION = {
    CLIENT_KEY_PATTERN: /^[a-z][a-z0-9_-]*$/,
    PORT_MIN: 1024,
    PORT_MAX: 65535,
};

/**
 * Validate configuration
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateConfig() {
    const errors = [];

    if (!['http', 'https'].includes(SSO_CONFIG.protocol)) {
        errors.push(`Invalid protocol: ${SSO_CONFIG.protocol}`);
    }

    if (SSO_CONFIG.authServicePort < VALIDATION.PORT_MIN ||
        SSO_CONFIG.authServicePort > VALIDATION.PORT_MAX) {
        errors.push(`Invalid auth service port: ${SSO_CONFIG.authServicePort}`);
    }

    if (SSO_CONFIG.accountUiPort < VALIDATION.PORT_MIN ||
        SSO_CONFIG.accountUiPort > VALIDATION.PORT_MAX) {
        errors.push(`Invalid account UI port: ${SSO_CONFIG.accountUiPort}`);
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

export default SSO_CONFIG;
