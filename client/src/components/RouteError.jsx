import {
  useRouteError,
  useNavigate,
  Link as RouterLink,
} from "react-router-dom";
import { useMemo } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Chip from "@mui/material/Chip";

import HomeIcon from "@mui/icons-material/Home";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import RefreshIcon from "@mui/icons-material/Refresh";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import InfoIcon from "@mui/icons-material/Info";

import { logRouteError } from "../utils/errorLogger";

// Error type configurations
const ERROR_CONFIGS = {
  404: {
    title: "Page Not Found",
    message: "The page you're looking for doesn't exist or has been moved.",
    severity: "warning",
    icon: <WarningIcon />,
    actions: { showHome: true, showBack: true },
  },
  401: {
    title: "Unauthorized Access",
    message: "You need to log in to access this page.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: {
      showHome: true,
      customAction: { label: "Go to Login", path: "/login" },
    },
  },
  403: {
    title: "Access Forbidden",
    message: "You don't have permission to access this resource.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: { showHome: true, showBack: true },
  },
  500: {
    title: "Server Error",
    message: "Something went wrong on our end. Please try again later.",
    severity: "error",
    icon: <ErrorIcon />,
    actions: { showRetry: true, showHome: true, showBack: true },
  },
};

const CHUNK_ERROR_CONFIG = {
  title: "Loading Error",
  message:
    "Failed to load application resources. This might be due to a network issue or an app update.",
  severity: "warning",
  icon: <WarningIcon />,
  actions: {
    showRetry: true,
    showHome: true,
    customAction: {
      label: "Reload Application",
      action: () => window.location.reload(),
    },
  },
};

const DEFAULT_ERROR_CONFIG = {
  title: "Something Went Wrong",
  message: "An unexpected error occurred while loading this page.",
  severity: "error",
  icon: <ErrorIcon />,
  actions: { showRetry: true, showHome: true, showBack: true },
};

const RouteError = () => {
  const error = useRouteError();
  const navigate = useNavigate();

  // Log error once when component mounts
  useMemo(() => {
    logRouteError(error, window.location.pathname);
  }, [error]);

  // Determine error configuration
  const errorConfig = useMemo(() => {
    if (error?.status && ERROR_CONFIGS[error.status]) {
      return ERROR_CONFIGS[error.status];
    }

    if (
      error?.message?.includes("Loading chunk") ||
      error?.message?.includes("ChunkLoadError")
    ) {
      return CHUNK_ERROR_CONFIG;
    }

    return {
      ...DEFAULT_ERROR_CONFIG,
      message: error?.message || DEFAULT_ERROR_CONFIG.message,
    };
  }, [error]);

  const isDevelopment = import.meta.env.DEV;

  const handleRetry = () => window.location.reload();
  const handleBack = () => navigate(-1);
  const handleHome = () => navigate("/");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        padding: 3,
        gap: 3,
      }}
    >
      <Paper
        elevation={1}
        sx={{
          p: 4,
          maxWidth: 600,
          width: "100%",
          textAlign: "center",
        }}
      >
        {error?.status && (
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`Error ${error.status}`}
              color={errorConfig.severity}
              variant="outlined"
              icon={errorConfig.icon}
            />
          </Box>
        )}

        <Alert
          severity={errorConfig.severity}
          icon={errorConfig.icon}
          sx={{
            mb: 3,
            textAlign: "left",
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography variant="h6" gutterBottom>
            {errorConfig.title}
          </Typography>
          <Typography variant="body2">{errorConfig.message}</Typography>
        </Alert>

        {isDevelopment && error && (
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ mb: 2 }}>
              <Chip label="Development Info" size="small" />
            </Divider>
            <Alert severity="info" icon={<InfoIcon />}>
              <Typography variant="subtitle2" gutterBottom>
                Error Details:
              </Typography>
              <Typography
                variant="caption"
                component="pre"
                sx={{
                  display: "block",
                  fontFamily: "monospace",
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                  p: 1,
                  borderRadius: 1,
                  mt: 1,
                  // bgcolor: "grey.50",
                }}
              >
                {error.stack || error.toString()}
              </Typography>
            </Alert>
          </Box>
        )}

        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {errorConfig.actions.showRetry && (
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={handleRetry}
              size="small"
            >
              Try Again
            </Button>
          )}

          {errorConfig.actions.customAction && (
            <Button
              variant="contained"
              onClick={
                errorConfig.actions.customAction.action ||
                (() => navigate(errorConfig.actions.customAction.path))
              }
              size="small"
            >
              {errorConfig.actions.customAction.label}
            </Button>
          )}

          {errorConfig.actions.showBack && (
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={handleBack}
              size="small"
            >
              Go Back
            </Button>
          )}

          {errorConfig.actions.showHome && (
            <Button
              variant="outlined"
              startIcon={<HomeIcon />}
              component={RouterLink}
              to="/"
              onClick={handleHome}
              size="small"
            >
              Home
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
};

export default RouteError;
