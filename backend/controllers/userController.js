// backend/controllers/userController.js
import asyncHandler from "express-async-handler";
import { User, Department, Company } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private (SuperAdmin: all company users, Admin/Manager: own department, User: self only)
 */
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, sort = "-createdAt", role, department, isActive } = req.query;

  // Build query based on user role
  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see all users in company
    if (department) query.department = department;
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can only see users in their department
    query.department = req.user.department._id;
  } else {
    // Users can only see themselves
    query._id = req.user._id;
  }

  // Add filters
  if (search) {
    query.$or = [
      { firstName: { $regex: search, $options: "i" } },
      { lastName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { position: { $regex: search, $options: "i" } }
    ];
  }

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort,
    populate: [
      { path: "department", select: "name" },
      { path: "company", select: "name" }
    ],
    select: "-password"
  };

  const users = await User.paginate(query, options);

  res.status(200).json({
    success: true,
    data: users
  });
});

/**
 * @desc    Get single user
 * @route   GET /api/users/:id
 * @access  Private (SuperAdmin: any company user, Admin/Manager: own department, User: self only)
 */
export const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let query = { _id: id, company: req.user.company._id };

  // Authorization check based on role
  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can access any user in company
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can only access users in their department
    const targetUser = await User.findOne(query).select("department");
    if (!targetUser || !targetUser.department.equals(req.user.department._id)) {
      throw new CustomError("Access denied to user outside your department", 403, "USER_ACCESS_DENIED");
    }
  } else {
    // Users can only access themselves
    if (!req.user._id.equals(id)) {
      throw new CustomError("Users can only access their own profile", 403, "USER_ACCESS_DENIED");
    }
  }

  const user = await User.findOne(query)
    .populate("department", "name description")
    .populate("company", "name")
    .select("-password");

  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/users/profile
 * @access  Private (All roles)
 */
export const getMyProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate("department", "name description")
    .populate("company", "name")
    .select("-password");

  res.status(200).json({
    success: true,
    data: user
  });
});

/**
 * @desc    Create new user
 * @route   POST /api/users
 * @access  Private (SuperAdmin only)
 */
export const createUser = asyncHandler(async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    password,
    role,
    position,
    department,
    skills
  } = req.body;

  // Check if user with email already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new CustomError("User with this email already exists", 400, "USER_ALREADY_EXISTS");
  }

  // Validate department belongs to the same company
  const departmentDoc = await Department.findOne({
    _id: department,
    company: req.user.company._id
  });

  if (!departmentDoc) {
    throw new CustomError("Invalid department or department not found", 400, "INVALID_DEPARTMENT");
  }

  // Create user
  const user = new User({
    firstName,
    lastName,
    email,
    password,
    role,
    position,
    department,
    company: req.user.company._id,
    skills: skills || [],
    isVerified: true // Admin-created users are auto-verified
  });

  await user.save();

  // If user is SuperAdmin, add to company's superAdmins array
  if (role === "SuperAdmin") {
    await Company.findByIdAndUpdate(
      req.user.company._id,
      { $push: { superAdmins: user._id } }
    );
  }

  // Populate user data for response
  await user.populate([
    { path: "department", select: "name" },
    { path: "company", select: "name" }
  ]);

  res.status(201).json({
    success: true,
    message: "User created successfully",
    data: {
      ...user.toObject(),
      password: undefined
    }
  });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private (SuperAdmin: any user, Others: self only)
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    role,
    position,
    department,
    skills,
    isActive
  } = req.body;

  // Authorization check
  if (req.user.role !== "SuperAdmin" && !req.user._id.equals(id)) {
    throw new CustomError("You can only update your own profile", 403, "USER_ACCESS_DENIED");
  }

  const user = await User.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  // Validate email uniqueness if changing
  if (email && email !== user.email) {
    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      throw new CustomError("Email already in use", 400, "EMAIL_ALREADY_EXISTS");
    }
  }

  // Validate department if changing (only SuperAdmin can change departments)
  if (department && req.user.role === "SuperAdmin") {
    const departmentDoc = await Department.findOne({
      _id: department,
      company: req.user.company._id
    });
    if (!departmentDoc) {
      throw new CustomError("Invalid department", 400, "INVALID_DEPARTMENT");
    }
  }

  // Build update data
  const updateData = {};
  if (firstName) updateData.firstName = firstName;
  if (lastName) updateData.lastName = lastName;
  if (email) updateData.email = email;
  if (position !== undefined) updateData.position = position;
  if (skills) updateData.skills = skills;

  // Only SuperAdmin can update these fields
  if (req.user.role === "SuperAdmin") {
    if (role) updateData.role = role;
    if (department) updateData.department = department;
    if (isActive !== undefined) updateData.isActive = isActive;
  }

  // Handle SuperAdmin role changes
  if (role && req.user.role === "SuperAdmin") {
    if (role === "SuperAdmin" && user.role !== "SuperAdmin") {
      // Adding SuperAdmin role
      await Company.findByIdAndUpdate(
        req.user.company._id,
        { $addToSet: { superAdmins: id } }
      );
    } else if (role !== "SuperAdmin" && user.role === "SuperAdmin") {
      // Removing SuperAdmin role
      await Company.findByIdAndUpdate(
        req.user.company._id,
        { $pull: { superAdmins: id } }
      );
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  )
    .populate("department", "name")
    .populate("company", "name")
    .select("-password");

  res.status(200).json({
    success: true,
    message: "User updated successfully",
    data: updatedUser
  });
});

