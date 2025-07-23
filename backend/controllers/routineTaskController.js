// backend/controllers/routineTaskController.js
import asyncHandler from "express-async-handler";
import { RoutineTask, Department } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import mongoose from "mongoose";

/**
 * @desc    Get all routine tasks
 * @route   GET /api/routine-tasks
 * @access  Private (SuperAdmin: all company tasks, Others: own department only)
 */
export const getRoutineTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, sort = "-createdAt", date, performedBy, progress } = req.query;

  // Build query based on user role
  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see all routine tasks in company
  } else {
    // All other roles can only see routine tasks in their department
    query.department = req.user.department._id;
  }

  // Add filters
  if (search) {
    query["performedTasks.description"] = { $regex: search, $options: "i" };
  }

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.date = { $gte: startDate, $lt: endDate };
  }

  if (performedBy) {
    query.performedBy = performedBy;
  }

  if (progress !== undefined) {
    query.progress = { $gte: parseInt(progress) };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "performedBy", select: "firstName lastName email" },
      { path: "department", select: "name" }
    ]
  };

  const tasks = await RoutineTask.paginate(query, options);

  res.status(200).json({
    success: true,
    data: tasks
  });
});

/**
 * @desc    Get single routine task
 * @route   GET /api/routine-tasks/:id
 * @access  Private (SuperAdmin: any task, Others: own department only)
 */
export const getRoutineTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only access tasks in their department
  if (req.user.role !== "SuperAdmin") {
    query.department = req.user.department._id;
  }

  const task = await RoutineTask.findOne(query)
    .populate("performedBy", "firstName lastName email position")
    .populate("department", "name");

  if (!task) {
    throw new CustomError("Routine task not found", 404, "ROUTINE_TASK_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

/**
 * @desc    Create new routine task
 * @route   POST /api/routine-tasks
 * @access  Private (All roles can create routine tasks in their own department)
 */
export const createRoutineTask = asyncHandler(async (req, res) => {
  const {
    department,
    date,
    performedTasks,
    attachments
  } = req.body;

  // Validate department belongs to company and user has access
  const departmentDoc = await Department.findOne({
    _id: department || req.user.department._id,
    company: req.user.company._id
  });

  if (!departmentDoc) {
    throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  // Non-SuperAdmins can only create tasks in their own department
  const taskDepartment = department || req.user.department._id;
  if (req.user.role !== "SuperAdmin" && !req.user.department._id.equals(taskDepartment)) {
    throw new CustomError("Can only create routine tasks in your own department", 403, "DEPARTMENT_ACCESS_DENIED");
  }

  // Create the routine task
  const task = new RoutineTask({
    company: req.user.company._id,
    department: taskDepartment,
    performedBy: req.user._id,
    date: date || new Date(),
    performedTasks,
    attachments: attachments || []
  });

  await task.save();

  // Populate task data for response
  await task.populate([
    { path: "performedBy", select: "firstName lastName email" },
    { path: "department", select: "name" }
  ]);

  res.status(201).json({
    success: true,
    message: "Routine task created successfully",
    data: task
  });
});

/**
 * @desc    Update routine task
 * @route   PUT /api/routine-tasks/:id
 * @access  Private (All roles can update routine tasks in their own department)
 */
export const updateRoutineTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    date,
    performedTasks,
    attachments
  } = req.body;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only update tasks in their department
  if (req.user.role !== "SuperAdmin") {
    query.department = req.user.department._id;
  }

  const task = await RoutineTask.findOne(query);

  if (!task) {
    throw new CustomError("Routine task not found", 404, "ROUTINE_TASK_NOT_FOUND");
  }

  // Build update data
  const updateData = {};
  if (date) updateData.date = date;
  if (performedTasks) updateData.performedTasks = performedTasks;
  if (attachments) updateData.attachments = attachments;

  const updatedTask = await RoutineTask.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  ).populate([
    { path: "performedBy", select: "firstName lastName email" },
    { path: "department", select: "name" }
  ]);

  res.status(200).json({
    success: true,
    message: "Routine task updated successfully",
    data: updatedTask
  });
});

/**
 * @desc    Update routine task progress
 * @route   PUT /api/routine-tasks/:id/progress
 * @access  Private (All roles can update routine tasks in their own department)
 */
export const updateRoutineTaskProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { taskIndex, isCompleted } = req.body;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only update tasks in their department
  if (req.user.role !== "SuperAdmin") {
    query.department = req.user.department._id;
  }

  const task = await RoutineTask.findOne(query);

  if (!task) {
    throw new CustomError("Routine task not found", 404, "ROUTINE_TASK_NOT_FOUND");
  }

  // Validate task index
  if (taskIndex < 0 || taskIndex >= task.performedTasks.length) {
    throw new CustomError("Invalid task index", 400, "INVALID_TASK_INDEX");
  }

  // Update the specific task completion status
  task.performedTasks[taskIndex].isCompleted = isCompleted;
  await task.save();

  await task.populate([
    { path: "performedBy", select: "firstName lastName email" },
    { path: "department", select: "name" }
  ]);

  res.status(200).json({
    success: true,
    message: "Routine task progress updated successfully",
    data: task
  });
});

/**
 * @desc    Add attachment to routine task
 * @route   PUT /api/routine-tasks/:id/attachments
 * @access  Private (All roles can update routine tasks in their own department)
 */
