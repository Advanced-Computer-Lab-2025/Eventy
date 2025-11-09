import { Event } from "./event.model.js"; // adjust path if needed
import ApiError from "../../utils/ApiError.js";
import { User } from "../users/user.model.js";
import Application from "../applications/application.model.js";

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
  };

  // Save to database
  const bazaar = await Event.create(bazaarData);
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

  // Ensure end date is after start date
  if (new Date(tripData.endDate) <= new Date(tripData.startDate)) {
    throw new ApiError(400, "End date must be after start date");
  }

  const newTrip = await Event.create({
    ...tripData,
    eventType: "trip",
    createdBy,
  });

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
    createdBy: userId,
  });

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
  });

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
    const [hours, minutes] = workshop.startTime.split(':').map(Number);
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
  event.fundingSource ?? fundingSource.toLowerCase();
  event.attendees.push(user._id);
  await event.save();

  return { message: "Successfully registered for the event." };
};

export const getEventsByUser = async (userId) => {
  const events = await Event.find({
    attendees: userId,
    status: "approved", // Only fetch approved events
  }).populate("attendees", "name email role");
  return events;
};

export const getUpcomingEventsService = async (includeVendors = false) => {
  const now = new Date();

  const events = await Event.find({
    status: "approved",
    startDate: { $gte: now },
    deletedAt: null,
  })
    .populate("professors", "name email") // now Mongoose knows User schema
    .populate("createdBy", "name email companyName")
    .lean();

  return events;
};

/**
 * Get all upcoming events with their vendors (via applications).
 * @returns {Promise<Array>} Array of event objects with vendors array.
 */
export const getUpcomingEventsWithVendors = async () => {
  const now = new Date();

  // Get all approved upcoming events
  const events = await Event.find({
    status: "approved",
    startDate: { $gte: now },
    deletedAt: null,
  }).lean();

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

  // Soft delete: set deletedAt timestamp
  event.deletedAt = new Date();
  await event.save();
  return true;
}
// 🔍 Search events service
export const searchEvents = async ({ name, type }) => {
  // Build a flexible filter - only search upcoming events like getUpcomingEventsService
  const now = new Date();
  const filter = {
    status: "approved",
    startDate: { $gte: now },
    deletedAt: null,
  };

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

    filter.$or = [
      { name: { $regex: name, $options: "i" } }, // Event name
      { eventType: { $regex: type, $options: "i" } }, // Event type
      { createdBy: { $in: userIds } }, // Created by matching users
      { professors: { $in: userIds } }, // Workshop professors matching
    ];
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

      filter.$or = [
        { name: { $regex: name, $options: "i" } }, // Event name
        { createdBy: { $in: userIds } }, // Created by matching users
        { professors: { $in: userIds } }, // Workshop professors matching
      ];
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
  );
  if (!event) {
    throw new ApiError(404, "Workshop not found");
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
  );
  if (!event) {
    throw new ApiError(404, "Workshop not found");
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

export const getEventById = async (eventId) => {
  const event = await Event.findById(eventId)
    .populate("attendees", "name email role")
    .populate("createdBy", "name email role");
  if (!event) {
    throw new ApiError(404, "Event not found");
  }
  return event;
};
export const getAllTripsService = async () => {
  const trips = await Event.find({ eventType: "trip" })
    .select(
      "name location price startDate endDate description capacity registrationDeadline"
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
  const {
    eventType,
    startDate,
    endDate,
    page = 1,
    limit = 10,
  } = options;

  const match = {};

  if (eventType) match.eventType = eventType;
  if (startDate || endDate) {
    match.startDate = {};
    if (startDate) match.startDate.$gte = new Date(startDate);
    if (endDate) match.startDate.$lte = new Date(endDate);
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
        location: 1,
        attendeesCount: {
          $ifNull: ["$attendeesCount", { $size: { $ifNull: ["$attendees", []] } }]
        }
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
    events: result.events || [],
  };
};

