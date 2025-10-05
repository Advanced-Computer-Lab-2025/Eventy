import { Event } from './event.model.js'; // adjust path if needed

async function createBazaar(data, user) {
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
export default {
  createBazaar,
};
