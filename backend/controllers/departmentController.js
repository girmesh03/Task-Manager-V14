// backend/controllers/departmentController.js
import asyncHandler from "express-async-handler";
import { Department, User, Company } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import mongoose from "mongoose";

/**
 * @desc    Get all departments
 * @route   GET /api/departments
 * @access  Private (SuperAdmin: all, Others: own department only)
 */
export const getDepartments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, sort = "-createdAt" } = req.query;

  // Build query based on user role
  let query = { company: req.user.company._id };

  // Non-SuperAdmins can only see their own department
  if (req.user.role !== "SuperAdmin") {
    query._id = req.user.department._id;
  }

  // Add search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } }
    ];
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "managers", select: "firstName lastName email role" },
      { path: "company", select: "name" }
    ]
  };

  const departments = await Department.paginate(query, options);

  res.status(200).json({
    success: true,
    data: departments
  });
});

/**
 * @desc    Get single department
 * @route   GET /api/departments/:id
 * @access  Private (SuperAdmin: any, Others: own department only)
 */
export const getDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Non-SuperAdmins can only access their own department
  if (req.user.role !== "SuperAdmin" && !req.user.department._id.equals(id)) {
    throw new CustomError("Access denied to department outside your scope", 403, "DEPARTMENT_ACCESS_DENIED");
  }

  const department = await Department.findOne({
    _id: id,
    company: req.user.company._id
  })
    .populate("managers", "firstName lastName email role position")
    .populate("company", "name")
    .populate({
      path: "memberCount",
      options: { virtuals: true }
    })
    .populate({
      path: "taskCount",
      options: { virtuals: true }
    });

  if (!department) {
    throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  // Get department members
  const members = await User.find({
    department: id,
    company: req.user.company._id
  }).select("firstName lastName email role position isActive");

  res.status(200).json({
    success: true,
    data: {
      ...department.toObject(),
      members
    }
  });
});

/**
 * @desc    Create new department
 * @route   POST /api/departments
 * @access  Private (SuperAdmin only)
 */
export const createDepartment = asyncHandler(async (req, res) => {
  const { name, description, managers } = req.body;

  // Check if department with same name exists in company
  const existingDepartment = await Department.findOne({
    name,
    company: req.user.company._id
  });

  if (existingDepartment) {
    throw new CustomError("Department with this name already exists in your company", 400, "DEPARTMENT_ALREADY_EXISTS");
  }

  // Validate managers belong to the company
  if (managers && managers.length > 0) {
    const managerUsers = await User.find({
      _id: { $in: managers },
      company: req.user.company._id,
      role: { $in: ["Admin", "Manager"] }
    });

    if (managerUsers.length !== managers.length) {
      throw new CustomError("One or more managers are invalid or not authorized", 400, "INVALID_MANAGERS");
    }
  }

  const department = new Department({
    name,
    description,
    company: req.user.company._id,
    managers: managers || []
  });

  await department.save();

  // Update company's departments array
  await Company.findByIdAndUpdate(
    req.user.company._id,
    { $push: { departments: department._id } }
  );

  await department.populate("managers", "firstName lastName email role");

  res.status(201).json({
    success: true,
    message: "Department created successfully",
    data: department
  });
});

/**
 * @desc    Update department
 * @route   PUT /api/departments/:id
 * @access  Private (SuperAdmin only)
 */
export const updateDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, managers, isActive } = req.body;

  const department = await Department.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!department) {
    throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  // Check if new name conflicts with existing departments
  if (name && name !== department.name) {
    const existingDepartment = await Department.findOne({
      name,
      company: req.user.company._id,
      _id: { $ne: id }
    });

    if (existingDepartment) {
      throw new CustomError("Department with this name already exists in your company", 400, "DEPARTMENT_ALREADY_EXISTS");
    }
  }

  // Validate managers if provided
  if (managers && managers.length > 0) {
    const managerUsers = await User.find({
      _id: { $in: managers },
      company: req.user.company._id,
      role: { $in: ["Admin", "Manager"] }
    });

    if (managerUsers.length !== managers.length) {
      throw new CustomError("One or more managers are invalid or not authorized", 400, "INVALID_MANAGERS");
    }
  }

  // Update department
  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (managers) updateData.managers = managers;
  if (isActive !== undefined) updateData.isActive = isActive;

  const updatedDepartment = await Department.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  ).populate("managers", "firstName lastName email role");

  res.status(200).json({
    success: true,
    message: "Department updated successfully",
    data: updatedDepartment
  });
});

