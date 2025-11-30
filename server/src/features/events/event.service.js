import { Event } from "./event.model.js"; // adjust path if needed
import ApiError from "../../utils/ApiError.js";
import { User } from "../users/user.model.js";
import Application from "../applications/application.model.js";
import xlsx from "xlsx";
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
import { differenceInHours } from "date-fns";

// Store the interval ID for the reminder scheduler
let reminderInterval;

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
    await notifyNewEvent(bazaar, "bazaar");
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
    await notifyNewEvent(newTrip, "trip");
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
  } = data;

  // Validate required fields
  if (!name || !startDate || !endDate || !description)
    throw new ApiError(400, "Missing required fields");

  if (!requiredBudget || !fundingSource)
    throw new ApiError(
      400,
      "Conference must include requiredBudget and fundingSource"
    );

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
    createdBy: userId,
    restrictedRoles: data.restrictedRoles || [],
  });

  // Send notification about new conference
  try {
    await notifyNewEvent(event, "conference");
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
    await notifyNewEvent(workshop, "workshop");
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
export const searchEvents = async ({ name, type, userRole }) => {
  // Build a flexible filter - only search upcoming events like getUpcomingEventsService
  // Include platform booths even if they don't have a startDate
  const now = new Date();
  const filter = {
    status: "approved",
    deletedAt: null,
    $and: [
      {
        $or: [
          { startDate: { $gte: now } }, // Regular events with future startDate
          { eventType: "platform_booth" }, // Platform booths (may not have startDate)
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

export const getEventRegisteredUsers = async (eventId) => {
  // Find event and populate attendees with firstName, lastName and role
  const event = await Event.findById(eventId)
    .select("attendees deletedAt")
    .populate("attendees", "firstName lastName role");

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.deletedAt) {
    throw new ApiError(400, "Cannot view attendees of a deleted event");
  }

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
      const worksheetData = [
        ["First Name", "Last Name", "Role"],
        ...registeredUsers.map((user) => [
          user.firstName,
          user.lastName,
          user.role,
        ]),
      ];
      const worksheet = xlsx.utils.aoa_to_sheet(worksheetData);

      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
        fill: { fgColor: { rgb: "210051" } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: "thin", color: { rgb: "210051" } },
          bottom: { style: "thin", color: { rgb: "210051" } },
          left: { style: "thin", color: { rgb: "210051" } },
          right: { style: "thin", color: { rgb: "210051" } },
        },
      };

      worksheet["A1"].s = headerStyle;
      worksheet["B1"].s = headerStyle;
      worksheet["C1"].s = headerStyle;

      for (let i = 2; i <= registeredUsers.length + 1; i++) {
        const rowStyle = {
          fill: { fgColor: { rgb: i % 2 === 0 ? "F9FAFB" : "FFFFFF" } },
          border: {
            top: { style: "thin", color: { rgb: "E5E7EB" } },
            bottom: { style: "thin", color: { rgb: "E5E7EB" } },
            left: { style: "thin", color: { rgb: "E5E7EB" } },
            right: { style: "thin", color: { rgb: "E5E7EB" } },
          },
        };
        ["A", "B", "C"].forEach((col) => {
          if (worksheet[`${col}${i}`]) worksheet[`${col}${i}`].s = rowStyle;
        });
      }

      worksheet["!cols"] = [{ wch: 20 }, { wch: 20 }, { wch: 15 }];

      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, "Registered Users");
      buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
      mimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      filename = `${sanitizedEventName}_registered_users_${timestamp}.xlsx`;
      break;

    case "pdf":
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      const logoLightPath = path.join(
        __dirname,
        "../../../../client/public/images/logo-light.png"
      );
      const logoDarkPath = path.join(
        __dirname,
        "../../../../client/public/images/logo-dark.png"
      );

      // Watermark
      if (fs.existsSync(logoLightPath)) {
        doc
          .save()
          .opacity(0.03)
          .image(
            logoLightPath,
            doc.page.width / 2 - 150,
            doc.page.height / 2 - 150,
            { width: 300, height: 300 }
          )
          .restore();
      }

      // Header function for all pages
      const drawHeader = () => {
        if (fs.existsSync(logoLightPath)) {
          doc.image(logoLightPath, 50, 40, { width: 70 });
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
 * Sends notifications to all users about a new event
 * @param {Object} event - The newly created event
 * @param {string} eventType - The type of event (e.g., 'bazaar', 'workshop', 'trip', 'conference')
 */
export async function notifyNewEvent(event, eventType) {
  try {
    // Get all users who should be notified
    const users = await User.find({
      role: { $in: ["student", "staff", "ta", "professor", "events_office"] },
      status: "active",
      notificationPreferences: { $ne: false }, // Only users who haven't opted out
    }).select("_id");

    if (!users.length) return;

    // Map event type to a user-friendly name
    const eventTypeNames = {
      bazaar: "Bazaar",
      workshop: "Workshop",
      trip: "Trip",
      conference: "Conference",
      platform_booth: "Platform Booth",
    };

    let notificationData;
    if (eventType === "platform_booth") {
      // Custom notification for platform booth creation
      let vendorName = "Vendor";
      try {
        const vendor = await User.findById(event.createdBy).select(
          "companyName firstName"
        );
        vendorName = vendor?.companyName || vendor?.firstName || "Vendor";
      } catch (err) {
        console.error(
          "Error looking up vendor for platform booth notification:",
          err
        );
      }
      notificationData = {
        title: `New Platform Booth Created`,
        message: `A new platform booth for ${vendorName} has been created at location "${event.locationPreference}" for ${event.durationWeeks} week(s).`,
        link: `/events/${event._id}`,
        recipients: users.map((user) => user._id),
        event: event._id,
        notificationType: "new_platform_booth",
      };
    } else {
      // Default notification for other event types
      notificationData = {
        title: `New ${eventTypeNames[eventType] || "Event"} Added`,
        message: `A new ${eventTypeNames[eventType] || "event"} "${event.name}" has been added.`,
        link: `/events/${event._id}`,
        recipients: users.map((user) => user._id),
        event: event._id,
        notificationType: "new_event",
      };
    }

    // Create notification
    await NotificationService.createNotification(notificationData);

    console.log(
      `Notification sent to ${users.length} users about new ${eventType}`
    );
  } catch (error) {
    console.error("Error sending event notification:", error);
    // Don't throw error to not block event creation
  }
}

/**
 * Sends reminder notifications for upcoming events
 * @param {Object} event - The event to send reminders for
 * @param {Date} reminderTime - When the reminder should be sent
 */
async function sendEventReminder(event, reminderTime, reminderType) {
  try {
    // Get all users registered for this event
    const eventWithAttendees = await Event.findById(event._id).populate(
      "attendees",
      "email notificationPreferences"
    );

    if (!eventWithAttendees?.attendees?.length) return;

    // Filter out users who have disabled notifications
    const usersToNotify = eventWithAttendees.attendees.filter(
      (user) => user.notificationPreferences !== false
    );

    if (!usersToNotify.length) return;

    // Calculate time until event
    const eventStart = new Date(event.startDate);
    const timeUntilEvent = differenceInHours(eventStart, reminderTime);
    // Use reminderType for message
    await NotificationService.createNotification({
      title: `⏰ Event Reminder: ${event.name}`,
      message: `The event \"${event.name}\" is starting in ${reminderType}.`,
      link: `/events/${event._id}`,
      recipients: usersToNotify.map((user) => user._id),
      event: event._id,
      notificationType: "event_reminder",
    });

    console.log(
      `Sent ${reminderType} reminder for event \"${event.name}\" to ${usersToNotify.length} users`
    );
  } catch (error) {
    console.error(`Error sending reminder for event ${event._id}:`, error);
  }
}

/**
 * Schedules reminders for all upcoming events
 */
export async function scheduleEventReminders() {
  try {
    const now = new Date();
    console.log(
      `[Scheduler] Running event reminder check at ${now.toISOString()}`
    );

    // Find all upcoming events starting within the next 25 hours
    const upcomingEvents = await Event.find({
      startDate: {
        $gt: now,
        $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000), // 25 hours from now
      },
      status: "approved",
      deletedAt: null,
    });
    console.log(
      `[Scheduler] Found ${upcomingEvents.length} upcoming events in the next 25 hours.`
    );

    for (const event of upcomingEvents) {
      const eventStart = new Date(event.startDate);
      const diffMs = eventStart.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const diffHours = diffMs / (1000 * 60 * 60);
      console.log(
        `[Scheduler] Event '${event.name}' (${event._id}) starts at ${eventStart.toISOString()} (${diffDays.toFixed(2)} days, ${diffHours.toFixed(2)} hours from now)`
      );

      // 1-day reminder: send if exactly 1 day left or less than 1 day and not sent yet
      if (
        Math.abs(diffDays - 1) < 0.05 ||
        (diffDays < 1 && !event.reminder1DaySent && diffHours > 1)
      ) {
        if (!event.reminder1DaySent) {
          console.log(
            `[Scheduler] Sending 1-day reminder for event '${event.name}' (${event._id})`
          );
          await sendEventReminder(event, now, "1 day");
          await Event.findByIdAndUpdate(event._id, { reminder1DaySent: true });
        } else {
          console.log(
            `[Scheduler] 1-day reminder already sent for event '${event.name}' (${event._id})`
          );
        }
      }
      // 1-hour reminder: send if exactly 1 hour left or less than 1 hour and not sent yet
      else if (
        Math.abs(diffHours - 1) < 0.05 ||
        (diffHours < 1 && !event.reminder1HourSent && diffHours > 0)
      ) {
        if (!event.reminder1HourSent) {
          console.log(
            `[Scheduler] Sending 1-hour reminder for event '${event.name}' (${event._id})`
          );
          await sendEventReminder(event, now, "1 hour");
          await Event.findByIdAndUpdate(event._id, { reminder1HourSent: true });
        } else {
          console.log(
            `[Scheduler] 1-hour reminder already sent for event '${event.name}' (${event._id})`
          );
        }
      } else {
        console.log(
          `[Scheduler] No reminder needed for event '${event.name}' (${event._id}) at this time.`
        );
      }
    }
  } catch (error) {
    console.error("Error scheduling event reminders:", error);
  }
}

/**
 * Starts the reminder scheduler to run every 30 minutes
 */
export function startReminderScheduler() {
  // Run immediately on start
  console.log(
    `[Scheduler] Starting event reminder scheduler at ${new Date().toISOString()}`
  );
  scheduleEventReminders();

  // Then run every 5 minutes
  reminderInterval = setInterval(
    () => {
      console.log(
        `[Scheduler] Triggered event reminder scheduler at ${new Date().toISOString()}`
      );
      scheduleEventReminders();
    },
    5 * 60 * 1000
  );

  console.log("Event reminder scheduler started (interval: 5 minutes)");
}

/**
 * Stops the reminder scheduler
 */
export function stopReminderScheduler() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    console.log("Event reminder scheduler stopped");
  }
}
