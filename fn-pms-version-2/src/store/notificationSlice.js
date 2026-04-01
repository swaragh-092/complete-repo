// Author: Gururaj
// Created: 19th Jun 2025
// Description: Redux slice for notification state that tracks unread notification count.
// Version: 1.0.0
// Modified:

// store/notificationSlice.js
import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: "notification",
  initialState: {
    count: 0,
  },
  reducers: {
    setNotificationCount(state, action) {
      state.count = action.payload;
    },
    decrementNotificationCount(state) {
      state.count = Math.max(0, state.count - 1);
    }

  },
});

export const { setNotificationCount, decrementNotificationCount } = notificationSlice.actions;
export default notificationSlice.reducer;
