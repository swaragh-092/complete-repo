// Author: Gururaj
// Created: 16th May 2025
// Description: Validation service for all inputs 
// Version: 1.0.0
// Modified: gururaj at 27th May 2025, added confirm password, old password validation
// Modified: gururaj at 29th May 2025, added added dynamic names and new validation fileds discription and path
// Modified: gururaj at 04th July 2025, added validation for bool, enum fileds, alphaNum255


const { check, body, param } = require('express-validator');

// Password Validator
exports.password = (field = 'password') =>
  check(field)
    .trim()
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[@$!%*?&]/).withMessage('Password must contain at least one special character (@$!%*?&)');

// Confirm Password Validator
exports.confirmPassword = (field = 'confirm_password', compareTo = 'password') =>
  check(field)
    .trim()
    .notEmpty().withMessage('Confirm Password is required')
    .custom((value, { req }) => {
      if (value !== req.body[compareTo]) {
        throw new Error('Passwords do not match');
      }
      return true;
    });

// Old Password Validator
exports.oldPassword = (field = 'old_password') =>
  check(field)
    .trim()
    .notEmpty().withMessage('Old Password is required');

// Email Validator
exports.email = (field = 'email') =>
  check(field)
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Enter a valid email address')
    .normalizeEmail();

// Phone Validator
exports.phone = (field = 'phone') =>
  check(field)
    .trim()
    .notEmpty().withMessage('Phone number is required')
    .isMobilePhone().withMessage('Enter a valid phone number');


// Name Validator
exports.name = (field = 'name') =>
  check(field)
    .trim()
    .notEmpty().withMessage( field +' is required')
    .isLength({ min: 2 }).withMessage( field + ' must be at least 2 characters long')
    .matches(/^[a-zA-Z\s]+$/).withMessage( field + ' must contain only letters and spaces');

// Description Validator
exports.description = (field = 'description') =>
  check(field)
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ min: 3, max: 255 }).withMessage('Description must be between 3 and 255 characters')
    .matches(/^[a-zA-Z0-9\s.,'()\-]+$/)
    .withMessage('Description can only contain letters, numbers, spaces, periods, commas, apostrophes, hyphens, and parentheses');


// Path Validator
exports.filePath = (field = 'path') =>
  check(field)
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\w\-\/\.]+\/?[\w\-]+\.(jpg|jpeg|png|gif|svg)$/i)
    .withMessage(`${field} must be a valid image file path ending in .jpg, .jpeg, .png, .gif, or .svg`);

// folder path validation
exports.folderPath = (field = 'path') =>
  check(field)
    .trim()
    .matches(/^(?!.*\.\w{2,5}$)[\w\-\/]+\/?$/)
    .withMessage(`${field} must be a valid folder path (no file name at the end)`);

// Validates UUID path or body param
exports.uuid = (field = 'id', location = 'params') => {
  const validator = location === 'body' ? body : param;
  return validator(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isUUID()
    .withMessage(`${field} must be a valid UUID`);
};

// User IDs Array Validator
exports.idsArray = (field = 'userIds') =>
  body(field)
    .notEmpty().withMessage(`${field} is required`)
    .isArray({ min: 1 }).withMessage(`${field} must be a non-empty array`)
    .custom((arr) => arr.every(id => typeof id === 'string')).withMessage(`${field} must be an array of string UUIDs`);

// Start Date Validator
exports.startDate = (field = 'startDate') =>
  check(field)
    .notEmpty().withMessage('Start date is required')
    .isISO8601().withMessage('Start date must be a valid date');

// End Date Validator
exports.endDate = (field = 'endDate') =>
  check(field)
    .optional()
    .isISO8601().withMessage('End date must be a valid date');


// Required Boolean Validator
exports.requiredBoolean = (field = 'is_active') =>
  body(field)
    .notEmpty().withMessage(`${field} is required`)
    .custom((value) => {
      if (value === true || value === false) return true;
      if (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase())) return true;
      throw new Error(`${field} must be a boolean (true or false)`);
    })
    .customSanitizer((value) => {
      if (value === true || value === 'true') return true;
      if (value === false || value === 'false') return false;
      return value;
    });


