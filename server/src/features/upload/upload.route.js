import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UploadController } from "./upload.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();
const uploadController = new UploadController();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), "uploads", "id-cards");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer to save files to disk
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-randomSuffix.extension
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomSuffix}${fileExtension}`;
    cb(null, filename);
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    // Additional validation can be done here if needed
    // The main validation is done in the controller
    cb(null, true);
  },
});

/**
 * @route   POST /api/upload
 * @desc    Upload an ID card image file to local storage
 * @access  Authenticated users
 * @body    multipart/form-data with 'file' field containing the image file
 * @returns { url: string } - The public URL of the uploaded file
 */
router.post(
  "/",
  authMiddleware,
  (req, res, next) => {
    upload.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 5MB.",
          });
        }
        if (err.message === "Field name missing") {
          return res.status(400).json({
            success: false,
            message: "Field name 'file' is required. Please set the form-data key to 'file'.",
          });
        }
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  uploadController.upload.bind(uploadController)
);

export default router;

