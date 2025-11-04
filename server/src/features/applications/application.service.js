// features/applications/application.service.js

import mongoose from "mongoose";
import Application from "./application.model.js";
import { Transaction } from "../transactions/transaction.model.js";

class ApplicationServiceClass {
  /**
   * Creates a new application in the database.
   * @param {object} applicationData - The data for the new application.
   * @returns {Promise<Document>} The saved application document.
   */
  async createApplication(applicationData) {
    try {
      // For bazaar applications, check for duplicate applications
      if (applicationData.type === "bazaar") {
        await this.validateBazaarApplicationUniqueness(applicationData);
      }
      
      // For booth applications, validate booth availability
      if (applicationData.type === "booth") {
        await this.validateBoothAvailability(applicationData);
      }

      const newApplication = new Application(applicationData);
      await newApplication.save();
      return newApplication;
    } catch (error) {
      // For booth availability errors, pass the original message directly
      if (applicationData.type === "booth" && error.message.includes("already reserved")) {
        throw error; // Pass the original error with the clean message
      }
      // For bazaar duplicate application errors, pass the original message directly
      if (applicationData.type === "bazaar" && error.message.includes("already applied")) {
        throw error; // Pass the original error with the clean message
      }
      // For other errors, wrap with context
      throw new Error(`Could not create application: ${error.message}`);
    }
  }

  /**
   * Validates that a vendor hasn't already applied to the same bazaar
   * @param {object} applicationData - The bazaar application data
   * @throws {Error} If vendor has already applied to this bazaar
   */
  async validateBazaarApplicationUniqueness(applicationData) {
    const { event, createdBy } = applicationData;
    
    if (!event || !createdBy) {
      throw new Error("Event and vendor information are required");
    }

    // Check if vendor has already applied to this bazaar
    const existingApplication = await Application.findOne({
      event: event,
      createdBy: createdBy,
      type: "bazaar",
      deletedAt: null // Only check non-deleted applications
    });

    if (existingApplication) {
      throw new Error("You have already applied to this bazaar");
    }
  }

  /**
   * Validates that a booth is available for the requested duration
   * @param {object} applicationData - The booth application data
   * @throws {Error} If booth is not available
   */
  async validateBoothAvailability(applicationData) {
    const { locationPreference, durationWeeks } = applicationData;
    
    if (!locationPreference || !durationWeeks) {
      throw new Error("Booth location and duration are required");
    }

    // Calculate the end date for this application (assuming it starts today)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (durationWeeks * 7));

    // Find all approved applications for this booth
    const existingApplications = await Application.find({
      type: "booth",
      locationPreference: locationPreference,
      status: "approved"
    });

    // Check for overlapping periods manually
    const overlappingApplications = existingApplications.filter(app => {
      const appStartDate = new Date(app.createdAt);
      const appEndDate = new Date(app.createdAt);
      appEndDate.setDate(appEndDate.getDate() + (app.durationWeeks * 7));
      
      // Check if periods overlap
      return (appStartDate < endDate && appEndDate > startDate);
    });

    if (overlappingApplications.length > 0) {
      throw new Error(
        `unfortunately booth is already reserved`
      );
    }
  }
async getAllApplications() {
  const applications = await Application.find({ deletedAt: null })
    .populate({
      path: "createdBy",
      select: "companyName email companyLogoUrl taxCardUrl status",
    })
    .populate("event", "name description startDate endDate location")
    .sort({ createdAt: -1 });

  // Filter out applications for events that have already passed
  const currentDate = new Date();
  const activeApplications = applications.filter(app => {
    // If event is populated and has an endDate, check if it's in the future
    if (app.event && app.event.endDate) {
      return new Date(app.event.endDate) > currentDate;
    }
    // If event is not populated or doesn't have endDate, include it (shouldn't happen in normal cases)
    return true;
  });

  return activeApplications;
}

