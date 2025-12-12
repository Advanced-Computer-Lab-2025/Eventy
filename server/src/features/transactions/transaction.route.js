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
 * @route   GET /api/transactions/me
 * @desc    Get all transactions for the logged-in user
 * @access  Student, Staff, TA, Professor
 */
router.get(
  "/me",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  transactionController.getMyTransactions.bind(transactionController)
);

/**
 * @route   GET /api/transactions
 * @desc    Get all transactions (for admin/events office)
 * @access  Admin, Events Office
 */
router.get(
  "/",
  authMiddleware,
  roleMiddleware(["admin", "events_office"]),
  transactionController.getAllTransactions.bind(transactionController)
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

/**
 * @route   GET /api/transactions/stripe-key
 * @desc    Get Stripe publishable key
 * @access  Authenticated users
 */
router.get(
  "/stripe-key",
  authMiddleware,
  transactionController.getStripePublishableKey.bind(transactionController)
);
// ==========================================
// 🎟️ FEATURE 4: RESALE MARKET PURCHASE
// ==========================================

// Buy a ticket from the resale market
router.post(
  "/resale/buy",
  authMiddleware,
  roleMiddleware(["student", "staff", "ta", "professor"]),
  transactionController.buyResaleTicket.bind(transactionController)
);
export default router;
