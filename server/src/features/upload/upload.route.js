import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import os from "os";
import { UploadController } from "./upload.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();
const uploadController = new UploadController();

// Ensure uploads directory exists
const isVercel = !!process.env.BLOB_READ_WRITE_TOKEN;
const uploadsDir = isVercel
  ? os.tmpdir()
  : path.join(process.cwd(), "uploads", "id-cards");

if (!isVercel && !fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Ensure vendor documents directory exists
const vendorDocsDir = isVercel
  ? os.tmpdir()
  : path.join(process.cwd(), "uploads", "vendor-documents");

if (!isVercel && !fs.existsSync(vendorDocsDir)) {
  fs.mkdirSync(vendorDocsDir, { recursive: true });
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

// Configure multer for vendor documents
const vendorStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, vendorDocsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const fileExtension = path.extname(file.originalname);
    const filename = `${timestamp}-${randomSuffix}${fileExtension}`;
    cb(null, filename);
  },
});

const uploadVendorDoc = multer({
  storage: vendorStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for vendor documents
  },
  fileFilter: function (req, file, cb) {
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
            message:
              "Field name 'file' is required. Please set the form-data key to 'file'.",
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

/**
 * @route   POST /api/upload/vendor-document
 * @desc    Upload vendor documents (tax card, logo) to local storage
 * @access  Public (no auth required during signup)
 * @body    multipart/form-data with 'file' field containing the document file
 * @returns { url: string } - The public URL of the uploaded file
 */
router.post(
  "/vendor-document",
  (req, res, next) => {
    uploadVendorDoc.single("file")(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum size is 10MB.",
          });
        }
        if (err.message === "Field name missing") {
          return res.status(400).json({
            success: false,
            message:
              "Field name 'file' is required. Please set the form-data key to 'file'.",
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
  uploadController.uploadVendorDocument.bind(uploadController)
);

export default router;
