import mongoose from 'mongoose';

const { Schema } = mongoose;
const eventSchema = new Schema(
  {
    id: { type: String },
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
      default: 'pending'
    },

    attendees: [
      { type: Schema.Types.ObjectId, ref: 'User' } // Students/Staff who registered
    ],

    capacity: { type: Number },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true // professor or events office/admin
    },

    deletedAt: { type: Date, default: null }, // soft delete
  },
  { timestamps: true }
);
// For Trips
eventSchema.add({
  price: { type: Number, required: function () { return this.eventType === 'trip'; } }
});

// For Workshops & Conferences
eventSchema.add({
  agenda: { type: String },
  requiredBudget: { type: Number },
  fundingSource: { type: String, enum: ['external', 'guc'] },
  extraResources: { type: String }
});

// For Workshops only
eventSchema.add({
  faculty: { type: String }, // MET, IET, etc.
  professors: [{ type: Schema.Types.ObjectId, ref: 'User' }]
});

// For Conferences only
eventSchema.add({
  websiteUrl: { type: String }
});
eventSchema.pre('save', function (next) {
  if (this.eventType === 'trip' && this.price == null) {
    return next(new Error('Trips must have a price.'));
  }
  if (this.eventType === 'workshop' && (!this.faculty || this.professors.length === 0)) {
    return next(new Error('Workshops must have faculty and at least one professor.'));
  }
  if (this.eventType === 'conference' && !this.websiteUrl) {
    return next(new Error('Conferences must include a websiteUrl.'));
  }
  next();
});
export const Event = mongoose.model('Event', eventSchema);

