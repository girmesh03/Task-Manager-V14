// backend/controllers/authController.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import { User, Company, Department } from "../models/index.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../utils/GenerateTokens.js";
import CustomError from "../errorHandler/CustomError.js";

// @desc    Register a new company and associate department and admin user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res, next) => {
  // --- PHASE 1: INPUT VALIDATION ---

  // Payload validation
  const { companyData, userData } = req.body;

  if (!companyData || !userData) {
    return next(
      new CustomError(
        "Company data and user data are required",
        400,
        "MISSING_REQUIRED_DATA"
      )
    );
  }

  // Extract and validate required fields
  const { name, email, phone, address, size, industry } = companyData;
  const {
    adminFirstName,
    adminLastName,
    departmentName,
    adminEmail,
    adminPassword,
  } = userData;

  // Required field validation
  const requiredFields = {
    "Company name": name,
    "Company email": email,
    "Company phone": phone,
    "Company address": address,
    "Admin first name": adminFirstName,
    "Admin last name": adminLastName,
    "Department name": departmentName,
    "Admin email": adminEmail,
    "Admin password": adminPassword,
  };

  const missingFields = Object.entries(requiredFields)
    .filter(
      ([key, value]) => !value || (typeof value === "string" && !value.trim())
    )
    .map(([key]) => key);

  if (missingFields.length > 0) {
    return next(
      new CustomError(
        `Missing required fields: ${missingFields.join(", ")}`,
        400,
        "MISSING_REQUIRED_FIELDS"
      )
    );
  }

  // --- PHASE 2: UNIQUENESS VALIDATION ---

  // Check uniqueness before transaction
  const [
    existingCompanyByName,
    existingCompanyByEmail,
    existingCompanyByPhone,
    existingUser,
  ] = await Promise.all([
    Company.findOne({ name: name.trim() }).lean(),
    Company.findOne({ email: email.toLowerCase().trim() }).lean(),
    Company.findOne({ phone: phone.trim() }).lean(),
    User.findOne({ email: adminEmail.toLowerCase().trim() }).lean(),
  ]);

  if (existingCompanyByName) {
    return next(
      new CustomError(
        "Company name already exists",
        409,
        "COMPANY_NAME_EXISTS_ERROR"
      )
    );
  }

  if (existingCompanyByEmail) {
    return next(
      new CustomError(
        "Company email already exists",
        409,
        "COMPANY_EMAIL_EXISTS"
      )
    );
  }

  if (existingCompanyByPhone) {
    return next(
      new CustomError(
        "Company phone number already exists",
        409,
        "COMPANY_PHONE_EXISTS"
      )
    );
  }

  if (existingUser) {
    return next(
      new CustomError(
        "Admin email already exists",
        409,
        "USER_EMAIL_EXISTS_ERROR"
      )
    );
  }

  // --- PHASE 3: TRANSACTIONAL CREATION ---

  const session = await mongoose.startSession();

  try {
    // Start transaction
    session.startTransaction();

    // Create company
    const company = new Company({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address.trim(),
      size,
      industry,
      superAdmins: [],
      departments: [],
    });
    await company.save({ session });

    // Check department name uniqueness within company (race condition protection)
    const existingDepartment = await Department.findOne({
      name: departmentName.trim(),
      company: company._id,
    }).session(session);

    if (existingDepartment) {
      throw new CustomError(
        "Department name already exists in this company",
        409,
        "DEPARTMENT_NAME_EXISTS"
      );
    }

    // Create department
    const department = new Department({
      name: departmentName.trim(),
      company: company._id,
      managers: [], // Will be updated after user creation
      members: [],
    });
    await department.save({ session });

    // Create admin user
    const adminUser = new User({
      firstName: adminFirstName.trim(),
      lastName: adminLastName.trim(),
      email: adminEmail.toLowerCase().trim(),
      password: adminPassword, // Will be hashed in middleware
      role: "SuperAdmin",
      company: company._id,
      department: department._id,
      isVerified: true, // Auto-verify first user
    });
    await adminUser.save({ session });

    // Update department with manager
    department.managers.push(adminUser._id);
    await department.save({ session });

    // Update company with superAdmin
    company.superAdmins.push(adminUser._id);
    await company.save({ session });

    // Commit transaction
    await session.commitTransaction();

    // Send response
    res.status(201).json({
      success: true,
      message: "Company and admin user registered successfully",
    });
  } catch (error) {
    // Rollback transaction on error
    await session.abortTransaction();

    // Pass error to global error handler
    next(error);
  } finally {
    // Always end session
    session.endSession();
  }
});

