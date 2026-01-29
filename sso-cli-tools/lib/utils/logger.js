/**
 * @fileoverview Logger Utility
 * @description Centralized logging with color-coded output levels
 */

import chalk from 'chalk';

/**
 * Log levels for consistent output
 */
export const LogLevel = {
    DEBUG: 'debug',
    INFO: 'info',
    SUCCESS: 'success',
    WARN: 'warn',
    ERROR: 'error',
};

/**
 * Logger utility with colored output
 */
export const logger = {
    /**
     * Debug message (gray)
     * @param {...any} args
     */
    debug(...args) {
        console.log(chalk.gray('🔍', ...args));
    },

    /**
     * Info message (blue)
     * @param {...any} args
     */
    info(...args) {
        console.log(chalk.blue('ℹ️', ...args));
    },

    /**
     * Success message (green)
     * @param {...any} args
     */
    success(...args) {
        console.log(chalk.green('✅', ...args));
    },

    /**
     * Warning message (yellow)
     * @param {...any} args
     */
    warn(...args) {
        console.log(chalk.yellow('⚠️', ...args));
    },

    /**
     * Error message (red)
     * @param {...any} args
     */
    error(...args) {
        console.error(chalk.red('❌', ...args));
    },

    /**
     * Step header (cyan, bold)
     * @param {string} message
     */
    step(message) {
        console.log(chalk.cyan.bold(`\n${message}`));
    },

    /**
     * Section header (blue, underlined)
     * @param {string} title
     */
    section(title) {
        console.log(chalk.blue.underline(`\n📦 ${title}\n`));
    },

    /**
     * Indent log (gray with prefix)
     * @param {string} message
     * @param {string} [prefix='  ✓']
     */
    indent(message, prefix = '  ✓') {
        console.log(chalk.gray(`${prefix} ${message}`));
    },

    /**
     * Table-style key-value output
     * @param {string} key
     * @param {string} value
     */
    keyValue(key, value) {
        console.log(chalk.white(`   ${key}:`), chalk.cyan(value));
    },

    /**
     * Blank line
     */
    blank() {
        console.log('');
    },
};

/**
 * Status emoji helper
 * @param {string} status - Status string
 * @returns {string} Emoji
 */
export function getStatusEmoji(status) {
    const statusMap = {
        approved: '✅',
        pending: '⏳',
        rejected: '❌',
        unknown: '❓',
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️',
    };
    return statusMap[status?.toLowerCase()] || '❓';
}

export default logger;
