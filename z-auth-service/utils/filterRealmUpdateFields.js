// utils/filterRealmUpdateFields.js
module.exports = function filterRealmUpdateFields(data) {
  return {
    displayName: data.displayName,
    enabled: data.enabled,
    sslRequired: data.sslRequired,
    accessTokenLifespan: data.accessTokenLifespan,
    ssoSessionIdleTimeout: data.ssoSessionIdleTimeout,
    loginWithEmailAllowed: data.loginWithEmailAllowed,
    registrationAllowed: data.registrationAllowed,
    verifyEmail: data.verifyEmail,
    loginTheme: data.loginTheme,
    accountTheme: data.accountTheme,
    adminTheme: data.adminTheme,
    emailTheme: data.emailTheme,
    passwordPolicy: data.passwordPolicy, // Make sure it's a string like: "length(8) and digits(1)"
    smtpServer: data.smtpServer,         // You should format this before using
    attributes: data.attributes,         // Optional, only if you set custom realm attrs
  };
};
