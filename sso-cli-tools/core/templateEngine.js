/**
 * @fileoverview Template Engine for SSO CLI
 * @description Handles template variable replacement and conditional blocks
 */

/**
 * Replace template variables and handle conditional blocks
 * Supports: {{VARIABLE}}, {{#if VARIABLE}}...{{else}}...{{/if}}
 * @param {string} content - Template content
 * @param {Object} variables - Variables to replace
 * @returns {string} Processed content
 */
export function processTemplate(content, variables) {
  let result = content;
  
  // STEP 1: Handle conditional blocks {{#if VARIABLE}}...{{else}}...{{/if}}
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}([\s\S]*?)(?:\{\{else\}\}([\s\S]*?))?\{\{\/if\}\}/g;
  
  result = result.replace(conditionalRegex, (match, varName, trueBlock, falseBlock) => {
    const value = variables[varName];
    const isTruthy = value === true || value === 'true' || (value && value !== 'false' && value !== 'none');
    
    if (isTruthy) {
      return trueBlock || '';
    } else {
      return falseBlock || '';
    }
  });
  
  // STEP 2: Replace simple template variables {{VARIABLE}}
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }
  
  return result;
}

/**
 * Parse template and extract all variable names used
 * @param {string} content - Template content
 * @returns {string[]} Array of variable names
 */
export function extractVariables(content) {
  const variables = new Set();
  
  // Extract from conditionals
  const conditionalRegex = /\{\{#if\s+(\w+)\}\}/g;
  let match;
  while ((match = conditionalRegex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  
  // Extract from simple variables
  const simpleRegex = /\{\{(\w+)\}\}/g;
  while ((match = simpleRegex.exec(content)) !== null) {
    variables.add(match[1]);
  }
  
  return Array.from(variables);
}

/**
 * Validate that all required variables are provided
 * @param {string} content - Template content
 * @param {Object} variables - Provided variables
 * @returns {Object} { valid: boolean, missing: string[] }
 */
export function validateVariables(content, variables) {
  const required = extractVariables(content);
  const missing = required.filter(v => variables[v] === undefined);
  
  return {
    valid: missing.length === 0,
    missing
  };
}

export default {
  processTemplate,
  extractVariables,
  validateVariables
};