export const addRoutineTaskAttachment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { url, public_id, type } = req.body;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only update tasks in their department
  if (req.user.role !== "SuperAdmin") {
    query.department = req.user.department._id;
  }

  const task = await RoutineTask.findOne(query);

  if (!task) {
    throw new CustomError("Routine task not found", 404, "ROUTINE_TASK_NOT_FOUND");
  }

  // Add attachment
  const attachment = {
    url,
    public_id,
    type: type || "image",
    uploadedAt: new Date()
  };

  task.attachments.push(attachment);
  await task.save();

  res.status(200).json({
    success: true,
    message: "Attachment added successfully",
    data: task
  });
});

/**
 * @desc    Remove attachment from routine task
 * @route   DELETE /api/routine-tasks/:id/attachments/:attachmentIndex
 * @access  Private (All roles can update routine tasks in their own department)
 */
export const removeRoutineTaskAttachment = asyncHandler(async (req, res) => {
  const { id, attachmentIndex } = req.params;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only update tasks in their department
  if (req.user.role !== "SuperAdmin") {
    query.department = req.user.department._id;
  }

  const task = await RoutineTask.findOne(query);

  if (!task) {
    throw new CustomError("Routine task not found", 404, "ROUTINE_TASK_NOT_FOUND");
  }

  // Validate attachment index
  const index = parseInt(attachmentIndex);
  if (index < 0 || index >= task.attachments.length) {
    throw new CustomError("Invalid attachment index", 400, "INVALID_ATTACHMENT_INDEX");
  }

  // Remove attachment
  task.attachments.splice(index, 1);
  await task.save();

  res.status(200).json({
    success: true,
    message: "Attachment removed successfully",
    data: task
  });
});

/**
 * @desc    Delete routine task
 * @route   DELETE /api/routine-tasks/:id
 * @access  Private (All roles can delete routine tasks in their own department)
 */
export const deleteRoutineTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id, company: req.user.company._id };

  // Non-SuperAdmins can only delete tasks in their department
  if (req.user.role !== "SuperAdmin") {
    query.department = req.user.department._id;
  }

  const task = await RoutineTask.findOne(query);

  if (!task) {
    throw new CustomError("Routine task not found", 404, "ROUTINE_TASK_NOT_FOUND");
  }

  await RoutineTask.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "Routine task deleted successfully"
  });
});

/**
 * @desc    Get routine task statistics
 * @route   GET /api/routine-tasks/stats
 * @access  Private (SuperAdmin: company stats, Others: department stats)
 */
export const getRoutineTaskStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let query = { company: req.user.company._id };

  if (req.user.role !== "SuperAdmin") {
    // Non-SuperAdmins can only see stats for their department
    query.department = req.user.department._id;
  }

  // Add date filter if provided
  if (startDate && endDate) {
    query.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const totalTasks = await RoutineTask.countDocuments(query);
  
  // Progress-based statistics
  const progressStats = await RoutineTask.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgProgress: { $avg: "$progress" },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$progress", 100] }, 1, 0] }
        },
        totalProgress: { $sum: "$progress" }
      }
    }
  ]);

  // Daily statistics for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const dailyStats = await RoutineTask.aggregate([
    {
      $match: {
        ...query,
        date: { $gte: thirtyDaysAgo }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$date" }
        },
        count: { $sum: 1 },
        avgProgress: { $avg: "$progress" }
      }
    },
    { $sort: { "_id": 1 } }
  ]);

  // User performance statistics
  const userStats = await RoutineTask.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$performedBy",
        totalTasks: { $sum: 1 },
        avgProgress: { $avg: "$progress" },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$progress", 100] }, 1, 0] }
        }
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
        totalTasks: 1,
        avgProgress: { $round: ["$avgProgress", 2] },
        completedTasks: 1
      }
    },
    { $sort: { totalTasks: -1 } }
  ]);

  const stats = {
    overview: {
      total: totalTasks,
      completed: progressStats[0]?.completedTasks || 0,
      avgProgress: Math.round(progressStats[0]?.avgProgress || 0)
    },
    daily: dailyStats,
    userPerformance: userStats
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get my routine tasks
 * @route   GET /api/routine-tasks/my-tasks
 * @access  Private (All roles)
 */
export const getMyRoutineTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, date, sort = "-createdAt" } = req.query;

  let query = {
    company: req.user.company._id,
    performedBy: req.user._id
  };

  // Add date filter
  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.date = { $gte: startDate, $lt: endDate };
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "department", select: "name" }
    ]
  };

  const tasks = await RoutineTask.paginate(query, options);

  res.status(200).json({
    success: true,
    data: tasks
  });
});

/**
 * @desc    Get routine tasks by date range
 * @route   GET /api/routine-tasks/date-range
 * @access  Private (SuperAdmin: company wide, Others: own department)
 */
export const getRoutineTasksByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, performedBy } = req.query;

  if (!startDate || !endDate) {
    throw new CustomError("Start date and end date are required", 400, "DATE_RANGE_REQUIRED");
  }

  let query = {
    company: req.user.company._id,
    date: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  };

  // Role-based filtering
  if (req.user.role !== "SuperAdmin") {
    query.department = req.user.department._id;
  }

  if (performedBy) {
    query.performedBy = performedBy;
  }

  const tasks = await RoutineTask.find(query)
    .populate("performedBy", "firstName lastName email")
    .populate("department", "name")
    .sort({ date: -1 });

  res.status(200).json({
    success: true,
    data: tasks
  });
});
