// backend/routes/userRoutes.js
import express from "express";
import {
  getUsers,
  getUser,
  getMyProfile,
  createUser,
  updateUser,
  updatePassword,
  deleteUser,
  deactivateUser,
  activateUser,
  getUserStats,
  updateProfilePicture
} from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorizeUserAccess } from "../middlewares/authorization.js";
import {
  validateUserCreation,
  validateUserUpdate,
  validateObjectId,
  validatePaginationQuery,
  handleValidationErrors
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private (All roles)
 */
router.get("/profile", getMyProfile);

/**
 * @route   GET /api/users/stats
 * @desc    Get user statistics
 * @access  Private (SuperAdmin: company stats, Others: own stats)
 */
router.get("/stats", getUserStats);

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (SuperAdmin: all company users, Admin/Manager: own department, User: self only)
 */
router.get(
  "/",
  validatePaginationQuery,
  authorizeUserAccess(["read"]),
  getUsers
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (SuperAdmin only)
 */
router.post(
  "/",
  authorizeUserAccess(["create"]),
  validateUserCreation,
  createUser
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user
 * @access  Private (SuperAdmin: any company user, Admin/Manager: own department, User: self only)
 */
router.get(
  "/:id",
  validateObjectId("id"),
  authorizeUserAccess(["read"]),
  getUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (SuperAdmin: any user, Others: self only)
 */
router.put(
  "/:id",
  validateObjectId("id"),
  authorizeUserAccess(["update"]),
  validateUserUpdate,
  updateUser
);

/**
 * @route   PUT /api/users/:id/password
 * @desc    Update user password
 * @access  Private (User: self only, SuperAdmin: any user)
 */
router.put(
  "/:id/password",
  validateObjectId("id"),
  authorizeUserAccess(["update"]),
  updatePassword
);

/**
 * @route   PUT /api/users/:id/profile-picture
 * @desc    Upload profile picture
 * @access  Private (User: self only, SuperAdmin: any user)
 */
router.put(
  "/:id/profile-picture",
  validateObjectId("id"),
  authorizeUserAccess(["update"]),
  updateProfilePicture
);

/**
 * @route   PUT /api/users/:id/deactivate
 * @desc    Deactivate user
 * @access  Private (SuperAdmin only)
 */
router.put(
  "/:id/deactivate",
  validateObjectId("id"),
  authorizeUserAccess(["update"]),
  deactivateUser
);

/**
 * @route   PUT /api/users/:id/activate
 * @desc    Activate user
 * @access  Private (SuperAdmin only)
 */
router.put(
  "/:id/activate",
  validateObjectId("id"),
  authorizeUserAccess(["update"]),
  activateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete user
 * @access  Private (SuperAdmin only)
 */
router.delete(
  "/:id",
  validateObjectId("id"),
  authorizeUserAccess(["delete"]),
  deleteUser
);

export default router;
