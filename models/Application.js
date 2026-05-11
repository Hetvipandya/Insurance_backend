const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    executive: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Executive",
      default: null,
    },

    carNo: {
      type: String,
      required: true,
      trim: true,
    },

    rcBookImages: {
      type: [String],
      required: true,
      validate: [(val) => val.length > 0, "RC Book images required"],
    },

    aadharCardImages: {
      type: [String],
      required: true,
      validate: [(val) => val.length > 0, "Aadhar images required"],
    },

    panCardImages: {
      type: [String],
      default: [],
    },

    oldPolicyImages: {
      type: [String],
      default: [],
    },

    adminPolicyDocument: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    tp: {
      type: String,
      required: true,
      default: "none",
    },

    otherImages: {
      type: [String],
      default: [],
    },

    otherDetails: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Application", applicationSchema);