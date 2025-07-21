import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import CssBaseline from "@mui/material/CssBaseline";
import AppTheme from "./theme/AppTheme";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AppTheme>
      <CssBaseline enableColorScheme />
      <App />
    </AppTheme>
  </StrictMode>
);
