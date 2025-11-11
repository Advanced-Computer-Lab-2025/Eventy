import path from "path";
import fs from "fs";

export class UploadController {
  async upload(req, res, next) {
    try {
      // Support both single-file uploads (req.file) and multi-field uploads (req.files)
      const files = req.files || (req.file ? { file: [req.file] } : {});

      if (!files || Object.keys(files).length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded. Provide files in multipart/form-data.",
        });
      }

      // Helpers for allowed types
      const allowedImageTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
        "image/svg+xml",
      ];
      const allowedTaxTypes = [...allowedImageTypes, "application/pdf"];

      const responseData = {};

      // Iterate through each field (e.g., taxCard, logo, file)
      for (const fieldName of Object.keys(files)) {
        const farr = files[fieldName];
        if (!Array.isArray(farr) || farr.length === 0) continue;
        const file = farr[0];

        // Determine validation set by field name
        const isLogo = fieldName.toLowerCase().includes("logo");
        const isTax =
          fieldName.toLowerCase().includes("tax") ||
          fieldName.toLowerCase().includes("card") ||
          fieldName === "file";

        const allowed = isTax ? allowedTaxTypes : allowedImageTypes;

        if (!allowed.includes(file.mimetype)) {
          // delete bad file
          if (file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          return res.status(400).json({
            success: false,
            message: `Invalid file type for ${fieldName}. Allowed: ${allowed.join(", ")}`,
          });
        }

        // Build public relative path and URL
        // multer saved the file under uploads/<...> as configured in route
        const relativePath = `/uploads/${path.basename(path.dirname(file.path))}/${path.basename(file.path)}`;
        const protocol = req.protocol;
        const host = req.get("host");
        const fullUrl = `${protocol}://${host}${relativePath}`;

        responseData[fieldName] = {
          url: fullUrl,
          filename: file.filename,
          mimetype: file.mimetype,
          size: file.size,
        };
      }

      res.status(200).json({
        success: true,
        message: "Files uploaded successfully",
        data: responseData,
      });
    } catch (error) {
      console.error("Error uploading file:", error);

      // Clean up file if it was uploaded but error occurred
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error("Error deleting file:", unlinkError);
        }
      }

      if (req.files) {
        try {
          for (const arr of Object.values(req.files)) {
            for (const f of arr) {
              if (f && f.path && fs.existsSync(f.path)) {
                fs.unlinkSync(f.path);
              }
            }
          }
        } catch (cleanupErr) {
          console.error("Error cleaning up files:", cleanupErr);
        }
      }

      next(error);
    }
  }
}
