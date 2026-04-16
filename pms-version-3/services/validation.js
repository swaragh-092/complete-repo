// Author: Gururaj
// Created: 16th May 2025
// Description: Validation service for all inputs 
// Version: 1.0.0
// Modified: gururaj at 27th May 2025, added confirm password, old password validation
// Modified: gururaj at 29th May 2025, added added dynamic names and new validation fileds discription and path


const { check, body, param } = require('express-validator');

// Password Validator
exports.password = (field = 'password') =>
  check(field)
    .trim()
    .notEmpty().withMessage(field +' is required')
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

// Name Validator
exports.name = (field = 'name') =>
  check(field)
    .trim()
    .notEmpty().withMessage(field + ' is required')
    .isLength({ min: 2 }).withMessage(field + ' must be at least 2 characters long')
    .matches(/^[a-zA-Z\s]+$/).withMessage(field + ' must contain only letters and spaces');

// Description Validator
exports.description = (field = 'description') =>
  check(field)
    .trim()
    .isLength({ min: 3, max: 255 }).withMessage(field + ' must be between 3 and 255 characters')
    .matches(/^[a-zA-Z0-9\s,.'()\[\]{}-]*$/)
    .withMessage(field+' can only contain letters, numbers, spaces, commas, periods, apostrophes, brackets, and hyphens');

// Path Validator
exports.path = (field = 'path') =>
  check(field)
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[\w\-\/\.]+\/?[\w\-]+\.(jpg|jpeg|png|gif|svg)$/i)
    .withMessage(`${field} must be a valid image file path ending in .jpg, .jpeg, .png, .gif, or .svg`);

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
exports.date = (field = 'date') =>
  check(field)
    .notEmpty().withMessage(field + ' is required')
    .isISO8601().withMessage(field + ' must be a valid date');


exports.permissionCode = (field = "code") => 
  check(field)
    .notEmpty().withMessage(`${field} is required`)
    .matches(/^[a-z0-9_]+$/).withMessage(`${field} must contain only lowercase letters, numbers, and underscores`)
    .isLength({ max: 100 }).withMessage(`${field} must be at most 100 characters`);



exports.dateFuture = (field = "date") =>
  check(field)
    .notEmpty().withMessage(`${field} is required`)
    .isISO8601().withMessage(`${field} must be a valid date`)
    .custom((value) => {
      const inputDate = new Date(value);
      const now = new Date();
      if (inputDate <= now) {
        throw new Error(`${field} must be a future date`);
      }
      return true;
    });

exports.dateGreaterThan = (field = "end_date", compareField = "start_date") =>
  check(field)
    .notEmpty().withMessage(`${field} is required`)
    .isISO8601().withMessage(`${field} must be a valid date`)
    .custom((value, { req }) => {
      const compareValue = req.body[compareField];
      if (!compareValue) {
        return true;
      }

      const date = new Date(value);
      const compareDate = new Date(compareValue);

      if (date <= compareDate) {
        throw new Error(`${field} must be greater than ${compareField}`);
      }

      return true;
    });

// Required Enum Validator
exports.enumValue = (field = 'status', allowedValues = [], location = 'body') => {
  const validator = location === 'body' ? body : param;
  return validator(field)
    .notEmpty().withMessage(`${field} is required`)
    .isIn(allowedValues).withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);
}

exports.duration = (field = 'duration') =>
  check(field)
    .trim()
    .matches(/^([0-9]|[0-9][0-9]|1[0-9]|2[0-3]):([0-5][0-9])$/)
    .withMessage('Duration must be in HH:MM format (00:00 to 23:59)');


exports.pastOrCurrentDate = (field = 'date') =>
  check(field)
    .notEmpty().withMessage(`${field} is required`)
    .isISO8601().withMessage(`${field} must be a valid date`)
    .custom((value) => {
      const inputDate = new Date(value);
      const today = new Date();

      // Normalize time (compare only date part)
      inputDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);

      if (inputDate > today) {
        throw new Error(`${field} cannot be a future date`);
      }
      return true;
    });



// Validates UUID path or body param
exports.paramsEnum = (field = 'status', location = 'params', allowedValues = []) => {
  const validator = location === 'body' ? body : param;
  return validator(field)
    .notEmpty()
    .withMessage(`${field} is required`)
    .isIn(allowedValues).withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);
};