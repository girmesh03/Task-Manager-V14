// backend/routes/departmentRoutes.js
import express from "express";
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  addDepartmentManager,
  removeDepartmentManager,
  getDepartmentStats,
  getDepartmentMembers
} from "../controllers/departmentController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorizeDepartmentAccess } from "../middlewares/authorization.js";
import {
  validateDepartmentCreation,
  validateDepartmentUpdate,
  validateObjectId,
  validatePaginationQuery,
  handleValidationErrors
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * @route   GET /api/departments
 * @desc    Get all departments
 * @access  Private (SuperAdmin: all, Others: own department only)
 */
router.get(
  "/",
  validatePaginationQuery,
  authorizeDepartmentAccess(["read"]),
  getDepartments
);

/**
 * @route   POST /api/departments
 * @desc    Create new department
 * @access  Private (SuperAdmin only)
 */
router.post(
  "/",
  authorizeDepartmentAccess(["create"]),
  validateDepartmentCreation,
  createDepartment
);

/**
 * @route   GET /api/departments/:id
 * @desc    Get single department
 * @access  Private (SuperAdmin: any, Others: own department only)
 */
router.get(
  "/:id",
  validateObjectId("id"),
  authorizeDepartmentAccess(["read"]),
  getDepartment
);

/**
 * @route   PUT /api/departments/:id
 * @desc    Update department
 * @access  Private (SuperAdmin only)
 */
router.put(
  "/:id",
  validateObjectId("id"),
  authorizeDepartmentAccess(["update"]),
  validateDepartmentUpdate,
  updateDepartment
);

/**
 * @route   DELETE /api/departments/:id
 * @desc    Delete department
 * @access  Private (SuperAdmin only)
 */
router.delete(
  "/:id",
  validateObjectId("id"),
  authorizeDepartmentAccess(["delete"]),
  deleteDepartment
);

/**
 * @route   PUT /api/departments/:id/managers
 * @desc    Add manager to department
 * @access  Private (SuperAdmin only)
 */
router.put(
  "/:id/managers",
  validateObjectId("id"),
  authorizeDepartmentAccess(["update"]),
  addDepartmentManager
);

/**
 * @route   DELETE /api/departments/:id/managers/:managerId
 * @desc    Remove manager from department
 * @access  Private (SuperAdmin only)
 */
router.delete(
  "/:id/managers/:managerId",
  validateObjectId("id"),
  validateObjectId("managerId"),
  authorizeDepartmentAccess(["update"]),
  removeDepartmentManager
);

/**
 * @route   GET /api/departments/:id/stats
 * @desc    Get department statistics
 * @access  Private (SuperAdmin: any, Others: own department only)
 */
router.get(
  "/:id/stats",
  validateObjectId("id"),
  authorizeDepartmentAccess(["read"]),
  getDepartmentStats
);

/**
 * @route   GET /api/departments/:id/members
 * @desc    Get department members
 * @access  Private (SuperAdmin: any, Others: own department only)
 */
router.get(
  "/:id/members",
  validateObjectId("id"),
  validatePaginationQuery,
  authorizeDepartmentAccess(["read"]),
  getDepartmentMembers
);

export default router;
