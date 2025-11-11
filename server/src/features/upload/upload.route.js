import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { UploadController } from "./upload.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";

const router = express.Router();
const uploadController = new UploadController();

// Ensure uploads directories exist and configure multer storage that
// puts files into subfolders based on the fieldname (for vendor files
// we use 'tax-cards' and 'vendor-logos').
const baseUploads = path.join(process.cwd(), "uploads");
const idCardsDir = path.join(baseUploads, "id-cards");
const taxCardsDir = path.join(baseUploads, "tax-cards");
const vendorLogosDir = path.join(baseUploads, "vendor-logos");

[idCardsDir, taxCardsDir, vendorLogosDir].forEach((d) => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

// Configure multer to save files to disk. Destination is chosen by fieldname.
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const fname = (file.fieldname || "").toLowerCase();
    if (fname.includes("tax") || fname.includes("card"))
      return cb(null, taxCardsDir);
    if (fname.includes("logo")) return cb(null, vendorLogosDir);
    // default to id-cards for legacy single-file uploads
    return cb(null, idCardsDir);
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
    fileSize: 10 * 1024 * 1024, // 10MB limit for tax card (pdf) and logo
  },
  fileFilter: function (req, file, cb) {
    // Allow all and validate more specifically in controller
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
// Uploads require authentication now. Vendors should signup/login first and then
// upload files using a bearer token.
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
 * POST /api/upload/vendor-docs
 * Accepts multipart/form-data with fields:
 * - taxCard: single file (image or PDF)
 * - logo: single file (image)
 * Returns a JSON map of uploaded field -> url/metadata
 * Requires authentication (bearer token). the token i used eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MTI3OWViZmM2OTZhY2JmMDU5ZDhjMSIsInJvbGUiOiJ2ZW5kb3IiLCJlbWFpbCI6InZlbmRvcjFAZXhhbXBsZS5jb20iLCJpYXQiOjE3NjI4MTg1OTMsImV4cCI6MTc2NTQxMDU5M30.hdHy73IzGEaUzz0EIDwZOZjsC5qChTvKsadSZL4fe90
 */
router.post(
  "/vendor-docs",
  authMiddleware,
  (req, res, next) => {
    upload.fields([
      { name: "taxCard", maxCount: 1 },
      { name: "logo", maxCount: 1 },
    ])(req, res, (err) => {
      if (err) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res
            .status(400)
            .json({ success: false, message: "File too large. Max is 10MB." });
        }
        return res
          .status(400)
          .json({
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
