import { Event } from "./event.model.js"; // adjust path if needed
import ApiError from "../../utils/ApiError.js";
import { User } from "../users/user.model.js";

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
    createdBy: user._id,
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
    requiredBudget,
    fundingSource,
    extraResources,
    agenda,
    websiteUrl,
    createdBy: userId,
  });

  return event;
};

// Get events with optional filter (e.g., for bazaar, published, upcoming)
export const getEvents = async (filter = {}) => {
  return Event.find(filter).sort({ startDate: 1 });
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
  const events = await Event.find({ attendees: userId });
  return events;
};

export const getUpcomingEventsService = async () => {
  const now = new Date();

  const events = await Event.find({
    status: "approved",
    startDate: { $gte: now },
  })
    .populate("professors", "name email") // now Mongoose knows User schema
    .populate("createdBy", "name email")
    .lean();

  return events;
};

export async function deleteEvent(eventId, user) {
  // Ensure event exists
  const event = await Event.findById(eventId);
  if (!event) throw new ApiError(404, "Event not found");

  // Check if anyone is registered
  if (event.registeredUsers && event.registeredUsers.length > 0) {
    throw new ApiError(409, "Cannot delete event with registered users.");
  }

  // Proceed with deletion
  await Event.findByIdAndDelete(eventId);
  return true;
}
