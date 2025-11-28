import { Event } from "./event.model.js"; // adjust path if needed
import ApiError from "../../utils/ApiError.js";
import { User } from "../users/user.model.js";
import Application from "../applications/application.model.js";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { Parser } from "json2csv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { TransactionService } from "../transactions/transaction.service.js";
const transactionService = new TransactionService();
import { Transaction } from "../transactions/transaction.model.js";
import NotificationService from "../notifications/notification.service.js";
import mongoose from "mongoose";

export async function createBazaar(data, user) {
  // Check user role
  if (user.role !== "events_office") {
    throw new Error("Only Events Office can create bazaars");
  }

  // Prepare bazaar data
  const bazaarData = {
    name: data.name,
    description: data.description,
    location: data.location,
    startDate: data.startDate,
    endDate: data.endDate,
    registrationDeadline: data.registrationDeadline,
    eventType: "bazaar",
    createdBy: user.id,
    startTime: data.startTime,
    endTime: data.endTime,
    restrictedRoles: data.restrictedRoles || [],
  };

  // Save to database
  const bazaar = await Event.create(bazaarData);

  // Send notification about new bazaar
  try {
    await NotificationService.notifyNewEvent(bazaar, "bazaar");
  } catch (error) {
    console.error("Error sending bazaar notification:", error);
    // Don't fail the request if notification fails
  }

  return bazaar;
}

export async function editBazaar(id, updates) {
  const bazaar = await Event.findById(id);
  if (!bazaar) throw new ApiError(404, "Bazaar not found");

  if (bazaar.eventType !== "bazaar")
    throw new ApiError(400, "This event is not a bazaar");

  // Check if the bazaar has already started
  const now = new Date();
  if (new Date(bazaar.startDate) <= now)
    throw new ApiError(400, "Cannot edit a bazaar that has already started");

  // Apply updates and save
  Object.assign(bazaar, updates);
  await bazaar.save();

  return bazaar;
}

// ✅ Export properly for ESM

export const createTrip = async (tripData, createdBy) => {
  if (isNaN(tripData.price)) {
    throw new ApiError(400, "Price must be a valid number");
  }

  // Validate required fields
  if (!tripData.startTime) {
    throw new ApiError(400, "Start time is required");
  }

  if (!tripData.endTime) {
    throw new ApiError(400, "End time is required");
  }

  // Extract date and time fields
  const startDateTime = new Date(tripData.startDate);
  const endDateTime = new Date(tripData.endDate);

  // Validate date format
  if (isNaN(startDateTime.getTime())) {
    throw new ApiError(400, "Invalid start date format");
  }

  if (isNaN(endDateTime.getTime())) {
    throw new ApiError(400, "Invalid end date format");
  }

  // Ensure end date is after start date
  if (endDateTime <= startDateTime) {
    throw new ApiError(400, "End date must be after start date");
  }

  const newTrip = await Event.create({
    ...tripData,
    eventType: "trip",
    createdBy,
    restrictedRoles: tripData.restrictedRoles || [],
  });

  // Send notification about new trip
  try {
    await NotificationService.notifyNewEvent(newTrip, "trip");
  } catch (error) {
    console.error("Error sending trip notification:", error);
    // Don't fail the request if notification fails
  }

  return newTrip;
};

export const createConference = async (data, userId) => {
  const {
    name,
    startDate,
    endDate,
    description,
    websiteUrl,
    requiredBudget,
    fundingSource,
    extraResources,
    agenda,
    startTime,
    endTime,
    professors,
  } = data;

  // Validate required fields
  if (!name || !startDate || !endDate || !description)
    throw new ApiError(400, "Missing required fields");

  if (!requiredBudget || !fundingSource)
    throw new ApiError(
      400,
      "Conference must include requiredBudget and fundingSource"
    );

  if (!professors || professors.length === 0)
    throw new ApiError(400, "Conference must include at least one professor");

  const event = await Event.create({
    name,
    eventType: "conference",
    startDate,
    endDate,
    description,
    location: "TBD",
    registrationDeadline: startDate, // placeholder
    status: "approved",
    requiredBudget,
    fundingSource,
    extraResources,
    agenda,
    websiteUrl,
    startTime,
    endTime,
    professors,
    createdBy: userId,
    restrictedRoles: data.restrictedRoles || [],
  });

  // Send notification about new conference
  try {
    await NotificationService.notifyNewEvent(event, "conference");
  } catch (error) {
    console.error("Error sending conference notification:", error);
    // Don't fail the request if notification fails
  }

  return event;
};

export const getConferences = async () => {
  return Event.find({ eventType: "conference" }).sort({ startDate: -1 });
};

export const getConferenceById = async (conferenceId) => {
  const conference = await Event.findById(conferenceId);

  if (!conference) throw new ApiError(404, "Conference not found");
  if (conference.eventType !== "conference")
    throw new ApiError(400, "This event is not a conference");

  return conference;
};

export const updateConferenceService = async (
  conferenceId,
  updateData,
  user
) => {
  const conference = await Event.findById(conferenceId);

  if (!conference) throw new ApiError(404, "Conference not found");
  if (conference.eventType !== "conference")
    throw new ApiError(400, "This event is not a conference");

  // Only events office or admin can edit
  if (!["events_office", "admin"].includes(user.role)) {
    throw new ApiError(
      403,
      "Forbidden: Only Events Office or Admin can edit conferences"
    );
  }

  // Update only provided fields
  Object.keys(updateData).forEach((key) => {
    conference[key] = updateData[key];
  });

  await conference.save();
  return conference;
};

// Get events with optional filter (e.g., for bazaar, published, upcoming)
export const getEvents = async (filter = {}) => {
  return Event.find(filter).sort({ startDate: 1 }).lean();
};

export const createWorkshop = async (workshopData, professorId) => {
  const workshop = await Event.create({
    ...workshopData,
    eventType: "workshop",
    createdBy: professorId,
    status: "pending",
    restrictedRoles: workshopData.restrictedRoles || [],
  });

  // Send notification about new workshop
  try {
    await NotificationService.notifyNewEvent(workshop, "workshop");
  } catch (error) {
    console.error("Error sending workshop notification:", error);
    // Don't fail the request if notification fails
  }

  return workshop;
};

/**
 * Allows a professor to edit their own workshop if it needs revision.
 * @param {string} workshopId - The ID of the workshop to edit.
 * @param {object} updateData - The fields to update.
 * @param {object} user - The authenticated professor user.
 * @returns {Promise<Document>} The updated workshop document.
 */
export async function editWorkshop(workshopId, updateData, user) {
  const workshop = await Event.findById(workshopId);
  if (!workshop) {
    throw new ApiError(404, "Workshop not found");
  }

  if (workshop.eventType !== "workshop") {
    throw new ApiError(400, "This event is not a workshop");
  }

  // Handle both user.id and user._id from JWT token
  const userId = user._id || user.id;
  if (workshop.createdBy.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You can only edit your own workshops");
  }

  if (workshop.status !== "pending" && workshop.status !== "needs_revision") {
    throw new ApiError(
      403,
      "Forbidden: Workshop can only be edited if its status is 'pending' or 'needs_revision'"
    );
  }

  // Check if workshop has already started
  const now = new Date();
  const workshopStartDateTime = new Date(workshop.startDate);

  // If startTime exists, combine it with startDate
  if (workshop.startTime) {
    const [hours, minutes] = workshop.startTime.split(":").map(Number);
    workshopStartDateTime.setHours(hours, minutes, 0, 0);
  }

  if (workshopStartDateTime <= now) {
    throw new ApiError(
      403,
      "Forbidden: Cannot edit workshop that has already started"
    );
  }

  Object.assign(workshop, updateData);

  workshop.status = "pending";

  await workshop.save();

  return workshop;
}

