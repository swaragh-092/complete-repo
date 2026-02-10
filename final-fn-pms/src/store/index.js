// Author: Gururaj
// Created: 19th May 2025
// Description: Index page for all redux storage.
// Version: 1.0.0
// Modified: 

// src/store/index.js


import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';  // your auth slice
import notificationReducer from "./notificationSlice"
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // defaults to localStorage for web

const persistConfig = {
  key: 'root',
  storage,
  whitelist: ['auth'], // only persist the auth slice
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);

const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    notification: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these redux-persist action types for serializable checks
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);
export default store;
