// backend/middlewares/validation.js
import { body, param, query, validationResult } from "express-validator";
import mongoose from "mongoose";
import CustomError from "../errorHandler/CustomError.js";

// Generic validation error handler
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    return next(new CustomError("Validation failed", 400, "VALIDATION_ERROR", errorMessages));
  }
  next();
};

// MongoDB ObjectId validation
export const validateObjectId = (field = "id") => {
  return param(field)
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error(`Invalid ${field} format`);
      }
      return true;
    });
};

// Company validation rules
export const validateCompanyCreation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone")
    .matches(/^(09\d{8}|\+2519\d{8})$/)
    .withMessage("Invalid phone number format for Ethiopia"),
  body("address")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Address must be between 2 and 100 characters"),
  body("size")
    .notEmpty()
    .withMessage("Company size is required"),
  body("industry")
    .notEmpty()
    .withMessage("Company industry is required"),
  body("logo")
    .optional()
    .isURL()
    .withMessage("Logo must be a valid URL"),
  handleValidationErrors
];

export const validateCompanyUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Company name must be between 2 and 100 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("phone")
    .optional()
    .matches(/^(09\d{8}|\+2519\d{8})$/)
    .withMessage("Invalid phone number format for Ethiopia"),
  body("address")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Address must be between 2 and 100 characters"),
  body("size")
    .optional()
    .notEmpty()
    .withMessage("Company size cannot be empty"),
  body("industry")
    .optional()
    .notEmpty()
    .withMessage("Company industry cannot be empty"),
  body("logo")
    .optional()
    .isURL()
    .withMessage("Logo must be a valid URL"),
  body("subscription.plan")
    .optional()
    .isIn(["basic", "premium", "enterprise"])
    .withMessage("Invalid subscription plan"),
  body("subscription.status")
    .optional()
    .isIn(["active", "inactive", "suspended"])
    .withMessage("Invalid subscription status"),
  handleValidationErrors
];

// Department validation rules
export const validateDepartmentCreation = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Department name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("managers")
    .optional()
    .isArray()
    .withMessage("Managers must be an array"),
  body("managers.*")
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid manager ID format");
      }
      return true;
    }),
  handleValidationErrors
];

export const validateDepartmentUpdate = [
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Department name must be between 2 and 50 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("managers")
    .optional()
    .isArray()
    .withMessage("Managers must be an array"),
  body("managers.*")
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid manager ID format");
      }
      return true;
    }),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors
];

// User validation rules
export const validateUserCreation = [
  body("firstName")
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(["SuperAdmin", "Admin", "Manager", "User"])
    .withMessage("Invalid role specified"),
  body("position")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Position cannot exceed 50 characters"),
  body("department")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid department ID format");
      }
      return true;
    }),
  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),
  body("skills.*")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Each skill cannot exceed 30 characters"),
  handleValidationErrors
];

export const validateUserUpdate = [
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("First name must be between 2 and 30 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage("Last name must be between 2 and 30 characters"),
  body("email")
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage("Valid email is required"),
  body("role")
    .optional()
    .isIn(["SuperAdmin", "Admin", "Manager", "User"])
    .withMessage("Invalid role specified"),
  body("position")
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage("Position cannot exceed 50 characters"),
  body("department")
    .optional()
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid department ID format");
      }
      return true;
    }),
  body("skills")
    .optional()
    .isArray()
    .withMessage("Skills must be an array"),
  body("skills.*")
    .optional()
    .trim()
    .isLength({ max: 30 })
    .withMessage("Each skill cannot exceed 30 characters"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  handleValidationErrors
];

// Task validation rules
export const validateTaskCreation = [
  body("title")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Task title must be between 2 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("Task description must be between 2 and 500 characters"),
  body("location")
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Task location must be between 2 and 100 characters"),
  body("dueDate")
    .isISO8601()
    .withMessage("Valid due date is required"),
  body("priority")
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("department")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid department ID format");
      }
      return true;
    }),
  handleValidationErrors
];

export const validateTaskUpdate = [
  body("title")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Task title must be between 2 and 100 characters"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 2, max: 500 })
    .withMessage("Task description must be between 2 and 500 characters"),
  body("location")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Task location must be between 2 and 100 characters"),
  body("dueDate")
    .optional()
    .isISO8601()
    .withMessage("Valid due date is required"),
  body("priority")
    .optional()
    .isIn(["Low", "Medium", "High"])
    .withMessage("Priority must be Low, Medium, or High"),
  body("status")
    .optional()
    .isIn(["To Do", "In Progress", "Completed", "Pending"])
    .withMessage("Invalid status specified"),
  handleValidationErrors
];

// AssignedTask validation rules
export const validateAssignedTaskCreation = [
  ...validateTaskCreation,
  body("assignedTo")
    .isArray({ min: 1 })
    .withMessage("At least one user must be assigned"),
  body("assignedTo.*")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid assigned user ID format");
      }
      return true;
    }),
];

// ProjectTask validation rules
export const validateProjectTaskCreation = [
  ...validateTaskCreation,
  body("clientInfo.name")
    .trim()
    .notEmpty()
    .withMessage("Client name is required"),
  body("clientInfo.phone")
    .matches(/^(09\d{8}|\+2519\d{8})$/)
    .withMessage("Invalid phone number format for Ethiopia"),
  body("clientInfo.address")
    .optional()
    .trim(),
];

// RoutineTask validation rules
export const validateRoutineTaskCreation = [
  body("department")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid department ID format");
      }
      return true;
    }),
  body("performedTasks")
    .isArray({ min: 1 })
    .withMessage("At least one performed task is required"),
  body("performedTasks.*.description")
    .trim()
    .notEmpty()
    .withMessage("Task description is required"),
  body("performedTasks.*.isCompleted")
    .optional()
    .isBoolean()
    .withMessage("isCompleted must be a boolean"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Valid date is required"),
  handleValidationErrors
];

// TaskActivity validation rules
export const validateTaskActivityCreation = [
  body("task")
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error("Invalid task ID format");
      }
      return true;
    }),
  body("description")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("Description must be between 1 and 200 characters"),
  body("statusChange.to")
    .isIn(["To Do", "In Progress", "Completed", "Pending"])
    .withMessage("Invalid status specified"),
  handleValidationErrors
];

// Notification validation rules
export const validateNotificationUpdate = [
  body("isRead")
    .optional()
    .isBoolean()
    .withMessage("isRead must be a boolean"),
  handleValidationErrors
];

// Query validation for pagination and filtering
export const validatePaginationQuery = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  query("sort")
    .optional()
    .isString()
    .withMessage("Sort must be a string"),
  query("search")
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage("Search term cannot exceed 100 characters"),
  handleValidationErrors
];
