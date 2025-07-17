import dotenv from "dotenv";
dotenv.config();

import http from "http";
import mongoose from "mongoose";
import app from "./app.js";

const PORT = parseInt(process.env.PORT || "5000");

const server = http.createServer(app);

const startServer = async () => {
  try {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`📅 Server Time (UTC): ${new Date().toISOString()}`);
    });
  } catch (err) {
    console.error("🚨 Server startup failed:", err.message);
    process.exit(1);
  }
};

const shutdown = async () => {
  console.log("🛑 Shutting down server...");

  try {
    // Close HTTP server
    await new Promise((resolve) => server.close(resolve));
    console.log("HTTP server closed");

    // Close MongoDB connection
    await mongoose.disconnect();
    console.log("MongoDB connection closed");

    process.exit(0);
  } catch (err) {
    console.error("Error during shutdown:", err.message);
    process.exit(1);
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("uncaughtException", (err) => {
  console.error("🛑 Uncaught Exception:", err.message);
  shutdown();
});
process.on("unhandledRejection", (reason) => {
  console.error("🛑 Unhandled Rejection:", reason);
});

startServer();
