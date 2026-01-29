// Author: Gururaj
// Created: 16th May 2025
// Description: Response sending service
// Version: 1.0.0
// Modified:

class ResponseService {
  static getErrorMessage(errorCode, usedFor = null, action = null) {
    const defaultAction = action || "done";

    const dynamicSuccessCodes = [200, 201, 204];
    if (dynamicSuccessCodes.includes(errorCode) && usedFor) {
      return `${usedFor} ${defaultAction} successfully!`;
    }

    const customizableErrors = [400, 401, 403, 404, 422, 500];
    if (customizableErrors.includes(errorCode) && usedFor) {
      switch (errorCode) {
        case 400:
          return `Invalid request for ${usedFor}`;
        case 401:
          return `Unauthorized access to ${usedFor}`;
        case 403:
          return `Forbidden to access ${usedFor}`;
        case 404:
          return `${usedFor} not found`;
        case 422:
          return `${usedFor} validation failed`;
        case 500:
          return `Server error while processing ${usedFor}`;
      }
    }

    const standardMessages = {
      100: "Continue",
      101: "Switching Protocols",
      102: "Processing",
      103: "Early Hints",
      202: "Accepted",
      203: "Non-Authoritative Information",
      205: "Reset Content",
      206: "Partial Content",
      300: "Multiple Choices",
      301: "Moved Permanently",
      302: "Found",
      303: "See Other",
      304: "Not Modified",
      307: "Temporary Redirect",
      308: "Permanent Redirect",
      405: "Method Not Allowed",
      406: "Not Acceptable",
      407: "Proxy Authentication Required",
      408: "Request Timeout",
      409: "Conflict",
      410: "Gone",
      411: "Length Required",
      412: "Precondition Failed",
      413: "Payload Too Large",
      414: "URI Too Long",
      415: "Unsupported Media Type",
      416: "Range Not Satisfiable",
      417: "Expectation Failed",
      418: "I'm a teapot ☕",
      425: "Too Early",
      426: "Upgrade Required",
      428: "Precondition Required",
      429: "Too Many Requests",
      431: "Request Header Fields Too Large",
      451: "Unavailable For Legal Reasons",
      500: "Internal server error",
      501: "Not Implemented",
      502: "Bad Gateway",
      503: "Service Unavailable",
      504: "Gateway Timeout",
      505: "HTTP Version Not Supported",
      506: "Variant Also Negotiates",
      507: "Insufficient Storage",
      508: "Loop Detected",
      510: "Not Extended",
      511: "Network Authentication Required",
    };

    return standardMessages[errorCode] || "Unknown error";
  }

  static getUiMessage(key, params = {}) {
    const messages = {
      // Password Reset
      "password.reset.expired": "The reset link has expired. Please try again.",
      "password.reset.invalid_token":
        "Invalid or expired token. Please try again.",
      "password.reset.success": "Your password has been reset successfully!",
      "password.reset.failed": "Failed to reset password. Please try again.",

      // Email Verification
      "email.verification.success": "Email verified successfully!",
      "email.verification.expired":
        "Verification link expired. Please request a new one.",
      "email.verification.failed":
        "Failed to verify your email. Please try again.",

      // Login & Auth
      "login.failed": "Invalid email or password.",
      "login.success": "Welcome back!",
      "login.too_many_attempts":
        "Too many login attempts. Please try again in :minutes minutes.",
      "logout.success": "You have been logged out successfully.",
      "access.denied": "You do not have permission to access this page.",

      // Registration
      "register.success": "Account created successfully!",
      "register.failed": "Something went wrong while creating your account.",
      "register.exists": "User already exists",

      // Common
      "action.unauthorized": "Unauthorized action.",
      "action.failed": "Action failed. Please try again.",
      "not.found": "Requested resource was not found.",

      // Password Change
      "password.old_mismatch": "Old password does not match.",
      "password.confirm_mismatch":
        "New Password and Confirm Password do not match.",
      "password.update.success": "Password updated successfully.",
      "password.update.failed": "Failed to update password. Please try again.",
    };

    let message = messages[key] || "Something went wrong!";

    for (const [paramKey, value] of Object.entries(params)) {
      message = message.replace(`:${paramKey}`, value);
    }

    return message;
  }

  static apiResponse({
    res,
    success,
    status,
    usedFor = null,
    action = null,
    data = null,
    errors = null,
    message = null,
  }) {
    return res.status(status).json({
      success,
      message: message || this.getErrorMessage(status, usedFor, action),
      data,
      errors
    });
  }
}

// example usage 
// ResponseService.apiResponse({res, success : true, status : 200, usedFor : 'Mail', action : 'Sent', data : {}, message : "");

module.exports = ResponseService;
