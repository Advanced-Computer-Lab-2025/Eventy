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
}

export const ApplicationService = new ApplicationServiceClass();
