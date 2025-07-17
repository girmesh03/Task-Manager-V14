// backend/routes/authRoutes.js
import express from "express";

import {
  registerUser,
  loginUser,
  logoutUser,
  getRefreshToken,
} from "../controllers/authController.js";

import rateLimiter from "../middlewares/rateLimiter.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user and create a company
// @access  Public
router.route("/register").post(rateLimiter, registerUser);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.route("/login").post(rateLimiter, loginUser);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.route("/logout").delete(verifyJWT, logoutUser);

// @route   GET /api/auth/refresh-token
// @desc    Get new access token using refresh token
// @access  Private
router.route("/refresh-token").get(getRefreshToken);

export default router;
