// backend/routes/routineTaskRoutes.js
import express from "express";
import {
  getRoutineTasks,
  getRoutineTask,
  createRoutineTask,
  updateRoutineTask,
  updateRoutineTaskProgress,
  addRoutineTaskAttachment,
  removeRoutineTaskAttachment,
  deleteRoutineTask,
  getRoutineTaskStats,
  getMyRoutineTasks,
  getRoutineTasksByDateRange
} from "../controllers/routineTaskController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorizeTaskAccess } from "../middlewares/authorization.js";
import {
  validateRoutineTaskCreation,
  validateObjectId,
  validatePaginationQuery,
  handleValidationErrors
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * @route   GET /api/routine-tasks/my-tasks
 * @desc    Get my routine tasks
 * @access  Private (All roles)
 */
router.get(
  "/my-tasks",
  validatePaginationQuery,
  getMyRoutineTasks
);

/**
 * @route   GET /api/routine-tasks/stats
 * @desc    Get routine task statistics
 * @access  Private (SuperAdmin: company stats, Others: department stats)
 */
router.get("/stats", getRoutineTaskStats);

/**
 * @route   GET /api/routine-tasks/date-range
 * @desc    Get routine tasks by date range
 * @access  Private (SuperAdmin: company wide, Others: own department)
 */
router.get("/date-range", getRoutineTasksByDateRange);

/**
 * @route   GET /api/routine-tasks
 * @desc    Get all routine tasks
 * @access  Private (SuperAdmin: all company tasks, Others: own department only)
 */
router.get(
  "/",
  validatePaginationQuery,
  authorizeTaskAccess(["read"], "RoutineTask"),
  getRoutineTasks
);

/**
 * @route   POST /api/routine-tasks
 * @desc    Create new routine task
 * @access  Private (All roles can create routine tasks in their own department)
 */
router.post(
  "/",
  authorizeTaskAccess(["create"], "RoutineTask"),
  validateRoutineTaskCreation,
  createRoutineTask
);

/**
 * @route   GET /api/routine-tasks/:id
 * @desc    Get single routine task
 * @access  Private (SuperAdmin: any task, Others: own department only)
 */
router.get(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["read"], "RoutineTask"),
  getRoutineTask
);

/**
 * @route   PUT /api/routine-tasks/:id
 * @desc    Update routine task
 * @access  Private (All roles can update routine tasks in their own department)
 */
router.put(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "RoutineTask"),
  updateRoutineTask
);

/**
 * @route   PUT /api/routine-tasks/:id/progress
 * @desc    Update routine task progress
 * @access  Private (All roles can update routine tasks in their own department)
 */
router.put(
  "/:id/progress",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "RoutineTask"),
  updateRoutineTaskProgress
);

/**
 * @route   PUT /api/routine-tasks/:id/attachments
 * @desc    Add attachment to routine task
 * @access  Private (All roles can update routine tasks in their own department)
 */
router.put(
  "/:id/attachments",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "RoutineTask"),
  addRoutineTaskAttachment
);

/**
 * @route   DELETE /api/routine-tasks/:id/attachments/:attachmentIndex
 * @desc    Remove attachment from routine task
 * @access  Private (All roles can update routine tasks in their own department)
 */
router.delete(
  "/:id/attachments/:attachmentIndex",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "RoutineTask"),
  removeRoutineTaskAttachment
);

/**
 * @route   DELETE /api/routine-tasks/:id
 * @desc    Delete routine task
 * @access  Private (All roles can delete routine tasks in their own department)
 */
router.delete(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["delete"], "RoutineTask"),
  deleteRoutineTask
);

export default router;
