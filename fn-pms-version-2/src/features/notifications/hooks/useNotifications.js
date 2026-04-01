// Author: Copilot
// Created: 18th Mar 2026
// Description: React Query hooks for Notifications
// Version: 1.0.0

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as notificationService from "../api/notification.service";
import { useDispatch } from "react-redux";
import { setNotificationCount } from "../../../store/notificationSlice";

export const notificationKeys = {
  all: ["notifications"],
  list: (page) => [...notificationKeys.all, "list", page],
  count: ["notifications", "count"],
};

export const useNotifications = (page = 1) => {
  return useQuery({
    queryKey: notificationKeys.list(page),
    queryFn: () => notificationService.getNotifications(page),
  });
};

export const useUnreadCount = () => {
  const dispatch = useDispatch();
  return useQuery({
    queryKey: notificationKeys.count,
    queryFn: async () => {
      const data = await notificationService.getUnreadCount();
      // Sync Redux
      if (data && typeof data.unread_count === "number") {
        dispatch(setNotificationCount(data.unread_count));
      }
      return data;
    },
    // Poll every 30 seconds
    refetchInterval: 30000,
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => notificationService.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(1) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.count });
      // Optimistically decrement could be complex if we don't know if it was unread
      // Rely on refetch or specific return from API
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: () => notificationService.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      dispatch(setNotificationCount(0));
    },
  });
};
