import Joi from "joi";

export const createNotificationSchema = Joi.object({
  title: Joi.string().max(255).required(),
  message: Joi.string().max(1000).required(),
  type: Joi.string().max(50).default("info"),
  recipients: Joi.array()
    .items(Joi.string().hex().length(24))
    .min(1)
    .required(),
  link: Joi.string().uri().allow(null, "").default(null),
  deletedAt: Joi.date().allow(null).default(null),
});

export const updateNotificationSchema = Joi.object({
  title: Joi.string().max(255),
  message: Joi.string().max(1000),
  type: Joi.string().max(50),
  recipients: Joi.array().items(Joi.string().hex().length(24)).min(1),
  link: Joi.string().uri().allow(null, ""),
  deletedAt: Joi.date().allow(null),
});
