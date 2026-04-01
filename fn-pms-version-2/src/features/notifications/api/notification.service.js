// Author: Copilot
// Created: 18th Mar 2026
// Description: Services for Notifications
// Version: 1.0.0

import api from "../../../api/axios";

// Helper to check if data is wrapped or flat
const unwrap = (response) => response.data;

export const getNotifications = (page = 1) => api.get(`/notification`, { params: { page } }).then(unwrap);

export const getUnreadCount = () => api.get(`/notification/unread-count`).then(unwrap);

export const markAsRead = (id) => api.put(`/notification/${id}`).then(unwrap);

export const markAllAsRead = () => api.put(`/notification/read-all`).then(unwrap);
