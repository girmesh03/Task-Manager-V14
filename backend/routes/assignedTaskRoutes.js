// backend/routes/assignedTaskRoutes.js
import express from "express";
import {
  getAssignedTasks,
  getAssignedTask,
  createAssignedTask,
  updateAssignedTask,
  completeTask,
  uncompleteTask,
  deleteAssignedTask,
  getAssignedTaskStats,
  getMyAssignedTasks
} from "../controllers/assignedTaskController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorizeTaskAccess } from "../middlewares/authorization.js";
import {
  validateAssignedTaskCreation,
  validateTaskUpdate,
  validateObjectId,
  validatePaginationQuery,
  handleValidationErrors
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * @route   GET /api/assigned-tasks/my-tasks
 * @desc    Get my assigned tasks
 * @access  Private (User: assigned tasks)
 */
router.get(
  "/my-tasks",
  validatePaginationQuery,
  getMyAssignedTasks
);

/**
 * @route   GET /api/assigned-tasks/stats
 * @desc    Get assigned task statistics
 * @access  Private (SuperAdmin: company stats, Admin/Manager: department stats, User: personal stats)
 */
router.get("/stats", getAssignedTaskStats);

/**
 * @route   GET /api/assigned-tasks
 * @desc    Get all assigned tasks
 * @access  Private (SuperAdmin: all company tasks, Admin/Manager: own department, User: assigned to self)
 */
router.get(
  "/",
  validatePaginationQuery,
  authorizeTaskAccess(["read"], "AssignedTask"),
  getAssignedTasks
);

/**
 * @route   POST /api/assigned-tasks
 * @desc    Create new assigned task
 * @access  Private (SuperAdmin: any department, Admin/Manager: own department only)
 */
router.post(
  "/",
  authorizeTaskAccess(["create"], "AssignedTask"),
  validateAssignedTaskCreation,
  createAssignedTask
);

/**
 * @route   GET /api/assigned-tasks/:id
 * @desc    Get single assigned task
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department, User: assigned to self)
 */
router.get(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["read"], "AssignedTask"),
  getAssignedTask
);

/**
 * @route   PUT /api/assigned-tasks/:id
 * @desc    Update assigned task
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department only)
 */
router.put(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "AssignedTask"),
  validateTaskUpdate,
  updateAssignedTask
);

/**
 * @route   PUT /api/assigned-tasks/:id/complete
 * @desc    Mark task as completed by user
 * @access  Private (User: assigned tasks only, Admin/Manager: own department, SuperAdmin: any)
 */
router.put(
  "/:id/complete",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "AssignedTask"),
  completeTask
);

/**
 * @route   PUT /api/assigned-tasks/:id/uncomplete
 * @desc    Unmark task completion
 * @access  Private (User: assigned tasks only, Admin/Manager: own department, SuperAdmin: any)
 */
router.put(
  "/:id/uncomplete",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "AssignedTask"),
  uncompleteTask
);

/**
 * @route   DELETE /api/assigned-tasks/:id
 * @desc    Delete assigned task
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department only)
 */
router.delete(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["delete"], "AssignedTask"),
  deleteAssignedTask
);

export default router;
