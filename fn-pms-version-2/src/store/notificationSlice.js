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
