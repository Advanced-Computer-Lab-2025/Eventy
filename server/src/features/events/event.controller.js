const eventService = require('./event.service');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');

exports.createBazaar = async (req, res, next) => {
    try {
      //Extract the request data and the logged-in user
      const data = req.body;
      const user = req.user;

      const bazaar = await eventService.createBazaar(data, user); //call the service function to create the bazaar

      res.status(201).json(new ApiResponse(201, bazaar, 'Bazaar created successfully'));
    }
      catch (err) {
        // Step 4: Pass errors to global error handler
        next(new ApiError(400, err.message));
      }
};