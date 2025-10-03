import mongoose from 'mongoose';

const { Schema } = mongoose;
const eventSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    eventType: {
      type: String,
      required: true,
      enum: ['bazaar', 'trip', 'workshop', 'conference']
    },
    description: { type: String, required: true },
    location: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true },

    status: {
      type: String,
      required: true,
      enum: ['pending', 'approved', 'rejected', 'needs_revision'],  
      default: 'pending'
    },

    attendees: [
      { type: Schema.Types.ObjectId, ref: 'User' } // Students/Staff who registered
    ],

    capacity: { type: Number },

    bannerImage: { type: String }, // URL to the banner image

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true // professor or events office/admin
    },

    deletedAt: { type: Date, default: null }, // soft delete,
    
    price: {
    type: Number,
    required: function () {
      return this.eventType === "trip";
    },
  },
  agenda: {
    type: String,
    required: function () {
      return ["workshop", "conference"].includes(this.eventType);
    },
  },
  requiredBudget: {
    type: Number,
    required: function () {
      return ["workshop", "conference"].includes(this.eventType);
    },
  },
  fundingSource: {
    type: String,
    enum: ["external", "guc"],
    required: function () {
      return ["workshop", "conference"].includes(this.eventType);
    },
  },
  extraResources: { type: String },
  faculty: {
    type: String,
    required: function () {
      return this.eventType === "workshop";
    },
  },
  professors: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function () {
        return this.eventType === "workshop";
      },
    },
  ],
  websiteUrl: {
    type: String,
    required: function () {
      return this.eventType === "conference";
    },
  },
},
  { timestamps: true }
);


export const Event = mongoose.model('Event', eventSchema);

