// backend/controllers/notificationController.js
import asyncHandler from "express-async-handler";
import { Notification } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";

/**
 * @desc    Get all notifications for user
 * @route   GET /api/notifications
 * @access  Private (SuperAdmin: all company notifications, Others: own notifications only)
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "-createdAt", isRead, type } = req.query;

  // Build query based on user role
  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see all notifications in the company
  } else {
    // All other roles can only see their own notifications
    query.user = req.user._id;
  }

  // Add filters
  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }

  if (type) {
    query.type = type;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "user", select: "firstName lastName email" },
      { path: "task", select: "title" },
      { path: "department", select: "name" },
      {
        path: "linkedDocument",
        select: "title name description"
      }
    ]
  };

  const notifications = await Notification.paginate(query, options);

  res.status(200).json({
    success: true,
    data: notifications
  });
});

/**
 * @desc    Get single notification
 * @route   GET /api/notifications/:id
 * @access  Private (SuperAdmin: any notification, Others: own notifications only)
 */
export const getNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only access their own notifications
  if (req.user.role !== "SuperAdmin") {
    query.user = req.user._id;
  }

  const notification = await Notification.findOne(query)
    .populate("user", "firstName lastName email")
    .populate("task", "title description")
    .populate("department", "name")
    .populate("linkedDocument");

  if (!notification) {
    throw new CustomError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    data: notification
  });
});

/**
 * @desc    Mark notification as read
 * @route   PUT /api/notifications/:id/read
 * @access  Private (SuperAdmin: any notification, Others: own notifications only)
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only update their own notifications
  if (req.user.role !== "SuperAdmin") {
    query.user = req.user._id;
  }

  const notification = await Notification.findOneAndUpdate(
    query,
    { isRead: true },
    { new: true }
  ).populate("user", "firstName lastName email");

  if (!notification) {
    throw new CustomError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    data: notification
  });
});

/**
 * @desc    Mark notification as unread
 * @route   PUT /api/notifications/:id/unread
 * @access  Private (SuperAdmin: any notification, Others: own notifications only)
 */
export const markNotificationAsUnread = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only update their own notifications
  if (req.user.role !== "SuperAdmin") {
    query.user = req.user._id;
  }

  const notification = await Notification.findOneAndUpdate(
    query,
    { isRead: false },
    { new: true }
  ).populate("user", "firstName lastName email");

  if (!notification) {
    throw new CustomError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Notification marked as unread",
    data: notification
  });
});

/**
 * @desc    Mark all notifications as read
 * @route   PUT /api/notifications/mark-all-read
 * @access  Private (SuperAdmin: all company notifications, Others: own notifications only)
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  let query = { company: req.user.company._id, isRead: false };

  // Non-SuperAdmins can only update their own notifications
  if (req.user.role !== "SuperAdmin") {
    query.user = req.user._id;
  }

  const result = await Notification.updateMany(
    query,
    { isRead: true }
  );

  res.status(200).json({
    success: true,
    message: `${result.modifiedCount} notifications marked as read`,
    data: {
      modifiedCount: result.modifiedCount
    }
  });
});

/**
 * @desc    Delete notification
 * @route   DELETE /api/notifications/:id
 * @access  Private (SuperAdmin: any notification, Others: own notifications only)
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only delete their own notifications
  if (req.user.role !== "SuperAdmin") {
    query.user = req.user._id;
  }

  const notification = await Notification.findOneAndDelete(query);

  if (!notification) {
    throw new CustomError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully"
  });
});

/**
 * @desc    Delete all notifications
 * @route   DELETE /api/notifications
 * @access  Private (SuperAdmin: all company notifications, Others: own notifications only)
 */
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  let query = { company: req.user.company._id };

  // Non-SuperAdmins can only delete their own notifications
  if (req.user.role !== "SuperAdmin") {
    query.user = req.user._id;
  }

  const result = await Notification.deleteMany(query);

  res.status(200).json({
    success: true,
    message: `${result.deletedCount} notifications deleted successfully`,
    data: {
      deletedCount: result.deletedCount
    }
  });
});

/**
 * @desc    Get my notifications
 * @route   GET /api/notifications/my-notifications
 * @access  Private (All roles)
 */