/**
 * @desc    Update user password
 * @route   PUT /api/users/:id/password
 * @access  Private (User: self only, SuperAdmin: any user)
 */
export const updatePassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { currentPassword, newPassword } = req.body;

  // Authorization check
  if (req.user.role !== "SuperAdmin" && !req.user._id.equals(id)) {
    throw new CustomError("You can only update your own password", 403, "USER_ACCESS_DENIED");
  }

  const user = await User.findOne({
    _id: id,
    company: req.user.company._id
  }).select("+password");

  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  // Verify current password (not required for SuperAdmin updating others)
  if (!req.user._id.equals(id) && req.user.role === "SuperAdmin") {
    // SuperAdmin can update any user's password without current password
  } else {
    if (!currentPassword) {
      throw new CustomError("Current password is required", 400, "CURRENT_PASSWORD_REQUIRED");
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new CustomError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
    }
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(200).json({
    success: true,
    message: "Password updated successfully"
  });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private (SuperAdmin only)
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findOne({
    _id: id,
    company: req.user.company._id
  });

  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  // Prevent deleting the last SuperAdmin
  if (user.role === "SuperAdmin") {
    const superAdminCount = await User.countDocuments({
      company: req.user.company._id,
      role: "SuperAdmin",
      _id: { $ne: id }
    });

    if (superAdminCount === 0) {
      throw new CustomError("Cannot delete the last SuperAdmin", 400, "LAST_SUPERADMIN_DELETE_ERROR");
    }
  }

  // Remove from company superAdmins if applicable
  if (user.role === "SuperAdmin") {
    await Company.findByIdAndUpdate(
      req.user.company._id,
      { $pull: { superAdmins: id } }
    );
  }

  await User.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: "User deleted successfully"
  });
});

/**
 * @desc    Deactivate user
 * @route   PUT /api/users/:id/deactivate
 * @access  Private (SuperAdmin only)
 */
export const deactivateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findOneAndUpdate(
    {
      _id: id,
      company: req.user.company._id
    },
    { isActive: false },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "User deactivated successfully",
    data: user
  });
});

/**
 * @desc    Activate user
 * @route   PUT /api/users/:id/activate
 * @access  Private (SuperAdmin only)
 */
export const activateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findOneAndUpdate(
    {
      _id: id,
      company: req.user.company._id
    },
    { isActive: true },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "User activated successfully",
    data: user
  });
});

/**
 * @desc    Get user statistics
 * @route   GET /api/users/stats
 * @access  Private (SuperAdmin: company stats, Others: own stats)
 */
export const getUserStats = asyncHandler(async (req, res) => {
  let query = { company: req.user.company._id };

  if (req.user.role === "SuperAdmin") {
    // SuperAdmin can see company-wide stats
  } else if (["Admin", "Manager"].includes(req.user.role)) {
    // Admin/Manager can see department stats
    query.department = req.user.department._id;
  } else {
    // Users can only see their own stats
    query._id = req.user._id;
  }

  const totalUsers = await User.countDocuments(query);
  const activeUsers = await User.countDocuments({ ...query, isActive: true });
  const verifiedUsers = await User.countDocuments({ ...query, isVerified: true });

  // Role-based statistics
  const roleStats = await User.aggregate([
    { $match: query },
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);

  // Department-based statistics (only for SuperAdmin)
  let departmentStats = [];
  if (req.user.role === "SuperAdmin") {
    departmentStats = await User.aggregate([
      { $match: { company: req.user.company._id } },
      {
        $lookup: {
          from: "departments",
          localField: "department",
          foreignField: "_id",
          as: "department"
        }
      },
      { $unwind: "$department" },
      {
        $group: {
          _id: "$department._id",
          name: { $first: "$department.name" },
          count: { $sum: 1 }
        }
      }
    ]);
  }

  const stats = {
    overview: {
      total: totalUsers,
      active: activeUsers,
      verified: verifiedUsers
    },
    byRole: roleStats.reduce((acc, stat) => {
      acc[stat._id] = stat.count;
      return acc;
    }, {}),
    byDepartment: departmentStats
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * @desc    Upload profile picture
 * @route   PUT /api/users/:id/profile-picture
 * @access  Private (User: self only, SuperAdmin: any user)
 */
export const updateProfilePicture = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { url, public_id } = req.body;

  // Authorization check
  if (req.user.role !== "SuperAdmin" && !req.user._id.equals(id)) {
    throw new CustomError("You can only update your own profile picture", 403, "USER_ACCESS_DENIED");
  }

  const user = await User.findOneAndUpdate(
    {
      _id: id,
      company: req.user.company._id
    },
    {
      profilePicture: { url, public_id }
    },
    { new: true }
  ).select("-password");

  if (!user) {
    throw new CustomError("User not found", 404, "USER_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Profile picture updated successfully",
    data: user
  });
});
