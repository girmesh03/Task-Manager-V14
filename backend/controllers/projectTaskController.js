// backend/controllers/projectTaskController.js
import asyncHandler from "express-async-handler";
import { ProjectTask, Department, Notification } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import mongoose from "mongoose";

/**
 * @desc    Get all project tasks
 * @route   GET /api/project-tasks
 * @access  Private (SuperAdmin: all company tasks, Admin/Manager: own department, User: none)
 */
export const getProjectTasks = asyncHandler(async (req, res) => {
  // Users cannot access project tasks
  if (req.user.role === "User") {
    throw new CustomError("Users cannot access project tasks", 403, "PROJECT_TASK_ACCESS_DENIED");
  }

  const { page = 1, limit = 10, search, sort = "-createdAt", status, priority, department } = req.query;

  // Build query based on user role
  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see all project tasks in company
    if (department) query.department = department;
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can only see project tasks in their department
    query.department = req.user.department._id;
  }

  // Add filters
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } },
      { "clientInfo.name": { $regex: search, $options: "i" } }
    ];
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "createdBy", select: "firstName lastName email" },
      { path: "department", select: "name" }
    ]
  };

  const tasks = await ProjectTask.paginate(query, options);

  res.status(200).json({
    success: true,
    data: tasks
  });
});

/**
 * @desc    Get single project task
 * @route   GET /api/project-tasks/:id
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department, User: none)
 */
