// backend/routes/notificationRoutes.js
import express from "express";
import {
  getNotifications,
  getNotification,
  markNotificationAsRead,
  markNotificationAsUnread,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
  getMyNotifications,
  getNotificationStats,
  getUnreadNotificationCount,
  createSystemNotification,
  getNotificationsByType
} from "../controllers/notificationController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorizeNotificationAccess, authorizeRoles } from "../middlewares/authorization.js";
import {
  validateNotificationUpdate,
  validateObjectId,
  validatePaginationQuery,
  handleValidationErrors
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * @route   GET /api/notifications/my-notifications
 * @desc    Get my notifications
 * @access  Private (All roles)
 */
router.get(
  "/my-notifications",
  validatePaginationQuery,
  getMyNotifications
);

/**
 * @route   GET /api/notifications/stats
 * @desc    Get notification statistics
 * @access  Private (SuperAdmin: company stats, Others: personal stats)
 */
router.get("/stats", getNotificationStats);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notification count
 * @access  Private (All roles)
 */
router.get("/unread-count", getUnreadNotificationCount);

/**
 * @route   PUT /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private (SuperAdmin: all company notifications, Others: own notifications only)
 */
router.put(
  "/mark-all-read",
  authorizeNotificationAccess(["update"]),
  markAllNotificationsAsRead
);

/**
 * @route   DELETE /api/notifications
 * @desc    Delete all notifications
 * @access  Private (SuperAdmin: all company notifications, Others: own notifications only)
 */
router.delete(
  "/",
  authorizeNotificationAccess(["delete"]),
  deleteAllNotifications
);

/**
 * @route   POST /api/notifications/system
 * @desc    Create system notification (Internal use)
 * @access  Private (SuperAdmin only - for system-generated notifications)
 */
router.post(
  "/system",
  authorizeRoles(["SuperAdmin"]),
  createSystemNotification
);

/**
 * @route   GET /api/notifications/by-type/:type
 * @desc    Get notifications by type
 * @access  Private (SuperAdmin: all company notifications, Others: own notifications only)
 */
router.get(
  "/by-type/:type",
  validatePaginationQuery,
  authorizeNotificationAccess(["read"]),
  getNotificationsByType
);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for user
 * @access  Private (SuperAdmin: all company notifications, Others: own notifications only)
 */
router.get(
  "/",
  validatePaginationQuery,
  authorizeNotificationAccess(["read"]),
  getNotifications
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get single notification
 * @access  Private (SuperAdmin: any notification, Others: own notifications only)
 */
router.get(
  "/:id",
  validateObjectId("id"),
  authorizeNotificationAccess(["read"]),
  getNotification
);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private (SuperAdmin: any notification, Others: own notifications only)
 */
router.put(
  "/:id/read",
  validateObjectId("id"),
  authorizeNotificationAccess(["update"]),
  markNotificationAsRead
);

/**
 * @route   PUT /api/notifications/:id/unread
 * @desc    Mark notification as unread
 * @access  Private (SuperAdmin: any notification, Others: own notifications only)
 */
router.put(
  "/:id/unread",
  validateObjectId("id"),
  authorizeNotificationAccess(["update"]),
  markNotificationAsUnread
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private (SuperAdmin: any notification, Others: own notifications only)
 */
router.delete(
  "/:id",
  validateObjectId("id"),
  authorizeNotificationAccess(["delete"]),
  deleteNotification
);

export default router;
