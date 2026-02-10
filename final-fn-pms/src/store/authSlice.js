// Author: Gururaj
// Created: 19th May 2025
// Description: This is redux storage for user info and auth process to get user globally.
// Version: 1.0.0
// Modified: 
// metadata: Object { id: "52d6288a-3ecb-4b9c-ab53-5596262725a6", is_active: true, last_login: "2026-02-09T13:25:13.370Z", … }




// src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    isLoggedIn: false,
    user: {
      id: null,
      avatar_url: null,
      username: null,
      fullName: null,
      firstName: null,
      lastName: null,
      email: null,
      emailVerified: null,
      enabled: null,
      gender: null,
      last_login: null,
      memberships: null,
      
    },
    accessVersion: null,
  },
  reducers: {
    setUser: (state, action) => {
      const {
        id,
        metadata,
        username,
        firstName,
        lastName,
        email,
        emailVerified,
        enabled,
        access_version,
      } = action.payload;


      state.user = {
        id,
        avatar_url: metadata.avatar_url,
        username,
        fullName: firstName+" "+lastName,
        firstName,
        lastName,
        email,
        emailVerified,
        enabled,
        gender: metadata.gender,
        last_login: metadata.last_login,
        memberships : metadata.memberships,
      };
      state.accessVersion = access_version || "1_1",
      state.isLoggedIn = true;
    },
    clearUser: (state) => {
      state.user = {
        id: null,
        avatar_url: null,
        username: null,
        fullName: null,
        firstName: null,
        lastName: null,
        email: null,
        emailVerified: null,
        enabled: null,
        gender: null,
        last_login: null,
        memberships: null,
        
      },
      state.accessVersion = null,
      state.isLoggedIn = false;
    },
  },
});

export const { setUser, clearUser } = authSlice.actions;
export default authSlice.reducer;