export const getProjectTask = asyncHandler(async (req, res) => {
  // Users cannot access project tasks
  if (req.user.role === "User") {
    throw new CustomError("Users cannot access project tasks", 403, "PROJECT_TASK_ACCESS_DENIED");
  }

  const { id } = req.params;

  const task = await ProjectTask.findOne({
    _id: id,
    company: req.user.company._id
  })
    .populate("createdBy", "firstName lastName email")
    .populate("department", "name")
    .populate("activities");

  if (!task) {
    throw new CustomError("Project task not found", 404, "PROJECT_TASK_NOT_FOUND");
  }

  // Authorization check for Admin/Manager
  if (["Admin", "Manager"].includes(req.user.role)) {
    if (!task.department._id.equals(req.user.department._id)) {
      throw new CustomError("Access denied to project task outside your department", 403, "PROJECT_TASK_ACCESS_DENIED");
    }
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

/**
 * @desc    Create new project task
 * @route   POST /api/project-tasks
 * @access  Private (SuperAdmin: any department, Admin/Manager: own department only)
 */
export const createProjectTask = asyncHandler(async (req, res) => {
  // Users cannot create project tasks
  if (req.user.role === "User") {
    throw new CustomError("Users cannot create project tasks", 403, "PROJECT_TASK_ACCESS_DENIED");
  }

  const {
    title,
    description,
    location,
    dueDate,
    priority,
    department,
    clientInfo
  } = req.body;

  // Validate department belongs to company and user has access
  const departmentDoc = await Department.findOne({
    _id: department,
    company: req.user.company._id
  });

  if (!departmentDoc) {
    throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  // Check department access for non-SuperAdmins
  if (req.user.role !== "SuperAdmin" && !req.user.department._id.equals(department)) {
    throw new CustomError("Can only create project tasks in your own department", 403, "DEPARTMENT_ACCESS_DENIED");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Create the project task
      const task = new ProjectTask({
        title,
        description,
        location,
        dueDate,
        priority,
        department,
        company: req.user.company._id,
        createdBy: req.user._id,
        clientInfo
      });

      await task.save({ session });

      // Populate task data for response
      await task.populate([
        { path: "createdBy", select: "firstName lastName email" },
        { path: "department", select: "name" }
      ]);

      res.status(201).json({
        success: true,
        message: "Project task created successfully",
        data: task
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Update project task
 * @route   PUT /api/project-tasks/:id
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department only)
 */
export const updateProjectTask = asyncHandler(async (req, res) => {
  // Users cannot update project tasks
  if (req.user.role === "User") {
    throw new CustomError("Users cannot update project tasks", 403, "PROJECT_TASK_ACCESS_DENIED");
  }

  const { id } = req.params;
  const {
    title,
    description,
    location,
    dueDate,
    priority,
    status,
    clientInfo
  } = req.body;

  const task = await ProjectTask.findOne({
    _id: id,
    company: req.user.company._id
  }).populate("department");

  if (!task) {
    throw new CustomError("Project task not found", 404, "PROJECT_TASK_NOT_FOUND");
  }

  // Authorization check for Admin/Manager
  if (["Admin", "Manager"].includes(req.user.role)) {
    if (!task.department._id.equals(req.user.department._id)) {
      throw new CustomError("Access denied to project task outside your department", 403, "PROJECT_TASK_ACCESS_DENIED");
    }
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Build update data
      const updateData = {};
      if (title) updateData.title = title;
      if (description) updateData.description = description;
      if (location) updateData.location = location;
      if (dueDate) updateData.dueDate = dueDate;
      if (priority) updateData.priority = priority;
      if (status) updateData.status = status;
      if (clientInfo) updateData.clientInfo = { ...task.clientInfo, ...clientInfo };

      const updatedTask = await ProjectTask.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
          session
        }
      ).populate([
        { path: "createdBy", select: "firstName lastName email" },
        { path: "department", select: "name" }
      ]);

      res.status(200).json({
        success: true,
        message: "Project task updated successfully",
        data: updatedTask
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Delete project task
 * @route   DELETE /api/project-tasks/:id
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department only)
 */
export const deleteProjectTask = asyncHandler(async (req, res) => {
  // Users cannot delete project tasks
  if (req.user.role === "User") {
    throw new CustomError("Users cannot delete project tasks", 403, "PROJECT_TASK_ACCESS_DENIED");
  }

  const { id } = req.params;

  const task = await ProjectTask.findOne({
    _id: id,
    company: req.user.company._id
  }).populate("department");

  if (!task) {
    throw new CustomError("Project task not found", 404, "PROJECT_TASK_NOT_FOUND");
  }

  // Authorization check for Admin/Manager
  if (["Admin", "Manager"].includes(req.user.role)) {
    if (!task.department._id.equals(req.user.department._id)) {
      throw new CustomError("Access denied to project task outside your department", 403, "PROJECT_TASK_ACCESS_DENIED");
    }
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Delete related notifications
      await Notification.deleteMany({ task: id }).session(session);

      // Delete the task
      await ProjectTask.findByIdAndDelete(id).session(session);

      res.status(200).json({
        success: true,
        message: "Project task deleted successfully"
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Get project task statistics
 * @route   GET /api/project-tasks/stats
 * @access  Private (SuperAdmin: company stats, Admin/Manager: department stats, User: none)
 */
export const getProjectTaskStats = asyncHandler(async (req, res) => {
  // Users cannot access project task stats
  if (req.user.role === "User") {
    throw new CustomError("Users cannot access project task statistics", 403, "PROJECT_TASK_ACCESS_DENIED");
  }

  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see company-wide stats
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can see department stats
    query.department = req.user.department._id;
  }

  const totalTasks = await ProjectTask.countDocuments(query);
  
  // Status-based statistics
  const statusStats = await ProjectTask.aggregate([
    { $match: query },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  // Priority-based statistics
  const priorityStats = await ProjectTask.aggregate([
    { $match: query },
    { $group: { _id: "$priority", count: { $sum: 1 } } }
  ]);

  // Monthly creation statistics
  const monthlyStats = await ProjectTask.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          year: { $year: "$createdAt" },
          month: { $month: "$createdAt" }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 }
  ]);

  // Overdue tasks
  const overdueTasks = await ProjectTask.countDocuments({
    ...query,
    dueDate: { $lt: new Date() },
    status: { $ne: "Completed" }
  });

  const stats = {
    overview: {
      total: totalTasks,
      overdue: overdueTasks
    },
    byStatus: statusStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    byPriority: priorityStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    monthly: monthlyStats.map(stat => ({
      period: `${stat._id.year}-${stat._id.month.toString().padStart(2, '0')}`,
      count: stat.count
    }))
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get project tasks by client
 * @route   GET /api/project-tasks/by-client
 * @access  Private (SuperAdmin: company wide, Admin/Manager: own department)
 */
export const getProjectTasksByClient = asyncHandler(async (req, res) => {
  // Users cannot access project tasks
  if (req.user.role === "User") {
    throw new CustomError("Users cannot access project tasks", 403, "PROJECT_TASK_ACCESS_DENIED");
  }

  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see company-wide stats
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can see department stats
    query.department = req.user.department._id;
  }

  const clientStats = await ProjectTask.aggregate([
    { $match: query },
    {
      $group: {
        _id: "$clientInfo.name",
        totalTasks: { $sum: 1 },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] }
        },
        pendingTasks: {
          $sum: { $cond: [{ $ne: ["$status", "Completed"] }, 1, 0] }
        },
        lastTaskDate: { $max: "$createdAt" }
      }
    },
    { $sort: { totalTasks: -1 } }
  ]);

  res.status(200).json({
    success: true,
    data: clientStats
  });
});

/**
 * @desc    Update project task status
 * @route   PUT /api/project-tasks/:id/status
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department)
 */
export const updateProjectTaskStatus = asyncHandler(async (req, res) => {
  // Users cannot update project tasks
  if (req.user.role === "User") {
    throw new CustomError("Users cannot update project tasks", 403, "PROJECT_TASK_ACCESS_DENIED");
  }

  const { id } = req.params;
  const { status } = req.body;

  const task = await ProjectTask.findOne({
    _id: id,
    company: req.user.company._id
  }).populate("department");

  if (!task) {
    throw new CustomError("Project task not found", 404, "PROJECT_TASK_NOT_FOUND");
  }

  // Authorization check for Admin/Manager
  if (["Admin", "Manager"].includes(req.user.role)) {
    if (!task.department._id.equals(req.user.department._id)) {
      throw new CustomError("Access denied to project task outside your department", 403, "PROJECT_TASK_ACCESS_DENIED");
    }
  }

  const oldStatus = task.status;
  task.status = status;
  await task.save();

  // Create notification for significant status changes
  if (status === "Completed" && oldStatus !== "Completed") {
    const notification = new Notification({
      user: task.createdBy,
      message: `Project task "${task.title}" has been completed`,
      type: "TaskCompletion",
      task: task._id,
      department: task.department._id,
      company: req.user.company._id,
      linkedDocument: task._id,
      linkedDocumentType: "Task"
    });

    await notification.save();
  }

  res.status(200).json({
    success: true,
    message: "Project task status updated successfully",
    data: {
      taskId: task._id,
      oldStatus,
      newStatus: status
    }
  });
});
