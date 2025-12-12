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
  // We use a "getter" instead of a constructor.
  // This ensures we only access process.env.STRIPE_SECRET_KEY
  // AFTER the server is fully running and .env is loaded.
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

  async payForEvent({ userId, eventId, paymentMethod }) {
    // Check if user already paid for this event and hasn't been refunded
    const existingPayment = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Event",
      "relatedEntity.id": eventId,
      status: "completed",
      type: "payment",
    });

    if (existingPayment) {
      // Check if there is a completed refund for this payment
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
      // If refund exists, allow payment to proceed
    }

    // Fetch event and ensure user is registered
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    const amount = Number(event.price) || 0;

    // --- FREE EVENT HANDLING (Restored) ---
    if (amount === 0) {
      const transaction = await Transaction.create({
        userId,
        type: "payment",
        amount: 0,
        status: "completed",
        paymentMethod: "wallet",
        description: `Free Registration for event ${event.name}`,
        relatedEntity: { type: "Event", id: eventId },
      });

      // Optional: Send receipt for free events too if desired
      // const user = await User.findById(userId);
      // sendPaymentReceipt(user.toObject(), transaction, event).catch(console.error);

      return { message: "Registration successful", transaction };
    }

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

          // ============================================================
          // FIX APPLIED HERE: Send Email Receipt for Wallet Payment
          // ============================================================
          sendPaymentReceipt(updatedUser.toObject(), transaction, event).catch(
            (err) =>
              console.error("Failed to send wallet payment receipt:", err)
          );

          return { message: "Payment successful via wallet", transaction };
        } else {
          const userExists = await User.exists({ _id: userId });

          if (!userExists) {
            throw new Error("User not found");
          }

          const user = await User.findById(userId).select("walletBalance");
          if (!user) {
            throw new Error("User not found");
          } else if (user.walletBalance < amount) {
            throw new Error("Insufficient wallet balance");
          } else {
            throw new Error(
              "Failed to debit wallet due to a concurrent update — please try again"
            );
          }
        }
      } catch (err) {
        throw new Error(`Wallet payment failed: ${err.message}`);
      }
    }

    // --- STRIPE PAYMENT ---
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      // Accessing 'this.stripe' here triggers the connection safely
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
  //  RESALE MARKET LOGIC (Restored)
  // =========================================================================

  async _executeResaleSwap(event, listing, buyerId, sellerId, refundAmount) {
    if (refundAmount > 0) {
      await Transaction.create({
        userId: sellerId,
        type: "refund",
        amount: refundAmount,
        status: "completed",
        paymentMethod: "wallet",
        description: `Sold Ticket: ${event.name} (Base Value Refunded)`,
        relatedEntity: { type: "Event", id: event._id },
      });

      await User.findByIdAndUpdate(sellerId, {
        $inc: { walletBalance: refundAmount },
      });
    }

    await Event.findByIdAndUpdate(event._id, {
      $pull: { attendees: sellerId },
    });
    await Event.findByIdAndUpdate(event._id, {
      $addToSet: { attendees: buyerId },
    });

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
  }

  async buyResaleTicket({ buyerId, eventId, sellerId, paymentMethod }) {
    const event = await Event.findById(eventId);
    if (!event) throw new Error("Event not found");

    if (!event.resaleListings)
      throw new Error("No resale listings for this event");

    const listing = event.resaleListings.find(
      (l) =>
        l.sellerId.toString() === sellerId.toString() &&
        l.status === "available"
    );

    if (!listing) throw new Error("Ticket unavailable.");
    if (buyerId.toString() === sellerId.toString())
      throw new Error("You cannot buy your own ticket.");

    const isSellerHoldingSeat = event.attendees.some(
      (att) => att.toString() === sellerId.toString()
    );
    if (!isSellerHoldingSeat) {
      await Event.updateOne(
        { _id: event._id, "resaleListings._id": listing._id },
        { $set: { "resaleListings.$.status": "cancelled" } }
      );
      throw new Error(
        "Transaction failed: The seller no longer holds a valid seat."
      );
    }

    const basePrice = Number(event.price) || 0;
    const markupPercentage = 0.15;
    let totalAmountToPay = 0;

    if (basePrice > 0) {
      const markupAmount = basePrice * markupPercentage;
      totalAmountToPay = basePrice + markupAmount;
    }

    // Free Ticket
    if (totalAmountToPay === 0) {
      await this._executeResaleSwap(event, listing, buyerId, sellerId, 0);
      return { message: "Free ticket claimed successfully" };
    }

    // Wallet Payment
    if (paymentMethod === "wallet") {
      const buyer = await User.findById(buyerId);
      if (buyer.walletBalance < totalAmountToPay) {
        throw new Error(
          `Insufficient wallet balance. Required: $${totalAmountToPay}`
        );
      }

      const buyerTransaction = await Transaction.create({
        userId: buyerId,
        type: "payment",
        amount: totalAmountToPay,
        status: "pending",
        paymentMethod: "wallet",
        description: `Bought Resale Ticket: ${event.name}`,
        relatedEntity: { type: "Event", id: event._id },
      });

      try {
        buyer.walletBalance -= totalAmountToPay;
        await buyer.save();

        await this._executeResaleSwap(
          event,
          listing,
          buyerId,
          sellerId,
          basePrice
        );

        buyerTransaction.status = "completed";
        await buyerTransaction.save();

        if (totalAmountToPay > 0) {
          sendPaymentReceipt(buyer.toObject(), buyerTransaction, event).catch(
            console.error
          );
        }

        return {
          message: "Resale purchase successful via Wallet",
          transaction: buyerTransaction,
        };
      } catch (error) {
        console.error("Resale Swap Failed. Rolling back.", error);
        buyer.walletBalance += totalAmountToPay;
        await buyer.save();
        buyerTransaction.status = "failed";
        await buyerTransaction.save();
        throw new Error(`Transaction failed and rolled back: ${error.message}`);
      }
    }

    // Stripe Payment
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(totalAmountToPay * 100),
        currency: "usd",
        automatic_payment_methods: { enabled: true, allow_redirects: "never" },
        metadata: {
          type: "resale_purchase",
          buyerId: String(buyerId),
          sellerId: String(sellerId),
          eventId: String(eventId),
        },
      });

      const transaction = await Transaction.create({
        userId: buyerId,
        type: "payment",
        amount: totalAmountToPay,
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

  async confirmStripePayment(paymentIntentId) {
    // For Stripe Elements, payment is confirmed on the frontend using Stripe.js
    // This endpoint verifies the payment status and updates the transaction
    const paymentIntent =
      await this.stripe.paymentIntents.retrieve(paymentIntentId);

    const transaction = await Transaction.findOne({
      stripePaymentIntentId: paymentIntentId,
    });

    if (!transaction) {
      throw new Error("Transaction not found for this payment intent");
    }

    // If payment already succeeded, update transaction and return
    if (paymentIntent.status === "succeeded") {
      // Prevent updating if already completed
      if (transaction.status === "completed") {
        // Ensure application paymentStatus is set to "paid" if needed
        // and create platform booth event if payment was just confirmed
        if (transaction.relatedEntity?.type === "Application") {
          const applicationId = transaction.relatedEntity.id;
          const application =
            await Application.findById(applicationId).populate("createdBy");

          if (application) {
            // If this is a platform booth application and event doesn't exist yet,
            // create it with start date = payment confirmation date
            if (
              application.type === "booth" &&
              application.paymentStatus !== "paid" &&
              !application.event
            ) {
              const vendor = application.createdBy;
              const eventName = `${
                vendor.firstName || vendor.companyName || "Vendor"
              }'s platform booth`;

              // Start date is when payment is confirmed
              const startDate = new Date();

              // End date is start date plus the duration in weeks
              const endDate = new Date(startDate);
              endDate.setDate(
                endDate.getDate() + application.durationWeeks * 7
              );

              const eventData = {
                name: eventName,
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

              // Update application with event reference and payment status
              await Application.findByIdAndUpdate(applicationId, {
                paymentStatus: "paid",
                event: createdEvent._id,
              });

              // Send notification about new platform booth event
              try {
                await NotificationService.notifyNewEvent(
                  createdEvent,
                  "platform_booth"
                );
              } catch (error) {
                console.error(
                  "Error sending platform booth event notification:",
                  error
                );
              }
            } else {
              // For non-booth applications or booths that already have events, just update payment status
              await Application.findByIdAndUpdate(applicationId, {
                paymentStatus: "paid",
              });
            }
          }
        }
        return { message: "Payment already confirmed", transaction };
      }

      // --- RESALE MARKET CONFIRMATION (Restored) ---
      if (
        paymentIntent.metadata &&
        paymentIntent.metadata.type === "resale_purchase"
      ) {
        const { buyerId, sellerId, eventId } = paymentIntent.metadata;
        const event = await Event.findById(eventId);
        if (!event) throw new Error("Event not found");

        const listing = event.resaleListings?.find(
          (l) =>
            l.sellerId.toString() === sellerId.toString() &&
            l.status === "available"
        );

        if (!listing) {
          await this.stripe.refunds.create({ payment_intent: paymentIntentId });
          transaction.status = "failed";
          transaction.description = "Ticket unavailable. Refunded.";
          await transaction.save();
          return {
            status: "failed",
            message: "Ticket sold to someone else. Refunded.",
          };
        }

        try {
          const refundAmount = Number(event.price) || 0;
          await this._executeResaleSwap(
            event,
            listing,
            buyerId,
            sellerId,
            refundAmount
          );

          transaction.status = "completed";
          await transaction.save();

          if (transaction.amount > 0) {
            const buyerUser = await User.findById(buyerId);
            if (buyerUser) {
              sendPaymentReceipt(
                buyerUser.toObject(),
                transaction,
                event
              ).catch(console.error);
            }
          }

          return { message: "Resale successful via Card", transaction };
        } catch (error) {
          await this.stripe.refunds.create({ payment_intent: paymentIntentId });
          transaction.status = "failed";
          await transaction.save();
          throw new Error("System error. Refunded.");
        }
      }

      transaction.status = "completed";
      await transaction.save();
    } else {
      // Payment not yet succeeded - return current status
      return {
        message: `Payment status: ${paymentIntent.status}`,
        status: paymentIntent.status,
        transaction,
      };
    }

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

    if (transaction.type === "payment") {
      // Check if this is an application payment or event payment
      if (transaction.relatedEntity?.type === "Application") {
        // Update application paymentStatus to "paid"
        const applicationId = transaction.relatedEntity.id;
        const application =
          await Application.findById(applicationId).populate("createdBy");

        if (!application) {
          throw new Error("Application not found");
        }

        // If this is a platform booth application and payment is confirmed,
        // create the event with start date = payment confirmation date
        // and end date = start date + duration
        if (
          application.type === "booth" &&
          application.paymentStatus !== "paid" &&
          !application.event
        ) {
          const vendor = application.createdBy;
          const eventName = `${
            vendor.firstName || vendor.companyName || "Vendor"
          }'s platform booth`;

          // Start date is when payment is confirmed
          const startDate = new Date();

          // End date is start date plus the duration in weeks
          const endDate = new Date(startDate);
          endDate.setDate(endDate.getDate() + application.durationWeeks * 7);

          const eventData = {
            name: eventName,
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

          // Update application with event reference and payment status
          await Application.findByIdAndUpdate(applicationId, {
            paymentStatus: "paid",
            event: createdEvent._id,
          });

          // Send notification about new platform booth event
          try {
            await NotificationService.notifyNewEvent(
              createdEvent,
              "platform_booth"
            );
          } catch (error) {
            console.error(
              "Error sending platform booth event notification:",
              error
            );
          }
        } else {
          // For non-booth applications or booths that already have events, just update payment status
          await Application.findByIdAndUpdate(applicationId, {
            paymentStatus: "paid",
          });
        }

        // Get the updated application for email
        const updatedApplication = await Application.findById(applicationId)
          .populate("event", "name location")
          .populate("createdBy", "companyName");

        // Get Stripe receipt URL from the payment intent
        let stripeReceiptUrl = null;
        try {
          // Get the latest charge from the payment intent
          if (paymentIntent.latest_charge) {
            const charge = await this.stripe.charges.retrieve(
              paymentIntent.latest_charge
            );
            stripeReceiptUrl = charge.receipt_url || null;
          }
        } catch (error) {
          console.error(
            "Error retrieving Stripe receipt URL:",
            error?.message || error
          );
          // Continue without receipt URL - email will still be sent
        }

        // Get vendor details for email
        const vendor = await User.findById(transaction.userId).select(
          "email firstName lastName name companyName role"
        );

        // Send vendor payment receipt email (don't await to avoid blocking the response)
        if (vendor && updatedApplication) {
          sendVendorPaymentReceipt(
            vendor.toObject(),
            transaction,
            updatedApplication.toObject(),
            stripeReceiptUrl
          ).catch(console.error);
        }

        return {
          message: "Application payment confirmed successfully",
          transaction,
        };
      }
      // Send payment receipt for successful payment
      const userDetails = await User.findById(transaction.userId).select(
        "email firstName lastName name role"
      );
      const event = await Event.findById(transaction.relatedEntity.id);
      if (userDetails && event) {
        sendPaymentReceipt(userDetails.toObject(), transaction, event).catch(
          console.error
        );
      }
      return { message: "Event payment confirmed successfully", transaction };
    }

    return { message: "Payment confirmed", transaction };
  }

  async topUpWallet({ userId, amount, paymentMethod }) {
    if (paymentMethod === "credit_card" || paymentMethod === "debit_card") {
      const paymentIntent = await this.stripe.paymentIntents.create({
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

  async getUserTransactions(userId) {
    return await Transaction.find({ userId, status: "completed" }).sort({
      createdAt: -1,
    });
  }

  async getAllTransactions() {
    return await Transaction.find({}).sort({ createdAt: -1 });
  }

  calculateApplicationFee(application) {
    const baseFee = 50; // Base fee in USD
    let fee = baseFee;

    if (application.type === "booth") {
      const weeklyFee = 25;
      fee = weeklyFee * (application.durationWeeks || 1);

      if (application.locationPreference) {
        const location = application.locationPreference.toLowerCase();
        if (location.includes("entrance") || location.includes("main")) {
          fee *= 1.5; // 50% premium
        } else if (location.includes("corner") || location.includes("center")) {
          fee *= 1.3; // 30% premium
        }
      }
    } else if (application.type === "bazaar") {
      if (application.boothSize === "4x4") {
        fee = 100;
      } else {
        fee = 60;
      }

      if (application.event) {
        const eventLocation = application.event.location?.toLowerCase() || "";
        if (eventLocation.includes("main") || eventLocation.includes("hall")) {
          fee *= 1.4;
        }
      }
    }

    return Math.round(fee * 100) / 100;
  }

  async payForApplication({ userId, applicationId, paymentMethod }) {
    // Check if user already paid for this application
    const existingPayment = await Transaction.findOne({
      userId,
      "relatedEntity.type": "Application",
      "relatedEntity.id": applicationId,
      status: "completed",
      type: "payment",
    });

    if (existingPayment) {
      // No refunds for applications, so block re-payment
      throw new Error("You have already paid for this application.");
    }

    const application = await Application.findById(applicationId)
      .populate("event", "name location")
      .populate("createdBy", "companyName");

    if (!application) {
      throw new Error("Application not found");
    }

    const createdById = application.createdBy._id || application.createdBy;
    if (createdById.toString() !== userId.toString()) {
      throw new Error("You can only pay for your own applications");
    }

    if (application.status !== "approved") {
      throw new Error(
        "You can only pay for approved applications. Current status: " +
          application.status
      );
    }

    if (application.paymentStatus === "paid") {
      throw new Error(
        "Payment has already been completed for this application."
      );
    }

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

      throw new Error(
        `Payment deadline has passed. The payment deadline was 3 days after approval. ` +
          `Your application was approved ${daysSinceApproval} day${daysSinceApproval > 1 ? "s" : ""} ago. ` +
          `Please contact the events office to proceed.`
      );
    }

    const amount = this.calculateApplicationFee(application);
    if (isNaN(amount) || amount <= 0) {
      throw new Error("Application fee calculation failed");
    }

    if (paymentMethod !== "credit_card" && paymentMethod !== "debit_card") {
      throw new Error(
        "Invalid payment method. Vendors can only pay using credit card or debit card."
      );
    }

    const description =
      application.type === "bazaar"
        ? `Payment for bazaar participation: ${application.event?.name || "Bazaar"}`
        : `Payment for platform booth: ${application.locationPreference || "Booth"}`;

    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: amount * 100, // cents
      currency: "usd",
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: "never",
      },
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

    if (!transaction) {
      throw new Error("No successful transaction found for this event.");
    }

    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    user.walletBalance += transaction.amount;
    await user.save();

    const refundTransaction = await Transaction.create({
      userId,
      type: "refund",
      amount: transaction.amount,
      status: "completed",
      paymentMethod: "wallet",
      description: `Refund for event cancellation (${eventId})`,
      relatedEntity: { type: "Event", id: eventId },
    });

    return refundTransaction;
  }
}
