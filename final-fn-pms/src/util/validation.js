// Author: Gururaj
// Created: 23rd May 2025
// Description: All input fields validations will be done here.
// Version: 1.0.0
// Modified: 27th May 2025 by gururaj, added confirm password validation
// file : src/util/auth.js

export default function  Validator(type, value, oldPasswordValue = null) {
    if (type === 'email') {
        return emailValidation(value);
    } 
    if (type === 'password') {
        return passwordValidation(value);
    }
    if (type === 'text') {
        return textFieldValidation(value);
    }
    if (type === 'required') {
        return requiredValidation (value);
    }
    if (type === 'confirmPassword') {
        return confirmPasswordValidation(value, oldPasswordValue);
    }
    if (type === 'optional-text') {
        return optionalText(value);
    }
    if (type === 'lettersAndUnderscoreValidation') {
        return lettersAndUnderscoreValidation(value);
    }
    if (type === 'futureDate') {
        return dateValidationForFuture(value);
    }
    if (type === "stand_up_duration") {
      return durationNotGT7(value);
    }
    return 'no field';
}


function emailValidation (value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
        return "Please enter a valid email address";
    }
    return null;
}

function lettersAndUnderscoreValidation(value) {
  const regex = /^[A-Za-z_]+$/;
  if (!regex.test(value)) {
    return "Only letters and underscores are allowed";
  }
  return null;
}

function dateValidationForFuture(value) {
  if (!value) {
    return "Date is required";
  }

  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return "Please enter a valid date";
  }

  const today = new Date();
  // Reset time part for accurate comparison
  today.setHours(0, 0, 0, 0);

  if (date <= today) {
    return "Please select a future date";
  }

  return null;
}


function passwordValidation(value) {
    
    if (value.length < 8 ) {
        return "Password must be at least 8 characters long";
    }
    if (!/[A-Z]/.test(value) ) {
        return "Password must include at least one uppercase letter";
    }
    if (!/[a-z]/.test(value)) {
        return "Password must include at least one lowercase letter";
    }
    if (!/[0-9]/.test(value)) {
        return "Password must include at least one number";
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
        return "Password must include at least one special character";
    }

    return null;
}

function textFieldValidation(value) {
  if (!value || value.trim() === "") {
    return `This field is required`;
  }

  if (value.trim().length < 2) {
    return `This field must be at least 2 characters long`;
  }

  if (!/^[a-zA-Z\s]+$/.test(value)) {
    return `This field must contain only letters and spaces`;
  }
  return null;
}


function requiredValidation (value) {
    if (!value || value.trim() === "") {
    return `This field is required`;
  }
  return null;
}

function confirmPasswordValidation(value, oldPasswordValue) { 
    if (value !== oldPasswordValue) {
        return "Passwords do not match";
    }
    return null;
}

function optionalText (value) {
    if (/[^a-zA-Z0-9\s().\-_]/.test(value)) {
        return `Invalid characters used.`;
    }
    return null;
}


function durationNotGT7(value) {
  if (!value) return "Duration is required";

  // Check HH:MM pattern
  const regex = /^([0-9]{1,2}):([0-5][0-9])$/;
  const match = value.match(regex);

  if (!match) {
    return "Invalid duration format (use HH:MM)";
  }

  let hours = parseInt(match[1], 10);
  let minutes = parseInt(match[2], 10);

  // Check hour limit
  if (hours > 7) {
    return "Duration cannot exceed 7 hours";
  }

  // If exactly 7 hours, minutes must be 0
  if (hours === 7 && minutes > 0) {
    return "Duration cannot be more than 07:00";
  }

  return; // Valid
}


