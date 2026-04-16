// Author: Gururaj
// Created: 18th Mar 2026
// Description: Issue priority/status constant maps used in list and detail views.
// Version: 1.0.0
// Modified:

export const ISSUE_STATUS = {
  OPEN: "open",
  IN_PROGRESS: "in_progress",
  RESOLVED: "resolved",
  CLOSED: "closed",
  REJECT: "reject",
};

export const ISSUE_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical",
};

export const PRIORITY_COLORS = {
  low: "green",
  medium: "blue",
  high: "orange",
  critical: "red",
};

export const STATUS_COLORS = {
  open: "gray",
  in_progress: "blue",
  resolved: "green",
  closed: "purple",
  reject: "red",
};
