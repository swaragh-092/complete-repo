// Author: Gururaj
// Created: 19th Jun 2025
// Description: Cookie utility helpers to read and write browser cookies used by the auth flow.
// Version: 1.0.0
// Modified:

/**
 * Cookie Helper Functions
 * Provides utilities for setting and getting cookies with proper security settings
 */

/**
 * Set a cookie with proper security flags
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} maxAge - Max age in seconds (default: 7 days)
 * @param {object} options - Additional cookie options
 */
export function setCookie(name, value, maxAge = 60480 * 60, options = {}) {
  const defaults = {
    path: "/",
    sameSite: "Lax",
    secure: window.location.protocol === "https:",
    domain: window.location.hostname.endsWith(".gururajhr.in") ? ".gururajhr.in" : undefined,
  };

  const cookieOptions = { ...defaults, ...options };

  let cookieString = `${name}=${encodeURIComponent(value)}`;
  cookieString += `; max-age=${maxAge}`;
  cookieString += `; path=${cookieOptions.path}`;

  if (cookieOptions.secure) {
    cookieString += "; secure";
  }

  if (cookieOptions.sameSite) {
    cookieString += `; samesite=${cookieOptions.sameSite}`;
  }

  if (cookieOptions.domain) {
    cookieString += `; domain=${cookieOptions.domain}`;
  }

  document.cookie = cookieString;

  console.log("🍪 Cookie set:", { name, domain: cookieOptions.domain, secure: cookieOptions.secure });
}

/**
 * Get a cookie value by name
 * @param {string} name - Cookie name
 * @returns {string|null} Cookie value or null if not found
 */
export function getCookie(name) {
  const nameEQ = name + "=";
  const parts = document.cookie.split(";");

  for (let part of parts) {
    const trimmed = part.trim();
    if (trimmed.indexOf(nameEQ) === 0) {
      return decodeURIComponent(trimmed.substring(nameEQ.length));
    }
  }

  return null;
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 * @param {object} options - Cookie options (path, domain)
 */
export function deleteCookie(name, options = {}) {
  setCookie(name, "", -1, options);
}
