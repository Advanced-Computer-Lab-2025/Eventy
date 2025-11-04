import Joi from "joi";

export const getMyApplicationsSchema = Joi.object({
  status: Joi.string().valid("pending", "approved", "rejected").optional(),
});

export const validateBazaarApplication = Joi.object({
  attendees: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        individualID: Joi.string().uri().required(), // URL to uploaded ID card image
      })
    )
    .min(1)
    .max(5)
    .required(),
  boothSize: Joi.string().valid("2x2", "4x4").required(),
});

export const validateBoothApplication = Joi.object({
  attendees: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        email: Joi.string().email().required(),
        individualID: Joi.string().uri().required(), // URL to uploaded ID card image
      })
    )
    .min(1)
    .max(5)
    .required(),
  boothSize: Joi.string().valid("2x2", "4x4").required(),
  durationWeeks: Joi.number().integer().min(1).max(4).required(),
  locationPreference: Joi.string().required(),
});
