import Joi from "joi";

export const payForEventBodySchema = Joi.object({
  paymentMethod: Joi.string()
    .valid("wallet", "credit_card", "debit_card")
    .required(),
});

export const payForEventParamsSchema = Joi.object({
  eventId: Joi.string().required(),
});

export const walletTopUpSchema = Joi.object({
  amount: Joi.number().positive().required(),
  paymentMethod: Joi.string().valid("credit_card", "debit_card").required(),
});

export const payForApplicationBodySchema = Joi.object({
  paymentMethod: Joi.string()
    .valid("credit_card", "debit_card")
    .required()
    .messages({
      "any.only": "Vendors can only pay using credit card or debit card",
    }),
});

export const payForApplicationParamsSchema = Joi.object({
  applicationId: Joi.string().required(),
});
