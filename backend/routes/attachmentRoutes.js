// backend/routes/attachmentRoutes.js
import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import rateLimiter from "../middlewares/rateLimiter.js";
import { generateSignature, registerAttachment } from "../controllers/attachmentController.js";

const router = express.Router();

// Generate Cloudinary upload signature
router.post("/signature", verifyJWT, rateLimiter, generateSignature);

// Register attachment metadata on a RoutineTask or TaskActivity
router.post("/register", verifyJWT, rateLimiter, registerAttachment);

export default router;