export const getMyNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "-createdAt", isRead, type } = req.query;

  let query = {
    user: req.user._id,
    company: req.user.company._id
  };

  // Add filters
  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }

  if (type) {
    query.type = type;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "task", select: "title" },
      { path: "department", select: "name" },
      {
        path: "linkedDocument",
        select: "title name description"
      }
    ]
  };

  const notifications = await Notification.paginate(query, options);

  res.status(200).json({
    success: true,
    data: notifications
  });
});

/**
 * @desc    Get notification statistics
 * @route   GET /api/notifications/stats
 * @access  Private (SuperAdmin: company stats, Others: personal stats)
 */
export const getNotificationStats = asyncHandler(async (req, res) => {
  let query = { company: req.user.company._id };

  // Non-SuperAdmins can only see their own stats
  if (req.user.role !== "SuperAdmin") {
    query.user = req.user._id;
  }

  const totalNotifications = await Notification.countDocuments(query);
  const unreadNotifications = await Notification.countDocuments({
    ...query,
    isRead: false
  });

  // Type-based statistics
  const typeStats = await Notification.aggregate([
    { $match: query },
    { $group: { _id: "$type", count: { $sum: 1 } } }
  ]);

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentNotifications = await Notification.countDocuments({
    ...query,
    createdAt: { $gte: sevenDaysAgo }
  });

  const stats = {
    overview: {
      total: totalNotifications,
      unread: unreadNotifications,
      read: totalNotifications - unreadNotifications,
      recent: recentNotifications
    },
    byType: typeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {})
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get unread notification count
 * @route   GET /api/notifications/unread-count
 * @access  Private (All roles)
 */
export const getUnreadNotificationCount = asyncHandler(async (req, res) => {
  const count = await Notification.countDocuments({
    user: req.user._id,
    company: req.user.company._id,
    isRead: false
  });

  res.status(200).json({
    success: true,
    data: {
      unreadCount: count
    }
  });
});

/**
 * @desc    Create system notification (Internal use)
 * @route   POST /api/notifications/system
 * @access  Private (SuperAdmin only - for system-generated notifications)
 */
export const createSystemNotification = asyncHandler(async (req, res) => {
  const {
    user,
    users, // For bulk notifications
    message,
    type,
    task,
    department,
    linkedDocument,
    linkedDocumentType
  } = req.body;

  const notifications = [];

  if (users && Array.isArray(users)) {
    // Bulk notification creation
    users.forEach(userId => {
      notifications.push({
        user: userId,
        message,
        type,
        task,
        department: department || req.user.department._id,
        company: req.user.company._id,
        linkedDocument,
        linkedDocumentType
      });
    });
  } else if (user) {
    // Single notification
    notifications.push({
      user,
      message,
      type,
      task,
      department: department || req.user.department._id,
      company: req.user.company._id,
      linkedDocument,
      linkedDocumentType
    });
  } else {
    throw new CustomError("User or users array is required", 400, "NOTIFICATION_RECIPIENT_REQUIRED");
  }

  const createdNotifications = await Notification.insertMany(notifications);

  res.status(201).json({
    success: true,
    message: `${createdNotifications.length} system notification(s) created successfully`,
    data: {
      count: createdNotifications.length,
      notifications: createdNotifications
    }
  });
});

/**
 * @desc    Get notifications by type
 * @route   GET /api/notifications/by-type/:type
 * @access  Private (SuperAdmin: all company notifications, Others: own notifications only)
 */
export const getNotificationsByType = asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { page = 1, limit = 10, sort = "-createdAt", isRead } = req.query;

  let query = {
    type,
    company: req.user.company._id
  };

  // Non-SuperAdmins can only see their own notifications
  if (req.user.role !== "SuperAdmin") {
    query.user = req.user._id;
  }

  if (isRead !== undefined) {
    query.isRead = isRead === "true";
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "user", select: "firstName lastName email" },
      { path: "task", select: "title" },
      { path: "department", select: "name" }
    ]
  };

  const notifications = await Notification.paginate(query, options);

  res.status(200).json({
    success: true,
    data: {
      type,
      notifications
    }
  });
});
