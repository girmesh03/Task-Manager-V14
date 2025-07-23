// backend/controllers/assignedTaskController.js
import asyncHandler from "express-async-handler";
import { AssignedTask, User, Department, Notification } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import mongoose from "mongoose";

/**
 * @desc    Get all assigned tasks
 * @route   GET /api/assigned-tasks
 * @access  Private (SuperAdmin: all company tasks, Admin/Manager: own department, User: assigned to self)
 */
export const getAssignedTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, sort = "-createdAt", status, priority, department } = req.query;

  // Build query based on user role
  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see all tasks in company
    if (department) query.department = department;
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can only see tasks in their department
    query.department = req.user.department._id;
  } else {
    // Users can only see tasks assigned to them
    query.assignedTo = { $in: [req.user._id] };
  }

  // Add filters
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { location: { $regex: search, $options: "i" } }
    ];
  }

  if (status) query.status = status;
  if (priority) query.priority = priority;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "assignedTo", select: "firstName lastName email" },
      { path: "createdBy", select: "firstName lastName email" },
      { path: "department", select: "name" },
      { path: "completedBy.user", select: "firstName lastName email" }
    ]
  };

  const tasks = await AssignedTask.paginate(query, options);

  res.status(200).json({
    success: true,
    data: tasks
  });
});

/**
 * @desc    Get single assigned task
 * @route   GET /api/assigned-tasks/:id
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department, User: assigned to self)
 */
export const getAssignedTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id, company: req.user.company._id };

  const task = await AssignedTask.findOne(query)
    .populate("assignedTo", "firstName lastName email position")
    .populate("createdBy", "firstName lastName email")
    .populate("department", "name")
    .populate("completedBy.user", "firstName lastName email")
    .populate("activities");

  if (!task) {
    throw new CustomError("Assigned task not found", 404, "TASK_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can access any task
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can only access tasks in their department
    if (!task.department._id.equals(req.user.department._id)) {
      throw new CustomError("Access denied to task outside your department", 403, "TASK_ACCESS_DENIED");
    }
  } else {
    // Users can only access tasks assigned to them
    const isAssigned = task.assignedTo.some(user => user._id.equals(req.user._id));
    if (!isAssigned) {
      throw new CustomError("Access denied to task not assigned to you", 403, "TASK_ACCESS_DENIED");
    }
  }

  res.status(200).json({
    success: true,
    data: task
  });
});

/**
 * @desc    Create new assigned task
 * @route   POST /api/assigned-tasks
 * @access  Private (SuperAdmin: any department, Admin/Manager: own department only)
 */
