import { CourtBooking } from "./facility.model.js";

class FacilitiesServiceClass {
  /**
   * Fetches all upcoming court bookings and structures them by court type.
   * @returns {Promise<Object>} A structured object with court types as keys.
   */
  async getCourtSchedules() {
    // Get the start of today to only fetch future and current-day bookings
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all active bookings from today onwards
    const activeBookings = await CourtBooking.find({
      status: "active",
      date: { $gte: today },
    }).sort({ date: 1, startTime: 1 }); // Sort by date and time

    // Initialize the structure to ensure all court types are present in the response
    const initialSchedule = {
      basketball: [],
      tennis: [],
      football: [],
    };

    // Use reduce to group the flat array of bookings into the desired structure
    const structuredSchedule = activeBookings.reduce((acc, booking) => {
      // Create a clean schedule entry object
      const scheduleEntry = {
        date: booking.date,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status: booking.status, // Use the real status from the DB
      };

      // Push the entry into the correct array based on its courtType
      if (acc[booking.courtType]) {
        acc[booking.courtType].push(scheduleEntry);
      }

      return acc;
    }, initialSchedule);

    return structuredSchedule;
  }
}

export const FacilitiesService = new FacilitiesServiceClass();
