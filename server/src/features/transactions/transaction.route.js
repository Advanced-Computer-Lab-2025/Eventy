import express from "express";
import { TransactionController } from "./transaction.controller.js";
import authMiddleware from "../../middlewares/auth.middleware.js";
import validate from "../../middlewares/validate.middleware.js";
import {
  payForEventBodySchema,
  payForEventParamsSchema,
  walletTopUpSchema,
  payForApplicationBodySchema,
  payForApplicationParamsSchema,
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
 * @access  Student, Staff, TA, Professor, Vendor
 */
router.post(
  "/confirm",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor", "vendor"]),
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

/**
 * @route   POST /api/transactions/applications/:applicationId/pay
 * @desc    Pay for a vendor application (bazaar or booth)
 * @access  Vendor
 */
router.post(
  "/applications/:applicationId/pay",
  authMiddleware,
  validate(payForApplicationParamsSchema, "params"),
  validate(payForApplicationBodySchema, "body"),
  roleMiddleware(["vendor"]),
  transactionController.payForApplication.bind(transactionController)
);

export default router;
