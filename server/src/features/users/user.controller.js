import Joi from "joi";
import { createManagementAccount as createManagementAccountService } from "./user.service.js";


// Validation schema
const createManagementAccountSchema = Joi.object({
  firstName: Joi.string().min(2).required(),
  lastName: Joi.string().min(2).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid("admin", "events_office").required(),
});

// Controller to handle account creation
export const createManagementAccount = async (req, res, next) => {
  try {
    const { value, error } = createManagementAccountSchema.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    const user = await createManagementAccountService(value);

    res.status(201).json({
      message: "Management account created successfully",
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    next(err);
  }
};
