import { CourtBooking, GymSession } from "./facility.model.js";
import { sendGymSessionCancellationEmail } from "../auth/email.service.js";

class FacilitiesServiceClass {
async getCourtSchedules() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAhead = new Date(today);
  weekAhead.setDate(today.getDate() + 6);

  const activeBookings = await CourtBooking.find({
    status: "active",
    date: { $gte: today, $lte: weekAhead },
  }).sort({ date: 1, startTime: 1 });

  const courtTypes = ["basketball", "tennis", "football"];
  const startHour = 10;
  const endHour = 17;

  const timeSlots = Array.from({ length: endHour - startHour }, (_, i) => ({
    startTime: `${(startHour + i).toString().padStart(2, "0")}:00`,
    endTime: `${(startHour + i + 1).toString().padStart(2, "0")}:00`,
  }));

  // ✅ use local date strings instead of UTC
  const getLocalDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return getLocalDateString(d);
  });

  const schedules = {};
  courtTypes.forEach((type) => {
    schedules[type] = dates.map((date) => ({
      date,
      slots: timeSlots.map((slot) => ({
        ...slot,
        status: "available",
      })),
    }));
  });

  for (const booking of activeBookings) {
    const { courtType, startTime, date } = booking;
    const bookingDate = getLocalDateString(new Date(date));
    const courtSchedule = schedules[courtType];
    if (!courtSchedule) continue;

    const dayEntry = courtSchedule.find((d) => d.date === bookingDate);
    if (!dayEntry) continue;

    const slot = dayEntry.slots.find((s) => s.startTime === startTime);
    if (slot) slot.status = "booked";
  }

  return schedules;
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
      status: { $ne: "cancelled" }, // Exclude cancelled sessions
    })
      .sort({ date: 1, startTime: 1 });

    return sessions;
  }

  /**
   * Creates a new gym session.
   * @param {Object} data - Validated gym session data
   * @param {Object} user - Authenticated user
   */
  async createGymSession(data) {
  const { date, time, duration, type, instructor, maxParticipants } = data;

  const newSession = new GymSession({
    date,
    startTime: time,
    durationMinutes: duration,
    type,
    instructor: instructor,
    maxParticipants: maxParticipants
  });

  await newSession.save();
  return newSession;
}

  /**
   * Cancels a gym session and notifies all registered participants.
   * @param {string} sessionId - The ID of the gym session to cancel
   * @returns {Object} The cancelled session
   * @throws {Error} If session not found or already cancelled
   */
  async cancelGymSession(sessionId) {
    // Find the session
    const session = await GymSession.findById(sessionId).populate('attendees', 'email firstName lastName name');
    
    if (!session) {
      const error = new Error("Gym session not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if already cancelled
    if (session.status === "cancelled") {
      const error = new Error("This gym session is already cancelled");
      error.statusCode = 400;
      throw error;
    }

    // Mark as cancelled (don't delete for record-keeping)
    session.status = "cancelled";
    await session.save();

    // Notify all attendees if there are any
    if (session.attendees && session.attendees.length > 0) {
      console.log(`📧 Notifying ${session.attendees.length} participants about cancellation...`);
      
      // Send notifications in parallel (don't wait for all to complete)
      const emailPromises = session.attendees.map(attendee => 
        sendGymSessionCancellationEmail(attendee, {
          type: session.type,
          date: session.date,
          startTime: session.startTime,
          durationMinutes: session.durationMinutes,
          instructor: session.instructor,
        })
      );

      // Don't await - let emails send in background
      Promise.allSettled(emailPromises).then(results => {
        const succeeded = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`✅ Email notifications completed: ${succeeded} sent, ${failed} failed`);
      });
    }

    return {
      session,
      notificationsSent: session.attendees ? session.attendees.length : 0,
    };
  }
}
export const FacilitiesService = new FacilitiesServiceClass();
