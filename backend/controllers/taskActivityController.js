// backend/controllers/taskActivityController.js
import asyncHandler from "express-async-handler";
import { TaskActivity, Task, AssignedTask, Notification } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import mongoose from "mongoose";

/**
 * @desc    Get all task activities
 * @route   GET /api/task-activities
 * @access  Private (SuperAdmin: all company activities, Admin/Manager: own department, User: assigned tasks only)
 */
export const getTaskActivities = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, sort = "-createdAt", taskId, performedBy } = req.query;

  // Build query based on user role and task access
  let query = {};
  let taskQuery = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see all activities in company
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can see activities for tasks in their department
    taskQuery.department = req.user.department._id;
  } else {
    // Users can only see activities for tasks assigned to them
    taskQuery.assignedTo = { $in: [req.user._id] };
    taskQuery.taskType = "AssignedTask"; // Only assigned tasks for users
  }

  // Get accessible task IDs
  const accessibleTasks = await Task.find(taskQuery).distinct("_id");
  query.task = { $in: accessibleTasks };

  // Add filters
  if (search) {
    query.description = { $regex: search, $options: "i" };
  }

  if (taskId) {
    // Verify user has access to this specific task
    const taskExists = accessibleTasks.some(id => id.equals(taskId));
    if (!taskExists) {
      throw new CustomError("Access denied to task activities", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
    query.task = taskId;
  }

  if (performedBy) {
    query.performedBy = performedBy;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "task", select: "title description status priority" },
      { path: "performedBy", select: "firstName lastName email" }
    ]
  };

  const activities = await TaskActivity.paginate(query, options);

  res.status(200).json({
    success: true,
    data: activities
  });
});

/**
 * @desc    Get single task activity
 * @route   GET /api/task-activities/:id
 * @access  Private (SuperAdmin: any activity, Admin/Manager: own department, User: assigned tasks only)
 */