export const updateTripService = async (tripId, updateData, user) => {
  // 1. Fetch trip
  const trip = await Event.findById(tripId);
  if (!trip || trip.eventType !== "trip") {
    throw new ApiError(404, "Trip not found");
  }

  // 2. Prevent editing if start date passed
  const now = new Date();
  if (trip.startDate <= now) {
    throw new ApiError(403, "Cannot edit a trip that has already started");
  }

  // 3. Apply updates dynamically
  Object.keys(updateData).forEach((key) => {
    trip[key] = updateData[key];
  });

  // 4. Validate before saving (Mongoose validation will run)
  await trip.validate();

  // 5. Save updated trip
  const savedTrip = await trip.save();
  return savedTrip;
};
/**
 * Register an authenticated user (Student, Staff, TA, or Professor)
 * to a workshop or trip event.
 */
export const registerUserToEvent = async (user, eventId) => {
  // 1️⃣ Validate allowed roles
  const allowedRoles = ["student", "staff", "ta", "professor"];
  if (!allowedRoles.includes(user.role.toLowerCase())) {
    throw new ApiError(403, "You are not allowed to register for this event");
  }

  // 2️⃣ Find the event by ID
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // 3️⃣ Prevent duplicate registrations
  if (event.attendees && event.attendees.includes(user._id)) {
    throw new ApiError(409, "You are already registered for this event");
  }

  // 4️⃣ Check if event has reached its capacity (if it has a limit)
  if (event.capacity && event.attendees.length >= event.capacity) {
    throw new ApiError(409, "Event is full");
  }

  // 5️⃣ Register the user
  event.attendees.push(user._id);
  await event.save();

  return { message: "Successfully registered for the event." };
};

export const getEventsByUser = async (userId) => {
  const events = await Event.find({
    attendees: userId,
    status: "approved",
    deletedAt: null, // Only fetch events that are not deleted
  }).populate("attendees", "name email role");
  return events;
};

export const getUpcomingEventsService = async (
  includeVendors = false,
  userRole = null
) => {
  const now = new Date();

  const filter = {
    status: "approved",
    deletedAt: null,
    $or: [
      { startDate: { $gte: now } }, // Regular events with future startDate
      { eventType: "platform_booth" }, // Platform booths (may not have startDate)
    ],
  };

  // Filter out events where the user's role is restricted
  if (userRole && userRole !== "admin" && userRole !== "events_office") {
    filter.restrictedRoles = { $ne: userRole };
  }

  const events = await Event.find(filter)
    .populate("professors", "name email") // now Mongoose knows User schema
    .populate("createdBy", "name email companyName")
    .lean();

  return events;
};

/**
 * Get all upcoming events with their vendors (via applications).
 * @returns {Promise<Array>} Array of event objects with vendors array.
 */
export const getUpcomingEventsWithVendors = async (
  includeVendors = true,
  userRole = null
) => {
  const now = new Date();

  const filter = {
    status: "approved",
    deletedAt: null,
    $or: [
      { startDate: { $gte: now } }, // Regular events with future startDate
      { eventType: "platform_booth" }, // Platform booths (may not have startDate)
    ],
  };

  // Filter out events where the user's role is restricted
  if (userRole && userRole !== "admin" && userRole !== "events_office") {
    filter.restrictedRoles = { $ne: userRole };
  }

  // Get all approved upcoming events
  const events = await Event.find(filter).lean();

  const eventsWithVendors = await Promise.all(
    events.map(async (event) => {
      // Find applications related to this event
      const applications = await Application.find({ event: event._id })
        .populate({
          path: "createdBy",
          select: "firstName lastName name email role companyName", // include companyName for vendors
        })
        .lean();

      // Extract vendor details clearly
      const vendors = applications
        .map((app) => {
          const vendor = app.createdBy;
          if (!vendor) return null;

          // Determine vendor name - prioritize companyName for vendors, fallback to name or firstName+lastName
          let vendorName;
          if (vendor.role === "vendor" && vendor.companyName) {
            vendorName = vendor.companyName;
          } else if (vendor.name) {
            vendorName = vendor.name;
          } else {
            vendorName = `${vendor.firstName || ""} ${
              vendor.lastName || ""
            }`.trim();
          }

          return {
            id: vendor._id,
            name: vendorName || "Unknown Vendor",
            email: vendor.email || "N/A",
            role: vendor.role,
          };
        })
        .filter((v) => v !== null);

      // Return each event with vendor details
      return {
        ...event,
        vendors,
      };
    })
  );

  return eventsWithVendors;
};

