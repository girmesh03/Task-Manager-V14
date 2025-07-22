import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { persistStore, persistReducer, createTransform } from "redux-persist";
import authReducer from "../features/auth/authSlice";
import { apiSlice } from "../features/api/apiSlice";

const authTransform = createTransform(
  // inbound: save only these fields
  (inboundState) => ({
    isAuthenticated: inboundState.isAuthenticated,
  }),
  // outbound: return state as is
  (outboundState) => outboundState,
  { whitelist: ["auth"] }
);

const authPersistConfig = {
  key: "auth",
  storage,
  transforms: [authTransform],
  whitelist: ["isAuthenticated"], // one of auth, currentUser, isAuthenticated
};

const persistedAuthReducer = persistReducer(authPersistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: persistedAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }).concat(apiSlice.middleware),
  devTools: import.meta.env.DEV,
});

export const persistor = persistStore(store);
