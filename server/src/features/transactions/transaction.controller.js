import { TransactionService } from "./transaction.service.js";

/**
 * Controller for handling transaction-related requests.
 */
export class TransactionController {
  constructor() {
    this.transactionService = new TransactionService();
  }

  /**
   * Handles payment for an event.
   * @param {import("express").Request} req - Express request object
   * @param {import("express").Response} res - Express response object
   * @returns {Promise<void>}
   */
  async payForEvent(req, res) {
    try {
      const { paymentMethod } = req.body;
      const eventId = req.params.eventId;
      const userId = req.user._id;
      const userRole = req.user.role;

      const allowedRoles = ["student", "staff", "ta", "professor"];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Access denied. Only ${allowedRoles.join(
            ", "
          )} can perform this action.`,
        });
      }

      const result = await this.transactionService.payForEvent({
        userId,
        eventId,
        paymentMethod,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Payment error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Confirms a Stripe payment intent and updates transaction status.
   * @param {import("express").Request} req - Express request object
   * @param {import("express").Response} res - Express response object
   * @returns {Promise<void>}
   */
  async confirmStripePayment(req, res) {
    try {
      const { paymentIntentId } = req.body;
      const allowedRoles = ["student", "staff", "ta", "professor"];
      const userRole = req.user.role;
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Access denied. Only ${allowedRoles.join(
            ", "
          )} can perform this action.`,
        });
      }
      const result =
        await this.transactionService.confirmStripePayment(paymentIntentId);
      res.status(200).json(result);
    } catch (error) {
      console.error("Stripe confirmation error:", error);
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Initiates a wallet top-up via Stripe for a user.
   * @param {import("express").Request} req - Express request object
   * @param {import("express").Response} res - Express response object
   * @returns {Promise<void>}
   */
  async topUpWallet(req, res) {
    try {
      const { amount, paymentMethod } = req.body;
      const userId = req.user._id;

      const result = await this.transactionService.topUpWallet({
        userId,
        amount,
        paymentMethod,
      });

      res.status(200).json(result);
    } catch (error) {
      console.error("Wallet top-up error:", error);
      res.status(400).json({ error: error.message });
    }
  }
  /**
   * Get all transactions for the logged-in user
   * @param {import("express").Request} req
   * @param {import("express").Response} res
   */
  async getMyTransactions(req, res) {
    try {
      const userId = req.user._id;
      const userRole = req.user.role;
      const allowedRoles = ["student", "staff", "ta", "professor"];
      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          error: `Access denied. Only ${allowedRoles.join(
            ", "
          )} can perform this action.`,
        });
      }
      const transactions = await this.transactionService.getUserTransactions(
        userId
      );

      res.status(200).json({ transactions });
    } catch (error) {
      console.error("Get transactions error:", error);
      res.status(400).json({ error: error.message });
    }
  }
}
