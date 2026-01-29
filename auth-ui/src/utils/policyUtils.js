/**
 * Parses a Keycloak password policy string into a structured object.
 * @param {string} policyString - The password policy string (e.g., "length(8) and upperCase(1)")
 * @returns {Object} The parsed policy object
 */
export const parsePasswordPolicy = (policyString) => {
    if (!policyString) return null;

    const policy = {
        minLength: 8,
        requireUppercase: false,
        requireLowercase: false,
        requireDigit: false,
        requireSpecial: false,
        notUsername: false,
        notEmail: false,
        passwordHistory: 0
    };

    const matches = {
        length: policyString.match(/length\((\d+)\)/),
        upperCase: policyString.match(/upperCase\((\d+)\)/),
        lowerCase: policyString.match(/lowerCase\((\d+)\)/),
        digits: policyString.match(/digits\((\d+)\)/),
        specialChars: policyString.match(/specialChars\((\d+)\)/),
        notUsername: policyString.includes('notUsername'),
        notEmail: policyString.includes('notEmail'),
        passwordHistory: policyString.match(/passwordHistory\((\d+)\)/)
    };

    if (matches.length) policy.minLength = parseInt(matches.length[1]);
    policy.requireUppercase = !!(matches.upperCase && parseInt(matches.upperCase[1]) > 0);
    policy.requireLowercase = !!(matches.lowerCase && parseInt(matches.lowerCase[1]) > 0);
    policy.requireDigit = !!(matches.digits && parseInt(matches.digits[1]) > 0);
    policy.requireSpecial = !!(matches.specialChars && parseInt(matches.specialChars[1]) > 0);
    policy.notUsername = matches.notUsername;
    policy.notEmail = matches.notEmail;
    if (matches.passwordHistory) policy.passwordHistory = parseInt(matches.passwordHistory[1]);

    return policy;
};

/**
 * Builds a Keycloak password policy string from a structured object.
 * @param {Object} passwordPolicy - The policy object
 * @returns {string} The password policy string
 */
export const buildPasswordPolicy = (passwordPolicy) => {
    if (!passwordPolicy) return '';
    const parts = [];
    parts.push(`length(${passwordPolicy.minLength || 8})`);
    if (passwordPolicy.requireUppercase) parts.push('upperCase(1)');
    if (passwordPolicy.requireLowercase) parts.push('lowerCase(1)');
    if (passwordPolicy.requireDigit) parts.push('digits(1)');
    if (passwordPolicy.requireSpecial) parts.push('specialChars(1)');
    if (passwordPolicy.notUsername) parts.push('notUsername(undefined)');
    if (passwordPolicy.notEmail) parts.push('notEmail(undefined)');
    if (passwordPolicy.passwordHistory > 0) parts.push(`passwordHistory(${passwordPolicy.passwordHistory})`);

    return parts.join(' and ');
};
