import { ApplicationService } from "./application.service.js";

export class ApplicationController {
  async applyToBazaar(req, res, next) {
    try {
      // Get the vendor's ID from the mock auth middleware.
      // Your real auth middleware should also provide req.user._id.
      const vendorId = req.user._id;

      const applicationDetails = {
        ...req.body,
        vendorId,
      };

      const newApplication = await ApplicationService.createApplication(
        applicationDetails
      );

      res.status(201).json({
        success: true,
        message: "Application submitted successfully!",
        data: newApplication,
      });
    } catch (error) {
      // Pass any errors from the service to the centralized errorMiddleware
      next(error);
    }
  }
}
