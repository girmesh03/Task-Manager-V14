// backend/controllers/attachmentController.js
import asyncHandler from "express-async-handler";
import CustomError from "../errorHandler/CustomError.js";
import { getCloudinaryConfig, signUploadParams } from "../config/cloudinary.js";
import RoutineTask from "../models/RoutineTask.js";
import TaskActivity from "../models/TaskActivity.js";
import Task from "../models/Task.js";

// POST /api/attachments/signature
// Body: { folder?: string, public_id?: string, tags?: string[] | string, resource_type?: 'image'|'video'|'raw', context?: object }
export const generateSignature = asyncHandler(async (req, res, next) => {
  try {
    const { folder = "", public_id = "", tags, resource_type = "image", context } = req.body || {};

    const allowedTypes = ["image", "video", "raw", "auto"];
    if (!allowedTypes.includes(resource_type)) {
      return next(new CustomError("Invalid resource_type for upload", 400, "VALIDATION_ERROR"));
    }

    const timestamp = Math.floor(Date.now() / 1000);

    // Construct params that the client will send to Cloudinary
    const paramsToSign = {
      timestamp,
      folder,
      public_id,
      resource_type,
    };

    if (tags && (Array.isArray(tags) ? tags.length > 0 : typeof tags === "string")) {
      paramsToSign.tags = Array.isArray(tags) ? tags.join(",") : tags;
    }

    // Flatten context into context[key]=value comma-joined per Cloudinary docs if needed
    if (context && typeof context === "object") {
      const ctxPairs = Object.entries(context)
        .filter(([k, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}=${v}`);
      if (ctxPairs.length) paramsToSign.context = ctxPairs.join("|");
    }

    const signature = signUploadParams(paramsToSign);
    const { cloudName, apiKey } = getCloudinaryConfig();

    return res.status(200).json({
      success: true,
      message: "Signature generated successfully",
      data: { timestamp, signature, cloudName, apiKey, folder, public_id, resource_type, tags: paramsToSign.tags || null, context: paramsToSign.context || null },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /api/attachments/register
// Body: { parentType: 'routine' | 'activity', parentId: string, attachments: [{ url, public_id, type?: 'image'|'video'|'pdf' }] }
export const registerAttachment = asyncHandler(async (req, res, next) => {
  const { parentType, parentId, attachments } = req.body || {};

  if (!parentType || !parentId || !Array.isArray(attachments) || attachments.length === 0) {
    return next(new CustomError("parentType, parentId and attachments are required", 400, "VALIDATION_ERROR"));
  }

  const normalized = attachments.map((a) => ({
    url: a.url,
    public_id: a.public_id,
    type: a.type && ["image", "video", "pdf"].includes(a.type) ? a.type : "image",
    uploadedAt: new Date(),
  }));

  if (parentType === "routine") {
    const updated = await RoutineTask.findOneAndUpdate(
      { _id: parentId, company: req.user.company._id },
      { $push: { attachments: { $each: normalized } } },
      { new: true }
    );
    if (!updated) {
      return next(new CustomError("RoutineTask not found or access denied", 404, "NOT_FOUND_ERROR"));
    }
    return res.status(200).json({ success: true, message: "Attachments registered", data: { count: normalized.length } });
  }

  if (parentType === "activity") {
    const activity = await TaskActivity.findById(parentId);
    if (!activity) return next(new CustomError("TaskActivity not found", 404, "NOT_FOUND_ERROR"));

    const task = await Task.findById(activity.task);
    if (!task) return next(new CustomError("Parent Task not found", 404, "NOT_FOUND_ERROR"));

    if (!task.company.equals(req.user.company._id)) {
      return next(new CustomError("Access denied to different company resource", 403, "AUTHORIZATION_ERROR"));
    }

    activity.attachments.push(...normalized);
    await activity.save();

    return res.status(200).json({ success: true, message: "Attachments registered", data: { count: normalized.length } });
  }

  return next(new CustomError("Unsupported parentType", 400, "VALIDATION_ERROR"));
});
