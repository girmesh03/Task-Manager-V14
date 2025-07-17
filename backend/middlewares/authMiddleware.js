// backend/middlewares/authMiddleware.js
import jwt from "jsonwebtoken";
import { User, Department } from "../models/index.js";
import CustomError from "../errorHandler/CustomError.js";

export const verifyJWT = async (req, res, next) => {
  try {
    // Extract token from cookies
    const token = req.cookies?.access_token;

    if (!token) {
      return next(
        new CustomError(
          "Access token is required",
          401,
          "UNAUTHORIZED_TOKEN_ERROR"
        )
      );
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    } catch (jwtError) {
      if (jwtError.name === "TokenExpiredError") {
        return next(
          new CustomError(
            "Access token has expired",
            401,
            "TOKEN_EXPIRED_ERROR"
          )
        );
      } else if (jwtError.name === "JsonWebTokenError") {
        return next(
          new CustomError("Invalid access token", 401, "INVALID_TOKEN_ERROR")
        );
      } else {
        return next(
          new CustomError(
            "Token verification failed",
            401,
            "TOKEN_VERIFICATION_FAILED_ERROR"
          )
        );
      }
    }

    // Fetch user data with company and department details
    const user = await User.findById(decoded.userId)
      .populate("company", "name subscription.status isActive")
      .populate("department", "name isActive");

    if (!user) {
      return next(new CustomError("User not found", 401, "USER_NOT_FOUND"));
    }

    // Check if user is verified
    if (!user.isVerified) {
      return next(
        new CustomError(
          "User account is not verified",
          401,
          "ACCOUNT_NOT_VERIFIED_ERROR"
        )
      );
    }

    // Check if user is active
    if (!user.isActive) {
      return next(
        new CustomError("User account is deactivated", 401, "USER_DEACTIVATED")
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

    // Attach user data to request
    req.user = user;
    next();
  } catch (error) {
    console.error("JWT verification error:", error);
    return next(
      new CustomError(
        "Internal server error during authentication",
        500,
        "AUTHENTICATION_ERROR"
      )
    );
  }
};

/**
 * Authorize user roles
 * @param {Array} allowedRoles - Array of allowed roles
 */
export const authorizeRoles = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(
          new CustomError(
            "Authentication required",
            401,
            "AUTHENTICATION_REQUIRED_ERROR"
          )
        );
      }

      if (!allowedRoles.includes(req.user.role)) {
        return next(
          new CustomError(
            `Access denied. Required roles: ${allowedRoles.join(", ")}`,
            403,
            "INSUFFICIENT_PERMISSIONS_ERROR"
          )
        );
      }

      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return next(
        new CustomError(
          "Internal server error during role authorization",
          500,
          "AUTHORIZATION_ERROR"
        )
      );
    }
  };
};

/**
 * Verify department access for resources
 * SuperAdmin can access all departments within their company
 */
export const verifyDepartmentAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new CustomError(
          "Authentication required",
          401,
          "AUTHENTICATION_REQUIRED_ERROR"
        )
      );
    }

    // SuperAdmin can access all departments within their company
    if (req.user.role === "SuperAdmin") {
      return next();
    }

    // Extract department ID from various sources
    let resourceDepartmentId = null;

    // Check request parameters
    if (req.params.departmentId) {
      resourceDepartmentId = req.params.departmentId;
    }

    // Check request body
    if (req.body.department) {
      resourceDepartmentId = req.body.department;
    }

    // Check query parameters
    if (req.query.department) {
      resourceDepartmentId = req.query.department;
    }

    // If no department specified in request, allow access (will be handled by business logic)
    if (!resourceDepartmentId) {
      return next();
    }

    // Validate department exists and belongs to user's company
    const department = await Department.findById(resourceDepartmentId);

    if (!department) {
      return next(
        new CustomError(
          "Department not found",
          404,
          "DEPARTMENT_NOT_FOUND_ERROR"
        )
      );
    }

    // Check if department belongs to user's company
    if (!department.company.equals(req.user.company._id)) {
      return next(
        new CustomError(
          "Access denied to department from different company",
          403,
          "CROSS_COMPANY_ACCESS_DENIED_ERROR"
        )
      );
    }

    // Check if user has access to this department
    // Managers can access their own department
    // Users can only access their own department
    if (req.user.role === "Manager") {
      // Managers can access their own department or departments they manage
      const managedDepartments = await Department.find({
        company: req.user.company._id,
        managers: { $in: [req.user._id] },
      });

      const canAccess =
        req.user.department._id.equals(resourceDepartmentId) ||
        managedDepartments.some((dept) =>
          dept._id.equals(resourceDepartmentId)
        );

      if (!canAccess) {
        return next(
          new CustomError(
            "Access denied to this department",
            403,
            "DEPARTMENT_ACCESS_DENIED_ERROR"
          )
        );
      }
    } else if (req.user.role === "User") {
      // Users can only access their own department
      if (!req.user.department._id.equals(resourceDepartmentId)) {
        return next(
          new CustomError(
            "Access denied to department outside your scope",
            403,
            "DEPARTMENT_ACCESS_DENIED_ERROR"
          )
        );
      }
    }

    // Attach department to request for use in controllers
    req.resourceDepartment = department;
    next();
  } catch (error) {
    console.error("Department access verification error:", error);
    return next(
      new CustomError(
        "Internal server error during department access verification",
        500,
        "DEPARTMENT_ACCESS_ERROR"
      )
    );
  }
};

/**
 * Verify company access for resources
 * Ensures all operations are within user's company scope
 */
export const verifyCompanyAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(
        new CustomError(
          "Authentication required",
          401,
          "AUTHENTICATION_REQUIRED_ERROR"
        )
      );
    }

    // Extract company ID from various sources
    let resourceCompanyId = null;

    if (req.params.companyId) {
      resourceCompanyId = req.params.companyId;
    }

    if (req.body.company) {
      resourceCompanyId = req.body.company;
    }

    if (req.query.company) {
      resourceCompanyId = req.query.company;
    }

    // If no company specified, use user's company
    if (!resourceCompanyId) {
      req.body.company = req.user.company._id;
      return next();
    }

    // Verify company access
    if (!req.user.company._id.equals(resourceCompanyId)) {
      return next(
        new CustomError(
          "Access denied to resources from different company",
          403,
          "COMPANY_ACCESS_DENIED_ERROR"
        )
      );
    }

    next();
  } catch (error) {
    console.error("Company access verification error:", error);
    return next(
      new CustomError(
        "Internal server error during company access verification",
        500,
        "COMPANY_ACCESS_ERROR"
      )
    );
  }
};
