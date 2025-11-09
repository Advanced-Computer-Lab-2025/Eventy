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
