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
    const query = { vendorId };

    // Conditionally add the status to the query if it exists in the filters
    if (filters.status) {
      query.status = filters.status;
    }

    const applications = await Application.find(query)
      // Populate 'bazaarId' with specific fields from the linked Event/Bazaar document
      .populate("bazaarId", "name description startDate endDate location")
      .sort({ createdAt: -1 }); // Sort by newest first

    return applications;
  }
}

export const ApplicationService = new ApplicationServiceClass();
