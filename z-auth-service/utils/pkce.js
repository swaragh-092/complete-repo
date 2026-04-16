const logger = require('./logger');


/**
 * PKCE (Proof Key for Code Exchange) Utility - Server Side
 * Implements RFC 7636 for OAuth2 security validation
 */

const crypto = require('crypto');

/**
 * Verify PKCE code challenge against code verifier
 * @param {string} codeVerifier - The code verifier from client
 * @param {string} codeChallenge - The code challenge from authorization request
 * @returns {boolean}
 */
function verifyPKCE(codeVerifier, codeChallenge) {
  logger.info('Verifying PKCE:', { codeVerifier, codeChallenge });
  
  if (!codeVerifier || !codeChallenge) {
    return false;
  }
  
  try {
    // Hash the code verifier with SHA-256
    const hash = crypto.createHash('sha256').update(codeVerifier).digest();
    
    // Convert to base64url
    const base64Url = hash
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    // Compare with code challenge
    return base64Url === codeChallenge;
  } catch (error) {
    logger.error('PKCE verification failed:', error);
    return false;
  }
}

/**
 * Generate code challenge from verifier (for testing)
 * @param {string} codeVerifier - The code verifier
 * @returns {string} - The code challenge
 */
function generateCodeChallenge(codeVerifier) {
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  return hash
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

module.exports = {
  verifyPKCE,
  generateCodeChallenge
};

