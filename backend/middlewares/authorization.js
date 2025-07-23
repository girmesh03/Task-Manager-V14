// backend/middlewares/authorization.js
import CustomError from "../errorHandler/CustomError.js";
import { Department, User } from "../models/index.js";

/**
 * Authorization matrix implementation for multi-tenant SaaS platform
 * Roles: SuperAdmin, Admin, Manager, User
 * Admin and Manager have identical permissions (department-scoped)
 */

// Helper function to check if user has department-level permissions
const hasDepartmentAccess = (userRole) => {
  return ["Admin", "Manager"].includes(userRole);
};

// Helper function to check if user is SuperAdmin
const isSuperAdmin = (userRole) => {
  return userRole === "SuperAdmin";
};

/**
 * Company authorization middleware
 * Only SuperAdmin can modify company data
 */
export const authorizeCompanyAccess = (operations = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new CustomError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
      }

      const { user } = req;
      const operation = req.method.toLowerCase();

      // Check specific operations
      if (operations.includes("create") && operation === "post") {
        if (!isSuperAdmin(user.role)) {
          return next(new CustomError("Only SuperAdmins can create companies", 403, "INSUFFICIENT_PERMISSIONS"));
        }
      }

      if (operations.includes("update") && (operation === "put" || operation === "patch")) {
        if (!isSuperAdmin(user.role)) {
          return next(new CustomError("Only SuperAdmins can update company information", 403, "INSUFFICIENT_PERMISSIONS"));
        }
      }

      if (operations.includes("delete") && operation === "delete") {
        if (!isSuperAdmin(user.role)) {
          return next(new CustomError("Only SuperAdmins can delete companies", 403, "INSUFFICIENT_PERMISSIONS"));
        }
      }

      // All roles can read basic company info
      if (operations.includes("read") && operation === "get") {
        // All authenticated users within the company can read basic info
        return next();
      }

      next();
    } catch (error) {
      console.error("Company authorization error:", error);
      return next(new CustomError("Authorization error", 500, "AUTHORIZATION_ERROR"));
    }
  };
};

/**
 * Department authorization middleware
 */
export const authorizeDepartmentAccess = (operations = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new CustomError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
      }

      const { user } = req;
      const operation = req.method.toLowerCase();

      // SuperAdmin can access all departments within their company
      if (isSuperAdmin(user.role)) {
        return next();
      }

      // Extract department ID from request
      const departmentId = req.params.departmentId || req.body.department || req.query.department;

      // For create operations, only SuperAdmin can create departments
      if (operations.includes("create") && operation === "post") {
        return next(new CustomError("Only SuperAdmins can create departments", 403, "INSUFFICIENT_PERMISSIONS"));
      }

      // For update/delete operations, only SuperAdmin can modify departments
      if ((operations.includes("update") || operations.includes("delete")) && (operation === "put" || operation === "patch" || operation === "delete")) {
        return next(new CustomError("Only SuperAdmins can modify departments", 403, "INSUFFICIENT_PERMISSIONS"));
      }

      // For read operations, Admin/Manager/User can only access their own department
      if (operations.includes("read") && operation === "get") {
        if (departmentId && !user.department._id.equals(departmentId)) {
          return next(new CustomError("Access denied to department outside your scope", 403, "DEPARTMENT_ACCESS_DENIED"));
        }
      }

      next();
    } catch (error) {
      console.error("Department authorization error:", error);
      return next(new CustomError("Authorization error", 500, "AUTHORIZATION_ERROR"));
    }
  };
};

/**
 * User authorization middleware
 */
export const authorizeUserAccess = (operations = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new CustomError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
      }

      const { user } = req;
      const operation = req.method.toLowerCase();
      const targetUserId = req.params.userId || req.params.id;

      // SuperAdmin can access all users within their company
      if (isSuperAdmin(user.role)) {
        return next();
      }

      // Create operations - only SuperAdmin can create users
      if (operations.includes("create") && operation === "post") {
        return next(new CustomError("Only SuperAdmins can create users", 403, "INSUFFICIENT_PERMISSIONS"));
      }

      // Delete operations - only SuperAdmin can delete users
      if (operations.includes("delete") && operation === "delete") {
        return next(new CustomError("Only SuperAdmins can delete users", 403, "INSUFFICIENT_PERMISSIONS"));
      }

      // Read operations
      if (operations.includes("read") && operation === "get") {
        if (hasDepartmentAccess(user.role)) {
          // Admin/Manager can read users in their own department
          if (targetUserId) {
            const targetUser = await User.findById(targetUserId).populate("department");
            if (!targetUser || !targetUser.department._id.equals(user.department._id)) {
              return next(new CustomError("Access denied to user outside your department", 403, "USER_ACCESS_DENIED"));
            }
          }
        } else {
          // Users can only read their own profile
          if (targetUserId && !user._id.equals(targetUserId)) {
            return next(new CustomError("Users can only access their own profile", 403, "USER_ACCESS_DENIED"));
          }
        }
      }

      // Update operations
      if (operations.includes("update") && (operation === "put" || operation === "patch")) {
        // All roles can update their own profile
        if (targetUserId && user._id.equals(targetUserId)) {
          return next();
        }
        // Only SuperAdmin can update other users
        return next(new CustomError("You can only update your own profile", 403, "USER_ACCESS_DENIED"));
      }

      next();
    } catch (error) {
      console.error("User authorization error:", error);
      return next(new CustomError("Authorization error", 500, "AUTHORIZATION_ERROR"));
    }
  };
};

