// backend/routes/companyRoutes.js
import express from "express";
import {
  getCompany,
  getMyCompany,
  createCompany,
  updateCompany,
  updateCompanySubscription,
  deactivateCompany,
  activateCompany,
  deleteCompany,
  getCompanyStats
} from "../controllers/companyController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import { authorizeCompanyAccess } from "../middlewares/authorization.js";
import {
  validateCompanyCreation,
  validateCompanyUpdate,
  validateObjectId,
  handleValidationErrors
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all routes
router.use(verifyJWT);

/**
 * @route   GET /api/companies/my-company
 * @desc    Get current user's company
 * @access  Private (All roles)
 */
router.get("/my-company", getMyCompany);

/**
 * @route   POST /api/companies
 * @desc    Create new company (Onboarding only)
 * @access  Private (SuperAdmin only)
 */
router.post(
  "/",
  authorizeCompanyAccess(["create"]),
  validateCompanyCreation,
  createCompany
);

/**
 * @route   GET /api/companies/:id
 * @desc    Get company information
 * @access  Private (All roles - own company only)
 */
router.get(
  "/:id",
  validateObjectId("id"),
  authorizeCompanyAccess(["read"]),
  getCompany
);

/**
 * @route   PUT /api/companies/:id
 * @desc    Update company information
 * @access  Private (SuperAdmin only)
 */
router.put(
  "/:id",
  validateObjectId("id"),
  authorizeCompanyAccess(["update"]),
  validateCompanyUpdate,
  updateCompany
);

/**
 * @route   PUT /api/companies/:id/subscription
 * @desc    Update company subscription
 * @access  Private (SuperAdmin only)
 */
router.put(
  "/:id/subscription",
  validateObjectId("id"),
  authorizeCompanyAccess(["update"]),
  updateCompanySubscription
);

/**
 * @route   PUT /api/companies/:id/deactivate
 * @desc    Deactivate company
 * @access  Private (SuperAdmin only)
 */
router.put(
  "/:id/deactivate",
  validateObjectId("id"),
  authorizeCompanyAccess(["update"]),
  deactivateCompany
);

/**
 * @route   PUT /api/companies/:id/activate
 * @desc    Reactivate company
 * @access  Private (SuperAdmin only)
 */
router.put(
  "/:id/activate",
  validateObjectId("id"),
  authorizeCompanyAccess(["update"]),
  activateCompany
);

/**
 * @route   DELETE /api/companies/:id
 * @desc    Delete company (Permanent deletion)
 * @access  Private (SuperAdmin only)
 */
router.delete(
  "/:id",
  validateObjectId("id"),
  authorizeCompanyAccess(["delete"]),
  deleteCompany
);

/**
 * @route   GET /api/companies/:id/stats
 * @desc    Get company statistics
 * @access  Private (All roles - own company only)
 */
router.get(
  "/:id/stats",
  validateObjectId("id"),
  authorizeCompanyAccess(["read"]),
  getCompanyStats
);

export default router;
