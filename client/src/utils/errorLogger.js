/**
 * Centralized error logging utility
 * Handles both development and production error logging
 */

const isDevelopment = import.meta.env.DEV;

/**
 * Log route errors with context
 */
export const logRouteError = (error, pathname) => {
  const errorContext = {
    type: "route_error",
    pathname,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    status: error?.status,
    statusText: error?.statusText,
  };

  if (isDevelopment) {
    console.group("🔴 Route Error");
    console.error("Error:", error);
    console.error("Context:", errorContext);
    console.groupEnd();
  } else {
    // In production, send to logging service
    sendToLoggingService("route_error", error, errorContext);
  }
};

/**
 * Log component errors
 */
export const logComponentError = (error, errorInfo, componentName) => {
  const errorContext = {
    type: "component_error",
    componentName,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    url: window.location.href,
  };

  if (isDevelopment) {
    console.group(`🔴 Component Error: ${componentName}`);
    console.error("Error:", error);
    console.error("Error Info:", errorInfo);
    console.error("Context:", errorContext);
    console.groupEnd();
  } else {
    sendToLoggingService("component_error", error, errorContext);
  }
};

/**
 * Log API errors
 */
export const logApiError = (error, endpoint, method = "GET") => {
  const errorContext = {
    type: "api_error",
    endpoint,
    method,
    timestamp: new Date().toISOString(),
    status: error?.response?.status,
    statusText: error?.response?.statusText,
  };

  if (isDevelopment) {
    console.group(`🔴 API Error: ${method} ${endpoint}`);
    console.error("Error:", error);
    console.error("Context:", errorContext);
    console.groupEnd();
  } else {
    sendToLoggingService("api_error", error, errorContext);
  }
};

/**
 * Send errors to logging service in production
 */
const sendToLoggingService = (type, error, context) => {
  try {
    // Example implementation - replace with your logging service
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     type,
    //     message: error.message,
    //     stack: error.stack,
    //     context,
    //   }),
    // });

    console.error(`[${type}] ${error.message}`, context);
  } catch (loggingError) {
    console.error("Failed to log error:", loggingError);
  }
};
