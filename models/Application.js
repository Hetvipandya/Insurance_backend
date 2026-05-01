const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    // 🔹 User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // 🔹 Car Number
    carNo: {
      type: String,
      required: true,
      trim: true,
    },

    // 🔹 RC Book Images (Required Multiple)
    rcBookImages: {
      type: [String],
      required: true,
      validate: [(val) => val.length > 0, "RC Book images required"],
    },

    // 🔹 Aadhar Card Images (Required Multiple)
    aadharCardImages: {
      type: [String],
      required: true,
      validate: [(val) => val.length > 0, "Aadhar images required"],
    },

    // 🔹 PAN Card (Optional Multiple)
    panCardImages: {
      type: [String],
      default: [],
    },

    // 🔹 Old Policy (Optional Multiple)
    oldPolicyImages: {
      type: [String],
      default: [],
    },

    // 🔹 TP Type
    tp: {
      type: String,
      enum: ["none", "full", "od"],
      required: true,
      default: "none",
    },

    // 🔹 Other Images
    otherImages: {
      type: [String],
      default: [],
    },

    // 🔹 Other Details (textarea)
    otherDetails: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// ✅ Model name also change karo
module.exports = mongoose.model("Application", applicationSchema);