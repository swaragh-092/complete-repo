/**
 * @fileoverview File Generator Utilities for SSO CLI
 * @description Handles file generation from templates with error handling
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { processTemplate } from '../core/templateEngine.js';

/**
 * Generate a file from a template
 * @param {string} templatePath - Path to template relative to templates folder
 * @param {string} outputPath - Output file path
 * @param {Object} variables - Template variables
 * @param {string} templatesDir - Base templates directory
 * @returns {boolean} Success status
 */
export async function generateFile(templatePath, outputPath, variables, templatesDir) {
  try {
    const fullTemplatePath = path.join(templatesDir, templatePath);
    
    if (!fs.existsSync(fullTemplatePath)) {
      console.log(chalk.yellow(`  ⚠️  Template not found: ${templatePath}`));
      return false;
    }
    
    let content = fs.readFileSync(fullTemplatePath, 'utf-8');
    
    // Process template with variables
    content = processTemplate(content, variables);
    
    // Ensure output directory exists
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, content);
    console.log(chalk.green(`  ✓ Generated: ${outputPath}`));
    return true;
    
  } catch (error) {
    console.error(chalk.red(`  ✗ Failed to generate ${outputPath}:`), error.message);
    return false;
  }
}

/**
 * Generate multiple files from templates
 * @param {Array<{template: string, output: string}>} files - Array of file configs
 * @param {Object} variables - Template variables
 * @param {string} templatesDir - Base templates directory
 * @returns {Object} { success: number, failed: number }
 */
export async function generateFiles(files, variables, templatesDir) {
  let success = 0;
  let failed = 0;
  
  for (const file of files) {
    const result = await generateFile(file.template, file.output, variables, templatesDir);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }
  
  return { success, failed };
}

/**
 * Ensure a directory exists
 * @param {string} dirPath - Directory path
 */
export function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Read a template file
 * @param {string} templateName - Template file name
 * @param {string} templatesDir - Base templates directory
 * @returns {string} Template content
 */
export function readTemplate(templateName, templatesDir) {
  const templatePath = path.join(templatesDir, templateName);
  return fs.readFileSync(templatePath, 'utf8');
}

/**
 * Check if a path exists
 * @param {string} filePath - File or directory path
 * @returns {boolean} Exists status
 */
export function pathExists(filePath) {
  return fs.existsSync(filePath);
}

export default {
  generateFile,
  generateFiles,
  ensureDir,
  readTemplate,
  pathExists
};
