// server/src/features/users/user.validation.js (MODIFIED)

import Joi from "joi";

// Schema for creating Admin/Events Office accounts
export const createManagementAccountSchema = Joi.object({
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("admin", "events_office").required(),
});
