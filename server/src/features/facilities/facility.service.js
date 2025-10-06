import { CourtBooking, GymSession } from "./facility.model.js";

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
  
    /**
   * @route   GET /api/facilities/gym/sessions
   * @desc    Get all gym sessions for a specific month and year.
   * @access  Private (All authenticated users)
   * @query   month (1–12), year (4-digit)
   * @success 200 OK - Returns { success, message, data: [sessionObjects] }
   * @error   401 Unauthorized
   */
  async getGymSessions(month, year) {
    if (!month || !year) {
      throw new Error("Month and year parameters are required");
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const sessions = await GymSession.find({
      date: { $gte: startOfMonth, $lte: endOfMonth },
      deletedAt: null,
    })
      .populate("instructor", "name email role")
      .sort({ date: 1, startTime: 1 });

    return sessions;
  }

  /**
   * Creates a new gym session.
   * @param {Object} data - Validated gym session data
   * @param {Object} user - Authenticated user
   */
  async createGymSession(data) {
  const { date, time, duration, type, instructorId, maxParticipants } = data;

  const newSession = new GymSession({
    date,
    startTime: time,
    durationMinutes: duration,
    type,
    instructor: instructorId,
    maxParticipants: maxParticipants
  });

  await newSession.save();
  return newSession;
}
}
export const FacilitiesService = new FacilitiesServiceClass();
