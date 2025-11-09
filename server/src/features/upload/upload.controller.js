import path from "path";
import fs from "fs";

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

      // Generate the public URL for the uploaded file
      // The file is already saved to disk by multer
      const relativePath = `/uploads/id-cards/${path.basename(file.path)}`;

      // Construct full URL (optional - can be used if frontend and backend are on different origins)
      const protocol = req.protocol;
      const host = req.get("host");
      const fullUrl = `${protocol}://${host}${relativePath}`;

      // Return full URL (you can change this to relativePath if preferred)
      const fileUrl = fullUrl;

      res.status(200).json({
        success: true,
        message: "File uploaded successfully",
        data: {
          url: fileUrl,
          filename: file.filename,
        },
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

      next(error);
    }
  }
}
