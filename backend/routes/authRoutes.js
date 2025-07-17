// backend/routes/authRoutes.js
import express from "express";

import { registerUser } from "../controllers/authController.js";

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user and create a company
// @access  Public
router.route("/register").post(registerUser);

export default router;
