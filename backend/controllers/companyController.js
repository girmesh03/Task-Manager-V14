// backend/controllers/companyController.js
import asyncHandler from "express-async-handler";
import { Company, Department, User } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";
import mongoose from "mongoose";

/**
 * @desc    Get company information
 * @route   GET /api/companies/:id
 * @access  Private (All roles - own company only)
 */
export const getCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Ensure user can only access their own company
  if (!req.user.company._id.equals(id)) {
    throw new CustomError("Access denied to different company data", 403, "COMPANY_ACCESS_DENIED");
  }

  const company = await Company.findById(id)
    .populate("departments", "name description isActive")
    .populate("superAdmins", "firstName lastName email role");

  if (!company) {
    throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

/**
 * @desc    Get current user's company
 * @route   GET /api/companies/my-company
 * @access  Private (All roles)
 */
export const getMyCompany = asyncHandler(async (req, res) => {
  const company = await Company.findById(req.user.company._id)
    .populate("departments", "name description isActive")
    .populate("superAdmins", "firstName lastName email role");

  if (!company) {
    throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    data: company
  });
});

/**
 * @desc    Create new company (Onboarding only)
 * @route   POST /api/companies
 * @access  Private (SuperAdmin only)
 */
export const createCompany = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const {
        name,
        email,
        phone,
        address,
        size,
        industry,
        logo,
        subscription
      } = req.body;

      // Check if company with same name or email already exists
      const existingCompany = await Company.findOne({
        $or: [{ name }, { email }]
      }).session(session);

      if (existingCompany) {
        throw new CustomError("Company with this name or email already exists", 400, "COMPANY_ALREADY_EXISTS");
      }

      // Create company
      const company = new Company({
        name,
        email,
        phone,
        address,
        size,
        industry,
        logo,
        subscription: subscription || {}
      });

      await company.save({ session });

      res.status(201).json({
        success: true,
        message: "Company created successfully",
        data: company
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Update company information
 * @route   PUT /api/companies/:id
 * @access  Private (SuperAdmin only)
 */
export const updateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Ensure user can only update their own company
  if (!req.user.company._id.equals(id)) {
    throw new CustomError("Access denied to different company data", 403, "COMPANY_ACCESS_DENIED");
  }

  const updateData = { ...req.body };
  delete updateData.superAdmins; // Prevent updating super admins through this endpoint
  delete updateData.departments; // Prevent updating departments through this endpoint

  const company = await Company.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  if (!company) {
    throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Company updated successfully",
    data: company
  });
});

/**
 * @desc    Update company subscription
 * @route   PUT /api/companies/:id/subscription
 * @access  Private (SuperAdmin only)
 */
export const updateCompanySubscription = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { plan, status, expiresAt } = req.body;
  
  // Ensure user can only update their own company
  if (!req.user.company._id.equals(id)) {
    throw new CustomError("Access denied to different company data", 403, "COMPANY_ACCESS_DENIED");
  }

  const updateData = {};
  if (plan) updateData["subscription.plan"] = plan;
  if (status) updateData["subscription.status"] = status;
  if (expiresAt) updateData["subscription.expiresAt"] = expiresAt;

  const company = await Company.findByIdAndUpdate(
    id,
    updateData,
    {
      new: true,
      runValidators: true
    }
  );

  if (!company) {
    throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Company subscription updated successfully",
    data: company
  });
});

/**
 * @desc    Deactivate company
 * @route   PUT /api/companies/:id/deactivate
 * @access  Private (SuperAdmin only)
 */
export const deactivateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Ensure user can only deactivate their own company
  if (!req.user.company._id.equals(id)) {
    throw new CustomError("Access denied to different company data", 403, "COMPANY_ACCESS_DENIED");
  }

  const company = await Company.findByIdAndUpdate(
    id,
    { isActive: false },
    { new: true }
  );

  if (!company) {
    throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Company deactivated successfully",
    data: company
  });
});

/**
 * @desc    Reactivate company
 * @route   PUT /api/companies/:id/activate
 * @access  Private (SuperAdmin only)
 */
export const activateCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Ensure user can only activate their own company
  if (!req.user.company._id.equals(id)) {
    throw new CustomError("Access denied to different company data", 403, "COMPANY_ACCESS_DENIED");
  }

  const company = await Company.findByIdAndUpdate(
    id,
    { isActive: true },
    { new: true }
  );

  if (!company) {
    throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  res.status(200).json({
    success: true,
    message: "Company activated successfully",
    data: company
  });
});

/**
 * @desc    Delete company (Permanent deletion)
 * @route   DELETE /api/companies/:id
 * @access  Private (SuperAdmin only)
 */
export const deleteCompany = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Ensure user can only delete their own company
  if (!req.user.company._id.equals(id)) {
    throw new CustomError("Access denied to different company data", 403, "COMPANY_ACCESS_DENIED");
  }

  const session = await mongoose.startSession();
  
  try {
    await session.withTransaction(async () => {
      const company = await Company.findById(id).session(session);
      
      if (!company) {
        throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
      }

      // Delete all related data
      await Department.deleteMany({ company: id }).session(session);
      await User.deleteMany({ company: id }).session(session);
      
      // Delete the company
      await Company.findByIdAndDelete(id).session(session);

      res.status(200).json({
        success: true,
        message: "Company and all related data deleted successfully"
      });
    });
  } catch (error) {
    throw error;
  } finally {
    await session.endSession();
  }
});

/**
 * @desc    Get company statistics
 * @route   GET /api/companies/:id/stats
 * @access  Private (All roles - own company only)
 */
export const getCompanyStats = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  // Ensure user can only access their own company stats
  if (!req.user.company._id.equals(id)) {
    throw new CustomError("Access denied to different company data", 403, "COMPANY_ACCESS_DENIED");
  }

  const company = await Company.findById(id);
  if (!company) {
    throw new CustomError("Company not found", 404, "COMPANY_NOT_FOUND");
  }

  // Get statistics
  const departmentCount = await Department.countDocuments({ company: id, isActive: true });
  const userCount = await User.countDocuments({ company: id, isActive: true });
  const totalUsers = await User.countDocuments({ company: id });
  
  // Role-based user counts
  const roleStats = await User.aggregate([
    { $match: { company: new mongoose.Types.ObjectId(id) } },
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);

  const stats = {
    company: {
      name: company.name,
      subscription: company.subscription,
      isActive: company.isActive
    },
    departments: {
      active: departmentCount
    },
    users: {
      active: userCount,
      total: totalUsers,
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