export async function deleteEvent(eventId, user) {
  // Ensure event exists
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  // Check if anyone is registered
  if (event.attendees && event.attendees.length > 0) {
    throw new ApiError(409, "Cannot delete event with registered users.");
  }

  // Soft delete: set deletedAt timestamp and clear restrictedRoles
  event.deletedAt = new Date();
  event.restrictedRoles = [];
  await event.save();
  return true;
}
// 🔍 Search events service
export const searchEvents = async ({
  name,
  type,
  location,
  startDate,
  endDate,
  userRole,
}) => {
  // Build a flexible filter - only search upcoming events like getUpcomingEventsService
  // Platform booths have startDate and endDate assigned when approved in updateApplicationStatus
  const now = new Date();
  const filter = {
    status: "approved",
    deletedAt: null,
    $and: [
      {
        $or: [
          { startDate: { $gte: now } }, // Regular events with future startDate
          { eventType: "platform_booth" }, // Platform booths (kept for backwards compatibility)
        ],
      },
    ],
  };

  // Filter out events where the user's role is restricted
  if (userRole && userRole !== "admin" && userRole !== "events_office") {
    filter.restrictedRoles = { $ne: userRole };
  }

  // If both name and type are provided and are the same (unified search)
  // Use OR logic to search across all fields
  if (name && type && name.toLowerCase() === type.toLowerCase()) {
    // First, find users whose names match the search query
    // Support searching by: firstName, lastName, or "firstName lastName"
    const nameParts = name.trim().split(/\s+/); // Split by whitespace

    let userQuery = {
      $or: [
        { firstName: { $regex: name, $options: "i" } },
        { lastName: { $regex: name, $options: "i" } },
        // Add variations with spaces for partial matching
        { firstName: { $regex: `${name} `, $options: "i" } }, // "firstName "
        { firstName: { $regex: ` ${name}`, $options: "i" } }, // " firstName"
        { lastName: { $regex: `${name} `, $options: "i" } }, // "lastName "
        { lastName: { $regex: ` ${name}`, $options: "i" } }, // " lastName"
      ],
    };

    // If search has multiple words, also search for "firstName lastName" combination
    if (nameParts.length >= 2) {
      userQuery.$or.push({
        $and: [
          { firstName: { $regex: nameParts[0], $options: "i" } },
          { lastName: { $regex: nameParts.slice(1).join(" "), $options: "i" } },
        ],
      });
    }

    const matchingUsers = await User.find(userQuery).select("_id");
    const userIds = matchingUsers.map((user) => user._id);

    filter.$and.push({
      $or: [
        { name: { $regex: name, $options: "i" } }, // Event name
        { eventType: { $regex: type, $options: "i" } }, // Event type
        { createdBy: { $in: userIds } }, // Created by matching users
        { professors: { $in: userIds } }, // Workshop professors matching
      ],
    });
  } else {
    // Traditional separate search
    // Filter by event type if given
    if (type) {
      filter.eventType = type.toLowerCase();
    }

    // Add name-based search (event name or professor/vendor name)
    if (name) {
      // First, find users whose names match the search query
      // Support searching by: firstName, lastName, or "firstName lastName"
      const nameParts = name.trim().split(/\s+/); // Split by whitespace

      let userQuery = {
        $or: [
          { firstName: { $regex: name, $options: "i" } },
          { lastName: { $regex: name, $options: "i" } },
          // Add variations with spaces for partial matching
          { firstName: { $regex: `${name} `, $options: "i" } }, // "firstName "
          { firstName: { $regex: ` ${name}`, $options: "i" } }, // " firstName"
          { lastName: { $regex: `${name} `, $options: "i" } }, // "lastName "
          { lastName: { $regex: ` ${name}`, $options: "i" } }, // " lastName"
        ],
      };

      // If search has multiple words, also search for "firstName lastName" combination
      if (nameParts.length >= 2) {
        userQuery.$or.push({
          $and: [
            { firstName: { $regex: nameParts[0], $options: "i" } },
            {
              lastName: { $regex: nameParts.slice(1).join(" "), $options: "i" },
            },
          ],
        });
      }

      const matchingUsers = await User.find(userQuery).select("_id");
      const userIds = matchingUsers.map((user) => user._id);

      filter.$and.push({
        $or: [
          { name: { $regex: name, $options: "i" } }, // Event name
          { createdBy: { $in: userIds } }, // Created by matching users
          { professors: { $in: userIds } }, // Workshop professors matching
        ],
      });
    }
  }

  if (location) {
    filter.$and.push({
      $or: [
        { location: { $regex: location, $options: "i" } },
        { locationPreference: { $regex: location, $options: "i" } },
      ],
    });
  }

  // Date filtering: enforce strict bounds
  // If startDate filter is set: event.startDate >= filter.startDate (no event can start before)
  // If endDate filter is set: event.endDate <= filter.endDate (no event can end after)
  // Platform booths have startDate and endDate assigned in updateApplicationStatus, so they can be filtered normally
  if (startDate instanceof Date && !Number.isNaN(startDate.getTime())) {
    const startOfDay = new Date(startDate);
    startOfDay.setHours(0, 0, 0, 0);
    // Event startDate must be >= filter startDate
    filter.$and.push({
      startDate: { $gte: startOfDay },
    });
  }

  if (endDate instanceof Date && !Number.isNaN(endDate.getTime())) {
    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);
    // Event endDate must be <= filter endDate
    filter.$and.push({
      endDate: { $lte: endOfDay },
    });
  }

  return await Event.find(filter)
    .populate("createdBy", "firstName lastName role")
    .populate("professors", "firstName lastName role")
    .sort({ startDate: 1 });
};

export const acceptWorkshop = async (workshopId) => {
  const event = await Event.findByIdAndUpdate(
    workshopId,
    { status: "approved" },
    { new: true }
  ).populate("professors", "firstName lastName email");

  if (!event) {
    throw new ApiError(404, "Workshop not found");
  }

  // Send notification to all professors associated with the workshop
  if (event.professors && event.professors.length > 0) {
    const recipientIds = event.professors.map((prof) => prof._id);

    await NotificationService.createNotification({
      recipients: recipientIds,
      title: "Workshop Accepted",
      message: `Your workshop "${event.name}" has been approved by the Events Office and is now published!`,
    });
  }

  return event;
};

export const approveBazaar = async (bazaarId) => {
  const event = await Event.findByIdAndUpdate(
    bazaarId,
    { status: "approved" },
    { new: true }
  );
  if (!event) {
    throw new ApiError(404, "Bazaar not found");
  }
  if (event.eventType !== "bazaar") {
    throw new ApiError(400, "This event is not a bazaar");
  }
  return event;
};

export const rejectWorkshop = async (workshopId) => {
  const event = await Event.findByIdAndUpdate(
    workshopId,
    { status: "rejected" },
    { new: true }
  ).populate("professors", "firstName lastName email");

  if (!event) {
    throw new ApiError(404, "Workshop not found");
  }

  // Send notification to all professors associated with the workshop
  if (event.professors && event.professors.length > 0) {
    const recipientIds = event.professors.map((prof) => prof._id);

    await NotificationService.createNotification({
      recipients: recipientIds,
      title: "Workshop Rejected",
      message: `Your workshop "${event.name}" has been rejected by the Events Office.`,
    });
  }

  return event;
};

export const requestWorkshopEdits = async (workshopId, revisionComments) => {
  const event = await Event.findById(workshopId);
  if (!event) {
    throw new ApiError(404, "Workshop not found");
  }

  if (event.eventType !== "workshop") {
    throw new ApiError(400, "This endpoint is only for workshops");
  }

  if (event.status !== "pending") {
    throw new ApiError(
      400,
      `Cannot request edits. Workshop status is already ${event.status}`
    );
  }

  event.status = "needs_revision";
  event.revisionComments = revisionComments.trim();
  await event.save();

  return event;
};

export const getEventById = async (eventId, userRole = null) => {
  const event = await Event.findById(eventId)
    .populate("attendees", "name email role")
    .populate("createdBy", "name email role");
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Check if the user's role is restricted from viewing this event
  if (userRole && userRole !== "admin" && userRole !== "events_office") {
    if (event.restrictedRoles && event.restrictedRoles.includes(userRole)) {
      throw new ApiError(
        403,
        "Access denied: You are not allowed to view this event"
      );
    }
  }

  return event;
};
export const getAllTripsService = async () => {
  const trips = await Event.find({ eventType: "trip" })
    .select(
      "name location price startDate endDate description capacity registrationDeadline restrictedRoles"
    )
    .lean();

  return trips;
};

export const getAllWorkshopsService = async (userRole) => {
  // ✅ 3. Fetch all workshops from the database
  const workshops = await Event.find({ eventType: "workshop" }).sort({
    createdAt: -1,
  });

  // ✅ 4. Return response
  return workshops;
};
export async function getAllEvents() {
  try {
    const events = await Event.find({ deletedAt: null }); // exclude soft-deleted ones
    return events;
  } catch (err) {
    throw new ApiError(500, "Error fetching events");
  }
}
/**
 * Aggregates attendee statistics for all events.
 * Supports optional filtering by eventType, date range, and pagination.
 */