  /**
   * Finds all applications for a specific vendor, with optional filtering and population.
   * @param {string} vendorId - The ID of the authenticated vendor.
   * @param {object} filters - An object containing query filters like { status: 'approved' }.
   * @returns {Promise<Array>} A list of application documents.
   */
  async findVendorApplications(vendorId, filters = {}) {
    const query = { createdBy: vendorId, deletedAt: null };

    // Conditionally add the status to the query if it exists in the filters
    if (filters.status) {
      query.status = filters.status;
    }

    const applications = await Application.find(query)
      // Populate 'event' with specific fields from the linked Event/Bazaar document
      .populate("event", "name description startDate endDate location")
      .sort({ createdAt: -1 }); // Sort by newest first

    // Filter out applications for events that have already passed
    const currentDate = new Date();
    const activeApplications = applications.filter(app => {
      // If event is populated and has an endDate, check if it's in the future
      if (app.event && app.event.endDate) {
        return new Date(app.event.endDate) > currentDate;
      }
      // If event is not populated or doesn't have endDate, include it (shouldn't happen in normal cases)
      return true;
    });

    return activeApplications;
  }
  /**
 * Updates the status of an application by its ID.
 * @param {string} applicationId - The ID of the application.
 * @param {string} status - The new status ("approved" or "rejected").
 * @returns {Promise<Document|null>} The updated application.
 */
// async updateApplicationStatus(applicationId, status) {
//   const application = await Application.findById(applicationId);
//   if (!application) {
//     throw new Error("Application not found");
//   }

//   application.status = status;
//   await application.save();

//   return application;
// }

  async updateApplicationStatus(applicationId, status) {
    const updatedApp = await Application.findByIdAndUpdate(
      applicationId,
      { $set: { status } },
      { new: true, runValidators: false } // ✅ prevents missing required field errors
    );

    if (!updatedApp) {
      throw new Error("Application not found");
    }

    return updatedApp;
  }

  /**
   * Checks if a booth is available for a given duration
   * @param {string} boothId - The booth ID/location preference
   * @param {number} durationWeeks - Duration in weeks
   * @returns {Promise<boolean>} True if available, false if occupied
   */
  async checkBoothAvailability(boothId, durationWeeks) {
    try {
      await this.validateBoothAvailability({
        locationPreference: boothId,
        durationWeeks: durationWeeks
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Cancels a vendor's participation request
   * @param {string} applicationId - The ID of the application to cancel
   * @param {string} vendorId - The ID of the vendor requesting cancellation
   * @returns {Promise<Document>} The deleted application document
   * @throws {Error} If application not found, doesn't belong to vendor, or payment has been made
   */
  async cancelApplication(applicationId, vendorId) {
    // Find the application
    const application = await Application.findOne({
      _id: applicationId,
      deletedAt: null, // Only find non-deleted applications
    });

    if (!application) {
      throw new Error("Application not found");
    }

    // Verify the application belongs to the vendor
    if (application.createdBy.toString() !== vendorId.toString()) {
      throw new Error("You can only cancel your own applications");
    }

    // Check if payment has been made for this application
    // Use $expr with $toString to handle both ObjectId and string formats
    const vendorIdString = vendorId.toString();
    const applicationIdString = applicationId.toString();
    
    const completedPayment = await Transaction.findOne({
      $expr: {
        $and: [
          { $eq: [{ $toString: "$userId" }, vendorIdString] },
          { $eq: [{ $toString: "$relatedEntity.id" }, applicationIdString] },
          { $eq: ["$type", "payment"] },
          { $eq: ["$status", "completed"] },
          { $eq: ["$relatedEntity.type", "application"] }
        ]
      }
    });

    if (completedPayment) {
      throw new Error("Cannot cancel application. Payment has already been made.");
    }

    // Soft delete the application by setting deletedAt
    application.deletedAt = new Date();
    await application.save();

    return application;
  }

}

export const ApplicationService = new ApplicationServiceClass();
