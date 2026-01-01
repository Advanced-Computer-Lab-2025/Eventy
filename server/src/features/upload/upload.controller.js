import logger from "../../utils/logger.js";
import path from "path";
import fs from "fs";
import { put } from "@vercel/blob";

export class UploadController {
  async upload(req, res, next) {
    try {
      // Check if file is provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Please provide a file in the request.",
        });
      }

      const file = req.file;

      // Validate file type (images only)
      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        // Delete the uploaded file if it's an invalid type
        if (file.path) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({
          success: false,
          message:
            "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
        });
      }

      let fileUrl;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const fileBuffer = fs.readFileSync(file.path);
        const { url } = await put(`id-cards/${file.filename}`, fileBuffer, {
          access: "public",
          contentType: file.mimetype,
        });

        fileUrl = url;

        // Remove the temporary local file after uploading to Blob
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          logger.error("Error deleting temp file:", unlinkError);
        }
      } else {
        // Fallback: keep local URL for non-Vercel/local development
        const relativePath = `/uploads/id-cards/${path.basename(file.path)}`;
        const protocol = req.protocol;
        const host = req.get("host");
        fileUrl = `${protocol}://${host}${relativePath}`;
      }

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: fileUrl,
          filename: file.filename,
        },
      });
    } catch (error) {
      logger.error("Error uploading file:", error);

      // Clean up file if it was uploaded but error occurred
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error("Error deleting file:", unlinkError);
        }
      }

      next(error);
    }
  }

  async uploadVendorDocument(req, res, next) {
    try {
      // Check if file is provided
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded. Please provide a file in the request.",
        });
      }

      const file = req.file;

      // Validate file type (images and PDFs for vendor documents)
      const allowedMimeTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "application/pdf",
      ];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        // Delete the uploaded file if it's an invalid type
        if (file.path) {
          fs.unlinkSync(file.path);
        }
        return res.status(400).json({
          success: false,
          message:
            "Invalid file type. Only JPEG, PNG, WebP images, and PDF files are allowed.",
        });
      }

      let fileUrl;

      if (process.env.BLOB_READ_WRITE_TOKEN) {
        const fileBuffer = fs.readFileSync(file.path);
        const { url } = await put(
          `vendor-documents/${file.filename}`,
          fileBuffer,
          {
            access: "public",
            contentType: file.mimetype,
          }
        );

        fileUrl = url;

        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          logger.error("Error deleting temp file:", unlinkError);
        }
      } else {
        const relativePath = `/uploads/vendor-documents/${path.basename(file.path)}`;
        const protocol = req.protocol;
        const host = req.get("host");
        fileUrl = `${protocol}://${host}${relativePath}`;
      }

      res.status(200).json({
        success: true,
        message: "Vendor document uploaded successfully",
        data: {
          url: fileUrl,
          filename: file.filename,
        },
      });
    } catch (error) {
      logger.error("Error uploading vendor document:", error);

      // Clean up file if it was uploaded but error occurred
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          logger.error("Error deleting file:", unlinkError);
        }
      }

      next(error);
    }
  }
}
