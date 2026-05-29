const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  { 
    applicationId: {
      type: String,
      unique: true,
    }, 

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

    mobileNo: {
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

      rejectionReason: {
      type: String,
      default: "",
      trim: true,
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

// Generate applicationId before saving (format: DDMMYYYYHHMMSS)
applicationSchema.pre("save", function () {
  if (!this.applicationId) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    this.applicationId = `${day}${month}${year}${hours}${minutes}${seconds}`;
  }

});

module.exports = mongoose.model("Application", applicationSchema);