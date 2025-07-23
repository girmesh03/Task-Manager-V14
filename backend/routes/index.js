// backend/routes/index.js
import express from "express";

import authRoutes from "./authRoutes.js";
import companyRoutes from "./companyRoutes.js";
import departmentRoutes from "./departmentRoutes.js";
import userRoutes from "./userRoutes.js";
import assignedTaskRoutes from "./assignedTaskRoutes.js";
import projectTaskRoutes from "./projectTaskRoutes.js";
import routineTaskRoutes from "./routineTaskRoutes.js";
import taskActivityRoutes from "./taskActivityRoutes.js";
import notificationRoutes from "./notificationRoutes.js";

const router = express.Router();

// Authentication routes
router.use("/auth", authRoutes);

// Company management routes
router.use("/companies", companyRoutes);

// Department management routes
router.use("/departments", departmentRoutes);

// User management routes
router.use("/users", userRoutes);

// Task management routes
router.use("/assigned-tasks", assignedTaskRoutes);
router.use("/project-tasks", projectTaskRoutes);
router.use("/routine-tasks", routineTaskRoutes);

// Task activity routes
router.use("/task-activities", taskActivityRoutes);

// Notification routes
router.use("/notifications", notificationRoutes);

export default router;