/**
 * Task authorization middleware (for all task types)
 */
export const authorizeTaskAccess = (operations = [], taskType = "Task") => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new CustomError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
      }

      const { user } = req;
      const operation = req.method.toLowerCase();

      // SuperAdmin can access all tasks within their company
      if (isSuperAdmin(user.role)) {
        return next();
      }

      // Extract task-related department info
      const departmentId = req.body.department || req.query.department;
      const taskId = req.params.taskId || req.params.id;

      // Create operations
      if (operations.includes("create") && operation === "post") {
        if (taskType === "AssignedTask" || taskType === "ProjectTask") {
          // Admin/Manager can create tasks in their own department
          if (hasDepartmentAccess(user.role)) {
            if (departmentId && !user.department._id.equals(departmentId)) {
              return next(new CustomError("Can only create tasks in your own department", 403, "TASK_ACCESS_DENIED"));
            }
          } else {
            return next(new CustomError("Users cannot create assigned or project tasks", 403, "TASK_ACCESS_DENIED"));
          }
        } else if (taskType === "RoutineTask") {
          // All roles can create routine tasks in their own department
          if (departmentId && !user.department._id.equals(departmentId)) {
            return next(new CustomError("Can only create routine tasks in your own department", 403, "TASK_ACCESS_DENIED"));
          }
        }
      }

      // Read operations
      if (operations.includes("read") && operation === "get") {
        if (taskType === "AssignedTask") {
          // Users can only read tasks assigned to them
          // Admin/Manager can read all tasks in their department
          // This will be handled in the controller with proper filtering
        } else if (taskType === "ProjectTask") {
          // Users cannot read project tasks
          if (user.role === "User") {
            return next(new CustomError("Users cannot access project tasks", 403, "TASK_ACCESS_DENIED"));
          }
        } else if (taskType === "RoutineTask") {
          // All roles can read routine tasks in their own department
        }
      }

      // Update operations
      if (operations.includes("update") && (operation === "put" || operation === "patch")) {
        if (taskType === "AssignedTask" || taskType === "ProjectTask") {
          // Admin/Manager can update tasks in their own department
          if (hasDepartmentAccess(user.role)) {
            // Department check will be handled in controller
          } else {
            return next(new CustomError("Users cannot update assigned or project tasks directly", 403, "TASK_ACCESS_DENIED"));
          }
        } else if (taskType === "RoutineTask") {
          // All roles can update routine tasks in their own department
        }
      }

      // Delete operations
      if (operations.includes("delete") && operation === "delete") {
        if (taskType === "AssignedTask" || taskType === "ProjectTask") {
          // Admin/Manager can delete tasks in their own department
          if (hasDepartmentAccess(user.role)) {
            // Department check will be handled in controller
          } else {
            return next(new CustomError("Users cannot delete assigned or project tasks", 403, "TASK_ACCESS_DENIED"));
          }
        } else if (taskType === "RoutineTask") {
          // All roles can delete routine tasks in their own department
        }
      }

      next();
    } catch (error) {
      console.error("Task authorization error:", error);
      return next(new CustomError("Authorization error", 500, "AUTHORIZATION_ERROR"));
    }
  };
};

/**
 * TaskActivity authorization middleware
 */
export const authorizeTaskActivityAccess = (operations = []) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new CustomError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
      }

      const { user } = req;
      const operation = req.method.toLowerCase();

      // SuperAdmin can access all task activities within their company
      if (isSuperAdmin(user.role)) {
        return next();
      }

      // For all operations, the task must belong to user's department
      // Additional logic will be handled in controllers to check if:
      // - Admin/Manager: can access activities for tasks in their department
      // - User: can only access activities for tasks assigned to them

      next();
    } catch (error) {
      console.error("TaskActivity authorization error:", error);
      return next(new CustomError("Authorization error", 500, "AUTHORIZATION_ERROR"));
    }
  };
};

/**
 * Notification authorization middleware
 */
export const authorizeNotificationAccess = (operations = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new CustomError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
      }

      const { user } = req;
      const operation = req.method.toLowerCase();

      // SuperAdmin can read all notifications
      if (isSuperAdmin(user.role) && operations.includes("read") && operation === "get") {
        return next();
      }

      // Create operations are system-only (handled by backend logic)
      if (operations.includes("create") && operation === "post") {
        return next(new CustomError("Notifications are created by the system only", 403, "NOTIFICATION_ACCESS_DENIED"));
      }

      // Read, Update, Delete operations - users can only access their own notifications
      // This will be enforced in the controller by filtering by user ID

      next();
    } catch (error) {
      console.error("Notification authorization error:", error);
      return next(new CustomError("Authorization error", 500, "AUTHORIZATION_ERROR"));
    }
  };
};

/**
 * Generic role-based authorization middleware
 */
export const authorizeRoles = (allowedRoles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return next(new CustomError("Authentication required", 401, "AUTHENTICATION_REQUIRED"));
      }

      if (!allowedRoles.includes(req.user.role)) {
        return next(new CustomError(`Access denied. Required roles: ${allowedRoles.join(", ")}`, 403, "INSUFFICIENT_PERMISSIONS"));
      }

      next();
    } catch (error) {
      console.error("Role authorization error:", error);
      return next(new CustomError("Authorization error", 500, "AUTHORIZATION_ERROR"));
    }
  };
};
