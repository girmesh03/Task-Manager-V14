// backend/controllers/authController.js
import mongoose from "mongoose";
import asyncHandler from "express-async-handler";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { User, Company, Department } from "../models/index.js";
import {
  generateAccessToken,
  generateRefreshToken,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
} from "../utils/GenerateTokens.js";

// @desc    Register a new company and associate department and super admin user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req, res, next) => {
  res.status(200).json({ message: "Register endpoint" });
});
