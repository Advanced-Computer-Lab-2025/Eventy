import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },


     studentStaffId: {
      type: String,
      unique: true,
      sparse: true,
      required: function () {
        return ["student", "staff", "ta", "professor"].includes(this.role);
      },
    },
    
     companyName: {
      type: String,
      required: function () {
        return this.role === "vendor";
      },
    },
    companyLogoUrl: { 
    type: String, 
    required: function () {
       return this.role === "vendor";
       } 
     },

    taxCardUrl: { 
     type: String, 
      required: function () {
       return this.role === "vendor";
       } 
    },

    role: {
      type: String,
      required: true,
      enum: ["student", "staff", "ta", "professor", "vendor", "admin", "events_office"],
    },

    status: {
      type: String,
      required: true,
      enum: ["pending", "active", "blocked"],
      default: "pending",
    },
    verificationToken: { type: String },

    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Event" }],

    walletBalance: { type: Number, default: 0 },

    representatives: [
      {
        name: String,
        email: String,
        idCardUrl: String,
      },
    ],


    notifications: [{
  message: String,
  type: { type: String, enum: ["warning", "reminder", "info"] },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
    }],

    vendorDetails: {
    attendees: [{
      name: String,
      email: String
     }],
    attendeeIds: [String], 
    loyaltyProgram: {
      discountRate: Number,
      promoCode: String,
      terms: String,
      active: { type: Boolean, default: false },
    }, },

    deletedAt: { type: Date, default: null },

},
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);
