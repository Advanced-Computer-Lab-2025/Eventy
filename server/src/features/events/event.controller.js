import eventService from './event.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';

const createBazaar = async (req, res, next) => {
  try {
    // Extract the request data and the logged-in user
    const data = req.body;
    const user = req.user;

    // Call the service function to create the bazaar
    const bazaar = await eventService.createBazaar(data, user);

    // Send response
    return res.status(201).json(new ApiResponse(201, bazaar, 'Bazaar created successfully'));
  } catch (err) {
    console.error('Error in createBazaar controller:', err);
    // Pass errors to global error handler
    next(new ApiError(400, err.message));
  }
};

export default {
  createBazaar
};