export const getAttendeesReport = async (options = {}) => {
  const { name, eventType, startDate, endDate, page = 1, limit = 10 } = options;

  // Helper: safely escape regex special characters in user input
  const escapeRegex = (str) =>
    String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const match = {
    deletedAt: null,
    status: { $in: ["approved", "archived"] },
  };

  // Name filter (partial, case-insensitive) applied to event 'name'
  if (name && name.trim()) {
    match.name = { $regex: escapeRegex(name.trim()), $options: "i" };
  }

  // Event type filter
  if (eventType && eventType !== "all" && eventType !== "All Types") {
    match.eventType = eventType.toLowerCase();
  }

  // ------------------- DATE FILTERS -------------------
  if (startDate && !endDate) {
    // Only startDate → all events starting from this date onward
    const filterStart = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    match.startDate = { $gte: filterStart };
  }

  if (startDate && endDate) {
    // Range query
    const filterStart = new Date(new Date(startDate).setHours(0, 0, 0, 0));
    const filterEnd = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    match.startDate = { $gte: filterStart };
    match.endDate = { $lte: filterEnd };
  }

  if (!startDate && endDate) {
    const filterEnd = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    match.endDate = { $lte: filterEnd };
  }

  const skip = (page - 1) * limit;

  // MongoDB aggregation for performance
  const [result] = await Event.aggregate([
    { $match: match },

    {
      $project: {
        name: 1,
        eventType: 1,
        startDate: 1,
        endDate: 1,
        location: 1,
        attendeesCount: {
          $ifNull: [
            "$attendeesCount",
            { $size: { $ifNull: ["$attendees", []] } },
          ],
        },
      },
    },

    {
      $facet: {
        events: [
          { $sort: { startDate: -1 } },
          { $skip: skip },
          { $limit: limit },
        ],
        totals: [
          {
            $group: {
              _id: null,
              totalEvents: { $sum: 1 },
              totalAttendees: { $sum: "$attendeesCount" },
            },
          },
        ],
      },
    },
  ]);

  const totals = result?.totals?.[0] || {
    totalEvents: 0,
    totalAttendees: 0,
  };

  return {
    totalEvents: totals.totalEvents,
    totalAttendees: totals.totalAttendees,
    page,
    limit,
    totalPages: Math.ceil((totals.totalEvents || 0) / limit),
    events: result.events || [],
  };
};
// Get workshop by ID
export const getWorkshopById = async (workshopId) => {
  return Event.findById(workshopId);
};
export const archiveEvent = async (eventId, user) => {
  // Authorization
  if (!user || user.role !== "events_office") {
    throw new ApiError(403, "Forbidden: Only Events Office can archive events");
  }

  const now = new Date();

  // Atomic update — this ensures only eligible events are modified
  const updatedEvent = await Event.findOneAndUpdate(
    {
      _id: eventId,
      deletedAt: null, // not deleted
      status: { $ne: "archived" }, // not already archived
      endDate: { $lte: now }, // event has ended
    },
    {
      $set: {
        status: "archived",
        archivedAt: now,
        archivedBy: user.id,
      },
    },
    { new: true } // return the updated document
  );

  // Handle if no document was updated (meaning one of the conditions failed)
  if (!updatedEvent) {
    // Now check what the reason could be
    const existingEvent = await Event.findById(eventId);

    if (!existingEvent) {
      throw new ApiError(404, "Event not found");
    } else if (existingEvent.deletedAt !== null) {
      throw new ApiError(400, "Cannot archive a deleted event");
    } else if (existingEvent.status === "archived") {
      throw new ApiError(400, "Event is already archived");
    } else if (!existingEvent.endDate) {
      throw new ApiError(
        400,
        "Event does not have an endDate and cannot be archived"
      );
    } else if (new Date(existingEvent.endDate) > now) {
      throw new ApiError(400, "Cannot archive an event before its end date");
    } else {
      throw new ApiError(
        400,
        "Event could not be archived due to unknown reason"
      );
    }
  }

  return updatedEvent;
};

export const unarchiveEvent = async (eventId, user) => {
  // Authorization
  if (!user || user.role !== "events_office") {
    throw new ApiError(
      403,
      "Forbidden: Only Events Office can unarchive events"
    );
  }

  // Find the archived event
  const existingEvent = await Event.findOne({
    _id: eventId,
    deletedAt: null,
    status: "archived",
  });

  if (!existingEvent) {
    const event = await Event.findById(eventId);
    if (!event) {
      throw new ApiError(404, "Event not found");
    } else if (event.deletedAt !== null) {
      throw new ApiError(400, "Cannot unarchive a deleted event");
    } else if (event.status !== "archived") {
      throw new ApiError(400, "Event is not archived");
    }
  }

  // Update event to approved status
  const updatedEvent = await Event.findByIdAndUpdate(
    eventId,
    {
      $set: {
        status: "approved",
      },
      $unset: {
        archivedAt: "",
        archivedBy: "",
      },
    },
    { new: true }
  );

  return updatedEvent;
};

export const getEventRegisteredUsers = async (eventId) => {
  // Find event and populate attendees with firstName, lastName and role
  const event = await Event.findById(eventId)
    .select("attendees deletedAt eventType application")
    .populate("attendees", "firstName lastName role");

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.deletedAt) {
    throw new ApiError(400, "Cannot view attendees of a deleted event");
  }

  // For bazaar and platform_booth events, get attendees from approved applications
  if (event.eventType === "bazaar" || event.eventType === "platform_booth") {
    // Build query for applications
    const applicationQuery = {
      status: "approved",
    };

    if (event.eventType === "bazaar") {
      // For bazaar, applications have event field pointing to the bazaar
      applicationQuery.event = eventId;
      applicationQuery.type = "bazaar";
    } else if (event.eventType === "platform_booth") {
      // For platform_booth, we can use the event's application field or query by event
      if (event.application) {
        // Use the application field from the event
        const application = await Application.findById(
          event.application
        ).select("attendees");
        if (
          application &&
          application.attendees &&
          application.attendees.length > 0
        ) {
          return application.attendees.map((attendee) => {
            const nameParts = (attendee.name || "").trim().split(/\s+/);
            return {
              _id: null,
              firstName: nameParts[0] || "",
              lastName: nameParts.slice(1).join(" ") || "",
              role: "vendor_attendee",
            };
          });
        }
      }
      // Fallback: query by event field
      applicationQuery.event = eventId;
      applicationQuery.type = "booth";
    }

    const applications =
      await Application.find(applicationQuery).select("attendees");

    if (!applications || applications.length === 0) {
      throw new ApiError(404, "No registered users for this event");
    }

    // Extract all attendees from all approved applications
    const registeredUsers = [];
    applications.forEach((application) => {
      if (application.attendees && Array.isArray(application.attendees)) {
        application.attendees.forEach((attendee) => {
          const nameParts = (attendee.name || "").trim().split(/\s+/);
          registeredUsers.push({
            _id: null,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            role: "vendor_attendee",
          });
        });
      }
    });

    if (registeredUsers.length === 0) {
      throw new ApiError(404, "No registered users for this event");
    }

    return registeredUsers;
  }

  // For other event types, use the regular attendees from the event
  // Check if attendees array is empty or doesn't exist
  if (!event.attendees || event.attendees.length === 0) {
    throw new ApiError(404, "No registered users for this event");
  }

  // Map to minimal shape with only required fields
  const registeredUsers = event.attendees.map((user) => ({
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
  }));

  return registeredUsers;
};

