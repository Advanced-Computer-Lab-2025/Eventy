import { CourtBooking, GymSession } from "./facility.model.js";
import {
  sendGymSessionCancellationEmail,
  sendGymSessionUpdateEmail,
} from "../auth/email.service.js";
import { User } from "../users/user.model.js";

class FacilitiesServiceClass {
  async reserveCourt(userId, reservationData) {
    const { courtType, date, startTime, endTime } = reservationData;
    const foundUser = await User.findOne({
      _id: userId,
      status: { $ne: "deleted" },
    });
    if (!foundUser) {
      throw new Error("User with the given id not found or is deleted");
    }
    if (foundUser.status === "blocked") {
      throw new Error("User account is blocked");
    }
    // Validate availability
    const schedules = await this.getCourtSchedules();
    const courtSchedule = schedules[courtType];

    if (!courtSchedule) {
      throw new Error(`Invalid court type: ${courtType}`);
    }

    const bookingDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) throw new Error("Cannot book a past date");

    const formattedDate = this.getLocalDateString(bookingDate);

    const daySchedule = courtSchedule.find((d) => d.date === formattedDate);
    if (!daySchedule) {
      throw new Error("Date is not available for booking");
    }

    const slot = daySchedule.slots.find(
      (s) => s.startTime === startTime && s.endTime === endTime
    );
    if (!slot) {
      throw new Error("Invalid time slot");
    }

    if (slot.status !== "available") {
      throw new Error("This time slot is already booked");
    }

    // Create the booking
    const booking = new CourtBooking({
      courtType,
      date: bookingDate,
      startTime,
      endTime,
      bookedBy: userId,
      status: "active",
    });

