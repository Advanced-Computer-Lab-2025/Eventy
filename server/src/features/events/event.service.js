import { Event } from './event.model.js'; // adjust path if needed
import ApiError from "../../utils/ApiError.js";

export async function createBazaar(data, user) {
  // Check user role
  if (user.role !== 'EventsOffice') {
    throw new Error('Only Events Office can create bazaars');
  }

  // Prepare bazaar data
  const bazaarData = {
    name: data.name,
    description: data.description,
    location: data.location,
    startDate: data.startDate,
    endDate: data.endDate,
    registrationDeadline: data.registrationDeadline,
    eventType: 'bazaar',
    createdBy: user._id,
  };

  // Save to database
  const bazaar = await Event.create(bazaarData);
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
    agenda
  } = data;

  // Validate required fields
  if (!name || !startDate || !endDate || !description)
    throw new ApiError(400, "Missing required fields");

  if (!requiredBudget || !fundingSource)
    throw new ApiError(400, "Conference must include requiredBudget and fundingSource");

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
    status: "pending"
  });

  return workshop;
};

/**
 * Register an authenticated user (Student, Staff, TA, or Professor)
 * to a workshop or trip event.
 */
export const registerUserToEvent = async (user, eventId) => {
  // 1️⃣ Validate allowed roles
  const allowedRoles = ['student', 'staff', 'ta', 'professor'];
  if (!allowedRoles.includes(user.role.toLowerCase())) {
    throw new ApiError(403, 'You are not allowed to register for this event');
  }

  // 2️⃣ Find the event by ID
  const event = await Event.findById(eventId);
  if (!event) {
    throw new ApiError(404, 'Event not found');
  }

  // 3️⃣ Prevent duplicate registrations
  if (event.attendees && event.attendees.includes(user._id)) {
    throw new ApiError(409, 'You are already registered for this event');
  }

  // 4️⃣ Check if event has reached its capacity (if it has a limit)
  if (event.capacity && event.attendees.length >= event.capacity) {
    throw new ApiError(409, 'Event is full');
  }

  // 5️⃣ Register the user
  event.attendees.push(user._id);
  await event.save();

  return { message: 'Successfully registered for the event.' };
};
