import express from "express";
import { TransactionController } from "./transaction.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  payForEventBodySchema,
  payForEventParamsSchema,
  walletTopUpSchema,
} from "./transaction.validation.js";
import roleMiddleware from "../../middlewares/role.middleware.js";

const router = express.Router();
const transactionController = new TransactionController();

/**
 * @route   POST /api/transactions/pay/:eventId
 * @desc    Pay for a workshop or trip
 * @access  Student, Staff, TA, Professor
 */
router.post(
  "/pay/:eventId",
  authMiddleware,
  validate(payForEventParamsSchema, "params"), // validate eventId in URL
  validate(payForEventBodySchema, "body"), // validate paymentMethod in body
  roleMiddleware(["student", "staff", "ta", "professor"]),
  transactionController.payForEvent.bind(transactionController)
);

/**
 * @route   POST /api/transactions/confirm
 * @desc    Confirm Stripe payment
 * @access  Public (Stripe webhook or frontend)
 */
router.post(
  "/confirm",
  roleMiddleware(["student", "staff", "ta", "professor"]),
  transactionController.confirmStripePayment.bind(transactionController)
);

/**
 * @route   POST /api/transactions/wallet/top-up
 * @desc    Start wallet top-up via Stripe
 * @access  Authenticated users
 */
router.post(
  "/wallet/top-up",
  authMiddleware,
  validate(walletTopUpSchema, "body"),
  roleMiddleware(["student", "staff", "ta", "professor"]),
  transactionController.topUpWallet.bind(transactionController)
);

export default router;
