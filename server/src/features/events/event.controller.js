import * as eventService from './event.service.js';
import { createTripSchema } from './event.validation.js';
import ApiResponse from '../../utils/ApiResponse.js';
import ApiError from '../../utils/ApiError.js';

export const createTrip = async (req, res, next) => {
  try {
    // 1️⃣ Validate request body
    const { error } = createTripSchema.validate(req.body);
    if (error) throw new ApiError(400, error.details[0].message);

    // 2️⃣ Call service
    const newTrip = await eventService.createTrip(req.body, req.user.id);

    // 3️⃣ Send success response
    return res.status(201).json(new ApiResponse(201, newTrip, 'Trip created successfully'));
  } catch (err) {
    next(err);
  }
};
