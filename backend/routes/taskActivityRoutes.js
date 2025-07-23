// backend/routes/taskActivityRoutes.js
import express from "express";
import {
  getTaskActivities,
  getTaskActivity,
  createTaskActivity,
  updateTaskActivity,
  deleteTaskActivity,
  getTaskActivitiesForTask,
  addTaskActivityAttachment,
  removeTaskActivityAttachment,
  getTaskActivityStats
} from "../controllers/taskActivityController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorizeTaskActivityAccess } from "../middlewares/authorization.js";
import {
  validateTaskActivityCreation,
  validateObjectId,
  validatePaginationQuery,
  handleValidationErrors
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * @route   GET /api/task-activities/stats
 * @desc    Get task activity statistics
 * @access  Private (SuperAdmin: company stats, Admin/Manager: department stats, User: personal stats)
 */
router.get("/stats", getTaskActivityStats);

/**
 * @route   GET /api/task-activities/task/:taskId
 * @desc    Get task activities for specific task
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department, User: assigned tasks only)
 */
router.get(
  "/task/:taskId",
  validateObjectId("taskId"),
  validatePaginationQuery,
  authorizeTaskActivityAccess(["read"]),
  getTaskActivitiesForTask
);

/**
 * @route   GET /api/task-activities
 * @desc    Get all task activities
 * @access  Private (SuperAdmin: all company activities, Admin/Manager: own department, User: assigned tasks only)
 */
router.get(
  "/",
  validatePaginationQuery,
  authorizeTaskActivityAccess(["read"]),
  getTaskActivities
);

/**
 * @route   POST /api/task-activities
 * @desc    Create task activity
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department, User: assigned tasks only)
 */
router.post(
  "/",
  authorizeTaskActivityAccess(["create"]),
  validateTaskActivityCreation,
  createTaskActivity
);

/**
 * @route   GET /api/task-activities/:id
 * @desc    Get single task activity
 * @access  Private (SuperAdmin: any activity, Admin/Manager: own department, User: assigned tasks only)
 */
router.get(
  "/:id",
  validateObjectId("id"),
  authorizeTaskActivityAccess(["read"]),
  getTaskActivity
);

/**
 * @route   PUT /api/task-activities/:id
 * @desc    Update task activity
 * @access  Private (SuperAdmin: any activity, Admin/Manager: own department, User: own activities for assigned tasks)
 */
router.put(
  "/:id",
  validateObjectId("id"),
  authorizeTaskActivityAccess(["update"]),
  updateTaskActivity
);

/**
 * @route   PUT /api/task-activities/:id/attachments
 * @desc    Add attachment to task activity
 * @access  Private (Activity owner, Admin/Manager: own department, SuperAdmin: any)
 */
router.put(
  "/:id/attachments",
  validateObjectId("id"),
  authorizeTaskActivityAccess(["update"]),
  addTaskActivityAttachment
);

/**
 * @route   DELETE /api/task-activities/:id/attachments/:attachmentIndex
 * @desc    Remove attachment from task activity
 * @access  Private (Activity owner, Admin/Manager: own department, SuperAdmin: any)
 */
router.delete(
  "/:id/attachments/:attachmentIndex",
  validateObjectId("id"),
  authorizeTaskActivityAccess(["update"]),
  removeTaskActivityAttachment
);

/**
 * @route   DELETE /api/task-activities/:id
 * @desc    Delete task activity
 * @access  Private (SuperAdmin: any activity, Admin/Manager: own department, User: own activities for assigned tasks)
 */
router.delete(
  "/:id",
  validateObjectId("id"),
  authorizeTaskActivityAccess(["delete"]),
  deleteTaskActivity
);

export default router;
