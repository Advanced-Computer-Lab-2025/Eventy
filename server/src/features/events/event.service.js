import logger from "../../utils/logger.js";
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
import { differenceInDays } from "date-fns";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import { TransactionService } from "../transactions/transaction.service.js";
const transactionService = new TransactionService();
import { Transaction } from "../transactions/transaction.model.js";
import NotificationService from "../notifications/notification.service.js";
import {
  sendWaitlistAutopaySuccessEmail,
  sendWaitlistSpotAvailableEmail,
  sendWaitlistAutopayFailedEmail,
  sendWaitlistPaymentRequiredEmail,
} from "../auth/email.service.js";
import mongoose from "mongoose";
import { differenceInHours } from "date-fns";
import { Waitlist } from "./waitlist.model.js";

const frontendPublicBaseUrl = (() => {
  const candidate = process.env.CLIENT_URL;

  if (!candidate) return null;
  const first = String(candidate).split(",")[0]?.trim();
  if (!first) return null;
  return first.replace(/\/$/, "");
})();

const resolvePublicAsset = (assetPath) => {
  const normalized = assetPath.startsWith("/") ? assetPath : `/${assetPath}`;
  if (frontendPublicBaseUrl) return `${frontendPublicBaseUrl}${normalized}`;

  // Local-dev fallback when the monorepo exists on disk.
  return path.resolve(
    __dirname,
    "../../../../client/public",
    normalized.slice(1)
  );
};

const isHttpUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const loadAssetBuffer = async (assetPathOrUrl) => {
  if (!assetPathOrUrl) return null;

  if (isHttpUrl(assetPathOrUrl)) {
    try {
      const res = await fetch(assetPathOrUrl);
      if (!res.ok) return null;
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch {
      return null;
    }
  }

  try {
    if (!fs.existsSync(assetPathOrUrl)) return null;
    return fs.readFileSync(assetPathOrUrl);
  } catch {
    return null;
  }
};

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
    await NotificationService.notifyNewEvent(bazaar, "bazaar");
  } catch (error) {
    logger.error("Error sending bazaar notification:", error);
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

  // Build update object with only allowed fields
  // Note: attendees field is intentionally NOT included - it's managed through applications
  const allowedUpdates = {};
  if (updates.name !== undefined) allowedUpdates.name = updates.name;
  if (updates.description !== undefined)
    allowedUpdates.description = updates.description;
  if (updates.location !== undefined)
    allowedUpdates.location = updates.location;
  if (updates.startDate !== undefined)
    allowedUpdates.startDate = updates.startDate;
  if (updates.endDate !== undefined) allowedUpdates.endDate = updates.endDate;
  if (updates.registrationDeadline !== undefined)
    allowedUpdates.registrationDeadline = updates.registrationDeadline;
  if (updates.status !== undefined) allowedUpdates.status = updates.status;
  if (updates.capacity !== undefined)
    allowedUpdates.capacity = updates.capacity;
  if (updates.bannerImage !== undefined)
    allowedUpdates.bannerImage = updates.bannerImage;
  if (updates.extraResources !== undefined)
    allowedUpdates.extraResources = updates.extraResources;
  if (updates.startTime !== undefined)
    allowedUpdates.startTime = updates.startTime;
  if (updates.endTime !== undefined) allowedUpdates.endTime = updates.endTime;
  if (updates.restrictedRoles !== undefined)
    allowedUpdates.restrictedRoles = updates.restrictedRoles;

  // Use findByIdAndUpdate instead of save() to only validate updated fields
  // This prevents validation errors on existing corrupted fields like attendees
  const updatedBazaar = await Event.findByIdAndUpdate(id, allowedUpdates, {
    new: true,
    runValidators: true,
  });

  if (!updatedBazaar) throw new ApiError(404, "Bazaar not found after update");

  return updatedBazaar;
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
    logger.error("Error sending trip notification:", error);
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
    logger.error("Error sending conference notification:", error);
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
    logger.error("Error sending workshop notification:", error);
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

export const updateTripService = async (tripId, updateData, _user) => {
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

  // 3.5️⃣ Prevent professors from registering to their own workshops
  if (
    user.role.toLowerCase() === "professor" &&
    event.eventType === "workshop" &&
    event.professors &&
    Array.isArray(event.professors)
  ) {
    const isProfessorInWorkshop = event.professors.some((prof) => {
      const profId = prof?._id?.toString() || prof?.toString();
      return profId === user._id.toString();
    });
    if (isProfessorInWorkshop) {
      throw new ApiError(
        403,
        "You cannot register for a workshop where you are listed as a professor"
      );
    }
  }

  // 4️⃣ Check if event has reached its capacity (if it has a limit)
  if (event.capacity && event.attendees.length >= event.capacity) {
    throw new ApiError(409, "Event is full");
  }

  // 5️⃣ Register the user
  event.attendees.push(user._id);
  await event.save();

  // 6️⃣ Remove user from waitlist if they were on it
  // This handles cases where someone was notified and then manually registered
  await Waitlist.updateMany(
    {
      event: eventId,
      user: user._id,
      deletedAt: null, // Only update active waitlist entries
    },
    {
      deletedAt: new Date(),
      notified: true,
      notifiedAt: new Date(),
    }
  );

  // Return the updated event document so callers can use it immediately
  const updatedEvent = await Event.findById(eventId).populate(
    "attendees",
    "firstName lastName email role"
  );

  return updatedEvent;
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
  _includeVendors = false,
  userRole = null
) => {
  // Use start of today for comparison so events starting today are included
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filter = {
    status: "approved",
    deletedAt: null,
    startDate: { $gte: now }, // All events (including platform booths) must have startDate >= today
  };

  // Filter out events where the user's role is restricted
  if (userRole && userRole !== "admin" && userRole !== "events_office") {
    filter.restrictedRoles = { $ne: userRole };
  }

  const events = await Event.find(filter)
    .populate("professors", "firstName lastName email") // now Mongoose knows User schema
    .populate("createdBy", "name email companyName")
    .lean();

  return events;
};

/**
 * Get all upcoming events with their vendors (via applications).
 * @returns {Promise<Array>} Array of event objects with vendors array.
 */
export const getUpcomingEventsWithVendors = async (
  _includeVendors = true,
  userRole = null
) => {
  // Use start of today for comparison so events starting today are included
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const filter = {
    status: "approved",
    deletedAt: null,
    startDate: { $gte: now }, // All events (including platform booths) must have startDate >= today
  };

  // Filter out events where the user's role is restricted
  if (userRole && userRole !== "admin" && userRole !== "events_office") {
    filter.restrictedRoles = { $ne: userRole };
  }

  // Get all approved upcoming events
  const events = await Event.find(filter)
    .populate("professors", "firstName lastName role")
    .lean();

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

/**
 * Get all ongoing events (events that have started but not ended yet).
 * @param {string|null} userRole - The role of the user requesting events
 * @returns {Promise<Array>} Array of ongoing event objects.
 */
export const getOngoingEvents = async (userRole = null) => {
  const now = new Date();

  const filter = {
    status: "approved",
    deletedAt: null,
    // Include both ongoing events and past events
    // Remove the endDate filter to include past events
    startDate: { $lte: now }, // Event has already started
  };

  // Filter out events where the user's role is restricted
  if (userRole && userRole !== "admin" && userRole !== "events_office") {
    filter.restrictedRoles = { $ne: userRole };
  }

  const events = await Event.find(filter)
    .populate("professors", "firstName lastName email")
    .populate("createdBy", "name email companyName")
    .lean();

  return events;
};

export async function deleteEvent(eventId, _user) {
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
  professor,
}) => {
  // Build a flexible filter - only search upcoming events like getUpcomingEventsService
  // Platform booths should also respect startDate >= today, just like regular events
  // Use start of today for comparison so events starting today are included
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const filter = {
    status: "approved",
    deletedAt: null,
    startDate: { $gte: now }, // All events (including platform booths) must have startDate >= today
  };

  // Additional filters will be added to $and array
  filter.$and = [];

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

  if (professor) {
    // Accept professor as ID (string), convert to ObjectId if valid
    const profStr = String(professor).trim();
    if (profStr && profStr.toLowerCase() !== "all") {
      if (!mongoose.Types.ObjectId.isValid(profStr)) {
        // Invalid professor id format - return an empty result rather than throwing
        // to avoid crashing consumer code; simply return an empty list
        return [];
      }
      const profValue = new mongoose.Types.ObjectId(profStr);

      // Only filter for workshops and conferences when using professor filter
      filter.$and.push({ eventType: { $in: ["workshop", "conference"] } });
      filter.$and.push({
        $or: [
          { professors: { $in: [profValue] } }, // Professor is in the professors array
          { createdBy: profValue }, // Professor created the event
        ],
      });
    }
  }

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
    .populate("professors", "firstName lastName email")
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

export const getAllWorkshopsService = async (_userRole) => {
  // ✅ 3. Fetch all workshops from the database
  const workshops = await Event.find({ eventType: "workshop" })
    .populate("createdBy", "firstName lastName email")
    .populate("professors", "firstName lastName email")
    .sort({
      createdAt: -1,
    });

  // ✅ 4. Return response
  return workshops;
};

export async function getAllEvents() {
  try {
    const events = await Event.find({ deletedAt: null }); // exclude soft-deleted ones
    return events;
  } catch {
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
    case "xlsx": {
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
    }
    case "pdf": {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks = [];
      doc.on("data", (chunk) => chunks.push(chunk));

      const logoLightAsset = resolvePublicAsset("/images/logo-light.png");
      const logoDarkAsset = resolvePublicAsset("/images/logo-dark.png");

      const logoLightBuffer = await loadAssetBuffer(logoLightAsset);
      const _logoDarkBuffer = await loadAssetBuffer(logoDarkAsset);

      // Watermark
      if (logoLightBuffer) {
        doc
          .save()
          .opacity(0.03)
          .image(
            logoLightBuffer,
            doc.page.width / 2 - 150,
            doc.page.height / 2 - 150,
            { width: 300, height: 300 }
          )
          .restore();
      }

      // Header function for all pages
      const drawHeader = () => {
        if (logoLightBuffer) doc.image(logoLightBuffer, 50, 40, { width: 70 });
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
    }
    case "csv": {
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

  // Check if event now has available capacity and notify waitlist users
  const currentAttendees = event.attendees.length;
  const hasCapacity = !event.capacity || currentAttendees < event.capacity;

  if (hasCapacity && event.capacity) {
    // Notify waitlist users that a spot is available
    await notifyWaitlistUsers(event._id);
  }

  // Only process refund if event has a price
  if (event.price && !isNaN(event.price) && Number(event.price) > 0) {
    const refund = await transactionService.refundUserForEvent(
      userId,
      event._id
    );
    return {
      eventId,
      refundedAmount: refund.amount,
      paymentMethod: refund.paymentMethod,
      transactionId: refund._id,
    };
  } else {
    return {
      eventId,
      refundedAmount: 0,
      paymentMethod: null,
      transactionId: null,
      message: "No refund issued as event has no price.",
    };
  }
};

/**
 * Join the waitlist for an event
 * @param {string} eventId - The ID of the event
 * @param {string} userId - The ID of the user joining the waitlist
 * @param {boolean} autopayEnabled - Whether autopay is enabled
 * @param {string} paymentMethod - Payment method preference ("wallet" or "credit_card")
 * @returns {Promise<Object>} The waitlist entry
 * @throws {ApiError} If event not found, event not full, or user already on waitlist
 */
export const joinWaitlist = async (
  eventId,
  userId,
  autopayEnabled = false,
  paymentMethod = null
) => {
  // Find the event
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  // Check if cancellations can be made (at least 14 days before event)
  // If cancellations cannot be made, waitlist is not available
  const now = new Date();
  const eventStartDate = new Date(event.startDate);
  const twoWeeksBefore = new Date(eventStartDate);
  twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);

  if (now > twoWeeksBefore) {
    throw new ApiError(
      400,
      "Waitlist is no longer available. Cancellations cannot be made within 14 days of the event."
    );
  }

  // Check if event is full
  const isFull = event.capacity && event.attendees.length >= event.capacity;
  if (!isFull) {
    throw new ApiError(400, "Event is not full. You can register directly.");
  }

  // Check if user is already registered
  if (event.attendees && event.attendees.includes(userId)) {
    throw new ApiError(409, "You are already registered for this event");
  }

  // Check if user is already on waitlist (including soft-deleted entries)
  // If a soft-deleted entry exists, we'll restore it instead of creating a new one
  const existingWaitlist = await Waitlist.findOne({
    event: eventId,
    user: userId,
  });

  if (existingWaitlist) {
    // If entry exists but is soft-deleted, restore it
    if (existingWaitlist.deletedAt) {
      existingWaitlist.deletedAt = null;
      existingWaitlist.autopayEnabled = autopayEnabled;
      existingWaitlist.paymentMethod = autopayEnabled ? paymentMethod : null;
      existingWaitlist.notified = false;
      existingWaitlist.notifiedAt = null;
      await existingWaitlist.save();
      return existingWaitlist;
    } else {
      // Active entry exists
      throw new ApiError(409, "You are already on the waitlist for this event");
    }
  }

  // Validate payment method if autopay is enabled
  if (autopayEnabled && !paymentMethod) {
    throw new ApiError(
      400,
      "Payment method is required when autopay is enabled"
    );
  }

  if (autopayEnabled && !["wallet", "credit_card"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }

  // Create waitlist entry
  const waitlistEntry = await Waitlist.create({
    event: eventId,
    user: userId,
    autopayEnabled,
    paymentMethod: autopayEnabled ? paymentMethod : null,
  });

  return waitlistEntry;
};

/**
 * Check if a user is on the waitlist for an event
 * @param {string} eventId - The ID of the event
 * @param {string} userId - The ID of the user
 * @returns {Promise<Object|null>} The waitlist entry if found, null otherwise
 */
export const checkWaitlistStatus = async (eventId, userId) => {
  const waitlistEntry = await Waitlist.findOne({
    event: eventId,
    user: userId,
    deletedAt: null, // Only check active waitlist entries
  });

  return waitlistEntry;
};

/**
 * Notify waitlist users when a spot becomes available
 * @param {string} eventId - The ID of the event
 * @returns {Promise<void>}
 */
export const notifyWaitlistUsers = async (eventId) => {
  try {
    const event = await Event.findById(eventId);
    if (!event) return;

    // Don't notify waitlist users if cancellations can no longer be made (within 14 days of event)
    const now = new Date();
    const eventStartDate = new Date(event.startDate);
    const twoWeeksBefore = new Date(eventStartDate);
    twoWeeksBefore.setDate(twoWeeksBefore.getDate() - 14);

    if (now > twoWeeksBefore) {
      logger.warn(
        `Cancellations cannot be made for event ${eventId} (within 14 days), not notifying waitlist users`
      );
      return;
    }

    // Get all waitlist entries for this event that haven't been notified
    const waitlistEntries = await Waitlist.find({
      event: eventId,
      deletedAt: null,
      notified: false,
    })
      .populate(
        "user",
        "firstName lastName email notificationPreferences walletBalance role _id"
      )
      .sort({ createdAt: 1 }); // First come, first served

    if (!waitlistEntries.length) return;

    // Clean up: Remove waitlist entries for users who are already registered
    // This handles cases where someone was notified and manually registered
    const registeredUserIds = event.attendees.map((id) => id.toString());

    for (const entry of waitlistEntries) {
      const userId = entry.user._id.toString();
      if (registeredUserIds.includes(userId)) {
        // User is already registered, remove from waitlist
        await Waitlist.findByIdAndUpdate(entry._id, {
          deletedAt: new Date(),
          notified: true,
          notifiedAt: new Date(),
        });
        logger.warn(
          `Removed waitlist entry for already-registered user ${userId} for event ${eventId}`
        );
      }
    }

    // Get fresh waitlist entries after cleanup
    const activeWaitlistEntries = await Waitlist.find({
      event: eventId,
      deletedAt: null,
      notified: false,
    })
      .populate(
        "user",
        "firstName lastName email notificationPreferences walletBalance role _id"
      )
      .sort({ createdAt: 1 });

    if (!activeWaitlistEntries.length) return;

    // Check if anyone on the waitlist has autopay enabled
    const hasAnyoneWithAutopay = activeWaitlistEntries.some((entry) => {
      const autopayEnabledValue =
        entry.autopayEnabled === true ||
        entry.autopayEnabled === "true" ||
        entry.autopayEnabled === 1;
      const hasPaymentMethod =
        entry.paymentMethod &&
        entry.paymentMethod !== null &&
        entry.paymentMethod !== "";
      return autopayEnabledValue && hasPaymentMethod;
    });

    // If no one has autopay, notify all waitlist users
    if (!hasAnyoneWithAutopay) {
      const allUserIds = activeWaitlistEntries
        .filter(
          (entry) => entry.user && entry.user.notificationPreferences !== false
        )
        .map((entry) => entry.user._id);

      if (allUserIds.length > 0) {
        await NotificationService.createNotification({
          title: `🎟️ Spot Available: ${event.name}`,
          message: `A spot has become available for "${event.name}". Register now to secure your place!`,
          link: `/events/${eventId}`,
          recipients: allUserIds,
          event: eventId,
          notificationType: "waitlist_spot_available",
        });

        // Send email notifications to all
        for (const entry of activeWaitlistEntries) {
          if (entry.user && entry.user.notificationPreferences !== false) {
            try {
              await sendWaitlistSpotAvailableEmail(entry.user, event);
            } catch (error) {
              logger.error(`Error sending email to ${entry.user._id}:`, error);
            }
          }
        }

        // Mark all as notified
        await Waitlist.updateMany(
          { _id: { $in: activeWaitlistEntries.map((e) => e._id) } },
          {
            notified: true,
            notifiedAt: new Date(),
          }
        );

        logger.warn(
          `Notified all ${allUserIds.length} waitlist users (no autopay) about available spot for event ${eventId}`
        );
        return;
      }
    }

    // If someone has autopay, process the first person with autopay (or first person if none have autopay)
    // Get the first user on the waitlist (FIFO)
    const firstWaitlistEntry = activeWaitlistEntries[0];
    const firstUser = firstWaitlistEntry.user;

    // Double-check: If user is already registered, skip them
    const isAlreadyRegistered = event.attendees.some(
      (attendeeId) => attendeeId.toString() === firstUser._id.toString()
    );

    if (isAlreadyRegistered) {
      // Remove from waitlist and skip
      await Waitlist.findByIdAndUpdate(firstWaitlistEntry._id, {
        deletedAt: new Date(),
        notified: true,
        notifiedAt: new Date(),
      });
      logger.warn(
        `Skipping waitlist entry - user ${firstUser._id} already registered for event ${eventId}`
      );
      return;
    }

    // Check if user has notifications enabled
    if (firstUser.notificationPreferences === false) {
      return;
    }

    // Debug logging
    logger.warn(
      `Processing waitlist for event ${eventId}: autopayEnabled=${firstWaitlistEntry.autopayEnabled}, paymentMethod=${firstWaitlistEntry.paymentMethod}, userId=${firstUser._id}`
    );

    // If autopay is enabled, try to process payment and register automatically
    // Check both autopayEnabled and paymentMethod exist and are truthy
    // Handle both boolean true and string "true" cases
    const autopayEnabledValue =
      firstWaitlistEntry.autopayEnabled === true ||
      firstWaitlistEntry.autopayEnabled === "true" ||
      firstWaitlistEntry.autopayEnabled === 1;
    const hasPaymentMethod =
      firstWaitlistEntry.paymentMethod &&
      firstWaitlistEntry.paymentMethod !== null &&
      firstWaitlistEntry.paymentMethod !== "";

    logger.warn(
      `Autopay check for waitlist entry ${firstWaitlistEntry._id}: autopayEnabledValue=${autopayEnabledValue}, hasPaymentMethod=${hasPaymentMethod}, paymentMethod=${firstWaitlistEntry.paymentMethod}`
    );

    if (autopayEnabledValue && hasPaymentMethod) {
      try {
        const paymentMethod = firstWaitlistEntry.paymentMethod;
        const eventPrice = event.price || 0;

        // Handle free events - just register directly
        if (eventPrice === 0) {
          // Use registerUserToEvent which handles all validations
          await registerUserToEvent(firstUser, eventId);

          await NotificationService.createNotification({
            title: `✅ Auto-Registered: ${event.name}`,
            message: `A spot became available and you've been automatically registered for "${event.name}".`,
            link: `/events/${eventId}`,
            recipients: [firstUser._id],
            event: eventId,
            notificationType: "waitlist_autopay_success",
          });

          // Send email notification
          await sendWaitlistAutopaySuccessEmail(firstUser, event, 0);

          await Waitlist.findByIdAndUpdate(firstWaitlistEntry._id, {
            deletedAt: new Date(),
            notified: true,
            notifiedAt: new Date(),
          });

          logger.warn(
            `Auto-registered waitlist user ${firstUser._id} for free event ${eventId}`
          );
          return;
        }

        // For paid events, process payment first
        // For wallet payments, check balance first
        if (paymentMethod === "wallet") {
          if (firstUser.walletBalance < eventPrice) {
            // Insufficient balance - notify user and move to next person
            await NotificationService.createNotification({
              title: `⚠️ Autopay Failed: ${event.name}`,
              message: `A spot became available for "${event.name}", but your wallet balance is insufficient ($${firstUser.walletBalance.toFixed(2)}). The spot has been offered to the next person in line. Please top up your wallet if you want to use autopay for future spots.`,
              link: `/events/${eventId}`,
              recipients: [firstUser._id],
              event: eventId,
              notificationType: "waitlist_autopay_failed",
            });

            // Send email notification
            await sendWaitlistAutopayFailedEmail(
              firstUser,
              event,
              `Insufficient wallet balance ($${firstUser.walletBalance.toFixed(2)})`
            );

            // Mark as notified but keep on waitlist (they can try again if another spot opens)
            await Waitlist.findByIdAndUpdate(firstWaitlistEntry._id, {
              notified: true,
              notifiedAt: new Date(),
            });

            // Recursively call to offer spot to next person
            await notifyWaitlistUsers(eventId);
            return;
          }
        }

        // Process payment (wallet or card)
        const payResult = await transactionService.payForEvent({
          userId: firstUser._id,
          eventId: eventId,
          paymentMethod: paymentMethod,
        });

        logger.warn(
          `Payment result for waitlist autopay:`,
          JSON.stringify({
            paymentMethod,
            hasPayResult: !!payResult,
            hasTransaction: !!(payResult && payResult.transaction),
            hasClientSecret: !!(payResult && payResult.clientSecret),
          })
        );

        // For wallet, payment is completed immediately - register user
        if (paymentMethod === "wallet" && payResult && payResult.transaction) {
          // Wallet payment succeeded - register user
          // Use registerUserToEvent which handles all validations
          // (it will check capacity, but since we just freed a spot, it should pass)
          await registerUserToEvent(firstUser, eventId);

          // Send success notification
          await NotificationService.createNotification({
            title: `✅ Auto-Registered: ${event.name}`,
            message: `A spot became available and you've been automatically registered for "${event.name}". $${eventPrice.toFixed(2)} has been deducted from your wallet.`,
            link: `/events/${eventId}`,
            recipients: [firstUser._id],
            event: eventId,
            notificationType: "waitlist_autopay_success",
          });

          // Send email notification
          await sendWaitlistAutopaySuccessEmail(firstUser, event, eventPrice);

          // Remove from waitlist
          await Waitlist.findByIdAndUpdate(firstWaitlistEntry._id, {
            deletedAt: new Date(),
            notified: true,
            notifiedAt: new Date(),
          });

          logger.warn(
            `Auto-registered waitlist user ${firstUser._id} for event ${eventId} via wallet autopay`
          );
          return; // Successfully processed
        } else if (
          paymentMethod === "credit_card" &&
          payResult &&
          payResult.clientSecret
        ) {
          // Card payment intent created - we can't auto-charge without saved payment method
          // Store payment intent ID in waitlist entry for future reference
          await Waitlist.findByIdAndUpdate(firstWaitlistEntry._id, {
            stripePaymentIntentId: payResult.transaction.stripePaymentIntentId,
            notified: true,
            notifiedAt: new Date(),
          });

          // Notify user to complete card payment
          await NotificationService.createNotification({
            title: `💳 Complete Payment: ${event.name}`,
            message: `A spot became available for "${event.name}". Please complete your card payment to finalize your registration.`,
            link: `/events/${eventId}`,
            recipients: [firstUser._id],
            event: eventId,
            notificationType: "waitlist_payment_required",
          });

          // Send email notification
          await sendWaitlistPaymentRequiredEmail(firstUser, event);

          logger.warn(
            `Notified waitlist user ${firstUser._id} to complete card payment for event ${eventId}`
          );
          return;
        } else {
          // Payment was processed but didn't match expected conditions
          logger.error(
            `Unexpected payment result for waitlist autopay:`,
            JSON.stringify({
              paymentMethod,
              payResult: payResult ? Object.keys(payResult) : null,
              hasTransaction: !!(payResult && payResult.transaction),
              hasClientSecret: !!(payResult && payResult.clientSecret),
            })
          );
          // Fall through to error handling
          throw new Error(
            `Unexpected payment result structure for ${paymentMethod}`
          );
        }
      } catch (autopayError) {
        logger.error("Error processing autopay:", autopayError);
        logger.error("Autopay error details:", {
          error: autopayError.message,
          stack: autopayError.stack,
          userId: firstUser._id,
          eventId: eventId,
          autopayEnabled: firstWaitlistEntry.autopayEnabled,
          paymentMethod: firstWaitlistEntry.paymentMethod,
        });

        // Send failure notification
        await NotificationService.createNotification({
          title: `⚠️ Autopay Failed: ${event.name}`,
          message: `A spot became available for "${event.name}", but automatic payment failed: ${autopayError.message}. The spot has been offered to the next person in line.`,
          link: `/events/${eventId}`,
          recipients: [firstUser._id],
          event: eventId,
          notificationType: "waitlist_autopay_failed",
        });

        // Send email notification
        await sendWaitlistAutopayFailedEmail(
          firstUser,
          event,
          autopayError.message
        );

        // Mark as notified but keep on waitlist (they can try again if another spot opens)
        await Waitlist.findByIdAndUpdate(firstWaitlistEntry._id, {
          notified: true,
          notifiedAt: new Date(),
        });

        // Recursively call to offer spot to next person
        await notifyWaitlistUsers(eventId);
        return;
      }
    } else {
      // Debug: Log why autopay wasn't triggered
      logger.warn(
        `Autopay not triggered for waitlist entry: autopayEnabled=${firstWaitlistEntry.autopayEnabled}, paymentMethod=${firstWaitlistEntry.paymentMethod}`
      );
    }

    // No autopay enabled - send regular notification
    await NotificationService.createNotification({
      title: `🎟️ Spot Available: ${event.name}`,
      message: `A spot has become available for "${event.name}". Register now to secure your place!`,
      link: `/events/${eventId}`,
      recipients: [firstUser._id],
      event: eventId,
      notificationType: "waitlist_spot_available",
    });

    // Send email notification
    await sendWaitlistSpotAvailableEmail(firstUser, event);

    // Mark this waitlist entry as notified
    await Waitlist.findByIdAndUpdate(firstWaitlistEntry._id, {
      notified: true,
      notifiedAt: new Date(),
    });

    logger.warn(
      `Notified waitlist user ${firstUser._id} about available spot for event ${eventId}`
    );
  } catch (error) {
    logger.error("Error notifying waitlist users:", error);
    // Don't throw error to not block cancellation
  }
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
    const _timeUntilEvent = differenceInHours(eventStart, reminderTime);
    // Use reminderType for message
    await NotificationService.createNotification({
      title: `⏰ Event Reminder: ${event.name}`,
      message: `The event "${event.name}" is starting in ${reminderType}.`,
      link: `/events/${event._id}`,
      recipients: usersToNotify.map((user) => user._id),
      event: event._id,
      notificationType: "event_reminder",
    });

    logger.info(
      `Sent ${reminderType} reminder for event "${event.name}" to ${usersToNotify.length} users`
    );
  } catch (error) {
    logger.error(`Error sending reminder for event ${event._id}:`, error);
  }
}

/**
 * Schedules reminders for all upcoming events
 */
export async function scheduleEventReminders() {
  try {
    const now = new Date();
    logger.info(
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
    logger.info(
      `[Scheduler] Found ${upcomingEvents.length} upcoming events in the next 25 hours.`
    );

    for (const event of upcomingEvents) {
      const eventStart = new Date(event.startDate);
      const diffMs = eventStart.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const diffHours = diffMs / (1000 * 60 * 60);
      logger.info(
        `[Scheduler] Event '${event.name}' (${event._id}) starts at ${eventStart.toISOString()} (${diffDays.toFixed(2)} days, ${diffHours.toFixed(2)} hours from now)`
      );

      // 1-day reminder: send if exactly 1 day left or less than 1 day and not sent yet
      if (
        Math.abs(diffDays - 1) < 0.05 ||
        (diffDays < 1 && !event.reminder1DaySent && diffHours > 1)
      ) {
        if (!event.reminder1DaySent) {
          logger.info(
            `[Scheduler] Sending 1-day reminder for event '${event.name}' (${event._id})`
          );
          await sendEventReminder(event, now, "1 day");
          await Event.findByIdAndUpdate(event._id, { reminder1DaySent: true });
        } else {
          logger.info(
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
          logger.info(
            `[Scheduler] Sending 1-hour reminder for event '${event.name}' (${event._id})`
          );
          await sendEventReminder(event, now, "1 hour");
          await Event.findByIdAndUpdate(event._id, { reminder1HourSent: true });
        } else {
          logger.info(
            `[Scheduler] 1-hour reminder already sent for event '${event.name}' (${event._id})`
          );
        }
      } else {
        logger.info(
          `[Scheduler] No reminder needed for event '${event.name}' (${event._id}) at this time.`
        );
      }
    }
  } catch (error) {
    logger.error("Error scheduling event reminders:", error);
  }
}

/**
 * Starts the reminder scheduler to run every 30 minutes
 */
export function startReminderScheduler() {
  // Run immediately on start
  logger.info(
    `[Scheduler] Starting event reminder scheduler at ${new Date().toISOString()}`
  );
  scheduleEventReminders();

  // Then run every 5 minutes
  reminderInterval = setInterval(
    () => {
      logger.info(
        `[Scheduler] Triggered event reminder scheduler at ${new Date().toISOString()}`
      );
      scheduleEventReminders();
    },
    5 * 60 * 1000
  );

  logger.info("Event reminder scheduler started (interval: 5 minutes)");
}

/**
 * Stops the reminder scheduler
 */
export function stopReminderScheduler() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    logger.info("Event reminder scheduler stopped");
  }
}

/**
 * Export sales report with formatting similar to attendees report
 * @param {Object} options - Filter and format options
 * @returns {Object} - Buffer, filename, and mimeType for download
 */
export const exportSalesReport = async (options = {}) => {
  const {
    eventType,
    startDate,
    endDate,
    sortOrder = "desc",
    format = "xlsx",
  } = options;

  const validFormats = ["xlsx"];
  if (!validFormats.includes(format.toLowerCase())) {
    throw new ApiError(
      400,
      `Invalid format. Supported formats: ${validFormats.join(", ")}`
    );
  }

  // Fetch all sales data without pagination
  const reportData = await getSalesReport({
    eventType,
    startDate,
    endDate,
    sortOrder,
    page: 1,
    limit: 999999,
  });

  const allEvents = reportData.events;
  const timestamp = new Date().toISOString().split("T")[0];

  let buffer, mimeType, filename;

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Sales Report", {
    views: [{ state: "frozen", xSplit: 0, ySplit: 2 }],
  });

  // Title row (Row 1)
  worksheet.mergeCells("A1:J1");
  const titleCell = worksheet.getCell("A1");
  titleCell.value = "Sales Report";
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
  headerRow.values = [
    "Event Name",
    "Type",
    "Start Date",
    "End Date",
    "Transactions",
    "Gross Revenue",
    "Refunds",
    "Net Revenue",
    "Wallet Payments",
    "Card Payments",
  ];
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
  ["A2", "B2", "C2", "D2", "E2", "F2", "G2", "H2", "I2", "J2"].forEach(
    (cellAddress) => {
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
    }
  );

  // Add autofilter to all columns
  const lastDataRowIndex = allEvents.length + 2;
  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: lastDataRowIndex, column: 10 },
  };

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return "TBA";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "TBA";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Data rows (starting from Row 3) with clear borders
  allEvents.forEach((event, index) => {
    const rowIndex = index + 3;
    const dataRow = worksheet.getRow(rowIndex);
    dataRow.values = [
      event.name || "-",
      event.eventType || "-",
      formatDate(event.startDate),
      formatDate(event.endDate),
      event.transactionCount || 0,
      event.grossRevenue || 0,
      event.totalRefunds || 0,
      event.totalRevenue || 0,
      event.walletPayments || 0,
      event.cardPayments || 0,
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

    ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].forEach((col) => {
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

      // Format currency columns
      if (["F", "G", "H", "I", "J"].includes(col)) {
        cell.numFmt = "$#,##0.00";
        cell.alignment = {
          vertical: "middle",
          horizontal: "right",
        };
      }

      // Center align specific columns
      if (["B", "C", "D", "E"].includes(col)) {
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
        };
      }
    });
  });

  // Add bottom border to last data row
  const lastDataRow = allEvents.length + 2;
  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].forEach((col) => {
    const cell = worksheet.getCell(`${col}${lastDataRow}`);
    cell.border = {
      ...cell.border,
      bottom: { style: "medium", color: { argb: "FF000000" } },
    };
  });

  // Total row at the bottom
  const totalRowIndex = allEvents.length + 3;
  const totalRow = worksheet.getRow(totalRowIndex);
  totalRow.values = [
    `Total Events: ${allEvents.length}`,
    "",
    "",
    "",
    "",
    reportData.grossRevenue || 0,
    reportData.totalRefunds || 0,
    reportData.netRevenue || 0,
    reportData.paymentBreakdown.wallet || 0,
    reportData.paymentBreakdown.card || 0,
  ];
  totalRow.font = {
    name: "Calibri",
    size: 11,
    bold: true,
    color: { argb: "FF000000" },
  };
  totalRow.alignment = {
    vertical: "middle",
    horizontal: "center",
  };
  totalRow.height = 25;

  ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"].forEach((col) => {
    const cell = worksheet.getCell(`${col}${totalRowIndex}`);
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFE8E8E8" },
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };

    // Format currency columns in total row
    if (["F", "G", "H", "I", "J"].includes(col)) {
      cell.numFmt = "$#,##0.00";
      cell.alignment = {
        vertical: "middle",
        horizontal: "right",
      };
    }
  });

  // Footer (only spans table columns)
  const footerRowIndex = totalRowIndex + 2;
  worksheet.getRow(footerRowIndex - 1).height = 10;

  worksheet.mergeCells(`A${footerRowIndex}:J${footerRowIndex}`);
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
  worksheet.getColumn(1).width = 30; // Event Name
  worksheet.getColumn(2).width = 15; // Type
  worksheet.getColumn(3).width = 12; // Start Date
  worksheet.getColumn(4).width = 12; // End Date
  worksheet.getColumn(5).width = 12; // Transactions
  worksheet.getColumn(6).width = 15; // Gross Revenue
  worksheet.getColumn(7).width = 12; // Refunds
  worksheet.getColumn(8).width = 15; // Net Revenue
  worksheet.getColumn(9).width = 15; // Wallet Payments
  worksheet.getColumn(10).width = 15; // Card Payments

  // Set print options
  worksheet.pageSetup = {
    paperSize: 9, // A4
    orientation: "landscape",
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
  filename = `sales_report_${timestamp}.xlsx`;

  return { buffer, filename, mimeType };
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
        logger.error(
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

// --- RESALE MARKET FEATURES ---

/**
 * List a ticket for resale.
 * Rule: Allowed ONLY if event is <= 14 days away.
 * If > 14 days, user should use standard refund.
 */
export const listTicketForResale = async (eventId, userId) => {
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  // 1. Check Date Rule
  const now = new Date();
  const eventDate = new Date(event.startDate);
  const daysUntilEvent = differenceInDays(eventDate, now);

  if (daysUntilEvent >= 14) {
    throw new ApiError(
      400,
      "The event is more than 14 days away. Please use the standard 'Cancel' button for a full refund."
    );
  }

  if (daysUntilEvent < 0) {
    throw new ApiError(400, "Cannot list tickets for past events.");
  }

  // 2. Verify Ownership
  const isRegistered = event.attendees.some(
    (att) => att.toString() === userId.toString()
  );
  if (!isRegistered)
    throw new ApiError(400, "You do not own a ticket for this event.");

  // 3. Check for Existing Listing
  if (!event.resaleListings) event.resaleListings = [];

  const alreadyListed = event.resaleListings.some(
    (l) =>
      l.sellerId.toString() === userId.toString() && l.status === "available"
  );
  if (alreadyListed)
    throw new ApiError(400, "Your ticket is already listed on the market.");

  // 4. Create Listing
  event.resaleListings.push({
    sellerId: userId,
    originalPrice: event.price,
    status: "available",
  });

  await event.save();
  return { message: "Ticket listed on Resale Market successfully." };
};

/**
 * Get available resale tickets for a specific event
 */
// In your eventService.js

export const getResaleTickets = async (eventId) => {
  const event = await Event.findById(eventId).populate(
    "resaleListings.sellerId",
    "firstName lastName"
  );
  if (!event) throw new ApiError(404, "Event not found");

  if (!event.resaleListings) return [];

  // Filter available tickets
  return event.resaleListings
    .filter((l) => l.status === "available")
    .map((ticket) => {
      const ticketObj = ticket.toObject ? ticket.toObject() : ticket;

      const basePrice = ticketObj.originalPrice || 0;

      return {
        ...ticketObj,
        finalPrice: basePrice * 1.15, // Calculate 15% markup
      };
    });
};
/**
 * GENERAL MARKETPLACE: Get all available tickets across ALL events.
 * This flattens the data so the frontend gets a clean list of tickets.
 */
export const getAllResaleTickets = async () => {
  // 1. Find all events that have at least one available listing
  const events = await Event.find({
    "resaleListings.status": "available",
  })
    .select("name location startDate resaleListings") // Select only needed fields
    .populate("resaleListings.sellerId", "firstName lastName");

  // 2. Flatten the result
  // We want an array of tickets, not an array of events
  let allTickets = [];

  events.forEach((event) => {
    // Filter only the available listings inside this event
    const availableTickets = event.resaleListings.filter(
      (l) => l.status === "available"
    );

    // Map them to a clean format for the frontend card
    const formattedTickets = availableTickets.map((ticket) => ({
      listingId: ticket._id,
      eventId: event._id,
      eventName: event.name,
      eventLocation: event.location,
      eventDate: event.startDate,
      originalPrice: ticket.originalPrice,
      sellerName: ticket.sellerId
        ? `${ticket.sellerId.firstName} ${ticket.sellerId.lastName}`
        : "Unknown Student",
      sellerId: ticket.sellerId?._id,
    }));

    allTickets = [...allTickets, ...formattedTickets];
  });

  return allTickets;
};

export const incrementViewCount = async (eventId) => {
  await Event.findByIdAndUpdate(eventId, { $inc: { viewCount: 1 } });
};

/**
 * Upload an image to an ongoing event by a registered attendee
 * @param {string} eventId - The event ID
 * @param {string} userId - The user ID (from req.user)
 * @param {string} imageUrl - The uploaded image URL
 * @returns {Promise<Object>} - The updated event with new image
 */
export const uploadImageToEvent = async (eventId, userId, imageUrl) => {
  // Find the event
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.deletedAt) {
    throw new ApiError(400, "Cannot upload image to a deleted event");
  }

  // Check if event is ongoing
  const now = new Date();
  const isOngoing = event.startDate <= now && event.endDate >= now;
  if (!isOngoing) {
    throw new ApiError(400, "Can only upload images to ongoing events");
  }

  // Ensure event is approved before allowing uploads
  if (event.status !== "approved") {
    throw new ApiError(403, "Cannot upload images to an unapproved event");
  }

  // Check if user is registered attendee
  const isRegistered = event.attendees.some(
    (attendeeId) => attendeeId.toString() === userId.toString()
  );
  if (!isRegistered) {
    throw new ApiError(403, "Only registered attendees can upload images");
  }

  // Add image to event.images array
  event.images.push({
    url: imageUrl,
    uploadedBy: userId,
    uploadedAt: new Date(),
  });

  await event.save();

  // Return updated event with populated data
  const updatedEvent = await Event.findById(eventId)
    .populate("images.uploadedBy", "firstName lastName email")
    .populate("attendees", "firstName lastName email");

  return updatedEvent;
};

/**
 * Get all uploaded images for a specific event
 * @param {string} eventId - The event ID
 * @returns {Promise<Array>} - Array of images with uploader details
 */
export const getEventImages = async (eventId, user = null) => {
  const event = await Event.findById(eventId)
    .select("images name eventType restrictedRoles status deletedAt archivedAt")
    .populate("images.uploadedBy", "firstName lastName email");

  if (!event) {
    throw new ApiError(404, "Event not found");
  }

  if (event.deletedAt) {
    throw new ApiError(400, "Cannot view images of a deleted event");
  }

  // Only approved events' images are viewable
  if (event.status !== "approved") {
    throw new ApiError(
      403,
      "Event images are not available for unapproved events"
    );
  }

  // If a user is provided, ensure their role is not restricted from this event
  if (user && user.role && Array.isArray(event.restrictedRoles)) {
    if (event.restrictedRoles.includes(user.role)) {
      throw new ApiError(
        403,
        "You are restricted from viewing images of this event"
      );
    }
  }

  return {
    eventId: event._id,
    eventName: event.name,
    eventType: event.eventType,
    images: event.images || [],
    totalImages: event.images?.length || 0,
  };
};
