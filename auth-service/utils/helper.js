const logger = require('./logger');
const { AppError } = require('../middleware/errorHandler');

// Helper function to extract realm from JWT token
function extractRealmFromToken(rawToken) {
  try {
    if (!rawToken || typeof rawToken !== 'string') {
      throw new AppError('Malformed token string', 400, 'INVALID_TOKEN_FORMAT');
    }

    const token = rawToken.replace(/^["']|["']$/g, '').trim();

    if (token.split('.').length < 2) {
      throw new AppError('Malformed token string', 400, 'INVALID_TOKEN_FORMAT');
    }

    // Decode JWT payload without verification to get issuer
    const base64Payload = token.split('.')[1];
    const payloadString = Buffer.from(base64Payload, 'base64').toString('utf-8');
    const payload = JSON.parse(payloadString);

    if (payload.iss) {
      // Extract realm from issuer: http://localhost:8081/realms/server -> "server"
      const matches = payload.iss.match(/\/realms\/([^/]+)/);
      if (matches && matches[1]) {
        return matches[1];
      }
    }

    throw new AppError('Could not extract realm from token issuer', 400, 'INVALID_TOKEN');
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.error('Error extracting realm from token:', error.message);
    throw new AppError('Invalid token format', 400, 'INVALID_TOKEN_FORMAT');
  }
}

function sanitizeRealmPayload(updates) {
  const disallowed = [
    "id",
    "displayNameHtml",
    "notBefore",
    "publicKey",
    "certificate",
    "defaultSignatureAlgorithm",
    "registrationToken"
  ];

  disallowed.forEach(key => delete updates[key]);

  // Clean SMTP (remove empty values)
  if (updates.smtpServer) {
    Object.keys(updates.smtpServer).forEach(k => {
      if (updates.smtpServer[k] === "" || updates.smtpServer[k] == null) {
        delete updates.smtpServer[k];
      }
    });
  }

  // Convert passwordPolicy object → Keycloak string format
  if (updates.passwordPolicy && typeof updates.passwordPolicy === "object") {
    const policies = [];
    if (updates.passwordPolicy.minLength) {
      policies.push(`length(${updates.passwordPolicy.minLength})`);
    }
    if (updates.passwordPolicy.requireSpecial) policies.push("specialChars(1)");
    if (updates.passwordPolicy.requireUppercase) policies.push("upperCase(1)");
    if (updates.passwordPolicy.requireLowercase) policies.push("lowerCase(1)");
    if (updates.passwordPolicy.requireDigit) policies.push("digits(1)");

    updates.passwordPolicy = policies.join(" and ");
  }

  return updates;
}


module.exports = { extractRealmFromToken, sanitizeRealmPayload };
