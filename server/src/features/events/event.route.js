const express = require('express');
const router = express.Router();
const eventController = require('./event.controller');
const authMiddleware = require('../../middlewares/auth.middleware');
const roleMiddleware = require('../../middlewares/role.middleware');

router.post(
    '/bazaars',
    authMiddleware,                   // verifies JWT
    roleMiddleware('EventsOffice'),   // only EventsOffice can access
    eventController.createBazaar      // controller we just made
  );
  
  module.exports = router;