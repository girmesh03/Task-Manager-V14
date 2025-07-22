import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  currentUser: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      state.currentUser = action.payload.currentUser;
      state.isAuthenticated = true;
    },
    setLogout: (state) => {
      state.currentUser = null;
      state.isAuthenticated = false;
    },
  },
});

export const selectCurrentUser = (state) => state.auth.currentUser;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;

export const { setCredentials, setLogout } = authSlice.actions;
export default authSlice.reducer;
