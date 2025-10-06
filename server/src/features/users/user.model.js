import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String,  required: function () {
        return ["student", "staff", "ta", "professor"].includes(this.role);
      }, },
    lastName: { type: String,  required: function () {
        return ["student", "staff", "ta", "professor"].includes(this.role);
      }, },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },


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
     },

    taxCardUrl: { 
     type: String, 
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

    walletBalance: { type: Number, default: 0 },

    representatives: [
      {
        name: String,
        email: String,
        idCardUrl: String,
      },
    ],

   
    deletedAt: { type: Date, default: null },

},
  { timestamps: true }
);

userSchema.methods.comparePassword = async function (password) {
  return bcrypt.compare(password, this.password);
};

export const User = mongoose.model('User', userSchema);
