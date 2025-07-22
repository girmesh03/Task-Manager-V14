import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const SERVER_URL = import.meta.env.VITE_BACKEND_SERVER_URL;

export const apiSlice = createApi({
  reducerPath: "appApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${SERVER_URL}/api`,
    credentials: "include",
  }),
  tagTypes: [],
  endpoints: () => ({}),
});
