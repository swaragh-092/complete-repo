/**
 * @fileoverview File Generator Service
 * @description Handles template processing and file generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { processTemplate } from '../../core/templateEngine.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Template directory path
const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

/**
 * Generate a file from template
 * @param {string} templatePath - Relative path to template file
 * @param {string} outputPath - Output file path
 * @param {Object} variables - Template variables
 * @returns {Promise<boolean>} Success status
 */
export async function generateFile(templatePath, outputPath, variables) {
    try {
        const templateFullPath = path.join(TEMPLATES_DIR, templatePath);

        if (!fs.existsSync(templateFullPath)) {
            logger.warn(`Template not found: ${templatePath}`);
            return false;
        }

        const templateContent = fs.readFileSync(templateFullPath, 'utf-8');
        const processedContent = processTemplate(templateContent, variables);

        // Ensure output directory exists
        const outputDir = path.dirname(outputPath);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(outputPath, processedContent);
        logger.indent(`Generated: ${outputPath}`);
        return true;

    } catch (error) {
        logger.error(`Failed to generate ${outputPath}:`, error.message);
        return false;
    }
}

/**
 * Read template file content
 * @param {string} templateName - Template file name
 * @returns {string|null} Template content or null
 */
export function readTemplate(templateName) {
    const templatePath = path.join(TEMPLATES_DIR, templateName);

    if (!fs.existsSync(templatePath)) {
        logger.warn(`Template not found: ${templateName}`);
        return null;
    }

    return fs.readFileSync(templatePath, 'utf-8');
}

/**
 * Check if template exists
 * @param {string} templatePath - Relative template path
 * @returns {boolean}
 */
export function templateExists(templatePath) {
    return fs.existsSync(path.join(TEMPLATES_DIR, templatePath));
}

/**
 * Create directory if it doesn't exist
 * @param {string} dirPath - Directory path
 * @returns {boolean} True if created, false if already exists
 */
export function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        logger.indent(`Created directory: ${dirPath}`);
        return true;
    }
    return false;
}

/**
 * Get templates directory path
 * @returns {string}
 */
export function getTemplatesDir() {
    return TEMPLATES_DIR;
}

export default {
    generateFile,
    readTemplate,
    templateExists,
    ensureDir,
    getTemplatesDir,
};
