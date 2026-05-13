const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: { 
      type: String, 
      required: true, 
      trim: true 
    },

    emailId: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true 
    },

    mobileNumber: { 
      type: String, 
      required: true, 
      unique: true 
    },

    address: { 
      type: String, 
      required: true 
    },

    password: { 
      type: String, 
      required: true 
    },

    // 👇 Optional Photo
    photo: { 
      type: String, 
      default: null 
    },

    role: {
      type: String,
      enum: ["dealer", "admin"],
      default: "dealer",
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    isRejected: {
      type: Boolean,
      default: false,
    },

    rejectReason: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);