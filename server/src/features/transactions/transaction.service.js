import Stripe from "stripe";
import { Transaction } from "./transaction.model.js";
import { User } from "../users/user.model.js"; // Import User model
import { Event } from "../events/event.model.js"; // Import your Event model

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export class TransactionService {
  async payForEvent({ userId, eventId, paymentMethod }) {
    // Check if user already paid for this event
    const existingTransaction = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Event",
      "relatedEntity.id": eventId,
      status: "completed",
      type: "payment",
    });
    if (existingTransaction) {
      throw new Error("You have already paid for this event.");
    }

    // Fetch the event and get the price
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    // ✅ Ensure user is registered as an attendee
    if (
      !event.attendees?.some(
        (attendeeId) => attendeeId.toString() === userId.toString()
      )
    ) {
      throw new Error(
        "You must be registered for this event before making a payment."
      );
    }

    const amount = Number(event.price);
    if (isNaN(amount)) throw new Error("Event price is invalid");

    // --- WALLET PAYMENT ---
    if (paymentMethod === "wallet") {
      const user = await User.findById(userId);
      if (!user || user.walletBalance < amount)
        throw new Error("Insufficient wallet balance");

      user.walletBalance -= amount;
      await user.save();

      const transaction = await Transaction.create({
        userId,
        type: "payment",
        amount,
        status: "completed",
        paymentMethod: "wallet",
        description: `Payment for event ${event.name}`,
        relatedEntity: { type: "Event", id: eventId },
      });

      return { message: "Payment successful via wallet", transaction };
    }

    // --- STRIPE PAYMENT ---
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          userId: String(userId),
          eventId: String(eventId),
        },
      });

      const transaction = await Transaction.create({
        userId,
        type: "payment",
        amount,
        status: "pending",
        paymentMethod,
        stripePaymentIntentId: paymentIntent.id,
        description: `Payment for event ${event.name}`,
        relatedEntity: { type: "Event", id: eventId },
      });

      return {
        message: "Stripe payment initiated",
        clientSecret: paymentIntent.client_secret,
        transaction,
      };
    }

    throw new Error("Invalid payment method");
  }

  async confirmStripePayment(paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === "succeeded") {
      // Payment was already confirmed earlier
      const transaction = await Transaction.findOne({
        stripePaymentIntentId: paymentIntentId,
      });
      return { message: "Payment already confirmed", transaction };
    }

    const confirmedIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      {
        payment_method: "pm_card_visa",
      }
    );

    if (confirmedIntent.status !== "succeeded") {
      throw new Error(
        `Payment not completed yet. Status: ${confirmedIntent.status}`
      );
    }

    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!transaction) {
      throw new Error("Transaction not found for this payment intent");
    }

    // Prevent updating if already completed
    if (transaction.status === "completed") {
      return { message: "Transaction already completed", transaction };
    }

    transaction.status = "completed";
    await transaction.save();

    if (transaction.type === "wallet_top_up") {
      await User.findByIdAndUpdate(transaction.userId, {
        $inc: { walletBalance: transaction.amount },
      });
      return { message: "Wallet top-up confirmed successfully", transaction };
    }

    if (transaction.type === "payment") {
      return { message: "Event payment confirmed successfully", transaction };
    }

    return { message: "Payment confirmed", transaction };
  }

  async topUpWallet({ userId, amount, paymentMethod }) {
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          userId: String(userId),
          purpose: "wallet_top_up",
        },
      });

      const transaction = await Transaction.create({
        userId,
        type: "wallet_top_up",
        amount,
        status: "pending",
        paymentMethod,
        stripePaymentIntentId: paymentIntent.id,
        description: "Wallet top-up",
      });

      return {
        message: "Stripe wallet top-up initiated",
        clientSecret: paymentIntent.client_secret,
        transaction,
      };
    }

    throw new Error("Invalid payment method for wallet top-up");
  }
}