// Boolean Validator
exports.boolean = (field = 'is_active') =>
  body(field)
    .optional({ checkFalsy: true }) // <- makes it optional
    .custom((value) => {
      if (value === true || value === false) return true;
      if (typeof value === 'string' && ['true', 'false'].includes(value.toLowerCase())) return true;
      throw new Error(`${field} must be a boolean (true or false)`);
    })
    .customSanitizer((value) => {
      if (value === true || value === 'true') return true;
      if (value === false || value === 'false') return false;
      return value;
    });


// Required Enum Validator
exports.requiredEnum = (field = 'status', allowedValues = []) =>
  body(field)
    .notEmpty().withMessage(`${field} is required`)
    .isIn(allowedValues).withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);


// Optional Enum Validator
exports.enumVal = (field = 'status', allowedValues = []) =>
  body(field)
    .optional()
    .isIn(allowedValues).withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);


// validation for only alph number max 255 char
exports.alphaNum255 = (field = 'name') =>
  body(field)
    .notEmpty().withMessage(`${field} is required`)
    .isLength({ max: 255 }).withMessage(`${field} must be at most 255 characters`)
    .matches(/^[a-zA-Z0-9\s]+$/).withMessage(`${field} must contain only alphanumeric characters and spaces`);


exports.permissionCode = (field = "code") => 
  check(field)
    .notEmpty().withMessage(`${field} is required`)
    .matches(/^[a-z0-9_]+$/).withMessage(`${field} must contain only lowercase letters, numbers, and underscores`)
    .isLength({ max: 100 }).withMessage(`${field} must be at most 100 characters`);


exports.number = (field="number", range = {min : 0, max : 9999}) =>
  body(field)
    .isFloat({ min : range.min, max : range.max })
    .withMessage(`${field} must be a valid number between ${range.min} and ${range.max}`);

exports.pincode = (field="pincode") =>
  body(field)
    .matches(/^\d{6}$/)
    .withMessage(`${field} must be a valid 6-digit pincode`);


exports.timezone = (field = "time-zone") =>
  body(field)
    .custom((value) => {
      if (!require('moment-timezone').tz.zone(value)) throw new Error();
      return true;
    })
    .withMessage(`${field} must be a valid IANA timezone`);


exports.string = (field = "string") =>
  body(field)
    .isString().withMessage(`${field} must be a string`)
    .isLength({ min: 1, max: 255 }).withMessage(`${field} must be between 1 and 255 characters`);

