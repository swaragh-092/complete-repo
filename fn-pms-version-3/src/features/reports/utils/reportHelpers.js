// Author: Gururaj
// Created: 18th Mar 2026
// Description: Report utility helpers including date range calculators and chart data transformation functions.
// Version: 1.0.0
// Modified:

/**
 * Format minutes into a human readable string.
 * e.g. 90 → "1h 30m", 45 → "45m", 0 → "0m"
 */
export const fmtMinutes = (minutes) => {
  const m = Math.round(minutes || 0);
  if (m <= 0) return "0m";
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h === 0) return `${rem}m`;
  if (rem === 0) return `${h}h`;
  return `${h}h ${rem}m`;
};

/**
 * Return the ISO date string (YYYY-MM-DD) for `daysAgo` days before today.
 */
export const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

/** Today as YYYY-MM-DD */
export const today = () => new Date().toISOString().slice(0, 10);