export const getTaskActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const activity = await TaskActivity.findById(id)
    .populate("task", "title description status priority department company")
    .populate("performedBy", "firstName lastName email");

  if (!activity) {
    throw new CustomError("Task activity not found", 404, "TASK_ACTIVITY_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can access any activity in their company
    if (!activity.task.company.equals(req.user.company._id)) {
      throw new CustomError("Access denied to activity from different company", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can access activities for tasks in their department
    if (!activity.task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to activity outside your department", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else {
    // Users can only access activities for tasks assigned to them
    const task = await AssignedTask.findById(activity.task._id);
    if (!task || !task.assignedTo.includes(req.user._id)) {
      throw new CustomError("Access denied to activity for task not assigned to you", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  }

  res.status(200).json({
    success: true,
    data: activity
  });
});

/**
 * @desc    Create task activity
 * @route   POST /api/task-activities
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department, User: assigned tasks only)
 */
export const createTaskActivity = asyncHandler(async (req, res) => {
  const {
    task: taskId,
    description,
    statusChange,
    attachments
  } = req.body;

  // Get and validate task
  const task = await Task.findOne({
    _id: taskId,
    company: req.user.company._id
  });

  if (!task) {
    throw new CustomError("Task not found", 404, "TASK_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can create activities for any task
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can create activities for tasks in their department
    if (!task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to task outside your department", 403, "TASK_ACCESS_DENIED");
    }
  } else {
    // Users can only create activities for assigned tasks
    const assignedTask = await AssignedTask.findById(taskId);
    if (!assignedTask || !assignedTask.assignedTo.includes(req.user._id)) {
      throw new CustomError("Access denied to task not assigned to you", 403, "TASK_ACCESS_DENIED");
    }
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Create the activity
      const activity = new TaskActivity({
        task: taskId,
        performedBy: req.user._id,
        description,
        statusChange,
        attachments: attachments || []
      });

      await activity.save({ session });

      // Create notification for task owner/creator
      if (!task.createdBy.equals(req.user._id)) {
        const notification = new Notification({
          user: task.createdBy,
          message: `${req.user.firstName} ${req.user.lastName} added activity to task: ${task.title}`,
          type: "TaskUpdate",
          task: taskId,
          department: task.department,
          company: req.user.company._id,
          linkedDocument: activity._id,
          linkedDocumentType: "TaskActivity"
        });

        await notification.save({ session });
      }

      // Populate activity data for response
      await activity.populate([
        { path: "task", select: "title description status priority" },
        { path: "performedBy", select: "firstName lastName email" }
      ]);

      res.status(201).json({
        success: true,
        message: "Task activity created successfully",
        data: activity
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Update task activity
 * @route   PUT /api/task-activities/:id
 * @access  Private (SuperAdmin: any activity, Admin/Manager: own department, User: own activities for assigned tasks)
 */
export const updateTaskActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    description,
    attachments
  } = req.body;

  const activity = await TaskActivity.findById(id)
    .populate("task", "department company createdBy");

  if (!activity) {
    throw new CustomError("Task activity not found", 404, "TASK_ACTIVITY_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can update any activity in their company
    if (!activity.task.company.equals(req.user.company._id)) {
      throw new CustomError("Access denied to activity from different company", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can update activities for tasks in their department
    if (!activity.task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to activity outside your department", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else {
    // Users can only update their own activities for assigned tasks
    if (!activity.performedBy.equals(req.user._id)) {
      throw new CustomError("You can only update your own activities", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }

    const assignedTask = await AssignedTask.findById(activity.task._id);
    if (!assignedTask || !assignedTask.assignedTo.includes(req.user._id)) {
      throw new CustomError("Access denied to activity for task not assigned to you", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  }

  // Build update data (statusChange cannot be updated after creation)
  const updateData = {};
  if (description) updateData.description = description;
  if (attachments) updateData.attachments = attachments;

  const updatedActivity = await TaskActivity.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: "task", select: "title description status priority" },
    { path: "performedBy", select: "firstName lastName email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Task activity updated successfully",
    data: updatedActivity
  });
});

/**
 * @desc    Delete task activity
 * @route   DELETE /api/task-activities/:id
 * @access  Private (SuperAdmin: any activity, Admin/Manager: own department, User: own activities for assigned tasks)
 */
export const deleteTaskActivity = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const activity = await TaskActivity.findById(id)
    .populate("task", "department company");

  if (!activity) {
    throw new CustomError("Task activity not found", 404, "TASK_ACTIVITY_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can delete any activity in their company
    if (!activity.task.company.equals(req.user.company._id)) {
      throw new CustomError("Access denied to activity from different company", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can delete activities for tasks in their department
    if (!activity.task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to activity outside your department", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else {
    // Users can only delete their own activities for assigned tasks
    if (!activity.performedBy.equals(req.user._id)) {
      throw new CustomError("You can only delete your own activities", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }

    const assignedTask = await AssignedTask.findById(activity.task._id);
    if (!assignedTask || !assignedTask.assignedTo.includes(req.user._id)) {
      throw new CustomError("Access denied to activity for task not assigned to you", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  }

  await TaskActivity.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Task activity deleted successfully"
  });
});

/**
 * @desc    Get task activities for specific task
 * @route   GET /api/task-activities/task/:taskId
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department, User: assigned tasks only)
 */
export const getTaskActivitiesForTask = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { page = 1, limit = 10, sort = "-createdAt" } = req.query;

  // Get and validate task
  const task = await Task.findOne({
    _id: taskId,
    company: req.user.company._id
  });

  if (!task) {
    throw new CustomError("Task not found", 404, "TASK_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can access any task
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can access tasks in their department
    if (!task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to task outside your department", 403, "TASK_ACCESS_DENIED");
    }
  } else {
    // Users can only access assigned tasks
    const assignedTask = await AssignedTask.findById(taskId);
    if (!assignedTask || !assignedTask.assignedTo.includes(req.user._id)) {
      throw new CustomError("Access denied to task not assigned to you", 403, "TASK_ACCESS_DENIED");
    }
  }

  const query = { task: taskId };

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "performedBy", select: "firstName lastName email" }
    ]
  };

  const activities = await TaskActivity.paginate(query, options);

  res.status(200).json({
    success: true,
    data: {
      task: {
        _id: task._id,
        title: task.title,
        status: task.status
      },
      activities
    }
  });
});

/**
 * @desc    Add attachment to task activity
 * @route   PUT /api/task-activities/:id/attachments
 * @access  Private (Activity owner, Admin/Manager: own department, SuperAdmin: any)
 */
export const addTaskActivityAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { url, public_id, type } = req.body;

  const activity = await TaskActivity.findById(id)
    .populate("task", "department company");

  if (!activity) {
    throw new CustomError("Task activity not found", 404, "TASK_ACTIVITY_NOT_FOUND");
  }

  // Authorization check (same as update)
  if (req.user.role === "SuperAdmin") {
    if (!activity.task.company.equals(req.user.company._id)) {
      throw new CustomError("Access denied to activity from different company", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    if (!activity.task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to activity outside your department", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else {
    if (!activity.performedBy.equals(req.user._id)) {
      throw new CustomError("You can only modify your own activities", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  }

  // Add attachment
  const attachment = {
    url,
    public_id,
    type: type || "image",
    uploadedAt: new Date()
  };

  activity.attachments.push(attachment);
  await activity.save();

  res.status(200).json({
    success: true,
    message: "Attachment added successfully",
    data: activity
  });
});

/**
 * @desc    Remove attachment from task activity
 * @route   DELETE /api/task-activities/:id/attachments/:attachmentIndex
 * @access  Private (Activity owner, Admin/Manager: own department, SuperAdmin: any)
 */
export const removeTaskActivityAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentIndex } = req.params;

  const activity = await TaskActivity.findById(id)
    .populate("task", "department company");

  if (!activity) {
    throw new CustomError("Task activity not found", 404, "TASK_ACTIVITY_NOT_FOUND");
  }

  // Authorization check (same as update)
  if (req.user.role === "SuperAdmin") {
    if (!activity.task.company.equals(req.user.company._id)) {
      throw new CustomError("Access denied to activity from different company", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    if (!activity.task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to activity outside your department", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  } else {
    if (!activity.performedBy.equals(req.user._id)) {
      throw new CustomError("You can only modify your own activities", 403, "TASK_ACTIVITY_ACCESS_DENIED");
    }
  }

  // Validate attachment index
  const index = parseInt(attachmentIndex);
  if (index < 0 || index >= activity.attachments.length) {
    throw new CustomError("Invalid attachment index", 400, "INVALID_ATTACHMENT_INDEX");
  }

  // Remove attachment
  activity.attachments.splice(index, 1);
  await activity.save();

  res.status(200).json({
    success: true,
    message: "Attachment removed successfully",
    data: activity
  });
});

/**
 * @desc    Get task activity statistics
 * @route   GET /api/task-activities/stats
 * @access  Private (SuperAdmin: company stats, Admin/Manager: department stats, User: personal stats)
 */
export const getTaskActivityStats = asyncHandler(async (req, res) => {
  // Build task query based on user role
  let taskQuery = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see company-wide stats
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can see department stats
    taskQuery.department = req.user.department._id;
  } else {
    // Users can only see stats for their assigned tasks
    taskQuery.assignedTo = { $in: [req.user._id] };
    taskQuery.taskType = "AssignedTask";
  }

  // Get accessible task IDs
  const accessibleTasks = await Task.find(taskQuery).distinct("_id");
  const activityQuery = { task: { $in: accessibleTasks } };

  const totalActivities = await TaskActivity.countDocuments(activityQuery);

  // Status change statistics
  const statusChangeStats = await TaskActivity.aggregate([
    { $match: { ...activityQuery, "statusChange.to": { $exists: true } } },
    { $group: { _id: "$statusChange.to", count: { $sum: 1 } } }
  ]);

  // User activity statistics
  const userStats = await TaskActivity.aggregate([
    { $match: activityQuery },
    {
      $group: {
        _id: "$performedBy",
        totalActivities: { $sum: 1 },
        lastActivity: { $max: "$createdAt" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user"
      }
    },
    { $unwind: "$user" },
    {
      $project: {
        _id: 1,
        name: { $concat: ["$user.firstName", " ", "$user.lastName"] },
        totalActivities: 1,
        lastActivity: 1
      }
    },
    { $sort: { totalActivities: -1 } }
  ]);

  const stats = {
    overview: {
      total: totalActivities
    },
    statusChanges: statusChangeStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    userActivity: userStats
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});
