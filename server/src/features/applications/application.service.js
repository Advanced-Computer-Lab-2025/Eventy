// features/applications/application.service.js

import Application from "./application.model.js";

class ApplicationServiceClass {
  /**
   * Creates a new application in the database.
   * @param {object} applicationData - The data for the new application.
   * @returns {Promise<Document>} The saved application document.
   */
  async createApplication(applicationData) {
    try {
      const newApplication = new Application(applicationData);
      await newApplication.save();
      return newApplication;
    } catch (error) {
      // It's good practice to throw the error to be handled by the controller
      throw new Error(`Could not create application: ${error.message}`);
    }
  }
async getAllApplications() {
  return Application.find({ deletedAt: null })
    .populate({
      path: "createdBy",
      select: "companyName email companyLogoUrl taxCardUrl status",
    })
    .sort({ createdAt: -1 });
}

  /**
   * Finds all applications for a specific vendor, with optional filtering and population.
   * @param {string} vendorId - The ID of the authenticated vendor.
   * @param {object} filters - An object containing query filters like { status: 'accepted' }.
   * @returns {Promise<Array>} A list of application documents.
   */
  async findVendorApplications(vendorId, filters = {}) {
    const query = { createdBy: vendorId };

    // Conditionally add the status to the query if it exists in the filters
    if (filters.status) {
      query.status = filters.status;
    }

    const applications = await Application.find(query)
      // Populate 'event' with specific fields from the linked Event/Bazaar document
      .populate("event", "name description startDate endDate location")
      .sort({ createdAt: -1 }); // Sort by newest first

    return applications;
  }
  /**
 * Updates the status of an application by its ID.
 * @param {string} applicationId - The ID of the application.
 * @param {string} status - The new status ("accepted" or "rejected").
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

}

export const ApplicationService = new ApplicationServiceClass();