export const exportEventRegisteredUsers = async (eventId, format = "xlsx") => {
  const validFormats = ["xlsx", "pdf", "csv"];
  if (!validFormats.includes(format.toLowerCase())) {
    throw new ApiError(
      400,
      `Invalid format. Supported formats: ${validFormats.join(", ")}`
    );
  }

  const registeredUsers = await getEventRegisteredUsers(eventId);
  const event = await Event.findById(eventId).select("name");
  const eventName = event?.name || "event";
  const sanitizedEventName = eventName.replace(/[^a-z0-9]/gi, "_");
  const timestamp = new Date().toISOString().split("T")[0];

  let buffer, mimeType, filename;

  switch (format.toLowerCase()) {
    case "xlsx":
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Registered Users", {
        views: [{ state: "frozen", xSplit: 0, ySplit: 2 }],
      });

      // Event title row (Row 1)
      worksheet.mergeCells("A1:C1");
      const titleCell = worksheet.getCell("A1");
      titleCell.value = eventName;
      titleCell.font = {
        name: "Calibri",
        size: 18,
        bold: true,
        color: { argb: "FF210051" },
      };
      titleCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      worksheet.getRow(1).height = 35;

      // Header row (Row 2) with strong borders
      const headerRow = worksheet.getRow(2);
      headerRow.values = ["First Name", "Last Name", "Role"];
      headerRow.font = {
        name: "Calibri",
        size: 12,
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      headerRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      headerRow.height = 30;

      // Apply styling to header cells with strong borders
      ["A2", "B2", "C2"].forEach((cellAddress) => {
        const cell = worksheet.getCell(cellAddress);
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF210051" },
        };
        cell.border = {
          top: { style: "medium", color: { argb: "FF000000" } },
          left: { style: "medium", color: { argb: "FF000000" } },
          bottom: { style: "medium", color: { argb: "FF000000" } },
          right: { style: "medium", color: { argb: "FF000000" } },
        };
      });

      // Add autofilter only to Role column (column C)
      const lastDataRowIndex = registeredUsers.length + 2;
      worksheet.autoFilter = {
        from: { row: 2, column: 3 },
        to: { row: lastDataRowIndex, column: 3 },
      };

      // Data rows (starting from Row 3) with clear borders
      registeredUsers.forEach((user, index) => {
        const rowIndex = index + 3;
        const dataRow = worksheet.getRow(rowIndex);
        dataRow.values = [
          user.firstName || "-",
          user.lastName || "-",
          user.role || "-",
        ];

        dataRow.font = {
          name: "Calibri",
          size: 11,
          color: { argb: "FF1A202C" },
        };
        dataRow.alignment = {
          vertical: "middle",
          horizontal: "left",
        };
        dataRow.height = 22;

        // Alternating row colors
        const fillColor = index % 2 === 0 ? "FFF9FAFB" : "FFFFFFFF";

        ["A", "B", "C"].forEach((col) => {
          const cell = worksheet.getCell(`${col}${rowIndex}`);
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: fillColor },
          };
          // Strong visible borders for all cells
          cell.border = {
            top: { style: "thin", color: { argb: "FF000000" } },
            left: { style: "thin", color: { argb: "FF000000" } },
            bottom: { style: "thin", color: { argb: "FF000000" } },
            right: { style: "thin", color: { argb: "FF000000" } },
          };
        });

        // Center align role column
        const roleCell = worksheet.getCell(`C${rowIndex}`);
        roleCell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      });

      // Add bottom border to last data row
      const lastDataRow = registeredUsers.length + 2;
      ["A", "B", "C"].forEach((col) => {
        const cell = worksheet.getCell(`${col}${lastDataRow}`);
        cell.border = {
          ...cell.border,
          bottom: { style: "medium", color: { argb: "FF000000" } },
        };
      });

      // Total row at the bottom (single cell merged)
      const totalRowIndex = registeredUsers.length + 3;
      worksheet.mergeCells(`A${totalRowIndex}:C${totalRowIndex}`);
      const totalCell = worksheet.getCell(`A${totalRowIndex}`);
      totalCell.value = `Total Registered: ${registeredUsers.length}`;
      totalCell.font = {
        name: "Calibri",
        size: 11,
        bold: true,
        color: { argb: "FF000000" },
      };
      totalCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      totalCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFE8E8E8" }, // Light gray background
      };
      totalCell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };
      worksheet.getRow(totalRowIndex).height = 25;

      // Footer (only spans table columns)
      const footerRowIndex = totalRowIndex + 2;
      worksheet.getRow(footerRowIndex - 1).height = 10;

      worksheet.mergeCells(`A${footerRowIndex}:C${footerRowIndex}`);
      const footerCell = worksheet.getCell(`A${footerRowIndex}`);
      footerCell.value = `Report generated by Eventy | ${new Date().getFullYear()} © All rights reserved`;
      footerCell.font = {
        name: "Calibri",
        size: 9,
        italic: true,
        color: { argb: "FF9CA3AF" },
      };
      footerCell.alignment = {
        vertical: "middle",
        horizontal: "center",
      };
      footerCell.border = {
        top: { style: "thin", color: { argb: "FFE5E7EB" } },
      };
      worksheet.getRow(footerRowIndex).height = 25;

      // Set column widths for better readability
      worksheet.getColumn(1).width = 28;
      worksheet.getColumn(2).width = 28;
      worksheet.getColumn(3).width = 22;

      // Set print options
      worksheet.pageSetup = {
        paperSize: 9, // A4
        orientation: "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: {
          left: 0.7,
          right: 0.7,
          top: 0.75,
          bottom: 0.75,
          header: 0.3,
          footer: 0.3,
        },
      };

      // Generate buffer
      buffer = await workbook.xlsx.writeBuffer();
      mimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      filename = `${sanitizedEventName}_registered_users_${timestamp}.xlsx`;
      break;
    case "pdf":
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      const logoLight = path.join(
        __dirname,
        "../../../../client/public/images/logo-light.png"
      );
      const logoDark = path.join(
        __dirname,
        "../../../../client/public/images/logo-dark.png"
      );

      // Watermark
      if (fs.existsSync(logoLight)) {
        doc
          .save()
          .opacity(0.03)
          .image(
            logoLight,
            doc.page.width / 2 - 150,
            doc.page.height / 2 - 150,
            { width: 300, height: 300 }
          )
          .restore();
      }

      // Header function for all pages
      const drawHeader = () => {
        if (fs.existsSync(logoLight)) {
          doc.image(logoLight, 50, 40, { width: 70 });
        }
        doc
          .fillColor("#1a202c")
          .fontSize(22)
          .font("Helvetica-Bold")
          .text("Registered Users Report", 135, 45)
          .fillColor("#4a5568")
          .fontSize(15)
          .font("Helvetica")
          .text(`Event: ${eventName}`, 135, 70)
          .fontSize(11)
          .fillColor("#718096")
          .text(
            `Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
            135,
            90
          );
        doc
          .moveTo(50, 115)
          .lineTo(doc.page.width - 50, 115)
          .strokeColor("#E5E7EB")
          .lineWidth(1)
          .stroke();
      };

      drawHeader();

      // Total users count below purple line
      doc.y = 130;
      doc
        .fontSize(12)
        .fillColor("#210051")
        .font("Helvetica-Bold")
        .text(`Total Registered Users: ${registeredUsers.length}`, 50, doc.y, {
          align: "left",
        });

      doc.y += 10;

      const col1X = 50,
        col2X = 220,
        col3X = 390,
        rowHeight = 25;

      // Table header
      doc
        .rect(col1X, doc.y, doc.page.width - 100, rowHeight)
        .fillColor("#210051")
        .fill();
      const headerY = doc.y + 8;
      doc
        .fillColor("#FFFFFF")
        .fontSize(12)
        .font("Helvetica-Bold")
        .text("First Name", col1X + 5, headerY, { width: 160 })
        .text("Last Name", col2X + 5, headerY, { width: 160 })
        .text("Role", col3X + 5, headerY, { width: 150 });
      doc.y += rowHeight;

      // Table rows
      doc.font("Helvetica").fontSize(11);
      registeredUsers.forEach((user, index) => {
        if (doc.y > doc.page.height - 80) {
          doc.addPage();
          drawHeader();
          doc.y = 130;

          // Redraw table header on new page
          doc
            .rect(col1X, doc.y, doc.page.width - 100, rowHeight)
            .fillColor("#210051")
            .fill();
          doc
            .fillColor("#FFFFFF")
            .fontSize(12)
            .font("Helvetica-Bold")
            .text("First Name", col1X + 5, doc.y + 8, { width: 160 })
            .text("Last Name", col2X + 5, doc.y + 8, { width: 160 })
            .text("Role", col3X + 5, doc.y + 8, { width: 150 });
          doc.y += rowHeight;
          doc.font("Helvetica").fontSize(11);
        }

        const currentY = doc.y;
        // Alternating row colors
        doc
          .rect(col1X, currentY, doc.page.width - 100, rowHeight)
          .fillColor(index % 2 === 0 ? "#F9FAFB" : "#FFFFFF")
          .fill();

        doc
          .fillColor("#1F2937")
          .text(user.firstName || "-", col1X + 5, currentY + 6, { width: 160 })
          .text(user.lastName || "-", col2X + 5, currentY + 6, { width: 160 })
          .text(user.role || "-", col3X + 5, currentY + 6, { width: 150 });
        doc.y = currentY + rowHeight;
      });

      doc.end();
      await new Promise((resolve) =>
        doc.on("end", () => {
          buffer = Buffer.concat(chunks);
          resolve();
        })
      );
      mimeType = "application/pdf";
      filename = `${sanitizedEventName}_registered_users_${timestamp}.pdf`;
      break;

    case "csv":
      const parser = new Parser({
        fields: [
          { label: "First Name", value: "firstName" },
          { label: "Last Name", value: "lastName" },
          { label: "Role", value: "role" },
        ],
        header: true,
      });
      buffer = Buffer.from(parser.parse(registeredUsers), "utf-8");
      mimeType = "text/csv";
      filename = `${sanitizedEventName}_registered_users_${timestamp}.csv`;
      break;
  }

  return { buffer, filename, mimeType };
};

/**
 * Cancels a user's registration for an event and processes a refund if eligible.
 * - Only allows cancellation at least 2 weeks before the event start date.
 * - Removes the user from the event's attendees.
 * - Initiates a refund using TransactionService.
 * @param {string} eventId - The ID of the event to cancel registration for.
 * @param {string} userId - The ID of the user cancelling registration.
 * @returns {Promise<Object>} Refund details including eventId, refundedAmount, paymentMethod, and transactionId.
 * @throws {ApiError} If event not found, cancellation not allowed, or user not registered.
 */
export const cancelEventRegistration = async (eventId, userId) => {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  const now = new Date();
  const twoWeeksBefore = new Date(event.startDate);
  twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);

  if (now > twoWeeksBefore) {
    throw new ApiError(
      400,
      "Cancellations are only allowed at least 2 weeks before the event."
    );
  }

  const isRegistered = event.attendees.some(
    (att) => att.toString() === userId.toString()
  );
  if (!isRegistered)
    throw new ApiError(400, "User not registered for this event.");

  // Remove attendee
  event.attendees = event.attendees.filter(
    (att) => att.toString() !== userId.toString()
  );
  await event.save();

  // Refund logic
  const refund = await transactionService.refundUserForEvent(userId, event._id);

  return {
    eventId,
    refundedAmount: refund.amount,
    paymentMethod: refund.paymentMethod,
    transactionId: refund._id,
  };
};

export const restrictAccess = async (eventId, rolesToRestrict, user) => {
  // Authorization check
  if (!user || user.role !== "events_office") {
    throw new ApiError(403, "Only Events Office can restrict event access");
  }

  // Ensure unique roles and validate them
  const uniqueRoles = [...new Set(rolesToRestrict)];
  const validRoles = [
    "student",
    "staff",
    "ta",
    "professor",
    "vendor",
    "events_office",
    "admin",
  ];
  const invalidRoles = uniqueRoles.filter((role) => !validRoles.includes(role));
  if (invalidRoles.length > 0) {
    throw new ApiError(
      400,
      `Invalid roles provided: ${invalidRoles.join(", ")}`
    );
  }

  // Replace the input array with unique roles
  rolesToRestrict = uniqueRoles;

  // Find and validate event
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.deletedAt) {
    throw new ApiError(400, "Cannot modify restrictions for a deleted event");
  }

  // Check if event is archived
  if (event.status === "archived") {
    throw new ApiError(400, "Cannot modify restrictions for an archived event");
  }

  // Check if the exact same restrictions are already in place
  const currentRestrictions = event.restrictedRoles || [];
  const isIdenticalRestriction =
    rolesToRestrict.length === currentRestrictions.length &&
    rolesToRestrict.every((role) => currentRestrictions.includes(role)) &&
    currentRestrictions.every((role) => rolesToRestrict.includes(role));

  if (isIdenticalRestriction) {
    throw new ApiError(
      400,
      "These role restrictions are already in place for this event"
    );
  }

  // Update restricted roles
  event.restrictedRoles = rolesToRestrict;
  await event.save();

  return event;
};

export const getSalesReport = async (options = {}) => {
  const {
    eventType,
    startDate,
    endDate,
    sortOrder = "desc",
    page = 1,
    limit = 10,
  } = options;

  const skip = (page - 1) * limit;

  const eventFilter = {
    deletedAt: null,
    status: "approved",
  };

  if (eventType && String(eventType).trim() !== "") {
    eventFilter.eventType = { $regex: eventType.trim(), $options: "i" };
  }

  if (startDate && !endDate) {
    // If only startDate is provided, get events starting on that exact date or after
    const s = new Date(startDate);
    const startOfDay = new Date(s);
    startOfDay.setHours(0, 0, 0, 0);
    eventFilter.startDate = { $gte: startOfDay };
  } else if (startDate && endDate) {
    // If both dates provided, get events starting on/after startDate AND ending on/before endDate (inclusive range)
    const s = new Date(startDate);
    const startOfStartDay = new Date(s);
    startOfStartDay.setHours(0, 0, 0, 0);

    const e = new Date(endDate);
    const endOfEndDay = new Date(e);
    endOfEndDay.setHours(23, 59, 59, 999);

    eventFilter.startDate = { $gte: startOfStartDay };
    eventFilter.endDate = { $lte: endOfEndDay };
  } else if (!startDate && endDate) {
    // If only endDate provided, get events ending on that exact date or before
    const e = new Date(endDate);
    const endOfDay = new Date(e);
    endOfDay.setHours(23, 59, 59, 999);
    eventFilter.endDate = { $lte: endOfDay };
  }

  const allEvents = await Event.find(eventFilter)
    .select("_id name eventType startDate endDate location price attendees")
    .lean();

  const eventIds = allEvents.map((e) => e._id);

  // Convert eventIds to ObjectIds for proper matching
  const eventObjectIds = eventIds.map((id) =>
    mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id
  );

  const transactionData = await Transaction.aggregate([
    // 1️⃣ Match completed transactions (both Event and Application types)
    {
      $match: {
        type: { $in: ["payment", "refund"] },
        status: "completed",
        $or: [
          // Direct Event transactions
          {
            "relatedEntity.type": "Event",
            "relatedEntity.id": { $in: eventObjectIds },
          },
          // Application transactions (we'll filter by event later)
          {
            "relatedEntity.type": "Application",
          },
        ],
      },
    },

    // 2️⃣ Lookup Application to get event ID for Application transactions
    {
      $lookup: {
        from: "applications",
        localField: "relatedEntity.id",
        foreignField: "_id",
        as: "application",
      },
    },
    {
      $unwind: { path: "$application", preserveNullAndEmptyArrays: true },
    },

    // 3️⃣ Determine the actual event ID for each transaction
    {
      $addFields: {
        eventId: {
          $cond: [
            { $eq: ["$relatedEntity.type", "Event"] },
            "$relatedEntity.id",
            "$application.event", // For Application transactions, use the application's event
          ],
        },
      },
    },

    // 4️⃣ Filter to only include transactions for our events
    {
      $match: {
        eventId: { $in: eventObjectIds },
      },
    },

    // 5️⃣ Add netAmount: payments positive, refunds negative
    {
      $addFields: {
        netAmount: {
          $cond: [
            { $eq: ["$type", "refund"] },
            { $multiply: ["$amount", -1] },
            "$amount",
          ],
        },
      },
    },

    // 6️⃣ Group by event ID
    {
      $group: {
        _id: "$eventId",
        totalRevenue: { $sum: "$netAmount" },
        grossRevenue: {
          $sum: { $cond: [{ $eq: ["$type", "payment"] }, "$amount", 0] },
        },
        totalRefunds: {
          $sum: { $cond: [{ $eq: ["$type", "refund"] }, "$amount", 0] },
        },
        walletPayments: {
          $sum: {
            $cond: [{ $eq: ["$paymentMethod", "wallet"] }, "$netAmount", 0],
          },
        },
        cardPayments: {
          $sum: {
            $cond: [
              { $in: ["$paymentMethod", ["credit_card", "debit_card"]] },
              "$netAmount",
              0,
            ],
          },
        },
        transactionCount: { $sum: 1 },
      },
    },

    // 4️⃣ Lookup event details if needed (optional)
    {
      $lookup: {
        from: "events", // your events collection
        localField: "_id",
        foreignField: "_id",
        as: "event",
      },
    },
    { $unwind: { path: "$event", preserveNullAndEmptyArrays: true } },

    // 5️⃣ Project final report fields
    {
      $project: {
        _id: 1,
        eventName: "$event.name",
        eventType: "$event.type",
        startDate: "$event.startDate",
        endDate: "$event.endDate",
        location: "$event.location",
        totalRevenue: 1,
        grossRevenue: 1,
        totalRefunds: 1,
        walletPayments: 1,
        cardPayments: 1,
        transactionCount: 1,
      },
    },

    // 6️⃣ Optional: sort by totalRevenue descending
    { $sort: { totalRevenue: -1 } },
  ]);

  const revenueMap = {};
  transactionData.forEach((item) => {
    // Convert ObjectId to string for consistent key matching
    const eventIdKey = item._id ? item._id.toString() : null;
    if (eventIdKey) {
      revenueMap[eventIdKey] = {
        totalRevenue: item.totalRevenue || 0,
        grossRevenue: item.grossRevenue || 0,
        totalRefunds: item.totalRefunds || 0,
        walletPayments: item.walletPayments || 0,
        cardPayments: item.cardPayments || 0,
        transactionCount: item.transactionCount || 0,
      };
    }
  });

  // Get attendee counts from applications for bazaar events
  const bazaarEventIds = allEvents
    .filter((e) => e.eventType === "bazaar")
    .map((e) => e._id);

  const applicationAttendeesMap = {};
  if (bazaarEventIds.length > 0) {
    const applicationAttendeesData = await Application.aggregate([
      {
        $match: {
          event: { $in: bazaarEventIds },
          status: "approved", // Only count approved applications
        },
      },
      {
        $group: {
          _id: "$event",
          totalAttendees: {
            $sum: { $size: { $ifNull: ["$attendees", []] } },
          },
        },
      },
    ]);

    applicationAttendeesData.forEach((item) => {
      const eventIdKey = item._id ? item._id.toString() : null;
      if (eventIdKey) {
        applicationAttendeesMap[eventIdKey] = item.totalAttendees || 0;
      }
    });
  }

  const eventsWithRevenue = allEvents.map((event) => {
    const eventIdStr = event._id.toString();
    const revenue = revenueMap[eventIdStr] || {
      totalRevenue: 0,
      grossRevenue: 0,
      totalRefunds: 0,
      walletPayments: 0,
      cardPayments: 0,
      transactionCount: 0,
    };

    // For bazaar events, count attendees from applications; for others, use event.attendees
    let attendeesCount = 0;
    if (event.eventType === "bazaar") {
      attendeesCount = applicationAttendeesMap[eventIdStr] || 0;
    } else {
      attendeesCount = event.attendees ? event.attendees.length : 0;
    }

    // Price is only required for trip and workshop, others should be null/undefined
    const price = event.price || null;

    return {
      _id: event._id,
      name: event.name,
      eventType: event.eventType,
      startDate: event.startDate,
      endDate: event.endDate,
      location: event.location,
      price: price,
      attendeesCount: attendeesCount,
      revenue: revenue.totalRevenue,
      totalRevenue: revenue.totalRevenue,
      grossRevenue: revenue.grossRevenue,
      totalRefunds: revenue.totalRefunds,
      walletPayments: revenue.walletPayments,
      cardPayments: revenue.cardPayments,
      transactionCount: revenue.transactionCount,
    };
  });

  // Apply sorting based on sortOrder parameter
  eventsWithRevenue.sort((a, b) => {
    if (sortOrder === "asc") {
      return a.totalRevenue - b.totalRevenue; // Least to Greatest
    } else {
      return b.totalRevenue - a.totalRevenue; // Greatest to Least (default)
    }
  });

  const totals = {
    totalEvents: eventsWithRevenue.length,
    totalRevenue: eventsWithRevenue.reduce((sum, e) => sum + e.totalRevenue, 0),
    totalAttendees: eventsWithRevenue.reduce(
      (sum, e) => sum + e.attendeesCount,
      0
    ),
    grossRevenue: eventsWithRevenue.reduce((sum, e) => sum + e.grossRevenue, 0),
    totalRefunds: eventsWithRevenue.reduce((sum, e) => sum + e.totalRefunds, 0),
    totalWalletPayments: eventsWithRevenue.reduce(
      (sum, e) => sum + e.walletPayments,
      0
    ),
    totalCardPayments: eventsWithRevenue.reduce(
      (sum, e) => sum + e.cardPayments,
      0
    ),
  };

  const paginatedEvents = eventsWithRevenue.slice(skip, skip + limit);

  return {
    totalEvents: totals.totalEvents,
    totalRevenue: totals.totalRevenue,
    totalAttendees: totals.totalAttendees,
    grossRevenue: totals.grossRevenue,
    totalRefunds: totals.totalRefunds,
    netRevenue: totals.totalRevenue,
    paymentBreakdown: {
      wallet: totals.totalWalletPayments,
      card: totals.totalCardPayments,
    },
    page,
    limit,
    totalPages: Math.ceil(totals.totalEvents / limit),
    events: paginatedEvents,
  };
};

/**
 * Send workshop attendance certificates to all attendees who haven't received them yet
 * Only sends if the workshop has ended
 * @param {string} workshopId - Workshop event ID
 * @returns {Object} - Result with counts of sent/failed certificates
 */
export const sendWorkshopCertificates = async (workshopId) => {
  const { sendWorkshopCertificateEmail } = await import(
    "../auth/email.service.js"
  );

  // Find the workshop and populate attendees and professors
  const workshop = await Event.findById(workshopId)
    .populate("attendees", "email firstName lastName name role")
    .populate("professors", "email firstName lastName name");

  if (!workshop) {
    throw new ApiError(404, "Workshop not found");
  }

  if (workshop.eventType !== "workshop") {
    throw new ApiError(400, "This event is not a workshop");
  }

  // Check if workshop has ended
  const now = new Date();
  const workshopEndDate = new Date(workshop.endDate);
  if (workshopEndDate > now) {
    throw new ApiError(
      400,
      "Cannot send certificates for a workshop that hasn't ended yet"
    );
  }

  // Get attendees who haven't received certificates yet
  const certificatesSentIds = (workshop.certificatesSent || []).map((id) =>
    id.toString()
  );
  // Build recipient list: attendees + professors (all roles should receive)
  const recipientMap = new Map();
  for (const u of workshop.attendees || []) {
    recipientMap.set(u._id.toString(), u);
  }
  for (const p of workshop.professors || []) {
    // Professors may not have `role` populated in some queries; still include
    recipientMap.set(p._id.toString(), p);
  }
  const recipientsToSend = Array.from(recipientMap.values()).filter(
    (user) => !certificatesSentIds.includes(user._id.toString())
  );

  if (recipientsToSend.length === 0) {
    return {
      message: "All eligible recipients have already received certificates",
      sent: 0,
      failed: 0,
      alreadySent: certificatesSentIds.length,
    };
  }

  // Send certificates to each attendee
  const results = {
    sent: 0,
    failed: 0,
    errors: [],
  };

  for (const attendee of recipientsToSend) {
    try {
      const success = await sendWorkshopCertificateEmail(attendee, workshop);
      if (success) {
        // Add to certificatesSent array
        await Event.findByIdAndUpdate(workshopId, {
          $addToSet: { certificatesSent: attendee._id },
        });
        results.sent++;
      } else {
        results.failed++;
        results.errors.push({
          attendeeId: attendee._id,
          email: attendee.email,
          error: "Email sending failed",
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        attendeeId: attendee._id,
        email: attendee.email,
        error: error.message,
      });
    }
  }

  return {
    message: `Certificates sent to ${results.sent} attendees, ${results.failed} failed`,
    sent: results.sent,
    failed: results.failed,
    alreadySent: certificatesSentIds.length,
    errors: results.errors.length > 0 ? results.errors : undefined,
  };
};

/**
 * Check all completed workshops and send certificates to attendees who haven't received them
 * This can be called periodically or manually
 * @returns {Object} - Summary of all workshops processed
 */
export const sendCertificatesForCompletedWorkshops = async () => {
  const { sendWorkshopCertificateEmail } = await import(
    "../auth/email.service.js"
  );

  const now = new Date();

  // Find all workshops that have ended and are approved
  const completedWorkshops = await Event.find({
    eventType: "workshop",
    status: "approved",
    endDate: { $lt: now },
    deletedAt: null,
  })
    .populate("attendees", "email firstName lastName name role")
    .populate("professors", "email firstName lastName name role");

  if (completedWorkshops.length === 0) {
    return {
      message: "No completed workshops found",
      workshopsProcessed: 0,
      totalSent: 0,
      totalFailed: 0,
    };
  }

  const summary = {
    workshopsProcessed: 0,
    totalSent: 0,
    totalFailed: 0,
    workshops: [],
  };

  for (const workshop of completedWorkshops) {
    const certificatesSentIds = (workshop.certificatesSent || []).map((id) =>
      id.toString()
    );
    // Build recipients: attendees + professors, dedupe by id, exclude already sent
    const batchRecipientMap = new Map();
    for (const u of workshop.attendees || []) {
      batchRecipientMap.set(u._id.toString(), u);
    }
    for (const p of workshop.professors || []) {
      batchRecipientMap.set(p._id.toString(), p);
    }
    const attendeesToSend = Array.from(batchRecipientMap.values()).filter(
      (user) => !certificatesSentIds.includes(user._id.toString())
    );

    if (attendeesToSend.length === 0) {
      continue; // Skip workshops where all certificates are already sent
    }

    summary.workshopsProcessed++;
    let workshopSent = 0;
    let workshopFailed = 0;

    for (const attendee of attendeesToSend) {
      try {
        const success = await sendWorkshopCertificateEmail(attendee, workshop);
        if (success) {
          await Event.findByIdAndUpdate(workshop._id, {
            $addToSet: { certificatesSent: attendee._id },
          });
          workshopSent++;
        } else {
          workshopFailed++;
        }
      } catch (error) {
        console.error(
          `Error sending certificate to ${attendee.email}:`,
          error.message
        );
        workshopFailed++;
      }
    }

    summary.totalSent += workshopSent;
    summary.totalFailed += workshopFailed;
    summary.workshops.push({
      workshopId: workshop._id,
      workshopName: workshop.name,
      sent: workshopSent,
      failed: workshopFailed,
    });
  }

  return {
    message: `Processed ${summary.workshopsProcessed} workshops, sent ${summary.totalSent} certificates, ${summary.totalFailed} failed`,
    ...summary,
  };
};

export async function getApprovedEventsCount() {
  return await Event.countDocuments({
    status: "approved",
    deletedAt: null,
    archivedAt: null,
  });
}