//@desc    Authenticate user and get token
//@route   POST /api/auth/login
//@access  Public
export const loginUser = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email || !password) {
      return next(
        new CustomError(
          "Email and password are required",
          400,
          "MISSING_CREDENTIALS"
        )
      );
    }

    // Find user with company and department details
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate("company", "name isActive subscription.status")
      .populate("department", "name isActive")
      .select("+password");

    if (!user) {
      return next(
        new CustomError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS_ERROR"
        )
      );
    }

    // Verify password
    if (!(await user.comparePassword(password))) {
      return next(
        new CustomError(
          "Invalid email or password",
          401,
          "INVALID_CREDENTIALS_ERROR"
        )
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return next(
        new CustomError(
          "User account is deactivated",
          401,
          "USER_DEACTIVATED_ERROR"
        )
      );
    }

    // Check if company is active
    if (!user.company.isActive) {
      return next(
        new CustomError(
          "Company account is deactivated",
          401,
          "COMPANY_DEACTIVATED_ERROR"
        )
      );
    }

    // Check company subscription status
    if (user.company.subscription.status !== "active") {
      return next(
        new CustomError(
          "Company subscription is not active",
          403,
          "SUBSCRIPTION_INACTIVE_ERROR"
        )
      );
    }

    // Check if department is active
    if (!user.department.isActive) {
      return next(
        new CustomError(
          "Department is deactivated",
          401,
          "DEPARTMENT_DEACTIVATED_ERROR"
        )
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    // Set cookies
    res.cookie("access_token", accessToken, getAccessTokenCookieOptions());
    res.cookie("refresh_token", refreshToken, getRefreshTokenCookieOptions());

    // Remove sensitive data from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: userResponse,
    });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
});

//@desc    Logout user and clear cookies
//@route   DELETE /api/auth/logout
//@access  Public
export const logoutUser = asyncHandler(async (req, res, next) => {
  try {
    // Clear cookies
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);
    next(error);
  }
});

//@desc    Get new access token using refresh token
//@route   GET /api/auth/refresh-token
//@access  Public
export const getRefreshToken = asyncHandler(async (req, res, next) => {
  try {
    // Extract refresh token from cookies
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      return next(
        new CustomError(
          "Refresh token is required",
          401,
          "MISSING_REFRESH_TOKEN_ERROR"
        )
      );
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    } catch (jwtError) {
      // Clear invalid refresh token cookie
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      if (jwtError.name === "TokenExpiredError") {
        return next(
          new CustomError(
            "Refresh token has expired",
            401,
            "REFRESH_TOKEN_EXPIRED_ERROR"
          )
        );
      } else if (jwtError.name === "JsonWebTokenError") {
        return next(
          new CustomError(
            "Invalid refresh token",
            401,
            "INVALID_REFRESH_TOKEN_ERROR"
          )
        );
      } else {
        return next(
          new CustomError(
            "Refresh token verification failed",
            401,
            "REFRESH_TOKEN_VERIFICATION_ERROR"
          )
        );
      }
    }

    // Fetch user data with company and department details
    const user = await User.findById(decoded.userId)
      .populate("company", "name isActive subscription.status")
      .populate("department", "name isActive")
      .select("-password");

    if (!user) {
      // Clear cookies if user not found
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return next(
        new CustomError("User not found", 401, "USER_NOT_FOUND_ERROR")
      );
    }

    // Check if user verified their email
    if (!user.isVerified) {
      // Clear cookies if user is not verified
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return next(
        new CustomError(
          "User account is not verified",
          401,
          "USER_NOT_VERIFIED_ERROR"
        )
      );
    }

    // Check if user is active
    if (!user.isActive) {
      // Clear cookies if user is deactivated
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return next(
        new CustomError(
          "User account is deactivated",
          401,
          "USER_DEACTIVATED_ERROR"
        )
      );
    }

    // Check if company is active
    if (!user.company.isActive) {
      // Clear cookies if company is deactivated
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return next(
        new CustomError(
          "Company account is deactivated",
          401,
          "COMPANY_DEACTIVATED_ERROR"
        )
      );
    }

    // Check company subscription status
    if (user.company.subscription.status !== "active") {
      // Clear cookies if company subscription is not active
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return next(
        new CustomError(
          "Company subscription is not active",
          403,
          "SUBSCRIPTION_INACTIVE_ERROR"
        )
      );
    }

    // Check if department is active
    if (!user.department.isActive) {
      // Clear cookies if department is deactivated
      res.clearCookie("refresh_token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
      });

      return next(
        new CustomError(
          "Department is deactivated",
          401,
          "DEPARTMENT_DEACTIVATED_ERROR"
        )
      );
    }

    // Generate new access token
    const newAccessToken = generateAccessToken(user._id);

    // Set new access token cookie
    res.cookie("access_token", newAccessToken, getAccessTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: user,
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    next(error);
  }
});

//@desc    Get current authenticated user
//@route   GET /api/auth/me
//@access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  try {
    // Get user ID from authenticated request
    const userId = req.user._id;

    // Fetch user with company and department details
    const user = await User.findById(userId)
      .populate("company", "name isActive subscription.status")
      .populate("department", "name isActive")
      .select("-password"); // Exclude password field

    if (!user) {
      return next(
        new CustomError("User not found", 404, "USER_NOT_FOUND_ERROR")
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return next(
        new CustomError(
          "User account is deactivated",
          401,
          "USER_DEACTIVATED_ERROR"
        )
      );
    }

    // Check if company is active
    if (!user.company.isActive) {
      return next(
        new CustomError(
          "Company account is deactivated",
          401,
          "COMPANY_DEACTIVATED_ERROR"
        )
      );
    }

    // Check company subscription status
    if (user.company.subscription.status !== "active") {
      return next(
        new CustomError(
          "Company subscription is not active",
          403,
          "SUBSCRIPTION_INACTIVE_ERROR"
        )
      );
    }

    // Check if department is active
    if (!user.department.isActive) {
      return next(
        new CustomError(
          "Department is deactivated",
          401,
          "DEPARTMENT_DEACTIVATED_ERROR"
        )
      );
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("GetMe error:", error);
    next(error);
  }
});