export const createAssignedTask = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    location,
    dueDate,
    priority,
    department,
    assignedTo
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
    throw new CustomError("Can only create tasks in your own department", 403, "DEPARTMENT_ACCESS_DENIED");
  }

  // Validate assigned users belong to the department and company
  const assignedUsers = await User.find({
    _id: { $in: assignedTo },
    company: req.user.company._id,
    department: department,
    isActive: true
  });

  if (assignedUsers.length !== assignedTo.length) {
    throw new CustomError("One or more assigned users are invalid or not in the specified department", 400, "INVALID_ASSIGNED_USERS");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Create the task
      const task = new AssignedTask({
        title,
        description,
        location,
        dueDate,
        priority,
        department,
        company: req.user.company._id,
        createdBy: req.user._id,
        assignedTo
      });

      await task.save({ session });

      // Create notifications for assigned users
      const notifications = assignedTo.map(userId => ({
        user: userId,
        message: `You have been assigned a new task: ${title}`,
        type: "TaskAssignment",
        task: task._id,
        department: department,
        company: req.user.company._id,
        linkedDocument: task._id,
        linkedDocumentType: "Task"
      }));

      await Notification.insertMany(notifications, { session });

      // Populate task data for response
      await task.populate([
        { path: "assignedTo", select: "firstName lastName email" },
        { path: "createdBy", select: "firstName lastName email" },
        { path: "department", select: "name" }
      ]);

      res.status(201).json({
        success: true,
        message: "Assigned task created successfully",
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
 * @desc    Update assigned task
 * @route   PUT /api/assigned-tasks/:id
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department only)
 */
export const updateAssignedTask = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    title,
    description,
    location,
    dueDate,
    priority,
    status,
    assignedTo
  } = req.body;

  const task = await AssignedTask.findOne({
    _id: id,
    company: req.user.company._id
  }).populate("department");

  if (!task) {
    throw new CustomError("Assigned task not found", 404, "TASK_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role !== "SuperAdmin" && !task.department._id.equals(req.user.department._id)) {
    throw new CustomError("Access denied to task outside your department", 403, "TASK_ACCESS_DENIED");
  }

  // Validate assigned users if provided
  if (assignedTo) {
    const assignedUsers = await User.find({
      _id: { $in: assignedTo },
      company: req.user.company._id,
      department: task.department._id,
      isActive: true
    });

    if (assignedUsers.length !== assignedTo.length) {
      throw new CustomError("One or more assigned users are invalid", 400, "INVALID_ASSIGNED_USERS");
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
      if (assignedTo) {
        updateData.assignedTo = assignedTo;
        // Reset completion tracking if assignees change
        updateData.completedBy = [];
      }

      const updatedTask = await AssignedTask.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
          session
        }
      ).populate([
        { path: "assignedTo", select: "firstName lastName email" },
        { path: "createdBy", select: "firstName lastName email" },
        { path: "department", select: "name" }
      ]);

      // Create notifications for status changes or new assignments
      if (status && status !== task.status) {
        const notifications = updatedTask.assignedTo.map(user => ({
          user: user._id,
          message: `Task "${updatedTask.title}" status changed to ${status}`,
          type: "StatusChange",
          task: updatedTask._id,
          department: updatedTask.department._id,
          company: req.user.company._id,
          linkedDocument: updatedTask._id,
          linkedDocumentType: "Task"
        }));

        await Notification.insertMany(notifications, { session });
      }

      res.status(200).json({
        success: true,
        message: "Assigned task updated successfully",
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
 * @desc    Mark task as completed by user
 * @route   PUT /api/assigned-tasks/:id/complete
 * @access  Private (User: assigned tasks only, Admin/Manager: own department, SuperAdmin: any)
 */
export const completeTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await AssignedTask.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!task) {
    throw new CustomError("Assigned task not found", 404, "TASK_NOT_FOUND");
  }

  // Authorization check for users
  if (req.user.role === "User") {
    const isAssigned = task.assignedTo.some(userId => userId.equals(req.user._id));
    if (!isAssigned) {
      throw new CustomError("You can only complete tasks assigned to you", 403, "TASK_ACCESS_DENIED");
    }
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    if (!task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to task outside your department", 403, "TASK_ACCESS_DENIED");
    }
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Mark task as completed by this user
      await task.markCompletedByUser(req.user._id);

      // Create notification for task completion
      const notification = new Notification({
        user: task.createdBy,
        message: `${req.user.firstName} ${req.user.lastName} completed task: ${task.title}`,
        type: "TaskCompletion",
        task: task._id,
        department: task.department,
        company: req.user.company._id,
        linkedDocument: task._id,
        linkedDocumentType: "Task"
      });

      await notification.save({ session });

      await task.populate([
        { path: "assignedTo", select: "firstName lastName email" },
        { path: "completedBy.user", select: "firstName lastName email" }
      ]);

      res.status(200).json({
        success: true,
        message: "Task marked as completed",
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
 * @desc    Unmark task completion
 * @route   PUT /api/assigned-tasks/:id/uncomplete
 * @access  Private (User: assigned tasks only, Admin/Manager: own department, SuperAdmin: any)
 */
export const uncompleteTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await AssignedTask.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!task) {
    throw new CustomError("Assigned task not found", 404, "TASK_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role === "User") {
    const isAssigned = task.assignedTo.some(userId => userId.equals(req.user._id));
    if (!isAssigned) {
      throw new CustomError("You can only modify tasks assigned to you", 403, "TASK_ACCESS_DENIED");
    }
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    if (!task.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to task outside your department", 403, "TASK_ACCESS_DENIED");
    }
  }

  // Unmark completion
  await task.unmarkCompletedByUser(req.user._id);

  await task.populate([
    { path: "assignedTo", select: "firstName lastName email" },
    { path: "completedBy.user", select: "firstName lastName email" }
  ]);

  res.status(200).json({
    success: true,
    message: "Task completion unmarked",
    data: task
  });
});

/**
 * @desc    Delete assigned task
 * @route   DELETE /api/assigned-tasks/:id
 * @access  Private (SuperAdmin: any task, Admin/Manager: own department only)
 */
export const deleteAssignedTask = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const task = await AssignedTask.findOne({
    _id: id,
    company: req.user.company._id
  }).populate("department");

  if (!task) {
    throw new CustomError("Assigned task not found", 404, "TASK_NOT_FOUND");
  }

  // Authorization check
  if (req.user.role !== "SuperAdmin" && !task.department._id.equals(req.user.department._id)) {
    throw new CustomError("Access denied to task outside your department", 403, "TASK_ACCESS_DENIED");
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // Delete related notifications
      await Notification.deleteMany({ task: id }).session(session);

      // Delete the task
      await AssignedTask.findByIdAndDelete(id).session(session);

      res.status(200).json({
        success: true,
        message: "Assigned task deleted successfully"
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Get assigned task statistics
 * @route   GET /api/assigned-tasks/stats
 * @access  Private (SuperAdmin: company stats, Admin/Manager: department stats, User: personal stats)
 */
export const getAssignedTaskStats = asyncHandler(async (req, res) => {
  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see company-wide stats
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can see department stats
    query.department = req.user.department._id;
  } else {
    // Users can only see their own stats
    query.assignedTo = { $in: [req.user._id] };
  }

  const totalTasks = await AssignedTask.countDocuments(query);
  
  // Status-based statistics
  const statusStats = await AssignedTask.aggregate([
    { $match: query },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  // Priority-based statistics
  const priorityStats = await AssignedTask.aggregate([
    { $match: query },
    { $group: { _id: "$priority", count: { $sum: 1 } } }
  ]);

  // Progress-based statistics
  const progressStats = await AssignedTask.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        avgProgress: { $avg: "$progress" },
        completedTasks: {
          $sum: { $cond: [{ $eq: ["$progress", 100] }, 1, 0] }
        }
      }
    }
  ]);

  const stats = {
    overview: {
      total: totalTasks,
      completed: progressStats[0]?.completedTasks || 0,
      avgProgress: Math.round(progressStats[0]?.avgProgress || 0)
    },
    byStatus: statusStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    byPriority: priorityStats.reduce((acc, stat) => {
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
 * @desc    Get my assigned tasks
 * @route   GET /api/assigned-tasks/my-tasks
 * @access  Private (User: assigned tasks)
 */
export const getMyAssignedTasks = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, sort = "-createdAt" } = req.query;

  let query = {
    company: req.user.company._id,
    assignedTo: { $in: [req.user._id] }
  };

  if (status) query.status = status;
  if (priority) query.priority = priority;

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "createdBy", select: "firstName lastName email" },
      { path: "department", select: "name" },
      { path: "completedBy.user", select: "firstName lastName email" }
    ]
  };

  const tasks = await AssignedTask.paginate(query, options);

  res.status(200).json({
    success: true,
    data: tasks
  });
});
