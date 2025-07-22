import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store, persistor } from "./redux/app/store";

import CssBaseline from "@mui/material/CssBaseline";

import AppTheme from "./theme/AppTheme";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate
        loading={null}
        persistor={persistor}
        onBeforeLift={() => {
          // Optional: Run logic before state rehydration
        }}
      >
        <AppTheme>
          <CssBaseline enableColorScheme />
          <App />
        </AppTheme>
      </PersistGate>
    </Provider>
  </StrictMode>
);
