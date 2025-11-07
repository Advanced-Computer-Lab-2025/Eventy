import { TransactionService } from "./transaction.service.js";

export class TransactionController {
  constructor() {
    this.transactionService = new TransactionService();
  }

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

  async confirmStripePayment(req, res) {
    try {
      const { paymentIntentId } = req.body;
      const result = await this.transactionService.confirmStripePayment(
        paymentIntentId
      );
      res.status(200).json(result);
    } catch (error) {
      console.error("Stripe confirmation error:", error);
      res.status(400).json({ error: error.message });
    }
  }

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
}
