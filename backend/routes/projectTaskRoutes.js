// backend/routes/projectTaskRoutes.js
import express from "express";
import {
  getProjectTasks,
  getProjectTask,
  createProjectTask,
  updateProjectTask,
  deleteProjectTask,
  getProjectTaskStats,
  getProjectTasksByClient,
  updateProjectTaskStatus
} from "../controllers/projectTaskController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorizeTaskAccess } from "../middlewares/authorization.js";
import {
  validateProjectTaskCreation,
  validateTaskUpdate,
  validateObjectId,
  validatePaginationQuery,
  handleValidationErrors
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * @route   GET /api/project-tasks/stats
 * @desc    Get project task statistics
 * @access  Private (SuperAdmin: company stats, Admin/Manager: department stats, User: none)
 */
router.get("/stats", getProjectTaskStats);

/**
 * @route   GET /api/project-tasks/by-client
 * @desc    Get project tasks by client
 * @access  Private (SuperAdmin: company wide, Admin/Manager: own department)
 */
router.get("/by-client", getProjectTasksByClient);

/**
 * @route   GET /api/project-tasks
 * @desc    Get all project tasks
 * @access  Private (SuperAdmin: all company tasks, Admin/Manager: own department, User: none)
 */
router.get(
  "/",
  validatePaginationQuery,
  authorizeTaskAccess(["read"], "ProjectTask"),
  getProjectTasks
);

/**
 * @route   POST /api/project-tasks
 * @desc    Create new project task
 * @access  Private (SuperAdmin: any department, Admin/Manager: own department only)
 */
router.post(
  "/",
  authorizeTaskAccess(["create"], "ProjectTask"),
  validateProjectTaskCreation,
  createProjectTask
);

/**
 * @route   GET /api/project-tasks/:id
 * @desc    Get single project task
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department, User: none)
 */
router.get(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["read"], "ProjectTask"),
  getProjectTask
);

/**
 * @route   PUT /api/project-tasks/:id
 * @desc    Update project task
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department only)
 */
router.put(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "ProjectTask"),
  validateTaskUpdate,
  updateProjectTask
);

/**
 * @route   PUT /api/project-tasks/:id/status
 * @desc    Update project task status
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department)
 */
router.put(
  "/:id/status",
  validateObjectId("id"),
  authorizeTaskAccess(["update"], "ProjectTask"),
  updateProjectTaskStatus
);

/**
 * @route   DELETE /api/project-tasks/:id
 * @desc    Delete project task
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department only)
 */
router.delete(
  "/:id",
  validateObjectId("id"),
  authorizeTaskAccess(["delete"], "ProjectTask"),
  deleteProjectTask
);

export default router;