exports.location = (field = "location") =>
  body(field)
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage(`${field} must be between 1 and 100 characters`)
    // must contain at least one letter, allow letters, numbers, spaces, dot, apostrophe, hyphen
    .matches(/^(?=.*[a-zA-Z])[a-zA-Z0-9\s.()'-]+$/)
    .withMessage(
      `${field} must contain at least one letter and may include numbers, spaces, dot, apostrophe, or hyphen`
    );

exports.domain = (field = 'custom_domain') =>
  body(field)
    .isFQDN({ require_tld: true }) // validates domain like example.com, not IPs or localhost
    .withMessage(`${field} must be a valid domain (e.g., example.com)`);

exports.price = (field = 'price') =>
  body(field)
    .matches(/^\d+(\.\d{1,2})?$/)
    .withMessage(`${field} must be a valid price with up to two decimal places`)
    .bail()
    .isFloat({ gt: 0 })
    .withMessage(`${field} must be a positive number`);

exports.manyUuids = (field = 'ids', location = 'body') => {
  const validator = location === 'body' ? body : param;

  return validator(field)
    .isArray({ min: 1 })
    .withMessage(`${field} must be a non-empty array`)
    .bail()
    .custom((value) => {
      const invalid = value.filter((id) => !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id));
      if (invalid.length) {
        throw new Error(`Invalid UUID(s): ${invalid.join(', ')}`);
      }
      return true;
    });
};



exports.dbHost = (field = 'db_host') =>
  body(field)
    .notEmpty().withMessage('DB Host is required')
    .isString().withMessage('DB Host must be a string')
    .matches(/^(?!localhost$)(?!127\.)[a-zA-Z0-9.-]+$/).withMessage('DB Host must be a valid external hostname or IP and not localhost');

// DB Name: Alphanumeric + underscore, 3-64 chars
exports.dbName = (field = 'db_name') =>
  body(field)
    .notEmpty().withMessage(field + ' is required')
    .isLength({ min: 3, max: 64 }).withMessage(field + ' must be 3 to 64 characters')
    .matches(/^[a-zA-Z][a-zA-Z0-9_]*$/).withMessage(field + ' must start with a letter and contain only alphanumeric characters or underscores');

// DB User: Alphanumeric and safe symbols, 3–64 chars
exports.dbUser = (field = 'db_user') =>
  body(field)
    .notEmpty().withMessage('DB User is required')
    .isLength({ min: 3, max: 64 }).withMessage('DB User must be 3 to 64 characters')
    .matches(/^[a-zA-Z0-9._\-@]+$/).withMessage('DB User contains invalid characters');

exports.dbPassword = (field = 'db_password') =>
  body(field)
    .notEmpty().withMessage('DB Password is required')
    .isLength({ min: 12 }).withMessage('DB Password must be at least 12 characters')
    .matches(/[a-z]/).withMessage('DB Password must contain at least one lowercase letter')
    .matches(/[A-Z]/).withMessage('DB Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('DB Password must contain at least one digit')
    .matches(/[^a-zA-Z0-9]/).withMessage('DB Password must contain at least one special character');



exports.ipAddress = (field = 'ip_address') =>
  body(field)
    .notEmpty().withMessage('IP address is required')
    .isIP().withMessage('IP address must be a valid IPv4 or IPv6 address');



exports.futureDate = (field = 'start_date') =>
  body(field)
    .notEmpty().withMessage(`${field} is required`)
    .isISO8601({ strict: true }).withMessage(`${field} must be a valid ISO date (yyyy-mm-dd)`)
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (inputDate <= today) {
        throw new Error(`${field} must be a future date`);
      }
      return true;
    });

exports.endDateAfterStartDate = (startField = 'start_date', endField = 'end_date') =>
  body(endField)
    .notEmpty().withMessage(`${endField} is required`)
    .isISO8601({ strict: true }).withMessage(`${endField} must be a valid ISO date (yyyy-mm-dd)`)
    .custom((endValue, { req }) => {
      const startValue = req.body[startField];
      if (!startValue) {
        // Skip validation if start_date is not provided — handled by startDate validator
        return true;
      }

      const startDate = new Date(startValue);
      const endDate = new Date(endValue);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);

      if (endDate < startDate) {
        throw new Error(`${endField} must be equal to or after ${startField}`);
      }

      return true;
    });


exports.integer = (field = 'value') =>
  body(field)
    .notEmpty().withMessage(`${field} is required`)
    .matches(/^[0-9]+$/).withMessage(`${field} must be a whole number`)
    .isInt({ min: 1, max: 100000 }).withMessage(`${field} must be less 100000`)
    .toInt();


exports.container = (field = 'docker_container') =>
  check(field)
    .trim()
    .matches(/^[a-zA-Z0-9\-_]+$/)
    .withMessage(`${field} must be a valid hostname (letters, numbers, _ or - only, no port)`);
    


exports.subdomain = (field = 'subdomain') =>
  check(field)
    .trim()
    .matches(/^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?$/)
    .withMessage(`${field} must be a valid subdomain (letters, numbers, hyphens, cannot start/end with hyphen)`);

exports.port = (field = 'port') =>
  check(field)
    .isInt({ min: 1, max: 65535 })
    .withMessage(`${field} must be a valid port number (1–65535)`);
