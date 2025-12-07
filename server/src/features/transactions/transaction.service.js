import Stripe from "stripe";
import { Transaction } from "./transaction.model.js";
import { User } from "../users/user.model.js";
import { Event } from "../events/event.model.js";
import Application from "../applications/application.model.js";
import {
  sendPaymentReceipt,
  sendVendorPaymentReceipt,
} from "../auth/email.service.js";
import NotificationService from "../notifications/notification.service.js";

const stripe = new Stripe({ apiKey: process.env.STRIPE_SECRET_KEY });

export class TransactionService {
  get stripe() {
    if (!this._stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error(
          "STRIPE_SECRET_KEY is missing in environment variables"
        );
      }
      this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    }
    return this._stripe;
  }

  // =========================================================================
  //  STANDARD EVENT PAYMENT
  // =========================================================================
  async payForEvent({ userId, eventId, paymentMethod }) {
    const existingPayment = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Event",
      "relatedEntity.id": eventId,
      status: "completed",
      type: "payment",
    });

    if (existingPayment) {
      const refundExists = await Transaction.findOne({
        userId,
        "relatedEntity.type": "Event",
        "relatedEntity.id": eventId,
        status: "completed",
        type: "refund",
      });

      if (!refundExists) {
        throw new Error("You have already paid for this event.");
      }
    }

    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    const amount = Number(event.price);
    if (isNaN(amount)) throw new Error("Event price is invalid");

    // --- WALLET PAYMENT ---
    if (paymentMethod === "wallet") {
      try {
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId, walletBalance: { $gte: amount } },
          { $inc: { walletBalance: -amount } },
          { new: true }
        );

        if (updatedUser) {
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
        } else {
          const user = await User.findById(userId).select("walletBalance");
          if (!user) throw new Error("User not found");
          if (user.walletBalance < amount)
            throw new Error("Insufficient wallet balance");
          throw new Error("Failed to debit wallet due to concurrency.");
        }
      } catch (err) {
        throw new Error(`Wallet payment failed: ${err.message}`);
      }
    }

    // --- STRIPE PAYMENT ---
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100,
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

  // =========================================================================
  //  RESALE MARKET LOGIC
  // =========================================================================

  /**
   * Helper: Performs the database updates to swap the ticket owner and pay the seller.
   * Does NOT handle the Buyer's Transaction record (that is handled by the caller).
   */
  async _executeResaleSwap(event, listing, buyerId, sellerId, price) {
    const SERVICE_FEE_PERCENTAGE = 0.1; // University keeps 10%
    const universityFee = price * SERVICE_FEE_PERCENTAGE;
    const sellerPayout = price - universityFee;

    // 1. Payout Seller (Always credit to Wallet)
    await User.findByIdAndUpdate(sellerId, {
      $inc: { walletBalance: sellerPayout },
    });

    // 2. Swap Attendees in the Event
    await Event.findByIdAndUpdate(event._id, {
      $pull: { attendees: sellerId },
      $addToSet: { attendees: buyerId },
    });

    // 3. Update Listing Status
    await Event.updateOne(
      { _id: event._id, "resaleListings._id": listing._id },
      {
        $set: {
          "resaleListings.$.status": "sold",
          "resaleListings.$.buyerId": buyerId,
          "resaleListings.$.soldAt": new Date(),
        },
      }
    );

    // 4. Record Seller's Income Transaction
    await Transaction.create({
      userId: sellerId,
      type: "resale_income",
      amount: sellerPayout,
      status: "completed",
      paymentMethod: "wallet",
      description: `Sold Ticket: ${event.name} (10% Fee Deducted)`,
      relatedEntity: { type: "Event", id: event._id },
    });
  }

  /**
   * Main function to initiate buying a resale ticket.
   * Works exactly like payForEvent:
   * - Wallet: Instant completion.
   * - Card: Returns Client Secret (Pending).
   */
  async buyResaleTicket({ buyerId, eventId, sellerId, paymentMethod }) {
    // 1. Validate inputs
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    if (!event.resaleListings)
      throw new Error("No resale listings for this event");

    // Find the specific listing
    const listing = event.resaleListings.find(
      (l) =>
        l.sellerId.toString() === sellerId.toString() &&
        l.status === "available"
    );

    if (!listing) throw new Error("This ticket is no longer available.");
    if (buyerId.toString() === sellerId.toString())
      throw new Error("You cannot buy your own ticket.");

    // Validate Seller still holds the seat
    const isSellerHoldingSeat = event.attendees.some(
      (att) => att.toString() === sellerId.toString()
    );
    if (!isSellerHoldingSeat) {
      // Auto-cancel invalid listing
      await Event.updateOne(
        { _id: event._id, "resaleListings._id": listing._id },
        { $set: { "resaleListings.$.status": "cancelled" } }
      );
      throw new Error(
        "Transaction failed: The seller no longer holds a valid seat."
      );
    }

    const price = Number(event.price);

    // --- WALLET PAYMENT (Instant) ---
    if (paymentMethod === "wallet") {
      const buyer = await User.findById(buyerId);
      if (buyer.walletBalance < price) {
        throw new Error("Insufficient wallet balance.");
      }

      // Deduct from Buyer
      buyer.walletBalance -= price;
      await buyer.save();

      // Execute Transfer
      await this._executeResaleSwap(event, listing, buyerId, sellerId, price);

      // Record Buyer Transaction
      const transaction = await Transaction.create({
        userId: buyerId,
        type: "payment",
        amount: price,
        status: "completed",
        paymentMethod: "wallet",
        description: `Bought Resale Ticket: ${event.name}`,
        relatedEntity: { type: "Event", id: event._id },
      });

      return { message: "Resale purchase successful via Wallet", transaction };
    }

    // --- STRIPE PAYMENT (Pending) ---
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      // Create Intent - NO auto-confirm, NO test cards attached. Pure standard flow.
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: price * 100, // cents
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: "never",
        },
        metadata: {
          type: "resale_purchase", // Flag for confirmStripePayment
          buyerId: String(buyerId),
          sellerId: String(sellerId),
          eventId: String(eventId),
        },
      });

      // Create Pending Transaction
      const transaction = await Transaction.create({
        userId: buyerId,
        type: "payment",
        amount: price,
        status: "pending",
        paymentMethod,
        stripePaymentIntentId: paymentIntent.id,
        description: `Pending Resale Purchase for ${event.name}`,
        relatedEntity: { type: "Event", id: eventId },
      });

      return {
        message: "Stripe payment initiated",
        clientSecret: paymentIntent.client_secret,
        transaction,
      };
    }

    throw new Error("Invalid payment method.");
  }

  // =========================================================================
  //  CONFIRMATION LOGIC
  // =========================================================================

  async confirmStripePayment(paymentIntentId) {
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    // 1. Retrieve the pending local transaction
    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!transaction) {
      throw new Error("Transaction not found for this payment intent");
    }

    // 2. Check if payment succeeded
    if (paymentIntent.status === "succeeded") {
      // Prevent double-processing
      if (transaction.status === "completed") {
        return { message: "Payment already confirmed", transaction };
      }

      // =========================================================
      // 🎟️ RESALE MARKET CONFIRMATION PATH
      // =========================================================
      if (
        paymentIntent.metadata &&
        paymentIntent.metadata.type === "resale_purchase"
      ) {
        const { buyerId, sellerId, eventId } = paymentIntent.metadata;
        const event = await Event.findById(eventId);
        if (!event) throw new Error("Event not found during confirmation");

        const listing = event.resaleListings
          ? event.resaleListings.find(
              (l) => l.sellerId.toString() === sellerId.toString()
            )
          : null;

        // 🚨 RACE CONDITION CHECK 🚨
        // Between the time the user started the card payment and now,
        // someone else might have bought the ticket via Wallet.
        if (!listing || listing.status !== "available") {
          console.log(
            `[Resale Race Condition] Ticket unavailable. Refunding ${paymentIntentId}`
          );

          // Refund the card immediately
          await this.stripe.refunds.create({ payment_intent: paymentIntentId });

          transaction.status = "failed";
          transaction.description =
            "Failed: Ticket sold to another user. Auto-refunded.";
          await transaction.save();

          return {
            status: "failed",
            message:
              "Transaction failed. This ticket was just sold to someone else. Your card has been automatically refunded.",
          };
        }

        // Proceed to Finalize Transfer
        await this._executeResaleSwap(
          event,
          listing,
          buyerId,
          sellerId,
          Number(event.price)
        );

        transaction.status = "completed";
        await transaction.save();

        return { message: "Resale successful via Card", transaction };
      }

      // =========================================================
      // STANDARD PAYMENT CONFIRMATION (Event / Application)
      // =========================================================

      // Update transaction status
      transaction.status = "completed";
      await transaction.save();

      // Handle Application-specific logic (Booths/Vendors)
      if (transaction.relatedEntity?.type === "Application") {
        const applicationId = transaction.relatedEntity.id;
        const application =
          await Application.findById(applicationId).populate("createdBy");

        if (application) {
          if (
            application.type === "booth" &&
            application.paymentStatus !== "paid" &&
            !application.event
          ) {
            // Create the Booth Event upon payment
            const vendor = application.createdBy;
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + application.durationWeeks * 7);

            const eventData = {
              name: `${vendor.firstName || vendor.companyName || "Vendor"}'s platform booth`,
              eventType: "platform_booth",
              boothSize: application.boothSize,
              durationWeeks: application.durationWeeks,
              locationPreference: application.locationPreference,
              location: application.locationPreference,
              startDate: startDate,
              endDate: endDate,
              attendees: application.attendees,
              createdBy: vendor._id,
              application: application._id,
              status: "approved",
            };

            const createdEvent = await Event.create(eventData);
            await Application.findByIdAndUpdate(applicationId, {
              paymentStatus: "paid",
              event: createdEvent._id,
            });

            try {
              await NotificationService.notifyNewEvent(
                createdEvent,
                "platform_booth"
              );
            } catch (error) {
              console.error(
                "Error sending platform booth notification:",
                error
              );
            }
          } else {
            await Application.findByIdAndUpdate(applicationId, {
              paymentStatus: "paid",
            });
          }

          // Send Vendor Receipt
          const updatedApplication = await Application.findById(applicationId)
            .populate("event", "name location")
            .populate("createdBy", "companyName");

          let stripeReceiptUrl = null;
          try {
            if (paymentIntent.latest_charge) {
              const charge = await this.stripe.charges.retrieve(
                paymentIntent.latest_charge
              );
              stripeReceiptUrl = charge.receipt_url;
            }
          } catch (e) {}

          const vendor = await User.findById(transaction.userId);
          if (vendor && updatedApplication) {
            sendVendorPaymentReceipt(
              vendor.toObject(),
              transaction,
              updatedApplication.toObject(),
              stripeReceiptUrl
            ).catch(console.error);
          }
        }
        return {
          message: "Application payment confirmed successfully",
          transaction,
        };
      }

      // Handle Standard Event Logic
      if (
        transaction.type === "payment" &&
        transaction.relatedEntity?.type === "Event"
      ) {
        const userDetails = await User.findById(transaction.userId);
        const event = await Event.findById(transaction.relatedEntity.id);
        if (userDetails && event) {
          sendPaymentReceipt(userDetails.toObject(), transaction, event).catch(
            console.error
          );
        }
        return { message: "Event payment confirmed successfully", transaction };
      }

      // Handle Wallet Top Up
      if (transaction.type === "wallet_top_up") {
        const user = await User.findByIdAndUpdate(
          transaction.userId,
          { $inc: { walletBalance: transaction.amount } },
          { new: true }
        );
        if (user) {
          sendPaymentReceipt(user.toObject(), transaction, null).catch(
            console.error
          );
        }
        return { message: "Wallet top-up confirmed successfully", transaction };
      }

      return { message: "Payment confirmed", transaction };
    } else {
      // Payment failed or is still processing
      return {
        message: `Payment status: ${paymentIntent.status}`,
        status: paymentIntent.status,
        transaction,
      };
    }
  }

  // =========================================================================
  //  OTHER METHODS (Unchanged logic, just keeping structure)
  // =========================================================================

  async topUpWallet({ userId, amount, paymentMethod }) {
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amount * 100,
        currency: "usd",
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        metadata: { userId: String(userId), purpose: "wallet_top_up" },
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

  async getUserTransactions(userId) {
    return await Transaction.find({ userId, status: "completed" }).sort({
      createdAt: -1,
    });
  }

  async getAllTransactions() {
    return await Transaction.find({}).sort({ createdAt: -1 });
  }

  calculateApplicationFee(application) {
    const baseFee = 50;
    let fee = baseFee;
    if (application.type === "booth") {
      fee = 25 * (application.durationWeeks || 1);
      const loc = application.locationPreference?.toLowerCase() || "";
      if (loc.includes("entrance") || loc.includes("main")) fee *= 1.5;
      else if (loc.includes("corner") || loc.includes("center")) fee *= 1.3;
    } else if (application.type === "bazaar") {
      fee = application.boothSize === "4x4" ? 100 : 60;
      if (application.event?.location?.toLowerCase().includes("main"))
        fee *= 1.4;
    }
    return Math.round(fee * 100) / 100;
  }

  async payForApplication({ userId, applicationId, paymentMethod }) {
    const existingPayment = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Application",
      "relatedEntity.id": applicationId,
      status: "completed",
      type: "payment",
    });

    if (existingPayment)
      throw new Error("You have already paid for this application.");

    const application = await Application.findById(applicationId)
      .populate("event")
      .populate("createdBy");

    if (!application) throw new Error("Application not found");
    if (application.createdBy._id.toString() !== userId.toString())
      throw new Error("You can only pay for your own applications");
    if (application.status !== "approved")
      throw new Error("Application must be approved");
    if (application.paymentStatus === "paid") throw new Error("Already paid");

    // Check deadlines
    const approvalDate = new Date(application.updatedAt);
    const currentDate = new Date();
    const daysSinceApproval = Math.floor(
      (currentDate - approvalDate) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceApproval > 3) {
      if (application.paymentStatus !== "overdue") {
        await Application.findByIdAndUpdate(applicationId, {
          paymentStatus: "overdue",
        });
      }
      throw new Error("Payment deadline has passed (3 days).");
    }

    const amount = this.calculateApplicationFee(application);

    if (paymentMethod !== "credit_card" && paymentMethod !== "debit_card")
      throw new Error("Invalid payment method");

    const description =
      application.type === "bazaar"
        ? `Payment for bazaar: ${application.event?.name}`
        : `Payment for booth`;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100,
      currency: "usd",
      automatic_payment_methods: { enabled: true, allow_redirects: "never" },
      metadata: {
        userId: String(userId),
        applicationId: String(applicationId),
        purpose: "application_payment",
      },
    });

    const transaction = await Transaction.create({
      userId,
      type: "payment",
      amount,
      status: "pending",
      paymentMethod,
      stripePaymentIntentId: paymentIntent.id,
      description,
      relatedEntity: { type: "Application", id: applicationId },
    });

    return {
      message: "Stripe payment initiated",
      clientSecret: paymentIntent.client_secret,
      transaction,
    };
  }

  async refundUserForEvent(userId, eventId) {
    const transaction = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Event",
      "relatedEntity.id": eventId,
      status: "completed",
      type: "payment",
    });

    if (!transaction) throw new Error("No successful transaction found.");

    const user = await User.findById(userId);
    user.walletBalance += transaction.amount;
    await user.save();

    return await Transaction.create({
      userId,
      type: "refund",
      amount: transaction.amount,
      status: "completed",
      paymentMethod: "wallet",
      description: `Refund for event cancellation (${eventId})`,
      relatedEntity: { type: "Event", id: eventId },
    });
  }
}