/**
 * @desc    Delete department
 * @route   DELETE /api/departments/:id
 * @access  Private (SuperAdmin only)
 */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const department = await Department.findOne({
        _id: id,
        company: req.user.company._id
      }).session(session);

      if (!department) {
        throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
      }

      // Check if department has users
      const userCount = await User.countDocuments({
        department: id,
        company: req.user.company._id
      }).session(session);

      if (userCount > 0) {
        throw new CustomError("Cannot delete department with existing users. Please reassign users first.", 400, "DEPARTMENT_HAS_USERS");
      }

      // Remove department from company's departments array
      await Company.findByIdAndUpdate(
        req.user.company._id,
        { $pull: { departments: id } }
      ).session(session);

      // Delete the department
      await Department.findByIdAndDelete(id).session(session);

      res.status(200).json({
        success: true,
        message: "Department deleted successfully"
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Add manager to department
 * @route   PUT /api/departments/:id/managers
 * @access  Private (SuperAdmin only)
 */
export const addDepartmentManager = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { managerId } = req.body;

  const department = await Department.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!department) {
    throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  // Validate manager
  const manager = await User.findOne({
    _id: managerId,
    company: req.user.company._id,
    role: { $in: ["Admin", "Manager"] }
  });

  if (!manager) {
    throw new CustomError("Manager not found or not authorized", 400, "INVALID_MANAGER");
  }

  // Check if manager is already added
  if (department.managers.includes(managerId)) {
    throw new CustomError("Manager is already assigned to this department", 400, "MANAGER_ALREADY_EXISTS");
  }

  department.managers.push(managerId);
  await department.save();

  await department.populate("managers", "firstName lastName email role");

  res.status(200).json({
    success: true,
    message: "Manager added to department successfully",
    data: department
  });
});

/**
 * @desc    Remove manager from department
 * @route   DELETE /api/departments/:id/managers/:managerId
 * @access  Private (SuperAdmin only)
 */
export const removeDepartmentManager = asyncHandler(async (req, res) => {
  const { id, managerId } = req.params;

  const department = await Department.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!department) {
    throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  // Check if manager exists in department
  if (!department.managers.includes(managerId)) {
    throw new CustomError("Manager not found in this department", 400, "MANAGER_NOT_FOUND");
  }

  department.managers = department.managers.filter(manager => !manager.equals(managerId));
  await department.save();

  await department.populate("managers", "firstName lastName email role");

  res.status(200).json({
    success: true,
    message: "Manager removed from department successfully",
    data: department
  });
});

/**
 * @desc    Get department statistics
 * @route   GET /api/departments/:id/stats
 * @access  Private (SuperAdmin: any, Others: own department only)
 */
export const getDepartmentStats = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Non-SuperAdmins can only access their own department stats
  if (req.user.role !== "SuperAdmin" && !req.user.department._id.equals(id)) {
    throw new CustomError("Access denied to department outside your scope", 403, "DEPARTMENT_ACCESS_DENIED");
  }

  const department = await Department.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!department) {
    throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  // Get statistics
  const totalUsers = await User.countDocuments({ department: id });
  const activeUsers = await User.countDocuments({ department: id, isActive: true });
  
  // Role-based user counts
  const roleStats = await User.aggregate([
    { $match: { department: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);

  const stats = {
    department: {
      name: department.name,
      isActive: department.isActive,
      managersCount: department.managers.length
    },
    users: {
      total: totalUsers,
      active: activeUsers,
      byRole: roleStats.reduce((acc, stat) => {
        acc[stat._id] = stat.count;
        return acc;
      }, {})
    }
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Get department members
 * @route   GET /api/departments/:id/members
 * @access  Private (SuperAdmin: any, Others: own department only)
 */
export const getDepartmentMembers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, search, sort = "-createdAt", role, isActive } = req.query;

  // Non-SuperAdmins can only access their own department members
  if (req.user.role !== "SuperAdmin" && !req.user.department._id.equals(id)) {
    throw new CustomError("Access denied to department outside your scope", 403, "DEPARTMENT_ACCESS_DENIED");
  }

  const department = await Department.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!department) {
    throw new CustomError("Department not found", 404, "DEPARTMENT_NOT_FOUND");
  }

  // Build query
  let query = { department: id, company: req.user.company._id };

  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } }
    ];
  }

  if (role) {
    query.role = role;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true";
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    select: "firstName lastName email role position isActive createdAt"
  };

  const members = await User.paginate(query, options);

  res.status(200).json({
    success: true,
    data: {
      department: {
        _id: department._id,
        name: department.name
      },
      members
    }
  });
});
