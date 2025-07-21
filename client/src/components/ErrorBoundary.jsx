import { Component } from "react";
import { Box, Typography, Button, Alert, Collapse } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

// Error logging utility
const logError = (error, errorInfo, context = {}) => {
  const isDevelopment = import.meta.env.DEV

  if (isDevelopment) {
    console.group("🚨 ErrorBoundary caught an error");
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Component Stack:", errorInfo.componentStack);
    console.error("Context:", context);
    console.groupEnd();
  } else {
    // In production, send to logging service
    // logErrorToService({ error, errorInfo, context });
    console.error("Application error:", error.message);
  }
};

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  // eslint-disable-next-line no-unused-vars
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    logError(error, errorInfo, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const isDevelopment = import.meta.env.DEV
    const { error, errorInfo, showDetails } = this.state;
    const { title = "Something went wrong", fallbackMessage } = this.props;

    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "400px",
          padding: 3,
          gap: 2,
        }}
      >
        <Alert
          severity="error"
          sx={{
            width: "100%",
            maxWidth: 600,
            "& .MuiAlert-message": { width: "100%" },
          }}
        >
          <Typography variant="h6" gutterBottom>
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary" gutterBottom>
            {fallbackMessage ||
              "An unexpected error occurred. Please try refreshing the page."}
          </Typography>

          {isDevelopment && error && (
            <Box sx={{ mt: 2 }}>
              <Button
                size="small"
                onClick={this.toggleDetails}
                startIcon={
                  showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />
                }
                sx={{ mb: 1 }}
              >
                {showDetails ? "Hide" : "Show"} Error Details
              </Button>

              <Collapse in={showDetails}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 1,
                    border: "1px solid",
                    borderColor: "grey.300",
                    // bgcolor: "grey.50",
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom>
                    Error Message:
                  </Typography>
                  <Typography
                    variant="caption"
                    component="pre"
                    sx={{
                      display: "block",
                      mb: 2,
                      fontSize: "0.75rem",
                      fontFamily: "monospace",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                    }}
                  >
                    {error.toString()}
                  </Typography>

                  {errorInfo?.componentStack && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Component Stack:
                      </Typography>
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          display: "block",
                          fontSize: "0.75rem",
                          fontFamily: "monospace",
                          whiteSpace: "pre-wrap",
                          wordBreak: "break-word",
                          maxHeight: "200px",
                          overflow: "auto",
                        }}
                      >
                        {errorInfo.componentStack}
                      </Typography>
                    </>
                  )}
                </Box>
              </Collapse>
            </Box>
          )}
        </Alert>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleRetry}
          >
            Try Again
          </Button>

          <Button variant="outlined" onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </Box>
      </Box>
    );
  }
}

export default ErrorBoundary;