    await booking.save();
    return booking;
  }

  getLocalDateString(d) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  async getCourtSchedules() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekAhead = new Date(today);
    weekAhead.setDate(today.getDate() + 6);

    // Fetch active bookings in the next 7 days
    const activeBookings = await CourtBooking.find({
      status: "active",
      date: { $gte: today, $lte: weekAhead },
    }).sort({ date: 1, startTime: 1 });

    const courtTypes = ["basketball", "tennis", "football"];
    const startHour = 10; // 10 AM
    const endHour = 17; // 5 PM

    // Generate time slots with AM/PM
    const timeSlots = Array.from({ length: endHour - startHour }, (_, i) => {
      const hour24 = startHour + i;
      const endHour24 = hour24 + 1;

      const startAMPM = hour24 >= 12 ? "PM" : "AM";
      const endAMPM = endHour24 >= 12 ? "PM" : "AM";

      const startHour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
      const endHour12 = endHour24 % 12 === 0 ? 12 : endHour24 % 12;

      return {
        startTime: `${startHour12}:00 ${startAMPM}`,
        endTime: `${endHour12}:00 ${endAMPM}`,
        status: "available",
      };
    });

    // Generate 7-day date array
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return this.getLocalDateString(d);
    });

    // Initialize schedules
    const schedules = {};
    courtTypes.forEach((type) => {
      schedules[type] = dates.map((date) => ({
        date,
        slots: timeSlots.map((slot) => ({ ...slot })), // fresh copy for each date
      }));
    });

    // Mark booked slots
    for (const booking of activeBookings) {
      const { courtType, startTime, date } = booking;
      const bookingDate = this.getLocalDateString(new Date(date));
      const courtSchedule = schedules[courtType];
      if (!courtSchedule) continue;

      const dayEntry = courtSchedule.find((d) => d.date === bookingDate);
      if (!dayEntry) continue;

      const slot = dayEntry.slots.find((s) => s.startTime === startTime);
      if (slot) slot.status = "booked";
    }

    // Filter out booked slots before returning
    Object.keys(schedules).forEach((type) => {
      schedules[type] = schedules[type].map((day) => ({
        date: day.date,
        slots: day.slots.filter((slot) => slot.status === "available"),
      }));
    });

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
  async getGymSessions(month, year, userRole = null) {
    if (!month || !year) {
      throw new Error("Month and year parameters are required");
    }

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const filter = {
      date: { $gte: startOfMonth, $lte: endOfMonth },
      deletedAt: null,
      status: { $ne: "cancelled" }, // Exclude cancelled sessions
    };

    // Filter out sessions where the user's role is restricted
    if (userRole && userRole !== "admin" && userRole !== "events_office") {
      filter.restrictedRoles = { $ne: userRole };
    }

    const sessions = await GymSession.find(filter).sort({
      date: 1,
      startTime: 1,
    });

    return sessions;
  }

  /**
   * Creates a new gym session.
   * @param {Object} data - Validated gym session data
   * @param {Object} user - Authenticated user
   */
  async createGymSession(data) {
    const {
      date,
      time,
      duration,
      type,
      instructor,
      maxParticipants,
      restrictedRoles,
    } = data;

    const newSession = new GymSession({
      date,
      startTime: time,
      durationMinutes: duration,
      type,
      instructor: instructor,
      maxParticipants: maxParticipants,
      restrictedRoles: restrictedRoles || [],
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
    const session = await GymSession.findById(sessionId).populate(
      "attendees",
      "email firstName lastName name"
    );

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
      console.log(
        `📧 Notifying ${session.attendees.length} participants about cancellation...`
      );

      // Send notifications in parallel (don't wait for all to complete)
      const emailPromises = session.attendees.map((attendee) =>
        sendGymSessionCancellationEmail(attendee, {
          type: session.type,
          date: session.date,
          startTime: session.startTime,
          durationMinutes: session.durationMinutes,
          instructor: session.instructor,
        })
      );

      // Don't await - let emails send in background
      Promise.allSettled(emailPromises).then((results) => {
        const succeeded = results.filter(
          (r) => r.status === "fulfilled"
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;
        console.log(
          `✅ Email notifications completed: ${succeeded} sent, ${failed} failed`
        );
      });
    }

    return {
      session,
      notificationsSent: session.attendees ? session.attendees.length : 0,
    };
  }
  /**
   * registeres for a gym session
   * @param {string} sessionId - The ID of the gym session to register for
   * @param {string} userId - The ID of the user registering
   * @returns {Object} The updated session
   * @throws {Error} If session not found, is full, or user already registered
   */
  async registerForGymSession(sessionId, userId) {
    const session = await GymSession.findById(sessionId);
    if (!session) {
      const error = new Error("Gym session not found");
      error.statusCode = 404;
      throw error;
    }

    if (session.deletedAt != null) {
      const error = new Error("Gym session deleted");
      error.statusCode = 404;
      throw error;
    }

    // Only allow registration if status is strictly 'upcoming'
    if (session.status !== "upcoming") {
      const error = new Error("You can only register for upcoming sessions.");
      error.statusCode = 400;
      throw error;
    }

    if (session.attendees.includes(userId)) {
      const error = new Error("User already registered for this session");
      error.statusCode = 400;
      throw error;
    }

    if (session.attendees.length >= session.maxParticipants) {
      const error = new Error("Gym session is full");
      error.statusCode = 400;
      throw error;
    }

    session.attendees.push(userId);
    await session.save();
    return session;
  }

  /**
   * Edits a gym session and notifies all registered participants.
   * @param {string} sessionId - The ID of the gym session to edit
   * @param {Object} updates - Object containing date, time, and/or duration
   * @returns {Object} The updated session and notification count
   * @throws {Error} If session not found or is cancelled
   */
  async editGymSession(sessionId, updates) {
    // Find the session and populate attendees with role for professor prefix
    const session = await GymSession.findById(sessionId).populate(
      "attendees",
      "email firstName lastName name role"
    );

    if (!session) {
      const error = new Error("Gym session not found");
      error.statusCode = 404;
      throw error;
    }

    // Check if session is cancelled
    if (session.status === "cancelled") {
      const error = new Error("Cannot edit a cancelled gym session");
      error.statusCode = 400;
      throw error;
    }

    // Store old values before updating
    const oldSession = {
      date: session.date,
      startTime: session.startTime,
      durationMinutes: session.durationMinutes,
      type: session.type,
      instructor: session.instructor,
    };

    // Update only the allowed fields
    if (updates.date !== undefined) {
      session.date = updates.date;
    }
    if (updates.startTime !== undefined) {
      session.startTime = updates.startTime;
    }
    if (updates.durationMinutes !== undefined) {
      session.durationMinutes = updates.durationMinutes;
    }
    if (updates.restrictedRoles !== undefined) {
      session.restrictedRoles = updates.restrictedRoles;
    }

    // Save the updated session
    await session.save();

    // Notify all attendees if there are any
    if (session.attendees && session.attendees.length > 0) {
      console.log(
        `📧 Notifying ${session.attendees.length} participants about session update...`
      );

      const newSession = {
        date: session.date,
        startTime: session.startTime,
        durationMinutes: session.durationMinutes,
        type: session.type,
        instructor: session.instructor,
      };

      // Send notifications in parallel (don't wait for all to complete)
      const emailPromises = session.attendees.map((attendee) =>
        sendGymSessionUpdateEmail(attendee, oldSession, newSession)
      );

      // Don't await - let emails send in background
      Promise.allSettled(emailPromises).then((results) => {
        const succeeded = results.filter(
          (r) => r.status === "fulfilled"
        ).length;
        const failed = results.filter((r) => r.status === "rejected").length;
        console.log(
          `✅ Update email notifications completed: ${succeeded} sent, ${failed} failed`
        );
      });
    }

    return {
      session,
      notificationsSent: session.attendees ? session.attendees.length : 0,
    };
  }
}

export const FacilitiesService = new FacilitiesServiceClass();
